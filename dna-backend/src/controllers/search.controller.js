// src/controllers/search.controller.js
import db from '../db/connection.js';
import { executeCppMatcher } from '../utils/cpp.executor.js';
import fs from 'fs';
import csvParser from 'csv-parser';

export const nuevaBusqueda = async (req, res) => {
    const { patron, algoritmo } = req.body;
    const archivo = req.file;

    try {
        // 1. Validaciones básicas
        if (!archivo) {
            return res.status(400).json({
                success: false,
                message: 'Archivo CSV requerido',
            });
        }

        if (!patron || !algoritmo) {
            fs.unlinkSync(archivo.path);
            return res.status(400).json({
                success: false,
                message: 'Patrón y algoritmo son requeridos',
            });
        }

        // Validar patrón ADN: solo A, T, C, G
        const patronValido = /^[ATCG]+$/i.test(patron);
        if (!patronValido) {
            fs.unlinkSync(archivo.path);
            return res.status(400).json({
                success: false,
                message: 'El patrón debe contener solo caracteres A, T, C, G',
            });
        }

        // Mapear nombres de algoritmo del frontend a los de C++ (KMP, RK, AC)
        const mapaAlgoritmos = {
            'KMP': 'KMP',
            'Rabin-Karp': 'RK',
            'Aho-Corasick': 'AC',
        };

        if (!Object.keys(mapaAlgoritmos).includes(algoritmo)) {
            fs.unlinkSync(archivo.path);
            return res.status(400).json({
                success: false,
                message: 'Algoritmo no válido',
            });
        }

        const algoritmoCpp = mapaAlgoritmos[algoritmo];

        // 2. Registrar archivo en BD
        const [archivoResult] = await db.query(
            'INSERT INTO ArchivoADN (nombre_archivo, ruta, id_usuario) VALUES (?, ?, ?)',
            [archivo.originalname, archivo.path, req.userId],
        );
        const idArchivo = archivoResult.insertId;

        // 3. Leer, validar y guardar muestras del CSV (Nombre,Secuencia)
        const muestras = await validarYProcesarCSV(archivo.path, idArchivo);

        if (muestras.length === 0) {
            fs.unlinkSync(archivo.path);
            return res.status(400).json({
                success: false,
                message: 'El archivo CSV no contiene datos válidos',
            });
        }

        // 4. Ejecutar módulo C++
        console.log('Ejecutando búsqueda con:', {
            archivo: archivo.path,
            patron: patron.toUpperCase(),
            algoritmo: algoritmoCpp,
        });

        const resultadosCpp = await executeCppMatcher(
            archivo.path,
            patron.toUpperCase(),
            algoritmoCpp,
        );

        if (!resultadosCpp || typeof resultadosCpp !== 'object') {
            throw new Error('El motor C++ no devolvió un JSON válido');
        }

        if (resultadosCpp.success === false) {
            return res.status(500).json({
                success: false,
                message: resultadosCpp.message || 'Error en motor C++',
            });
        }

        const sospechosos = resultadosCpp.suspects || [];

        // 5. Registrar búsqueda en BD (algoritmo “humano”)
        const [busquedaResult] = await db.query(
            'INSERT INTO Busqueda (patron, algoritmo_usado, id_usuario, id_archivo) VALUES (?, ?, ?, ?)',
            [patron.toUpperCase(), algoritmo, req.userId, idArchivo],
        );
        const idBusqueda = busquedaResult.insertId;

        // 6. Guardar resultados por sospechoso
        for (const s of sospechosos) {
            await db.query(
                'INSERT INTO Resultado (id_busqueda, nombre_sospechoso, coincidencia_exacta, similitud) VALUES (?, ?, ?, ?)',
                [idBusqueda, s.name, true, null],
            );
        }

        // 7. Respuesta para el frontend
        res.json({
            success: true,
            message: resultadosCpp.message || 'Búsqueda completada',
            busqueda: {
                id: idBusqueda,
                patron: patron.toUpperCase(),
                algoritmo,
                totalMuestras: muestras.length,
                coincidencias: sospechosos.length,
                resultados: sospechosos.map((s) => ({
                    nombre: s.name,
                    exacta: true,
                    num_coincidencias: s.matches_count,
                    posiciones: s.positions,
                })),
                tiempoMs: resultadosCpp.processing_time_ms,
            },
        });
    } catch (error) {
        console.error('Error en búsqueda:', error);

        if (archivo && fs.existsSync(archivo.path)) {
            fs.unlinkSync(archivo.path);
        }

        res.status(500).json({
            success: false,
            message: 'Error al procesar búsqueda',
            error: error.message,
        });
    }
};

const validarYProcesarCSV = (filePath, idArchivo) => {
    return new Promise((resolve, reject) => {
        const muestras = [];
        const errores = [];

        fs.createReadStream(filePath)
            .pipe(csvParser({ headers: false }))
            .on('data', async (row) => {
                const valores = Object.values(row);

                // Formato esperado: Nombre,Secuencia
                if (valores.length >= 2) {
                    const nombre = String(valores[0] || '').trim();
                    const cadenaADN = String(valores[1] || '').trim().toUpperCase();

                    // Saltar encabezado "Nombre,Secuencia" y filas vacías
                    if (!nombre || nombre.toLowerCase() === 'nombre') {
                        return;
                    }

                    if (/^[ATCG]+$/.test(cadenaADN)) {
                        muestras.push({ nombre, cadenaADN });

                        try {
                            await db.query(
                                'INSERT INTO MuestraADN (nombre_sospechoso, cadena_adn, id_archivo) VALUES (?, ?, ?)',
                                [nombre, cadenaADN, idArchivo],
                            );
                        } catch (error) {
                            console.error('Error al guardar muestra:', error);
                        }
                    } else {
                        errores.push(`Cadena inválida para ${nombre}`);
                    }
                }
            })
            .on('end', () => {
                if (errores.length > 0) {
                    console.warn('Advertencias CSV:', errores);
                }
                resolve(muestras);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};

export const obtenerHistorial = async (req, res) => {
    try {
        const [busquedas] = await db.query(
            `
      SELECT 
        b.id_busqueda,
        b.patron,
        b.algoritmo_usado,
        b.fecha,
        a.nombre_archivo,
        COUNT(r.id_resultado) as total_coincidencias
      FROM Busqueda b
      LEFT JOIN ArchivoADN a ON b.id_archivo = a.id_archivo
      LEFT JOIN Resultado r ON b.id_busqueda = r.id_busqueda
      WHERE b.id_usuario = ?
      GROUP BY b.id_busqueda
      ORDER BY b.fecha DESC
    `,
            [req.userId],
        );

        res.json({
            success: true,
            historial: busquedas,
        });
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial',
        });
    }
};

export const obtenerDetalleBusqueda = async (req, res) => {
    const { id } = req.params;

    try {
        const [busquedas] = await db.query(
            `
      SELECT 
        b.*,
        a.nombre_archivo
      FROM Busqueda b
      LEFT JOIN ArchivoADN a ON b.id_archivo = a.id_archivo
      WHERE b.id_busqueda = ? AND b.id_usuario = ?
    `,
            [id, req.userId],
        );

        if (busquedas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Búsqueda no encontrada',
            });
        }

        const [resultados] = await db.query(
            `
      SELECT * FROM Resultado WHERE id_busqueda = ?
    `,
            [id],
        );

        res.json({
            success: true,
            busqueda: busquedas[0],
            resultados,
        });
    } catch (error) {
        console.error('Error al obtener detalle:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener detalle de búsqueda',
        });
    }
};

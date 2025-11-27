import db from '../db/connection.js';
import { executeCppMatcher } from '../utils/cpp.executor.js';
import fs from 'fs';
import csvParser from 'csv-parser';

export const nuevaBusqueda = async (req, res) => {
    const { patron, algoritmo } = req.body;
    const archivo = req.file;

    try {
        // Validaciones
        if (!archivo) {
            return res.status(400).json({
                success: false,
                message: 'Archivo CSV requerido'
            });
        }

        if (!patron || !algoritmo) {
            return res.status(400).json({
                success: false,
                message: 'Patrón y algoritmo son requeridos'
            });
        }

        // Validar que el patrón solo contenga A, T, C, G
        const patronValido = /^[ATCG]+$/i.test(patron);
        if (!patronValido) {
            fs.unlinkSync(archivo.path); // Eliminar archivo
            return res.status(400).json({
                success: false,
                message: 'El patrón debe contener solo caracteres A, T, C, G'
            });
        }

        // Validar algoritmo
        const algoritmosValidos = ['KMP', 'Rabin-Karp', 'Aho-Corasick'];
        if (!algoritmosValidos.includes(algoritmo)) {
            fs.unlinkSync(archivo.path);
            return res.status(400).json({
                success: false,
                message: 'Algoritmo no válido'
            });
        }

        // Registrar archivo en BD
        const [archivoResult] = await db.query(
            'INSERT INTO ArchivoADN (nombre_archivo, ruta, id_usuario) VALUES (?, ?, ?)',
            [archivo.originalname, archivo.path, req.userId]
        );

        const idArchivo = archivoResult.insertId;

        // Leer y validar CSV
        const muestras = await validarYProcesarCSV(archivo.path, idArchivo);

        if (muestras.length === 0) {
            fs.unlinkSync(archivo.path);
            return res.status(400).json({
                success: false,
                message: 'El archivo CSV no contiene datos válidos'
            });
        }

        // FIX Ejecutar módulo C++
        console.log('Ejecutando búsqueda con:', { archivo: archivo.path, patron, algoritmo });
        const resultadosCpp = await executeCppMatcher(archivo.path, patron.toUpperCase(), algoritmo);

        // Registrar búsqueda
        const [busquedaResult] = await db.query(
            'INSERT INTO Busqueda (patron, algoritmo_usado, id_usuario, id_archivo) VALUES (?, ?, ?, ?)',
            [patron.toUpperCase(), algoritmo, req.userId, idArchivo]
        );

        const idBusqueda = busquedaResult.insertId;

        // Guardar resultados
        for (const resultado of resultadosCpp) {
            await db.query(
                'INSERT INTO Resultado (id_busqueda, nombre_sospechoso, coincidencia_exacta, similitud) VALUES (?, ?, ?, ?)',
                [idBusqueda, resultado.nombre, resultado.exacta, resultado.similitud || null]
            );
        }

        res.json({
            success: true,
            message: 'Búsqueda completada',
            busqueda: {
                id: idBusqueda,
                patron: patron.toUpperCase(),
                algoritmo,
                totalMuestras: muestras.length,
                coincidencias: resultadosCpp.length,
                resultados: resultadosCpp
            }
        });

    } catch (error) {
        console.error('Error en búsqueda:', error);

        // Limpiar archivo en caso de error
        if (archivo && fs.existsSync(archivo.path)) {
            fs.unlinkSync(archivo.path);
        }

        res.status(500).json({
            success: false,
            message: 'Error al procesar búsqueda',
            error: error.message
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

                if (valores.length >= 2) {
                    const nombre = valores[0].trim();
                    const cadenaADN = valores[1].trim().toUpperCase();

                    // Validar cadena ADN
                    if (/^[ATCG]+$/.test(cadenaADN)) {
                        muestras.push({ nombre, cadenaADN });

                        // Guardar en BD
                        try {
                            await db.query(
                                'INSERT INTO MuestraADN (nombre_sospechoso, cadena_adn, id_archivo) VALUES (?, ?, ?)',
                                [nombre, cadenaADN, idArchivo]
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
        const [busquedas] = await db.query(`
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
    `, [req.userId]);

        res.json({
            success: true,
            historial: busquedas
        });

    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial'
        });
    }
};

export const obtenerDetalleBusqueda = async (req, res) => {
    const { id } = req.params;

    try {
        // Obtener información de la búsqueda
        const [busquedas] = await db.query(`
      SELECT 
        b.*,
        a.nombre_archivo
      FROM Busqueda b
      LEFT JOIN ArchivoADN a ON b.id_archivo = a.id_archivo
      WHERE b.id_busqueda = ? AND b.id_usuario = ?
    `, [id, req.userId]);

        if (busquedas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Búsqueda no encontrada'
            });
        }

        // Obtener resultados
        const [resultados] = await db.query(`
      SELECT * FROM Resultado WHERE id_busqueda = ?
    `, [id]);

        res.json({
            success: true,
            busqueda: busquedas[0],
            resultados
        });

    } catch (error) {
        console.error('Error al obtener detalle:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener detalle de búsqueda'
        });
    }
};

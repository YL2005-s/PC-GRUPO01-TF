import multer from "multer";
import fs from "fs";
import pool from "../db/connection.js";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

export const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== "text/csv") {
            return cb(new Error("Solo se permiten archivos CSV (.csv)"));
        }
        cb(null, true);
    },
});

function validarCsv(ruta) {
    const contenido = fs.readFileSync(ruta, "utf8").trim();
    const lineas = contenido.split(/\r?\n/);

    const encabezado = lineas[0].trim();
    if (encabezado.toLowerCase() !== "nombre,secuencia") {
        throw new Error("El archivo CSV no tiene el encabezado correcto (debe ser: Nombre,Secuencia)");
    }

    for (let i = 1; i < lineas.length; i++) {
        const fila = lineas[i].trim();
        if (!fila) continue;

        const [nombre, secuencia] = fila.split(",");
        if (!nombre || !secuencia) {
            throw new Error(`Fila ${i + 1}: formato inválido (falta nombre o secuencia)`);
        }

        if (!/^[ACGT]+$/i.test(secuencia)) {
            throw new Error(`Fila ${i + 1}: la secuencia contiene caracteres no válidos`);
        }
    }
}

export const uploadCsvFile = async (req, res) => {
    try {
        const usuario = req.user;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: "No se ha subido ningún archivo CSV" });
        }

        const nombreArchivo = file.originalname;
        const ruta = file.path;

        try {
            validarCsv(ruta);
        } catch (error) {
            fs.unlinkSync(ruta);
            return res.status(400).json({ error: error.message });
        }

        const [result] = await pool.query(
            "INSERT INTO ArchivoADN (nombre_archivo, ruta, id_usuario) VALUES (?, ?, ?)",
            [nombreArchivo, ruta, usuario.id_usuario]
        );

        res.status(201).json({
            message: "Archivo validado, subido y registrado correctamente",
            id_archivo: result.insertId,
            nombre: nombreArchivo,
            ruta,
        });
    } catch (error) {
        console.error("Error al subir CSV:", error);
        res.status(500).json({ error: "Error interno al procesar el archivo" });
    }
};

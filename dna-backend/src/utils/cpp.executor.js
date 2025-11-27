import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const executeCppMatcher = (csvPath, patron, algoritmo) => {
    return new Promise((resolve, reject) => {
        const executable = process.env.CPP_EXECUTABLE_PATH;
        if (!executable) {
            return reject(new Error('No se encontró CPP_EXECUTABLE_PATH en el .env'));
        }

        // Carpeta para resultados JSON
        const resultsDir = process.env.CPP_RESULTS_DIR;
        if (!resultsDir) throw new Error('No se encontró CPP_RESULTS_DIR en el .env');

        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }

        const outputJsonPath = path.join(resultsDir, 'salida.json');

        console.log('Ejecutando:', executable, [csvPath, patron, algoritmo, outputJsonPath]);

        const cppProcess = spawn(executable, [csvPath, patron, algoritmo, outputJsonPath], {
            windowsHide: true,
        });

        let stderrData = '';

        cppProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
            console.error('Error C++:', data.toString());
        });

        cppProcess.on('close', (code) => {
            if (code !== 0) {
                return reject(
                    new Error(`Proceso C++ terminó con código ${code}: ${stderrData || 'sin mensaje'}`)
                );
            }

            // Leer el JSON generado por el ejecutable
            fs.readFile(outputJsonPath, 'utf8', (err, data) => {
                if (err) {
                    return reject(
                        new Error(`No se pudo leer el archivo de salida JSON: ${err.message}`)
                    );
                }

                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (error) {
                    reject(
                        new Error(
                            `Error al parsear salida JSON: ${error.message}\nContenido: ${data}`
                        )
                    );
                } finally {
                    // Opcional: limpiar archivo generado
                    // fs.unlink(outputJsonPath, () => {});
                }
            });
        });

        cppProcess.on('error', (error) => {
            reject(new Error(`Error al ejecutar C++: ${error.message}`));
        });

        // Timeout de seguridad (5 minutos)
        setTimeout(() => {
            cppProcess.kill();
            reject(new Error('Timeout: El proceso C++ tardó demasiado'));
        }, 300000);
    });
};

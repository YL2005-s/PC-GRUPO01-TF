import { spawn } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const executeCppMatcher = (csvPath, patron, algoritmo) => {
    return new Promise((resolve, reject) => {
        const executable = process.env.CPP_EXECUTABLE_PATH || './cpp/build/dna_engine.exe';

        console.log('Ejecutando:', executable, [csvPath, patron, algoritmo]);

        const cppProcess = spawn(executable, [csvPath, patron, algoritmo]);

        let stdoutData = '';
        let stderrData = '';

        cppProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        cppProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
            console.error('Error C++:', data.toString());
        });

        cppProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Proceso C++ terminó con código ${code}: ${stderrData}`));
                return;
            }

            try {
                const resultados = JSON.parse(stdoutData);
                resolve(resultados);
            } catch (error) {
                reject(new Error(`Error al parsear salida JSON: ${error.message}\nSalida: ${stdoutData}`));
            }
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

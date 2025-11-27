#include "csv_reader.hpp"
#include <fstream>
#include <sstream>
#include <iostream>

bool readCSV(const std::string& filename, SuspectList& out_suspects) {
    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cerr << "ERROR: No se pudo abrir el archivo CSV en la ruta: " << filename << std::endl;
        return false;
    }

    std::string line;
    // Omitir la línea de cabecera (Nombre,Cadena_ADN)
    if (std::getline(file, line)) {
        // Validación básica de la cabecera si es necesario.
    }

    // Leer el resto de las líneas
    while (std::getline(file, line)) {
        std::stringstream ss(line);
        std::string name;
        std::string dna_sequence;
        
        // Asume que las columnas están separadas por coma.
        if (std::getline(ss, name, ',') && std::getline(ss, dna_sequence, ',')) {
            // Los datos se asumen limpios, pero aquí iría la validación de formato (A, C, G, T)
            // y que sean exactamente 2 columnas.
            out_suspects.push_back({name, dna_sequence});
        }
    }

    if (out_suspects.empty()) {
        // Podría ser un archivo vacío o mal formateado (solo cabecera).
        std::cerr << "ADVERTENCIA: No se encontraron registros válidos en el archivo CSV." << std::endl;
    }

    return true;
}

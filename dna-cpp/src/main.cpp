#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <sstream>
#include <chrono>

// Inclusión de los tres algoritmos
#include "kmp.hpp"
#include "rabin_karp.hpp" 
#include "aho_corasick.hpp" 
#include "csv_reader.hpp"

// Estructura para la salida JSON
struct ResultEntry {
    std::string name;
    int matches;
    std::vector<int> positions;
};

void generateJSONOutput(const std::string& outputFilename, bool success, const std::string& message, 
                        const std::string& algorithm_name, const std::vector<ResultEntry>& results, 
                        long long duration_ms) {
    
    std::ofstream outfile(outputFilename);
    if (!outfile.is_open()) {
        std::cerr << "ERROR: No se pudo crear el archivo de salida JSON." << std::endl;
        return;
    }

    outfile << "{\n";
    outfile << "  \"success\": " << (success ? "true" : "false") << ",\n";
    outfile << "  \"message\": \"" << message << "\",\n";
    outfile << "  \"algorithm\": \"" << algorithm_name << "\",\n";
    outfile << "  \"processing_time_ms\": " << duration_ms << ",\n";
    
    // Lista de sospechosos
    outfile << "  \"suspects\": [\n";
    
    bool first_match = true;
    for (const auto& entry : results) {
        
        // Incluir solo los sospechosos con coincidencias
        if (entry.matches > 0) {
            if (!first_match) {
                outfile << ",\n";
            }
            outfile << "    {\n";
            outfile << "      \"name\": \"" << entry.name << "\",\n";
            outfile << "      \"matches_count\": " << entry.matches << ",\n";
            
            // Posiciones de coincidencia (solapamiento)
            outfile << "      \"positions\": [";
            for (size_t j = 0; j < entry.positions.size(); ++j) {
                outfile << entry.positions[j] << (j < entry.positions.size() - 1 ? ", " : "");
            }
            outfile << "]\n";
            
            outfile << "    }";
            first_match = false;
        }
    }
    outfile << "\n  ]\n";
    outfile << "}\n";
}

int main(int argc, char* argv[]) {
    
    // 1. Manejo de Argumentos 
    if (argc != 5) { 
        std::cerr << "Uso: " << argv[0] << " <ruta_csv> <patron_adn> <algoritmo> <ruta_salida_json>" << std::endl;
        generateJSONOutput("dna-cpp/results/error.json", false, "Argumentos incompletos o incorrectos.", "None", {}, 0);
        return 1;
    }
    
    const std::string csv_path = argv[1];
    const std::string pattern = argv[2];
    const std::string algorithm_name = argv[3]; 
    const std::string json_output_path = argv[4];
    
    // 2. Cargar Datos del CSV
    SuspectList suspects;
    if (!readCSV(csv_path, suspects)) {
        generateJSONOutput(json_output_path, false, "Fallo al leer o validar el archivo CSV.", algorithm_name, {}, 0);
        return 1;
    }

    // Validación básica del patrón
    if (pattern.empty()) {
        generateJSONOutput(json_output_path, false, "El patrón de ADN no puede estar vacío.", algorithm_name, {}, 0);
        return 1;
    }
    
    // 3. Ejecución de la Búsqueda y Medición de Rendimiento
    std::vector<ResultEntry> search_results;
    
    auto start_time = std::chrono::high_resolution_clock::now();
    
    // Iterar sobre todos los sospechosos y buscar el patrón
    for (const auto& suspect : suspects) {
        const std::string& name = suspect.first;
        const std::string& dna_chain = suspect.second;
        
        std::vector<int> matches;

        // --- LÓGICA DE SELECCIÓN DEL ALGORITMO ---
        if (algorithm_name == "KMP") {
            matches = KMPSearch(dna_chain, pattern);
        } else if (algorithm_name == "RK") { 
            matches = RabinKarpSearch(dna_chain, pattern);
        } else if (algorithm_name == "AC") { 
            matches = AhoCorasickSearch(dna_chain, pattern);
        } else {
            std::cerr << "ERROR: Algoritmo no reconocido: " << algorithm_name << std::endl;
            generateJSONOutput(json_output_path, false, "Algoritmo no reconocido.", algorithm_name, {}, 0);
            return 1;
        }

        if (!matches.empty()) {
            search_results.push_back({name, (int)matches.size(), matches});
        }
    }

    auto end_time = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
    
    // 4. Generación de Salida JSON y Reporte
    std::string final_message = "Búsqueda exitosa con " + algorithm_name + 
                                ". Se encontraron coincidencias en " + 
                                std::to_string(search_results.size()) + " sospechoso(s).";
    
    generateJSONOutput(json_output_path, true, final_message, algorithm_name, search_results, duration.count());

    std::cout << "SUCCESS: " << search_results.size() << " coincidencias encontradas." << std::endl;
    std::cout << "TIME_MS: " << duration.count() << std::endl;

    return 0; 
}

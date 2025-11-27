#ifndef CSV_READER_HPP
#define CSV_READER_HPP

#include <string>
#include <vector>
#include <utility> 

// Define la estructura para un sospechoso: Nombre y Cadena de ADN
using SuspectData = std::pair<std::string, std::string>;

// Define el tipo para la lista completa de sospechosos
using SuspectList = std::vector<SuspectData>;

// Lee un archivo CSV con formato (Nombre,Cadena_ADN) y devuelve una lista de SuspectData.
// Retorna true en caso de éxito, false en caso de fallo (ej. archivo no encontrado).
bool readCSV(const std::string& filename, SuspectList& out_suspects);

#endif

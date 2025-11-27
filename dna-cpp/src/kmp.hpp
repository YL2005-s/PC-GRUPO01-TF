#ifndef KMP_HPP
#define KMP_HPP

#include <string>
#include <vector>

// Construye la tabla de prefijos más largos que son también sufijos (LPS).
// Esta tabla optimiza los saltos al haber un desajuste.
std::vector<int> computeLPS(const std::string& pattern);

// Realiza la búsqueda de un patrón en un texto usando el algoritmo KMP.
// Devuelve un vector de las posiciones iniciales donde se encuentra el patrón (incluyendo solapamientos).
std::vector<int> KMPSearch(const std::string& text, const std::string& pattern);

#endif // KMP_HPP

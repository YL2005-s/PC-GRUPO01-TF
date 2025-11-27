#include "kmp.hpp"
#include <iostream>

// Función para preprocesar el patrón y construir la tabla LPS 
std::vector<int> computeLPS(const std::string& pattern) {
    int m = pattern.length();
    std::vector<int> lps(m, 0);
    int length = 0; 
    int i = 1;

    while (i < m) {
        if (pattern[i] == pattern[length]) {
            length++;
            lps[i] = length;
            i++;
        } else {
            if (length != 0) {
                length = lps[length - 1];
            } else {
                lps[i] = 0;
                i++;
            }
        }
    }
    return lps;
}

// Función de búsqueda KMP.
// Devuelve las posiciones de las coincidencias, permitiendo solapamientos.
std::vector<int> KMPSearch(const std::string& text, const std::string& pattern) {
    int n = text.length();
    int m = pattern.length();
    if (m == 0 || n == 0 || m > n) {
        return {}; 
    }

    std::vector<int> lps = computeLPS(pattern);
    std::vector<int> matches;

    int i = 0; 
    int j = 0; 

    while (i < n) {
        if (pattern[j] == text[i]) {
            i++;
            j++;
        }

        if (j == m) {
            matches.push_back(i - j); 
            
            j = lps[j - 1]; 
        } else if (i < n && pattern[j] != text[i]) {
            if (j != 0) {
                j = lps[j - 1];
            } else {
                i++;
            }
        }
    }

    return matches;
}

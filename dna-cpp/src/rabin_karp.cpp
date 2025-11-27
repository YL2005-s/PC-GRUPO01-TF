#include "rabin_karp.hpp"
#include <cmath>

const int Q = 1000000007; 
const int D = 4;

// Función de búsqueda Rabin-Karp.
std::vector<int> RabinKarpSearch(const std::string& text, const std::string& pattern) {
    int n = text.length();
    int m = pattern.length();
    if (m == 0 || n == 0 || m > n) {
        return {};
    }
    
    std::vector<int> matches;
    long long pattern_hash = 0; 
    long long text_hash = 0;   
    long long h = 1;        

    // Paso 1: Cálculo inicial de H y H = D^(M-1) mod Q
    for (int i = 0; i < m - 1; i++) {
        h = (h * D) % Q;
    }

    // Paso 2: Cálculo inicial de los hashes del patrón y la primera ventana de texto
    for (int i = 0; i < m; i++) {
        pattern_hash = (D * pattern_hash + pattern[i]) % Q;
        text_hash = (D * text_hash + text[i]) % Q;
    }

    // Paso 3: Deslizamiento de la ventana
    for (int i = 0; i <= n - m; i++) {
        if (pattern_hash == text_hash) {
            bool match = true;
            for (int j = 0; j < m; j++) {
                if (text[i + j] != pattern[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                matches.push_back(i);
            }
        }

        if (i < n - m) {
            text_hash = (D * (text_hash - text[i] * h) + text[i + m]) % Q;

            if (text_hash < 0) {
                text_hash = (text_hash + Q);
            }
        }
    }

    return matches;
}

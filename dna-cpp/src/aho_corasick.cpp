#include "aho_corasick.hpp"
#include <vector>
#include <queue>
#include <map>
#include <iostream>

// --- Estructuras para el Autómata ---

// Definimos el tamaño del alfabeto ADN (A, C, G, T)
const int ALPHABET_SIZE = 4;

// Mapea caracteres ADN a índices (0-3) para usar en vectores/arrays.
int char_to_index(char c) {
    if (c == 'A' || c == 'a') return 0;
    if (c == 'C' || c == 'c') return 1;
    if (c == 'G' || c == 'g') return 2;
    if (c == 'T' || c == 't') return 3;
    return -1; 
}

// Estructura de un nodo del Trie
struct TrieNode {
    std::map<int, int> transitions;
    
    int parent = -1; 
    char parent_char = 0;
    int failure_link = -1; 
    bool is_end_of_pattern = false; 
    
    TrieNode() {
        failure_link = 0;
    }
};

class AhoCorasickAutomaton {
private:
    std::vector<TrieNode> trie;
    std::string pattern_to_search;
    
public:
    AhoCorasickAutomaton(const std::string& pattern) : pattern_to_search(pattern) {
        trie.push_back(TrieNode());
        buildTrie();
        buildFailureLinks();
    }

    // 1. Inserción de patrón en el Trie
    void buildTrie() {
        int current_node_index = 0;
        for (char c : pattern_to_search) {
            int index = char_to_index(c);
            if (index == -1) continue; 

            if (trie[current_node_index].transitions.find(index) == trie[current_node_index].transitions.end()) {
                TrieNode new_node;
                new_node.parent = current_node_index;
                new_node.parent_char = c;
                
                trie[current_node_index].transitions[index] = trie.size();
                trie.push_back(new_node);
                current_node_index = trie.size() - 1;
            } else {
                current_node_index = trie[current_node_index].transitions[index];
            }
        }
        trie[current_node_index].is_end_of_pattern = true;
    }

    // 2. Construcción de Enlaces de Fallo (BFS)
    void buildFailureLinks() {
        std::queue<int> q;
        
        for (const auto& pair : trie[0].transitions) {
            int next_node = pair.second;
            q.push(next_node);
        }

        while (!q.empty()) {
            int r = q.front(); 
            q.pop();

            for (const auto& pair : trie[r].transitions) {
                int index = pair.first;
                int u = pair.second; 
                q.push(u);

                int state = trie[r].failure_link;

                while (trie[state].transitions.find(index) == trie[state].transitions.end() && state != 0) {
                    state = trie[state].failure_link;
                }
                
                if (trie[state].transitions.find(index) != trie[state].transitions.end()) {
                    trie[u].failure_link = trie[state].transitions[index];
                }
            }
        }
    }

    // 3. Búsqueda en el texto (Scanning)
    std::vector<int> search(const std::string& text) {
        std::vector<int> matches;
        int current_state = 0;
        int pattern_len = pattern_to_search.length();

        for (int i = 0; i < text.length(); ++i) {
            char c = text[i];
            int index = char_to_index(c);
            if (index == -1) continue;

            while (trie[current_state].transitions.find(index) == trie[current_state].transitions.end() && current_state != 0) {
                current_state = trie[current_state].failure_link;
            }
            
            if (trie[current_state].transitions.find(index) != trie[current_state].transitions.end()) {
                current_state = trie[current_state].transitions[index];
            }
            
            int check_state = current_state;
            while (check_state != 0) {
                if (trie[check_state].is_end_of_pattern) {
                    matches.push_back(i - pattern_len + 1);
                }
                check_state = trie[check_state].failure_link;
            }
        }
        return matches;
    }
};

std::vector<int> AhoCorasickSearch(const std::string& text, const std::string& pattern) {
    if (pattern.empty()) {
        return {};
    }
    AhoCorasickAutomaton automaton(pattern);
    return automaton.search(text);
}

#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
using namespace std;

vector<int> KMPSearch(const string &text, const string &pattern);

int main(int argc, char* argv[]) {
    if (argc < 3) {
        cout << "Uso: dna_engine <archivo_csv> <patron>\n";
        return 1;
    }

    string archivoCSV = argv[1];
    string pattern = argv[2];

    ifstream file(archivoCSV);
    ofstream output("results/salida.json");

    output << "[\n";
    string line;
    bool first = true;

    while (getline(file, line)) {
        string name, dna;
        stringstream ss(line);
        getline(ss, name, ',');
        getline(ss, dna, ',');

        auto positions = KMPSearch(dna, pattern);

        if (!positions.empty()) {
            if (!first) output << ",\n";
            first = false;

            output << "  {\n";
            output << "    \"name\": \"" << name << "\",\n";
            output << "    \"positions\": [";

            for (size_t i = 0; i < positions.size(); i++) {
                output << positions[i];
                if (i < positions.size() - 1) output << ", ";
            }
            output << "]\n  }";
        }
    }

    output << "\n]";
    cout << "Busqueda completada\n";
    return 0;
}


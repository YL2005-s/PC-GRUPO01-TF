#include <vector>
#include <string>
using namespace std;

//arreglo LPS
vector<int> buildLPS(const string &pattern) {
    int m = pattern.size();
    vector<int> lps(m, 0);
    int len = 0, i = 1;

    while (i < m) {
        if (pattern[i] == pattern[len]) {
            len++;
            lps[i] = len;
            i++;
        } else {
            if (len != 0)
                len = lps[len - 1];
            else {
                lps[i] = 0;
                i++;
            }
        }
    }
    return lps;
}

// Algoritmo KMP
vector<int> KMPSearch(const string &text, const string &pattern) {
    vector<int> results;
    auto lps = buildLPS(pattern);
    int i = 0, j = 0;

    while (i < text.size()) {
        if (pattern[j] == text[i]) {
            i++; j++;
        }
        if (j == pattern.size()) {
            results.push_back(i - j);
            j = lps[j - 1];
        } else if (i < text.size() && pattern[j] != text[i]) {
            if (j != 0) j = lps[j - 1];
            else i++;
        }
    }
    return results;
}


## Compilación del motor C++ (Algoritmos de búsqueda ADN)

Desde la carpeta dna-cpp:

1. Abrir la terminal **MSYS2 MinGW64**

2. Compilar el ejecutable:

g++ src/*.cpp -O2 -std=c++17 -static -s -o dna_engine.exe

Esto generará el archivo:
dna_engine.exe

3. Ejecutar el programa:

./dna_engine.exe <ruta_csv> <patron_adn> <algoritmo> <ruta_salida_json>

### Ejemplos reales:

Usando KMP:
./dna_engine.exe data/archivo.csv ACCTT KMP results/salida.json

Usando Rabin-Karp:
./dna_engine.exe data/archivo.csv ACCTT RK results/salida.json

Usando Aho-Corasick:
./dna_engine.exe data/archivo.csv ACCTT AC results/salida.json

Donde:
- ruta_csv: archivo CSV con las secuencias de ADN
- patron_adn: cadena que se desea buscar
- algoritmo:
  - KMP = Knuth-Morris-Pratt
  - RK = Rabin-Karp
  - AC = Aho-Corasick
- ruta_salida_json: archivo JSON donde se guardan los resultados

import { useState } from 'react';
import api from '../api/axios';
import './Search.css';

export default function Busqueda() {
    const [archivo, setArchivo] = useState(null);
    const [patron, setPatron] = useState('');
    const [algoritmo, setAlgoritmo] = useState('KMP');
    const [resultados, setResultados] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleArchivoChange = (e) => {
        const file = e.target.files[0];
        if (file && !file.name.endsWith('.csv')) {
            setError('Solo se permiten archivos CSV');
            setArchivo(null);
            return;
        }
        setArchivo(file);
        setError('');
    };

    const handlePatronChange = (e) => {
        const value = e.target.value.toUpperCase();
        // Solo permitir A, T, C, G
        const filtered = value.replace(/[^ATCG]/g, '');
        setPatron(filtered);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResultados(null);

        if (!archivo) {
            setError('Debes seleccionar un archivo CSV');
            return;
        }

        if (patron.length < 3) {
            setError('El patrón debe tener al menos 3 caracteres');
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('archivo', archivo);
        formData.append('patron', patron);
        formData.append('algoritmo', algoritmo);

        try {
            const response = await api.post('/busqueda', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResultados(response.data.busqueda);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al procesar la búsqueda');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const limpiarFormulario = () => {
        setArchivo(null);
        setPatron('');
        setResultados(null);
        setError('');
        document.getElementById('archivo-input').value = '';
    };

    return (
        <div className="busqueda-container">
            <div className="busqueda-card">
                <h2>🔬 Nueva Búsqueda de ADN</h2>
                <p className="subtitle">Ingresa los datos para realizar el análisis genético</p>

                <form onSubmit={handleSubmit}>
                    {error && <div className="alert-error">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="archivo-input">
                            📁 Archivo CSV de Sospechosos
                        </label>
                        <input
                            id="archivo-input"
                            type="file"
                            accept=".csv"
                            onChange={handleArchivoChange}
                            disabled={loading}
                        />
                        {archivo && (
                            <p className="file-info">✅ {archivo.name} ({(archivo.size / 1024).toFixed(2)} KB)</p>
                        )}
                        <small>Formato: nombre,cadenaADN (una línea por sospechoso)</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="patron-input">
                            🧬 Patrón de ADN a Buscar
                        </label>
                        <input
                            id="patron-input"
                            type="text"
                            value={patron}
                            onChange={handlePatronChange}
                            placeholder="Ej: ATCGTAGCATGC"
                            disabled={loading}
                            className="patron-input"
                        />
                        <small>Solo caracteres A, T, C, G (mínimo 3)</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="algoritmo-select">
                            ⚙️ Algoritmo de Búsqueda
                        </label>
                        <select
                            id="algoritmo-select"
                            value={algoritmo}
                            onChange={(e) => setAlgoritmo(e.target.value)}
                            disabled={loading}
                        >
                            <option value="KMP">Knuth-Morris-Pratt (KMP)</option>
                            <option value="Rabin-Karp">Rabin-Karp</option>
                            <option value="Aho-Corasick">Aho-Corasick</option>
                            <option value="Boyer-Moore">Boyer-Moore</option>
                            <option value="Fuerza-Bruta">Fuerza Bruta</option>
                        </select>
                    </div>

                    <div className="button-group">
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? '⏳ Procesando...' : '🔍 Iniciar Búsqueda'}
                        </button>
                        {!loading && (
                            <button type="button" onClick={limpiarFormulario} className="btn-secondary">
                                🔄 Limpiar
                            </button>
                        )}
                    </div>
                </form>

                {loading && (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Analizando {archivo?.name}...</p>
                        <p className="loading-detail">Algoritmo: {algoritmo}</p>
                    </div>
                )}

                {resultados && (
                    <div className="resultados-section">
                        <h3>📊 Resultados de la Búsqueda</h3>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-label">Patrón Buscado</span>
                                <span className="stat-value">{resultados.patron}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Algoritmo Usado</span>
                                <span className="stat-value">{resultados.algoritmo}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Total Muestras</span>
                                <span className="stat-value">{resultados.totalMuestras}</span>
                            </div>
                            <div className="stat-card highlight">
                                <span className="stat-label">Coincidencias</span>
                                <span className="stat-value">{resultados.coincidencias}</span>
                            </div>
                        </div>

                        {resultados.resultados.length > 0 ? (
                            <div className="tabla-resultados">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Sospechoso</th>
                                            <th>Tipo</th>
                                            <th>Coincidencias</th>
                                            <th>Posiciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resultados.resultados.map((r, idx) => (
                                            <tr key={idx} className="resultado-row">
                                                <td className="nombre-sospechoso">{r.nombre}</td>
                                                <td>
                                                    <span className={`badge ${r.exacta ? 'exacta' : 'aproximada'}`}>
                                                        {r.exacta ? 'Exacta' : 'Aproximada'}
                                                    </span>
                                                </td>
                                                <td>{r.num_coincidencias || 1}</td>
                                                <td className="posiciones">
                                                    {r.posiciones ? r.posiciones.join(', ') : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="no-results">
                                <p>❌ No se encontraron coincidencias</p>
                                <p className="no-results-detail">
                                    El patrón "{resultados.patron}" no está presente en ninguna de las {resultados.totalMuestras} muestras analizadas.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

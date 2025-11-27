import { useState } from 'react';
import api from '../api/axios';
import {
    FiUpload,
    FiTarget,
    FiSettings,
    FiSearch,
    FiRefreshCw,
    FiAlertCircle,
    FiBarChart2,
} from 'react-icons/fi';
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
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResultados(response.data.busqueda);
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
        const fileInput = document.getElementById('archivo-input');
        if (fileInput) fileInput.value = '';
    };

    return (
        <div className="busqueda-container">
            <div className="busqueda-card">
                <div className="busqueda-header">
                    <div>
                        <h2>
                            <FiSearch />
                            <span>Nueva búsqueda de ADN</span>
                        </h2>
                        <p>
                        Carga un archivo CSV con formato de{'>'}Nombre,Secuencia,
                        ingresa el patrón de ADN y selecciona el algoritmo de coincidencia.
                    </p>
                </div>
                <FiBarChart2 className="busqueda-header-icon" />
            </div>

            <form onSubmit={handleSubmit}>
                {error && (
                    <div className="alert-error">
                        <FiAlertCircle className="alert-icon" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="archivo-input">
                        <FiUpload className="label-icon" />
                        <span>Archivo CSV de sospechosos</span>
                    </label>
                    <input
                        id="archivo-input"
                        type="file"
                        accept=".csv"
                        onChange={handleArchivoChange}
                        disabled={loading}
                    />
                    {archivo && (
                        <p className="file-info">
                            {archivo.name} ({(archivo.size / 1024).toFixed(1)} KB)
                        </p>
                    )}
                    <small>Encabezado recomendado: Nombre,Secuencia</small>
                </div>

                <div className="form-group">
                    <label htmlFor="patron-input">
                        <FiTarget className="label-icon" />
                        <span>Patrón de ADN a buscar</span>
                    </label>
                    <input
                        id="patron-input"
                        type="text"
                        value={patron}
                        onChange={handlePatronChange}
                        placeholder="Ej: ATGCTAGGCTA"
                        disabled={loading}
                        className="patron-input"
                    />
                    <small>Solo caracteres A, T, C, G (mínimo 3)</small>
                </div>

                <div className="form-group">
                    <label htmlFor="algoritmo-select">
                        <FiSettings className="label-icon" />
                        <span>Algoritmo de búsqueda</span>
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
                    </select>
                </div>

                <div className="button-group">
                    <button type="submit" className="btn-primary" disabled={loading}>
                        <FiSearch />
                        <span>{loading ? 'Procesando...' : 'Iniciar búsqueda'}</span>
                    </button>
                    {!loading && (
                        <button
                            type="button"
                            onClick={limpiarFormulario}
                            className="btn-secondary"
                        >
                            <FiRefreshCw />
                            <span>Limpiar</span>
                        </button>
                    )}
                </div>
            </form>

            {loading && (
                <div className="loading-spinner">
                    <div className="spinner" />
                    <p>Analizando archivo...</p>
                    <p className="loading-detail">Algoritmo: {algoritmo}</p>
                </div>
            )}

            {resultados && (
                <div className="resultados-section">
                    <div className="resultados-header">
                        <div className="resultados-title">
                            <FiBarChart2 />
                            <div>
                                <h3>Resultados de la búsqueda</h3>
                                <p>
                                    Se analizaron <strong>{resultados.totalMuestras}</strong> muestras y se
                                    encontraron <strong>{resultados.coincidencias}</strong> sospechosos con
                                    coincidencias.
                                </p>
                            </div>
                         </div>
                        <div className="resultados-chip">
                            Patrón: <code>{'>'}{resultados.patron}</code> · Algoritmo: {resultados.algoritmo}
                        </div>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <span className="stat-label">Patrón buscado</span>
                            <span className="stat-value">{resultados.patron}</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Algoritmo</span>
                            <span className="stat-value">{resultados.algoritmo}</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Total muestras</span>
                            <span className="stat-value">{resultados.totalMuestras}</span>
                        </div>
                        <div className="stat-card highlight">
                            <span className="stat-label">Sospechosos con coincidencias</span>
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
                                                    <span className="badge exacta">Exacta</span>
                                                </td>
                                                <td>{r.num_coincidencias}</td>
                                                <td className="posiciones">
                                                    {r.posiciones && r.posiciones.length > 0
                                                        ? r.posiciones.join(', ')
                                                        : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="no-results compact">
                                <p>No se encontraron coincidencias.</p>
                                <p className="no-results-detail">
                                    El patrón "<code>{'>'}{resultados.patron}</code>" no aparece en las{' '}
                                    {resultados.totalMuestras} muestras analizadas.
                                </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div >
  );
}

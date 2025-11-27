import { useState, useEffect } from 'react';
import api from '../api/axios';
import './History.css';

export default function Historial() {
    const [busquedas, setBusquedas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBusqueda, setSelectedBusqueda] = useState(null);
    const [detalles, setDetalles] = useState(null);

    useEffect(() => {
        cargarHistorial();
    }, []);

    const cargarHistorial = async () => {
        try {
            const response = await api.get('/busqueda/historial');
            setBusquedas(response.data.historial);
        } catch (error) {
            console.error('Error al cargar historial:', error);
        } finally {
            setLoading(false);
        }
    };

    const verDetalle = async (id) => {
        try {
            const response = await api.get(`/busqueda/${id}`);
            setDetalles(response.data);
            setSelectedBusqueda(id);
        } catch (error) {
            console.error('Error al cargar detalle:', error);
        }
    };

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleString('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="historial-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Cargando historial...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="historial-container">
            <div className="historial-card">
                <h2>📋 Historial de Búsquedas</h2>

                {busquedas.length === 0 ? (
                    <div className="no-data">
                        <p>📭 No hay búsquedas registradas</p>
                        <p className="no-data-detail">Realiza tu primera búsqueda de ADN para ver el historial</p>
                    </div>
                ) : (
                    <div className="tabla-historial">
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Patrón</th>
                                    <th>Algoritmo</th>
                                    <th>Archivo</th>
                                    <th>Coincidencias</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {busquedas.map((busqueda) => (
                                    <tr key={busqueda.id_busqueda}>
                                        <td>{formatearFecha(busqueda.fecha)}</td>
                                        <td className="patron-cell">{busqueda.patron}</td>
                                        <td>{busqueda.algoritmo_usado}</td>
                                        <td className="archivo-cell">{busqueda.nombre_archivo}</td>
                                        <td>
                                            <span className="badge-count">{busqueda.total_coincidencias}</span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => verDetalle(busqueda.id_busqueda)}
                                                className="btn-detalle"
                                            >
                                                👁️ Ver
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {detalles && (
                    <div className="modal-overlay" onClick={() => setDetalles(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close" onClick={() => setDetalles(null)}>✕</button>

                            <h3>Detalle de Búsqueda #{detalles.busqueda.id_busqueda}</h3>

                            <div className="detalle-info">
                                <div className="info-item">
                                    <strong>Fecha:</strong> {formatearFecha(detalles.busqueda.fecha)}
                                </div>
                                <div className="info-item">
                                    <strong>Patrón:</strong> <code>{detalles.busqueda.patron}</code>
                            </div>
                            <div className="info-item">
                                <strong>Algoritmo:</strong> {detalles.busqueda.algoritmo_usado}
                            </div>
                            <div className="info-item">
                                <strong>Archivo:</strong> {detalles.busqueda.nombre_archivo}
                            </div>
                        </div>

                        <h4>Resultados ({detalles.resultados.length})</h4>

                        {detalles.resultados.length > 0 ? (
                            <div className="detalle-resultados">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Sospechoso</th>
                                            <th>Tipo</th>
                                            <th>Similitud</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detalles.resultados.map((resultado) => (
                                            <tr key={resultado.id_resultado}>
                                                <td>{resultado.nombre_sospechoso}</td>
                                                <td>
                                                    <span className={`badge ${resultado.coincidencia_exacta ? 'exacta' : 'aproximada'}`}>
                                                        {resultado.coincidencia_exacta ? 'Exacta' : 'Aproximada'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {resultado.similitud ? `${resultado.similitud}%` : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="no-results-modal">No se encontraron coincidencias</p>
                        )}
                    </div>
            </div>
        )}
        </div>
    </div >
  );
}

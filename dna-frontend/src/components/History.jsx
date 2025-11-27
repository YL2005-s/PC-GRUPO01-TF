import { useState, useEffect } from 'react';
import api from '../api/axios';
import { FiClock, FiSearch, FiEye, FiDatabase } from 'react-icons/fi';
import './History.css';

export default function Historial() {
  const [busquedas, setBusquedas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalles, setDetalles] = useState(null);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      const response = await api.get('/busqueda/historial');
      setBusquedas(response.data.historial || []);
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
    } catch (error) {
      console.error('Error al cargar detalle:', error);
    }
  };

  const cerrarDetalle = () => setDetalles(null);

  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="historial-container">
        <div className="loading-spinner">
          <div className="spinner" />
          <p>Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="historial-container">
      <div className="historial-card">
        <div className="historial-header">
          <div>
            <h2>
              <FiClock />
              <span>Historial de búsquedas</span>
            </h2>
            <p>Consulta las ejecuciones previas del motor de coincidencia.</p>
          </div>
          <FiDatabase className="historial-header-icon" />
        </div>

        {busquedas.length === 0 ? (
          <div className="no-data">
            <p>No hay búsquedas registradas</p>
            <p className="no-data-detail">
              Realiza una nueva búsqueda de ADN para ver el historial aquí.
            </p>
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
                {busquedas.map((b) => (
                  <tr key={b.id_busqueda}>
                    <td>{formatearFecha(b.fecha)}</td>
                    <td className="patron-cell">{b.patron}</td>
                    <td>{b.algoritmo_usado}</td>
                    <td className="archivo-cell">{b.nombre_archivo}</td>
                    <td>
                      <span className="badge-count">{b.total_coincidencias}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => verDetalle(b.id_busqueda)}
                        className="btn-detalle"
                      >
                        <FiEye />
                        <span>Ver</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {detalles && (
          <div className="modal-overlay" onClick={cerrarDetalle}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={cerrarDetalle}>
                ×
              </button>

              <h3>
                <FiSearch />
                <span>
                  Búsqueda #{detalles.busqueda.id_busqueda}
                </span>
              </h3>

              <div className="detalle-info">
                <div className="info-item">
                  <strong>Fecha:</strong> {formatearFecha(detalles.busqueda.fecha)}
                </div>
                    <div className="info-item">
                        <strong>Patrón:</strong>{' '}
                        <code>{'>'}{detalles.busqueda.patron}</code>
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
                      {detalles.resultados.map((r) => (
                        <tr key={r.id_resultado}>
                          <td>{r.nombre_sospechoso}</td>
                          <td>
                            <span
                              className={
                                'badge ' +
                                (r.coincidencia_exacta ? 'exacta' : 'aproximada')
                              }
                            >
                              {r.coincidencia_exacta ? 'Exacta' : 'Aproximada'}
                            </span>
                          </td>
                          <td>{r.similitud ? `${r.similitud}%` : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-results-modal">
                  No se registraron coincidencias para esta búsqueda.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

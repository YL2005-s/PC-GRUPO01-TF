import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
    const [formData, setFormData] = useState({ correo: '', contrasena: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(formData.correo, formData.contrasena);

        setLoading(false);

        if (result.success) {
            navigate('/busqueda');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Sistema Forense ADN</h1>
                    <p>Análisis de patrones genéticos</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <h2>Iniciar Sesión</h2>

                    {error && <div className="alert-error">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="correo">Correo Electrónico</label>
                        <input
                            id="correo"
                            type="email"
                            value={formData.correo}
                            onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                            placeholder="usuario@ejemplo.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="contrasena">Contraseña</label>
                        <input
                            id="contrasena"
                            type="password"
                            value={formData.contrasena}
                            onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>

                    <p className="register-link">
                        ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

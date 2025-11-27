import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiLogIn, FiUserPlus } from 'react-icons/fi';
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
        if (result.success) navigate('/busqueda');
        else setError(result.message);
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Sistema Forense ADN</h1>
                    <p>Análisis de patrones genéticos</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <h2>
                        <FiLogIn className="login-title-icon" />
                        <span>Iniciar sesión</span>
                    </h2>

                    {error && <div className="alert-error">{error}</div>}

                    <div className="form-group">
                        <label>Correo electrónico</label>
                        <div className="input-icon-wrapper">
                            <FiMail className="input-icon" />
                            <input
                                type="email"
                                value={formData.correo}
                                onChange={(e) =>
                                    setFormData({ ...formData, correo: e.target.value })
                                }
                                required
                                disabled={loading}
                                placeholder="usuario@ejemplo.com"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>
                        <div className="input-icon-wrapper">
                            <FiLock className="input-icon" />
                            <input
                                type="password"
                                value={formData.contrasena}
                                onChange={(e) =>
                                    setFormData({ ...formData, contrasena: e.target.value })
                                }
                                required
                                disabled={loading}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        <FiLogIn />
                        <span>{loading ? 'Ingresando...' : 'Ingresar'}</span>
                    </button>

                    <p className="register-link">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register">
                            <FiUserPlus className="inline-icon" /> Regístrate aquí
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

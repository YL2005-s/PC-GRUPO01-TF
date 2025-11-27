import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const [formData, setFormData] = useState({
        nombre: '',
        correo: '',
        contrasena: '',
        confirmarContrasena: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.contrasena !== formData.confirmarContrasena) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (formData.contrasena.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        const result = await register(formData.nombre, formData.correo, formData.contrasena);

        setLoading(false);

        if (result.success) {
            alert('Registro exitoso. Por favor inicia sesión.');
            navigate('/login');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>🧬 Sistema Forense ADN</h1>
                    <p>Crear nueva cuenta</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <h2>Registro</h2>

                    {error && <div className="alert-error">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="nombre">Nombre Completo</label>
                        <input
                            id="nombre"
                            type="text"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            placeholder="Juan Pérez"
                            required
                            disabled={loading}
                        />
                    </div>

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
                            minLength="6"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmar">Confirmar Contraseña</label>
                        <input
                            id="confirmar"
                            type="password"
                            value={formData.confirmarContrasena}
                            onChange={(e) => setFormData({ ...formData, confirmarContrasena: e.target.value })}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </button>

                    <p className="register-link">
                        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

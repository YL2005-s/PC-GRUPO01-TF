import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="nav-container">
                <Link to="/busqueda" className="nav-logo">
                    🧬 Forense ADN
                </Link>

                {user && (
                    <div className="nav-menu">
                        <Link to="/busqueda" className="nav-link">
                            🔬 Nueva Búsqueda
                        </Link>
                        <Link to="/historial" className="nav-link">
                            📋 Historial
                        </Link>
                        <div className="nav-user">
                            <span className="user-name">👤 {user.nombre}</span>
                            <button onClick={handleLogout} className="btn-logout">
                                🚪 Salir
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiActivity, FiSearch, FiList, FiLogOut } from 'react-icons/fi';
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
          <FiActivity className="nav-logo-icon" />
          <span>Sistema Forense ADN</span>
        </Link>

        {user && (
          <div className="nav-menu">
            <Link to="/busqueda" className="nav-link">
              <FiSearch />
              <span>Nueva búsqueda</span>
            </Link>
            <Link to="/historial" className="nav-link">
              <FiList />
              <span>Historial</span>
            </Link>
            <div className="nav-user">
              <span className="user-name">{user.nombre}</span>
              <button onClick={handleLogout} className="btn-logout">
                <FiLogOut />
                <span>Salir</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameMode } from '../context/GameModeContext';
import '../styles/navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { mode, setMode } = useGameMode();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">EFT Manager</div>

      <div className="navbar-links">
        <NavLink
          to="/hideout"
          className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
        >
          Hideout
        </NavLink>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
        >
          Perfil
        </NavLink>
      </div>

      <div className="navbar-right">
        <div className="mode-switch">
          <button
            className={`mode-btn ${mode === 'pvp' ? 'selected' : ''}`}
            onClick={() => setMode('pvp')}
          >
            PVP
          </button>
          <button
            className={`mode-btn ${mode === 'pve' ? 'selected' : ''}`}
            onClick={() => setMode('pve')}
          >
            PVE
          </button>
        </div>

        <span className="navbar-username">{user?.username}</span>
        <button onClick={handleLogout} className="navbar-logout">Salir</button>
      </div>
    </nav>
  );
}
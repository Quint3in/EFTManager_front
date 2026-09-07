import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameMode } from '../context/GameModeContext';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSelector from './LanguageSelector';
import '../styles/navbar.css';

function SkullIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
      <path d="M8 1.5c-3 0-5 2.2-5 5 0 2 1 3.2 1.8 4v2.3c0 .4.3.7.7.7h1v-1.5h1v1.5h1v-1.5h1v1.5h1c.4 0 .7-.3.7-.7v-2.3c.8-.8 1.8-2 1.8-4 0-2.8-2-5-5-5z" />
      <circle cx="5.8" cy="6.3" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="10.2" cy="6.3" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M8 1.2l5.2 2v4c0 3.6-2.2 6-5.2 7.1-3-1.1-5.2-3.5-5.2-7.1v-4l5.2-2z" />
      <path d="M8 3.4v10" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <path d="M8 1.4l1.9 4.2 4.5.5-3.4 3.1.9 4.5L8 11.5l-3.9 2.2.9-4.5-3.4-3.1 4.5-.5L8 1.4z" />
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { mode, setMode } = useGameMode();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">EFT Manager</div>

      <div className="nav-tabs">
        <div className="nav-tabs-box">
          <NavLink to="/hideout" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
            {t('navHideout')}
          </NavLink>
          <NavLink to="/items" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
            {t('navItems')}
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}>
            {t('tasksTitle')}
          </NavLink>
        </div>
      </div>

      <div className="navbar-right">
        <div className="game-mode-switch">
          <div className={`game-mode-wrap ${mode === 'pvp' ? 'selected' : ''}`}>
            <button className="game-mode-btn" onClick={() => setMode('pvp')}>
              <SkullIcon /> PVP
            </button>
          </div>
          <div className={`game-mode-wrap ${mode === 'pve' ? 'selected' : ''}`}>
            <button className="game-mode-btn" onClick={() => setMode('pve')}>
              <ShieldIcon /> PVE
            </button>
          </div>
          <div className={`game-mode-wrap ${mode === 'season' ? 'selected' : ''}`}>
            <button className="game-mode-btn" onClick={() => setMode('season')}>
              <StarIcon /> SEASON
            </button>
          </div>
        </div>

        <LanguageSelector />

        <div className="user-menu" ref={menuRef}>
          <button className="user-menu-trigger" onClick={() => setMenuOpen((o) => !o)}>
            <span className="navbar-username">{user?.username}</span>
            <span className={`user-menu-arrow ${menuOpen ? 'open' : ''}`}>▾</span>
          </button>

          {menuOpen && (
            <div className="user-menu-dropdown">
              {user?.role === 'ADMIN' && (
                <NavLink to="/admin" className="user-menu-item" onClick={() => setMenuOpen(false)}>
                  {t('adminPanel')}
                </NavLink>
              )}
              <NavLink to="/dashboard" className="user-menu-item" onClick={() => setMenuOpen(false)}>
                {t('myProfile')}
              </NavLink>
              <button className="user-menu-item danger" onClick={handleLogout}>
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import axiosClient from '../api/axiosClient';
import '../styles/dashboard.css';
import { useLanguage } from '../context/LanguageContext';

export default function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguage();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [hideoutSummary, setHideoutSummary] = useState([]);
  const [topFavorites, setTopFavorites] = useState([]);
  const [tasksSummary, setTasksSummary] = useState([]);
  

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    loadDashboardWidgets();
  }, [language]);

  async function fetchProfile() {
    try {
      const { data } = await axiosClient.get('/user/me');
      setProfile(data);
    } catch (err) {
      setLoadError('No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboardWidgets() {
  try {
    const [hideoutRes, favRes, tasksRes] = await Promise.all([
      axiosClient.get('/dashboard/hideout-summary'),
      axiosClient.get('/dashboard/top-favorites', { params: { lang: language } }),
      axiosClient.get('/dashboard/tasks-summary'),
    ]);
    setHideoutSummary(hideoutRes.data);
    setTopFavorites(favRes.data);
    setTasksSummary(tasksRes.data);
  } catch {
    setHideoutSummary([]);
    setTopFavorites([]);
  }
}

  function handleLogout() {
    logout();
    navigate('/login');
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden');
      return;
    }

    setSavingPassword(true);
    try {
      await axiosClient.put('/user/me/password', { currentPassword, newPassword });
      setPasswordSuccess('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'No se pudo cambiar la contraseña');
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return <p className="dashboard-loading">{t('loadingProfile')}</p>;
  }

  if (loadError) {
    return (
      <div className="dashboard-page">
        <p className="dashboard-loading">{loadError}</p>
        <button onClick={handleLogout} className="logout-btn">{t('backToLogin')}</button>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h2>{t('profileTitle')}</h2>
        <button onClick={handleLogout} className="logout-btn">{t('logout')}</button>
      </div>

      <div className="dashboard-widgets">
        <section className="widget-section">
          <h3>{t('hideoutProgressTitle')}</h3>
          <div className="widget-modes-grid">
            {hideoutSummary.map((s) => {
              const pct = s.totalStations > 0 ? Math.round((s.maxedStations / s.totalStations) * 100) : 0;
              return (
                <div key={s.mode} className="widget-mode-card">
                  <p className="widget-mode-label">{s.mode.toUpperCase()}</p>
                  <div className="widget-progress-track">
                    <div className="widget-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="widget-progress-text">{s.maxedStations}/{s.totalStations} ({pct}%)</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="widget-section">
          <h3>{t('topFavoritesTitle')}</h3>
          <div className="widget-modes-grid">
            {topFavorites.map((mf) => (
              <div key={mf.mode} className="widget-mode-card">
                <p className="widget-mode-label">{mf.mode.toUpperCase()}</p>
                {mf.items.length === 0 ? (
                  <p className="summary-empty">{t('noFavoritesYet')}</p>
                ) : (
                  <ul className="widget-fav-list">
                    {mf.items.map((item) => (
                      <li key={item.id}>
                        {item.iconLink && <img src={item.iconLink} alt="" className="widget-fav-icon" />}
                        <span className="widget-fav-name">{item.name}</span>
                        <span className="widget-fav-price">
                          ₽{(item.avg24hPrice > 0 ? item.avg24hPrice : item.basePrice).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="widget-section">
          <h3>{t('tasksProgressTitle')}</h3>
          <div className="widget-modes-grid">
            {tasksSummary.map((s) => {
              const pct = s.totalTasks > 0 ? Math.round((s.completedTasks / s.totalTasks) * 100) : 0;
              return (
                <div key={s.mode} className="widget-mode-card">
                  <p className="widget-mode-label">{s.mode.toUpperCase()}</p>
                  <div className="widget-progress-track">
                    <div className="widget-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="widget-progress-text">{s.completedTasks}/{s.totalTasks} ({pct}%)</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="profile-columns">
        <div className="dashboard-card">
          <p className="dashboard-label">{t('operator')}</p>
          <p className="dashboard-value">{profile.username}</p>
          <p className="dashboard-label">{t('emailLabel')}</p>
          <p className="dashboard-value">{profile.email}</p>
          <p className="dashboard-label">{t('roleLabel')}</p>
          <p className="dashboard-value">{profile.role}</p>
          <p className="dashboard-label">{t('memberSince')}</p>
          <p className="dashboard-value">{new Date(profile.createdAt).toLocaleDateString()}</p>
        </div>

        <form className="password-card" onSubmit={handleChangePassword}>
          <h3>{t('changePassword')}</h3>

          {passwordError && <div className="hideout-error">{passwordError}</div>}
          {passwordSuccess && <div className="password-success">{passwordSuccess}</div>}

          <div className="form-group">
            <label>{t('currentPassword')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>{t('newPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="form-group">
            <label>{t('confirmNewPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="auth-submit" disabled={savingPassword}>
            {savingPassword ? '...' : t('updatePassword')}
          </button>
        </form>
      </div>
    </div>
  );
}
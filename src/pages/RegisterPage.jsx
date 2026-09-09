import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/auth.css';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setError(Object.values(data.errors).join(' | '));
      } else {
        setError(data?.message || t('registerError'));
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{t('registerTitle')}</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="register-username">{t('usernameLabel')}</label>
            <input
              id="register-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="register-email">{t('emailLabel')}</label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="register-password">{t('passwordLabel')}</label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="auth-submit">{t('registerSubmit')}</button>
        </form>
        <p className="auth-switch">
          {t('hasAccount')} <Link to="/login">{t('loginLink')}</Link>
        </p>
      </div>
    </div>
  );
}
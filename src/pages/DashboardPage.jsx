import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import '../styles/dashboard.css';

export default function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axiosClient.get('/user/me');
        setProfile(data);
      } catch (err) {
        setError('No se pudo cargar el perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <p className="dashboard-loading">Cargando datos del operador...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <p className="dashboard-loading">{error}</p>
        <button onClick={handleLogout} className="logout-btn">Volver a iniciar sesión</button>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h2>Hideout</h2>
        <button onClick={handleLogout} className="logout-btn">Salir</button>
      </div>
      <div className="dashboard-card">
        <p className="dashboard-label">Operador</p>
        <p className="dashboard-value">{profile.username}</p>

        <p className="dashboard-label">Email</p>
        <p className="dashboard-value">{profile.email}</p>

        <p className="dashboard-label">Rango</p>
        <p className="dashboard-value">{profile.role}</p>

        <p className="dashboard-label">ID</p>
        <p className="dashboard-value">{profile.id}</p>
      </div>
    </div>
  );
}
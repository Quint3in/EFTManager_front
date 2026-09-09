import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/admin.css';
import ConfirmDialog from '../components/ConfirmDialog';

export default function AdminPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const { data } = await axiosClient.get('/admin/users');
      setUsers(data);
    } catch (err) {
      setError(t('adminUserListError'));
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter((u) => u.username.toLowerCase().includes(q));
  }, [users, query]);

  function requestDelete(user) {
    setUserToDelete(user);
  }

  async function confirmDelete() {
    try {
      await axiosClient.delete(`/admin/users/${userToDelete.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    } catch (err) {
      setError(err.response?.data?.message || t('adminDeleteUserError'));
    } finally {
      setUserToDelete(null);
    }
  }

  async function handleRoleChange(id, newRole) {
    try {
      await axiosClient.put(`/admin/users/${id}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
    } catch (err) {
      setError(err.response?.data?.message || t('adminChangeRoleError'));
      loadUsers(); // si falla (p.ej. intentar cambiarte tu propio rol), recarga para revertir el <select> a su valor real
    }
  }

  if (loading) return <p className="hideout-loading">{t('loadingUsers')}</p>;

  return (
    <div className="admin-page">
      <h2>{t('adminTitle')}</h2>
      {error && <div className="hideout-error">{error}</div>}

      <input
        type="text"
        className="market-search admin-search"
        placeholder={t('searchUserPlaceholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filteredUsers.length === 0 ? (
        <p className="summary-empty">{t('noUsersFound')}</p>
      ) : (
        <table className="offers-table admin-table">
          <thead>
            <tr>
              <th>{t('tableUser')}</th>
              <th>{t('tableEmail')}</th>
              <th>{t('tableRole')}</th>
              <th>{t('tableRegistered')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td className="admin-actions">
                  <select
                    className="admin-role-select"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  >
                    <option value="USER">{t('roleUser')}</option>
                    <option value="ADMIN">{t('roleAdmin')}</option>
                  </select>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="admin-actions">
                  <button className="admin-delete-btn" onClick={() => requestDelete(u)}>
                  {t('deleteBtn')}
                </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <ConfirmDialog
        open={userToDelete !== null}
        title={t('confirmDeleteTitle')}
        message={userToDelete ? t('confirmDeleteUser').replace('{username}', userToDelete.username) : ''}
        confirmLabel={t('deleteBtn')}
        cancelLabel={t('cancelBtn')}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
}
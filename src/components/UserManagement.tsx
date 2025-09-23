import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { AppUser, UserRole } from '../types/user';
import { createUser, deleteUser, fetchUsers, updateUser } from '../utils/api';

interface FormState {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

const defaultFormState: FormState = {
  email: '',
  password: '',
  fullName: '',
  role: 'user',
};

const UserManagement: React.FC = () => {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  useEffect(() => {
    if (!token || !isAdmin) return;
    const loadUsers = async () => {
      try {
        setLoading(true);
        const { users } = await fetchUsers(token);
        setUsers(users);
        setError(null);
      } catch (err: any) {
        setError(err?.message ?? 'Impossible de récupérer les utilisateurs');
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [token, isAdmin]);

  const handleInputChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      const { user } = await createUser(token, {
        email: form.email,
        password: form.password,
        fullName: form.fullName || undefined,
        role: form.role,
      });
      setUsers((prev) => [user, ...prev]);
      setForm(defaultFormState);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? "Impossible de créer l'utilisateur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (id: number, role: UserRole) => {
    if (!token) return;
    try {
      const { user } = await updateUser(token, id, { role });
      setUsers((prev) => prev.map((u) => (u.id === id ? user : u)));
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? 'Impossible de mettre à jour le rôle');
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      await deleteUser(token, id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? 'Impossible de supprimer cet utilisateur');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto mt-12 bg-white p-8 rounded-xl shadow">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Accès refusé</h2>
        <p className="text-gray-600">Vous devez être administrateur pour gérer les utilisateurs.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-12 space-y-10">
      <section className="bg-white p-8 rounded-xl shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Créer un nouvel utilisateur</h2>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateUser}>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="new-email">
              Adresse e-mail
            </label>
            <input
              id="new-email"
              type="email"
              value={form.email}
              onChange={handleInputChange('email')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="new-fullname">
              Nom complet
            </label>
            <input
              id="new-fullname"
              type="text"
              value={form.fullName}
              onChange={handleInputChange('fullName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nom et prénom"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="new-password">
              Mot de passe
            </label>
            <input
              id="new-password"
              type="password"
              value={form.password}
              onChange={handleInputChange('password')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              minLength={8}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="new-role">
              Rôle
            </label>
            <select
              id="new-role"
              value={form.role}
              onChange={handleInputChange('role')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          {error && (
            <div className="md:col-span-2">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              disabled={submitting}
            >
              {submitting ? 'Création en cours...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white p-8 rounded-xl shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Utilisateurs</h2>
        {loading ? (
          <p className="text-gray-500">Chargement...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500">Aucun utilisateur enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé le</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.fullName ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <select
                        className="border border-gray-300 rounded px-2 py-1"
                        value={item.role}
                        onChange={(event) => handleRoleChange(item.id, event.target.value as UserRole)}
                        disabled={item.id === user?.id}
                      >
                        <option value="user">Utilisateur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {item.id !== user?.id && (
                        <button
                          className="text-red-600 hover:underline"
                          onClick={() => handleDelete(item.id)}
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default UserManagement;

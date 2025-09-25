// src/pages/SimulationsList.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

type Simulation = {
  id: string;
  title: string;
  created_at: string;
  updated_at?: string;
};

export default function SimulationsList({
  onOpen,
  onNavigate,
}: {
  onOpen: (id: string) => void;
  onNavigate: (page: string, params?: any) => void;
}) {
  const { token, authFetch } = useAuth();

  const [items, setItems] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    try {
      setErr(null);
      setLoading(true);
      const res = await authFetch('/api/simulations');
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error((data as any)?.error || `HTTP ${res.status}`);
      }
      setItems(data || []);
      setLoading(false);
    } catch (e: any) {
      setErr(e?.message || 'Impossible de charger vos simulations.');
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      onNavigate('login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette simulation ?')) return;
    try {
      setDeletingId(id);
      const res = await authFetch(`/api/simulations/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as any)?.error || `HTTP ${res.status}`);
      }
      setDeletingId(null);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      setDeletingId(null);
      alert(e?.message || 'Suppression impossible.');
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Mes simulations</h2>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 border rounded hover:bg-gray-50"
            onClick={load}
            title="Rafraîchir"
          >
            Rafraîchir
          </button>
          <button
            className="px-3 py-2 rounded bg-black text-white"
            onClick={() => onNavigate('projet-immo')}
            title="Créer une nouvelle simulation"
          >
            Nouvelle simulation
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white p-4 rounded border">Chargement…</div>
      )}

      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          {err}
        </div>
      )}

      {!loading && !err && items.length === 0 && (
        <div className="bg-white p-6 rounded-xl border text-center">
          <p className="text-gray-600">Aucune simulation pour le moment.</p>
          <button
            className="mt-3 px-3 py-2 rounded bg-black text-white"
            onClick={() => onNavigate('projet-immo')}
          >
            Créer ma première simulation
          </button>
        </div>
      )}

      {!loading && !err && items.length > 0 && (
        <ul className="space-y-2">
          {items.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between bg-white p-4 rounded border"
            >
              <div>
                <div className="font-medium">{s.title || 'Sans titre'}</div>
                <div className="text-sm text-gray-500">
                  Créé le {new Date(s.created_at).toLocaleString()}
                  {s.updated_at ? ` • Modifié le ${new Date(s.updated_at).toLocaleString()}` : ''}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-2 border rounded hover:bg-gray-50"
                  onClick={() => onOpen(s.id)}
                  title="Ouvrir et éditer"
                >
                  Ouvrir
                </button>
                <button
                  className={`px-3 py-2 border rounded ${
                    deletingId === s.id ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                  disabled={deletingId === s.id}
                  onClick={() => handleDelete(s.id)}
                  title="Supprimer"
                >
                  {deletingId === s.id ? 'Suppression…' : 'Supprimer'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

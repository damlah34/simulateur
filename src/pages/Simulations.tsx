// src/pages/Simulations.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

type Props = {
  onNavigate: (page: string, params?: any) => void;
};

type SimulationLite = {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
};

export default function Simulations({ onNavigate }: Props) {
  const { token, authFetch } = useAuth();
  const [sims, setSims] = useState<SimulationLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await authFetch("/api/simulations");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as SimulationLite[];
      setSims(data || []);
    } catch (e: any) {
      setErr(e?.message || "Impossible de charger vos simulations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) load();
  }, [token]); // eslint-disable-line

  if (!token) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">
          Vous devez être connecté pour voir vos simulations.
        </p>
        <button
          onClick={() => onNavigate("login")}
          className="mt-4 bg-black text-white px-4 py-2 rounded"
        >
          Se connecter
        </button>
      </div>
    );
  }

  async function onDelete(id: string) {
    if (!confirm("Supprimer cette simulation ?")) return;
    try {
      const res = await authFetch(`/api/simulations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      setSims((prev) => prev.filter((s) => s.id !== id));
    } catch (e: any) {
      alert(e?.message || "Suppression impossible");
    }
  }

  function openSimulation(s: SimulationLite) {
    // 👇 On place le param en mémoire globale pour que Projection Immo puisse le lire
    (window as any).__app_params = { simulation: { id: s.id, title: s.title } };
    // puis on navigue vers la page Projection Immo
    onNavigate("projet-immo");
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Mes simulations</h1>

      {loading && <p>Chargement…</p>}
      {err && <p className="text-red-600">{err}</p>}
      {!loading && !err && sims.length === 0 && <p>Aucune simulation enregistrée.</p>}

      <ul className="space-y-2">
        {sims.map((s) => (
          <li
            key={s.id}
            className="p-4 border rounded flex items-center justify-between gap-4 hover:bg-gray-50"
          >
            <div className="min-w-0">
              <div className="font-medium truncate">{s.title || "Sans titre"}</div>
              <div className="text-xs text-gray-500">
                {s.updated_at ? `Modifiée le ${new Date(s.updated_at).toLocaleDateString()}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openSimulation(s)}
                className="text-sm bg-black text-white px-3 py-1.5 rounded"
              >
                Ouvrir
              </button>
              <button
                onClick={() => onDelete(s.id)}
                className="text-sm border px-3 py-1.5 rounded hover:bg-gray-100"
                title="Supprimer"
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

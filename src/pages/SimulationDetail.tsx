import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

type SimulationPayload = {
  title?: string;
  payload?: unknown;
};

export default function SimulationDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { authFetch } = useAuth();
  const [title, setTitle] = useState("");
  const [payload, setPayload] = useState("{}");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch(`/api/simulations/${id}`);
        const data = (await res.json().catch(() => ({}))) as SimulationPayload;
        if (!res.ok) {
          throw new Error((data as any)?.error || `HTTP ${res.status}`);
        }
        setTitle(data.title || "");
        setPayload(JSON.stringify(data.payload ?? {}, null, 2));
      } catch (e: any) {
        setErr(e.message || "Impossible de charger la simulation.");
      }
    })();
  }, [id, authFetch]);

  async function save() {
    try {
      setErr(null);
      const body = { title, payload: JSON.parse(payload || "{}") };
      const res = await authFetch(`/api/simulations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.error || `HTTP ${res.status}`);
      }
      alert("Enregistré");
    } catch (e: any) {
      setErr(e.message || "Enregistrement impossible.");
    }
  }

  async function remove() {
    try {
      const res = await authFetch(`/api/simulations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.error || `HTTP ${res.status}`);
      }
      onBack();
    } catch (e: any) {
      setErr(e.message || "Suppression impossible.");
    }
  }

  return (
    <div className="max-w-3xl mx-auto my-6 space-y-2">
      <button className="underline" onClick={onBack}>
        ← Retour
      </button>
      <h2 className="text-xl font-semibold">Détail simulation</h2>
      {err && <p className="text-red-600">{err}</p>}
      <input className="w-full border p-2" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        className="w-full border p-2"
        rows={12}
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
      />
      <div className="space-x-2">
        <button className="bg-black text-white px-4 py-2 rounded" onClick={save}>
          Enregistrer
        </button>
        <button className="px-4 py-2 rounded border border-red-600 text-red-600" onClick={remove}>
          Supprimer
        </button>
      </div>
    </div>
  );
}

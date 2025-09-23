import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authFetch } from "../utils/authFetch";

export default function SimulationDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { token } = useAuth();
  const af = authFetch(token);
  const [title, setTitle] = useState("");
  const [payload, setPayload] = useState("{}");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await af(`/api/simulations/${id}`);
        setTitle(data.title);
        setPayload(JSON.stringify(data.payload ?? {}, null, 2));
      } catch (e: any) {
        setErr(e.message);
      }
    })();
  }, [id]);

  async function save() {
    try {
      setErr(null);
      const body = { title, payload: JSON.parse(payload || "{}") };
      await af(`/api/simulations/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      alert("Enregistré");
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function remove() {
    try {
      await af(`/api/simulations/${id}`, { method: "DELETE" });
      onBack();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div className="max-w-3xl mx-auto my-6 space-y-2">
      <button className="underline" onClick={onBack}>← Retour</button>
      <h2 className="text-xl font-semibold">Détail simulation</h2>
      {err && <p className="text-red-600">{err}</p>}
      <input className="w-full border p-2" value={title} onChange={e => setTitle(e.target.value)} />
      <textarea className="w-full border p-2" rows={12} value={payload} onChange={e => setPayload(e.target.value)} />
      <div className="space-x-2">
        <button className="bg-black text-white px-4 py-2 rounded" onClick={save}>Enregistrer</button>
        <button className="px-4 py-2 rounded border border-red-600 text-red-600" onClick={remove}>Supprimer</button>
      </div>
    </div>
  );
}

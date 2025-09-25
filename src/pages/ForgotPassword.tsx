// src/pages/ForgotPassword.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPassword({
  onNavigate,
}: {
  onNavigate: (page: string, params?: any) => void;
}) {
  const { authFetch } = useAuth();
  const [email, setEmail] = useState('');
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    setLoading(true);
    try {
      const res = await authFetch('/api/auth/forgot', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.error || `HTTP ${res.status}`);
      }
      setOk(true);
    } catch (e: any) {
      setErr(e?.message || 'Impossible d’envoyer l’email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-semibold mb-4">Mot de passe oublié</h2>
      <p className="text-sm text-gray-600 mb-4">
        Entrez votre adresse email, nous vous enverrons un lien pour réinitialiser votre mot de passe.
      </p>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          className="w-full border rounded px-3 py-2"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className={`w-full px-3 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'}`}
        >
          {loading ? 'Envoi…' : 'Envoyer le lien'}
        </button>
      </form>

      {ok && <div className="mt-3 text-green-700">Email envoyé ✅ Vérifiez votre boîte de réception.</div>}
      {err && <div className="mt-3 text-red-600">{err}</div>}

      <div className="mt-6 text-center">
        <button className="text-sm text-gray-600 underline" onClick={() => onNavigate('login')}>
          Retour à la connexion
        </button>
      </div>
    </div>
  );
}

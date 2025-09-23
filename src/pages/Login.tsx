// src/pages/Login.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

type Props = { onNavigate: (page: string, params?: any) => void };

export default function Login({ onNavigate }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [guardMsg, setGuardMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const nextPage = window.__pageParams?.nextPage as string | undefined;
    if (nextPage) {
      const labelMap: Record<string, string> = {
        "inflation-beat": "Battre l’inflation",
        "projet-immo": "Projection immo",
        "simulations": "Mes simulations",
      };
      setGuardMsg(`Veuillez vous connecter pour accéder à « ${labelMap[nextPage] || nextPage} ».`);
    } else {
      setGuardMsg(null);
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      setOk(true);

      // Redirection optimiste immédiate (l’effet App.tsx couvrira aussi le cas restant)
      const next = window.__pageParams?.nextPage;
      const nextParams = window.__pageParams?.nextParams;
      window.__pageParams = null;
      if (next) onNavigate(next, nextParams);
      else onNavigate("home");
    } catch (e: any) {
      setErr(e?.message || "Identifiants invalides");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto my-6 space-y-3">
      <h2 className="text-xl font-semibold">Se connecter</h2>

      {guardMsg && (
        <div className="rounded bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 text-sm">
          {guardMsg}
        </div>
      )}
      {ok && (
        <div className="rounded bg-green-50 border border-green-200 text-green-700 px-3 py-2 text-sm">
          Connexion réussie ✅
        </div>
      )}
      {err && (
        <div className="rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {err}
        </div>
      )}

      <input
        className="w-full border p-2"
        placeholder="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="w-full border p-2"
        placeholder="Mot de passe"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button className={`bg-black text-white px-4 py-2 rounded ${loading ? "opacity-70" : ""}`} type="submit" disabled={loading}>
        {loading ? "Connexion..." : "Connexion"}
      </button>

      <div className="text-sm flex items-center justify-between">
        <button type="button" className="underline" onClick={() => onNavigate("signup")}>
          Créer un compte
        </button>
        <button type="button" className="underline" onClick={() => onNavigate("home", { forgot: true })}>
          Mot de passe oublié ?
        </button>
      </div>
    </form>
  );
}

// src/pages/Signup.tsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

type Props = {
  onNavigate: (page: string, params?: any) => void;
  onSuccess?: () => void;
};

export default function Signup({ onNavigate, onSuccess }: Props) {
  const { signup } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);

    if (pwd.length < 8) {
      setErr("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (pwd !== pwd2) {
      setErr("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const r = await signup(email.trim(), pwd, fullName.trim() || undefined);

      if (r === "ok") {
        // auto-login -> onSuccess sinon Mes simulations
        if (onSuccess) onSuccess();
        else onNavigate("simulations");
      } else {
        // confirmation email requise
        setOk(true);
      }
    } catch (e: any) {
      setErr(e?.message || "Impossible de créer le compte.");
    } finally {
      setLoading(false);
    }
  }

  // ---- RENDER ----
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-2xl font-semibold">Créer votre compte</h2>

        {err && (
          <div className="rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
            {err}
          </div>
        )}

        {ok ? (
          // ✅ Compte créé : on affiche uniquement le message
          <div className="rounded bg-green-50 border border-green-200 text-green-700 px-3 py-4 text-sm text-center">
            Compte créé ✅ <td></td>Veuillez vérifier votre boîte mail pour confirmer
            votre adresse avant de vous connecter.
          </div>
        ) : (
          // 📝 Formulaire normal
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-700">Nom complet (optionnel)</label>
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="Ex : Damien Lahmi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-700">Email</label>
              <input
                className="w-full border rounded px-3 py-2"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-700">Mot de passe</label>
              <div className="relative">
                <input
                  className="w-full border rounded px-3 py-2 pr-20"
                  type={showPwd ? "text" : "password"}
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 underline"
                  onClick={() => setShowPwd((s) => !s)}
                >
                  {showPwd ? "Masquer" : "Afficher"}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-700">Confirmer le mot de passe</label>
              <div className="relative">
                <input
                  className="w-full border rounded px-3 py-2 pr-20"
                  type={showPwd2 ? "text" : "password"}
                  value={pwd2}
                  onChange={(e) => setPwd2(e.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 underline"
                  onClick={() => setShowPwd2((s) => !s)}
                >
                  {showPwd2 ? "Masquer" : "Afficher"}
                </button>
              </div>
            </div>

            <button
              className={`w-full px-4 py-2 rounded text-white ${
                loading ? "bg-gray-400" : "bg-black hover:bg-gray-800"
              }`}
              type="submit"
              disabled={loading}
            >
              {loading ? "Création…" : "Créer mon compte"}
            </button>

            <p className="text-sm text-center text-gray-700">
              Déjà inscrit ?{" "}
              <button
                type="button"
                className="underline"
                onClick={() => onNavigate("login")}
              >
                Se connecter
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

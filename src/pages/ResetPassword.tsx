import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/** Parse les paramètres depuis le hash (#...) ET la query (?...) */
function readUrlParams() {
  const hashStr = window.location.hash?.startsWith('#')
    ? window.location.hash.substring(1)
    : window.location.hash || '';
  const queryStr = window.location.search?.startsWith('?')
    ? window.location.search.substring(1)
    : window.location.search || '';

  const hash = new URLSearchParams(hashStr);
  const query = new URLSearchParams(queryStr);

  return {
    // format hash
    h_access_token: hash.get('access_token') || '',
    h_refresh_token: hash.get('refresh_token') || '',
    h_type: hash.get('type') || '',
    h_error: hash.get('error') || '',
    h_error_code: hash.get('error_code') || '',
    h_error_description: hash.get('error_description') || '',

    // format query (?code=...)
    q_code: query.get('code') || '',
    q_type: query.get('type') || '',
    q_error: query.get('error') || '',
    q_error_description: query.get('error_description') || '',
  };
}

export default function ResetPassword({
  onNavigate,
}: {
  onNavigate: (page: string, params?: any) => void;
}) {
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionOk, setSessionOk] = useState(false);

  const params = useMemo(() => readUrlParams(), []);

  /** 1) Établir une session à partir de l’URL (hash tokens OU code) */
  useEffect(() => {
    (async () => {
      // Erreurs “natives” renvoyées par Supabase dans l’URL
      const inlineError =
        params.h_error ||
        params.h_error_code ||
        params.q_error ||
        params.q_error_description;
      if (inlineError) {
        setErr(
          decodeURIComponent(
            params.h_error_description ||
              params.h_error ||
              params.h_error_code ||
              params.q_error_description ||
              params.q_error ||
              'Lien invalide.'
          )
        );
        return;
      }

      try {
        // Cas 1: format ?code=...&type=recovery
        if (params.q_code && (params.q_type === 'recovery' || !params.q_type)) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) throw error;
        }
        // Cas 2: format #access_token=...&refresh_token=...&type=recovery
        else if (params.h_access_token && params.h_refresh_token && params.h_type === 'recovery') {
          const { error } = await supabase.auth.setSession({
            access_token: params.h_access_token,
            refresh_token: params.h_refresh_token,
          });
          if (error) throw error;
        } else {
          // Pas de format reconnu
          setErr('Lien invalide ou expiré. Merci de redemander un email de réinitialisation.');
          return;
        }

        // Vérifie qu’on a bien une session établie
        const { data, error: getErr } = await supabase.auth.getSession();
        if (getErr) throw getErr;
        if (!data.session) {
          setErr("Session manquante. Le lien a peut-être expiré — recommence s'il te plaît.");
          return;
        }
        setSessionOk(true);
      } catch (e: any) {
        setErr(e?.message || 'Impossible d’établir la session de réinitialisation.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 2) Mettre à jour le mot de passe (nécessite une session valide) */
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);

    if (!sessionOk) {
      setErr("Session absente — recommence avec un nouveau lien s'il te plaît.");
      return;
    }
    if (pwd.length < 8) return setErr('Mot de passe : 8 caractères minimum.');
    if (pwd !== pwd2) return setErr('Les deux mots de passe ne correspondent pas.');

    setLoading(true);
    try {
      const { error: updErr } = await supabase.auth.updateUser({ password: pwd });
      if (updErr) throw updErr;

      setOk(true);
      // Nettoie l’URL (hash & query) pour éviter les effets de bord au refresh
      window.history.replaceState({}, '', window.location.pathname);

      // Déconnexion propre, puis redirection vers Login
      await supabase.auth.signOut();
      setTimeout(() => onNavigate('login'), 1500);
    } catch (e: any) {
      setErr(e?.message || 'Impossible de réinitialiser le mot de passe.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-white rounded-xl shadow p-6 space-y-4"
      >
        <h2 className="text-2xl font-semibold">Nouveau mot de passe</h2>

        {err && (
          <div className="rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
            {err}
          </div>
        )}
        {ok && (
          <div className="rounded bg-green-50 border border-green-200 text-green-700 px-3 py-2 text-sm">
            Mot de passe mis à jour ✅ Redirection vers la connexion…
          </div>
        )}

        {!ok && !err && (
          <>
            {!sessionOk && (
              <div className="text-sm text-gray-600">
                Validation du lien en cours…
              </div>
            )}

            {sessionOk && (
              <>
                <div className="space-y-1">
                  <label className="text-sm text-gray-700">Nouveau mot de passe</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    type="password"
                    placeholder="••••••••"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-700">Confirmer le mot de passe</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    type="password"
                    placeholder="••••••••"
                    value={pwd2}
                    onChange={(e) => setPwd2(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full px-4 py-2 rounded text-white ${
                    loading ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'
                  }`}
                >
                  {loading ? 'Mise à jour…' : 'Mettre à jour'}
                </button>
              </>
            )}
          </>
        )}

        <div className="text-center">
          <button
            type="button"
            className="text-sm underline text-gray-600"
            onClick={() => onNavigate('login')}
          >
            Retour à la connexion
          </button>
        </div>
      </form>
    </div>
  );
}

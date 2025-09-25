import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { login, signup, error, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    try {
      if (mode === 'login') {
        await login(email, password);
        setFeedback(null);
        onSuccess();
      } else {
        const result = await signup(email, password, fullName || undefined);
        if (result === 'ok') {
          setFeedback("Compte créé avec succès ! Vous êtes maintenant connecté.");
          onSuccess();
        } else {
          setFeedback(
            "Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse avant de vous connecter.",
          );
        }
      }
    } catch (err: any) {
      setFeedback(err?.message ?? "Une erreur est survenue");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
        {mode === 'login' ? 'Connexion' : 'Créer un compte'}
      </h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
            Adresse e-mail
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fullName">
              Nom complet
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Jean Dupont"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
            minLength={8}
          />
        </div>
        {(feedback || error) && (
          <p className="text-sm text-red-600">{feedback ?? error}</p>
        )}
        <button
          type="submit"
          className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors"
          disabled={loading}
        >
          {loading ? 'Veuillez patienter...' : mode === 'login' ? 'Se connecter' : 'Créer un compte'}
        </button>
      </form>
      <div className="mt-4 text-center text-sm text-gray-600">
        {mode === 'login' ? (
          <button className="text-primary-600 hover:underline" onClick={() => setMode('register')}>
            Pas encore de compte ? Inscrivez-vous
          </button>
        ) : (
          <button className="text-primary-600 hover:underline" onClick={() => setMode('login')}>
            Déjà inscrit ? Connectez-vous
          </button>
        )}
      </div>
    </div>
  );
};

export default Login;

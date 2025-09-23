// src/pages/Confirm.tsx
import React from "react";

export default function Confirm({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-white p-6 rounded-xl shadow max-w-md text-center space-y-4">
        <h2 className="text-xl font-semibold text-green-600">
          ✅ Votre compte a bien été validé
        </h2>
        <p className="text-gray-700">
          Vous pouvez à présent vous connecter à votre espace.
        </p>
        <button
          onClick={() => onNavigate("login")}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          Se connecter
        </button>
      </div>
    </div>
  );
}

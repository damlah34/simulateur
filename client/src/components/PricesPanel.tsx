import React, { useEffect, useState } from 'react';
import { getPrices } from '../lib/api';

interface Props {
  insee: string;
}

export default function PricesPanel({ insee }: Props) {
  const [data, setData] = useState<any>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    setState('loading');
    getPrices(insee)
      .then((d) => {
        setData(d);
        setState('idle');
      })
      .catch(() => setState('error'));
  }, [insee]);

  if (state === 'loading') return <p aria-live="polite">Chargement...</p>;
  if (state === 'error') return <p aria-live="polite">Erreur</p>;
  if (!data) return null;

  return (
    <div aria-live="polite">
      <p>Appartement : {data.prix_m2_appart?.toLocaleString('fr-FR')} €/m²</p>
      <p>Maison : {data.prix_m2_maison?.toLocaleString('fr-FR')} €/m²</p>
      <p>Période : {data.periode_reference} – Source : {data.source}</p>
    </div>
  );
}

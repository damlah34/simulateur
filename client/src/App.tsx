import React, { useState } from 'react';
import CityAutocomplete from './components/CityAutocomplete';

export default function App() {
  const [city, setCity] = useState<{ insee: string; nom: string; cp: string } | null>(null);
  return (
    <div>
      <h1>Prix au m²</h1>
      <CityAutocomplete onSelect={(c) => setCity(c)} />
      {city && (
        <p>
          {city.nom} ({city.cp})
        </p>
      )}
    </div>
  );
}

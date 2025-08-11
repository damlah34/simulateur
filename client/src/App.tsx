import React, { useState } from 'react';
import CityAutocomplete from './components/CityAutocomplete';
import PricesPanel from './components/PricesPanel';

export default function App() {
  const [insee, setInsee] = useState<string | null>(null);
  return (
    <div>
      <h1>Prix au m²</h1>
      <CityAutocomplete onSelect={(c) => setInsee(c.insee)} />
      {insee && <PricesPanel insee={insee} />}
    </div>
  );
}

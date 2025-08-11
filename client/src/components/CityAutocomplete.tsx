import React, { useEffect, useState } from 'react';
import { searchCommunes } from '../lib/api';

interface Props {
  onSelect: (c: { insee: string; nom: string; cp: string }) => void;
}

export default function CityAutocomplete({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [index, setIndex] = useState(-1);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await searchCommunes(query);
        setResults(r);
        setIndex(-1);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      setIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      setIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && index >= 0) {
      const c = results[index];
      onSelect({ insee: c.codeInsee, nom: c.nom, cp: c.codesPostaux[0] });
      setQuery(c.nom);
      setResults([]);
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKey}
        aria-autocomplete="list"
      />
      {results.length > 0 && (
        <ul>
          {results.map((c, i) => (
            <li
              key={c.codeInsee}
              style={{ background: i === index ? '#eee' : undefined }}
              onMouseDown={() => {
                onSelect({ insee: c.codeInsee, nom: c.nom, cp: c.codesPostaux[0] });
                setQuery(c.nom);
                setResults([]);
              }}
            >
              {c.nom} ({c.codesPostaux[0]})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

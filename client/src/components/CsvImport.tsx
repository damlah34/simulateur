// client/src/components/CsvImport.tsx
import React, { useState } from "react";
import { parseCsvFile, type Row } from "../utils/parseCsv";

export default function CsvImport() {
  const [status, setStatus] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("Lecture en cours…");
    try {
      const data = await parseCsvFile(file);
      setRows(data);
      setStatus(`✅ ${data.length} lignes importées`);
      console.log("PREVIEW:", data.slice(0, 5));
    } catch (err: any) {
      setStatus(`❌ Erreur : ${err?.message || String(err)}`);
    }
  }

  const headers = rows.length ? Object.keys(rows[0]) : [];

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Importer un relevé CSV</h1>
      <input type="file" accept=".csv,.tsv,text/csv" onChange={onPick} />
      <p>{status}</p>

      {rows.length > 0 && (
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="text-left px-3 py-2 border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 20).map((r, i) => (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  {headers.map((h) => (
                    <td key={h} className="px-3 py-2 border-b">
                      {String((r as any)[h] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-2 text-xs text-gray-500">
            (Aperçu limité à 20 lignes)
          </div>
        </div>
      )}
    </div>
  );
}

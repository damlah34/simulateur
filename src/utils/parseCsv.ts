// src/utils/parseCsv.ts
import Papa from "papaparse";

export type Row = Record<string, string | number>;

/** Détecte le délimiteur le plus probable (;, , ou tab) */
function detectDelimiter(sample: string): ";" | "," | "\t" {
  const first = sample.split(/\r?\n/, 2)[0] || "";
  const counts = {
    ";": (first.match(/;/g) || []).length,
    ",": (first.match(/,/g) || []).length,
    "\t": (first.match(/\t/g) || []).length,
  };
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  return best as ";" | "," | "\t";
}

/** Parse un CSV depuis un File (auto-détection du délimiteur) */
export async function parseCsvFile(file: File): Promise<Row[]> {
  const text = await file.text();
  const delimiter = detectDelimiter(text); // <= toujours une chaîne (";" , "," ou "\t")

  return new Promise((resolve, reject) => {
    Papa.parse<Row>(text, {
      header: true,
      delimiter,            // IMPORTANT : une chaîne, pas {}
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        if (res.errors?.length) {
          reject(new Error(res.errors.map((e) => e.message).join("; ")));
        } else {
          resolve(res.data);
        }
      },
      error: (err) => reject(err),
    });
  });
}

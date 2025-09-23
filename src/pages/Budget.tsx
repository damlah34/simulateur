// src/pages/Budget.tsx
import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { useAuth } from "../contexts/AuthContext";

type Props = { onNavigate: (page: string) => void };

type ParsedRow = { date: string; label: string; amount: number; account?: string | null };
type SummaryItem = { ym: string; category: string; income: number; expense: number; net: number };
type Tx = { id: string; op_date: string; label: string; amount: number; account?: string | null; meta?: any };

// liste figée de catégories (tu peux l’éditer)
const CATEGORIES = [
  "Salaire",
  "Loyer reçu",
  "Courses",
  "Énergie",
  "Transport",
  "Télécom",
  "Voyage",
  "Shopping",
  "Impôts & taxes",
  "Livraison",
  "Recettes (autres)",
  "Dépenses (autres)",
];

function normalizeDate(s: string): string {
  s = (s || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const m2 = s.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (m2) {
    const yyyy = Number(m2[3]) < 50 ? `20${m2[3]}` : `19${m2[3]}`;
    return `${yyyy}-${m2[2]}-${m2[1]}`;
  }
  return s;
}
function parseAmount(fields: Record<string, any>): number | null {
  const raw = fields["montant"] ?? fields["amount"] ?? fields["valeur"];
  const debit = fields["debit"] ?? fields["débit"];
  const credit = fields["credit"] ?? fields["crédit"];
  const toNumber = (x: any) => {
    if (x == null || x === "") return null;
    const s = String(x).replace(/\s+/g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };
  if (raw != null) {
    const n = toNumber(raw);
    return n;
  }
  const d = toNumber(debit);
  const c = toNumber(credit);
  if (d != null && c != null) return c - d;
  if (d != null) return -d;
  if (c != null) return c;
  return null;
}
function findField(obj: Record<string, any>, candidates: string[]) {
  for (const k of candidates) if (k in obj) return obj[k];
  return undefined;
}

export default function Budget({ onNavigate }: Props) {
  const { token, authFetch } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);

  // À classer
  const [uncats, setUncats] = useState<Tx[]>([]);
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Record<string, string>>({}); // txId -> category

  useEffect(() => {
    if (!token) {
      onNavigate("login");
      return;
    }
    reloadSummary().catch(() => {});
    reloadUncats().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function reloadSummary(fromYM?: string, toYM?: string) {
    setErr(null);
    const qs = new URLSearchParams();
    if (fromYM) qs.set("from", fromYM);
    if (toYM) qs.set("to", toYM);
    const r = await authFetch(`/api/budget/summary${qs.toString() ? `?${qs}` : ""}`);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErr(j?.error || "Impossible de charger la synthèse");
      return;
    }
    const j = await r.json();
    setSummary(j.items || []);
    setRange({ from: (j.from || "").slice(0, 7), to: (j.to || "").slice(0, 7) });
  }

  async function reloadUncats() {
    const r = await authFetch(`/api/budget/uncategorized?limit=200`);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErr(j?.error || "Impossible de charger les opérations à classer");
      return;
    }
    setUncats(j.items || []);
    setChosen({});
  }

  function parseCSV(text: string): ParsedRow[] {
    const res = Papa.parse<Record<string, any>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) =>
        h
          .toLowerCase()
          .trim()
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .replace(/\s+/g, " ")
          .replace(/[^\w ]/g, "")
          .replace(/\s+/g, "_"),
    });
    if (res.errors?.length) throw new Error(res.errors[0].message || "CSV illisible");
    const rows = res.data || [];
    if (!rows.length) throw new Error("CSV vide");

    const out: ParsedRow[] = [];
    for (const row of rows) {
      const dateRaw =
        findField(row, ["date_operation", "date_op", "date", "posted_date", "booking_date"]) ?? "";
      const labelRaw =
        findField(row, ["libelle", "intitule", "label", "description", "narration"]) ?? "";
      const account =
        (findField(row, ["compte", "account", "iban", "numero_compte"]) as string) || null;

      const date = normalizeDate(String(dateRaw));
      const amount = parseAmount(row);
      const label = String(labelRaw || "").trim();
      if (!date || !label || amount === null) continue;

      out.push({ date, label, amount, account });
    }
    return out;
  }

  async function onAnalyze() {
    try {
      setErr(null);
      setMsg(null);
      setBusy(true);

      let text = "";
      if (file) text = await file.text();
      else if (pasted.trim()) text = pasted.trim();
      else {
        setErr("Choisis un fichier CSV ou colle tes lignes dans la zone prévue.");
        setBusy(false);
        return;
      }

      const rows = parseCSV(text);
      if (!rows.length) {
        setErr("Fichier vide ou en-têtes non reconnus.");
        setBusy(false);
        return;
      }

      const r = await authFetch("/api/budget/import", {
        method: "POST",
        body: JSON.stringify({ rows }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(j?.error || "Erreur import");
        setBusy(false);
        return;
      }

      setMsg(`✅ Import réussi : ${j.inserted ?? 0} lignes nouvelles.`);
      setBusy(false);
      setFile(null);
      setPasted("");
      await reloadSummary();
      await reloadUncats();
    } catch (e: any) {
      setBusy(false);
      setErr(e?.message || "Erreur import");
    }
  }

  // agrège côté front pour un tableau YM x catégorie
  const months = useMemo(() => {
    const set = new Set(summary.map((x) => x.ym));
    return Array.from(set).sort();
  }, [summary]);
  const cats = useMemo(() => {
    const set = new Set(summary.map((x) => x.category));
    return Array.from(set).sort((a, b) =>
      a === "Non catégorisé" ? 1 : b === "Non catégorisé" ? -1 : a.localeCompare(b)
    );
  }, [summary]);
  const map = useMemo(() => {
    const m = new Map<string, SummaryItem>();
    for (const x of summary) m.set(`${x.ym}__${x.category}`, x);
    return m;
  }, [summary]);

  async function assignCategory(txId: string) {
    const category = chosen[txId];
    if (!category) return;
    setSavingRow(txId);
    try {
      const r = await authFetch(`/api/budget/tx/${txId}`, {
        method: "PUT",
        body: JSON.stringify({ category }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(j?.error || "Impossible de classer cette opération");
        setSavingRow(null);
        return;
      }
      // retire la ligne localement
      setUncats((prev) => prev.filter((x) => x.id !== txId));
      setSavingRow(null);
      // recharge la synthèse
      reloadSummary().catch(() => {});
    } catch (e: any) {
      setSavingRow(null);
      setErr(e?.message || "Erreur de mise à jour");
    }
  }

  if (!token) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <p className="mb-4">Vous devez être connecté.</p>
        <button className="px-4 py-2 bg-black text-white rounded" onClick={() => onNavigate("login")}>
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-2xl font-bold">Synthèse budget</h1>

      {/* Import */}
      <div className="bg-white rounded-xl shadow p-4 space-y-4">
        <h2 className="text-lg font-semibold">Importer des opérations</h2>
        {err && <div className="text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded">{err}</div>}
        {msg && <div className="text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded">{msg}</div>}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm text-gray-700">Fichier CSV</label>
            <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-gray-700">…ou coller les lignes CSV</label>
            <textarea
              className="w-full h-28 border rounded p-2 font-mono text-sm"
              placeholder={`Date;Libellé;Montant\n01/08/2025;CARREFOUR; -54,30\n...`}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
            />
          </div>
        </div>

        <button
          className={`px-4 py-2 rounded text-white ${busy ? "bg-gray-400" : "bg-black hover:bg-gray-800"}`}
          onClick={onAnalyze}
          disabled={busy}
        >
          {busy ? "Analyse…" : "Analyser / Importer"}
        </button>
      </div>

      {/* À classer */}
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <h2 className="text-lg font-semibold">À classer ({uncats.length})</h2>
        {uncats.length === 0 ? (
          <p className="text-gray-500">Tout est classé ✅</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-sm border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border px-2 py-1 text-left">Date</th>
                  <th className="border px-2 py-1 text-left">Libellé</th>
                  <th className="border px-2 py-1 text-right">Montant</th>
                  <th className="border px-2 py-1 text-left">Catégorie</th>
                  <th className="border px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {uncats.map((t) => (
                  <tr key={t.id}>
                    <td className="border px-2 py-1">{t.op_date}</td>
                    <td className="border px-2 py-1">{t.label}</td>
                    <td className={`border px-2 py-1 text-right ${t.amount < 0 ? "text-red-700" : "text-emerald-700"}`}>
                      {t.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </td>
                    <td className="border px-2 py-1">
                      <select
                        className="border rounded px-2 py-1"
                        value={chosen[t.id] || ""}
                        onChange={(e) => setChosen((p) => ({ ...p, [t.id]: e.target.value }))}
                      >
                        <option value="" disabled>Choisir…</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="border px-2 py-1 text-right">
                      <button
                        className={`px-3 py-1 rounded text-white ${savingRow === t.id ? "bg-gray-400" : "bg-primary-600 hover:bg-primary-700"}`}
                        disabled={!chosen[t.id] || savingRow === t.id}
                        onClick={() => assignCategory(t.id)}
                      >
                        {savingRow === t.id ? "…" : "Classer"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right mt-2">
              <button
                className="text-sm underline"
                onClick={() => reloadUncats()}
              >
                Rafraîchir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filtres période */}
      {range && (
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <h3 className="font-semibold">Période</h3>
          <div className="flex items-center gap-3">
            <input type="month" value={range.from} onChange={(e) => reloadSummary(e.target.value, range?.to)} className="border rounded px-2 py-1" />
            <span>→</span>
            <input type="month" value={range.to} onChange={(e) => reloadSummary(range?.from, e.target.value)} className="border rounded px-2 py-1" />
          </div>
        </div>
      )}

      {/* Tableau YM x Catégories */}
      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4">Mois x Catégories</h2>
        {summary.length === 0 ? (
          <p className="text-gray-500">Aucune donnée sur la période.</p>
        ) : (
          <table className="min-w-[700px] w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-2 py-1 text-left">Catégorie</th>
                {months.map((m) => (
                  <th key={m} className="border px-2 py-1 text-right">{m}</th>
                ))}
                <th className="border px-2 py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(new Set([...cats, ...CATEGORIES, "Non catégorisé"])).map((c) => {
                let rowTotal = 0;
                return (
                  <tr key={c}>
                    <td className="border px-2 py-1 font-medium">{c}</td>
                    {months.map((m) => {
                      const x = map.get(`${m}__${c}`);
                      const val = x ? x.net : 0;
                      rowTotal += val;
                      const cls = val > 0 ? "text-emerald-700" : val < 0 ? "text-red-700" : "text-gray-700";
                      return (
                        <td key={m} className={`border px-2 py-1 text-right ${cls}`}>
                          {val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </td>
                      );
                    })}
                    <td className={`border px-2 py-1 text-right ${rowTotal>0?"text-emerald-800":rowTotal<0?"text-red-800":"text-gray-800"}`}>
                      {rowTotal.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="border px-2 py-1 text-right">Total</td>
                {months.map((m) => {
                  const sum = summary.filter((x) => x.ym === m).reduce((acc, x) => acc + x.net, 0);
                  return (
                    <td key={m} className={`border px-2 py-1 text-right ${sum>0?"text-emerald-800":sum<0?"text-red-800":"text-gray-800"}`}>
                      {sum.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </td>
                  );
                })}
                <td className="border px-2 py-1 text-right">
                  {summary.reduce((acc, x) => acc + x.net, 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
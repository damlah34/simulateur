import { Router } from "express";
import crypto from "crypto";
import { z } from "zod";
import { requireAuth } from "../middlewares/requireAuth";
import { getSupabaseForServer } from "../supabase";

const RowSchema = z.object({
  date: z.string().min(4),
  label: z.string().min(1),
  amount: z.number(),
  account: z.string().optional().nullable(),
});
const ImportSchema = z.object({ rows: z.array(RowSchema).min(1) });

function normalizeISO(d: string): string {
  if (/^\d{2}\/\d{2}\/\d{4}/.test(d)) {
    const [dd, mm, yyyy] = d.slice(0, 10).split("/");
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return new Date().toISOString().slice(0, 10);
}
function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

// Règles auto très simples
type Rule = { test: (label: string) => boolean; category: string };
const RULES: Rule[] = [
  { test: (l) => /salaire|payroll|paye|payche?ck/i.test(l), category: "Salaire" },
  { test: (l) => /loyer|rent/i.test(l), category: "Loyer reçu" },
  { test: (l) => /amazon|fnac|aliexpress|shein/i.test(l), category: "Shopping" },
  { test: (l) => /edf|engie|total|energie|gaz|elec/i.test(l), category: "Énergie" },
  { test: (l) => /carrefour|leclerc|intermarch|auchan|monoprix|casino/i.test(l), category: "Courses" },
  { test: (l) => /uber|uber eats|deliveroo|just eat|ubereats/i.test(l), category: "Livraison" },
  { test: (l) => /sncf|ratp|transilien|blablacar|bolt|uber/i.test(l), category: "Transport" },
  { test: (l) => /free|orange|sfr|bouygues|fibre|internet|mobile/i.test(l), category: "Télécom" },
  { test: (l) => /airbnb|hotel|booking|expedia/i.test(l), category: "Voyage" },
  { test: (l) => /imp(o|ô)ts|fisc|urssaf/i.test(l), category: "Impôts & taxes" },
];
function autoCategory(label: string, amount: number): string {
  const l = label.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  for (const r of RULES) if (r.test(l)) return r.category;
  return "Non catégorisé"; // ⚠️ par défaut, on met dans "À classer"
}

const router = Router();
router.use(requireAuth);

/** POST /api/budget/import */
router.post("/import", async (req, res) => {
  try {
    const parsed = ImportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.issues });
    }
    const rows = parsed.data.rows;

    const user = (req as any).user;
    const userId: string = user.id;
    const jwt: string = user.jwt;
    const supabase = getSupabaseForServer(jwt);

    const toInsert = rows.map((r) => {
      const iso = normalizeISO(r.date);
      const cat = autoCategory(r.label, r.amount);
      const amt = Math.round(r.amount * 100) / 100;
      const hash = sha256(`${userId}|${iso}|${r.label.trim()}|${amt}`);
      return {
        user_id: userId,
        op_date: iso,
        date: iso,
        label: r.label.trim(),
        amount: amt,
        account: r.account ?? null,
        is_transfer: false,
        auto_category: true,
        tx_hash: hash,
        raw: {},
        meta: { derived_category: cat },
      };
    });

    const { data, error } = await supabase
      .from("budget_transactions")
      .upsert(toInsert, { onConflict: "user_id,tx_hash", ignoreDuplicates: true })
      .select("id");

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ inserted: data?.length ?? 0 });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unexpected error" });
  }
});

/** GET /api/budget/summary?from=YYYY-MM&to=YYYY-MM */
router.get("/summary", async (req, res) => {
  try {
    const user = (req as any).user;
    const jwt: string = user.jwt;
    const supabase = getSupabaseForServer(jwt);

    const fromYm = (req.query.from as string) || "";
    const toYm = (req.query.to as string) || "";

    const today = new Date();
    const endISO = toYm && /^\d{4}-\d{2}$/.test(toYm) ? `${toYm}-31` : today.toISOString().slice(0, 10);
    const start = new Date(endISO);
    start.setMonth(start.getMonth() - 11);
    const startISOdefault = start.toISOString().slice(0, 10);
    const startISO = fromYm && /^\d{4}-\d{2}$/.test(fromYm) ? `${fromYm}-01` : startISOdefault;

    const { data, error } = await supabase
      .from("budget_transactions")
      .select("op_date,label,amount,meta")
      .gte("op_date", startISO)
      .lte("op_date", endISO)
      .order("op_date", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    type Row = { op_date: string; amount: number; meta: any };
    const map = new Map<string, { ym: string; category: string; income: number; expense: number }>();

    for (const r of (data as Row[])) {
      const d = r.op_date;
      const ym = (d || "").slice(0, 7);
      const cat = (r.meta && r.meta.derived_category) || "Non catégorisé";
      const key = `${ym}__${cat}`;
      if (!map.has(key)) map.set(key, { ym, category: cat, income: 0, expense: 0 });
      const bucket = map.get(key)!;
      if (r.amount >= 0) bucket.income += r.amount; else bucket.expense += r.amount;
    }

    const out = Array.from(map.values())
      .map((x) => ({ ...x, income: +x.income.toFixed(2), expense: +x.expense.toFixed(2), net: +(x.income + x.expense).toFixed(2) }))
      .sort((a, b) => a.ym.localeCompare(b.ym) || a.category.localeCompare(b.category));

    return res.json({ from: startISO, to: endISO, items: out });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unexpected error" });
  }
});

/** ✅ GET /api/budget/uncategorized
 * Renvoie les opérations dont la catégorie est "fourre-tout" :
 * - "Non catégorisé"
 * - "Dépenses (autres)"
 * - "Recettes (autres)"
 */
router.get("/uncategorized", async (req, res) => {
  try {
    const user = (req as any).user;
    const jwt: string = user.jwt;
    const supabase = getSupabaseForServer(jwt);

    const limit = Math.max(1, Math.min(500, Number(req.query.limit) || 100));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const to = offset + limit - 1;

    // PostgREST: utiliser .or() pour matcher plusieurs valeurs sur le JSON path
    const { data, error } = await supabase
      .from("budget_transactions")
      .select("id, op_date, label, amount, account, meta")
      .or(
        "meta->>derived_category.eq.Non catégorisé," +
        "meta->>derived_category.eq.Dépenses (autres)," +
        "meta->>derived_category.eq.Recettes (autres)"
      )
      .order("op_date", { ascending: false })
      .range(offset, to);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ items: data ?? [] });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unexpected error" });
  }
});

/** PUT /api/budget/tx/:id  { category: string } */
router.put("/tx/:id", async (req, res) => {
  try {
    const user = (req as any).user;
    const jwt: string = user.jwt;
    const supabase = getSupabaseForServer(jwt);

    const id = req.params.id;
    const category = String((req.body?.category ?? "")).trim();
    if (!category) return res.status(400).json({ error: "category is required" });

    const { data: exist, error: e1 } = await supabase
      .from("budget_transactions")
      .select("id, meta")
      .eq("id", id)
      .single();

    if (e1) return res.status(404).json({ error: e1.message || "Transaction not found" });

    const meta = { ...(exist?.meta ?? {}), derived_category: category };

    const { data, error } = await supabase
      .from("budget_transactions")
      .update({ meta, auto_category: false })
      .eq("id", id)
      .select("id, meta, auto_category")
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Unexpected error" });
  }
});

export default router;
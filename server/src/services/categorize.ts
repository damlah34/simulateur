// server/src/services/categorize.ts
export type Rule = { keywords: string[]; category: string };

const DEFAULT_RULES: Rule[] = [
  { keywords: ["uber", "bolt", "free now", "taxi"], category: "Transport" },
  { keywords: ["sncf", "ratp", "rattp", "blablacar", "trainline"], category: "Transport" },
  { keywords: ["carrefour", "monop", "auchan", "lidl", "super u", "intermarche", "aldi", "picard"], category: "Alimentation" },
  { keywords: ["deliveroo", "uber eats", "just eat"], category: "Alimentation" },
  { keywords: ["netflix", "spotify", "canal", "prime video", "deezer"], category: "Abonnements" },
  { keywords: ["orange", "sfr", "bouygues", "free mobile"], category: "Abonnements" },
  { keywords: ["edf", "enedis", "engie", "gaz", "eau", "veolia", "saur"], category: "Logement" },
  { keywords: ["loyer", "rent"], category: "Logement" },
  { keywords: ["doctolib", "pharm", "mutuelle"], category: "Santé" },
  { keywords: ["impot", "impôt", "urssaf", "amendes", "tresor public"], category: "Impôts" },
  { keywords: ["salaire", "payroll", "virement employeur", "acoss"], category: "Salaire" },
];

export function guessCategory(label: string, amount: number): string | null {
  const l = label.toLowerCase();
  for (const rule of DEFAULT_RULES) {
    if (rule.keywords.some(k => l.includes(k))) return rule.category;
  }
  // Heuristique simple : crédits récurrents => "Salaire"
  if (amount > 0 && /virement|payroll|salaire/i.test(label)) return "Salaire";
  return null;
}

// Règles ultra simples : on matche sur label normalisé.
// amount > 0 => "revenu" → Salaire/Autres revenus ; amount < 0 => dépense
export const rules = [
  { test: /salaire|paie|payroll|net.*paie/, category: "Salaire" },
  { test: /versement|virement.*reçu|remboursement/, category: "Autres revenus" },

  { test: /loyer|rent|fonciere|taxe.*habitation|edf|enedis|enedis|gaz|eau/, category: "Logement" },
  { test: /carrefour|leclerc|intermarche|super u|monoprix|lidl|aldi|course|drive/, category: "Alimentation" },
  { test: /uber|sncf|ratp|total|esso|bp|péage|autoroute|park(ing)?/, category: "Transport" },
  { test: /netflix|spotify|canal|prime.*video|dropbox|icloud|adobe|abonnement/, category: "Abonnements" },
  { test: /cinema|fnac|loisir|restau|uber eats|deliveroo|theatre/, category: "Loisirs" },
  { test: /pharmacie|doctolib|medecin|dentiste|opticien|mutuelle/, category: "Santé" },
  { test: /assur|maif|axa|allianz|macif|gmf/, category: "Assurances" },
  { test: /frais.*banc|commissions?|agios|tenue.*compte/, category: "Frais bancaires" },
  { test: /imp(o|ô)ts?|urssaf|cotis(ation)?/, category: "Impôts & taxes" },
];
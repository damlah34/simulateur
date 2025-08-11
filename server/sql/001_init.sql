CREATE TABLE IF NOT EXISTS dvf_raw (
  date_mutation DATE,
  nature_mutation TEXT,
  code_commune VARCHAR(5),
  type_local TEXT,
  surface_reelle_bati NUMERIC,
  valeur_fonciere NUMERIC
);

CREATE INDEX IF NOT EXISTS idx_dvf_raw_commune_date ON dvf_raw(code_commune, date_mutation);
CREATE INDEX IF NOT EXISTS idx_dvf_raw_type ON dvf_raw(type_local);

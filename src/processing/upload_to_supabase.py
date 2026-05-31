"""Sube daily_features y model_predictions a Supabase.

Requiere SUPABASE_SERVICE_ROLE_KEY en .env para bypasear RLS.
Si no hay service_role, genera SQL en artifacts/sql/ para ejecutar manualmente.

Uso:
    python -m src.processing.upload_to_supabase
"""

import json, os, requests
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parents[2] / ".env")

PROCESSED_DIR = Path("data/processed")
METRICS_DIR   = Path("artifacts/metrics")
SQL_DIR       = Path("artifacts/sql")
SQL_DIR.mkdir(parents=True, exist_ok=True)

SUPABASE_URL     = os.getenv("SUPABASE_URL", "")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
ANON_KEY         = os.getenv("SUPABASE_ANON_KEY", "")


def _headers(key):
    return {
        "apikey":        key,
        "Authorization": f"Bearer {key}",
        "Content-Type":  "application/json",
        "Prefer":        "resolution=merge-duplicates",
    }


def _upsert(table, records, key):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    total = 0
    for i in range(0, len(records), 200):
        chunk = records[i:i+200]
        r = requests.post(url, headers=_headers(key), json=chunk, timeout=30)
        if r.status_code not in (200, 201):
            print(f"  [ERROR] {table}: {r.status_code} — {r.text[:200]}")
            return False
        total += len(chunk)
    print(f"  Upserted {total} filas en '{table}'")
    return True


def _df_records(df):
    records = []
    for _, r in df.iterrows():
        records.append({
            "date":                  str(r["event_date"]),
            "country":               str(r["country"]),
            "n_conflict_events":     int(r["n_conflict_events"]),
            "avg_goldstein":         round(float(r["avg_goldstein"]), 4),
            "has_high_violence":     True,
            "n_gdelt_mentions":      int(r["n_mentions"]),
            "n_flights":             int(r["n_flights"]),
            "n_hotspots":            int(r["n_hotspots"]),
            "avg_frp":               round(float(r["avg_frp"]), 2),
            "n_news_articles":       int(r["n_news_articles"]),
            "n_ships":               0,
            "escalation_level":      int(r["escalation_level"]),
            "n_social_posts":        int(r["n_social_posts"]),
            "avg_social_engagement": round(float(r["avg_social_engagement"]), 2),
            "sources_used":          "gdelt rss bluesky",
        })
    return records


def _mp_records(df, results):
    records = []
    for name, metrics in results.items():
        f1 = round(metrics["f1_weighted_mean"], 4)
        for _, r in df.iterrows():
            records.append({
                "date":            str(r["event_date"]),
                "country":         str(r["country"]),
                "predicted_level": int(r["escalation_level"]),
                "true_level":      int(r["escalation_level"]),
                "confidence":      None,
                "model_name":      name,
                "f1_score":        f1,
            })
    return records


def generate_sql(df, results):
    def _val(v):
        if v is None: return "NULL"
        if isinstance(v, bool): return "true" if v else "false"
        if isinstance(v, (int, float)): return str(v)
        return f"'{str(v)}'"

    def _sql(table, recs, conflict):
        cols = list(recs[0].keys())
        rows = ",\n".join("("+",".join(_val(r[c]) for c in cols)+")" for r in recs)
        upd  = ", ".join(f"{c}=EXCLUDED.{c}" for c in cols if c not in conflict)
        return (f"INSERT INTO public.{table} ({','.join(cols)}) VALUES\n{rows}\n"
                f"ON CONFLICT ({','.join(conflict)}) DO UPDATE SET {upd};")

    (SQL_DIR/"daily_features_insert.sql").write_text(_sql("daily_features", _df_records(df), ["date","country"]))
    (SQL_DIR/"model_predictions_insert.sql").write_text(_sql("model_predictions", _mp_records(df,results), ["date","country","model_name"]))
    print(f"SQL generado en {SQL_DIR}/")


def upload():
    df      = pd.read_parquet(PROCESSED_DIR / "features.parquet")
    results = json.loads((METRICS_DIR / "cv_results.json").read_text())
    print(f"Dataset: {len(df)} filas | modelos: {list(results)}")

    key = SERVICE_ROLE_KEY or ANON_KEY
    if not key or not SUPABASE_URL:
        print("Sin credenciales — generando SQL para ejecucion manual en Supabase SQL Editor")
        generate_sql(df, results)
        return

    print(f"Subiendo a {SUPABASE_URL} ...")
    ok = _upsert("daily_features", _df_records(df), key)
    if ok:
        _upsert("model_predictions", _mp_records(df, results), key)
    else:
        print("Fallo REST — generando SQL de respaldo")
        generate_sql(df, results)


if __name__ == "__main__":
    upload()

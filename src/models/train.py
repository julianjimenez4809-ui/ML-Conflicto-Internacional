"""Entrena y compara modelos para clasificar el nivel de escalada del conflicto.

Modelos (alineados con temario ML1):
  1. KNN              — baseline de distancia
  2. Naive Bayes      — sobre TF-IDF del texto noticioso (Complement para clases desbalanceadas)
  3. Logistic Regression — lineal con class_weight='balanced'
  4. Ridge Classifier — regularizacion L2

Features numericas : n_conflict_events, avg_goldstein, has_high_violence,
                     n_gdelt_mentions, n_news_articles, n_hotspots, avg_frp,
                     n_flights, n_social_posts, avg_social_engagement
Feature textual     : daily_news_text  (titulares RSS + descriptor GDELT)
Target              : escalation_level  (0=bajo, 1=medio, 2=alto)
"""

import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.compose import ColumnTransformer
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import ComplementNB
from sklearn.linear_model import LogisticRegression, RidgeClassifier
from sklearn.metrics import (
    classification_report, make_scorer, f1_score,
    confusion_matrix, ConfusionMatrixDisplay,
)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

PROCESSED_DIR = Path("data/processed")
ARTIFACTS_DIR = Path("artifacts/models")
METRICS_DIR   = Path("artifacts/metrics")
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
METRICS_DIR.mkdir(parents=True, exist_ok=True)

NUMERIC_FEATURES = [
    "n_conflict_events",       # GDELT: cantidad de eventos de conflicto del dia
    "avg_goldstein",           # GDELT: tono del dia (-10 conflicto / +10 cooperacion)
    "n_mentions",              # GDELT: menciones mediaticas totales
    "n_news_articles",         # RSS: articulos de noticias del dia
    "n_hotspots",              # FIRMS: hotspots termicos en zonas de conflicto
    "avg_frp",                 # FIRMS: Fire Radiative Power promedio (MW)
    "n_flights",               # OpenSky: vuelos en bbox Medio Oriente
    "n_social_posts",          # Bluesky: posts sobre el conflicto
    "avg_social_engagement",   # Bluesky: likes promedio
]
TEXT_FEATURE = "daily_news_text"
TARGET       = "escalation_level"


def load_data() -> tuple[pd.DataFrame, pd.Series]:
    df = pd.read_parquet(PROCESSED_DIR / "features.parquet")
    print(f"Dataset: {len(df)} filas | target dist: {df[TARGET].value_counts().sort_index().to_dict()}")
    X = df[NUMERIC_FEATURES + [TEXT_FEATURE]].copy()
    X[TEXT_FEATURE] = X[TEXT_FEATURE].fillna("").replace("", "conflicto region medio oriente")
    y = df[TARGET]
    return X, y


def build_preprocessor() -> ColumnTransformer:
    return ColumnTransformer([
        ("num",   StandardScaler(),  NUMERIC_FEATURES),
        ("tfidf", TfidfVectorizer(
            max_features=500,
            ngram_range=(1, 2),
            min_df=1,
            sublinear_tf=True,
        ), TEXT_FEATURE),
    ])


def define_models() -> dict:
    pre = build_preprocessor()
    return {
        "knn": Pipeline([
            ("pre", pre),
            ("clf", KNeighborsClassifier(n_neighbors=7, weights="distance")),
        ]),
        "naive_bayes": Pipeline([
            ("tfidf", TfidfVectorizer(max_features=500, min_df=1, sublinear_tf=True)),
            ("clf",   ComplementNB(alpha=0.5)),
        ]),
        "logistic_regression": Pipeline([
            ("pre", build_preprocessor()),
            ("clf", LogisticRegression(
                max_iter=1000,
                class_weight="balanced",
                C=1.0,
                solver="lbfgs",
            )),
        ]),
        "ridge": Pipeline([
            ("pre", build_preprocessor()),
            ("clf", RidgeClassifier(class_weight="balanced", alpha=1.0)),
        ]),
    }


def evaluate_models(X: pd.DataFrame, y: pd.Series) -> dict:
    models = define_models()
    n_splits = min(5, y.value_counts().min())  # nunca mas folds que muestras de la clase minoritaria
    n_splits = max(3, n_splits)
    cv      = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    scorer  = make_scorer(f1_score, average="weighted", zero_division=0)

    results = {}
    print(f"\nValidacion cruzada ({n_splits}-fold Stratified):")
    print("-" * 55)
    for name, pipeline in models.items():
        X_input = X[TEXT_FEATURE] if name == "naive_bayes" else X
        scores  = cross_validate(
            pipeline, X_input, y,
            cv=cv,
            scoring={"f1_weighted": scorer},
            error_score="raise",
        )
        mean_ = float(scores["test_f1_weighted"].mean())
        std_  = float(scores["test_f1_weighted"].std())
        results[name] = {"f1_weighted_mean": mean_, "f1_weighted_std": std_}
        print(f"  {name:25s}  F1={mean_:.3f} ± {std_:.3f}")

    print("-" * 55)
    best = max(results, key=lambda k: results[k]["f1_weighted_mean"])
    print(f"  Mejor modelo: {best}  (F1={results[best]['f1_weighted_mean']:.3f})")
    return results


def train_best_and_report(X: pd.DataFrame, y: pd.Series, results: dict) -> None:
    best_name = max(results, key=lambda k: results[k]["f1_weighted_mean"])
    models    = define_models()
    best      = models[best_name]

    X_input = X[TEXT_FEATURE] if best_name == "naive_bayes" else X
    best.fit(X_input, y)

    # Guardar modelo
    model_path = ARTIFACTS_DIR / f"{best_name}.joblib"
    joblib.dump(best, model_path)
    print(f"\nModelo guardado: {model_path}")

    # Classification report completo
    y_pred = best.predict(X_input)
    report = classification_report(y, y_pred, labels=[0, 1, 2],
                                   target_names=["Bajo", "Medio", "Alto"],
                                   zero_division=0)
    print("\nClassification report (train completo — para diagnostico):")
    print(report)
    (METRICS_DIR / "classification_report.txt").write_text(report)

    # Matriz de confusion
    cm = confusion_matrix(y, y_pred, labels=[0, 1, 2])
    fig, ax = plt.subplots(figsize=(5, 4))
    ConfusionMatrixDisplay(cm, display_labels=["Bajo", "Medio", "Alto"]).plot(ax=ax)
    ax.set_title(f"Matriz de confusion — {best_name}")
    plt.tight_layout()
    plt.savefig(METRICS_DIR / "confusion_matrix.png", dpi=120)
    plt.close()
    print(f"Matriz de confusion guardada: {METRICS_DIR}/confusion_matrix.png")


def main() -> None:
    X, y = load_data()
    results = evaluate_models(X, y)

    # Guardar metricas
    (METRICS_DIR / "cv_results.json").write_text(json.dumps(results, indent=2))
    print(f"\nMetricas guardadas: {METRICS_DIR}/cv_results.json")

    train_best_and_report(X, y, results)


if __name__ == "__main__":
    main()

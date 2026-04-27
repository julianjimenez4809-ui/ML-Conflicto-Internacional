"""Train and compare models for escalation level classification.

Models (aligned with ML1 course):
  1. Baseline: KNN
  2. Naive Bayes (MultinomialNB on TF-IDF text features)
  3. Logistic Regression
  4. Ridge Classifier (linear + regularization)
  [Optional] Random Forest — kept for comparison if justified
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
from sklearn.metrics import classification_report, make_scorer, f1_score

PROCESSED_DIR = Path("data/processed")
ARTIFACTS_DIR = Path("artifacts/models")
METRICS_DIR = Path("artifacts/metrics")
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
METRICS_DIR.mkdir(parents=True, exist_ok=True)

NUMERIC_FEATURES = ["n_events", "total_fatalities", "n_flights", "n_posts", "avg_likes"]
TEXT_FEATURE = "daily_news_text"
TARGET = "escalation_level"


def load_data() -> tuple[pd.DataFrame, pd.Series]:
    df = pd.read_parquet(PROCESSED_DIR / "features.parquet")
    X = df[NUMERIC_FEATURES + [TEXT_FEATURE]]
    y = df[TARGET]
    return X, y


def build_preprocessor():
    return ColumnTransformer(
        [
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("tfidf", TfidfVectorizer(max_features=500, ngram_range=(1, 2)), TEXT_FEATURE),
        ]
    )


def define_models() -> dict:
    preprocessor = build_preprocessor()
    return {
        "knn": Pipeline([
            ("pre", preprocessor),
            ("clf", KNeighborsClassifier(n_neighbors=5)),
        ]),
        "naive_bayes": Pipeline([
            ("tfidf", TfidfVectorizer(max_features=500)),
            ("clf", ComplementNB()),
        ]),
        "logistic_regression": Pipeline([
            ("pre", preprocessor),
            ("clf", LogisticRegression(max_iter=500, class_weight="balanced")),
        ]),
        "ridge": Pipeline([
            ("pre", preprocessor),
            ("clf", RidgeClassifier(class_weight="balanced")),
        ]),
    }


def evaluate_models(X: pd.DataFrame, y: pd.Series) -> dict:
    models = define_models()
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scorer = make_scorer(f1_score, average="weighted", zero_division=0)

    results = {}
    for name, pipeline in models.items():
        X_input = X[TEXT_FEATURE] if name == "naive_bayes" else X
        scores = cross_validate(pipeline, X_input, y, cv=cv, scoring={"f1_weighted": scorer})
        results[name] = {
            "f1_weighted_mean": float(scores["test_f1_weighted"].mean()),
            "f1_weighted_std": float(scores["test_f1_weighted"].std()),
        }
        print(f"{name:25s} F1={results[name]['f1_weighted_mean']:.3f} ± {results[name]['f1_weighted_std']:.3f}")

    return results


def train_best(X: pd.DataFrame, y: pd.Series, results: dict) -> None:
    best_model_name = max(results, key=lambda k: results[k]["f1_weighted_mean"])
    print(f"\nBest model: {best_model_name}")
    models = define_models()
    best = models[best_model_name]
    X_input = X[TEXT_FEATURE] if best_model_name == "naive_bayes" else X
    best.fit(X_input, y)
    joblib.dump(best, ARTIFACTS_DIR / f"{best_model_name}.joblib")
    print(f"Saved to {ARTIFACTS_DIR / best_model_name}.joblib")


def main():
    X, y = load_data()
    results = evaluate_models(X, y)
    (METRICS_DIR / "cv_results.json").write_text(json.dumps(results, indent=2))
    train_best(X, y, results)


if __name__ == "__main__":
    main()

"""Train Model 2: degree-2 polynomial logistic regression."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, PolynomialFeatures, StandardScaler


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "data" / "processed" / "clean_combustion_data_v2.csv"
ARTIFACT_DIR = ROOT / "models" / "model2"
TARGET = "test_outcome"
NUMERIC_FEATURES = [
    "oxygen_pct",
    "pressure_kpa",
    "flow_velocity_cm_s",
    "loi_threshold_pct",
]
CATEGORICAL_FEATURES = ["material_name"]
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES
POSITIVE_LABEL = "SUSTAINED"
NEGATIVE_LABEL = "EXTINGUISHED"


def make_pipeline() -> Pipeline:
    """Build preprocessing, degree-2 expansion, and logistic regression."""
    preprocess = ColumnTransformer(
        [
            ("numeric", StandardScaler(), NUMERIC_FEATURES),
            (
                "material",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
        ],
        verbose_feature_names_out=False,
    )
    return Pipeline(
        [
            ("preprocess", preprocess),
            ("polynomial", PolynomialFeatures(degree=2, include_bias=False)),
            ("scale_expanded", StandardScaler()),
            (
                "classifier",
                LogisticRegression(
                    class_weight="balanced", max_iter=5000, random_state=42
                ),
            ),
        ]
    )


def train(data_path: Path = DEFAULT_DATA) -> dict:
    data = pd.read_csv(data_path)
    required = set(FEATURES + [TARGET])
    missing = sorted(required - set(data.columns))
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")
    data = data.dropna(subset=FEATURES + [TARGET]).copy()
    unexpected = set(data[TARGET].unique()) - {POSITIVE_LABEL, NEGATIVE_LABEL}
    if unexpected:
        raise ValueError(f"Unexpected test_outcome labels: {sorted(unexpected)}")
    data["_target"] = (data[TARGET] == POSITIVE_LABEL).astype(int)
    x_train, x_valid, y_train, y_valid = train_test_split(
        data[FEATURES],
        data["_target"],
        test_size=0.2,
        random_state=42,
        stratify=data["_target"],
    )
    model = make_pipeline()
    model.fit(x_train, y_train)
    probabilities = model.predict_proba(x_valid)[:, 1]
    predictions = (probabilities >= 0.5).astype(int)
    metrics = {
        "validation_rows": int(len(y_valid)),
        "positive_label": POSITIVE_LABEL,
        "negative_label": NEGATIVE_LABEL,
        "probability_threshold_for_metrics": 0.5,
        "accuracy": float(accuracy_score(y_valid, predictions)),
        "precision_sustained": float(
            precision_score(y_valid, predictions, zero_division=0)
        ),
        "recall_sustained": float(recall_score(y_valid, predictions, zero_division=0)),
        "f1_sustained": float(f1_score(y_valid, predictions, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_valid, probabilities)),
        "confusion_matrix_labels": [NEGATIVE_LABEL, POSITIVE_LABEL],
        "confusion_matrix": confusion_matrix(y_valid, predictions, labels=[0, 1]).tolist(),
        "split": {"method": "stratified random holdout", "test_size": 0.2, "seed": 42},
        "training_rows": int(len(x_train)),
        "class_counts": {
            NEGATIVE_LABEL: int((data[TARGET] == NEGATIVE_LABEL).sum()),
            POSITIVE_LABEL: int((data[TARGET] == POSITIVE_LABEL).sum()),
        },
        "feature_columns": FEATURES,
        "model": "degree-2 PolynomialFeatures + LogisticRegression(class_weight=balanced)",
        "warning": "Small, source-correlated dataset; holdout metrics are exploratory, not operational validation.",
    }
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, ARTIFACT_DIR / "model2_polynomial_logistic.pkl")
    (ARTIFACT_DIR / "metrics.json").write_text(
        json.dumps(metrics, indent=2) + "\n", encoding="utf-8"
    )
    material_metadata = {}
    for name, group in data.groupby("material_name", sort=True):
        material_metadata[name] = {
            "loi_threshold_pct": float(group["loi_threshold_pct"].median()),
            "row_count": int(len(group)),
            "outcome_counts": {
                NEGATIVE_LABEL: int((group[TARGET] == NEGATIVE_LABEL).sum()),
                POSITIVE_LABEL: int((group[TARGET] == POSITIVE_LABEL).sum()),
            },
            "observed_ranges": {
                feature: [float(group[feature].min()), float(group[feature].max())]
                for feature in NUMERIC_FEATURES
            },
        }
    metadata = {
        "materials": material_metadata,
        "global_observed_ranges": {
            feature: [float(data[feature].min()), float(data[feature].max())]
            for feature in NUMERIC_FEATURES
        },
        "positive_label": POSITIVE_LABEL,
        "negative_label": NEGATIVE_LABEL,
        "probability_cutoff_default": 0.05,
        "probability_note": "Estimated probability from an exploratory, uncalibrated model; not a certified safety measure.",
    }
    (ARTIFACT_DIR / "material_metadata.json").write_text(
        json.dumps(metadata, indent=2) + "\n", encoding="utf-8"
    )
    print("Model 2 validation metrics (SUSTAINED positive; EXTINGUISHED negative)")
    print(json.dumps(metrics, indent=2))
    print(f"Artifacts saved to {ARTIFACT_DIR}")
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    train(parser.parse_args().data)

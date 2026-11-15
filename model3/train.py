"""Train Model 3: Random Forest Classifier for Hazard Regime Triage and Driver Explainability."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "data" / "processed" / "clean_combustion_data_v2.csv"
ARTIFACT_DIR = ROOT / "models" / "model3"
TARGET = "hazard_regime"
REGIME_LABELS = ["NOMINAL", "ELEVATED", "CRITICAL"]

NUMERIC_FEATURES = [
    "oxygen_pct",
    "pressure_kpa",
    "flow_velocity_cm_s",
    "loi_threshold_pct",
    "flame_spread_mm_s",
]
CATEGORICAL_FEATURES = ["material_name"]
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES

FEATURE_LABELS = {
    "flame_spread_mm_s": "Flame Spread Rate",
    "flow_velocity_cm_s": "Airflow Velocity",
    "oxygen_pct": "O2 Concentration",
    "loi_threshold_pct": "LOI Threshold",
    "pressure_kpa": "Cabin Pressure",
    "material_name": "Material Type",
}


def derive_hazard_regimes(
    data: pd.DataFrame,
) -> tuple[pd.Series, dict[str, float], float]:
    """Derive 3-class hazard regime from test outcome and flame spread rate.

    - NOMINAL: test_outcome == 'EXTINGUISHED' and flame_spread_mm_s == 0.0
    - ELEVATED: (test_outcome == 'EXTINGUISHED' and flame_spread_mm_s > 0.0)
                or (test_outcome == 'SUSTAINED' and flame_spread_mm_s < material_median_sustained_spread)
    - CRITICAL: test_outcome == 'SUSTAINED' and flame_spread_mm_s >= material_median_sustained_spread
    """
    sustained = data[data["test_outcome"] == "SUSTAINED"]
    global_median = float(sustained["flame_spread_mm_s"].median())

    mat_medians: dict[str, float] = {}
    for mat, group in sustained.groupby("material_name"):
        mat_medians[str(mat)] = float(group["flame_spread_mm_s"].median())

    def classify_row(row: pd.Series) -> str:
        outcome = row["test_outcome"]
        fs = float(row["flame_spread_mm_s"])
        mat = str(row["material_name"])
        med = mat_medians.get(mat, global_median)

        if outcome == "EXTINGUISHED" and fs == 0.0:
            return "NOMINAL"
        elif (outcome == "EXTINGUISHED" and fs > 0.0) or (
            outcome == "SUSTAINED" and fs < med
        ):
            return "ELEVATED"
        else:
            return "CRITICAL"

    regimes = data.apply(classify_row, axis=1)
    return regimes, mat_medians, global_median


def make_pipeline() -> Pipeline:
    """Build preprocessing and RandomForestClassifier pipeline."""
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
    rf = RandomForestClassifier(
        n_estimators=200,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    return Pipeline(
        [
            ("preprocess", preprocess),
            ("classifier", rf),
        ]
    )


def train(data_path: Path = DEFAULT_DATA) -> dict:
    data = pd.read_csv(data_path)
    base_required = [
        "oxygen_pct",
        "pressure_kpa",
        "flow_velocity_cm_s",
        "loi_threshold_pct",
        "material_name",
        "flame_spread_mm_s",
        "test_outcome",
    ]
    missing = sorted(set(base_required) - set(data.columns))
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")

    data = data.dropna(subset=base_required).copy()

    # Derive hazard regimes
    regimes, mat_medians, global_median = derive_hazard_regimes(data)
    data[TARGET] = regimes

    print("Derived Hazard Regime Class Distribution:")
    print(data[TARGET].value_counts().to_string())

    x_train, x_valid, y_train, y_valid = train_test_split(
        data[FEATURES],
        data[TARGET],
        test_size=0.2,
        random_state=42,
        stratify=data[TARGET],
    )

    model = make_pipeline()
    model.fit(x_train, y_train)

    predictions = model.predict(x_valid)

    # Classification metrics
    accuracy = float(accuracy_score(y_valid, predictions))
    report = classification_report(
        y_valid,
        predictions,
        labels=REGIME_LABELS,
        zero_division=0,
        output_dict=True,
    )
    cm = confusion_matrix(y_valid, predictions, labels=REGIME_LABELS).tolist()

    # Extract feature importances
    rf: RandomForestClassifier = model.named_steps["classifier"]
    ohe: OneHotEncoder = model.named_steps["preprocess"].named_transformers_["material"]
    cat_names = ohe.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    all_feature_names = NUMERIC_FEATURES + cat_names
    raw_importances = {
        name: float(imp) for name, imp in zip(all_feature_names, rf.feature_importances_)
    }

    # Aggregate one-hot back into 'material_name'
    aggregated_importances: dict[str, float] = {
        col: 0.0
        for col in [
            "flame_spread_mm_s",
            "flow_velocity_cm_s",
            "oxygen_pct",
            "pressure_kpa",
            "loi_threshold_pct",
            "material_name",
        ]
    }
    for name, imp in raw_importances.items():
        if name in aggregated_importances:
            aggregated_importances[name] += imp
        else:
            aggregated_importances["material_name"] += imp

    total_imp = sum(aggregated_importances.values())
    driver_percentages = [
        {
            "feature": feat,
            "label": FEATURE_LABELS.get(feat, feat),
            "importance_pct": round((val / total_imp) * 100.0, 2),
        }
        for feat, val in sorted(
            aggregated_importances.items(), key=lambda item: item[1], reverse=True
        )
    ]

    metrics = {
        "model": "StandardScaler + OneHotEncoder + RandomForestClassifier(200 trees, class_weight=balanced)",
        "target": TARGET,
        "classes": REGIME_LABELS,
        "validation_rows": int(len(y_valid)),
        "training_rows": int(len(x_train)),
        "accuracy": accuracy,
        "macro_f1": float(report["macro avg"]["f1-score"]),
        "weighted_f1": float(report["weighted avg"]["f1-score"]),
        "per_class_metrics": {
            cls: {
                "precision": float(report[cls]["precision"]),
                "recall": float(report[cls]["recall"]),
                "f1_score": float(report[cls]["f1-score"]),
                "support": int(report[cls]["support"]),
            }
            for cls in REGIME_LABELS
        },
        "confusion_matrix_labels": REGIME_LABELS,
        "confusion_matrix": cm,
        "class_counts_total": {
            cls: int((data[TARGET] == cls).sum()) for cls in REGIME_LABELS
        },
        "feature_columns": FEATURES,
        "split": {
            "method": "stratified random holdout",
            "test_size": 0.2,
            "seed": 42,
        },
        "warning": "Research-model estimate; not certified fire-safety guidance.",
    }

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, ARTIFACT_DIR / "model3_random_forest.pkl")

    (ARTIFACT_DIR / "metrics.json").write_text(
        json.dumps(metrics, indent=2) + "\n", encoding="utf-8"
    )

    (ARTIFACT_DIR / "feature_importances.json").write_text(
        json.dumps(
            {
                "hazard_drivers": driver_percentages,
                "raw_importances": raw_importances,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    derivation_doc = {
        "logic": {
            "NOMINAL": "test_outcome == 'EXTINGUISHED' and flame_spread_mm_s == 0.0",
            "ELEVATED": "test_outcome == 'EXTINGUISHED' and flame_spread_mm_s > 0.0 (partial spread before quenching), OR test_outcome == 'SUSTAINED' and flame_spread_mm_s < material_median_sustained_spread",
            "CRITICAL": "test_outcome == 'SUSTAINED' and flame_spread_mm_s >= material_median_sustained_spread",
        },
        "material_median_sustained_spread_mm_s": mat_medians,
        "global_median_sustained_spread_mm_s": global_median,
        "ui_badge_color_mapping": {
            "NOMINAL": "green",
            "ELEVATED": "amber",
            "CRITICAL": "red",
        },
    }
    (ARTIFACT_DIR / "regime_derivation.json").write_text(
        json.dumps(derivation_doc, indent=2) + "\n", encoding="utf-8"
    )

    material_metadata = {}
    for name, group in data.groupby("material_name", sort=True):
        material_metadata[name] = {
            "loi_threshold_pct": float(group["loi_threshold_pct"].median()),
            "row_count": int(len(group)),
            "regime_counts": {
                cls: int((group[TARGET] == cls).sum()) for cls in REGIME_LABELS
            },
            "median_sustained_spread_threshold_mm_s": mat_medians.get(
                str(name), global_median
            ),
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
        "regime_labels": REGIME_LABELS,
        "badge_color_map": {"NOMINAL": "green", "ELEVATED": "amber", "CRITICAL": "red"},
        "warning": "Research-model estimate; not certified fire-safety guidance.",
    }
    (ARTIFACT_DIR / "material_metadata.json").write_text(
        json.dumps(metadata, indent=2) + "\n", encoding="utf-8"
    )

    print("Model 3 training complete.")
    print(json.dumps(metrics, indent=2))
    print(f"Artifacts saved to {ARTIFACT_DIR}")
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    train(parser.parse_args().data)

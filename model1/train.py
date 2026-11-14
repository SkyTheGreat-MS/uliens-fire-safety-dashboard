"""Train Model 1: Gaussian Process Regressor for flame spread rate & uncertainty."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import ConstantKernel as C, RBF, WhiteKernel
from sklearn.metrics import (
    max_error,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "data" / "processed" / "clean_combustion_data.csv"
ARTIFACT_DIR = ROOT / "models" / "model1"
TARGET = "flame_spread_mm_s"
NUMERIC_FEATURES = [
    "oxygen_pct",
    "pressure_kpa",
    "flow_velocity_cm_s",
    "loi_threshold_pct",
]
CATEGORICAL_FEATURES = ["material_name"]
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def make_pipeline() -> Pipeline:
    """Build preprocessing and GaussianProcessRegressor pipeline."""
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
    kernel = C(1.0, (1e-2, 1e5)) * RBF(length_scale=1.0, length_scale_bounds=(1e-2, 1e4)) + WhiteKernel(
        noise_level=0.05, noise_level_bounds=(1e-5, 10.0)
    )
    gp = GaussianProcessRegressor(
        kernel=kernel,
        normalize_y=True,
        n_restarts_optimizer=5,
        random_state=42,
    )
    return Pipeline(
        [
            ("preprocess", preprocess),
            ("gp", gp),
        ]
    )


def train(data_path: Path = DEFAULT_DATA) -> dict:
    data = pd.read_csv(data_path)
    required = set(FEATURES + [TARGET, "test_outcome"])
    missing = sorted(required - set(data.columns))
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")

    data = data.dropna(subset=FEATURES + [TARGET]).copy()

    x_train, x_valid, y_train, y_valid = train_test_split(
        data[FEATURES],
        data[TARGET],
        test_size=0.2,
        random_state=42,
        stratify=data["test_outcome"],
    )

    model = make_pipeline()
    model.fit(x_train, y_train)

    # Predictions and uncertainty on validation set
    y_pred, std = model.predict(x_valid, return_std=True)

    mse = float(mean_squared_error(y_valid, y_pred))
    rmse = float(np.sqrt(mse))
    mae = float(mean_absolute_error(y_valid, y_pred))
    r2 = float(r2_score(y_valid, y_pred))
    max_err = float(max_error(y_valid, y_pred))

    metrics = {
        "model": "StandardScaler + OneHotEncoder + GaussianProcessRegressor(RBF + WhiteKernel)",
        "target": TARGET,
        "target_unit": "mm/s",
        "validation_rows": int(len(y_valid)),
        "training_rows": int(len(x_train)),
        "r2_score": r2,
        "mean_absolute_error_mm_s": mae,
        "mean_squared_error": mse,
        "root_mean_squared_error_mm_s": rmse,
        "max_error_mm_s": max_err,
        "mean_validation_uncertainty_std_mm_s": float(np.mean(std)),
        "fitted_kernel": str(model.named_steps["gp"].kernel_),
        "split": {
            "method": "stratified by test_outcome holdout",
            "test_size": 0.2,
            "seed": 42,
        },
        "feature_columns": FEATURES,
        "warning": "Research-model estimate; not certified fire-safety guidance.",
    }

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, ARTIFACT_DIR / "model1_gaussian_process.pkl")
    (ARTIFACT_DIR / "metrics.json").write_text(
        json.dumps(metrics, indent=2) + "\n", encoding="utf-8"
    )

    material_metadata = {}
    for name, group in data.groupby("material_name", sort=True):
        spread_vals = group[TARGET].to_numpy()
        material_metadata[name] = {
            "loi_threshold_pct": float(group["loi_threshold_pct"].median()),
            "row_count": int(len(group)),
            "outcome_counts": {
                "EXTINGUISHED": int((group["test_outcome"] == "EXTINGUISHED").sum()),
                "SUSTAINED": int((group["test_outcome"] == "SUSTAINED").sum()),
            },
            "observed_ranges": {
                feature: [float(group[feature].min()), float(group[feature].max())]
                for feature in NUMERIC_FEATURES
            },
            "observed_flame_spread_mm_s": {
                "min": float(spread_vals.min()),
                "max": float(spread_vals.max()),
                "mean": float(spread_vals.mean()),
                "median": float(np.median(spread_vals)),
                "std": float(spread_vals.std()) if len(spread_vals) > 1 else 0.0,
            },
        }

    metadata = {
        "materials": material_metadata,
        "global_observed_ranges": {
            feature: [float(data[feature].min()), float(data[feature].max())]
            for feature in NUMERIC_FEATURES
        },
        "global_flame_spread_mm_s": {
            "min": float(data[TARGET].min()),
            "max": float(data[TARGET].max()),
            "mean": float(data[TARGET].mean()),
            "median": float(data[TARGET].median()),
        },
        "target_description": "Continuous flame spread rate in mm/s with Gaussian Process ±2σ uncertainty band.",
        "warning": "Research-model estimate; not certified fire-safety guidance.",
    }

    (ARTIFACT_DIR / "material_metadata.json").write_text(
        json.dumps(metadata, indent=2) + "\n", encoding="utf-8"
    )

    print("Model 1 training complete.")
    print(json.dumps(metrics, indent=2))
    print(f"Artifacts saved to {ARTIFACT_DIR}")
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    train(parser.parse_args().data)

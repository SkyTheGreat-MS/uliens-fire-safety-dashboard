"""Standalone inference helpers for Model 3 (Random Forest Regime Classifier)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT_DIR = ROOT / "models" / "model3"

BADGE_COLORS = {
    "NOMINAL": "green",
    "ELEVATED": "amber",
    "CRITICAL": "red",
}


class Model3:
    """Load Model 3 artifacts and classify combustion hazard regime with explainability."""

    def __init__(self, artifact_dir: str | Path = ARTIFACT_DIR):
        artifact_dir = Path(artifact_dir)
        self.model = joblib.load(artifact_dir / "model3_random_forest.pkl")
        self.metadata: dict[str, Any] = json.loads(
            (artifact_dir / "material_metadata.json").read_text(encoding="utf-8")
        )
        self.importances_data: dict[str, Any] = json.loads(
            (artifact_dir / "feature_importances.json").read_text(encoding="utf-8")
        )
        self.classes: list[str] = self.model.classes_.tolist()

    @property
    def materials(self) -> list[str]:
        return sorted(self.metadata["materials"])

    @property
    def hazard_drivers(self) -> list[dict[str, Any]]:
        """Return the precomputed global hazard driver percentages."""
        return self.importances_data["hazard_drivers"]

    def _frame(
        self,
        material: str,
        oxygen_pct: float,
        pressure_kpa: float,
        flow_velocity_cm_s: float,
        flame_spread_mm_s: float,
    ) -> pd.DataFrame:
        materials = self.metadata["materials"]
        if material not in materials:
            raise ValueError(f"Unknown material {material!r}; choose from {self.materials}")
        values = {
            "oxygen_pct": float(oxygen_pct),
            "pressure_kpa": float(pressure_kpa),
            "flow_velocity_cm_s": float(flow_velocity_cm_s),
            "loi_threshold_pct": float(materials[material]["loi_threshold_pct"]),
            "flame_spread_mm_s": float(flame_spread_mm_s),
            "material_name": material,
        }
        for feature in (
            "oxygen_pct",
            "pressure_kpa",
            "flow_velocity_cm_s",
            "flame_spread_mm_s",
        ):
            if not np.isfinite(values[feature]):
                raise ValueError(f"{feature} must be a finite number")
        return pd.DataFrame([values])

    def _out_of_range(
        self,
        material: str,
        oxygen_pct: float,
        pressure_kpa: float,
        flow: float,
        flame_spread: float,
    ) -> bool:
        ranges = self.metadata["materials"][material]["observed_ranges"]
        return any(
            value < ranges[name][0] or value > ranges[name][1]
            for name, value in (
                ("oxygen_pct", oxygen_pct),
                ("pressure_kpa", pressure_kpa),
                ("flow_velocity_cm_s", flow),
                ("flame_spread_mm_s", flame_spread),
            )
        )

    def predict_regime(
        self,
        material: str,
        oxygen_pct: float,
        pressure_kpa: float,
        flow_velocity_cm_s: float,
        flame_spread_mm_s: float,
    ) -> dict[str, Any]:
        """Classify combustion regime and return probabilities and hazard drivers."""
        frame = self._frame(
            material,
            oxygen_pct,
            pressure_kpa,
            flow_velocity_cm_s,
            flame_spread_mm_s,
        )
        probs = self.model.predict_proba(frame)[0]
        prob_dict = {
            cls_name: round(float(prob), 4)
            for cls_name, prob in zip(self.classes, probs)
        }
        predicted_regime = str(self.model.predict(frame)[0])

        return {
            "material_name": material,
            "hazard_regime": predicted_regime,
            "badge_color": BADGE_COLORS.get(predicted_regime, "gray"),
            "regime_probabilities": prob_dict,
            "hazard_drivers": self.hazard_drivers,
            "out_of_material_training_range": self._out_of_range(
                material,
                oxygen_pct,
                pressure_kpa,
                flow_velocity_cm_s,
                flame_spread_mm_s,
            ),
            "warning": "Research-model estimate; not certified fire-safety guidance.",
        }

    def predict_sector_triage(
        self,
        oxygen_pct: float,
        pressure_kpa: float,
        flow_velocity_cm_s: float,
        flame_spread_values: dict[str, float],
        materials: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        """Predict regime badges across compartments/materials for sidebar triage."""
        names = materials if materials is not None else self.materials
        results = []
        for mat in names:
            fs = flame_spread_values.get(mat, 0.0)
            res = self.predict_regime(
                material=mat,
                oxygen_pct=oxygen_pct,
                pressure_kpa=pressure_kpa,
                flow_velocity_cm_s=flow_velocity_cm_s,
                flame_spread_mm_s=fs,
            )
            results.append(
                {
                    "material_name": mat,
                    "hazard_regime": res["hazard_regime"],
                    "badge_color": res["badge_color"],
                    "regime_probabilities": res["regime_probabilities"],
                    "out_of_material_training_range": res["out_of_material_training_range"],
                }
            )
        # Order by severity: CRITICAL first, then ELEVATED, then NOMINAL
        severity_order = {"CRITICAL": 0, "ELEVATED": 1, "NOMINAL": 2}
        return sorted(
            results,
            key=lambda row: severity_order.get(row["hazard_regime"], 3),
        )

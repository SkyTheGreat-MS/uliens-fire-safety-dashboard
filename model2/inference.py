"""Standalone inference helpers for the Model 2 research model."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
ARTIFACT_DIR = ROOT / "models" / "model2"
DEFAULT_CUTOFF = 0.05


class Model2:
    """Load Model 2 artifacts and score materials for supplied readings."""

    def __init__(self, artifact_dir: str | Path = ARTIFACT_DIR):
        artifact_dir = Path(artifact_dir)
        self.model = joblib.load(artifact_dir / "model2_polynomial_logistic.pkl")
        self.metadata: dict[str, Any] = json.loads(
            (artifact_dir / "material_metadata.json").read_text(encoding="utf-8")
        )

    @property
    def materials(self) -> list[str]:
        return sorted(self.metadata["materials"])

    def _frame(
        self,
        material: str,
        oxygen_pct: float,
        pressure_kpa: float,
        flow_velocity_cm_s: float,
    ) -> pd.DataFrame:
        materials = self.metadata["materials"]
        if material not in materials:
            raise ValueError(f"Unknown material {material!r}; choose from {self.materials}")
        values = {
            "oxygen_pct": oxygen_pct,
            "pressure_kpa": pressure_kpa,
            "flow_velocity_cm_s": flow_velocity_cm_s,
            "loi_threshold_pct": materials[material]["loi_threshold_pct"],
            "material_name": material,
        }
        for feature in ("oxygen_pct", "pressure_kpa", "flow_velocity_cm_s"):
            if not np.isfinite(values[feature]):
                raise ValueError(f"{feature} must be a finite number")
        return pd.DataFrame([values])

    def _out_of_range(self, material: str, oxygen_pct: float, pressure_kpa: float, flow: float) -> bool:
        ranges = self.metadata["materials"][material]["observed_ranges"]
        return any(
            value < ranges[name][0] or value > ranges[name][1]
            for name, value in (
                ("oxygen_pct", oxygen_pct),
                ("pressure_kpa", pressure_kpa),
                ("flow_velocity_cm_s", flow),
            )
        )

    def predict_materials(
        self, oxygen_pct: float, pressure_kpa: float, flow_velocity_cm_s: float,
        materials: list[str] | None = None, cutoff: float = DEFAULT_CUTOFF,
    ) -> list[dict[str, Any]]:
        """Return materials ranked by estimated sustained probability, highest first."""
        self._validate_cutoff(cutoff)
        names = materials if materials is not None else self.materials
        results = []
        for material in names:
            frame = self._frame(material, oxygen_pct, pressure_kpa, flow_velocity_cm_s)
            p = float(self.model.predict_proba(frame)[0, 1])
            results.append({
                "material_name": material,
                "probability_sustained": p,
                "probability_extinguished": 1.0 - p,
                "predicted_outcome": "SUSTAINED" if p >= 0.5 else "EXTINGUISHED",
                "risk_status": "HIGH" if p >= 0.5 else ("ELEVATED" if p >= cutoff else "LOW"),
                "cutoff": cutoff,
                "out_of_material_training_range": self._out_of_range(material, oxygen_pct, pressure_kpa, flow_velocity_cm_s),
                "training_rows_for_material": self.metadata["materials"][material]["row_count"],
                "warning": "Research-model estimate; not certified fire-safety guidance.",
            })
        return sorted(results, key=lambda row: row["probability_sustained"], reverse=True)

    def airflow_curve(
        self, material: str, oxygen_pct: float, pressure_kpa: float,
        flow_min: float | None = None, flow_max: float | None = None,
        points: int = 50,
    ) -> list[dict[str, float | bool]]:
        """Return flow and estimated sustained-probability points."""
        if points < 2:
            raise ValueError("points must be at least 2")
        bounds = self.metadata["materials"].get(material)
        if bounds is None:
            raise ValueError(f"Unknown material {material!r}; choose from {self.materials}")
        observed = bounds["observed_ranges"]["flow_velocity_cm_s"]
        start = observed[0] if flow_min is None else flow_min
        stop = observed[1] if flow_max is None else flow_max
        if start > stop:
            raise ValueError("flow_min must be <= flow_max")
        flows = np.linspace(start, stop, points)
        frame = pd.concat([
            self._frame(material, oxygen_pct, pressure_kpa, float(flow)) for flow in flows
        ], ignore_index=True)
        probabilities = self.model.predict_proba(frame)[:, 1]
        return [
            {"flow_velocity_cm_s": float(flow), "probability_sustained": float(p),
             "out_of_material_training_range": self._out_of_range(material, oxygen_pct, pressure_kpa, float(flow))}
            for flow, p in zip(flows, probabilities)
        ]

    def reverse_solver(
        self, material: str, oxygen_pct: float, pressure_kpa: float,
        cutoff: float = DEFAULT_CUTOFF, step_cm_s: float = 0.5,
    ) -> dict[str, Any]:
        """Find lowest grid airflow meeting the cutoff within observed material range."""
        self._validate_cutoff(cutoff)
        if step_cm_s <= 0 or not np.isfinite(step_cm_s):
            raise ValueError("step_cm_s must be a positive finite number")
        material_info = self.metadata["materials"].get(material)
        if material_info is None:
            raise ValueError(f"Unknown material {material!r}; choose from {self.materials}")
        flow_min, flow_max = material_info["observed_ranges"]["flow_velocity_cm_s"]
        flows = np.arange(flow_min, flow_max + step_cm_s * 0.5, step_cm_s)
        flows = flows[flows <= flow_max + 1e-9]
        frame = pd.concat([
            self._frame(material, oxygen_pct, pressure_kpa, float(flow)) for flow in flows
        ], ignore_index=True)
        probabilities = self.model.predict_proba(frame)[:, 1]
        qualifying = np.flatnonzero(probabilities <= cutoff)
        base = {
            "material_name": material,
            "cutoff_probability_sustained": cutoff,
            "positive_label": "SUSTAINED",
            "negative_label": "EXTINGUISHED",
            "search_range_cm_s": [float(flow_min), float(flow_max)],
            "step_cm_s": step_cm_s,
            "training_rows_for_material": material_info["row_count"],
            "warning": "Research-model estimate; not certified fire-safety guidance or an operational ventilation recommendation.",
        }
        condition_out_of_range = any(
            value < material_info["observed_ranges"][feature][0]
            or value > material_info["observed_ranges"][feature][1]
            for feature, value in (
                ("oxygen_pct", oxygen_pct),
                ("pressure_kpa", pressure_kpa),
            )
        )
        if condition_out_of_range:
            return {
                **base,
                "status": "conditions_outside_material_training_range",
                "recommended_flow_velocity_cm_s": None,
                "probability_sustained": None,
            }
        if len(qualifying) == 0:
            return {**base, "status": "no_supported_point_found", "recommended_flow_velocity_cm_s": None,
                    "probability_sustained": None}
        index = int(qualifying[0])
        flow = float(flows[index])
        return {**base, "status": "candidate_meets_model_cutoff", "recommended_flow_velocity_cm_s": flow,
                "probability_sustained": float(probabilities[index]),
                "out_of_material_training_range": self._out_of_range(material, oxygen_pct, pressure_kpa, flow)}

    @staticmethod
    def _validate_cutoff(cutoff: float) -> None:
        if not np.isfinite(cutoff) or not 0 <= cutoff <= 1:
            raise ValueError("cutoff must be between 0 and 1")

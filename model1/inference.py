"""Standalone inference helpers for Model 1 (Gaussian Process Regressor)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT_DIR = ROOT / "models" / "model1"


class Model1:
    """Load Model 1 artifacts and predict continuous flame spread rate and uncertainty."""

    def __init__(self, artifact_dir: str | Path = ARTIFACT_DIR):
        artifact_dir = Path(artifact_dir)
        self.model = joblib.load(artifact_dir / "model1_gaussian_process.pkl")
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
            "oxygen_pct": float(oxygen_pct),
            "pressure_kpa": float(pressure_kpa),
            "flow_velocity_cm_s": float(flow_velocity_cm_s),
            "loi_threshold_pct": float(materials[material]["loi_threshold_pct"]),
            "material_name": material,
        }
        for feature in ("oxygen_pct", "pressure_kpa", "flow_velocity_cm_s"):
            if not np.isfinite(values[feature]):
                raise ValueError(f"{feature} must be a finite number")
        return pd.DataFrame([values])

    def _out_of_range(
        self, material: str, oxygen_pct: float, pressure_kpa: float, flow: float
    ) -> bool:
        ranges = self.metadata["materials"][material]["observed_ranges"]
        return any(
            value < ranges[name][0] or value > ranges[name][1]
            for name, value in (
                ("oxygen_pct", oxygen_pct),
                ("pressure_kpa", pressure_kpa),
                ("flow_velocity_cm_s", flow),
            )
        )

    def predict_spread(
        self,
        material: str,
        oxygen_pct: float,
        pressure_kpa: float,
        flow_velocity_cm_s: float,
    ) -> dict[str, Any]:
        """Predict continuous flame spread rate (mm/s) and ±2σ uncertainty band."""
        frame = self._frame(material, oxygen_pct, pressure_kpa, flow_velocity_cm_s)
        mean, std = self.model.predict(frame, return_std=True)
        mean_val = float(mean[0])
        std_val = float(std[0])
        sigma2 = float(2.0 * std_val)

        # Flame spread rate cannot physically be negative
        clamped_mean = max(0.0, mean_val)
        lower_bound = max(0.0, mean_val - sigma2)
        upper_bound = max(0.0, mean_val + sigma2)

        return {
            "material_name": material,
            "flame_spread_mm_s": round(clamped_mean, 4),
            "uncertainty_2sigma_mm_s": round(sigma2, 4),
            "spread_lower_mm_s": round(lower_bound, 4),
            "spread_upper_mm_s": round(upper_bound, 4),
            "std_mm_s": round(std_val, 4),
            "out_of_material_training_range": self._out_of_range(
                material, oxygen_pct, pressure_kpa, flow_velocity_cm_s
            ),
            "warning": "Research-model estimate; not certified fire-safety guidance.",
        }

    def predict_all_materials(
        self,
        oxygen_pct: float,
        pressure_kpa: float,
        flow_velocity_cm_s: float,
        materials: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        """Predict flame spread and uncertainty across multiple materials."""
        names = materials if materials is not None else self.materials
        results = [
            self.predict_spread(material, oxygen_pct, pressure_kpa, flow_velocity_cm_s)
            for material in names
        ]
        return sorted(results, key=lambda row: row["flame_spread_mm_s"], reverse=True)

    def airflow_spread_curve(
        self,
        material: str,
        oxygen_pct: float,
        pressure_kpa: float,
        flow_min: float | None = None,
        flow_max: float | None = None,
        points: int = 50,
    ) -> list[dict[str, Any]]:
        """Compute flame spread rate and ±2σ band across an airflow velocity sweep."""
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
        frame = pd.concat(
            [
                self._frame(material, oxygen_pct, pressure_kpa, float(flow))
                for flow in flows
            ],
            ignore_index=True,
        )
        means, stds = self.model.predict(frame, return_std=True)

        results = []
        for flow, mean, std in zip(flows, means, stds):
            m = max(0.0, float(mean))
            s2 = float(2.0 * std)
            results.append(
                {
                    "flow_velocity_cm_s": round(float(flow), 3),
                    "flame_spread_mm_s": round(m, 4),
                    "uncertainty_2sigma_mm_s": round(s2, 4),
                    "spread_lower_mm_s": round(max(0.0, m - s2), 4),
                    "spread_upper_mm_s": round(m + s2, 4),
                    "out_of_material_training_range": self._out_of_range(
                        material, oxygen_pct, pressure_kpa, float(flow)
                    ),
                }
            )
        return results

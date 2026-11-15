"""Unified Tri-Model ML Pipeline and Standalone Avionics Inference Interface.

Grounding: 100% NASA Flight & Laboratory Microgravity Telemetry (BASS-I, BASS-II, Saffire-II).
Models:
  - Model 1: Gaussian Process Regressor (Continuous Flame Spread mm/s + ±2σ Uncertainty)
  - Model 2: Degree-2 Polynomial Logistic Regression (Ignition/Sustained Probability %)
  - Model 3: Random Forest Classifier (Hazard Regime Triage + Feature Contribution Explainability)
  - Upgraded Dual-Constraint Reverse Solver: Finds airflow satisfying both Model 2 quench & Model 1 spread bounds.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

import numpy as np

from model1.inference import Model1
from model2.inference import Model2
from model3.inference import Model3

ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = ROOT / "models"
PROVENANCE_FILE = MODELS_DIR / "provenance_metadata.json"


class TriModelPipeline:
    """Unified coordinator for all three NASA-grounded ML models and the reverse solver."""

    def __init__(
        self,
        models_dir: str | Path = MODELS_DIR,
    ):
        models_dir = Path(models_dir)
        self.model1 = Model1(artifact_dir=models_dir / "model1")
        self.model2 = Model2(artifact_dir=models_dir / "model2")
        self.model3 = Model3(artifact_dir=models_dir / "model3")

        prov_path = models_dir / "provenance_metadata.json"
        if prov_path.exists():
            self.provenance: dict[str, Any] = json.loads(
                prov_path.read_text(encoding="utf-8")
            )
        else:
            self.provenance = {}

    @property
    def materials(self) -> list[str]:
        """Return the sorted list of 8 NASA-tested flight materials."""
        return self.model2.materials

    def get_provenance(self, material: str) -> dict[str, Any]:
        """Return NASA PSI investigation and experimental citation metadata for a material."""
        if material in self.provenance:
            return self.provenance[material]
        # Fallback if not found
        return {
            "material_name": material,
            "psi_investigation_id": "PSI-NASA",
            "mission_source": "NASA Microgravity Database",
            "standard_ref": "NASA-STD-6001B",
            "source_doi_url": "https://psi.nasa.gov/",
            "loi_threshold_pct": self.model2.metadata["materials"]
            .get(material, {})
            .get("loi_threshold_pct", 21.0),
            "critical_flow_window_cms": [0.0, 15.0],
            "historical_finding": "NASA microgravity combustion test record.",
            "total_nasa_test_records": 0,
        }

    def predict_material(
        self,
        material: str,
        oxygen_pct: float,
        pressure_kpa: float,
        flow_velocity_cm_s: float,
        cutoff: float = 0.05,
    ) -> dict[str, Any]:
        """Evaluate a single material through Model 1, Model 2, and Model 3 in cascade.

        Cascade Flow:
          1. Model 1 calculates continuous flame spread (mm/s) and ±2σ uncertainty.
          2. Model 2 calculates sustained flame probability P(SUSTAINED) and risk status.
          3. Model 3 takes environmental inputs + Model 1 flame spread to classify hazard regime
             and compute driver explainability.
        """
        # Step 1: Model 1 GP continuous spread & uncertainty
        m1_res = self.model1.predict_spread(
            material=material,
            oxygen_pct=oxygen_pct,
            pressure_kpa=pressure_kpa,
            flow_velocity_cm_s=flow_velocity_cm_s,
        )

        # Step 2: Model 2 Polynomial Logistic Regression probability
        m2_list = self.model2.predict_materials(
            oxygen_pct=oxygen_pct,
            pressure_kpa=pressure_kpa,
            flow_velocity_cm_s=flow_velocity_cm_s,
            materials=[material],
            cutoff=cutoff,
        )
        m2_res = m2_list[0] if m2_list else {}

        # Step 3: Model 3 Random Forest Regime & Drivers
        m3_res = self.model3.predict_regime(
            material=material,
            oxygen_pct=oxygen_pct,
            pressure_kpa=pressure_kpa,
            flow_velocity_cm_s=flow_velocity_cm_s,
            flame_spread_mm_s=m1_res["flame_spread_mm_s"],
        )

        prov = self.get_provenance(material)

        return {
            "material_name": material,
            # Model 1 Outputs (Spread Meter & Confidence Halo)
            "flame_spread_mm_s": m1_res["flame_spread_mm_s"],
            "uncertainty_2sigma_mm_s": m1_res["uncertainty_2sigma_mm_s"],
            "spread_lower_mm_s": m1_res["spread_lower_mm_s"],
            "spread_upper_mm_s": m1_res["spread_upper_mm_s"],
            # Model 2 Outputs (Risk Ranking & Ignition Probability)
            "probability_sustained": m2_res.get("probability_sustained", 0.0),
            "probability_extinguished": m2_res.get("probability_extinguished", 1.0),
            "risk_status": m2_res.get("risk_status", "LOW"),
            "predicted_outcome": m2_res.get("predicted_outcome", "EXTINGUISHED"),
            # Model 3 Outputs (Regime Triage & Drivers)
            "hazard_regime": m3_res["hazard_regime"],
            "badge_color": m3_res["badge_color"],
            "regime_probabilities": m3_res["regime_probabilities"],
            "hazard_drivers": m3_res["hazard_drivers"],
            # Grounding & Training Ranges
            "out_of_material_training_range": (
                m1_res["out_of_material_training_range"]
                or m2_res.get("out_of_material_training_range", False)
            ),
            "loi_threshold_pct": prov.get("loi_threshold_pct", 21.0),
            "critical_flow_window_cms": prov.get("critical_flow_window_cms", [0.0, 15.0]),
            "nasa_provenance": prov,
            "warning": "Research-model estimate; not certified fire-safety guidance.",
        }

    def predict_all_materials(
        self,
        oxygen_pct: float,
        pressure_kpa: float,
        flow_velocity_cm_s: float,
        cutoff: float = 0.05,
    ) -> list[dict[str, Any]]:
        """Evaluate all 8 materials across all three models.

        Sorted by Model 2 sustained probability descending for the Material Risk Ranking table.
        Each item includes badge color and regime for Left Sidebar sector badges.
        """
        # Batch Model 2
        m2_results = self.model2.predict_materials(
            oxygen_pct=oxygen_pct,
            pressure_kpa=pressure_kpa,
            flow_velocity_cm_s=flow_velocity_cm_s,
            cutoff=cutoff,
        )
        m2_by_mat = {r["material_name"]: r for r in m2_results}

        # Batch Model 1
        m1_results = self.model1.predict_all_materials(
            oxygen_pct=oxygen_pct,
            pressure_kpa=pressure_kpa,
            flow_velocity_cm_s=flow_velocity_cm_s,
        )
        m1_by_mat = {r["material_name"]: r for r in m1_results}

        # Model 3 for each
        combined = []
        for mat in self.materials:
            m1 = m1_by_mat.get(mat, {})
            m2 = m2_by_mat.get(mat, {})
            fs = m1.get("flame_spread_mm_s", 0.0)

            m3 = self.model3.predict_regime(
                material=mat,
                oxygen_pct=oxygen_pct,
                pressure_kpa=pressure_kpa,
                flow_velocity_cm_s=flow_velocity_cm_s,
                flame_spread_mm_s=fs,
            )

            prov = self.get_provenance(mat)

            combined.append(
                {
                    "material_name": mat,
                    # Model 2 fields (Risk Ranking Table)
                    "probability_sustained": m2.get("probability_sustained", 0.0),
                    "probability_extinguished": m2.get("probability_extinguished", 1.0),
                    "risk_status": m2.get("risk_status", "LOW"),
                    "predicted_outcome": m2.get("predicted_outcome", "EXTINGUISHED"),
                    # Model 1 fields (Spread Meter)
                    "flame_spread_mm_s": m1.get("flame_spread_mm_s", 0.0),
                    "uncertainty_2sigma_mm_s": m1.get("uncertainty_2sigma_mm_s", 0.0),
                    "spread_lower_mm_s": m1.get("spread_lower_mm_s", 0.0),
                    "spread_upper_mm_s": m1.get("spread_upper_mm_s", 0.0),
                    # Model 3 fields (Left Sidebar Badges)
                    "hazard_regime": m3["hazard_regime"],
                    "badge_color": m3["badge_color"],
                    "regime_probabilities": m3["regime_probabilities"],
                    # Material & Provenance Specs
                    "loi_threshold_pct": prov.get("loi_threshold_pct", 21.0),
                    "critical_flow_window_cms": prov.get(
                        "critical_flow_window_cms", [0.0, 15.0]
                    ),
                    "psi_investigation_id": prov.get("psi_investigation_id", "PSI-NASA"),
                    "mission_source": prov.get("mission_source", "NASA Flight Telemetry"),
                    "out_of_material_training_range": (
                        m1.get("out_of_material_training_range", False)
                        or m2.get("out_of_material_training_range", False)
                    ),
                    "model3_out_of_material_training_range": m3["out_of_material_training_range"],
                }
            )

        # Sort descending by sustained probability (matches Model 2 ranking)
        return sorted(combined, key=lambda row: row["probability_sustained"], reverse=True)

    def airflow_sweep(
        self,
        material: str,
        oxygen_pct: float,
        pressure_kpa: float,
        flow_min: float | None = None,
        flow_max: float | None = None,
        points: int = 50,
        cutoff_probability: float = 0.05,
        spread_threshold_mm_s: float = 0.5,
    ) -> dict[str, Any]:
        """Compute the 50-point airflow simulation curve with ±2σ halo and quench target.

        Powers the bottom-left simulation chart:
          - Model 1 GP flame spread curve + shaded ±2σ uncertainty band.
          - Model 2 probability curve.
          - Critical Flow Window bounds from NASA dataset.
          - Reverse-Solver recommended quench point marker.
        """
        # Use the same flow coordinates for both estimators.
        ranges = self.model2.metadata["materials"][material]["observed_ranges"]
        observed_min, observed_max = ranges["flow_velocity_cm_s"]
        flow_min = observed_min if flow_min is None else flow_min
        flow_max = observed_max if flow_max is None else flow_max
        m1_curve = self.model1.airflow_spread_curve(
            material=material,
            oxygen_pct=oxygen_pct,
            pressure_kpa=pressure_kpa,
            flow_min=flow_min,
            flow_max=flow_max,
            points=points,
        )

        # Model 2 probability curve
        m2_curve = self.model2.airflow_curve(
            material=material,
            oxygen_pct=oxygen_pct,
            pressure_kpa=pressure_kpa,
            flow_min=flow_min,
            flow_max=flow_max,
            points=points,
        )

        # Merge sweep points
        sweep_data = []
        for p1, p2 in zip(m1_curve, m2_curve, strict=True):
            if not math.isclose(p1["flow_velocity_cm_s"], p2["flow_velocity_cm_s"], abs_tol=0.000501):
                raise RuntimeError("Model sweep grids do not match")
            sweep_data.append(
                {
                    "flow_velocity_cm_s": p2["flow_velocity_cm_s"],
                    "flame_spread_mm_s": p1["flame_spread_mm_s"],
                    "uncertainty_2sigma_mm_s": p1["uncertainty_2sigma_mm_s"],
                    "spread_lower_mm_s": p1["spread_lower_mm_s"],
                    "spread_upper_mm_s": p1["spread_upper_mm_s"],
                    "probability_sustained": p2["probability_sustained"],
                    "out_of_material_training_range": (
                        p1["out_of_material_training_range"]
                        or p2.get("out_of_material_training_range", False)
                    ),
                }
            )

        # Reverse-Solver target point
        quench_solution = self.reverse_solver(
            material=material,
            oxygen_pct=oxygen_pct,
            pressure_kpa=pressure_kpa,
            cutoff_probability=cutoff_probability,
            spread_threshold_mm_s=spread_threshold_mm_s,
        )

        prov = self.get_provenance(material)

        return {
            "material_name": material,
            "sweep_points": sweep_data,
            "critical_flow_window_cms": prov.get("critical_flow_window_cms", [0.0, 15.0]),
            "quench_target": quench_solution,
            "loi_threshold_pct": prov.get("loi_threshold_pct", 21.0),
        }

    def reverse_solver(
        self,
        material: str,
        oxygen_pct: float,
        pressure_kpa: float,
        cutoff_probability: float = 0.05,
        spread_threshold_mm_s: float = 0.5,
        step_cm_s: float = 0.5,
    ) -> dict[str, Any]:
        """Find the first modeled flow candidate in the observed range.

        Dual Constraints:
          1. Model 2 Probability of sustained combustion <= cutoff_probability (default 0.05).
          2. Model 1 Predicted flame spread rate <= spread_threshold_mm_s (default 0.5 mm/s).

        Returns:
          Candidate airflow and constraint status for the scenario preview.
        """
        material_info = self.model2.metadata["materials"].get(material)
        if material_info is None:
            raise ValueError(f"Unknown material {material!r}; choose from {self.materials}")

        flow_min, flow_max = material_info["observed_ranges"]["flow_velocity_cm_s"]

        # Check oxygen and pressure range
        o2_range = material_info["observed_ranges"]["oxygen_pct"]
        pres_range = material_info["observed_ranges"]["pressure_kpa"]
        cond_out_of_range = (
            oxygen_pct < o2_range[0]
            or oxygen_pct > o2_range[1]
            or pressure_kpa < pres_range[0]
            or pressure_kpa > pres_range[1]
        )

        base_res: dict[str, Any] = {
            "material_name": material,
            "cutoff_probability": cutoff_probability,
            "spread_threshold_mm_s": spread_threshold_mm_s,
            "search_range_cm_s": [float(flow_min), float(flow_max)],
            "step_cm_s": step_cm_s,
            "recommended_flow_velocity_cm_s": None,
            "probability_sustained": None,
            "flame_spread_mm_s": None,
            "uncertainty_2sigma_mm_s": None,
            "satisfies_dual_constraints": False,
            "out_of_material_training_range": cond_out_of_range,
            "warning": "Research-model estimate; not certified fire-safety guidance or operational ventilation procedure.",
        }

        if cond_out_of_range:
            base_res.update(
                {
                    "status": "conditions_outside_material_training_range",
                }
            )
            return base_res

        # Grid search over airflow
        flows = np.arange(flow_min, flow_max + step_cm_s * 0.5, step_cm_s)
        flows = flows[flows <= flow_max + 1e-9]

        conditions = dict(material=material, oxygen_pct=oxygen_pct, pressure_kpa=pressure_kpa)
        if len(flows) == 1:
            spread_points = [self.model1.predict_spread(**conditions, flow_velocity_cm_s=float(flows[0]))]
            probability_points = self.model2.predict_materials(
                oxygen_pct, pressure_kpa, float(flows[0]), materials=[material], cutoff=cutoff_probability
            )
        else:
            grid = dict(flow_min=float(flows[0]), flow_max=float(flows[-1]), points=len(flows))
            spread_points = self.model1.airflow_spread_curve(**conditions, **grid)
            probability_points = self.model2.airflow_curve(**conditions, **grid)

        dual_candidates = []
        prob_only_candidates = []

        for flow, m1_eval, m2_eval in zip(flows, spread_points, probability_points, strict=True):
            if m1_eval["out_of_material_training_range"] or m2_eval["out_of_material_training_range"]:
                continue

            prob = m2_eval["probability_sustained"]
            spread = m1_eval["flame_spread_mm_s"]
            sigma2 = m1_eval["uncertainty_2sigma_mm_s"]

            is_prob_ok = prob <= cutoff_probability
            is_spread_ok = spread <= spread_threshold_mm_s

            candidate_info = {
                "flow": float(flow),
                "probability": prob,
                "spread": spread,
                "sigma2": sigma2,
            }

            if is_prob_ok and is_spread_ok:
                dual_candidates.append(candidate_info)
            elif is_prob_ok:
                prob_only_candidates.append(candidate_info)

        if dual_candidates:
            best = dual_candidates[0]
            base_res.update(
                {
                    "status": "dual_constraint_quench_found",
                    "recommended_flow_velocity_cm_s": round(best["flow"], 3),
                    "probability_sustained": round(best["probability"], 4),
                    "flame_spread_mm_s": round(best["spread"], 4),
                    "uncertainty_2sigma_mm_s": round(best["sigma2"], 4),
                    "satisfies_dual_constraints": True,
                }
            )
            return base_res

        if prob_only_candidates:
            best = prob_only_candidates[0]
            base_res.update(
                {
                    "status": "probability_cutoff_only_quench_found",
                    "recommended_flow_velocity_cm_s": round(best["flow"], 3),
                    "probability_sustained": round(best["probability"], 4),
                    "flame_spread_mm_s": round(best["spread"], 4),
                    "uncertainty_2sigma_mm_s": round(best["sigma2"], 4),
                    "satisfies_dual_constraints": False,
                }
            )
            return base_res

        base_res.update(
            {
                "status": "no_supported_quench_point_found",
            }
        )
        return base_res

    def evaluate_avionics_state(
        self,
        material: str,
        oxygen_pct: float,
        pressure_kpa: float,
        flow_velocity_cm_s: float,
        cutoff_probability: float = 0.05,
        spread_threshold_mm_s: float = 0.5,
        sweep_points: int = 50,
    ) -> dict[str, Any]:
        """Consolidated master evaluation endpoint covering all dashboard widgets in one call.

        Returns payload containing:
          1. active_material_evaluation: Model 1, Model 2, Model 3 combined output for the selected material.
          2. spread_rate_meter: Flame spread rate + ±2σ for the vertical avionics meter.
          3. sector_triage: Compartment status badges for Left Sidebar.
          4. material_risk_ranking: Sorted table of all materials for Middle Panel.
          5. airflow_simulation: 50-point sweep data + confidence halo for Bottom-Left chart.
          6. evidence_and_actuation: Driver explainability % + reverse-solver actuation for Bottom-Right card.
          7. nasa_provenance: Complete flight citation data for the active material.
        """
        # Active material
        active_eval = self.predict_material(
            material=material,
            oxygen_pct=oxygen_pct,
            pressure_kpa=pressure_kpa,
            flow_velocity_cm_s=flow_velocity_cm_s,
            cutoff=cutoff_probability,
        )

        # All materials (Ranking table + Sector triage)
        all_materials = self.predict_all_materials(
            oxygen_pct=oxygen_pct,
            pressure_kpa=pressure_kpa,
            flow_velocity_cm_s=flow_velocity_cm_s,
            cutoff=cutoff_probability,
        )

        # Sector triage for sidebar
        sector_triage = [
            {
                "material_name": row["material_name"],
                "hazard_regime": row["hazard_regime"],
                "badge_color": row["badge_color"],
                "probability_sustained": row["probability_sustained"],
                "flame_spread_mm_s": row["flame_spread_mm_s"],
                "psi_investigation_id": row["psi_investigation_id"],
                "mission_source": row["mission_source"],
                "out_of_material_training_range": row["model3_out_of_material_training_range"] or row["out_of_material_training_range"],
            }
            for row in all_materials
        ]

        # Bottom-Left simulation sweep
        simulation = self.airflow_sweep(
            material=material,
            oxygen_pct=oxygen_pct,
            pressure_kpa=pressure_kpa,
            flow_min=0.0,
            flow_max=50.0,
            points=sweep_points,
            cutoff_probability=cutoff_probability,
            spread_threshold_mm_s=spread_threshold_mm_s,
        )

        return {
            "inputs": {
                "material": material,
                "oxygen_pct": float(oxygen_pct),
                "pressure_kpa": float(pressure_kpa),
                "flow_velocity_cm_s": float(flow_velocity_cm_s),
                "cutoff_probability": float(cutoff_probability),
                "spread_threshold_mm_s": float(spread_threshold_mm_s),
            },
            # UI Widget 1: Vertical Spread Rate Bar
            "spread_rate_meter": {
                "flame_spread_mm_s": active_eval["flame_spread_mm_s"],
                "uncertainty_2sigma_mm_s": active_eval["uncertainty_2sigma_mm_s"],
                "spread_lower_mm_s": active_eval["spread_lower_mm_s"],
                "spread_upper_mm_s": active_eval["spread_upper_mm_s"],
                "out_of_material_training_range": active_eval[
                    "out_of_material_training_range"
                ],
            },
            # UI Widget 2: Left Sidebar Compartment Triage
            "sector_triage": sector_triage,
            # UI Widget 3: Middle Panel Material Risk Ranking Table
            "material_risk_ranking": all_materials,
            # UI Widget 4: Bottom-Left Airflow vs. Spread / Risk Simulation Chart
            "airflow_simulation": simulation,
            # UI Widget 5: Bottom-Right Evidence & Actuation Card
            "evidence_and_actuation": {
                "active_regime": active_eval["hazard_regime"],
                "badge_color": active_eval["badge_color"],
                "regime_probabilities": active_eval["regime_probabilities"],
                "hazard_drivers": active_eval["hazard_drivers"],
                "reverse_solver_recommendation": simulation["quench_target"],
                "nasa_provenance": active_eval["nasa_provenance"],
            },
        }

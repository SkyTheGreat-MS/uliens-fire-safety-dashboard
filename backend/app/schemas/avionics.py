from typing import Literal

from pydantic import BaseModel, Field, FiniteFloat


class Conditions(BaseModel):
    oxygen_pct: FiniteFloat = Field(ge=0, le=100)
    pressure_kpa: FiniteFloat = Field(gt=0)
    flow_velocity_cm_s: FiniteFloat = Field(ge=0)


class MaterialConditions(Conditions):
    material: str = Field(min_length=1)


class EvaluationInputs(MaterialConditions):
    cutoff_probability: FiniteFloat = Field(default=0.05, ge=0, le=1)
    spread_threshold_mm_s: FiniteFloat = Field(default=0.5, ge=0)


class EvaluationRequest(EvaluationInputs):
    sweep_points: int = Field(default=50, ge=2, le=100)


class Provenance(BaseModel):
    material_name: str
    psi_investigation_id: str | None = None
    mission_source: str | None = None
    standard_ref: str | None = None
    source_doi_url: str | None = None
    loi_threshold_pct: FiniteFloat | None = None
    critical_flow_window_cms: tuple[FiniteFloat, FiniteFloat] | None = None
    historical_finding: str | None = None
    total_nasa_test_records: int | None = None


class VersionInfo(BaseModel):
    model_version: str
    dataset_version: str


class Catalog(VersionInfo):
    materials: list[Provenance]


class Spread(BaseModel):
    flame_spread_mm_s: FiniteFloat
    uncertainty_2sigma_mm_s: FiniteFloat
    spread_lower_mm_s: FiniteFloat
    spread_upper_mm_s: FiniteFloat
    out_of_material_training_range: bool


class SpreadPrediction(Spread):
    material_name: str
    std_mm_s: FiniteFloat
    warning: str


class SpreadPoint(Spread):
    flow_velocity_cm_s: FiniteFloat


class SweepPoint(SpreadPoint):
    probability_sustained: FiniteFloat


Regime = Literal["NOMINAL", "ELEVATED", "CRITICAL"]


class Driver(BaseModel):
    feature: str
    label: str
    importance_pct: FiniteFloat


class RegimePrediction(BaseModel):
    material_name: str
    hazard_regime: Regime
    badge_color: str
    regime_probabilities: dict[str, FiniteFloat]
    hazard_drivers: list[Driver]
    out_of_material_training_range: bool
    warning: str


class Triage(BaseModel):
    material_name: str
    hazard_regime: Regime
    badge_color: str
    probability_sustained: FiniteFloat
    flame_spread_mm_s: FiniteFloat
    out_of_material_training_range: bool


class RankingRow(Spread, Triage):
    probability_extinguished: FiniteFloat
    risk_status: Literal["HIGH", "ELEVATED", "LOW"]
    predicted_outcome: Literal["SUSTAINED", "EXTINGUISHED"]


class SolverResult(BaseModel):
    material_name: str
    status: Literal[
        "dual_constraint_quench_found",
        "probability_cutoff_only_quench_found",
        "no_supported_quench_point_found",
        "conditions_outside_material_training_range",
    ]
    satisfies_dual_constraints: bool
    out_of_material_training_range: bool
    recommended_flow_velocity_cm_s: FiniteFloat | None
    probability_sustained: FiniteFloat | None
    flame_spread_mm_s: FiniteFloat | None
    uncertainty_2sigma_mm_s: FiniteFloat | None
    search_range_cm_s: tuple[FiniteFloat, FiniteFloat]
    warning: str


class AirflowSimulation(BaseModel):
    material_name: str
    critical_flow_window_cms: tuple[FiniteFloat, FiniteFloat]
    quench_target: SolverResult
    sweep_points: list[SweepPoint]


class Evidence(BaseModel):
    active_regime: Regime
    hazard_drivers: list[Driver]
    reverse_solver_recommendation: SolverResult
    nasa_provenance: Provenance


class Evaluation(VersionInfo):
    inputs: EvaluationRequest
    spread_rate_meter: Spread
    sector_triage: list[Triage]
    material_risk_ranking: list[RankingRow]
    airflow_simulation: AirflowSimulation
    evidence_and_actuation: Evidence
    warning: str

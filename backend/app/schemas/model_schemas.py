from pydantic import BaseModel, Field, FiniteFloat
from typing import List, Optional

class PredictMaterialsRequest(BaseModel):
    oxygen_pct: FiniteFloat = Field(description="Oxygen percentage")
    pressure_kpa: FiniteFloat = Field(description="Pressure in kPa")
    flow_velocity_cm_s: FiniteFloat = Field(description="Flow velocity in cm/s")
    materials: Optional[List[str]] = None
    cutoff: FiniteFloat | None = Field(default=None, ge=0, le=1)

class PredictMaterialsResult(BaseModel):
    material_name: str
    probability_sustained: float
    probability_extinguished: float
    predicted_outcome: str
    risk_status: str
    cutoff: float
    out_of_material_training_range: bool
    training_rows_for_material: int
    warning: str

class AirflowCurveResult(BaseModel):
    flow_velocity_cm_s: float
    probability_sustained: float
    out_of_material_training_range: bool

class ReverseSolverResult(BaseModel):
    material_name: str
    cutoff_probability_sustained: float
    positive_label: str
    negative_label: str
    search_range_cm_s: List[float]
    step_cm_s: float
    training_rows_for_material: int
    warning: str
    status: str
    recommended_flow_velocity_cm_s: Optional[float] = None
    probability_sustained: Optional[float] = None
    out_of_material_training_range: Optional[bool] = None

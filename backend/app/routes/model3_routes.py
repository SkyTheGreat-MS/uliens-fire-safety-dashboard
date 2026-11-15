from fastapi import APIRouter, HTTPException
from typing import List
from ..schemas.model_schemas import (
    PredictMaterialsRequest,
    PredictMaterialsResult,
    AirflowCurveResult,
    ReverseSolverResult,
)

router = APIRouter()

@router.post("/predict_materials", response_model=List[PredictMaterialsResult])
def predict_materials(request: PredictMaterialsRequest):
    raise HTTPException(status_code=501, detail="Model 3 (Random Forest) not implemented yet")

@router.get("/airflow_curve/{material}", response_model=List[AirflowCurveResult])
def airflow_curve(material: str, oxygen_pct: float, pressure_kpa: float, flow_min: float = None, flow_max: float = None, points: int = 50):
    raise HTTPException(status_code=501, detail="Model 3 (Random Forest) not implemented yet")

@router.get("/reverse_solver/{material}", response_model=ReverseSolverResult)
def reverse_solver(material: str, oxygen_pct: float, pressure_kpa: float, cutoff: float = 0.05, step_cm_s: float = 0.5):
    raise HTTPException(status_code=501, detail="Model 3 (Random Forest) not implemented yet")

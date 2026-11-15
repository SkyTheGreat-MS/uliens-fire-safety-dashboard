import sys
from pathlib import Path
from typing import List

# Uvicorn runs from backend/, while model2 is a package at the repository root.
PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from fastapi import APIRouter
from ..schemas.model_schemas import (
    PredictMaterialsRequest,
    PredictMaterialsResult,
    AirflowCurveResult,
    ReverseSolverResult,
)

# Import the actual inference class from the top‑level `model2` package.
from model2.inference import Model2

router = APIRouter()
model = Model2()

@router.post("/predict_materials", response_model=List[PredictMaterialsResult])
def predict_materials(request: PredictMaterialsRequest):
    result = model.predict_materials(
        oxygen_pct=request.oxygen_pct,
        pressure_kpa=request.pressure_kpa,
        flow_velocity_cm_s=request.flow_velocity_cm_s,
        materials=request.materials,
        cutoff=request.cutoff or 0.05,
    )
    return result

@router.get("/airflow_curve/{material}", response_model=List[AirflowCurveResult])
def airflow_curve(
    material: str,
    oxygen_pct: float,
    pressure_kpa: float,
    flow_min: float = None,
    flow_max: float = None,
    points: int = 50,
):
    result = model.airflow_curve(
        material=material,
        oxygen_pct=oxygen_pct,
        pressure_kpa=pressure_kpa,
        flow_min=flow_min,
        flow_max=flow_max,
        points=points,
    )
    return result

@router.get("/reverse_solver/{material}", response_model=ReverseSolverResult)
def reverse_solver(
    material: str,
    oxygen_pct: float,
    pressure_kpa: float,
    cutoff: float = 0.05,
    step_cm_s: float = 0.5,
):
    result = model.reverse_solver(
        material=material,
        oxygen_pct=oxygen_pct,
        pressure_kpa=pressure_kpa,
        cutoff=cutoff,
        step_cm_s=step_cm_s,
    )
    return result

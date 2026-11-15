from fastapi import APIRouter, HTTPException, Query
from pydantic import FiniteFloat

from ..schemas.model_schemas import AirflowCurveResult, PredictMaterialsRequest, PredictMaterialsResult, ReverseSolverResult
from ..services.ml import Pipeline, require_materials

router = APIRouter()


@router.post("/predict_materials", response_model=list[PredictMaterialsResult])
def predict_materials(request: PredictMaterialsRequest, pipeline: Pipeline):
    if request.materials is not None:
        require_materials(pipeline, request.materials)
    return pipeline.model2.predict_materials(**request.model_dump(exclude_none=True))


@router.get("/airflow_curve/{material}", response_model=list[AirflowCurveResult])
def airflow_curve(
    material: str,
    pipeline: Pipeline,
    oxygen_pct: FiniteFloat,
    pressure_kpa: FiniteFloat,
    flow_min: FiniteFloat | None = None,
    flow_max: FiniteFloat | None = None,
    points: int = Query(default=50, ge=2),
):
    require_materials(pipeline, [material])
    try:
        return pipeline.model2.airflow_curve(material, oxygen_pct, pressure_kpa, flow_min, flow_max, points)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/reverse_solver/{material}", response_model=ReverseSolverResult)
def reverse_solver(
    material: str,
    pipeline: Pipeline,
    oxygen_pct: FiniteFloat,
    pressure_kpa: FiniteFloat,
    cutoff: FiniteFloat = Query(default=0.05, ge=0, le=1),
    step_cm_s: FiniteFloat = Query(default=0.5, gt=0),
):
    require_materials(pipeline, [material])
    return pipeline.model2.reverse_solver(material, oxygen_pct, pressure_kpa, cutoff, step_cm_s)

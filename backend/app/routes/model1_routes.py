from fastapi import APIRouter, Query
from pydantic import FiniteFloat

from ..schemas.avionics import MaterialConditions, SpreadPoint, SpreadPrediction
from ..services.ml import Pipeline, require_materials

router = APIRouter()


@router.post("/predict_spread", response_model=SpreadPrediction)
def predict_spread(request: MaterialConditions, pipeline: Pipeline):
    require_materials(pipeline, [request.material])
    return pipeline.model1.predict_spread(**request.model_dump())


@router.get("/airflow_curve/{material}", response_model=list[SpreadPoint])
def airflow_curve(
    material: str,
    pipeline: Pipeline,
    oxygen_pct: FiniteFloat = Query(ge=0, le=100),
    pressure_kpa: FiniteFloat = Query(gt=0),
    points: int = Query(default=50, ge=2, le=100),
):
    require_materials(pipeline, [material])
    return pipeline.model1.airflow_spread_curve(material, oxygen_pct, pressure_kpa, points=points)

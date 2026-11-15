from fastapi import APIRouter

from ..schemas.avionics import MaterialConditions, RegimePrediction
from ..services.ml import Pipeline, require_materials

router = APIRouter()


@router.post("/predict_regime", response_model=RegimePrediction)
def predict_regime(request: MaterialConditions, pipeline: Pipeline):
    require_materials(pipeline, [request.material])
    conditions = request.model_dump()
    spread = pipeline.model1.predict_spread(**conditions)
    return pipeline.model3.predict_regime(**conditions, flame_spread_mm_s=spread["flame_spread_mm_s"])

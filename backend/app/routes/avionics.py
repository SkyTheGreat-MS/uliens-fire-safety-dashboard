from fastapi import APIRouter, HTTPException

from ..config import DATASET_VERSION, MODEL_VERSION
from ..schemas.avionics import Catalog, Evaluation, EvaluationRequest
from ..services.ml import Pipeline, require_materials

router = APIRouter()
VERSIONS = {"dataset_version": DATASET_VERSION, "model_version": MODEL_VERSION}


@router.get("/materials", response_model=Catalog)
def catalog(pipeline: Pipeline):
    return {
        **VERSIONS,
        "materials": [pipeline.provenance[name] for name in pipeline.materials],
    }


@router.post("/evaluate", response_model=Evaluation)
def evaluate(request: EvaluationRequest, pipeline: Pipeline):
    require_materials(pipeline, [request.material])
    try:
        result = pipeline.evaluate_avionics_state(**request.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {
        **result,
        **VERSIONS,
        "inputs": request,
        "warning": "Research-model estimates for scenario comparison.",
    }

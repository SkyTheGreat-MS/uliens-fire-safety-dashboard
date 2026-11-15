import sys
from typing import TYPE_CHECKING, Annotated, Any

from fastapi import Depends, HTTPException, Request

from ..config import MODELS_DIR, PROJECT_ROOT

if TYPE_CHECKING:
    from pipeline import TriModelPipeline
else:
    TriModelPipeline = Any


def load_pipeline() -> "TriModelPipeline":
    # Running Uvicorn from backend/ leaves the repository packages off sys.path.
    if str(PROJECT_ROOT) not in sys.path:
        sys.path.append(str(PROJECT_ROOT))
    from pipeline import TriModelPipeline

    pipeline = TriModelPipeline(models_dir=MODELS_DIR)
    materials = set(pipeline.materials)
    if not materials or any(
        keys != materials
        for keys in (set(pipeline.model1.materials), set(pipeline.model3.materials), set(pipeline.provenance))
    ):
        raise ValueError("Model artifacts and provenance must share the same material keys")
    return pipeline


def get_pipeline(request: Request):
    pipeline = request.app.state.pipeline
    if pipeline is None:
        raise HTTPException(status_code=503, detail="V2 model artifacts are unavailable")
    return pipeline


Pipeline = Annotated[TriModelPipeline, Depends(get_pipeline)]


def require_materials(pipeline: "TriModelPipeline", materials: list[str]) -> None:
    unknown = sorted(set(materials).difference(pipeline.materials))
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown materials: {', '.join(unknown)}")

from fastapi import APIRouter
from ..models.schemas import HealthResponse
from ..services.ml import Pipeline

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", version="1.0.0")


@router.get("/ready", response_model=HealthResponse)
def readiness_check(pipeline: Pipeline):
    return HealthResponse(status="ok", version="1.0.0")

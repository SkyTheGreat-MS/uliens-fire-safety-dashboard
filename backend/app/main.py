from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .database import engine, Base
from .routes import avionics, health, data, records, data_rows, model1_routes, model2_routes, model3_routes
from .services.ml import load_pipeline

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    try:
        app.state.pipeline = load_pipeline()
    except Exception:
        logger.exception("Failed to initialize the V2 model pipeline")
        app.state.pipeline = None
    yield


app = FastAPI(title="Uliens Fire Safety Backend", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/health", tags=["Health"])
app.include_router(data.router, prefix="/api/data", tags=["Data"])
app.include_router(data_rows.router, prefix="/api/data", tags=["DataRows"])
app.include_router(records.router, prefix="/api/records", tags=["Records"])
app.include_router(avionics.router, prefix="/api/avionics", tags=["Avionics"])
app.include_router(model1_routes.router, prefix="/api/model1", tags=["Model1"])
app.include_router(model2_routes.router, prefix="/api/model2", tags=["Model2"])
app.include_router(model3_routes.router, prefix="/api/model3", tags=["Model3"])

@app.get("/")
async def root():
    return {"message": "Uliens Fire Safety Backend is running. Visit /docs for API documentation."}

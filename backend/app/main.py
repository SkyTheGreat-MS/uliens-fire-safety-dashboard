from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import API_HOST, API_PORT, DB_PATH
from .database import engine, Base
from .routes import health, data, records, data_rows

# Create database tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Uliens Fire Safety Backend", version="0.1.0")

# Optional CORS (allow all origins for simplicity)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/health", tags=["Health"])
app.include_router(data.router, prefix="/api/data", tags=["Data"])
app.include_router(data_rows.router, prefix="/api/data", tags=["DataRows"])
app.include_router(records.router, prefix="/api/records", tags=["Records"])

@app.get("/")
async def root():
    return {"message": "Uliens Fire Safety Backend is running. Visit /docs for API documentation."}

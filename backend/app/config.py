import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).absolute().parents[1]
PROJECT_ROOT = BACKEND_DIR.parent
DATA_DIR = PROJECT_ROOT / "data" / "processed"
MODELS_DIR = PROJECT_ROOT / "models"
DATASET_VERSION = "clean_combustion_data_v2"
MODEL_VERSION = "v2"

load_dotenv(BACKEND_DIR / ".env")

API_HOST = os.getenv("API_HOST", "127.0.0.1")
API_PORT = int(os.getenv("API_PORT", "8765"))
DB_PATH = Path(os.getenv("DB_PATH", str(PROJECT_ROOT / "storage" / "records.db")))
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

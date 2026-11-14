from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from pathlib import Path

# Resolve the base directory (two levels up from this file)
BASE_DIR = Path(__file__).resolve().parents[2]
# Ensure storage directory exists
storage_dir = BASE_DIR / "storage"
storage_dir.mkdir(parents=True, exist_ok=True)

# Path to SQLite DB (default, can be overridden via env var DB_PATH)
DB_PATH = os.getenv('DB_PATH', str(storage_dir / 'records.db'))

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

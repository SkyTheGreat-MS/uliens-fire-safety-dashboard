# Backend Setup & Configuration

## Prerequisites
- **Python 3.11+** (required by Model 2's scikit-learn dependency)
- **Git** (to clone the repository)
- **Virtual environment** (venv or conda)
- **pip** (will be used to install dependencies)

## Quick Start (Hackathon Mode)
1. **Clone the repo**
   ```bash
   git clone https://github.com/your-org/uliens-fire-safety-dashboard.git
   cd uliens-fire-safety-dashboard/backend
   ```
2. **Create & activate a virtual environment**
   ```bash
   python -m venv venv
   # Windows
   .\\venv\\Scripts\\activate
   # Unix/macOS
   source venv/bin/activate
   ```
3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```
4. **Run the development server**
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload
   ```
   The API documentation will be available at `http://127.0.0.1:8765/docs`.

## Configuration
- **`app/config.py`** – contains `API_HOST`, `API_PORT`, and `DB_PATH`. Adjust if you run the service on a different host/port or want a custom SQLite location.
- **CORS** – The app currently allows all origins (`*`). For production, replace the wildcard with your front‑end domain list in `app/main.py`.
- **Database** – SQLite is used via SQLAlchemy. Tables are auto‑created on start (`Base.metadata.create_all`). To inspect the DB, open `backend/app/database.db` (or the path set in `DB_PATH`).
- **Dataset directory** – CSV files live under `backend/data/processed/`. The API expects filenames **without** the `.csv` extension as the dataset identifier (e.g., `clean_combustion_data_v2`).

## Advanced Options (Production Ready)
- **Docker** – Build an image:
  ```dockerfile
  FROM python:3.11-slim
  WORKDIR /app
  COPY . /app
  RUN pip install --no-cache-dir -r requirements.txt && pip install pandas
  CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
  ```
- **Environment variables** – Override config values by setting `API_HOST`, `API_PORT`, `DB_PATH` before starting the server.
- **Logging** – Adjust the logger in `app/main.py` to send logs to a file or external service.
- **Authentication** – Add FastAPI security dependencies (OAuth2, API keys) to protect the endpoints.

## Testing the API
```bash
# List datasets
curl http://127.0.0.1:8765/api/data/

# Get schema for a dataset
curl http://127.0.0.1:8765/api/data/clean_combustion_data_v2/schema

# Retrieve paginated rows
curl "http://127.0.0.1:8765/api/data/clean_combustion_data_v2?skip=0&limit=10"

# Get statistics
curl http://127.0.0.1:8765/api/data/clean_combustion_data_v2/statistics
```

---
*Keep this file version‑controlled so new team members can spin up the backend consistently.*

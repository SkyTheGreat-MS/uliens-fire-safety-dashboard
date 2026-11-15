# FastAPI setup

Use Python 3.14 for the verified Windows setup. Run these commands from the `backend` directory of the full integration checkout. The backend loads its V2 artifacts from the repository's `models/` directory at startup.

```powershell
py -3.14 -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload
```

If `py` cannot locate Python 3.14, use the full path to its `python.exe` to create the environment. Recreate the environment in a fresh directory when changing Python minor versions so compiled packages are installed for the matching interpreter. Check the backend interpreter with `.\venv\Scripts\python.exe --version`.

## HTTP API

| Route | Purpose |
| --- | --- |
| `GET /api/health/health` | Process liveness |
| `GET /api/health/ready` | Model readiness, or HTTP 503 if initialization failed |
| `GET /api/avionics/materials` | V2 material keys and provenance |
| `POST /api/avionics/evaluate` | Combined scenario evaluation with spread, ranking, triage, sweep and solver preview |
| `POST /api/model1/predict_spread`, `GET /api/model1/airflow_curve/{material}` | Standalone spread diagnostics |
| `POST /api/model3/predict_regime` | Standalone regime diagnostics using Model 1 spread |
| `GET /api/data/`, `GET /api/data/{dataset_name}` | List and page the V1 and V2 CSV datasets |
| `GET /api/data/{dataset_name}/schema`, `GET /api/data/{dataset_name}/statistics` | CSV schema and statistics |
| `/api/records/` | Independent SQLite record CRUD |

Open `http://127.0.0.1:8765/docs` for the full API contract, including the existing Model 2 endpoints. The live dashboard uses `clean_combustion_data_v2`. The V1 CSV remains available as `clean_combustion_data`.

## Deployment settings

- The default SQLite file is `storage/records.db` at the repository root. Set `DB_PATH` in the environment or `backend/.env` to use another path.
- For same-origin deployments, serve the frontend build and route `/api` to FastAPI. For separate origins, set `VITE_API_URL` when building the frontend and set `CORS_ORIGINS` to comma-separated frontend origins in the backend environment.
- Build or deploy from the repository root with `backend/`, `data/processed/`, `model1/`, `model2/`, `model3/`, `models/` and `pipeline/` present. Run Uvicorn with `backend/` as its working directory.

## Contract tests

From `backend`, run the tests with the bundled V2 model artifacts.

```powershell
.\venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\venv\Scripts\python.exe -m unittest discover -s tests -v
```

# Deploy the Uliens Fire Safety Dashboard on Render

Deploy the GitHub `backend` branch as two Render services. A Python **Web Service** runs FastAPI, and a **Static Site** serves the React dashboard. Enter the settings below in the Render Dashboard.

## 1. Create the FastAPI Web Service

1. Open the [Render Dashboard](https://dashboard.render.com/) and select **New → Web Service**. Connect GitHub if prompted.
2. Select `SkyTheGreat-MS/uliens-fire-safety-dashboard` and enter these settings.

   | Setting | Value |
   | --- | --- |
   | Name | `uliens-fire-safety-api` |
   | Branch | `backend` |
   | Language | Python 3 |
   | Root Directory | Leave blank |
   | Build Command | `python -m pip install -r backend/requirements.txt` |
   | Start Command | `cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
   | Health Check Path | `/api/health/ready` |
   | Environment Variable | `PYTHON_VERSION=3.14.10` |

3. Click **Deploy Web Service**. Once it goes live, copy its actual `https://…onrender.com` URL.
4. Open `/api/health/ready` on that URL. Confirm it returns HTTP 200 and `"status":"ok"`. Open `/docs` for FastAPI’s interactive documentation.

Leaving **Root Directory** blank gives FastAPI access to the repository’s top-level `models/`, `pipeline/`, and `data/` directories. The start command changes into `backend/` before launching Uvicorn. [Render monorepo support](https://render.com/docs/monorepo-support) · [Deploy FastAPI](https://render.com/docs/deploy-fastapi)

## 2. Create the React Static Site

1. Select **New → Static Site** and choose the same GitHub repository.
2. Enter these settings.

   | Setting | Value |
   | --- | --- |
   | Name | `uliens-fire-safety-dashboard` |
   | Branch | `backend` |
   | Root Directory | Leave blank |
   | Build Command | `npm ci --include=dev && npm run build` |
   | Publish Directory | `dist` |
   | Environment Variable | `NODE_VERSION=24.22.1` |
   | Environment Variable | `VITE_API_URL=https://uliens-fire-safety-api.onrender.com` |

3. Replace the example `VITE_API_URL` with the actual backend base URL from step 1. The frontend adds `/api` to its requests.
4. Click **Deploy Static Site** and copy its actual `https://…onrender.com` URL.

If you change `VITE_API_URL` later, select **Save, rebuild, and deploy** so Vite includes the new URL in the compiled frontend. [Render Vite static site setup](https://render.com/tutorials/web-service-vs-static-site/static-sites) · [Render environment variables](https://render.com/docs/configure-environment-variables)

## 3. Connect the frontend and backend

1. Open the **backend Web Service → Environment**.
2. Set `CORS_ORIGINS` to the frontend origin, such as `https://uliens-fire-safety-dashboard.onrender.com`. Use the actual URL with the `https://` scheme and omit the trailing slash.
3. Save and redeploy the backend.
4. Open the Static Site. Verify that the material ranking and flame spread chart load. Changing a dial or selecting a preset should return a new scenario evaluation.

## Troubleshoot

| Symptom | What to check |
| --- | --- |
| Backend never becomes ready | Open the Web Service logs. Confirm the branch is `backend`, Root Directory is blank, and the start command uses `$PORT`. |
| API opens directly but dashboard shows **Scenario data unavailable** | Check that the frontend’s `VITE_API_URL` is the backend base URL, and the backend’s `CORS_ORIGINS` is the frontend origin. Rebuild the frontend if its API URL changed. |
| First request fails after inactivity | Open the backend’s `/api/health/ready` URL first. Once it responds, click **Retry** in the dashboard. The dashboard waits 8 seconds for API requests, and a Free backend can take roughly a minute to wake. |

## Free tier and SQLite

Render Free Web Services spin down after 15 minutes without traffic. Files on the service’s local filesystem, including the SQLite records database, are lost on restart, redeploy, or spin-down. For persistent SQLite records, use a paid Web Service with a persistent disk mounted at `/var/data` and set `DB_PATH=/var/data/records.db` on the backend. [Render Free limits](https://render.com/docs/free) · [Render persistent disks](https://render.com/docs/disks)

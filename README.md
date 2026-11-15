# PYROIS (Pyrotechnic & Flammability Operational Intelligence System)
### SI-Driven Microgravity Combustion Analytics

A React and FastAPI research simulator using three V2 combustion models trained on the bundled NASA PSI dataset. The dashboard shows model estimates for selected scenario inputs, connected to the Combustion Knowledgebase and real-time reverse-solver telemetry.

## Run locally on Windows

Open PowerShell at the repository root. Use Python 3.14 for the verified Windows backend setup.

```powershell
cd backend
py -3.14 -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload
```

In a second window at the repository root, start Vite.

```powershell
npm ci
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`. Vite proxies requests to FastAPI. Check model readiness at `http://127.0.0.1:8765/api/health/ready` and API schemas at `http://127.0.0.1:8765/docs`. See [backend setup](backend/SETUP.md) for split-origin hosting and test commands.

Run `node --test tests/avionicsService.test.mjs` with Node.js 24 to check the browser API client's response validation and cancellation.

## Dashboard controls

- Pick a preset to set the sample and target values. Click a rotary gauge to arm it, then use the scroll wheel, vertical drag, or arrow keys to adjust its target.
- Select a material to open evidence and evaluate it at the current scenario. Click or scrub the airflow chart to move its inspection cursor independently of the target.
- Switch to Earth reference to compare scenario oxygen against the selected material's catalog limiting oxygen index. Microgravity mode runs the V2 models.
- Combustion Knowledgebase searches the bundled NASA flight reference corpus.

---

## Super Intelligence (SI) & AI Tools Utilization Disclosure

In compliance with the NASA Space Apps Challenge rules on Super Intelligence (SI) tool use:

1. **AI Image Generation**:
   - **Tool Used:** Generative text-to-image tool.
   - **Application:** Created the abstract spirit flame logo icon (`src/assets/flame-icon.png` / `public/Ethereal Teal Spirit Flame.png`) used for the PYROIS logo and Combustion Knowledgebase interface.
   - **NASA Branding Compliance:** The generated asset contains zero NASA logos, flags, mission patches, or agency identifiers.

2. **RAG Knowledgebase & Natural Language Assistance**:
   - **Tool Used:** Retrieval-Augmented Generation (RAG) assistant architecture.
   - **Application:** Embedded flight science query assistant ("Combustion Knowledgebase") grounded exclusively in 8 peer-reviewed NASA flight experiment publications (BASS-I, BASS-II, Saffire-I/II/III, FLEX, and NASA-STD-6001B).
   - **Guardrails:** Equipped with domain-relevance filters that reject off-topic questions without hallucinating citations.

3. **Code & Architecture Acceleration**:
   - **Tools Used:** Large Language Models (AI coding assistants).
   - **Application:** Assisted with data pipeline scripting (`clean_combustion_data_v2.csv`), scikit-learn ML pipeline scaffolding, and React avionics UI components.
   - **Human Oversight & Verification:** All statistical models (Gaussian Process, Logistic Regression, Random Forest) were trained strictly on empirical NASA Physical Sciences Informatics (PSI) datasets, and all physics boundaries were manually validated against NASA published literature.

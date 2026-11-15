# ECLSS Flight Deck — Web

React + Vite browser prototype for the ECLSS Flight Deck UI. It runs locally in a browser; readings, risk values, and chart shape are illustrative only. No model, live telemetry, or backend is connected.

The interface is built with Tailwind CSS, Lucide React icons, and Recharts for the 2D airflow paradox curve. It uses locally served Geist Sans and Geist Mono font files. Interface labels use sentence case, while uppercase is reserved for short state indicators such as `NOMINAL`, `DRIFT`, and `ARMED`.

## Run locally

From this folder:

```powershell
npm install
npm run dev
```

Open the localhost URL printed by Vite (usually `http://localhost:5173`). Leave the terminal running while you use the page. Press `Ctrl+C` to stop the server.

## Prototype interactions

- Select habitat sectors and visual presets.
- Click a gauge to arm it; use wheel, arrow keys, vertical drag, or its step buttons to adjust the displayed sample value.
- Adjust the airflow velocity gauge independently; it no longer moves the airflow paradox curve, and the curve does not move the gauge.
- Scrub the 2D airflow paradox curve or use its arrow-key controls to reposition the curve's own sample operating point.
- Select an airflow velocity category independently; the category selection does not move the curve, and curve interaction does not change the selected category.
- Select a material to open its inspection drawer; the ranking values remain static.

All displayed sample values are explicitly illustrative and do not provide fire-safety predictions.

---

## Super Intelligence (SI) & AI Tools Utilization Disclosure

In compliance with the NASA Space Apps Challenge rules on Super Intelligence (SI) tool use:

1. **AI Image Generation**:
   - **Tool Used:** Generative text-to-image tool.
   - **Application:** Created the abstract spirit flame mascot icon (`src/assets/flame-icon.png` / `public/Ethereal Teal Spirit Flame.png`) used for the FLAMIE combustion knowledgebase interface.
   - **NASA Branding Compliance:** The generated asset contains zero NASA logos, flags, mission patches, or agency identifiers.

2. **RAG Knowledgebase & Natural Language Assistance (FLAMIE)**:
   - **Tool Used:** Retrieval-Augmented Generation (RAG) assistant architecture.
   - **Application:** Embedded flight science query assistant grounded exclusively in 8 peer-reviewed NASA flight experiment publications (BASS-I, BASS-II, Saffire-I/II/III, FLEX, and NASA-STD-6001B).
   - **Guardrails:** Equipped with domain-relevance filters that reject off-topic questions without hallucinating citations.

3. **Code & Architecture Acceleration**:
   - **Tools Used:** Large Language Models (AI coding assistants).
   - **Application:** Assisted with data pipeline scripting (`clean_combustion_data_v2.csv`), scikit-learn ML pipeline scaffolding, and React avionics UI components.
   - **Human Oversight & Verification:** All statistical models (Gaussian Process, Logistic Regression, Random Forest) were trained strictly on empirical NASA Physical Sciences Informatics (PSI) datasets, and all physics boundaries were manually validated against NASA published literature.


# ECLSS Flight Deck — Web

React + Vite browser prototype for the ECLSS Flight Deck UI. It runs locally in a browser; readings, risk values, and chart shape are illustrative only. No model, live telemetry, or backend is connected.

The visual system uses locally served Geist Sans and Geist Mono font files. Interface labels use sentence case, while uppercase is reserved for short state indicators such as `NOMINAL`, `DRIFT`, and `ARMED`.

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
- Scrub airflow directly on the illustrative chart.
- Select a material to highlight its row in the ranking; the ranking values remain static.

All displayed sample values are explicitly illustrative and do not provide fire-safety predictions.

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

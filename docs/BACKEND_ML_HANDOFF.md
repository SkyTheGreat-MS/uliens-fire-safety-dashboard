# Backend Handoff Guide: Tri-Model ML Pipeline & Avionics Inference (Dataset V2)

This guide documents the model branch handoff. The integrated FastAPI response is defined by OpenAPI and summarized in the [backend setup guide](../backend/SETUP.md).

> **Target Audience:** Backend API / FastAPI Developer  
> **Status:** Synchronized with Dataset V2 (`data/processed/clean_combustion_data_v2.csv`)  
> **Grounding:** 100% NASA Physical Sciences Informatics (PSI) Microgravity Combustion Telemetry (BASS-I, BASS-II, Saffire-II)  
> **No Synthetic Columns:** No simulated CO, smoke optical density, or synthetic cabin temperature. Strictly empirical physics parameters.

---

## 1. Tri-Model Architecture Overview

The combustion avionics system runs three specialized, NASA-grounded scikit-learn models alongside a dual-constraint reverse solver. All three models evaluate concurrently or in cascade when a flight controller adjusts the three avionics dials: **Oxygen Concentration ($O_2\%$)**, **Cabin Pressure ($P$ in kPa)**, and **Ventilation Airflow Velocity ($v$ in cm/s)**.

```mermaid
flowchart TD
    Dials["Rotary Dials<br/>(O2 %, Pressure kPa, Airflow cm/s)"] --> Pipeline["TriModelPipeline (pipeline/inference.py)"]
    
    Pipeline --> M1["Model 1: Gaussian Process Regressor<br/>(Continuous Spread Rate & ±2σ Band)"]
    Pipeline --> M2["Model 2: Degree-2 Poly Logistic Regressor<br/>(Sustained vs Extinguished Probability)"]
    Pipeline --> M3["Model 3: Random Forest Classifier<br/>(Regime Triage & Hazard Drivers)"]
    Pipeline --> RS["Dual-Constraint Reverse Solver<br/>(Quench Flow & Fan Actuation)"]
    
    M1 --> SpreadBar["UI: Vertical Spread Rate Bar<br/>(mm/s meter + ±2σ uncertainty)"]
    M1 & M2 & RS --> BottomLeft["UI: Bottom-Left Chart<br/>(50-pt Sweep, ±2σ Halo, Quench Target)"]
    M2 --> MiddleTable["UI: Middle Panel<br/>(Material Risk Ranking Table)"]
    M3 --> LeftSidebar["UI: Left Sidebar<br/>(Sector Triage Badges: Red/Amber/Green)"]
    M3 & RS --> BottomRight["UI: Bottom-Right Evidence Card<br/>(Hazard Driver % + Fan Actuation + NASA DOI)"]
```

### Tri-Model Summary Table (V2 Empirical Calibration)

| Model / Subsystem | Machine Learning Architecture | Physical Target / Role | Primary Inputs | Primary Output | Target UI Panel / Widget |
|---|---|---|---|---|---|
| **Model 1** | `GaussianProcessRegressor`<br/>(`ConstantKernel * RBF + WhiteKernel`) | Continuous flame spread rate ($\text{mm/s}$) & epistemic uncertainty ($\pm 2\sigma$) | $O_2\%$, Pressure, Airflow, LOI %, Material | `flame_spread_mm_s`, `uncertainty_2sigma_mm_s`, `spread_lower_mm_s`, `spread_upper_mm_s` | **Vertical Spread Rate Bar** (gauge replacement) and **Bottom-Left Chart** ($\pm 2\sigma$ confidence halo) |
| **Model 2** | `LogisticRegression`<br/>(Degree-2 `PolynomialFeatures`, balanced) | Binary ignition / sustained combustion probability | $O_2\%$, Pressure, Airflow, LOI %, Material | `probability_sustained`, `probability_extinguished`, `risk_status` (`HIGH`, `ELEVATED`, `LOW`) | **Middle Material Risk Ranking Table** (sorted list with probability bars & status pills) |
| **Model 3** | `RandomForestClassifier`<br/>(200 estimators, balanced) | Combustion regime classification & root-cause driver explainability | $O_2\%$, Pressure, Airflow, LOI %, Material, + Model 1 `flame_spread_mm_s` | `hazard_regime` (`NOMINAL`, `ELEVATED`, `CRITICAL`), `badge_color`, `hazard_drivers` (feature %) | **Left Sidebar** (Sector triage badges) and **Bottom-Right Evidence Card** ("Why is this burning?" % drivers) |
| **Reverse Solver** | Dual-Constraint Grid Optimizer | Calculates minimum airflow to safely quench active combustion | Material, $O_2\%$, Pressure, probability cutoff (0.05), spread threshold (0.5 mm/s) | `recommended_flow_velocity_cm_s`, `airflow_delta_cm_s`, fan command, quench status | **Bottom-Left Chart** (target point marker) and **Bottom-Right Evidence Card** (recommended actuation) |

---

## 2. Dataset V2 Improvements & Validation Metrics

The models are fitted to `data/processed/clean_combustion_data_v2.csv` containing **262 empirical flight tests** (0 missing values, 0 synthetic fields).

### 2.1 Dataset V1 vs V2 Comparison

- **Sample Size:** 248 records (V1) $\rightarrow$ **262 records (V2)** (+14 additional flight tests from BASS-I, BASS-II, Saffire-II).
- **Outcome Balance:** 186 SUSTAINED / 62 EXTINGUISHED $\rightarrow$ **155 SUSTAINED / 107 EXTINGUISHED** (improved balance reflecting true quenching/extinction boundaries).
- **Physical LOI Updates:** Corrected Limiting Oxygen Index thresholds matching aerospace literature:
  - Ultem Polyetherimide: 21.0% $\rightarrow$ **47.0%**
  - PMMA Cast Acrylic: 21.0% $\rightarrow$ **17.0%**
  - Paraffin Wax: 21.0% $\rightarrow$ **16.0%**
  - Sibal Fabric Blend: 19.5% $\rightarrow$ **18.5%**
  - Silicone RTV-560: 29.0% $\rightarrow$ **30.0%**
  - Kapton HN: 36.0% $\rightarrow$ **37.0%**
  - Nomex HT90-40: 28.5%, PTFE Teflon: 95.0%
- **Mission Resolution:** In V2, the dataset test IDs explicitly encode the flight mission campaign:
  - `BASS1-*` (121 records) $\rightarrow$ **BASS-I (ISS Flight Telemetry)**
  - `BASS2-*` (129 records) $\rightarrow$ **BASS-II (ISS Glovebox Flight)**
  - `SAF2-*` (9 records) $\rightarrow$ **Saffire-II (Cygnus Flight Burns)**
  - `STD-*` (3 records) $\rightarrow$ **NASA-STD-6001B Benchmark**

### 2.2 Model Validation Metrics (20% Stratified Holdout on V2)

#### Model 1: Gaussian Process Regressor
- **Validation Rows:** 53 rows (209 training)
- **Mean Absolute Error (MAE):** **0.2327 mm/s** (low error relative to the 0.0 – 3.83 mm/s empirical range)
- **Root Mean Squared Error (RMSE):** 0.4561 mm/s
- **$R^2$ Score:** 0.6126
- **Mean Validation Uncertainty ($\pm 2\sigma$ std):** 0.4808 mm/s
- **Fitted Kernel:** `1.96**2 * RBF(length_scale=3.52) + WhiteKernel(noise_level=0.359)`

#### Model 2: Degree-2 Polynomial Logistic Regression
- **Validation Rows:** 53 rows (209 training)
- **Accuracy:** **75.47%**
- **Precision (Sustained):** 78.13%
- **Recall (Sustained):** 80.65%
- **F1 Score (Sustained):** **79.37%**
- **ROC-AUC:** **80.94%**
- **Confusion Matrix:**
  $$\begin{pmatrix} 15 & 7 \\ 6 & 25 \end{pmatrix} \quad \begin{matrix} \text{Row 0: EXTINGUISHED} \\ \text{Row 1: SUSTAINED} \end{matrix}$$

#### Model 3: Random Forest Classifier (Hazard Regime Triage)
- **Validation Rows:** 53 rows (209 training)
- **Accuracy:** **92.45%**
- **Macro F1:** **93.78%**
- **Weighted F1:** 92.54%
- **Per-Class Breakdown:**
  - `NOMINAL` (quenched, 0 spread): Precision 100%, Recall 100%, F1 **100%**
  - `ELEVATED` (partial spread / below median): Precision 96.43%, Recall 90.0%, F1 **93.10%**
  - `CRITICAL` (sustained $\ge$ material median): Precision 83.33%, Recall 93.75%, F1 **88.24%**
- **Global Hazard Driver Percentages:**
  1. **Flame Spread Rate:** 49.07%
  2. **$O_2$ Concentration:** 17.89%
  3. **Airflow Velocity:** 12.15%
  4. **Material Type:** 7.55%
  5. **Cabin Pressure:** 7.06%
  6. **LOI Threshold:** 6.28%

---

## 3. Artifact & Module Directory Structure

All artifacts are persisted under `models/` and are ready to be loaded at FastAPI server startup:

```
uliens-fire-safety-dashboard/
├── data/
│   └── processed/
│       ├── clean_combustion_data_v2.csv       # 262 NASA flight records (Active V2)
│       ├── clean_combustion_data_v2.json      # JSON export of V2
│       └── clean_combustion_data.csv          # 248 records (V1 Archive)
├── model1/                                    # Model 1 Package
│   ├── __init__.py
│   ├── train.py                               # Train GP regressor on V2
│   └── inference.py                           # Standalone Model1 class
├── model2/                                    # Model 2 Package
│   ├── __init__.py
│   ├── train.py                               # Train Poly Logistic classifier on V2
│   └── inference.py                           # Standalone Model2 class
├── model3/                                    # Model 3 Package
│   ├── __init__.py
│   ├── train.py                               # Train Random Forest classifier on V2
│   └── inference.py                           # Standalone Model3 class
├── pipeline/                                  # Unified Tri-Model Module
│   ├── __init__.py                            # Exports TriModelPipeline
│   └── inference.py                           # Consolidated avionics evaluation API
└── models/                                    # Pre-trained Artifacts & Metadata (V2)
    ├── provenance_metadata.json               # NASA PSI IDs, DOIs, standards, LOI, records
    ├── model1/
    │   ├── model1_gaussian_process.pkl        # Fitted GP pipeline
    │   ├── material_metadata.json             # Per-material training ranges & spread stats
    │   └── metrics.json                       # MAE: 0.233 mm/s, R2: 0.613
    ├── model2/
    │   ├── model2_polynomial_logistic.pkl     # Fitted polynomial logistic pipeline
    │   ├── material_metadata.json             # Per-material training ranges & counts
    │   └── metrics.json                       # Accuracy: 75.5%, ROC-AUC: 80.9%, F1: 79.4%
    └── model3/
        ├── model3_random_forest.pkl           # Fitted Random Forest pipeline
        ├── material_metadata.json             # Per-material regime counts & medians
        ├── feature_importances.json           # Global hazard driver % weights
        ├── regime_derivation.json             # NASA regime labeling specification
        └── metrics.json                       # Accuracy: 92.5%, Macro F1: 93.8%
```

---

## 4. Server Startup & Quickstart Import

You do **not** need to load individual model files manually or write any `scikit-learn` or physics code. Simply instantiate `TriModelPipeline` as a singleton in your FastAPI lifespan or module scope:

```python
# app/core/ml.py or inside your FastAPI lifespan handler:
from pipeline import TriModelPipeline

# Initialize once at server startup (loads all pickles into memory in ~100ms):
ml_pipeline = TriModelPipeline()
```

### Supported Flight Materials (8 NASA PSI Test Benchmarks)

Call `ml_pipeline.materials` to get the complete list of valid materials:
1. `Kapton Hn` (Aromatic polyimide film)
2. `Nomex Ht90-40` (Aramid flame-resistant fabric)
3. `Paraffin Wax` (Phase-change thermal management wax)
4. `Pmma Cast Acrylic` (Transparent acrylic window/structure benchmark)
5. `Ptfe Teflon` (Polytetrafluoroethylene wiring insulation)
6. `Sibal Fabric Blend` (75% cotton / 25% fiberglass standard calibration fabric)
7. `Silicone Rtv-560` (High-temperature spacecraft gap sealant)
8. `Ultem Polyetherimide` (PEI thermoplastic avionics bracket structural resin)

---

## 5. API Function Signatures & Exact Payloads

### 5.1 Master Endpoint: `evaluate_avionics_state()`

> [!TIP]
> **Recommended Single-Call Strategy:** Use this function to power your main state evaluation route (e.g. `POST /api/avionics/evaluate` or a WebSocket event). It runs all three models and the reverse solver in ~5ms and returns a payload that populates the entire dashboard.

#### Signature
```python
ml_pipeline.evaluate_avionics_state(
    material: str,
    oxygen_pct: float,
    pressure_kpa: float,
    flow_velocity_cm_s: float,
    cutoff_probability: float = 0.05,
    spread_threshold_mm_s: float = 0.5,
    sweep_points: int = 50,
) -> dict[str, Any]
```

#### Example Call
```python
result = ml_pipeline.evaluate_avionics_state(
    material="Pmma Cast Acrylic",
    oxygen_pct=21.0,
    pressure_kpa=101.3,
    flow_velocity_cm_s=10.0,
    cutoff_probability=0.05,
    spread_threshold_mm_s=0.5,
)
```

#### Exact Output Payload Schema (Actual V2 Fitted Response)
```json
{
  "inputs": {
    "material": "Pmma Cast Acrylic",
    "oxygen_pct": 21.0,
    "pressure_kpa": 101.3,
    "flow_velocity_cm_s": 10.0,
    "cutoff_probability": 0.05,
    "spread_threshold_mm_s": 0.5
  },
  "spread_rate_meter": {
    "flame_spread_mm_s": 1.7847,
    "uncertainty_2sigma_mm_s": 0.8943,
    "spread_lower_mm_s": 0.8905,
    "spread_upper_mm_s": 2.679,
    "out_of_material_training_range": false
  },
  "sector_triage": [
    {
      "material_name": "Sibal Fabric Blend",
      "hazard_regime": "ELEVATED",
      "badge_color": "amber",
      "probability_sustained": 0.9248,
      "flame_spread_mm_s": 2.1737,
      "psi_investigation_id": "PSI-98",
      "mission_source": "BASS-II (ISS Glovebox Flight)",
      "out_of_material_training_range": false
    },
    {
      "material_name": "Pmma Cast Acrylic",
      "hazard_regime": "CRITICAL",
      "badge_color": "red",
      "probability_sustained": 0.7833,
      "flame_spread_mm_s": 1.7847,
      "psi_investigation_id": "PSI-26",
      "mission_source": "BASS-II (ISS Glovebox Flight)",
      "out_of_material_training_range": false
    },
    {
      "material_name": "Paraffin Wax",
      "hazard_regime": "ELEVATED",
      "badge_color": "amber",
      "probability_sustained": 0.1768,
      "flame_spread_mm_s": 0.9504,
      "psi_investigation_id": "PSI-GEN",
      "mission_source": "BASS-I (ISS Flight Telemetry)",
      "out_of_material_training_range": false
    },
    {
      "material_name": "Ultem Polyetherimide",
      "hazard_regime": "NOMINAL",
      "badge_color": "green",
      "probability_sustained": 0.0037,
      "flame_spread_mm_s": 0.0,
      "psi_investigation_id": "PSI-GEN",
      "mission_source": "BASS-I (ISS Flight Telemetry)",
      "out_of_material_training_range": true
    },
    {
      "material_name": "Silicone Rtv-560",
      "hazard_regime": "NOMINAL",
      "badge_color": "green",
      "probability_sustained": 0.0033,
      "flame_spread_mm_s": 0.0844,
      "psi_investigation_id": "PSI-99",
      "mission_source": "Saffire-II (Cygnus Flight Burns)",
      "out_of_material_training_range": true
    },
    {
      "material_name": "Kapton Hn",
      "hazard_regime": "NOMINAL",
      "badge_color": "green",
      "probability_sustained": 0.0028,
      "flame_spread_mm_s": 0.0,
      "psi_investigation_id": "PSI-25",
      "mission_source": "NASA-STD-6001B Benchmark",
      "out_of_material_training_range": false
    },
    {
      "material_name": "Nomex Ht90-40",
      "hazard_regime": "NOMINAL",
      "badge_color": "green",
      "probability_sustained": 0.0012,
      "flame_spread_mm_s": 0.0443,
      "psi_investigation_id": "PSI-25",
      "mission_source": "BASS-I (ISS Flight Telemetry)",
      "out_of_material_training_range": false
    },
    {
      "material_name": "Ptfe Teflon",
      "hazard_regime": "NOMINAL",
      "badge_color": "green",
      "probability_sustained": 0.0010,
      "flame_spread_mm_s": 0.1014,
      "psi_investigation_id": "PSI-26",
      "mission_source": "NASA-STD-6001B Benchmark",
      "out_of_material_training_range": false
    }
  ],
  "material_risk_ranking": [
    {
      "material_name": "Sibal Fabric Blend",
      "probability_sustained": 0.9248,
      "probability_extinguished": 0.0752,
      "risk_status": "HIGH",
      "predicted_outcome": "SUSTAINED",
      "flame_spread_mm_s": 2.1737,
      "uncertainty_2sigma_mm_s": 0.9114,
      "spread_lower_mm_s": 1.2622,
      "spread_upper_mm_s": 3.0851,
      "hazard_regime": "ELEVATED",
      "badge_color": "amber",
      "regime_probabilities": {
        "CRITICAL": 0.32,
        "ELEVATED": 0.655,
        "NOMINAL": 0.025
      },
      "loi_threshold_pct": 18.5,
      "critical_flow_window_cms": [3.0, 15.0],
      "psi_investigation_id": "PSI-98",
      "mission_source": "BASS-II (ISS Glovebox Flight)",
      "out_of_material_training_range": false
    },
    {
      "material_name": "Pmma Cast Acrylic",
      "probability_sustained": 0.7833,
      "probability_extinguished": 0.2167,
      "risk_status": "HIGH",
      "predicted_outcome": "SUSTAINED",
      "flame_spread_mm_s": 1.7847,
      "uncertainty_2sigma_mm_s": 0.8943,
      "spread_lower_mm_s": 0.8905,
      "spread_upper_mm_s": 2.679,
      "hazard_regime": "CRITICAL",
      "badge_color": "red",
      "regime_probabilities": {
        "CRITICAL": 0.99,
        "ELEVATED": 0.005,
        "NOMINAL": 0.005
      },
      "loi_threshold_pct": 17.0,
      "critical_flow_window_cms": [1.0, 15.0],
      "psi_investigation_id": "PSI-26",
      "mission_source": "BASS-II (ISS Glovebox Flight)",
      "out_of_material_training_range": false
    }
  ],
  "airflow_simulation": {
    "material_name": "Pmma Cast Acrylic",
    "critical_flow_window_cms": [1.0, 15.0],
    "loi_threshold_pct": 17.0,
    "quench_target": {
      "material_name": "Pmma Cast Acrylic",
      "cutoff_probability": 0.05,
      "spread_threshold_mm_s": 0.5,
      "search_range_cm_s": [0.0, 20.0],
      "step_cm_s": 0.5,
      "recommended_flow_velocity_cm_s": null,
      "probability_sustained": null,
      "flame_spread_mm_s": null,
      "uncertainty_2sigma_mm_s": null,
      "satisfies_dual_constraints": false,
      "status": "no_supported_quench_point_found",
      "action_summary": "No airflow setting within tested envelope quenches combustion under current O2/pressure levels. Depressurization or O2 scrubbing required."
    },
    "sweep_points": [
      {
        "flow_velocity_cm_s": 0.0,
        "flame_spread_mm_s": 0.8369,
        "uncertainty_2sigma_mm_s": 0.9227,
        "spread_lower_mm_s": 0.0,
        "spread_upper_mm_s": 1.7597,
        "probability_sustained": 0.5713,
        "out_of_material_training_range": false
      },
      {
        "flow_velocity_cm_s": 5.0,
        "flame_spread_mm_s": 1.3511,
        "uncertainty_2sigma_mm_s": 0.8901,
        "spread_lower_mm_s": 0.461,
        "spread_upper_mm_s": 2.2411,
        "probability_sustained": 0.6952,
        "out_of_material_training_range": false
      },
      {
        "flow_velocity_cm_s": 10.0,
        "flame_spread_mm_s": 1.7847,
        "uncertainty_2sigma_mm_s": 0.8943,
        "spread_lower_mm_s": 0.8905,
        "spread_upper_mm_s": 2.679,
        "probability_sustained": 0.7833,
        "out_of_material_training_range": false
      },
      {
        "flow_velocity_cm_s": 15.0,
        "flame_spread_mm_s": 1.997,
        "uncertainty_2sigma_mm_s": 0.9159,
        "spread_lower_mm_s": 1.0811,
        "spread_upper_mm_s": 2.9129,
        "probability_sustained": 0.8414,
        "out_of_material_training_range": false
      },
      {
        "flow_velocity_cm_s": 20.0,
        "flame_spread_mm_s": 1.9503,
        "uncertainty_2sigma_mm_s": 0.9784,
        "spread_lower_mm_s": 0.972,
        "spread_upper_mm_s": 2.9287,
        "probability_sustained": 0.8782,
        "out_of_material_training_range": false
      }
    ]
  },
  "evidence_and_actuation": {
    "active_regime": "CRITICAL",
    "badge_color": "red",
    "regime_probabilities": {
      "CRITICAL": 0.99,
      "ELEVATED": 0.005,
      "NOMINAL": 0.005
    },
    "hazard_drivers": [
      {
        "feature": "flame_spread_mm_s",
        "label": "Flame Spread Rate",
        "importance_pct": 49.07
      },
      {
        "feature": "oxygen_pct",
        "label": "O2 Concentration",
        "importance_pct": 17.89
      },
      {
        "feature": "flow_velocity_cm_s",
        "label": "Airflow Velocity",
        "importance_pct": 12.15
      },
      {
        "feature": "material_name",
        "label": "Material Type",
        "importance_pct": 7.55
      },
      {
        "feature": "pressure_kpa",
        "label": "Cabin Pressure",
        "importance_pct": 7.06
      },
      {
        "feature": "loi_threshold_pct",
        "label": "LOI Threshold",
        "importance_pct": 6.28
      }
    ],
    "reverse_solver_recommendation": {
      "material_name": "Pmma Cast Acrylic",
      "cutoff_probability": 0.05,
      "spread_threshold_mm_s": 0.5,
      "search_range_cm_s": [0.0, 20.0],
      "step_cm_s": 0.5,
      "recommended_flow_velocity_cm_s": null,
      "probability_sustained": null,
      "flame_spread_mm_s": null,
      "uncertainty_2sigma_mm_s": null,
      "satisfies_dual_constraints": false,
      "warning": "Research-model estimate; not certified fire-safety guidance or operational ventilation procedure.",
      "status": "no_supported_quench_point_found",
      "action_summary": "No airflow setting within tested envelope quenches combustion under current O2/pressure levels. Depressurization or O2 scrubbing required."
    },
    "airflow_delta_cm_s": null,
    "fan_actuation_command": "DEPRESS_OR_SCRUB_REQUIRED",
    "nasa_provenance": {
      "material_name": "Pmma Cast Acrylic",
      "psi_investigation_id": "PSI-26",
      "mission_source": "BASS-II (ISS Glovebox Flight)",
      "standard_ref": "NASA-STD-6001B Test 1",
      "source_doi_url": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-26",
      "loi_threshold_pct": 17.0,
      "critical_flow_window_cms": [1.0, 15.0],
      "historical_finding": "BASS / Saffire-IV: Sustained continuous concurrent flame spread under forced microgravity ventilation; exhibited false-pass behavior relative to 1g tests.",
      "total_nasa_test_records": 178
    }
  }
}
```

---

## 6. UI Mapping Cheat Sheet

Here is the exact mapping between frontend dashboard widgets and JSON fields:

```
+---------------------------------------------------------------------------------------------------------------+
| TOP HEADER: NASA Microgravity Fire Safety Avionics                                                            |
+---------------------------------------------------------------------------------------------------------------+
| LEFT SIDEBAR                      | ROTARY GAUGES & SPREAD BAR        | MIDDLE PANEL: MATERIAL RISK RANKING   |
| [Sector Triage Badges]            | [O2 %]  [Pressure]  [Airflow]     | [Sorted by probability_sustained]     |
| • Sector 1 (Acrylic): RED         |                                   | Mat Name | P(Sustained) | Status Pill|
|   `sector_triage[i].badge_color`  | [SPREAD RATE METER]               | PMMA     | 78.3%        | HIGH       |
|   `sector_triage[i].hazard_regime`| `spread_rate_meter.flame_spread`  | Sibal    | 92.5%        | HIGH       |
| • PSI ID & Mission Source         | `spread_rate_meter.uncertainty_2σ`| Ultem    | 0.37%        | LOW        |
|                                   | `[spread_lower, spread_upper]`    | `material_risk_ranking[i].risk_status`|
+-----------------------------------+-----------------------------------+---------------------------------------+
| BOTTOM-LEFT: AIRFLOW SIMULATION CHART                                 | BOTTOM-RIGHT: EVIDENCE & ACTUATION    |
| • Solid line: Model 1 `flame_spread_mm_s` vs airflow                   | • "Why is this burning?" Drivers:     |
| • Shaded area: `[spread_lower_mm_s, spread_upper_mm_s]` (±2σ Halo)    |   `evidence_and_actuation.drivers[%]` |
| • Dashed line: Model 2 `probability_sustained`                        | • Reverse-Solver Actuation:           |
| • Vertical brackets: `critical_flow_window_cms`                       |   `fan_actuation_command`             |
| • Quench marker: `quench_target.recommended_flow_velocity_cm_s`      | • Citation: `nasa_provenance.doi_url` |
+---------------------------------------------------------------------------------------------------------------+
```

### Detailed Field Mapping Reference

| UI Panel & Widget | JSON Response Field | Type & Format | Visual / Functional Presentation |
|---|---|---|---|
| **Vertical Spread Rate Bar** | `spread_rate_meter.flame_spread_mm_s` | `float` (0.00 – 3.83 mm/s) | Center needle / bar height value |
| **Vertical Spread Rate Bar** | `spread_rate_meter.uncertainty_2sigma_mm_s` | `float` (e.g. ±0.89 mm/s) | Numeric uncertainty readout next to needle |
| **Vertical Spread Rate Bar** | `spread_rate_meter.spread_lower_mm_s` / `spread_upper_mm_s` | `float` (mm/s) | Upper and lower tick marks flanking the active rate |
| **Left Sidebar (Sector Triage)** | `sector_triage[i].hazard_regime` | `"NOMINAL"` \| `"ELEVATED"` \| `"CRITICAL"` | Text label on compartment sector card |
| **Left Sidebar (Sector Triage)** | `sector_triage[i].badge_color` | `"green"` \| `"amber"` \| `"red"` | Border and fill color of status pill / badge |
| **Left Sidebar (Sector Triage)** | `sector_triage[i].psi_investigation_id` | `"PSI-26"`, `"PSI-98"`, etc. | NASA flight benchmark sub-tag |
| **Left Sidebar (Sector Triage)** | `sector_triage[i].mission_source` | `"BASS-I"`, `"BASS-II"`, `"Saffire-II"` | Flight campaign sub-label |
| **Middle Risk Table** | `material_risk_ranking[i].probability_sustained` | `float` (0.0 to 1.0) | Displayed as percentage (e.g., `78.3%`) & progress bar width |
| **Middle Risk Table** | `material_risk_ranking[i].risk_status` | `"HIGH"` \| `"ELEVATED"` \| `"LOW"` | Colored pill badge (`HIGH` = red, `ELEVATED` = amber, `LOW` = cyan/neutral) |
| **Bottom-Left Chart** | `airflow_simulation.sweep_points` | `list[dict]` (50 items) | X-axis: `flow_velocity_cm_s`; Left Y-axis: `flame_spread_mm_s`; Right Y-axis: `probability_sustained` |
| **Bottom-Left Chart (Halo)** | `sweep_points[i].spread_lower_mm_s` / `spread_upper_mm_s` | `float` | Area chart fill (semi-transparent shaded halo around spread line) |
| **Bottom-Left Chart (Window)** | `airflow_simulation.critical_flow_window_cms` | `[min, max]` (e.g. `[1.0, 15.0]`) | Vertical shaded band or bracket indicators highlighting microgravity airflow danger zone |
| **Bottom-Left Chart (Quench)** | `airflow_simulation.quench_target` | `dict` | Star / target point marker at `recommended_flow_velocity_cm_s` |
| **Bottom-Right Card (Drivers)** | `evidence_and_actuation.hazard_drivers` | `list[{feature, label, importance_pct}]` | Horizontal progress bars displaying driver impact (e.g., "Flame Spread Rate: 49.1%", "Airflow Velocity: 12.2%") |
| **Bottom-Right Card (Actuation)**| `evidence_and_actuation.fan_actuation_command` | `string` | Emergency actuation pill (`THROTTLE_DOWN (-X.X cm/s)`, `NOMINAL_HOLD`, or `DEPRESS_OR_SCRUB_REQUIRED`) |
| **Bottom-Right Card (Citation)** | `evidence_and_actuation.nasa_provenance` | `dict` | Clickable hyperlink to NASA PSI repository, standard reference (`NASA-STD-6001B`), and mission notes |

---

## 7. Edge Cases & Validation Rules

> [!WARNING]
> **Out-of-Range Handling:**  
> The NASA test matrix tested airflows from 0.0 to 30.0 cm/s, $O_2$ from 13.6% to 34.0%, and pressure from 70.3 to 102.2 kPa. If the user scrolls dials beyond a specific material's observed envelope:
> - `out_of_material_training_range` returns `true`.
> - The UI should display a subtle amber advisory: *"Extrapolated condition: exceeds empirical NASA test boundary for this material"*.
> - The models will still return mathematical estimates, but with appropriately expanded $\pm 2\sigma$ uncertainty bands.

> [!NOTE]
> **Reverse Solver Quench Feasibility:**  
> If an active material is highly combustible (such as PMMA at nominal 21% $O_2$), reducing airflow alone will **not** bring sustained probability below 5% because microgravity boundary layers sustain smoldering even at near-zero forced flow. In such cases:
> - `quench_target.status` returns `"no_supported_quench_point_found"`.
> - `quench_target.recommended_flow_velocity_cm_s` is `null`.
> - `fan_actuation_command` will read `"DEPRESS_OR_SCRUB_REQUIRED"`.
> Ensure your frontend handles `recommended_flow_velocity_cm_s: null` gracefully (by hiding the quench star marker or displaying a caution indicator).

---

## 8. Verification Test Suite

You can verify the entire pipeline on your machine anytime by running:

```powershell
python -c "from pipeline.inference import TriModelPipeline; pipe = TriModelPipeline(); print('Loaded materials:', pipe.materials); assert len(pipe.materials) == 8; res = pipe.evaluate_avionics_state('Pmma Cast Acrylic', 21.0, 101.3, 10.0); print('Pipeline status: OK! Payload keys:', list(res.keys()))"
```

If you need any adjustments to payload shapes or additional derived statistics, all logic is isolated inside `pipeline/inference.py`.

import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { InstrumentControls, type ControlKey } from './components/InstrumentControls';
import { MaterialRisk } from './components/MaterialRisk';
import { SimulationViews } from './components/SimulationViews';
import { StatusPanel } from './components/StatusPanel';
import { controlLimits, getPreviewPoint, presets, toMaterial, type Preset, type Readings, type Sector } from './data';
import {
  evaluateAvionicsState,
  fetchCatalog,
  type Catalog,
  type Evaluation,
  type EvaluationRequest,
} from './services/avionicsService';

const initialPreset = presets[0];

function App() {
  const [scenario, setScenario] = useState({
    sector: initialPreset.sector,
    presetId: initialPreset.id,
    target: initialPreset.readings,
    sample: initialPreset.readings,
  });
  const [selectedMaterial, setSelectedMaterial] = useState('Pmma Cast Acrylic');
  const [armedControl, setArmedControl] = useState<ControlKey | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [catalogFailed, setCatalogFailed] = useState(false);
  const [result, setResult] = useState<{ request: EvaluationRequest; response: Evaluation | null } | null>(null);
  const [retry, setRetry] = useState(0);
  const { target, sample, sector, presetId } = scenario;
  const materials = useMemo(() => catalog?.materials.map(toMaterial) ?? [], [catalog]);
  const activeMaterial = materials.find((material) => material.material_name === selectedMaterial) ?? materials[0];
  const materialKey = activeMaterial?.material_name;
  const isEarth = target.gravity === 1;

  useEffect(() => {
    if (catalog) return;
    const controller = new AbortController();
    fetchCatalog(controller.signal).then((response) => {
      if (!controller.signal.aborted) setCatalog(response);
    }).catch(() => {
      if (!controller.signal.aborted) setCatalogFailed(true);
    });
    return () => controller.abort();
  }, [catalog, retry]);

  const request = useMemo<EvaluationRequest | null>(() => {
    if (isEarth || !materialKey) return null;
    return {
      material: materialKey,
      oxygen_pct: target.oxygen,
      pressure_kpa: target.pressure,
      flow_velocity_cm_s: target.airflow,
      cutoff_probability: 0.05,
      spread_threshold_mm_s: 0.5,
      sweep_points: 50,
    };
  }, [isEarth, materialKey, target.oxygen, target.pressure, target.airflow]);

  useEffect(() => {
    if (!request || !catalog) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      evaluateAvionicsState(request, controller.signal).then((response) => {
        if (controller.signal.aborted) return;
        if (response.model_version !== catalog.model_version || response.dataset_version !== catalog.dataset_version) {
          throw new Error('Catalog and evaluation versions differ');
        }
        setResult({ request, response });
      }).catch(() => {
        if (!controller.signal.aborted) setResult({ request, response: null });
      });
    }, 200);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [request, catalog, retry]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setArmedControl(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const evaluation = request && result?.request === request ? result.response : null;
  const unavailable = catalogFailed || (request !== null && result?.request === request && !evaluation);
  const loadingLabel = catalog ? 'Evaluating scenario…' : 'Loading material catalog…';
  const statusMessage = unavailable ? 'Scenario data unavailable' : isEarth && catalog
    ? 'Earth reference · Limiting oxygen index comparison'
    : evaluation ? null : loadingLabel;

  function selectSector(sector: Sector) {
    setScenario((current) => ({ ...current, sector }));
    setArmedControl(null);
  }

  function loadPreset(preset: Preset) {
    setScenario({ sector: preset.sector, presetId: preset.id, target: preset.readings, sample: preset.readings });
    setArmedControl(null);
  }

  function updateTarget(next: Partial<Readings>) {
    setScenario((current) => ({ ...current, target: { ...current.target, ...next } }));
  }

  function updateReading(key: ControlKey, value: number) {
    if (key === 'gravity') {
      updateTarget({ gravity: value === 1 ? 1 : 0 });
      return;
    }
    const { min, max } = controlLimits[key];
    updateTarget({ [key]: Math.max(min, Math.min(max, value)) });
  }

  const preview = evaluation && getPreviewPoint(evaluation.evidence_and_actuation.reverse_solver_recommendation);

  return (
    <main className="mx-auto grid w-full max-w-[1700px] gap-2 p-2 compact:p-3">
      <Header />
      {statusMessage && (
        <div role="status" className="flex items-center gap-2 px-1 font-mono text-[10.5px] text-secondary">
          <span>{statusMessage}</span>
          {unavailable && (
            <button
              type="button"
              className="border border-line px-2 text-primary"
              onClick={() => {
                setCatalog(null);
                setCatalogFailed(false);
                setResult(null);
                setRetry((current) => current + 1);
              }}
            >Retry</button>
          )}
        </div>
      )}
      <section className="grid grid-cols-1 items-stretch gap-2 deck:grid-cols-[minmax(270px,310px)_minmax(0,1fr)] deck:gap-2.5">
        <StatusPanel
          activeSector={sector}
          activePreset={presetId}
          sectorTriage={evaluation?.sector_triage}
          materials={materials}
          isEarth={isEarth}
          onSelectSector={selectSector}
          onLoadPreset={loadPreset}
        />
        <div className="grid min-w-0 content-start gap-2">
          <InstrumentControls
            values={target}
            live={sample}
            armedControl={armedControl}
            spreadRateMeter={evaluation?.spread_rate_meter}
            onArm={setArmedControl}
            onChange={updateReading}
          />
          <MaterialRisk
            activeSector={sector}
            selectedMaterial={materialKey}
            materials={materials}
            ranking={evaluation?.material_risk_ranking}
            earthOxygen={isEarth ? target.oxygen : undefined}
            onSelectMaterial={setSelectedMaterial}
          />
        </div>
      </section>
      <SimulationViews
        readings={target}
        selectedMaterial={activeMaterial ?? null}
        evaluation={evaluation}
        onPreviewTarget={preview ? () => updateTarget({ airflow: preview.flow }) : undefined}
      />
      <p className="w-full indent-[0.16em] text-center font-brand text-[10.5px] font-medium leading-none tracking-[0.16em] text-secondary">
        Uliens
      </p>
    </main>
  );
}

export default App;

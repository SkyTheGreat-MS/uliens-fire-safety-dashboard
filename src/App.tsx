import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { InstrumentControls, type ControlKey } from './components/InstrumentControls';
import { MaterialRisk } from './components/MaterialRisk';
import { SimulationViews } from './components/SimulationViews';
import { StatusPanel } from './components/StatusPanel';
import {
  materials,
  sectors,
  type AvionicsEvaluationResponse,
  type Preset,
  type Readings,
  type Sector,
} from './data';
import { evaluateAvionicsState } from './services/avionicsService';

const initialReadings: Readings = {
  oxygen: 21.0,
  airflow: 12.0,
  pressure: 101.3,
  temperature: 22,
  gravity: 0,
};

function App() {
  const [activeSector, setActiveSector] = useState<Sector>(0);
  const [activePreset, setActivePreset] = useState('01');
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState<number>(0); // 0 = PMMA Cast Acrylic
  const [readings, setReadings] = useState<Readings>(initialReadings);
  const [liveReadings, setLiveReadings] = useState<Readings>(initialReadings);
  const [armedControl, setArmedControl] = useState<ControlKey | null>(null);
  const [evaluation, setEvaluation] = useState<AvionicsEvaluationResponse | null>(null);

  const activeMaterial = materials[selectedMaterialIndex] ?? materials[0];

  // Evaluate avionics state against Python FastAPI backend (or empirical NASA fallback)
  useEffect(() => {
    let active = true;

    evaluateAvionicsState({
      material: activeMaterial.material_name,
      oxygen_pct: readings.oxygen,
      pressure_kpa: readings.pressure,
      flow_velocity_cm_s: readings.airflow,
      gravity: readings.gravity,
    }).then((res) => {
      if (active) {
        setEvaluation(res);
      }
    });

    return () => {
      active = false;
    };
  }, [
    activeMaterial.material_name,
    readings.oxygen,
    readings.pressure,
    readings.airflow,
    readings.gravity,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setArmedControl(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const selectSector = useCallback((sector: Sector) => {
    setActiveSector(sector);
    setArmedControl(null);
  }, []);

  const loadPreset = (preset: Preset) => {
    setActivePreset(preset.id);
    setActiveSector(preset.sector);
    setReadings(preset.readings);
    setLiveReadings(preset.readings);
    setArmedControl(null);
  };

  const updateReading = useCallback((key: ControlKey, value: number) => {
    const limits: Record<ControlKey, [number, number, number]> = {
      oxygen: [12, 36, 0.1],
      airflow: [0, 50, 0.5],
      pressure: [50, 115, 0.5],
      gravity: [0, 1, 1],
      spread: [0, 3.5, 0.05],
    };
    const [min, max, step] = limits[key];
    const bounded = Math.max(min, Math.min(max, Math.round(value / step) * step));
    setReadings((current) => ({ ...current, [key]: bounded }));
  }, []);

  return (
    <main className="mx-auto grid w-full max-w-[1700px] gap-2 p-2 compact:p-3">
      <Header />
      <section className="grid grid-cols-1 items-stretch gap-2 deck:grid-cols-[minmax(270px,310px)_minmax(0,1fr)] deck:gap-2.5">
        <StatusPanel
          activeSector={activeSector}
          activePreset={activePreset}
          sectorTriage={evaluation?.sector_triage}
          onSelectSector={selectSector}
          onLoadPreset={loadPreset}
        />
        <div className="grid min-w-0 content-start gap-2">
          <InstrumentControls
            values={readings}
            live={liveReadings}
            armedControl={armedControl}
            spreadRateMeter={evaluation?.spread_rate_meter}
            onArm={setArmedControl}
            onChange={updateReading}
          />
          <MaterialRisk
            activeSector={activeSector}
            selectedMaterial={selectedMaterialIndex}
            ranking={evaluation?.material_risk_ranking}
            onSelectMaterial={(index) => setSelectedMaterialIndex(index)}
          />
        </div>
      </section>
      <SimulationViews
        currentAirflow={readings.airflow}
        readings={readings}
        selectedMaterial={activeMaterial}
        airflowSimulation={evaluation?.airflow_simulation}
        evidenceAndActuation={evaluation?.evidence_and_actuation}
        reverseSolverTarget={
          evaluation?.evidence_and_actuation?.reverse_solver_recommendation
            ? {
                flow_velocity_cm_s:
                  evaluation.evidence_and_actuation.reverse_solver_recommendation
                    .recommended_flow_velocity_cm_s,
                rpm:
                  evaluation.evidence_and_actuation.reverse_solver_recommendation
                    .recommended_flow_velocity_cm_s != null
                    ? Math.round(
                        evaluation.evidence_and_actuation.reverse_solver_recommendation
                          .recommended_flow_velocity_cm_s * 85
                      )
                    : null,
                post_throttle_risk_pct:
                  evaluation.evidence_and_actuation.reverse_solver_recommendation
                    .probability_sustained_at_target != null
                    ? evaluation.evidence_and_actuation.reverse_solver_recommendation
                        .probability_sustained_at_target * 100
                    : null,
                command: evaluation.evidence_and_actuation.fan_actuation_command,
              }
            : null
        }
        onApplyOverride={(targetFlow) => updateReading('airflow', targetFlow)}
        onAirflowChange={(flow) => updateReading('airflow', flow)}
      />
      <footer className="flex flex-col items-start gap-x-[18px] gap-y-2 bg-surface px-2.5 py-2 font-mono text-[10.5px] text-secondary compact:flex-row compact:flex-wrap compact:items-center compact:justify-between">
        <div className="flex flex-wrap gap-3">
          <span className="flex items-center gap-1.5">
            <i className="inline-block size-1.5 bg-primary" />
            Sample readout
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block size-1.5 bg-warning" />
            Elevated visual state
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block size-1.5 bg-critical" />
            Armed control
          </span>
        </div>
        <span>Gauges: click to arm scroll / drag · Arrows adjust (Shift ×10) · Esc disarms</span>
        <span>
          {sectors[activeSector].short} ·{' '}
          {readings.gravity === 1 ? '1.00g Earth Baseline' : '0.00g NASA PSI-26 Model'}
        </span>
      </footer>
    </main>
  );
}

export default App;

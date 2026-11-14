import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { InstrumentControls, type ControlKey } from './components/InstrumentControls';
import { MaterialRisk } from './components/MaterialRisk';
import { SimulationViews } from './components/SimulationViews';
import { StatusPanel } from './components/StatusPanel';
import { sectors, type Preset, type Readings, type Sector } from './data';

const initialReadings: Readings = { oxygen: 21, airflow: 12, pressure: 101.3, temperature: 22, gravity: 0 };

function App() {
  const [activeSector, setActiveSector] = useState<Sector>(0);
  const [activePreset, setActivePreset] = useState('01');
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [readings, setReadings] = useState<Readings>(initialReadings);
  const [liveReadings, setLiveReadings] = useState<Readings>(initialReadings);
  const [armedControl, setArmedControl] = useState<ControlKey | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setArmedControl(null);
        setSelectedMaterial(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const selectSector = useCallback((sector: Sector) => { setActiveSector(sector); setArmedControl(null); }, []);
  const loadPreset = (preset: Preset) => { setActivePreset(preset.id); setActiveSector(preset.sector); setReadings(preset.readings); setLiveReadings(preset.readings); setArmedControl(null); };
  const updateReading = useCallback((key: ControlKey, value: number) => {
    const limits: Record<ControlKey, [number, number, number]> = {
      oxygen: [12, 36, 0.1], airflow: [0, 45, 0.5], pressure: [50, 115, 0.5], temperature: [15, 120, 1], gravity: [0, 2, 1],
    };
    const [min, max, step] = limits[key];
    const bounded = Math.max(min, Math.min(max, Math.round(value / step) * step));
    setReadings(current => ({ ...current, [key]: bounded }));
  }, []);

  return <main className="mx-auto grid w-full max-w-[1700px] gap-2 p-2 compact:p-3">
    <Header />
    <section className="grid grid-cols-1 items-start gap-2 deck:grid-cols-[minmax(270px,310px)_minmax(0,1fr)] deck:gap-2.5">
      <StatusPanel activeSector={activeSector} activePreset={activePreset} onSelectSector={selectSector} onLoadPreset={loadPreset} />
      <div className="grid min-w-0 content-start gap-2">
        <InstrumentControls values={readings} live={liveReadings} armedControl={armedControl} onArm={setArmedControl} onChange={updateReading} />
        <MaterialRisk activeSector={activeSector} selectedMaterial={selectedMaterial} onSelectMaterial={index => setSelectedMaterial(current => current === index ? null : index)} />
      </div>
    </section>
    <SimulationViews />
    <footer className="flex flex-col items-start gap-x-[18px] gap-y-2 border border-line bg-surface px-2.5 py-2 font-mono text-[8px] text-muted compact:flex-row compact:flex-wrap compact:items-center compact:justify-between">
      <div className="flex flex-wrap gap-3">
        <span className="flex items-center gap-1.5"><i className="inline-block size-1.5 bg-cyan" />Sample readout</span>
        <span className="flex items-center gap-1.5"><i className="inline-block size-1.5 bg-amber" />Elevated visual state</span>
        <span className="flex items-center gap-1.5"><i className="inline-block size-1.5 bg-red" />Armed control</span>
      </div>
      <span>Gauges: click to arm scroll / drag · Arrows adjust (Shift ×10) · Esc disarms</span>
      <span>{sectors[activeSector].short} · Local demo only</span>
    </footer>
  </main>;
}

export default App;

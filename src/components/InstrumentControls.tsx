import { useCallback, type KeyboardEvent } from 'react';
import { gravityRegimes, type Readings } from '../data';
import { useAvionicsControl } from '../hooks/useAvionicsControl';

export type ControlKey = 'oxygen' | 'airflow' | 'pressure' | 'temperature' | 'gravity';
type Props = { values: Readings; live: Readings; armedControl: ControlKey | null; onArm: (key: ControlKey | null) => void; onChange: (key: ControlKey, value: number) => void };

export function InstrumentControls({ values, live, armedControl, onArm, onChange }: Props) {
  return <section className="panel control-panel"><div className="section-head"><h2>Environmental controls</h2><span>Local demo state</span></div><div className="control-grid">
    <Dial id="oxygen" label="O₂ concentration" unit="O₂ vol %" value={values.oxygen} baseline={live.oxygen} min={12} max={36} step={0.1} digits={1} armed={armedControl === 'oxygen'} onArm={() => onArm('oxygen')} onDisarm={() => onArm(null)} onChange={value => onChange('oxygen', value)} />
    <Dial id="airflow" label="Airflow velocity" unit="cm/s" value={values.airflow} baseline={live.airflow} min={0} max={45} step={0.5} digits={1} armed={armedControl === 'airflow'} onArm={() => onArm('airflow')} onDisarm={() => onArm(null)} onChange={value => onChange('airflow', value)} />
    <Dial id="pressure" label="Cabin pressure" unit="kPa" value={values.pressure} baseline={live.pressure} min={50} max={115} step={0.5} digits={1} armed={armedControl === 'pressure'} onArm={() => onArm('pressure')} onDisarm={() => onArm(null)} onChange={value => onChange('pressure', value)} />
    <TemperatureControl value={values.temperature} armed={armedControl === 'temperature'} onArm={() => onArm('temperature')} onDisarm={() => onArm(null)} onChange={value => onChange('temperature', value)} />
    <GravityControl value={values.gravity} armed={armedControl === 'gravity'} onArm={() => onArm('gravity')} onChange={value => onChange('gravity', value)} />
  </div></section>;
}

type DialProps = { id: ControlKey; label: string; unit: string; value: number; baseline: number; min: number; max: number; step: number; digits: number; armed: boolean; onArm: () => void; onDisarm: () => void; onChange: (value: number) => void };

function Dial({ label, unit, value, baseline, min, max, step, digits, armed, onArm, onDisarm, onChange }: DialProps) {
  const adjust = useCallback((amount: number) => onChange(Math.max(min, Math.min(max, Math.round((value + amount) / step) * step))), [max, min, onChange, step, value]);
  const interactions = useAvionicsControl({ armed, step, onArm, onAdjust: adjust, onDisarm });
  const progress = (n: number) => Math.max(0, Math.min(1, (n - min) / (max - min)));
  const format = (n: number) => n.toFixed(digits);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      onArm();
      onChange(event.key === 'Home' ? min : max);
      return;
    }
    interactions.onKeyDown(event);
  };
  return <div className="dial-column">
    <div ref={interactions.ref} className={`dial ${armed ? 'armed' : ''}`} role="slider" aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${format(value)} ${unit}; sample ${format(baseline)} ${unit}`} tabIndex={0} onClick={onArm} onKeyDown={onKeyDown} onPointerDown={interactions.onPointerDown} onPointerMove={interactions.onPointerMove} onPointerUp={interactions.onPointerUp}>
      <div className="dial-title">{label}</div>{armed && <span className="armed-chip">ARMED</span>}
      <svg viewBox="0 0 140 140" aria-hidden="true">
        <g className="dial-spikes">
          {Array.from({ length: 32 }, (_, index) => {
            const angle = (index + 0.5) * 360 / 32;
            const variation = ((7 * index * index + 13 * index) % 37) / 36;
            const height = 1.3 + variation + progress(value) * (2.45 + 2 * variation);
            return <g key={index} transform={`rotate(${angle} 70 70)`}>
              <line x1="70" y1="5" x2="70" y2="4" style={{ transform: `scaleY(${height})`, animationDelay: `${-4.8 * variation}s` }} />
            </g>;
          })}
        </g>
        <g className="ticks">{Array.from({ length: 37 }, (_, index) => { const a = ((135 + index * 270 / 36) * Math.PI) / 180; const r1 = 58; const r2 = index % 3 === 0 ? 65 : 62; return <line key={index} x1={70 + Math.cos(a) * r1} y1={70 + Math.sin(a) * r1} x2={70 + Math.cos(a) * r2} y2={70 + Math.sin(a) * r2} />; })}</g><circle className="track" cx="70" cy="70" r="48" strokeDasharray="226 302" transform="rotate(135 70 70)" /><circle className="live-arc" cx="70" cy="70" r="48" strokeDasharray={`${progress(baseline) * 302} ${302 - progress(baseline) * 302}`} transform="rotate(135 70 70)" /><circle className="target-arc" cx="70" cy="70" r="57" strokeDasharray={`${progress(value) * 358} ${358 - progress(value) * 358}`} transform="rotate(135 70 70)" /><circle key={value} className="sweep-arc" cx="70" cy="70" r="57" strokeDasharray="16 342" transform="rotate(135 70 70)" /><text className="dial-value" x="70" y="70">{format(value)}</text><text className="dial-unit" x="70" y="84">{unit}</text></svg>
      <div className="dial-read">Sample <b>{format(baseline)}</b><span>/</span>Target <b className="amber-text">{format(value)}</b></div>
    </div>
  </div>;
}

function TemperatureControl({ value, armed, onArm, onDisarm, onChange }: { value: number; armed: boolean; onArm: () => void; onDisarm: () => void; onChange: (value: number) => void }) {
  const adjust = useCallback((amount: number) => onChange(Math.max(15, Math.min(120, value + amount))), [onChange, value]);
  const interactions = useAvionicsControl({ armed, step: 1, onArm, onAdjust: adjust, onDisarm });
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      onArm();
      onChange(event.key === 'Home' ? 15 : 120);
      return;
    }
    interactions.onKeyDown(event);
  };
  return <div className="temperature-wrap"><div ref={interactions.ref} className={`temp-control ${armed ? 'armed' : ''}`} role="slider" aria-label="Temperature" aria-valuemin={15} aria-valuemax={120} aria-valuenow={value} aria-valuetext={`${value.toFixed(0)} degrees Celsius`} tabIndex={0} onClick={onArm} onKeyDown={onKeyDown} onPointerDown={interactions.onPointerDown} onPointerMove={interactions.onPointerMove} onPointerUp={interactions.onPointerUp}><div className="temp-title">TEMP °C</div>{armed && <span className="armed-chip">ARMED</span>}<div className="temp-segments">{Array.from({ length: 10 }, (_, i) => { const threshold = i < 5 ? 15 + (i + 1) * 4 : i < 8 ? 35 + (i - 4) * 10 : 65 + (i - 7) * 27.5; const tone = i < 5 ? 'cyan' : i < 8 ? 'amber' : 'red'; return <i key={i} className={`segment ${value >= threshold ? `on ${tone}` : ''}`} />; })}</div><div className="temp-value">{value.toFixed(0)}°</div><small>15–120 °C</small></div></div>;
}

function GravityControl({ value, armed, onArm, onChange }: { value: number; armed: boolean; onArm: () => void; onChange: (value: number) => void }) {
  const regime = gravityRegimes[value];
  return <div className={`gravity-control ${armed ? 'armed' : ''}`}><div className="gravity-title" role="group" tabIndex={0} onClick={onArm} onKeyDown={event => { if (event.key === 'Escape') onArm(); }}>{armed && <span className="armed-chip">ARMED</span>}<span>Gravity regime</span></div><div className="gravity-switch"><button aria-label="Previous gravity" onClick={() => { onArm(); onChange((value + 2) % 3); }}>‹</button><div><b>{regime.value}</b><span>{regime.name}</span></div><button aria-label="Next gravity" onClick={() => { onArm(); onChange((value + 1) % 3); }}>›</button></div><div className="gravity-detail">Transport<br />{regime.detail}</div></div>;
}


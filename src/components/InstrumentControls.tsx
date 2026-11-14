import { useCallback, useId, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { gravityRegimes, type Readings } from '../data';
import { useAvionicsControl } from '../hooks/useAvionicsControl';
import { panel, sectionHead, sectionMeta, sectionTitle } from './ui';

export type ControlKey = 'oxygen' | 'airflow' | 'pressure' | 'temperature' | 'gravity';
type Props = { values: Readings; live: Readings; armedControl: ControlKey | null; onArm: (key: ControlKey | null) => void; onChange: (key: ControlKey, value: number) => void };

const armedShell = (armed: boolean) => armed ? 'border-red bg-[#100c12]' : 'border-line bg-[#0a0d13]';
const armedChip = 'absolute right-[7px] top-2 bg-red-fill px-1 py-0.5 font-mono text-[8px] text-red';
const gravityButton = 'flex size-8 items-center justify-center border border-line bg-raised text-cyan hover:border-cyan';

// 270° clockwise sweep from 135° (bottom-left) to 405° (bottom-right), matching the radial ticks.
const gaugeArc = (radius: number) => {
  const offset = radius * Math.SQRT1_2;
  return `M ${(70 - offset).toFixed(3)} ${(70 + offset).toFixed(3)} A ${radius} ${radius} 0 1 1 ${(70 + offset).toFixed(3)} ${(70 + offset).toFixed(3)}`;
};

export function InstrumentControls({ values, live, armedControl, onArm, onChange }: Props) {
  return <section className={`${panel}`}><div className={`${sectionHead} mb-[9px]`}><h2 className={sectionTitle}>Environmental controls</h2><span className={sectionMeta}>Local demo state</span></div><div className="grid grid-cols-2 items-stretch gap-[7px] compact:grid-cols-3 tight:grid-cols-[repeat(3,minmax(145px,1fr))_84px_minmax(190px,1.15fr)]">
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
  const valueProgress = progress(value);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const spectrumId = `gauge-spectrum-${uid}`;
  const glowId = `gauge-glow-${uid}`;
  const fillLength = valueProgress * 360;
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
  return <div className="flex min-w-0 flex-col items-center">
    <div ref={interactions.ref} className={`relative flex min-h-[190px] w-full cursor-pointer touch-none select-none flex-col items-center border p-2 ${armedShell(armed)}`} role="slider" aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${format(value)} ${unit}; sample ${format(baseline)} ${unit}`} tabIndex={0} onClick={onArm} onKeyDown={onKeyDown} onPointerDown={interactions.onPointerDown} onPointerMove={interactions.onPointerMove} onPointerUp={interactions.onPointerUp}>
      <div className="self-start text-[9px] font-semibold uppercase tracking-[.08em] text-secondary">{label}</div>{armed && <span className={armedChip}>ARMED</span>}
      <svg viewBox="0 0 140 140" className="mt-auto h-auto w-[min(100%,156px)] overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={spectrumId} gradientUnits="userSpaceOnUse" x1="31" y1="70" x2="109" y2="70">
            <stop offset="0%" stopColor="#2ee66b" />
            <stop offset="50%" stopColor="#ffb000" />
            <stop offset="100%" stopColor="#ff2a4b" />
          </linearGradient>
          <filter id={glowId} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>
        <circle className="fill-none stroke-line stroke-[0.6] opacity-70" cx="70" cy="70" r="41" />
        <circle className="fill-none stroke-line stroke-[0.6] opacity-60" cx="70" cy="70" r="33" />
        <g>{Array.from({ length: 37 }, (_, index) => { const a = ((135 + index * 270 / 36) * Math.PI) / 180; const r1 = 51; const r2 = index % 3 === 0 ? 59 : 57; return <line key={index} className={`${armed ? 'stroke-secondary' : 'stroke-tick'} stroke-[0.8]`} x1={70 + Math.cos(a) * r1} y1={70 + Math.sin(a) * r1} x2={70 + Math.cos(a) * r2} y2={70 + Math.sin(a) * r2} />; })}</g>
        <path className="fill-none stroke-raised stroke-[5]" d={gaugeArc(47)} />
        <path className="fill-none stroke-green stroke-4" d={gaugeArc(47)} />
        <path className="fill-none stroke-amber stroke-2" d={gaugeArc(62)} />
        <path className="fill-none stroke-[10] opacity-30" stroke={`url(#${spectrumId})`} filter={`url(#${glowId})`} d={gaugeArc(55)} pathLength="360" strokeDasharray={`${fillLength} 360`} strokeLinecap="butt" />
        <path className="fill-none stroke-[10]" stroke={`url(#${spectrumId})`} d={gaugeArc(55)} pathLength="360" strokeDasharray={`${fillLength} 360`} strokeLinecap="butt" />
        <text className="fill-ink font-mono text-[20px] font-semibold [dominant-baseline:central] [text-anchor:middle]" x="70" y="70">{format(value)}</text><text className="fill-secondary font-mono text-[8px] [dominant-baseline:central] [text-anchor:middle]" x="70" y="84">{unit}</text></svg>
      <div className="mt-0 font-mono text-[8px] text-secondary">Sample <b className="font-normal text-cyan">{format(baseline)}</b><span className="mx-[5px] text-muted">/</span>Target <b className="font-normal text-amber">{format(value)}</b></div>
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
  return <div className="flex justify-center w-full compact:w-full tight:w-[60px]"><div ref={interactions.ref} className={`relative grid h-[190px] cursor-pointer touch-none select-none grid-rows-[auto_1fr_auto_auto] p-[7px] pt-[9px] ${armedShell(armed)}`} role="slider" aria-label="Temperature" aria-valuemin={15} aria-valuemax={120} aria-valuenow={value} aria-valuetext={`${value.toFixed(0)} degrees Celsius`} tabIndex={0} onClick={onArm} onKeyDown={onKeyDown} onPointerDown={interactions.onPointerDown} onPointerMove={interactions.onPointerMove} onPointerUp={interactions.onPointerUp}><div className="text-[8px] font-semibold uppercase tracking-[.08em] text-secondary">TEMP °C</div>{armed && <span className={armedChip}>ARMED</span>}<div className="flex flex-col-reverse justify-center gap-1 py-2">{Array.from({ length: 10 }, (_, i) => { const threshold = i < 5 ? 15 + (i + 1) * 4 : i < 8 ? 35 + (i - 4) * 10 : 65 + (i - 7) * 27.5; const segmentTone = i < 5 ? 'border-cyan bg-cyan' : i < 8 ? 'border-amber bg-amber' : 'border-red bg-red'; return <i key={i} className={`h-2 border ${value >= threshold ? segmentTone : 'border-[#232b37] bg-[#1a202b]'}`} />; })}</div><div className="font-mono text-[16px] text-ink">{value.toFixed(0)}°</div><small className="font-mono text-[10px] text-secondary">15–120 °C</small></div></div>;
}

function GravityControl({ value, armed, onArm, onChange }: { value: number; armed: boolean; onArm: () => void; onChange: (value: number) => void }) {
  const regime = gravityRegimes[value];
  return <div className={`relative min-h-[190px] border p-[9px] col-span-2 compact:col-span-2 tight:col-span-1 ${armedShell(armed)}`}><div className="text-[9px] font-semibold uppercase tracking-[.08em] text-secondary" role="group" aria-label="Gravity regime" tabIndex={0} onClick={onArm} onKeyDown={event => { if (event.key === 'Escape') onArm(); }}>{armed && <span className={armedChip}>ARMED</span>}<span>Gravity regime</span></div><div className="mb-3 mt-[19px] grid grid-cols-[32px_1fr_32px] items-center gap-1"><button className={gravityButton} aria-label="Previous gravity" onClick={() => { onArm(); onChange((value + 2) % 3); }}><ChevronLeft size={16} aria-hidden="true" /></button><div className="grid justify-items-center gap-[3px]"><b className="font-mono text-[12px] text-ink">{regime.value}</b><span className="font-mono text-[8px] tracking-[.08em] text-cyan">{regime.name}</span></div><button className={gravityButton} aria-label="Next gravity" onClick={() => { onArm(); onChange((value + 1) % 3); }}><ChevronRight size={16} aria-hidden="true" /></button></div><div className="mt-auto border-t border-line pt-2 font-mono text-[9px] leading-[1.45] text-secondary">Transport<br />{regime.detail}</div></div>;
}

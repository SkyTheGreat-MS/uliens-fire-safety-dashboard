import { useCallback, useId, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { gravityRegimes, type Readings, type SpreadRateMeter } from '../data';
import { useAvionicsControl } from '../hooks/useAvionicsControl';
import { panel, sectionHead, sectionMeta, sectionTitle } from './ui';

export type ControlKey = 'oxygen' | 'airflow' | 'pressure' | 'gravity' | 'spread';
type Props = {
  values: Readings;
  live: Readings;
  armedControl: ControlKey | null;
  spreadRateMeter?: SpreadRateMeter | null;
  onArm: (key: ControlKey | null) => void;
  onChange: (key: ControlKey, value: number) => void;
};

const armedShell = (armed: boolean) =>
  armed ? 'border-critical bg-critical/10' : 'border-transparent bg-void';
const armedChip =
  'absolute right-[7px] top-2 bg-critical px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-ink';
const gravityButton =
  'flex size-8 items-center justify-center border border-line bg-raised text-primary hover:border-primary hover:text-highlight transition-colors';

// 270° clockwise sweep from 135° (bottom-left) to 405° (bottom-right), matching the radial ticks.
const gaugeArc = (radius: number) => {
  const offset = radius * Math.SQRT1_2;
  return `M ${(70 - offset).toFixed(3)} ${(70 + offset).toFixed(3)} A ${radius} ${radius} 0 1 1 ${(70 + offset).toFixed(3)} ${(70 + offset).toFixed(3)}`;
};

export function InstrumentControls({
  values,
  live,
  armedControl,
  spreadRateMeter,
  onArm,
  onChange,
}: Props) {
  return (
    <section className={`${panel}`}>
      <div className={`${sectionHead} mb-[9px]`}>
        <h2 className={sectionTitle}>Environmental controls</h2>
        <span className={sectionMeta}>
          {values.gravity === 1 ? '1.00g Earth Baseline' : '0.00g NASA PSI-26 Model'}
        </span>
      </div>
      <div className="grid grid-cols-2 items-stretch gap-[7px] compact:grid-cols-3 tight:grid-cols-[repeat(3,minmax(145px,1fr))_84px_minmax(190px,1.15fr)]">
        <Dial
          id="oxygen"
          label="O₂ concentration"
          unit="O₂ vol %"
          value={values.oxygen}
          baseline={live.oxygen}
          min={12}
          max={36}
          step={0.1}
          digits={1}
          armed={armedControl === 'oxygen'}
          onArm={() => onArm('oxygen')}
          onDisarm={() => onArm(null)}
          onChange={(value) => onChange('oxygen', value)}
        />
        <Dial
          id="airflow"
          label="Airflow velocity"
          unit="cm/s"
          value={values.airflow}
          baseline={live.airflow}
          min={0}
          max={50}
          step={0.5}
          digits={1}
          armed={armedControl === 'airflow'}
          onArm={() => onArm('airflow')}
          onDisarm={() => onArm(null)}
          onChange={(value) => onChange('airflow', value)}
        />
        <Dial
          id="pressure"
          label="Cabin pressure"
          unit="kPa"
          value={values.pressure}
          baseline={live.pressure}
          min={50}
          max={115}
          step={0.5}
          digits={1}
          armed={armedControl === 'pressure'}
          onArm={() => onArm('pressure')}
          onDisarm={() => onArm(null)}
          onChange={(value) => onChange('pressure', value)}
        />
        <SpreadRateMeterControl
          value={values.spread ?? (spreadRateMeter?.flame_spread_mm_s ?? 1.78)}
          baseline={live.spread ?? (spreadRateMeter?.flame_spread_mm_s ?? 1.78)}
          uncertainty={spreadRateMeter?.uncertainty_2sigma_mm_s ?? 0.89}
          armed={armedControl === 'spread'}
          onArm={() => onArm('spread')}
          onDisarm={() => onArm(null)}
          onChange={(value) => onChange('spread', value)}
        />
        <GravityControl
          value={values.gravity ?? 0}
          armed={armedControl === 'gravity'}
          onArm={() => onArm('gravity')}
          onChange={(value) => onChange('gravity', value)}
        />
      </div>
    </section>
  );
}

type DialProps = {
  id: ControlKey;
  label: string;
  unit: string;
  value: number;
  baseline: number;
  min: number;
  max: number;
  step: number;
  digits: number;
  armed: boolean;
  onArm: () => void;
  onDisarm: () => void;
  onChange: (value: number) => void;
};

function Dial({
  label,
  unit,
  value,
  baseline,
  min,
  max,
  step,
  digits,
  armed,
  onArm,
  onDisarm,
  onChange,
}: DialProps) {
  const adjust = useCallback(
    (amount: number) =>
      onChange(Math.max(min, Math.min(max, Math.round((value + amount) / step) * step))),
    [max, min, onChange, step, value]
  );
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

  return (
    <div className="flex min-w-0 flex-col items-center h-full">
      <div
        ref={interactions.ref}
        className={`relative flex min-h-[190px] h-full w-full cursor-pointer touch-none select-none flex-col items-center justify-between border p-2 ${armedShell(
          armed
        )}`}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${format(value)} ${unit}; sample ${format(baseline)} ${unit}`}
        tabIndex={0}
        onClick={onArm}
        onKeyDown={onKeyDown}
        onPointerDown={interactions.onPointerDown}
        onPointerMove={interactions.onPointerMove}
        onPointerUp={interactions.onPointerUp}
      >
        <div className="self-start font-heading text-[11px] font-bold uppercase tracking-[.08em] text-secondary">
          {label}
        </div>
        {armed && <span className={armedChip}>ARMED</span>}

        <svg
          viewBox="0 0 140 140"
          className="mt-auto h-auto w-[min(100%,156px)] overflow-visible"
          aria-hidden="true"
        >
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
          <g>
            {Array.from({ length: 37 }, (_, index) => {
              const a = ((135 + (index * 270) / 36) * Math.PI) / 180;
              const r1 = 51;
              const r2 = index % 3 === 0 ? 59 : 57;
              return (
                <line
                  key={index}
                  className={`${armed ? 'stroke-secondary' : 'stroke-tick'} stroke-[0.8]`}
                  x1={70 + Math.cos(a) * r1}
                  y1={70 + Math.sin(a) * r1}
                  x2={70 + Math.cos(a) * r2}
                  y2={70 + Math.sin(a) * r2}
                />
              );
            })}
          </g>
          <path className="fill-none stroke-raised stroke-[5]" d={gaugeArc(47)} />
          <path className="fill-none stroke-green stroke-4" d={gaugeArc(47)} />
          <path className="fill-none stroke-amber stroke-2" d={gaugeArc(62)} />
          <path
            className="fill-none stroke-[10] opacity-30"
            stroke={`url(#${spectrumId})`}
            filter={`url(#${glowId})`}
            d={gaugeArc(55)}
            pathLength="360"
            strokeDasharray={`${fillLength} 360`}
            strokeLinecap="butt"
          />
          <path
            className="fill-none stroke-[10]"
            stroke={`url(#${spectrumId})`}
            d={gaugeArc(55)}
            pathLength="360"
            strokeDasharray={`${fillLength} 360`}
            strokeLinecap="butt"
          />

          <text
            className="fill-ink font-mono text-[22px] font-bold [dominant-baseline:central] [text-anchor:middle]"
            x="70"
            y="69"
          >
            {format(value)}
          </text>
          <text
            className="fill-secondary font-mono text-[10px] [dominant-baseline:central] [text-anchor:middle]"
            x="70"
            y="85"
          >
            {unit}
          </text>
        </svg>

        <div className="mt-0 font-mono text-[10px] text-secondary">
          Sample <b className="font-semibold text-primary">{format(baseline)}</b>
          <span className="mx-[5px] text-muted">/</span>Target{' '}
          <b className="font-semibold text-warning">{format(value)}</b>
        </div>
      </div>
    </div>
  );
}

type SpreadRateProps = {
  value: number;
  baseline: number;
  uncertainty?: number;
  armed: boolean;
  onArm: () => void;
  onDisarm: () => void;
  onChange: (value: number) => void;
};

/**
 * Model 1: Gaussian Process Spread Rate Meter
 * Avionics meter displaying predicted flame spread rate (mm/s) and ±2σ uncertainty.
 * Fully armable and adjustable via pointer drag, mouse wheel, and arrow keys.
 */
function SpreadRateMeterControl({
  value,
  baseline,
  uncertainty = 0.89,
  armed,
  onArm,
  onDisarm,
  onChange,
}: SpreadRateProps) {
  const min = 0.0;
  const max = 3.5;
  const step = 0.05;

  const adjust = useCallback(
    (amount: number) =>
      onChange(Math.max(min, Math.min(max, Math.round((value + amount) / step) * step))),
    [max, min, onChange, step, value]
  );

  const interactions = useAvionicsControl({ armed, step, onArm, onAdjust: adjust, onDisarm });

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      onArm();
      onChange(event.key === 'Home' ? min : max);
      return;
    }
    interactions.onKeyDown(event);
  };

  const isAdjusted = Math.abs(value - baseline) > 0.02;

  return (
    <div className="flex min-w-0 flex-col items-center h-full w-full">
      <div
        ref={interactions.ref}
        className={`relative flex min-h-[190px] h-full w-full cursor-pointer touch-none select-none flex-col justify-between border p-[6px] ${armedShell(
          armed
        )}`}
        role="slider"
        aria-label="Model 1 Gaussian Process Flame Spread Rate"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value.toFixed(2)} mm/s; sample ${baseline.toFixed(2)} mm/s`}
        tabIndex={0}
        onClick={onArm}
        onKeyDown={onKeyDown}
        onPointerDown={interactions.onPointerDown}
        onPointerMove={interactions.onPointerMove}
        onPointerUp={interactions.onPointerUp}
      >
        <div className="flex flex-col items-center text-center w-full">
          {armed && (
            <span className="mb-0.5 bg-critical px-1 py-0.5 font-mono text-[8px] font-bold text-ink leading-none">
              ARMED
            </span>
          )}
          <span className="font-heading text-[9.5px] font-bold uppercase tracking-[.05em] text-secondary leading-tight whitespace-nowrap">
            SPREAD RATE
          </span>
          <span className="font-mono text-[8px] text-muted leading-tight whitespace-nowrap">
            Model 1 (GP)
          </span>
        </div>

        {/* 10 LED Segments (0.0 to 3.5 mm/s) */}
        <div className="my-auto flex w-full flex-col-reverse justify-center gap-[2.5px] py-1">
          {Array.from({ length: 10 }, (_, i) => {
            const threshold = Number(((i + 1) * 0.35).toFixed(2));
            const segmentTone =
              i < 3
                ? 'border-success bg-success'
                : i < 7
                ? 'border-warning bg-warning'
                : 'border-critical bg-critical';
            return (
              <i
                key={i}
                className={`h-2 w-full border transition-colors ${
                  value >= threshold ? segmentTone : 'border-line bg-raised'
                } hover:opacity-80`}
                title={`Target: ${threshold.toFixed(2)} mm/s`}
                onClick={(e) => {
                  if (armed) {
                    e.stopPropagation();
                    onChange(threshold);
                  }
                }}
              />
            );
          })}
        </div>

        <div className="flex w-full flex-col items-center justify-center pt-1 border-t border-line/40 text-center">
          <div className="font-mono text-[13px] font-bold tabular-nums text-ink leading-tight whitespace-nowrap">
            {value.toFixed(2)}{' '}
            <span className="font-sans text-[9px] font-normal text-secondary">mm/s</span>
          </div>
          <div className="font-mono text-[8.5px] tabular-nums text-secondary leading-tight mt-0.5 whitespace-nowrap">
            {isAdjusted ? (
              <span className="text-warning font-semibold">
                TGT <span className="text-secondary font-normal">({baseline.toFixed(2)})</span>
              </span>
            ) : (
              <span>±{uncertainty.toFixed(2)} (2σ)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GravityControl({
  value,
  armed,
  onArm,
  onChange,
}: {
  value: number;
  armed: boolean;
  onArm: () => void;
  onChange: (value: number) => void;
}) {
  const activeIndex = Math.min(1, Math.max(0, value));
  const regime = gravityRegimes[activeIndex];

  return (
    <div
      className={`relative min-h-[190px] h-full flex flex-col justify-between border p-[9px] col-span-2 compact:col-span-2 tight:col-span-1 ${armedShell(
        armed
      )}`}
    >
      <div
        className="font-heading text-[10.5px] font-bold uppercase tracking-[.08em] text-secondary"
        role="group"
        aria-label="Gravity regime"
        tabIndex={0}
        onClick={onArm}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onArm();
        }}
      >
        {armed && <span className={armedChip}>ARMED</span>}
        <span>Gravity regime</span>
      </div>

      <div className="mb-3 mt-[19px] grid grid-cols-[32px_1fr_32px] items-center gap-1">
        <button
          className={gravityButton}
          aria-label="Toggle gravity regime"
          onClick={() => {
            onArm();
            onChange(activeIndex === 0 ? 1 : 0);
          }}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <div className="grid justify-items-center gap-[3px] text-center">
          <b className="font-mono text-[14px] font-bold text-ink">{regime.value}</b>
          <span className="font-mono text-[10px] font-bold tracking-[.08em] text-primary">
            {regime.name}
          </span>
        </div>
        <button
          className={gravityButton}
          aria-label="Toggle gravity regime"
          onClick={() => {
            onArm();
            onChange(activeIndex === 0 ? 1 : 0);
          }}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-auto border-t border-line pt-2 font-mono text-[10px] leading-[1.45] text-secondary">
        Transport
        <br />
        {regime.detail}
      </div>
    </div>
  );
}

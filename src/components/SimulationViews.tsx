import { useEffect, useRef, useState } from 'react';
import {
  Area, CartesianGrid, ComposedChart, Label, Line, ReferenceArea, ReferenceDot,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { MouseHandlerDataParam, TooltipContentProps } from 'recharts';
import { Flame } from 'lucide-react';
import { controlLimits, earthReference, getPreviewPoint, type Material, type Readings } from '../data';
import type { Evaluation, SweepPoint } from '../services/avionicsService';
import { NasaEvidenceCard } from './NasaEvidenceCard';
import { panel, sectionHead, sectionMeta, sectionTitle } from './ui';

const MAX_FLOW = controlLimits.airflow.max;
const axisText = { fill: 'var(--color-secondary)', fontSize: 10, fontFamily: 'var(--font-mono)' };
const grid = 'var(--color-line)';
const primary = 'var(--color-primary)';
const warning = 'var(--color-warning)';
const caution = 'var(--color-caution)';
const ink = 'var(--color-ink)';
const surface = 'var(--color-void)';

type Props = {
  readings: Readings;
  selectedMaterial: Material | null;
  evaluation: Evaluation | null;
  onPreviewTarget?: () => void;
};

export function SimulationViews({ readings, selectedMaterial, evaluation, onPreviewTarget }: Props) {
  const isEarth = readings.gravity === 1;
  const loi = selectedMaterial?.loi_threshold_pct;
  return (
    <section className="grid grid-cols-1 items-stretch gap-2 deck:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <article className={`${panel} flex flex-col min-w-0`}>
        <div className={`${sectionHead} mb-2 items-start shrink-0`}>
          <div className="flex min-w-0 items-start gap-2">
            <Flame size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className={sectionTitle}>{isEarth ? 'Limiting oxygen index' : 'The airflow paradox'}</h2>
              <p className="m-0 mt-0.5 font-mono text-[10.5px] leading-snug text-secondary">
                {isEarth ? 'SCENARIO OXYGEN VS. CATALOG LOI' : 'MODEL 1 · GAUSSIAN PROCESS · FLAME SPREAD (mm/s) ± 2σ'}
              </p>
            </div>
          </div>
          <span className={sectionMeta}>{isEarth ? '1.00g Earth reference' : '0.00g Microgravity'}</span>
        </div>

        {evaluation && !isEarth ? (
          <AirflowChart key={JSON.stringify(evaluation.inputs)} evaluation={evaluation} />
        ) : (
          <div className="grid min-h-[220px] flex-1 content-center justify-items-center gap-3 bg-void px-3 text-center">
            {isEarth ? (
              <>
                <span className="font-heading text-[13px] font-bold text-ink">{selectedMaterial?.displayName ?? 'Material unavailable'}</span>
                <div className="flex gap-5">
                  <Readout label="Scenario oxygen" value={`${readings.oxygen.toFixed(1)}%`} />
                  <Readout label="Catalog LOI" value={loi == null ? '—' : `${loi}%`} />
                </div>
                <p className="font-mono text-[11px] text-secondary">{earthReference(readings.oxygen, loi)}</p>
              </>
            ) : <p className="font-mono text-[11px] text-secondary">Spread curve unavailable</p>}
          </div>
        )}
      </article>
      <NasaEvidenceCard material={selectedMaterial} evidence={evaluation?.evidence_and_actuation}
        onPreviewTarget={onPreviewTarget} isEarth={isEarth} />
    </section>
  );
}

function AirflowChart({ evaluation }: { evaluation: Evaluation }) {
  const { airflow_simulation: simulation, inputs, spread_rate_meter: spread } = evaluation;
  const [cursor, setCursor] = useState<number | null>(null);
  const [armed, setArmed] = useState(false);
  const chart = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const target = inputs.flow_velocity_cm_s;
  const displayedFlow = cursor ?? target;
  const targetInDomain = target >= 0 && target <= MAX_FLOW;
  const closest = simulation.sweep_points.reduce((previous, point) =>
    Math.abs(point.flow_velocity_cm_s - displayedFlow) < Math.abs(previous.flow_velocity_cm_s - displayedFlow)
      ? point : previous
  );
  const inspected = cursor == null ? spread : closest;
  const cursorFlow = cursor == null ? target : closest.flow_velocity_cm_s;
  const points = simulation.sweep_points.map((point) => ({
    ...point,
    spreadBand: [point.spread_lower_mm_s, point.spread_upper_mm_s],
    supportedSpread: point.out_of_material_training_range ? null : point.flame_spread_mm_s,
  }));
  const candidate = getPreviewPoint(simulation.quench_target);

  useEffect(() => {
    const element = chart.current;
    if (!element || !armed) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const step = event.deltaY < 0 ? 1 : -1;
      setCursor((current) => Math.max(0, Math.min(MAX_FLOW, (current ?? target) + step)));
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [armed, target]);

  function inspect(state: MouseHandlerDataParam) {
    const index = Number(state.activeTooltipIndex ?? state.activeIndex);
    const point = Number.isInteger(index) && points[index];
    if (point) setCursor(point.flow_velocity_cm_s);
  }

  function startInspect(state: MouseHandlerDataParam) {
    dragging.current = true;
    setArmed(true);
    inspect(state);
  }

  function moveInspect(state: MouseHandlerDataParam) {
    if (dragging.current) inspect(state);
  }

  function stopInspect() {
    dragging.current = false;
  }

  return (
    <>
      <div ref={chart}
        className="relative min-h-[220px] flex-1 touch-none overflow-hidden bg-void outline-none"
        role="slider" tabIndex={0} aria-label="Inspect airflow curve"
        aria-valuemin={0} aria-valuemax={MAX_FLOW} aria-valuenow={Math.max(0, Math.min(MAX_FLOW, cursorFlow))}
        aria-valuetext={`${cursorFlow.toFixed(1)} cm/s`}
        onPointerDown={(event) => event.currentTarget.focus()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') { setArmed(false); setCursor(null); return; }
          const direction = event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1
            : event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : 0;
          if (!direction && event.key !== 'Home' && event.key !== 'End') return;
          event.preventDefault();
          setArmed(true);
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? MAX_FLOW : displayedFlow + direction;
          setCursor(Math.max(0, Math.min(MAX_FLOW, next)));
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 43, right: 28, bottom: 4, left: 18 }}
            accessibilityLayer={false} className="cursor-crosshair"
            onMouseDown={startInspect} onMouseMove={moveInspect} onMouseUp={stopInspect}
            onMouseLeave={stopInspect} onTouchStart={startInspect} onTouchMove={moveInspect} onTouchEnd={stopInspect}>
            <CartesianGrid stroke={grid} />
            <XAxis dataKey="flow_velocity_cm_s" type="number" domain={[0, MAX_FLOW]}
              ticks={[0, 10, 20, 30, 40, MAX_FLOW]} tick={axisText} tickLine={false} axisLine={{ stroke: grid }}
              tickFormatter={(value) => value === MAX_FLOW ? `${MAX_FLOW} cm/s` : String(value)} />
            <YAxis type="number" domain={[0, 3.5]} width={38} tick={axisText} tickLine={false} axisLine={{ stroke: grid }}
              tickFormatter={(value) => Number(value).toFixed(1)}>
              <Label value="Spread rate (mm/s)" angle={-90} position="left" offset={4} style={axisText} />
            </YAxis>
            <ReferenceArea x1={simulation.critical_flow_window_cms[0]} x2={simulation.critical_flow_window_cms[1]}
              fill={caution} fillOpacity={0.08} stroke="none" />
            <Area type="monotone" dataKey="spreadBand" stroke="none" fill={warning} fillOpacity={0.12} isAnimationActive={false} />
            <Line type="monotone" dataKey="flame_spread_mm_s" stroke={primary} strokeDasharray="3 4" strokeWidth={1.7}
              dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="supportedSpread" stroke={primary} strokeWidth={2.5}
              dot={false} activeDot={false} isAnimationActive={false} />
            {targetInDomain && <ReferenceLine x={target} stroke={primary} strokeDasharray="3 4" />}
            {targetInDomain && <ReferenceDot x={target} y={spread.flame_spread_mm_s} r={5} fill={ink} stroke={primary} strokeWidth={2} />}
            {cursor != null && <ReferenceDot x={closest.flow_velocity_cm_s} y={closest.flame_spread_mm_s} r={4} fill={ink} stroke={surface} />}
            {candidate && <ReferenceDot x={candidate.flow} y={candidate.spread} r={5} fill={caution} stroke={surface} strokeWidth={1.5} />}
            <Tooltip content={(props) => <SpreadRateTooltip {...props} />} cursor={{ stroke: grid, strokeDasharray: '3 4' }} />
          </ComposedChart>
        </ResponsiveContainer>
        {armed && <span className="absolute right-2.5 top-2.5 bg-critical px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-ink">ARMED</span>}
        <div className="pointer-events-none absolute top-2.5 left-2.5 flex flex-wrap gap-x-4 gap-y-1 border border-line/60 bg-surface/90 px-2.5 py-1.5">
          <Readout label={cursor == null ? 'Scenario target' : 'Curve inspection'} value={`${cursorFlow.toFixed(1)} cm/s`} />
          <Readout label="Spread rate" value={`${inspected.flame_spread_mm_s.toFixed(2)} mm/s`} />
          <Readout label="±2σ bounds" value={`${inspected.spread_lower_mm_s.toFixed(2)}–${inspected.spread_upper_mm_s.toFixed(2)}`} />
          {(!targetInDomain || inspected.out_of_material_training_range) &&
            <span className="self-center font-mono text-[9.5px] text-warning">{targetInDomain ? 'Extrapolated' : 'Target outside plotted domain'}</span>}
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-secondary">
        <span><i className="mr-1 inline-block h-0.5 w-3.5 bg-primary align-middle" /> Supported spread</span>
        <span><i className="mr-1 inline-block w-3.5 border-t border-dashed border-primary align-middle" /> Extrapolated</span>
        <span><i className="mr-1 inline-block h-2 w-3.5 border border-warning/60 bg-warning/20 align-middle" /> ±2σ model uncertainty</span>
        {candidate && <span><i className="mr-1 inline-block size-2 rounded-full bg-caution align-middle" /> Solver candidate</span>}
        <span className="ml-auto text-muted">Drag or use arrow keys to inspect</span>
      </div>
    </>
  );
}

function SpreadRateTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as SweepPoint | undefined;
  if (!active || !point) return null;
  return (
    <div className="border border-line bg-surface px-2.5 py-2 font-mono text-[11px] shadow-lg">
      <Readout label="Airflow" value={`${point.flow_velocity_cm_s.toFixed(1)} cm/s`} />
      <Readout label="Flame spread" value={`${point.flame_spread_mm_s.toFixed(2)} ± ${point.uncertainty_2sigma_mm_s.toFixed(2)} mm/s`} />
      {point.out_of_material_training_range && <span className="text-warning">Extrapolated</span>}
    </div>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-px">
      <span className="font-mono text-[9.5px] uppercase tracking-wider text-secondary">{label}</span>
      <b className="font-mono text-[12px] font-bold tabular-nums text-ink">{value}</b>
    </div>
  );
}

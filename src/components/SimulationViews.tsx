import { useEffect, useRef, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Label,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MouseHandlerDataParam, TooltipContentProps } from 'recharts';
import { Flame } from 'lucide-react';
import type { Material, Readings, ReverseSolverTarget, RfDrivers } from '../data';
import { NasaEvidenceCard } from './NasaEvidenceCard';
import { panel, sectionHead, sectionMeta, sectionTitle } from './ui';

const MAX_FLOW = 50;

const axisTick = { fill: '#9CA3AF', fontSize: 11, fontFamily: '"Geist Mono", monospace' };
const axisLabel = { fill: '#9CA3AF', fontSize: 10, fontFamily: '"Geist Mono", monospace' };

type CurvePoint = {
  flow: number;
  risk: number;
  band: [number, number];
};

/**
 * Anchors stay illustrative. The curve peaks at a moderate airflow, then falls
 * again as ventilation starts removing heat and fuel faster than it feeds the flame.
 */
const curveAnchors = [
  { flow: 0, risk: 46, band: [39, 53] },
  { flow: 2, risk: 53, band: [45, 60] },
  { flow: 4, risk: 60, band: [50, 68] },
  { flow: 6, risk: 67, band: [55, 76] },
  { flow: 8, risk: 73, band: [62, 82] },
  { flow: 10, risk: 77, band: [68, 86] },
  { flow: 12, risk: 78, band: [70, 87] },
  { flow: 14, risk: 76, band: [68, 85] },
  { flow: 16, risk: 72, band: [62, 82] },
  { flow: 18, risk: 67, band: [56, 78] },
  { flow: 20, risk: 61, band: [50, 72] },
  { flow: 22, risk: 55, band: [44, 67] },
  { flow: 25, risk: 47, band: [37, 58] },
  { flow: 28, risk: 41, band: [32, 51] },
  { flow: 30, risk: 37, band: [29, 45] },
  { flow: 33, risk: 33, band: [25, 40] },
  { flow: 35, risk: 31, band: [23, 39] },
  { flow: 38, risk: 28, band: [20, 36] },
  { flow: 40, risk: 26, band: [18, 34] },
  { flow: 42, risk: 24, band: [16, 32] },
  { flow: 45, risk: 20, band: [12, 29] },
  { flow: 48, risk: 17, band: [10, 26] },
  { flow: 50, risk: 15, band: [8, 24] },
] as const;

const round1 = (value: number) => Math.round(value * 10) / 10;

/** Resample the anchors at 0.5 cm/s so pointer scrubbing follows the same step as the control. */
const curveData: CurvePoint[] = Array.from({ length: MAX_FLOW * 2 + 1 }, (_, index) => {
  const flow = index * 0.5;
  const upperIndex = curveAnchors.findIndex(anchor => anchor.flow >= flow);
  const upper = curveAnchors[upperIndex === -1 ? curveAnchors.length - 1 : upperIndex];
  const lower = curveAnchors[Math.max(0, (upperIndex === -1 ? curveAnchors.length - 1 : upperIndex) - 1)];
  const span = upper.flow - lower.flow;
  const ratio = span === 0 ? 0 : (flow - lower.flow) / span;
  const mix = (start: number, end: number) => start + (end - start) * ratio;
  return {
    flow,
    risk: round1(mix(lower.risk, upper.risk)),
    band: [round1(mix(lower.band[0], upper.band[0])), round1(mix(lower.band[1], upper.band[1]))],
  };
});

export type SimulationViewsProps = {
  currentAirflow?: number;
  readings?: Readings;
  selectedMaterial?: Material | null;
  reverseSolverTarget?: ReverseSolverTarget | null;
  rfDrivers?: RfDrivers | null;
  onApplyOverride?: (targetFlow: number) => void;
  onAirflowChange?: (airflow: number) => void;
};

export function SimulationViews({
  currentAirflow,
  readings,
  selectedMaterial = null,
  reverseSolverTarget = null,
  rfDrivers = null,
  onApplyOverride,
  onAirflowChange,
}: SimulationViewsProps = {}) {
  const [chartArmed, setChartArmed] = useState(false);
  const [localAirflow, setLocalAirflow] = useState<number | null>(null);
  const [prevCurrentAirflow, setPrevCurrentAirflow] = useState(currentAirflow);

  // Synchronize state when external prop changes during render
  if (currentAirflow !== prevCurrentAirflow) {
    setPrevCurrentAirflow(currentAirflow);
    setLocalAirflow(null);
  }

  const curveAirflow = localAirflow ?? currentAirflow ?? 12;
  const chartRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const operatingPoint = curveData[Math.max(0, Math.min(curveData.length - 1, Math.round(curveAirflow * 2)))];

  useEffect(() => {
    const element = chartRef.current;
    if (!element || !chartArmed) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setLocalAirflow(current => {
        const base = current ?? currentAirflow ?? 12;
        const next = Math.max(0, Math.min(MAX_FLOW, Math.round((base + (event.deltaY < 0 ? 0.5 : -0.5)) / 0.5) * 0.5));
        onAirflowChange?.(next);
        return next;
      });
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [chartArmed, currentAirflow, onAirflowChange]);

  const setFromChart = (state: MouseHandlerDataParam) => {
    const rawIndex = state.activeTooltipIndex ?? state.activeIndex;
    const index = typeof rawIndex === 'number' ? rawIndex : Number(rawIndex);
    if (!Number.isInteger(index)) return;
    const point = curveData[index];
    if (point) {
      setLocalAirflow(point.flow);
      onAirflowChange?.(point.flow);
    }
  };

  const armChart = () => setChartArmed(true);

  const onChartDown = (state: MouseHandlerDataParam) => {
    draggingRef.current = true;
    armChart();
    setFromChart(state);
  };

  const onChartMove = (state: MouseHandlerDataParam) => {
    if (draggingRef.current) setFromChart(state);
  };

  const releaseChart = () => {
    draggingRef.current = false;
  };

  return (
    <section className="grid grid-cols-1 items-stretch gap-2 deck:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      {/* Left Column: The Airflow Paradox (~60% width) */}
      <article className={`${panel} flex flex-col min-w-0`}>
        <div className={`${sectionHead} mb-2 items-start shrink-0`}>
          <div className="flex min-w-0 items-start gap-2">
            <Flame size={15} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className={sectionTitle}>The airflow paradox</h2>
              <p className="m-0 mt-1 text-[12px] leading-snug text-secondary">Ventilation can feed a fire before it suppresses it.</p>
            </div>
          </div>
          <span className={sectionMeta}>2D demo curve</span>
        </div>
        <div
          ref={chartRef}
          className="relative min-h-[220px] flex-1 touch-none overflow-hidden bg-void outline-none"
          role="slider"
          tabIndex={0}
          aria-label="Adjust demo airflow position on the illustrative airflow paradox curve"
          aria-valuemin={0}
          aria-valuemax={MAX_FLOW}
          aria-valuenow={curveAirflow}
          aria-valuetext={`${curveAirflow.toFixed(1)} centimeters per second; illustrative visual risk ${operatingPoint.risk} percent`}
          onPointerDown={event => event.currentTarget.focus()}
          onMouseDown={event => {
            // Recharts' SVG layers use tabindex="-1"; stop the browser moving focus off the slider.
            event.preventDefault();
            event.currentTarget.focus();
          }}
          onKeyDown={event => {
            if (event.key === 'Escape') setChartArmed(false);
            else if (event.key === 'Home') { event.preventDefault(); armChart(); setLocalAirflow(0); onAirflowChange?.(0); }
            else if (event.key === 'End') { event.preventDefault(); armChart(); setLocalAirflow(MAX_FLOW); onAirflowChange?.(MAX_FLOW); }
            else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
              event.preventDefault();
              armChart();
              const next = Math.min(MAX_FLOW, curveAirflow + 0.5);
              setLocalAirflow(next);
              onAirflowChange?.(next);
            }
            else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
              event.preventDefault();
              armChart();
              const next = Math.max(0, curveAirflow - 0.5);
              setLocalAirflow(next);
              onAirflowChange?.(next);
            }
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={curveData}
              margin={{ top: 18, right: 42, bottom: 4, left: 24 }}
              accessibilityLayer={false}
              className="cursor-crosshair"
              onMouseDown={onChartDown}
              onMouseMove={onChartMove}
              onMouseUp={releaseChart}
              onMouseLeave={releaseChart}
              onClick={state => { armChart(); setFromChart(state); }}
              onTouchStart={onChartDown}
              onTouchMove={onChartMove}
              onTouchEnd={releaseChart}
            >
              <CartesianGrid stroke="#374151" strokeWidth={1} />
              <XAxis
                dataKey="flow"
                type="number"
                domain={[0, MAX_FLOW]}
                ticks={[0, 10, 20, 30, 40, MAX_FLOW]}
                tick={axisTick}
                tickLine={false}
                axisLine={{ stroke: '#374151' }}
                tickFormatter={value => value === MAX_FLOW ? `${MAX_FLOW} cm/s` : String(value)}
              />
              <YAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} width={38} tick={axisTick} tickLine={false} axisLine={{ stroke: '#374151' }} tickFormatter={value => `${value}%`}>
                <Label value="Visual risk" angle={-90} position="left" offset={7} style={axisLabel} />
              </YAxis>
              <ReferenceArea x1={6} x2={18} fill="#FACC15" fillOpacity={0.06} stroke="none" />
              <Area type="monotone" dataKey="band" stroke="none" fill="#F97316" fillOpacity={0.12} isAnimationActive={false} />
              <Line type="monotone" dataKey="risk" stroke="#F97316" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#F97316', stroke: '#111827', strokeWidth: 2 }} isAnimationActive={false} />
              <ReferenceLine x={curveAirflow} stroke="#34D399" strokeDasharray="3 4" strokeOpacity={0.85} />
              <ReferenceDot x={operatingPoint.flow} y={operatingPoint.risk} r={5} fill="#F3F4F6" stroke="#34D399" strokeWidth={2} />
              <Tooltip content={props => <CurveTooltip {...props} />} cursor={{ stroke: '#374151', strokeDasharray: '3 4' }} wrapperStyle={{ zIndex: 5, outline: 'none' }} />
            </ComposedChart>
          </ResponsiveContainer>
          {chartArmed && <span className="absolute right-2.5 top-2.5 z-[2] bg-critical px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-ink">ARMED</span>}
          <div className="pointer-events-none absolute top-2.5 left-2.5 z-[2] flex gap-4 bg-surface/90 px-2 py-1.5 backdrop-blur-[2px]">
            <Readout label="Demo airflow" value={`${curveAirflow.toFixed(1)} cm/s`} />
            <Readout label="Visual risk" value={`${operatingPoint.risk}%`} tone="warning" />
            <Readout label="Curve status" value="Illustrative" />
          </div>
        </div>
        <div className="mt-2.5 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] text-secondary">
          <span className="flex items-center gap-1.5"><i className="h-0.5 w-4 bg-warning" />Visual risk</span>
          <span className="flex items-center gap-1.5"><i className="h-2 w-4 border border-warning/60 bg-warning/20" />Uncertainty</span>
          <span className="flex items-center gap-1.5"><i className="h-3 w-px bg-primary" />Operating point</span>
          <span className="ml-auto">Click, drag, or use arrows to position the sample</span>
        </div>
      </article>

      {/* Right Column: NASA PSI-26 Evidence & Reverse-Solver Card (~40% width) */}
      <NasaEvidenceCard
        material={selectedMaterial}
        currentAirflow={curveAirflow}
        currentOxygen={readings?.oxygen ?? 21}
        currentPressure={readings?.pressure ?? 101.3}
        reverseSolverTarget={reverseSolverTarget}
        rfDrivers={rfDrivers}
        onApplyOverride={onApplyOverride}
      />
    </section>
  );
}

function CurveTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as CurvePoint | undefined;
  if (!active || !point) return null;
  return <div className="border border-line bg-surface px-2.5 py-2 font-mono text-[11px] shadow-lg">
    <div className="mb-1 text-[9.5px] uppercase tracking-[.08em] text-secondary">Airflow {point.flow.toFixed(1)} cm/s</div>
    <div className="flex justify-between gap-4"><span className="text-secondary">Visual risk</span><b className="text-[12px] font-bold text-warning">{point.risk}%</b></div>
    <div className="flex justify-between gap-4"><span className="text-secondary">Uncertainty</span><b className="text-[12px] font-bold text-ink">{point.band[0]}–{point.band[1]}%</b></div>
  </div>;
}

function Readout({ label, value, tone }: { label: string; value: string; tone?: 'warning' | 'primary' | 'critical' }) {
  return <div className="grid gap-px"><span className="font-mono text-[10px] text-secondary">{label}</span><b className={`font-mono text-[13px] font-bold ${tone === 'warning' ? 'text-warning' : tone === 'primary' ? 'text-primary' : tone === 'critical' ? 'text-critical' : 'text-ink'}`}>{value}</b></div>;
}

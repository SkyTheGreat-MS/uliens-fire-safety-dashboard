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
import type {
  AirflowSimulationData,
  EvidenceAndActuation,
  Material,
  Readings,
  ReverseSolverTarget,
  RfDrivers,
} from '../data';
import { NasaEvidenceCard } from './NasaEvidenceCard';
import { panel, sectionHead, sectionMeta, sectionTitle } from './ui';

const MAX_FLOW = 50;

const axisTick = { fill: '#9CA3AF', fontSize: 10, fontFamily: '"Geist Mono", monospace' };
const axisLabel = { fill: '#9CA3AF', fontSize: 10, fontFamily: '"Geist Mono", monospace' };

export type SimulationChartPoint = {
  flow: number;
  spread: number;
  spreadBand: [number, number];
};

export type SimulationViewsProps = {
  currentAirflow?: number;
  readings?: Readings;
  selectedMaterial?: Material | null;
  airflowSimulation?: AirflowSimulationData | null;
  evidenceAndActuation?: EvidenceAndActuation | null;
  reverseSolverTarget?: ReverseSolverTarget | null;
  rfDrivers?: RfDrivers | null;
  onApplyOverride?: (targetFlow: number) => void;
  onAirflowChange?: (airflow: number) => void;
};

export function SimulationViews({
  currentAirflow,
  readings,
  selectedMaterial = null,
  airflowSimulation = null,
  evidenceAndActuation = null,
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

  // Derive 50 sweep points for Model 1 Gaussian Process Spread Rate & ±2σ Band
  const points: SimulationChartPoint[] =
    airflowSimulation && airflowSimulation.sweep_points.length > 0
      ? airflowSimulation.sweep_points.map((pt) => ({
          flow: pt.flow_velocity_cm_s,
          spread: pt.flame_spread_mm_s,
          spreadBand: [pt.spread_lower_mm_s, pt.spread_upper_mm_s],
        }))
      : generateDefaultSpreadPoints(selectedMaterial, readings?.oxygen ?? 21);

  // Closest point to active airflow
  const activeIdx = Math.max(
    0,
    Math.min(
      points.length - 1,
      Math.round((curveAirflow / MAX_FLOW) * (points.length - 1))
    )
  );
  const operatingPoint = points[activeIdx] ?? points[0];

  const criticalWindow =
    airflowSimulation?.critical_flow_window_cms ??
    selectedMaterial?.critical_flow_window_cms ?? [1.0, 15.0];

  const quenchVelocity =
    airflowSimulation?.quench_target?.recommended_flow_velocity_cm_s ??
    reverseSolverTarget?.flow_velocity_cm_s ??
    null;

  const quenchPoint =
    quenchVelocity != null
      ? points[
          Math.max(
            0,
            Math.min(
              points.length - 1,
              Math.round((quenchVelocity / MAX_FLOW) * (points.length - 1))
            )
          )
        ]
      : null;

  useEffect(() => {
    const element = chartRef.current;
    if (!element || !chartArmed) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setLocalAirflow((current) => {
        const base = current ?? currentAirflow ?? 12;
        const next = Math.max(
          0,
          Math.min(
            MAX_FLOW,
            Math.round((base + (event.deltaY < 0 ? 0.5 : -0.5)) / 0.5) * 0.5
          )
        );
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
    const point = points[index];
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
              <p className="m-0 mt-0.5 font-mono text-[10.5px] leading-snug text-secondary">
                MODEL 1: GAUSSIAN PROCESS · FLAME SPREAD (mm/s) ± 2σ UNCERTAINTY HALO
              </p>
            </div>
          </div>
          <span className={sectionMeta}>
            {readings?.gravity === 1 ? '1.00g Ground Baseline' : '0.00g Micro-G Flight'}
          </span>
        </div>

        <div
          ref={chartRef}
          className="relative min-h-[220px] flex-1 touch-none overflow-hidden bg-void outline-none"
          role="slider"
          tabIndex={0}
          aria-label="Adjust airflow position along the microgravity flame spread rate curve"
          aria-valuemin={0}
          aria-valuemax={MAX_FLOW}
          aria-valuenow={curveAirflow}
          aria-valuetext={`${curveAirflow.toFixed(1)} cm/s; spread rate ${operatingPoint.spread.toFixed(
            2
          )} mm/s`}
          onPointerDown={(event) => event.currentTarget.focus()}
          onMouseDown={(event) => {
            event.preventDefault();
            event.currentTarget.focus();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setChartArmed(false);
            else if (event.key === 'Home') {
              event.preventDefault();
              armChart();
              setLocalAirflow(0);
              onAirflowChange?.(0);
            } else if (event.key === 'End') {
              event.preventDefault();
              armChart();
              setLocalAirflow(MAX_FLOW);
              onAirflowChange?.(MAX_FLOW);
            } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
              event.preventDefault();
              armChart();
              const next = Math.min(MAX_FLOW, curveAirflow + 0.5);
              setLocalAirflow(next);
              onAirflowChange?.(next);
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
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
              data={points}
              margin={{ top: 20, right: 28, bottom: 4, left: 18 }}
              accessibilityLayer={false}
              className="cursor-crosshair"
              onMouseDown={onChartDown}
              onMouseMove={onChartMove}
              onMouseUp={releaseChart}
              onMouseLeave={releaseChart}
              onClick={(state) => {
                armChart();
                setFromChart(state);
              }}
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
                tickFormatter={(value) => (value === MAX_FLOW ? `${MAX_FLOW} cm/s` : String(value))}
              />

              {/* Primary Y-Axis: Model 1 Gaussian Process Flame Spread Rate (mm/s) */}
              <YAxis
                type="number"
                domain={[0, 3.5]}
                ticks={[0.0, 0.7, 1.4, 2.1, 2.8, 3.5]}
                width={38}
                tick={axisTick}
                tickLine={false}
                axisLine={{ stroke: '#374151' }}
                tickFormatter={(v) => Number(v).toFixed(1)}
              >
                <Label
                  value="Spread Rate (mm/s)"
                  angle={-90}
                  position="left"
                  offset={4}
                  style={axisLabel}
                />
              </YAxis>

              {/* Critical Flow Window Shading */}
              <ReferenceArea
                x1={criticalWindow[0]}
                x2={criticalWindow[1]}
                fill="#FACC15"
                fillOpacity={0.06}
                stroke="none"
              />

              {/* Model 1 GP ±2σ Confidence Halo (Shaded Band) */}
              <Area
                type="monotone"
                dataKey="spreadBand"
                stroke="none"
                fill="#F97316"
                fillOpacity={0.12}
                isAnimationActive={false}
              />

              {/* Model 1 GP Continuous Flame Spread Rate Curve */}
              <Line
                type="monotone"
                dataKey="spread"
                stroke="#34D399"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: '#34D399', stroke: '#111827', strokeWidth: 2 }}
                isAnimationActive={false}
              />

              {/* Current Operating Point Crosshair & Indicator */}
              <ReferenceLine
                x={curveAirflow}
                stroke="#34D399"
                strokeDasharray="3 4"
                strokeOpacity={0.85}
              />
              <ReferenceDot
                x={operatingPoint.flow}
                y={operatingPoint.spread}
                r={5}
                fill="#F3F4F6"
                stroke="#34D399"
                strokeWidth={2}
              />

              {/* Reverse-Solver Quench Target Point Marker */}
              {quenchPoint && (
                <ReferenceDot
                  x={quenchPoint.flow}
                  y={quenchPoint.spread}
                  r={5}
                  fill="#FACC15"
                  stroke="#111827"
                  strokeWidth={1.5}
                />
              )}

              {/* Operator Target Spread Rate Reference Line */}
              {readings?.spread !== undefined && (
                <ReferenceLine
                  y={readings.spread}
                  stroke="#FACC15"
                  strokeDasharray="2 3"
                  strokeOpacity={0.85}
                />
              )}

              <Tooltip
                content={(props) => <SpreadRateTooltip {...props} />}
                cursor={{ stroke: '#374151', strokeDasharray: '3 4' }}
                wrapperStyle={{ zIndex: 5, outline: 'none' }}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {chartArmed && (
            <span className="absolute right-2.5 top-2.5 z-[2] bg-critical px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-ink">
              ARMED
            </span>
          )}

          {/* Floating Operational Readout Bar */}
          <div className="pointer-events-none absolute top-2.5 left-2.5 z-[2] flex gap-4 bg-surface/90 px-2.5 py-1.5 backdrop-blur-[2px] border border-line/60">
            <Readout label="Operating Airflow" value={`${curveAirflow.toFixed(1)} cm/s`} />
            <Readout
              label="Spread Rate (M1)"
              value={`${operatingPoint.spread.toFixed(2)} mm/s`}
              tone="primary"
            />
            <Readout
              label="±2σ Halo Bounds"
              value={`${operatingPoint.spreadBand[0].toFixed(2)}–${operatingPoint.spreadBand[1].toFixed(2)}`}
              tone="warning"
            />
            {readings?.spread !== undefined && (
              <Readout
                label="Target Setpoint"
                value={`${readings.spread.toFixed(2)} mm/s`}
                tone="warning"
              />
            )}
          </div>
        </div>

        {/* Legend Footer */}
        <div className="mt-2.5 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-secondary">
          <span className="flex items-center gap-1.5">
            <i className="h-0.5 w-3.5 bg-primary" />
            <span>Flame Spread Rate (mm/s)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-3.5 border border-warning/60 bg-warning/20" />
            <span>±2σ Experimental Uncertainty</span>
          </span>
          <span className="flex items-center gap-1.5">
            <i className="size-2 rounded-full border border-line bg-caution" />
            <span>Quench Setpoint</span>
          </span>
          <span className="ml-auto text-muted">Click or drag along curve to adjust airflow</span>
        </div>
      </article>

      {/* Right Column: NASA PSI-26 Evidence & Reverse-Solver Card (~40% width) */}
      <NasaEvidenceCard
        material={selectedMaterial}
        evidenceAndActuation={evidenceAndActuation}
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

function SpreadRateTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as SimulationChartPoint | undefined;
  if (!active || !point) return null;
  const uncertainty = ((point.spreadBand[1] - point.spreadBand[0]) / 2).toFixed(2);
  return (
    <div className="border border-line bg-surface px-2.5 py-2 font-mono text-[11px] shadow-lg">
      <div className="mb-1 text-[10px] uppercase tracking-[.08em] text-secondary">
        Airflow {point.flow.toFixed(1)} cm/s
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-secondary">Flame Spread (M1):</span>
        <b className="text-[12px] font-bold text-primary">{point.spread.toFixed(2)} mm/s</b>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-secondary">±2σ Uncertainty:</span>
        <span className="text-ink">
          ±{uncertainty} ({point.spreadBand[0].toFixed(2)}–{point.spreadBand[1].toFixed(2)} mm/s)
        </span>
      </div>
    </div>
  );
}

function Readout({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'warning' | 'primary' | 'critical';
}) {
  return (
    <div className="grid gap-px">
      <span className="font-mono text-[9.5px] uppercase tracking-wider text-secondary">{label}</span>
      <b
        className={`font-mono text-[12px] font-bold tabular-nums ${
          tone === 'warning'
            ? 'text-warning'
            : tone === 'primary'
            ? 'text-primary'
            : tone === 'critical'
            ? 'text-critical'
            : 'text-ink'
        }`}
      >
        {value}
      </b>
    </div>
  );
}

function generateDefaultSpreadPoints(
  mat: Material | null,
  oxygen: number
): SimulationChartPoint[] {
  const loi = mat?.loi_threshold_pct ?? 17.0;
  const [minFlow, maxFlow] = mat?.critical_flow_window_cms ?? [1.0, 15.0];
  const o2Excess = oxygen - loi;

  return Array.from({ length: 50 }, (_, i) => {
    const flow = (i / 49) * MAX_FLOW;
    let flowFactor = 0.2;
    if (flow >= minFlow && flow <= maxFlow) {
      const mid = (minFlow + maxFlow) / 2;
      const span = (maxFlow - minFlow) / 2;
      const bell = Math.exp(-Math.pow((flow - mid) / (span + 2), 2));
      flowFactor = 0.4 + bell * 0.6;
    } else if (flow > maxFlow) {
      flowFactor = Math.max(0.05, 0.4 - (flow - maxFlow) * 0.02);
    } else {
      flowFactor = Math.max(0.02, (flow / Math.max(1, minFlow)) * 0.4);
    }

    const baseRate = loi < 20 ? 1.8 : loi < 30 ? 0.9 : 0.3;
    const spread = Math.max(0, baseRate * flowFactor * (1 + o2Excess * 0.08));
    const sigma = 0.25 + spread * 0.22;

    return {
      flow: Math.round(flow * 10) / 10,
      spread: Math.round(spread * 100) / 100,
      spreadBand: [
        Math.max(0, Math.round((spread - sigma) * 100) / 100),
        Math.round((spread + sigma) * 100) / 100,
      ],
    };
  });
}

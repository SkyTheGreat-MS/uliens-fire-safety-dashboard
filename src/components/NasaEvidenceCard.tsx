import { ExternalLink, Gauge, ShieldAlert } from 'lucide-react';
import type { Material, ReverseSolverTarget, RfDrivers } from '../data';
import { panel, sectionHead, sectionMeta, sectionTitle } from './ui';

export type NasaEvidenceCardProps = {
  material: Material | null;
  currentAirflow?: number;
  currentOxygen?: number;
  currentPressure?: number;
  reverseSolverTarget?: ReverseSolverTarget | null;
  rfDrivers?: RfDrivers | null;
  onApplyOverride?: (targetFlow: number) => void;
};

export function NasaEvidenceCard({
  material,
  currentAirflow = 12,
  currentOxygen = 21,
  currentPressure = 101.3,
  reverseSolverTarget = null,
  rfDrivers = null,
  onApplyOverride,
}: NasaEvidenceCardProps) {
  // Header Subtitle / Badge: Active material's investigation ID and standard ref, falling back to '—'
  const badgeText = material
    ? [material.psi_investigation_id, material.standard_ref].filter(Boolean).join(' · ') || '—'
    : '—';

  // --- Model 3 (Random Forest) Hazard Drivers ---
  // Driver 1: Critical Flow Window
  let flowDriverPct: number | null = null;
  let flowDriverDisplay = '—';
  let flowDriverLevel = 0;
  let flowTone: 'primary' | 'warning' | 'caution' = 'primary';

  if (material) {
    if (rfDrivers?.criticalFlowWindow != null) {
      flowDriverPct = rfDrivers.criticalFlowWindow;
      flowDriverDisplay = `${flowDriverPct.toFixed(1)}%`;
      flowDriverLevel = Math.max(0, Math.min(20, Math.round((flowDriverPct / 100) * 20)));
      flowTone = flowDriverLevel > 12 ? 'warning' : 'primary';
    } else {
      const window = material.critical_flow_window_cms;
      if (window) {
        const [minFlow, maxFlow] = window;
        const inWindow = currentAirflow >= minFlow && currentAirflow <= maxFlow;
        const mid = (minFlow + maxFlow) / 2;
        const span = (maxFlow - minFlow) / 2 + 5;
        const proximity = Math.max(0, 1 - Math.abs(currentAirflow - mid) / span);
        flowDriverLevel = inWindow
          ? Math.max(12, Math.min(20, Math.round(12 + proximity * 8)))
          : Math.max(2, Math.min(10, Math.round(proximity * 10)));
        flowDriverDisplay = `${currentAirflow.toFixed(1)} cm/s (${minFlow.toFixed(0)}–${maxFlow.toFixed(0)})`;
        flowTone = inWindow ? 'warning' : 'primary';
      }
    }
  }

  // Driver 2: O2 Margin vs. LOI
  let o2DriverDisplay = '—';
  let o2DriverLevel = 0;
  let o2Tone: 'primary' | 'warning' | 'caution' = 'primary';

  if (material) {
    if (rfDrivers?.o2MarginLoi != null) {
      const o2Pct = rfDrivers.o2MarginLoi;
      o2DriverDisplay = `${o2Pct.toFixed(1)}%`;
      o2DriverLevel = Math.max(0, Math.min(20, Math.round((o2Pct / 100) * 20)));
      o2Tone = o2DriverLevel > 12 ? 'warning' : 'primary';
    } else {
      const loi = material.loi_threshold_pct ?? (parseFloat(material.uloi) || 21.0);
      const margin = currentOxygen - loi;
      o2DriverLevel =
        margin > 0
          ? Math.max(8, Math.min(20, Math.round(8 + (margin / 15) * 12)))
          : Math.max(1, Math.min(7, Math.round(7 + (margin / 20) * 6)));
      o2DriverDisplay = `${margin >= 0 ? '+' : ''}${margin.toFixed(1)}% vs LOI`;
      o2Tone = margin > 0 ? 'warning' : 'primary';
    }
  }

  // Driver 3: Cabin Pressure
  let presDriverDisplay = '—';
  let presDriverLevel = 0;
  let presTone: 'primary' | 'warning' | 'caution' = 'primary';

  if (material) {
    if (rfDrivers?.cabinPressure != null) {
      const presPct = rfDrivers.cabinPressure;
      presDriverDisplay = `${presPct.toFixed(1)}%`;
      presDriverLevel = Math.max(0, Math.min(20, Math.round((presPct / 100) * 20)));
      presTone = presDriverLevel > 12 ? 'warning' : 'primary';
    } else {
      const ratio = currentPressure / 101.3;
      presDriverLevel = Math.max(2, Math.min(20, Math.round(ratio * 10)));
      presDriverDisplay = `${currentPressure.toFixed(1)} kPa`;
      presTone = currentPressure > 102 ? 'caution' : 'primary';
    }
  }

  // --- Reverse-Solver Actuation Target & Button ---
  const targetFlow = reverseSolverTarget?.flow_velocity_cm_s ?? null;
  const targetRpm =
    reverseSolverTarget?.rpm ?? (targetFlow !== null ? Math.round(targetFlow * 85) : null);
  const targetRisk = reverseSolverTarget?.post_throttle_risk_pct ?? null;

  const targetFlowDisplay =
    targetFlow !== null && targetRpm !== null
      ? `${targetFlow.toFixed(1)} cm/s · ${targetRpm} RPM`
      : '—';

  const targetRiskDisplay = targetRisk !== null ? `${targetRisk.toFixed(1)}%` : '—';

  // Disabled when no target is loaded OR when current airflow is already at/below the target
  const canApply = targetFlow !== null && currentAirflow > targetFlow;

  const handleApply = () => {
    if (canApply && onApplyOverride && targetFlow !== null) {
      onApplyOverride(targetFlow);
    }
  };

  const statusNotice = !material
    ? 'No material selected'
    : targetFlow === null
    ? 'No quench target computed'
    : currentAirflow <= targetFlow
    ? `Airflow at quench setpoint (${targetFlow.toFixed(1)} cm/s)`
    : `Quench delta: ${(targetFlow - currentAirflow).toFixed(1)} cm/s`;

  return (
    <article className={`${panel} flex flex-col justify-between min-w-0`}>
      {/* 1. Header */}
      <div>
        <div className={`${sectionHead} mb-2 items-start`}>
          <div className="flex min-w-0 items-start gap-2">
            <ShieldAlert size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className={sectionTitle}>NASA PSI-26 Evidence &amp; Reverse-Solver</h2>
              <p className="m-0 mt-1 truncate text-[12px] leading-snug text-secondary">
                {material ? `${material.name} · ${material.location}` : 'Select a material to inspect flight evidence'}
              </p>
            </div>
          </div>
          <span
            className={`${sectionMeta} border border-line bg-void px-2 py-0.5 font-mono text-[10.5px] font-semibold text-secondary`}
          >
            {badgeText}
          </span>
        </div>

        {/* 2. NASA Provenance & Historical Finding */}
        <div className="mb-2.5 border border-line bg-void p-2">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="font-mono text-[9.5px] font-bold uppercase tracking-[.08em] text-muted">
              Historical Flight Finding
            </span>
            {material?.source_doi_url ? (
              <a
                href={material.source_doi_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono text-[10px] text-primary transition-colors hover:text-highlight hover:underline"
                aria-label={`View NASA PSI record for ${material.name}`}
              >
                <span>NASA PSI RECORD</span>
                <ExternalLink size={10} aria-hidden="true" />
              </a>
            ) : (
              <span className="font-mono text-[10px] text-muted">DOI PENDING</span>
            )}
          </div>
          <p className="m-0 font-sans text-[11.5px] leading-relaxed text-ink">
            {material?.historical_finding || (
              <span className="text-muted">
                {material ? 'Awaiting NASA flight test provenance telemetry...' : '—'}
              </span>
            )}
          </p>
        </div>

        {/* 3. Model 3 (Random Forest) Hazard Drivers */}
        <div className="mb-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-heading text-[10.5px] font-bold uppercase tracking-[.08em] text-secondary">
              RF Root-Cause Hazard Drivers
            </span>
            <span className="font-mono text-[9.5px] text-muted">Model 3 · BASS/PSI</span>
          </div>

          <div className="grid gap-1.5 border border-line bg-void p-2">
            <DriverRow
              label="Critical Flow Window"
              valueDisplay={flowDriverDisplay}
              level={flowDriverLevel}
              tone={flowTone}
            />
            <DriverRow
              label="O2 Margin vs. LOI"
              valueDisplay={o2DriverDisplay}
              level={o2DriverLevel}
              tone={o2Tone}
            />
            <DriverRow
              label="Cabin Pressure"
              valueDisplay={presDriverDisplay}
              level={presDriverLevel}
              tone={presTone}
            />
          </div>
        </div>
      </div>

      {/* 4. Reverse-Solver Actuation Container */}
      <div className="border border-line bg-void p-2 compact:p-2.5">
        <div className="mb-2 flex items-center justify-between gap-2 border-b border-line/60 pb-1.5">
          <div className="flex items-center gap-1.5">
            <Gauge size={13} className="text-warning" aria-hidden="true" />
            <span className="font-heading text-[10.5px] font-bold uppercase tracking-[.08em] text-secondary">
              Reverse-Solver Actuation
            </span>
          </div>
          <span className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-muted">
            Dual-Constraint
          </span>
        </div>

        <div className="grid grid-cols-2 items-center gap-3">
          <div>
            <span className="block font-mono text-[9.5px] uppercase tracking-wider text-muted">
              Target Fan Throttle
            </span>
            <b className="font-mono text-[13px] font-bold text-ink">
              {targetFlowDisplay}
            </b>
          </div>
          <div className="text-right">
            <span className="block font-mono text-[9.5px] uppercase tracking-wider text-muted">
              Post-Throttle Risk
            </span>
            <b
              className={`font-mono text-[13px] font-bold ${
                targetRisk !== null && targetRisk <= 5
                  ? 'text-success'
                  : targetRisk !== null
                  ? 'text-warning'
                  : 'text-ink'
              }`}
            >
              {targetRiskDisplay}
            </b>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line/60 pt-2">
          <span className="truncate font-mono text-[10px] text-muted" title={statusNotice}>
            {statusNotice}
          </span>
          <button
            type="button"
            disabled={!canApply}
            onClick={handleApply}
            className={`shrink-0 border px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase tracking-wider transition-colors ${
              canApply
                ? 'border-critical bg-critical/20 text-critical hover:bg-critical hover:text-ink active:scale-[0.98]'
                : 'cursor-not-allowed border-line bg-raised/30 text-muted opacity-60'
            }`}
            aria-label="Apply Reverse-Solver recommended airflow quench setpoint"
          >
            [APPLY SOLVER OVERRIDE]
          </button>
        </div>
      </div>
    </article>
  );
}

function DriverRow({
  label,
  valueDisplay,
  level,
  tone = 'primary',
}: {
  label: string;
  valueDisplay: string;
  level: number;
  tone?: 'primary' | 'warning' | 'caution';
}) {
  const toneClass =
    tone === 'warning' ? 'bg-warning' : tone === 'caution' ? 'bg-caution' : 'bg-primary';

  return (
    <div className="grid grid-cols-[115px_1fr_80px] items-center gap-2">
      <span className="truncate font-sans text-[11px] text-secondary">{label}</span>
      <div className="flex h-1.5 gap-0.5" aria-hidden="true">
        {Array.from({ length: 20 }, (_, i) => (
          <i
            key={i}
            className={`flex-1 ${i < level ? toneClass : 'bg-raised'}`}
          />
        ))}
      </div>
      <span className="text-right font-mono text-[10.5px] font-semibold text-ink">
        {valueDisplay}
      </span>
    </div>
  );
}

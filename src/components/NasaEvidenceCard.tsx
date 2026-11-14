import { ExternalLink, Gauge, ShieldAlert } from 'lucide-react';
import type { EvidenceAndActuation, Material, ReverseSolverTarget, RfDrivers } from '../data';
import { panel, sectionHead, sectionMeta, sectionTitle } from './ui';

export type NasaEvidenceCardProps = {
  material: Material | null;
  evidenceAndActuation?: EvidenceAndActuation | null;
  currentAirflow?: number;
  currentOxygen?: number;
  currentPressure?: number;
  reverseSolverTarget?: ReverseSolverTarget | null;
  rfDrivers?: RfDrivers | null;
  onApplyOverride?: (targetFlow: number) => void;
};

export function NasaEvidenceCard({
  material,
  evidenceAndActuation = null,
  currentAirflow = 12,
  currentOxygen = 21,
  currentPressure = 101.3,
  reverseSolverTarget = null,
  rfDrivers = null,
  onApplyOverride,
}: NasaEvidenceCardProps) {
  // Provenance data from backend or active material
  const prov = evidenceAndActuation?.nasa_provenance;
  const investigationId = prov?.psi_investigation_id ?? material?.psi_investigation_id ?? 'PSI-26';
  const standardRef = prov?.standard_ref ?? material?.standard_ref ?? 'NASA-STD-6001B';
  const doiUrl = prov?.source_doi_url ?? material?.source_doi_url;
  const findingText =
    prov?.historical_finding ??
    material?.historical_finding ??
    'Awaiting NASA flight test provenance telemetry...';

  const badgeText = `${investigationId} · ${standardRef}`;

  // Reverse Solver Target
  const solverRec = evidenceAndActuation?.reverse_solver_recommendation;
  const targetFlow =
    solverRec?.recommended_flow_velocity_cm_s ??
    reverseSolverTarget?.flow_velocity_cm_s ??
    null;

  const targetRpm =
    reverseSolverTarget?.rpm ?? (targetFlow !== null ? Math.round(targetFlow * 85) : null);

  const targetRisk =
    solverRec?.probability_sustained_at_target != null
      ? solverRec.probability_sustained_at_target * 100
      : reverseSolverTarget?.post_throttle_risk_pct ?? null;

  const targetFlowDisplay =
    targetFlow !== null && targetRpm !== null
      ? `${targetFlow.toFixed(1)} cm/s · ${targetRpm} RPM`
      : '—';

  const targetRiskDisplay = targetRisk !== null ? `${targetRisk.toFixed(1)}%` : '—';

  const canApply = targetFlow !== null && currentAirflow > targetFlow;

  const handleApply = () => {
    if (canApply && onApplyOverride && targetFlow !== null) {
      onApplyOverride(targetFlow);
    }
  };

  const fanCommand =
    evidenceAndActuation?.fan_actuation_command ??
    (canApply
      ? `THROTTLE_DOWN (${(targetFlow! - currentAirflow).toFixed(1)} cm/s)`
      : currentAirflow <= (targetFlow ?? 0)
      ? 'AT_QUENCH_SETPOINT'
      : 'NOMINAL_HOLD');

  // Model 3 (Random Forest) Hazard Drivers
  const backendDrivers = evidenceAndActuation?.hazard_drivers ?? rfDrivers?.rawList;

  return (
    <article className={`${panel} flex flex-col justify-between min-w-0`}>
      {/* 1. Header */}
      <div>
        <div className={`${sectionHead} mb-2 items-start`}>
          <div className="flex min-w-0 items-start gap-2">
            <ShieldAlert size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className={sectionTitle}>NASA PSI-26 Evidence &amp; Reverse-Solver</h2>
              <p className="m-0 mt-0.5 truncate font-sans text-[11.5px] leading-snug text-secondary">
                {material
                  ? `${material.displayName || material.name} · ${material.location}`
                  : 'Select a material to inspect flight evidence'}
              </p>
            </div>
          </div>
          <span
            className={`${sectionMeta} border border-line bg-void px-2 py-0.5 font-mono text-[10px] font-semibold text-secondary`}
          >
            {badgeText}
          </span>
        </div>

        {/* 2. NASA Provenance & Historical Finding */}
        <div className="mb-2.5 border border-line bg-void p-2">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[.08em] text-muted">
              Historical Flight Finding
            </span>
            {doiUrl ? (
              <a
                href={doiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-mono text-[10px] text-primary transition-colors hover:text-highlight hover:underline"
                aria-label={`View NASA PSI record for ${material?.name}`}
              >
                <span>NASA PSI RECORD</span>
                <ExternalLink size={10} aria-hidden="true" />
              </a>
            ) : (
              <span className="font-mono text-[10px] text-muted">DOI PENDING</span>
            )}
          </div>
          <p className="m-0 font-sans text-[11.5px] leading-relaxed text-ink">
            {findingText}
          </p>
        </div>

        {/* 3. Model 3 (Random Forest) Hazard Drivers */}
        <div className="mb-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-heading text-[10.5px] font-bold uppercase tracking-[.08em] text-secondary">
              RF Root-Cause Hazard Drivers
            </span>
            <span className="font-mono text-[10px] text-muted">Model 3 · NASA PSI-26</span>
          </div>

          <div className="grid gap-1.5 border border-line bg-void p-2">
            {backendDrivers && backendDrivers.length > 0 ? (
              backendDrivers.map((driver, idx) => {
                const level = Math.max(0, Math.min(20, Math.round((driver.importance_pct / 100) * 20)));
                const tone = level > 8 ? 'warning' : 'primary';
                return (
                  <DriverRow
                    key={idx}
                    label={driver.label}
                    valueDisplay={`${driver.importance_pct.toFixed(1)}%`}
                    level={level}
                    tone={tone}
                  />
                );
              })
            ) : (
              // Heuristic drivers fallback
              <>
                <DriverRow
                  label="Critical Flow Window"
                  valueDisplay={
                    rfDrivers?.criticalFlowWindow != null
                      ? `${rfDrivers.criticalFlowWindow.toFixed(1)}%`
                      : `${currentAirflow.toFixed(1)} cm/s (${material?.critical_flow_window_cms[0] ?? 1}–${material?.critical_flow_window_cms[1] ?? 15})`
                  }
                  level={
                    rfDrivers?.criticalFlowWindow != null
                      ? Math.round((rfDrivers.criticalFlowWindow / 100) * 20)
                      : currentAirflow >= (material?.critical_flow_window_cms[0] ?? 1) &&
                        currentAirflow <= (material?.critical_flow_window_cms[1] ?? 15)
                      ? 14
                      : 4
                  }
                  tone="warning"
                />
                <DriverRow
                  label="O2 Margin vs. LOI"
                  valueDisplay={
                    rfDrivers?.o2MarginLoi != null
                      ? `${rfDrivers.o2MarginLoi.toFixed(1)}%`
                      : `${currentOxygen >= (material?.loi_threshold_pct ?? 21) ? '+' : ''}${(
                          currentOxygen - (material?.loi_threshold_pct ?? 21)
                        ).toFixed(1)}% vs LOI`
                  }
                  level={
                    rfDrivers?.o2MarginLoi != null
                      ? Math.round((rfDrivers.o2MarginLoi / 100) * 20)
                      : currentOxygen > (material?.loi_threshold_pct ?? 21)
                      ? 12
                      : 2
                  }
                  tone={
                    currentOxygen > (material?.loi_threshold_pct ?? 21) ? 'warning' : 'primary'
                  }
                />
                <DriverRow
                  label="Cabin Pressure"
                  valueDisplay={
                    rfDrivers?.cabinPressure != null
                      ? `${rfDrivers.cabinPressure.toFixed(1)}%`
                      : `${currentPressure.toFixed(1)} kPa`
                  }
                  level={
                    rfDrivers?.cabinPressure != null
                      ? Math.round((rfDrivers.cabinPressure / 100) * 20)
                      : 10
                  }
                  tone="primary"
                />
              </>
            )}
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
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
            {fanCommand}
          </span>
        </div>

        <div className="grid grid-cols-2 items-center gap-3">
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-muted">
              Target Fan Throttle
            </span>
            <b className="font-mono text-[13px] font-bold tabular-nums text-ink">
              {targetFlowDisplay}
            </b>
          </div>
          <div className="text-right">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-muted">
              Post-Throttle Risk
            </span>
            <b className="font-mono text-[13px] font-bold tabular-nums text-success">
              {targetRiskDisplay}
            </b>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            disabled={!canApply}
            onClick={handleApply}
            className={`flex-1 border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[.06em] transition-colors ${
              canApply
                ? 'border-critical bg-critical/15 text-critical hover:bg-critical/25 active:scale-[0.99] cursor-pointer'
                : 'border-line bg-raised/40 text-muted cursor-not-allowed'
            }`}
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
  tone,
}: {
  label: string;
  valueDisplay: string;
  level: number;
  tone: 'primary' | 'warning' | 'caution';
}) {
  const barClass =
    tone === 'warning' ? 'bg-warning' : tone === 'caution' ? 'bg-caution' : 'bg-primary';

  return (
    <div className="grid grid-cols-[minmax(110px,1.2fr)_1fr_auto] items-center gap-2">
      <span className="truncate font-sans text-[11px] font-medium text-ink">{label}</span>
      <div className="flex h-1.5 gap-0.5">
        {Array.from({ length: 20 }, (_, n) => (
          <i
            key={n}
            className={`flex-1 ${n < level ? barClass : 'bg-raised'}`}
          />
        ))}
      </div>
      <span className="font-mono text-[10.5px] tabular-nums text-secondary text-right min-w-[55px]">
        {valueDisplay}
      </span>
    </div>
  );
}

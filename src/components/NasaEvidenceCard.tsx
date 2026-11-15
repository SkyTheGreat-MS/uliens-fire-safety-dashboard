import { ExternalLink, Gauge, ShieldAlert } from 'lucide-react';
import type { Material } from '../data';
import type { Evidence, SolverResult } from '../services/avionicsService';
import { panel, sectionHead, sectionMeta, sectionTitle } from './ui';

const solverLabels: Record<SolverResult['status'], string> = {
  dual_constraint_quench_found: 'Model candidate found',
  probability_cutoff_only_quench_found: 'Only the probability cutoff is met',
  no_supported_quench_point_found: 'No candidate within the model range',
  conditions_outside_material_training_range: 'Scenario outside the model range',
};

type Props = {
  material: Material | null;
  evidence?: Evidence;
  onPreviewTarget?: () => void;
  isEarth: boolean;
};

export function NasaEvidenceCard({ material, evidence, onPreviewTarget, isEarth }: Props) {
  const provenance = evidence?.nasa_provenance ?? material;
  const solver = evidence?.reverse_solver_recommendation;
  const flow = solver?.recommended_flow_velocity_cm_s;
  const probability = solver?.probability_sustained;
  const drivers = evidence?.hazard_drivers ?? [];

  return (
    <article className={`${panel} flex flex-col justify-between min-w-0`}>
      <div>
        <div className={`${sectionHead} mb-2 items-start`}>
          <div className="flex min-w-0 items-start gap-2">
            <ShieldAlert size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className={sectionTitle}>NASA evidence &amp; reverse solver</h2>
              <p className="m-0 mt-0.5 truncate font-sans text-[11.5px] leading-snug text-secondary">
                {material && [material.displayName, material.location].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          {provenance?.psi_investigation_id && (
            <span className={`${sectionMeta} border border-line bg-void px-2 py-0.5`}>
              {provenance.psi_investigation_id}
            </span>
          )}
        </div>

        <div className="mb-2.5 border border-line bg-void p-2">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[.08em] text-muted">{provenance?.standard_ref ?? 'NASA provenance'}</span>
            {provenance?.source_doi_url && (
              <a href={provenance.source_doi_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 font-mono text-[10px] text-primary hover:underline">
                NASA source <ExternalLink size={10} aria-hidden="true" />
              </a>
            )}
          </div>
          <p className="m-0 font-sans text-[11.5px] leading-relaxed text-ink">{provenance?.historical_finding ?? 'Source finding unavailable'}</p>
        </div>

        <div className="mb-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <h3 className="font-heading text-[10.5px] font-bold uppercase tracking-[.08em] text-secondary">Global feature importance</h3>
            <span className="font-mono text-[10px] text-muted">Model 3 · Random forest</span>
          </div>
          <div className="grid gap-1.5 border border-line bg-void p-2">
            {drivers.length === 0 && <span className="font-mono text-[10px] text-secondary">Unavailable for this view</span>}
            {drivers.map((driver) => (
              <div key={driver.feature} className="grid grid-cols-[minmax(95px,1.2fr)_1fr_auto] items-center gap-2">
                <span className="truncate font-sans text-[11px] font-medium text-ink">{driver.label}</span>
                <div className="flex h-1.5 gap-0.5" aria-hidden="true">
                  {Array.from({ length: 20 }, (_, index) => (
                    <i key={index} className={`flex-1 ${index < Math.round(driver.importance_pct / 5) ? 'bg-primary' : 'bg-raised'}`} />
                  ))}
                </div>
                <span className="min-w-[48px] text-right font-mono text-[10.5px] tabular-nums text-secondary">
                  {driver.importance_pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-line bg-void p-2 compact:p-2.5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-1.5">
          <h3 className="flex items-center gap-1.5 font-heading text-[10.5px] font-bold uppercase tracking-[.08em] text-secondary">
            <Gauge size={13} className="text-warning" aria-hidden="true" /> Reverse-solver preview
          </h3>
          <span className="font-mono text-[10px] text-secondary">
            {solver ? solverLabels[solver.status] : isEarth ? 'Earth reference' : 'Evaluation unavailable'}
          </span>
        </div>
        <div className="grid grid-cols-2 items-center gap-3">
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-muted">Candidate airflow</span>
            <b className="font-mono text-[13px] font-bold tabular-nums text-ink">{flow == null ? '—' : `${flow.toFixed(1)} cm/s`}</b>
          </div>
          <div className="text-right">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-muted">Candidate P(sustained)</span>
            <b className="font-mono text-[13px] font-bold tabular-nums text-ink">{probability == null ? '—' : `${(probability * 100).toFixed(1)}%`}</b>
          </div>
        </div>
        {onPreviewTarget && (
          <button type="button" onClick={onPreviewTarget}
            className="mt-2.5 w-full border border-primary/60 bg-primary/10 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[.06em] text-primary hover:bg-primary/20">
            Preview simulated target
          </button>
        )}
      </div>
    </article>
  );
}

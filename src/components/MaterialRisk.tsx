import { useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { materials, sectors, type Material, type MaterialRiskItem, type Sector } from '../data';
import { panel, sectionHead, sectionTitle } from './ui';

const riskColumns =
  'grid-cols-[24px_minmax(132px,1fr)_58px] compact:grid-cols-[28px_minmax(150px,1.2fr)_minmax(90px,.8fr)_62px_68px] tight:grid-cols-[30px_minmax(170px,1.25fr)_minmax(110px,.9fr)_66px_72px]';

export function MaterialRisk({
  activeSector,
  selectedMaterial,
  ranking,
  onSelectMaterial,
}: {
  activeSector: Sector;
  selectedMaterial: number | null;
  ranking?: MaterialRiskItem[] | null;
  onSelectMaterial: (index: number) => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Use live ranking rows if available, else standard 8 NASA materials
  const displayItems = ranking && ranking.length > 0 ? ranking : materials;
  const activeMaterial = selectedMaterial !== null ? displayItems[selectedMaterial] ?? null : null;

  const handleRowClick = (index: number) => {
    onSelectMaterial(index);
    setDrawerOpen(true);
  };

  return (
    <section className={`${panel} relative`}>
      <div className="flex items-start justify-between gap-3 compact:items-center">
        <div>
          <div className={`${sectionHead} mb-1`}>
            <h2 className={sectionTitle}>Material risk ranking</h2>
          </div>
          <p className="mb-2 font-mono text-[10.5px] tracking-[.02em] text-secondary">
            MODEL 2 · POLYNOMIAL LOGISTIC REGRESSION (NASA PSI-26)
          </p>
        </div>
        <div className="grid min-w-[120px] justify-items-end gap-0.5">
          <div className="flex items-center gap-1 font-mono text-[10px] text-muted">
            <span>{displayItems.length} MATERIALS</span>
            <span className="text-secondary">· 4 SHOWN</span>
          </div>
          <b className="font-mono text-[12px] font-bold text-primary">{sectors[activeSector].short}</b>
        </div>
      </div>

      <div className="border-t border-line">
        <div
          className={`hidden items-center gap-1.5 border-b border-line bg-surface px-[7px] py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[.06em] text-muted compact:grid tight:gap-2 ${riskColumns}`}
        >
          <span>Rank</span>
          <span>Material / location</span>
          <span>Visual meter</span>
          <span>IGNITION PROB.</span>
          <span>State</span>
        </div>

        {/* Scrollable Container: Displays 4 rows, scroll for others */}
        <div className="max-h-[188px] overflow-y-auto overflow-x-auto avionics-scrollbar divide-y divide-line">
          {displayItems.map((item, index) => {
          const isSelected = selectedMaterial === index;
          const prob = 'probability_sustained' in item ? item.probability_sustained : parseFloat(item.probability) / 100;
          const probPctText = `${(prob * 100).toFixed(1)}%`;
          const level = Math.max(0, Math.min(20, Math.round(prob * 20)));

          const isCritical =
            ('hazard_regime' in item && item.hazard_regime === 'CRITICAL') ||
            ('risk_status' in item && item.risk_status === 'HIGH') ||
            ('state' in item && item.state === 'CRITICAL');
          const isElevated =
            ('hazard_regime' in item && item.hazard_regime === 'ELEVATED') ||
            ('risk_status' in item && item.risk_status === 'ELEVATED') ||
            ('state' in item && item.state === 'ELEVATED');

          const badgeText = isCritical ? 'SUSTAINED' : isElevated ? 'ELEVATED' : 'NOMINAL';
          const badgeTone = isCritical
            ? 'border-critical/60 bg-critical/10 text-critical'
            : isElevated
            ? 'border-warning/60 bg-warning/10 text-warning'
            : 'border-success/60 bg-success/10 text-success';

          const meterTone = isCritical
            ? 'bg-critical'
            : isElevated
            ? 'bg-warning'
            : 'bg-primary';

          const matName =
            'displayName' in item && item.displayName
              ? item.displayName
              : 'name' in item && item.name
              ? item.name
              : item.material_name;

          return (
            <button
              key={item.material_name}
              aria-pressed={isSelected}
              className={`grid min-h-[42px] w-full min-w-[430px] items-center gap-1.5 border-0 border-b border-line bg-transparent px-[5px] py-2 text-left text-ink transition-colors compact:min-w-0 compact:px-[7px] compact:py-1.5 tight:gap-2 ${
                isSelected ? 'bg-raised' : 'hover:bg-raised'
              } ${riskColumns}`}
              onClick={() => handleRowClick(index)}
            >
              <span className="font-mono text-[11px] font-bold text-muted">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="grid min-w-0 gap-0.5">
                <b className="whitespace-normal font-heading text-[13px] font-bold text-ink compact:overflow-hidden compact:text-ellipsis compact:whitespace-nowrap">
                  {matName}
                </b>
                <small className="font-mono text-[10px] text-secondary truncate">
                  {item.location} · LOI {item.loi_threshold_pct}% · Window [{item.critical_flow_window_cms[0]}–{item.critical_flow_window_cms[1]} cm/s]
                </small>
              </span>
              <span
                className="col-start-2 row-start-2 flex h-2 gap-0.5 compact:col-auto compact:row-auto"
                aria-label={`Ignition probability meter, ${level} of 20`}
                role="img"
              >
                {Array.from({ length: 20 }, (_, n) => (
                  <i
                    key={n}
                    className={`flex-1 ${n < level ? meterTone : 'bg-raised'}`}
                  />
                ))}
              </span>
              <span className="hidden justify-self-end text-right font-mono text-[12px] font-bold text-ink compact:block">
                {probPctText}
              </span>
              <span
                className={`col-start-3 row-span-2 row-start-1 justify-self-end border px-1.5 py-0.5 font-mono text-[9.5px] font-bold compact:col-auto compact:row-auto ${badgeTone}`}
              >
                {badgeText}
              </span>
            </button>
          );
        })}
        </div>
      </div>

      {drawerOpen && activeMaterial && (
        <InspectionDrawer
          material={activeMaterial as unknown as Material}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </section>
  );
}

function InspectionDrawer({
  material,
  onClose,
}: {
  material: Material;
  onClose: () => void;
}) {
  const isElevated = material.state === 'ELEVATED' || material.state === 'CRITICAL';
  const prob = 'probability_sustained' in material ? (material as any).probability_sustained : 0.45;
  const probText = `${(prob * 100).toFixed(1)}%`;

  return (
    <>
      {/* Slide-in Overlay Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-void/60 backdrop-blur-[1px] transition-opacity duration-150 motion-reduce:transition-none"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Slide-in Overlay Panel */}
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-[400px] max-w-[calc(100vw-20px)] flex-col border-l border-line bg-surface p-4 text-ink shadow-2xl animate-[drawer-enter_120ms_linear] motion-reduce:animate-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspection-title"
        aria-label="Material inspection"
      >
        {/* Chassis corner ticks */}
        <div
          className="pointer-events-none absolute -left-px top-0 h-1.5 w-1.5 border-l-2 border-t-2 border-line"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-px bottom-0 h-1.5 w-1.5 border-b-2 border-l-2 border-line"
          aria-hidden="true"
        />

        {/* Header well */}
        <header className="flex items-start justify-between gap-3 border-b border-line pb-3">
          <div className="min-w-0">
            <span className="font-mono text-[10px] font-bold tracking-[.08em] text-muted">
              SEC 04 // MATERIAL QUALIFICATION AUDIT
            </span>
            <h3 id="inspection-title" className="mb-1 mt-1 font-heading text-[17px] font-bold leading-tight text-ink">
              {material.displayName || material.name}
            </h3>
            <span className="font-mono text-[10.5px] tracking-[.06em] text-secondary">
              {material.location.toUpperCase()} · LOI THRESHOLD {material.loi_threshold_pct}%
            </span>
          </div>
          <button
            className="flex size-7 shrink-0 items-center justify-center border border-line bg-void text-secondary transition-colors hover:border-primary hover:text-primary"
            type="button"
            aria-label="Close material inspection"
            onClick={onClose}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </header>

        {/* Scrollable content body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* Qualification audit matrix */}
          <section className="border-b border-line py-3" aria-label="Qualification matrix">
            <h4 className="mb-2 flex items-center justify-between font-heading text-[11px] font-bold uppercase tracking-[.08em] text-secondary">
              <span>QUALIFICATION MATRIX</span>
              <span className="font-mono text-[10px] text-muted">{material.standard_ref}</span>
            </h4>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5">
              <span className="text-[12px] font-medium text-secondary">Microgravity flight regime</span>
              <b
                className={`border px-2 py-0.5 font-mono text-[11px] font-bold ${
                  isElevated
                    ? 'border-critical bg-critical/15 text-critical'
                    : 'border-success bg-success/15 text-success'
                }`}
              >
                {isElevated ? 'SUSTAINED FLAME RISK' : 'PASS / SELF-EXTINGUISH'}
              </b>
              <small className="col-span-full font-mono text-[10.5px] text-secondary">
                Model 2 Polynomial Logistic Ignition Probability: <span className="text-primary font-bold">{probText}</span>
              </small>
            </div>
          </section>

          {/* Operational flow sections */}
          <section className="border-b border-line py-3">
            <h4 className="mb-1.5 font-heading text-[11px] font-bold uppercase tracking-[.08em] text-secondary">
              HISTORICAL NASA FLIGHT FINDING
            </h4>
            <p className="m-0 font-sans text-[12px] leading-relaxed text-ink">
              {material.historical_finding}
            </p>
            {material.source_doi_url && (
              <a
                href={material.source_doi_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] text-primary hover:underline"
              >
                <span>{material.psi_investigation_id} Repository</span>
                <ExternalLink className="size-2.5" />
              </a>
            )}
          </section>

          <section className="border-b border-line py-3">
            <h4 className="mb-1.5 font-heading text-[11px] font-bold uppercase tracking-[.08em] text-secondary">
              CRITICAL FLOW BOUNDS
            </h4>
            <p className="m-0 font-sans text-[12px] leading-relaxed text-secondary">
              NASA microgravity tests observed peak concurrent flame spread between{' '}
              <span className="font-mono text-warning font-bold">
                {material.critical_flow_window_cms[0]}–{material.critical_flow_window_cms[1]} cm/s
              </span>.
            </p>
          </section>

          <section className="border-b border-line py-3">
            <h4 className="mb-1.5 font-heading text-[11px] font-bold uppercase tracking-[.08em] text-secondary">
              RECOMMENDED QUENCH PROCEDURE
            </h4>
            <p className="m-0 font-sans text-[12px] leading-relaxed text-secondary">
              Throttle ventilation airflow below{' '}
              <span className="font-mono text-primary font-bold">
                {material.critical_flow_window_cms[0]} cm/s
              </span>{' '}
              or scrub oxygen concentration below{' '}
              <span className="font-mono text-primary font-bold">{material.loi_threshold_pct}%</span> to safely extinguish.
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="border-t border-line pt-2.5 font-mono text-[10px] tracking-[.08em] text-muted">
          NASA PSI-26 FLIGHT DATA · BASS &amp; SAFFIRE TELEMETRY
        </footer>
      </aside>
    </>
  );
}

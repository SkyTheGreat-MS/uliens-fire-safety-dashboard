import { useEffect, useRef, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { earthReference, sectors, type Material, type Sector } from '../data';
import type { RankingRow } from '../services/avionicsService';
import { panel, sectionHead, sectionTitle } from './ui';

const riskColumns =
  'grid-cols-[24px_minmax(132px,1fr)_58px] compact:grid-cols-[28px_minmax(150px,1.2fr)_minmax(90px,.8fr)_minmax(62px,.55fr)_68px] tight:grid-cols-[30px_minmax(170px,1.25fr)_minmax(110px,.9fr)_minmax(66px,.55fr)_72px]';

type Props = {
  activeSector: Sector;
  selectedMaterial?: string;
  materials: Material[];
  ranking?: RankingRow[];
  earthOxygen?: number;
  onSelectMaterial: (key: string) => void;
};

const riskTones = {
  HIGH: { badge: 'border-critical/60 bg-critical/10 text-critical', meter: 'bg-critical' },
  ELEVATED: { badge: 'border-warning/60 bg-warning/10 text-warning', meter: 'bg-warning' },
  LOW: { badge: 'border-success/60 bg-success/10 text-success', meter: 'bg-primary' },
};

export function MaterialRisk({ activeSector, selectedMaterial, materials, ranking, earthOxygen, onSelectMaterial }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const byKey = new Map(materials.map((material) => [material.material_name, material]));
  const predictions = new Map(ranking?.map((row) => [row.material_name, row]));
  const ordered = ranking
    ? ranking.map((row) => byKey.get(row.material_name)).filter((material): material is Material => material !== undefined)
    : materials;
  const activeMaterial = selectedMaterial ? byKey.get(selectedMaterial) : undefined;

  return (
    <section className={`${panel} relative`}>
      <div className="flex items-start justify-between gap-3 compact:items-center">
        <div>
          <div className={`${sectionHead} mb-1`}><h2 className={sectionTitle}>Material risk ranking</h2></div>
          <p className="mb-2 font-mono text-[10.5px] tracking-[.02em] text-secondary">
            {earthOxygen == null ? 'Polynomial Logistic Regression' : 'EARTH REFERENCE · LIMITING OXYGEN INDEX'}
          </p>
        </div>
        <div className="grid min-w-[120px] justify-items-end gap-0.5">
          {/* <span className="font-mono text-[10px] text-muted">{ordered.length} MATERIALS</span> */}
          <b className="font-mono text-[12px] font-bold text-primary">{sectors[activeSector].short}</b>
        </div>
      </div>

      <div className="border-t border-line">
        <div className={`hidden items-center gap-1.5 border-b border-line bg-surface px-[7px] py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[.06em] text-muted compact:grid tight:gap-2 ${riskColumns}`}>
          <span>Rank</span><span>Material / location</span><span>Visual meter</span>
          <span className="justify-self-center text-center">{earthOxygen == null ? 'Ignition Index' : 'LOI'}</span><span>State</span>
        </div>
        <div className="max-h-[188px] overflow-y-auto overflow-x-auto avionics-scrollbar divide-y divide-line">
          {ordered.length === 0 && <p className="px-2 py-3 font-mono text-[11px] text-secondary">Waiting for material catalog</p>}
          {ordered.map((item, index) => {
            const isSelected = selectedMaterial === item.material_name;
            const prediction = predictions.get(item.material_name);
            const percent = prediction ? prediction.probability_sustained * 100 : null;
            const level = percent == null ? 0 : Math.max(0, Math.min(20, Math.round(percent / 5)));
            const tones = prediction && riskTones[prediction.risk_status];
            const window = item.critical_flow_window_cms;
            const earth = earthOxygen == null ? null : earthReference(earthOxygen, item.loi_threshold_pct);
            const loi = item.loi_threshold_pct == null ? '—' : `${item.loi_threshold_pct}%`;
            const subtitle = [item.location, item.standard_ref, `LOI ${loi}`, window && `Window [${window[0]}–${window[1]} cm/s]`]
              .filter(Boolean).join(' · ');

            return (
              <button
                key={item.material_name}
                type="button"
                aria-pressed={isSelected}
                className={`grid min-h-[42px] w-full min-w-[430px] items-center gap-1.5 border-0 border-b border-line bg-transparent px-[5px] py-2 text-left text-ink transition-colors compact:min-w-0 compact:px-[7px] compact:py-1.5 tight:gap-2 ${isSelected ? 'bg-raised' : 'hover:bg-raised'} ${riskColumns}`}
                onClick={() => { onSelectMaterial(item.material_name); setDrawerOpen(true); }}
              >
                <span className="font-mono text-[11px] font-bold text-muted">{ranking ? String(index + 1).padStart(2, '0') : '—'}</span>
                <span className="grid min-w-0 gap-0.5">
                  <b className="whitespace-normal font-heading text-[13px] font-bold text-ink compact:overflow-hidden compact:text-ellipsis compact:whitespace-nowrap">{item.displayName}</b>
                  <small className="truncate font-mono text-[10px] text-secondary" title={subtitle}>{subtitle}</small>
                </span>
                <span className="col-start-3 row-start-1 flex h-2 gap-0.5 compact:col-auto compact:row-auto">
                  {percent != null && Array.from({ length: 20 }, (_, segment) => (
                    <i key={segment} className={`flex-1 ${segment < level ? tones?.meter : 'bg-raised'}`} />
                  ))}
                </span>
                <span className="hidden justify-self-center text-center font-mono text-[12px] font-bold text-ink compact:col-start-4 compact:block">
                  {earth != null ? loi : percent == null ? '—' : `${percent.toFixed(1)}%`}
                </span>
                <span className={`col-start-5 row-span-2 row-start-1 justify-self-end border px-1.5 py-0.5 font-mono text-[9.5px] font-bold compact:col-auto compact:row-auto ${tones?.badge ?? 'border-line text-secondary'}`}>
                  {earth ?? prediction?.risk_status ?? '—'}
                  {prediction?.out_of_material_training_range && <span className="block text-warning">Extrapolated</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {drawerOpen && activeMaterial && (
        <InspectionDrawer
          material={activeMaterial}
          prediction={predictions.get(activeMaterial.material_name)}
          earthOxygen={earthOxygen}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </section>
  );
}

function InspectionDrawer({ material, prediction, earthOxygen, onClose }: {
  material: Material;
  prediction?: RankingRow;
  earthOxygen?: number;
  onClose: () => void;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const window = material.critical_flow_window_cms;

  useEffect(() => {
    const previousFocus = document.activeElement;
    closeButton.current?.focus();
    return () => { if (previousFocus instanceof HTMLElement) previousFocus.focus(); };
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-void/60 backdrop-blur-[1px]" aria-hidden="true" onClick={onClose} />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-[400px] max-w-[calc(100vw-20px)] flex-col border-l border-line bg-surface p-4 text-ink shadow-2xl animate-[drawer-enter_120ms_linear] motion-reduce:animate-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspection-title"
        onKeyDown={(event) => { if (event.key === 'Escape') onClose(); }}
      >
        <div className="pointer-events-none absolute -left-px top-0 h-1.5 w-1.5 border-l border-t border-line" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-px bottom-0 h-1.5 w-1.5 border-b border-l border-line" aria-hidden="true" />
        <header className="flex items-start justify-between gap-3 border-b border-line pb-3">
          <div className="min-w-0">
            <span className="font-mono text-[10px] font-bold tracking-[.08em] text-muted">MATERIAL INSPECTION</span>
            <h3 id="inspection-title" className="mb-1 mt-1 font-heading text-[17px] font-bold leading-tight text-ink">{material.displayName}</h3>
            <span className="font-mono text-[10.5px] tracking-[.06em] text-secondary">
              {material.location} · LOI {material.loi_threshold_pct == null ? 'unavailable' : `${material.loi_threshold_pct}%`}
            </span>
          </div>
          <button ref={closeButton} className="flex size-7 shrink-0 items-center justify-center border border-line bg-void text-secondary transition-colors hover:border-primary hover:text-primary"
            type="button" aria-label="Close material inspection" onClick={onClose}>
            <X size={14} aria-hidden="true" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto pr-1">
          <section className="border-b border-line py-3">
            <h4 className="mb-2 flex items-center justify-between font-heading text-[11px] font-bold uppercase tracking-[.08em] text-secondary">
              {earthOxygen == null ? 'Model evaluation' : 'Earth reference'}
              <span className="font-mono text-[10px] text-muted">{material.standard_ref}</span>
            </h4>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5">
              <span className="text-[12px] font-medium text-secondary">{earthOxygen == null ? 'Random forest regime' : `${earthOxygen.toFixed(1)}% O₂`}</span>
              <b className="border border-line px-2 py-0.5 font-mono text-[11px] font-bold">
                {earthOxygen == null ? prediction?.hazard_regime ?? 'Unavailable' : earthReference(earthOxygen, material.loi_threshold_pct)}
              </b>
              {earthOxygen == null && (
                <small className="col-span-full font-mono text-[10.5px] text-secondary">
                  Ignition Index <span className="font-bold text-primary">{prediction ? `${(prediction.probability_sustained * 100).toFixed(1)}%` : '—'}</span>
                  {prediction?.out_of_material_training_range && ' · Extrapolated estimate'}
                </small>
              )}
            </div>
          </section>
          <section className="border-b border-line py-3">
            <h4 className="mb-1.5 font-heading text-[11px] font-bold uppercase tracking-[.08em] text-secondary">Historical NASA flight finding</h4>
            <p className="m-0 font-sans text-[12px] leading-relaxed text-ink">{material.historical_finding ?? 'Finding unavailable'}</p>
            {material.source_doi_url && (
              <a href={material.source_doi_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] text-primary hover:underline">
                {material.psi_investigation_id ?? 'NASA'} source <ExternalLink className="size-2.5" />
              </a>
            )}
          </section>
          <section className="border-b border-line py-3">
            <h4 className="mb-1.5 font-heading text-[11px] font-bold uppercase tracking-[.08em] text-secondary">Critical flow bounds</h4>
            <p className="m-0 font-mono text-[12px] text-secondary">{window ? `${window[0]}–${window[1]} cm/s · V2 catalog` : 'Flow window unavailable'}</p>
          </section>
        </div>
        <footer className="border-t border-line pt-2.5 font-mono text-[10px] tracking-[.08em] text-muted">{material.mission_source ?? 'Source unavailable'}</footer>
      </aside>
    </>
  );
}

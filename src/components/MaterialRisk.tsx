import { useState } from 'react';
import { X } from 'lucide-react';
import { materials, sectors, type Material, type Sector } from '../data';
import { panel, sectionHead, sectionTitle } from './ui';

const riskColumns =
  'grid-cols-[24px_minmax(132px,1fr)_58px] compact:grid-cols-[28px_minmax(150px,1.2fr)_minmax(90px,.8fr)_62px_68px] tight:grid-cols-[30px_minmax(170px,1.25fr)_minmax(110px,.9fr)_66px_72px]';

export function MaterialRisk({
  activeSector,
  selectedMaterial,
  onSelectMaterial,
}: {
  activeSector: Sector;
  selectedMaterial: number | null;
  onSelectMaterial: (index: number) => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const material = selectedMaterial === null ? null : materials[selectedMaterial];

  const handleRowClick = (index: number) => {
    if (selectedMaterial === index && drawerOpen) {
      setDrawerOpen(false);
    } else {
      onSelectMaterial(index);
      setDrawerOpen(true);
    }
  };

  return (
    <section className={`${panel} relative`}>
      <div className="flex items-start justify-between gap-3 compact:items-center">
        <div>
          <div className={`${sectionHead} mb-1`}>
            <h2 className={sectionTitle}>Material risk ranking</h2>
          </div>
          <p className="mb-2.5 text-[12px] leading-snug text-secondary">
            Illustrative values · not a flammability model
          </p>
        </div>
        <div className="grid min-w-[86px] justify-items-end gap-1">
          <span className="text-[11.5px] text-secondary">Active volume</span>
          <b className="font-mono text-[12px] font-bold text-primary">{sectors[activeSector].short}</b>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-line">
        <div
          className={`hidden items-center gap-1.5 border-b border-line px-[7px] py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[.06em] text-muted compact:grid tight:gap-2 ${riskColumns}`}
        >
          <span>Rank</span>
          <span>Material / location</span>
          <span>Visual meter</span>
          <span>Demo value</span>
          <span>State</span>
        </div>

        {materials.map((item, index) => {
          const isSelected = selectedMaterial === index;
          return (
            <button
              key={item.name}
              aria-pressed={isSelected}
              className={`grid min-h-[42px] w-full min-w-[430px] items-center gap-1.5 border-0 border-b border-line bg-transparent px-[5px] py-2.5 text-left text-ink transition-colors compact:min-w-0 compact:px-[7px] compact:py-1.5 tight:gap-2 ${
                isSelected ? 'bg-raised' : 'hover:bg-raised'
              } ${riskColumns}`}
              onClick={() => handleRowClick(index)}
            >
              <span className="font-mono text-[11px] font-bold text-muted">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="grid min-w-0 gap-1">
                <b className="whitespace-normal font-heading text-[13px] font-bold text-ink compact:overflow-hidden compact:text-ellipsis compact:whitespace-nowrap">
                  {item.name}
                </b>
                <small className="font-mono text-[10.5px] text-secondary">
                  {item.location} · ULOI reference {item.uloi}
                </small>
              </span>
              <span
                className="col-start-2 row-start-2 flex h-2 gap-0.5 compact:col-auto compact:row-auto"
                aria-label={`Illustrative visual meter, ${item.level} of 20`}
                role="img"
              >
                {Array.from({ length: 20 }, (_, n) => (
                  <i
                    key={n}
                    className={`flex-1 ${
                      n < item.level ? (index === 0 ? 'bg-warning' : 'bg-primary') : 'bg-raised'
                    }`}
                  />
                ))}
              </span>
              <span className="hidden justify-self-end text-right font-mono text-[12px] font-bold text-ink compact:block">
                {item.probability}
              </span>
              <span
                className={`col-start-3 row-span-2 row-start-1 justify-self-end border px-1.5 py-0.5 font-mono text-[9.5px] font-bold compact:col-auto compact:row-auto ${
                  index === 0 ? 'border-warning/60 bg-warning/10 text-warning' : 'border-success/60 bg-success/10 text-success'
                }`}
              >
                {item.state}
              </span>
            </button>
          );
        })}
      </div>

      {drawerOpen && material && (
        <InspectionDrawer
          material={material}
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
  const elevated = material.state === 'ELEVATED';

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
        className="fixed inset-y-0 right-0 z-50 flex w-[380px] max-w-[calc(100vw-20px)] flex-col border-l border-line bg-surface p-4 text-ink shadow-2xl animate-[drawer-enter_120ms_linear] motion-reduce:animate-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspection-title"
        aria-label="Material inspection"
      >
        {/* Chassis corner ticks */}
        <div
          className="pointer-events-none absolute -left-px top-0 h-1.5 w-1.5 border-l-2 border-t-2 border-elevated"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-px bottom-0 h-1.5 w-1.5 border-b-2 border-l-2 border-elevated"
          aria-hidden="true"
        />

        {/* Header well */}
        <header className="flex items-start justify-between gap-3 border-b border-line pb-3">
          <div className="min-w-0">
            <span className="font-mono text-[10px] font-bold tracking-[.08em] text-muted">
              SEC 04 // MATERIAL INSPECTION
            </span>
            <h3 id="inspection-title" className="mb-1 mt-1 font-heading text-[18px] font-bold leading-tight text-ink">
              {material.name}
            </h3>
            <span className="font-mono text-[11px] tracking-[.06em] text-secondary">
              {material.location.toUpperCase()} · ULOI {material.uloi}
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
          <section className="border-b border-line py-3" aria-label="Illustrative qualification matrix">
            <h4 className="mb-2 flex items-center justify-between font-heading text-[11.5px] font-bold uppercase tracking-[.08em] text-secondary">
              <span>QUALIFICATION MATRIX</span>
              <span className="font-mono text-[10px] text-muted">DEMO ONLY</span>
            </h4>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5">
              <span className="text-[12px] font-medium text-secondary">Microgravity sample case</span>
              <b
                className={`border px-2 py-0.5 font-mono text-[11px] font-bold ${
                  elevated ? 'border-critical bg-critical/15 text-critical' : 'border-success bg-success/15 text-success'
                }`}
              >
                {elevated ? 'FAIL' : 'PASS'}
              </b>
              <small className="col-span-full font-mono text-[11px] text-secondary">
                {elevated ? 'Elevated visual flammability state' : 'Nominal visual flammability state'}
              </small>
            </div>
            <p className="mb-0 mt-2 text-[10px] leading-relaxed text-muted">
              Illustrative UI state; this is not a test result or material qualification.
            </p>
          </section>

          {/* Operational flow sections */}
          <section className="border-b border-line py-3">
            <h4 className="mb-1.5 font-heading text-[11.5px] font-bold uppercase tracking-[.08em] text-secondary">
              WHAT HAPPENED
            </h4>
            <p className="m-0 text-[12.5px] leading-relaxed text-ink">
              This local demo ranks the material at{' '}
              <span className="font-mono font-bold text-warning">{material.probability}</span> visual probability.
            </p>
          </section>

          <section className="border-b border-line py-3">
            <h4 className="mb-1.5 font-heading text-[11.5px] font-bold uppercase tracking-[.08em] text-secondary">
              THE CAUSE
            </h4>
            <p className="m-0 text-[12.5px] leading-relaxed text-secondary">
              The displayed value is sample content and is not produced by a validated flammability model.
            </p>
          </section>

          <section className="border-b border-line py-3">
            <h4 className="mb-1.5 font-heading text-[11.5px] font-bold uppercase tracking-[.08em] text-secondary">
              HOW TO FIX
            </h4>
            <p className="m-0 text-[12.5px] leading-relaxed text-secondary">
              Use reviewed, material-specific qualification data from NASA test standards for any real mission assessment.
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="border-t border-line pt-2.5 font-mono text-[10px] tracking-[.08em] text-muted">
          DEMO RECORD · NO OPERATIONAL GUIDANCE
        </footer>
      </aside>
    </>
  );
}

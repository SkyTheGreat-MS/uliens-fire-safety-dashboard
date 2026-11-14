import { presets, sectors, statuses, type Preset, type Sector } from '../data';
import { panel, sectionHead, sectionMeta, sectionTitle } from './ui';

type Props = {
  activeSector: Sector;
  activePreset: string;
  onSelectSector: (sector: Sector) => void;
  onLoadPreset: (preset: Preset) => void;
};

export function StatusPanel({ activeSector, activePreset, onSelectSector, onLoadPreset }: Props) {
  return (
    <aside className={`${panel} flex h-full flex-col justify-between`}>
      {/* Top: Habitat Sectors */}
      <div>
        <div className={`${sectionHead} mb-2`}>
          <h2 className={sectionTitle}>Habitat status</h2>
          <span className={sectionMeta}>Sample · 14:32:08Z</span>
        </div>
        <div className="grid gap-1.5">
          {sectors.map((sector, index) => {
            const status = statuses[index];
            const selected = activeSector === sector.id;
            return (
              <button
                key={sector.id}
                aria-pressed={selected}
                className={`grid w-full grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2.5 border px-2.5 py-2 text-left text-ink transition-colors ${
                  selected
                    ? 'border-primary bg-raised'
                    : 'border-transparent bg-void hover:border-primary/50 hover:bg-raised'
                }`}
                onClick={() => onSelectSector(sector.id)}
              >
                <span className="font-mono text-[13px] font-bold text-muted">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="grid min-w-0 gap-0.5">
                  <b className="font-heading text-[13px] font-bold text-ink">{sector.label}</b>
                  <small className="font-mono text-[11px] text-secondary">
                    CO {status.co} ppm · Smoke {status.smoke} %/m
                  </small>
                </span>
                <span
                  className={`font-mono text-[11px] font-semibold ${
                    status.tone === 'caution' ? 'text-caution' : 'text-success'
                  }`}
                >
                  {status.state}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <hr className="my-2.5 w-full border-0 border-t border-line" />

      {/* Middle: Demo Cases */}
      <div className="flex flex-1 flex-col justify-center">
        <div className={`${sectionHead} mb-2`}>
          <h2 className={sectionTitle}>Demo cases</h2>
          <span className={sectionMeta}>Illustrative</span>
        </div>
        <div className="grid gap-2">
          {presets.map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                aria-pressed={isSelected}
                className={`grid gap-1.5 border p-2.5 text-left transition-colors ${
                  isSelected
                    ? 'border-warning bg-warning/10'
                    : 'border-transparent bg-void hover:border-warning/50 hover:bg-warning/5'
                }`}
                onClick={() => onLoadPreset(preset)}
              >
                <div className="flex items-center justify-between gap-2">
                  <b className="flex items-center gap-2 text-[13px] font-bold text-warning">
                    <span className="font-mono text-[11px] text-warning/80">{preset.id}</span>
                    {preset.title}
                  </b>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    {sectors[preset.sector].short}
                  </span>
                </div>
                <span className="font-mono text-[11px] leading-[1.45] text-secondary">
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom: Clarifying Notice */}
      <p className="mt-3 border-t border-line/40 pt-2 text-[11px] leading-relaxed text-secondary">
        Cases update sample readouts only. No prediction or safety decision is generated.
      </p>
    </aside>
  );
}

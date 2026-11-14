import { presets, sectors, type Preset, type Sector, type SectorTriageItem } from '../data';
import { panel, sectionHead, sectionMeta, sectionTitle } from './ui';

type Props = {
  activeSector: Sector;
  activePreset: string;
  sectorTriage?: SectorTriageItem[] | null;
  onSelectSector: (sector: Sector) => void;
  onLoadPreset: (preset: Preset) => void;
};

export function StatusPanel({
  activeSector,
  activePreset,
  sectorTriage,
  onSelectSector,
  onLoadPreset,
}: Props) {
  return (
    <aside className={`${panel} flex h-full flex-col justify-between`}>
      {/* Top: Habitat Sectors */}
      <div>
        <div className={`${sectionHead} mb-2`}>
          <h2 className={sectionTitle}>Habitat status</h2>
          <span className={sectionMeta}>Model 3 Triage</span>
        </div>
        <div className="grid gap-1.5">
          {sectors.map((sector, index) => {
            const triage = sectorTriage && sectorTriage[index];
            const spreadText = triage ? `${triage.flame_spread_mm_s.toFixed(2)} mm/s` : '0.12 mm/s';
            const probText = triage
              ? `${(triage.probability_sustained * 100).toFixed(0)}%`
              : '8%';
            const regime = triage?.hazard_regime ?? (index === 1 ? 'ELEVATED' : 'NOMINAL');
            const selected = activeSector === sector.id;

            const badgeTone =
              regime === 'CRITICAL'
                ? 'text-critical border-critical/60 bg-critical/10'
                : regime === 'ELEVATED'
                ? 'text-warning border-warning/60 bg-warning/10'
                : 'text-success border-success/60 bg-success/10';

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
                  <small className="font-mono text-[10.5px] text-secondary">
                    Spread: {spreadText} · P(Sustain): {probText}
                  </small>
                </span>
                <span
                  className={`border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${badgeTone}`}
                >
                  {regime}
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
          <span className={sectionMeta}>Flight presets</span>
        </div>
        <div className="grid gap-1.5">
          {presets.map((preset) => {
            const active = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                aria-pressed={active}
                className={`grid w-full grid-cols-[28px_minmax(0,1fr)] items-center gap-2.5 border px-2.5 py-2 text-left text-ink transition-colors ${
                  active
                    ? 'border-primary bg-raised'
                    : 'border-transparent bg-void hover:border-primary/50 hover:bg-raised'
                }`}
                onClick={() => onLoadPreset(preset)}
              >
                <span className="font-mono text-[13px] font-bold text-muted">{preset.id}</span>
                <span className="grid min-w-0 gap-0.5">
                  <b className="font-heading text-[13px] font-bold text-ink">{preset.title}</b>
                  <small className="font-mono text-[10.5px] text-secondary">
                    {preset.description}
                  </small>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

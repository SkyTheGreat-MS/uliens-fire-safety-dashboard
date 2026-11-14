import { presets, sectors, statuses, type Preset, type Sector } from '../data';
import { panel, sectionHead, sectionMeta, sectionTitle } from './ui';

type Props = {
  activeSector: Sector;
  activePreset: string;
  onSelectSector: (sector: Sector) => void;
  onLoadPreset: (preset: Preset) => void;
};

export function StatusPanel({ activeSector, activePreset, onSelectSector, onLoadPreset }: Props) {
  return <aside className={`${panel} flex flex-col`}>
    <div className={`${sectionHead} mb-[9px]`}><h2 className={sectionTitle}>Habitat status</h2><span className={sectionMeta}>Sample · 14:32:08Z</span></div>
    <div className="grid gap-1">{sectors.map((sector, index) => {
      const status = statuses[index];
      const selected = activeSector === sector.id;
      return <button key={sector.id} aria-pressed={selected} className={`grid w-full grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-[9px] border px-[7px] py-[7px] text-left text-ink transition-colors ${selected ? 'border-primary bg-raised' : 'border-transparent bg-void hover:border-primary/50 hover:bg-raised'}`} onClick={() => onSelectSector(sector.id)}>
        <span className="font-mono text-[13px] font-bold text-muted">{String(index + 1).padStart(2, '0')}</span><span className="grid min-w-0 gap-1"><b className="text-[13px] font-bold text-ink">{sector.label}</b><small className="font-mono text-[11px] text-secondary">CO {status.co} ppm · Smoke {status.smoke} %/m</small></span><span className={`font-mono text-[11px] font-semibold ${status.tone === 'caution' ? 'text-caution' : 'text-success'}`}>{status.state}</span>
      </button>;
    })}</div>
    <hr className="my-2.5 w-full border-0 border-t border-line" />
    <div className={`${sectionHead} mb-[9px]`}><h2 className={sectionTitle}>Demo cases</h2><span className={sectionMeta}>Illustrative</span></div>
    <div className="grid gap-1">{presets.map(preset => <button key={preset.id} aria-pressed={activePreset === preset.id} className={`grid gap-1.5 border p-[7px] text-left transition-colors ${activePreset === preset.id ? 'border-warning bg-warning/10' : 'border-transparent bg-void hover:border-warning/50 hover:bg-warning/5'}`} onClick={() => onLoadPreset(preset)}><b className="flex items-start gap-2 text-[12.5px] font-bold text-warning"><span className="font-mono text-[12px] text-warning/80">{preset.id}</span>{preset.title}</b><span className="font-mono text-[11px] leading-[1.4] text-secondary">{preset.description}</span></button>)}</div>
    <p className="mt-3 text-[10.5px] leading-normal text-secondary">Cases update sample readouts only. No prediction or safety decision is generated.</p>
  </aside>;
}

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
      return <button key={sector.id} aria-pressed={selected} className={`grid w-full grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-[9px] border px-[7px] py-[7px] text-left text-ink ${selected ? 'border-[#26404a] bg-raised' : 'border-transparent bg-[#0a0d13] hover:border-[#26404a] hover:bg-raised'}`} onClick={() => onSelectSector(sector.id)}>
        <span className="font-mono text-[12px] text-muted">{String(index + 1).padStart(2, '0')}</span><span className="grid min-w-0 gap-1"><b className="text-[11px] font-semibold">{sector.label}</b><small className="font-mono text-[9px] text-secondary">CO {status.co} ppm · Smoke {status.smoke} %/m</small></span><span className={`font-mono text-[9px] ${status.tone === 'amber' ? 'text-amber' : 'text-cyan'}`}>{status.state}</span>
      </button>;
    })}</div>
    <hr className="my-2.5 w-full border-0 border-t border-line" />
    <div className={`${sectionHead} mb-[9px]`}><h2 className={sectionTitle}>Demo cases</h2><span className={sectionMeta}>Illustrative</span></div>
    <div className="grid gap-1">{presets.map(preset => <button key={preset.id} aria-pressed={activePreset === preset.id} className={`grid gap-1.5 border bg-[#0a0d13] p-[7px] text-left ${activePreset === preset.id ? 'border-[#5b4218] bg-[#17140d]' : 'border-line hover:border-[#5b4218] hover:bg-[#17140d]'}`} onClick={() => onLoadPreset(preset)}><b className="flex items-start gap-2 text-[10px] font-semibold text-amber"><span className="font-mono text-[11px]">{preset.id}</span>{preset.title}</b><span className="font-mono text-[9px] leading-[1.4] text-secondary">{preset.description}</span></button>)}</div>
    <p className="mt-3 text-[9px] leading-normal text-secondary">Cases update sample readouts only. No prediction or safety decision is generated.</p>
  </aside>;
}

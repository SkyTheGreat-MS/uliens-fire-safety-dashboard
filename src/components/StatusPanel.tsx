import { presets, sectors, statuses, type Preset, type Sector } from '../data';

type Props = {
  activeSector: Sector;
  activePreset: string;
  onSelectSector: (sector: Sector) => void;
  onLoadPreset: (preset: Preset) => void;
};

export function StatusPanel({ activeSector, activePreset, onSelectSector, onLoadPreset }: Props) {
  return <aside className="panel sidebar">
    <div className="section-head"><h2>Habitat status</h2><span>Sample · 14:32:08Z</span></div>
    <div className="status-list">{sectors.map((sector, index) => {
      const status = statuses[index];
      return <button key={sector.id} className={`status-row ${activeSector === sector.id ? 'selected' : ''}`} onClick={() => onSelectSector(sector.id)}>
        <span className="row-number">{String(index + 1).padStart(2, '0')}</span><span className="status-copy"><b>{sector.label}</b><small>CO {status.co} ppm · Smoke {status.smoke} %/m</small></span><span className={`state ${status.tone}`}>{status.state}</span>
      </button>;
    })}</div>
    <hr />
    <div className="section-head"><h2>Demo cases</h2><span>Illustrative</span></div>
    <div className="preset-list">{presets.map(preset => <button key={preset.id} className={`preset ${activePreset === preset.id ? 'selected' : ''}`} onClick={() => onLoadPreset(preset)}><b><span className="preset-number">{preset.id}</span>{preset.title}</b><span>{preset.description}</span></button>)}</div>
    <p className="disclaimer">Cases update sample readouts only. No prediction or safety decision is generated.</p>
  </aside>;
}


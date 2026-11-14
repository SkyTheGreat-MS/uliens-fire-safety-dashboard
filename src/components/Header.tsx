import type { Sector } from '../data';
import { sectors } from '../data';

type Props = { activeSector: Sector; onSelectSector: (sector: Sector) => void };

export function Header({ activeSector, onSelectSector }: Props) {
  return <>
    <header className="topbar">
      <section className="panel brand-panel"><div className="brandline"><div className="mark">ECL</div><h1>ECLSS Flight Deck</h1></div><p>Environmental control · Interface study</p></section>
      <section className="panel pipeline"><div className="between"><span className="eyebrow">Mission context</span><span className="live"><i className="dot" />DEMO</span></div><div className="mission-context"><strong>ISS / Artemis</strong><span>Environmental systems overview</span></div></section>
      <section className="panel orbit"><div className="orbit-copy"><div className="eyebrow">Hull temperature</div><div className="mono">Sunlit <strong>+118 °C</strong></div><div className="muted">Sample boundary value</div></div><HabitatRing activeSector={activeSector} onSelectSector={onSelectSector} /><div className="orbit-copy right"><div className="eyebrow">Selected sector</div><div className="mono">{sectors[activeSector].short}</div><div className="muted">Pressurized volume</div></div></section>
    </header>
    <nav className="sector-strip" aria-label="Select habitat sector">{sectors.map(item => <button key={item.id} className={`sector-button ${activeSector === item.id ? 'active' : ''}`} onClick={() => onSelectSector(item.id)}><b>{String(item.id + 1).padStart(2, '0')} / {item.label}</b><span>{item.sub}</span></button>)}</nav>
  </>;
}

function HabitatRing({ activeSector, onSelectSector }: Props) {
  const arcs = [
    'M 24 61 A 56 56 0 0 1 50 12',
    'M 57 9 A 56 56 0 0 1 106 9',
    'M 113 12 A 56 56 0 0 1 137 61',
  ];
  return <svg className="ring" viewBox="0 0 160 80" role="img" aria-label="Three sector habitat ring">
    {arcs.map((path, index) => <path key={path} d={path} className={activeSector === index ? 'active' : ''} onClick={() => onSelectSector(index as Sector)} />)}
    <circle className="vent" cx="80" cy="49" r="23" /><text x="80" y="52" textAnchor="middle">Vent loop</text>
    <text className={activeSector === 0 ? 'active-label' : ''} x="31" y="37">01</text><text className={activeSector === 1 ? 'active-label' : ''} x="77" y="12">02</text><text className={activeSector === 2 ? 'active-label' : ''} x="121" y="37">03</text>
  </svg>;
}


import { materials, sectors, type Sector } from '../data';

export function MaterialRisk({ activeSector, selectedMaterial, onSelectMaterial }: { activeSector: Sector; selectedMaterial: number | null; onSelectMaterial: (index: number) => void }) {
  const material = selectedMaterial === null ? null : materials[selectedMaterial];
  return <section className={`panel risk-panel ${material ? 'inspection-open' : ''}`}><div className="risk-title-row"><div><div className="section-head"><h2>Material risk ranking</h2></div><p className="subnote">Illustrative values · not a flammability model</p></div><div className="active-volume"><span>Active volume</span><b>{sectors[activeSector].short}</b></div></div>
    <div className="risk-table"><div className="risk-head"><span>Rank</span><span>Material / location</span><span>Visual meter</span><span>Demo value</span><span>State</span></div>
      {materials.map((item, index) => <button key={item.name} aria-pressed={selectedMaterial === index} className={`risk-row ${selectedMaterial === index ? 'selected' : ''}`} onClick={() => onSelectMaterial(index)}><span className="rank">{String(index + 1).padStart(2, '0')}</span><span className="material-copy"><b>{item.name}</b><small>{item.location} · ULOI reference {item.uloi}</small></span><span className="meter" aria-label={`Illustrative visual meter, ${item.level} of 20`} role="img">{Array.from({ length: 20 }, (_, n) => <i key={n} className={n < item.level ? (index === 0 ? 'on amber' : 'on') : ''} />)}</span><span className="probability">{item.probability}</span><span className={`badge ${index === 0 ? 'warning' : ''}`}>{item.state}</span></button>)}
    </div>
    {material && <InspectionDrawer material={material} onClose={() => { if (selectedMaterial !== null) onSelectMaterial(selectedMaterial); }} />}
  </section>;
}

function InspectionDrawer({ material, onClose }: { material: (typeof materials)[number]; onClose: () => void }) {
  const elevated = material.state === 'ELEVATED';
  return <aside className="inspection-drawer" aria-labelledby="inspection-title" aria-label="Material inspection">
    <header className="inspection-header">
      <div className="inspection-heading"><span className="inspection-kicker">SEC 04 // MATERIAL INSPECTION</span><h3 id="inspection-title">{material.name}</h3><span className="inspection-location">{material.location.toUpperCase()} · ULOI {material.uloi}</span></div>
      <button className="inspection-close" type="button" aria-label="Close material inspection" onClick={onClose}>[X]</button>
    </header>
    <section className="qualification-zone" aria-label="Illustrative qualification matrix">
      <h4>QUALIFICATION MATRIX <span>DEMO ONLY</span></h4>
      <div className="qualification-row"><span className="qualification-context">Microgravity sample case</span><b className={`qualification-badge ${elevated ? 'fail' : 'pass'}`}>{elevated ? 'FAIL' : 'PASS'}</b><small>{elevated ? 'Elevated visual state' : 'Nominal visual state'}</small></div>
      <p className="qualification-caveat">Illustrative UI state; this is not a test result or material qualification.</p>
    </section>
    <section className="inspection-copy"><h4>WHAT HAPPENED</h4><p>This local demo ranks the material at {material.probability} visual probability.</p></section>
    <section className="inspection-copy"><h4>THE CAUSE</h4><p>The displayed value is sample content and is not produced by a validated flammability model.</p></section>
    <section className="inspection-copy"><h4>HOW TO FIX</h4><p>Use reviewed, material-specific qualification data for any real assessment.</p></section>
    <footer className="inspection-footer">DEMO RECORD · NO OPERATIONAL GUIDANCE</footer>
  </aside>;
}

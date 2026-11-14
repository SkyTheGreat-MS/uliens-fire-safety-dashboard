import { useEffect, useRef, useState } from 'react';

export function SimulationViews({ airflow, onAirflowChange }: { airflow: number; onAirflowChange: (value: number) => void }) {
  const [chartArmed, setChartArmed] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = chartRef.current;
    if (!element || !chartArmed) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      onAirflowChange(Math.max(0, Math.min(45, Math.round((airflow + (event.deltaY < 0 ? 0.5 : -0.5)) / 0.5) * 0.5)));
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [airflow, chartArmed, onAirflowChange]);

  const scrub = (clientX: number, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onAirflowChange(Math.round((x * 45) / 0.5) * 0.5);
  };

  return <section className="simulation-grid">
    <article className="panel simulation-panel curve-panel">
      <div className="section-head"><h2>Airflow vs. visual risk</h2><span>Illustrative demo curve</span></div>
      <p className="subnote">Static visual only · not a prediction</p>
      <div className="viewport curve-viewport">
        <RiskCurveSvg airflow={airflow} />
        <div ref={chartRef} className={`chart-interaction ${chartArmed ? 'armed' : ''}`} role="slider" tabIndex={0} aria-label="Adjust demo airflow position on the illustrative risk curve" aria-valuemin={0} aria-valuemax={45} aria-valuenow={airflow} aria-valuetext={`${airflow.toFixed(1)} centimeters per second`}
          onClick={event => { setChartArmed(true); scrub(event.clientX, event.currentTarget); }}
          onPointerDown={event => { setChartArmed(true); event.currentTarget.setPointerCapture(event.pointerId); scrub(event.clientX, event.currentTarget); }}
          onPointerMove={event => { if (event.buttons > 0) scrub(event.clientX, event.currentTarget); }}
          onKeyDown={event => {
            if (event.key === 'Escape') setChartArmed(false);
            else if (event.key === 'Home') { event.preventDefault(); setChartArmed(true); onAirflowChange(0); }
            else if (event.key === 'End') { event.preventDefault(); setChartArmed(true); onAirflowChange(45); }
            else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); setChartArmed(true); onAirflowChange(Math.min(45, airflow + 0.5)); }
            else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); setChartArmed(true); onAirflowChange(Math.max(0, airflow - 0.5)); }
          }}
        />
        {chartArmed && <span className="chart-armed">ARMED</span>}
        <div className="overlay"><Readout label="Demo airflow" value={`${airflow.toFixed(1)} cm/s`} /><Readout label="Curve status" value="Illustrative" tone="amber" /></div>
      </div>
      <div className="chart-caption"><span>Lower airflow</span><span>Higher airflow</span></div>
    </article>
  </section>;
}

function RiskCurveSvg({ airflow }: { airflow: number }) {
  const x = 56 + (airflow / 50) * 620;
  return <svg viewBox="0 0 700 220" className="scene-svg" preserveAspectRatio="none" aria-label="Illustrative airflow and risk curve">
    <path className="chart-grid" d="M56 25H676M56 65H676M56 105H676M56 145H676M56 185H676M56 25V185M180 25V185M304 25V185M428 25V185M552 25V185M676 25V185" />
    <path className="target-zone" d="M56 25H76V185H56Z" />
    <path className="uncertainty" d="M56 100 C120 80 155 45 235 53 S350 107 432 117 S566 123 676 158 L676 178 C570 147 510 145 428 138 S324 130 235 77 S128 108 56 123Z" />
    <path className="risk-line" d="M56 112 C121 94 162 55 235 64 S340 115 428 127 S567 132 676 166" />
    <path className="solver-line" d={`M${x} 25V185`} /><circle className="operating-point" cx={x} cy="72" r="5" />
    <text x="25" y="29">100%</text><text x="39" y="188">0</text><text x="51" y="205">0</text><text x="173" y="205">10</text><text x="297" y="205">20</text><text x="421" y="205">30</text><text x="545" y="205">40</text><text x="656" y="205">50 cm/s</text><text x="80" y="38">Low-flow zone</text><text x="8" y="112" transform="rotate(-90 8 112)">Visual risk</text>
  </svg>;
}

function Readout({ label, value, tone }: { label: string; value: string; tone?: 'amber' }) {
  return <div className="readout"><span>{label}</span><b className={tone === 'amber' ? 'amber-text' : ''}>{value}</b></div>;
}

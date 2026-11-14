export type Sector = 0 | 1 | 2;

export type Readings = {
  oxygen: number;
  airflow: number;
  pressure: number;
  temperature: number;
  gravity: number;
};

export type Preset = {
  id: string;
  title: string;
  description: string;
  sector: Sector;
  readings: Readings;
};

export const sectors = [
  { id: 0 as const, short: '01 / Crew', label: 'Crew quarters', sub: 'Habitation module' },
  { id: 1 as const, short: '02 / Avionics', label: 'Avionics bay', sub: 'Power racks' },
  { id: 2 as const, short: '03 / Lab', label: 'Microgravity lab', sub: 'Payload volume' },
];

export const presets: Preset[] = [
  { id: '01', title: 'Nominal flight', description: '21.0% O₂ · 12.0 cm/s · 101.3 kPa · 22 °C', sector: 0, readings: { oxygen: 21, airflow: 12, pressure: 101.3, temperature: 22, gravity: 0 } },
  { id: '02', title: 'Low-flow avionics smolder', description: '26.5% O₂ · 4.5 cm/s · 98.0 kPa · 54 °C', sector: 1, readings: { oxygen: 26.5, airflow: 4.5, pressure: 98, temperature: 54, gravity: 0 } },
  { id: '03', title: 'Lunar EVA purge', description: '32.0% O₂ · 24.0 cm/s · 70.3 kPa · 26 °C', sector: 0, readings: { oxygen: 32, airflow: 24, pressure: 70.3, temperature: 26, gravity: 1 } },
];

export const statuses = [
  { co: '2.1', smoke: '0.02', state: 'NOMINAL', tone: 'success' },
  { co: '8.4', smoke: '0.08', state: 'DRIFT', tone: 'caution' },
  { co: '3.7', smoke: '0.03', state: 'NOMINAL', tone: 'success' },
] as const;

export const materials = [
  { name: 'Kapton HN polyimide insulation', location: 'Electrical harness', uloi: '24.5%', probability: '41.2%', level: 10, state: 'ELEVATED' },
  { name: 'PMMA viewport acrylic', location: 'Lab viewport', uloi: '21.0%', probability: '26.8%', level: 7, state: 'NOMINAL' },
  { name: 'Silicone RTV-560 sealant', location: 'Pressure seal', uloi: '25.0%', probability: '18.4%', level: 5, state: 'NOMINAL' },
  { name: 'Nomex HT90-40 acoustic liner', location: 'Cabin lining', uloi: '23.0%', probability: '8.6%', level: 2, state: 'NOMINAL' },
] as const;

export const gravityRegimes = [
  { value: '1.00g', name: 'EARTH', detail: 'Natural and forced convection' },
  { value: '0.16g', name: 'LUNAR', detail: 'Weak plume and ventilation' },
  { value: '0.00g', name: 'MICRO-G', detail: 'Forced flow and diffusion' },
] as const;


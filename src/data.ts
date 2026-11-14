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

export type Material = {
  name: string;
  location: string;
  uloi: string;
  probability: string;
  level: number;
  state: 'NOMINAL' | 'ELEVATED' | 'CRITICAL' | string;
  psi_investigation_id?: string;
  mission_source?: string;
  standard_ref?: string;
  source_doi_url?: string;
  loi_threshold_pct?: number;
  critical_flow_window_cms?: [number, number];
  historical_finding?: string;
};

export type RfHazardDriver = {
  feature: string;
  label: string;
  importance_pct: number;
};

export type RfDrivers = {
  criticalFlowWindow?: number;
  o2MarginLoi?: number;
  cabinPressure?: number;
  rawList?: RfHazardDriver[];
};

export type ReverseSolverTarget = {
  flow_velocity_cm_s: number | null;
  rpm?: number | null;
  post_throttle_risk_pct: number | null;
  status?: string;
  command?: string;
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

export const materials: Material[] = [
  {
    name: 'Kapton HN polyimide insulation',
    location: 'Electrical harness',
    uloi: '24.5%',
    probability: '41.2%',
    level: 10,
    state: 'ELEVATED',
    psi_investigation_id: 'PSI-25',
    mission_source: 'NASA-STD-6001B Benchmark',
    standard_ref: 'NASA-STD-6001B Test 4',
    source_doi_url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-25',
    loi_threshold_pct: 37.0,
    critical_flow_window_cms: [5.0, 15.0],
    historical_finding:
      'Apollo 13 / BASS-II: Polyimide insulation self-extinguishes in nominal cabin air, but undergoes explosive arc-tracking flashover under enriched O2 (>30%).',
  },
  {
    name: 'PMMA viewport acrylic',
    location: 'Lab viewport',
    uloi: '21.0%',
    probability: '26.8%',
    level: 7,
    state: 'NOMINAL',
    psi_investigation_id: 'PSI-26',
    mission_source: 'BASS-II (ISS Glovebox Flight)',
    standard_ref: 'NASA-STD-6001B Test 1',
    source_doi_url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-26',
    loi_threshold_pct: 17.0,
    critical_flow_window_cms: [1.0, 15.0],
    historical_finding:
      'BASS / Saffire-IV: Sustained continuous concurrent flame spread under forced microgravity ventilation; exhibited false-pass behavior relative to 1g tests.',
  },
  {
    name: 'Silicone RTV-560 sealant',
    location: 'Pressure seal',
    uloi: '25.0%',
    probability: '18.4%',
    level: 5,
    state: 'NOMINAL',
    psi_investigation_id: 'PSI-99',
    mission_source: 'Saffire-II (Cygnus Flight Burns)',
    standard_ref: 'NASA-STD-6001B Test 1',
    source_doi_url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-99',
    loi_threshold_pct: 30.0,
    critical_flow_window_cms: [5.0, 20.0],
    historical_finding:
      'Saffire-II: Generates porous silica ash layer that insulates fuel and sustains flameless internal smolder under quiescent or low-flow conditions.',
  },
  {
    name: 'Nomex HT90-40 acoustic liner',
    location: 'Cabin lining',
    uloi: '23.0%',
    probability: '8.6%',
    level: 2,
    state: 'NOMINAL',
    psi_investigation_id: 'PSI-25',
    mission_source: 'BASS-I (ISS Flight Telemetry)',
    standard_ref: 'NASA-STD-6001B Test 1',
    source_doi_url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-25',
    loi_threshold_pct: 28.5,
    critical_flow_window_cms: [5.0, 20.0],
    historical_finding:
      'BASS-II: Aramid fabric quenches rapidly across nominal flight airflows; flame spread observed only under extreme elevated O2 test points.',
  },
];

export const gravityRegimes = [
  { value: '1.00g', name: 'EARTH', detail: 'Natural and forced convection' },
  { value: '0.16g', name: 'LUNAR', detail: 'Weak plume and ventilation' },
  { value: '0.00g', name: 'MICRO-G', detail: 'Forced flow and diffusion' },
] as const;

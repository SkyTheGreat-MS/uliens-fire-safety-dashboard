export type Sector = 0 | 1 | 2;

export type Readings = {
  oxygen: number;
  airflow: number;
  pressure: number;
  temperature: number;
  gravity: number;
  spread?: number;
};

export type Preset = {
  id: string;
  title: string;
  description: string;
  sector: Sector;
  readings: Readings;
};

export interface Material {
  material_name: string;
  name: string;
  displayName: string;
  location: string;
  sector: Sector;
  uloi: string;
  probability: string;
  level: number;
  state: 'NOMINAL' | 'ELEVATED' | 'CRITICAL' | string;
  psi_investigation_id: string;
  mission_source: string;
  standard_ref: string;
  source_doi_url: string;
  loi_threshold_pct: number;
  critical_flow_window_cms: [number, number];
  historical_finding: string;
  total_nasa_test_records?: number;
}

export interface SpreadRateMeter {
  flame_spread_mm_s: number;
  uncertainty_2sigma_mm_s: number;
  spread_lower_mm_s: number;
  spread_upper_mm_s: number;
  out_of_material_training_range?: boolean;
}

export interface SectorTriageItem {
  material_name: string;
  hazard_regime: 'NOMINAL' | 'ELEVATED' | 'CRITICAL' | string;
  badge_color: 'green' | 'amber' | 'red' | string;
  probability_sustained: number;
  flame_spread_mm_s: number;
  psi_investigation_id?: string;
  mission_source?: string;
  out_of_material_training_range?: boolean;
}

export interface MaterialRiskItem {
  material_name: string;
  displayName?: string;
  location?: string;
  probability_sustained: number;
  probability_extinguished: number;
  risk_status: 'HIGH' | 'ELEVATED' | 'LOW' | string;
  predicted_outcome?: 'SUSTAINED' | 'EXTINGUISHED' | string;
  flame_spread_mm_s: number;
  uncertainty_2sigma_mm_s: number;
  spread_lower_mm_s: number;
  spread_upper_mm_s: number;
  hazard_regime: 'NOMINAL' | 'ELEVATED' | 'CRITICAL' | string;
  badge_color: 'green' | 'amber' | 'red' | string;
  loi_threshold_pct: number;
  critical_flow_window_cms: [number, number];
  psi_investigation_id?: string;
  mission_source?: string;
  standard_ref?: string;
  source_doi_url?: string;
  historical_finding?: string;
  out_of_material_training_range?: boolean;
}

export interface AirflowSweepPoint {
  flow_velocity_cm_s: number;
  flame_spread_mm_s: number;
  uncertainty_2sigma_mm_s: number;
  spread_lower_mm_s: number;
  spread_upper_mm_s: number;
  probability_sustained: number;
  probability_extinguished: number;
  risk_status: string;
}

export interface QuenchTarget {
  material?: string;
  recommended_flow_velocity_cm_s: number | null;
  probability_sustained_at_target?: number;
  flame_spread_at_target_mm_s?: number;
  status?: string;
  iterations_evaluated?: number;
}

export interface AirflowSimulationData {
  material: string;
  critical_flow_window_cms: [number, number];
  quench_target?: QuenchTarget | null;
  sweep_points: AirflowSweepPoint[];
}

export interface RfHazardDriver {
  feature: string;
  label: string;
  importance_pct: number;
}

export interface RfDrivers {
  criticalFlowWindow?: number;
  o2MarginLoi?: number;
  cabinPressure?: number;
  rawList?: RfHazardDriver[];
}

export interface ReverseSolverTarget {
  flow_velocity_cm_s: number | null;
  rpm?: number | null;
  post_throttle_risk_pct: number | null;
  status?: string;
  command?: string;
}

export interface EvidenceAndActuation {
  active_regime: string;
  badge_color: string;
  regime_probabilities?: Record<string, number>;
  hazard_drivers: RfHazardDriver[];
  reverse_solver_recommendation?: QuenchTarget | null;
  airflow_delta_cm_s?: number | null;
  fan_actuation_command?: string;
  nasa_provenance?: {
    material_name?: string;
    psi_investigation_id?: string;
    mission_source?: string;
    standard_ref?: string;
    source_doi_url?: string;
    loi_threshold_pct?: number;
    critical_flow_window_cms?: [number, number];
    historical_finding?: string;
    total_nasa_test_records?: number;
  };
}

export interface AvionicsEvaluationResponse {
  inputs: {
    material: string;
    oxygen_pct: number;
    pressure_kpa: number;
    flow_velocity_cm_s: number;
    cutoff_probability: number;
    spread_threshold_mm_s: number;
  };
  spread_rate_meter: SpreadRateMeter;
  sector_triage: SectorTriageItem[];
  material_risk_ranking: MaterialRiskItem[];
  airflow_simulation: AirflowSimulationData;
  evidence_and_actuation: EvidenceAndActuation;
}

export const sectors = [
  { id: 0 as const, short: '01 / Crew', label: 'Crew quarters', sub: 'Habitation module' },
  { id: 1 as const, short: '02 / Avionics', label: 'Avionics bay', sub: 'Power racks' },
  { id: 2 as const, short: '03 / Lab', label: 'Microgravity lab', sub: 'Payload volume' },
];

export const presets: Preset[] = [
  {
    id: '01',
    title: 'Nominal flight',
    description: '21.0% O₂ · 12.0 cm/s · 101.3 kPa · Micro-G',
    sector: 0,
    readings: { oxygen: 21, airflow: 12, pressure: 101.3, temperature: 22, gravity: 0 },
  },
  {
    id: '02',
    title: 'Low-flow avionics smolder',
    description: '26.5% O₂ · 4.5 cm/s · 98.0 kPa · Micro-G',
    sector: 1,
    readings: { oxygen: 26.5, airflow: 4.5, pressure: 98, temperature: 54, gravity: 0 },
  },
  {
    id: '03',
    title: 'Ground qualification baseline',
    description: '32.0% O₂ · 24.0 cm/s · 70.3 kPa · 1.00g Earth',
    sector: 0,
    readings: { oxygen: 32, airflow: 24, pressure: 70.3, temperature: 26, gravity: 1 },
  },
];

export const statuses = [
  { co: '2.1', smoke: '0.02', state: 'NOMINAL', tone: 'success' },
  { co: '8.4', smoke: '0.08', state: 'DRIFT', tone: 'caution' },
  { co: '3.7', smoke: '0.03', state: 'NOMINAL', tone: 'success' },
] as const;

/**
 * All 8 NASA-tested materials matching the ML model artifacts (origin/model).
 * Grounded 100% in NASA PSI combustion flight data (BASS-I, BASS-II, Saffire-II).
 */
export const materials: Material[] = [
  {
    material_name: 'Pmma Cast Acrylic',
    name: 'PMMA Cast Acrylic',
    displayName: 'PMMA Cast Acrylic',
    location: 'Microgravity lab · Viewport',
    sector: 2,
    uloi: '17.0%',
    probability: '78.3%',
    level: 16,
    state: 'CRITICAL',
    psi_investigation_id: 'PSI-26',
    mission_source: 'BASS-II (ISS Glovebox Flight)',
    standard_ref: 'NASA-STD-6001B Test 1',
    source_doi_url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-26',
    loi_threshold_pct: 17.0,
    critical_flow_window_cms: [1.0, 15.0],
    historical_finding:
      'BASS / Saffire-IV: Sustained continuous concurrent flame spread under forced microgravity ventilation; exhibited false-pass behavior relative to 1g tests.',
    total_nasa_test_records: 178,
  },
  {
    material_name: 'Sibal Fabric Blend',
    name: 'Sibal Fabric Blend',
    displayName: 'Sibal Fabric Blend',
    location: 'Crew quarters · Cabin lining',
    sector: 0,
    uloi: '18.5%',
    probability: '92.5%',
    level: 18,
    state: 'CRITICAL',
    psi_investigation_id: 'PSI-98',
    mission_source: 'BASS-II (ISS Glovebox Flight)',
    standard_ref: 'NASA BASS Baseline Standard',
    source_doi_url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-98',
    loi_threshold_pct: 18.5,
    critical_flow_window_cms: [3.0, 15.0],
    historical_finding:
      'Saffire-I / BASS: 75% cotton / 25% fiberglass calibration fabric; serves as empirical benchmark for low-speed concurrent boundary layer burning.',
    total_nasa_test_records: 41,
  },
  {
    material_name: 'Paraffin Wax',
    name: 'Paraffin Wax PCM',
    displayName: 'Paraffin Wax PCM',
    location: 'Microgravity lab · Thermal loop',
    sector: 2,
    uloi: '16.0%',
    probability: '17.7%',
    level: 4,
    state: 'ELEVATED',
    psi_investigation_id: 'PSI-GEN',
    mission_source: 'BASS-I (ISS Flight Telemetry)',
    standard_ref: 'NASA-STD-6001B',
    source_doi_url: 'https://psi.nasa.gov/physci/repo/search?q=combustion',
    loi_threshold_pct: 16.0,
    critical_flow_window_cms: [1.0, 10.0],
    historical_finding:
      'NASA BASS-I: Low-melting hydrocarbon matrix displays accelerated surface melt-regime flame propagation under microgravity quiescent airflow.',
    total_nasa_test_records: 24,
  },
  {
    material_name: 'Silicone Rtv-560',
    name: 'Silicone RTV-560',
    displayName: 'Silicone RTV-560 Sealant',
    location: 'Avionics bay · Pressure seal',
    sector: 1,
    uloi: '30.0%',
    probability: '0.3%',
    level: 1,
    state: 'NOMINAL',
    psi_investigation_id: 'PSI-99',
    mission_source: 'Saffire-II (Cygnus Flight Burns)',
    standard_ref: 'NASA-STD-6001B Test 1',
    source_doi_url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-99',
    loi_threshold_pct: 30.0,
    critical_flow_window_cms: [5.0, 20.0],
    historical_finding:
      'Saffire-II: Generates porous silica ash layer that insulates fuel and sustains flameless internal smolder under quiescent or low-flow conditions.',
    total_nasa_test_records: 4,
  },
  {
    material_name: 'Kapton Hn',
    name: 'Kapton HN Polyimide',
    displayName: 'Kapton HN Polyimide',
    location: 'Avionics bay · Wire harness',
    sector: 1,
    uloi: '37.0%',
    probability: '0.3%',
    level: 1,
    state: 'NOMINAL',
    psi_investigation_id: 'PSI-25',
    mission_source: 'NASA-STD-6001B Benchmark',
    standard_ref: 'NASA-STD-6001B Test 4',
    source_doi_url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-25',
    loi_threshold_pct: 37.0,
    critical_flow_window_cms: [5.0, 15.0],
    historical_finding:
      'Apollo 13 / BASS-II: Polyimide insulation self-extinguishes in nominal cabin air, but undergoes explosive arc-tracking flashover under enriched O2 (>30%).',
    total_nasa_test_records: 2,
  },
  {
    material_name: 'Nomex Ht90-40',
    name: 'Nomex HT90-40 Aramid',
    displayName: 'Nomex HT90-40 Aramid',
    location: 'Crew quarters · Acoustic liner',
    sector: 0,
    uloi: '28.5%',
    probability: '0.1%',
    level: 1,
    state: 'NOMINAL',
    psi_investigation_id: 'PSI-25',
    mission_source: 'BASS-I (ISS Flight Telemetry)',
    standard_ref: 'NASA-STD-6001B Test 1',
    source_doi_url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-25',
    loi_threshold_pct: 28.5,
    critical_flow_window_cms: [5.0, 20.0],
    historical_finding:
      'BASS-II: Aramid fabric quenches rapidly across nominal flight airflows; flame spread observed only under extreme elevated O2 test points.',
    total_nasa_test_records: 10,
  },
  {
    material_name: 'Ultem Polyetherimide',
    name: 'Ultem Polyetherimide',
    displayName: 'Ultem 1000 PEI Resin',
    location: 'Avionics bay · Structural bracket',
    sector: 1,
    uloi: '47.0%',
    probability: '0.4%',
    level: 1,
    state: 'NOMINAL',
    psi_investigation_id: 'PSI-GEN',
    mission_source: 'BASS-I (ISS Flight Telemetry)',
    standard_ref: 'NASA-STD-6001B',
    source_doi_url: 'https://psi.nasa.gov/physci/repo/search?q=combustion',
    loi_threshold_pct: 47.0,
    critical_flow_window_cms: [5.0, 20.0],
    historical_finding:
      'BASS-I / NASA-STD-6001B: High-temperature thermoplastic PEI displays exceptional thermal resistance, self-extinguishing rapidly in sub-47% O2.',
    total_nasa_test_records: 2,
  },
  {
    material_name: 'Ptfe Teflon',
    name: 'PTFE Teflon',
    displayName: 'PTFE Teflon Wiring',
    location: 'Avionics bay · Power feeder',
    sector: 1,
    uloi: '95.0%',
    probability: '0.1%',
    level: 1,
    state: 'NOMINAL',
    psi_investigation_id: 'PSI-26',
    mission_source: 'NASA-STD-6001B Benchmark',
    standard_ref: 'NASA-STD-6001B Test 1',
    source_doi_url: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-26',
    loi_threshold_pct: 95.0,
    critical_flow_window_cms: [5.0, 15.0],
    historical_finding:
      'NASA-STD-6001B: Extremely low flammability envelope; poses zero flame propagation at operational cabin levels, but releases toxic fluorochemical pyrolyzates above 300°C.',
    total_nasa_test_records: 1,
  },
];

export const gravityRegimes = [
  { value: '0.00g', name: 'MICROGRAVITY', detail: 'NASA PSI-26 Tri-Model ML active' },
  { value: '1.00g', name: 'EARTH BASELINE', detail: 'NASA-STD-6001B Ground qualification' },
] as const;

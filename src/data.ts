import type { Provenance, SolverResult } from './services/avionicsService';

export type Sector = 0 | 1 | 2;
export type DialKey = 'oxygen' | 'airflow' | 'pressure';
export type Readings = Record<DialKey, number> & { gravity: 0 | 1 };

export type Preset = {
  id: string;
  title: string;
  description: string;
  sector: Sector;
  readings: Readings;
};

export const controlLimits = {
  oxygen: { min: 12, max: 36, step: 0.1 },
  airflow: { min: 0, max: 50, step: 0.5 },
  pressure: { min: 50, max: 115, step: 0.5 },
} as const;

export const sectors = [
  { id: 0, short: '01 / Crew', label: 'Crew quarters' },
  { id: 1, short: '02 / Avionics', label: 'Avionics bay' },
  { id: 2, short: '03 / Lab', label: 'Microgravity lab' },
] as const;

export const presets: Preset[] = [
  {
    id: '01',
    title: 'Nominal flight',
    description: '21.0% O₂ · 12.0 cm/s · 101.3 kPa · Micro-G',
    sector: 0,
    readings: { oxygen: 21, airflow: 12, pressure: 101.3, gravity: 0 },
  },
  {
    id: '02',
    title: 'Low-flow avionics smolder',
    description: '26.5% O₂ · 4.5 cm/s · 98.0 kPa · Micro-G',
    sector: 1,
    readings: { oxygen: 26.5, airflow: 4.5, pressure: 98, gravity: 0 },
  },
  {
    id: '03',
    title: 'Earth reference baseline',
    description: '32.0% O₂ · 24.0 cm/s · 70.3 kPa · 1.00g Earth',
    sector: 0,
    readings: { oxygen: 32, airflow: 24, pressure: 70.3, gravity: 1 },
  },
];

export type Material = Provenance & {
  displayName: string;
  location?: string;
  sector?: Sector;
};

const materialPlacement: Record<string, Pick<Material, 'displayName' | 'location' | 'sector'>> = {
  'Pmma Cast Acrylic': { displayName: 'PMMA Cast Acrylic', location: 'Microgravity lab · Viewport', sector: 2 },
  'Sibal Fabric Blend': { displayName: 'Sibal Fabric Blend', location: 'Crew quarters · Cabin lining', sector: 0 },
  'Paraffin Wax': { displayName: 'Paraffin Wax PCM', location: 'Microgravity lab · Thermal loop', sector: 2 },
  'Silicone Rtv-560': { displayName: 'Silicone RTV-560 Sealant', location: 'Avionics bay · Pressure seal', sector: 1 },
  'Kapton Hn': { displayName: 'Kapton HN Polyimide', location: 'Avionics bay · Wire harness', sector: 1 },
  'Nomex Ht90-40': { displayName: 'Nomex HT90-40 Aramid', location: 'Crew quarters · Acoustic liner', sector: 0 },
  'Ultem Polyetherimide': { displayName: 'Ultem 1000 PEI Resin', location: 'Avionics bay · Structural bracket', sector: 1 },
  'Ptfe Teflon': { displayName: 'PTFE Teflon Wiring', location: 'Avionics bay · Power feeder', sector: 1 },
};

export function toMaterial(provenance: Provenance): Material {
  const placement = Object.hasOwn(materialPlacement, provenance.material_name)
    ? materialPlacement[provenance.material_name]
    : undefined;
  return { displayName: provenance.material_name, ...placement, ...provenance };
}

export function earthReference(oxygen: number, loi: number | null | undefined) {
  if (loi == null) return 'LOI unavailable';
  return oxygen <= loi ? 'At or below LOI' : 'Above LOI';
}

export function getPreviewPoint(solver: SolverResult | undefined) {
  if (
    solver?.status !== 'dual_constraint_quench_found' ||
    !solver.satisfies_dual_constraints ||
    solver.out_of_material_training_range ||
    solver.recommended_flow_velocity_cm_s == null ||
    solver.flame_spread_mm_s == null ||
    solver.recommended_flow_velocity_cm_s < controlLimits.airflow.min ||
    solver.recommended_flow_velocity_cm_s > controlLimits.airflow.max
  ) return null;
  return { flow: solver.recommended_flow_velocity_cm_s, spread: solver.flame_spread_mm_s };
}

export const gravityRegimes = [
  { value: '0.00g', name: 'MICROGRAVITY', detail: 'NASA PSI tri-model simulation' },
  { value: '1.00g', name: 'EARTH BASELINE', detail: 'Limiting oxygen index reference' },
] as const;

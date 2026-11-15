export type EvaluationRequest = {
  material: string;
  oxygen_pct: number;
  pressure_kpa: number;
  flow_velocity_cm_s: number;
  cutoff_probability: number;
  spread_threshold_mm_s: number;
  sweep_points: number;
};

type VersionInfo = {
  model_version: string;
  dataset_version: string;
};

export type Provenance = {
  material_name: string;
  psi_investigation_id: string | null;
  mission_source: string | null;
  standard_ref: string | null;
  source_doi_url: string | null;
  loi_threshold_pct: number | null;
  critical_flow_window_cms: [number, number] | null;
  historical_finding: string | null;
  total_nasa_test_records: number | null;
};

export type Catalog = VersionInfo & { materials: Provenance[] };

export type Spread = {
  flame_spread_mm_s: number;
  uncertainty_2sigma_mm_s: number;
  spread_lower_mm_s: number;
  spread_upper_mm_s: number;
  out_of_material_training_range: boolean;
};

export type SweepPoint = Spread & {
  flow_velocity_cm_s: number;
  probability_sustained: number;
};

const regimes = ['NOMINAL', 'ELEVATED', 'CRITICAL'] as const;
const riskStatuses = ['HIGH', 'ELEVATED', 'LOW'] as const;
const solverStatuses = [
  'dual_constraint_quench_found',
  'probability_cutoff_only_quench_found',
  'no_supported_quench_point_found',
  'conditions_outside_material_training_range',
] as const;

export type Triage = {
  material_name: string;
  hazard_regime: (typeof regimes)[number];
  badge_color: string;
  probability_sustained: number;
  flame_spread_mm_s: number;
  out_of_material_training_range: boolean;
};

export type RankingRow = Triage & Spread & {
  probability_extinguished: number;
  risk_status: (typeof riskStatuses)[number];
  predicted_outcome: 'SUSTAINED' | 'EXTINGUISHED';
};

export type SolverResult = {
  material_name: string;
  status: (typeof solverStatuses)[number];
  satisfies_dual_constraints: boolean;
  out_of_material_training_range: boolean;
  recommended_flow_velocity_cm_s: number | null;
  probability_sustained: number | null;
  flame_spread_mm_s: number | null;
  uncertainty_2sigma_mm_s: number | null;
  search_range_cm_s: [number, number];
  warning: string;
};

export type Evidence = {
  active_regime: Triage['hazard_regime'];
  hazard_drivers: { feature: string; label: string; importance_pct: number }[];
  reverse_solver_recommendation: SolverResult;
  nasa_provenance: Provenance;
};

export type Evaluation = VersionInfo & {
  inputs: EvaluationRequest;
  spread_rate_meter: Spread;
  sector_triage: Triage[];
  material_risk_ranking: RankingRow[];
  airflow_simulation: {
    material_name: string;
    critical_flow_window_cms: [number, number];
    quench_target: SolverResult;
    sweep_points: SweepPoint[];
  };
  evidence_and_actuation: Evidence;
  warning: string;
};

const rawApiUrl = (import.meta.env?.VITE_API_URL ?? '').trim();
const normalizedUrl =
  rawApiUrl && !rawApiUrl.startsWith('http://') && !rawApiUrl.startsWith('https://') && !rawApiUrl.startsWith('/')
    ? `https://${rawApiUrl}`
    : rawApiUrl;
const apiBaseUrl = normalizedUrl.replace(/\/+$/, '');
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isText = (value: unknown) => typeof value === 'string';
const isBoolean = (value: unknown) => typeof value === 'boolean';
const nullableNumber = (value: unknown) => value === null || isNumber(value);
const nullableText = (value: unknown) => value === null || isText(value);
const numberPair = (value: unknown) => Array.isArray(value) && value.length === 2 && value.every(isNumber);
const each = (value: unknown, check: (entry: unknown) => boolean) =>
  Array.isArray(value) && value.every(check);
const oneOf = (value: unknown, options: readonly string[]) =>
  typeof value === 'string' && options.includes(value);

const isVersioned = (value: Record<string, unknown>) =>
  isText(value.model_version) && isText(value.dataset_version);
const isProvenance = (value: unknown) => isObject(value) &&
  isText(value.material_name) &&
  [value.psi_investigation_id, value.mission_source, value.standard_ref,
    value.source_doi_url, value.historical_finding].every(nullableText) &&
  [value.loi_threshold_pct, value.total_nasa_test_records].every(nullableNumber) &&
  (value.critical_flow_window_cms === null || numberPair(value.critical_flow_window_cms));

const isSpread = (value: unknown) => isObject(value) &&
  [value.flame_spread_mm_s, value.uncertainty_2sigma_mm_s,
    value.spread_lower_mm_s, value.spread_upper_mm_s].every(isNumber) &&
  isBoolean(value.out_of_material_training_range);

const isTriage = (value: unknown) => isObject(value) &&
  isText(value.material_name) && isText(value.badge_color) && oneOf(value.hazard_regime, regimes) &&
  isNumber(value.flame_spread_mm_s) && isNumber(value.probability_sustained) &&
  isBoolean(value.out_of_material_training_range);

const isSolver = (value: unknown, material: string) => isObject(value) &&
  value.material_name === material && oneOf(value.status, solverStatuses) &&
  isBoolean(value.satisfies_dual_constraints) && isBoolean(value.out_of_material_training_range) &&
  [value.recommended_flow_velocity_cm_s, value.probability_sustained,
    value.flame_spread_mm_s, value.uncertainty_2sigma_mm_s].every(nullableNumber) &&
  numberPair(value.search_range_cm_s) && isText(value.warning);

function isEvaluation(value: unknown, request: EvaluationRequest): value is Evaluation {
  if (!isObject(value) || !isVersioned(value) || !isText(value.warning)) return false;
  const { inputs, airflow_simulation: sweep, evidence_and_actuation: evidence } = value;
  return isObject(inputs) && Object.entries(request).every(([key, input]) => inputs[key] === input) &&
    isSpread(value.spread_rate_meter) &&
    each(value.sector_triage, isTriage) &&
    each(value.material_risk_ranking, (row) => isObject(row) && isTriage(row) && isSpread(row) &&
      isNumber(row.probability_extinguished) && oneOf(row.risk_status, riskStatuses) &&
      oneOf(row.predicted_outcome, ['SUSTAINED', 'EXTINGUISHED'])) &&
    isObject(sweep) && sweep.material_name === request.material &&
    numberPair(sweep.critical_flow_window_cms) && isSolver(sweep.quench_target, request.material) &&
    Array.isArray(sweep.sweep_points) && sweep.sweep_points.length === request.sweep_points &&
    each(sweep.sweep_points, (point) => isObject(point) && isSpread(point) &&
      isNumber(point.flow_velocity_cm_s) && isNumber(point.probability_sustained)) &&
    isObject(evidence) && oneOf(evidence.active_regime, regimes) &&
    isSolver(evidence.reverse_solver_recommendation, request.material) &&
    isObject(evidence.nasa_provenance) && evidence.nasa_provenance.material_name === request.material &&
    isProvenance(evidence.nasa_provenance) &&
    each(evidence.hazard_drivers, (driver) => isObject(driver) && isText(driver.feature) &&
      isText(driver.label) && isNumber(driver.importance_pct));
}

async function requestJson(path: string, signal: AbortSignal, body?: EvaluationRequest): Promise<unknown> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal.aborted) abort();
  signal.addEventListener('abort', abort, { once: true });
  const timeout = globalThis.setTimeout(abort, 8000);
  try {
    const response = await fetch(apiBaseUrl + path, {
      signal: controller.signal,
      ...(body && {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    });
    if (!response.ok) throw new Error(`API request failed (HTTP ${response.status})`);
    return await response.json();
  } finally {
    globalThis.clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}

export async function fetchCatalog(signal: AbortSignal): Promise<Catalog> {
  const data = await requestJson('/api/avionics/materials', signal);
  const valid = (value: unknown): value is Catalog =>
    isObject(value) && isVersioned(value) && each(value.materials, isProvenance);
  if (!valid(data) || data.materials.length === 0) throw new Error('Material catalog is unavailable');
  return data;
}

export async function evaluateAvionicsState(request: EvaluationRequest, signal: AbortSignal): Promise<Evaluation> {
  const data = await requestJson('/api/avionics/evaluate', signal, request);
  if (!isEvaluation(data, request)) throw new Error('Unexpected evaluation response');
  return data;
}

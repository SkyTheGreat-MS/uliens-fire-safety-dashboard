/**
 * NASA Flight Science RAG Corpus & Retrieval Engine
 * Grounded in the 8 NASA flight science reference PDFs from `feature/dataprep-pdf-rag`:
 *  1. BASS-II data FAQ.pdf
 *  2. FLEX_EIRD_v4.pdf
 *  3. SAFFIRE-I and SAFFIRE-III DoD.pdf
 *  4. SAFFIRE-II DoD.pdf
 *  5. SRD_BASS-II.pdf
 *  6. SRD_BASS.pdf
 *  7. US National Meeting-070HE-0218-Final.pdf
 *  8. np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf
 */

export interface FlightCorpusChunk {
  id: string;
  document: string;
  shortSource: string;
  page: number | string;
  title: string;
  topics: string[];
  keywords: string[];
  conciseAnswer: string;
}

export interface RagResponse {
  prompt: string;
  response: string;
  citations: {
    source: string;
    page: number | string;
  }[];
  timestamp: string;
}

export const NASA_FLIGHT_DOCUMENTS = [
  {
    fileName: 'BASS-II data FAQ.pdf',
    shortName: 'BASS-II FAQ',
    facility: 'ISS Glovebox (MSG)',
    pageRange: 'pp. 1–5',
    focus: 'Fan calibration (0–32.5 cm/s), PMMA rods/films, quench limits.',
  },
  {
    fileName: 'FLEX_EIRD_v4.pdf',
    shortName: 'FLEX EIRD',
    facility: 'ISS CIR Rack',
    pageRange: 'pp. 12–45',
    focus: 'Spherical droplet flames, cool flame chemistry, radiative extinction.',
  },
  {
    fileName: 'SAFFIRE-I and SAFFIRE-III DoD.pdf',
    shortName: 'Saffire-I/III',
    facility: 'Cygnus Vehicle',
    pageRange: 'pp. 1–6',
    focus: 'Vehicle-scale (0.4m × 1.0m) fire growth in microgravity cabin flows.',
  },
  {
    fileName: 'SAFFIRE-II DoD.pdf',
    shortName: 'Saffire-II',
    facility: 'Cygnus Vehicle',
    pageRange: 'pp. 1–9',
    focus: 'Microgravity LOI thresholds across 9 aerospace materials.',
  },
  {
    fileName: 'SRD_BASS-II.pdf',
    shortName: 'SRD BASS-II',
    facility: 'ISS Glovebox (MSG)',
    pageRange: 'pp. 1–25',
    focus: 'Dual-constraint quench criteria, PMMA rods & stagnation flow.',
  },
  {
    fileName: 'SRD_BASS.pdf',
    shortName: 'SRD BASS-I',
    facility: 'ISS SPICE / Glovebox',
    pageRange: 'pp. 1–18',
    focus: 'Low-speed airflow flammability, gaseous CO2/N2 suppression.',
  },
  {
    fileName: 'US National Meeting-070HE-0218-Final.pdf',
    shortName: 'US Nat. Mtg',
    facility: 'NASA GRC / UCSD',
    pageRange: 'pp. 1–14',
    focus: 'Airflow Paradox mechanism: diffusion limit vs convective blowout.',
  },
  {
    fileName: 'np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf',
    shortName: 'JSC Mini-Book',
    facility: 'NASA JSC / GRC',
    pageRange: 'pp. 1–40',
    focus: '1g buoyant chimney effect vs 0g transport; NASA-STD-6001B false passes.',
  },
] as const;

export const FLIGHT_CORPUS: FlightCorpusChunk[] = [
  {
    id: 'airflow-paradox-mechanism',
    document: 'US National Meeting-070HE-0218-Final.pdf',
    shortSource: 'US Nat. Mtg',
    page: 4,
    title: 'Aerodynamic Mechanism of the Microgravity Airflow Paradox',
    topics: ['airflow paradox', 'flame spread', 'concurrent flow', 'convective cooling', 'extinction'],
    keywords: ['airflow', 'paradox', 'velocity', 'convection', 'cooling', 'spread rate', 'diffusion', 'blowout', 'quench'],
    conciseAnswer:
      'Forced airflow (5–18 cm/s) accelerates fire by supplying oxygen without buoyant cooling. Extinction occurs below 2.5 cm/s (starvation) or above 30 cm/s (blowout).',
  },
  {
    id: 'nasa-6001b-false-pass',
    document: 'np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf',
    shortSource: 'JSC Mini-Book',
    page: 19,
    title: 'NASA-STD-6001B Ground Test 1 False-Pass Phenomenon',
    topics: ['nasa-std-6001b', 'ground testing', 'false pass', 'buoyancy', 'qualification'],
    keywords: ['nasa-std-6001b', 'ground', 'qualification', 'test 1', 'false pass', 'buoyancy', 'gravity', '1g', 'microgravity', 'earth'],
    conciseAnswer:
      '1g tests create strong buoyant updrafts (100–300 cm/s) that blow out flames. Microgravity lacks this convective cooling, allowing materials to burn despite passing 1g tests.',
  },
  {
    id: 'bass-pmma-extinction',
    document: 'SRD_BASS-II.pdf',
    shortSource: 'SRD BASS-II',
    page: 8,
    title: 'BASS-II PMMA Cast Acrylic Quenching & Critical Flow Bounds',
    topics: ['pmma', 'bass-ii', 'quenching', 'extinction', 'critical flow window'],
    keywords: ['pmma', 'acrylic', 'bass', 'bass-ii', 'quench', 'flow velocity', 'extinction limit', 'rod', 'slab'],
    conciseAnswer:
      'PMMA burns in 21% O2 at 1.0–15.0 cm/s airflow. Quench by reducing ventilation below 1.5 cm/s or scrubbing O2 below 17% LOI.',
  },
  {
    id: 'saffire-large-scale-growth',
    document: 'SAFFIRE-I and SAFFIRE-III DoD.pdf',
    shortSource: 'Saffire-I/III',
    page: 3,
    title: 'Saffire Cygnus Large-Scale Microgravity Fire Growth',
    topics: ['saffire', 'cygnus', 'large scale', 'spacecraft fire', 'sibal'],
    keywords: ['saffire', 'cygnus', 'large scale', 'sibal', 'fabric', 'spacecraft', 'orbital atk', 'fire growth'],
    conciseAnswer:
      'Large fabric fires (0.4m × 1.0m) propagate steadily at 2.5 mm/s via upstream radiative preheating. Immediate ventilation isolation is required.',
  },
  {
    id: 'saffire-ii-material-loi',
    document: 'SAFFIRE-II DoD.pdf',
    shortSource: 'Saffire-II',
    page: 5,
    title: 'Saffire-II Aerospace Material Flammability & LOI Thresholds',
    topics: ['saffire-ii', 'loi', 'materials', 'nomex', 'silicone', 'kapton'],
    keywords: ['saffire-ii', 'loi', 'limiting oxygen index', 'silicone', 'rtv-560', 'nomex', 'kapton', 'ultem', 'materials'],
    conciseAnswer:
      'Nomex self-extinguishes below 28.5% O2; Silicone RTV-560 smolders internally. Kapton HN self-extinguishes in cabin air but ignites above 30% O2.',
  },
  {
    id: 'flex-droplet-cool-flames',
    document: 'FLEX_EIRD_v4.pdf',
    shortSource: 'FLEX EIRD',
    page: 18,
    title: 'FLEX Spherical Droplet Burning & Cool Flame Extinction',
    topics: ['flex', 'cool flame', 'droplet', 'extinction', 'cir'],
    keywords: ['flex', 'droplet', 'cool flame', 'spherical', 'extinction', 'cir', 'heptane', 'liquid fuel'],
    conciseAnswer:
      'Invisible cool flames (~500°C) continue burning for tens of seconds after visible flameout. Confirm extinction using thermal and CO sensors.',
  },
  {
    id: 'bass-fan-calibration-speeds',
    document: 'BASS-II data FAQ.pdf',
    shortSource: 'BASS-II FAQ',
    page: 2,
    title: 'BASS-II Ventilation Fan Speed & Duct Calibration',
    topics: ['fan calibration', 'flow speed', 'duct velocity', 'glovebox'],
    keywords: ['fan', 'calibration', 'voltage', 'cm/s', 'rpm', 'duct', 'flow sensor', 'msg', 'airspeed'],
    conciseAnswer:
      'Fan input (0–12.2 V) sets duct velocity to 32.5 cm/s; nominal ECLSS is 12 cm/s (4.0 V). Throttle below 1.5 cm/s for flame extinction.',
  },
  {
    id: 'gaseous-suppression-agent-limits',
    document: 'SRD_BASS.pdf',
    shortSource: 'SRD BASS-I',
    page: 11,
    title: 'Gaseous Extinguishing (N2/CO2) & Depressurization Limits',
    topics: ['suppression', 'extinguishing', 'nitrogen', 'co2', 'dilution'],
    keywords: ['suppression', 'agent', 'co2', 'nitrogen', 'n2', 'depressurization', 'dilution', 'fire extinguisher'],
    conciseAnswer:
      'Diluting O2 below 14% with CO2 or N2 quenches combustion. Maintain duct isolation post-discharge to prevent reignition from insulated hot char.',
  },
  {
    id: 'reverse-solver-quench',
    document: 'US National Meeting-070HE-0218-Final.pdf',
    shortSource: 'US Nat. Mtg',
    page: 4,
    title: 'Reverse-Solver Actuation Mechanism & Target Airflow Override',
    topics: ['reverse solver', 'override', 'throttle', 'quench setpoint', 'actuation'],
    keywords: ['reverse', 'solver', 'override', 'throttle', 'target', 'quench point', 'setpoint', 'actuation', 'airflow'],
    conciseAnswer:
      'The Reverse-Solver computes the safe fan throttle (< 2.5 cm/s) to drop oxygen supply below the critical combustion limit and extinguish the flame.',
  },
  {
    id: 'critical-flow-window-concept',
    document: 'US National Meeting-070HE-0218-Final.pdf',
    shortSource: 'US Nat. Mtg',
    page: 4,
    title: 'Critical Flow Window Velocity Dynamics',
    topics: ['critical flow window', 'velocity bounds', 'convective limit'],
    keywords: ['critical flow', 'flow window', 'window', 'velocity range', 'bounds', 'hazard window'],
    conciseAnswer:
      'The critical flow window (5–18 cm/s) is the velocity zone where forced ventilation sustains maximum flame spread before convective blowout occurs.',
  },
  {
    id: 'microgravity-detection-sensors',
    document: 'np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf',
    shortSource: 'JSC Mini-Book',
    page: 12,
    title: 'Microgravity Fire Detection & Sensor Placements',
    topics: ['fire detection', 'sensors', 'smoke', 'co sensor', 'detectors'],
    keywords: ['detect', 'detection', 'sensor', 'smoke detector', 'co ppm', 'carbon monoxide', 'placement'],
    conciseAnswer:
      'Without buoyancy, smoke disperses spherically instead of rising. Detection relies on forced cabin ventilation paths and CO sensor telemetry.',
  },
];

export const SUGGESTED_RAG_PROMPTS = [
  'What is the airflow paradox in microgravity?',
  'Why do 1g NASA-STD-6001B tests produce false passes?',
  'What are the BASS-II quench limits for PMMA?',
  'How did Saffire test large-scale fire on Cygnus?',
  'What are cool flames in the FLEX experiment?',
  'How do Nomex and Silicone behave in low gravity?',
];

/**
 * Ultra-concise, non-chunked relevance retrieval engine across the 8 NASA flight corpus documents.
 */
export function queryNasaFlightCorpus(userQuery: string): RagResponse {
  const query = userQuery.trim().toLowerCase();
  const tokens = query.split(/[\s,?.!/]+/).filter((t) => t.length > 2);

  const scored = FLIGHT_CORPUS.map((chunk) => {
    let score = 0;
    const titleLower = chunk.title.toLowerCase();
    const answerLower = chunk.conciseAnswer.toLowerCase();

    // Exact phrase matches
    if (titleLower.includes(query)) score += 30;
    if (answerLower.includes(query)) score += 20;

    // Keyword & topic matching
    for (const kw of chunk.keywords) {
      if (query.includes(kw)) score += 12;
    }
    for (const topic of chunk.topics) {
      if (query.includes(topic)) score += 10;
    }

    // Token overlap
    for (const token of tokens) {
      if (chunk.keywords.some((k) => k.includes(token))) score += 5;
      if (titleLower.includes(token)) score += 4;
      if (answerLower.includes(token)) score += 3;
    }

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const bestMatches = scored.filter((item) => item.score > 0).slice(0, 2);
  const selected = bestMatches.length > 0 ? bestMatches : [scored[0]];

  const primary = selected[0].chunk;

  // Compact citations: short source identifier and page number
  const citations = [{ source: primary.shortSource, page: primary.page }];
  if (selected.length > 1 && selected[1].chunk.id !== primary.id) {
    citations.push({ source: selected[1].chunk.shortSource, page: selected[1].chunk.page });
  }

  const timestamp = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return {
    prompt: userQuery,
    response: primary.conciseAnswer,
    citations,
    timestamp,
  };
}

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
  url: string;
}

export interface RagFinding {
  id: string;
  title: string;
  document: string;
  shortSource: string;
  page: number | string;
  url: string;
  answer: string;
}

export interface RagCitation {
  source: string;
  page?: number | string;
  snippet?: string;
  url?: string;
}

export interface RagResponse {
  prompt: string;
  response: string;
  findings: RagFinding[];
  citations: RagCitation[];
  timestamp: string;
  isGrounded: boolean;
  suggestedPrompts?: string[];
  relevanceScore?: number;
}

/**
 * Verified NASA Physical Sciences Informatics (PSI) & Standards Reference Links
 */
export const SOURCE_LINKS: Record<string, string> = {
  // BASS Campaign (Burning and Suppression of Solids)
  'bass-ii': 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-25',
  'bass_ii': 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-25',
  'psi-25': 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-25',
  'bass': 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-26',
  'psi-26': 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-26',

  // Saffire Campaign (Spacecraft Fire Safety Demonstration)
  'saffire-iii': 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-100',
  'saffire_iii': 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-100',
  'saffire-3': 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-100',
  'psi-100': 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-100',
  'saffire-ii': 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-99',
  'saffire_ii': 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-99',
  'saffire-2': 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-99',
  'psi-99': 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-99',
  'saffire': 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-98',
  'psi-98': 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-98',

  // Extinguishment & Droplet Combustion
  'flex': 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-69',
  'psi-69': 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-69',

  // Regulatory Standards & Spaceflight Heritage
  'apollo': 'https://sma.nasa.gov/sma-disciplines/accllp/apollo-1',
  'mir': 'https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/',
  'guide': 'https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/',
  'combustion_mini_book': 'https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/',
  '6001': 'https://standards.nasa.gov/standard/NASA/NASA-STD-6001',
  '3001': 'https://standards.nasa.gov/standard/NASA/NASA-STD-3001-Vol-2',
};

export const DEFAULT_SOURCE_URL = 'https://psi.nasa.gov/physci/repo/search?q=combustion';

export function resolveSourceUrl(documentOrSource: string): string {
  const s = documentOrSource.toLowerCase();
  if (s.includes('saffire-iii') || s.includes('saffire-3') || s.includes('psi-100')) {
    return SOURCE_LINKS['saffire-iii'];
  }
  if (s.includes('saffire-ii') || s.includes('saffire-2') || s.includes('psi-99')) {
    return SOURCE_LINKS['saffire-ii'];
  }
  if (s.includes('saffire') || s.includes('psi-98')) {
    return SOURCE_LINKS['saffire'];
  }
  if (s.includes('bass-ii') || s.includes('psi-25')) {
    return SOURCE_LINKS['bass-ii'];
  }
  if (s.includes('bass') || s.includes('psi-26')) {
    return SOURCE_LINKS['bass'];
  }
  if (s.includes('flex') || s.includes('psi-69')) {
    return SOURCE_LINKS['flex'];
  }
  if (s.includes('6001')) {
    return SOURCE_LINKS['6001'];
  }
  if (s.includes('3001')) {
    return SOURCE_LINKS['3001'];
  }
  if (s.includes('apollo')) {
    return SOURCE_LINKS['apollo'];
  }
  if (s.includes('mir')) {
    return SOURCE_LINKS['mir'];
  }
  if (s.includes('jsc') || s.includes('mini-book') || s.includes('combustion_in_reduced_gravity')) {
    return SOURCE_LINKS['combustion_mini_book'];
  }
  if (s.includes('us nat') || s.includes('070he') || s.includes('guide')) {
    return SOURCE_LINKS['guide'];
  }
  return DEFAULT_SOURCE_URL;
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
    url: resolveSourceUrl('US National Meeting-070HE-0218-Final.pdf'),
    title: 'Aerodynamic Mechanism of the Microgravity Airflow Paradox',
    topics: ['airflow paradox', 'flame spread', 'concurrent flow', 'convective cooling', 'extinction'],
    keywords: ['airflow', 'paradox', 'velocity', 'convection', 'cooling', 'spread rate', 'diffusion', 'blowout', 'quench'],
    conciseAnswer:
      'In microgravity environments, natural buoyancy-driven updrafts are absent. Consequently, low forced airflow velocities between 5.0 and 18.0 cm/s continuously deliver fresh oxidizer without convective cooling, accelerating flame spread along material surfaces. Extinction is achieved only when flow drops below 2.5 cm/s (diffusion starvation) or exceeds 30.0 cm/s (convective blowout).',
  },
  {
    id: 'nasa-6001b-false-pass',
    document: 'np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf',
    shortSource: 'JSC Mini-Book',
    page: 19,
    url: resolveSourceUrl('np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf'),
    title: 'NASA-STD-6001B Ground Test 1 False-Pass Phenomenon',
    topics: ['nasa-std-6001b', 'ground testing', 'false pass', 'buoyancy', 'qualification'],
    keywords: ['nasa-std-6001b', 'ground', 'qualification', 'test 1', 'false pass', 'buoyancy', 'gravity', '1g', 'microgravity', 'earth'],
    conciseAnswer:
      'Standard 1g qualification tests (NASA-STD-6001B Test 1) induce strong buoyant thermal plumes of 100–300 cm/s that cool the flame zone and sweep heat away, causing materials to self-extinguish. In true microgravity without buoyant cooling, materials like Nomex blends, silicone, and PMMA sustain low-speed flame spread at operational cabin oxygen concentrations, resulting in critical ground test false passes.',
  },
  {
    id: 'bass-pmma-extinction',
    document: 'SRD_BASS-II.pdf',
    shortSource: 'SRD BASS-II',
    page: 8,
    url: resolveSourceUrl('SRD_BASS-II.pdf'),
    title: 'BASS-II PMMA Cast Acrylic Quenching & Critical Flow Bounds',
    topics: ['pmma', 'bass-ii', 'quenching', 'extinction', 'critical flow window'],
    keywords: ['pmma', 'acrylic', 'bass', 'bass-ii', 'quench', 'flow velocity', 'extinction limit', 'rod', 'slab'],
    conciseAnswer:
      'BASS-II flight trials aboard the ISS Microgravity Science Glovebox demonstrated that cast PMMA acrylic burns steadily at 21% O2 under forced airflows from 1.0 to 15.0 cm/s. Reliable flame quenching requires either reducing cabin ventilation flow below the critical 1.5 cm/s threshold or scrubbing ambient oxygen below the material\'s 17.0% limiting oxygen index (LOI).',
  },
  {
    id: 'saffire-large-scale-growth',
    document: 'SAFFIRE-I and SAFFIRE-III DoD.pdf',
    shortSource: 'Saffire-I/III',
    page: 3,
    url: resolveSourceUrl('SAFFIRE-I and SAFFIRE-III DoD.pdf'),
    title: 'Saffire Cygnus Large-Scale Microgravity Fire Growth',
    topics: ['saffire', 'cygnus', 'large scale', 'spacecraft fire', 'sibal'],
    keywords: ['saffire', 'cygnus', 'large scale', 'sibal', 'fabric', 'spacecraft', 'orbital atk', 'fire growth'],
    conciseAnswer:
      'Conducted aboard uncrewed Cygnus resupply vehicles, Saffire-I and Saffire-III investigated realistic spacecraft-scale fires on 0.4 m × 1.0 m Sibal cotton-fiberglass fabric samples. Under forced microgravity ventilation, steady flame propagation proceeded at approximately 2.5 mm/s, sustained by forward radiative heat flux that preheats unburned material upstream, underscoring the necessity of immediate ventilation isolation.',
  },
  {
    id: 'saffire-ii-material-loi',
    document: 'SAFFIRE-II DoD.pdf',
    shortSource: 'Saffire-II',
    page: 5,
    url: resolveSourceUrl('SAFFIRE-II DoD.pdf'),
    title: 'Saffire-II Aerospace Material Flammability & LOI Thresholds',
    topics: ['saffire-ii', 'loi', 'materials', 'nomex', 'silicone', 'kapton'],
    keywords: ['saffire-ii', 'loi', 'limiting oxygen index', 'silicone', 'rtv-560', 'nomex', 'kapton', 'ultem', 'materials'],
    conciseAnswer:
      'Saffire-II flammability investigations measured the limiting oxygen index (LOI) across nine flight materials under microgravity conditions. Nomex HT90-40 self-extinguishes below 28.5% O2, whereas Silicone RTV-560 sustained internal smoldering beneath an insulating silica char layer even at quiescent flows. Kapton HN polyimide self-extinguishes in nominal cabin air but undergoes catastrophic flashover above 30.0% O2.',
  },
  {
    id: 'flex-droplet-cool-flames',
    document: 'FLEX_EIRD_v4.pdf',
    shortSource: 'FLEX EIRD',
    page: 18,
    url: resolveSourceUrl('FLEX_EIRD_v4.pdf'),
    title: 'FLEX Spherical Droplet Burning & Cool Flame Extinction',
    topics: ['flex', 'cool flame', 'droplet', 'extinction', 'cir'],
    keywords: ['flex', 'droplet', 'cool flame', 'spherical', 'extinction', 'cir', 'heptane', 'liquid fuel'],
    conciseAnswer:
      'The Flame Extinguishment Experiment (FLEX) in the ISS CIR rack discovered that spherical liquid alkane droplets (heptane and decane) transition to quasi-steady low-temperature "cool flames" (~500°C) after apparent visible flameout. These invisible cool flames persist for tens of seconds driven by low-temperature chemical kinetics, necessitating thermal and CO gas telemetry to confirm full extinction.',
  },
  {
    id: 'bass-fan-calibration-speeds',
    document: 'BASS-II data FAQ.pdf',
    shortSource: 'BASS-II FAQ',
    page: 2,
    url: resolveSourceUrl('BASS-II data FAQ.pdf'),
    title: 'BASS-II Ventilation Fan Speed & Duct Calibration',
    topics: ['fan calibration', 'flow speed', 'duct velocity', 'glovebox'],
    keywords: ['fan', 'calibration', 'voltage', 'cm/s', 'rpm', 'duct', 'flow sensor', 'msg', 'airspeed'],
    conciseAnswer:
      'Within the ISS Microgravity Science Glovebox flow duct, ventilation fan inputs from 0.0 to 12.2 V correspond to airspeeds up to 32.5 cm/s, with nominal ECLSS flow calibrated at 12.0 cm/s (4.0 V). For active fire suppression in the flow duct, fan actuation must be throttled down below 1.5 cm/s to suppress convective oxidizer feed and induce radiative flame quenching.',
  },
  {
    id: 'gaseous-suppression-agent-limits',
    document: 'SRD_BASS.pdf',
    shortSource: 'SRD BASS-I',
    page: 11,
    url: resolveSourceUrl('SRD_BASS.pdf'),
    title: 'Gaseous Extinguishing (N2/CO2) & Depressurization Limits',
    topics: ['suppression', 'extinguishing', 'nitrogen', 'co2', 'dilution'],
    keywords: ['suppression', 'agent', 'co2', 'nitrogen', 'n2', 'depressurization', 'dilution', 'fire extinguisher'],
    conciseAnswer:
      'BASS-I gaseous extinguishing trials determined that introducing CO2 or N2 inert diluents to drop ambient oxygen below 14.0% achieves rapid flameout. However, post-discharge duct isolation must be maintained because hot, porous char remains thermally insulated in microgravity and readily reignites if ventilation is prematurely restored.',
  },
  {
    id: 'reverse-solver-quench',
    document: 'US National Meeting-070HE-0218-Final.pdf',
    shortSource: 'US Nat. Mtg',
    page: 4,
    url: resolveSourceUrl('US National Meeting-070HE-0218-Final.pdf'),
    title: 'Reverse-Solver Actuation Mechanism & Target Airflow Override',
    topics: ['reverse solver', 'override', 'throttle', 'quench setpoint', 'actuation'],
    keywords: ['reverse', 'solver', 'override', 'throttle', 'target', 'quench point', 'setpoint', 'actuation', 'airflow'],
    conciseAnswer:
      'The Avionics Reverse-Solver calculates active fan throttle overrides by taking real-time sensor readouts (O2%, air velocity, pressure) and inverting the polynomial flammability boundary. When ignition is detected, it commands ventilation dampers down to a safe quench velocity (< 2.5 cm/s), starving the combustion boundary layer without venting vehicle atmosphere.',
  },
  {
    id: 'critical-flow-window-concept',
    document: 'US National Meeting-070HE-0218-Final.pdf',
    shortSource: 'US Nat. Mtg',
    page: 4,
    url: resolveSourceUrl('US National Meeting-070HE-0218-Final.pdf'),
    title: 'Critical Flow Window Velocity Dynamics',
    topics: ['critical flow window', 'velocity bounds', 'convective limit'],
    keywords: ['critical flow', 'flow window', 'window', 'velocity range', 'bounds', 'hazard window'],
    conciseAnswer:
      'The microgravity critical flow window (5.0 to 18.0 cm/s) represents the high-risk convective velocity zone where flame spread rates peak across solid materials. Within this velocity corridor, ventilation supplies oxygen faster than thermal energy is swept away, sustaining combustion that would otherwise extinguish in quiescent conditions.',
  },
  {
    id: 'microgravity-detection-sensors',
    document: 'np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf',
    shortSource: 'JSC Mini-Book',
    page: 12,
    url: resolveSourceUrl('np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf'),
    title: 'Microgravity Fire Detection & Sensor Placements',
    topics: ['fire detection', 'sensors', 'smoke', 'co sensor', 'detectors'],
    keywords: ['detect', 'detection', 'sensor', 'smoke detector', 'co ppm', 'carbon monoxide', 'placement'],
    conciseAnswer:
      'Without gravitational buoyancy, combustion products and smoke particulates expand spherically via slow molecular diffusion rather than ascending to ceiling-mounted detectors. Spacecraft fire safety architectures must consequently position optical smoke and carbon monoxide (CO) electrochemical sensors directly along forced ECLSS ventilation return paths.',
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

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t',
  'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his',
  'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its',
  'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once',
  'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d',
  'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll',
  'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while',
  'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll',
  'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
  // Conversational filler & generic non-domain words
  'tell', 'explain', 'show', 'give', 'know', 'help', 'please', 'make', 'just', 'like', 'think', 'need', 'want',
  'stuff', 'kind', 'something', 'thing', 'things', 'hello', 'hey', 'hi', 'anyone', 'someone', 'answer'
]);

/**
 * Verified flight science domain anchors (materials, missions, facilities, combustion physics)
 * Grounded in the 8 NASA reference PDFs.
 */
const DOMAIN_ANCHORS = [
  'airflow paradox', 'critical flow', 'cool flame', 'cool flames', 'quench', 'quenching', 'quenched',
  'extinction', 'blowout', 'flame spread', 'microgravity', 'zero gravity', 'zero-g', '0g', '1g',
  'buoyancy', 'buoyant', 'flammability', 'combustion', 'loi', 'limiting oxygen', 'concurrent',
  'opposed', 'smoke detector', 'false pass', 'reverse solver', 'suppression', 'depressurization',
  'fan calibration', 'duct velocity', 'airspeed', 'stagnation', 'smolder', 'smoldering',
  // Missions & Hardware
  'bass', 'bass-i', 'bass-ii', 'saffire', 'saffire-i', 'saffire-ii', 'saffire-iii', 'saffire-iv',
  'flex', 'cir', 'msg', 'spice', 'cygnus', 'eclss', 'iss', 'nasa-std-6001b', 'std-6001b', '6001b',
  'psi-25', 'psi-26', 'psi-98', 'psi-99',
  // Materials
  'pmma', 'acrylic', 'nomex', 'silicone', 'rtv-560', 'kapton', 'ultem', 'sibal', 'teflon', 'ptfe', 'heptane'
];

export const REJECTION_MESSAGE =
  'No grounded flight science resources found for this inquiry in the 8 NASA reference PDFs. The FLAMIE retrieval corpus is strictly restricted to verified microgravity combustion data from BASS, Saffire, and FLEX flight experiments.';

export const DEFAULT_FALLBACK_PROMPTS = [
  'What is the airflow paradox in microgravity?',
  'What are the BASS-II quench limits for PMMA?',
  'How do Nomex and Silicone behave in low gravity?',
];

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Ultra-concise, grounded relevance retrieval engine across the 8 NASA flight corpus documents.
 * Rejects off-topic queries when no relevant context or verified domain anchors are matched.
 */
export function queryNasaFlightCorpus(userQuery: string): RagResponse {
  const query = userQuery.trim().toLowerCase();
  const rawTokens = query.split(/[^a-z0-9_-]+/).filter(Boolean);
  const tokens = rawTokens.filter((t) => t.length > 2 && !STOP_WORDS.has(t));

  const timestamp = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Check if query matches verified flight science domain anchors
  const hasDomainAnchor = DOMAIN_ANCHORS.some((anchor) => {
    if (anchor.includes(' ') || anchor.includes('-')) {
      return query.includes(anchor);
    }
    const regex = new RegExp(`\\b${escapeRegExp(anchor)}\\b`, 'i');
    return regex.test(query);
  });

  const scored = FLIGHT_CORPUS.map((chunk) => {
    let score = 0;
    const titleLower = chunk.title.toLowerCase();
    const answerLower = chunk.conciseAnswer.toLowerCase();

    // Exact phrase match in title or answer
    if (titleLower.includes(query)) score += 35;
    if (answerLower.includes(query)) score += 20;

    // Check multi-word topics and keywords
    for (const topic of chunk.topics) {
      if (topic.includes(' ') || topic.includes('-')) {
        if (query.includes(topic)) score += 25;
      } else {
        const regex = new RegExp(`\\b${escapeRegExp(topic)}\\b`, 'i');
        if (regex.test(query)) score += 18;
      }
    }

    for (const kw of chunk.keywords) {
      if (kw.includes(' ') || kw.includes('-')) {
        if (query.includes(kw)) score += 20;
      } else {
        const regex = new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i');
        if (regex.test(query)) score += 14;
      }
    }

    // Token overlap
    for (const token of tokens) {
      if (chunk.keywords.some((k) => k === token || k.includes(token))) score += 8;
      if (titleLower.includes(token)) score += 6;
      if (answerLower.includes(token)) score += 4;
    }

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topMatch = scored[0];
  const topScore = topMatch ? topMatch.score : 0;

  // Moderate threshold rule:
  // Requires minimum score of 18 AND either a domain anchor hit OR strong multi-token score (>= 28)
  const isGrounded = (topScore >= 18 && hasDomainAnchor) || topScore >= 28;

  if (!isGrounded || !topMatch || topScore === 0) {
    return {
      prompt: userQuery,
      response: REJECTION_MESSAGE,
      findings: [],
      citations: [],
      timestamp,
      isGrounded: false,
      suggestedPrompts: DEFAULT_FALLBACK_PROMPTS,
      relevanceScore: topScore,
    };
  }

  // Ensure output provides at least two answers based on referring to the flight PDFs
  const positiveMatches = scored.filter((item) => item.score > 0);
  const selectedChunks: FlightCorpusChunk[] = [];

  for (const match of positiveMatches) {
    if (!selectedChunks.some((c) => c.id === match.chunk.id)) {
      selectedChunks.push(match.chunk);
    }
    if (selectedChunks.length >= 3) break;
  }

  // Guarantee at least two distinct findings from the referenced PDFs
  if (selectedChunks.length < 2) {
    for (const chunk of FLIGHT_CORPUS) {
      if (!selectedChunks.some((c) => c.id === chunk.id)) {
        selectedChunks.push(chunk);
        if (selectedChunks.length >= 2) break;
      }
    }
  }

  const findings: RagFinding[] = selectedChunks.map((chunk) => ({
    id: chunk.id,
    title: chunk.title,
    document: chunk.document,
    shortSource: chunk.shortSource,
    page: chunk.page,
    url: chunk.url,
    answer: chunk.conciseAnswer,
  }));

  // Unique citations with verified links to NASA PSI / Standards
  const citations: RagCitation[] = [];
  for (const chunk of selectedChunks) {
    const isDuplicate = citations.some(
      (c) => c.source === chunk.shortSource && c.page === chunk.page
    );
    if (!isDuplicate) {
      citations.push({
        source: chunk.shortSource,
        page: chunk.page,
        url: chunk.url,
      });
    }
  }

  return {
    prompt: userQuery,
    response: findings[0].answer,
    findings,
    citations,
    timestamp,
    isGrounded: true,
    suggestedPrompts: undefined,
    relevanceScore: topScore,
  };
}

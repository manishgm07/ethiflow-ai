/**
 * Bengaluru route planner data — origins, destinations, transport modes,
 * and simulated travel-time estimates.  Pure data + functions; no React.
 */
import type { JunctionId } from "./sim/junctions";

/* ── Origins (major junctions) ─────────────────────────────────── */

export interface BengaluruOrigin {
  id: string;
  en: string;
  kn: string;
  junctionId: JunctionId;
}

export const ORIGINS: BengaluruOrigin[] = [
  { id: "silk-board", en: "Silk Board", kn: "ಸಿಲ್ಕ್ ಬೋರ್ಡ್", junctionId: "silk-board" },
  { id: "hebbal", en: "Hebbal", kn: "ಹೆಬ್ಬಾಳ", junctionId: "hebbal" },
  { id: "kr-puram", en: "KR Puram (Tin Factory)", kn: "ಕೆ.ಆರ್. ಪುರಂ (ಟಿನ್ ಫ್ಯಾಕ್ಟರಿ)", junctionId: "kr-puram" },
  { id: "mg-road", en: "MG Road", kn: "ಎಂ.ಜಿ. ರಸ್ತೆ", junctionId: "mg-road" },
];

/* ── Destinations (landmark hubs) ──────────────────────────────── */

export interface BengaluruDestination {
  id: string;
  en: string;
  kn: string;
}

export const DESTINATIONS: BengaluruDestination[] = [
  { id: "electronic-city", en: "Electronic City", kn: "ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಿಟಿ" },
  { id: "whitefield", en: "Whitefield (ITPL)", kn: "ವೈಟ್‌ಫೀಲ್ಡ್ (ITPL)" },
  { id: "airport", en: "Kempegowda Intl Airport (BLR)", kn: "ಕೆಂಪೇಗೌಡ ಅಂತರಾಷ್ಟ್ರೀಯ ವಿಮಾನ ನಿಲ್ದಾಣ (BLR)" },
  { id: "indiranagar", en: "Indiranagar", kn: "ಇಂದಿರಾನಗರ" },
  { id: "majestic", en: "Majestic (Kempegowda Bus Station)", kn: "ಮೆಜೆಸ್ಟಿಕ್ (ಕೆಂಪೇಗೌಡ ಬಸ್ ನಿಲ್ದಾಣ)" },
  { id: "koramangala", en: "Koramangala", kn: "ಕೋರಮಂಗಲ" },
];

/* ── Transport modes ───────────────────────────────────────────── */

export type TransportModeId = "metro" | "bmtc" | "two-wheeler" | "car";

export interface TransportMode {
  id: TransportModeId;
  en: string;
  kn: string;
  icon: "train" | "bus" | "bike" | "car";
}

export const TRANSPORT_MODES: TransportMode[] = [
  { id: "metro", en: "Namma Metro + Last-Mile Auto", kn: "ನಮ್ಮ ಮೆಟ್ರೋ + ಆಟೋ", icon: "train" },
  { id: "bmtc", en: "BMTC Vayu Vajra / Volvo AC", kn: "BMTC ವಾಯು ವಜ್ರ / ವೋಲ್ವೋ", icon: "bus" },
  { id: "two-wheeler", en: "Two-Wheeler / Bike Taxi", kn: "ದ್ವಿಚಕ್ರ / ಬೈಕ್ ಟ್ಯಾಕ್ಸಿ", icon: "bike" },
  { id: "car", en: "Private Car / Cab", kn: "ಖಾಸಗಿ ಕಾರು / ಕ್ಯಾಬ್", icon: "car" },
];

/* ── Simulated travel times (minutes) ──────────────────────────── */

/**
 * Base travel times keyed [origin][destination][mode].
 * These are deterministic simulation values, not live data.
 */
const BASE_TIMES: Record<string, Record<string, Record<TransportModeId, number>>> = {
  "silk-board": {
    "electronic-city": { metro: 22, bmtc: 40, "two-wheeler": 35, car: 50 },
    whitefield: { metro: 45, bmtc: 65, "two-wheeler": 50, car: 70 },
    airport: { metro: 70, bmtc: 95, "two-wheeler": 75, car: 90 },
    indiranagar: { metro: 18, bmtc: 30, "two-wheeler": 25, car: 35 },
    majestic: { metro: 25, bmtc: 35, "two-wheeler": 30, car: 45 },
    koramangala: { metro: 15, bmtc: 20, "two-wheeler": 12, car: 18 },
  },
  hebbal: {
    "electronic-city": { metro: 55, bmtc: 80, "two-wheeler": 60, car: 85 },
    whitefield: { metro: 40, bmtc: 55, "two-wheeler": 45, car: 60 },
    airport: { metro: 35, bmtc: 45, "two-wheeler": 40, car: 30 },
    indiranagar: { metro: 25, bmtc: 35, "two-wheeler": 30, car: 40 },
    majestic: { metro: 20, bmtc: 25, "two-wheeler": 22, car: 30 },
    koramangala: { metro: 35, bmtc: 50, "two-wheeler": 40, car: 55 },
  },
  "kr-puram": {
    "electronic-city": { metro: 50, bmtc: 70, "two-wheeler": 55, car: 75 },
    whitefield: { metro: 15, bmtc: 25, "two-wheeler": 18, car: 30 },
    airport: { metro: 55, bmtc: 70, "two-wheeler": 50, car: 65 },
    indiranagar: { metro: 12, bmtc: 20, "two-wheeler": 15, car: 25 },
    majestic: { metro: 28, bmtc: 40, "two-wheeler": 35, car: 50 },
    koramangala: { metro: 30, bmtc: 45, "two-wheeler": 35, car: 50 },
  },
  "mg-road": {
    "electronic-city": { metro: 30, bmtc: 50, "two-wheeler": 40, car: 55 },
    whitefield: { metro: 35, bmtc: 50, "two-wheeler": 40, car: 55 },
    airport: { metro: 50, bmtc: 65, "two-wheeler": 55, car: 70 },
    indiranagar: { metro: 8, bmtc: 15, "two-wheeler": 10, car: 18 },
    majestic: { metro: 10, bmtc: 12, "two-wheeler": 12, car: 20 },
    koramangala: { metro: 15, bmtc: 20, "two-wheeler": 15, car: 22 },
  },
};

/** Junctions crossed by each route. */
const JUNCTIONS_CROSSED: Record<string, Record<string, string[]>> = {
  "silk-board": {
    "electronic-city": [],
    whitefield: ["KR Puram"],
    airport: ["MG Road", "Hebbal"],
    indiranagar: ["MG Road"],
    majestic: ["MG Road"],
    koramangala: [],
  },
  hebbal: {
    "electronic-city": ["MG Road", "Silk Board"],
    whitefield: ["KR Puram"],
    airport: [],
    indiranagar: ["MG Road"],
    majestic: [],
    koramangala: ["MG Road", "Silk Board"],
  },
  "kr-puram": {
    "electronic-city": ["Silk Board"],
    whitefield: [],
    airport: ["Hebbal"],
    indiranagar: [],
    majestic: ["MG Road"],
    koramangala: ["MG Road"],
  },
  "mg-road": {
    "electronic-city": ["Silk Board"],
    whitefield: ["KR Puram"],
    airport: ["Hebbal"],
    indiranagar: [],
    majestic: [],
    koramangala: [],
  },
};

/** Short reason why the fastest mode wins. */
const WIN_REASONS: Record<TransportModeId, Record<string, string>> = {
  metro: {
    en: "Bypasses surface gridlock via underground/elevated Metro corridor",
    kn: "ಭೂಗತ/ಎತ್ತರಿಸಿದ ಮೆಟ್ರೋ ಮಾರ್ಗದ ಮೂಲಕ ಮೇಲ್ಮೈ ದಟ್ಟಣೆ ತಪ್ಪಿಸುತ್ತದೆ",
  },
  bmtc: {
    en: "Dedicated bus lane avoids peak-hour junction delays",
    kn: "ಮೀಸಲು ಬಸ್ ಪಥ ಗರಿಷ್ಠ ಸಮಯದ ಜಂಕ್ಷನ್ ವಿಳಂಬ ತಪ್ಪಿಸುತ್ತದೆ",
  },
  "two-wheeler": {
    en: "Filters through junction bottlenecks faster than 4-wheelers",
    kn: "ಜಂಕ್ಷನ್ ಅಡೆತಡೆಗಳನ್ನು 4-ಚಕ್ರಕ್ಕಿಂತ ವೇಗವಾಗಿ ಹಾಯುತ್ತದೆ",
  },
  car: {
    en: "Direct route with no transfers — best when roads are clear",
    kn: "ವರ್ಗಾವಣೆ ಇಲ್ಲದ ನೇರ ಮಾರ್ಗ — ರಸ್ತೆಗಳು ಖಾಲಿ ಇದ್ದಾಗ ಉತ್ತಮ",
  },
};

export interface RouteOption {
  mode: TransportMode;
  travelTimeMin: number;
  junctionsCrossed: string[];
  isFastest: boolean;
  savedMin: number;
  winReason: { en: string; kn: string };
}

/**
 * Compare all transport modes for a given origin → destination.
 * Returns sorted by travel time (fastest first).
 */
export function compareRoutes(originId: string, destinationId: string): RouteOption[] {
  const originTimes = BASE_TIMES[originId];
  if (!originTimes) return [];
  const destTimes = originTimes[destinationId];
  if (!destTimes) return [];

  const junctions = JUNCTIONS_CROSSED[originId]?.[destinationId] ?? [];

  const options: RouteOption[] = TRANSPORT_MODES.map((mode) => ({
    mode,
    travelTimeMin: destTimes[mode.id],
    junctionsCrossed: junctions,
    isFastest: false,
    savedMin: 0,
    winReason: WIN_REASONS[mode.id],
  }));

  options.sort((a, b) => a.travelTimeMin - b.travelTimeMin);

  if (options.length > 0) {
    const fastest = options[0]!;
    fastest.isFastest = true;
    const slowest = options[options.length - 1]!;
    fastest.savedMin = slowest.travelTimeMin - fastest.travelTimeMin;

    // Build specific reason
    const crossedStr = junctions.length > 0 ? junctions.join(" & ") : "surface traffic";
    fastest.winReason = {
      en: `Saves ${fastest.savedMin} mins by bypassing ${crossedStr} via ${fastest.mode.en}`,
      kn: `${fastest.mode.kn} ಮೂಲಕ ${crossedStr} ಬೈಪಾಸ್ ಮಾಡಿ ${fastest.savedMin} ನಿಮಿಷ ಉಳಿಸುತ್ತದೆ`,
    };
  }

  return options;
}

/* ── Best-time-to-leave logic ──────────────────────────────────── */

export type TripTiming = "now" | "target";

export interface DepartureRecommendation {
  publicTransport: {
    departureWindow: string;
    travelTimeMin: number;
    mode: string;
    modeKn: string;
  };
  privateTransport: {
    departureWindow: string;
    travelTimeMin: number;
    mode: string;
    modeKn: string;
  };
  peakWarning: boolean;
  recommendation: { en: string; kn: string };
}

/** Simulated peak hours for Bengaluru. */
function isPeakHour(hour: number): boolean {
  return (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
}

/**
 * Recommend best departure for a destination.
 * `currentHour` is 0-23 representing the simulated current hour.
 */
export function recommendDeparture(
  originId: string,
  destinationId: string,
  currentHour: number,
): DepartureRecommendation {
  const routes = compareRoutes(originId, destinationId);
  const metro = routes.find((r) => r.mode.id === "metro");
  const car = routes.find((r) => r.mode.id === "car");
  const peak = isPeakHour(currentHour);

  const publicTime = metro ? (peak ? metro.travelTimeMin : Math.round(metro.travelTimeMin * 0.9)) : 45;
  const privateTime = car ? (peak ? Math.round(car.travelTimeMin * 1.3) : car.travelTimeMin) : 60;

  const nextClearHour = currentHour >= 20 ? 6 : currentHour >= 10 ? 11 : currentHour < 8 ? currentHour : 11;
  const pad = (n: number) => String(n).padStart(2, "0");
  const nowWindow = `${pad(currentHour)}:00 – ${pad(currentHour)}:30`;
  const clearWindow = `${pad(nextClearHour)}:00 – ${pad(nextClearHour)}:30`;

  const pubDep = peak ? clearWindow : nowWindow;
  const privDep = peak ? clearWindow : nowWindow;

  const rec = peak
    ? {
        en: `Peak hour — take Namma Metro to save ~${privateTime - publicTime} mins over driving. Leave after ${pad(nextClearHour)}:00 for best road conditions.`,
        kn: `ಗರಿಷ್ಠ ಸಮಯ — ಡ್ರೈವಿಂಗ್‌ಗಿಂತ ~${privateTime - publicTime} ನಿಮಿಷ ಉಳಿಸಲು ನಮ್ಮ ಮೆಟ್ರೋ ತೆಗೆದುಕೊಳ್ಳಿ. ಉತ್ತಮ ರಸ್ತೆ ಸ್ಥಿತಿಗೆ ${pad(nextClearHour)}:00 ನಂತರ ಹೊರಡಿ.`,
      }
    : {
        en: `Off-peak — roads are relatively clear. Driving and Metro take similar time. Good window to leave now.`,
        kn: `ಆಫ್-ಪೀಕ್ — ರಸ್ತೆಗಳು ಸಾಕಷ್ಟು ಖಾಲಿ. ಡ್ರೈವಿಂಗ್ ಮತ್ತು ಮೆಟ್ರೋ ಸಮಾನ ಸಮಯ. ಈಗ ಹೊರಡಲು ಒಳ್ಳೆಯ ಸಮಯ.`,
      };

  return {
    publicTransport: {
      departureWindow: pubDep,
      travelTimeMin: publicTime,
      mode: "Namma Metro + BMTC",
      modeKn: "ನಮ್ಮ ಮೆಟ್ರೋ + BMTC",
    },
    privateTransport: {
      departureWindow: privDep,
      travelTimeMin: privateTime,
      mode: "Car / Two-Wheeler",
      modeKn: "ಕಾರು / ದ್ವಿಚಕ್ರ",
    },
    peakWarning: peak,
    recommendation: rec,
  };
}

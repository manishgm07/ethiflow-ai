export type ApproachId = "N" | "E" | "S" | "W";
export const APPROACHES: ApproachId[] = ["N", "E", "S", "W"];

export type JunctionId = "silk-board" | "hebbal" | "kr-puram" | "mg-road";
export const JUNCTION_IDS: JunctionId[] = ["silk-board", "hebbal", "kr-puram", "mg-road"];

export interface Bilingual {
  en: string;
  kn: string;
}

export interface ApproachDef {
  id: ApproachId;
  road: Bilingual;
  /** Pedestrian crossing width in metres. */
  crossingWidthM: number;
  /** Relative share of junction traffic on this approach. */
  weight: number;
}

export interface JunctionDef {
  id: JunctionId;
  name: Bilingual;
  /** Congestion bias relative to an average junction. */
  base: number;
  approaches: Record<ApproachId, ApproachDef>;
  neighbors: JunctionId[];
}

const a = (id: ApproachId, en: string, kn: string, crossingWidthM: number, weight: number): ApproachDef => ({
  id,
  road: { en, kn },
  crossingWidthM,
  weight,
});

export const JUNCTIONS: Record<JunctionId, JunctionDef> = {
  "silk-board": {
    id: "silk-board",
    name: { en: "Silk Board", kn: "ಸಿಲ್ಕ್ ಬೋರ್ಡ್" },
    base: 1.2,
    approaches: {
      N: a("N", "Hosur Road (Madiwala)", "ಹೊಸೂರು ರಸ್ತೆ (ಮಡಿವಾಳ)", 18, 1.1),
      E: a("E", "Outer Ring Road (HSR Layout)", "ಹೊರ ವರ್ತುಲ ರಸ್ತೆ (HSR ಲೇಔಟ್)", 21, 1.15),
      S: a("S", "Hosur Road (Bommanahalli)", "ಹೊಸೂರು ರಸ್ತೆ (ಬೊಮ್ಮನಹಳ್ಳಿ)", 18, 1.0),
      W: a("W", "Outer Ring Road (BTM Layout)", "ಹೊರ ವರ್ತುಲ ರಸ್ತೆ (BTM ಲೇಔಟ್)", 16, 0.8),
    },
    neighbors: ["mg-road", "kr-puram"],
  },
  hebbal: {
    id: "hebbal",
    name: { en: "Hebbal", kn: "ಹೆಬ್ಬಾಳ" },
    base: 1.05,
    approaches: {
      N: a("N", "Bellary Road (Airport)", "ಬಳ್ಳಾರಿ ರಸ್ತೆ (ವಿಮಾನ ನಿಲ್ದಾಣ)", 20, 1.2),
      E: a("E", "Outer Ring Road (Nagawara)", "ಹೊರ ವರ್ತುಲ ರಸ್ತೆ (ನಾಗವಾರ)", 16, 0.9),
      S: a("S", "Bellary Road (Mekhri Circle)", "ಬಳ್ಳಾರಿ ರಸ್ತೆ (ಮೇಖ್ರಿ ವೃತ್ತ)", 18, 1.05),
      W: a("W", "Outer Ring Road (Yeshwanthpur)", "ಹೊರ ವರ್ತುಲ ರಸ್ತೆ (ಯಶವಂತಪುರ)", 14, 0.85),
    },
    neighbors: ["mg-road", "kr-puram"],
  },
  "kr-puram": {
    id: "kr-puram",
    name: { en: "KR Puram (Tin Factory)", kn: "ಕೆ.ಆರ್. ಪುರಂ (ಟಿನ್ ಫ್ಯಾಕ್ಟರಿ)" },
    base: 1.1,
    approaches: {
      N: a("N", "Old Madras Road (KR Puram)", "ಹಳೆ ಮದ್ರಾಸ್ ರಸ್ತೆ (ಕೆ.ಆರ್. ಪುರಂ)", 16, 1.05),
      E: a("E", "Outer Ring Road (Mahadevapura)", "ಹೊರ ವರ್ತುಲ ರಸ್ತೆ (ಮಹದೇವಪುರ)", 18, 1.1),
      S: a("S", "Outer Ring Road (Marathahalli)", "ಹೊರ ವರ್ತುಲ ರಸ್ತೆ (ಮಾರತ್ತಹಳ್ಳಿ)", 16, 0.95),
      W: a("W", "Old Madras Road (Indiranagar)", "ಹಳೆ ಮದ್ರಾಸ್ ರಸ್ತೆ (ಇಂದಿರಾನಗರ)", 14, 0.9),
    },
    neighbors: ["hebbal", "silk-board", "mg-road"],
  },
  "mg-road": {
    id: "mg-road",
    name: { en: "MG Road", kn: "ಎಂ.ಜಿ. ರಸ್ತೆ" },
    base: 0.85,
    approaches: {
      N: a("N", "Cubbon Road", "ಕಬ್ಬನ್ ರಸ್ತೆ", 12, 0.9),
      E: a("E", "MG Road (Trinity Circle)", "ಎಂ.ಜಿ. ರಸ್ತೆ (ಟ್ರಿನಿಟಿ ವೃತ್ತ)", 14, 1.1),
      S: a("S", "Brigade Road", "ಬ್ರಿಗೇಡ್ ರಸ್ತೆ", 10, 1.0),
      W: a("W", "MG Road (Anil Kumble Circle)", "ಎಂ.ಜಿ. ರಸ್ತೆ (ಅನಿಲ್ ಕುಂಬ್ಳೆ ವೃತ್ತ)", 14, 1.0),
    },
    neighbors: ["kr-puram", "silk-board", "hebbal"],
  },
};

export function isJunctionId(v: string): v is JunctionId {
  return (JUNCTION_IDS as string[]).includes(v);
}

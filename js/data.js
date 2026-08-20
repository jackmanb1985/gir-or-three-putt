/**
 * Riccio milestone tiers (formula-derived) and Arccos-informed skill brackets.
 */

export const MILESTONES = [
  { id: "break90", label: "Break 90", girRequired: 3, predictedScore: 89 },
  { id: "break85", label: "Break 85", girRequired: 5, predictedScore: 85 },
  { id: "break80", label: "Break 80", girRequired: 8, predictedScore: 79 },
  { id: "break70", label: "Break 70", girRequired: 13, predictedScore: 69 },
];

/**
 * Skill targets informed by Arccos amateur/pro baselines (drive distances in metres).
 * @see https://au.arccosgolf.com/blogs/community/arccos-golf-releases-largest-ever-annual-driving-distance-report-leveraging-data-from-25-million-rounds-to-deliver-eight-year-trend-analysis-across-age-gender-and-skill-level
 */
export const SKILL_BRACKETS = [
  {
    id: "ninety",
    label: "90-Shooter",
    hcpBand: "~20 HCP",
    targetScore: 94,
    fairwayPct: 44,
    gir: 3,
    putts: 37,
    driveMeters: 192,
    recoveryPct: 36,
  },
  {
    id: "eighty",
    label: "80-Shooter",
    hcpBand: "~10 HCP",
    targetScore: 85,
    fairwayPct: 49,
    gir: 6,
    putts: 33,
    driveMeters: 211,
    recoveryPct: 21,
  },
  {
    id: "scratch",
    label: "Scratch Golfer",
    hcpBand: "0 HCP",
    targetScore: 75,
    fairwayPct: 54,
    gir: 10,
    putts: 31,
    driveMeters: 237,
    recoveryPct: 12,
  },
  {
    id: "pga",
    label: "PGA Tour Average",
    hcpBand: "Tour",
    targetScore: 71,
    fairwayPct: 60,
    gir: 12,
    putts: 29,
    driveMeters: 274,
    recoveryPct: 5,
  },
];

export const BADGE_THRESHOLDS = {
  leak: 2.5,
  savior: -2.5,
};

export const DRIVING_THRESHOLDS = {
  recoveryCountBad: 2,
  strongGir: 7,
  roughHigh: 6,
  fairwayPctWarn: 44,
  minTeeShotsForPct: 8,
  puttGapLeak: 2.5,
  puttGapSavior: -2.5,
};

/** metres = yards * YARDS_TO_METERS */
export const YARDS_TO_METERS = 0.9144;

export const STORAGE_KEYS = {
  driveMeters: "rr_driverCarryMeters",
  distanceUnit: "rr_distanceUnit",
};

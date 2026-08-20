import {
  BADGE_THRESHOLDS,
  DRIVING_THRESHOLDS,
  MILESTONES,
  SKILL_BRACKETS,
  YARDS_TO_METERS,
} from "./data.js";

/** Eq. 1 — Baseline Riccio's Rule */
export function predictBaseline(gir) {
  return 95 - 2 * gir;
}

/** Eq. 9 — Advanced GIR + putts */
export function predictAdvanced(gir, putts) {
  return 58 + putts - (4 / 3) * gir;
}

/** Eq. 7 — Expected putts given GIR */
export function expectedPutts(gir) {
  return 37 - (2 / 3) * gir;
}

export function differential(actualScore, predictedScore) {
  return actualScore - predictedScore;
}

export function metersToYards(m) {
  return m / YARDS_TO_METERS;
}

export function yardsToMeters(y) {
  return y * YARDS_TO_METERS;
}

export function formatDistance(meters, unit) {
  if (meters == null || Number.isNaN(meters)) return "—";
  if (unit === "yd") {
    return `${Math.round(metersToYards(meters))} yds`;
  }
  return `${Math.round(meters)} m`;
}

export function getBadge(diff) {
  if (diff > BADGE_THRESHOLDS.leak) {
    return {
      id: "leak",
      label: "Short Game Leak",
      description:
        "You strike the ball well enough to score lower, but strokes are leaking around the green.",
      tone: "warning",
    };
  }
  if (diff < BADGE_THRESHOLDS.savior) {
    return {
      id: "savior",
      label: "Short Game Saviour",
      description:
        "Exceptional putting or chipping is rescuing weaker ball striking.",
      tone: "info",
    };
  }
  return {
    id: "balanced",
    label: "Balanced Game",
    description:
      "Your score matches your ball-striking capability — keep the balance.",
    tone: "success",
  };
}

export function fairwayPercentage(fir, rough, recovery) {
  const total = fir + rough + recovery;
  if (total <= 0) return null;
  return (fir / total) * 100;
}

export function recoveryPercentage(fir, rough, recovery) {
  const total = fir + rough + recovery;
  if (total <= 0) return null;
  return (recovery / total) * 100;
}

export function getMilestoneStatus(gir) {
  let currentIndex = -1;
  for (let i = 0; i < MILESTONES.length; i += 1) {
    if (gir >= MILESTONES[i].girRequired) {
      currentIndex = i;
    }
  }
  const nextIndex =
    currentIndex + 1 < MILESTONES.length ? currentIndex + 1 : null;
  return {
    currentIndex,
    nextIndex,
    current: currentIndex >= 0 ? MILESTONES[currentIndex] : null,
    next: nextIndex !== null ? MILESTONES[nextIndex] : null,
    girToNext:
      nextIndex !== null
        ? Math.max(0, MILESTONES[nextIndex].girRequired - gir)
        : 0,
  };
}

/**
 * Rank nearest skill bracket (score + GIR primary; Advanced stats as tie-breakers).
 */
export function getSkillProxy({
  actualScore,
  gir,
  putts,
  fairwayPct,
  recoveryPct,
  driveMeters,
}) {
  let best = null;
  let bestScore = Infinity;

  for (const b of SKILL_BRACKETS) {
    let dist =
      Math.abs(actualScore - b.targetScore) * 1.2 + Math.abs(gir - b.gir) * 2.5;

    if (putts != null) {
      dist += Math.abs(putts - b.putts) * 0.8;
    }
    if (fairwayPct != null) {
      dist += Math.abs(fairwayPct - b.fairwayPct) * 0.15;
    }
    if (recoveryPct != null) {
      dist += Math.abs(recoveryPct - b.recoveryPct) * 0.2;
    }
    if (driveMeters != null) {
      dist += Math.abs(driveMeters - b.driveMeters) / 25;
    }

    if (dist < bestScore) {
      bestScore = dist;
      best = b;
    }
  }

  return {
    bracket: best,
    label: best ? `${best.label} (${best.hcpBand})` : "—",
    disclaimer:
      "Skill-bracket only — not an official Handicap Index.",
  };
}

/** Nearest drive bracket for carry ladder highlighting */
export function nearestDriveBracket(driveMeters) {
  if (driveMeters == null) return null;
  let best = null;
  let bestDelta = Infinity;
  for (const b of SKILL_BRACKETS) {
    const delta = Math.abs(driveMeters - b.driveMeters);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = b;
    }
  }
  return best;
}

export function buildInsight({
  badge,
  gir,
  milestones,
  fir,
  rough,
  recovery,
  fairwayPct,
  recoveryPct,
  showEq7,
  puttGap,
  driveMeters,
  skillProxy,
}) {
  const lines = [];
  const teeTotal = fir + rough + recovery;
  const {
    recoveryCountBad,
    strongGir,
    roughHigh,
    fairwayPctWarn,
    minTeeShotsForPct,
    puttGapLeak,
    puttGapSavior,
  } = DRIVING_THRESHOLDS;

  if (recovery > recoveryCountBad) {
    const strongIrons = gir >= strongGir;
    lines.push({
      title: strongIrons ? "Tee Box Bleed" : "Penalty trouble off the tee",
      body: strongIrons
        ? "Your iron play is strong, but penalty strokes off the tee are erasing your hard work. Consider hitting a 3-wood or hybrid for safety on tight par 4s."
        : "More than two recovery/penalty tee shots is a round-killer. Prefer a club you can keep in play — especially on tight holes — before chasing distance.",
      priority: "high",
    });
  } else if (
    recoveryPct != null &&
    teeTotal >= minTeeShotsForPct &&
    recoveryPct >= 21
  ) {
    lines.push({
      title: "High recovery/penalty rate",
      body: `About ${Math.round(recoveryPct)}% of tracked tee shots ended in recovery or penalty — in Arccos skill curves that sit towards higher-handicap patterns. Prioritise fairways over max distance.`,
      priority: "warning",
    });
  }

  if (
    rough >= roughHigh ||
    (fairwayPct != null &&
      teeTotal >= minTeeShotsForPct &&
      fairwayPct < fairwayPctWarn)
  ) {
    lines.push({
      title: "Tighten tee dispersion",
      body: "Too many safe misses (rough/first cut) or a low fairway rate is costing GIR chances. On the range, work driver into a roughly 40–60-yard left–right window and aim for the fat of the fairway.",
      priority: "warning",
    });
  }

  if (showEq7 && puttGap != null) {
    if (puttGap >= puttGapLeak) {
      lines.push({
        title: "Expected putts (Eq. 7): above",
        body: `You are ${round1(puttGap)} putts above expectation for ${gir} GIR — short-game and lag putting should move the needle fastest.`,
        priority: "high",
      });
    } else if (puttGap <= puttGapSavior) {
      lines.push({
        title: "Expected putts (Eq. 7): below",
        body: `You are ${round1(Math.abs(puttGap))} putts below expectation. Protect that edge, but invest practice in approaches so more holes start with a GIR.`,
        priority: "normal",
      });
    }
  }

  if (badge.id === "leak") {
    lines.push({
      title: "Practice focus: short game",
      body: "Prioritise chips, pitches, and lag putting. Your GIR suggests a lower score is available once you stop giving strokes away around the green.",
      priority: "high",
    });
  } else if (badge.id === "savior") {
    lines.push({
      title: "Practice focus: ball striking",
      body: "Your short game is carrying you. Aim approaches at the fat of the green and work contact drills so more holes start with a GIR putt.",
      priority: "high",
    });
  } else {
    lines.push({
      title: "Practice focus: maintain balance",
      body: "Keep pairing solid approach targets with tidy short-game routines. Small GIR gains will move the scorecard fastest.",
      priority: "normal",
    });
  }

  if (
    driveMeters != null &&
    skillProxy?.bracket &&
    driveMeters < skillProxy.bracket.driveMeters - 15
  ) {
    lines.push({
      title: "Carry vs skill bracket",
      body: `Your driver carry (~${Math.round(driveMeters)} m) sits below the typical ${skillProxy.bracket.label} mark (~${skillProxy.bracket.driveMeters} m). Speed work helps long-term, but keeping the ball in play still protects score.`,
      priority: "normal",
    });
  }

  if (milestones.next) {
    lines.push({
      title: `Next milestone: ${milestones.next.label}`,
      body: `You need about ${milestones.girToNext} more GIR per round (target ${milestones.next.girRequired} GIR) to unlock ${milestones.next.label} territory under Baseline (Eq. 1).`,
      priority: "normal",
    });
  } else if (gir >= 13) {
    lines.push({
      title: "Elite GIR territory",
      body: "You're at or past the Break 70 GIR bar. Protect fairways and keep first putts inside makeable range.",
      priority: "normal",
    });
  }

  return lines;
}

/**
 * @param {{
 *   mode: 'baseline'|'advanced',
 *   actualScore: number,
 *   gir: number,
 *   putts?: number|null,
 *   fir?: number,
 *   rough?: number,
 *   recovery?: number,
 *   showEq7?: boolean,
 *   driveMeters?: number|null,
 * }} input
 */
export function diagnose(input) {
  const gir = clamp(input.gir, 0, 18);
  const actualScore = clamp(input.actualScore, 50, 150);
  const putts =
    input.putts == null || Number.isNaN(input.putts)
      ? null
      : clamp(input.putts, 10, 60);
  const fir = clamp(input.fir ?? 0, 0, 14);
  const rough = clamp(input.rough ?? 0, 0, 14);
  const recovery = clamp(input.recovery ?? 0, 0, 14);
  const showEq7 = Boolean(input.showEq7);
  const driveMeters =
    input.driveMeters == null || Number.isNaN(input.driveMeters)
      ? null
      : clamp(input.driveMeters, 100, 350);

  const predicted =
    input.mode === "advanced" && putts != null
      ? predictAdvanced(gir, putts)
      : predictBaseline(gir);

  const diff = differential(actualScore, predicted);
  const badge = getBadge(diff);
  const milestones = getMilestoneStatus(gir);
  const fairwayPct = fairwayPercentage(fir, rough, recovery);
  const recoveryPct = recoveryPercentage(fir, rough, recovery);
  const expPutts = putts != null ? expectedPutts(gir) : null;
  const puttGap = putts != null && expPutts != null ? putts - expPutts : null;

  const skillProxy = getSkillProxy({
    actualScore,
    gir,
    putts: input.mode === "advanced" ? putts : null,
    fairwayPct: input.mode === "advanced" ? fairwayPct : null,
    recoveryPct: input.mode === "advanced" ? recoveryPct : null,
    driveMeters: input.mode === "advanced" ? driveMeters : null,
  });

  const driveBracket = nearestDriveBracket(driveMeters);

  const insights = buildInsight({
    badge,
    gir,
    milestones,
    fir,
    rough,
    recovery,
    fairwayPct,
    recoveryPct,
    showEq7: input.mode === "advanced" && showEq7,
    puttGap,
    driveMeters: input.mode === "advanced" ? driveMeters : null,
    skillProxy,
  });

  return {
    mode: input.mode,
    gir,
    actualScore,
    putts,
    fir,
    rough,
    recovery,
    predictedScore: round1(predicted),
    differential: round1(diff),
    badge,
    milestones,
    fairwayPct: fairwayPct == null ? null : round1(fairwayPct),
    recoveryPct: recoveryPct == null ? null : round1(recoveryPct),
    expectedPutts: expPutts == null ? null : round1(expPutts),
    puttGap: puttGap == null ? null : round1(puttGap),
    showEq7: input.mode === "advanced" && showEq7,
    driveMeters,
    driveBracket,
    skillProxy,
    insights,
    formulaLabel:
      input.mode === "advanced" && putts != null
        ? "Advanced (Eq. 9) (GIR + putts)"
        : "Baseline (Eq. 1) (GIR only)",
    formulaText:
      input.mode === "advanced" && putts != null
        ? `58 + ${putts} − (4/3)×${gir}`
        : `95 − 2×${gir}`,
  };
}

function clamp(value, min, max) {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

/**
 * Tee Box Helper — Yes/No decision tree (loosely based on DECADE Golf tee strategy).
 */
import { metersToYards, yardsToMeters } from "./calc.js";

/** Decade tree thresholds (yards). Displayed as-is in yd; converted + rounded to 5 m in metres. */
const YD_65 = 65;
const YD_40 = 40;
const YD_AIM_LO = 25;
const YD_AIM_HI = 30;

/**
 * Round a burnt-in converted distance to the nearest 0 or 5.
 * @param {number} n
 */
function roundNice5(n) {
  return Math.round(n / 5) * 5;
}

/**
 * Format a burnt-in yard threshold in the active unit (nearest 5 when converted).
 * @param {number} yards
 * @param {'m'|'yd'} unit
 */
function fmtBurntYards(yards, unit) {
  if (unit === "yd") return `${yards} yd`;
  return `${roundNice5(yardsToMeters(yards))} m`;
}

/**
 * @typedef {{ id: string, question: (ctx: TeeCtx) => string, yes?: string, no?: string, result?: TeeResult }} TeeNode
 * @typedef {{ club: 'driver'|'wood'|'alternate'|'tight', title: string, body: string | ((ctx: TeeCtx) => string), tone: string }} TeeResult
 * @typedef {{ unit: 'm'|'yd', driverMeters: number|null, hazardMeters: number|null, fmt: (m: number|null) => string, fmtDriver: () => string, fmtHazard: () => string }} TeeCtx
 */

function dispersionQuestion(unit) {
  return unit === "m"
    ? "Is your driver dispersion roughly within a 40–60 metres left–right window (or better)?"
    : "Is your driver dispersion roughly within a 45–65 yard left–right window (or better)?";
}

/** @type {Record<string, TeeNode>} */
const NODES = {
  w65: {
    id: "w65",
    question: (ctx) => {
      const n =
        ctx.unit === "yd" ? YD_65 : roundNice5(yardsToMeters(YD_65));
      const unitWord = ctx.unit === "yd" ? "yards" : "metres";
      return `Is there ${n}+ ${unitWord} of width in the landing zone between any adjacent penalty areas?`;
    },
    yes: "pinch",
    no: "woodClear",
  },
  pinch: {
    id: "pinch",
    question: (ctx) =>
      `Does the fairway narrow under ${fmtBurntYards(YD_40, ctx.unit)} in your driver land/roll zone?`,
    yes: "carryQ",
    no: "result_driver",
  },
  carryQ: {
    id: "carryQ",
    question: (ctx) => carryQuestion(ctx),
    yes: "result_driverAim",
    no: "nextCarry",
  },
  nextCarry: {
    id: "nextCarry",
    question: (ctx) => nextClubCarryQuestion(ctx),
    yes: "result_wood",
    no: "woodPinch",
  },
  woodPinch: {
    id: "woodPinch",
    question: () => "Will 3-wood also finish in that narrow fairway section?",
    yes: "result_driverAnyway",
    no: "result_wood",
  },
  woodClear: {
    id: "woodClear",
    question: () =>
      "Not a driver hole. Does 3-wood remove a hazard by staying short of it?",
    yes: "result_woodCentre",
    no: "nextClub",
  },
  nextClub: {
    id: "nextClub",
    question: () =>
      "Does a club shorter than 3-wood remove a hazard?",
    yes: "result_alt",
    no: "result_tight",
  },
  result_driver: {
    id: "result_driver",
    question: () => "",
    result: {
      club: "driver",
      title: "Take driver",
      body: "Width is there. Commit and find the fat of the fairway.",
      tone: "driver",
    },
  },
  result_driverAim: {
    id: "result_driverAim",
    question: () => "",
    result: {
      club: "driver",
      title: "Driver — aim off the in-play hazard",
      body: "Carry the clear side. Bias your pattern away from trouble still in play.",
      tone: "driver",
    },
  },
  result_driverAnyway: {
    id: "result_driverAnyway",
    question: () => "",
    result: {
      club: "driver",
      title: "Driver is still likely",
      body: "3-wood does not remove the trouble. Only club down if the hole is short and leaves a wedge.",
      tone: "driver",
    },
  },
  result_wood: {
    id: "result_wood",
    question: () => "",
    result: {
      club: "wood",
      title: "3-wood",
      body: "Safer play. Centre your pattern on the fat — or slightly off any hazard still in play.",
      tone: "wood",
    },
  },
  result_woodCentre: {
    id: "result_woodCentre",
    question: () => "",
    result: {
      club: "wood",
      title: "3-wood",
      body: (ctx) => {
        const aim =
          ctx.unit === "yd"
            ? `${YD_AIM_LO}–${YD_AIM_HI} yd`
            : `${Math.floor(yardsToMeters(YD_AIM_LO) / 5) * 5}–${Math.ceil(yardsToMeters(YD_AIM_HI) / 5) * 5} m`;
        return `Stay short of the hazard. Aim ~${aim} from any penalty still in play (match your miss).`;
      },
      tone: "wood",
    },
  },
  result_alt: {
    id: "result_alt",
    question: () => "",
    result: {
      club: "alternate",
      title: "Club down",
      body: "Shorter Fairway wood, Iron or hybrid that removes trouble to leave the best next shot.",
      tone: "alt",
    },
  },
  result_tight: {
    id: "result_tight",
    question: () => "",
    result: {
      club: "tight",
      title: "Tight hole — no easy answer",
      body: "Skip driver. Pick the club that leaves the simplest next shot.",
      tone: "tight",
    },
  },
};

function carryQuestion(ctx) {
  const h = ctx.fmtHazard();
  const d = ctx.fmtDriver();
  if (ctx.hazardMeters != null && ctx.driverMeters != null) {
    if (ctx.driverMeters + 0.5 >= ctx.hazardMeters) {
      return `Closest hazard carry ${h}. Will Driver (~${d}) clear it and stay safe?`;
    }
    return `Closest hazard carry ${h}. Driver (~${d}) is short — can you still clear and stay safe with driver?`;
  }
  if (ctx.hazardMeters != null) {
    return `Closest hazard at ${h}. Can driver clear it and stay safe?`;
  }
  return "Can you carry one-side trouble with driver and stay safe?";
}

function nextClubCarryQuestion(ctx) {
  const h = ctx.fmtHazard();
  if (ctx.hazardMeters != null) {
    return `Will your next club (e.g. 3-wood) carry past ${h}?`;
  }
  return "Will your next club carry the hazard that driver cannot?";
}

/**
 * Resolve routing for nodes that need context-aware next steps.
 * @param {string} answer 'yes'|'no'
 * @param {string} nodeId
 * @param {TeeCtx} ctx
 */
function nextNodeId(nodeId, answer, ctx) {
  void ctx;
  const node = NODES[nodeId];
  if (!node) return null;
  return answer === "yes" ? node.yes : node.no;
}

/**
 * @param {object} opts
 */
export function createTeeBoxHelper(opts) {
  const {
    root,
    getUnit,
    setUnit,
    loadDriveMeters,
    saveDriveMeters,
    formatDist,
  } = opts;

  const els = {
    driverCarry: root.querySelector("#teeDriverCarry"),
    hazardCarry: root.querySelector("#teeHazardCarry"),
    unitLabel: root.querySelector("#teeUnitLabel"),
    unitButtons: root.querySelectorAll("[data-tee-unit]"),
    hint: root.querySelector("#teeCarryHint"),
    dispersionGate: root.querySelector("#teeDispersionGate"),
    dispersionQuestion: root.querySelector("#teeDispersionQuestion"),
    dispersionYes: root.querySelector("#teeDispersionYes"),
    dispersionNo: root.querySelector("#teeDispersionNo"),
    questionCard: root.querySelector("#teeQuestionCard"),
    questionText: root.querySelector("#teeQuestionText"),
    resultCard: root.querySelector("#teeResultCard"),
    resultTitle: root.querySelector("#teeResultTitle"),
    resultBody: root.querySelector("#teeResultBody"),
    caution: root.querySelector("#teeCaution"),
    btnYes: root.querySelector("#teeYes"),
    btnNo: root.querySelector("#teeNo"),
    btnBack: root.querySelector("#teeBack"),
    btnRestart: root.querySelector("#teeRestart"),
    btnRestartResult: root.querySelector("#teeRestartResult"),
  };

  let history = [];
  let currentId = "w65";
  /** @type {'gate'|'tree'} */
  let phase = "gate";
  /** True when miss is outside the window (answered No). Advisory only — not used in results. */
  let wideMiss = false;
  /** @type {number|null} */
  let hazardMetersCache = null;

  function fmtRawInput(el, meters) {
    if (meters == null) return "—";
    const raw = el?.value;
    const n = Number(raw);
    const unit = getUnit() === "yd" ? "yd" : "m";
    if (raw !== "" && raw != null && Number.isFinite(n)) {
      return `${n} ${unit}`;
    }
    return formatDist(meters, getUnit());
  }

  function fmt(meters) {
    return fmtRawInput(null, meters);
  }

  function getCtx() {
    return {
      unit: getUnit(),
      driverMeters: readDriveMeters(),
      hazardMeters: readHazardMeters(),
      fmtDriver: () => fmtRawInput(els.driverCarry, readDriveMeters()),
      fmtHazard: () => fmtRawInput(els.hazardCarry, readHazardMeters()),
      fmt,
    };
  }

  function readDriveMeters() {
    const raw = els.driverCarry.value;
    if (raw === "" || raw == null) return loadDriveMeters();
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    return getUnit() === "yd" ? yardsToMeters(n) : n;
  }

  function readHazardMeters() {
    const raw = els.hazardCarry.value;
    if (raw === "" || raw == null) {
      hazardMetersCache = null;
      return null;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    hazardMetersCache = getUnit() === "yd" ? yardsToMeters(n) : n;
    return hazardMetersCache;
  }

  function syncUnitEchoes(unit) {
    const label = unit === "yd" ? "yds" : "m";
    if (els.unitLabel) els.unitLabel.textContent = label;
    root.querySelectorAll(".tee-unit-echo").forEach((el) => {
      el.textContent = label;
    });
  }

  function syncDriverFromStorage() {
    const meters = loadDriveMeters();
    const unit = getUnit();
    syncUnitEchoes(unit);
    els.unitButtons.forEach((btn) => {
      btn.setAttribute(
        "aria-pressed",
        btn.dataset.teeUnit === unit ? "true" : "false"
      );
    });
    if (meters == null) {
      if (!els.driverCarry.value) els.driverCarry.value = "";
    } else if (!els.driverCarry.dataset.touched) {
      els.driverCarry.value = String(
        Math.round(unit === "yd" ? metersToYards(meters) : meters)
      );
    } else {
      const driveM = loadDriveMeters();
      if (driveM != null) {
        els.driverCarry.value = String(
          Math.round(unit === "yd" ? metersToYards(driveM) : driveM)
        );
      }
    }
    if (hazardMetersCache != null) {
      els.hazardCarry.value = String(
        Math.round(
          unit === "yd"
            ? metersToYards(hazardMetersCache)
            : hazardMetersCache
        )
      );
    }
    updateHint();
    refreshDispersionCopy();
  }

  function refreshDispersionCopy() {
    if (els.dispersionQuestion) {
      els.dispersionQuestion.textContent = dispersionQuestion(getUnit());
    }
  }

  function updateHint() {
    const ctx = getCtx();
    if (!els.hint) return;
    if (ctx.hazardMeters == null || ctx.driverMeters == null) {
      els.hint.textContent =
        "Laser the closest carry hazard. Compare it to your driver carry.";
      return;
    }
    if (ctx.driverMeters + 0.5 >= ctx.hazardMeters) {
      els.hint.textContent = `Driver (~${ctx.fmtDriver()}) reaches hazard carry (${ctx.fmtHazard()}).`;
    } else {
      els.hint.textContent = `Driver (~${ctx.fmtDriver()}) is short of hazard (${ctx.fmtHazard()}). Next club may need to clear it.`;
    }
  }

  function showGate() {
    phase = "gate";
    history = [];
    currentId = "w65";
    if (els.dispersionGate) els.dispersionGate.hidden = false;
    if (els.questionCard) els.questionCard.hidden = true;
    if (els.resultCard) els.resultCard.hidden = true;
    if (els.caution) els.caution.hidden = true;
    refreshDispersionCopy();
  }

  function startTree(answeredWithinWindow) {
    // Outside the window (No) → show firm advisory. Does not change tree results.
    wideMiss = !answeredWithinWindow;
    phase = "tree";
    history = [];
    currentId = "w65";
    if (els.dispersionGate) els.dispersionGate.hidden = true;
    if (els.caution) els.caution.hidden = !wideMiss;
    showQuestion();
  }

  function showQuestion() {
    const node = NODES[currentId];
    if (!node) return;
    if (node.result) {
      showResult(node.result);
      return;
    }
    els.questionCard.hidden = false;
    els.resultCard.hidden = true;
    els.questionText.textContent = node.question(getCtx());
    els.btnBack.disabled = history.length === 0;
    if (els.caution) els.caution.hidden = !wideMiss;
  }

  function showResult(result) {
    const ctx = getCtx();
    els.questionCard.hidden = true;
    els.resultCard.hidden = false;
    els.resultCard.dataset.tone = result.tone;
    const title = result.title;
    const body =
      typeof result.body === "function" ? result.body(ctx) : result.body;
    els.resultTitle.textContent = title;
    els.resultBody.textContent = body;
    if (els.caution) els.caution.hidden = !wideMiss;
  }

  function go(answer) {
    const ctx = getCtx();
    const next = nextNodeId(currentId, answer, ctx);
    if (!next) return;
    history.push(currentId);
    currentId = next;
    const node = NODES[currentId];
    if (node?.result) {
      showResult(node.result);
    } else {
      showQuestion();
    }
  }

  function back() {
    if (history.length === 0) {
      showGate();
      return;
    }
    currentId = history.pop();
    showQuestion();
  }

  function restart() {
    wideMiss = false;
    showGate();
  }

  function onUnit(unit) {
    const driveM = readDriveMeters();
    const hazM = readHazardMeters();
    if (driveM != null) saveDriveMeters(driveM);
    if (hazM != null) hazardMetersCache = hazM;
    setUnit(unit);
    if (driveM != null) {
      els.driverCarry.value = String(
        Math.round(unit === "yd" ? metersToYards(driveM) : driveM)
      );
    }
    if (hazM != null) {
      els.hazardCarry.value = String(
        Math.round(unit === "yd" ? metersToYards(hazM) : hazM)
      );
    }
    syncUnitEchoes(unit);
    els.unitButtons.forEach((btn) => {
      btn.setAttribute(
        "aria-pressed",
        btn.dataset.teeUnit === unit ? "true" : "false"
      );
    });
    updateHint();
    refreshDispersionCopy();
    if (phase === "gate") return;
    if (!els.resultCard.hidden) return;
    showQuestion();
  }

  function bind() {
    els.dispersionYes?.addEventListener("click", () => startTree(true));
    els.dispersionNo?.addEventListener("click", () => startTree(false));
    els.btnYes?.addEventListener("click", () => go("yes"));
    els.btnNo?.addEventListener("click", () => go("no"));
    els.btnBack?.addEventListener("click", back);
    els.btnRestart?.addEventListener("click", restart);
    els.btnRestartResult?.addEventListener("click", restart);

    els.unitButtons.forEach((btn) => {
      btn.addEventListener("click", () => onUnit(btn.dataset.teeUnit));
    });

    els.driverCarry?.addEventListener("input", () => {
      els.driverCarry.dataset.touched = "1";
      const m = readDriveMeters();
      saveDriveMeters(m);
      updateHint();
    });
    els.hazardCarry?.addEventListener("input", updateHint);
  }

  bind();

  return {
    activate() {
      syncDriverFromStorage();
      showGate();
    },
    syncUnits: syncDriverFromStorage,
  };
}

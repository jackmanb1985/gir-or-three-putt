import { MILESTONES, SKILL_BRACKETS, STORAGE_KEYS } from "./data.js";
import {
  diagnose,
  formatDistance,
  metersToYards,
  yardsToMeters,
} from "./calc.js";

const els = {
  modeButtons: document.querySelectorAll("[data-mode]"),
  advancedBlocks: document.querySelectorAll(".rr-advanced-only"),
  panelCalculator: document.querySelector("#panel-calculator"),
  panelFormulas: document.querySelector("#panel-formulas"),
  actualScore: document.querySelector("#actualScore"),
  gir: document.querySelector("#gir"),
  putts: document.querySelector("#putts"),
  fir: document.querySelector("#fir"),
  rough: document.querySelector("#rough"),
  recovery: document.querySelector("#recovery"),
  driverCarry: document.querySelector("#driverCarry"),
  unitLabel: document.querySelector("#unitLabel"),
  unitButtons: document.querySelectorAll("[data-unit]"),
  distanceLadder: document.querySelector("#distanceLadder"),
  predicted: document.querySelector("#predictedScore"),
  differential: document.querySelector("#differential"),
  puttsDiffStat: document.querySelector("#puttsDiffStat"),
  puttsDiff: document.querySelector("#puttsDiff"),
  badge: document.querySelector("#badge"),
  badgeDesc: document.querySelector("#badgeDesc"),
  skillProxyLabel: document.querySelector("#skillProxyLabel"),
  skillProxyNote: document.querySelector("#skillProxyNote"),
  milestoneBody: document.querySelector("#milestoneBody"),
  benchmarks: document.querySelector("#benchmarks"),
  insights: document.querySelector("#insights"),
};

let mode = "baseline";
let distanceUnit = loadUnit();

function loadUnit() {
  try {
    const u = localStorage.getItem(STORAGE_KEYS.distanceUnit);
    return u === "yd" ? "yd" : "m";
  } catch {
    return "m";
  }
}

function saveUnit(unit) {
  try {
    localStorage.setItem(STORAGE_KEYS.distanceUnit, unit);
  } catch {
    /* ignore */
  }
}

function loadDriveMeters() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.driveMeters);
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function saveDriveMeters(meters) {
  try {
    if (meters == null) {
      localStorage.removeItem(STORAGE_KEYS.driveMeters);
    } else {
      localStorage.setItem(STORAGE_KEYS.driveMeters, String(meters));
    }
  } catch {
    /* ignore */
  }
}

function readNumber(el, fallback = 0) {
  const n = Number(el.value);
  return Number.isFinite(n) ? n : fallback;
}

function syncCarryInputFromStorage() {
  const meters = loadDriveMeters();
  if (meters == null) {
    els.driverCarry.value = "";
    return;
  }
  els.driverCarry.value = String(
    Math.round(distanceUnit === "yd" ? metersToYards(meters) : meters)
  );
}

function getDriveMetersFromInput() {
  const raw = els.driverCarry.value;
  if (raw === "" || raw == null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return distanceUnit === "yd" ? yardsToMeters(n) : n;
}

function getInputState() {
  return {
    mode,
    actualScore: readNumber(els.actualScore, 90),
    gir: readNumber(els.gir, 5),
    putts: mode === "advanced" ? readNumber(els.putts, 33) : null,
    fir: mode === "advanced" ? readNumber(els.fir, 5) : 0,
    rough: mode === "advanced" ? readNumber(els.rough, 5) : 0,
    recovery: mode === "advanced" ? readNumber(els.recovery, 1) : 0,
    showEq7: mode === "advanced",
    driveMeters: mode === "advanced" ? getDriveMetersFromInput() : null,
  };
}

function formatDiff(diff) {
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff}`;
}

function renderMilestones(result) {
  const { currentIndex, nextIndex } = result.milestones;
  els.milestoneBody.innerHTML = MILESTONES.map((m, index) => {
    const classes = [];
    if (index === currentIndex) classes.push("rr-current");
    if (index === nextIndex) classes.push("rr-next");
    const status =
      index === currentIndex
        ? "Current tier"
        : index === nextIndex
          ? "Next target"
          : result.gir >= m.girRequired
            ? "Cleared"
            : "Locked";
    return `<tr class="${classes.join(" ")}">
      <td>${m.label}</td>
      <td>${m.girRequired} GIR</td>
      <td>~${m.predictedScore}</td>
      <td>${status}</td>
    </tr>`;
  }).join("");
}

function meterWidth(userValue, maxScale) {
  const pct = Math.max(0, Math.min(100, (userValue / maxScale) * 100));
  return `${pct}%`;
}

function targetLeft(targetValue, maxScale) {
  return `${Math.max(0, Math.min(100, (targetValue / maxScale) * 100))}%`;
}

/** Soft tone vs bracket target. higherBetter=false for putts / recovery %. */
function meterTone(userValue, targetValue, higherBetter = true) {
  if (userValue == null || targetValue == null || Number.isNaN(userValue)) {
    return "ahead";
  }
  if (higherBetter) {
    return userValue >= targetValue ? "ahead" : "behind";
  }
  return userValue <= targetValue ? "ahead" : "behind";
}

function renderMeter(userDisplayWidth, targetLeftPct, tone) {
  return `<div class="rr-meter" data-tone="${tone}" aria-hidden="true">
    <span style="width:${userDisplayWidth}"></span>
    <i class="rr-meter-target" style="left:${targetLeftPct}"></i>
  </div>`;
}

function renderDistanceLadder(result) {
  if (mode !== "advanced") {
    els.distanceLadder.innerHTML = "";
    return;
  }

  const you = result.driveMeters;
  const nearestId = result.driveBracket?.id;

  els.distanceLadder.innerHTML = `
    <div class="rr-ladder-title">Carry vs skill brackets</div>
    <ul class="rr-ladder-list">
      ${SKILL_BRACKETS.map((b) => {
        const active = nearestId === b.id && you != null ? "rr-ladder-active" : "";
        return `<li class="${active}">
          <span>${b.label}</span>
          <strong>${formatDistance(b.driveMeters, distanceUnit)}</strong>
        </li>`;
      }).join("")}
    </ul>
    <p class="rr-ladder-you">
      ${
        you == null
          ? "Enter your carry to highlight the closest bracket."
          : `Your carry: <strong>${formatDistance(you, distanceUnit)}</strong>${
              result.driveBracket
                ? ` · closest to <strong>${result.driveBracket.label}</strong>`
                : ""
            }`
      }
    </p>
  `;
}

function renderBenchmarks(result) {
  const fairwayPct = result.fairwayPct ?? 0;
  const recoveryPct = result.recoveryPct ?? 0;
  const putts = result.putts ?? null;
  const drive = result.driveMeters;
  const isAdvanced = result.mode === "advanced";

  const advancedNote = isAdvanced
    ? ""
    : `<p class="rr-bench-blurb">Want putts, fairways, recovery and driver carry against these brackets? Switch to <strong>Advanced</strong> mode.</p>`;

  const brackets = SKILL_BRACKETS.map((b) => {
    const girBar = meterWidth(result.gir, 18);
    const girTarget = targetLeft(b.gir, 18);
    const girTone = meterTone(result.gir, b.gir, true);

    const scoreHead = `<div class="rr-bench-head"><strong>${b.label}</strong><span>${b.hcpBand} · target ~${b.targetScore}</span></div>`;

    if (!isAdvanced) {
      return `<article class="rr-bench" aria-label="${b.label} comparison">
        ${scoreHead}
        <div class="rr-bench-head"><span>GIR</span><span>You ${result.gir} · Target ~${b.gir}</span></div>
        ${renderMeter(girBar, girTarget, girTone)}
      </article>`;
    }

    const puttTone = meterTone(putts, b.putts, false);
    const puttSection = `<div class="rr-bench-head"><span>Putts (lower is better)</span><span>You ${putts} · Target ~${b.putts}</span></div>
           ${renderMeter(
             meterWidth(Math.max(0, 45 - putts), 35),
             targetLeft(Math.max(0, 45 - b.putts), 35),
             puttTone
           )}`;

    const fairwayTone = meterTone(fairwayPct, b.fairwayPct, true);
    const recoveryTone = meterTone(recoveryPct, b.recoveryPct, false);
    const fairwaySection = `<div class="rr-bench-head"><span>Fairways</span><span>You ${fairwayPct}% · Target ~${b.fairwayPct}%</span></div>
           ${renderMeter(meterWidth(fairwayPct, 100), targetLeft(b.fairwayPct, 100), fairwayTone)}
           <div class="rr-bench-head"><span>Recovery / penalty</span><span>You ${recoveryPct}% · Target ~${b.recoveryPct}%</span></div>
           ${renderMeter(
             meterWidth(Math.max(0, 50 - recoveryPct), 50),
             targetLeft(Math.max(0, 50 - b.recoveryPct), 50),
             recoveryTone
           )}`;

    const driveSection =
      drive == null
        ? `<div class="rr-bench-head"><span>Driver carry</span><span>Target ${formatDistance(b.driveMeters, distanceUnit)}</span></div>
             <div class="hint" style="color:var(--rr-muted);font-size:0.8rem;">Add carry above to compare</div>`
        : `<div class="rr-bench-head"><span>Driver carry</span><span>You ${formatDistance(drive, distanceUnit)} · Target ${formatDistance(b.driveMeters, distanceUnit)}</span></div>
           ${renderMeter(
             meterWidth(drive, 300),
             targetLeft(b.driveMeters, 300),
             meterTone(drive, b.driveMeters, true)
           )}`;

    return `<article class="rr-bench" aria-label="${b.label} comparison">
      ${scoreHead}
      <div class="rr-bench-head"><span>GIR</span><span>You ${result.gir} · Target ~${b.gir}</span></div>
      ${renderMeter(girBar, girTarget, girTone)}
      ${puttSection}
      ${fairwaySection}
      ${driveSection}
    </article>`;
  }).join("");

  els.benchmarks.innerHTML = advancedNote + brackets;
}

function renderInsights(result) {
  els.insights.innerHTML = result.insights
    .map(
      (item) => `<article class="rr-insight" data-priority="${item.priority}">
        <h3>${item.title}</h3>
        <p>${item.body}</p>
      </article>`
    )
    .join("");
}

function formatPuttsDiff(gap) {
  if (gap == null || Number.isNaN(gap)) return "—";
  const rounded = Math.round(gap * 10) / 10;
  if (Math.abs(rounded) < 0.05) return "even";
  return formatDiff(rounded);
}

function renderPuttsDiff(result) {
  const show =
    result.mode === "advanced" &&
    result.putts != null &&
    result.puttGap != null;
  if (els.puttsDiffStat) {
    els.puttsDiffStat.hidden = !show;
  }
  if (els.puttsDiff) {
    els.puttsDiff.textContent = show ? formatPuttsDiff(result.puttGap) : "—";
  }
}

function render() {
  if (mode === "formulas") return;

  const result = diagnose(getInputState());

  els.predicted.textContent = String(result.predictedScore);
  els.differential.textContent = formatDiff(result.differential);
  els.badge.textContent = result.badge.label;
  els.badge.dataset.tone = result.badge.tone;
  els.badgeDesc.textContent = result.badge.description;

  els.skillProxyLabel.textContent = result.skillProxy.label;
  els.skillProxyNote.textContent = result.skillProxy.disclaimer;

  renderPuttsDiff(result);
  renderMilestones(result);
  renderBenchmarks(result);
  renderDistanceLadder(result);
  renderInsights(result);
}

function setDistanceUnit(unit) {
  const meters = getDriveMetersFromInput() ?? loadDriveMeters();
  distanceUnit = unit === "yd" ? "yd" : "m";
  saveUnit(distanceUnit);
  els.unitLabel.textContent = distanceUnit === "yd" ? "yds" : "m";
  els.unitButtons.forEach((btn) => {
    const pressed = btn.dataset.unit === distanceUnit;
    btn.setAttribute("aria-pressed", pressed ? "true" : "false");
  });
  if (meters != null) {
    els.driverCarry.value = String(
      Math.round(distanceUnit === "yd" ? metersToYards(meters) : meters)
    );
  }
  render();
}

function setMode(nextMode) {
  mode = nextMode;
  const isFormulas = mode === "formulas";
  const isAdvanced = mode === "advanced";

  els.modeButtons.forEach((btn) => {
    const selected = btn.dataset.mode === mode;
    btn.setAttribute("aria-selected", selected ? "true" : "false");
  });

  if (els.panelCalculator) els.panelCalculator.hidden = isFormulas;
  if (els.panelFormulas) els.panelFormulas.hidden = !isFormulas;

  els.advancedBlocks.forEach((block) => {
    block.hidden = !isAdvanced;
  });

  const labelledBy =
    mode === "advanced"
      ? "tab-advanced"
      : mode === "formulas"
        ? "tab-formulas"
        : "tab-baseline";
  document
    .querySelector("#panel-main")
    ?.setAttribute("aria-labelledby", labelledBy);

  render();
}

function bind() {
  els.modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });

  els.unitButtons.forEach((btn) => {
    btn.addEventListener("click", () => setDistanceUnit(btn.dataset.unit));
  });

  [
    els.actualScore,
    els.gir,
    els.putts,
    els.fir,
    els.rough,
    els.recovery,
  ].forEach((input) => {
    input.addEventListener("input", render);
    input.addEventListener("change", render);
  });

  els.driverCarry.addEventListener("input", () => {
    const meters = getDriveMetersFromInput();
    saveDriveMeters(meters);
    render();
  });
  els.driverCarry.addEventListener("change", () => {
    const meters = getDriveMetersFromInput();
    saveDriveMeters(meters);
    render();
  });
}

syncCarryInputFromStorage();
els.unitLabel.textContent = distanceUnit === "yd" ? "yds" : "m";
els.unitButtons.forEach((btn) => {
  btn.setAttribute(
    "aria-pressed",
    btn.dataset.unit === distanceUnit ? "true" : "false"
  );
});

bind();
setMode("baseline");

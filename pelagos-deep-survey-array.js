// Haven's Reach — Pelagos Station Development #1
// Saeli can invite an established operator to help expand Pelagos's analytical capability.
// The completed Deep Survey Array quietly remembers selected field observations and,
// after a short delay, lets Pelagos explain more about what the player already found.

const PELAGOS_ARRAY_COST = 3800;
const PELAGOS_ARRAY_COMPONENTS = 2;
const PELAGOS_ANALYSIS_CHANCE = 0.60;

function ensurePelagosSurveyArrayState() {
  ensureNpcState();
  const saeli = state.npcs?.saeli;
  if (!saeli) return;
  if (!saeli.memory || typeof saeli.memory !== "object") saeli.memory = {};
  if (saeli.memory.deepSurveyArrayCompleted !== true) saeli.memory.deepSurveyArrayCompleted = false;
  if (!Number.isFinite(saeli.memory.deepSurveyArrayLastDeclinedTrip)) saeli.memory.deepSurveyArrayLastDeclinedTrip = -99;
  if (!Number.isFinite(saeli.memory.deepSurveyArrayFundedTrip)) saeli.memory.deepSurveyArrayFundedTrip = -99;
  if (!Number.isFinite(saeli.memory.deepSurveyArrayAnalyses)) saeli.memory.deepSurveyArrayAnalyses = 0;
  if (saeli.memory.deepSurveyPendingAnalysis === undefined) saeli.memory.deepSurveyPendingAnalysis = null;
}

function pelagosSurveyArrayEligible() {
  ensurePelagosSurveyArrayState();
  const saeli = state.npcs?.saeli;
  return Boolean(
    saeli?.met &&
    !saeli.memory.deepSurveyArrayCompleted &&
    saeli.relationship >= 2
  );
}

function pelagosSurveyArrayPending() {
  if (!pelagosSurveyArrayEligible()) return false;
  const trip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
  return trip - state.npcs.saeli.memory.deepSurveyArrayLastDeclinedTrip >= 2;
}

function pelagosSurveyArrayShortfall() {
  const missing = [];
  if (state.credits < PELAGOS_ARRAY_COST) missing.push(`${credits(PELAGOS_ARRAY_COST - state.credits)} more credits`);
  const owned = state.cargo.sensorComponents || 0;
  if (owned < PELAGOS_ARRAY_COMPONENTS) missing.push(`${PELAGOS_ARRAY_COMPONENTS - owned} more Sensor Component${PELAGOS_ARRAY_COMPONENTS - owned === 1 ? "" : "s"}`);
  return missing;
}

function pelagosObservationEligible(def) {
  if (!def) return false;
  return ["survey", "empty", "resource", "breadcrumb"].includes(def.outcome);
}

function maybeQueuePelagosAnalysis(siteId, def) {
  ensurePelagosSurveyArrayState();
  const memory = state.npcs?.saeli?.memory;
  if (!memory?.deepSurveyArrayCompleted || memory.deepSurveyPendingAnalysis) return;
  if (!pelagosObservationEligible(def) || Math.random() >= PELAGOS_ANALYSIS_CHANCE) return;

  const trip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
  const delay = Math.random() < 0.5 ? 2 : 3;
  memory.deepSurveyPendingAnalysis = {
    siteId,
    name: def.name,
    type: def.type,
    outcome: def.outcome,
    description: def.description,
    gatheredTrip: trip,
    readyTrip: trip + delay
  };
  saveState();
}

function pelagosAnalysisReady() {
  ensurePelagosSurveyArrayState();
  if (state.location !== "pelagos") return false;
  const pending = state.npcs?.saeli?.memory?.deepSurveyPendingAnalysis;
  if (!pending) return false;
  const trip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
  return trip >= pending.readyTrip;
}

function pelagosAnalysisText(observation) {
  const name = observation?.name || "the field observation";
  const texts = {
    survey: `Saeli has finished comparing your readings from ${name} against Pelagos's longer survey record. The return was real, but much of what looked irregular at close range resolves into a stable environmental pattern when the observations are layered together. The important result is not a new destination; it is that Pelagos can now classify the phenomenon instead of leaving it as an unexplained sensor contact.`,
    empty: `Saeli has finished working through the records from ${name}. The lack of an obvious find was useful data after all. Pelagos can now show that the repeated return came from an old, degraded navigation signature rather than an active installation. What looked like an unanswered mystery in the field now has a plausible history.`,
    resource: `Saeli has finished comparing the readings from ${name} with Pelagos's mineral and survey archive. The concentration was genuine, but the broader pattern shows why remote readings could not tell the whole story. Your close pass gives the survey teams a much better reference for distinguishing similar signatures elsewhere.`,
    breadcrumb: `Saeli has finished cross-checking the records tied to ${name}. The old traffic trace was not random duplication: several independent records were preserving pieces of the same retired route history. Pelagos cannot turn that into a new charted destination, but it can finally explain why the vector kept reappearing in otherwise unrelated data.`
  };
  return texts[observation?.outcome] || `Saeli has finished comparing your observations from ${name} with Pelagos's survey archive. The deeper analysis gives the station a clearer explanation of what you encountered, even though it does not point to a new destination or immediate profit.`;
}

function openPelagosAnalysis() {
  const observation = state.npcs?.saeli?.memory?.deepSurveyPendingAnalysis;
  if (!observation) return;
  el("encounterTitle").textContent = "Deep Survey Array — Analysis Ready";
  el("encounterText").textContent = pelagosAnalysisText(observation);
  el("encounterChoices").innerHTML = `
    <button class="secondary" type="button" onclick="resolveEncounter('pelagosAnalysisReview')">Review Saeli's conclusion</button>`;
  el("encounterDialog").showModal();
}

// Capture selected observations after the field system itself has successfully resolved them.
const resolveFieldSiteBeforePelagosArray = resolveFieldSite;
resolveFieldSite = function resolveFieldSiteWithPelagosAnalysis(id, resultText) {
  const def = typeof FIELD_NETWORK_SITES !== "undefined" ? FIELD_NETWORK_SITES[id] : null;
  const record = state.fieldNetwork?.sites?.[id];
  const wasResolved = Boolean(record?.resolved);
  const result = resolveFieldSiteBeforePelagosArray(id, resultText);
  const nowResolved = Boolean(state.fieldNetwork?.sites?.[id]?.resolved);
  if (!wasResolved && nowResolved && def) maybeQueuePelagosAnalysis(id, def);
  return result;
};

const npcOpportunityAvailableBeforePelagosArray = npcOpportunityAvailable;
npcOpportunityAvailable = function npcOpportunityAvailableWithPelagosArray(id) {
  if (id === "saeli" && (pelagosSurveyArrayPending() || pelagosAnalysisReady())) return true;
  return npcOpportunityAvailableBeforePelagosArray(id);
};

if (typeof npcOpportunitySignalToken === "function") {
  const npcOpportunitySignalTokenBeforePelagosArray = npcOpportunitySignalToken;
  npcOpportunitySignalToken = function npcOpportunitySignalTokenWithPelagosArray(id) {
    const base = npcOpportunitySignalTokenBeforePelagosArray(id);
    if (id === "saeli" && pelagosSurveyArrayPending()) return `${base || "saeli"}:deep-survey-array`;
    if (id === "saeli" && pelagosAnalysisReady()) return `${base || "saeli"}:survey-analysis-ready`;
    return base;
  };
}

const openNpcInteractionBeforePelagosArray = openNpcInteraction;
openNpcInteraction = function openNpcInteractionWithPelagosArray(id) {
  ensurePelagosSurveyArrayState();
  if (id !== "saeli") return openNpcInteractionBeforePelagosArray(id);

  if (pelagosSurveyArrayPending()) {
    el("encounterTitle").textContent = "Saeli Ren — Deep Survey Array";
    el("encounterText").textContent = `Saeli has been trying to expand Pelagos's ability to interpret the observations independent ships bring home. The station already gathers more survey fragments than its present analytical equipment can compare properly. Pelagos can provide the existing array, archive access, and survey staff, but the expansion still needs capital and high-grade sensor hardware. A contribution of ${credits(PELAGOS_ARRAY_COST)} and ${PELAGOS_ARRAY_COMPONENTS} Sensor Components would put the deeper analysis capability into service.`;
    el("encounterChoices").innerHTML = `
      <button class="secondary" type="button" onclick="resolveEncounter('pelagosArrayAccept')">Contribute ${credits(PELAGOS_ARRAY_COST)} + ${PELAGOS_ARRAY_COMPONENTS} Sensor Components</button>
      <button class="secondary" type="button" onclick="resolveEncounter('pelagosArrayLater')">Not right now</button>`;
    el("encounterDialog").showModal();
    return;
  }

  if (pelagosAnalysisReady()) return openPelagosAnalysis();
  return openNpcInteractionBeforePelagosArray(id);
};

const resolveEncounterBeforePelagosArray = resolveEncounter;
resolveEncounter = function resolveEncounterWithPelagosArray(action) {
  ensurePelagosSurveyArrayState();

  if (action === "pelagosArrayAccept") {
    const missing = pelagosSurveyArrayShortfall();
    if (missing.length) {
      addLog(`SAELI REN — The Deep Survey Array expansion remains possible, but you still need ${missing.join(" and ")}. Pelagos can hold the plan until the resources are available.`);
      saveState();
      if (el("encounterDialog").open) el("encounterDialog").close();
      render();
      return;
    }
    state.credits -= PELAGOS_ARRAY_COST;
    state.cargo.sensorComponents -= PELAGOS_ARRAY_COMPONENTS;
    if (!state.cargo.sensorComponents) delete state.cargo.sensorComponents;
    state.npcs.saeli.memory.deepSurveyArrayCompleted = true;
    state.npcs.saeli.memory.deepSurveyArrayFundedTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
    state.npcs.saeli.relationship += 1;
    addLog(`PELAGOS — You committed ${credits(PELAGOS_ARRAY_COST)} and ${PELAGOS_ARRAY_COMPONENTS} Sensor Components to the Deep Survey Array. Pelagos can now compare selected field observations against its wider survey archive instead of leaving them as isolated readings.`);
    saveState();
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
    return;
  }

  if (action === "pelagosArrayLater") {
    state.npcs.saeli.memory.deepSurveyArrayLastDeclinedTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
    addLog("Saeli leaves the Deep Survey Array proposal open. Pelagos can continue working with its existing analytical equipment for now.");
    saveState();
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
    return;
  }

  if (action === "pelagosAnalysisReview") {
    const observation = state.npcs.saeli.memory.deepSurveyPendingAnalysis;
    if (observation) {
      state.npcs.saeli.memory.deepSurveyArrayAnalyses += 1;
      state.npcs.saeli.memory.deepSurveyPendingAnalysis = null;
      addLog(`DEEP SURVEY ARRAY — Pelagos completed its deeper analysis of ${observation.name}. The result added understanding rather than another destination or immediate payout.`);
    }
    saveState();
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
    return;
  }

  return resolveEncounterBeforePelagosArray(action);
};

const npcCallbackTextBeforePelagosArray = npcCallbackText;
npcCallbackText = function npcCallbackTextWithPelagosArray(id) {
  const base = npcCallbackTextBeforePelagosArray(id);
  if (id !== "saeli") return base;
  ensurePelagosSurveyArrayState();
  if (!state.npcs.saeli.memory.deepSurveyArrayCompleted) return base;
  return `${base} Saeli also remembers that you helped Pelagos expand its Deep Survey Array, giving the station a better way to turn scattered field observations into understanding rather than leaving them as isolated readings.`;
};

const renderOverviewBeforePelagosArray = renderOverview;
renderOverview = function renderOverviewWithPelagosArray() {
  renderOverviewBeforePelagosArray();
  ensurePelagosSurveyArrayState();
  if (state.location !== "pelagos" || !state.npcs?.saeli?.memory.deepSurveyArrayCompleted) return;
  const grid = view.querySelector(".card-grid");
  if (!grid || grid.querySelector("[data-pelagos-deep-survey-array]")) return;
  grid.insertAdjacentHTML("beforeend", `
    <article class="info-card" data-pelagos-deep-survey-array>
      <p class="eyebrow">LOCAL IMPROVEMENT</p>
      <h3>Deep Survey Array</h3>
      <p>Pelagos now compares selected frontier observations against a wider survey archive instead of treating each reading in isolation.</p>
      <p class="muted small">You helped Saeli expand the array's analytical capability. Some observations gathered in the field can now produce deeper answers after Pelagos has had time to study them.</p>
    </article>`);
};

ensurePelagosSurveyArrayState();
saveState();

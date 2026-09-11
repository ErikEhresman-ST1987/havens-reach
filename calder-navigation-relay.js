// Haven's Reach — Calder's Drift Station Development #1
// Orin can invite an established operator to restore Calder's navigation relay.
// The completed relay occasionally turns fragmentary navigation data into a field lead,
// with some analyses remaining inconclusive. Future permanent-system discovery is parked.

const CALDER_RELAY_COST = 3500;
const CALDER_RELAY_SENSORS = 2;
const CALDER_RELAY_QUIET_TRIPS = 3;
const CALDER_RELAY_SUCCESS_CHANCE = 0.75;

function ensureCalderNavigationRelayState() {
  ensureNpcState();
  const orin = state.npcs?.orin;
  if (!orin) return;
  if (!orin.memory || typeof orin.memory !== "object") orin.memory = {};
  if (orin.memory.navigationRelayCompleted !== true) orin.memory.navigationRelayCompleted = false;
  if (!Number.isFinite(orin.memory.navigationRelayLastDeclinedTrip)) orin.memory.navigationRelayLastDeclinedTrip = -99;
  if (!Number.isFinite(orin.memory.navigationRelayFundedTrip)) orin.memory.navigationRelayFundedTrip = -99;
  if (!Number.isFinite(orin.memory.navigationRelayLastAnalysisTrip)) orin.memory.navigationRelayLastAnalysisTrip = -99;
  if (!Number.isFinite(orin.memory.navigationRelayAnalyses)) orin.memory.navigationRelayAnalyses = 0;
  if (!Number.isFinite(orin.memory.navigationRelaySuccessfulLeads)) orin.memory.navigationRelaySuccessfulLeads = 0;
  if (!Object.prototype.hasOwnProperty.call(orin.memory, "navigationRelayPending")) orin.memory.navigationRelayPending = null;
}

function calderNavigationRelayEligible() {
  ensureCalderNavigationRelayState();
  const orin = state.npcs?.orin;
  return Boolean(
    orin?.met &&
    !orin.memory.navigationRelayCompleted &&
    orin.relationship >= 2
  );
}

function calderNavigationRelayPending() {
  if (!calderNavigationRelayEligible()) return false;
  const trip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
  return trip - state.npcs.orin.memory.navigationRelayLastDeclinedTrip >= 2;
}

function calderNavigationRelayShortfall() {
  const missing = [];
  if (state.credits < CALDER_RELAY_COST) missing.push(`${credits(CALDER_RELAY_COST - state.credits)} more credits`);
  const owned = state.cargo.sensorComponents || 0;
  if (owned < CALDER_RELAY_SENSORS) missing.push(`${CALDER_RELAY_SENSORS - owned} more Sensor Component${CALDER_RELAY_SENSORS - owned === 1 ? "" : "s"}`);
  return missing;
}

function calderRelayAnalysisAvailable() {
  ensureCalderNavigationRelayState();
  const orin = state.npcs?.orin;
  if (!orin?.memory.navigationRelayCompleted || state.location !== "caldersDrift") return false;
  const trip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
  const last = Math.max(orin.memory.navigationRelayFundedTrip, orin.memory.navigationRelayLastAnalysisTrip);
  if (trip - last < CALDER_RELAY_QUIET_TRIPS) return false;
  if (typeof fieldRenewalCanDiscover !== "function" || !fieldRenewalCanDiscover()) return false;
  return true;
}

function clearCalderRelayPreparedSite(siteId) {
  if (!siteId) return;
  if (typeof FIELD_NETWORK_SITES !== "undefined") delete FIELD_NETWORK_SITES[siteId];
  if (state.fieldNetworkRenewal?.instances) delete state.fieldNetworkRenewal.instances[siteId];
  if (state.fieldNetwork?.sites) delete state.fieldNetwork.sites[siteId];
}

function prepareCalderRelayAnalysis() {
  ensureCalderNavigationRelayState();
  const memory = state.npcs.orin.memory;
  if (memory.navigationRelayPending) return memory.navigationRelayPending;

  const success = Math.random() < CALDER_RELAY_SUCCESS_CHANCE;
  if (!success) {
    memory.navigationRelayPending = { success: false, siteId: null };
    saveState();
    return memory.navigationRelayPending;
  }

  const siteId = typeof fieldRenewalPrepareSite === "function"
    ? fieldRenewalPrepareSite("calder-relay", "caldersDrift")
    : null;

  if (!siteId) return null;
  const def = FIELD_NETWORK_SITES[siteId];
  if (def) def.sourceLabel = "Navigation Relay analysis";
  memory.navigationRelayPending = { success: true, siteId };
  saveState();
  return memory.navigationRelayPending;
}

const npcOpportunityAvailableBeforeCalderRelay = npcOpportunityAvailable;
npcOpportunityAvailable = function npcOpportunityAvailableWithCalderRelay(id) {
  if (id === "orin" && (calderNavigationRelayPending() || calderRelayAnalysisAvailable())) return true;
  return npcOpportunityAvailableBeforeCalderRelay(id);
};

if (typeof npcOpportunitySignalToken === "function") {
  const npcOpportunitySignalTokenBeforeCalderRelay = npcOpportunitySignalToken;
  npcOpportunitySignalToken = function npcOpportunitySignalTokenWithCalderRelay(id) {
    const base = npcOpportunitySignalTokenBeforeCalderRelay(id);
    if (id === "orin" && calderNavigationRelayPending()) return `${base || "orin"}:navigation-relay-project`;
    if (id === "orin" && calderRelayAnalysisAvailable()) return `${base || "orin"}:navigation-relay-analysis`;
    return base;
  };
}

function openCalderRelayAnalysis() {
  const pending = prepareCalderRelayAnalysis();
  if (!pending) return;

  if (!pending.success) {
    el("encounterTitle").textContent = "Navigation Relay — Inconclusive Analysis";
    el("encounterText").textContent = "Orin has been running old route deviations, beacon records, and recent traffic observations through the restored relay. There is a pattern, but the correlation is too weak to narrow into coordinates worth sending an operator after. For now, the right answer is simply: not enough information.";
    el("encounterChoices").innerHTML = `<button class="secondary" type="button" onclick="resolveEncounter('calderRelayInconclusive')">Acknowledge the analysis</button>`;
    el("encounterDialog").showModal();
    return;
  }

  const def = FIELD_NETWORK_SITES[pending.siteId];
  if (!def) return;
  el("encounterTitle").textContent = "Navigation Relay — Correlated Lead";
  el("encounterText").textContent = `The restored relay has matched fragmentary route data against newer beacon records closely enough for Orin to trust the result. The analysis resolves into a possible location: ${def.name}. It is still only a lead—nobody has confirmed what, if anything, is actually there.`;
  el("encounterChoices").innerHTML = `
    <button class="secondary" type="button" onclick="resolveEncounter('calderRelayAccept:${pending.siteId}')">Take the coordinates</button>
    <button class="secondary" type="button" onclick="resolveEncounter('calderRelayDecline:${pending.siteId}')">Leave the lead with Orin</button>`;
  el("encounterDialog").showModal();
}

const openNpcInteractionBeforeCalderRelay = openNpcInteraction;
openNpcInteraction = function openNpcInteractionWithCalderRelay(id) {
  ensureCalderNavigationRelayState();
  if (id !== "orin") return openNpcInteractionBeforeCalderRelay(id);

  if (calderNavigationRelayPending()) {
    el("encounterTitle").textContent = "Orin Vale — Navigation Relay";
    el("encounterText").textContent = `Orin has been trying to restore Calder's aging navigation relay into something useful for frontier work. The station has years of route deviations, beacon records, and operator observations, but too much of it remains disconnected. If you contribute ${credits(CALDER_RELAY_COST)} and ${CALDER_RELAY_SENSORS} Sensor Components, the relay can be rebuilt to correlate incomplete navigation information into credible leads when the data is strong enough.`;
    el("encounterChoices").innerHTML = `
      <button class="secondary" type="button" onclick="resolveEncounter('calderRelayBuild')">Contribute ${credits(CALDER_RELAY_COST)} + ${CALDER_RELAY_SENSORS} Sensor Components</button>
      <button class="secondary" type="button" onclick="resolveEncounter('calderRelayLater')">Not right now</button>`;
    el("encounterDialog").showModal();
    return;
  }

  if (calderRelayAnalysisAvailable()) return openCalderRelayAnalysis();
  return openNpcInteractionBeforeCalderRelay(id);
};

const resolveEncounterBeforeCalderRelay = resolveEncounter;
resolveEncounter = function resolveEncounterWithCalderRelay(action) {
  ensureCalderNavigationRelayState();
  const orin = state.npcs?.orin;

  if (action === "calderRelayBuild") {
    const missing = calderNavigationRelayShortfall();
    if (missing.length) {
      addLog(`ORIN VALE — The Navigation Relay project remains possible, but you still need ${missing.join(" and ")}. Orin keeps the engineering plan open.`);
      saveState();
      if (el("encounterDialog").open) el("encounterDialog").close();
      render();
      return;
    }
    state.credits -= CALDER_RELAY_COST;
    state.cargo.sensorComponents -= CALDER_RELAY_SENSORS;
    if (!state.cargo.sensorComponents) delete state.cargo.sensorComponents;
    orin.memory.navigationRelayCompleted = true;
    orin.memory.navigationRelayFundedTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
    orin.relationship += 1;
    addLog(`CALDER'S DRIFT — You committed ${credits(CALDER_RELAY_COST)} and ${CALDER_RELAY_SENSORS} Sensor Components to restore the Navigation Relay. Orin can now correlate fragmentary route information into credible field leads when the data supports it.`);
    saveState();
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
    return;
  }

  if (action === "calderRelayLater") {
    orin.memory.navigationRelayLastDeclinedTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
    addLog("Orin leaves the Navigation Relay proposal open. The old records are not going anywhere, and neither is the need to make better sense of them.");
    saveState();
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
    return;
  }

  if (action === "calderRelayInconclusive") {
    orin.memory.navigationRelayAnalyses += 1;
    orin.memory.navigationRelayLastAnalysisTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
    orin.memory.navigationRelayPending = null;
    addLog("NAVIGATION RELAY — Orin's latest correlation remains inconclusive. The relay found a pattern, but not one strong enough to justify sending a ship after it.");
    saveState();
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
    return;
  }

  if (typeof action === "string" && action.startsWith("calderRelayAccept:")) {
    const siteId = action.split(":")[1];
    const def = FIELD_NETWORK_SITES?.[siteId];
    if (def && revealFieldNetworkSite(siteId, "calder-relay", `NAVIGATION RELAY — Orin's correlation has resolved ${def.name} into usable coordinates. The location has been added to navigation, but the relay cannot tell you what actually remains there.`)) {
      orin.memory.navigationRelaySuccessfulLeads += 1;
    } else {
      clearCalderRelayPreparedSite(siteId);
    }
    orin.memory.navigationRelayAnalyses += 1;
    orin.memory.navigationRelayLastAnalysisTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
    orin.memory.navigationRelayPending = null;
    saveState();
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
    return;
  }

  if (typeof action === "string" && action.startsWith("calderRelayDecline:")) {
    const siteId = action.split(":")[1];
    clearCalderRelayPreparedSite(siteId);
    orin.memory.navigationRelayAnalyses += 1;
    orin.memory.navigationRelayLastAnalysisTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
    orin.memory.navigationRelayPending = null;
    addLog("NAVIGATION RELAY — You leave the correlated lead with Orin. The relay will keep working as new information comes in.");
    saveState();
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
    return;
  }

  return resolveEncounterBeforeCalderRelay(action);
};

const npcCallbackTextBeforeCalderRelay = npcCallbackText;
npcCallbackText = function npcCallbackTextWithCalderRelay(id) {
  const base = npcCallbackTextBeforeCalderRelay(id);
  if (id !== "orin") return base;
  ensureCalderNavigationRelayState();
  if (!state.npcs.orin.memory.navigationRelayCompleted) return base;
  return `${base} Orin also remembers that you put your own credits and sensor hardware into restoring Calder's Navigation Relay, giving the station a better way to turn scattered observations into reliable coordinates.`;
};

const renderOverviewBeforeCalderRelay = renderOverview;
renderOverview = function renderOverviewWithCalderRelay() {
  renderOverviewBeforeCalderRelay();
  ensureCalderNavigationRelayState();
  if (state.location !== "caldersDrift" || !state.npcs?.orin?.memory.navigationRelayCompleted) return;
  const grid = view.querySelector(".card-grid");
  if (!grid || grid.querySelector("[data-calder-navigation-relay]")) return;
  grid.insertAdjacentHTML("beforeend", `
    <article class="info-card" data-calder-navigation-relay>
      <p class="eyebrow">LOCAL IMPROVEMENT</p>
      <h3>Navigation Relay</h3>
      <p>Calder's restored relay now compares route deviations, beacon records, and operator observations that once sat in separate archives.</p>
      <p class="muted small">You helped Orin return the relay to serious service. When enough fragmentary information agrees, it can occasionally produce a credible location worth investigating.</p>
    </article>`);
};

ensureCalderNavigationRelayState();
saveState();

// Haven's Reach — Prospect Station Development #1
// Lena can invite a trusted operator to help equip a frontier service dock.
// The completed dock occasionally creates authored recovery leads rather than passive income.

const PROSPECT_DOCK_COST = 2800;
const PROSPECT_DOCK_PARTS = 3;
const PROSPECT_RECOVERY_QUIET_TRIPS = 3;

function ensureProspectServiceDockState() {
  ensureNpcState();
  const lena = state.npcs?.lena;
  if (!lena) return;
  if (!lena.memory || typeof lena.memory !== "object") lena.memory = {};
  if (lena.memory.frontierServiceDockCompleted !== true) lena.memory.frontierServiceDockCompleted = false;
  if (!Number.isFinite(lena.memory.frontierServiceDockLastDeclinedTrip)) lena.memory.frontierServiceDockLastDeclinedTrip = -99;
  if (!Number.isFinite(lena.memory.frontierServiceDockFundedTrip)) lena.memory.frontierServiceDockFundedTrip = -99;
  if (!Number.isFinite(lena.memory.frontierRecoveryLastLeadTrip)) lena.memory.frontierRecoveryLastLeadTrip = -99;
}

function lenaMeaningfullyHelped() {
  const m = state.npcs?.lena?.memory || {};
  return Boolean(m.rescuedAtDrift || m.guidedAtDrift || m.promisedSupport);
}

function prospectServiceDockEligible() {
  ensureProspectServiceDockState();
  const lena = state.npcs?.lena;
  return Boolean(
    lena?.met &&
    !lena.memory.frontierServiceDockCompleted &&
    lena.relationship >= 2 &&
    lenaMeaningfullyHelped()
  );
}

function prospectServiceDockPending() {
  if (!prospectServiceDockEligible()) return false;
  const trip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
  return trip - state.npcs.lena.memory.frontierServiceDockLastDeclinedTrip >= 2;
}

function prospectServiceDockShortfall() {
  const missing = [];
  if (state.credits < PROSPECT_DOCK_COST) missing.push(`${credits(PROSPECT_DOCK_COST - state.credits)} more credits`);
  const owned = state.cargo.machineParts || 0;
  if (owned < PROSPECT_DOCK_PARTS) missing.push(`${PROSPECT_DOCK_PARTS - owned} more Power Coupling${PROSPECT_DOCK_PARTS - owned === 1 ? "" : "s"}`);
  return missing;
}

function prospectRecoveryCandidate() {
  if (typeof ensureFieldNetworkState !== "function" || typeof revealFieldNetworkSite !== "function") return null;
  ensureFieldNetworkState();
  const preferred = ["argentWreck", "silentEcho", "courierTrail"];
  return preferred.find(id => {
    const record = state.fieldNetwork?.sites?.[id];
    return record && !record.discovered && !record.completed && fieldAnchorKnown(id);
  }) || null;
}

function prospectRecoveryLeadAvailable() {
  ensureProspectServiceDockState();
  if (!state.npcs?.lena?.memory.frontierServiceDockCompleted || state.location !== "prospect") return false;
  if (typeof fieldNetworkHasRoom !== "function" || !fieldNetworkHasRoom()) return false;
  const trip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
  const funded = state.npcs.lena.memory.frontierServiceDockFundedTrip;
  const last = state.npcs.lena.memory.frontierRecoveryLastLeadTrip;
  if (trip - funded < PROSPECT_RECOVERY_QUIET_TRIPS || trip - last < PROSPECT_RECOVERY_QUIET_TRIPS) return false;
  return Boolean(prospectRecoveryCandidate());
}

const npcOpportunityAvailableBeforeProspectDock = npcOpportunityAvailable;
npcOpportunityAvailable = function npcOpportunityAvailableWithProspectDock(id) {
  if (id === "lena" && (prospectServiceDockPending() || prospectRecoveryLeadAvailable())) return true;
  return npcOpportunityAvailableBeforeProspectDock(id);
};

if (typeof npcOpportunitySignalToken === "function") {
  const npcOpportunitySignalTokenBeforeProspectDock = npcOpportunitySignalToken;
  npcOpportunitySignalToken = function npcOpportunitySignalTokenWithProspectDock(id) {
    const base = npcOpportunitySignalTokenBeforeProspectDock(id);
    if (id === "lena" && prospectServiceDockPending()) return `${base || "lena"}:frontier-service-dock`;
    if (id === "lena" && prospectRecoveryLeadAvailable()) return `${base || "lena"}:frontier-recovery`;
    return base;
  };
}

function openProspectRecoveryLead() {
  const siteId = prospectRecoveryCandidate();
  const def = typeof FIELD_NETWORK_SITES !== "undefined" ? FIELD_NETWORK_SITES[siteId] : null;
  if (!siteId || !def) return;
  el("encounterTitle").textContent = "Captain Lena Voss — Recovery Lead";
  el("encounterText").textContent = `The Frontier Service Dock has its first case worth passing along. A returning operator logged ${def.name} after abandoning an off-lane problem rather than risk the rest of the trip. The dock has enough information to give you usable coordinates, but Lena makes no promise that anything valuable remains.`;
  el("encounterChoices").innerHTML = `
    <button class="secondary" type="button" onclick="resolveEncounter('prospectRecoveryAccept:${siteId}')">Take the recovery coordinates</button>
    <button class="secondary" type="button" onclick="resolveEncounter('prospectRecoveryLater')">Leave it for another operator</button>`;
  el("encounterDialog").showModal();
}

const openNpcInteractionBeforeProspectDock = openNpcInteraction;
openNpcInteraction = function openNpcInteractionWithProspectDock(id) {
  ensureProspectServiceDockState();
  if (id !== "lena") return openNpcInteractionBeforeProspectDock(id);

  if (prospectServiceDockPending()) {
    el("encounterTitle").textContent = "Captain Lena Voss — Frontier Service Dock";
    el("encounterText").textContent = `Lena has been pushing to convert an underused Prospect service bay for independent ships returning from frontier work. Prospect can provide the bay, technicians, and ordinary shop equipment, but the project still lacks capital and rugged handling hardware. If you contribute ${credits(PROSPECT_DOCK_COST)} and ${PROSPECT_DOCK_PARTS} Power Couplings, the dock can open. It will not make frontier work safe, but it will give returning operators somewhere to bring unusual damage, abandoned equipment reports, and recovery problems that do not fit the ordinary service queue.`;
    el("encounterChoices").innerHTML = `
      <button class="secondary" type="button" onclick="resolveEncounter('prospectDockAccept')">Contribute ${credits(PROSPECT_DOCK_COST)} + ${PROSPECT_DOCK_PARTS} Power Couplings</button>
      <button class="secondary" type="button" onclick="resolveEncounter('prospectDockLater')">Not right now</button>`;
    el("encounterDialog").showModal();
    return;
  }

  if (prospectRecoveryLeadAvailable()) return openProspectRecoveryLead();
  return openNpcInteractionBeforeProspectDock(id);
};

const resolveEncounterBeforeProspectDock = resolveEncounter;
resolveEncounter = function resolveEncounterWithProspectDock(action) {
  ensureProspectServiceDockState();

  if (action === "prospectDockAccept") {
    const missing = prospectServiceDockShortfall();
    if (missing.length) {
      addLog(`LENA VOSS — The Frontier Service Dock remains possible, but you still need ${missing.join(" and ")}. Lena says Prospect can keep the bay reserved until the numbers work.`);
      saveState();
      if (el("encounterDialog").open) el("encounterDialog").close();
      render();
      return;
    }
    state.credits -= PROSPECT_DOCK_COST;
    state.cargo.machineParts -= PROSPECT_DOCK_PARTS;
    if (!state.cargo.machineParts) delete state.cargo.machineParts;
    state.npcs.lena.memory.frontierServiceDockCompleted = true;
    state.npcs.lena.memory.frontierServiceDockFundedTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
    state.npcs.lena.relationship += 1;
    addLog(`PROSPECT — You committed ${credits(PROSPECT_DOCK_COST)} and ${PROSPECT_DOCK_PARTS} Power Couplings to equip the Frontier Service Dock. The bay can now support independent ships returning with unusual frontier problems and credible recovery reports.`);
    saveState();
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
    return;
  }

  if (action === "prospectDockLater") {
    state.npcs.lena.memory.frontierServiceDockLastDeclinedTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
    addLog("Lena leaves the Frontier Service Dock proposal open. Prospect can keep making do until you are ready to commit resources.");
    saveState();
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
    return;
  }

  if (typeof action === "string" && action.startsWith("prospectRecoveryAccept:")) {
    const siteId = action.split(":")[1];
    const def = typeof FIELD_NETWORK_SITES !== "undefined" ? FIELD_NETWORK_SITES[siteId] : null;
    if (siteId && def && revealFieldNetworkSite(siteId, "prospect-service-dock", `FRONTIER SERVICE DOCK — A returning operator's report gives Prospect enough information to plot ${def.name}. The recovery coordinates have been added to navigation; what remains there is still uncertain.`)) {
      state.npcs.lena.memory.frontierRecoveryLastLeadTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
      state.npcs.lena.memory.frontierRecoveryLeads = (state.npcs.lena.memory.frontierRecoveryLeads || 0) + 1;
    }
    if (el("encounterDialog").open) el("encounterDialog").close();
    saveState();
    render();
    return;
  }

  if (action === "prospectRecoveryLater") {
    state.npcs.lena.memory.frontierRecoveryLastLeadTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
    addLog("Lena leaves the recovery report with the Frontier Service Dock. Another operator can take it if the problem still matters later.");
    if (el("encounterDialog").open) el("encounterDialog").close();
    saveState();
    render();
    return;
  }

  return resolveEncounterBeforeProspectDock(action);
};

const npcCallbackTextBeforeProspectDock = npcCallbackText;
npcCallbackText = function npcCallbackTextWithProspectDock(id) {
  const base = npcCallbackTextBeforeProspectDock(id);
  if (id !== "lena") return base;
  ensureProspectServiceDockState();
  if (!state.npcs.lena.memory.frontierServiceDockCompleted) return base;
  return `${base} Lena also remembers that you put your own credits and hardware into Prospect's Frontier Service Dock so independent crews would have somewhere useful to bring the problems they carried home.`;
};

const renderOverviewBeforeProspectDock = renderOverview;
renderOverview = function renderOverviewWithProspectDock() {
  renderOverviewBeforeProspectDock();
  ensureProspectServiceDockState();
  if (state.location !== "prospect" || !state.npcs?.lena?.memory.frontierServiceDockCompleted) return;
  const grid = view.querySelector(".card-grid");
  if (!grid || grid.querySelector("[data-prospect-service-dock]")) return;
  grid.insertAdjacentHTML("beforeend", `
    <article class="info-card" data-prospect-service-dock>
      <p class="eyebrow">LOCAL IMPROVEMENT</p>
      <h3>Frontier Service Dock</h3>
      <p>An underused service bay now supports independent ships returning from frontier operations.</p>
      <p class="muted small">You helped Lena and Prospect equip the dock for unusual damage, abandoned equipment reports, and recovery problems. Credible recovery leads can occasionally reach you here.</p>
    </article>`);
};

ensureProspectServiceDockState();
saveState();

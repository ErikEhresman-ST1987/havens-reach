// Haven's Reach — Station Development Bundle
// Structural consolidation only. The four proven station-development modules below
// are preserved in their existing execution order with no gameplay or save-data changes.

// ===== meridian-trade-berth.js =====
// Haven's Reach — Meridian Station Development #1
// A trusted relationship with Seli can lead to a one-time contribution that restores
// an independent trade berth. The consequence is active commercial access, not passive income.

const MERIDIAN_BERTH_COST = 3200;
const MERIDIAN_BERTH_PARTS = 2;
const MERIDIAN_BERTH_COOLDOWN = 4;
const MERIDIAN_BERTH_CONTRACT_ID = "meridian-independent-berth-lot";

const MERIDIAN_BERTH_CONTRACT = {
  id: MERIDIAN_BERTH_CONTRACT_ID,
  title: "Independent Mixed Freight Lot",
  destination: "haven",
  reward: 1040,
  cargo: { food: 2, luxuries: 2 },
  rep: 1,
  meridianTradeBerth: true,
  text: "Several small Meridian merchants have combined shipments through the restored independent berth. The mixed lot needs a dependable operator for delivery to Haven."
};

function ensureMeridianTradeBerthState() {
  ensureNpcOpportunityState();
  const seli = state.npcs?.seli;
  if (!seli) return;
  if (!seli.memory || typeof seli.memory !== "object") seli.memory = {};
  if (seli.memory.meridianTradeBerthCompleted !== true) seli.memory.meridianTradeBerthCompleted = false;
  if (!Number.isFinite(seli.memory.meridianTradeBerthLastDeclinedTrip)) seli.memory.meridianTradeBerthLastDeclinedTrip = -99;
  if (!Number.isFinite(seli.memory.meridianBerthFreightLastCompletedTrip)) seli.memory.meridianBerthFreightLastCompletedTrip = -99;
}

function meridianTradeBerthEligible() {
  ensureMeridianTradeBerthState();
  const seli = state.npcs?.seli;
  return Boolean(
    seli?.met &&
    !seli.memory.meridianTradeBerthCompleted &&
    seli.relationship >= 4 &&
    (seli.memory.completedFavor || 0) >= 1 &&
    seli.memory.privateFreightAccess === true
  );
}

function meridianTradeBerthPending() {
  if (!meridianTradeBerthEligible()) return false;
  const trip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
  return trip - state.npcs.seli.memory.meridianTradeBerthLastDeclinedTrip >= 2;
}

function meridianBerthFreightAvailable() {
  ensureMeridianTradeBerthState();
  if (!state.npcs?.seli?.memory.meridianTradeBerthCompleted) return false;
  const trip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
  return trip - state.npcs.seli.memory.meridianBerthFreightLastCompletedTrip >= MERIDIAN_BERTH_COOLDOWN;
}

function syncMeridianBerthContract() {
  ensureMeridianTradeBerthState();
  const board = GAME_DATA.systems.meridian?.contracts;
  if (!Array.isArray(board)) return;
  const index = board.findIndex(contract => contract.id === MERIDIAN_BERTH_CONTRACT_ID);
  const shouldExist = meridianBerthFreightAvailable();
  if (shouldExist && index < 0) board.push(MERIDIAN_BERTH_CONTRACT);
  if (!shouldExist && index >= 0 && state.activeContract?.id !== MERIDIAN_BERTH_CONTRACT_ID) board.splice(index, 1);
}

function meridianTradeBerthShortfall() {
  const missing = [];
  if (state.credits < MERIDIAN_BERTH_COST) missing.push(`${credits(MERIDIAN_BERTH_COST - state.credits)} more credits`);
  const owned = state.cargo.machineParts || 0;
  if (owned < MERIDIAN_BERTH_PARTS) missing.push(`${MERIDIAN_BERTH_PARTS - owned} more Power Coupling${MERIDIAN_BERTH_PARTS - owned === 1 ? "" : "s"}`);
  return missing;
}

const npcOpportunityAvailableBeforeMeridianBerth = npcOpportunityAvailable;
npcOpportunityAvailable = function npcOpportunityAvailableWithMeridianBerth(id) {
  if (id === "seli" && meridianTradeBerthPending()) return true;
  return npcOpportunityAvailableBeforeMeridianBerth(id);
};

if (typeof npcOpportunitySignalToken === "function") {
  const npcOpportunitySignalTokenBeforeMeridianBerth = npcOpportunitySignalToken;
  npcOpportunitySignalToken = function npcOpportunitySignalTokenWithMeridianBerth(id) {
    const base = npcOpportunitySignalTokenBeforeMeridianBerth(id);
    if (id === "seli" && meridianTradeBerthPending()) return `${base || "seli"}:trade-berth`;
    return base;
  };
}

const openNpcInteractionBeforeMeridianBerth = openNpcInteraction;
openNpcInteraction = function openNpcInteractionWithMeridianBerth(id) {
  ensureMeridianTradeBerthState();
  if (id !== "seli" || !meridianTradeBerthPending()) return openNpcInteractionBeforeMeridianBerth(id);

  el("encounterTitle").textContent = "Seli Varen — Independent Trade Berth";
  el("encounterText").textContent = `Seli has a proposal that is larger than another freight referral. An older Meridian berth has sat underused while the main commercial docks increasingly favor established freight houses. Several small merchants want to restore it for independent traffic. They have crews and local backing, but not enough capital or replacement handling hardware. If you contribute ${credits(MERIDIAN_BERTH_COST)} and ${MERIDIAN_BERTH_PARTS} Power Couplings, the berth can reopen. It would let smaller merchants combine loads and place work directly with independent operators.`;
  el("encounterChoices").innerHTML = `
    <button class="secondary" type="button" onclick="resolveEncounter('meridianBerthAccept')">Contribute ${credits(MERIDIAN_BERTH_COST)} + ${MERIDIAN_BERTH_PARTS} Power Couplings</button>
    <button class="secondary" type="button" onclick="resolveEncounter('meridianBerthLater')">Not right now</button>`;
  el("encounterDialog").showModal();
};

const resolveEncounterBeforeMeridianBerth = resolveEncounter;
resolveEncounter = function resolveEncounterWithMeridianBerth(action) {
  ensureMeridianTradeBerthState();

  if (action === "meridianBerthAccept") {
    const missing = meridianTradeBerthShortfall();
    if (missing.length) {
      addLog(`SELI VAREN — The independent trade berth remains possible, but you still need ${missing.join(" and ")}. Seli says the merchants will keep the proposal open.`);
      saveState();
      if (el("encounterDialog").open) el("encounterDialog").close();
      render();
      return;
    }

    state.credits -= MERIDIAN_BERTH_COST;
    state.cargo.machineParts -= MERIDIAN_BERTH_PARTS;
    if (!state.cargo.machineParts) delete state.cargo.machineParts;
    state.npcs.seli.memory.meridianTradeBerthCompleted = true;
    state.npcs.seli.memory.meridianTradeBerthFundedTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
    state.npcs.seli.relationship += 1;
    syncMeridianBerthContract();
    addLog(`MERIDIAN — You committed ${credits(MERIDIAN_BERTH_COST)} and ${MERIDIAN_BERTH_PARTS} Power Couplings to restore the independent trade berth. Small merchants can now combine freight there and place suitable loads directly with independent operators.`);
    saveState();
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
    return;
  }

  if (action === "meridianBerthLater") {
    state.npcs.seli.memory.meridianTradeBerthLastDeclinedTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
    addLog("Seli leaves the independent trade-berth proposal open. The merchants can wait until you are ready to make that kind of commitment.");
    saveState();
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
    return;
  }

  return resolveEncounterBeforeMeridianBerth(action);
};

const npcCallbackTextBeforeMeridianBerth = npcCallbackText;
npcCallbackText = function npcCallbackTextWithMeridianBerth(id) {
  const base = npcCallbackTextBeforeMeridianBerth(id);
  if (id !== "seli") return base;
  ensureMeridianTradeBerthState();
  if (!state.npcs.seli.memory.meridianTradeBerthCompleted) return base;
  return `${base} Seli also remembers that you helped Meridian's smaller merchants reopen an independent trade berth instead of leaving all of the useful dock space to the larger freight houses.`;
};

const renderOverviewBeforeMeridianBerth = renderOverview;
renderOverview = function renderOverviewWithMeridianBerth() {
  renderOverviewBeforeMeridianBerth();
  ensureMeridianTradeBerthState();
  if (state.location !== "meridian" || !state.npcs?.seli?.memory.meridianTradeBerthCompleted) return;
  const grid = view.querySelector(".card-grid");
  if (!grid || grid.querySelector("[data-meridian-trade-berth]")) return;
  grid.insertAdjacentHTML("beforeend", `
    <article class="info-card" data-meridian-trade-berth>
      <p class="eyebrow">LOCAL IMPROVEMENT</p>
      <h3>Independent Trade Berth</h3>
      <p>The restored berth is handling combined shipments for Meridian's smaller merchants.</p>
      <p class="muted small">You helped Seli and the local merchants return the berth to service. Suitable independent freight lots can now appear on Meridian's contract board.</p>
    </article>`);
};

const renderContractsBeforeMeridianBerth = renderContracts;
renderContracts = function renderContractsWithMeridianBerth() {
  syncMeridianBerthContract();
  renderContractsBeforeMeridianBerth();
  view.querySelectorAll('.contract-row').forEach(row => {
    const button = row.querySelector('button[onclick*="acceptContract"]');
    if (!button) return;
    const match = button.getAttribute('onclick')?.match(/acceptContract\('([^']+)'\)/);
    if (!match || match[1] !== MERIDIAN_BERTH_CONTRACT_ID) return;
    const first = row.querySelector('div');
    if (first) first.insertAdjacentHTML('afterbegin', '<div class="eyebrow" style="margin-bottom:4px">INDEPENDENT TRADE BERTH</div>');
  });
};

const completeContractBeforeMeridianBerth = completeContractIfPossible;
completeContractIfPossible = function completeContractWithMeridianBerth() {
  const completing = state.activeContract?.id === MERIDIAN_BERTH_CONTRACT_ID;
  const result = completeContractBeforeMeridianBerth();
  if (completing && state.activeContract?.id !== MERIDIAN_BERTH_CONTRACT_ID) {
    ensureMeridianTradeBerthState();
    state.npcs.seli.memory.meridianBerthFreightLastCompletedTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
    addLog("MERIDIAN — The merchants record the combined shipment as delivered. The independent berth will assemble another suitable lot when enough smaller consignments line up.");
    syncMeridianBerthContract();
    saveState();
  }
  return result;
};

ensureMeridianTradeBerthState();
syncMeridianBerthContract();
saveState();

// ===== prospect-frontier-service-dock.js =====
// Haven's Reach — Prospect Station Development #1
// Lena can invite an established operator to help equip a frontier service dock.
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

function prospectServiceDockEligible() {
  ensureProspectServiceDockState();
  const lena = state.npcs?.lena;
  return Boolean(
    lena?.met &&
    !lena.memory.frontierServiceDockCompleted &&
    lena.relationship >= 2
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
  el("encounterTitle").textContent = "Frontier Service Dock — Recovery Report";
  el("encounterText").textContent = `Lena has a report that came through the Frontier Service Dock you helped equip. A returning operator logged ${def.name} after abandoning an off-lane problem rather than risk the rest of the trip. The dock has enough information to plot usable recovery coordinates, but Lena makes no promise that anything valuable remains.`;
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
    if (siteId && def && revealFieldNetworkSite(siteId, "prospect-service-dock", `FRONTIER SERVICE DOCK — Recovery coordinates for ${def.name} have been added to navigation from a report routed through the Prospect dock you helped equip. What remains there is still uncertain.`)) {
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
    addLog("FRONTIER SERVICE DOCK — You leave the recovery report with Lena. Another operator can take it if the problem still matters later.");
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

// ===== calder-navigation-relay.js =====
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

// ===== pelagos-deep-survey-array.js =====
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

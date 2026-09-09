// Haven's Reach — Capital Venture #1
// Draak Tor can invite a trusted operator to help retrofit Red Mesa's independent freight berth.
// This is deliberately not a capital-project framework: one relationship-backed contribution
// creates one visible world consequence and one new source of active freight work.

const DRAAK_RETROFIT_COST = 2500;
const DRAAK_RETROFIT_PARTS = 2;
const DRAAK_RETROFIT_COOLDOWN = 4;
const DRAAK_BULK_FREIGHT_ID = "draak-redmesa-bulk-lot";

const DRAAK_BULK_FREIGHT_CONTRACT = {
  id: DRAAK_BULK_FREIGHT_ID,
  title: "Independent Bulk Ore Lot",
  destination: "meridian",
  reward: 1280,
  cargo: { ore: 6 },
  rep: 1,
  draakRetrofit: true,
  text: "Red Mesa's upgraded independent berth can now load a six-unit cooperative ore lot for Meridian without tying up the station's main industrial docks."
};

function ensureDraakRetrofitState() {
  ensureNpcOpportunityState();
  const draak = state.npcs?.draak;
  if (!draak) return;
  if (!draak.memory || typeof draak.memory !== "object") draak.memory = {};
  if (draak.memory.freightRetrofitCompleted !== true) draak.memory.freightRetrofitCompleted = false;
  if (!Number.isFinite(draak.memory.freightRetrofitLastDeclinedTrip)) draak.memory.freightRetrofitLastDeclinedTrip = -99;
  if (!Number.isFinite(draak.memory.bulkFreightLastCompletedTrip)) draak.memory.bulkFreightLastCompletedTrip = -99;
}

function draakRetrofitEligible() {
  ensureDraakRetrofitState();
  const draak = state.npcs?.draak;
  return Boolean(
    draak?.met &&
    !draak.memory.freightRetrofitCompleted &&
    draak.relationship >= 4 &&
    (draak.memory.completedFavor || 0) >= 1
  );
}

function draakRetrofitPending() {
  if (!draakRetrofitEligible()) return false;
  const lastDeclined = state.npcs.draak.memory.freightRetrofitLastDeclinedTrip;
  const trip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
  return trip - lastDeclined >= 2;
}

function draakBulkFreightAvailable() {
  ensureDraakRetrofitState();
  const draak = state.npcs?.draak;
  if (!draak?.memory.freightRetrofitCompleted) return false;
  const trip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
  return trip - draak.memory.bulkFreightLastCompletedTrip >= DRAAK_RETROFIT_COOLDOWN;
}

function syncDraakBulkFreightContract() {
  ensureDraakRetrofitState();
  const board = GAME_DATA.systems.redMesa?.contracts;
  if (!Array.isArray(board)) return;

  const index = board.findIndex(contract => contract.id === DRAAK_BULK_FREIGHT_ID);
  const shouldExist = draakBulkFreightAvailable();

  if (shouldExist && index < 0) board.push(DRAAK_BULK_FREIGHT_CONTRACT);
  if (!shouldExist && index >= 0 && state.activeContract?.id !== DRAAK_BULK_FREIGHT_ID) {
    board.splice(index, 1);
  }
}

function draakRetrofitShortfall() {
  const missing = [];
  if (state.credits < DRAAK_RETROFIT_COST) missing.push(`${credits(DRAAK_RETROFIT_COST - state.credits)} more credits`);
  const partsOwned = state.cargo.machineParts || 0;
  if (partsOwned < DRAAK_RETROFIT_PARTS) missing.push(`${DRAAK_RETROFIT_PARTS - partsOwned} more Power Coupling${DRAAK_RETROFIT_PARTS - partsOwned === 1 ? "" : "s"}`);
  return missing;
}

// A pending venture counts as relevant contact activity, so the existing quiet arrival
// signal can surface it without adding badges, meters, or a project screen.
const npcOpportunityAvailableBeforeDraakRetrofit = npcOpportunityAvailable;
npcOpportunityAvailable = function npcOpportunityAvailableWithDraakRetrofit(id) {
  if (id === "draak" && draakRetrofitPending()) return true;
  return npcOpportunityAvailableBeforeDraakRetrofit(id);
};

if (typeof npcOpportunitySignalToken === "function") {
  const npcOpportunitySignalTokenBeforeDraakRetrofit = npcOpportunitySignalToken;
  npcOpportunitySignalToken = function npcOpportunitySignalTokenWithDraakRetrofit(id) {
    const base = npcOpportunitySignalTokenBeforeDraakRetrofit(id);
    if (id === "draak" && draakRetrofitPending()) return `${base || "draak"}:freight-retrofit`;
    return base;
  };
}

// The invitation comes from Draak, not from an abstract progression threshold.
const openNpcInteractionBeforeDraakRetrofit = openNpcInteraction;
openNpcInteraction = function openNpcInteractionWithDraakRetrofit(id) {
  ensureDraakRetrofitState();
  if (id !== "draak" || !draakRetrofitPending()) return openNpcInteractionBeforeDraakRetrofit(id);

  el("encounterTitle").textContent = "Draak Tor — Freight Berth Retrofit";
  el("encounterText").textContent = `Draak has a practical proposal. Red Mesa's independent freight berth still uses handling gear built for smaller loads. He has crews and engineering authority to rebuild it, but the cooperative is spending its capital elsewhere. If you contribute ${credits(DRAAK_RETROFIT_COST)} and ${DRAAK_RETROFIT_PARTS} Power Couplings, Draak can complete the retrofit. The improved berth would be able to handle bulk independent freight that is currently pushed onto the main industrial docks.`;
  el("encounterChoices").innerHTML = `
    <button class="secondary" type="button" onclick="resolveEncounter('draakRetrofitAccept')">Contribute ${credits(DRAAK_RETROFIT_COST)} + ${DRAAK_RETROFIT_PARTS} Power Couplings</button>
    <button class="secondary" type="button" onclick="resolveEncounter('draakRetrofitLater')">Not right now</button>`;
  el("encounterDialog").showModal();
};

const resolveEncounterBeforeDraakRetrofit = resolveEncounter;
resolveEncounter = function resolveEncounterWithDraakRetrofit(action) {
  ensureDraakRetrofitState();

  if (action === "draakRetrofitAccept") {
    const missing = draakRetrofitShortfall();
    if (missing.length) {
      addLog(`DRAAK TOR — The freight-berth retrofit remains open, but you still need ${missing.join(" and ")}. Draak tells you to come back when the numbers work.`);
      saveState();
      if (el("encounterDialog").open) el("encounterDialog").close();
      render();
      return;
    }

    state.credits -= DRAAK_RETROFIT_COST;
    state.cargo.machineParts -= DRAAK_RETROFIT_PARTS;
    if (!state.cargo.machineParts) delete state.cargo.machineParts;
    state.npcs.draak.memory.freightRetrofitCompleted = true;
    state.npcs.draak.memory.freightRetrofitFundedTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
    state.npcs.draak.relationship += 1;
    syncDraakBulkFreightContract();
    addLog(`RED MESA — You committed ${credits(DRAAK_RETROFIT_COST)} and ${DRAAK_RETROFIT_PARTS} Power Couplings to Draak Tor's independent freight-berth retrofit. The new handling gear is now operational, and Red Mesa can route heavier independent loads through the berth.`);
    saveState();
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
    return;
  }

  if (action === "draakRetrofitLater") {
    state.npcs.draak.memory.freightRetrofitLastDeclinedTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
    addLog("Draak leaves the freight-berth proposal open. He says there is no sense committing capital before you are ready to use it.");
    saveState();
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
    return;
  }

  return resolveEncounterBeforeDraakRetrofit(action);
};

// Once completed, Draak remembers the project as part of the relationship.
const npcCallbackTextBeforeDraakRetrofit = npcCallbackText;
npcCallbackText = function npcCallbackTextWithDraakRetrofit(id) {
  const base = npcCallbackTextBeforeDraakRetrofit(id);
  if (id !== "draak") return base;
  ensureDraakRetrofitState();
  if (!state.npcs.draak.memory.freightRetrofitCompleted) return base;
  return `${base} Draak also remembers that you put your own credits and hardware behind the independent freight-berth retrofit instead of merely talking about what Red Mesa needed.`;
};

// Make the world consequence visible without adding a management interface.
const renderOverviewBeforeDraakRetrofit = renderOverview;
renderOverview = function renderOverviewWithDraakRetrofit() {
  renderOverviewBeforeDraakRetrofit();
  ensureDraakRetrofitState();
  if (state.location !== "redMesa" || !state.npcs.draak.memory.freightRetrofitCompleted) return;

  const grid = view.querySelector(".card-grid");
  if (!grid || grid.querySelector("[data-draak-retrofit]")) return;
  grid.insertAdjacentHTML("beforeend", `
    <article class="info-card" data-draak-retrofit>
      <p class="eyebrow">LOCAL IMPROVEMENT</p>
      <h3>Independent Freight Berth</h3>
      <p>Upgraded heavy-load handling equipment is now operating on the independent berth.</p>
      <p class="muted small">You helped Draak Tor finance the retrofit. Red Mesa can now place bulk independent freight through this berth when suitable loads are available.</p>
    </article>`);
};

// The retrofit creates active work, not passive income. The existing contract board,
// cargo limits, route display, ship specialization, encounters, and completion logic do the work.
const renderContractsBeforeDraakRetrofit = renderContracts;
renderContracts = function renderContractsWithDraakRetrofit() {
  syncDraakBulkFreightContract();
  renderContractsBeforeDraakRetrofit();

  view.querySelectorAll('.contract-row').forEach(row => {
    const button = row.querySelector('button[onclick*="acceptContract"]');
    if (!button) return;
    const match = button.getAttribute('onclick')?.match(/acceptContract\('([^']+)'\)/);
    if (!match || match[1] !== DRAAK_BULK_FREIGHT_ID) return;
    const first = row.querySelector('div');
    if (first) first.insertAdjacentHTML('afterbegin', '<div class="eyebrow" style="margin-bottom:4px">UPGRADED RED MESA BERTH</div>');
  });
};

// After completion the berth waits for another appropriate bulk load rather than
// turning into an always-on money faucet.
const completeContractBeforeDraakRetrofit = completeContractIfPossible;
completeContractIfPossible = function completeContractWithDraakRetrofit() {
  const completingBulkFreight = state.activeContract?.id === DRAAK_BULK_FREIGHT_ID;
  const result = completeContractBeforeDraakRetrofit();

  if (completingBulkFreight && state.activeContract?.id !== DRAAK_BULK_FREIGHT_ID) {
    ensureDraakRetrofitState();
    state.npcs.draak.memory.bulkFreightLastCompletedTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
    addLog("RED MESA — The independent berth records the bulk lot as completed. Another heavy-load posting will appear when the station has suitable freight ready.");
    syncDraakBulkFreightContract();
    saveState();
  }
  return result;
};

ensureDraakRetrofitState();
syncDraakBulkFreightContract();
saveState();

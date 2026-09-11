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

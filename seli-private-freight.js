// Haven's Reach — NPC Opportunities #2: Persistent Consequences
// First proof that an NPC opportunity can permanently change what the world offers.
// Seli's trust can lead to recurring private freight without a separate unlock system.

const SELI_PRIVATE_FREIGHT_ID = "seli-private-consignment";
const SELI_PRIVATE_FREIGHT_COOLDOWN = 3;
const SELI_PRIVATE_FREIGHT_CONTRACT = {
  id: SELI_PRIVATE_FREIGHT_ID,
  title: "Private Commercial Consignment",
  destination: "redMesa",
  reward: 840,
  cargo: { machineParts: 2 },
  rep: 1,
  privateReferral: "seli",
  text: "A Meridian industrial client pays above board rate for discreet scheduling, guaranteed handling, and an operator personally referred by Seli Varen."
};

function ensureSeliPrivateFreightState() {
  ensureNpcOpportunityState();
  const seli = state.npcs?.seli;
  if (!seli) return;
  if (!seli.memory || typeof seli.memory !== "object") seli.memory = {};
  if (seli.memory.privateFreightAccess !== true) seli.memory.privateFreightAccess = false;
  if (!Number.isFinite(seli.memory.privateFreightLastCompletedTrip)) {
    seli.memory.privateFreightLastCompletedTrip = -99;
  }
}

function seliPrivateFreightEligible() {
  ensureSeliPrivateFreightState();
  const seli = state.npcs?.seli;
  return Boolean(
    seli?.met &&
    seli.relationship >= 4 &&
    (seli.memory.completedFavor || 0) >= 1
  );
}

function seliPrivateFreightReferralPending() {
  ensureSeliPrivateFreightState();
  return seliPrivateFreightEligible() && !state.npcs.seli.memory.privateFreightAccess;
}

function seliPrivateFreightAvailable() {
  ensureSeliPrivateFreightState();
  if (!state.npcs.seli.memory.privateFreightAccess) return false;
  const last = state.npcs.seli.memory.privateFreightLastCompletedTrip;
  return (Number.isFinite(state.tripCount) ? state.tripCount : 0) - last >= SELI_PRIVATE_FREIGHT_COOLDOWN;
}

function syncSeliPrivateFreightContract() {
  ensureSeliPrivateFreightState();
  const board = GAME_DATA.systems.meridian?.contracts;
  if (!Array.isArray(board)) return;

  const index = board.findIndex(contract => contract.id === SELI_PRIVATE_FREIGHT_ID);
  const routeKnown = typeof isSystemKnown !== "function" || isSystemKnown("redMesa");
  const shouldExist = routeKnown && seliPrivateFreightAvailable();

  if (shouldExist && index < 0) board.push(SELI_PRIVATE_FREIGHT_CONTRACT);
  if (!shouldExist && index >= 0 && state.activeContract?.id !== SELI_PRIVATE_FREIGHT_ID) {
    board.splice(index, 1);
  }
}

// Existing Seli dialogue already establishes that useful information and favors matter.
// Add only a quiet breadcrumb; never expose the numerical eligibility rule.
const npcCallbackTextBeforeSeliPrivateFreight = npcCallbackText;
npcCallbackText = function npcCallbackTextWithSeliPrivateFreight(id) {
  const base = npcCallbackTextBeforeSeliPrivateFreight(id);
  if (id !== "seli") return base;

  ensureSeliPrivateFreightState();
  const seli = state.npcs.seli;
  if (!seli?.met || seli.memory.privateFreightAccess) return base;

  if ((seli.memory.completedFavor || 0) >= 1 && seli.relationship >= 2) {
    return `${base} Seli remembers that you came through when she needed commercial help outside the normal board. She mentions that the better private freight goes to operators a broker already trusts.`;
  }
  if (seli.relationship >= 2) {
    return `${base} Seli notes that the better private freight rarely reaches the public board; brokers pass it to operators whose work they already trust.`;
  }
  return base;
};

const opportunityTextBeforeSeliPrivateFreight = opportunityText;
opportunityText = function opportunityTextWithSeliBreadcrumb(id, type) {
  if (id === "seli" && type === "brokerOffer") {
    const relation = npcRelationshipLabel(state.npcs[id].relationship);
    return `Seli can put your name on a small private freight referral. This one is still a modest piece of work, but she notes that dependable operators eventually get offered better accounts that never reach the public board.\n\nCurrent relationship: ${relation}.`;
  }
  return opportunityTextBeforeSeliPrivateFreight(id, type);
};

// A pending referral counts as something worth discussing, so the existing quiet
// arrival signal can surface it without adding a badge, popup, or new notification system.
const npcOpportunityAvailableBeforeSeliPrivateFreight = npcOpportunityAvailable;
npcOpportunityAvailable = function npcOpportunityAvailableWithPrivateReferral(id) {
  if (id === "seli" && seliPrivateFreightReferralPending()) return true;
  return npcOpportunityAvailableBeforeSeliPrivateFreight(id);
};

if (typeof npcOpportunitySignalToken === "function") {
  const npcOpportunitySignalTokenBeforeSeliPrivateFreight = npcOpportunitySignalToken;
  npcOpportunitySignalToken = function npcOpportunitySignalTokenWithPrivateReferral(id) {
    const base = npcOpportunitySignalTokenBeforeSeliPrivateFreight(id);
    if (id === "seli" && seliPrivateFreightReferralPending()) return `${base || "seli"}:private-referral`;
    return base;
  };
}

// Eligibility does not silently grant access. A later conversation with Seli is the
// world event that changes what Meridian can offer the operator.
const openNpcInteractionBeforeSeliPrivateFreight = openNpcInteraction;
openNpcInteraction = function openNpcInteractionWithPrivateFreight(id) {
  ensureSeliPrivateFreightState();
  if (id !== "seli" || !seliPrivateFreightReferralPending()) {
    return openNpcInteractionBeforeSeliPrivateFreight(id);
  }

  el("encounterTitle").textContent = "Seli Varen — Private Referral";
  el("encounterText").textContent = "Seli has something she does not put on the public board. A Meridian industrial client needs a dependable independent operator for recurring private freight. She is willing to put your name forward.";
  el("encounterChoices").innerHTML = `
    <button class="secondary" type="button" onclick="resolveEncounter('seliPrivateFreightAccept')">Accept the private referral</button>
    <button class="secondary" type="button" onclick="resolveEncounter('seliPrivateFreightLater')">Not right now</button>`;
  el("encounterDialog").showModal();
};

const resolveEncounterBeforeSeliPrivateFreight = resolveEncounter;
resolveEncounter = function resolveEncounterWithSeliPrivateFreight(action) {
  ensureSeliPrivateFreightState();

  if (action === "seliPrivateFreightAccept") {
    state.npcs.seli.memory.privateFreightAccess = true;
    state.npcs.seli.memory.privateFreightReferral = true;
    addLog("SELI VAREN — Seli puts your name on a private Meridian freight account. Better-paying commercial work from that client can now reach you when it is available.");
    syncSeliPrivateFreightContract();
    saveState();
    el("encounterDialog").close();
    render();
    return;
  }

  if (action === "seliPrivateFreightLater") {
    addLog("Seli leaves the private referral open. She will discuss it again when you are ready.");
    saveState();
    el("encounterDialog").close();
    render();
    return;
  }

  return resolveEncounterBeforeSeliPrivateFreight(action);
};

// Reuse the existing contract board and all of its acceptance, cargo, route, and display logic.
const renderContractsBeforeSeliPrivateFreight = renderContracts;
renderContracts = function renderContractsWithSeliPrivateFreight() {
  syncSeliPrivateFreightContract();
  renderContractsBeforeSeliPrivateFreight();

  view.querySelectorAll('.contract-row').forEach(row => {
    const button = row.querySelector('button[onclick*="acceptContract"]');
    if (!button) return;
    const match = button.getAttribute('onclick')?.match(/acceptContract\('([^']+)'\)/);
    if (!match || match[1] !== SELI_PRIVATE_FREIGHT_ID) return;
    const first = row.querySelector('div');
    if (first) first.insertAdjacentHTML('afterbegin', '<div class="eyebrow" style="margin-bottom:4px">SELI VAREN REFERRAL</div>');
  });
};

// Ordinary freight still completes through the proven contract engine. We only remember
// when this particular account was completed so it can return after a short natural gap.
const completeContractBeforeSeliPrivateFreight = completeContractIfPossible;
completeContractIfPossible = function completeContractWithSeliPrivateFreight() {
  const completingPrivateFreight = state.activeContract?.id === SELI_PRIVATE_FREIGHT_ID;
  const result = completeContractBeforeSeliPrivateFreight();

  if (completingPrivateFreight && state.activeContract?.id !== SELI_PRIVATE_FREIGHT_ID) {
    ensureSeliPrivateFreightState();
    state.npcs.seli.memory.privateFreightLastCompletedTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
    addLog("Seli's client records the consignment as completed. The private account will send more work after its next scheduling cycle.");
    syncSeliPrivateFreightContract();
    saveState();
  }
  return result;
};

ensureSeliPrivateFreightState();
syncSeliPrivateFreightContract();
saveState();

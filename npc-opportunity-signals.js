// Haven's Reach — NPC Opportunity Signaling
// Quietly surfaces relevant contact activity on arrival without forcing a dialog,
// adding badges, or making the interface permanently louder.

function ensureNpcSignalState() {
  ensureNpcOpportunityState();
  if (!state.npcOpportunitySignals || typeof state.npcOpportunitySignals !== "object") {
    state.npcOpportunitySignals = {};
  }
}

function localNpcEntry() {
  return Object.entries(NPC_DATA).find(([, npc]) => npc.location === state.location) || null;
}

function npcOpportunitySignalToken(id) {
  const record = state.npcOpportunities?.[id];
  if (!record) return null;
  return `${record.lastTrip}:${record.completed}`;
}

function signalLocalNpcOpportunity() {
  ensureNpcSignalState();
  const local = localNpcEntry();
  if (!local) return false;

  const [id, npc] = local;
  const npcState = state.npcs?.[id];
  if (!npcState?.met || !npcOpportunityAvailable(id)) return false;

  const token = npcOpportunitySignalToken(id);
  if (!token || state.npcOpportunitySignals[id] === token) return false;

  state.npcOpportunitySignals[id] = token;
  addLog(`LOCAL CONTACT — ${npc.name} has asked to speak with you while you're at ${GAME_DATA.systems[state.location].name}.`);
  saveState();
  return true;
}

// Surface an opportunity only after a real arrival. The underlying travel stack still
// owns navigation, encounters, fuel, discovery, markets, contracts, and saving.
const travelBeforeNpcOpportunitySignals = travel;
travel = function travelWithNpcOpportunitySignals(destination, fuelCost) {
  ensureNpcSignalState();
  const beforeLocation = state.location;
  const beforeTrip = state.tripCount;
  const result = travelBeforeNpcOpportunitySignals(destination, fuelCost);

  const arrived = state.location !== beforeLocation || state.tripCount !== beforeTrip;
  if (arrived && signalLocalNpcOpportunity()) {
    render();
  }

  return result;
};

ensureNpcSignalState();
saveState();

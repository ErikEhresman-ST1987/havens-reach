// Haven's Reach — Expansion Foundation Pass 5B4 / 5C2
// Seli Private Freight Interaction Migration

const resolveSeliPrivateFreightBeforeDispatcher = window.resolveEncounter;
const openSeliPrivateFreightBeforeDispatcher = window.openNpcInteraction;
const SELI_PRIVATE_FREIGHT_ACTIONS = new Set([
  "seliPrivateFreightAccept",
  "seliPrivateFreightLater"
]);

HavensInteractionDispatcher.registerEncounterHandler("seli-private-freight", action => {
  if (!SELI_PRIVATE_FREIGHT_ACTIONS.has(action)) return false;
  resolveSeliPrivateFreightBeforeDispatcher(action);
  return true;
});

HavensInteractionDispatcher.registerNpcInteractionHandler("seli-private-freight", id => {
  if (id !== "seli" || !seliPrivateFreightReferralPending()) return false;
  openSeliPrivateFreightBeforeDispatcher(id);
  return true;
});

HavensInteractionDispatcher.installEncounterGateway();
HavensInteractionDispatcher.installNpcInteractionGateway();

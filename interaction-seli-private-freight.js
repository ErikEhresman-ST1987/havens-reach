// Haven's Reach — Expansion Foundation Pass 5B4
// Seli Private Freight Encounter Migration

const resolveSeliPrivateFreightBeforeDispatcher = window.resolveEncounter;
const SELI_PRIVATE_FREIGHT_ACTIONS = new Set([
  "seliPrivateFreightAccept",
  "seliPrivateFreightLater"
]);

HavensInteractionDispatcher.registerEncounterHandler("seli-private-freight", action => {
  if (!SELI_PRIVATE_FREIGHT_ACTIONS.has(action)) return false;
  resolveSeliPrivateFreightBeforeDispatcher(action);
  return true;
});

HavensInteractionDispatcher.installEncounterGateway();

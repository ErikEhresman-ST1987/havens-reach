// Haven's Reach — Expansion Foundation Pass 5B3 / 5C1
// Frontier Contact Interaction Migration

const resolveFrontierIdentityBeforeDispatcher = window.resolveEncounter;
const openFrontierNpcInteractionBeforeDispatcher = window.openNpcInteraction;
const FRONTIER_IDENTITY_ACTIONS = new Set([
  "npcOrinBeacon",
  "npcOrinWork",
  "npcDraakMaintenance",
  "npcDraakProfit",
  "npcSaeliObserve",
  "npcSaeliRoutes"
]);
const FRONTIER_CONTACT_IDS = new Set(["orin", "draak", "saeli"]);

HavensInteractionDispatcher.registerEncounterHandler("frontier-identity", action => {
  if (!FRONTIER_IDENTITY_ACTIONS.has(action)) return false;
  resolveFrontierIdentityBeforeDispatcher(action);
  return true;
});

HavensInteractionDispatcher.registerNpcInteractionHandler("frontier-identity", id => {
  if (!FRONTIER_CONTACT_IDS.has(id)) return false;
  openFrontierNpcInteractionBeforeDispatcher(id);
  return true;
});

HavensInteractionDispatcher.installEncounterGateway();
HavensInteractionDispatcher.installNpcInteractionGateway();

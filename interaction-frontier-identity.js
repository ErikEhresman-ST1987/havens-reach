// Haven's Reach — Expansion Foundation Pass 5B3
// Frontier Contact Encounter Action Migration
//
// Routes Orin, Draak, and Saeli's proven introductory encounter actions through the
// explicit interaction dispatcher. Conversation presentation remains owned by
// frontier-identity.js and will be addressed separately during NPC interaction routing.

const resolveFrontierIdentityBeforeDispatcher = window.resolveEncounter;
const FRONTIER_IDENTITY_ACTIONS = new Set([
  "npcOrinBeacon",
  "npcOrinWork",
  "npcDraakMaintenance",
  "npcDraakProfit",
  "npcSaeliObserve",
  "npcSaeliRoutes"
]);

HavensInteractionDispatcher.registerEncounterHandler("frontier-identity", action => {
  if (!FRONTIER_IDENTITY_ACTIONS.has(action)) return false;
  resolveFrontierIdentityBeforeDispatcher(action);
  return true;
});

// Remove this owner's legacy resolver wrapper from the active chain. Later modules may
// still wrap the gateway until their own Pass 5 migrations are completed.
HavensInteractionDispatcher.installEncounterGateway();

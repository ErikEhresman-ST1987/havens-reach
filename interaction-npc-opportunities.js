// Haven's Reach — Expansion Foundation Pass 5B3
// NPC Opportunity Encounter Action Migration
//
// Routes the proven npcOpp* encounter-action family through the explicit interaction
// dispatcher. Opportunity selection, outcomes, persistence, and presentation remain
// owned by npc-opportunities.js.

const resolveNpcOpportunitiesBeforeDispatcher = window.resolveEncounter;

HavensInteractionDispatcher.registerEncounterHandler("npc-opportunities", action => {
  if (typeof action !== "string" || !action.startsWith("npcOpp")) return false;
  resolveNpcOpportunitiesBeforeDispatcher(action);
  return true;
});

// Remove this owner's legacy resolver wrapper from the active chain. Later modules may
// still wrap the gateway until their own Pass 5 migrations are completed.
HavensInteractionDispatcher.installEncounterGateway();

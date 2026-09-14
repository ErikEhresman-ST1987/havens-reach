// Haven's Reach — Expansion Foundation Pass 5B3 / 5C1
// NPC Opportunity Interaction Migration

const resolveNpcOpportunitiesBeforeDispatcher = window.resolveEncounter;
const openNpcOpportunitiesBeforeDispatcher = window.openNpcInteraction;

HavensInteractionDispatcher.registerEncounterHandler("npc-opportunities", action => {
  if (typeof action !== "string" || !action.startsWith("npcOpp")) return false;
  resolveNpcOpportunitiesBeforeDispatcher(action);
  return true;
});

HavensInteractionDispatcher.registerNpcInteractionHandler("npc-opportunities", id => {
  ensureNpcOpportunityState();
  if (!state.npcs?.[id]?.met) return false;
  openNpcOpportunitiesBeforeDispatcher(id);
  return true;
});

HavensInteractionDispatcher.installEncounterGateway();
HavensInteractionDispatcher.installNpcInteractionGateway();

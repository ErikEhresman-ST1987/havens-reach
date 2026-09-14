// Haven's Reach — Expansion Foundation Pass 5B4 / 5C2
// Field Network NPC Lead Interaction Migration

const resolveFieldNetworkBeforeDispatcher = window.resolveEncounter;
const openFieldNetworkBeforeDispatcher = window.openNpcInteraction;

HavensInteractionDispatcher.registerEncounterHandler("field-network", action => {
  if (typeof action !== "string") return false;
  if (!action.startsWith("fieldNpcAccept:") && !action.startsWith("fieldNpcLater:")) return false;
  resolveFieldNetworkBeforeDispatcher(action);
  return true;
});

HavensInteractionDispatcher.registerNpcInteractionHandler("field-network", id => {
  if (!npcFieldLeadAvailable(id)) return false;
  openFieldNetworkBeforeDispatcher(id);
  return true;
});

HavensInteractionDispatcher.installEncounterGateway();
HavensInteractionDispatcher.installNpcInteractionGateway();

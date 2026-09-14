// Haven's Reach — Expansion Foundation Pass 5B4
// Field Network NPC Lead Encounter Migration

const resolveFieldNetworkBeforeDispatcher = window.resolveEncounter;

HavensInteractionDispatcher.registerEncounterHandler("field-network", action => {
  if (typeof action !== "string") return false;
  if (!action.startsWith("fieldNpcAccept:") && !action.startsWith("fieldNpcLater:")) return false;
  resolveFieldNetworkBeforeDispatcher(action);
  return true;
});

HavensInteractionDispatcher.installEncounterGateway();

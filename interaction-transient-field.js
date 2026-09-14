// Haven's Reach — Expansion Foundation Pass 5B4 / 5C2
// Kestrel Transient Field Lead Interaction Migration

const resolveTransientFieldBeforeDispatcher = window.resolveEncounter;
const openTransientFieldBeforeDispatcher = window.openNpcInteraction;
const TRANSIENT_FIELD_ACTIONS = new Set([
  "draakFieldAccept",
  "draakFieldLater"
]);

HavensInteractionDispatcher.registerEncounterHandler("transient-field", action => {
  if (!TRANSIENT_FIELD_ACTIONS.has(action)) return false;
  resolveTransientFieldBeforeDispatcher(action);
  return true;
});

HavensInteractionDispatcher.registerNpcInteractionHandler("transient-field", id => {
  if (id !== "draak" || !draakFieldLeadPending()) return false;
  openTransientFieldBeforeDispatcher(id);
  return true;
});

HavensInteractionDispatcher.installEncounterGateway();
HavensInteractionDispatcher.installNpcInteractionGateway();

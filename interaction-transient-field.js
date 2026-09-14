// Haven's Reach — Expansion Foundation Pass 5B4
// Kestrel Transient Field Lead Encounter Migration

const resolveTransientFieldBeforeDispatcher = window.resolveEncounter;
const TRANSIENT_FIELD_ACTIONS = new Set([
  "draakFieldAccept",
  "draakFieldLater"
]);

HavensInteractionDispatcher.registerEncounterHandler("transient-field", action => {
  if (!TRANSIENT_FIELD_ACTIONS.has(action)) return false;
  resolveTransientFieldBeforeDispatcher(action);
  return true;
});

HavensInteractionDispatcher.installEncounterGateway();

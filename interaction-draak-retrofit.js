// Haven's Reach — Expansion Foundation Pass 5B4
// Draak Freight Retrofit Encounter Migration

const resolveDraakRetrofitBeforeDispatcher = window.resolveEncounter;
const DRAAK_RETROFIT_ACTIONS = new Set([
  "draakRetrofitAccept",
  "draakRetrofitLater"
]);

HavensInteractionDispatcher.registerEncounterHandler("draak-retrofit", action => {
  if (!DRAAK_RETROFIT_ACTIONS.has(action)) return false;
  resolveDraakRetrofitBeforeDispatcher(action);
  return true;
});

HavensInteractionDispatcher.installEncounterGateway();

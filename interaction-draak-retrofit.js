// Haven's Reach — Expansion Foundation Pass 5B4 / 5C2
// Draak Freight Retrofit Interaction Migration

const resolveDraakRetrofitBeforeDispatcher = window.resolveEncounter;
const openDraakRetrofitBeforeDispatcher = window.openNpcInteraction;
const DRAAK_RETROFIT_ACTIONS = new Set([
  "draakRetrofitAccept",
  "draakRetrofitLater"
]);

HavensInteractionDispatcher.registerEncounterHandler("draak-retrofit", action => {
  if (!DRAAK_RETROFIT_ACTIONS.has(action)) return false;
  resolveDraakRetrofitBeforeDispatcher(action);
  return true;
});

HavensInteractionDispatcher.registerNpcInteractionHandler("draak-retrofit", id => {
  if (id !== "draak" || !draakRetrofitPending()) return false;
  openDraakRetrofitBeforeDispatcher(id);
  return true;
});

HavensInteractionDispatcher.installEncounterGateway();
HavensInteractionDispatcher.installNpcInteractionGateway();

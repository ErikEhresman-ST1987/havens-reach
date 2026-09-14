// Haven's Reach — Expansion Foundation Pass 5A
// Interaction Dispatcher Foundation
//
// Provides explicit extension points for encounter actions and NPC interaction routing
// without changing current behavior. Existing wrapper chains remain authoritative until
// migrated one at a time in later Pass 5 slices.

window.HavensInteractionDispatcher = (() => {
  const encounterHandlers = [];
  const npcInteractionHandlers = [];

  function register(list, id, handler) {
    if (typeof id !== "string" || !id || typeof handler !== "function") return false;
    if (list.some(entry => entry.id === id)) return false;
    list.push({ id, handler });
    return true;
  }

  function registerEncounterHandler(id, handler) {
    return register(encounterHandlers, id, handler);
  }

  function registerNpcInteractionHandler(id, handler) {
    return register(npcInteractionHandlers, id, handler);
  }

  function dispatchEncounter(action, context = {}) {
    for (const entry of encounterHandlers) {
      if (entry.handler(action, context) === true) return true;
    }
    return false;
  }

  function dispatchNpcInteraction(id, context = {}) {
    for (const entry of npcInteractionHandlers) {
      if (entry.handler(id, context) === true) return true;
    }
    return false;
  }

  function registeredHandlers() {
    return {
      encounter: encounterHandlers.map(entry => entry.id),
      npcInteraction: npcInteractionHandlers.map(entry => entry.id)
    };
  }

  return {
    registerEncounterHandler,
    registerNpcInteractionHandler,
    dispatchEncounter,
    dispatchNpcInteraction,
    registeredHandlers
  };
})();

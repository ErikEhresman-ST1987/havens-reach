// Haven's Reach — Expansion Foundation Pass 5A / 5B1
// Interaction Dispatcher Foundation
//
// Provides explicit extension points for encounter actions and NPC interaction routing.
// Pass 5B1 adds a compatibility gateway so migrated encounter owners can use the
// dispatcher while unhandled actions continue through the proven base resolver.

window.HavensInteractionDispatcher = (() => {
  const encounterHandlers = [];
  const npcInteractionHandlers = [];
  const baseEncounterResolver = window.resolveEncounter;

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

  function installEncounterGateway() {
    window.resolveEncounter = function resolveEncounterThroughDispatcher(action) {
      if (dispatchEncounter(action)) return;
      return baseEncounterResolver(action);
    };
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
    installEncounterGateway,
    registeredHandlers
  };
})();

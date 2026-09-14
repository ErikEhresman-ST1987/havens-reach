// Haven's Reach — Expansion Foundation Pass 5A / 5B / 5C / 5D2
// Interaction Dispatcher Foundation
//
// Provides explicit extension points for encounter interception, encounter actions,
// and NPC interaction routing. Interceptors run before the owning encounter handler.
// Encounter handlers preserve registration order. NPC interaction handlers run newest
// first so explicit later-loaded owners retain the same precedence as the legacy wrapper chain.

window.HavensInteractionDispatcher = (() => {
  const encounterInterceptors = [];
  const encounterHandlers = [];
  const npcInteractionHandlers = [];
  const baseEncounterResolver = window.resolveEncounter;

  function register(list, id, handler) {
    if (typeof id !== "string" || !id || typeof handler !== "function") return false;
    if (list.some(entry => entry.id === id)) return false;
    list.push({ id, handler });
    return true;
  }

  function registerEncounterInterceptor(id, handler) {
    return register(encounterInterceptors, id, handler);
  }

  function registerEncounterHandler(id, handler) {
    return register(encounterHandlers, id, handler);
  }

  function registerNpcInteractionHandler(id, handler) {
    return register(npcInteractionHandlers, id, handler);
  }

  function dispatchEncounter(action, context = {}) {
    for (const entry of encounterInterceptors) {
      if (entry.handler(action, context) === true) return true;
    }
    for (const entry of encounterHandlers) {
      if (entry.handler(action, context) === true) return true;
    }
    return false;
  }

  function dispatchNpcInteraction(id, context = {}) {
    for (let index = npcInteractionHandlers.length - 1; index >= 0; index -= 1) {
      if (npcInteractionHandlers[index].handler(id, context) === true) return true;
    }
    return false;
  }

  function installEncounterGateway() {
    window.resolveEncounter = function resolveEncounterThroughDispatcher(action) {
      if (dispatchEncounter(action)) return;
      return baseEncounterResolver(action);
    };
  }

  function installNpcInteractionGateway() {
    window.openNpcInteraction = function openNpcInteractionThroughDispatcher(id) {
      dispatchNpcInteraction(id);
    };
  }

  function registeredHandlers() {
    return {
      encounterInterceptor: encounterInterceptors.map(entry => entry.id),
      encounter: encounterHandlers.map(entry => entry.id),
      npcInteraction: npcInteractionHandlers.map(entry => entry.id)
    };
  }

  return {
    registerEncounterInterceptor,
    registerEncounterHandler,
    registerNpcInteractionHandler,
    dispatchEncounter,
    dispatchNpcInteraction,
    installEncounterGateway,
    installNpcInteractionGateway,
    registeredHandlers
  };
})();

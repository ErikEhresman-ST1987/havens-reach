// Haven's Reach — Travel Lifecycle Foundation
// Provides explicit extension points for travel-related systems without changing
// current travel behavior. Existing wrappers remain authoritative until migrated
// one at a time in later architecture slices.

window.HavensTravelLifecycle = (() => {
  const beforeTravel = [];
  const afterTravel = [];

  function register(list, id, handler) {
    if (typeof id !== "string" || !id || typeof handler !== "function") return false;
    if (list.some(entry => entry.id === id)) return false;
    list.push({ id, handler });
    return true;
  }

  function registerBefore(id, handler) {
    return register(beforeTravel, id, handler);
  }

  function registerAfter(id, handler) {
    return register(afterTravel, id, handler);
  }

  function runBefore(context) {
    for (const entry of beforeTravel) {
      const result = entry.handler(context);
      if (result === false) return false;
    }
    return true;
  }

  function runAfter(context) {
    afterTravel.forEach(entry => entry.handler(context));
  }

  function registeredHooks() {
    return {
      before: beforeTravel.map(entry => entry.id),
      after: afterTravel.map(entry => entry.id)
    };
  }

  return {
    registerBefore,
    registerAfter,
    runBefore,
    runAfter,
    registeredHooks
  };
})();

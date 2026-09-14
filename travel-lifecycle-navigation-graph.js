// Haven's Reach — Expansion Foundation Pass 4B
// Route-Aware Travel Enforcement
//
// Adds route knowledge to the authoritative travel lifecycle without changing the
// proven travel operation. A destination must be known and the direct physical link
// from the current location must also be present in the operator's known route graph.

HavensTravelLifecycle.registerBefore("navigation-graph", context => {
  if (!isSystemKnown(context.requestedDestination)) return true;
  if (isRouteKnown(context.origin, context.requestedDestination)) return true;

  addLog("No charted route connects your current location to that destination.");
  render();
  return false;
});

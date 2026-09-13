// Haven's Reach — Travel Lifecycle Migration: Progressive Discovery
// Moves navigation-knowledge validation out of Progressive Discovery's travel wrapper
// and into the shared travel lifecycle. The original wrapper remains dormant in
// progressive-discovery.js as rollback reference during architecture hardening.

HavensTravelLifecycle.registerBefore("progressive-discovery", context => {
  if (isSystemKnown(context.requestedDestination)) return true;

  addLog("That destination is not yet recorded in the navigation computer.");
  render();
  return false;
});

// Progressive Discovery saved the function that was active before it installed its
// travel wrapper. Restore that proven underlying travel operation, then make the
// shared lifecycle the single authoritative travel dispatcher for the migrated
// travel concerns: discovery validation, dynamic markets, and the field network.
const travelBeforeAuthoritativeLifecycle = travelBeforeDiscovery;

travel = function travelWithAuthoritativeLifecycle(destination, fuelCost) {
  ensureDynamicMarketState();

  const context = {
    origin: state.location,
    requestedDestination: destination,
    fuelCost,
    tripBefore: Number.isFinite(state.tripCount) ? state.tripCount : 0
  };

  if (HavensTravelLifecycle.runBefore(context) === false) return;

  const result = travelBeforeAuthoritativeLifecycle(destination, fuelCost);
  const tripAfter = Number.isFinite(state.tripCount) ? state.tripCount : context.tripBefore;

  if (state.location !== context.origin || tripAfter !== context.tripBefore) {
    context.destination = state.location;
    context.tripAfter = tripAfter;
    HavensTravelLifecycle.runAfter(context);
  }

  return result;
};

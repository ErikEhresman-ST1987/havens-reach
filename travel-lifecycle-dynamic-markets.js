// Haven's Reach — Travel Lifecycle Migration: Dynamic Markets
// Removes Dynamic Markets from the active travel wrapper chain without changing
// its proven post-trip behavior. The original wrapper remains dormant in
// dynamic-markets.js as a rollback reference during architecture hardening.

HavensTravelLifecycle.registerAfter("dynamic-markets", () => {
  updateExpiredDynamicMarkets();
  rememberCurrentMarket();
  saveState();
  render();
});

// dynamic-markets.js saved the travel function it received before installing its
// feature-specific wrapper. Restore that proven function, then place the neutral
// lifecycle dispatcher around it. At this point that restored function still
// includes Progressive Discovery's validation wrapper.
const travelBeforeLifecycleDispatcher = travelBeforeDynamicMarkets;

travel = function travelWithLifecycle(destination, fuelCost) {
  ensureDynamicMarketState();
  const beforeLocation = state.location;
  const beforeTrip = state.tripCount;
  const result = travelBeforeLifecycleDispatcher(destination, fuelCost);

  if (state.location !== beforeLocation || state.tripCount !== beforeTrip) {
    HavensTravelLifecycle.runAfter({
      origin: beforeLocation,
      destination: state.location,
      requestedDestination: destination,
      fuelCost,
      tripBefore: beforeTrip,
      tripAfter: state.tripCount
    });
  }

  return result;
};

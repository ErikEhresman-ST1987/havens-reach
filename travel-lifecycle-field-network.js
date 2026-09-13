// Haven's Reach — Travel Lifecycle Migration: Field Network
// Removes Field Network from the active travel wrapper chain while preserving its
// proven departure cleanup, field-view selection, and post-trip scanner behavior.
// The original wrapper remains dormant in field-network.js as rollback reference.

HavensTravelLifecycle.registerBefore("field-network", context => {
  context.fieldNetwork = {
    leavingResolved: fieldNetworkIsSite(context.origin) && Boolean(state.fieldNetwork?.sites?.[context.origin]?.resolved)
  };

  if (fieldNetworkIsSite(context.requestedDestination)) currentView = "overview";
  return true;
});

HavensTravelLifecycle.registerAfter("field-network", context => {
  if (context.fieldNetwork?.leavingResolved && state.location !== context.origin) {
    completeAndRemoveFieldNetworkSite(context.origin);
    saveState();
    render();
  }

  if (!fieldNetworkIsSite(state.location) && state.location !== DRAAK_FIELD_ID) {
    maybeDiscoverFieldByScanner();
  }
});

// Both migrated systems now share one authoritative lifecycle dispatcher. Restore
// the proven pre-Dynamic-Markets function (which still includes Progressive
// Discovery validation), bypassing both old feature wrappers and the earlier
// temporary market-only dispatcher.
const travelBeforeMigratedLifecycle = travelBeforeDynamicMarkets;

travel = function travelWithMigratedLifecycle(destination, fuelCost) {
  ensureDynamicMarketState();

  const context = {
    origin: state.location,
    requestedDestination: destination,
    fuelCost,
    tripBefore: Number.isFinite(state.tripCount) ? state.tripCount : 0
  };

  if (HavensTravelLifecycle.runBefore(context) === false) return;

  const result = travelBeforeMigratedLifecycle(destination, fuelCost);
  const tripAfter = Number.isFinite(state.tripCount) ? state.tripCount : context.tripBefore;

  if (state.location !== context.origin || tripAfter !== context.tripBefore) {
    context.destination = state.location;
    context.tripAfter = tripAfter;
    HavensTravelLifecycle.runAfter(context);
  }

  return result;
};

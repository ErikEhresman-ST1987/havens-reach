// Haven's Reach — Expansion Foundation Pass 4D
// Field Network Navigation Graph Integration
//
// Gives transient field sites the same explicit navigation ownership as permanent
// systems: discovery records the site and its anchor route; removal clears both.
// Field gameplay, discovery chances, outcomes, and travel behavior remain unchanged.

function fieldNetworkRemoveKnownRoute(siteId) {
  const def = FIELD_NETWORK_SITES[siteId];
  if (!def || !Array.isArray(state.navigation?.knownRoutes)) return;
  const key = navigationRouteKey(siteId, def.anchor);
  state.navigation.knownRoutes = state.navigation.knownRoutes.filter(routeKey => routeKey !== key);
}

const revealFieldNetworkSiteBeforeNavigationGraph = revealFieldNetworkSite;
revealFieldNetworkSite = function revealFieldNetworkSiteWithNavigationGraph(id, source, logText) {
  const revealed = revealFieldNetworkSiteBeforeNavigationGraph(id, source, logText);
  if (!revealed) return false;

  const def = FIELD_NETWORK_SITES[id];
  if (def) discoverRoute(def.anchor, id);
  saveState();
  return true;
};

const removeFieldNetworkSiteBeforeNavigationGraph = removeFieldNetworkSite;
removeFieldNetworkSite = function removeFieldNetworkSiteWithNavigationGraph(id) {
  fieldNetworkRemoveKnownRoute(id);
  return removeFieldNetworkSiteBeforeNavigationGraph(id);
};

// Existing unresolved field sites may have been discovered before Pass 4D. Restore
// their explicit route once without changing their field state or producing new logs.
ensureFieldNetworkState();
ensureNavigationGraphState();
Object.entries(FIELD_NETWORK_SITES).forEach(([id, def]) => {
  const record = state.fieldNetwork?.sites?.[id];
  if (!record?.discovered || record.completed || !isSystemKnown(id) || !isSystemKnown(def.anchor)) return;
  const key = navigationRouteKey(id, def.anchor);
  if (!state.navigation.knownRoutes.includes(key) && navigationPhysicalRouteExists(id, def.anchor)) {
    state.navigation.knownRoutes.push(key);
  }
});
saveState();

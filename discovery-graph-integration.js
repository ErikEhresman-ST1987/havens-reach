// Haven's Reach — Expansion Foundation Pass 4C
// Explicit First Frontier Discovery Graph Integration
//
// Keeps the proven player-facing discovery sequence while making each frontier unlock
// explicitly record both the newly learned system and the route that makes it reachable.
// The original Progressive Discovery functions remain in place as rollback reference.

function discoverFirstFrontierSystemAndRoute(systemId, fromId, systemReason, routeReason) {
  const systemUnlocked = discoverSystem(systemId, systemReason);
  const routeUnlocked = discoverRoute(fromId, systemId, routeReason);
  return systemUnlocked || routeUnlocked;
}

const investigateOuterBeaconBeforeGraphIntegration = investigateOuterBeacon;
investigateOuterBeacon = function investigateOuterBeaconWithExplicitRoute() {
  const alreadyKnown = isSystemKnown("caldersDrift");
  investigateOuterBeaconBeforeGraphIntegration();

  // The legacy action still owns its exact cantina/discovery text. Pass 4C explicitly
  // records the physical route after that action establishes system knowledge.
  if (!alreadyKnown && isSystemKnown("caldersDrift")) {
    discoverRoute("prospect", "caldersDrift", "The Outer Beacon coordinates resolve into a dependable outward vector.");
  }
};

const discoverRedMesaBeforeGraphIntegration = discoverRedMesa;
discoverRedMesa = function discoverRedMesaWithExplicitRoute() {
  const alreadyKnown = isSystemKnown("redMesa");
  discoverRedMesaBeforeGraphIntegration();
  if (!alreadyKnown && isSystemKnown("redMesa")) {
    discoverRoute("caldersDrift", "redMesa", "The compared freight notes establish the direct corridor from Calder's Drift.");
  }
};

const discoverPelagosBeforeGraphIntegration = discoverPelagos;
discoverPelagos = function discoverPelagosWithExplicitRoute() {
  const alreadyKnown = isSystemKnown("pelagos");
  discoverPelagosBeforeGraphIntegration();
  if (!alreadyKnown && isSystemKnown("pelagos")) {
    discoverRoute("redMesa", "pelagos", "The verified survey vector establishes the direct outer route from Red Mesa Junction.");
  }
};

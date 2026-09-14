// Haven's Reach — Expansion Foundation Pass 4A/4C
// Navigation Graph Foundation
//
// Separates persistent route knowledge from system knowledge. Pass 4A migrated existing
// saves by inferring the routes that the old system treated as known. Pass 4C freezes
// that migration after initialization so future system and route discoveries can occur
// explicitly and independently.

function navigationRouteKey(a, b) {
  return [a, b].sort().join("|");
}

function navigationPhysicalRouteExists(a, b) {
  if (!GAME_DATA.systems[a] || !GAME_DATA.systems[b]) return false;
  return Number.isFinite(GAME_DATA.systems[a].neighbors?.[b]) || Number.isFinite(GAME_DATA.systems[b].neighbors?.[a]);
}

function ensureNavigationGraphState() {
  if (typeof ensureNavigationDiscoveryState === "function") ensureNavigationDiscoveryState();
  if (!state.navigation || typeof state.navigation !== "object") state.navigation = {};
  if (!Array.isArray(state.navigation.knownSystems)) state.navigation.knownSystems = [];
  if (!Array.isArray(state.navigation.knownRoutes)) state.navigation.knownRoutes = [];

  // One-time compatibility migration. Saves created before explicit route ownership
  // inferred route knowledge from every physical link whose endpoints were already
  // known. Once recorded, route knowledge becomes persistent fact and is no longer
  // automatically derived from system knowledge.
  if (state.navigation.routeGraphInitialized !== true) {
    const known = new Set(state.navigation.knownSystems.filter(id => GAME_DATA.systems[id]));
    const routeSet = new Set(state.navigation.knownRoutes.filter(key => typeof key === "string" && key.includes("|")));

    known.forEach(a => {
      Object.keys(GAME_DATA.systems[a]?.neighbors || {}).forEach(b => {
        if (known.has(b) && navigationPhysicalRouteExists(a, b)) routeSet.add(navigationRouteKey(a, b));
      });
    });

    state.navigation.knownRoutes = [...routeSet];
    state.navigation.routeGraphInitialized = true;
  }
}

function isRouteKnown(a, b) {
  ensureNavigationGraphState();
  return navigationPhysicalRouteExists(a, b) && state.navigation.knownRoutes.includes(navigationRouteKey(a, b));
}

function discoverRoute(a, b, reason = "") {
  ensureNavigationGraphState();
  if (!navigationPhysicalRouteExists(a, b)) return false;
  if (!isSystemKnown(a) || !isSystemKnown(b)) return false;

  const key = navigationRouteKey(a, b);
  if (state.navigation.knownRoutes.includes(key)) return false;

  state.navigation.knownRoutes.push(key);
  const aName = GAME_DATA.systems[a]?.name || a;
  const bName = GAME_DATA.systems[b]?.name || b;
  addLog(`Route charted: ${aName} ↔ ${bName}.${reason ? ` ${reason}` : ""}`);
  saveState();
  return true;
}

shortestRoute = function shortestKnownNavigationGraphRoute(start, goal) {
  ensureNavigationGraphState();
  if (!isSystemKnown(start) || !isSystemKnown(goal)) return null;
  if (start === goal) return { path: [start], fuel: 0 };

  const known = new Set(state.navigation.knownSystems);
  const dist = { [start]: 0 };
  const prev = {};
  const unvisited = new Set([...known].filter(id => GAME_DATA.systems[id]));

  while (unvisited.size) {
    let current = null;
    let best = Infinity;
    unvisited.forEach(id => {
      const d = dist[id] ?? Infinity;
      if (d < best) { best = d; current = id; }
    });
    if (current === null || best === Infinity) break;
    unvisited.delete(current);
    if (current === goal) break;

    Object.entries(GAME_DATA.systems[current].neighbors || {}).forEach(([next, cost]) => {
      if (!known.has(next) || !GAME_DATA.systems[next] || !isRouteKnown(current, next)) return;
      const candidate = best + cost;
      if (candidate < (dist[next] ?? Infinity)) {
        dist[next] = candidate;
        prev[next] = current;
      }
    });
  }

  if (dist[goal] === undefined) return null;
  const path = [goal];
  while (path[0] !== start) {
    const parent = prev[path[0]];
    if (!parent) return null;
    path.unshift(parent);
  }
  return { path, fuel: dist[goal] };
};

if (typeof travelMapKnownEdges === "function") {
  travelMapKnownEdges = function travelMapKnownNavigationEdges(knownIds) {
    ensureNavigationGraphState();
    const known = new Set(knownIds);
    const seen = new Set();
    const edges = [];

    knownIds.forEach(id => {
      Object.entries(GAME_DATA.systems[id]?.neighbors || {}).forEach(([other, fuel]) => {
        if (!known.has(other) || !TRAVEL_MAP_POSITIONS[other] || !isRouteKnown(id, other)) return;
        const key = navigationRouteKey(id, other);
        if (seen.has(key)) return;
        seen.add(key);
        edges.push({ a: id, b: other, fuel });
      });
    });

    return edges;
  };
}

ensureNavigationGraphState();
saveState();

// Haven's Reach — Expansion Foundation Pass 4A
// Navigation Graph Foundation
//
// Introduces persistent route knowledge as a concept separate from system knowledge.
// This pass deliberately preserves current First Frontier behavior: every physical link
// between systems the operator already knows is inferred as a known route. Later Pass 4
// slices can make system discovery and route discovery happen independently.

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

  const known = new Set(state.navigation.knownSystems.filter(id => GAME_DATA.systems[id]));
  const routeSet = new Set(state.navigation.knownRoutes.filter(key => typeof key === "string" && key.includes("|")));

  // Pass 4A migration rule: preserve the exact current map for every existing save.
  // Any physical connection whose endpoints are already known becomes a known route.
  // This is intentionally one-way migration behavior; later discovery code will add
  // new systems/routes explicitly rather than relying on this inference forever.
  known.forEach(a => {
    Object.keys(GAME_DATA.systems[a]?.neighbors || {}).forEach(b => {
      if (known.has(b) && navigationPhysicalRouteExists(a, b)) routeSet.add(navigationRouteKey(a, b));
    });
  });

  state.navigation.knownRoutes = [...routeSet];
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

// Pass 4A route finder: same Dijkstra behavior as Progressive Discovery, but edges now
// come from the operator's persistent known-route graph rather than merely assuming
// that two known neighboring systems imply route knowledge.
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

// Keep the operational map visually identical in 4A while making its edges read from
// the new route-knowledge owner. Travel enforcement itself remains unchanged until 4B.
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

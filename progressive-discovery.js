// Haven's Reach — Progressive Discovery #1
// The frontier exists in GAME_DATA, but the operator's navigation map grows through play.
// Existing saves retain frontier systems that the player has already physically visited.

const CORE_KNOWN_SYSTEMS = ["haven", "meridian", "prospect"];
const FRONTIER_DISCOVERY_CHAIN = ["caldersDrift", "redMesa", "pelagos"];

function ensureNavigationDiscoveryState() {
  if (!state.navigation) state.navigation = {};
  if (!Array.isArray(state.navigation.knownSystems)) {
    state.navigation.knownSystems = [...CORE_KNOWN_SYSTEMS];
  }

  CORE_KNOWN_SYSTEMS.forEach(id => {
    if (!state.navigation.knownSystems.includes(id)) state.navigation.knownSystems.push(id);
  });

  // Never strand or erase knowledge from an existing save. Market memory proves a port
  // was previously visited; the current location obviously does too. Add prerequisite
  // route stops so every preserved frontier location remains reachable on the known map.
  const previouslyVisited = new Set([state.location]);
  if (state.marketMemory && typeof state.marketMemory === "object") {
    Object.keys(state.marketMemory).forEach(id => previouslyVisited.add(id));
  }

  function preserveThrough(id) {
    const index = FRONTIER_DISCOVERY_CHAIN.indexOf(id);
    if (index < 0) return;
    FRONTIER_DISCOVERY_CHAIN.slice(0, index + 1).forEach(systemId => {
      if (!state.navigation.knownSystems.includes(systemId)) state.navigation.knownSystems.push(systemId);
    });
  }

  previouslyVisited.forEach(preserveThrough);
}

function isSystemKnown(id) {
  ensureNavigationDiscoveryState();
  return state.navigation.knownSystems.includes(id);
}

function discoverSystem(id, reason) {
  ensureNavigationDiscoveryState();
  if (!GAME_DATA.systems[id] || isSystemKnown(id)) return false;
  state.navigation.knownSystems.push(id);
  addLog(`${GAME_DATA.systems[id].name} added to navigation. ${reason}`);
  saveState();
  renderStatus();
  return true;
}

// Route planning now uses only systems the operator actually knows.
shortestRoute = function shortestKnownRoute(start, goal) {
  ensureNavigationDiscoveryState();
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
      if (!known.has(next) || !GAME_DATA.systems[next]) return;
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

routeText = function routeTextKnown(start, destination) {
  const route = shortestRoute(start, destination);
  if (!route) return "No known route";
  return route.path.map(id => GAME_DATA.systems[id].name).join(" → ");
};

contractRouteSummary = function contractKnownRouteSummary(destination) {
  if (!isSystemKnown(destination)) return `<span class="muted small">Destination not yet charted</span>`;
  const route = shortestRoute(state.location, destination);
  if (!route) return `<span class="warn">No known route</span>`;
  const jumps = Math.max(0, route.path.length - 1);
  return `<span class="muted small">Route: ${escapeHtml(route.path.map(id => GAME_DATA.systems[id].name).join(" → "))} • ${jumps} jump${jumps === 1 ? "" : "s"} • ${route.fuel} total route fuel</span>`;
};

// Hide contracts whose destinations have not yet been discovered. The jobs still exist
// in the world; the local board simply cannot offer an operator a route they cannot chart.
const renderContractsBeforeDiscovery = renderContracts;
renderContracts = function renderDiscoveryAwareContracts() {
  renderContractsBeforeDiscovery();

  view.querySelectorAll('.contract-row').forEach(row => {
    const button = row.querySelector('button[onclick*="acceptContract"]');
    if (!button) return;
    const match = button.getAttribute('onclick').match(/acceptContract\('([^']+)'\)/);
    const contract = match ? findContract(match[1]) : null;
    if (contract && !isSystemKnown(contract.destination)) row.remove();
  });
};

// Enforce discovery beneath the UI as well, while delegating all normal travel behavior
// to the proven travel function for known destinations.
const travelBeforeDiscovery = travel;
travel = function travelOnlyKnownSystems(id, fuelCost) {
  if (!isSystemKnown(id)) {
    addLog("That destination is not yet recorded in the navigation computer.");
    return render();
  }
  return travelBeforeDiscovery(id, fuelCost);
};

renderTravel = function renderDiscoveryAwareTravel() {
  ensureNavigationDiscoveryState();
  const system = GAME_DATA.systems[state.location];
  const rows = Object.entries(system.neighbors)
    .filter(([id]) => isSystemKnown(id))
    .map(([id, fuelCost]) => {
      const destination = GAME_DATA.systems[id];
      return `<div class="travel-row">
        <div><strong>${escapeHtml(destination.name)}</strong><div class="muted small">${escapeHtml(destination.type)}</div></div>
        <div>${fuelCost} fuel</div>
        <div class="muted">${escapeHtml(destination.description)}${typeof rememberedMarketSummary === "function" ? rememberedMarketSummary(id) : ""}</div>
        <button class="primary" onclick="travel('${id}', ${fuelCost})" ${state.ship.fuel < fuelCost ? "disabled" : ""}>Travel</button>
      </div>`;
    }).join("");

  const active = state.activeContract;
  const activeRoute = active && isSystemKnown(active.destination) ? `
    <article class="info-card" style="margin-bottom:16px">
      <h3>Active Contract Route</h3>
      <p><strong>${escapeHtml(active.title)}</strong> — ${escapeHtml(GAME_DATA.systems[active.destination].name)}</p>
      <p>${contractRouteSummary(active.destination)}</p>
      <p class="muted small">Travel one linked system at a time. The route updates automatically as you progress.</p>
    </article>` : "";

  const knownRoutes = state.navigation.knownSystems
    .filter(id => GAME_DATA.systems[id])
    .map(id => {
      const s = GAME_DATA.systems[id];
      const links = Object.keys(s.neighbors || {})
        .filter(n => isSystemKnown(n))
        .map(n => GAME_DATA.systems[n]?.name)
        .filter(Boolean)
        .join(", ");
      return `<div class="muted small"><strong>${escapeHtml(s.name)}:</strong> ${escapeHtml(links || "No known links")}</div>`;
    }).join("");

  view.innerHTML = `
    <div class="section-heading"><div><p class="eyebrow">NAVIGATION</p><h2>Reachable Systems</h2></div></div>
    ${activeRoute}
    ${rows || `<p class="muted">No charted neighboring systems are currently reachable.</p>`}
    <article class="info-card" style="margin-top:16px">
      <h3>Known Route Network</h3>
      <p class="muted small">Only routes your operator has actually learned appear here.</p>
      ${knownRoutes}
    </article>
    <p class="muted small">The wider frontier exists beyond these charts. Useful coordinates can come from rumors, contacts, contracts, surveys, and other discoveries.</p>`;
};

// The existing Outer Beacon lead now becomes the first real frontier unlock.
const investigateOuterBeaconBeforeDiscovery = investigateOuterBeacon;
investigateOuterBeacon = function investigateAndChartCalder() {
  const alreadyHadLead = Boolean(state.cantina?.discoveries?.outerBeacon);
  if (!alreadyHadLead) investigateOuterBeaconBeforeDiscovery();
  const unlocked = discoverSystem("caldersDrift", "The Outer Beacon coordinates from Prospect Reach resolve into a maintained route toward the old Calder navigation platform.");
  if (unlocked) {
    addLog("The frontier just got larger: Calder's Drift is now reachable from Prospect Reach.");
    saveState();
  }
  renderCantina();
};

function discoverRedMesa() {
  if (state.location !== "caldersDrift") return;
  const unlocked = discoverSystem("redMesa", "Freight crews at Driftwood compared route notes and gave you a dependable vector to Red Mesa Junction.");
  if (unlocked) addLog("Red Mesa Junction is now charted beyond Calder's Drift.");
  renderCantina();
}

function discoverPelagos() {
  if (state.location !== "redMesa") return;
  const unlocked = discoverSystem("pelagos", "Kharok freight crews supplied a verified outer vector to the Elyri survey anchorage at Pelagos.");
  if (unlocked) addLog("Pelagos Survey Anchorage is now charted beyond Red Mesa Junction.");
  renderCantina();
}

// Add discovery opportunities to the proven cantina view after it renders.
const renderCantinaBeforeDiscovery = renderCantina;
renderCantina = function renderCantinaWithDiscovery() {
  renderCantinaBeforeDiscovery();
  ensureNavigationDiscoveryState();

  let html = "";
  if (state.location === "prospect" && state.cantina?.discoveries?.outerBeacon && !isSystemKnown("caldersDrift")) {
    html = `
      <article class="info-card" style="margin-top:16px">
        <h3>Chart the Outer Beacon Lead</h3>
        <p class="muted small">You already have the beacon coordinates. Your navigation computer can now resolve them into a usable outward route.</p>
        <button class="secondary" type="button" onclick="investigateOuterBeacon()">Plot the outer route</button>
      </article>`;
  } else if (state.location === "caldersDrift" && !isSystemKnown("redMesa")) {
    html = `
      <article class="info-card" style="margin-top:16px">
        <h3>Follow the Freight Talk</h3>
        <p class="muted small">The repeated Red Mesa traffic reports sound precise enough to turn into a dependable route.</p>
        <button class="secondary" type="button" onclick="discoverRedMesa()">Compare route notes</button>
      </article>`;
  } else if (state.location === "redMesa" && !isSystemKnown("pelagos")) {
    html = `
      <article class="info-card" style="margin-top:16px">
        <h3>Ask About the Outer Anchorage</h3>
        <p class="muted small">Several crews know the Pelagos supply run. A verified navigation vector should be obtainable here.</p>
        <button class="secondary" type="button" onclick="discoverPelagos()">Acquire outer survey vector</button>
      </article>`;
  }

  if (html) view.insertAdjacentHTML('beforeend', html);
};

ensureNavigationDiscoveryState();
saveState();

// Haven's Reach — Controlled World Expansion #1
// Solves long-distance navigation clarity and adds three new systems.
// Permanent system definitions now come from world-data.js; this module retains
// the proven expansion timing and navigation behavior.

const EXPANDED_SYSTEMS = {
  caldersDrift: FIRST_FRONTIER_SYSTEMS.caldersDrift,
  redMesa: FIRST_FRONTIER_SYSTEMS.redMesa,
  pelagos: FIRST_FRONTIER_SYSTEMS.pelagos
};

Object.assign(GAME_DATA.systems, EXPANDED_SYSTEMS);

// Connect the established frontier to the expansion at the same point in the load
// sequence as before, preserving the proven staged world setup.
GAME_DATA.systems.prospect.neighbors.caldersDrift = 22;

// Add the authored long-distance contract from the world-data source.
const meridianPelagosContract = FIRST_FRONTIER_ADDITIONAL_CONTRACTS.meridian
  .find(contract => contract.id === "meridian-pelagos");
if (meridianPelagosContract && !GAME_DATA.systems.meridian.contracts.some(c => c.id === meridianPelagosContract.id)) {
  GAME_DATA.systems.meridian.contracts.push(meridianPelagosContract);
}

function shortestRoute(start, goal) {
  if (start === goal) return { path: [start], fuel: 0 };
  const dist = { [start]: 0 };
  const prev = {};
  const unvisited = new Set(Object.keys(GAME_DATA.systems));

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
      if (!GAME_DATA.systems[next]) return;
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
}

function routeText(start, destination) {
  const route = shortestRoute(start, destination);
  if (!route) return "No known route";
  return route.path.map(id => GAME_DATA.systems[id].name).join(" → ");
}

function contractRouteSummary(destination) {
  const route = shortestRoute(state.location, destination);
  if (!route) return `<span class="warn">No known route</span>`;
  const jumps = Math.max(0, route.path.length - 1);
  return `<span class="muted small">Route: ${escapeHtml(route.path.map(id => GAME_DATA.systems[id].name).join(" → "))} • ${jumps} jump${jumps === 1 ? "" : "s"} • ${route.fuel} total route fuel</span>`;
}

// Extend the current repeatable-contract board with route information.
const contractRendererBeforeRoutes = renderContracts;
renderContracts = function renderContractsWithRoutes() {
  contractRendererBeforeRoutes();
  view.querySelectorAll('.contract-row').forEach(row => {
    const button = row.querySelector('button[onclick*="acceptContract"]');
    if (!button) return;
    const match = button.getAttribute('onclick').match(/acceptContract\('([^']+)'\)/);
    const contract = match ? findContract(match[1]) : null;
    if (!contract) return;
    const first = row.querySelector('div');
    if (first) first.insertAdjacentHTML('beforeend', `<div style="margin-top:6px">${contractRouteSummary(contract.destination)}</div>`);
  });
};

// Navigation remains one jump at a time, but now shows the network and the active-contract route.
renderTravel = function renderExpandedTravel() {
  const system = GAME_DATA.systems[state.location];
  const rows = Object.entries(system.neighbors).map(([id, fuelCost]) => {
    const destination = GAME_DATA.systems[id];
    return `<div class="travel-row">
      <div><strong>${escapeHtml(destination.name)}</strong><div class="muted small">${escapeHtml(destination.type)}</div></div>
      <div>${fuelCost} fuel</div>
      <div class="muted">${escapeHtml(destination.description)}${typeof rememberedMarketSummary === "function" ? rememberedMarketSummary(id) : ""}</div>
      <button class="primary" onclick="travel('${id}', ${fuelCost})" ${state.ship.fuel < fuelCost ? "disabled" : ""}>Travel</button>
    </div>`;
  }).join("");

  const active = state.activeContract;
  const activeRoute = active ? `
    <article class="info-card" style="margin-bottom:16px">
      <h3>Active Contract Route</h3>
      <p><strong>${escapeHtml(active.title)}</strong> — ${escapeHtml(GAME_DATA.systems[active.destination].name)}</p>
      <p>${contractRouteSummary(active.destination)}</p>
      <p class="muted small">Travel one linked system at a time. The route updates automatically as you progress.</p>
    </article>` : "";

  const knownRoutes = Object.entries(GAME_DATA.systems).map(([id, s]) => {
    const links = Object.keys(s.neighbors || {}).map(n => GAME_DATA.systems[n]?.name).filter(Boolean).join(", ");
    return `<div class="muted small"><strong>${escapeHtml(s.name)}:</strong> ${escapeHtml(links || "No known links")}</div>`;
  }).join("");

  view.innerHTML = `
    <div class="section-heading"><div><p class="eyebrow">NAVIGATION</p><h2>Reachable Systems</h2></div></div>
    ${activeRoute}
    ${rows}
    <article class="info-card" style="margin-top:16px">
      <h3>Known Route Network</h3>
      <p class="muted small">Direct links currently recorded in your navigation computer:</p>
      ${knownRoutes}
    </article>
    <p class="muted small">Only directly linked systems can be traveled to in one jump. Market prices are remembered from ports you have actually visited.</p>`;
};

// Give the new systems lightweight cantinas using the already-proven framework.
if (typeof CANTINA_DATA !== "undefined") {
  Object.assign(CANTINA_DATA, {
    caldersDrift: {
      name: "Driftwood",
      description: "A narrow canteen wrapped around Calder's old observation gallery. Route crews leave handwritten warnings beside the official navigation notices.",
      rumor: "Freighters coming from Red Mesa say the Kharok extraction crews are running hard and paying well for anything that keeps machinery moving.",
      news: "FRONTIER RELAY — Traffic authorities have formally recognized Calder's Drift as a maintained navigation stop following increased independent freight activity."
    },
    redMesa: {
      name: "The Hammer & Star",
      description: "A practical Kharok-run hall near the ore transfer decks, built for shift crews, freight captains, and engineers who prefer useful conversation to ceremony.",
      rumor: "An Elyri survey anchorage farther out is said to be paying painful prices for machine parts and ordinary supplies that nobody bothers hauling that far.",
      news: "KHAROK INDUSTRIAL WIRE — Red Mesa extraction cooperatives reported strong output but warned that imported food and medical stocks remain tight."
    },
    pelagos: {
      name: "Far Light Commons",
      description: "A quiet communal lounge beneath Pelagos's survey control deck. Long-range crews compare charts here before disappearing beyond the dependable traffic lanes.",
      rumor: "Several survey captains are discussing signals beyond the current charts, but nobody has yet produced coordinates reliable enough for ordinary navigation.",
      news: "ELYRI SURVEY SERVICE — Pelagos teams completed another outer-corridor mapping pass. Officials describe the results as promising but incomplete."
    }
  });
}

addLog("Navigation computer updated: three additional frontier systems and their direct route links are now charted.");
saveState();

// Haven's Reach — Controlled World Expansion #1
// Solves long-distance navigation clarity and adds three new systems.
// Routes are explicit links: contracts may span several jumps, and Navigation shows the full route.

const EXPANDED_SYSTEMS = {
  caldersDrift: {
    name: "Calder's Drift",
    type: "Frontier Waystation",
    description: "A stubborn little waystation built around an old navigation platform beyond Prospect Reach, serving survey crews and independent haulers pushing farther outward.",
    neighbors: { prospect: 22, redMesa: 27 },
    market: { ore: 28, food: 57, medicine: 83, machineParts: 79, luxuries: 112 },
    contracts: [
      { id: "calder-parts", title: "Relay Components", destination: "redMesa", reward: 520, cargo: { machineParts: 1 }, rep: 1, text: "Carry replacement relay components to Red Mesa Junction." },
      { id: "calder-mail", title: "Frontier Dispatches", destination: "meridian", reward: 610, cargo: {}, rep: 1, text: "Carry accumulated dispatches back through Prospect Reach to Meridian Exchange." }
    ]
  },
  redMesa: {
    name: "Red Mesa Junction",
    type: "Mining & Freight Station",
    description: "A Kharok-heavy industrial station anchored above a mineral-rich red world. Ore moves outward; food, medicine, and machine parts move in.",
    neighbors: { caldersDrift: 27, pelagos: 31 },
    market: { ore: 14, food: 63, medicine: 88, machineParts: 66, luxuries: 124 },
    contracts: [
      { id: "mesa-ore", title: "Refined Ore Lot", destination: "meridian", reward: 760, cargo: { ore: 3 }, rep: 1, text: "Move a priority ore lot from Red Mesa to the Meridian commercial market." },
      { id: "mesa-med", title: "Clinic Resupply", destination: "pelagos", reward: 480, cargo: { medicine: 1 }, rep: 1, text: "A remote clinic at Pelagos needs sealed medical stores." }
    ]
  },
  pelagos: {
    name: "Pelagos Survey Anchorage",
    type: "Outer Survey Station",
    description: "An Elyri-led survey anchorage at the edge of dependable charts, quiet except for research craft, long-range scouts, and operators willing to haul what the station cannot make itself.",
    neighbors: { redMesa: 31 },
    market: { ore: 35, food: 68, medicine: 64, machineParts: 91, luxuries: 118 },
    contracts: [
      { id: "pelagos-data", title: "Deep Survey Archive", destination: "prospect", reward: 880, cargo: {}, rep: 2, text: "Carry a protected survey archive inward to Prospect Reach for duplication and analysis." },
      { id: "pelagos-supplies", title: "Research Exchange", destination: "redMesa", reward: 540, cargo: {}, rep: 1, text: "Deliver sealed research samples to a Kharok materials specialist at Red Mesa Junction." }
    ]
  }
};

Object.assign(GAME_DATA.systems, EXPANDED_SYSTEMS);

// Connect the established frontier to the expansion.
GAME_DATA.systems.prospect.neighbors.caldersDrift = 22;

// Add one long-distance contract so route planning matters immediately.
if (!GAME_DATA.systems.meridian.contracts.some(c => c.id === "meridian-pelagos")) {
  GAME_DATA.systems.meridian.contracts.push({
    id: "meridian-pelagos",
    title: "Survey Instrument Delivery",
    destination: "pelagos",
    reward: 980,
    cargo: { machineParts: 2 },
    rep: 2,
    text: "Carry precision survey instruments from Meridian Exchange to Pelagos Survey Anchorage. Multiple jumps required."
  });
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

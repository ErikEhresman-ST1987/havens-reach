// Haven's Reach — Travel Navigation Experience #1
// Makes the existing navigation chart operational without changing the underlying
// one-jump travel rules, fuel costs, encounters, discovery, or save data.

const TRAVEL_MAP_POSITIONS = {
  haven: [10, 42],
  meridian: [27, 58],
  prospect: [44, 38],
  caldersDrift: [61, 58],
  redMesa: [77, 36],
  pelagos: [91, 57]
};

let travelMapSelectedSystem = null;
let travelMapJumpInProgress = false;

function travelMapKnownSystems() {
  if (typeof ensureNavigationDiscoveryState === "function") ensureNavigationDiscoveryState();
  const known = Array.isArray(state.navigation?.knownSystems)
    ? state.navigation.knownSystems
    : Object.keys(GAME_DATA.systems);
  return known.filter(id => GAME_DATA.systems[id] && TRAVEL_MAP_POSITIONS[id]);
}

function travelMapKnownEdges(knownIds) {
  const known = new Set(knownIds);
  const seen = new Set();
  const edges = [];

  knownIds.forEach(id => {
    Object.entries(GAME_DATA.systems[id]?.neighbors || {}).forEach(([other, fuel]) => {
      if (!known.has(other) || !TRAVEL_MAP_POSITIONS[other]) return;
      const key = [id, other].sort().join("|");
      if (seen.has(key)) return;
      seen.add(key);
      edges.push({ a: id, b: other, fuel });
    });
  });

  return edges;
}

function activeContractRouteEdgeKeys() {
  const active = state.activeContract;
  if (!active || typeof shortestRoute !== "function") return new Set();
  const route = shortestRoute(state.location, active.destination);
  if (!route?.path?.length) return new Set();

  const keys = new Set();
  for (let i = 0; i < route.path.length - 1; i += 1) {
    keys.add([route.path[i], route.path[i + 1]].sort().join("|"));
  }
  return keys;
}

function travelMapIdentity(id) {
  if (typeof stationIdentity === "function") return stationIdentity(id);
  return { accent: "#89c8ff", accent2: "#9db0c0" };
}

function travelMapDirectFuel(id) {
  const fuel = GAME_DATA.systems[state.location]?.neighbors?.[id];
  return Number.isFinite(fuel) ? fuel : null;
}

function travelMapNodeHtml(id) {
  const system = GAME_DATA.systems[id];
  const [x, y] = TRAVEL_MAP_POSITIONS[id];
  const identity = travelMapIdentity(id);
  const isCurrent = id === state.location;
  const isSelected = id === travelMapSelectedSystem;
  const directFuel = isCurrent ? null : travelMapDirectFuel(id);
  const isReachable = Number.isFinite(directFuel);
  const hasFuel = isReachable && state.ship.fuel >= directFuel;
  const label = isCurrent ? `<span class="travel-map-you">YOU ARE HERE</span>` : "";
  const emblem = typeof stationEmblemSvg === "function" ? stationEmblemSvg(id, true) : "●";
  const routeState = isCurrent ? " current" : isReachable ? " reachable" : " remote";
  const fuelState = isReachable && !hasFuel ? " insufficient-fuel" : "";

  return `<button class="travel-map-node${routeState}${fuelState}${isSelected ? " selected" : ""}"
    type="button" style="left:${x}%;top:${y}%;--node-accent:${identity.accent || "#89c8ff"};--node-accent-2:${identity.accent2 || "#9db0c0"}"
    onclick="selectTravelMapSystem('${id}')" aria-label="View ${escapeHtml(system.name)} navigation and remembered market information">
      ${label}
      <span class="travel-map-node-mark">${emblem}</span>
      <span class="travel-map-node-name">${escapeHtml(system.name)}</span>
      ${isReachable ? `<span class="travel-map-node-fuel">${directFuel} fuel</span>` : ""}
    </button>`;
}

function travelMapChartHtml() {
  const knownIds = travelMapKnownSystems();
  if (!travelMapSelectedSystem || !knownIds.includes(travelMapSelectedSystem)) travelMapSelectedSystem = state.location;

  const routeEdges = activeContractRouteEdgeKeys();
  const lines = travelMapKnownEdges(knownIds).map(edge => {
    const [x1, y1] = TRAVEL_MAP_POSITIONS[edge.a];
    const [x2, y2] = TRAVEL_MAP_POSITIONS[edge.b];
    const key = [edge.a, edge.b].sort().join("|");
    const routeClass = routeEdges.has(key) ? " active-contract" : "";
    const currentRouteClass = edge.a === state.location || edge.b === state.location ? " current-route" : "";
    return `<line class="travel-map-route${routeClass}${currentRouteClass}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  }).join("");

  return `<article class="travel-map-card">
    <div class="travel-map-heading">
      <div><p class="eyebrow">KNOWN SPACE</p><h3>Navigation Chart</h3></div>
      <div class="travel-map-legend"><span class="legend-current">Current</span><span class="legend-reachable">One jump</span>${state.activeContract ? `<span class="legend-contract">Contract route</span>` : ""}</div>
    </div>
    <div class="travel-map-chart" aria-label="Known route network">
      <div class="travel-map-starfield" aria-hidden="true"></div>
      <svg class="travel-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
      ${knownIds.map(travelMapNodeHtml).join("")}
    </div>
    <div id="travelMapDetail">${travelMapDetailHtml(travelMapSelectedSystem)}</div>
    <div id="travelMapAction">${travelMapActionHtml(travelMapSelectedSystem)}</div>
  </article>`;
}

function travelMapMarketRows(id) {
  const memory = state.marketMemory?.[id];
  if (!memory?.prices) return `<p class="muted small">Market data: not yet visited.</p>`;

  const rows = Object.entries(memory.prices)
    .filter(([goodId, price]) => GAME_DATA.commodities[goodId] && Number.isFinite(price))
    .map(([goodId, price]) => `<div class="travel-map-market-row"><span>${escapeHtml(GAME_DATA.commodities[goodId].name)}</span><strong>${credits(price)}</strong></div>`)
    .join("");

  if (!rows) return `<p class="muted small">No remembered public market prices are available for this port.</p>`;
  return `<div class="travel-map-market-grid">${rows}</div>`;
}

function travelMapDetailHtml(id) {
  const system = GAME_DATA.systems[id];
  if (!system) return "";

  const memory = state.marketMemory?.[id];
  const age = memory ? Math.max(0, state.tripCount - memory.trip) : null;
  const ageText = age === null ? "Not yet visited" : age === 0 ? "Observed this visit" : age === 1 ? "Observed 1 trip ago" : `Observed ${age} trips ago`;
  const route = typeof shortestRoute === "function" ? shortestRoute(state.location, id) : null;
  const jumps = route ? Math.max(0, route.path.length - 1) : null;
  const routeText = id === state.location
    ? "Current location"
    : route
      ? `${jumps} jump${jumps === 1 ? "" : "s"} • ${route.fuel} total route fuel`
      : "No known route";
  const directFuel = travelMapDirectFuel(id);
  const directText = Number.isFinite(directFuel) ? ` • Direct jump: ${directFuel} fuel` : "";

  return `<div class="travel-map-detail-card">
    <div class="travel-map-detail-head">
      <div>
        <p class="eyebrow">SELECTED SYSTEM</p>
        <h3>${escapeHtml(system.name)}</h3>
        <p class="muted small">${escapeHtml(system.type)} • ${routeText}${directText}</p>
      </div>
      <span class="travel-map-market-age">${escapeHtml(ageText)}</span>
    </div>
    <div class="travel-map-market-title">REMEMBERED MARKET</div>
    ${travelMapMarketRows(id)}
    <p class="muted small travel-map-note">These are your operator's last observed prices, not live remote market data.</p>
  </div>`;
}

function travelMapActionHtml(id) {
  if (!id || id === state.location) {
    return `<div class="travel-map-action muted small">Select a connected system to prepare a one-jump course.</div>`;
  }

  const system = GAME_DATA.systems[id];
  if (!system) return "";
  const fuelCost = travelMapDirectFuel(id);
  if (!Number.isFinite(fuelCost)) {
    const route = typeof shortestRoute === "function" ? shortestRoute(state.location, id) : null;
    const jumps = route ? Math.max(0, route.path.length - 1) : null;
    return `<div class="travel-map-action remote-route">
      <div><strong>${escapeHtml(system.name)}</strong><p class="muted small">${route ? `${jumps} jump${jumps === 1 ? "" : "s"} away. Travel one leg at a time through the connected route network.` : "No known route from your current location."}</p></div>
    </div>`;
  }

  const enoughFuel = state.ship.fuel >= fuelCost;
  return `<div class="travel-map-action direct-route">
    <div>
      <strong>${escapeHtml(system.name)}</strong>
      <p class="muted small">Direct route • ${fuelCost} fuel${enoughFuel ? "" : ` • ${state.ship.fuel} available`}</p>
    </div>
    <button class="primary travel-map-go" type="button" onclick="travelMapTravelTo('${id}')" ${!enoughFuel || travelMapJumpInProgress ? "disabled" : ""}>Travel to ${escapeHtml(system.name)}</button>
  </div>`;
}

function selectTravelMapSystem(id) {
  if (!travelMapKnownSystems().includes(id) || travelMapJumpInProgress) return;
  travelMapSelectedSystem = id;
  const detail = document.getElementById("travelMapDetail");
  if (detail) detail.innerHTML = travelMapDetailHtml(id);
  const action = document.getElementById("travelMapAction");
  if (action) action.innerHTML = travelMapActionHtml(id);
  document.querySelectorAll(".travel-map-node").forEach(node => node.classList.remove("selected"));
  const node = Array.from(document.querySelectorAll(".travel-map-node")).find(button => button.getAttribute("onclick")?.includes(`'${id}'`));
  if (node) node.classList.add("selected");
}

function travelMapTravelTo(id) {
  if (travelMapJumpInProgress || id === state.location) return;
  const fuelCost = travelMapDirectFuel(id);
  if (!Number.isFinite(fuelCost) || state.ship.fuel < fuelCost) return;

  travelMapJumpInProgress = true;
  const chart = document.querySelector(".travel-map-chart");
  const action = document.getElementById("travelMapAction");
  if (action) action.innerHTML = travelMapActionHtml(id);

  if (!chart) {
    travelMapJumpInProgress = false;
    travel(id, fuelCost);
    return;
  }

  const from = TRAVEL_MAP_POSITIONS[state.location];
  const to = TRAVEL_MAP_POSITIONS[id];
  if (from && to) {
    chart.style.setProperty("--jump-x", `${to[0] - from[0]}`);
    chart.style.setProperty("--jump-y", `${to[1] - from[1]}`);
  }
  chart.classList.add("travel-jumping");

  window.setTimeout(() => {
    travelMapJumpInProgress = false;
    travel(id, fuelCost);
  }, 420);
}

function installTravelMap() {
  const heading = view.querySelector(".section-heading");
  if (!heading) return;

  // Replace only the old textual route-network summary. Reachable rows remain as a
  // compact operational fallback beneath the chart.
  view.querySelectorAll(".info-card").forEach(card => {
    if (card.querySelector("h3")?.textContent.trim() === "Known Route Network") card.remove();
  });

  if (view.querySelector(".travel-map-card")) return;
  heading.insertAdjacentHTML("afterend", travelMapChartHtml());
}

const renderTravelBeforeTravelMap = renderTravel;
renderTravel = function renderTravelWithMap() {
  const result = renderTravelBeforeTravelMap();
  installTravelMap();
  return result;
};

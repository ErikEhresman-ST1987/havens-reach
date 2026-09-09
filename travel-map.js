// Haven's Reach — Travel Map #1
// Turns the known route network into a lightweight spatial chart while preserving
// the existing one-jump travel controls, discovery rules, remembered-market limits,
// and contract breadcrumbs. No save state or economy rules are changed.

const TRAVEL_MAP_POSITIONS = {
  haven: [10, 42],
  meridian: [27, 58],
  prospect: [44, 38],
  caldersDrift: [61, 58],
  redMesa: [77, 36],
  pelagos: [91, 57]
};

let travelMapSelectedSystem = null;

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

function travelMapNodeHtml(id) {
  const system = GAME_DATA.systems[id];
  const [x, y] = TRAVEL_MAP_POSITIONS[id];
  const identity = travelMapIdentity(id);
  const isCurrent = id === state.location;
  const isSelected = id === travelMapSelectedSystem;
  const label = isCurrent ? `<span class="travel-map-you">YOU ARE HERE</span>` : "";
  const emblem = typeof stationEmblemSvg === "function" ? stationEmblemSvg(id, true) : "●";

  return `<button class="travel-map-node${isCurrent ? " current" : ""}${isSelected ? " selected" : ""}"
    type="button" style="left:${x}%;top:${y}%;--node-accent:${identity.accent || "#89c8ff"};--node-accent-2:${identity.accent2 || "#9db0c0"}"
    onclick="selectTravelMapSystem('${id}')" aria-label="View ${escapeHtml(system.name)} navigation and remembered market information">
      ${label}
      <span class="travel-map-node-mark">${emblem}</span>
      <span class="travel-map-node-name">${escapeHtml(system.name)}</span>
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
    return `<line class="travel-map-route${routeClass}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  }).join("");

  return `<article class="travel-map-card">
    <div class="travel-map-heading">
      <div><p class="eyebrow">KNOWN SPACE</p><h3>Navigation Chart</h3></div>
      <div class="travel-map-legend"><span class="legend-current">Current</span>${state.activeContract ? `<span class="legend-contract">Contract route</span>` : ""}</div>
    </div>
    <div class="travel-map-chart" aria-label="Known route network">
      <svg class="travel-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
      ${knownIds.map(travelMapNodeHtml).join("")}
    </div>
    <div id="travelMapDetail">${travelMapDetailHtml(travelMapSelectedSystem)}</div>
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
  const directFuel = GAME_DATA.systems[state.location]?.neighbors?.[id];
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

function selectTravelMapSystem(id) {
  if (!travelMapKnownSystems().includes(id)) return;
  travelMapSelectedSystem = id;
  const detail = document.getElementById("travelMapDetail");
  if (detail) detail.innerHTML = travelMapDetailHtml(id);
  document.querySelectorAll(".travel-map-node").forEach(node => node.classList.remove("selected"));
  const node = Array.from(document.querySelectorAll(".travel-map-node")).find(button => button.getAttribute("onclick")?.includes(`'${id}'`));
  if (node) node.classList.add("selected");
}

function installTravelMap() {
  const heading = view.querySelector(".section-heading");
  if (!heading) return;

  // Replace only the old textual route-network summary. Reachable rows and the active
  // contract breadcrumb remain authoritative for actual one-jump travel.
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

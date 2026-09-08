// Haven's Reach v0.2 - smallest meaningful upgrade
// Remembers the market prices the player actually observed at visited ports.
// This module intentionally wraps the existing travel screen instead of rewriting core game logic.

function ensureMarketMemoryState() {
  if (!state.marketMemory || typeof state.marketMemory !== "object") state.marketMemory = {};
  if (!Number.isFinite(state.tripCount)) state.tripCount = 0;
}

ensureMarketMemoryState();

function rememberCurrentMarket() {
  ensureMarketMemoryState();
  const system = GAME_DATA.systems[state.location];
  state.marketMemory[state.location] = {
    prices: { ...system.market },
    trip: state.tripCount
  };
}

function rememberedMarketSummary(systemId) {
  ensureMarketMemoryState();
  const memory = state.marketMemory[systemId];
  if (!memory) return `<div class="muted small">Market data: not yet visited</div>`;

  const age = Math.max(0, state.tripCount - memory.trip);
  const ageText = age === 0 ? "current visit" : age === 1 ? "1 trip ago" : `${age} trips ago`;
  const prices = Object.entries(GAME_DATA.commodities)
    .map(([id, item]) => `${escapeHtml(item.name)} ${credits(memory.prices[id])}`)
    .join(" • ");

  return `<div class="muted small" style="margin-top:6px"><strong>Last known market:</strong> ${prices}<br>Observed ${ageText}</div>`;
}

const coreRenderTravel = renderTravel;
renderTravel = function renderTravelWithMarketMemory() {
  ensureMarketMemoryState();
  const system = GAME_DATA.systems[state.location];
  const rows = Object.entries(system.neighbors).map(([id, fuelCost]) => {
    const destination = GAME_DATA.systems[id];
    return `<div class="travel-row">
      <div><strong>${escapeHtml(destination.name)}</strong><div class="muted small">${destination.type}</div></div>
      <div>${fuelCost} fuel</div>
      <div class="muted">${escapeHtml(destination.description)}${rememberedMarketSummary(id)}</div>
      <button class="primary" onclick="travel('${id}', ${fuelCost})" ${state.ship.fuel < fuelCost ? "disabled" : ""}>Travel</button>
    </div>`;
  }).join("");

  view.innerHTML = `<div class="section-heading"><div><p class="eyebrow">NAVIGATION</p><h2>Reachable Systems</h2></div></div>${rows}<p class="muted small">Market prices shown here are only what you observed on your last visit; they are not live remote data. Fuel is automatically replenished to full for 1 credit per unit whenever you arrive at a civilized port and can afford it.</p>`;
};

const coreTravel = travel;
travel = function travelWithMarketMemory(destination, fuelCost) {
  ensureMarketMemoryState();
  if (state.ship.fuel < fuelCost) return;
  state.tripCount += 1;
  coreTravel(destination, fuelCost);
  rememberCurrentMarket();
  saveState();
};

// The player begins on Haven, so its market is legitimately known from the start.
if (!state.marketMemory[state.location]) {
  rememberCurrentMarket();
  saveState();
}

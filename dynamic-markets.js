// Haven's Reach — Dynamic Markets #1
// Five familiar economic categories now contain specific goods. Port catalogs differ,
// common staples have unlimited stock, specialty goods are finite, and prices move in
// persistent 3–6 trip market conditions rather than rerolling every visit.

const DYNAMIC_GOODS = {
  // Processed Ore
  ore: { name: "Industrial Ore", category: "Processed Ore", finite: false },
  copperOre: { name: "Copper Concentrate", category: "Processed Ore", finite: true },
  goldOre: { name: "Gold-Bearing Ore", category: "Processed Ore", finite: true },

  // Packaged Food
  food: { name: "Staple Rations", category: "Packaged Food", finite: false },
  preservedProduce: { name: "Preserved Produce", category: "Packaged Food", finite: true },
  specialtyFoods: { name: "Specialty Foods", category: "Packaged Food", finite: true },

  // Medicine
  medicine: { name: "Medical Supplies", category: "Medicine", finite: false },
  antibiotics: { name: "Antibiotics", category: "Medicine", finite: true },
  vaccines: { name: "Vaccines", category: "Medicine", finite: true },

  // Machine Parts
  machineParts: { name: "Power Couplings", category: "Machine Parts", finite: false },
  miningComponents: { name: "Mining Components", category: "Machine Parts", finite: true },
  sensorComponents: { name: "Sensor Components", category: "Machine Parts", finite: true },

  // Luxury Goods
  luxuries: { name: "Artisan Goods", category: "Luxury Goods", finite: false },
  veylanTextiles: { name: "Veylan Textiles", category: "Luxury Goods", finite: true },
  rareCollectibles: { name: "Rare Collectibles", category: "Luxury Goods", finite: true }
};

Object.assign(GAME_DATA.commodities, DYNAMIC_GOODS);

const MARKET_CATEGORIES = ["Processed Ore", "Packaged Food", "Medicine", "Machine Parts", "Luxury Goods"];

// Base prices encode each port's economic identity. Missing goods are not traded there.
const PORT_MARKET_BASES = {
  haven: {
    ore: 17, copperOre: 38, goldOre: 118,
    food: 33, medicine: 60,
    machineParts: 46, luxuries: 84
  },
  meridian: {
    ore: 30, copperOre: 46,
    food: 24, preservedProduce: 43, specialtyFoods: 72,
    medicine: 51, antibiotics: 82, vaccines: 108,
    machineParts: 57, miningComponents: 96, sensorComponents: 122,
    luxuries: 70, veylanTextiles: 128, rareCollectibles: 178
  },
  prospect: {
    food: 48, preservedProduce: 69,
    medicine: 74, antibiotics: 103, vaccines: 136,
    machineParts: 71, sensorComponents: 137,
    luxuries: 101
  },
  caldersDrift: {
    ore: 27, copperOre: 49,
    food: 56, preservedProduce: 76,
    medicine: 81,
    machineParts: 77, sensorComponents: 116,
    luxuries: 110
  },
  redMesa: {
    ore: 14, copperOre: 29, goldOre: 91,
    food: 62,
    medicine: 86, antibiotics: 112,
    machineParts: 65, miningComponents: 73,
    luxuries: 122
  },
  pelagos: {
    food: 67, preservedProduce: 84, specialtyFoods: 101,
    medicine: 63, antibiotics: 88, vaccines: 104,
    machineParts: 89, sensorComponents: 78,
    luxuries: 116, rareCollectibles: 154
  }
};

const MARKET_CONDITIONS = {
  surplus: { label: "Surplus", multiplier: 0.75 },
  low: { label: "Low", multiplier: 0.90 },
  normal: { label: "Normal", multiplier: 1.00 },
  high: { label: "High", multiplier: 1.15 },
  shortage: { label: "Shortage", multiplier: 1.35 }
};

const CONDITION_BAG = [
  "surplus",
  "low", "low",
  "normal", "normal", "normal", "normal",
  "high", "high",
  "shortage"
];

function ensureDynamicMarketState() {
  if (!state.dynamicMarkets || typeof state.dynamicMarkets !== "object") state.dynamicMarkets = {};
  if (!Number.isFinite(state.tripCount)) state.tripCount = 0;

  Object.entries(PORT_MARKET_BASES).forEach(([systemId, catalog]) => {
    if (!state.dynamicMarkets[systemId]) state.dynamicMarkets[systemId] = {};
    Object.keys(catalog).forEach(goodId => {
      if (!state.dynamicMarkets[systemId][goodId]) refreshMarketGood(systemId, goodId, true);
    });
  });

  syncAllDynamicPrices();
}

function randomCondition() {
  return CONDITION_BAG[Math.floor(Math.random() * CONDITION_BAG.length)];
}

function stockForCondition(condition) {
  const ranges = {
    surplus: [4, 6],
    low: [3, 5],
    normal: [2, 4],
    high: [1, 3],
    shortage: [1, 2]
  };
  const [min, max] = ranges[condition] || ranges.normal;
  return min + Math.floor(Math.random() * (max - min + 1));
}

function refreshMarketGood(systemId, goodId, initial = false) {
  if (!state.dynamicMarkets) state.dynamicMarkets = {};
  if (!state.dynamicMarkets[systemId]) state.dynamicMarkets[systemId] = {};
  const good = GAME_DATA.commodities[goodId];
  if (!good) return;

  const condition = randomCondition();
  const duration = 3 + Math.floor(Math.random() * 4); // 3–6 completed trips
  state.dynamicMarkets[systemId][goodId] = {
    condition,
    expiresAtTrip: (Number.isFinite(state.tripCount) ? state.tripCount : 0) + duration,
    quantity: good.finite ? stockForCondition(condition) : null,
    initial: Boolean(initial)
  };
}

function currentMarketEntry(systemId, goodId) {
  return state.dynamicMarkets?.[systemId]?.[goodId] || null;
}

function currentMarketPrice(systemId, goodId) {
  const base = PORT_MARKET_BASES[systemId]?.[goodId];
  const entry = currentMarketEntry(systemId, goodId);
  if (!Number.isFinite(base) || !entry) return null;
  const multiplier = MARKET_CONDITIONS[entry.condition]?.multiplier || 1;
  return Math.max(1, Math.round(base * multiplier));
}

function syncDynamicPrices(systemId) {
  const system = GAME_DATA.systems[systemId];
  const catalog = PORT_MARKET_BASES[systemId];
  if (!system || !catalog) return;
  system.market = {};
  Object.keys(catalog).forEach(goodId => {
    system.market[goodId] = currentMarketPrice(systemId, goodId);
  });
}

function syncAllDynamicPrices() {
  Object.keys(PORT_MARKET_BASES).forEach(syncDynamicPrices);
}

function updateExpiredDynamicMarkets() {
  ensureDynamicMarketState();
  Object.entries(PORT_MARKET_BASES).forEach(([systemId, catalog]) => {
    Object.keys(catalog).forEach(goodId => {
      const entry = state.dynamicMarkets[systemId][goodId];
      if (!entry || state.tripCount >= entry.expiresAtTrip) refreshMarketGood(systemId, goodId);
    });
  });
  syncAllDynamicPrices();
}

function marketConditionLabel(systemId, goodId) {
  const entry = currentMarketEntry(systemId, goodId);
  return MARKET_CONDITIONS[entry?.condition]?.label || "Normal";
}

function marketStockLabel(systemId, goodId) {
  const good = GAME_DATA.commodities[goodId];
  const entry = currentMarketEntry(systemId, goodId);
  return good?.finite ? `${entry?.quantity ?? 0} available` : "Common stock";
}

// Replace the market view, but preserve the established buy/sell interaction model.
renderMarket = function renderDynamicMarket() {
  ensureDynamicMarketState();
  updateExpiredDynamicMarkets();
  const systemId = state.location;
  const catalog = PORT_MARKET_BASES[systemId] || {};

  const groups = MARKET_CATEGORIES.map(category => {
    const goods = Object.keys(catalog).filter(id => GAME_DATA.commodities[id]?.category === category);
    if (!goods.length) return "";

    const rows = goods.map(id => {
      const item = GAME_DATA.commodities[id];
      const owned = state.cargo[id] || 0;
      const price = currentMarketPrice(systemId, id);
      const entry = currentMarketEntry(systemId, id);
      const soldOut = Boolean(item.finite && (entry?.quantity || 0) <= 0);
      return `<div class="market-row">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <div class="muted small">${escapeHtml(category)} • ${escapeHtml(marketConditionLabel(systemId, id))} • ${escapeHtml(marketStockLabel(systemId, id))} • Owned: ${owned}</div>
        </div>
        <div class="price">${credits(price)}</div>
        <button class="secondary" onclick="buyCommodity('${id}')" ${soldOut ? "disabled" : ""}>${soldOut ? "Sold Out" : "Buy"}</button>
        <button class="secondary" onclick="sellCommodity('${id}')" ${owned ? "" : "disabled"}>Sell</button>
      </div>`;
    }).join("");

    return `<article class="info-card" style="margin-bottom:14px"><h3>${escapeHtml(category)}</h3>${rows}</article>`;
  }).join("");

  view.innerHTML = `
    <div class="section-heading">
      <div><p class="eyebrow">LOCAL MARKET</p><h2>${escapeHtml(GAME_DATA.systems[systemId].name)} Exchange</h2></div>
    </div>
    <p class="muted small">Common staples are always available. Specialty goods have limited stock. Local conditions usually persist for 3–6 trips, so opportunities last long enough to act on.</p>
    ${groups || `<p class="muted">No public commodity market is available here.</p>`}`;

  rememberCurrentMarket();
  saveState();
};

buyCommodity = function buyDynamicCommodity(id) {
  ensureDynamicMarketState();
  const catalog = PORT_MARKET_BASES[state.location] || {};
  if (!Object.prototype.hasOwnProperty.call(catalog, id)) return;
  const item = GAME_DATA.commodities[id];
  const entry = currentMarketEntry(state.location, id);
  const price = currentMarketPrice(state.location, id);

  if (item?.finite && (entry?.quantity || 0) <= 0) {
    addLog(`${item.name} is sold out at this port.`);
    return render();
  }
  if (cargoUsed() >= state.ship.cargoCapacity) {
    addLog("Cargo bay is full.");
    return render();
  }
  if (state.credits < price) {
    addLog("You don't have enough credits for that purchase.");
    return render();
  }

  state.credits -= price;
  state.cargo[id] = (state.cargo[id] || 0) + 1;
  if (item?.finite) entry.quantity = Math.max(0, entry.quantity - 1);
  addLog(`Bought 1 unit of ${item.name} for ${credits(price)}.`);
  rememberCurrentMarket();
  render();
};

sellCommodity = function sellDynamicCommodity(id) {
  ensureDynamicMarketState();
  if (!state.cargo[id]) return;
  const catalog = PORT_MARKET_BASES[state.location] || {};
  if (!Object.prototype.hasOwnProperty.call(catalog, id)) {
    addLog(`${GAME_DATA.commodities[id]?.name || "That cargo"} is not traded at this port.`);
    return render();
  }

  const item = GAME_DATA.commodities[id];
  const entry = currentMarketEntry(state.location, id);
  const price = currentMarketPrice(state.location, id);
  state.cargo[id] -= 1;
  if (!state.cargo[id]) delete state.cargo[id];
  state.credits += price;
  if (item?.finite && entry) entry.quantity += 1;
  addLog(`Sold 1 unit of ${item.name} for ${credits(price)}.`);
  rememberCurrentMarket();
  render();
};

// Market memory now records the actual catalog and conditions the player personally saw.
rememberCurrentMarket = function rememberDynamicMarket() {
  ensureMarketMemoryState();
  ensureDynamicMarketState();
  const systemId = state.location;
  const catalog = PORT_MARKET_BASES[systemId] || {};
  const prices = {};
  const conditions = {};
  const stock = {};

  Object.keys(catalog).forEach(id => {
    prices[id] = currentMarketPrice(systemId, id);
    conditions[id] = marketConditionLabel(systemId, id);
    const item = GAME_DATA.commodities[id];
    stock[id] = item?.finite ? currentMarketEntry(systemId, id)?.quantity ?? 0 : null;
  });

  state.marketMemory[systemId] = { prices, conditions, stock, trip: state.tripCount };
};

rememberedMarketSummary = function rememberedDynamicMarketSummary(systemId) {
  ensureMarketMemoryState();
  const memory = state.marketMemory[systemId];
  if (!memory) return `<div class="muted small">Market data: not yet visited</div>`;

  const age = Math.max(0, state.tripCount - memory.trip);
  const ageText = age === 0 ? "current visit" : age === 1 ? "1 trip ago" : `${age} trips ago`;
  const ids = Object.keys(memory.prices || {}).filter(id => GAME_DATA.commodities[id]);
  const lines = ids.map(id => {
    const item = GAME_DATA.commodities[id];
    const condition = memory.conditions?.[id] ? ` • ${memory.conditions[id]}` : "";
    const qty = memory.stock?.[id];
    const stock = qty === null || qty === undefined ? "" : ` • ${qty} observed`;
    return `${escapeHtml(item.name)} — ${credits(memory.prices[id])}${condition}${stock}`;
  }).join("<br>");

  return `<details class="muted small" style="margin-top:6px">
    <summary><strong>Last known market:</strong> ${ids.length} goods • observed ${ageText}</summary>
    <div style="margin-top:6px">${lines}</div>
  </details>`;
};

// Advance market conditions only when a real trip occurs. The proven travel/discovery
// stack remains responsible for navigation, encounters, contracts, fuel, and saving.
const travelBeforeDynamicMarkets = travel;
travel = function travelWithDynamicMarkets(destination, fuelCost) {
  ensureDynamicMarketState();
  const beforeLocation = state.location;
  const beforeTrip = state.tripCount;
  const result = travelBeforeDynamicMarkets(destination, fuelCost);

  if (state.location !== beforeLocation || state.tripCount !== beforeTrip) {
    updateExpiredDynamicMarkets();
    rememberCurrentMarket();
    saveState();
    render();
  }
  return result;
};

ensureDynamicMarketState();
updateExpiredDynamicMarkets();
rememberCurrentMarket();
saveState();

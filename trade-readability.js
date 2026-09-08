// Haven's Reach — Trade Readability #1
// Remembers average acquisition cost for cargo bought from this point forward and
// shows per-unit profit/loss beside Sell. Existing untracked cargo is never assigned
// a guessed cost; its basis stays unknown until that old stock has been cleared.

function ensureTradeBasisState() {
  if (!state.tradeBasis || typeof state.tradeBasis !== "object") state.tradeBasis = {};

  // If cargo has been consumed or removed by something other than a market sale,
  // any old basis record must be discarded once none of that commodity remains.
  // This prevents stale legacy cost data from contaminating a later fresh purchase.
  Object.keys(state.tradeBasis).forEach(id => {
    if ((state.cargo?.[id] || 0) <= 0) delete state.tradeBasis[id];
  });

  // Existing saves may already contain cargo bought before cost tracking existed.
  // Mark it unknown rather than inventing a purchase price.
  Object.entries(state.cargo || {}).forEach(([id, quantity]) => {
    if (!quantity || state.tradeBasis[id]) return;
    state.tradeBasis[id] = {
      knownQuantity: 0,
      totalCost: 0,
      unknownQuantity: quantity
    };
  });

  Object.keys(state.tradeBasis).forEach(id => {
    const basis = state.tradeBasis[id];
    if (!basis || typeof basis !== "object") {
      delete state.tradeBasis[id];
      return;
    }
    if (!Number.isFinite(basis.knownQuantity)) basis.knownQuantity = 0;
    if (!Number.isFinite(basis.totalCost)) basis.totalCost = 0;
    if (!Number.isFinite(basis.unknownQuantity)) basis.unknownQuantity = 0;
  });
}

function recordTradePurchase(id, quantity, unitPrice) {
  if (!state.tradeBasis || typeof state.tradeBasis !== "object") state.tradeBasis = {};
  if (!state.tradeBasis[id]) {
    state.tradeBasis[id] = { knownQuantity: 0, totalCost: 0, unknownQuantity: 0 };
  }
  const basis = state.tradeBasis[id];
  basis.knownQuantity += quantity;
  basis.totalCost += quantity * unitPrice;
}

function recordTradeSale(id, quantity) {
  ensureTradeBasisState();
  const basis = state.tradeBasis[id];
  if (!basis) return;

  let remaining = quantity;

  // Clear legacy/unknown stock first so the game never pretends to know its cost.
  const unknownUsed = Math.min(remaining, basis.unknownQuantity);
  basis.unknownQuantity -= unknownUsed;
  remaining -= unknownUsed;

  if (remaining > 0 && basis.knownQuantity > 0) {
    const average = basis.totalCost / basis.knownQuantity;
    const knownUsed = Math.min(remaining, basis.knownQuantity);
    basis.knownQuantity -= knownUsed;
    basis.totalCost = Math.max(0, basis.totalCost - average * knownUsed);
  }

  if ((state.cargo[id] || 0) <= 0) delete state.tradeBasis[id];
}

function averageTradeCost(id) {
  ensureTradeBasisState();
  const basis = state.tradeBasis[id];
  const owned = state.cargo[id] || 0;
  if (!basis || !owned) return null;
  if (basis.unknownQuantity > 0) return null;
  if (basis.knownQuantity <= 0 || basis.knownQuantity < owned) return null;
  return basis.totalCost / basis.knownQuantity;
}

function tradeProfitIndicator(id, sellPrice) {
  const average = averageTradeCost(id);
  if (!Number.isFinite(average)) {
    return {
      text: "Purchase cost unknown",
      color: "#9aa7b3",
      title: "This cargo predates purchase-cost tracking. Once it is cleared, future purchases will be tracked automatically."
    };
  }

  const difference = sellPrice - average;
  const rounded = Math.round(difference);
  const nearBreakEven = Math.abs(difference) < 3;

  if (nearBreakEven) {
    return {
      text: `≈ ${rounded >= 0 ? "+" : "−"}${credits(Math.abs(rounded))}/unit`,
      color: "#c7b56b",
      title: `Average purchase cost: ${credits(Math.round(average))} per unit.`
    };
  }

  if (difference > 0) {
    return {
      text: `▲ +${credits(rounded)}/unit`,
      color: "#79c98c",
      title: `Average purchase cost: ${credits(Math.round(average))} per unit.`
    };
  }

  return {
    text: `▼ −${credits(Math.abs(rounded))}/unit`,
    color: "#e18484",
    title: `Average purchase cost: ${credits(Math.round(average))} per unit.`
  };
}

function addTradeReadabilityToMarket() {
  if (state.currentView && state.currentView !== "market") return;

  view.querySelectorAll(".market-row").forEach(row => {
    if (row.querySelector(".trade-profit-indicator")) return;
    const sellButton = Array.from(row.querySelectorAll("button")).find(button => button.textContent.trim() === "Sell");
    if (!sellButton) return;

    const onclick = sellButton.getAttribute("onclick") || "";
    const match = onclick.match(/sellCommodity\('([^']+)'\)/);
    if (!match) return;
    const id = match[1];
    const owned = state.cargo[id] || 0;
    if (!owned) return;

    const sellPrice = currentMarketPrice(state.location, id);
    if (!Number.isFinite(sellPrice)) return;
    const indicator = tradeProfitIndicator(id, sellPrice);

    const marker = document.createElement("div");
    marker.className = "trade-profit-indicator small";
    marker.textContent = indicator.text;
    marker.title = indicator.title;
    marker.style.color = indicator.color;
    marker.style.fontWeight = "700";
    marker.style.whiteSpace = "nowrap";
    sellButton.insertAdjacentElement("beforebegin", marker);
  });
}

const renderMarketBeforeTradeReadability = renderMarket;
renderMarket = function renderMarketWithTradeReadability() {
  ensureTradeBasisState();
  renderMarketBeforeTradeReadability();
  addTradeReadabilityToMarket();
};

const buyCommodityBeforeTradeReadability = buyCommodity;
buyCommodity = function buyCommodityWithTradeReadability(id) {
  ensureTradeBasisState();
  const beforeOwned = state.cargo[id] || 0;
  const price = currentMarketPrice(state.location, id);

  // Important: the underlying market purchase immediately rerenders the market.
  // For a commodity with no pre-existing cargo, create an empty known basis first so
  // that intermediate rerender does not misclassify the just-bought unit as legacy cargo.
  if (beforeOwned === 0 && !state.tradeBasis[id]) {
    state.tradeBasis[id] = { knownQuantity: 0, totalCost: 0, unknownQuantity: 0 };
  }

  const result = buyCommodityBeforeTradeReadability(id);
  const afterOwned = state.cargo[id] || 0;

  if (afterOwned > beforeOwned && Number.isFinite(price)) {
    recordTradePurchase(id, afterOwned - beforeOwned, price);
    saveState();
    render();
  } else if (beforeOwned === 0 && afterOwned === 0 && state.tradeBasis[id]?.knownQuantity === 0 && state.tradeBasis[id]?.unknownQuantity === 0) {
    // Purchase failed (full hold, insufficient credits, sold out, etc.). Remove the
    // temporary empty basis so future legacy detection remains accurate.
    delete state.tradeBasis[id];
    saveState();
  }
  return result;
};

const sellCommodityBeforeTradeReadability = sellCommodity;
sellCommodity = function sellCommodityWithTradeReadability(id) {
  ensureTradeBasisState();
  const beforeOwned = state.cargo[id] || 0;
  const result = sellCommodityBeforeTradeReadability(id);
  const afterOwned = state.cargo[id] || 0;

  if (afterOwned < beforeOwned) {
    recordTradeSale(id, beforeOwned - afterOwned);
    saveState();
    render();
  }
  return result;
};

ensureTradeBasisState();
saveState();

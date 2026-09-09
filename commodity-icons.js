// Haven's Reach — Commodity Iconography #1
// Lightweight symbolic line icons for the fifteen current commodities. Icons are
// recognition aids only: commodity names remain authoritative. Pure presentation;
// no market, cargo, price, save, or progression state is changed.

const COMMODITY_ICON_PATHS = {
  ore: `<path d="M12 8l8-4 9 5 3 9-6 9H13l-6-8z"/><path d="M12 8l8 8 9-7M20 16l6 11"/>`,
  copperOre: `<path d="M11 9l8-5 10 5 3 9-6 9H13l-6-8z"/><circle cx="21" cy="16" r="4" class="commodity-icon-accent"/>`,
  goldOre: `<path d="M11 9l8-5 10 5 3 9-6 9H13l-6-8z"/><path d="M23 10v5M20.5 12.5h5" class="commodity-icon-accent"/>`,

  food: `<rect x="8" y="8" width="24" height="20" rx="3"/><path d="M12 13h16M12 18h10M12 23h7"/>`,
  preservedProduce: `<path d="M11 9h18v19H11z"/><path d="M11 13h18M15 5h10l2 4H13z"/><path d="M17 20c2-4 5-4 7 0-2 3-5 4-7 0z" class="commodity-icon-accent"/>`,
  specialtyFoods: `<rect x="7" y="8" width="26" height="22" rx="4"/><path d="M20 8v22M7 19h26"/><circle cx="14" cy="14" r="2" class="commodity-icon-accent"/>`,

  medicine: `<rect x="8" y="10" width="24" height="18" rx="3"/><path d="M16 10V7h8v3M20 14v10M15 19h10" class="commodity-icon-accent"/>`,
  antibiotics: `<path d="M12 12a7 7 0 0 1 10-1l7 7a7 7 0 0 1-10 10l-7-7a7 7 0 0 1 0-9z"/><path d="M15 24l10-10" class="commodity-icon-accent"/>`,
  vaccines: `<path d="M16 6h8M18 6v5h4V6M14 11h12v18H14z"/><path d="M17 16h6M20 13v6" class="commodity-icon-accent"/>`,

  machineParts: `<circle cx="14" cy="20" r="5"/><circle cx="26" cy="20" r="5"/><path d="M19 20h2M9 20H5M31 20h4"/><path d="M14 15v-4M26 25v4" class="commodity-icon-accent"/>`,
  miningComponents: `<path d="M20 8l3 4 5-1 1 5 4 3-3 4 1 5-5 1-3 4-4-3-5 1-1-5-4-3 3-4-1-5 5-1z"/><circle cx="20" cy="20" r="4"/><path d="M27 27l7 7" class="commodity-icon-accent"/>`,
  sensorComponents: `<path d="M7 27h26"/><path d="M20 27V17"/><path d="M13 18c4-4 10-4 14 0M10 14c6-7 14-7 20 0"/><circle cx="20" cy="27" r="2" class="commodity-icon-accent"/>`,

  luxuries: `<path d="M20 5l11 8-4 14-7 6-7-6-4-14z"/><path d="M9 13h22M13 27l7-14 7 14" class="commodity-icon-accent"/>`,
  veylanTextiles: `<path d="M8 9h20l4 5-4 5 4 5-4 5H8l4-5-4-5 4-5z"/><path d="M13 9v20M19 9v20M25 9v20" class="commodity-icon-accent"/>`,
  rareCollectibles: `<path d="M12 9h16l4 8-12 15L8 17z"/><path d="M12 9l8 23 8-23M8 17h24"/><circle cx="20" cy="7" r="2" class="commodity-icon-accent"/>`
};

function commodityIconSvg(id, compact = false) {
  const paths = COMMODITY_ICON_PATHS[id];
  if (!paths) return "";
  const item = GAME_DATA.commodities[id];
  return `<svg class="commodity-icon${compact ? " compact" : ""}" viewBox="0 0 40 40" role="img" aria-label="${escapeHtml(item?.name || "Commodity")} icon" focusable="false">${paths}</svg>`;
}

function decorateMarketCommodityIcons() {
  view.querySelectorAll(".market-row").forEach(row => {
    if (row.querySelector(".commodity-name-with-icon")) return;
    const buy = row.querySelector('button[onclick*="buyCommodity"]');
    const sell = row.querySelector('button[onclick*="sellCommodity"]');
    const action = buy?.getAttribute("onclick") || sell?.getAttribute("onclick") || "";
    const match = action.match(/Commodity\('([^']+)'\)/);
    if (!match || !COMMODITY_ICON_PATHS[match[1]]) return;

    const id = match[1];
    const first = row.firstElementChild;
    const strong = first?.querySelector("strong");
    if (!first || !strong) return;

    const wrap = document.createElement("div");
    wrap.className = "commodity-name-with-icon";
    wrap.innerHTML = `<span class="commodity-icon-wrap" aria-hidden="true">${commodityIconSvg(id)}</span><span class="commodity-name-copy"></span>`;
    const copy = wrap.querySelector(".commodity-name-copy");
    strong.replaceWith(wrap);
    copy.appendChild(strong);
  });
}

const renderMarketBeforeCommodityIcons = renderMarket;
renderMarket = function renderMarketWithCommodityIcons() {
  const result = renderMarketBeforeCommodityIcons();
  decorateMarketCommodityIcons();
  return result;
};

// Reuse the same icon vocabulary in remembered-market information on the travel map.
if (typeof travelMapMarketRows === "function") {
  travelMapMarketRows = function travelMapMarketRowsWithIcons(id) {
    const memory = state.marketMemory?.[id];
    if (!memory?.prices) return `<p class="muted small">Market data: not yet visited.</p>`;

    const rows = Object.entries(memory.prices)
      .filter(([goodId, price]) => GAME_DATA.commodities[goodId] && Number.isFinite(price))
      .map(([goodId, price]) => `<div class="travel-map-market-row">
        <span class="travel-map-commodity-name"><span class="commodity-icon-wrap compact" aria-hidden="true">${commodityIconSvg(goodId, true)}</span><span>${escapeHtml(GAME_DATA.commodities[goodId].name)}</span></span>
        <strong>${credits(price)}</strong>
      </div>`)
      .join("");

    if (!rows) return `<p class="muted small">No remembered public market prices are available for this port.</p>`;
    return `<div class="travel-map-market-grid">${rows}</div>`;
  };
}

// Haven's Reach — Visual Identity Bundle
// Structural consolidation only. The two proven presentation modules below
// are preserved in their existing execution order with no gameplay or save-data changes.

// ===== commodity-icons.js =====
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

// ===== npc-visual-identity.js =====
// Haven's Reach — NPC Visual Identity #1
// Gives each named contact a lightweight personal visual mark. Pure presentation:
// no relationship logic, opportunity rules, save data, or dialog behavior is changed.
// Marks appear only in actionable Local Contact notices and NPC encounter dialogs.

const NPC_VISUAL_IDENTITIES = {
  mara: {
    accent: "#d79a62",
    accent2: "#8fa1ad",
    descriptor: "Haven shipwright",
    mark: `
      <path d="M23 18c2-7 16-7 18 0v9c0 7-4 12-9 12s-9-5-9-12z" />
      <path d="M20 52c2-8 7-12 12-12s10 4 12 12" />
      <path d="M15 48h10M39 48h10" class="npc-mark-secondary" />
      <path d="M13 44l6-6M45 38l6 6" class="npc-mark-secondary" />`
  },
  seli: {
    accent: "#55bbb2",
    accent2: "#c0a35c",
    descriptor: "Veylan commercial contact",
    mark: `
      <path d="M25 14c-5 6-6 17-2 25l9 8 9-8c4-8 3-19-2-25-4-4-10-4-14 0z" />
      <path d="M20 22l-7-5M44 22l7-5" class="npc-mark-secondary" />
      <path d="M27 29h2M35 29h2" />
      <path d="M27 36c3 2 7 2 10 0" class="npc-mark-secondary" />
      <path d="M18 54c4-7 9-10 14-10s10 3 14 10" />
      <path d="M48 42h8M52 38v8" class="npc-mark-secondary" />`
  },
  lena: {
    accent: "#6fa7c8",
    accent2: "#d0a268",
    descriptor: "Frontier freighter captain",
    mark: `
      <path d="M23 17c3-6 15-6 18 0v11c0 7-4 12-9 12s-9-5-9-12z" />
      <path d="M20 19h24" class="npc-mark-secondary" />
      <path d="M17 54c3-9 8-13 15-13s12 4 15 13" />
      <path d="M11 49h9l4-5M53 49h-9l-4-5" class="npc-mark-secondary" />
      <path d="M28 32h8" />`
  },
  orin: {
    accent: "#7f82c9",
    accent2: "#dda552",
    descriptor: "Independent navigation surveyor",
    mark: `
      <path d="M23 18c2-7 16-7 18 0v10c0 7-4 12-9 12s-9-5-9-12z" />
      <path d="M18 54c3-9 8-13 14-13s11 4 14 13" />
      <circle cx="50" cy="19" r="3" class="npc-mark-secondary" />
      <path d="M50 8v5M50 25v5M39 19h5M56 19h5" class="npc-mark-secondary" />
      <path d="M27 30h10" />`
  },
  draak: {
    accent: "#c57946",
    accent2: "#929aa2",
    descriptor: "Kharok engineering contact",
    mark: `
      <path d="M21 17l6-7h10l6 7 3 17-7 10H25l-7-10z" />
      <path d="M25 26h4M35 26h4" />
      <path d="M27 35h10" class="npc-mark-secondary" />
      <path d="M17 55l5-11h20l5 11" />
      <path d="M10 50h9M45 50h9" class="npc-mark-secondary" />
      <circle cx="12" cy="50" r="3" class="npc-mark-secondary" />
      <circle cx="52" cy="50" r="3" class="npc-mark-secondary" />`
  },
  saeli: {
    accent: "#9b83d6",
    accent2: "#8bd8df",
    descriptor: "Elyri survey contact",
    mark: `
      <path d="M25 13c-5 7-6 17-3 25l10 9 10-9c3-8 2-18-3-25-4-5-10-5-14 0z" />
      <path d="M26 29c2-2 4-2 6 0M32 29c2-2 4-2 6 0" />
      <path d="M19 54c4-7 8-10 13-10s9 3 13 10" />
      <path d="M48 13c6 5 8 11 6 17M51 10c8 6 11 14 9 23" class="npc-mark-secondary" />
      <circle cx="54" cy="34" r="2.5" class="npc-mark-secondary" />`
  }
};

function npcVisualIdentity(id) {
  return NPC_VISUAL_IDENTITIES[id] || null;
}

function npcIdentityMarkSvg(id, compact = false) {
  const identity = npcVisualIdentity(id);
  const npc = NPC_DATA?.[id];
  if (!identity || !npc) return "";
  return `<svg class="npc-identity-mark${compact ? " compact" : ""}" viewBox="0 0 64 64" role="img" aria-label="${escapeHtml(npc.name)} contact mark" focusable="false" style="--npc-accent:${identity.accent};--npc-accent-2:${identity.accent2}">${identity.mark}</svg>`;
}

function npcIdFromDialogTitle() {
  const title = el("encounterTitle")?.textContent?.trim() || "";
  return Object.entries(NPC_DATA || {}).find(([, npc]) => title === npc.name || title.startsWith(`${npc.name} —`))?.[0] || null;
}

function clearNpcDialogIdentity() {
  const card = document.querySelector("#encounterDialog .encounter-card");
  card?.querySelector(".npc-dialog-identity")?.remove();
  const title = el("encounterTitle");
  if (title) title.classList.remove("npc-dialog-context-title");
}

function decorateNpcDialogIdentity() {
  clearNpcDialogIdentity();
  const id = npcIdFromDialogTitle();
  if (!id) return;

  const npc = NPC_DATA[id];
  const identity = npcVisualIdentity(id);
  const npcState = state.npcs?.[id];
  const card = document.querySelector("#encounterDialog .encounter-card");
  const title = el("encounterTitle");
  if (!npc || !identity || !card || !title) return;

  const originalTitle = title.textContent.trim();
  const prefix = `${npc.name} —`;
  const context = originalTitle.startsWith(prefix) ? originalTitle.slice(prefix.length).trim() : "";
  const relation = typeof npcRelationshipLabel === "function"
    ? npcRelationshipLabel(npcState?.relationship || 0)
    : "Contact";

  const panel = document.createElement("div");
  panel.className = "npc-dialog-identity";
  panel.style.setProperty("--npc-accent", identity.accent);
  panel.style.setProperty("--npc-accent-2", identity.accent2);
  panel.innerHTML = `
    <div class="npc-dialog-mark">${npcIdentityMarkSvg(id)}</div>
    <div class="npc-dialog-copy">
      <div class="npc-dialog-name">${escapeHtml(npc.name)}</div>
      <div class="npc-dialog-role">${escapeHtml(npc.role)}</div>
      <div class="npc-dialog-descriptor">${escapeHtml(identity.descriptor)} • ${escapeHtml(relation)}</div>
    </div>`;

  title.insertAdjacentElement("beforebegin", panel);
  if (context && context !== npc.role) {
    title.textContent = context;
    title.classList.add("npc-dialog-context-title");
  } else {
    title.textContent = "";
    title.classList.add("npc-dialog-context-title");
  }
}

function decorateLocalContactIdentity() {
  const notice = document.querySelector(".local-contact-notice");
  const contact = typeof currentRelevantLocalContact === "function" ? currentRelevantLocalContact() : null;
  if (!notice || !contact || notice.querySelector(".npc-contact-mark")) return;
  const identity = npcVisualIdentity(contact.id);
  if (!identity) return;

  notice.style.setProperty("--npc-accent", identity.accent);
  notice.style.setProperty("--npc-accent-2", identity.accent2);
  notice.classList.add("npc-identified-contact");

  const mark = document.createElement("div");
  mark.className = "npc-contact-mark";
  mark.innerHTML = npcIdentityMarkSvg(contact.id, true);
  notice.insertAdjacentElement("afterbegin", mark);
}

// Contact notices are rendered through their existing relevance rules; decorate only
// after that system has decided a contact deserves attention.
if (typeof renderLocalContactNotice === "function") {
  const renderLocalContactNoticeBeforeNpcIdentity = renderLocalContactNotice;
  renderLocalContactNotice = function renderLocalContactNoticeWithNpcIdentity() {
    const result = renderLocalContactNoticeBeforeNpcIdentity();
    decorateLocalContactIdentity();
    return result;
  };
}

// Every NPC interaction ultimately opens the shared encounter dialog. Wrapping the
// dialog itself lets introductions, rotating opportunities, and later NPC-specific
// proposals inherit identity without coupling this module to each gameplay feature.
const npcIdentityDialog = el("encounterDialog");
if (npcIdentityDialog && typeof npcIdentityDialog.showModal === "function") {
  const showModalBeforeNpcIdentity = npcIdentityDialog.showModal.bind(npcIdentityDialog);
  npcIdentityDialog.showModal = function showModalWithNpcIdentity() {
    decorateNpcDialogIdentity();
    return showModalBeforeNpcIdentity();
  };
}

decorateLocalContactIdentity();

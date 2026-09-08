// Haven's Reach — Station Visual Identity #1
// A lightweight, data-driven visual skin for the six current locations.
// No gameplay state or mechanics are changed here.

const STATION_IDENTITIES = {
  haven: {
    purpose: "Legacy Mining and Freight Homeworld",
    administration: "Haven Civic Authority",
    influence: "Old mining cooperatives • freight yards • independent operators",
    arrival: "Old machinery. Familiar voices. Another shift begins.",
    accent: "#c88a4a",
    accent2: "#6f8795",
    tint: "rgba(200, 138, 74, 0.08)",
    emblem: `
      <path d="M8 31h48" />
      <path d="M14 30V20h36v10" />
      <path d="M18 20l6-8h16l6 8" />
      <path d="M32 12v10" />
      <circle cx="32" cy="31" r="2.5" class="station-emblem-secondary" />`
  },
  meridian: {
    purpose: "Cosmopolitan Trade and Brokerage Hub",
    administration: "Meridian Exchange Authority",
    influence: "Veylan commercial influence • human brokerage interests",
    arrival: "Every corridor leads somewhere. Every conversation is potentially business.",
    accent: "#4faaa4",
    accent2: "#b49a58",
    tint: "rgba(79, 170, 164, 0.08)",
    emblem: `
      <path d="M32 8v16M32 40v16M8 32h16M40 32h16" />
      <path d="M20 20l12 12 12-12M20 44l12-12 12 12" />
      <circle cx="32" cy="32" r="4" class="station-emblem-secondary" />`
  },
  prospect: {
    purpose: "Frontier Supply and Opportunity Colony",
    administration: "Prospect Frontier Council",
    influence: "Independent miners • salvagers • survey crews • supply operators",
    arrival: "Nothing is finished. Anything might happen next.",
    accent: "#5ca8a4",
    accent2: "#c6a56b",
    tint: "rgba(92, 168, 164, 0.08)",
    emblem: `
      <path d="M45 17a20 20 0 1 0 1 29" />
      <path d="M41 23l12-12" class="station-emblem-secondary" />
      <path d="M48 11h5v5" class="station-emblem-secondary" />`
  },
  caldersDrift: {
    purpose: "Independent Navigation and Survey Waystation",
    administration: "Calder Navigation Cooperative",
    influence: "Navigation technicians • surveyors • relay crews • veteran haulers",
    arrival: "The charts thin out here. The beacon still burns.",
    accent: "#7577b8",
    accent2: "#d29a4d",
    tint: "rgba(117, 119, 184, 0.08)",
    emblem: `
      <circle cx="32" cy="32" r="3" class="station-emblem-secondary" />
      <path d="M15 24c7-8 27-8 34 0" />
      <path d="M10 17c11-13 33-13 44 0" />
      <path d="M32 35v15" />`
  },
  redMesa: {
    purpose: "Kharok Mining and Heavy-Freight Station",
    administration: "Red Mesa Industrial Council",
    influence: "Kharok extraction cooperatives • shared freight infrastructure",
    arrival: "Nothing here is ornamental unless it can survive a cargo loader hitting it.",
    accent: "#b86f3e",
    accent2: "#899097",
    tint: "rgba(184, 111, 62, 0.08)",
    emblem: `
      <path d="M24 12h16l9 13-7 21H22l-7-21z" />
      <path d="M8 32h48" class="station-emblem-secondary" />
      <path d="M24 12l8 20 8-20M22 46l10-14 10 14" />`
  },
  pelagos: {
    purpose: "Elyri Deep-Survey and Research Anchorage",
    administration: "Elyri Survey Service",
    influence: "Scientific exploration charter • multi-population research partners",
    arrival: "Beyond this point, certainty becomes a scarce commodity.",
    accent: "#8f78c8",
    accent2: "#8dd8de",
    tint: "rgba(143, 120, 200, 0.08)",
    emblem: `
      <path d="M9 48c13-18 23-27 45-35" />
      <path d="M15 53c12-15 22-23 39-29" />
      <path d="M24 56c8-10 16-16 30-21" />
      <circle cx="54" cy="13" r="2.5" class="station-emblem-secondary" />`
  }
};

function stationIdentity(id = state.location) {
  return STATION_IDENTITIES[id] || null;
}

function stationEmblemSvg(id, compact = false) {
  const identity = stationIdentity(id);
  if (!identity) return "";
  return `<svg class="station-emblem${compact ? " compact" : ""}" viewBox="0 0 64 64" role="img" aria-label="${escapeHtml(GAME_DATA.systems[id]?.name || "Station")} emblem" focusable="false">
    ${identity.emblem}
  </svg>`;
}

function applyStationTheme() {
  const identity = stationIdentity();
  if (!identity) return;
  const root = document.documentElement;
  root.style.setProperty("--station-accent", identity.accent);
  root.style.setProperty("--station-accent-2", identity.accent2);
  root.style.setProperty("--station-tint", identity.tint);

  const hero = document.querySelector(".hero-panel");
  const copy = hero?.firstElementChild;
  const title = document.getElementById("locationName");
  if (!hero || !copy || !title) return;

  hero.dataset.station = state.location;
  let block = hero.querySelector(".station-identity-block");
  if (!block) {
    block = document.createElement("div");
    block.className = "station-identity-block";
    title.insertAdjacentElement("afterend", block);
  }

  block.innerHTML = `
    <div class="station-emblem-wrap" aria-hidden="true">${stationEmblemSvg(state.location)}</div>
    <div class="station-identity-copy">
      <div class="station-purpose">${escapeHtml(identity.purpose)}</div>
      <div class="station-admin">${escapeHtml(identity.administration)}</div>
      <div class="station-influence">${escapeHtml(identity.influence)}</div>
      <div class="station-arrival">“${escapeHtml(identity.arrival)}”</div>
    </div>`;
}

function decorateCantinaIdentity() {
  const heading = view.querySelector(".section-heading");
  if (!heading || heading.querySelector(".station-inline-identity")) return;
  const identity = stationIdentity();
  if (!identity) return;
  const mark = document.createElement("div");
  mark.className = "station-inline-identity";
  mark.innerHTML = `${stationEmblemSvg(state.location, true)}<span>${escapeHtml(identity.administration)}</span>`;
  heading.appendChild(mark);
}

function decorateTravelIdentities() {
  view.querySelectorAll(".travel-row").forEach(row => {
    if (row.querySelector(".travel-station-mark")) return;
    const nameNode = row.querySelector("strong");
    if (!nameNode) return;
    const match = Object.entries(GAME_DATA.systems).find(([, system]) => system.name === nameNode.textContent);
    if (!match || !stationIdentity(match[0])) return;
    const mark = document.createElement("span");
    mark.className = "travel-station-mark";
    mark.innerHTML = stationEmblemSvg(match[0], true);
    nameNode.prepend(mark);
  });
}

const renderStatusBeforeStationIdentity = renderStatus;
renderStatus = function renderStatusWithStationIdentity() {
  renderStatusBeforeStationIdentity();
  applyStationTheme();
};

if (typeof renderCantina === "function") {
  const renderCantinaBeforeStationIdentity = renderCantina;
  renderCantina = function renderCantinaWithStationIdentity() {
    const result = renderCantinaBeforeStationIdentity();
    decorateCantinaIdentity();
    return result;
  };
}

if (typeof renderTravel === "function") {
  const renderTravelBeforeStationIdentity = renderTravel;
  renderTravel = function renderTravelWithStationIdentity() {
    const result = renderTravelBeforeStationIdentity();
    decorateTravelIdentities();
    return result;
  };
}

applyStationTheme();

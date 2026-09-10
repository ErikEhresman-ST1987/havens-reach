// Haven's Reach — Transient Field System #1
// Turns the proven Kestrel field-site idea into a small reusable frontier system.
// Up to three unresolved field sites may be known at once, but the game never fills
// empty slots automatically. New coordinates only appear through believable discovery
// channels: NPCs, scanner events, cantina rumors, and breadcrumbs from prior sites.

const FIELD_SITE_MAX_ACTIVE = 3;

const FIELD_NETWORK_SITES = {
  argentWreck: {
    name: "Argent Drift Return",
    type: "Unverified debris return",
    anchor: "prospect",
    fuel: 16,
    position: [48, 18],
    accent: "#8fb7c8",
    accent2: "#d0d7dc",
    sourceLabel: "Frontier traffic lead",
    outcome: "salvage",
    description: "A weak clustered return outside Prospect Reach's normal freight lane. The signature could be wreckage, discarded equipment, or nothing useful at all."
  },
  glassCurrent: {
    name: "Glass Current Signal",
    type: "Unverified survey return",
    anchor: "pelagos",
    fuel: 18,
    position: [90, 78],
    accent: "#78bfd0",
    accent2: "#b8a9df",
    sourceLabel: "Survey coordinates",
    outcome: "survey",
    description: "A narrow repeating sensor return beyond the normal Pelagos survey box. The source is stable enough to investigate but not yet classified."
  },
  silentEcho: {
    name: "Silent Echo Coordinates",
    type: "Unverified navigation return",
    anchor: "caldersDrift",
    fuel: 12,
    position: [63, 79],
    accent: "#9aaab7",
    accent2: "#71808a",
    sourceLabel: "Old navigation return",
    outcome: "empty",
    description: "A stale navigation return repeatedly appears in old route notes near Calder's Drift. Nobody has recently confirmed what, if anything, remains there."
  },
  courierTrail: {
    name: "Old Courier Vector",
    type: "Unverified traffic lead",
    anchor: "meridian",
    fuel: 15,
    position: [31, 80],
    accent: "#c1a76d",
    accent2: "#8eaac2",
    sourceLabel: "Cantina rumor",
    outcome: "breadcrumb",
    description: "An old independent courier vector keeps surfacing in Meridian traffic stories. The coordinates do not correspond to any registered stop."
  },
  emberCache: {
    name: "Ember Cache Return",
    type: "Follow-up coordinates",
    anchor: "redMesa",
    fuel: 17,
    position: [79, 72],
    accent: "#d49a62",
    accent2: "#d8c27e",
    sourceLabel: "Recovered navigation fragment",
    outcome: "resource",
    description: "Coordinates recovered from an old courier record point to a small dense return beyond Red Mesa's established freight pattern."
  }
};

function ensureFieldNetworkState() {
  if (!state.fieldNetwork || typeof state.fieldNetwork !== "object") {
    state.fieldNetwork = { sites: {}, lastScannerLeadTrip: -99, lastNpcLeadTrip: -99, sourceMemory: {} };
  }
  if (!state.fieldNetwork.sites || typeof state.fieldNetwork.sites !== "object") state.fieldNetwork.sites = {};
  if (!state.fieldNetwork.sourceMemory || typeof state.fieldNetwork.sourceMemory !== "object") state.fieldNetwork.sourceMemory = {};
  if (!Number.isFinite(state.fieldNetwork.lastScannerLeadTrip)) state.fieldNetwork.lastScannerLeadTrip = -99;
  if (!Number.isFinite(state.fieldNetwork.lastNpcLeadTrip)) state.fieldNetwork.lastNpcLeadTrip = -99;

  Object.keys(FIELD_NETWORK_SITES).forEach(id => {
    if (!state.fieldNetwork.sites[id]) {
      state.fieldNetwork.sites[id] = {
        discovered: false,
        resolved: false,
        completed: false,
        source: null,
        result: null
      };
    }
  });

  Object.keys(FIELD_NETWORK_SITES).forEach(id => {
    const record = state.fieldNetwork.sites[id];
    if (record.discovered && !record.completed) installFieldNetworkSite(id);
    else removeFieldNetworkSite(id);
  });
}

function fieldNetworkKestrelActive() {
  const k = state.fieldSites?.draakIronScatter;
  return Boolean(k?.discovered && !k?.completed && !k?.exhausted);
}

function fieldNetworkActiveCount() {
  ensureFieldNetworkState();
  const generic = Object.values(state.fieldNetwork.sites)
    .filter(site => site.discovered && !site.completed && !site.resolved).length;
  return generic + (fieldNetworkKestrelActive() ? 1 : 0);
}

function fieldNetworkHasRoom() {
  return fieldNetworkActiveCount() < FIELD_SITE_MAX_ACTIVE;
}

function fieldNetworkIsSite(id) {
  return Boolean(FIELD_NETWORK_SITES[id]);
}

function installFieldNetworkSite(id) {
  const def = FIELD_NETWORK_SITES[id];
  if (!def) return;

  GAME_DATA.systems[id] = {
    name: def.name,
    type: def.type,
    description: def.description,
    neighbors: { [def.anchor]: def.fuel },
    market: {},
    contracts: []
  };

  if (GAME_DATA.systems[def.anchor]?.neighbors) GAME_DATA.systems[def.anchor].neighbors[id] = def.fuel;
  if (typeof TRAVEL_MAP_POSITIONS !== "undefined") TRAVEL_MAP_POSITIONS[id] = def.position;
}

function removeFieldNetworkSite(id) {
  const def = FIELD_NETWORK_SITES[id];
  if (!def) return;
  if (GAME_DATA.systems[def.anchor]?.neighbors) delete GAME_DATA.systems[def.anchor].neighbors[id];
  delete GAME_DATA.systems[id];
  if (typeof TRAVEL_MAP_POSITIONS !== "undefined") delete TRAVEL_MAP_POSITIONS[id];
  if (Array.isArray(state.navigation?.knownSystems)) {
    state.navigation.knownSystems = state.navigation.knownSystems.filter(systemId => systemId !== id);
  }
}

function fieldAnchorKnown(id) {
  const anchor = FIELD_NETWORK_SITES[id]?.anchor;
  if (!anchor) return false;
  return typeof isSystemKnown === "function" ? isSystemKnown(anchor) : Boolean(GAME_DATA.systems[anchor]);
}

function revealFieldNetworkSite(id, source, logText) {
  ensureFieldNetworkState();
  const def = FIELD_NETWORK_SITES[id];
  const record = state.fieldNetwork.sites[id];
  if (!def || !record || record.discovered || record.completed || !fieldNetworkHasRoom() || !fieldAnchorKnown(id)) return false;

  record.discovered = true;
  record.resolved = false;
  record.source = source;
  installFieldNetworkSite(id);

  if (typeof ensureNavigationDiscoveryState === "function") ensureNavigationDiscoveryState();
  if (Array.isArray(state.navigation?.knownSystems) && !state.navigation.knownSystems.includes(id)) {
    state.navigation.knownSystems.push(id);
  }

  addLog(logText || `FIELD LEAD — ${def.name} added to navigation. The coordinates are unverified; investigation may or may not produce anything useful.`);
  saveState();
  return true;
}

function fieldNetworkScannerCandidate() {
  const pool = ["argentWreck", "glassCurrent", "silentEcho"]
    .filter(id => {
      const r = state.fieldNetwork.sites[id];
      return fieldAnchorKnown(id) && !r.discovered && !r.completed;
    });
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function maybeDiscoverFieldByScanner() {
  ensureFieldNetworkState();
  if (!fieldNetworkHasRoom() || fieldNetworkIsSite(state.location) || state.location === DRAAK_FIELD_ID) return;
  const trip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
  if (trip - state.fieldNetwork.lastScannerLeadTrip < 3) return;

  const sensors = Math.max(1, Number(state.ship?.sensors) || 1);
  const chance = Math.min(0.28, 0.11 + sensors * 0.025);
  if (Math.random() >= chance) return;

  const id = fieldNetworkScannerCandidate();
  if (!id) return;
  const def = FIELD_NETWORK_SITES[id];
  if (revealFieldNetworkSite(id, "scanner", `SCANNER CONTACT — During routine travel, your sensors isolate a repeatable off-lane return. ${def.name} has been added to navigation as unverified coordinates.`)) {
    state.fieldNetwork.lastScannerLeadTrip = trip;
    saveState();
    renderStatus();
  }
}

const FIELD_NPC_LEADS = {
  lena: "argentWreck",
  orin: "silentEcho",
  saeli: "glassCurrent"
};

function npcFieldLeadAvailable(id) {
  ensureFieldNetworkState();
  const siteId = FIELD_NPC_LEADS[id];
  if (!siteId || !fieldNetworkHasRoom()) return false;
  const npc = state.npcs?.[id];
  const record = state.fieldNetwork.sites[siteId];
  if (!npc?.met || npc.relationship < 2 || record.discovered || record.completed || !fieldAnchorKnown(siteId)) return false;
  const trip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
  return trip - state.fieldNetwork.lastNpcLeadTrip >= 3;
}

function openNpcFieldLead(id) {
  const siteId = FIELD_NPC_LEADS[id];
  const def = FIELD_NETWORK_SITES[siteId];
  const npc = NPC_DATA[id];
  if (!def || !npc) return;

  const leadText = {
    lena: "Lena has a set of weak debris returns another freighter logged outside Prospect's ordinary lanes. Nobody stopped to check them. She offers you the coordinates without pretending there is anything valuable there.",
    orin: "Orin has an old repeated navigation echo that never matched a registered beacon. The return may be stale, but the coordinates are internally consistent enough to verify.",
    saeli: "Saeli has a narrow repeating survey return that Pelagos crews have not prioritized. It may be scientifically useful, mundane, or simply an instrument artifact. She offers you the coordinates to check independently."
  }[id];

  el("encounterTitle").textContent = `${npc.name} — Field Lead`;
  el("encounterText").textContent = leadText;
  el("encounterChoices").innerHTML = `
    <button class="secondary" type="button" onclick="resolveEncounter('fieldNpcAccept:${id}')">Take the coordinates</button>
    <button class="secondary" type="button" onclick="resolveEncounter('fieldNpcLater:${id}')">Not right now</button>`;
  el("encounterDialog").showModal();
}

const openNpcInteractionBeforeFieldNetwork = openNpcInteraction;
openNpcInteraction = function openNpcInteractionWithFieldNetwork(id) {
  if (npcFieldLeadAvailable(id)) return openNpcFieldLead(id);
  return openNpcInteractionBeforeFieldNetwork(id);
};

const resolveEncounterBeforeFieldNetwork = resolveEncounter;
resolveEncounter = function resolveEncounterWithFieldNetwork(action) {
  if (typeof action === "string" && action.startsWith("fieldNpcAccept:")) {
    const id = action.split(":")[1];
    const siteId = FIELD_NPC_LEADS[id];
    const def = FIELD_NETWORK_SITES[siteId];
    if (siteId && revealFieldNetworkSite(siteId, `npc:${id}`, `${NPC_DATA[id].name.toUpperCase()} — ${def.name} added to navigation. The lead is credible enough to investigate, but the coordinates carry no promise of a useful find.`)) {
      state.fieldNetwork.lastNpcLeadTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
      state.npcs[id].memory.sharedFieldLead = (state.npcs[id].memory.sharedFieldLead || 0) + 1;
    }
    if (el("encounterDialog").open) el("encounterDialog").close();
    saveState();
    render();
    return;
  }

  if (typeof action === "string" && action.startsWith("fieldNpcLater:")) {
    const id = action.split(":")[1];
    addLog(`${NPC_DATA[id]?.name || "Your contact"} keeps the coordinates on hand. The lead can wait.`);
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
    return;
  }

  return resolveEncounterBeforeFieldNetwork(action);
};

function fieldCantinaLeadAvailable() {
  ensureFieldNetworkState();
  const id = "courierTrail";
  const record = state.fieldNetwork.sites[id];
  return state.location === "meridian" && fieldNetworkHasRoom() && fieldAnchorKnown(id) && !record.discovered && !record.completed && (state.cantina?.visits?.meridian || 0) >= 2;
}

function followCourierRumor() {
  if (!fieldCantinaLeadAvailable()) return;
  revealFieldNetworkSite("courierTrail", "cantina", "CANTINA LEAD — Cross-checking three old courier stories produces a consistent unregistered vector. Old Courier Vector has been added to navigation. There is no evidence yet that anything useful remains there.");
  state.cantina.discoveries.oldCourierVector = true;
  saveState();
  renderCantina();
  renderStatus();
}

const renderCantinaBeforeFieldNetwork = renderCantina;
renderCantina = function renderCantinaWithFieldNetwork() {
  renderCantinaBeforeFieldNetwork();
  if (!fieldCantinaLeadAvailable()) return;
  const grid = view.querySelector(".card-grid");
  if (!grid) return;
  grid.insertAdjacentHTML("beforeend", `
    <article class="info-card field-rumor-card">
      <h3>Follow Up an Old Vector</h3>
      <p class="muted small">Several independent couriers tell the same story about an off-lane vector. The details are old, but the coordinates agree closely enough to investigate.</p>
      <button class="secondary" type="button" onclick="followCourierRumor()">Compare the coordinates</button>
    </article>`);
};

function fieldNetworkFreeCargo() {
  return Math.max(0, state.ship.cargoCapacity - cargoUsed());
}

function resolveFieldSite(id, resultText) {
  const record = state.fieldNetwork.sites[id];
  if (!record || record.resolved) return;
  record.resolved = true;
  record.result = resultText;
  addLog(resultText);
  saveState();
  render();
}

function workFieldNetworkSite(id, action) {
  ensureFieldNetworkState();
  if (state.location !== id) return;
  const def = FIELD_NETWORK_SITES[id];
  const record = state.fieldNetwork.sites[id];
  if (!def || !record || record.resolved) return;

  if (id === "argentWreck") {
    if (action === "intact") {
      if (fieldNetworkFreeCargo() < 3) return addLog("ARGENT DRIFT RETURN — Recovering the intact sensor rack requires 3 open cargo spaces."), render();
      state.cargo.sensorComponents = (state.cargo.sensorComponents || 0) + 3;
      return resolveFieldSite(id, "ARGENT DRIFT RETURN — The return resolves into the broken spine of an old survey craft. You recover 3 Sensor Components from an intact rack; the remaining wreckage is not worth another pass.");
    }
    if (action === "strip") {
      if (fieldNetworkFreeCargo() < 2) return addLog("ARGENT DRIFT RETURN — Stripping compact salvage requires 2 open cargo spaces."), render();
      state.cargo.machineParts = (state.cargo.machineParts || 0) + 2;
      return resolveFieldSite(id, "ARGENT DRIFT RETURN — You strip the accessible wreckage for 2 Power Couplings. It is less valuable than the intact rack, but easier to move. The site is exhausted.");
    }
  }

  if (id === "glassCurrent") {
    const strong = state.ship.sensors >= 4;
    state.credits += strong ? 240 : 80;
    if (strong) state.reputation += 1;
    return resolveFieldSite(id, strong
      ? "GLASS CURRENT SIGNAL — Your sensors isolate a stable charged-particle boundary where two weak stellar currents intersect. Pelagos pays 240 cr for the clean survey and your standing improves. Nothing physical is recoverable."
      : "GLASS CURRENT SIGNAL — The return is real, but your current sensors can only establish a rough charged-particle boundary. Pelagos pays 80 cr for the partial observation. There is nothing physical to recover.");
  }

  if (id === "silentEcho") {
    return resolveFieldSite(id, "SILENT ECHO COORDINATES — A complete scan finds no beacon, wreck, deposit, or active signal. The old return was real once or simply persistent sensor noise; either way, there is nothing operational here now.");
  }

  if (id === "courierTrail") {
    const breadcrumbReady = fieldNetworkHasRoom() || fieldNetworkActiveCount() === FIELD_SITE_MAX_ACTIVE;
    if (breadcrumbReady && !state.fieldNetwork.sites.emberCache.discovered && !state.fieldNetwork.sites.emberCache.completed && fieldAnchorKnown("emberCache")) {
      record.resolved = true;
      record.result = "OLD COURIER VECTOR — The coordinates hold no cargo or wreckage, but a surviving navigation fragment contains a later Red Mesa vector.";
      addLog(record.result);
      revealFieldNetworkSite("emberCache", "breadcrumb", "BREADCRUMB — A surviving courier navigation fragment points to another unregistered return beyond Red Mesa. Ember Cache Return has been added to navigation.");
      saveState();
      render();
      return;
    }
    return resolveFieldSite(id, "OLD COURIER VECTOR — The coordinates contain no recoverable material. A damaged navigation fragment suggests there was once another stop farther out, but you cannot currently resolve it into a usable vector.");
  }

  if (id === "emberCache") {
    if (fieldNetworkFreeCargo() < 3) return addLog("EMBER CACHE RETURN — Recovering the dense mineral packets requires 3 open cargo spaces."), render();
    state.cargo.goldOre = (state.cargo.goldOre || 0) + 3;
    return resolveFieldSite(id, "EMBER CACHE RETURN — The follow-up coordinates resolve into three sealed mineral packets trapped inside a dead courier cache. You recover 3 Gold-Bearing Ore. Nothing else remains worth taking.");
  }
}

function fieldNetworkVisualHtml(id) {
  const kind = FIELD_NETWORK_SITES[id]?.outcome || "empty";
  const marks = {
    salvage: '<span class="field-object wreck-main"></span><span class="field-object wreck-wing"></span><span class="field-object wreck-piece"></span>',
    survey: '<span class="field-wave wave-a"></span><span class="field-wave wave-b"></span><span class="field-wave wave-c"></span>',
    empty: '<span class="field-reticle"></span><span class="field-scan-line"></span>',
    breadcrumb: '<span class="field-object courier-fragment"></span><span class="field-vector-line"></span><span class="field-vector-point"></span>',
    resource: '<span class="field-object cache-a"></span><span class="field-object cache-b"></span><span class="field-object cache-c"></span>'
  };
  return `<div class="field-site-visual field-network-visual field-${kind}" aria-hidden="true">${marks[kind] || marks.empty}<span class="field-scan-line"></span></div>`;
}

function fieldNetworkOverviewHtml(id) {
  const def = FIELD_NETWORK_SITES[id];
  const record = state.fieldNetwork.sites[id];
  const resolved = record.resolved;
  const free = fieldNetworkFreeCargo();

  let body = "";
  if (resolved) {
    body = `<h3>Site Resolved</h3><p>${escapeHtml(record.result || "The site has been investigated.")}</p><p class="muted small">These temporary coordinates will be removed from active navigation after you depart.</p>`;
  } else if (id === "argentWreck") {
    body = `<h3>Broken Survey Craft</h3><p>The scan resolves into old wreckage. One intact sensor rack survived, but removing it whole takes more cargo space than stripping smaller components.</p><p class="muted small">Current free cargo space: ${free}.</p><div class="field-action-stack"><button class="primary" type="button" onclick="workFieldNetworkSite('${id}','intact')" ${free < 3 ? "disabled" : ""}>Recover intact rack — 3 Sensor Components</button><button class="secondary" type="button" onclick="workFieldNetworkSite('${id}','strip')" ${free < 2 ? "disabled" : ""}>Strip compact salvage — 2 Power Couplings</button></div>`;
  } else if (id === "glassCurrent") {
    body = `<h3>Repeating Particle Boundary</h3><p>The signal is not a ship or deposit. It is a stable physical feature worth measuring. Better sensors can produce a cleaner survey.</p><p class="muted small">Current sensor rating: ${state.ship.sensors}.</p><button class="primary" type="button" onclick="workFieldNetworkSite('${id}','scan')">Run survey pass</button>`;
  } else if (id === "silentEcho") {
    body = `<h3>No Classification Yet</h3><p>The coordinates are quiet. Only a complete local scan can establish whether the old navigation return still corresponds to anything real.</p><button class="primary" type="button" onclick="workFieldNetworkSite('${id}','scan')">Run complete scan</button>`;
  } else if (id === "courierTrail") {
    body = `<h3>Old Traffic Trace</h3><p>Nothing obvious is broadcasting here. A close scan may confirm the rumor, disprove it, or recover information from whatever once used these coordinates.</p><button class="primary" type="button" onclick="workFieldNetworkSite('${id}','scan')">Investigate the vector</button>`;
  } else if (id === "emberCache") {
    body = `<h3>Dense Sealed Return</h3><p>The breadcrumb was good. Three compact mineral packets are trapped inside a dead courier cache.</p><p class="muted small">Recovery requires 3 open cargo spaces. Current free space: ${free}.</p><button class="primary" type="button" onclick="workFieldNetworkSite('${id}','recover')" ${free < 3 ? "disabled" : ""}>Recover 3 Gold-Bearing Ore</button>`;
  }

  return `<div class="section-heading"><div><p class="eyebrow">FIELD LOCATION</p><h2>${escapeHtml(def.name)}</h2></div></div>
    <article class="field-site-card field-network-card" style="--field-accent:${def.accent};--field-accent-2:${def.accent2}">
      ${fieldNetworkVisualHtml(id)}
      <div class="field-site-copy">
        <p class="eyebrow">NO STATION SERVICES</p>
        ${body}
      </div>
    </article>`;
}

const renderOverviewBeforeFieldNetwork = renderOverview;
renderOverview = function renderOverviewWithFieldNetwork() {
  ensureFieldNetworkState();
  if (!fieldNetworkIsSite(state.location)) return renderOverviewBeforeFieldNetwork();
  view.innerHTML = fieldNetworkOverviewHtml(state.location);
};

const renderStatusBeforeFieldNetwork = renderStatus;
renderStatus = function renderStatusWithFieldNetwork() {
  ensureFieldNetworkState();
  renderStatusBeforeFieldNetwork();
  const atField = fieldNetworkIsSite(state.location) || state.location === DRAAK_FIELD_ID;
  document.querySelectorAll('.tab').forEach(tab => {
    if (tab.dataset.view === "market" || tab.dataset.view === "contracts" || tab.dataset.view === "cantina") tab.disabled = atField;
  });
};

const renderBeforeFieldNetwork = render;
render = function renderWithFieldNetworkGuard() {
  if (fieldNetworkIsSite(state.location) && ["market", "contracts", "cantina"].includes(currentView)) currentView = "overview";
  return renderBeforeFieldNetwork();
};

const refuelAtPortBeforeFieldNetwork = refuelAtPort;
refuelAtPort = function refuelAtPortsNotFieldSites() {
  if (fieldNetworkIsSite(state.location)) return;
  return refuelAtPortBeforeFieldNetwork();
};

function completeAndRemoveFieldNetworkSite(id) {
  const record = state.fieldNetwork.sites[id];
  if (!record || record.completed) return;
  record.completed = true;
  record.discovered = false;
  removeFieldNetworkSite(id);
  addLog(`NAVIGATION — ${FIELD_NETWORK_SITES[id].name} removed from active coordinates. The field location has been resolved.`);
}

const travelBeforeFieldNetwork = travel;
travel = function travelWithFieldNetwork(destination, fuelCost) {
  const origin = state.location;
  const leavingResolved = fieldNetworkIsSite(origin) && state.fieldNetwork?.sites?.[origin]?.resolved;
  if (fieldNetworkIsSite(destination)) currentView = "overview";

  const result = travelBeforeFieldNetwork(destination, fuelCost);

  if (leavingResolved && state.location !== origin) {
    completeAndRemoveFieldNetworkSite(origin);
    saveState();
    render();
  }

  if (!fieldNetworkIsSite(state.location) && state.location !== DRAAK_FIELD_ID) maybeDiscoverFieldByScanner();
  return result;
};

if (typeof travelMapIdentity === "function") {
  const travelMapIdentityBeforeFieldNetwork = travelMapIdentity;
  travelMapIdentity = function travelMapIdentityWithFieldNetwork(id) {
    const def = FIELD_NETWORK_SITES[id];
    if (def) return { accent: def.accent, accent2: def.accent2 };
    return travelMapIdentityBeforeFieldNetwork(id);
  };
}

if (typeof travelMapDetailHtml === "function") {
  const travelMapDetailHtmlBeforeFieldNetwork = travelMapDetailHtml;
  travelMapDetailHtml = function travelMapDetailHtmlWithFieldNetwork(id) {
    const def = FIELD_NETWORK_SITES[id];
    if (!def) return travelMapDetailHtmlBeforeFieldNetwork(id);
    const route = typeof shortestRoute === "function" ? shortestRoute(state.location, id) : null;
    const jumps = route ? Math.max(0, route.path.length - 1) : null;
    const routeText = id === state.location ? "Current location" : route ? `${jumps} jump${jumps === 1 ? "" : "s"} • ${route.fuel} total route fuel` : "No known route";
    return `<div class="travel-map-detail-card field-map-detail">
      <div class="travel-map-detail-head"><div><p class="eyebrow">FIELD COORDINATES</p><h3>${escapeHtml(def.name)}</h3><p class="muted small">${escapeHtml(def.type)} • ${routeText}</p></div><span class="travel-map-market-age">${escapeHtml(def.sourceLabel)}</span></div>
      <p class="muted small">Temporary off-lane coordinates. No market or port services are available, and the result is not known until you investigate.</p>
    </div>`;
  };
}

ensureFieldNetworkState();
saveState();

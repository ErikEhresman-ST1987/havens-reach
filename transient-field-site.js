// Haven's Reach — Transient Field Site #1
// Proof of concept: a trusted contact can reveal temporary frontier coordinates.
// The site is discovered, visited, worked once, exhausted, and then removed from navigation.
// This deliberately proves the field-site lifecycle without creating a general procedural system.

const DRAAK_FIELD_ID = "draakIronScatter";
const DRAAK_FIELD_ORE = 4;
const DRAAK_FIELD_FUEL = 14;

function ensureTransientFieldState() {
  if (!state.fieldSites || typeof state.fieldSites !== "object") state.fieldSites = {};
  if (!state.fieldSites.draakIronScatter || typeof state.fieldSites.draakIronScatter !== "object") {
    state.fieldSites.draakIronScatter = { offered: false, discovered: false, exhausted: false, completed: false };
  }
  const site = state.fieldSites.draakIronScatter;
  ["offered", "discovered", "exhausted", "completed"].forEach(key => {
    if (site[key] !== true) site[key] = false;
  });

  // The field exists in world data only while it is navigationally relevant. This keeps
  // the stable station graph intact while letting the proven travel code handle the trip.
  if (site.discovered && !site.completed) installDraakFieldWorldData();
  else removeDraakFieldWorldData();
}

function installDraakFieldWorldData() {
  if (!GAME_DATA.systems[DRAAK_FIELD_ID]) {
    GAME_DATA.systems[DRAAK_FIELD_ID] = {
      name: "Kestrel Iron Scatter",
      type: "Transient mineral field",
      description: "A loose nickel-iron debris field beyond Red Mesa's regular industrial traffic.",
      neighbors: { redMesa: DRAAK_FIELD_FUEL },
      market: {},
      contracts: []
    };
  }
  if (GAME_DATA.systems.redMesa?.neighbors) GAME_DATA.systems.redMesa.neighbors[DRAAK_FIELD_ID] = DRAAK_FIELD_FUEL;
  if (typeof TRAVEL_MAP_POSITIONS !== "undefined") TRAVEL_MAP_POSITIONS[DRAAK_FIELD_ID] = [84, 16];
}

function removeDraakFieldWorldData() {
  if (GAME_DATA.systems.redMesa?.neighbors) delete GAME_DATA.systems.redMesa.neighbors[DRAAK_FIELD_ID];
  delete GAME_DATA.systems[DRAAK_FIELD_ID];
  if (typeof TRAVEL_MAP_POSITIONS !== "undefined") delete TRAVEL_MAP_POSITIONS[DRAAK_FIELD_ID];
  if (Array.isArray(state.navigation?.knownSystems)) {
    state.navigation.knownSystems = state.navigation.knownSystems.filter(id => id !== DRAAK_FIELD_ID);
  }
}

function draakFieldLeadEligible() {
  ensureTransientFieldState();
  const draak = state.npcs?.draak;
  const site = state.fieldSites.draakIronScatter;
  return Boolean(
    state.location === "redMesa" &&
    draak?.met &&
    draak.relationship >= 4 &&
    draak.memory?.freightRetrofitCompleted &&
    !site.offered && !site.discovered && !site.completed
  );
}

function draakFieldLeadPending() {
  return draakFieldLeadEligible();
}

// Let the existing restrained LOCAL CONTACT strip surface the lead.
const npcOpportunityAvailableBeforeFieldSite = npcOpportunityAvailable;
npcOpportunityAvailable = function npcOpportunityAvailableWithFieldSite(id) {
  if (id === "draak" && draakFieldLeadPending()) return true;
  return npcOpportunityAvailableBeforeFieldSite(id);
};

if (typeof npcOpportunitySignalToken === "function") {
  const npcOpportunitySignalTokenBeforeFieldSite = npcOpportunitySignalToken;
  npcOpportunitySignalToken = function npcOpportunitySignalTokenWithFieldSite(id) {
    const base = npcOpportunitySignalTokenBeforeFieldSite(id);
    if (id === "draak" && draakFieldLeadPending()) return `${base || "draak"}:kestrel-field`;
    return base;
  };
}

const openNpcInteractionBeforeFieldSite = openNpcInteraction;
openNpcInteraction = function openNpcInteractionWithFieldSite(id) {
  ensureTransientFieldState();
  if (id !== "draak" || !draakFieldLeadPending()) return openNpcInteractionBeforeFieldSite(id);

  el("encounterTitle").textContent = "Draak Tor — Unworked Coordinates";
  el("encounterText").textContent = "Draak has a lead that is too small for Red Mesa's industrial crews to bother with. A survey tug logged a loose nickel-iron scatter beyond the normal freight lanes. The deposit will not support a permanent operation, but an independent ship could recover the accessible material before the field disperses into ordinary debris. He offers you the coordinates.";
  el("encounterChoices").innerHTML = `
    <button class="secondary" type="button" onclick="resolveEncounter('draakFieldAccept')">Take the coordinates</button>
    <button class="secondary" type="button" onclick="resolveEncounter('draakFieldLater')">Not right now</button>`;
  el("encounterDialog").showModal();
};

const resolveEncounterBeforeFieldSite = resolveEncounter;
resolveEncounter = function resolveEncounterWithFieldSite(action) {
  ensureTransientFieldState();
  const site = state.fieldSites.draakIronScatter;

  if (action === "draakFieldAccept") {
    site.offered = true;
    site.discovered = true;
    installDraakFieldWorldData();
    if (typeof ensureNavigationDiscoveryState === "function") ensureNavigationDiscoveryState();
    if (!state.navigation.knownSystems.includes(DRAAK_FIELD_ID)) state.navigation.knownSystems.push(DRAAK_FIELD_ID);
    state.npcs.draak.memory.sharedFieldCoordinates = (state.npcs.draak.memory.sharedFieldCoordinates || 0) + 1;
    addLog("DRAAK TOR — Kestrel Iron Scatter added to navigation. Draak's coordinates place the temporary mineral field a short jump beyond Red Mesa.");
    saveState();
    if (el("encounterDialog").open) el("encounterDialog").close();
    currentView = "travel";
    render();
    return;
  }

  if (action === "draakFieldLater") {
    addLog("Draak keeps the mineral-field coordinates to himself for now. He says the lead can wait until you are interested.");
    saveState();
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
    return;
  }

  return resolveEncounterBeforeFieldSite(action);
};

function draakFieldFreeCargo() {
  return Math.max(0, state.ship.cargoCapacity - cargoUsed());
}

function workDraakField() {
  ensureTransientFieldState();
  const site = state.fieldSites.draakIronScatter;
  if (state.location !== DRAAK_FIELD_ID || site.exhausted || site.completed) return;

  if (draakFieldFreeCargo() < DRAAK_FIELD_ORE) {
    addLog(`KESTREL IRON SCATTER — Recovering the useful concentration requires ${DRAAK_FIELD_ORE} open cargo spaces. The field remains charted.`);
    render();
    return;
  }

  state.cargo.ore = (state.cargo.ore || 0) + DRAAK_FIELD_ORE;
  site.exhausted = true;
  state.npcs.draak.memory.workedKestrelField = true;
  addLog(`KESTREL IRON SCATTER — You recover ${DRAAK_FIELD_ORE} units of Industrial Ore. The useful concentration is exhausted; there is no reason to return once you leave.`);
  saveState();
  render();
}

// A field site is not a port. The normal automatic port refuel must not fire on arrival.
const refuelAtPortBeforeFieldSite = refuelAtPort;
refuelAtPort = function refuelAtCivilizedPortOnly() {
  if (state.location === DRAAK_FIELD_ID) return;
  return refuelAtPortBeforeFieldSite();
};

// Once the exhausted site is left, remove its coordinates from active navigation.
const travelBeforeFieldSite = travel;
travel = function travelWithTransientFieldCleanup(destination, fuelCost) {
  const leavingExhaustedField = state.location === DRAAK_FIELD_ID && state.fieldSites?.draakIronScatter?.exhausted;
  const result = travelBeforeFieldSite(destination, fuelCost);
  if (leavingExhaustedField && state.location !== DRAAK_FIELD_ID) {
    const site = state.fieldSites.draakIronScatter;
    site.completed = true;
    site.discovered = false;
    removeDraakFieldWorldData();
    addLog("NAVIGATION — Kestrel Iron Scatter removed from active coordinates. The recoverable deposit has been exhausted.");
    saveState();
    render();
  }
  return result;
};

function draakFieldOverviewHtml() {
  const site = state.fieldSites.draakIronScatter;
  const exhausted = site.exhausted;
  const free = draakFieldFreeCargo();
  return `
    <div class="section-heading"><div><p class="eyebrow">FIELD LOCATION</p><h2>Kestrel Iron Scatter</h2></div></div>
    <article class="field-site-card">
      <div class="field-site-visual" aria-hidden="true">
        <span class="field-rock rock-a"></span><span class="field-rock rock-b"></span><span class="field-rock rock-c"></span><span class="field-rock rock-d"></span>
        <span class="field-scan-line"></span>
      </div>
      <div class="field-site-copy">
        <p class="eyebrow">NO STATION SERVICES</p>
        <h3>${exhausted ? "Deposit Exhausted" : "Loose Nickel-Iron Concentration"}</h3>
        <p>${exhausted ? "Your recovery pass stripped the only concentration worth working. What remains is ordinary scattered debris." : "Draak's coordinates were good. Your sensors resolve a compact concentration of workable ore among the wider debris field."}</p>
        ${exhausted
          ? `<p class="muted small">The coordinates will be removed from active navigation after you depart.</p>`
          : `<p class="muted small">Recovery requires ${DRAAK_FIELD_ORE} open cargo spaces. Current free space: ${free}.</p>
             <button class="primary" type="button" onclick="workDraakField()" ${free < DRAAK_FIELD_ORE ? "disabled" : ""}>Recover ${DRAAK_FIELD_ORE} Industrial Ore</button>`}
      </div>
    </article>`;
}

const renderOverviewBeforeFieldSite = renderOverview;
renderOverview = function renderOverviewWithFieldSite() {
  if (state.location !== DRAAK_FIELD_ID) return renderOverviewBeforeFieldSite();
  view.innerHTML = draakFieldOverviewHtml();
};

// Keep the top-level interface honest: there is no market or contract board in open space.
const renderStatusBeforeFieldSite = renderStatus;
renderStatus = function renderStatusWithFieldSite() {
  ensureTransientFieldState();
  renderStatusBeforeFieldSite();
  const atField = state.location === DRAAK_FIELD_ID;
  document.querySelectorAll('.tab').forEach(tab => {
    if (tab.dataset.view === "market" || tab.dataset.view === "contracts") tab.disabled = atField;
  });
};

// If a stale view was active when arriving, force the field arrival to its own overview.
const renderBeforeFieldSite = render;
render = function renderWithFieldSiteGuard() {
  if (state.location === DRAAK_FIELD_ID && (currentView === "market" || currentView === "contracts")) currentView = "overview";
  return renderBeforeFieldSite();
};

// Give the temporary node its own field identity and avoid pretending it has a market.
if (typeof travelMapIdentity === "function") {
  const travelMapIdentityBeforeFieldSite = travelMapIdentity;
  travelMapIdentity = function travelMapIdentityWithFieldSite(id) {
    if (id === DRAAK_FIELD_ID) return { accent: "#c58a58", accent2: "#8ea0aa" };
    return travelMapIdentityBeforeFieldSite(id);
  };
}

if (typeof travelMapDetailHtml === "function") {
  const travelMapDetailHtmlBeforeFieldSite = travelMapDetailHtml;
  travelMapDetailHtml = function travelMapDetailHtmlWithFieldSite(id) {
    if (id !== DRAAK_FIELD_ID) return travelMapDetailHtmlBeforeFieldSite(id);
    const route = typeof shortestRoute === "function" ? shortestRoute(state.location, id) : null;
    const jumps = route ? Math.max(0, route.path.length - 1) : null;
    const routeText = id === state.location ? "Current location" : route ? `${jumps} jump${jumps === 1 ? "" : "s"} • ${route.fuel} total route fuel` : "No known route";
    return `<div class="travel-map-detail-card field-map-detail">
      <div class="travel-map-detail-head"><div><p class="eyebrow">FIELD COORDINATES</p><h3>Kestrel Iron Scatter</h3><p class="muted small">Transient mineral field • ${routeText}</p></div><span class="travel-map-market-age">Draak Tor lead</span></div>
      <p class="muted small">Temporary coordinates outside the normal station network. No market or port services are available.</p>
    </div>`;
  };
}

ensureTransientFieldState();
saveState();

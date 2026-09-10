// Haven's Reach — Field System Pacing & Renewal #1
// Keeps transient field discoveries uncommon but ongoing. All discovery channels share
// one quiet period, and completed named sites remain completed while renewable field
// families can generate new temporary coordinates indefinitely.

const FIELD_RENEWAL_QUIET_TRIPS = 3;
const FIELD_RENEWAL_IDS = ["fieldRenewalA", "fieldRenewalB", "fieldRenewalC"];

const FIELD_RENEWAL_TEMPLATES = {
  salvage: [
    { name: "Greywake Debris Return", type: "Unverified debris return", description: "A scattered metallic return sits well outside ordinary traffic. The pattern could be old wreckage or discarded freight hardware." },
    { name: "Broken Lantern Trace", type: "Unverified wreck return", description: "Several compact reflections move together along an old traffic vector. Nothing in the registry explains them." },
    { name: "Cold Hull Scatter", type: "Unverified debris field", description: "A loose cluster of cold metal signatures appears against the background. The source is too faint to classify remotely." }
  ],
  survey: [
    { name: "Blue Arc Signal", type: "Unverified survey return", description: "A narrow repeating return persists across several sensor sweeps. It may be a physical boundary, local interference, or something worth measuring." },
    { name: "Farline Echo", type: "Unverified sensor return", description: "A weak signal repeats at regular intervals outside the maintained survey lanes. The source remains unclassified." },
    { name: "Quiet Meridian", type: "Unverified spatial return", description: "Your instruments mark a stable but unexplained variation in the local environment. A close survey would establish whether it matters." }
  ],
  resource: [
    { name: "Copperlight Scatter", type: "Unverified mineral return", description: "A dense cluster of small bodies shows an unusually consistent metallic signature. Remote readings cannot establish whether the concentration is workable." },
    { name: "Redglass Prospect", type: "Unverified prospecting return", description: "Old prospecting data and a fresh sensor echo overlap closely enough to justify a look, but not closely enough to promise a deposit." },
    { name: "Driftstone Concentration", type: "Unverified mineral field", description: "A compact concentration stands out from a wider debris field. The useful material, if any, will only be clear at close range." }
  ],
  empty: [
    { name: "Pale Echo Coordinates", type: "Unverified navigation return", description: "A consistent but weak return appears in several old route records. No recent operator has confirmed anything at the coordinates." },
    { name: "Null Beacon Trace", type: "Unverified signal return", description: "A faint beacon-like rhythm survives in archived traffic data, but no registered transmitter should exist there now." },
    { name: "Stillwater Return", type: "Unverified scanner return", description: "The coordinates repeatedly produce a marginal contact. It may be something real, something long gone, or persistent noise." }
  ],
  breadcrumb: [
    { name: "Old Relay Vector", type: "Unverified traffic lead", description: "Fragmentary route notes agree on an off-lane relay point that disappeared from commercial charts years ago." },
    { name: "Courier Ghost Vector", type: "Unverified traffic trace", description: "Independent courier logs preserve the same obsolete vector. Nothing at the coordinates is registered as an active stop." },
    { name: "Lost Survey Marker", type: "Unverified survey lead", description: "A retired survey marker appears in several old data sets. Its original purpose is unclear, but the coordinates still resolve." }
  ]
};

const FIELD_RENEWAL_ANCHORS = ["prospect", "caldersDrift", "redMesa", "pelagos", "meridian"];

function ensureFieldRenewalState() {
  ensureFieldNetworkState();
  if (!state.fieldNetworkRenewal || typeof state.fieldNetworkRenewal !== "object") {
    const trip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
    state.fieldNetworkRenewal = {
      lastLeadTrip: trip,
      serial: 0,
      instances: {},
      npcChecks: {},
      cantinaChecks: {},
      pendingBreadcrumb: false
    };
  }
  const r = state.fieldNetworkRenewal;
  if (!Number.isFinite(r.lastLeadTrip)) r.lastLeadTrip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
  if (!Number.isFinite(r.serial)) r.serial = 0;
  if (!r.instances || typeof r.instances !== "object") r.instances = {};
  if (!r.npcChecks || typeof r.npcChecks !== "object") r.npcChecks = {};
  if (!r.cantinaChecks || typeof r.cantinaChecks !== "object") r.cantinaChecks = {};
  if (r.pendingBreadcrumb !== true) r.pendingBreadcrumb = false;

  FIELD_RENEWAL_IDS.forEach(id => {
    const inst = r.instances[id];
    if (!inst) return;
    FIELD_NETWORK_SITES[id] = inst.def;
    if (!state.fieldNetwork.sites[id]) state.fieldNetwork.sites[id] = { discovered: false, resolved: false, completed: false, source: null, result: null };
    const record = state.fieldNetwork.sites[id];
    if (record.discovered && !record.completed) installFieldNetworkSite(id);
    else removeFieldNetworkSite(id);
  });
}

function fieldRenewalTrip() {
  return Number.isFinite(state.tripCount) ? state.tripCount : 0;
}

function fieldRenewalQuietComplete() {
  ensureFieldRenewalState();
  return fieldRenewalTrip() - state.fieldNetworkRenewal.lastLeadTrip >= FIELD_RENEWAL_QUIET_TRIPS;
}

function fieldRenewalCanDiscover() {
  return fieldNetworkHasRoom() && fieldRenewalQuietComplete();
}

function fieldRenewalKnownAnchors() {
  return FIELD_RENEWAL_ANCHORS.filter(id => typeof isSystemKnown !== "function" || isSystemKnown(id));
}

function fieldRenewalPosition(anchor, serial) {
  const base = typeof TRAVEL_MAP_POSITIONS !== "undefined" ? TRAVEL_MAP_POSITIONS[anchor] : null;
  const fallback = { meridian: [27,58], prospect: [44,38], caldersDrift: [61,58], redMesa: [77,36], pelagos: [91,57] }[anchor] || [50,50];
  const [x, y] = base || fallback;
  const offsets = [[-7,-17],[8,16],[-10,15],[6,-18],[11,8],[-12,-7]];
  const [dx, dy] = offsets[serial % offsets.length];
  return [Math.max(6, Math.min(94, x + dx)), Math.max(8, Math.min(92, y + dy))];
}

function fieldRenewalChooseFamily() {
  const roll = Math.random();
  if (roll < 0.23) return "salvage";
  if (roll < 0.44) return "resource";
  if (roll < 0.64) return "survey";
  if (roll < 0.84) return "empty";
  return "breadcrumb";
}

function fieldRenewalPrepareSite(source, preferredAnchor = null) {
  ensureFieldRenewalState();
  if (!fieldRenewalCanDiscover()) return null;

  const slot = FIELD_RENEWAL_IDS.find(id => {
    const record = state.fieldNetwork.sites[id];
    return !record || (!record.discovered && (record.completed || record.resolved || !state.fieldNetworkRenewal.instances[id]));
  });
  if (!slot) return null;

  const anchors = fieldRenewalKnownAnchors();
  if (!anchors.length) return null;
  const anchor = preferredAnchor && anchors.includes(preferredAnchor)
    ? preferredAnchor
    : anchors[Math.floor(Math.random() * anchors.length)];

  const family = fieldRenewalChooseFamily();
  const options = FIELD_RENEWAL_TEMPLATES[family];
  const template = options[Math.floor(Math.random() * options.length)];
  state.fieldNetworkRenewal.serial += 1;
  const serial = state.fieldNetworkRenewal.serial;
  const fuel = 11 + Math.floor(Math.random() * 8);
  const accents = {
    salvage: ["#8fb7c8", "#d0d7dc"], survey: ["#78bfd0", "#b8a9df"],
    resource: ["#d49a62", "#d8c27e"], empty: ["#9aaab7", "#71808a"], breadcrumb: ["#c1a76d", "#8eaac2"]
  }[family];

  const def = {
    name: template.name,
    type: template.type,
    anchor,
    fuel,
    position: fieldRenewalPosition(anchor, serial),
    accent: accents[0],
    accent2: accents[1],
    sourceLabel: source === "scanner" ? "Scanner contact" : source.startsWith("npc:") ? "Contact lead" : source === "cantina" ? "Cantina lead" : "Recovered lead",
    outcome: family,
    description: template.description,
    renewable: true,
    serial
  };

  state.fieldNetworkRenewal.instances[slot] = { def, family, serial };
  FIELD_NETWORK_SITES[slot] = def;
  state.fieldNetwork.sites[slot] = { discovered: false, resolved: false, completed: false, source: null, result: null };
  return slot;
}

// One discovery, from any source, starts the same quiet period.
const revealFieldNetworkSiteBeforeRenewal = revealFieldNetworkSite;
revealFieldNetworkSite = function revealFieldNetworkSiteWithGlobalPacing(id, source, logText) {
  ensureFieldRenewalState();
  if (!fieldRenewalQuietComplete()) return false;
  const revealed = revealFieldNetworkSiteBeforeRenewal(id, source, logText);
  if (revealed) {
    state.fieldNetworkRenewal.lastLeadTrip = fieldRenewalTrip();
    saveState();
  }
  return revealed;
};

// Existing named NPC leads now obey the shared quiet period too.
const npcFieldLeadAvailableBeforeRenewal = npcFieldLeadAvailable;
npcFieldLeadAvailable = function npcFieldLeadAvailableWithGlobalPacing(id) {
  if (!fieldRenewalQuietComplete()) return false;
  return npcFieldLeadAvailableBeforeRenewal(id);
};

// Existing cantina lead obeys the same pacing.
const fieldCantinaLeadAvailableBeforeRenewal = fieldCantinaLeadAvailable;
fieldCantinaLeadAvailable = function fieldCantinaLeadAvailableWithGlobalPacing() {
  if (!fieldRenewalQuietComplete()) return false;
  return fieldCantinaLeadAvailableBeforeRenewal();
};

// Scanner discoveries are deliberately less common than the first pass. After the
// authored one-time scanner sites are exhausted, the same channel can reveal a fresh
// renewable field instance instead of drying up permanently.
maybeDiscoverFieldByScanner = function maybeDiscoverFieldByScannerRenewable() {
  ensureFieldRenewalState();
  if (!fieldRenewalCanDiscover() || fieldNetworkIsSite(state.location) || state.location === DRAAK_FIELD_ID) return;

  const sensors = Math.max(1, Number(state.ship?.sensors) || 1);
  const chance = Math.min(0.18, 0.065 + sensors * 0.015);
  if (Math.random() >= chance) return;

  let id = fieldNetworkScannerCandidate();
  if (!id) id = fieldRenewalPrepareSite("scanner");
  if (!id) return;
  const def = FIELD_NETWORK_SITES[id];
  revealFieldNetworkSite(id, "scanner", `SCANNER CONTACT — During routine travel, your sensors isolate a repeatable off-lane return. ${def.name} has been added to navigation as unverified coordinates.`);
};

function fieldRenewalNpcOfferAvailable(id) {
  ensureFieldRenewalState();
  if (!fieldRenewalCanDiscover()) return false;
  const npc = state.npcs?.[id];
  if (!npc?.met || npc.relationship < 2 || !NPC_DATA[id]) return false;
  if (!["lena", "orin", "draak", "saeli"].includes(id)) return false;

  const trip = fieldRenewalTrip();
  const key = `${id}:${trip}`;
  if (!(key in state.fieldNetworkRenewal.npcChecks)) state.fieldNetworkRenewal.npcChecks[key] = Math.random() < 0.16;
  return state.fieldNetworkRenewal.npcChecks[key] === true;
}

function openRenewableNpcFieldLead(id) {
  const anchor = NPC_DATA[id]?.location;
  const siteId = fieldRenewalPrepareSite(`npc:${id}`, anchor);
  if (!siteId) return false;
  const def = FIELD_NETWORK_SITES[siteId];
  el("encounterTitle").textContent = `${NPC_DATA[id].name} — Field Lead`;
  el("encounterText").textContent = `${NPC_DATA[id].name} has a set of off-lane coordinates that may be worth checking. The source is credible enough to investigate, but nobody is promising that anything useful is still there.`;
  el("encounterChoices").innerHTML = `
    <button class="secondary" type="button" onclick="resolveEncounter('fieldRenewalNpcAccept:${id}:${siteId}')">Take the coordinates</button>
    <button class="secondary" type="button" onclick="resolveEncounter('fieldRenewalNpcLater:${id}:${siteId}')">Not right now</button>`;
  el("encounterDialog").showModal();
  return true;
}

const openNpcInteractionBeforeFieldRenewal = openNpcInteraction;
openNpcInteraction = function openNpcInteractionWithRenewableFieldLeads(id) {
  // Preserve one-time authored field leads first; renewable leads are the fallback.
  if (npcFieldLeadAvailable(id)) return openNpcInteractionBeforeFieldRenewal(id);
  if (fieldRenewalNpcOfferAvailable(id) && openRenewableNpcFieldLead(id)) return;
  return openNpcInteractionBeforeFieldRenewal(id);
};

const resolveEncounterBeforeFieldRenewal = resolveEncounter;
resolveEncounter = function resolveEncounterWithRenewableFieldLeads(action) {
  if (typeof action === "string" && action.startsWith("fieldRenewalNpcAccept:")) {
    const [, id, siteId] = action.split(":");
    const def = FIELD_NETWORK_SITES[siteId];
    if (def && revealFieldNetworkSite(siteId, `npc:${id}`, `${NPC_DATA[id].name.toUpperCase()} — ${def.name} added to navigation. The lead is worth checking, but the result remains unknown.`)) {
      state.npcs[id].memory.sharedFieldLead = (state.npcs[id].memory.sharedFieldLead || 0) + 1;
    }
    if (el("encounterDialog").open) el("encounterDialog").close();
    saveState();
    render();
    return;
  }
  if (typeof action === "string" && action.startsWith("fieldRenewalNpcLater:")) {
    const [, id, siteId] = action.split(":");
    delete FIELD_NETWORK_SITES[siteId];
    delete state.fieldNetworkRenewal.instances[siteId];
    delete state.fieldNetwork.sites[siteId];
    addLog(`${NPC_DATA[id]?.name || "Your contact"} keeps the coordinates to themselves for now. Another lead may surface later.`);
    if (el("encounterDialog").open) el("encounterDialog").close();
    saveState();
    render();
    return;
  }
  return resolveEncounterBeforeFieldRenewal(action);
};

function fieldRenewalCantinaAvailable() {
  ensureFieldRenewalState();
  if (!fieldRenewalCanDiscover() || fieldNetworkIsSite(state.location)) return false;
  if (!CANTINA_DATA?.[state.location] || (state.cantina?.visits?.[state.location] || 0) < 2) return false;
  const trip = fieldRenewalTrip();
  const key = `${state.location}:${trip}`;
  if (!(key in state.fieldNetworkRenewal.cantinaChecks)) state.fieldNetworkRenewal.cantinaChecks[key] = Math.random() < 0.14;
  return state.fieldNetworkRenewal.cantinaChecks[key] === true;
}

function followRenewableFieldRumor() {
  if (!fieldRenewalCantinaAvailable()) return;
  const id = fieldRenewalPrepareSite("cantina", state.location);
  if (!id) return;
  const def = FIELD_NETWORK_SITES[id];
  if (revealFieldNetworkSite(id, "cantina", `CANTINA LEAD — Comparing several independent stories produces a consistent off-lane vector. ${def.name} has been added to navigation, but nobody can confirm what is there now.`)) {
    state.fieldNetworkRenewal.cantinaChecks[`${state.location}:${fieldRenewalTrip()}`] = false;
  }
  saveState();
  renderCantina();
  renderStatus();
}

const renderCantinaBeforeFieldRenewal = renderCantina;
renderCantina = function renderCantinaWithRenewableFieldRumors() {
  renderCantinaBeforeFieldRenewal();
  if (view.querySelector(".field-rumor-card") || !fieldRenewalCantinaAvailable()) return;
  const grid = view.querySelector(".card-grid");
  if (!grid) return;
  grid.insertAdjacentHTML("beforeend", `
    <article class="info-card field-rumor-card">
      <h3>Compare an Off-Lane Story</h3>
      <p class="muted small">Several operators keep mentioning the same unregistered coordinates. The stories agree on the vector, not on what might still be there.</p>
      <button class="secondary" type="button" onclick="followRenewableFieldRumor()">Compare the coordinates</button>
    </article>`);
};

function renewableFieldFreeCargo() {
  return Math.max(0, state.ship.cargoCapacity - cargoUsed());
}

const workFieldNetworkSiteBeforeRenewal = workFieldNetworkSite;
workFieldNetworkSite = function workFieldNetworkSiteWithRenewal(id, action) {
  const inst = state.fieldNetworkRenewal?.instances?.[id];
  if (!inst) return workFieldNetworkSiteBeforeRenewal(id, action);
  const record = state.fieldNetwork.sites[id];
  if (state.location !== id || !record || record.resolved) return;

  if (inst.family === "salvage") {
    if (renewableFieldFreeCargo() < 2) return addLog(`${FIELD_NETWORK_SITES[id].name.toUpperCase()} — Recovering useful salvage requires 2 open cargo spaces.`), render();
    state.cargo.machineParts = (state.cargo.machineParts || 0) + 2;
    return resolveFieldSite(id, `${FIELD_NETWORK_SITES[id].name.toUpperCase()} — The return resolves into old wreckage. You recover 2 Power Couplings before the remaining debris proves worthless.`);
  }
  if (inst.family === "resource") {
    if (renewableFieldFreeCargo() < 3) return addLog(`${FIELD_NETWORK_SITES[id].name.toUpperCase()} — Recovering the useful concentration requires 3 open cargo spaces.`), render();
    state.cargo.copperOre = (state.cargo.copperOre || 0) + 3;
    return resolveFieldSite(id, `${FIELD_NETWORK_SITES[id].name.toUpperCase()} — A close scan confirms a small workable concentration. You recover 3 Copper Concentrate and exhaust the useful material.`);
  }
  if (inst.family === "survey") {
    const strong = state.ship.sensors >= 4;
    const reward = strong ? 210 : 70;
    state.credits += reward;
    if (strong) state.reputation += 1;
    return resolveFieldSite(id, strong
      ? `${FIELD_NETWORK_SITES[id].name.toUpperCase()} — Your sensors produce a clean survey of a real local phenomenon. The data is worth ${credits(reward)} and improves your standing.`
      : `${FIELD_NETWORK_SITES[id].name.toUpperCase()} — The return is real, but your sensors can only produce a partial reading. The observation is worth ${credits(reward)}.`);
  }
  if (inst.family === "empty") {
    return resolveFieldSite(id, `${FIELD_NETWORK_SITES[id].name.toUpperCase()} — A complete local scan finds no useful deposit, wreck, beacon, or active signal. The lead was worth checking, but there is nothing operational here now.`);
  }
  if (inst.family === "breadcrumb") {
    state.fieldNetworkRenewal.pendingBreadcrumb = true;
    return resolveFieldSite(id, `${FIELD_NETWORK_SITES[id].name.toUpperCase()} — There is nothing to recover here, but a surviving route fragment preserves another incomplete off-lane vector. You keep the fragment for later comparison.`);
  }
};

const fieldNetworkOverviewHtmlBeforeRenewal = fieldNetworkOverviewHtml;
fieldNetworkOverviewHtml = function fieldNetworkOverviewHtmlWithRenewal(id) {
  const inst = state.fieldNetworkRenewal?.instances?.[id];
  if (!inst) return fieldNetworkOverviewHtmlBeforeRenewal(id);
  const def = FIELD_NETWORK_SITES[id];
  const record = state.fieldNetwork.sites[id];
  const free = renewableFieldFreeCargo();
  let body = "";
  if (record.resolved) {
    body = `<h3>Site Resolved</h3><p>${escapeHtml(record.result || "The site has been investigated.")}</p><p class="muted small">These temporary coordinates will be removed from active navigation after you depart.</p>`;
  } else if (inst.family === "salvage") {
    body = `<h3>Unclassified Debris</h3><p>A close pass resolves old metal and broken structure, but you will have to work the site to learn whether anything useful survived.</p><p class="muted small">Recovery needs 2 open cargo spaces. Current free space: ${free}.</p><button class="primary" type="button" onclick="workFieldNetworkSite('${id}','recover')" ${free < 2 ? "disabled" : ""}>Work the debris field</button>`;
  } else if (inst.family === "resource") {
    body = `<h3>Possible Mineral Concentration</h3><p>The return is dense enough to justify a recovery pass, but remote readings still cannot tell you whether the concentration is worthwhile.</p><p class="muted small">Recovery needs 3 open cargo spaces. Current free space: ${free}.</p><button class="primary" type="button" onclick="workFieldNetworkSite('${id}','recover')" ${free < 3 ? "disabled" : ""}>Work the prospect</button>`;
  } else if (inst.family === "survey") {
    body = `<h3>Repeating Sensor Return</h3><p>The signal persists locally. A deliberate survey pass should establish whether it is useful data or ordinary interference.</p><p class="muted small">Current sensor rating: ${state.ship.sensors}.</p><button class="primary" type="button" onclick="workFieldNetworkSite('${id}','scan')">Run survey pass</button>`;
  } else if (inst.family === "empty") {
    body = `<h3>Unverified Return</h3><p>Nothing obvious is visible at the coordinates. A complete scan is the only way to establish whether the lead still corresponds to anything useful.</p><button class="primary" type="button" onclick="workFieldNetworkSite('${id}','scan')">Run complete scan</button>`;
  } else {
    body = `<h3>Old Route Trace</h3><p>The coordinates show signs of old traffic but no obvious cargo or installation. A close investigation may recover useful information—or nothing at all.</p><button class="primary" type="button" onclick="workFieldNetworkSite('${id}','scan')">Investigate the trace</button>`;
  }
  return `<div class="section-heading"><div><p class="eyebrow">FIELD LOCATION</p><h2>${escapeHtml(def.name)}</h2></div></div>
    <article class="field-site-card field-network-card" style="--field-accent:${def.accent};--field-accent-2:${def.accent2}">
      ${fieldNetworkVisualHtml(id)}
      <div class="field-site-copy"><p class="eyebrow">NO STATION SERVICES</p>${body}</div>
    </article>`;
};

// A breadcrumb does not immediately spawn another marker. Once the global quiet period
// has passed, a later ordinary trip may let the stored fragment resolve into coordinates.
function maybeResolvePendingBreadcrumb() {
  ensureFieldRenewalState();
  if (!state.fieldNetworkRenewal.pendingBreadcrumb || !fieldRenewalCanDiscover()) return;
  if (Math.random() >= 0.20) return;
  const id = fieldRenewalPrepareSite("breadcrumb");
  if (!id) return;
  const def = FIELD_NETWORK_SITES[id];
  if (revealFieldNetworkSite(id, "breadcrumb", `BREADCRUMB — Comparing the old route fragment with fresh navigation data finally resolves a usable vector. ${def.name} has been added to navigation.`)) {
    state.fieldNetworkRenewal.pendingBreadcrumb = false;
    saveState();
  }
}

// Run breadcrumb resolution after the field network's travel wrapper has handled normal
// cleanup and scanner discovery. Global pacing guarantees only one new lead can appear.
const travelBeforeFieldRenewal = travel;
travel = function travelWithFieldRenewalPacing(destination, fuelCost) {
  const result = travelBeforeFieldRenewal(destination, fuelCost);
  if (!fieldNetworkIsSite(state.location) && state.location !== DRAAK_FIELD_ID) maybeResolvePendingBreadcrumb();
  return result;
};

ensureFieldRenewalState();
saveState();

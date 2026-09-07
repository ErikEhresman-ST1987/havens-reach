// Haven's Reach — Smallest Meaningful Upgrade #5
// Cantinas give NPCs a natural home, add rumors/news, and prove one discovery unlock.
// This is intentionally lightweight: no quest engine, simulation, or branching story tree.

const CANTINA_DATA = {
  haven: {
    name: "The Old Gantry",
    description: "A worn spacer bar overlooking Haven's old freight yards. Retired haulers, mechanics, and mine crews still trade stories beneath faded departure boards.",
    rumor: "Two ore haulers are arguing about whether the outer mines will cut another production shift. Machine crews have been moving between sites more often than usual.",
    news: "HAVEN CIVIC WIRE — The planetary council approved another round of infrastructure work around the aging southern freight district. Officials say the project should keep several loading yards operating through the next cycle."
  },
  meridian: {
    name: "The Crosswind Lounge",
    description: "A polished commercial lounge just off Meridian Exchange's transfer concourse. Brokers, couriers, and visiting crews conduct half their business away from official terminals.",
    rumor: "A Kharok engineer has apparently been buying compact survey components in quantity. Nobody agrees whether they're for a mining outfit or a private expedition.",
    news: "MERIDIAN TRADE SERVICE — Veylan and human commercial delegates opened talks on revised freight-clearance standards. Exchange officials expect negotiations to continue without disrupting ordinary traffic."
  },
  prospect: {
    name: "The Last Lantern",
    description: "A prefab frontier canteen bolted to Prospect Reach's main habitation ring. Survey crews, salvagers, miners, and independent captains swap route conditions over strong coffee and whatever arrived on the last supply ship.",
    rumor: "A survey crew keeps mentioning a faint navigation beacon beyond the regular Prospect lanes. Most operators dismiss it as an old maintenance marker, but the coordinates are consistent.",
    news: "FRONTIER RELAY — Elyri survey vessels have begun a new mapping initiative along several outer trade corridors. The project is expected to improve long-range navigation data over the coming months."
  }
};

function ensureCantinaState() {
  if (!state.cantina) state.cantina = { visits: {}, discoveries: {} };
  if (!state.cantina.visits) state.cantina.visits = {};
  if (!state.cantina.discoveries) state.cantina.discoveries = {};
}

function localNpcEntry() {
  return Object.entries(NPC_DATA).find(([, npc]) => npc.location === state.location);
}

function renderCantina() {
  ensureNpcState();
  ensureCantinaState();
  const place = CANTINA_DATA[state.location];
  if (!place) {
    view.innerHTML = `<p class="muted">No public cantina is listed at this port.</p>`;
    return;
  }

  state.cantina.visits[state.location] = (state.cantina.visits[state.location] || 0) + 1;
  const local = localNpcEntry();
  let contact = `<p class="muted small">No familiar contacts are here right now.</p>`;
  if (local) {
    const [id, npc] = local;
    const npcState = state.npcs[id];
    contact = `
      <p><strong>${escapeHtml(npc.name)}</strong> — ${escapeHtml(npc.role)}</p>
      <p class="muted small">Relationship: ${npcRelationshipLabel(npcState.relationship)}</p>
      <button class="secondary" type="button" onclick="openNpcInteraction('${id}')">${npcState.met ? "Talk" : "Introduce Yourself"}</button>`;
  }

  const prospectDiscovery = state.location === "prospect" && !state.cantina.discoveries.outerBeacon;
  const discovery = prospectDiscovery ? `
    <article class="info-card">
      <h3>Follow Up a Lead</h3>
      <p class="muted small">The repeated talk about that navigation beacon sounds specific enough to investigate.</p>
      <button class="secondary" type="button" onclick="investigateOuterBeacon()">Ask around about the beacon</button>
    </article>` : state.location === "prospect" ? `
    <article class="info-card">
      <h3>Discovered Lead</h3>
      <p class="muted small">Outer Beacon coordinates are recorded in your operator notes. The lead may become useful as the frontier expands.</p>
    </article>` : "";

  view.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">PORT CANTINA</p>
        <h2>${escapeHtml(place.name)}</h2>
        <p class="muted">${escapeHtml(place.description)}</p>
      </div>
    </div>
    <div class="card-grid">
      <article class="info-card">
        <h3>People</h3>
        ${contact}
      </article>
      <article class="info-card">
        <h3>Rumor Board</h3>
        <p>${escapeHtml(place.rumor)}</p>
        <p class="muted small">Rumors may be useful, incomplete, or simply local talk.</p>
      </article>
      <article class="info-card">
        <h3>News Feed</h3>
        <p>${escapeHtml(place.news)}</p>
        <p class="muted small">Background traffic from the wider frontier.</p>
      </article>
      ${discovery}
    </div>`;

  saveState();
}

function investigateOuterBeacon() {
  ensureCantinaState();
  if (state.cantina.discoveries.outerBeacon) return;
  state.cantina.discoveries.outerBeacon = true;
  state.reputation += 1;
  addLog("At the Last Lantern, you compared stories from three survey crews and isolated a consistent set of coordinates for an Outer Beacon beyond the regular Prospect lanes. The lead is now recorded in your operator notes.");
  saveState();
  renderCantina();
  renderStatus();
}

// Register a new view without changing the core navigation engine.
const cantinaTab = document.querySelector('.tabs');
if (cantinaTab && !cantinaTab.querySelector('[data-view="cantina"]')) {
  const button = document.createElement('button');
  button.className = 'tab';
  button.dataset.view = 'cantina';
  button.textContent = 'Cantina';
  cantinaTab.appendChild(button);

  button.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab === button));
    renderCantina();
  });
}

// Existing tabs already have their own listeners. Keep Cantina visually in sync when they are used.
document.querySelectorAll('.tab:not([data-view="cantina"])').forEach(tab => {
  tab.addEventListener('click', () => {
    const cantina = document.querySelector('[data-view="cantina"]');
    if (cantina) cantina.classList.remove('active');
  });
});

ensureCantinaState();
saveState();

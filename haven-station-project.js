// Haven's Reach — Haven Station Project #1
// Lets accumulated wealth change Haven itself without adding passive income or a general
// investment system. The restored gantry becomes a visible world consequence and adds
// occasional heavier freight work to the existing contract board.

const HAVEN_GANTRY_PROJECT = {
  id: "oldGantry",
  credits: 4200,
  parts: 2,
  contract: {
    id: "haven-gantry-bulk",
    title: "Restored Gantry Bulk Transfer",
    destination: "meridian",
    reward: 1120,
    cargo: { food: 6 },
    rep: 1,
    text: "The restored Old Gantry can finally stage larger independent lots again. Move a six-unit food shipment from Haven to Meridian Exchange."
  }
};

function ensureHavenProjectState() {
  if (!state.stationProjects || typeof state.stationProjects !== "object") state.stationProjects = {};
  if (!state.stationProjects.haven || typeof state.stationProjects.haven !== "object") state.stationProjects.haven = {};
  if (!state.stationProjects.haven.oldGantry || typeof state.stationProjects.haven.oldGantry !== "object") {
    state.stationProjects.haven.oldGantry = { completed: false, tripCompleted: null };
  }
  const record = state.stationProjects.haven.oldGantry;
  record.completed = record.completed === true;
  syncHavenGantryContract();
}

function havenGantryProjectEligible() {
  ensureHavenProjectState();
  const mara = state.npcs?.mara;
  return Boolean(state.location === "haven" && mara?.met && mara.relationship >= 1 && state.reputation >= 2 && !state.stationProjects.haven.oldGantry.completed);
}

function havenGantryCanContribute() {
  return state.credits >= HAVEN_GANTRY_PROJECT.credits && (state.cargo.machineParts || 0) >= HAVEN_GANTRY_PROJECT.parts;
}

function completeHavenGantryProject() {
  ensureHavenProjectState();
  if (!havenGantryProjectEligible()) return;
  if (!havenGantryCanContribute()) {
    addLog(`OLD GANTRY — Mara needs ${credits(HAVEN_GANTRY_PROJECT.credits)} and ${HAVEN_GANTRY_PROJECT.parts} Power Couplings before the restoration can go ahead.`);
    return render();
  }

  state.credits -= HAVEN_GANTRY_PROJECT.credits;
  state.cargo.machineParts -= HAVEN_GANTRY_PROJECT.parts;
  if (state.cargo.machineParts <= 0) delete state.cargo.machineParts;
  const record = state.stationProjects.haven.oldGantry;
  record.completed = true;
  record.tripCompleted = Number.isFinite(state.tripCount) ? state.tripCount : 0;
  if (state.npcs?.mara) {
    state.npcs.mara.relationship += 1;
    state.npcs.mara.memory.restoredOldGantry = true;
  }
  syncHavenGantryContract();
  if (state.contractVariety?.boards?.haven) delete state.contractVariety.boards.haven;
  addLog("HAVEN — With your funding and replacement couplings, Mara's crews bring the Old Gantry back into service. Independent haulers can once again stage larger freight lots through Haven.");
  saveState();
  render();
}

function syncHavenGantryContract() {
  const completed = Boolean(state.stationProjects?.haven?.oldGantry?.completed);
  const board = GAME_DATA.systems.haven?.contracts;
  if (!Array.isArray(board)) return;
  const id = HAVEN_GANTRY_PROJECT.contract.id;
  const index = board.findIndex(contract => contract.id === id);
  if (completed && index < 0) board.push({ ...HAVEN_GANTRY_PROJECT.contract, cargo: { ...HAVEN_GANTRY_PROJECT.contract.cargo } });
  if (!completed && index >= 0) board.splice(index, 1);
}

function havenGantryProjectCardHtml() {
  ensureHavenProjectState();
  if (state.location !== "haven") return "";
  const record = state.stationProjects.haven.oldGantry;
  if (record.completed) {
    return `<article class="info-card haven-project-card"><p class="eyebrow">STATION PROJECT</p><h3>Old Gantry — Restored</h3><p>One of Haven's dormant freight gantries is operating again. Larger independent lots can now move through the old yards.</p><p class="muted small">Mara's crews still point out which sections were rebuilt with your contribution. New gantry freight work now appears through the ordinary contract board.</p></article>`;
  }
  if (!havenGantryProjectEligible()) return "";
  const haveParts = state.cargo.machineParts || 0;
  return `<article class="info-card haven-project-card"><p class="eyebrow">STATION PROJECT</p><h3>Restore the Old Gantry</h3><p>Mara has a practical proposal: reopen one of Haven's abandoned freight gantries for independent traffic. The structure is usable, but the yard needs replacement power couplings and enough cash to put a crew on it.</p><p><strong>Contribution:</strong> ${credits(HAVEN_GANTRY_PROJECT.credits)} + ${HAVEN_GANTRY_PROJECT.parts} Power Couplings</p><p class="muted small">You currently have ${haveParts} Power Coupling${haveParts === 1 ? "" : "s"}. This is a permanent station change, not an investment; it creates new work rather than passive income.</p><button class="primary" type="button" onclick="completeHavenGantryProject()" ${havenGantryCanContribute() ? "" : "disabled"}>Fund Restoration</button></article>`;
}

const renderOverviewBeforeHavenProject = renderOverview;
renderOverview = function renderOverviewWithHavenProject() {
  renderOverviewBeforeHavenProject();
  if (state.location !== "haven") return;
  const grid = view.querySelector(".card-grid");
  const html = havenGantryProjectCardHtml();
  if (grid && html) grid.insertAdjacentHTML("beforeend", html);
};

// Once restored, keep the consequence inside the proven rotating-board system.
if (typeof chooseContractOffers === "function") {
  const chooseContractOffersBeforeHavenProject = chooseContractOffers;
  chooseContractOffers = function chooseContractOffersWithHavenGantry(systemId, pool) {
    const offers = chooseContractOffersBeforeHavenProject(systemId, pool);
    if (systemId !== "haven" || !state.stationProjects?.haven?.oldGantry?.completed) return offers;
    const projectId = HAVEN_GANTRY_PROJECT.contract.id;
    const poolIds = pool.map(contract => contract.id);
    if (!poolIds.includes(projectId)) return offers;

    const justCompleted = (Number.isFinite(state.tripCount) ? state.tripCount : 0) === state.stationProjects.haven.oldGantry.tripCompleted;
    if (justCompleted && !offers.includes(projectId)) {
      const copy = [...offers];
      if (copy.length) copy[copy.length - 1] = projectId;
      else copy.push(projectId);
      return copy;
    }
    return offers;
  };
}

ensureHavenProjectState();
saveState();

// Haven's Reach — Branching Haven Station Projects
// The Old Gantry remains the proven first project. Once it has had time to become part of
// Haven's working life, a second project lets the player choose how the restored district
// develops. A later follow-up grows naturally from that choice. There is deliberately no
// visible tech tree, project meter, passive income, or general station-development framework.

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

const HAVEN_BRANCH_PROJECTS = {
  freightCooperative: {
    id: "freightCooperative",
    title: "Independent Freight Cooperative",
    credits: 4800,
    materialKey: "miningComponents",
    materialName: "Mining Components",
    parts: 2,
    description: "Several small Haven haulers want to turn part of the restored gantry district into a cooperative freight floor. Shared handling gear would let independent crews combine loads that none of them could efficiently stage alone.",
    consequence: "Haven's restored district develops around independent freight consolidation and larger cooperative loads.",
    contract: {
      id: "haven-coop-freight",
      title: "Cooperative Frontier Lot",
      destination: "prospect",
      reward: 1380,
      cargo: { food: 7 },
      rep: 1,
      text: "Haven's independent freight cooperative has combined several small consignments into one frontier lot for Prospect Reach."
    }
  },
  operatorYard: {
    id: "operatorYard",
    title: "Independent Operator Yard",
    credits: 4800,
    materialKey: "sensorComponents",
    materialName: "Sensor Components",
    parts: 2,
    description: "Mara can instead use the restored district as a practical service yard for independent operators: survey calibration, field preparation, and turnaround work for ships that do not belong to the large carriers.",
    consequence: "Haven's restored district develops around servicing and preparing independent frontier operators.",
    contract: {
      id: "haven-operator-support",
      title: "Frontier Support Dispatch",
      destination: "prospect",
      reward: 1180,
      cargo: { machineParts: 4 },
      rep: 1,
      text: "The new operator yard has prepared a compact support load for independent crews working out of Prospect Reach."
    }
  }
};

const HAVEN_FOLLOWUP_PROJECTS = {
  freightCooperative: {
    id: "regionalFreightOffice",
    title: "Regional Freight Office",
    credits: 6500,
    materialKey: "machineParts",
    materialName: "Power Couplings",
    parts: 2,
    description: "The cooperative floor is busy enough that Haven's small carriers are losing time coordinating loads by hand. Mara proposes converting an unused control room into a permanent regional freight office.",
    consequence: "The freight cooperative now coordinates larger frontier lots instead of merely combining local consignments.",
    contract: {
      id: "haven-regional-freight",
      title: "Regional Consolidated Lot",
      destination: "prospect",
      reward: 1720,
      cargo: { food: 8 },
      rep: 1,
      text: "Haven's regional freight office has consolidated a full frontier shipment from several independent suppliers for Prospect Reach."
    }
  },
  operatorYard: {
    id: "frontierSupportBay",
    title: "Frontier Support Bay",
    credits: 6500,
    materialKey: "sensorComponents",
    materialName: "Sensor Components",
    parts: 2,
    description: "The operator yard is drawing crews preparing for longer frontier work. Mara can dedicate another bay to sensor checks, expedition preparation, and support loads for ships heading beyond the core routes.",
    consequence: "The operator yard has grown into a recognized preparation point for independent frontier work.",
    contract: {
      id: "haven-frontier-support",
      title: "Expedition Support Run",
      destination: "prospect",
      reward: 1540,
      cargo: { medicine: 3, machineParts: 2 },
      rep: 1,
      text: "Haven's frontier support bay has assembled medical and mechanical supplies for independent crews staging through Prospect Reach."
    }
  }
};

function havenTrip() {
  return Number.isFinite(state.tripCount) ? state.tripCount : 0;
}

function ensureHavenProjectState() {
  if (!state.stationProjects || typeof state.stationProjects !== "object") state.stationProjects = {};
  if (!state.stationProjects.haven || typeof state.stationProjects.haven !== "object") state.stationProjects.haven = {};
  const haven = state.stationProjects.haven;
  if (!haven.oldGantry || typeof haven.oldGantry !== "object") haven.oldGantry = { completed: false, tripCompleted: null };
  haven.oldGantry.completed = haven.oldGantry.completed === true;
  if (!haven.development || typeof haven.development !== "object") {
    haven.development = { branch: null, branchTripCompleted: null, followupCompleted: false, followupTripCompleted: null };
  }
  const development = haven.development;
  if (!Object.prototype.hasOwnProperty.call(HAVEN_BRANCH_PROJECTS, development.branch)) development.branch = null;
  development.followupCompleted = development.followupCompleted === true;
  syncHavenProjectContracts();
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
  record.tripCompleted = havenTrip();
  if (state.npcs?.mara) {
    state.npcs.mara.relationship += 1;
    state.npcs.mara.memory.restoredOldGantry = true;
  }
  syncHavenProjectContracts();
  resetHavenContractBoard();
  addLog("HAVEN — With your funding and replacement couplings, Mara's crews bring the Old Gantry back into service. Independent haulers can once again stage larger freight lots through Haven.");
  saveState();
  render();
}

function havenBranchEligible() {
  ensureHavenProjectState();
  const haven = state.stationProjects.haven;
  const mara = state.npcs?.mara;
  const completedTrip = Number.isFinite(haven.oldGantry.tripCompleted) ? haven.oldGantry.tripCompleted : havenTrip();
  return Boolean(
    state.location === "haven" &&
    haven.oldGantry.completed &&
    !haven.development.branch &&
    mara?.met && mara.relationship >= 2 &&
    state.reputation >= 4 &&
    havenTrip() - completedTrip >= 3
  );
}

function havenFollowupEligible() {
  ensureHavenProjectState();
  const development = state.stationProjects.haven.development;
  const mara = state.npcs?.mara;
  if (!development.branch || development.followupCompleted) return false;
  const branchTrip = Number.isFinite(development.branchTripCompleted) ? development.branchTripCompleted : havenTrip();
  return Boolean(
    state.location === "haven" &&
    mara?.met && mara.relationship >= 3 &&
    state.reputation >= 6 &&
    havenTrip() - branchTrip >= 4
  );
}

function projectCanContribute(project) {
  return state.credits >= project.credits && (state.cargo[project.materialKey] || 0) >= project.parts;
}

function spendProjectContribution(project) {
  state.credits -= project.credits;
  state.cargo[project.materialKey] -= project.parts;
  if (state.cargo[project.materialKey] <= 0) delete state.cargo[project.materialKey];
}

function chooseHavenDevelopment(branchId) {
  ensureHavenProjectState();
  if (!havenBranchEligible()) return;
  const project = HAVEN_BRANCH_PROJECTS[branchId];
  if (!project) return;
  if (!projectCanContribute(project)) {
    addLog(`HAVEN — ${project.title} still needs ${credits(project.credits)} and ${project.parts} ${project.materialName} before Mara can put a crew on it.`);
    return render();
  }
  spendProjectContribution(project);
  const development = state.stationProjects.haven.development;
  development.branch = branchId;
  development.branchTripCompleted = havenTrip();
  if (state.npcs?.mara) {
    state.npcs.mara.relationship += 1;
    state.npcs.mara.memory.havenDevelopmentBranch = branchId;
  }
  syncHavenProjectContracts();
  resetHavenContractBoard();
  addLog(`HAVEN — You back the ${project.title}. ${project.consequence}`);
  saveState();
  render();
}

function completeHavenFollowup() {
  ensureHavenProjectState();
  if (!havenFollowupEligible()) return;
  const development = state.stationProjects.haven.development;
  const project = HAVEN_FOLLOWUP_PROJECTS[development.branch];
  if (!project) return;
  if (!projectCanContribute(project)) {
    addLog(`HAVEN — ${project.title} still needs ${credits(project.credits)} and ${project.parts} ${project.materialName} before the expansion can go ahead.`);
    return render();
  }
  spendProjectContribution(project);
  development.followupCompleted = true;
  development.followupTripCompleted = havenTrip();
  if (state.npcs?.mara) {
    state.npcs.mara.relationship += 1;
    state.npcs.mara.memory.havenDevelopmentFollowup = project.id;
  }
  syncHavenProjectContracts();
  resetHavenContractBoard();
  addLog(`HAVEN — You help complete the ${project.title}. ${project.consequence}`);
  saveState();
  render();
}

function resetHavenContractBoard() {
  if (state.contractVariety?.boards?.haven) delete state.contractVariety.boards.haven;
}

function setBoardContract(board, contract, shouldExist) {
  const index = board.findIndex(item => item.id === contract.id);
  if (shouldExist && index < 0) board.push({ ...contract, cargo: { ...contract.cargo } });
  if (!shouldExist && index >= 0 && state.activeContract?.id !== contract.id) board.splice(index, 1);
}

function syncHavenProjectContracts() {
  const haven = state.stationProjects?.haven;
  const board = GAME_DATA.systems.haven?.contracts;
  if (!haven || !Array.isArray(board)) return;
  setBoardContract(board, HAVEN_GANTRY_PROJECT.contract, haven.oldGantry?.completed === true);
  Object.entries(HAVEN_BRANCH_PROJECTS).forEach(([id, project]) => {
    setBoardContract(board, project.contract, haven.development?.branch === id);
  });
  Object.entries(HAVEN_FOLLOWUP_PROJECTS).forEach(([id, project]) => {
    setBoardContract(board, project.contract, haven.development?.branch === id && haven.development?.followupCompleted === true);
  });
}

function contributionLine(project) {
  const owned = state.cargo[project.materialKey] || 0;
  return `<p><strong>Contribution:</strong> ${credits(project.credits)} + ${project.parts} ${project.materialName}</p><p class="muted small">You currently have ${owned} ${project.materialName}. This changes what Haven becomes; it does not create passive income.</p>`;
}

function havenProjectCardsHtml() {
  ensureHavenProjectState();
  if (state.location !== "haven") return "";
  const haven = state.stationProjects.haven;
  const development = haven.development;

  if (!haven.oldGantry.completed) {
    if (!havenGantryProjectEligible()) return "";
    const haveParts = state.cargo.machineParts || 0;
    return `<article class="info-card haven-project-card"><p class="eyebrow">STATION PROJECT</p><h3>Restore the Old Gantry</h3><p>Mara has a practical proposal: reopen one of Haven's abandoned freight gantries for independent traffic. The structure is usable, but the yard needs replacement power couplings and enough cash to put a crew on it.</p><p><strong>Contribution:</strong> ${credits(HAVEN_GANTRY_PROJECT.credits)} + ${HAVEN_GANTRY_PROJECT.parts} Power Couplings</p><p class="muted small">You currently have ${haveParts} Power Coupling${haveParts === 1 ? "" : "s"}. This is a permanent station change, not an investment; it creates new work rather than passive income.</p><button class="primary" type="button" onclick="completeHavenGantryProject()" ${havenGantryCanContribute() ? "" : "disabled"}>Fund Restoration</button></article>`;
  }

  let html = `<article class="info-card haven-project-card"><p class="eyebrow">STATION PROJECT</p><h3>Old Gantry — Restored</h3><p>One of Haven's dormant freight gantries is operating again. Larger independent lots can now move through the old yards.</p><p class="muted small">Mara's crews still point out which sections were rebuilt with your contribution. New gantry freight work appears through the ordinary contract board.</p></article>`;

  if (havenBranchEligible()) {
    html += `<article class="info-card haven-project-card"><p class="eyebrow">HAVEN — A CHOICE OF DIRECTION</p><h3>The Restored District Is Growing</h3><p>The Old Gantry is working well enough that Mara says Haven now has a real choice about what to build around it. There is only enough local labor and usable space to back one of the two proposals.</p><p class="muted small">This choice is permanent. The other proposal will not remain available.</p></article>`;
    Object.values(HAVEN_BRANCH_PROJECTS).forEach(project => {
      html += `<article class="info-card haven-project-card"><h3>${project.title}</h3><p>${project.description}</p>${contributionLine(project)}<button class="primary" type="button" onclick="chooseHavenDevelopment('${project.id}')" ${projectCanContribute(project) ? "" : "disabled"}>Back This Project</button></article>`;
    });
    return html;
  }

  if (development.branch) {
    const branch = HAVEN_BRANCH_PROJECTS[development.branch];
    html += `<article class="info-card haven-project-card"><p class="eyebrow">HAVEN DEVELOPMENT</p><h3>${branch.title}</h3><p>${branch.consequence}</p><p class="muted small">This is the direction you chose for the restored gantry district. Its work now appears naturally through Haven's ordinary operations.</p></article>`;
  }

  if (havenFollowupEligible()) {
    const project = HAVEN_FOLLOWUP_PROJECTS[development.branch];
    html += `<article class="info-card haven-project-card"><p class="eyebrow">STATION PROJECT</p><h3>${project.title}</h3><p>${project.description}</p>${contributionLine(project)}<button class="primary" type="button" onclick="completeHavenFollowup()" ${projectCanContribute(project) ? "" : "disabled"}>Fund Expansion</button></article>`;
  } else if (development.followupCompleted) {
    const project = HAVEN_FOLLOWUP_PROJECTS[development.branch];
    html += `<article class="info-card haven-project-card"><p class="eyebrow">HAVEN DEVELOPMENT</p><h3>${project.title} — Operating</h3><p>${project.consequence}</p><p class="muted small">Haven visibly carries the consequences of the development path you chose.</p></article>`;
  }
  return html;
}

const renderOverviewBeforeHavenProject = renderOverview;
renderOverview = function renderOverviewWithHavenProject() {
  renderOverviewBeforeHavenProject();
  if (state.location !== "haven") return;
  const grid = view.querySelector(".card-grid");
  const html = havenProjectCardsHtml();
  if (grid && html) grid.insertAdjacentHTML("beforeend", html);
};

// Keep all project-created work inside the existing rotating contract board. Immediately after
// a project is completed, ensure its new work is visible once so the consequence is legible.
if (typeof chooseContractOffers === "function") {
  const chooseContractOffersBeforeHavenProject = chooseContractOffers;
  chooseContractOffers = function chooseContractOffersWithHavenProjects(systemId, pool) {
    const offers = chooseContractOffersBeforeHavenProject(systemId, pool);
    if (systemId !== "haven") return offers;
    ensureHavenProjectState();
    const haven = state.stationProjects.haven;
    const justAdded = [];
    if (haven.oldGantry.completed && havenTrip() === haven.oldGantry.tripCompleted) justAdded.push(HAVEN_GANTRY_PROJECT.contract.id);
    const branch = haven.development.branch;
    if (branch && havenTrip() === haven.development.branchTripCompleted) justAdded.push(HAVEN_BRANCH_PROJECTS[branch].contract.id);
    if (branch && haven.development.followupCompleted && havenTrip() === haven.development.followupTripCompleted) justAdded.push(HAVEN_FOLLOWUP_PROJECTS[branch].contract.id);
    const poolIds = pool.map(contract => contract.id);
    const projectId = justAdded.find(id => poolIds.includes(id));
    if (projectId && !offers.includes(projectId)) {
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

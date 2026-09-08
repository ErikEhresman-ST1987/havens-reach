// Haven's Reach — Smuggling Contracts #1
// Adds one disclosed restricted-cargo contract and two mutually exclusive cargo-signature dampeners.
// Reuses the existing contract board, cargo, customs encounter, ship upgrade, and save systems.

const SMUGGLING_CARGO_ID = "restrictedComponents";
const SMUGGLING_BASE_DETECTION = 0.45;
const SMUGGLING_FINE = 260;

GAME_DATA.commodities[SMUGGLING_CARGO_ID] = { name: "Sealed Restricted Components" };

const SMUGGLING_CONTRACT = {
  id: "meridian-restricted-components",
  title: "Restricted Components Transfer",
  destination: "prospect",
  reward: 560,
  cargo: { [SMUGGLING_CARGO_ID]: 1 },
  rep: 0,
  contractType: "smuggling",
  kindLabel: "Restricted Cargo / Smuggling",
  prohibitedAt: "prospect",
  detectionRisk: SMUGGLING_BASE_DETECTION,
  fine: SMUGGLING_FINE,
  text: "Carry a sealed package of restricted industrial components to a private buyer at Prospect Reach. The cargo is legal to possess at Meridian Exchange but prohibited at Prospect Reach. Customs detection will confiscate the cargo, fail the contract, and trigger a 260 cr fine."
};

if (!GAME_DATA.systems.meridian.contracts.some(c => c.id === SMUGGLING_CONTRACT.id)) {
  GAME_DATA.systems.meridian.contracts.push(SMUGGLING_CONTRACT);
}

const CARGO_DAMPENERS = [
  {
    id: "meridian-cargo-dampener",
    name: "Commercial Cargo Signature Dampener",
    cost: 950,
    location: "meridian",
    equipmentGroup: "cargoDampener",
    detectionReduction: 0.15,
    text: "Reduces contraband detection chance by 15 percentage points. Replaces any installed Cargo Signature Dampener.",
    apply: state => { state.ship.cargoDampener = "meridian-cargo-dampener"; }
  },
  {
    id: "redmesa-cargo-dampener",
    name: "Frontier Spectral Dampener",
    cost: 1450,
    location: "redMesa",
    equipmentGroup: "cargoDampener",
    detectionReduction: 0.25,
    text: "Reduces contraband detection chance by 25 percentage points. Replaces any installed Cargo Signature Dampener.",
    apply: state => { state.ship.cargoDampener = "redmesa-cargo-dampener"; }
  }
];

CARGO_DAMPENERS.forEach(upgrade => {
  if (!GAME_DATA.upgrades.some(item => item.id === upgrade.id)) GAME_DATA.upgrades.push(upgrade);
});

function isSmugglingContract(contract) {
  return Boolean(contract && contract.contractType === "smuggling");
}

function installedCargoDampener() {
  const installedId = state.ship.cargoDampener;
  return CARGO_DAMPENERS.find(item => item.id === installedId) || null;
}

function currentSmugglingDetectionChance() {
  const dampener = installedCargoDampener();
  const reduction = dampener?.detectionReduction || 0;
  return Math.max(0.05, SMUGGLING_BASE_DETECTION - reduction);
}

function hasActiveContrabandAtDestination() {
  const contract = state.activeContract;
  if (!isSmugglingContract(contract)) return false;
  if (state.location !== contract.prohibitedAt) return false;
  return (state.cargo[SMUGGLING_CARGO_ID] || 0) > 0;
}

function removeSmugglingCargo(contract = state.activeContract) {
  if (!contract) return;
  Object.entries(contract.cargo || {}).forEach(([id, qty]) => {
    state.cargo[id] = Math.max(0, (state.cargo[id] || 0) - qty);
    if (!state.cargo[id]) delete state.cargo[id];
  });
}

function failSmugglingContract(reason) {
  const contract = state.activeContract;
  if (!isSmugglingContract(contract)) return;
  removeSmugglingCargo(contract);
  const fine = Math.min(contract.fine || SMUGGLING_FINE, state.credits);
  state.credits -= fine;
  addLog(`${reason} The restricted cargo was confiscated, the contract failed, and customs imposed a ${credits(fine)} fine.`);
  state.activeContract = null;
  saveState();
}

function completeSmugglingHandoff() {
  const contract = state.activeContract;
  if (!isSmugglingContract(contract) || state.location !== contract.destination) return;

  const required = contract.cargo?.[SMUGGLING_CARGO_ID] || 0;
  if ((state.cargo[SMUGGLING_CARGO_ID] || 0) < required) {
    addLog(`${contract.title} failed: the restricted cargo is no longer aboard.`);
    state.activeContract = null;
    return render();
  }

  removeSmugglingCargo(contract);
  const bonusRate = state.ship.contractBonus || 0;
  const bonus = Math.round(contract.reward * bonusRate);
  const totalReward = contract.reward + bonus;
  state.credits += totalReward;
  if (!state.completedContracts.includes(contract.id)) state.completedContracts.push(contract.id);
  const bonusText = bonus > 0 ? ` including a ${credits(bonus)} broker bonus` : "";
  addLog(`Restricted cargo delivered successfully. Earned ${credits(totalReward)}${bonusText}.`);
  state.activeContract = null;
  render();
}

const acceptContractBeforeSmuggling = acceptContract;
acceptContract = function acceptContractWithSmuggling(id) {
  const contract = findContract(id);
  if (!isSmugglingContract(contract)) return acceptContractBeforeSmuggling(id);
  if (state.activeContract) return;

  const cargoNeeded = Object.values(contract.cargo || {}).reduce((sum, qty) => sum + qty, 0);
  if (cargoUsed() + cargoNeeded > state.ship.cargoCapacity) {
    addLog("Not enough cargo space to accept that restricted-cargo contract.");
    return render();
  }

  Object.entries(contract.cargo || {}).forEach(([cargoId, qty]) => {
    state.cargo[cargoId] = (state.cargo[cargoId] || 0) + qty;
  });
  state.activeContract = { ...contract, smugglingReady: false };
  addLog(`Accepted restricted-cargo contract: ${contract.title}. The cargo is prohibited at ${GAME_DATA.systems[contract.destination].name}; customs detection will confiscate it and trigger a fine.`);
  render();
};

const completeContractBeforeSmuggling = completeContractIfPossible;
completeContractIfPossible = function completeContractWithSmuggling() {
  const contract = state.activeContract;
  if (!isSmugglingContract(contract)) return completeContractBeforeSmuggling();
  if (contract.destination !== state.location) return;
  if (!contract.smugglingReady) {
    contract.smugglingReady = true;
    addLog(`${contract.title}: you reached ${GAME_DATA.systems[contract.destination].name} with the restricted cargo still aboard. Open Contracts when ready to make the handoff.`);
  }
};

function customsActionActuallyScans(action) {
  if (["customsComply", "customsExpedite", "customsSpotCheck", "complyInspection", "expediteInspection"].includes(action)) return true;
  if (action === "customsCourtesy") return state.reputation < 4;
  return false;
}

const resolveEncounterBeforeSmuggling = resolveEncounter;
resolveEncounter = function resolveEncounterWithSmuggling(action) {
  if (hasActiveContrabandAtDestination() && customsActionActuallyScans(action)) {
    const chance = currentSmugglingDetectionChance();
    if (Math.random() < chance) {
      const dampener = installedCargoDampener();
      const detail = dampener
        ? `${dampener.name} reduced the scan risk, but the cargo signature was still detected.`
        : "The customs scan detected an undeclared restricted cargo signature.";
      failSmugglingContract(detail);
      el("encounterDialog").close();
      return render();
    }
    addLog(`Customs scanned the hold but did not identify the restricted cargo. Detection risk on this scan was ${Math.round(chance * 100)}%.`);
  }
  resolveEncounterBeforeSmuggling(action);
};

const renderContractsBeforeSmuggling = renderContracts;
renderContracts = function renderContractsWithSmuggling() {
  renderContractsBeforeSmuggling();

  view.querySelectorAll('.contract-row').forEach(row => {
    const button = row.querySelector('button[onclick*="acceptContract"]');
    if (!button) return;
    const match = button.getAttribute('onclick')?.match(/acceptContract\('([^']+)'\)/);
    const contract = match ? findContract(match[1]) : null;
    if (!isSmugglingContract(contract)) return;

    const first = row.querySelector('div');
    if (first) {
      const chance = Math.round((contract.detectionRisk || SMUGGLING_BASE_DETECTION) * 100);
      first.insertAdjacentHTML('afterbegin', `<div class="eyebrow" style="margin-bottom:4px">${escapeHtml(contract.kindLabel)}</div>`);
      first.insertAdjacentHTML('beforeend', `<div class="warn small" style="margin-top:5px">Illegal at destination • Base scan detection ${chance}% • Detection: cargo confiscated, contract failed, ${escapeHtml(credits(contract.fine || SMUGGLING_FINE))} fine</div>`);
    }
  });

  const active = state.activeContract;
  if (!isSmugglingContract(active)) return;

  const heading = view.querySelector('.section-heading');
  if (!heading) return;
  const atDestination = active.destination === state.location;
  const cargoAboard = (state.cargo[SMUGGLING_CARGO_ID] || 0) >= (active.cargo?.[SMUGGLING_CARGO_ID] || 0);
  const dampener = installedCargoDampener();
  const effectiveRisk = Math.round(currentSmugglingDetectionChance() * 100);
  const card = document.createElement('article');
  card.className = 'info-card';
  card.style.marginBottom = '16px';
  card.innerHTML = `
    <p class="eyebrow">Restricted Cargo / Smuggling</p>
    <h3>Active Smuggling Contract</h3>
    <p>${escapeHtml(active.text)}</p>
    <p class="muted small">Current scan detection risk: ${effectiveRisk}%${dampener ? ` with ${escapeHtml(dampener.name)}` : " without a dampener"}.</p>
    ${atDestination && cargoAboard
      ? `<p class="good">You are at the destination with the cargo aboard. Make the handoff when ready.</p><button class="primary" onclick="completeSmugglingHandoff()">Deliver Restricted Cargo</button>`
      : atDestination
        ? `<p class="warn">The restricted cargo is missing. This contract cannot be completed.</p><button class="secondary" onclick="completeSmugglingHandoff()">Close Failed Contract</button>`
        : `<p class="muted small">Travel to ${escapeHtml(GAME_DATA.systems[active.destination].name)}. The cargo remains aboard until you complete the handoff.</p>`}
  `;
  heading.insertAdjacentElement('afterend', card);
};

const buyUpgradeBeforeSmuggling = buyUpgrade;
buyUpgrade = function buyUpgradeWithCargoDampener(id) {
  const upgrade = GAME_DATA.upgrades.find(item => item.id === id);
  if (!upgrade || upgrade.equipmentGroup !== "cargoDampener") return buyUpgradeBeforeSmuggling(id);
  if (state.upgrades.includes(id) || state.credits < upgrade.cost) return;
  if (upgrade.location && upgrade.location !== state.location) {
    addLog(`${upgrade.name} can only be installed at ${GAME_DATA.systems[upgrade.location].name}.`);
    return render();
  }

  const existing = installedCargoDampener();
  if (existing && existing.id !== upgrade.id) {
    const ok = confirm(`Installing ${upgrade.name} will replace your current ${existing.name}. Continue?`);
    if (!ok) return;
    state.upgrades = state.upgrades.filter(upgradeId => upgradeId !== existing.id);
  }

  state.credits -= upgrade.cost;
  upgrade.apply(state);
  if (!state.upgrades.includes(upgrade.id)) state.upgrades.push(upgrade.id);
  addLog(`Installed ${upgrade.name} at ${GAME_DATA.systems[state.location].name}. Cargo Signature Dampeners do not stack.`);
  render();
};

const renderShipBeforeSmuggling = renderShip;
renderShip = function renderShipWithCargoDampener() {
  renderShipBeforeSmuggling();
  const dampener = installedCargoDampener();
  if (!dampener) return;
  const systemsCard = Array.from(view.querySelectorAll('.info-card')).find(card => card.querySelector('h3')?.textContent === 'Systems');
  if (systemsCard) {
    systemsCard.insertAdjacentHTML('beforeend', `<p>Cargo dampener: ${escapeHtml(dampener.name)} • Contraband detection ${Math.round(currentSmugglingDetectionChance() * 100)}%</p>`);
  }
};

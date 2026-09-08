// Haven's Reach — Ship Chassis & Capacity #1
// Adds chassis identity, finite upgrade capacity, per-ship fitted equipment, equipment storage,
// safe legacy-save migration, and one purchasable industrial hauler. Navigation remains out of scope.

const SHIP_SYSTEM_VERSION = 1;

const SHIP_CHASSIS = {
  wayfarer: {
    id: "wayfarer",
    name: "Wayfarer",
    type: "Utility Transport",
    role: "Inexpensive, versatile starter transport",
    strength: "Easy to understand and adapt",
    limitation: "Low base capability and limited equipment capacity",
    attractiveWork: "General freight, light trade, courier work, and early frontier jobs",
    base: { cargoCapacity: 8, hullStrength: 2, shield: 40, engine: 1, sensors: 1, fuelCapacity: 80, upgradeCapacity: 5 }
  },
  h9BulkHauler: {
    id: "h9BulkHauler",
    name: "H-9 Bulk Hauler",
    type: "Industrial Freighter",
    role: "Kharok-designed bulk freight and frontier work chassis",
    strength: "Large hold, strong structure, and long operating range",
    limitation: "Low agility and no intrinsic survey advantage",
    attractiveWork: "Commodity hauling, mining, cargo-heavy contracts, and rugged freight work",
    price: 5500,
    location: "redMesa",
    base: { cargoCapacity: 14, hullStrength: 4, shield: 40, engine: 1, sensors: 1, fuelCapacity: 100, upgradeCapacity: 6 }
  }
};

const EQUIPMENT_RULES = {
  cargo: { capacity: 2, stackable: true, effect: { cargoCapacity: 4 }, action: "Stack" },
  fuel: { capacity: 1, effect: { fuelCapacity: 20 }, action: "Add" },
  engines: { capacity: 1, effect: { engine: 1 }, action: "Add" },
  sensors: { capacity: 1, effect: { sensors: 1 }, action: "Add" },
  "haven-bracing": { capacity: 1, effect: { cargoCapacity: 3 }, action: "Add" },
  "meridian-broker": { capacity: 1, effect: { contractBonus: 0.10 }, action: "Add" },
  "prospect-sensors": { capacity: 2, effect: { sensors: 2 }, action: "Add" },
  "calder-nav-suite": { capacity: 2, effect: { sensors: 1, fuelCapacity: 10 }, action: "Add" },
  "mesa-industrial-rigging": { capacity: 2, effect: { cargoCapacity: 5 }, action: "Add" },
  "pelagos-deep-survey": { capacity: 2, effect: { sensors: 3 }, action: "Add" },
  "meridian-cargo-dampener": { capacity: 1, group: "cargoDampener", action: "Replace" },
  "redmesa-cargo-dampener": { capacity: 1, group: "cargoDampener", action: "Replace" }
};

function equipmentRule(id) { return EQUIPMENT_RULES[id] || { capacity: 1, action: "Add" }; }
function cloneShipRecord(ship) { return JSON.parse(JSON.stringify(ship)); }
function chassisFor(ship = state.ship) { return SHIP_CHASSIS[ship?.chassisId] || SHIP_CHASSIS.wayfarer; }
function blankShipFromChassis(chassisId) {
  const chassis = SHIP_CHASSIS[chassisId] || SHIP_CHASSIS.wayfarer;
  return { chassisId: chassis.id, name: chassis.name, hull: 100, fuel: chassis.base.fuelCapacity, equipment: {}, legacyAdjustments: {} };
}
function equipmentCount(ship, id) { return Math.max(0, Number(ship?.equipment?.[id] || 0)); }
function installedEquipmentEntries(ship = state.ship) { return Object.entries(ship?.equipment || {}).filter(([, qty]) => qty > 0); }
function capacityUsed(ship = state.ship) { return installedEquipmentEntries(ship).reduce((sum, [id, qty]) => sum + equipmentRule(id).capacity * qty, 0); }
function capacityLimit(ship = state.ship) { return chassisFor(ship).base.upgradeCapacity; }
function findInstalledGroupMember(group, ship = state.ship) { return installedEquipmentEntries(ship).find(([id]) => equipmentRule(id).group === group)?.[0] || null; }
function syncLegacyUpgradeList() { state.upgrades = installedEquipmentEntries(state.ship).map(([id]) => id); }

function deriveShipStats(ship = state.ship) {
  const chassis = chassisFor(ship);
  const stats = {
    cargoCapacity: chassis.base.cargoCapacity,
    hullStrength: chassis.base.hullStrength,
    shield: chassis.base.shield,
    engine: chassis.base.engine,
    sensors: chassis.base.sensors,
    fuelCapacity: chassis.base.fuelCapacity,
    upgradeCapacity: chassis.base.upgradeCapacity,
    contractBonus: 0,
    cargoDampener: null
  };
  installedEquipmentEntries(ship).forEach(([id, qty]) => {
    const rule = equipmentRule(id);
    Object.entries(rule.effect || {}).forEach(([key, amount]) => { stats[key] = (stats[key] || 0) + amount * qty; });
    if (rule.group === "cargoDampener") stats.cargoDampener = id;
  });
  Object.entries(ship.legacyAdjustments || {}).forEach(([key, amount]) => {
    if (Number.isFinite(amount) && amount > 0) stats[key] = (stats[key] || 0) + amount;
  });
  return stats;
}

function recalculateShipStats(ship = state.ship, preserveFuel = true) {
  const oldFuel = Number.isFinite(ship.fuel) ? ship.fuel : 0;
  Object.assign(ship, deriveShipStats(ship));
  ship.fuel = preserveFuel ? Math.min(oldFuel, ship.fuelCapacity) : ship.fuelCapacity;
  if (ship === state.ship) syncLegacyUpgradeList();
}

function inferLegacyAdjustments(oldShip, equipment) {
  const expected = deriveShipStats({ chassisId: "wayfarer", equipment: { ...equipment }, legacyAdjustments: {}, fuel: oldShip.fuel || 0 });
  const adjustments = {};
  ["cargoCapacity", "shield", "engine", "sensors", "fuelCapacity", "contractBonus"].forEach(key => {
    const oldValue = Number(oldShip[key] || 0);
    const expectedValue = Number(expected[key] || 0);
    if (oldValue > expectedValue) adjustments[key] = oldValue - expectedValue;
  });
  return adjustments;
}

function migrateLegacyShipSystem() {
  const oldShip = { ...(state.ship || {}) };
  const equipment = {};
  (Array.isArray(state.upgrades) ? state.upgrades : []).forEach(id => { equipment[id] = (equipment[id] || 0) + 1; });
  state.ship = {
    chassisId: "wayfarer",
    name: oldShip.name || "Wayfarer",
    hull: Number.isFinite(oldShip.hull) ? oldShip.hull : 100,
    fuel: Number.isFinite(oldShip.fuel) ? oldShip.fuel : 80,
    equipment,
    legacyAdjustments: inferLegacyAdjustments(oldShip, equipment)
  };
  state.hangar = { version: SHIP_SYSTEM_VERSION, ships: [], equipmentStorage: {} };
  recalculateShipStats(state.ship, true);
}

function ensureShipSystemState() {
  if (!state.ship?.chassisId || !state.ship?.equipment) migrateLegacyShipSystem();
  if (!state.hangar || typeof state.hangar !== "object") state.hangar = { version: SHIP_SYSTEM_VERSION, ships: [], equipmentStorage: {} };
  if (!Array.isArray(state.hangar.ships)) state.hangar.ships = [];
  if (!state.hangar.equipmentStorage || typeof state.hangar.equipmentStorage !== "object") state.hangar.equipmentStorage = {};
  state.hangar.version = SHIP_SYSTEM_VERSION;
  if (!state.ship.legacyAdjustments) state.ship.legacyAdjustments = {};
  recalculateShipStats(state.ship, true);
}

function hullDamageAmount(rawDamage, ship = state.ship) {
  const strength = Number(ship.hullStrength || chassisFor(ship).base.hullStrength || 2);
  const multiplier = strength >= 5 ? 0.65 : strength === 4 ? 0.75 : strength === 3 ? 0.9 : strength <= 1 ? 1.15 : 1;
  return Math.max(1, Math.round(rawDamage * multiplier));
}
function applyHullDamage(rawDamage) {
  ensureShipSystemState();
  const actual = hullDamageAmount(rawDamage);
  state.ship.hull = Math.max(1, state.ship.hull - actual);
  return actual;
}

function storageCount(id) { return Math.max(0, Number(state.hangar.equipmentStorage[id] || 0)); }
function addToStorage(id, qty = 1) { state.hangar.equipmentStorage[id] = storageCount(id) + qty; }
function takeFromStorage(id, qty = 1) {
  const remaining = storageCount(id) - qty;
  if (remaining > 0) state.hangar.equipmentStorage[id] = remaining;
  else delete state.hangar.equipmentStorage[id];
}

function projectedCapacityAfterInstall(id) {
  const rule = equipmentRule(id);
  const existingGroupId = rule.group ? findInstalledGroupMember(rule.group) : null;
  let used = capacityUsed();
  if (existingGroupId && existingGroupId !== id) used -= equipmentRule(existingGroupId).capacity * equipmentCount(state.ship, existingGroupId);
  if (!rule.stackable && equipmentCount(state.ship, id) > 0) return used;
  return used + rule.capacity;
}
function canIncreaseCapacityUse(id) {
  const current = capacityUsed();
  const projected = projectedCapacityAfterInstall(id);
  const limit = capacityLimit();
  return current > limit ? projected <= current : projected <= limit;
}

function installEquipment(id, fromStorage = false) {
  ensureShipSystemState();
  const upgrade = GAME_DATA.upgrades.find(item => item.id === id);
  if (!upgrade) return;
  const rule = equipmentRule(id);
  if (!rule.stackable && !rule.group && equipmentCount(state.ship, id) > 0) return;
  if (!canIncreaseCapacityUse(id)) { addLog(`Not enough equipment capacity for ${upgrade.name}.`); return render(); }

  const existingGroupId = rule.group ? findInstalledGroupMember(rule.group) : null;
  if (existingGroupId && existingGroupId !== id) {
    const existingUpgrade = GAME_DATA.upgrades.find(item => item.id === existingGroupId);
    if (!confirm(`Installing ${upgrade.name} will replace your current ${existingUpgrade?.name || "equipment"}. The removed unit will go into storage. Continue?`)) return;
    addToStorage(existingGroupId, equipmentCount(state.ship, existingGroupId));
    delete state.ship.equipment[existingGroupId];
  }

  const beforeFuelCapacity = state.ship.fuelCapacity;
  state.ship.equipment[id] = equipmentCount(state.ship, id) + 1;
  if (fromStorage) takeFromStorage(id, 1);
  recalculateShipStats(state.ship, true);
  if (state.ship.fuelCapacity > beforeFuelCapacity) state.ship.fuel = Math.min(state.ship.fuelCapacity, state.ship.fuel + state.ship.fuelCapacity - beforeFuelCapacity);
  addLog(`${fromStorage ? "Installed stored" : "Installed"} ${upgrade.name} on ${state.ship.name}. Equipment capacity: ${capacityUsed()}/${capacityLimit()}.`);
  render();
}

function buyUpgradeWithCapacity(id) {
  ensureShipSystemState();
  const upgrade = GAME_DATA.upgrades.find(item => item.id === id);
  if (!upgrade || state.credits < upgrade.cost) return;
  if (upgrade.location && upgrade.location !== state.location) { addLog(`${upgrade.name} can only be installed at ${GAME_DATA.systems[upgrade.location].name}.`); return render(); }
  const rule = equipmentRule(id);
  if (!rule.stackable && !rule.group && equipmentCount(state.ship, id) > 0) return;
  if (!canIncreaseCapacityUse(id)) { addLog(`Not enough equipment capacity for ${upgrade.name}.`); return render(); }
  state.credits -= upgrade.cost;
  installEquipment(id, false);
}

function projectedCargoAfterRemoval(id) {
  const temp = cloneShipRecord(state.ship);
  temp.equipment[id] = Math.max(0, equipmentCount(temp, id) - 1);
  if (!temp.equipment[id]) delete temp.equipment[id];
  return deriveShipStats(temp).cargoCapacity;
}
function removeEquipment(id) {
  ensureShipSystemState();
  if (equipmentCount(state.ship, id) <= 0) return;
  const newCargoCapacity = projectedCargoAfterRemoval(id);
  if (cargoUsed() > newCargoCapacity) { addLog(`Cannot remove that equipment while ${cargoUsed()} cargo spaces are occupied; the resulting hold would only have ${newCargoCapacity}.`); return render(); }
  state.ship.equipment[id] -= 1;
  if (state.ship.equipment[id] <= 0) delete state.ship.equipment[id];
  addToStorage(id, 1);
  recalculateShipStats(state.ship, true);
  const upgrade = GAME_DATA.upgrades.find(item => item.id === id);
  addLog(`Removed ${upgrade?.name || id} from ${state.ship.name} and placed it in storage.`);
  render();
}
function installStoredEquipment(id) { if (storageCount(id) > 0) installEquipment(id, true); }

function shipCanTakeCurrentCargo(ship) { return cargoUsed() <= deriveShipStats(ship).cargoCapacity; }
function switchToHangarShip(index) {
  ensureShipSystemState();
  if (state.activeContract) { addLog("Finish the active contract before changing ships."); return render(); }
  const target = state.hangar.ships[index];
  if (!target || !shipCanTakeCurrentCargo(target)) { addLog("That ship does not have enough cargo capacity for the cargo currently aboard."); return render(); }
  const current = cloneShipRecord(state.ship);
  state.ship = cloneShipRecord(target);
  state.hangar.ships.splice(index, 1, current);
  recalculateShipStats(state.ship, true);
  addLog(`Changed ships. ${state.ship.name} is now active.`);
  render();
}

function buyBulkHauler() {
  ensureShipSystemState();
  const chassis = SHIP_CHASSIS.h9BulkHauler;
  if (state.location !== chassis.location || state.credits < chassis.price) return;
  if (state.activeContract) { addLog("Finish the active contract before taking delivery of another ship."); return render(); }
  const newShip = blankShipFromChassis(chassis.id);
  recalculateShipStats(newShip, false);
  if (!shipCanTakeCurrentCargo(newShip)) { addLog("The new ship cannot take the cargo currently aboard."); return render(); }
  state.credits -= chassis.price;
  state.hangar.ships.push(cloneShipRecord(state.ship));
  state.ship = newShip;
  recalculateShipStats(state.ship, false);
  addLog(`Purchased the ${chassis.name} at Red Mesa Junction. The Wayfarer was placed in the local hangar.`);
  render();
}

function equipmentActionLabel(id) {
  const rule = equipmentRule(id);
  if (rule.group) return equipmentCount(state.ship, id) ? "Installed" : findInstalledGroupMember(rule.group) ? "Replace" : "Install";
  if (rule.stackable && equipmentCount(state.ship, id) > 0) return "Add Another";
  return "Install";
}

function renderChassisShipManagement() {
  ensureShipSystemState();
  const chassis = chassisFor();
  const cargoHtml = Object.keys(state.cargo).length
    ? Object.entries(state.cargo).map(([id, qty]) => `<div class="cargo-item"><span>${escapeHtml(GAME_DATA.commodities[id]?.name || id)}</span><strong>${qty}</strong></div>`).join("")
    : `<p class="muted">Cargo bay is empty.</p>`;

  const visibleUpgrades = GAME_DATA.upgrades.filter(upgrade => !upgrade.location || upgrade.location === state.location || equipmentCount(state.ship, upgrade.id) > 0 || storageCount(upgrade.id) > 0);
  const upgradeRows = visibleUpgrades.map(upgrade => {
    const qty = equipmentCount(state.ship, upgrade.id);
    const rule = equipmentRule(upgrade.id);
    const blockedByCapacity = !canIncreaseCapacityUse(upgrade.id);
    const alreadyFixed = qty > 0 && !rule.stackable && !rule.group;
    const sameGrouped = qty > 0 && rule.group;
    const specialty = upgrade.location ? `Specialty fitting: ${GAME_DATA.systems[upgrade.location].name}` : "Standard fitting";
    return `<div class="upgrade-row">
      <div><strong>${escapeHtml(upgrade.name)}</strong><div class="muted small">${escapeHtml(upgrade.text)}</div><div class="muted small">${escapeHtml(specialty)} • Capacity ${rule.capacity}${rule.stackable ? " each • Stackable" : rule.group ? " • Replaces same-category equipment" : ""}</div></div>
      <div>${credits(upgrade.cost)}</div>
      <div>${qty ? `Installed${qty > 1 ? ` ×${qty}` : ""}` : `Uses ${rule.capacity}`}</div>
      <button class="primary" onclick="buyUpgrade('${upgrade.id}')" ${(alreadyFixed || sameGrouped || blockedByCapacity || state.credits < upgrade.cost) ? "disabled" : ""}>${alreadyFixed || sameGrouped ? "Installed" : blockedByCapacity ? "Capacity Full" : equipmentActionLabel(upgrade.id)}</button>
      ${qty ? `<button class="secondary" onclick="removeEquipment('${upgrade.id}')">Remove</button>` : ""}
    </div>`;
  }).join("");

  const storedRows = Object.entries(state.hangar.equipmentStorage).filter(([, qty]) => qty > 0).map(([id, qty]) => {
    const upgrade = GAME_DATA.upgrades.find(item => item.id === id);
    if (!upgrade) return "";
    return `<div class="upgrade-row"><div><strong>${escapeHtml(upgrade.name)}</strong><div class="muted small">Stored units: ${qty}</div></div><div>Owned</div><div>Capacity ${equipmentRule(id).capacity}</div><button class="secondary" onclick="installStoredEquipment('${id}')" ${canIncreaseCapacityUse(id) ? "" : "disabled"}>Install</button></div>`;
  }).join("");

  const hangarRows = state.hangar.ships.map((ship, index) => {
    const otherChassis = chassisFor(ship);
    const stats = deriveShipStats(ship);
    return `<article class="info-card"><h3>${escapeHtml(ship.name)}</h3><p class="muted small">${escapeHtml(otherChassis.type)} • Cargo ${stats.cargoCapacity} • Hull Strength ${stats.hullStrength} • Engine ${stats.engine} • Sensors ${stats.sensors} • Fuel ${ship.fuel}/${stats.fuelCapacity}</p><button class="secondary" onclick="switchToHangarShip(${index})" ${state.activeContract || cargoUsed() > stats.cargoCapacity ? "disabled" : ""}>Make Active</button></article>`;
  }).join("");

  const bulk = SHIP_CHASSIS.h9BulkHauler;
  const alreadyOwnBulk = state.ship.chassisId === bulk.id || state.hangar.ships.some(ship => ship.chassisId === bulk.id);
  const shipyard = state.location === bulk.location ? `<article class="info-card" style="margin-top:16px"><p class="eyebrow">RED MESA SHIPYARD</p><h3>${escapeHtml(bulk.name)}</h3><p><strong>${escapeHtml(bulk.role)}</strong></p><p class="muted small">Built to do: bulk freight and frontier work.<br>Unusually good at: cargo, structure, and range.<br>Work around: low agility and basic sensors.<br>Attractive work: hauling, mining, cargo-heavy contracts.</p><p>Cargo 14 • Hull Strength 4 • Shield 40 • Engine 1 • Sensors 1 • Fuel 100 • Equipment Capacity 6</p><button class="primary" onclick="buyBulkHauler()" ${(alreadyOwnBulk || state.credits < bulk.price || state.activeContract) ? "disabled" : ""}>${alreadyOwnBulk ? "Owned" : state.activeContract ? "Finish Contract First" : `Buy — ${credits(bulk.price)}`}</button></article>` : "";

  const used = capacityUsed();
  const limit = capacityLimit();
  const legacy = used > limit ? `<p class="warn small">Legacy fitting: ${used}/${limit}. Existing equipment remains operational, but new equipment cannot increase capacity use until enough space is freed or another chassis is used.</p>` : "";
  const repair = typeof hullRepairQuote === "function" ? (() => {
    const quote = hullRepairQuote();
    if (quote.missing === 0) return `<article class="info-card"><h3>Port Yard</h3><p><strong>Hull integrity: 100%</strong></p><p class="muted small">No structural repairs are needed.</p></article>`;
    if (quote.affordable === 0) return `<article class="info-card"><h3>Port Yard</h3><p><strong>Hull integrity: ${state.ship.hull}%</strong></p><p class="muted small">Repairs cost ${credits(HULL_REPAIR_COST_PER_POINT)} per 1% hull. Full repair: ${credits(quote.fullCost)}.</p><button class="primary" disabled>Insufficient Credits</button></article>`;
    const fullRepair = quote.affordable === quote.missing;
    return `<article class="info-card"><h3>Port Yard</h3><p><strong>Hull integrity: ${state.ship.hull}%</strong></p><p class="muted small">Repairs cost ${credits(HULL_REPAIR_COST_PER_POINT)} per 1% hull. Full repair: ${credits(quote.fullCost)}.</p><button class="primary" onclick="repairHull()">${fullRepair ? `Repair Hull — ${credits(quote.repairCost)}` : `Repair ${quote.affordable}% — ${credits(quote.repairCost)}`}</button></article>`;
  })() : "";
  const dampener = typeof installedCargoDampener === "function" ? installedCargoDampener() : null;
  const dampenerLine = dampener && typeof currentSmugglingDetectionChance === "function" ? `<p>Cargo dampener: ${escapeHtml(dampener.name)} • Contraband detection ${Math.round(currentSmugglingDetectionChance() * 100)}%</p>` : "";

  view.innerHTML = `
    <div class="section-heading"><div><p class="eyebrow">SHIP MANAGEMENT</p><h2>${escapeHtml(state.ship.name)}</h2></div><span class="muted small">Workshop: ${escapeHtml(GAME_DATA.systems[state.location].name)}</span></div>
    <div class="card-grid">
      <article class="info-card"><h3>Chassis</h3><p><strong>${escapeHtml(chassis.type)}</strong></p><p class="muted small">${escapeHtml(chassis.role)}</p><p>Cargo ${state.ship.cargoCapacity} • Hull Strength ${state.ship.hullStrength} • Shield ${state.ship.shield}</p><p>Engine ${state.ship.engine} • Sensors ${state.ship.sensors} • Fuel ${state.ship.fuel}/${state.ship.fuelCapacity}</p>${state.ship.contractBonus ? `<p>Contract payout bonus ${Math.round(state.ship.contractBonus * 100)}%</p>` : ""}${dampenerLine}</article>
      <article class="info-card"><h3>Cargo</h3><div class="cargo-list">${cargoHtml}</div></article>
      <article class="info-card"><h3>Equipment Capacity</h3><p><strong>${used} / ${limit}</strong> capacity used</p><progress value="${Math.min(used, limit)}" max="${limit}"></progress>${legacy}<p class="muted small">Ordinary fittings use capacity. Powerful fittings may use 2. Stackable equipment consumes capacity each time.</p></article>
      ${repair}
    </div>
    <h3 style="margin-top:18px">Installed & Available Equipment</h3><p class="muted small">Equipment is fitted to the active ship. Removed or replaced equipment goes into storage instead of being lost.</p>${upgradeRows}
    ${storedRows ? `<h3 style="margin-top:18px">Equipment Storage</h3>${storedRows}` : ""}
    ${state.hangar.ships.length ? `<h3 style="margin-top:18px">Owned Ships</h3><div class="card-grid">${hangarRows}</div>` : ""}
    ${shipyard}`;
}

const renderStatusBeforeShipChassis = renderStatus;
renderStatus = function renderStatusWithShipChassis() {
  ensureShipSystemState();
  renderStatusBeforeShipChassis();
  const chassis = chassisFor();
  el("shipDetails").textContent = `${chassis.type} • Hull Strength ${state.ship.hullStrength} • Engine ${state.ship.engine} • Sensors ${state.ship.sensors}`;
};

// Make the mining mission text chassis-neutral once multiple vessels exist.
const performOperatorMissionBeforeShipChassis = performOperatorMission;
performOperatorMission = function performOperatorMissionWithChassis() {
  const contract = state.activeContract;
  if (isOperatorMission(contract) && contract.kind === "mining" && contract.destination === state.location && contract.missionReady) {
    if ((state.ship.cargoCapacity - cargoUsed()) < 2) { addLog("The extraction shift needs two free cargo spaces for recovered ore."); return render(); }
    return openMissionChoice(
      "Independent Extraction Shift",
      `The cooperative has assigned you a stable ore seam. A denser pocket is also reachable, but working it will put more strain on ${state.ship.name}'s structure.`,
      [
        { label: "Work the stable seam", action: "missionMiningStable" },
        { label: "Push into the dense pocket", action: "missionMiningDense" }
      ]
    );
  }
  return performOperatorMissionBeforeShipChassis();
};

// Hull Strength modifies physical damage while preserving the established encounter choices.
const resolveEncounterBeforeShipChassis = resolveEncounter;
resolveEncounter = function resolveEncounterWithShipChassis(action) {
  function closeAndRender() {
    if (typeof activeRichEncounter !== "undefined") activeRichEncounter = null;
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
  }

  if (action === "pirateRun") {
    const chance = Math.min(0.9, 0.42 + state.ship.engine * 0.13);
    if (Math.random() < chance) addLog("Your engines carried you clear before the pirate could match the burn.");
    else { const damage = applyHullDamage(10); addLog(`You escaped, but the hard maneuver cost ${damage}% hull integrity.`); }
    return closeAndRender();
  }
  if (action === "pirateHardBurn") {
    const chance = Math.min(0.92, 0.38 + state.ship.engine * 0.15);
    if (Math.random() < chance) addLog(`${state.ship.name} surged ahead and left the pirate behind.`);
    else { const damage = applyHullDamage(14); addLog(`You got away, but the hard burn and evasive maneuvering cost ${damage}% hull integrity.`); }
    return closeAndRender();
  }
  if (action === "distressTow") {
    const chance = Math.min(0.9, 0.35 + state.ship.engine * 0.14);
    if (Math.random() < chance) {
      const reward = 160 + state.ship.engine * 20;
      state.credits += reward; state.reputation += 1;
      addLog(`The tow succeeded. The freighter captain transferred ${credits(reward)} in thanks.`);
    } else { const damage = applyHullDamage(6); addLog(`The tow line parted under load. No one was hurt, but the maneuver cost ${damage}% hull integrity.`); }
    return closeAndRender();
  }
  if (action === "distressApproachBeacon") {
    if (Math.random() < 0.55) { state.credits += 110; addLog("The beacon belonged to an abandoned courier. You recovered 110 cr worth of usable equipment."); }
    else { const damage = applyHullDamage(7); addLog(`The vessel was tumbling unpredictably. You withdrew safely, but a collision with debris cost ${damage}% hull integrity.`); }
    return closeAndRender();
  }
  if (action === "failurePush") {
    const damage = applyHullDamage(8); addLog(`You pushed onward and reached port, but lost ${damage}% hull integrity.`); return closeAndRender();
  }
  if (action === "failureHull") {
    const raw = state.ship.shield >= 40 ? 4 : 7;
    const damage = applyHullDamage(raw); addLog(`You continued without stopping. The damaged panel worsened, costing ${damage}% hull integrity.`); return closeAndRender();
  }

  const contract = state.activeContract;
  if (action === "missionMiningDense" && contract?.kind === "mining") {
    if (el("encounterDialog").open) el("encounterDialog").close();
    if ((state.ship.cargoCapacity - cargoUsed()) < 3) { addLog("The denser pocket could yield three units, but you need three free cargo spaces before attempting it."); return render(); }
    state.cargo.ore = (state.cargo.ore || 0) + 3;
    const damage = applyHullDamage(4);
    return finishOperatorMission(`You pushed into the denser pocket and came away with 3 units of processed ore. The rough extraction cost ${state.ship.name} ${damage}% hull integrity.`);
  }
  if (action === "missionSalvageSearch" && contract?.kind === "salvage") {
    if (el("encounterDialog").open) el("encounterDialog").close();
    if (state.ship.sensors >= 4 && (state.ship.cargoCapacity - cargoUsed()) >= 2) {
      state.cargo.machineParts = (state.cargo.machineParts || 0) + 1;
      return finishOperatorMission("Your sensors picked a serviceable component out of the surrounding debris. You recovered the flight recorder plus 1 unit of machine parts that had no active claim attached.");
    }
    if (state.ship.sensors >= 4) return finishOperatorMission("Your sensors found a serviceable component in the debris, but with no spare cargo room beyond the recorder you marked its coordinates and completed the contracted recovery.");
    const damage = applyHullDamage(3);
    return finishOperatorMission(`The weak sensors made the debris search slow and close. You recovered the recorder, but a minor impact cost ${damage}% hull integrity and nothing else proved worth salvaging.`);
  }

  return resolveEncounterBeforeShipChassis(action);
};

renderShip = renderChassisShipManagement;
buyUpgrade = buyUpgradeWithCapacity;
ensureShipSystemState();
saveState();

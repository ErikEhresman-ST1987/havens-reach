// Haven's Reach — Wayfarer Refit #1
// Tests a true ship refit: a meaningful specialization with a real tradeoff rather than
// a straight stat upgrade. Mara can convert the Wayfarer for long-range frontier work,
// and later reverse the structural changes for a modest labor charge.

const WAYFARER_LONGHAUL_REFIT = {
  id: "wayfarer-longhaul",
  name: "Long-Haul Configuration",
  credits: 4000,
  components: 2,
  reverseCost: 650,
  effect: { cargoCapacity: -2, fuelCapacity: 30, sensors: 2 }
};

function wayfarerRefitActive(ship = state.ship) {
  return ship?.chassisId === "wayfarer" && ship.refitId === WAYFARER_LONGHAUL_REFIT.id;
}

const deriveShipStatsBeforeWayfarerRefit = deriveShipStats;
deriveShipStats = function deriveShipStatsWithWayfarerRefit(ship = state.ship) {
  const stats = deriveShipStatsBeforeWayfarerRefit(ship);
  if (wayfarerRefitActive(ship)) {
    stats.cargoCapacity = Math.max(1, stats.cargoCapacity + WAYFARER_LONGHAUL_REFIT.effect.cargoCapacity);
    stats.fuelCapacity += WAYFARER_LONGHAUL_REFIT.effect.fuelCapacity;
    stats.sensors += WAYFARER_LONGHAUL_REFIT.effect.sensors;
  }
  return stats;
};

function maraRefitEligible() {
  const mara = state.npcs?.mara;
  return Boolean(state.location === "haven" && mara?.met && mara.relationship >= 1 && state.ship?.chassisId === "wayfarer");
}

function projectedLongHaulCargoCapacity() {
  const temp = cloneShipRecord(state.ship);
  temp.refitId = WAYFARER_LONGHAUL_REFIT.id;
  return deriveShipStats(temp).cargoCapacity;
}

function installWayfarerLongHaulRefit() {
  ensureShipSystemState();
  if (!maraRefitEligible() || wayfarerRefitActive()) return;
  if (state.activeContract) {
    addLog("MARA QUINN — Finish the active contract before putting the Wayfarer into the yard for a structural refit.");
    return render();
  }
  const projectedCargo = projectedLongHaulCargoCapacity();
  if (cargoUsed() > projectedCargo) {
    addLog(`MARA QUINN — The long-haul refit reduces usable cargo space to ${projectedCargo}. Unload enough cargo before the yard can begin.`);
    return render();
  }
  if (state.credits < WAYFARER_LONGHAUL_REFIT.credits || (state.cargo.sensorComponents || 0) < WAYFARER_LONGHAUL_REFIT.components) {
    addLog(`MARA QUINN — The refit requires ${credits(WAYFARER_LONGHAUL_REFIT.credits)} and ${WAYFARER_LONGHAUL_REFIT.components} Sensor Components.`);
    return render();
  }

  const oldFuelCapacity = state.ship.fuelCapacity;
  state.credits -= WAYFARER_LONGHAUL_REFIT.credits;
  state.cargo.sensorComponents -= WAYFARER_LONGHAUL_REFIT.components;
  if (state.cargo.sensorComponents <= 0) delete state.cargo.sensorComponents;
  state.ship.refitId = WAYFARER_LONGHAUL_REFIT.id;
  recalculateShipStats(state.ship, true);
  if (state.ship.fuelCapacity > oldFuelCapacity) {
    state.ship.fuel = Math.min(state.ship.fuelCapacity, state.ship.fuel + (state.ship.fuelCapacity - oldFuelCapacity));
  }
  state.npcs.mara.relationship += 1;
  state.npcs.mara.memory.longHaulRefit = true;
  addLog("MARA QUINN — The Wayfarer leaves Haven's yard in Long-Haul Configuration: less cargo volume, but substantially more range and much stronger sensors for frontier work.");
  saveState();
  render();
}

function reverseWayfarerLongHaulRefit() {
  ensureShipSystemState();
  if (!maraRefitEligible() || !wayfarerRefitActive()) return;
  if (state.activeContract) {
    addLog("MARA QUINN — Finish the active contract before changing the Wayfarer's structural configuration.");
    return render();
  }
  if (state.credits < WAYFARER_LONGHAUL_REFIT.reverseCost) {
    addLog(`MARA QUINN — Returning the Wayfarer to its standard internal arrangement costs ${credits(WAYFARER_LONGHAUL_REFIT.reverseCost)} in yard labor.`);
    return render();
  }

  state.credits -= WAYFARER_LONGHAUL_REFIT.reverseCost;
  delete state.ship.refitId;
  recalculateShipStats(state.ship, true);
  addLog("MARA QUINN — The Wayfarer has been returned to its standard utility configuration. The long-haul structural changes can be fitted again later if you want them.");
  saveState();
  render();
}

function wayfarerRefitCardHtml() {
  if (state.location !== "haven") return "";
  if (state.ship?.chassisId !== "wayfarer") {
    const ownsWayfarer = state.hangar?.ships?.some(ship => ship.chassisId === "wayfarer");
    return ownsWayfarer ? `<article class="info-card"><p class="eyebrow">MARA'S YARD</p><h3>Wayfarer Refit</h3><p class="muted small">Mara can refit the Wayfarer, but the ship must be active and physically in her yard first.</p></article>` : "";
  }
  if (!maraRefitEligible()) return "";

  if (wayfarerRefitActive()) {
    return `<article class="info-card"><p class="eyebrow">MARA'S YARD — ACTIVE REFIT</p><h3>${WAYFARER_LONGHAUL_REFIT.name}</h3><p><strong>Tradeoff:</strong> −2 base cargo • +30 fuel capacity • +2 sensors</p><p class="muted small">The Wayfarer is specialized for long-range survey and frontier work rather than maximum freight volume. This is a structural configuration, not an equipment slot.</p><button class="secondary" type="button" onclick="reverseWayfarerLongHaulRefit()" ${state.activeContract || state.credits < WAYFARER_LONGHAUL_REFIT.reverseCost ? "disabled" : ""}>Return to Standard — ${credits(WAYFARER_LONGHAUL_REFIT.reverseCost)}</button></article>`;
  }

  const projectedCargo = projectedLongHaulCargoCapacity();
  const haveComponents = state.cargo.sensorComponents || 0;
  const blocked = state.activeContract || cargoUsed() > projectedCargo || state.credits < WAYFARER_LONGHAUL_REFIT.credits || haveComponents < WAYFARER_LONGHAUL_REFIT.components;
  return `<article class="info-card"><p class="eyebrow">MARA'S YARD — STRUCTURAL REFIT</p><h3>${WAYFARER_LONGHAUL_REFIT.name}</h3><p>Mara can rebuild the Wayfarer's internal layout around long-range independent work rather than general freight.</p><p><strong>Tradeoff:</strong> −2 base cargo • +30 fuel capacity • +2 sensors</p><p><strong>Cost:</strong> ${credits(WAYFARER_LONGHAUL_REFIT.credits)} + ${WAYFARER_LONGHAUL_REFIT.components} Sensor Components</p><p class="muted small">Projected cargo capacity after refit: ${projectedCargo}. Current cargo aboard: ${cargoUsed()}. Sensor Components aboard: ${haveComponents}. Reversible later for ${credits(WAYFARER_LONGHAUL_REFIT.reverseCost)} in yard labor.</p><button class="primary" type="button" onclick="installWayfarerLongHaulRefit()" ${blocked ? "disabled" : ""}>Install Long-Haul Refit</button></article>`;
}

const renderShipBeforeWayfarerRefit = renderShip;
renderShip = function renderShipWithWayfarerRefit() {
  ensureShipSystemState();
  renderShipBeforeWayfarerRefit();
  if (state.location !== "haven") return;
  const html = wayfarerRefitCardHtml();
  if (!html) return;
  const heading = view.querySelector(".section-heading");
  if (heading) heading.insertAdjacentHTML("afterend", `<div class="card-grid" style="margin-bottom:16px">${html}</div>`);
};

ensureShipSystemState();
saveState();

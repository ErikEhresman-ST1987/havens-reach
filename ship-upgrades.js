// Haven's Reach — Smallest Meaningful Upgrade #2
// Adds port-specific ship equipment without changing the core game engine.

GAME_DATA.upgrades.push(
  {
    id: "haven-bracing",
    name: "Reinforced Cargo Bracing",
    cost: 650,
    location: "haven",
    text: "+3 cargo capacity. A rugged Haven yard modification built for old utility transports.",
    apply: state => state.ship.cargoCapacity += 3
  },
  {
    id: "meridian-broker",
    name: "Veylan Broker Suite",
    cost: 900,
    location: "meridian",
    text: "+10% payout on completed contracts. Meridian trade software optimized around Veylan negotiation practices.",
    apply: state => state.ship.contractBonus = 0.10
  },
  {
    id: "prospect-sensors",
    name: "Frontier Sensor Array",
    cost: 850,
    location: "prospect",
    text: "+2 sensor rating. A long-range package assembled for uncertain frontier conditions.",
    apply: state => state.ship.sensors += 2
  }
);

// Show universal equipment everywhere, local specialty equipment only at its port,
// and already-installed equipment regardless of current location.
renderShip = function() {
  const cargoHtml = Object.keys(state.cargo).length
    ? Object.entries(state.cargo)
        .map(([id, qty]) => `<div class="cargo-item"><span>${GAME_DATA.commodities[id]?.name || id}</span><strong>${qty}</strong></div>`)
        .join("")
    : `<p class="muted">Cargo bay is empty.</p>`;

  const visibleUpgrades = GAME_DATA.upgrades.filter(upgrade =>
    !upgrade.location ||
    upgrade.location === state.location ||
    state.upgrades.includes(upgrade.id)
  );

  const upgrades = visibleUpgrades.map(upgrade => {
    const installed = state.upgrades.includes(upgrade.id);
    const specialty = upgrade.location
      ? `<div class="muted small">Specialty fitting: ${escapeHtml(GAME_DATA.systems[upgrade.location].name)}</div>`
      : `<div class="muted small">Standard fitting: available at all ports</div>`;

    return `<div class="upgrade-row">
      <div>
        <strong>${escapeHtml(upgrade.name)}</strong>
        <div class="muted small">${escapeHtml(upgrade.text)}</div>
        ${specialty}
      </div>
      <div>${credits(upgrade.cost)}</div>
      <div>${installed ? "Installed" : "Available"}</div>
      <button class="primary" onclick="buyUpgrade('${upgrade.id}')" ${installed || state.credits < upgrade.cost ? "disabled" : ""}>${installed ? "Installed" : "Buy"}</button>
    </div>`;
  }).join("");

  const contractBonus = state.ship.contractBonus
    ? `<p>Contract payout bonus ${Math.round(state.ship.contractBonus * 100)}%</p>`
    : "";

  view.innerHTML = `
    <div class="section-heading">
      <div><p class="eyebrow">SHIP MANAGEMENT</p><h2>${escapeHtml(state.ship.name)}</h2></div>
      <span class="muted small">Workshop: ${escapeHtml(GAME_DATA.systems[state.location].name)}</span>
    </div>
    <div class="card-grid">
      <article class="info-card">
        <h3>Systems</h3>
        <p>Hull ${state.ship.hull}% • Shield ${state.ship.shield}</p>
        <p>Engine ${state.ship.engine} • Sensors ${state.ship.sensors}</p>
        <p>Fuel ${state.ship.fuel}/${state.ship.fuelCapacity}</p>
        ${contractBonus}
      </article>
      <article class="info-card"><h3>Cargo</h3><div class="cargo-list">${cargoHtml}</div></article>
    </div>
    <h3 style="margin-top:18px">Upgrades</h3>
    <p class="muted small">Each port can offer equipment that reflects its local expertise. Installed specialty equipment remains visible after you leave.</p>
    ${upgrades}`;
};

// Location check is enforced here as well as in the interface.
buyUpgrade = function(id) {
  const upgrade = GAME_DATA.upgrades.find(item => item.id === id);
  if (!upgrade || state.upgrades.includes(id) || state.credits < upgrade.cost) return;
  if (upgrade.location && upgrade.location !== state.location) {
    addLog(`${upgrade.name} can only be installed at ${GAME_DATA.systems[upgrade.location].name}.`);
    return render();
  }

  state.credits -= upgrade.cost;
  upgrade.apply(state);
  state.upgrades.push(id);
  addLog(`Installed ${upgrade.name} at ${GAME_DATA.systems[state.location].name}.`);
  render();
};

// Preserve the existing contract-completion behavior while honoring the
// Veylan Broker Suite if it has been installed.
completeContractIfPossible = function() {
  const contract = state.activeContract;
  if (!contract || contract.destination !== state.location) return;

  Object.entries(contract.cargo || {}).forEach(([id, qty]) => {
    state.cargo[id] = Math.max(0, (state.cargo[id] || 0) - qty);
    if (!state.cargo[id]) delete state.cargo[id];
  });

  const bonusRate = state.ship.contractBonus || 0;
  const bonus = Math.round(contract.reward * bonusRate);
  const totalReward = contract.reward + bonus;

  state.credits += totalReward;
  state.reputation += contract.rep || 0;
  state.completedContracts.push(contract.id);

  if (bonus > 0) {
    addLog(`Contract completed: ${contract.title}. Earned ${credits(totalReward)} including a ${credits(bonus)} broker bonus, and gained reputation.`);
  } else {
    addLog(`Contract completed: ${contract.title}. Earned ${credits(contract.reward)} and gained reputation.`);
  }

  state.activeContract = null;
};

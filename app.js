const SAVE_KEY = "havensReachPrototypeV01";

function defaultState() {
  return {
    location: "haven",
    credits: 700,
    reputation: 0,
    ship: {
      name: "Wayfarer",
      hull: 100,
      shield: 40,
      engine: 1,
      sensors: 1,
      cargoCapacity: 8,
      fuelCapacity: 80,
      fuel: 80
    },
    cargo: {},
    activeContract: null,
    completedContracts: [],
    upgrades: [],
    log: ["You left Haven with an old utility transport, a small account, and no one deciding where you go next."]
  };
}

let state = loadState();
let currentView = "overview";

const el = id => document.getElementById(id);
const view = el("view");

function loadState() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    return saved ? { ...defaultState(), ...JSON.parse(saved) } : defaultState();
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function cargoUsed() {
  return Object.values(state.cargo).reduce((sum, qty) => sum + qty, 0);
}

function addLog(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 10);
}

function credits(value) {
  return `${Math.max(0, Math.round(value)).toLocaleString()} cr`;
}

function renderStatus() {
  const system = GAME_DATA.systems[state.location];
  el("credits").textContent = credits(state.credits);
  el("fuel").textContent = `${state.ship.fuel} / ${state.ship.fuelCapacity}`;
  el("hull").textContent = `${state.ship.hull}%`;
  el("cargoUsed").textContent = `${cargoUsed()} / ${state.ship.cargoCapacity}`;
  el("locationName").textContent = system.name;
  el("locationDescription").textContent = system.description;
  el("shipName").textContent = state.ship.name;
  el("shipDetails").textContent = `Utility transport • Engine ${state.ship.engine} • Sensors ${state.ship.sensors}`;
  el("eventLog").innerHTML = state.log.map(entry => `<div class="log-entry">${escapeHtml(entry)}</div>`).join("");
}

function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function render() {
  renderStatus();
  document.querySelectorAll(".tab").forEach(tab => tab.classList.toggle("active", tab.dataset.view === currentView));
  ({ overview: renderOverview, market: renderMarket, contracts: renderContracts, travel: renderTravel, ship: renderShip }[currentView])();
  saveState();
}

function renderOverview() {
  const system = GAME_DATA.systems[state.location];
  const active = state.activeContract;
  view.innerHTML = `
    <div class="section-heading"><div><p class="eyebrow">PORT OVERVIEW</p><h2>${escapeHtml(system.name)}</h2></div></div>
    <div class="card-grid">
      <article class="info-card"><h3>Local Economy</h3><p>${system.type}. Markets change by location; moving the right cargo is the simplest way to earn your first credits.</p></article>
      <article class="info-card"><h3>Reputation</h3><p><strong>${state.reputation}</strong> operator standing</p><p class="muted small">People are beginning to learn whether your word is worth something.</p></article>
      <article class="info-card"><h3>Current Contract</h3>${active ? `<p><strong>${escapeHtml(active.title)}</strong></p><p>${escapeHtml(active.text)}</p><p class="good">Destination: ${escapeHtml(GAME_DATA.systems[active.destination].name)}</p>` : `<p class="muted">No contract accepted. Check the contract board for work.</p>`}</article>
      <article class="info-card"><h3>Operator Advice</h3><p>Buy where a commodity is cheap, sell where it is scarce. Keep enough fuel to reach your destination.</p></article>
    </div>`;
}

function renderMarket() {
  const market = GAME_DATA.systems[state.location].market;
  const rows = Object.entries(GAME_DATA.commodities).map(([id, item]) => {
    const price = market[id];
    const owned = state.cargo[id] || 0;
    return `<div class="market-row">
      <div><strong>${item.name}</strong><div class="muted small">Owned: ${owned}</div></div>
      <div class="price">${credits(price)}</div>
      <button class="secondary" onclick="buyCommodity('${id}')">Buy</button>
      <button class="secondary" onclick="sellCommodity('${id}')" ${owned ? "" : "disabled"}>Sell</button>
    </div>`;
  }).join("");
  view.innerHTML = `<div class="section-heading"><div><p class="eyebrow">LOCAL MARKET</p><h2>Trade Goods</h2></div><span class="muted small">1 unit = 1 cargo space</span></div>${rows}`;
}

function buyCommodity(id) {
  const price = GAME_DATA.systems[state.location].market[id];
  if (cargoUsed() >= state.ship.cargoCapacity) return addLog("Cargo bay is full."), render();
  if (state.credits < price) return addLog("You don't have enough credits for that purchase."), render();
  state.credits -= price;
  state.cargo[id] = (state.cargo[id] || 0) + 1;
  addLog(`Bought 1 unit of ${GAME_DATA.commodities[id].name} for ${credits(price)}.`);
  render();
}

function sellCommodity(id) {
  if (!state.cargo[id]) return;
  const price = GAME_DATA.systems[state.location].market[id];
  state.cargo[id] -= 1;
  if (!state.cargo[id]) delete state.cargo[id];
  state.credits += price;
  addLog(`Sold 1 unit of ${GAME_DATA.commodities[id].name} for ${credits(price)}.`);
  render();
}

function renderContracts() {
  const contracts = GAME_DATA.systems[state.location].contracts;
  const rows = contracts.map(contract => {
    const completed = state.completedContracts.includes(contract.id);
    return `<div class="contract-row">
      <div><strong>${escapeHtml(contract.title)}</strong><div class="muted small">${escapeHtml(contract.text)}</div></div>
      <div>${escapeHtml(GAME_DATA.systems[contract.destination].name)}</div>
      <div class="good">${credits(contract.reward)}</div>
      <button class="primary" onclick="acceptContract('${contract.id}')" ${(state.activeContract || completed) ? "disabled" : ""}>${completed ? "Completed" : "Accept"}</button>
    </div>`;
  }).join("");
  view.innerHTML = `<div class="section-heading"><div><p class="eyebrow">CONTRACT BOARD</p><h2>Available Work</h2></div></div>${state.activeContract ? `<p class="warn">You already have an active contract. Finish it before accepting another.</p>` : ""}${rows}`;
}

function findContract(id) {
  return Object.values(GAME_DATA.systems).flatMap(system => system.contracts).find(contract => contract.id === id);
}

function acceptContract(id) {
  const contract = findContract(id);
  if (!contract || state.activeContract) return;
  const cargoNeeded = Object.values(contract.cargo || {}).reduce((a, b) => a + b, 0);
  if (cargoUsed() + cargoNeeded > state.ship.cargoCapacity) {
    addLog("Not enough cargo space to accept that contract.");
    return render();
  }
  Object.entries(contract.cargo || {}).forEach(([cargoId, qty]) => state.cargo[cargoId] = (state.cargo[cargoId] || 0) + qty);
  state.activeContract = contract;
  addLog(`Accepted contract: ${contract.title}. Destination: ${GAME_DATA.systems[contract.destination].name}.`);
  render();
}

function renderTravel() {
  const system = GAME_DATA.systems[state.location];
  const rows = Object.entries(system.neighbors).map(([id, fuelCost]) => {
    const destination = GAME_DATA.systems[id];
    return `<div class="travel-row">
      <div><strong>${escapeHtml(destination.name)}</strong><div class="muted small">${destination.type}</div></div>
      <div>${fuelCost} fuel</div>
      <div class="muted">${escapeHtml(destination.description)}</div>
      <button class="primary" onclick="travel('${id}', ${fuelCost})" ${state.ship.fuel < fuelCost ? "disabled" : ""}>Travel</button>
    </div>`;
  }).join("");
  view.innerHTML = `<div class="section-heading"><div><p class="eyebrow">NAVIGATION</p><h2>Reachable Systems</h2></div></div>${rows}<p class="muted small">Fuel is automatically replenished to full for 1 credit per unit whenever you arrive at a civilized port and can afford it.</p>`;
}

function travel(destination, fuelCost) {
  if (state.ship.fuel < fuelCost) return;
  const origin = GAME_DATA.systems[state.location].name;
  state.ship.fuel -= fuelCost;
  state.location = destination;
  addLog(`Traveled from ${origin} to ${GAME_DATA.systems[destination].name}.`);
  completeContractIfPossible();
  refuelAtPort();
  render();
  if (Math.random() < 0.58) showRandomEncounter();
}

function refuelAtPort() {
  const needed = state.ship.fuelCapacity - state.ship.fuel;
  const purchased = Math.min(needed, state.credits);
  state.ship.fuel += purchased;
  state.credits -= purchased;
  if (purchased > 0) addLog(`Port services replenished ${purchased} fuel for ${credits(purchased)}.`);
}

function completeContractIfPossible() {
  const contract = state.activeContract;
  if (!contract || contract.destination !== state.location) return;
  Object.entries(contract.cargo || {}).forEach(([id, qty]) => {
    state.cargo[id] = Math.max(0, (state.cargo[id] || 0) - qty);
    if (!state.cargo[id]) delete state.cargo[id];
  });
  state.credits += contract.reward;
  state.reputation += contract.rep || 0;
  state.completedContracts.push(contract.id);
  addLog(`Contract completed: ${contract.title}. Earned ${credits(contract.reward)} and gained reputation.`);
  state.activeContract = null;
}

function renderShip() {
  const cargoHtml = Object.keys(state.cargo).length ? Object.entries(state.cargo).map(([id, qty]) => `<div class="cargo-item"><span>${GAME_DATA.commodities[id]?.name || id}</span><strong>${qty}</strong></div>`).join("") : `<p class="muted">Cargo bay is empty.</p>`;
  const upgrades = GAME_DATA.upgrades.map(upgrade => {
    const installed = state.upgrades.includes(upgrade.id);
    return `<div class="upgrade-row"><div><strong>${upgrade.name}</strong><div class="muted small">${upgrade.text}</div></div><div>${credits(upgrade.cost)}</div><div>${installed ? "Installed" : "Available"}</div><button class="primary" onclick="buyUpgrade('${upgrade.id}')" ${installed || state.credits < upgrade.cost ? "disabled" : ""}>${installed ? "Installed" : "Buy"}</button></div>`;
  }).join("");
  view.innerHTML = `
    <div class="section-heading"><div><p class="eyebrow">SHIP MANAGEMENT</p><h2>${escapeHtml(state.ship.name)}</h2></div></div>
    <div class="card-grid">
      <article class="info-card"><h3>Systems</h3><p>Hull ${state.ship.hull}% • Shield ${state.ship.shield}</p><p>Engine ${state.ship.engine} • Sensors ${state.ship.sensors}</p><p>Fuel ${state.ship.fuel}/${state.ship.fuelCapacity}</p></article>
      <article class="info-card"><h3>Cargo</h3><div class="cargo-list">${cargoHtml}</div></article>
    </div>
    <h3 style="margin-top:18px">Upgrades</h3>${upgrades}`;
}

function buyUpgrade(id) {
  const upgrade = GAME_DATA.upgrades.find(item => item.id === id);
  if (!upgrade || state.upgrades.includes(id) || state.credits < upgrade.cost) return;
  state.credits -= upgrade.cost;
  upgrade.apply(state);
  state.upgrades.push(id);
  addLog(`Installed ${upgrade.name}. New opportunities may now be available.`);
  render();
}

function showRandomEncounter() {
  const encounter = GAME_DATA.encounters[Math.floor(Math.random() * GAME_DATA.encounters.length)];
  el("encounterTitle").textContent = encounter.title;
  el("encounterText").textContent = encounter.text;
  el("encounterChoices").innerHTML = encounter.choices.map(choice => `<button class="secondary" type="button" onclick="resolveEncounter('${choice.action}')">${escapeHtml(choice.label)}</button>`).join("");
  el("encounterDialog").showModal();
}

function resolveEncounter(action) {
  const actions = {
    payPirates() {
      const paid = Math.min(100, state.credits);
      state.credits -= paid;
      addLog(`Paid pirates ${credits(paid)} and continued without damage.`);
    },
    escapePirates() {
      const success = Math.random() < (0.45 + state.ship.engine * 0.12);
      if (success) addLog("You pushed the old engines hard and escaped the pirate cutter.");
      else { state.ship.hull = Math.max(1, state.ship.hull - 12); addLog("The escape was rough. You got away, but the ship took 12% hull damage."); }
    },
    offerCargo() {
      const first = Object.keys(state.cargo)[0];
      if (first) { state.cargo[first] -= 1; if (!state.cargo[first]) delete state.cargo[first]; addLog(`Pirates accepted one unit of ${GAME_DATA.commodities[first]?.name || "cargo"}.`); }
      else actions.payPirates();
    },
    complyInspection() { addLog("Customs verified your manifest and cleared you to continue."); },
    expediteInspection() {
      if (state.reputation >= 2) addLog("Your growing reputation helped. Customs granted expedited clearance.");
      else { state.credits = Math.max(0, state.credits - 35); addLog("Customs charged a 35-credit expedited processing fee."); }
    },
    helpDistress() {
      const reward = 80 + state.ship.sensors * 20;
      state.credits += reward;
      state.reputation += 1;
      addLog(`You helped stabilize the survey craft. Its crew transferred ${credits(reward)} in thanks, and word of your help spread.`);
    },
    skipDistress() { addLog("You logged the distress coordinates and continued on course."); },
    repairFailure() {
      const cost = Math.min(45, state.credits);
      state.credits -= cost;
      addLog(`You spent ${credits(cost)} in supplies and stabilized the coolant system.`);
    },
    pushFailure() {
      state.ship.hull = Math.max(1, state.ship.hull - 8);
      addLog("You pushed onward. The ship made port, but lost 8% hull integrity.");
    }
  };
  actions[action]?.();
  el("encounterDialog").close();
  render();
}

function resetGame() {
  if (!confirm("Start a new game? This will erase the current local save.")) return;
  state = defaultState();
  localStorage.removeItem(SAVE_KEY);
  currentView = "overview";
  render();
}

document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => { currentView = tab.dataset.view; render(); }));
el("resetButton").addEventListener("click", resetGame);

render();

// Haven's Reach — Customization #1
// Keeps identity lightweight: one captain name and one personal name per ship.
// Chassis identity remains authoritative; naming adds ownership without changing mechanics.

function ensureOperatorIdentityState() {
  if (!state.captainName || typeof state.captainName !== "string") state.captainName = "Captain";
  state.captainName = normalizeIdentityName(state.captainName, "Captain");
  if (state.ship) state.ship.name = normalizeIdentityName(state.ship.name, chassisFor(state.ship)?.name || "Wayfarer");
  if (Array.isArray(state.hangar?.ships)) {
    state.hangar.ships.forEach(ship => {
      ship.name = normalizeIdentityName(ship.name, chassisFor(ship)?.name || "Ship");
    });
  }
}

function normalizeIdentityName(value, fallback) {
  const cleaned = String(value || "").trim().replace(/\s+/g, " ");
  return cleaned.slice(0, 32) || fallback;
}

function shipClassLabel(ship = state.ship) {
  const chassis = chassisFor(ship);
  return chassis.id === "wayfarer" ? "Wayfarer-class" : chassis.name;
}

function saveOperatorIdentity() {
  ensureOperatorIdentityState();
  const captainInput = document.getElementById("captainNameInput");
  const shipInput = document.getElementById("shipNameInput");
  const oldCaptain = state.captainName;
  const oldShipName = state.ship.name;
  state.captainName = normalizeIdentityName(captainInput?.value, "Captain");
  state.ship.name = normalizeIdentityName(shipInput?.value, chassisFor()?.name || "Wayfarer");

  if (oldCaptain !== state.captainName || oldShipName !== state.ship.name) {
    addLog(`Registry updated: ${state.captainName}, commanding ${state.ship.name}.`);
  }
  saveState();
  render();
}

const renderStatusBeforeOperatorCustomization = renderStatus;
renderStatus = function renderStatusWithOperatorCustomization() {
  ensureOperatorIdentityState();
  renderStatusBeforeOperatorCustomization();
  const chassis = chassisFor();
  const shipNameEl = document.getElementById("shipName");
  const shipDetailsEl = document.getElementById("shipDetails");
  if (shipNameEl) shipNameEl.textContent = state.ship.name;
  if (shipDetailsEl) shipDetailsEl.textContent = `${shipClassLabel()} • ${chassis.type} • Engine ${state.ship.engine} • Sensors ${state.ship.sensors}`;
};

const renderShipBeforeOperatorCustomization = renderShip;
renderShip = function renderShipWithOperatorCustomization() {
  ensureOperatorIdentityState();
  renderShipBeforeOperatorCustomization();

  const sectionHeading = view.querySelector(".section-heading");
  if (!sectionHeading || view.querySelector("[data-operator-identity]")) return;
  const chassis = chassisFor();
  const identityHtml = `
    <article class="info-card operator-identity-card" data-operator-identity>
      <p class="eyebrow">SHIP REGISTRY</p>
      <h3>Captain & Vessel</h3>
      <div class="operator-identity-grid">
        <label for="captainNameInput">Captain name</label>
        <input id="captainNameInput" type="text" maxlength="32" autocomplete="off" value="${escapeHtml(state.captainName)}">
        <label for="shipNameInput">Ship name</label>
        <input id="shipNameInput" type="text" maxlength="32" autocomplete="off" value="${escapeHtml(state.ship.name)}">
      </div>
      <p class="muted small">Current chassis: <strong>${escapeHtml(shipClassLabel())}</strong> — ${escapeHtml(chassis.type)}. Renaming the vessel does not change its class, equipment, or capabilities.</p>
      <button class="secondary" type="button" onclick="saveOperatorIdentity()">Update Registry</button>
    </article>`;

  sectionHeading.insertAdjacentHTML("afterend", identityHtml);
};

ensureOperatorIdentityState();
saveState();

// Haven's Reach — Captain's Briefing #1
// Shows only for a genuinely fresh game or after the player confirms New Game.
// It teaches where to look without adding permanent activity indicators or tutorial machinery.
// New players may also name their captain and christen the inherited Wayfarer.

const CAPTAINS_BRIEFING_SAVE_KEY = "havensReachPrototypeV01";
const captainsBriefingHadSaveAtLoad = localStorage.getItem(CAPTAINS_BRIEFING_SAVE_KEY) !== null;
let captainsBriefingResetState = null;

const captainsBriefingDialog = document.createElement("dialog");
captainsBriefingDialog.id = "captainsBriefingDialog";
captainsBriefingDialog.innerHTML = `
  <div class="captains-briefing-card">
    <p class="eyebrow">CAPTAIN'S BRIEFING</p>
    <h2>Welcome to Haven's Reach</h2>
    <p class="captains-briefing-opening">Your uncle left you a <strong>Wayfarer-class utility transport</strong>, a small account, and the freedom to decide what kind of operator you will become.</p>
    <div class="captains-briefing-advice">
      <p>His advice was simple: <strong>make a living, but never forget the community. Help people where you can.</strong></p>
    </div>
    <p>Haven is struggling, the frontier is growing, and nobody is giving you orders. Trade, haul freight, explore, meet people, improve your ship, and follow the opportunities that make sense to you. People remember what you do, and sometimes helping someone changes what becomes possible later.</p>

    <div class="captains-briefing-identity" aria-label="Captain and ship names">
      <h3>Make it yours</h3>
      <label for="briefingCaptainName">Captain name</label>
      <input id="briefingCaptainName" type="text" maxlength="32" autocomplete="off" placeholder="Captain">
      <label for="briefingShipName">Ship name</label>
      <input id="briefingShipName" type="text" maxlength="32" autocomplete="off" value="Wayfarer" placeholder="Wayfarer">
      <p class="muted small">The ship remains a Wayfarer-class utility transport. You can change either name later from the Ship screen.</p>
    </div>

    <div class="captains-briefing-hints">
      <h3>A few things worth remembering</h3>
      <ul>
        <li>Check <strong>Overview</strong> whenever you arrive somewhere.</li>
        <li>Visit the <strong>cantina</strong>. People, rumors, and opportunities can change.</li>
        <li>Contracts and markets are only part of what the frontier offers.</li>
        <li>Pay attention to people you have met before. Relationships can matter later.</li>
        <li>Explore when you get a lead. Not every discovery promises a profit.</li>
      </ul>
    </div>
    <button class="primary" type="button" id="beginJourneyButton">Begin Your Journey</button>
  </div>`;
document.body.appendChild(captainsBriefingDialog);

function normalizeOperatorName(value, fallback) {
  const cleaned = String(value || "").trim().replace(/\s+/g, " ");
  return cleaned.slice(0, 32) || fallback;
}

function seedBriefingIdentityFields() {
  const captainInput = captainsBriefingDialog.querySelector("#briefingCaptainName");
  const shipInput = captainsBriefingDialog.querySelector("#briefingShipName");
  if (captainInput) captainInput.value = state?.captainName && state.captainName !== "Captain" ? state.captainName : "";
  if (shipInput) shipInput.value = state?.ship?.name || "Wayfarer";
}

function showCaptainsBriefing() {
  if (typeof state !== "undefined") {
    state.log = Array.isArray(state.log) ? state.log : [];
    const oldOpening = "You left Haven with an old utility transport, a small account, and no one deciding where you go next.";
    const newOpening = "You inherited a Wayfarer-class utility transport from your uncle, along with his advice to make a living, remember the community, and help people where you can.";
    const openingIndex = state.log.indexOf(oldOpening);
    if (openingIndex >= 0) state.log[openingIndex] = newOpening;
    else if (!state.log.includes(newOpening) && state.reputation === 0 && state.location === "haven") state.log.unshift(newOpening);
    if (!state.captainName) state.captainName = "Captain";
    if (typeof render === "function") render();
    else if (typeof saveState === "function") saveState();
    seedBriefingIdentityFields();
  }
  if (!captainsBriefingDialog.open) captainsBriefingDialog.showModal();
}

captainsBriefingDialog.querySelector("#beginJourneyButton").addEventListener("click", () => {
  if (typeof state !== "undefined") {
    const captainInput = captainsBriefingDialog.querySelector("#briefingCaptainName");
    const shipInput = captainsBriefingDialog.querySelector("#briefingShipName");
    state.captainName = normalizeOperatorName(captainInput?.value, "Captain");
    if (state.ship) state.ship.name = normalizeOperatorName(shipInput?.value, "Wayfarer");
    if (typeof addLog === "function") {
      addLog(`${state.captainName} takes command of ${state.ship.name} and begins independent operations from Haven.`);
    }
    if (typeof render === "function") render();
    else if (typeof saveState === "function") saveState();
  }
  captainsBriefingDialog.close();
});

// Capture the state object before the existing New Game handler runs. After all click
// handlers finish, a changed object means the reset was actually confirmed rather than canceled.
const captainsBriefingResetButton = document.getElementById("resetButton");
if (captainsBriefingResetButton) {
  captainsBriefingResetButton.addEventListener("click", () => {
    if (typeof state !== "undefined") captainsBriefingResetState = state;
  }, true);

  captainsBriefingResetButton.addEventListener("click", () => {
    const stateBeforeReset = captainsBriefingResetState;
    setTimeout(() => {
      if (typeof state !== "undefined" && stateBeforeReset && state !== stateBeforeReset) showCaptainsBriefing();
      captainsBriefingResetState = null;
    }, 0);
  });
}

window.addEventListener("load", () => {
  if (!captainsBriefingHadSaveAtLoad) showCaptainsBriefing();
});

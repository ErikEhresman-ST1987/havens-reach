// Haven's Reach — Contract Diversity Prototype
// Adds four kinds of operator work without introducing classes or a career system.
// Existing freight/courier contracts remain unchanged. Special missions require
// suitable ship capability or standing and must be actively completed at the destination.

const OPERATOR_MISSIONS = [
  {
    system: "pelagos",
    contract: {
      id: "science-beacon-survey",
      title: "Beacon Calibration Survey",
      destination: "caldersDrift",
      reward: 720,
      cargo: {},
      rep: 2,
      kind: "science",
      kindLabel: "Scientific Survey",
      minSensors: 3,
      text: "Run an independent calibration sweep around Calder's Drift and return a clean navigation data set to the survey network.",
      actionLabel: "Run Survey Sweep"
    }
  },
  {
    system: "caldersDrift",
    contract: {
      id: "mining-red-mesa-shift",
      title: "Independent Extraction Shift",
      destination: "redMesa",
      reward: 620,
      cargo: {},
      rep: 1,
      kind: "mining",
      kindLabel: "Mining / Extraction",
      minFreeCargo: 2,
      text: "A Red Mesa cooperative is offering an independent extraction slot. Bring a ship with room for the material you recover.",
      actionLabel: "Run Extraction Shift"
    }
  },
  {
    system: "meridian",
    contract: {
      id: "security-detainee-haven",
      title: "Detainee Transfer",
      destination: "haven",
      reward: 680,
      cargo: {},
      rep: 2,
      kind: "transport",
      kindLabel: "Secure Transport",
      minReputation: 1,
      text: "Meridian authorities need a low-profile independent operator to transport a nonviolent commercial detainee to Haven jurisdiction.",
      actionLabel: "Transfer Detainee"
    }
  },
  {
    system: "prospect",
    contract: {
      id: "salvage-drift-recorder",
      title: "Lost Recorder Recovery",
      destination: "caldersDrift",
      reward: 650,
      cargo: {},
      rep: 1,
      kind: "salvage",
      kindLabel: "Salvage / Recovery",
      minSensors: 2,
      minFreeCargo: 1,
      text: "Locate and recover a flight recorder lost near the Calder approach. The beacon is weak, so useful sensors matter.",
      actionLabel: "Recover Flight Recorder"
    }
  }
];

OPERATOR_MISSIONS.forEach(({ system, contract }) => {
  const board = GAME_DATA.systems[system]?.contracts;
  if (board && !board.some(item => item.id === contract.id)) board.push(contract);
});

function isOperatorMission(contract) {
  return Boolean(contract && contract.kind);
}

function missionRequirements(contract) {
  const requirements = [];
  if (contract.minSensors) requirements.push(`Sensors ${contract.minSensors}+`);
  if (contract.minEngine) requirements.push(`Engine ${contract.minEngine}+`);
  if (contract.minReputation) requirements.push(`Reputation ${contract.minReputation}+`);
  if (contract.minFreeCargo) requirements.push(`${contract.minFreeCargo} free cargo space${contract.minFreeCargo === 1 ? "" : "s"}`);
  return requirements;
}

function missionRequirementsMet(contract) {
  if (!contract) return false;
  if (contract.minSensors && state.ship.sensors < contract.minSensors) return false;
  if (contract.minEngine && state.ship.engine < contract.minEngine) return false;
  if (contract.minReputation && state.reputation < contract.minReputation) return false;
  if (contract.minFreeCargo && (state.ship.cargoCapacity - cargoUsed()) < contract.minFreeCargo) return false;
  return true;
}

// Keep ordinary contracts exactly as they are. Special missions are accepted without
// injecting freight cargo and carry their own small mission state in the save.
const acceptContractBeforeOperatorMissions = acceptContract;
acceptContract = function acceptContractWithOperatorMissions(id) {
  const contract = findContract(id);
  if (!isOperatorMission(contract)) return acceptContractBeforeOperatorMissions(id);
  if (state.activeContract) return;

  if (!missionRequirementsMet(contract)) {
    addLog(`Cannot accept ${contract.title}: the ship or operator does not yet meet the mission requirements.`);
    return render();
  }

  state.activeContract = { ...contract, missionReady: false };
  addLog(`Accepted ${contract.kindLabel.toLowerCase()} contract: ${contract.title}. Destination: ${GAME_DATA.systems[contract.destination].name}.`);
  render();
};

// Special missions do not auto-complete merely because the ship arrived.
// Reaching the destination unlocks a deliberate operator action on the Contracts screen.
const completeContractBeforeOperatorMissions = completeContractIfPossible;
completeContractIfPossible = function completeContractWithOperatorMissions() {
  const contract = state.activeContract;
  if (!isOperatorMission(contract)) return completeContractBeforeOperatorMissions();
  if (contract.destination !== state.location) return;

  if (!contract.missionReady) {
    contract.missionReady = true;
    addLog(`${contract.title}: you have reached the mission area. Open Contracts when ready to carry out the work.`);
  }
};

function finishOperatorMission(extraText = "") {
  const contract = state.activeContract;
  if (!isOperatorMission(contract)) return;

  const bonusRate = state.ship.contractBonus || 0;
  const bonus = Math.round(contract.reward * bonusRate);
  const totalReward = contract.reward + bonus;

  state.credits += totalReward;
  state.reputation += contract.rep || 0;
  if (!state.completedContracts.includes(contract.id)) state.completedContracts.push(contract.id);

  const bonusText = bonus > 0 ? ` including a ${credits(bonus)} broker bonus` : "";
  addLog(`${extraText}${extraText ? " " : ""}Mission completed: ${contract.title}. Earned ${credits(totalReward)}${bonusText}.`);
  state.activeContract = null;
  render();
}

function performOperatorMission() {
  const contract = state.activeContract;
  if (!isOperatorMission(contract) || contract.destination !== state.location || !contract.missionReady) return;

  if (contract.kind === "science") {
    const quality = state.ship.sensors >= 5 ? "The high-resolution sweep produced unusually clean navigation data." : "The calibration sweep produced a complete, usable navigation data set.";
    return finishOperatorMission(quality);
  }

  if (contract.kind === "mining") {
    if ((state.ship.cargoCapacity - cargoUsed()) < 2) {
      addLog("The extraction shift needs two free cargo spaces for recovered ore.");
      return render();
    }
    state.cargo.ore = (state.cargo.ore || 0) + 2;
    return finishOperatorMission("You completed the extraction shift and kept 2 units of processed ore as your material share.");
  }

  if (contract.kind === "transport") {
    return finishOperatorMission("The detainee transfer was completed through Haven port security without incident.");
  }

  if (contract.kind === "salvage") {
    if ((state.ship.cargoCapacity - cargoUsed()) < 1) {
      addLog("You need one free cargo space to bring the recovered recorder aboard.");
      return render();
    }
    const sensorText = state.ship.sensors >= 4
      ? "Your sensors isolated the recorder quickly among the approach debris."
      : "A careful search located the recorder's weak emergency beacon.";
    return finishOperatorMission(`${sensorText} The recorder was recovered intact.`);
  }
}

// Extend the proven contract board rather than replacing it. Add type/requirements
// to special jobs, and show a mission-action card after reaching the objective.
const renderContractsBeforeOperatorMissions = renderContracts;
renderContracts = function renderContractsWithOperatorMissions() {
  renderContractsBeforeOperatorMissions();

  view.querySelectorAll('.contract-row').forEach(row => {
    const button = row.querySelector('button[onclick*="acceptContract"]');
    if (!button) return;
    const match = button.getAttribute('onclick').match(/acceptContract\('([^']+)'\)/);
    const contract = match ? findContract(match[1]) : null;
    if (!isOperatorMission(contract)) return;

    const first = row.querySelector('div');
    const requirements = missionRequirements(contract);
    if (first) {
      first.insertAdjacentHTML('afterbegin', `<div class="eyebrow" style="margin-bottom:4px">${escapeHtml(contract.kindLabel)}</div>`);
      if (requirements.length) {
        first.insertAdjacentHTML('beforeend', `<div class="muted small" style="margin-top:5px">Requirements: ${escapeHtml(requirements.join(" • "))}</div>`);
      }
    }

    if (!state.activeContract && !missionRequirementsMet(contract)) {
      button.disabled = true;
      button.textContent = "Requirements Not Met";
    }
  });

  const active = state.activeContract;
  if (!isOperatorMission(active)) return;

  const heading = view.querySelector('.section-heading');
  if (!heading) return;

  const atDestination = active.destination === state.location;
  const requirements = missionRequirements(active).join(" • ");
  const actionCard = document.createElement('article');
  actionCard.className = 'info-card';
  actionCard.style.marginBottom = '16px';
  actionCard.innerHTML = `
    <p class="eyebrow">${escapeHtml(active.kindLabel)}</p>
    <h3>Mission Work</h3>
    <p>${escapeHtml(active.text)}</p>
    ${requirements ? `<p class="muted small">Mission requirements: ${escapeHtml(requirements)}</p>` : ""}
    ${atDestination
      ? `<p class="good">You are at the mission location. The work is ready to begin.</p><button class="primary" onclick="performOperatorMission()">${escapeHtml(active.actionLabel || "Complete Mission")}</button>`
      : `<p class="muted small">Travel to ${escapeHtml(GAME_DATA.systems[active.destination].name)}. This mission will not complete automatically on arrival.</p>`}
  `;
  heading.insertAdjacentElement('afterend', actionCard);
};

// Haven's Reach — Contract Variety & Consequence #1
// Small systemic correction for repeatable work: local boards rotate from slightly deeper
// handcrafted pools, and repeated special-mission choices no longer resolve identically.
// No contract generator, timer system, quest engine, or new progression layer.

const CONTRACT_VARIETY_ADDITIONS = {
  haven: [
    { id: "haven-payroll", title: "Dock Payroll Packet", destination: "meridian", reward: 195, cargo: {}, rep: 1, text: "Carry sealed payroll authorizations from Haven's freight yards to a clearing office at Meridian Exchange." }
  ],
  meridian: [
    { id: "meridian-repair-kits", title: "Workshop Repair Kits", destination: "haven", reward: 285, cargo: { machineParts: 1 }, rep: 1, text: "A Haven workshop needs a compact shipment of replacement couplings before its next maintenance cycle." }
  ],
  prospect: [
    { id: "prospect-core-samples", title: "Core Sample Return", destination: "meridian", reward: 345, cargo: { ore: 1 }, rep: 1, text: "Return a sealed geological core sample to a materials buyer at Meridian Exchange." }
  ],
  caldersDrift: [
    { id: "calder-beacon-logs", title: "Beacon Service Logs", destination: "prospect", reward: 430, cargo: {}, rep: 1, text: "Carry Calder's latest navigation-beacon service logs inward to Prospect Reach." }
  ],
  redMesa: [
    { id: "mesa-shift-tooling", title: "Shift Tooling Transfer", destination: "caldersDrift", reward: 500, cargo: { machineParts: 1 }, rep: 1, text: "Move a compact tooling shipment from Red Mesa's industrial decks to a maintenance crew at Calder's Drift." }
  ],
  pelagos: [
    { id: "pelagos-field-records", title: "Field Records Courier", destination: "redMesa", reward: 560, cargo: {}, rep: 1, text: "Carry signed survey field records to a Kharok materials team waiting at Red Mesa Junction." }
  ]
};

function ensureContractVarietyState() {
  if (!state.contractVariety || typeof state.contractVariety !== "object") state.contractVariety = {};
  if (!state.contractVariety.boards || typeof state.contractVariety.boards !== "object") state.contractVariety.boards = {};
  if (!state.contractVariety.lastOutcome || typeof state.contractVariety.lastOutcome !== "object") state.contractVariety.lastOutcome = {};
}

function syncContractVarietyPools() {
  Object.entries(CONTRACT_VARIETY_ADDITIONS).forEach(([systemId, additions]) => {
    const board = GAME_DATA.systems[systemId]?.contracts;
    if (!Array.isArray(board)) return;
    additions.forEach(contract => {
      if (!board.some(existing => existing.id === contract.id)) board.push(contract);
    });
  });
}

function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sameIdSet(a = [], b = []) {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((id, index) => id === right[index]);
}

function contractOfferLimit(poolLength) {
  if (poolLength <= 1) return poolLength;
  if (poolLength <= 3) return 2;
  return 3;
}

function chooseContractOffers(systemId, pool) {
  ensureContractVarietyState();
  const record = state.contractVariety.boards[systemId] || {};
  const trip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
  const poolIds = pool.map(contract => contract.id);

  // Keep the board stable while the player remains in port. Returning after travel
  // refreshes it, which makes familiar lanes viable without making every visit identical.
  if (record.trip === trip && Array.isArray(record.offers)) {
    const stillValid = record.offers.filter(id => poolIds.includes(id));
    if (stillValid.length) return stillValid;
  }

  const limit = contractOfferLimit(pool.length);
  if (!limit) return [];

  let offers = shuffled(poolIds).slice(0, limit);
  const previous = Array.isArray(record.offers) ? record.offers : [];
  if (pool.length > limit && sameIdSet(offers, previous)) {
    for (let attempt = 0; attempt < 5 && sameIdSet(offers, previous); attempt += 1) {
      offers = shuffled(poolIds).slice(0, limit);
    }
  }

  // A newly earned Seli referral should actually reach the player; do not let the
  // rotating public board hide the persistent consequence on the trip it becomes usable.
  if (systemId === "meridian" && poolIds.includes("seli-private-consignment") && !offers.includes("seli-private-consignment")) {
    if (offers.length >= limit) offers[offers.length - 1] = "seli-private-consignment";
    else offers.push("seli-private-consignment");
  }

  state.contractVariety.boards[systemId] = { trip, offers: [...offers] };
  saveState();
  return offers;
}

const renderContractsBeforeContractVariety = renderContracts;
renderContracts = function renderContractsWithVariety() {
  ensureContractVarietyState();
  syncContractVarietyPools();
  if (typeof syncSeliPrivateFreightContract === "function") syncSeliPrivateFreightContract();

  const system = GAME_DATA.systems[state.location];
  if (!system || !Array.isArray(system.contracts)) return renderContractsBeforeContractVariety();

  const fullBoard = system.contracts;
  const knownPool = fullBoard.filter(contract => typeof isSystemKnown !== "function" || isSystemKnown(contract.destination));
  const offeredIds = chooseContractOffers(state.location, knownPool);
  const activeId = state.activeContract?.id;
  const visible = knownPool.filter(contract => offeredIds.includes(contract.id) || contract.id === activeId);

  system.contracts = visible;
  try {
    renderContractsBeforeContractVariety();
    const heading = view.querySelector('.section-heading');
    if (heading) heading.insertAdjacentHTML('afterend', '<p class="muted small" style="margin-top:0">Local postings change as brokers place and close work. Familiar routes can stay profitable without offering exactly the same jobs every visit.</p>');
  } finally {
    system.contracts = fullBoard;
  }
};

function variedMissionOutcome(action, choices) {
  ensureContractVarietyState();
  const previous = state.contractVariety.lastOutcome[action];
  const eligible = choices.filter(choice => choice.key !== previous);
  const pool = eligible.length ? eligible : choices;
  const outcome = pool[Math.floor(Math.random() * pool.length)];
  state.contractVariety.lastOutcome[action] = outcome.key;
  return outcome;
}

function closeMissionDialog() {
  if (el("encounterDialog").open) el("encounterDialog").close();
}

const resolveEncounterBeforeContractVariety = resolveEncounter;
resolveEncounter = function resolveEncounterWithContractVariety(action) {
  const contract = state.activeContract;
  if (!contract || !isOperatorMission(contract)) return resolveEncounterBeforeContractVariety(action);

  if (action === "missionSciencePrecision" && contract.kind === "science") {
    closeMissionDialog();
    const outcomes = state.ship.sensors >= 4
      ? [
          { key: "clean", text: "You completed the assigned calibration sweep and returned a clean, dependable navigation data set." },
          { key: "excellent", credits: 70, text: "The precision sweep caught several small beacon offsets. Pelagos added a 70-credit quality bonus for the unusually clean calibration set." }
        ]
      : [
          { key: "clean", text: "You completed the assigned calibration sweep and returned a clean, dependable navigation data set." },
          { key: "routine", text: "The assigned sweep was completed without surprises. The calibration set met the survey office's requirements." }
        ];
    const outcome = variedMissionOutcome(action, outcomes);
    if (outcome.credits) state.credits += outcome.credits;
    return finishOperatorMission(outcome.text);
  }

  if (action === "missionScienceWide" && contract.kind === "science") {
    closeMissionDialog();
    const outcomes = state.ship.sensors >= 5
      ? [
          { key: "research", credits: 140, text: "The wider sweep resolved useful secondary survey data. Pelagos added a 140-credit research bonus." },
          { key: "standing", reputation: 1, text: "The wider sweep identified a navigation anomaly worth follow-up. The survey office credited your thorough work with additional operator standing." },
          { key: "quiet", text: "The wider sweep was thorough but found nothing beyond the assigned calibration targets. The contract still closed successfully." }
        ]
      : [
          { key: "inconclusive", text: "The wider sweep found interesting but inconclusive returns. You completed the calibration, but the extra signals did not resolve cleanly." },
          { key: "minor", credits: 60, text: "The wider sweep produced a small amount of usable secondary data. Pelagos added a 60-credit research supplement." }
        ];
    const outcome = variedMissionOutcome(action, outcomes);
    if (outcome.credits) state.credits += outcome.credits;
    if (outcome.reputation) state.reputation += outcome.reputation;
    return finishOperatorMission(outcome.text);
  }

  if (action === "missionMiningStable" && contract.kind === "mining") {
    closeMissionDialog();
    if ((state.ship.cargoCapacity - cargoUsed()) < 2) {
      addLog("The stable seam still requires two free cargo spaces.");
      return render();
    }
    const outcome = variedMissionOutcome(action, [
      { key: "normal", ore: 2, text: "You worked the stable seam cleanly and kept 2 units of processed ore as your material share." },
      { key: "clean-cut", ore: 2, credits: 45, text: "The stable seam cut unusually cleanly. You kept 2 units of processed ore and the cooperative added a 45-credit efficiency premium." }
    ]);
    state.cargo.ore = (state.cargo.ore || 0) + outcome.ore;
    if (outcome.credits) state.credits += outcome.credits;
    return finishOperatorMission(outcome.text);
  }

  if (action === "missionMiningDense" && contract.kind === "mining") {
    closeMissionDialog();
    if ((state.ship.cargoCapacity - cargoUsed()) < 3) {
      addLog("The denser pocket could yield three units, but you need three free cargo spaces before attempting it.");
      return render();
    }
    const outcome = variedMissionOutcome(action, [
      { key: "rich", ore: 3, damage: 2, text: "The dense pocket held together long enough for a strong cut." },
      { key: "rough", ore: 3, damage: 5, text: "The dense pocket paid out, but the extraction was rough on the ship." },
      { key: "shifted", ore: 2, damage: 3, text: "The seam shifted during extraction. You secured less material than expected before pulling clear." }
    ]);
    state.cargo.ore = (state.cargo.ore || 0) + outcome.ore;
    const damage = typeof applyHullDamage === "function" ? applyHullDamage(outcome.damage) : outcome.damage;
    if (typeof applyHullDamage !== "function") state.ship.hull = Math.max(1, state.ship.hull - damage);
    return finishOperatorMission(`${outcome.text} You kept ${outcome.ore} units of processed ore and lost ${damage}% hull integrity.`);
  }

  if (action === "missionTransportFast" && contract.kind === "transport") {
    closeMissionDialog();
    const outcome = variedMissionOutcome(action, [
      { key: "premium", credits: 75, text: "You used the expedited sealed handoff. Port security added a 75-credit handling premium and the transfer closed quickly." },
      { key: "small-premium", credits: 40, text: "The expedited handoff cleared quickly, though staffing limits reduced the handling premium to 40 credits." },
      { key: "routine", text: "The expedited handoff cleared without delay, but no additional handling premium was authorized this time." }
    ]);
    if (outcome.credits) state.credits += outcome.credits;
    return finishOperatorMission(outcome.text);
  }

  if (action === "missionTransportDocumented" && contract.kind === "transport") {
    closeMissionDialog();
    const outcome = variedMissionOutcome(action, [
      { key: "standing", reputation: 1, text: "You stayed through the documented transfer. The independent record proved useful, and your careful handling earned additional operator standing." },
      { key: "stipend", credits: 55, text: "You stayed through the documented transfer. The paperwork took longer, but the receiving office authorized a 55-credit witness stipend." },
      { key: "routine", text: "You stayed through the documented transfer. Everything checked out normally; the value this time was a clean independent record rather than an extra reward." }
    ]);
    if (outcome.credits) state.credits += outcome.credits;
    if (outcome.reputation) state.reputation += outcome.reputation;
    return finishOperatorMission(outcome.text);
  }

  if (action === "missionSalvageRecorder" && contract.kind === "salvage") {
    closeMissionDialog();
    const outcome = variedMissionOutcome(action, [
      { key: "clean", text: "You recovered the contracted flight recorder intact and left the debris field without taking unnecessary risks." },
      { key: "quick", credits: 45, text: "The recorder came free cleanly and ahead of schedule. The recovery office added a 45-credit handling bonus." }
    ]);
    if (outcome.credits) state.credits += outcome.credits;
    return finishOperatorMission(outcome.text);
  }

  if (action === "missionSalvageSearch" && contract.kind === "salvage") {
    closeMissionDialog();
    const freeCargo = state.ship.cargoCapacity - cargoUsed();
    let outcomes;
    if (state.ship.sensors >= 4 && freeCargo >= 2) {
      outcomes = [
        { key: "parts", cargo: 1, text: "Your sensors isolated a serviceable component among the debris. You recovered it along with the contracted recorder." },
        { key: "empty", text: "The extra sweep found several promising returns, but none proved worth taking aboard. You completed the recorder recovery without damage." },
        { key: "impact", damage: 2, text: "A tumbling fragment crossed the search pattern before you could fully clear the field." }
      ];
    } else if (state.ship.sensors >= 4) {
      outcomes = [
        { key: "marked", text: "Your sensors found a serviceable component, but the hold had no room beyond the recorder. You marked its coordinates and completed the contracted recovery." },
        { key: "empty", text: "The extra sweep found nothing with a clean enough claim or recovery path to justify staying longer." }
      ];
    } else {
      outcomes = [
        { key: "empty", text: "The weak returns never resolved into anything worth recovering. You completed the recorder job and left the field." },
        { key: "impact", damage: 4, text: "The weak sensors made the debris search slow and close, and a minor impact caught the ship before you withdrew." }
      ];
    }
    const outcome = variedMissionOutcome(action, outcomes);
    if (outcome.cargo) state.cargo.machineParts = (state.cargo.machineParts || 0) + outcome.cargo;
    if (outcome.damage) {
      const damage = typeof applyHullDamage === "function" ? applyHullDamage(outcome.damage) : outcome.damage;
      if (typeof applyHullDamage !== "function") state.ship.hull = Math.max(1, state.ship.hull - damage);
      return finishOperatorMission(`${outcome.text} The impact cost ${damage}% hull integrity; the recorder was still recovered.`);
    }
    return finishOperatorMission(outcome.text);
  }

  return resolveEncounterBeforeContractVariety(action);
};

ensureContractVarietyState();
syncContractVarietyPools();
saveState();

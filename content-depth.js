// Haven's Reach — Content Depth Pass #1
// Expands the content space inside already-proven systems without adding new architecture.
// Adds handcrafted contract work, one additional special mission per career family,
// one additional opportunity per named NPC, one encounter per travel family, and
// rotating cantina rumor/news text. Existing economy, navigation, progression and saves remain authoritative.

// ---------- Ordinary contract depth ----------

const CONTENT_DEPTH_CONTRACTS = {
  haven: [
    { id: "haven-pump-parts", title: "Mine Pump Components", destination: "meridian", reward: 250, cargo: { machineParts: 1 }, rep: 1, text: "A Meridian rebuilder is buying worn Haven pump assemblies for refurbishment and parts recovery." },
    { id: "haven-family-parcels", title: "Frontier Family Parcels", destination: "prospect", reward: 390, cargo: {}, rep: 1, text: "Carry a consolidated packet of family parcels and recorded messages from Haven to workers at Prospect Reach." }
  ],
  meridian: [
    { id: "meridian-canteen-stock", title: "Canteen Restock", destination: "prospect", reward: 335, cargo: { food: 2 }, rep: 1, text: "Prospect's main canteen is short on packaged staples after a delayed supply run." },
    { id: "meridian-yard-invoices", title: "Freight Yard Accounts", destination: "caldersDrift", reward: 545, cargo: {}, rep: 1, text: "Carry signed freight-yard invoices outward to Calder's Drift for reconciliation with independent haulers." }
  ],
  prospect: [
    { id: "prospect-clinic-return", title: "Clinic Returns", destination: "haven", reward: 300, cargo: {}, rep: 1, text: "Return sealed treatment records and empty medical containers from Prospect's clinic to Haven." },
    { id: "prospect-relay-spares", title: "Relay Spare Set", destination: "caldersDrift", reward: 405, cargo: { machineParts: 1 }, rep: 1, text: "A navigation crew at Calder's Drift needs a compact set of relay spares before its next maintenance pass." }
  ],
  caldersDrift: [
    { id: "calder-crew-mail", title: "Outer Crew Mail", destination: "redMesa", reward: 385, cargo: {}, rep: 1, text: "Carry accumulated personal mail and maintenance notices from Calder's crews to Red Mesa Junction." },
    { id: "calder-med-locker", title: "Emergency Locker Refill", destination: "prospect", reward: 455, cargo: { medicine: 1 }, rep: 1, text: "Prospect Reach is replenishing emergency medical lockers after several frontier callouts." }
  ],
  redMesa: [
    { id: "mesa-assay-samples", title: "Assay Sample Shipment", destination: "meridian", reward: 715, cargo: { ore: 2 }, rep: 1, text: "A Meridian materials house wants representative Red Mesa ore samples for an independent assay." },
    { id: "mesa-survey-brackets", title: "Survey Mounting Brackets", destination: "pelagos", reward: 565, cargo: { machineParts: 1 }, rep: 1, text: "Pelagos needs Kharok-built mounting hardware for a new batch of exterior survey instruments." }
  ],
  pelagos: [
    { id: "pelagos-medical-notes", title: "Remote Medical Notes", destination: "prospect", reward: 735, cargo: {}, rep: 1, text: "Carry encrypted medical observations from Pelagos inward for review by Prospect's frontier clinic." },
    { id: "pelagos-instrument-cases", title: "Instrument Cases", destination: "meridian", reward: 910, cargo: { machineParts: 1 }, rep: 2, text: "Return damaged survey-instrument cases to Meridian for rebuilding and recertification." }
  ]
};

Object.entries(CONTENT_DEPTH_CONTRACTS).forEach(([systemId, contracts]) => {
  const additions = typeof CONTRACT_VARIETY_ADDITIONS !== "undefined" ? CONTRACT_VARIETY_ADDITIONS[systemId] : null;
  contracts.forEach(contract => {
    if (Array.isArray(additions) && !additions.some(item => item.id === contract.id)) additions.push(contract);
    const board = GAME_DATA.systems[systemId]?.contracts;
    if (Array.isArray(board) && !board.some(item => item.id === contract.id)) board.push(contract);
  });
});

// ---------- Special mission depth ----------

const CONTENT_DEPTH_MISSIONS = [
  {
    system: "prospect",
    contract: {
      id: "science-magnetic-drift",
      title: "Magnetic Drift Survey",
      destination: "pelagos",
      reward: 790,
      cargo: {},
      rep: 2,
      kind: "science",
      kindLabel: "Scientific Survey",
      minSensors: 3,
      text: "Pelagos has requested an independent comparison pass through a region of inconsistent magnetic readings. Better sensors make the secondary returns more useful.",
      actionLabel: "Run Magnetic Survey"
    }
  },
  {
    system: "meridian",
    contract: {
      id: "mining-independent-assay-cut",
      title: "Independent Assay Cut",
      destination: "redMesa",
      reward: 700,
      cargo: {},
      rep: 1,
      kind: "mining",
      kindLabel: "Mining / Extraction",
      minFreeCargo: 2,
      text: "A Meridian buyer has funded a short independent extraction slot at Red Mesa so the resulting ore can be compared with cooperative production samples.",
      actionLabel: "Work Assay Cut"
    }
  },
  {
    system: "haven",
    contract: {
      id: "security-auditor-meridian",
      title: "Protected Auditor Transfer",
      destination: "meridian",
      reward: 625,
      cargo: {},
      rep: 2,
      kind: "transport",
      kindLabel: "Secure Transport",
      minReputation: 1,
      text: "A contract auditor needs discreet passage from Haven to Meridian after documenting irregular freight billing. No violence is expected, but the receiving record matters.",
      actionLabel: "Complete Protected Transfer"
    }
  },
  {
    system: "caldersDrift",
    contract: {
      id: "salvage-prospect-beacon-array",
      title: "Beacon Array Recovery",
      destination: "prospect",
      reward: 610,
      cargo: {},
      rep: 1,
      kind: "salvage",
      kindLabel: "Salvage / Recovery",
      minSensors: 2,
      minFreeCargo: 1,
      text: "Recover the data recorder from a failed maintenance array near Prospect's outer approach. Debris from the support frame is still drifting nearby.",
      actionLabel: "Recover Beacon Recorder"
    }
  }
];

CONTENT_DEPTH_MISSIONS.forEach(({ system, contract }) => {
  const board = GAME_DATA.systems[system]?.contracts;
  if (Array.isArray(board) && !board.some(item => item.id === contract.id)) board.push(contract);
});

const CONTENT_DEPTH_MISSION_IDS = new Set(CONTENT_DEPTH_MISSIONS.map(entry => entry.contract.id));
const performOperatorMissionBeforeContentDepth = performOperatorMission;
performOperatorMission = function performContentDepthMission() {
  const contract = state.activeContract;
  if (!contract || !CONTENT_DEPTH_MISSION_IDS.has(contract.id) || contract.destination !== state.location || !contract.missionReady) {
    return performOperatorMissionBeforeContentDepth();
  }

  if (contract.kind === "science") {
    return openMissionChoice(
      contract.title,
      "The comparison corridor is stable enough for the required pass, but several weaker magnetic returns sit outside the clean survey line. You can stay disciplined or spend more time resolving the secondary pattern.",
      [
        { label: "Run the controlled comparison", action: "missionSciencePrecision" },
        { label: "Chase the secondary returns", action: "missionScienceWide" }
      ]
    );
  }

  if (contract.kind === "mining") {
    if ((state.ship.cargoCapacity - cargoUsed()) < 2) {
      addLog("The assay cut needs two free cargo spaces for recovered ore.");
      return render();
    }
    return openMissionChoice(
      contract.title,
      "The marked cut contains a dependable ordinary seam and a denser branch running close to unstable rock. The buyer wants representative ore, but you decide how aggressively to work the site.",
      [
        { label: "Take the stable sample", action: "missionMiningStable" },
        { label: "Follow the denser branch", action: "missionMiningDense" }
      ]
    );
  }

  if (contract.kind === "transport") {
    return openMissionChoice(
      contract.title,
      "Meridian's receiving office can close the transfer through an expedited secure entrance, while the auditor prefers that you remain through the slower documented handoff so there is an independent record of arrival.",
      [
        { label: "Use the expedited secure handoff", action: "missionTransportFast" },
        { label: "Stay through the documented handoff", action: "missionTransportDocumented" }
      ]
    );
  }

  if (contract.kind === "salvage") {
    if ((state.ship.cargoCapacity - cargoUsed()) < 1) {
      addLog("You need one free cargo space to recover the beacon recorder.");
      return render();
    }
    return openMissionChoice(
      contract.title,
      "The recorder is transmitting from the edge of the failed array. You can recover the contracted unit immediately or widen the search through drifting support debris for anything else with a clean recovery path.",
      [
        { label: "Recover the recorder and leave", action: "missionSalvageRecorder" },
        { label: "Search the support debris", action: "missionSalvageSearch" }
      ]
    );
  }

  return performOperatorMissionBeforeContentDepth();
};

// ---------- NPC opportunity depth ----------

const CONTENT_DEPTH_NPC_TYPES = {
  mara: "yardCheck",
  seli: "clientPulse",
  lena: "freightAssist",
  orin: "beaconAudit",
  draak: "loadTest",
  saeli: "spectralReview"
};

Object.entries(CONTENT_DEPTH_NPC_TYPES).forEach(([id, type]) => {
  const profile = NPC_OPPORTUNITY_PROFILES[id];
  if (profile && !profile.types.includes(type)) profile.types.push(type);
});

const opportunityTextBeforeContentDepth = opportunityText;
opportunityText = function opportunityTextWithContentDepth(id, type) {
  const npc = NPC_DATA[id];
  const relation = npcRelationshipLabel(state.npcs[id].relationship);
  const texts = {
    yardCheck: `${npc.name} has a few minutes between yard jobs and offers a practical look at how your ship is wearing under real freight work.`,
    clientPulse: `${npc.name} has a client-side read on where commercial demand is tightening and offers to compare it with the markets you already know.`,
    freightAssist: `${npc.name} is helping another independent crew clear a small freight problem and asks whether you can contribute a modest amount toward the fix.`,
    beaconAudit: `${npc.name} wants to compare a short navigation-beacon sample against your ship's current sensor baseline.`,
    loadTest: `${npc.name} has a Kharok freight calibration rig available and offers to test how cleanly your current chassis handles dense loads.`,
    spectralReview: `${npc.name} has a faint survey return that is not worth a formal mission, but your sensor readings could help decide whether the signal deserves another look.`
  };
  if (!texts[type]) return opportunityTextBeforeContentDepth(id, type);
  return `${texts[type]}\n\nCurrent relationship: ${relation}.`;
};

const opportunityChoicesBeforeContentDepth = opportunityChoices;
opportunityChoices = function opportunityChoicesWithContentDepth(id, type) {
  const labels = {
    yardCheck: "Let Mara inspect the wear pattern",
    clientPulse: "Compare commercial demand notes",
    freightAssist: "Contribute 55 credits",
    beaconAudit: "Run the beacon comparison",
    loadTest: "Run the freight calibration",
    spectralReview: "Compare the spectral return"
  };
  if (!labels[type]) return opportunityChoicesBeforeContentDepth(id, type);
  return [
    { label: labels[type], action: `npcDepth:${id}` },
    { label: "Not right now", action: `npcOppDecline:${id}` }
  ];
};

function finishContentDepthNpc(id, memoryKey, relationship, log) {
  finishNpcOpportunity(id, memoryKey, relationship);
  addLog(log);
  saveState();
  if (el("encounterDialog").open) el("encounterDialog").close();
  render();
}

// ---------- Travel encounter depth ----------

RICH_ENCOUNTERS.pirates.push({
  title: "Disputed Salvage Claim",
  text: "A rough salvage cutter claims the cargo lane crosses a recovery zone their crew has staked. They demand a fee to pass without 'interfering with operations.'",
  choices: [
    { label: "Challenge the claim on the open channel", action: "depthPirateChallenge" },
    { label: "Pay an 80-credit nuisance fee", action: "depthPirateFee" },
    { label: "Break away under power", action: "depthPirateBurn" }
  ]
});

RICH_ENCOUNTERS.inspection.push({
  title: "Freight Seal Audit",
  text: "A port-control cutter is running a targeted seal audit after several damaged freight containers were reported on the route.",
  choices: [
    { label: "Submit to the seal audit", action: "depthAuditComply" },
    { label: "Request record-based clearance", action: "depthAuditRecord" }
  ]
});

RICH_ENCOUNTERS.distress.push({
  title: "Fuel-Starved Prospector",
  text: "A small prospecting vessel is drifting below safe reserves after a bad route estimate. The pilot asks for enough help to reach the next maintained lane.",
  choices: [
    { label: "Transfer 10 fuel", action: "depthProspectorFuel" },
    { label: "Offer one unit of Machine Parts", action: "depthProspectorParts" },
    { label: "Send a corrected route solution", action: "depthProspectorRoute" }
  ]
});

RICH_ENCOUNTERS.failure.push({
  title: "Cargo Clamp Failure",
  text: "A hold alarm reports that one cargo restraint has partially released during transit. Nothing is lost yet, but the load needs attention before the next hard maneuver.",
  choices: [
    { label: "Stop and secure the clamp", action: "depthClampSecure" },
    { label: "Use sensors to monitor the load", action: "depthClampMonitor" },
    { label: "Keep moving and trust the restraint", action: "depthClampRisk" }
  ]
});

function contentDepthDamage(raw) {
  if (typeof applyHullDamage === "function") return applyHullDamage(raw);
  state.ship.hull = Math.max(1, state.ship.hull - raw);
  return raw;
}

const resolveEncounterBeforeContentDepth = resolveEncounter;
resolveEncounter = function resolveEncounterWithContentDepth(action) {
  if (action.startsWith("npcDepth:")) {
    const id = action.split(":")[1];
    if (!NPC_DATA[id] || !state.npcs[id]) return resolveEncounterBeforeContentDepth(action);

    if (id === "mara") {
      if (state.ship.hull < 100) {
        const restored = Math.min(2, 100 - state.ship.hull);
        state.ship.hull += restored;
        return finishContentDepthNpc(id, "yardChecks", 1, `Mara traces two small wear points before they become real problems and helps restore ${restored}% hull integrity.`);
      }
      return finishContentDepthNpc(id, "yardChecks", 1, "Mara finds the ship in clean working order and points out where freight vibration usually starts causing trouble. The inspection costs nothing and the advice is worth remembering.");
    }

    if (id === "seli") {
      const lead = bestNpcMarketLead(id);
      const detail = lead ? `${GAME_DATA.commodities[lead.goodId].name} around ${GAME_DATA.systems[lead.systemId].name} is drawing unusually strong buyer attention.` : "Commercial demand is scattered enough that no single commodity stands out today.";
      return finishContentDepthNpc(id, "clientPulse", 1, `Seli compares several client inquiries against current traffic. ${detail}`);
    }

    if (id === "lena") {
      if (state.credits < 55) {
        addLog("You cannot spare 55 credits for the freight repair right now.");
        if (el("encounterDialog").open) el("encounterDialog").close();
        return render();
      }
      state.credits -= 55;
      return finishContentDepthNpc(id, "helpedFreighter", 1, "Lena routes your 55-credit contribution to a stranded independent crew. It is not glamorous work, but she remembers who helps keep other operators moving.");
    }

    if (id === "orin") {
      const reward = state.ship.sensors >= 4 ? 105 : 50;
      state.credits += reward;
      const rep = state.ship.sensors >= 4 ? 1 : 0;
      state.reputation += rep;
      return finishContentDepthNpc(id, "beaconAudits", 1, state.ship.sensors >= 4
        ? `Orin finds your beacon comparison precise enough to use in his route notes. He pays ${credits(reward)}, and the clean work improves your standing.`
        : `Orin can use the broad comparison even though your sensors cannot resolve the finer drift. He pays ${credits(reward)} for the useful baseline.`);
    }

    if (id === "draak") {
      const strongFreighter = state.ship.hullStrength >= 3 || state.ship.cargoCapacity >= 12;
      const reward = strongFreighter ? 110 : 55;
      state.credits += reward;
      return finishContentDepthNpc(id, "loadTests", 1, strongFreighter
        ? `Draak's calibration rig confirms that ${state.ship.name} handles dense freight cleanly. He pays ${credits(reward)} for the useful load data and approves of the ship's working margins.`
        : `Draak's rig finds the ship serviceable but lightly built for dense freight. He pays ${credits(reward)} for the test data and tells you exactly where the limits begin.`);
    }

    if (id === "saeli") {
      const strongSensors = state.ship.sensors >= 5;
      const reward = strongSensors ? 120 : 45;
      state.credits += reward;
      if (strongSensors) state.reputation += 1;
      return finishContentDepthNpc(id, "spectralReviews", 1, strongSensors
        ? `Saeli resolves the faint return against your high-grade readings and pays ${credits(reward)} for a genuinely useful comparison. The quality of the observation improves your survey standing.`
        : `Your readings narrow the possibilities without resolving the signal. Saeli pays ${credits(reward)} for the comparison and marks the return for better-equipped traffic.`);
    }
  }

  const closeAndRender = () => {
    if (typeof activeRichEncounter !== "undefined") activeRichEncounter = null;
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
  };

  if (action === "depthPirateChallenge") {
    if (state.reputation >= 5) addLog("You challenged the salvage claim over the open channel. Other traffic backed your reading of the lane, and the cutter withdrew rather than defend a dubious claim publicly.");
    else {
      const fee = Math.min(45, state.credits);
      state.credits -= fee;
      addLog(`The claim was questionable, but your name carried little weight on the channel. You negotiated the nuisance fee down to ${credits(fee)} and continued.`);
    }
    return closeAndRender();
  }
  if (action === "depthPirateFee") {
    const fee = Math.min(80, state.credits);
    state.credits -= fee;
    addLog(`You paid ${credits(fee)} to end the argument and kept moving.`);
    return closeAndRender();
  }
  if (action === "depthPirateBurn") {
    const chance = Math.min(0.9, 0.4 + state.ship.engine * 0.14);
    if (Math.random() < chance) addLog("You accelerated out of the disputed zone before the salvage cutter could keep pace.");
    else {
      const damage = contentDepthDamage(9);
      addLog(`You broke away, but a hurried maneuver through scattered salvage cost ${damage}% hull integrity.`);
    }
    return closeAndRender();
  }
  if (action === "depthAuditComply") {
    addLog("The freight seals checked cleanly and port control released you without charge.");
    return closeAndRender();
  }
  if (action === "depthAuditRecord") {
    if (state.reputation >= 4) addLog("Your operator record was strong enough for remote verification. Port control cleared the seals without stopping you for the physical audit.");
    else {
      const fee = Math.min(30, state.credits);
      state.credits -= fee;
      addLog(`Your record was not established enough for a waiver, but expedited verification was available for ${credits(fee)}.`);
    }
    return closeAndRender();
  }
  if (action === "depthProspectorFuel") {
    if (state.ship.fuel >= 10) {
      state.ship.fuel -= 10;
      state.reputation += 1;
      addLog("You transferred 10 fuel and gave the prospector enough reserve to reach the maintained lane. The pilot promised to pass your name along.");
    } else addLog("You do not have 10 fuel available to transfer safely.");
    return closeAndRender();
  }
  if (action === "depthProspectorParts") {
    if ((state.cargo.machineParts || 0) >= 1) {
      state.cargo.machineParts -= 1;
      if (!state.cargo.machineParts) delete state.cargo.machineParts;
      state.reputation += 1;
      addLog("The prospector used your Machine Parts to stabilize a failing fuel regulator and resumed course under their own power.");
    } else addLog("You do not have Machine Parts aboard to offer.");
    return closeAndRender();
  }
  if (action === "depthProspectorRoute") {
    if (state.ship.sensors >= 3) {
      state.credits += 65;
      addLog("Your sensor solution found a lower-burn route back to maintained traffic. The grateful pilot transferred 65 credits for the navigation help.");
    } else addLog("Your navigation solution reduced the uncertainty, but your sensors could not produce a route the prospector was willing to trust on low reserves.");
    return closeAndRender();
  }
  if (action === "depthClampSecure") {
    const cost = Math.min(25, state.credits);
    state.credits -= cost;
    addLog(`You stopped long enough to secure the failed clamp with ${credits(cost)} in replacement hardware.`);
    return closeAndRender();
  }
  if (action === "depthClampMonitor") {
    if (state.ship.sensors >= 3) addLog("Your sensors tracked the shifting load closely enough to keep it inside safe limits until arrival.");
    else {
      const damage = contentDepthDamage(3);
      addLog(`The sensors could not track the load precisely. Nothing was lost, but the shifting restraint cost ${damage}% hull integrity before you stabilized it.`);
    }
    return closeAndRender();
  }
  if (action === "depthClampRisk") {
    if (Math.random() < 0.55) addLog("The weakened clamp held for the rest of the run. You reached port without spending time or money on it.");
    else {
      const cargoId = Object.keys(state.cargo)[0];
      if (cargoId) {
        state.cargo[cargoId] -= 1;
        if (!state.cargo[cargoId]) delete state.cargo[cargoId];
        addLog(`The restraint let go during a course correction. One unit of ${GAME_DATA.commodities[cargoId]?.name || "cargo"} was damaged beyond use.`);
      } else {
        const damage = contentDepthDamage(4);
        addLog(`The empty restraint slammed against the hold structure and cost ${damage}% hull integrity.`);
      }
    }
    return closeAndRender();
  }

  return resolveEncounterBeforeContentDepth(action);
};

// ---------- Cantina rumor/news depth ----------

const CONTENT_DEPTH_CANTINA = {
  haven: {
    rumors: [
      "A retired loader swears two small mine crews are pooling repair purchases instead of waiting for company stores to reopen.",
      "Someone at the next table says younger Haven mechanics are taking short contracts offworld and coming back with enough credits to keep family workshops alive."
    ],
    news: [
      "HAVEN CIVIC WIRE — Freight-yard employment held steady this cycle despite another decline in deep-mine output. Independent repair shops reported a modest increase in outside work.",
      "HAVEN CIVIC WIRE — The southern cargo district approved temporary berth discounts for independent haulers carrying food, medicine, and industrial replacement parts."
    ]
  },
  meridian: {
    rumors: [
      "A Veylan broker says several frontier buyers have stopped asking for the cheapest freight and started paying for operators who actually arrive when they say they will.",
      "Two couriers are comparing notes about Red Mesa orders. The numbers differ, but both agree that ordinary machine hardware is moving outward faster than usual."
    ],
    news: [
      "MERIDIAN TRADE SERVICE — Exchange traffic rose modestly as independent frontier freight displaced several delayed bulk shipments.",
      "MERIDIAN TRADE SERVICE — Commercial inspectors announced a review of freight-seal standards after a run of damaged containers on outer routes."
    ]
  },
  prospect: {
    rumors: [
      "A salvage crew claims Calder traffic is getting regular enough that the old distinction between 'charted route' and 'somewhere people go' is disappearing.",
      "A clinic worker complains that Prospect never seems short on the same thing twice, only that something useful is always arriving one ship later than needed."
    ],
    news: [
      "FRONTIER RELAY — Prospect Reach commissioned another modular storage bay to handle the increase in independent freight moving through the colony.",
      "FRONTIER RELAY — Survey authorities asked operators to report damaged or inconsistent approach beacons rather than assuming maintenance crews have already logged them."
    ]
  },
  caldersDrift: {
    rumors: [
      "A navigation tech says half of Calder's value is not where it is, but that everybody going farther out eventually needs something checked here.",
      "A Red Mesa captain says the shortest profitable run is not always the best one; some of the quietest contracts are paying for reliability rather than distance."
    ],
    news: [
      "CALDER TRAFFIC NOTICE — Maintenance crews restored two aging relay nodes and asked operators to continue reporting intermittent beacon drift.",
      "FRONTIER RELAY — Independent freight through Calder's Drift reached another local high, with most growth tied to Red Mesa industrial traffic."
    ]
  },
  redMesa: {
    rumors: [
      "A Kharok shift boss says ore is easy; keeping drills, loaders, clinics, and kitchens supplied is where dependable operators make themselves useful.",
      "Someone near the transfer board is looking for a hauler with enough hold space to stop treating dense freight like a special occasion."
    ],
    news: [
      "KHAROK INDUSTRIAL WIRE — Red Mesa cooperatives reported strong extraction output and another increase in imported maintenance components.",
      "KHAROK INDUSTRIAL WIRE — Junction engineers completed reinforcement work on two heavy-freight berths used primarily by independent haulers."
    ]
  },
  pelagos: {
    rumors: [
      "An Elyri scout says the interesting signals are rarely the loud ones; the useful question is whether the same faint return is still there when somebody checks again.",
      "A survey crew quietly admits that half its work consists of proving that an exciting reading was only bad instrumentation. They sound proud of that, not disappointed."
    ],
    news: [
      "ELYRI SURVEY SERVICE — Pelagos completed another calibration exchange with independent operators traveling the inner frontier corridor.",
      "ELYRI SURVEY SERVICE — Long-range teams reported several repeatable outer signals, but no new route has yet met the service's standard for ordinary navigation."
    ]
  }
};

function contentDepthCantinaLine(location, kind, original) {
  const extras = CONTENT_DEPTH_CANTINA[location]?.[kind] || [];
  const pool = [original, ...extras].filter(Boolean);
  if (!pool.length) return original || "";
  const trip = Number.isFinite(state.tripCount) ? state.tripCount : 0;
  const hash = [...location].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return pool[(trip + hash + (kind === "news" ? 1 : 0)) % pool.length];
}

const renderCantinaBeforeContentDepth = renderCantina;
renderCantina = function renderCantinaWithContentDepth() {
  renderCantinaBeforeContentDepth();
  const place = CANTINA_DATA[state.location];
  if (!place) return;

  const cards = Array.from(view.querySelectorAll('.info-card'));
  const rumorCard = cards.find(card => card.querySelector('h3')?.textContent === "Rumor Board");
  const newsCard = cards.find(card => card.querySelector('h3')?.textContent === "News Feed");
  const rumorP = rumorCard?.querySelector('p');
  const newsP = newsCard?.querySelector('p');
  if (rumorP) rumorP.textContent = contentDepthCantinaLine(state.location, "rumors", place.rumor);
  if (newsP) newsP.textContent = contentDepthCantinaLine(state.location, "news", place.news);
};

// Reconcile content pools immediately for existing saves.
if (typeof syncContractVarietyPools === "function") syncContractVarietyPools();
ensureNpcOpportunityState();
saveState();

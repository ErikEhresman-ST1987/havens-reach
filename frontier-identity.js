// Haven's Reach — World Expansion #1 content completion
// Gives each new frontier system one persistent NPC and one unique local upgrade.
// Reuses the existing NPC and ship-upgrade systems; no new simulation layer.

Object.assign(NPC_DATA, {
  orin: {
    name: "Orin Vale",
    role: "Navigation Surveyor",
    location: "caldersDrift",
    intro: "Orin Vale is an independent navigation surveyor who helped turn scattered beacon reports into reliable routes around Calder's Drift. He treats good coordinates like other people treat money."
  },
  draak: {
    name: "Draak Tor",
    role: "Kharok Systems Engineer",
    location: "redMesa",
    intro: "Draak Tor supervises heavy freight systems at Red Mesa Junction. The Kharok engineer speaks in short practical sentences and has little patience for equipment that fails under honest work."
  },
  saeli: {
    name: "Saeli Ren",
    role: "Elyri Survey Coordinator",
    location: "pelagos",
    intro: "Saeli Ren coordinates long-range survey traffic from Pelagos. The Elyri navigator is quiet, observant, and more interested in what an operator notices than how impressively they describe it."
  }
});

GAME_DATA.upgrades.push(
  {
    id: "calder-nav-suite",
    name: "Long-Range Navigation Suite",
    cost: 1050,
    location: "caldersDrift",
    text: "+1 sensor and +10 fuel capacity. Calder-built navigation hardware for operators pushing beyond routine lanes.",
    apply: state => {
      state.ship.sensors += 1;
      state.ship.fuelCapacity += 10;
      state.ship.fuel += 10;
    }
  },
  {
    id: "mesa-industrial-rigging",
    name: "Industrial Cargo Rigging",
    cost: 1150,
    location: "redMesa",
    text: "+5 cargo capacity. Kharok freight bracing designed for dense industrial loads and rough handling.",
    apply: state => state.ship.cargoCapacity += 5
  },
  {
    id: "pelagos-deep-survey",
    name: "Deep Survey Sensor Suite",
    cost: 1300,
    location: "pelagos",
    text: "+3 sensor rating. Elyri long-range instrumentation intended for faint signals and uncertain frontier routes.",
    apply: state => state.ship.sensors += 3
  }
);

const baseNpcCallbackTextFrontier = npcCallbackText;
npcCallbackText = function(id) {
  ensureNpcState();
  const npcState = state.npcs[id];
  if (!npcState) return baseNpcCallbackTextFrontier(id);
  if (!npcState.met) return "You have not spoken yet.";

  if (id === "orin") {
    if (npcState.memory.sharedBeaconNotes) return "Orin remembers that you compared your Outer Beacon notes with his survey records instead of treating the information as private property.";
    if (npcState.memory.askedForWork) return "Orin knows you are interested in routes that lead somewhere useful, not exploration for its own sake.";
  }

  if (id === "draak") {
    if (npcState.memory.respectsMaintenance) return "Draak remembers that you asked what keeps frontier ships alive rather than what makes them impressive.";
    if (npcState.memory.focusedOnProfit) return "Draak understands that you judge equipment by whether it earns its keep.";
  }

  if (id === "saeli") {
    if (npcState.memory.valuesObservation) return "Saeli remembers that you were more interested in what survey crews were learning than in claiming expertise you did not have.";
    if (npcState.memory.wantsRoutes) return "Saeli knows you are looking for dependable routes and practical opportunities farther out.";
  }

  return baseNpcCallbackTextFrontier(id);
};

const baseOpenNpcInteractionFrontier = openNpcInteraction;
openNpcInteraction = function(id) {
  ensureNpcState();
  const npc = NPC_DATA[id];
  const npcState = state.npcs[id];
  if (!npc || !npcState) return;

  const frontierChoices = {
    orin: [
      { label: "Compare your Outer Beacon notes", action: "npcOrinBeacon" },
      { label: "Ask which routes actually pay", action: "npcOrinWork" }
    ],
    draak: [
      { label: "Ask what keeps frontier ships alive", action: "npcDraakMaintenance" },
      { label: "Ask which upgrades earn their keep", action: "npcDraakProfit" }
    ],
    saeli: [
      { label: "Ask what the survey crews are learning", action: "npcSaeliObserve" },
      { label: "Ask about dependable routes farther out", action: "npcSaeliRoutes" }
    ]
  };

  if (!frontierChoices[id]) return baseOpenNpcInteractionFrontier(id);

  el("encounterTitle").textContent = `${npc.name} — ${npc.role}`;
  if (!npcState.met) {
    el("encounterText").textContent = npc.intro;
    el("encounterChoices").innerHTML = frontierChoices[id]
      .map(choice => `<button class="secondary" type="button" onclick="resolveEncounter('${choice.action}')">${escapeHtml(choice.label)}</button>`)
      .join("");
  } else {
    el("encounterText").textContent = npcCallbackText(id);
    el("encounterChoices").innerHTML = `<button class="secondary" type="button" onclick="resolveEncounter('npcClose')">Continue</button>`;
  }
  el("encounterDialog").showModal();
};

const baseResolveEncounterFrontier = resolveEncounter;
resolveEncounter = function(action) {
  ensureNpcState();
  const orin = state.npcs.orin;
  const draak = state.npcs.draak;
  const saeli = state.npcs.saeli;

  const actions = {
    npcOrinBeacon() {
      orin.met = true;
      orin.relationship += 1;
      orin.memory.sharedBeaconNotes = true;
      addLog("You compared your Outer Beacon notes with Orin Vale's survey records. He marked you as an operator willing to exchange useful navigation data.");
    },
    npcOrinWork() {
      orin.met = true;
      orin.memory.askedForWork = true;
      addLog("Orin Vale pointed out that the best frontier routes are usually the ones somebody needs maintained, supplied, or checked twice.");
    },
    npcDraakMaintenance() {
      draak.met = true;
      draak.relationship += 1;
      draak.memory.respectsMaintenance = true;
      addLog("Draak Tor approved of the question. He says frontier ships survive because operators repair small problems before they become expensive ones.");
    },
    npcDraakProfit() {
      draak.met = true;
      draak.memory.focusedOnProfit = true;
      addLog("Draak Tor gave you a Kharok answer: equipment that cannot pay for itself is decoration. He now knows how you think about upgrades.");
    },
    npcSaeliObserve() {
      saeli.met = true;
      saeli.relationship += 1;
      saeli.memory.valuesObservation = true;
      addLog("Saeli Ren shared a few careful observations from recent survey traffic. She seemed to appreciate that you listened before drawing conclusions.");
    },
    npcSaeliRoutes() {
      saeli.met = true;
      saeli.memory.wantsRoutes = true;
      addLog("Saeli Ren noted that reliable routes are discovered slowly: repeated signals, repeatable coordinates, and operators who return with the same story twice.");
    }
  };

  if (actions[action]) {
    actions[action]();
    el("encounterDialog").close();
    render();
    return;
  }

  baseResolveEncounterFrontier(action);
};

ensureNpcState();
saveState();

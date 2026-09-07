// Haven's Reach — Smallest Meaningful Upgrade #4
// Adds three persistent NPC contacts, remembered choices, relationships,
// and one named travel callback without changing the core game engine.

const NPC_DATA = {
  mara: {
    name: "Mara Quinn",
    role: "Shipwright",
    location: "haven",
    intro: "Mara Quinn helped keep the Wayfarer barely spaceworthy when you were saving every credit to leave Haven. She still runs a cramped repair bay near the old freight yards."
  },
  seli: {
    name: "Seli Varen",
    role: "Veylan Broker",
    location: "meridian",
    intro: "Seli Varen is a patient Veylan freight broker who seems to remember every price, promise, and favor that passes through Meridian Exchange."
  },
  lena: {
    name: "Captain Lena Voss",
    role: "Frontier Freighter Captain",
    location: "prospect",
    intro: "Lena Voss runs an aging frontier freighter between Prospect Reach and the settled systems. She knows which routes are profitable and which ones become dangerous without warning."
  }
};

function ensureNpcState() {
  if (!state.npcs) state.npcs = {};
  Object.keys(NPC_DATA).forEach(id => {
    if (!state.npcs[id]) {
      state.npcs[id] = {
        met: false,
        relationship: 0,
        memory: {}
      };
    }
    if (!state.npcs[id].memory) state.npcs[id].memory = {};
  });
}

function npcRelationshipLabel(value) {
  if (value >= 4) return "Trusted";
  if (value >= 2) return "Friendly";
  if (value >= 1) return "Acquaintance";
  return "Unfamiliar";
}

function npcAtCurrentPort() {
  return Object.entries(NPC_DATA).find(([, npc]) => npc.location === state.location);
}

function npcCallbackText(id) {
  const npcState = state.npcs[id];

  if (!npcState.met) return "You have not spoken yet.";

  if (id === "mara") {
    if (npcState.memory.grateful) return "Mara still remembers that you thanked her for getting the Wayfarer into the sky when you could barely afford the parts.";
    if (npcState.memory.businesslike) return "Mara has learned that you prefer straight numbers and practical answers over sentiment.";
  }

  if (id === "seli") {
    if (npcState.memory.sharedMarketNotes) return "Seli treats you as an operator willing to exchange useful information instead of guarding every advantage.";
    if (npcState.memory.keptNotesPrivate) return "Seli respects your discretion, though the Veylan broker has not forgotten that you keep your market information close.";
  }

  if (id === "lena") {
    if (npcState.memory.rescuedAtDrift) return "Lena has not forgotten that you put the Wayfarer on the line to tow her freighter clear of a dangerous drift zone.";
    if (npcState.memory.guidedAtDrift) return "Lena remembers the telemetry you sent when her engine controls failed on the frontier route.";
    if (npcState.memory.leftAtDrift) return "Lena remembers that you chose to continue on when her freighter was disabled. She remains professional, but the distance is noticeable.";
    if (npcState.memory.promisedSupport) return "Lena remembers your promise to watch out for independent crews on the frontier routes.";
    if (npcState.memory.professionalOnly) return "Lena understands that you prefer to keep your dealings professional and uncomplicated.";
  }

  return "They recognize you when you enter the port.";
}

const baseRenderOverviewForNpcs = renderOverview;
renderOverview = function() {
  ensureNpcState();
  baseRenderOverviewForNpcs();

  const local = npcAtCurrentPort();
  if (!local) return;

  const [id, npc] = local;
  const npcState = state.npcs[id];
  const contactHtml = `
    <article class="info-card">
      <h3>Local Contact</h3>
      <p><strong>${escapeHtml(npc.name)}</strong> — ${escapeHtml(npc.role)}</p>
      <p class="muted small">Relationship: ${npcRelationshipLabel(npcState.relationship)}</p>
      <p class="muted small">${escapeHtml(npcCallbackText(id))}</p>
      <button class="secondary" type="button" onclick="openNpcInteraction('${id}')">${npcState.met ? "Talk" : "Meet"}</button>
    </article>`;

  const grid = view.querySelector(".card-grid");
  if (grid) grid.insertAdjacentHTML("beforeend", contactHtml);
};

function openNpcInteraction(id) {
  ensureNpcState();
  const npc = NPC_DATA[id];
  const npcState = state.npcs[id];
  if (!npc) return;

  el("encounterTitle").textContent = `${npc.name} — ${npc.role}`;

  if (!npcState.met) {
    el("encounterText").textContent = npc.intro;

    const choices = {
      mara: [
        { label: "Thank her for keeping the Wayfarer flying", action: "npcMaraGrateful" },
        { label: "Ask her what the ship is actually worth", action: "npcMaraBusiness" }
      ],
      seli: [
        { label: "Share some of your market notes", action: "npcSeliShare" },
        { label: "Keep your figures private", action: "npcSeliPrivate" }
      ],
      lena: [
        { label: "Tell her you'll watch out for independent crews", action: "npcLenaSupport" },
        { label: "Keep the conversation professional", action: "npcLenaProfessional" }
      ]
    }[id] || [];

    el("encounterChoices").innerHTML = choices
      .map(choice => `<button class="secondary" type="button" onclick="resolveEncounter('${choice.action}')">${escapeHtml(choice.label)}</button>`)
      .join("");
  } else {
    el("encounterText").textContent = npcCallbackText(id);
    el("encounterChoices").innerHTML = `<button class="secondary" type="button" onclick="resolveEncounter('npcClose')">Continue</button>`;
  }

  el("encounterDialog").showModal();
}

const baseShowRandomEncounterForNpcs = showRandomEncounter;
showRandomEncounter = function() {
  ensureNpcState();
  const lena = state.npcs.lena;

  // One persistent named callback: after meeting Lena, a future frontier trip
  // can put her directly into an existing distress-style situation.
  const lenaStoryUnresolved = !lena.memory.rescuedAtDrift && !lena.memory.guidedAtDrift && !lena.memory.leftAtDrift;
  if (lena.met && lenaStoryUnresolved && Math.random() < 0.28) {
    el("encounterTitle").textContent = "Lena Voss — Disabled Freighter";
    el("encounterText").textContent = "The distress signal resolves into Lena Voss's freighter. Her engine controls have failed and the ship is drifting toward a hazardous debris field. She recognizes your call sign immediately.";
    el("encounterChoices").innerHTML = `
      <button class="secondary" type="button" onclick="resolveEncounter('npcLenaTow')">Attempt the tow</button>
      <button class="secondary" type="button" onclick="resolveEncounter('npcLenaGuidance')">Send repair telemetry</button>
      <button class="secondary" type="button" onclick="resolveEncounter('npcLenaLeave')">Continue on course</button>`;
    el("encounterDialog").showModal();
    return;
  }

  baseShowRandomEncounterForNpcs();
};

const baseResolveEncounterForNpcs = resolveEncounter;
resolveEncounter = function(action) {
  ensureNpcState();
  const mara = state.npcs.mara;
  const seli = state.npcs.seli;
  const lena = state.npcs.lena;

  const npcActions = {
    npcMaraGrateful() {
      mara.met = true;
      mara.relationship += 1;
      mara.memory.grateful = true;
      addLog("Mara Quinn waved off your thanks, but the smile gave her away. She remembers that you did not forget who helped get the Wayfarer flying.");
    },
    npcMaraBusiness() {
      mara.met = true;
      mara.memory.businesslike = true;
      addLog("Mara Quinn gave you a brutally practical appraisal of the Wayfarer. She now knows you prefer straight answers over sentiment.");
    },
    npcSeliShare() {
      seli.met = true;
      seli.relationship += 1;
      seli.memory.sharedMarketNotes = true;
      addLog("You traded market observations with Seli Varen. The Veylan broker seemed pleased that you understand information can be more valuable when exchanged.");
    },
    npcSeliPrivate() {
      seli.met = true;
      seli.memory.keptNotesPrivate = true;
      addLog("You kept your market notes to yourself. Seli Varen accepted the boundary without offense—and clearly remembered it.");
    },
    npcLenaSupport() {
      lena.met = true;
      lena.relationship += 1;
      lena.memory.promisedSupport = true;
      addLog("Lena Voss took your promise seriously. Frontier operators survive because somebody answers when things go wrong.");
    },
    npcLenaProfessional() {
      lena.met = true;
      lena.memory.professionalOnly = true;
      addLog("You and Lena Voss kept the conversation strictly professional. She seemed to respect the clarity.");
    },
    npcLenaTow() {
      const chance = Math.min(0.92, 0.38 + state.ship.engine * 0.14);
      lena.met = true;
      if (Math.random() < chance) {
        const reward = 170 + state.ship.engine * 20;
        state.credits += reward;
        state.reputation += 1;
        lena.relationship += 2;
        lena.memory.rescuedAtDrift = true;
        addLog(`You towed Lena Voss clear of the debris field. She transferred ${credits(reward)} and will remember that you risked the Wayfarer for her crew.`);
      } else {
        state.ship.hull = Math.max(1, state.ship.hull - 6);
        lena.relationship += 1;
        lena.memory.rescuedAtDrift = true;
        addLog("The tow was ugly and cost 6% hull integrity, but you got Lena Voss and her crew clear. She will remember the attempt more than the damage.");
      }
    },
    npcLenaGuidance() {
      lena.met = true;
      lena.memory.guidedAtDrift = true;
      if (state.ship.sensors >= 3) {
        state.credits += 100;
        lena.relationship += 1;
        addLog("Your telemetry helped Lena Voss recover engine control. She sent 100 cr in thanks and marked your call sign as one worth answering.");
      } else {
        addLog("Your telemetry helped Lena stabilize the drift, though your sensors could not fully isolate the fault. She remembers that you tried.");
      }
    },
    npcLenaLeave() {
      lena.met = true;
      lena.relationship = Math.max(-1, lena.relationship - 1);
      lena.memory.leftAtDrift = true;
      addLog("You continued on course while Lena Voss's freighter remained disabled. Another ship eventually responded. Lena remembers your decision.");
    },
    npcClose() {
      // Conversation ends without changing state.
    }
  };

  if (npcActions[action]) {
    npcActions[action]();
    el("encounterDialog").close();
    render();
    return;
  }

  baseResolveEncounterForNpcs(action);
};

ensureNpcState();
saveState();

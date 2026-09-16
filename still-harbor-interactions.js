// Haven's Reach — Second Frontier Batch 1
// Handcrafted Still Harbor contact interactions registered through the hardened
// interaction dispatcher. These conversations create no quest or simulation layer.

const STILL_HARBOR_CONTACT_IDS = new Set(["keithMaxwell", "gunant", "tayaln"]);

function openStillHarborContact(id) {
  ensureNpcState();
  const npc = NPC_DATA[id];
  const npcState = state.npcs[id];
  if (!npc || !npcState || npc.location !== state.location) return;

  el("encounterTitle").textContent = `${npc.name} — ${npc.role}`;

  if (npcState.met) {
    el("encounterText").textContent = npcCallbackText(id);
    el("encounterChoices").innerHTML = `<button class="secondary" type="button" onclick="resolveEncounter('npcClose')">Continue</button>`;
  } else {
    const choices = {
      keithMaxwell: [
        { label: "Ask how he found Still Harbor", action: "npcKeithBelonging" },
        { label: "Sit for a while and listen", action: "npcKeithListen" }
      ],
      gunant: [
        { label: "Ask how all of this keeps working", action: "npcGunantWorks" },
        { label: "Ask how long he has called it home", action: "npcGunantHome" }
      ],
      tayaln: [
        { label: "Ask whose shipment she represents", action: "npcTayalnOwnCargo" },
        { label: "Ask how she prefers to set terms", action: "npcTayalnTerms" }
      ]
    }[id];

    el("encounterText").textContent = npc.intro;
    el("encounterChoices").innerHTML = choices
      .map(choice => `<button class="secondary" type="button" onclick="resolveEncounter('${choice.action}')">${escapeHtml(choice.label)}</button>`)
      .join("");
  }

  el("encounterDialog").showModal();
}

const STILL_HARBOR_ACTIONS = {
  npcKeithBelonging() {
    const npc = state.npcs.keithMaxwell;
    npc.met = true;
    npc.relationship += 1;
    npc.memory.askedAboutBelonging = true;
    addLog("Keith says he spent years mistaking motion for direction. At Still Harbor, listening to people turned out to be useful work—and useful work slowly became belonging.");
  },
  npcKeithListen() {
    const npc = state.npcs.keithMaxwell;
    npc.met = true;
    npc.relationship += 1;
    npc.memory.listenedAtBar = true;
    addLog("You let the room carry the conversation. Keith offers one quick observation, two good jokes, and no request for anything in return.");
  },
  npcGunantWorks() {
    const npc = state.npcs.gunant;
    npc.met = true;
    npc.relationship += 1;
    npc.memory.askedHowItWorks = true;
    addLog("Gunant names three adapter standards, two obsolete pressure seals, and one repair nobody wrote down. Then he shrugs: the parts cooperate because the people maintaining them do.");
  },
  npcGunantHome() {
    const npc = state.npcs.gunant;
    npc.met = true;
    npc.relationship += 1;
    npc.memory.calledItHome = true;
    addLog("Gunant points out the station's oldest hull section and says he remembers when it was most of Still Harbor. He does not speak as a veteran waiting to leave. He speaks as a man describing home.");
  },
  npcTayalnOwnCargo() {
    const npc = state.npcs.tayaln;
    npc.met = true;
    npc.relationship += 1;
    npc.memory.learnedCargoIsHers = true;
    addLog("Tayaln corrects the assumption without embarrassment or amusement: the shipment is hers. She found the pocket, extracted the gas, and negotiated the sale.");
  },
  npcTayalnTerms() {
    const npc = state.npcs.tayaln;
    npc.met = true;
    npc.relationship += 1;
    npc.memory.respectedTerms = true;
    addLog("Tayaln lays out her preference plainly: exact quantity, exact delivery condition, exact payment. Fair terms leave less room for either side to invent a grievance later.");
  }
};

HavensInteractionDispatcher.registerNpcInteractionHandler("still-harbor-contacts", id => {
  if (!STILL_HARBOR_CONTACT_IDS.has(id)) return false;
  openStillHarborContact(id);
  return true;
});

HavensInteractionDispatcher.registerEncounterHandler("still-harbor-contacts", action => {
  const handler = STILL_HARBOR_ACTIONS[action];
  if (!handler) return false;
  ensureNpcState();
  handler();
  saveState();
  el("encounterDialog").close();
  render();
  return true;
});

// This is intentionally the final gateway installation in the runtime chain.
HavensInteractionDispatcher.installEncounterGateway();
HavensInteractionDispatcher.installNpcInteractionGateway();

// The base app renders before expansion modules load. Re-render once after every
// Second Frontier owner and dispatcher registration is active, protecting reloads
// while docked at Still Harbor without changing the proven startup sequence.
render();

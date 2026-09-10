// Haven's Reach — NPC Population & Familiarity #1
// Adds a small handcrafted roaming population and quiet familiar conversation.
// No crew system, faction system, quest generation, relationship scores, or rewards.

const AMBIENT_NPCS = {
  nera: {
    name: "Nera Pell",
    species: "Ruun",
    role: "Recovery Technician",
    intro: "Nera Pell is a Ruun recovery technician passing through with a battered tool case and the air of someone who has already noticed three useful things everyone else walked past.",
    first: "Nera glances toward a discarded cargo latch near the wall. ‘People call things useless when what they usually mean is inconvenient.’ She turns it over once, already considering what it could become.",
    again: "Nera recognizes you and lifts the same battered tool case in greeting. ‘Still working,’ she says. It is not entirely clear whether she means the case, herself, or both."
  },
  tal: {
    name: "Tal Ivers",
    species: "Human",
    role: "Independent Courier",
    intro: "Tal Ivers is an independent human courier between jobs, travel jacket folded over the next chair and a half-finished drink close at hand.",
    first: "Tal says the frontier has taught him one useful rule: never complain about an old ship that starts when asked. He asks what you fly, listens to the answer, and leaves it at that.",
    again: "Tal spots you first. ‘Good. You're still flying.’ He gives you a quick account of a delayed delivery and an argument with a loading crane. Neither story contains a request for help."
  },
  vessa: {
    name: "Vessa Oran",
    species: "Veylan",
    role: "Cargo Assessor",
    intro: "Vessa Oran is a Veylan cargo assessor traveling between ports. She watches loading crews with professional interest but seems in no hurry to turn the conversation into business.",
    first: "Vessa asks which port has treated you fairly lately. When you answer, she offers one of her own observations in return—not a valuable tip, just the sort of exchange that makes a conversation feel balanced.",
    again: "Vessa remembers your previous conversation without prompting. This time she offers a small piece of port gossip first, then smiles faintly. ‘There. Now you owe me something equally unimportant.’"
  },
  koren: {
    name: "Koren Vahl",
    species: "Kharok",
    role: "Galley Mechanic",
    intro: "Koren Vahl is a Kharok galley mechanic traveling with a compact case of cooking equipment. A repaired handle on the case is older than the rest and obviously built to stay repaired.",
    first: "Koren says he services galley equipment because crews notice very quickly when food or coffee stops appearing. ‘Important machinery is whatever people miss when it breaks.’",
    again: "Koren recognizes you and taps the repaired handle on his case. ‘You saw this last time. Still good.’ He seems genuinely pleased by the report."
  }
};

function ensurePopulationState() {
  if (!state.npcPopulation || typeof state.npcPopulation !== "object") {
    state.npcPopulation = { lastLocation: state.location, journey: 0, people: {} };
  }
  if (!state.npcPopulation.people) state.npcPopulation.people = {};

  const systems = Object.keys(GAME_DATA.systems);
  const starts = ["meridian", "prospect", "caldersDrift", "pelagos"].filter(id => systems.includes(id));
  Object.keys(AMBIENT_NPCS).forEach((id, index) => {
    if (!state.npcPopulation.people[id]) {
      state.npcPopulation.people[id] = {
        location: starts[index % starts.length] || systems[index % systems.length],
        met: false,
        encounters: 0
      };
    }
  });
}

function moveAmbientPopulation() {
  ensurePopulationState();
  const pop = state.npcPopulation;
  if (pop.lastLocation === state.location) return;

  pop.lastLocation = state.location;
  pop.journey = (pop.journey || 0) + 1;
  const systems = Object.keys(GAME_DATA.systems);

  Object.values(pop.people).forEach(person => {
    // People have their own lives. Most stay put on any given player journey.
    if (Math.random() >= 0.34) return;
    const choices = systems.filter(id => id !== person.location);
    if (choices.length) person.location = choices[Math.floor(Math.random() * choices.length)];
  });
}

function ambientPeopleHere() {
  ensurePopulationState();
  return Object.entries(AMBIENT_NPCS)
    .filter(([id]) => state.npcPopulation.people[id]?.location === state.location)
    .slice(0, 2);
}

function openAmbientNpc(id) {
  ensurePopulationState();
  const npc = AMBIENT_NPCS[id];
  const person = state.npcPopulation.people[id];
  if (!npc || !person || person.location !== state.location) return;

  const firstMeeting = !person.met;
  el("encounterTitle").textContent = `${npc.name} — ${npc.role}`;
  el("encounterText").textContent = firstMeeting ? `${npc.intro} ${npc.first}` : npc.again;
  el("encounterChoices").innerHTML = `<button class="secondary" type="button" onclick="closeAmbientNpc('${id}')">Continue</button>`;
  el("encounterDialog").showModal();

  person.met = true;
  person.encounters = (person.encounters || 0) + 1;
  addLog(firstMeeting
    ? `You met ${npc.name}, a ${npc.species} ${npc.role.toLowerCase()}, while passing through ${GAME_DATA.systems[state.location].name}.`
    : `You crossed paths with ${npc.name} again at ${GAME_DATA.systems[state.location].name}.`);
  saveState();
}

function closeAmbientNpc() {
  el("encounterDialog").close();
  render();
}

function familiarConversationText(id) {
  const npcState = state.npcs?.[id];
  if (id === "mara") {
    if (state.stationProjects?.haven?.oldGantry?.completed) {
      return "Mara takes a moment to look across the restored Old Gantry before looking back at you. ‘Used to be I only saw you when that ship needed something. Nice having something around here that's better because you came back.’ She changes the subject before it can become sentimental.";
    }
    if (npcState?.memory?.grateful) {
      return "Mara asks how the ship has been behaving, then listens to the answer like someone who remembers every noise it made before it was yours. For a few minutes you talk about Haven, old machinery, and nothing that needs fixing today.";
    }
    return "Mara gives you the latest harmless complaint from the freight yard and asks whether the road has been treating you well. There is no job attached to the question.";
  }

  if (id === "seli") {
    if (npcState?.memory?.sharedMarketNotes) {
      return "Seli mentions an ordinary meal she had at Meridian and asks about the last place you found unexpectedly pleasant. No prices are discussed. Coming from Seli, the absence of business feels deliberate.";
    }
    return "Seli remembers where your last conversation ended and picks it up without ceremony. She shares a small observation about Meridian traffic, then asks what you've noticed lately. Neither of you turns it into a transaction.";
  }

  return "You spend a few minutes talking without turning the conversation into work.";
}

function openFamiliarConversation(id) {
  ensureNpcState();
  const npc = NPC_DATA[id];
  if (!npc || !state.npcs[id]?.met) return;
  el("encounterTitle").textContent = `${npc.name} — A Familiar Conversation`;
  el("encounterText").textContent = familiarConversationText(id);
  el("encounterChoices").innerHTML = `<button class="secondary" type="button" onclick="closeFamiliarConversation()">Continue</button>`;
  el("encounterDialog").showModal();
}

function closeFamiliarConversation() {
  el("encounterDialog").close();
  render();
}

const baseRenderOverviewForPopulation = renderOverview;
renderOverview = function() {
  moveAmbientPopulation();
  baseRenderOverviewForPopulation();

  // Deepen two proven Contacts without changing their opportunity mechanics.
  const localContact = Object.entries(NPC_DATA).find(([, npc]) => npc.location === state.location);
  if (localContact) {
    const [id, npc] = localContact;
    if ((id === "mara" || id === "seli") && state.npcs?.[id]?.met) {
      const cards = Array.from(view.querySelectorAll(".info-card"));
      const card = cards.find(node => node.textContent.includes(npc.name));
      if (card && !card.querySelector(".familiar-talk")) {
        card.insertAdjacentHTML("beforeend", `<button class="secondary familiar-talk" type="button" onclick="openFamiliarConversation('${id}')">Catch Up</button>`);
      }
    }
  }

  const people = ambientPeopleHere();
  if (!people.length) {
    saveState();
    return;
  }

  const rows = people.map(([id, npc]) => {
    const person = state.npcPopulation.people[id];
    const recognition = person.met ? "You have crossed paths before." : `${npc.species} • Passing through`;
    return `<div class="ambient-person">
      <div><strong>${escapeHtml(npc.name)}</strong><div class="muted small">${escapeHtml(npc.role)} • ${escapeHtml(recognition)}</div></div>
      <button class="secondary" type="button" onclick="openAmbientNpc('${id}')">${person.met ? "Say Hello" : "Talk"}</button>
    </div>`;
  }).join("");

  const grid = view.querySelector(".card-grid");
  if (grid) grid.insertAdjacentHTML("beforeend", `
    <article class="info-card ambient-population-card">
      <h3>People Around Port</h3>
      <p class="muted small">Not everyone passing through is looking for an operator.</p>
      <div class="ambient-people-list">${rows}</div>
    </article>`);
  saveState();
};

ensurePopulationState();
saveState();

// Haven's Reach — People & Conversations Bundle
// Structural consolidation only. The six proven people/conversation modules below
// are preserved in their existing execution order with no gameplay or save-data changes.

// ===== npc-population.js =====
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

// ===== seli-conversations.js =====
// Haven's Reach — Contact Conversation Refinement #1
// Deepens familiar conversation for Mara and Seli while keeping it finite per station visit.
// No rewards, relationship gains, quests, timers, or visible conversation counters.

const SELI_CONVERSATION_PARTS = {
  openings: [
    { id: "ledger", text: "Seli finishes a note on her ledger before turning toward you. ‘Good timing.’" },
    { id: "traffic", text: "Seli watches a pair of cargo crews negotiate right-of-way, then notices you. ‘Meridian remains determined to make simple things complicated.’" },
    { id: "recognition", text: "Seli recognizes you before you reach her desk. ‘Captain. I was beginning to think the frontier had decided to keep you.’", minRelationship: 2 },
    { id: "seat", text: "Seli gestures toward the empty seat beside her without interrupting the figures she is checking. A moment later she sets the figures aside." },
    { id: "drink", text: "Seli has a drink within reach and another untouched beside it. ‘That one was ordered by mistake,’ she says, with the precision of someone who rarely makes ordering mistakes.", minRelationship: 4 },
    { id: "quiet", text: "For once, the space around Seli is quiet. She looks almost suspicious of the circumstance. ‘We should probably use it before Meridian notices.’" },
    { id: "arrival", text: "Seli glances toward the concourse as you approach. ‘Your arrivals are becoming easier to recognize.’", minRelationship: 1 },
    { id: "paperwork", text: "Seli slides a completed freight form away with visible satisfaction. ‘A rare victory over paperwork. Sit down before something else arrives.’" }
  ],
  subjects: [
    { id: "ordinary-meal", text: "She mentions an ordinary meal she had nearby and asks about the last place you found unexpectedly pleasant. For several minutes, neither of you discusses prices." },
    { id: "meridian-traffic", text: "She describes a minor argument between two freight crews over a loading slot. Her interest is less in who won than in which one will still be willing to work with the other tomorrow." },
    { id: "fair-dealing", text: "She asks which port has treated you fairly lately. When you answer, she considers it seriously; to Seli, fairness appears to be useful information even when no transaction follows." },
    { id: "frontier-routine", text: "She asks what has become routine out on the frontier that once felt strange. The question turns into a comparison of the small habits people acquire when they spend enough time traveling." },
    { id: "shared-notes", text: "She remembers the market notes you once shared and tells you about a harmless prediction of hers that turned out completely wrong. ‘Useful information includes knowing when you were mistaken.’", requiresMemory: "sharedMarketNotes" },
    { id: "discretion", text: "She makes a dry remark about operators who announce every profitable discovery in a crowded room. Then she gives you a brief look. ‘You, at least, understand that not every fact requires an audience.’", requiresMemory: "keptNotesPrivate" },
    { id: "trusted-silence", text: "The conversation wanders away from freight entirely. Seli seems content to let a few quiet moments pass without filling them with business, which somehow says more than another carefully balanced exchange would.", minRelationship: 4 },
    { id: "operator-reputation", text: "She observes that people around Meridian have begun recognizing your ship before they recognize you. ‘That is usually when an operator discovers a reputation travels faster than the operator does.’", minReputation: 3 },
    { id: "old-gantry", text: "She has heard about the work at Haven's Old Gantry. Rather than praise it directly, she asks what changed there after the work was finished. The distinction seems important to her.", requiresOldGantry: true },
    { id: "h9", text: "She asks how the H-9 has changed the jobs you consider worth taking. Her questions are practical, but she seems more interested in the choices the ship opened than in the ship itself.", requiresChassis: "h9-bulk-hauler" },
    { id: "wayfarer", text: "She asks whether the Wayfarer still surprises you. When you say that old ships have personalities, Seli replies, ‘People say the same thing about markets when they do not understand them.’" },
    { id: "nothing-important", text: "She recounts a thoroughly unimportant piece of station gossip involving a mislabeled crate and three increasingly embarrassed clerks. By the end, she is trying not to laugh." },
    { id: "reciprocity", text: "Seli remarks that the easiest people to work with are not always the most generous. ‘Predictability has value. So does knowing that the other person intends to see you again.’" },
    { id: "home", text: "She asks what makes Haven still feel like home after so much time on the lanes. She offers no theory of her own until after you've answered." }
  ],
  closings: [
    { id: "back-to-work", text: "Eventually Seli glances back toward the exchange. ‘Unfortunately, commerce has survived without us.’" },
    { id: "safe-travel", text: "As you get up, she says, ‘Travel carefully.’ The words arrive without a price, warning, or qualification." },
    { id: "next-time", text: "Seli gives you a small nod. ‘Next time, you provide the unimportant story.’" },
    { id: "balanced", text: "She smiles faintly. ‘There. An entirely balanced exchange in which neither of us gained anything useful.’" },
    { id: "familiar", text: "Before turning back to work, she adds, ‘It is good to see you, Captain.’ She makes no attempt to disguise the statement as business.", minRelationship: 4 },
    { id: "meridian", text: "A new wave of freight traffic reaches the concourse. Seli sighs. ‘Meridian has remembered what it is for.’" },
    { id: "open-ledger", text: "She reopens her ledger, then pauses. ‘You are welcome to interrupt it again.’", minRelationship: 2 },
    { id: "no-debt", text: "Seli waves away your attempt to thank her for the conversation. ‘No debt. I am capable of speaking without invoicing someone.’" }
  ]
};

const MARA_CONVERSATIONS = [
  { id: "ship-noises", text: "Mara asks how the ship has been behaving and listens to the answer like someone who remembers every noise it made before it was yours. She offers one brief theory about an old vibration in the port thruster, then admits it may simply be the Wayfarer being the Wayfarer." },
  { id: "yard-complaint", text: "Mara gives you the latest harmless complaint from the freight yard: someone has once again parked a loader exactly where everyone needs to drive. She has already solved the problem, but appears to enjoy being annoyed by it." },
  { id: "haven-weather", text: "Mara asks whether the frontier has made Haven seem smaller when you return. Before you can decide how to answer, she adds, ‘Smaller isn't always worse. Means you know where the tools are.’" },
  { id: "old-machine", text: "Mara tells you about a piece of station equipment everyone wanted replaced until she found the actual fault: a connector worth fewer credits than lunch. ‘New machinery has its place. Usually right after we've proved the old one is actually dead.’" },
  { id: "uncle-memory", text: "Something about the Wayfarer reminds Mara of your uncle. She shares a small story about him insisting on finishing a repair properly when a temporary patch would have gotten him home. ‘He could be irritating that way,’ she says, with unmistakable affection." },
  { id: "quiet-haven", text: "For a few minutes you and Mara watch ordinary station traffic come and go. She points out three people you don't know and tells you exactly which piece of equipment each of them is probably about to misuse." },
  { id: "old-gantry", text: "Mara looks across the restored Old Gantry. ‘Still holding together,’ she says. Coming from Mara, it sounds less like an observation and more like high praise.", requiresOldGantry: true }
];

const CONTACT_STOPPINGS = {
  seli: [
    { id: "manifest", text: "A freight manifest arrives for Seli's review. She gives it the look of someone who knows it will not improve by waiting. ‘I should rescue this before someone turns a minor error into a tradition. Catch me next time you're through.’" },
    { id: "incoming-crew", text: "Seli notices an incoming cargo crew looking around for her. ‘That expression means they have either a question or a problem, and experience suggests they won't know which until they reach me.’ She excuses herself with a small nod." },
    { id: "broker-call", text: "A message indicator flashes on Seli's ledger. She reads the sender and sighs softly. ‘I have postponed this conversation with remarkable skill. Apparently not enough skill.’ She turns back to work." },
    { id: "exchange", text: "The exchange grows noticeably busier around you. Seli glances toward the forming line. ‘Meridian has decided I have been idle long enough.’ She smiles faintly. ‘We'll continue another time.’" }
  ],
  mara: [
    { id: "yard-call", text: "Someone across the freight yard calls Mara's name, followed immediately by the sound of something metallic hitting the deck. She closes her eyes for half a second. ‘That sounded expensive. I'd better go prove it isn't.’" },
    { id: "inspection", text: "Mara notices a maintenance crew starting an inspection without her. ‘They know what they're doing,’ she says, already getting to her feet. ‘Which is why I'd like to see what they're doing. Catch me next time.’" },
    { id: "parts-delivery", text: "A parts cart rolls into the bay and Mara checks the markings. ‘I've been waiting three days for that crate, so naturally it arrived the moment I sat down.’ She heads over before anyone can misplace it." },
    { id: "gantry-check", text: "Mara glances toward the station works and spots something that catches her attention. ‘Probably nothing,’ she says, standing. Then she gives you a look. ‘Which is what people say immediately before it becomes something. I'll see you when you're back through.’" }
  ]
};

function ensureContactConversationState() {
  if (!state.contactConversations || typeof state.contactConversations !== "object") state.contactConversations = {};
  if (!state.contactConversations.seli || typeof state.contactConversations.seli !== "object") state.contactConversations.seli = { recentOpenings: [], recentSubjects: [], recentClosings: [], count: 0 };
  const seli = state.contactConversations.seli;
  if (!Array.isArray(seli.recentOpenings)) seli.recentOpenings = [];
  if (!Array.isArray(seli.recentSubjects)) seli.recentSubjects = [];
  if (!Array.isArray(seli.recentClosings)) seli.recentClosings = [];
  if (!Number.isFinite(seli.count)) seli.count = 0;
  if (!state.contactConversations.mara || typeof state.contactConversations.mara !== "object") state.contactConversations.mara = { recent: [], count: 0 };
  const mara = state.contactConversations.mara;
  if (!Array.isArray(mara.recent)) mara.recent = [];
  if (!Number.isFinite(mara.count)) mara.count = 0;
  if (!state.contactConversations.recentStops || typeof state.contactConversations.recentStops !== "object") state.contactConversations.recentStops = { mara: [], seli: [] };
  if (!Array.isArray(state.contactConversations.recentStops.mara)) state.contactConversations.recentStops.mara = [];
  if (!Array.isArray(state.contactConversations.recentStops.seli)) state.contactConversations.recentStops.seli = [];
  if (!state.contactConversations.visit || typeof state.contactConversations.visit !== "object") state.contactConversations.visit = { location: state.location, counts: {} };
  if (state.contactConversations.visit.location !== state.location) state.contactConversations.visit = { location: state.location, counts: {} };
  if (!state.contactConversations.visit.counts || typeof state.contactConversations.visit.counts !== "object") state.contactConversations.visit.counts = {};
  return state.contactConversations;
}

function activeShipChassisId() { return state.ship?.chassisId || state.ship?.id || "wayfarer"; }
function seliPartEligible(part) {
  const seli = state.npcs?.seli;
  if (!seli) return false;
  if (part.minRelationship && (seli.relationship || 0) < part.minRelationship) return false;
  if (part.minReputation && (state.reputation || 0) < part.minReputation) return false;
  if (part.requiresMemory && !seli.memory?.[part.requiresMemory]) return false;
  if (part.requiresOldGantry && !state.stationProjects?.haven?.oldGantry?.completed) return false;
  if (part.requiresChassis && activeShipChassisId() !== part.requiresChassis) return false;
  return true;
}
function maraConversationEligible(part) { return !(part.requiresOldGantry && !state.stationProjects?.haven?.oldGantry?.completed); }
function chooseFresh(parts, recentIds, eligibleTest = () => true) {
  const eligible = parts.filter(eligibleTest);
  if (!eligible.length) return parts[0];
  const fresh = eligible.filter(part => !recentIds.includes(part.id));
  const pool = fresh.length ? fresh : eligible;
  return pool[Math.floor(Math.random() * pool.length)];
}
function rememberRecent(list, id, limit) {
  const next = list.filter(value => value !== id); next.unshift(id); return next.slice(0, limit);
}
function buildSeliConversation() {
  ensureNpcState();
  const memory = ensureContactConversationState().seli;
  const opening = chooseFresh(SELI_CONVERSATION_PARTS.openings, memory.recentOpenings, seliPartEligible);
  const subject = chooseFresh(SELI_CONVERSATION_PARTS.subjects, memory.recentSubjects, seliPartEligible);
  const closing = chooseFresh(SELI_CONVERSATION_PARTS.closings, memory.recentClosings, seliPartEligible);
  memory.recentOpenings = rememberRecent(memory.recentOpenings, opening.id, 4);
  memory.recentSubjects = rememberRecent(memory.recentSubjects, subject.id, 7);
  memory.recentClosings = rememberRecent(memory.recentClosings, closing.id, 4);
  memory.count += 1;
  return `${opening.text} ${subject.text} ${closing.text}`;
}
function buildMaraConversation() {
  const memory = ensureContactConversationState().mara;
  const conversation = chooseFresh(MARA_CONVERSATIONS, memory.recent, maraConversationEligible);
  memory.recent = rememberRecent(memory.recent, conversation.id, 4); memory.count += 1; return conversation.text;
}
function contactCatchUpCount(id) { const data = ensureContactConversationState(); return data.visit.counts[id] || 0; }
function incrementContactCatchUp(id) { const data = ensureContactConversationState(); data.visit.counts[id] = contactCatchUpCount(id) + 1; }
function buildContactStopping(id) {
  const data = ensureContactConversationState(); const stops = CONTACT_STOPPINGS[id] || [];
  if (!stops.length) return "They turn back to the rest of their day. You can catch up again the next time you're through.";
  const recent = data.recentStops[id] || []; const stop = chooseFresh(stops, recent);
  data.recentStops[id] = rememberRecent(recent, stop.id, Math.min(3, stops.length - 1)); return stop.text;
}
function openContactStopping(id) {
  const npc = NPC_DATA[id]; if (!npc) return;
  el("encounterTitle").textContent = `${npc.name} — Back to the Day`;
  el("encounterText").textContent = buildContactStopping(id);
  el("encounterChoices").innerHTML = `<button class="secondary" type="button" onclick="closeFamiliarConversation()">Continue</button>`;
  el("encounterDialog").showModal(); saveState();
}
const baseOpenFamiliarConversationForContacts = openFamiliarConversation;
openFamiliarConversation = function(id) {
  if (id !== "mara" && id !== "seli") return baseOpenFamiliarConversationForContacts(id);
  ensureNpcState(); const npc = NPC_DATA[id]; if (!npc || !state.npcs?.[id]?.met) return;
  if (contactCatchUpCount(id) >= 3) { openContactStopping(id); return; }
  el("encounterTitle").textContent = `${npc.name} — A Familiar Conversation`;
  el("encounterText").textContent = id === "seli" ? buildSeliConversation() : buildMaraConversation();
  el("encounterChoices").innerHTML = `<button class="secondary" type="button" onclick="closeFamiliarConversation()">Continue</button>`;
  el("encounterDialog").showModal(); incrementContactCatchUp(id); saveState();
};
const baseRenderOverviewForContactConversationLimits = renderOverview;
renderOverview = function() {
  ensureContactConversationState(); baseRenderOverviewForContactConversationLimits();
  const localContact = Object.entries(NPC_DATA).find(([, npc]) => npc.location === state.location); if (!localContact) return;
  const [id] = localContact; if (id !== "mara" && id !== "seli") return;
  const button = view.querySelector(`.familiar-talk[onclick="openFamiliarConversation('${id}')"]`);
  if (button && contactCatchUpCount(id) >= 3) button.disabled = true;
};
const baseTravelForContactConversationVisits = travel;
travel = function(destination, fuelCost) {
  if (state.ship.fuel < fuelCost) return baseTravelForContactConversationVisits(destination, fuelCost);
  const data = ensureContactConversationState(); data.visit = { location: null, counts: {} };
  return baseTravelForContactConversationVisits(destination, fuelCost);
};
ensureContactConversationState(); saveState();

// ===== contact-visit-cap.js =====
function ensureContactVisitStopState() {
  const data = ensureContactConversationState();
  if (!data.visit.stopped || typeof data.visit.stopped !== "object") data.visit.stopped = {};
  return data;
}
function markContactCaughtUpButton(id) {
  const button = view.querySelector(`.familiar-talk[onclick="openFamiliarConversation('${id}')"]`);
  if (!button) return; button.disabled = true; button.textContent = "Caught Up";
}
const baseOpenContactStoppingForVisitCap = openContactStopping;
openContactStopping = function(id) {
  const data = ensureContactVisitStopState(); data.visit.stopped[id] = true; markContactCaughtUpButton(id);
  return baseOpenContactStoppingForVisitCap(id);
};
const baseRenderOverviewForVisitCap = renderOverview;
renderOverview = function() {
  baseRenderOverviewForVisitCap();
  const data = ensureContactVisitStopState();
  const localContact = Object.entries(NPC_DATA).find(([, npc]) => npc.location === state.location); if (!localContact) return;
  const [id] = localContact; if (id !== "mara" && id !== "seli") return;
  const button = view.querySelector(`.familiar-talk[onclick="openFamiliarConversation('${id}')"]`);
  if (button) { const stopped = Boolean(data.visit.stopped[id]); button.disabled = stopped; button.textContent = stopped ? "Caught Up" : "Catch Up"; }
};
ensureContactVisitStopState(); saveState();

// ===== contact-conversations-expanded.js =====
const EXPANDED_CONTACT_IDS = ["lena", "orin", "draak", "saeli"];
const EXPANDED_CONTACT_CONVERSATIONS = {
  lena: [
    { id: "route-weather", text: "Lena asks what the lanes have been like lately. The conversation turns into a comparison of the small signs that tell an experienced operator when an ordinary route is about to become inconvenient." },
    { id: "old-freighter", text: "Lena mentions a new noise in her freighter, then dismisses it with the practiced confidence of someone who knows exactly which noises matter. ‘Old ships talk. The trick is knowing when they're actually asking for help.’" },
    { id: "independent-crews", text: "She tells you about two independent crews who traded favors after a bad fuel calculation left one of them stranded. Lena seems less interested in who made the mistake than in who answered the call." },
    { id: "prospect-coffee", text: "Lena complains that Prospect's coffee has somehow become worse without becoming cheaper. The complaint lasts long enough to suggest she has been saving it for someone she knows." },
    { id: "quiet-return", text: "For a while you trade ordinary stories about arrivals, delays, and repairs that ended up costing less than expected. None of it is important, which appears to be exactly why Lena enjoys the conversation." },
    { id: "drift-rescue", text: "Lena briefly revisits the disabled-freighter incident, not to thank you again but to describe the look on one crewman's face when the engines finally answered. ‘That's the part people remember,’ she says.", requiresMemory: "rescuedAtDrift" },
    { id: "drift-guidance", text: "Lena mentions that one of her crew still refers to the telemetry you sent during the drift incident as ‘the message that made the engine stop lying.’ She seems amused by the description.", requiresMemory: "guidedAtDrift" },
    { id: "professional-distance", text: "The conversation stays courteous and practical. Lena talks routes, maintenance, and the strange habits freight crews pick up on long runs, never asking for more familiarity than you've offered.", requiresMemory: "professionalOnly" }
  ],
  orin: [
    { id: "beacon-drift", text: "Orin describes a navigation beacon that has shifted just far enough to be annoying but not far enough to be dangerous. He seems almost offended by the imprecision." },
    { id: "good-coordinates", text: "He asks which recent route felt easiest to fly. When you answer, Orin is more interested in why it felt easy than where it went. ‘Good navigation is mostly removing surprises before they become stories.’" },
    { id: "survey-humor", text: "Orin recounts a survey dispute that lasted two hours because two crews were using different definitions of ‘close enough.’ His conclusion is dry: ‘Neither definition was close enough.’" },
    { id: "calder-view", text: "You spend a few minutes looking over the traffic around Calder's Drift. Orin points out a ship making three unnecessary course corrections and then, after a pause, admits everyone has days like that." },
    { id: "route-memory", text: "Orin asks whether you navigate more by instruments now or by memory. He listens carefully to the answer, then says the best operators know when not to trust either one completely." },
    { id: "shared-notes", text: "He brings up one of the beacon notes you shared earlier and mentions that another surveyor independently confirmed it. ‘Useful information improves when somebody else can find the same thing.’", requiresMemory: "sharedBeaconNotes" },
    { id: "work-routes", text: "Orin mentions a route that is technically efficient but rarely worth taking unless someone actually needs something at the other end. He gives you a sidelong look. ‘You were right to ask which routes pay.’", requiresMemory: "askedForWork" }
  ],
  draak: [
    { id: "maintenance-sound", text: "Draak pauses mid-conversation to listen to a freight loader cycling nearby. After three repetitions he nods once. ‘Bearing is fine. Operator is impatient.’" },
    { id: "old-tools", text: "He shows you a hand tool with a grip polished smooth by years of use. Draak says nothing sentimental about it. ‘Still accurate. Still mine. No reason to replace either fact.’" },
    { id: "red-mesa-shift", text: "Draak gives you a brief account of a difficult shift at Red Mesa. The story contains two equipment failures, one scheduling mistake, and no villains. ‘Things break. People fix them. Shift ends.’" },
    { id: "ship-pride", text: "He asks what part of your ship has earned your trust. When you answer, Draak considers the choice seriously. ‘Good. Trust should have evidence.’" },
    { id: "bad-decoration", text: "A heavily polished piece of station equipment catches Draak's attention. He studies it for a moment and says, ‘Excellent finish. Poor access panel.’ This appears to settle the matter." },
    { id: "maintenance-values", text: "Draak remembers that you once asked what keeps frontier ships alive. He answers the question again in a different way: ‘Attention. Parts are cheaper when bought before failure.’", requiresMemory: "respectsMaintenance" },
    { id: "profit-values", text: "He asks whether your latest upgrade has earned its keep yet. When you hesitate, Draak says, ‘Then it has not. Yet is acceptable.’", requiresMemory: "focusedOnProfit" }
  ],
  saeli: [
    { id: "small-change", text: "Saeli asks whether you've noticed anything different on the route into Pelagos. When you mention something minor, she seems pleased. ‘Small changes are often the ones people stop seeing first.’" },
    { id: "survey-patience", text: "She describes a survey crew that spent two days confirming that an unusual reading was ordinary interference. Saeli does not sound disappointed. ‘Knowing what something is not can save a great deal of time later.’" },
    { id: "quiet-question", text: "Saeli asks what you have learned lately that changed your mind about something. She gives you enough silence to actually think before answering." },
    { id: "pelagos-window", text: "For several minutes you watch distant traffic through one of Pelagos's observation panels. Saeli points out a survey vessel by the rhythm of its course corrections rather than its markings." },
    { id: "wrong-first-impression", text: "She tells you about a signal she initially classified incorrectly and seems entirely comfortable admitting it. ‘The useful part of a first impression is discovering whether it survives a second look.’" },
    { id: "observation-memory", text: "Saeli remembers that you asked what the survey crews were actually learning rather than trying to impress her with conclusions. This time she asks what you have observed since then.", requiresMemory: "valuesObservation" },
    { id: "route-memory", text: "She mentions that dependable routes become dependable because many ordinary journeys agree with one another. ‘Reliability is usually repetition that has earned our trust.’", requiresMemory: "wantsRoutes" }
  ]
};
const EXPANDED_CONTACT_STOPPINGS = {
  lena: [
    { id: "departure-check", text: "Lena spots one of her crew waving from the docking corridor. ‘That means we're either ready to leave or they've discovered why we're not.’ She gets to her feet. ‘I'll find out which. Catch me next time.’" },
    { id: "cargo-signoff", text: "A cargo manifest arrives for Lena's signature. She scans the first line and grimaces. ‘They've spelled the destination wrong. That's usually a good place to start paying attention.’ She turns back to work." },
    { id: "engine-message", text: "Lena's comm unit flashes with a message from her engine room. She reads it twice. ‘Nothing urgent. Which is exactly when I prefer to look at it.’ She gives you a quick nod before heading out." },
    { id: "crew-question", text: "A young crew member approaches Lena with the careful expression of someone trying not to interrupt. Lena notices immediately. ‘If they came looking for me instead of sending a message, I should probably listen.’ She excuses herself." }
  ],
  orin: [
    { id: "beacon-report", text: "A fresh beacon report appears on Orin's slate. He reads the first few figures and is already mentally somewhere else. ‘Those coordinates should not be doing that. I'll see you next time through.’" },
    { id: "survey-crew", text: "A survey crew signals Orin from across the station. He checks their route overlay and frowns. ‘They've found something boring in an interesting way. I should look at it.’" },
    { id: "chart-review", text: "Orin notices a navigation chart waiting for approval. ‘If I leave that long enough, someone will assume silence means agreement.’ He stands. ‘It rarely does.’" },
    { id: "departure-window", text: "A departing survey vessel appears on Orin's display. ‘I promised them a final route check before they cleared the lane.’ He gives you a brief wave. ‘Next time.’" }
  ],
  draak: [
    { id: "loader-noise", text: "A heavy loader produces a metallic knock somewhere beyond the bay. Draak stops talking immediately. ‘That one matters.’ He picks up his tool case and heads toward the sound." },
    { id: "inspection-call", text: "A maintenance tech calls Draak over to inspect a newly fitted coupling. He looks at you. ‘They want approval. Approval requires looking.’ With that, the conversation is over for now." },
    { id: "shift-change", text: "The Red Mesa shift board updates behind him. Draak checks it once. ‘My people are changing over. Problems hide during handoff.’ He stands. ‘We talk next visit.’" },
    { id: "parts-arrival", text: "A freight pallet marked for Draak's section rolls into view. He notices the handling label and immediately starts walking toward it. ‘Fragile means someone will test it.’" }
  ],
  saeli: [
    { id: "incoming-data", text: "A survey packet arrives on Saeli's console. She reads the header and grows very still. ‘They found something worth checking twice.’ She gives you an apologetic nod and turns to the data." },
    { id: "crew-debrief", text: "Saeli notices a survey crew returning from the outer lanes. ‘They've been gone longer than expected.’ She rises. ‘Not necessarily a problem. Still worth hearing the story while it is fresh.’" },
    { id: "signal-review", text: "A faint-signal review comes due on Saeli's board. She glances at it and says, ‘If I postpone this, I will only spend the next hour wondering what it says.’ She excuses herself." },
    { id: "coordination-call", text: "A quiet alert sounds from Saeli's console. She checks the source. ‘Two survey teams have reached different conclusions. That is usually where the useful conversation begins.’ She returns to work." }
  ]
};
function expandedContactConversationEligible(id, part) {
  const npcState = state.npcs?.[id]; if (!npcState) return false;
  if (part.requiresMemory && !npcState.memory?.[part.requiresMemory]) return false; return true;
}
function ensureExpandedContactConversationState(id) {
  const data = ensureContactVisitStopState();
  if (!data[id] || typeof data[id] !== "object") data[id] = { recent: [], count: 0 };
  if (!Array.isArray(data[id].recent)) data[id].recent = [];
  if (!Number.isFinite(data[id].count)) data[id].count = 0;
  if (!Array.isArray(data.recentStops[id])) data.recentStops[id] = [];
  if (!Number.isFinite(data.visit.counts[id])) data.visit.counts[id] = 0;
  return data;
}
function buildExpandedContactConversation(id) {
  const data = ensureExpandedContactConversationState(id); const memory = data[id];
  const parts = EXPANDED_CONTACT_CONVERSATIONS[id] || []; const eligible = parts.filter(part => expandedContactConversationEligible(id, part));
  const source = eligible.length ? eligible : parts; if (!source.length) return "You spend a few quiet minutes catching up.";
  const fresh = source.filter(part => !memory.recent.includes(part.id)); const pool = fresh.length ? fresh : source;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  memory.recent = rememberRecent(memory.recent, chosen.id, Math.min(4, Math.max(1, source.length - 1))); memory.count += 1; return chosen.text;
}
function buildExpandedContactStopping(id) {
  const data = ensureExpandedContactConversationState(id); const stops = EXPANDED_CONTACT_STOPPINGS[id] || [];
  if (!stops.length) return "They turn back to the rest of their day. You can catch up again the next time you're through.";
  const recent = data.recentStops[id] || []; const fresh = stops.filter(stop => !recent.includes(stop.id)); const pool = fresh.length ? fresh : stops;
  const chosen = pool[Math.floor(Math.random() * pool.length)]; data.recentStops[id] = rememberRecent(recent, chosen.id, Math.min(3, stops.length - 1)); return chosen.text;
}
function openExpandedContactStopping(id) {
  const data = ensureExpandedContactConversationState(id); const npc = NPC_DATA[id]; if (!npc) return;
  data.visit.stopped[id] = true; el("encounterTitle").textContent = `${npc.name} — Back to the Day`;
  el("encounterText").textContent = buildExpandedContactStopping(id);
  el("encounterChoices").innerHTML = `<button class="secondary" type="button" onclick="closeFamiliarConversation()">Continue</button>`;
  el("encounterDialog").showModal(); saveState();
}
const baseOpenFamiliarConversationExpanded = openFamiliarConversation;
openFamiliarConversation = function(id) {
  if (!EXPANDED_CONTACT_IDS.includes(id)) return baseOpenFamiliarConversationExpanded(id);
  ensureNpcState(); const npc = NPC_DATA[id]; if (!npc || !state.npcs?.[id]?.met) return; const data = ensureExpandedContactConversationState(id);
  if ((data.visit.counts[id] || 0) >= 3) { openExpandedContactStopping(id); return; }
  el("encounterTitle").textContent = `${npc.name} — A Familiar Conversation`;
  el("encounterText").textContent = buildExpandedContactConversation(id);
  el("encounterChoices").innerHTML = `<button class="secondary" type="button" onclick="closeFamiliarConversation()">Continue</button>`;
  el("encounterDialog").showModal(); data.visit.counts[id] = (data.visit.counts[id] || 0) + 1; saveState();
};
const baseRenderOverviewExpandedContacts = renderOverview;
renderOverview = function() {
  baseRenderOverviewExpandedContacts(); ensureNpcState();
  const localContact = Object.entries(NPC_DATA).find(([, npc]) => npc.location === state.location); if (!localContact) return;
  const [id, npc] = localContact; if (!EXPANDED_CONTACT_IDS.includes(id) || !state.npcs?.[id]?.met) return;
  const data = ensureExpandedContactConversationState(id); const cards = Array.from(view.querySelectorAll(".info-card"));
  const card = cards.find(node => node.textContent.includes(npc.name)); if (!card) return;
  let button = card.querySelector(".familiar-talk");
  if (!button) { card.insertAdjacentHTML("beforeend", `<button class="secondary familiar-talk" type="button" onclick="openFamiliarConversation('${id}')">Catch Up</button>`); button = card.querySelector(".familiar-talk"); }
  if (button) { const stopped = Boolean(data.visit.stopped[id]); button.disabled = stopped; button.textContent = stopped ? "Caught Up" : "Catch Up"; }
};
EXPANDED_CONTACT_IDS.forEach(ensureExpandedContactConversationState); saveState();

// ===== recurring-npc-conversations.js =====
const RECURRING_NPC_CONVERSATIONS = {
  nera: [
    { id: "hinge", text: "Nera is turning a bent access-panel hinge over in one hand. ‘Bad shape. Good metal.’ She says the two facts as if that settles the matter, then explains how she plans to straighten it without weakening the joint." },
    { id: "discard-bin", text: "Nera has been studying a station discard bin with more attention than most people give a storefront. ‘Half of recovery work is knowing the difference between abandoned and overlooked.’ She points out a sealed connector housing someone threw away because one mounting tab snapped." },
    { id: "tool-case", text: "Nera sets down her battered tool case and notices you looking at the patches along one corner. ‘Case is older than three ships I worked on. Still closes. Still keeps water out. No reason to replace a thing for surviving.’" },
    { id: "wrong-part", text: "Nera tells you about a crew that ordered a replacement assembly from two systems away before checking whether the failed part could be rebuilt locally. She shakes her head. ‘Expensive way to avoid five minutes of curiosity.’" },
    { id: "route-scrap", text: "Nera mentions finding a useful maintenance note on the back of an obsolete route printout. ‘Old information is not the same as useless information. You just have to know which part stopped being true.’" },
    { id: "quiet-joke", text: "Nera points toward a freshly installed panel beside an older one that has been repaired six times. ‘New one looks better.’ She waits a beat. ‘Old one knows what it's doing.’" },
    { id: "small-save", text: "Nera says she spent the morning recovering three serviceable couplings from a machine everyone else had written off. The couplings are ordinary, but she seems pleased. ‘Nothing dramatic. Just three things that don't need making twice.’" },
    { id: "frontier-value", text: "Nera watches a loading crew pass, then says, ‘Frontier teaches the wrong lesson if all you learn is scarcity. Better lesson is attention. There's usually more around than people notice.’" }
  ],
  tal: [
    { id: "late-dock", text: "Tal tells you his last delivery arrived on time only because the receiving dock was running late. ‘First time I've ever been saved by somebody else's bad scheduling.’ He seems almost disappointed that the universe made the joke before he could." },
    { id: "old-ship", text: "Tal asks whether your ship still starts cleanly on the first attempt. When you answer, he nods. ‘Then today it is a good ship. We can review the definition tomorrow.’" },
    { id: "meal-stop", text: "Tal recommends a cheap meal he found near another port, then immediately qualifies the recommendation. ‘Good food. Bad chairs. Depends how long you intend to sit.’" },
    { id: "cargo-crane", text: "Tal has another story about a loading crane, though this time the crane behaved perfectly and the operator did not. ‘Machines get blamed because they can't argue back.’" },
    { id: "weathered-jacket", text: "Tal is repairing a tear in his travel jacket with ugly but competent stitches. He notices your glance. ‘Courier rule: if it keeps the weather out, fashion has lost the argument.’" },
    { id: "short-hop", text: "Tal says the supposedly easy short hops are the ones that keep surprising him. ‘Long route, you prepare. Short route, you get confident. Confidence is when the cargo latch decides to develop a personality.’" },
    { id: "quiet-port", text: "Tal says he spent a whole evening at a port where nothing delayed him, broke, leaked, or required another signature. ‘Terrible story. Best stop I've had all month.’" },
    { id: "recognition", text: "Tal grins when he sees you. ‘We're getting dangerously close to knowing each other.’ He gives you a two-minute summary of where he's been since the last crossing, with no attempt to make any of it sound important." }
  ],
  vessa: [
    { id: "fair-price", text: "Vessa says a seller charged her slightly more than the lowest available price and she intends to return anyway. ‘The cargo was exactly as described, ready when promised, and no one wasted an hour pretending otherwise. That has value.’" },
    { id: "small-gossip", text: "Vessa offers you an utterly harmless piece of port gossip about two clerks who keep exchanging the same misplaced shipment form. ‘I am telling you first,’ she says, ‘so now the exchange is technically unbalanced.’" },
    { id: "remembered-name", text: "Vessa mentions a loader by name from a port you visited several trips ago. She notices your surprise. ‘Remembering who treated you well is cheaper than learning the same lesson twice.’" },
    { id: "bad-bargain", text: "Vessa describes watching someone win a very aggressive bargain and lose a reliable supplier in the same conversation. ‘They were delighted. I did not have the heart to explain the arithmetic.’" },
    { id: "ordinary-favor", text: "Vessa says another assessor covered one of her routine checks while she was delayed. She has already returned the favor elsewhere. ‘Nothing owed now. That is the pleasant part.’" },
    { id: "quiet-company", text: "For a little while Vessa seems content to share the same patch of station without turning it into an exchange. Eventually she says, ‘Do not worry. I am aware that companionship can survive without accounting.’" },
    { id: "reputation", text: "Vessa observes that ports remember consistency longer than brilliance. ‘One excellent deal becomes a story. Twenty dependable ones become a relationship.’" },
    { id: "next-meeting", text: "Vessa asks where you think the two of you will run into each other next. Before you can answer, she says, ‘No wager. I prefer some uncertainties to remain inexpensive.’" }
  ],
  koren: [
    { id: "coffee-unit", text: "Koren has a compact beverage heater opened on the table in front of him. ‘Crew said it worked intermittently.’ He points to a scorched contact. ‘Intermittent means broken when people are tired. More serious.’" },
    { id: "handle", text: "Koren notices you looking at the repaired handle on his equipment case. He gives it one firm tug. ‘Still good.’ After a pause he adds, ‘You are now part of the inspection schedule.’" },
    { id: "cheap-fastener", text: "Koren tells you about a galley unit disabled by one cheap fastener installed where a load-bearing one belonged. ‘Most expensive parts failure I saw all week. Part cost almost nothing.’" },
    { id: "crew-priority", text: "Koren says captains often call navigation or engines the most important systems aboard. ‘Ask them again after the food warmer fails on day six.’ He looks entirely serious." },
    { id: "repair-mark", text: "Koren points out a visible repair seam on one of his tools. ‘Some people hide repairs. Why? If the repair is good, it is proof somebody understood the problem.’" },
    { id: "overbuilt", text: "Koren describes a piece of old Kharok galley equipment as ‘properly overbuilt.’ When you smile at the phrase, he shrugs. ‘It is only overbuilt before the first accident.’" },
    { id: "maintenance", text: "Koren says the best maintenance job is the one nobody notices because nothing stops working. ‘Bad for stories. Good for lunch.’" },
    { id: "small-improvement", text: "Koren has replaced a flimsy latch on his cooking case with a heavier one he fabricated himself. He opens and closes it once, satisfied. ‘Not exciting. Better.’" }
  ]
};
function ensureRecurringNpcConversationState() {
  ensurePopulationState();
  Object.entries(state.npcPopulation.people).forEach(([id, person]) => {
    if (!Array.isArray(person.recentConversations)) person.recentConversations = [];
    if (!Number.isFinite(person.lastConversationJourney)) person.lastConversationJourney = -1;
    if (typeof person.lastConversationLocation !== "string") person.lastConversationLocation = "";
  });
}
function recurringNpcAlreadySpokenThisVisit(id) {
  ensureRecurringNpcConversationState(); const person = state.npcPopulation.people[id]; if (!person) return false;
  return person.lastConversationJourney === state.npcPopulation.journey && person.lastConversationLocation === state.location;
}
function chooseRecurringNpcConversation(id) {
  ensureRecurringNpcConversationState(); const person = state.npcPopulation.people[id]; const pool = RECURRING_NPC_CONVERSATIONS[id] || [];
  if (!person || !pool.length) return AMBIENT_NPCS[id]?.again || "You exchange a few words before moving on.";
  const fresh = pool.filter(item => !person.recentConversations.includes(item.id)); const choices = fresh.length ? fresh : pool;
  const chosen = choices[Math.floor(Math.random() * choices.length)];
  person.recentConversations = [chosen.id, ...person.recentConversations.filter(value => value !== chosen.id)].slice(0, 4); return chosen.text;
}
const baseOpenAmbientNpcForRecurringConversation = openAmbientNpc;
openAmbientNpc = function(id) {
  ensureRecurringNpcConversationState(); const npc = AMBIENT_NPCS[id]; const person = state.npcPopulation.people[id];
  if (!npc || !person || person.location !== state.location) return;
  if (!person.met) { baseOpenAmbientNpcForRecurringConversation(id); person.lastConversationJourney = state.npcPopulation.journey; person.lastConversationLocation = state.location; saveState(); return; }
  if (recurringNpcAlreadySpokenThisVisit(id)) return;
  el("encounterTitle").textContent = `${npc.name} — ${npc.role}`;
  el("encounterText").textContent = chooseRecurringNpcConversation(id);
  el("encounterChoices").innerHTML = `<button class="secondary" type="button" onclick="closeAmbientNpc('${id}')">Continue</button>`;
  el("encounterDialog").showModal();
  person.encounters = (person.encounters || 0) + 1; person.lastConversationJourney = state.npcPopulation.journey; person.lastConversationLocation = state.location;
  addLog(`You crossed paths with ${npc.name} again at ${GAME_DATA.systems[state.location].name}.`); saveState();
};
const baseRenderOverviewForRecurringConversation = renderOverview;
renderOverview = function() {
  ensureRecurringNpcConversationState(); baseRenderOverviewForRecurringConversation();
  ambientPeopleHere().forEach(([id]) => {
    if (!recurringNpcAlreadySpokenThisVisit(id)) return;
    const button = view.querySelector(`button[onclick="openAmbientNpc('${id}')"]`); if (!button) return;
    button.disabled = true; button.textContent = "Spoken";
  });
};
ensureRecurringNpcConversationState(); saveState();

// ===== contact-caught-up-state.js =====
const baseOpenExpandedContactStoppingCaughtUpState = openExpandedContactStopping;
openExpandedContactStopping = function(id) {
  baseOpenExpandedContactStoppingCaughtUpState(id);
  const button = view.querySelector(`.familiar-talk[onclick="openFamiliarConversation('${id}')"]`);
  if (!button) return;
  button.disabled = true;
  button.textContent = "Caught Up";
};

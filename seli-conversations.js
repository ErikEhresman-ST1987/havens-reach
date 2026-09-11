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

  if (!state.contactConversations.seli || typeof state.contactConversations.seli !== "object") {
    state.contactConversations.seli = { recentOpenings: [], recentSubjects: [], recentClosings: [], count: 0 };
  }
  const seli = state.contactConversations.seli;
  if (!Array.isArray(seli.recentOpenings)) seli.recentOpenings = [];
  if (!Array.isArray(seli.recentSubjects)) seli.recentSubjects = [];
  if (!Array.isArray(seli.recentClosings)) seli.recentClosings = [];
  if (!Number.isFinite(seli.count)) seli.count = 0;

  if (!state.contactConversations.mara || typeof state.contactConversations.mara !== "object") {
    state.contactConversations.mara = { recent: [], count: 0 };
  }
  const mara = state.contactConversations.mara;
  if (!Array.isArray(mara.recent)) mara.recent = [];
  if (!Number.isFinite(mara.count)) mara.count = 0;

  if (!state.contactConversations.recentStops || typeof state.contactConversations.recentStops !== "object") {
    state.contactConversations.recentStops = { mara: [], seli: [] };
  }
  if (!Array.isArray(state.contactConversations.recentStops.mara)) state.contactConversations.recentStops.mara = [];
  if (!Array.isArray(state.contactConversations.recentStops.seli)) state.contactConversations.recentStops.seli = [];

  if (!state.contactConversations.visit || typeof state.contactConversations.visit !== "object") {
    state.contactConversations.visit = { location: state.location, counts: {} };
  }
  if (state.contactConversations.visit.location !== state.location) {
    state.contactConversations.visit = { location: state.location, counts: {} };
  }
  if (!state.contactConversations.visit.counts || typeof state.contactConversations.visit.counts !== "object") {
    state.contactConversations.visit.counts = {};
  }

  return state.contactConversations;
}

function activeShipChassisId() {
  return state.ship?.chassisId || state.ship?.id || "wayfarer";
}

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

function maraConversationEligible(part) {
  if (part.requiresOldGantry && !state.stationProjects?.haven?.oldGantry?.completed) return false;
  return true;
}

function chooseFresh(parts, recentIds, eligibleTest = () => true) {
  const eligible = parts.filter(eligibleTest);
  if (!eligible.length) return parts[0];
  const fresh = eligible.filter(part => !recentIds.includes(part.id));
  const pool = fresh.length ? fresh : eligible;
  return pool[Math.floor(Math.random() * pool.length)];
}

function rememberRecent(list, id, limit) {
  const next = list.filter(value => value !== id);
  next.unshift(id);
  return next.slice(0, limit);
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
  memory.recent = rememberRecent(memory.recent, conversation.id, 4);
  memory.count += 1;
  return conversation.text;
}

function contactCatchUpCount(id) {
  const data = ensureContactConversationState();
  return data.visit.counts[id] || 0;
}

function incrementContactCatchUp(id) {
  const data = ensureContactConversationState();
  data.visit.counts[id] = contactCatchUpCount(id) + 1;
}

function buildContactStopping(id) {
  const data = ensureContactConversationState();
  const stops = CONTACT_STOPPINGS[id] || [];
  if (!stops.length) return "They turn back to the rest of their day. You can catch up again the next time you're through.";
  const recent = data.recentStops[id] || [];
  const stop = chooseFresh(stops, recent);
  data.recentStops[id] = rememberRecent(recent, stop.id, Math.min(3, stops.length - 1));
  return stop.text;
}

function openContactStopping(id) {
  const npc = NPC_DATA[id];
  if (!npc) return;
  el("encounterTitle").textContent = `${npc.name} — Back to the Day`;
  el("encounterText").textContent = buildContactStopping(id);
  el("encounterChoices").innerHTML = `<button class="secondary" type="button" onclick="closeFamiliarConversation()">Continue</button>`;
  el("encounterDialog").showModal();
  saveState();
}

// Replace Catch Up behavior only for Mara and Seli. Opportunity interactions remain untouched.
const baseOpenFamiliarConversationForContacts = openFamiliarConversation;
openFamiliarConversation = function(id) {
  if (id !== "mara" && id !== "seli") return baseOpenFamiliarConversationForContacts(id);

  ensureNpcState();
  const npc = NPC_DATA[id];
  if (!npc || !state.npcs?.[id]?.met) return;

  if (contactCatchUpCount(id) >= 3) {
    openContactStopping(id);
    return;
  }

  el("encounterTitle").textContent = `${npc.name} — A Familiar Conversation`;
  el("encounterText").textContent = id === "seli" ? buildSeliConversation() : buildMaraConversation();
  el("encounterChoices").innerHTML = `<button class="secondary" type="button" onclick="closeFamiliarConversation()">Continue</button>`;
  el("encounterDialog").showModal();
  incrementContactCatchUp(id);
  saveState();
};

// Once the stopping response has been seen, leave Catch Up visibly present but unavailable
// until the operator departs and later returns. No counter is shown to the player.
const baseRenderOverviewForContactConversationLimits = renderOverview;
renderOverview = function() {
  ensureContactConversationState();
  baseRenderOverviewForContactConversationLimits();

  const localContact = Object.entries(NPC_DATA).find(([, npc]) => npc.location === state.location);
  if (!localContact) return;
  const [id] = localContact;
  if (id !== "mara" && id !== "seli") return;

  const button = view.querySelector(`.familiar-talk[onclick="openFamiliarConversation('${id}')"]`);
  if (button && contactCatchUpCount(id) >= 3) button.disabled = true;
};

// Any successful departure begins a new station visit. This protects the reset even if
// the player does not open the Station tab while away before returning later.
const baseTravelForContactConversationVisits = travel;
travel = function(destination, fuelCost) {
  if (state.ship.fuel < fuelCost) return baseTravelForContactConversationVisits(destination, fuelCost);
  const data = ensureContactConversationState();
  data.visit = { location: null, counts: {} };
  return baseTravelForContactConversationVisits(destination, fuelCost);
};

ensureContactConversationState();
saveState();

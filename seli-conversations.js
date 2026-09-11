// Haven's Reach — Contact Conversation System #1
// Seli-only prototype: authored conversational vocabulary, contextual eligibility,
// compatible combinations, and recent-component suppression.
// No rewards, relationship gains, quests, or procedural free-form text.

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

function ensureSeliConversationState() {
  if (!state.contactConversations || typeof state.contactConversations !== "object") state.contactConversations = {};
  if (!state.contactConversations.seli || typeof state.contactConversations.seli !== "object") {
    state.contactConversations.seli = { recentOpenings: [], recentSubjects: [], recentClosings: [], count: 0 };
  }
  const s = state.contactConversations.seli;
  if (!Array.isArray(s.recentOpenings)) s.recentOpenings = [];
  if (!Array.isArray(s.recentSubjects)) s.recentSubjects = [];
  if (!Array.isArray(s.recentClosings)) s.recentClosings = [];
  if (!Number.isFinite(s.count)) s.count = 0;
  return s;
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

function chooseSeliPart(parts, recentIds) {
  const eligible = parts.filter(seliPartEligible);
  if (!eligible.length) return parts[0];
  const fresh = eligible.filter(part => !recentIds.includes(part.id));
  const pool = fresh.length ? fresh : eligible;
  return pool[Math.floor(Math.random() * pool.length)];
}

function rememberSeliPart(list, id, limit) {
  const next = list.filter(value => value !== id);
  next.unshift(id);
  return next.slice(0, limit);
}

function buildSeliConversation() {
  ensureNpcState();
  const memory = ensureSeliConversationState();
  const opening = chooseSeliPart(SELI_CONVERSATION_PARTS.openings, memory.recentOpenings);
  const subject = chooseSeliPart(SELI_CONVERSATION_PARTS.subjects, memory.recentSubjects);
  const closing = chooseSeliPart(SELI_CONVERSATION_PARTS.closings, memory.recentClosings);

  memory.recentOpenings = rememberSeliPart(memory.recentOpenings, opening.id, 4);
  memory.recentSubjects = rememberSeliPart(memory.recentSubjects, subject.id, 7);
  memory.recentClosings = rememberSeliPart(memory.recentClosings, closing.id, 4);
  memory.count += 1;

  return `${opening.text} ${subject.text} ${closing.text}`;
}

// Replace only Seli's Catch Up behavior. Mara and all opportunity interactions remain untouched.
const baseOpenFamiliarConversationForSeli = openFamiliarConversation;
openFamiliarConversation = function(id) {
  if (id !== "seli") return baseOpenFamiliarConversationForSeli(id);

  ensureNpcState();
  const npc = NPC_DATA.seli;
  if (!npc || !state.npcs?.seli?.met) return;

  el("encounterTitle").textContent = `${npc.name} — A Familiar Conversation`;
  el("encounterText").textContent = buildSeliConversation();
  el("encounterChoices").innerHTML = `<button class="secondary" type="button" onclick="closeFamiliarConversation()">Continue</button>`;
  el("encounterDialog").showModal();
  saveState();
};

ensureSeliConversationState();
saveState();

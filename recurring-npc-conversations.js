// Haven's Reach — Recurring NPC Conversation Depth #1
// Gives the four roaming People Around Port a small handcrafted conversation pool,
// suppresses recent repeats, and limits each person to one meaningful conversation
// per station visit. No rewards, relationship scores, quests, or new progression.

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
  ensureRecurringNpcConversationState();
  const person = state.npcPopulation.people[id];
  if (!person) return false;
  return person.lastConversationJourney === state.npcPopulation.journey && person.lastConversationLocation === state.location;
}

function chooseRecurringNpcConversation(id) {
  ensureRecurringNpcConversationState();
  const person = state.npcPopulation.people[id];
  const pool = RECURRING_NPC_CONVERSATIONS[id] || [];
  if (!person || !pool.length) return AMBIENT_NPCS[id]?.again || "You exchange a few words before moving on.";

  const fresh = pool.filter(item => !person.recentConversations.includes(item.id));
  const choices = fresh.length ? fresh : pool;
  const chosen = choices[Math.floor(Math.random() * choices.length)];
  person.recentConversations = [chosen.id, ...person.recentConversations.filter(value => value !== chosen.id)].slice(0, 4);
  return chosen.text;
}

const baseOpenAmbientNpcForRecurringConversation = openAmbientNpc;
openAmbientNpc = function(id) {
  ensureRecurringNpcConversationState();
  const npc = AMBIENT_NPCS[id];
  const person = state.npcPopulation.people[id];
  if (!npc || !person || person.location !== state.location) return;

  // Preserve the original first meeting exactly as authored.
  if (!person.met) {
    baseOpenAmbientNpcForRecurringConversation(id);
    person.lastConversationJourney = state.npcPopulation.journey;
    person.lastConversationLocation = state.location;
    saveState();
    return;
  }

  // These are chance encounters, not Contacts. One real conversation per station visit.
  if (recurringNpcAlreadySpokenThisVisit(id)) return;

  el("encounterTitle").textContent = `${npc.name} — ${npc.role}`;
  el("encounterText").textContent = chooseRecurringNpcConversation(id);
  el("encounterChoices").innerHTML = `<button class="secondary" type="button" onclick="closeAmbientNpc('${id}')">Continue</button>`;
  el("encounterDialog").showModal();

  person.encounters = (person.encounters || 0) + 1;
  person.lastConversationJourney = state.npcPopulation.journey;
  person.lastConversationLocation = state.location;
  addLog(`You crossed paths with ${npc.name} again at ${GAME_DATA.systems[state.location].name}.`);
  saveState();
};

const baseRenderOverviewForRecurringConversation = renderOverview;
renderOverview = function() {
  ensureRecurringNpcConversationState();
  baseRenderOverviewForRecurringConversation();

  ambientPeopleHere().forEach(([id]) => {
    if (!recurringNpcAlreadySpokenThisVisit(id)) return;
    const button = view.querySelector(`button[onclick="openAmbientNpc('${id}')"]`);
    if (!button) return;
    button.disabled = true;
    button.textContent = "Spoken";
  });
};

ensureRecurringNpcConversationState();
saveState();

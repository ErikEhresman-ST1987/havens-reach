// Haven's Reach — Contact Conversation Expansion #1
// Extends the proven Catch Up pattern to Lena, Orin, Draak, and Saeli.
// Three conversations per station visit, then one character-specific stopping response.
// No rewards, relationship gains, visible counters, timers, or new progression systems.

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
  const npcState = state.npcs?.[id];
  if (!npcState) return false;
  if (part.requiresMemory && !npcState.memory?.[part.requiresMemory]) return false;
  return true;
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
  const data = ensureExpandedContactConversationState(id);
  const memory = data[id];
  const parts = EXPANDED_CONTACT_CONVERSATIONS[id] || [];
  const eligible = parts.filter(part => expandedContactConversationEligible(id, part));
  const source = eligible.length ? eligible : parts;
  if (!source.length) return "You spend a few quiet minutes catching up.";
  const fresh = source.filter(part => !memory.recent.includes(part.id));
  const pool = fresh.length ? fresh : source;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  memory.recent = rememberRecent(memory.recent, chosen.id, Math.min(4, Math.max(1, source.length - 1)));
  memory.count += 1;
  return chosen.text;
}

function buildExpandedContactStopping(id) {
  const data = ensureExpandedContactConversationState(id);
  const stops = EXPANDED_CONTACT_STOPPINGS[id] || [];
  if (!stops.length) return "They turn back to the rest of their day. You can catch up again the next time you're through.";
  const recent = data.recentStops[id] || [];
  const fresh = stops.filter(stop => !recent.includes(stop.id));
  const pool = fresh.length ? fresh : stops;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  data.recentStops[id] = rememberRecent(recent, chosen.id, Math.min(3, stops.length - 1));
  return chosen.text;
}

function openExpandedContactStopping(id) {
  const data = ensureExpandedContactConversationState(id);
  const npc = NPC_DATA[id];
  if (!npc) return;
  data.visit.stopped[id] = true;
  el("encounterTitle").textContent = `${npc.name} — Back to the Day`;
  el("encounterText").textContent = buildExpandedContactStopping(id);
  el("encounterChoices").innerHTML = `<button class="secondary" type="button" onclick="closeFamiliarConversation()">Continue</button>`;
  el("encounterDialog").showModal();
  saveState();
}

const baseOpenFamiliarConversationExpanded = openFamiliarConversation;
openFamiliarConversation = function(id) {
  if (!EXPANDED_CONTACT_IDS.includes(id)) return baseOpenFamiliarConversationExpanded(id);

  ensureNpcState();
  const npc = NPC_DATA[id];
  if (!npc || !state.npcs?.[id]?.met) return;
  const data = ensureExpandedContactConversationState(id);

  if ((data.visit.counts[id] || 0) >= 3) {
    openExpandedContactStopping(id);
    return;
  }

  el("encounterTitle").textContent = `${npc.name} — A Familiar Conversation`;
  el("encounterText").textContent = buildExpandedContactConversation(id);
  el("encounterChoices").innerHTML = `<button class="secondary" type="button" onclick="closeFamiliarConversation()">Continue</button>`;
  el("encounterDialog").showModal();
  data.visit.counts[id] = (data.visit.counts[id] || 0) + 1;
  saveState();
};

const baseRenderOverviewExpandedContacts = renderOverview;
renderOverview = function() {
  baseRenderOverviewExpandedContacts();
  ensureNpcState();

  const localContact = Object.entries(NPC_DATA).find(([, npc]) => npc.location === state.location);
  if (!localContact) return;
  const [id, npc] = localContact;
  if (!EXPANDED_CONTACT_IDS.includes(id) || !state.npcs?.[id]?.met) return;

  const data = ensureExpandedContactConversationState(id);
  const cards = Array.from(view.querySelectorAll(".info-card"));
  const card = cards.find(node => node.textContent.includes(npc.name));
  if (!card) return;

  let button = card.querySelector(".familiar-talk");
  if (!button) {
    card.insertAdjacentHTML("beforeend", `<button class="secondary familiar-talk" type="button" onclick="openFamiliarConversation('${id}')">Catch Up</button>`);
    button = card.querySelector(".familiar-talk");
  }

  if (button) button.disabled = Boolean(data.visit.stopped[id]);
};

EXPANDED_CONTACT_IDS.forEach(ensureExpandedContactConversationState);
saveState();

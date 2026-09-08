// Haven's Reach — NPC Opportunities #1
// Handcrafted people, reusable opportunities. NPCs now participate repeatedly in the
// same economy, cargo, reputation, repair, and information systems as the player.
// No relationship arcs or quest tree: profession + relationship + memory select a
// small rotating pool of useful interactions that refresh after travel.

const NPC_OPPORTUNITY_PROFILES = {
  mara:  { types: ["partsFavor", "repairAdvice", "equipmentLead"] },
  seli:  { types: ["marketLead", "tradeFavor", "brokerOffer"] },
  lena:  { types: ["marketLead", "crewFavor", "routeAdvice"] },
  orin:  { types: ["routeAdvice", "surveyFavor", "marketLead"] },
  draak: { types: ["partsFavor", "industrialLead", "repairAdvice"] },
  saeli: { types: ["surveyFavor", "routeAdvice", "technicalLead"] }
};

function ensureNpcOpportunityState() {
  ensureNpcState();
  if (!state.npcOpportunities || typeof state.npcOpportunities !== "object") state.npcOpportunities = {};
  Object.keys(NPC_OPPORTUNITY_PROFILES).forEach(id => {
    if (!state.npcOpportunities[id]) {
      state.npcOpportunities[id] = { lastTrip: -99, current: null, completed: 0 };
    }
    const record = state.npcOpportunities[id];
    if (!Number.isFinite(record.lastTrip)) record.lastTrip = -99;
    if (!Number.isFinite(record.completed)) record.completed = 0;
  });
}

function npcOpportunityAvailable(id) {
  ensureNpcOpportunityState();
  const npcState = state.npcs[id];
  if (!npcState?.met) return false;
  const record = state.npcOpportunities[id];
  return Boolean(record.current) || state.tripCount - record.lastTrip >= 2;
}

function chooseNpcOpportunity(id) {
  ensureNpcOpportunityState();
  const record = state.npcOpportunities[id];
  if (record.current) return record.current;
  const pool = NPC_OPPORTUNITY_PROFILES[id]?.types || [];
  if (!pool.length) return null;
  const previous = record.previousType;
  const choices = pool.filter(type => type !== previous);
  const type = (choices.length ? choices : pool)[Math.floor(Math.random() * (choices.length ? choices.length : pool.length))];
  record.current = { type, createdTrip: state.tripCount };
  return record.current;
}

function finishNpcOpportunity(id, memoryKey, relationship = 1) {
  const record = state.npcOpportunities[id];
  const type = record.current?.type;
  record.previousType = type || record.previousType;
  record.current = null;
  record.lastTrip = state.tripCount;
  record.completed += 1;
  if (memoryKey) state.npcs[id].memory[memoryKey] = (state.npcs[id].memory[memoryKey] || 0) + 1;
  state.npcs[id].relationship += relationship;
}

function declineNpcOpportunity(id) {
  ensureNpcOpportunityState();
  const record = state.npcOpportunities[id];
  record.previousType = record.current?.type || record.previousType;
  record.current = null;
  record.lastTrip = state.tripCount;
  addLog(`${NPC_DATA[id].name} accepts that you have other work to do. Another opportunity may come up later.`);
  saveState();
  el("encounterDialog").close();
  render();
}

function knownMarketCandidates(goodIds) {
  if (typeof PORT_MARKET_BASES === "undefined") return [];
  return Object.entries(PORT_MARKET_BASES)
    .filter(([systemId]) => typeof isSystemKnown !== "function" || isSystemKnown(systemId))
    .flatMap(([systemId, catalog]) => goodIds
      .filter(id => Object.prototype.hasOwnProperty.call(catalog, id))
      .map(id => ({ systemId, goodId: id, price: typeof currentMarketPrice === "function" ? currentMarketPrice(systemId, id) : catalog[id] })))
    .filter(x => Number.isFinite(x.price));
}

function bestNpcMarketLead(id) {
  const preferences = {
    seli: ["vaccines", "veylaTextiles", "rareCollectibles", "specialtyFoods", "goldOre", "sensorComponents"],
    lena: ["medicine", "food", "machineParts", "preservedProduce", "vaccines"],
    orin: ["sensorComponents", "machineParts", "copperOre"]
  };
  const ids = (preferences[id] || []).map(x => x === "veylaTextiles" ? "veylanTextiles" : x);
  const candidates = knownMarketCandidates(ids);
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.price - a.price);
  return candidates[0];
}

function opportunityText(id, type) {
  const npc = NPC_DATA[id];
  const relation = npcRelationshipLabel(state.npcs[id].relationship);
  const texts = {
    marketLead: `${npc.name} has heard something useful in the local traffic and is willing to pass it along. Better relationships make operators more willing to share what they know.`,
    tradeFavor: `${npc.name} has a small commercial favor: supply one unit of Medical Supplies from your cargo. The payment is fair, but the real value is becoming someone the broker can rely on.`,
    brokerOffer: `${npc.name} can put your name on a private freight referral. It is not a formal contract—just a useful introduction and a modest referral payment.`,
    partsFavor: `${npc.name} needs one unit of Power Couplings from your cargo for a job that cannot wait for the normal supply chain.`,
    repairAdvice: `${npc.name} offers to look over the Wayfarer and point out the kind of wear an ordinary port inspection can miss.`,
    equipmentLead: `${npc.name} has heard where useful ship hardware is moving and offers to share the lead.`,
    crewFavor: `${npc.name} is helping an independent crew cover an unexpected expense and asks whether you can contribute 75 credits.`,
    routeAdvice: `${npc.name} has recent route talk worth comparing with your navigation notes.`,
    surveyFavor: `${npc.name} asks you to compare a short sensor sample with the Wayfarer's readings. Strong sensors make your contribution more useful.`,
    industrialLead: `${npc.name} has a practical read on what Red Mesa's industrial crews are consuming and producing right now.`,
    technicalLead: `${npc.name} has a technical observation from recent survey traffic that may help an independent operator.`
  };
  return `${texts[type] || `${npc.name} has something to discuss.`}\n\nCurrent relationship: ${relation}.`;
}

function opportunityChoices(id, type) {
  const choices = [];
  const add = (label, action) => choices.push({ label, action });

  if (type === "marketLead") add("Hear the market lead", `npcOppMarket:${id}`);
  if (type === "tradeFavor") add("Supply 1 Medical Supplies", `npcOppTrade:${id}`);
  if (type === "brokerOffer") add("Accept the referral", `npcOppBroker:${id}`);
  if (type === "partsFavor") add("Supply 1 Power Couplings", `npcOppParts:${id}`);
  if (type === "repairAdvice") add("Ask for the inspection", `npcOppRepair:${id}`);
  if (type === "equipmentLead") add("Hear the equipment lead", `npcOppEquipment:${id}`);
  if (type === "crewFavor") add("Contribute 75 credits", `npcOppCrew:${id}`);
  if (type === "routeAdvice") add("Compare route notes", `npcOppRoute:${id}`);
  if (type === "surveyFavor") add("Compare sensor readings", `npcOppSurvey:${id}`);
  if (type === "industrialLead") add("Hear the industrial read", `npcOppIndustrial:${id}`);
  if (type === "technicalLead") add("Hear the survey observation", `npcOppTechnical:${id}`);

  add("Not right now", `npcOppDecline:${id}`);
  return choices;
}

function openNpcOpportunity(id) {
  ensureNpcOpportunityState();
  const opportunity = chooseNpcOpportunity(id);
  if (!opportunity) return;
  const npc = NPC_DATA[id];
  el("encounterTitle").textContent = `${npc.name} — Opportunity`;
  el("encounterText").textContent = opportunityText(id, opportunity.type);
  el("encounterChoices").innerHTML = opportunityChoices(id, opportunity.type)
    .map(c => `<button class="secondary" type="button" onclick="resolveEncounter('${c.action}')">${escapeHtml(c.label)}</button>`)
    .join("");
  el("encounterDialog").showModal();
}

function resolveNpcOpportunity(action) {
  const parts = action.split(":");
  if (parts.length !== 2 || !parts[0].startsWith("npcOpp")) return false;
  const kind = parts[0];
  const id = parts[1];
  const npc = NPC_DATA[id];
  if (!npc || !state.npcs[id]) return false;

  if (kind === "npcOppDecline") {
    declineNpcOpportunity(id);
    return true;
  }

  let success = true;
  let log = "";

  if (kind === "npcOppMarket") {
    const lead = bestNpcMarketLead(id);
    if (lead) {
      const system = GAME_DATA.systems[lead.systemId];
      const good = GAME_DATA.commodities[lead.goodId];
      log = `${npc.name} passes along fresh trade talk: ${good.name} has been drawing attention around ${system.name}. Recent chatter puts it near ${credits(lead.price)}, though remote information can age quickly.`;
    } else log = `${npc.name} has no dependable price lead today, but shares enough traffic talk to help you read the local market. `;
    finishNpcOpportunity(id, "sharedOpportunity", 1);
  }

  if (kind === "npcOppTrade") {
    if ((state.cargo.medicine || 0) < 1) { success = false; log = "You do not have Medical Supplies in the hold."; }
    else {
      state.cargo.medicine -= 1;
      if (!state.cargo.medicine) delete state.cargo.medicine;
      state.credits += 95;
      finishNpcOpportunity(id, "completedFavor", 1);
      log = `${npc.name} takes the Medical Supplies and pays 95 cr. More importantly, the favor is remembered.`;
    }
  }

  if (kind === "npcOppBroker") {
    state.credits += 80 + Math.max(0, state.npcs[id].relationship) * 15;
    state.reputation += 1;
    finishNpcOpportunity(id, "acceptedReferral", 1);
    log = `${npc.name}'s referral produces a small piece of private work and improves your standing with local operators.`;
  }

  if (kind === "npcOppParts") {
    if ((state.cargo.machineParts || 0) < 1) { success = false; log = "You do not have Power Couplings in the hold."; }
    else {
      state.cargo.machineParts -= 1;
      if (!state.cargo.machineParts) delete state.cargo.machineParts;
      state.credits += 110;
      finishNpcOpportunity(id, "completedFavor", 1);
      log = `${npc.name} takes the Power Couplings, pays 110 cr, and remembers that you helped when the normal supply chain could not.`;
    }
  }

  if (kind === "npcOppRepair") {
    if (state.ship.hull < 100) {
      const restored = Math.min(3, 100 - state.ship.hull);
      state.ship.hull += restored;
      log = `${npc.name} catches a few small issues during the inspection and helps restore ${restored}% hull integrity at no charge.`;
    } else log = `${npc.name} gives the Wayfarer a careful inspection and finds nothing urgent. That is good news on a working ship.`;
    finishNpcOpportunity(id, "technicalHelp", 1);
  }

  if (kind === "npcOppEquipment") {
    log = `${npc.name} points out that specialized hardware is worth checking where it is actually built: Calder for navigation equipment, Red Mesa for industrial rigging, and Pelagos for survey sensors.`;
    finishNpcOpportunity(id, "sharedOpportunity", 1);
  }

  if (kind === "npcOppCrew") {
    if (state.credits < 75) { success = false; log = "You cannot spare 75 credits right now."; }
    else {
      state.credits -= 75;
      state.reputation += 1;
      finishNpcOpportunity(id, "helpedCrew", 2);
      log = `${npc.name} makes sure the stranded crew receives your 75 cr contribution. Independent captains notice who helps keep other operators moving.`;
    }
  }

  if (kind === "npcOppRoute") {
    const unknown = ["caldersDrift", "redMesa", "pelagos"].filter(x => typeof isSystemKnown === "function" && !isSystemKnown(x));
    if (unknown.length) log = `${npc.name} confirms that reliable traffic continues beyond your present charts, but refuses to dress uncertain coordinates up as a safe route. The information is useful even if it is not yet enough to navigate by.`;
    else log = `${npc.name} compares notes on the frontier chain and confirms that the maintained Haven–Meridian–Prospect–Calder–Red Mesa–Pelagos corridor remains the dependable route through known space.`;
    finishNpcOpportunity(id, "sharedRouteNotes", 1);
  }

  if (kind === "npcOppSurvey") {
    const bonus = state.ship.sensors >= 4 ? 90 : 40;
    state.credits += bonus;
    if (state.ship.sensors >= 4) state.reputation += 1;
    finishNpcOpportunity(id, "surveyHelp", 1);
    log = state.ship.sensors >= 4
      ? `${npc.name} finds your sensor comparison genuinely useful. You receive ${credits(bonus)} and a small reputation gain for dependable survey work.`
      : `${npc.name} can use part of your sensor sample and pays ${credits(bonus)}. Better sensors would make this kind of help more valuable.`;
  }

  if (kind === "npcOppIndustrial") {
    const ore = typeof currentMarketPrice === "function" ? currentMarketPrice("redMesa", "ore") : GAME_DATA.systems.redMesa?.market?.ore;
    const parts = typeof currentMarketPrice === "function" ? currentMarketPrice("redMesa", "miningComponents") : null;
    log = `${npc.name} says Red Mesa is still an ore-producing economy that depends heavily on imported necessities. Current local talk puts Industrial Ore near ${credits(ore || 0)}${parts ? ` and Mining Components near ${credits(parts)}` : ""}.`;
    finishNpcOpportunity(id, "sharedOpportunity", 1);
  }

  if (kind === "npcOppTechnical") {
    const reward = state.ship.sensors >= 5 ? 70 : 30;
    state.credits += reward;
    finishNpcOpportunity(id, "sharedSurveyData", 1);
    log = `${npc.name} compares your ship's recent readings with survey traffic and pays ${credits(reward)} for the useful cross-check. The exchange is small, but it makes your equipment and relationship matter.`;
  }

  if (!success) {
    addLog(log);
    el("encounterDialog").close();
    render();
    return true;
  }

  addLog(log);
  saveState();
  el("encounterDialog").close();
  render();
  return true;
}

// Add ongoing opportunities to the existing conversation rather than replacing introductions.
const openNpcInteractionBeforeOpportunities = openNpcInteraction;
openNpcInteraction = function openNpcInteractionWithOpportunities(id) {
  ensureNpcOpportunityState();
  const npcState = state.npcs[id];
  if (!npcState?.met) return openNpcInteractionBeforeOpportunities(id);

  const npc = NPC_DATA[id];
  el("encounterTitle").textContent = `${npc.name} — ${npc.role}`;
  el("encounterText").textContent = npcCallbackText(id);
  const available = npcOpportunityAvailable(id);
  el("encounterChoices").innerHTML = `
    ${available ? `<button class="secondary" type="button" onclick="openNpcOpportunity('${id}')">Ask what's going on</button>` : `<button class="secondary" type="button" disabled>No new opportunity right now</button>`}
    <button class="secondary" type="button" onclick="resolveEncounter('npcClose')">Continue</button>`;
  el("encounterDialog").showModal();
};

const resolveEncounterBeforeNpcOpportunities = resolveEncounter;
resolveEncounter = function resolveEncounterWithNpcOpportunities(action) {
  ensureNpcOpportunityState();
  if (typeof action === "string" && action.startsWith("npcOpp") && resolveNpcOpportunity(action)) return;
  resolveEncounterBeforeNpcOpportunities(action);
};

// Cantina contact cards show whether talking to a known NPC may produce something new.
const renderCantinaBeforeNpcOpportunities = renderCantina;
renderCantina = function renderCantinaWithNpcOpportunities() {
  ensureNpcOpportunityState();
  renderCantinaBeforeNpcOpportunities();
  const local = Object.entries(NPC_DATA).find(([, npc]) => npc.location === state.location);
  if (!local) return;
  const [id] = local;
  if (!state.npcs[id]?.met) return;
  const peopleCard = Array.from(view.querySelectorAll(".info-card")).find(card => card.querySelector("h3")?.textContent === "People");
  if (peopleCard) {
    const status = npcOpportunityAvailable(id) ? "They may have something useful to discuss." : "Nothing new right now. Check back after working the lanes.";
    peopleCard.insertAdjacentHTML("beforeend", `<p class="muted small">${escapeHtml(status)}</p>`);
  }
};

ensureNpcOpportunityState();
saveState();

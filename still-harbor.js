// Haven's Reach — Second Frontier Batch 1: Crimson Expanse & Still Harbor
// Adds one permanent outward gateway by registering content with the game's existing
// systems. No Information Convergence, gas extraction, refining, faction, or new
// upgrade mechanics are introduced here.

const STILL_HARBOR_ID = "stillHarbor";
const STILL_HARBOR_FUEL = 34;

GAME_DATA.systems[STILL_HARBOR_ID] = {
  name: "Still Harbor",
  type: "Second Frontier Gateway",
  description: "A sprawling independent station sheltered within the Crimson Expanse, assembled from old hulls, improvised additions, and newer systems that somehow operate as one dependable port.",
  neighbors: { pelagos: STILL_HARBOR_FUEL },
  market: {},
  overviewCards: [
    {
      title: "A Working Gateway",
      text: "Gas tanks, docking berths, trading galleries, repair crews, and outfitters have accumulated around the original safe anchorage. The station looks improvised because it grew to meet real needs—not because anyone stopped maintaining it."
    },
    {
      title: "Outbound Corridor",
      text: "Ships arrive with unfamiliar registry marks, take on supplies for journeys longer than a local circuit, and depart along vectors that do not appear on your chart. Still Harbor is supporting traffic bound somewhere farther out."
    }
  ],
  contracts: [
    {
      id: "still-helium-meridian",
      title: "Crimson Helium Lot",
      destination: "meridian",
      reward: 1180,
      cargo: { crimsonHelium: 3 },
      rep: 2,
      text: "Carry a routine industrial-gas shipment inward from Still Harbor to Meridian Exchange."
    },
    {
      id: "still-survey-support",
      title: "Prospecting Support Canisters",
      destination: "pelagos",
      reward: 720,
      cargo: { crimsonHelium: 1, machineParts: 1 },
      rep: 1,
      text: "Return sealed gas samples and field-service components to Pelagos for a survey team preparing another outward pass."
    },
    {
      id: "still-recovery-rig",
      title: "Recovery Rig Transfer",
      destination: "redMesa",
      reward: 1260,
      cargo: { miningComponents: 2 },
      rep: 2,
      text: "Move two compact recovery rigs inward to a Red Mesa freight cooperative for overhaul."
    }
  ]
};

GAME_DATA.systems.pelagos.neighbors[STILL_HARBOR_ID] = STILL_HARBOR_FUEL;

if (!GAME_DATA.systems.pelagos.contracts.some(contract => contract.id === "pelagos-still-harbor")) {
  GAME_DATA.systems.pelagos.contracts.push({
    id: "pelagos-still-harbor",
    title: "Gateway Provisioning Run",
    destination: STILL_HARBOR_ID,
    reward: 760,
    cargo: { food: 1, medicine: 1 },
    rep: 1,
    text: "Carry ordinary provisions through the Crimson Expanse to Still Harbor's busy docking population."
  });
}

Object.assign(GAME_DATA.commodities, {
  crimsonHelium: { name: "Crimson Helium", category: "Industrial Gases", finite: false },
  veyrite: { name: "Veyrite", category: "Industrial Gases", finite: true }
});

if (!MARKET_CATEGORIES.includes("Industrial Gases")) MARKET_CATEGORIES.push("Industrial Gases");

PORT_MARKET_BASES.stillHarbor = {
  food: 74,
  preservedProduce: 94,
  medicine: 82,
  antibiotics: 112,
  machineParts: 83,
  miningComponents: 106,
  sensorComponents: 119,
  luxuries: 132,
  crimsonHelium: 32,
  veyrite: 158
};
PORT_MARKET_BASES.meridian.crimsonHelium = 59;
PORT_MARKET_BASES.meridian.veyrite = 238;
PORT_MARKET_BASES.redMesa.crimsonHelium = 65;
PORT_MARKET_BASES.pelagos.crimsonHelium = 51;
PORT_MARKET_BASES.pelagos.veyrite = 214;

Object.assign(NPC_DATA, {
  keithMaxwell: {
    name: "Keith T. Maxwell",
    role: "Bartender",
    location: STILL_HARBOR_ID,
    intro: "Keith T. Maxwell works the room without appearing to manage it—remembering a miner's bad week, catching a courier's joke, and giving a quiet newcomer space to decide whether to talk. Still Harbor is the first place he found where belonging and being useful became the same thing."
  },
  gunant: {
    name: "Gunant",
    role: "Ruun Dockmaster",
    location: STILL_HARBOR_ID,
    intro: "Gunant has kept Still Harbor's mismatched docking systems working since its earliest days. He is crusty about careless berthing and unexpectedly patient with crews who are honestly trying. He speaks of the station's oldest improvised joints with the familiarity of someone describing rooms in his own home."
  },
  tayaln: {
    name: "Tayaln",
    role: "Veylan Gas Miner",
    location: STILL_HARBOR_ID,
    intro: "Tayaln's precise presentation suggests a broker until a loading supervisor asks where she wants her latest gas shipment stored. She answers without hesitation: the product is hers, extracted by her equipment and sold on terms she negotiated herself."
  }
});

Object.assign(CANTINA_DATA, {
  stillHarbor: {
    name: "Keith's Bar",
    contactId: "keithMaxwell",
    description: "A warm, crowded room assembled where two old hull sections meet a newer habitation spine. Keith's bar serves miners, traders, wanderers, pioneers, and crews provisioning for routes farther outward.",
    rumor: "Two guarded haulers are comparing fuel margins for a run beyond the local charts. Neither names the destination, but both are loading enough provisions for more than a trip back to Pelagos.",
    news: "STILL HARBOR TRAFFIC — Dock control has opened two overflow berths after another week of heavy outward provisioning. Arrivals are advised that repair and refueling services remain fully operational."
  }
});

Object.assign(STATION_IDENTITIES, {
  stillHarbor: {
    purpose: "Independent Gateway in the Crimson Expanse",
    administration: "Still Harbor Dock Cooperative",
    influence: "Gas miners • traders • prospectors • outward-bound independents",
    arrival: "Everything looks borrowed from somewhere else. Everything works.",
    region: "crimson-expanse",
    accent: "#bd6774",
    accent2: "#d2a76f",
    tint: "rgba(151, 43, 62, 0.14)",
    emblem: `
      <path d="M10 35c8-6 16-8 22-8s14 2 22 8" />
      <path d="M15 37v10h34V37" />
      <path d="M22 27V17h20v10" class="station-emblem-secondary" />
      <path d="M8 52h48" class="station-emblem-secondary" />
      <circle cx="32" cy="17" r="3" />`
  }
});

STATION_ARRIVAL_SCENES.stillHarbor = {
  label: "CRIMSON EXPANSE ANCHORAGE",
  caption: "Still Harbor • Outward gateway and independent provisioning port",
  art: () => `
    <svg class="station-scene still-harbor-scene" viewBox="0 0 900 220" role="img" aria-label="Still Harbor's mismatched but carefully maintained station sections sheltered within a dark crimson nebula" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="stillHarborSky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#090b13"/><stop offset=".58" stop-color="#2a111d"/><stop offset="1" stop-color="#4a1927"/></linearGradient>
        <radialGradient id="crimsonCloud"><stop offset="0" stop-color="#9f3f55" stop-opacity=".34"/><stop offset="1" stop-color="#531a2a" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="900" height="220" fill="url(#stillHarborSky)"/>
      <ellipse cx="675" cy="75" rx="260" ry="125" fill="url(#crimsonCloud)"/>
      <g fill="#f6dce3" opacity=".65"><circle cx="72" cy="38" r="1"/><circle cx="184" cy="70" r="1"/><circle cx="311" cy="30" r="1"/><circle cx="728" cy="42" r="1"/><circle cx="832" cy="74" r="1"/></g>
      <g fill="#0a1017" stroke="#bd6774" stroke-width="2">
        <path d="M106 122h250l34 23-34 23H106l-31-23z"/>
        <path d="M355 132h174l26 17-26 17H355z"/>
        <path d="M529 113h104v55H529z"/>
        <path d="M633 128h76l28 20-28 20h-76z"/>
      </g>
      <g fill="#101820" stroke="#d2a76f" stroke-width="2">
        <path d="M171 122l20-31h72l18 31"/>
        <path d="M405 132v-35h56v35"/>
        <path d="M568 113V78h25v35"/>
        <rect x="220" y="137" width="29" height="13" fill="#bd6774"/>
        <rect x="266" y="137" width="29" height="13" fill="#d2a76f"/>
      </g>
      <g stroke="#7f8792" stroke-width="2" fill="none"><path d="M83 169h654"/><path d="M132 169v20M329 169v20M496 168v21M687 168v21"/><path d="M623 92h68l23 18"/></g>
      <g fill="#d2a76f"><circle cx="752" cy="112" r="3"/><circle cx="786" cy="92" r="3"/><circle cx="824" cy="124" r="3"/></g>
      <g stroke="#d2a76f" stroke-width="1.5" opacity=".52"><path d="M738 114l-52 18"/><path d="M775 96l-64 31"/><path d="M812 126l-74 20"/></g>
    </svg>`
};

TRAVEL_MAP_POSITIONS.stillHarbor = [88, 84];

Object.assign(COMMODITY_ICON_PATHS, {
  crimsonHelium: `<path d="M11 10h18v22H11z"/><path d="M14 6h12v4M20 32v4"/><path d="M15 20c3-6 7-6 10 0-3 6-7 6-10 0z" class="commodity-icon-accent"/>`,
  veyrite: `<path d="M20 5l10 8-3 15-7 7-7-7-3-15z"/><path d="M14 13h12M13 28l7-15 7 15" class="commodity-icon-accent"/>`
});

Object.assign(NPC_VISUAL_IDENTITIES, {
  keithMaxwell: {
    accent: "#cb7d83",
    accent2: "#d2a76f",
    descriptor: "Still Harbor bartender",
    mark: `<path d="M23 17c3-6 15-6 18 0v11c0 7-4 12-9 12s-9-5-9-12z"/><path d="M18 54c3-9 8-13 14-13s11 4 14 13"/><path d="M26 32c4 3 8 3 12 0" class="npc-mark-secondary"/><path d="M47 18h10M52 13v10" class="npc-mark-secondary"/>`
  },
  gunant: {
    accent: "#af7880",
    accent2: "#91a5ae",
    descriptor: "Ruun dockmaster",
    mark: `<path d="M20 18l7-8h10l7 8 2 17-8 10H26l-8-10z"/><path d="M24 27h4M36 27h4"/><path d="M25 55l4-11h7l4 11"/><path d="M12 48h13M39 48h13" class="npc-mark-secondary"/><path d="M13 44l-4 4 4 4M51 44l4 4-4 4" class="npc-mark-secondary"/>`
  },
  tayaln: {
    accent: "#a98bd7",
    accent2: "#cf7784",
    descriptor: "Veylan gas miner",
    mark: `<path d="M25 13c-5 7-6 17-3 25l10 9 10-9c3-8 2-18-3-25-4-5-10-5-14 0z"/><path d="M19 54c4-7 8-10 13-10s9 3 13 10"/><path d="M49 14v23M45 18h8M45 33h8" class="npc-mark-secondary"/><circle cx="49" cy="25" r="3" class="npc-mark-secondary"/>`
  }
});

const npcCallbackTextBeforeStillHarbor = npcCallbackText;
npcCallbackText = function npcCallbackTextWithStillHarbor(id) {
  const npcState = state.npcs?.[id];
  if (!npcState?.met) return npcCallbackTextBeforeStillHarbor(id);

  if (id === "keithMaxwell") {
    if (npcState.memory.listenedAtBar) return "Keith remembers that you were willing to listen without steering every conversation toward business.";
    if (npcState.memory.askedAboutBelonging) return "Keith knows you understand that a useful place can become home before you notice it happening.";
  }
  if (id === "gunant") {
    if (npcState.memory.askedHowItWorks) return "Gunant remembers that you asked how the old and new systems cooperate instead of asking why the station looks mismatched.";
    if (npcState.memory.calledItHome) return "Gunant no longer needs to explain that Still Harbor is a home, not a posting he failed to leave.";
  }
  if (id === "tayaln") {
    if (npcState.memory.learnedCargoIsHers) return "Tayaln knows you understand that she extracts and sells her own gas rather than representing someone else's operation.";
    if (npcState.memory.respectedTerms) return "Tayaln remembers that you treated precise terms as professional courtesy, not needless formality.";
  }
  return npcCallbackTextBeforeStillHarbor(id);
};

const openNpcInteractionBeforeStillHarbor = openNpcInteraction;
openNpcInteraction = function openNpcInteractionWithStillHarbor(id) {
  if (!["keithMaxwell", "gunant", "tayaln"].includes(id)) return openNpcInteractionBeforeStillHarbor(id);
  ensureNpcState();
  const npc = NPC_DATA[id];
  const npcState = state.npcs[id];
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
    el("encounterChoices").innerHTML = choices.map(choice => `<button class="secondary" type="button" onclick="resolveEncounter('${choice.action}')">${escapeHtml(choice.label)}</button>`).join("");
  }
  el("encounterDialog").showModal();
};

const resolveEncounterBeforeStillHarbor = resolveEncounter;
resolveEncounter = function resolveEncounterWithStillHarbor(action) {
  ensureNpcState();
  const actions = {
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

  if (!actions[action]) return resolveEncounterBeforeStillHarbor(action);
  actions[action]();
  el("encounterDialog").close();
  render();
};

ensureNpcState();
ensureDynamicMarketState();
if (state.location === STILL_HARBOR_ID) rememberCurrentMarket();
saveState();

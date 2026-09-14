// Haven's Reach — World Data Foundation
// Authoritative handcrafted content for the permanent First Frontier.
// Behavior remains in the existing engine modules during staged architecture hardening.

const FIRST_FRONTIER_SYSTEMS = {
  haven: {
    name: "Haven",
    type: "Homeworld",
    description: "A declining mining world where old industries are fading and independent operators are beginning to look outward.",
    neighbors: { meridian: 18 },
    market: { ore: 18, food: 34, medicine: 61, machineParts: 47, luxuries: 86 },
    contracts: [
      { id: "haven-food", title: "Supply Run", destination: "meridian", reward: 220, cargo: { food: 2 }, rep: 1, text: "A family-owned canteen needs packaged food delivered to Meridian Exchange." },
      { id: "haven-survey", title: "Survey Data Courier", destination: "prospect", reward: 420, cargo: {}, rep: 1, text: "Carry sealed geological survey data to Prospect Reach." }
    ]
  },
  meridian: {
    name: "Meridian Exchange",
    type: "Commercial Hub",
    description: "A busy trade station where Veylan merchants, human freight brokers, and frontier crews cross paths.",
    neighbors: { haven: 18, prospect: 25 },
    market: { ore: 31, food: 24, medicine: 52, machineParts: 58, luxuries: 71 },
    contracts: [
      { id: "meridian-parts", title: "Machine Parts Delivery", destination: "prospect", reward: 310, cargo: { machineParts: 2 }, rep: 1, text: "A Kharok maintenance crew is short on replacement actuator assemblies." },
      { id: "meridian-meds", title: "Medical Priority", destination: "haven", reward: 260, cargo: { medicine: 1 }, rep: 1, text: "A clinic on Haven needs a small urgent shipment of medication." }
    ]
  },
  prospect: {
    name: "Prospect Reach",
    type: "Frontier Colony",
    description: "A young settlement at the edge of surveyed space, rich in opportunity and permanently short on something.",
    neighbors: { meridian: 25 },
    market: { ore: 22, food: 49, medicine: 76, machineParts: 72, luxuries: 102 },
    contracts: [
      { id: "prospect-samples", title: "Salvage Samples", destination: "meridian", reward: 360, cargo: {}, rep: 1, text: "Transport recovered drive components to a buyer at Meridian Exchange." },
      { id: "prospect-home", title: "Letter Packet", destination: "haven", reward: 180, cargo: {}, rep: 1, text: "Carry personal correspondence from frontier workers back toward Haven." }
    ]
  },
  caldersDrift: {
    name: "Calder's Drift",
    type: "Frontier Waystation",
    description: "A stubborn little waystation built around an old navigation platform beyond Prospect Reach, serving survey crews and independent haulers pushing farther outward.",
    neighbors: { prospect: 22, redMesa: 27 },
    market: { ore: 28, food: 57, medicine: 83, machineParts: 79, luxuries: 112 },
    contracts: [
      { id: "calder-parts", title: "Relay Components", destination: "redMesa", reward: 520, cargo: { machineParts: 1 }, rep: 1, text: "Carry replacement relay components to Red Mesa Junction." },
      { id: "calder-mail", title: "Frontier Dispatches", destination: "meridian", reward: 610, cargo: {}, rep: 1, text: "Carry accumulated dispatches back through Prospect Reach to Meridian Exchange." }
    ]
  },
  redMesa: {
    name: "Red Mesa Junction",
    type: "Mining & Freight Station",
    description: "A Kharok-heavy industrial station anchored above a mineral-rich red world. Ore moves outward; food, medicine, and machine parts move in.",
    neighbors: { caldersDrift: 27, pelagos: 31 },
    market: { ore: 14, food: 63, medicine: 88, machineParts: 66, luxuries: 124 },
    contracts: [
      { id: "mesa-ore", title: "Refined Ore Lot", destination: "meridian", reward: 760, cargo: { ore: 3 }, rep: 1, text: "Move a priority ore lot from Red Mesa to the Meridian commercial market." },
      { id: "mesa-med", title: "Clinic Resupply", destination: "pelagos", reward: 480, cargo: { medicine: 1 }, rep: 1, text: "A remote clinic at Pelagos needs sealed medical stores." }
    ]
  },
  pelagos: {
    name: "Pelagos Survey Anchorage",
    type: "Outer Survey Station",
    description: "An Elyri-led survey anchorage at the edge of dependable charts, quiet except for research craft, long-range scouts, and operators willing to haul what the station cannot make itself.",
    neighbors: { redMesa: 31 },
    market: { ore: 35, food: 68, medicine: 64, machineParts: 91, luxuries: 118 },
    contracts: [
      { id: "pelagos-data", title: "Deep Survey Archive", destination: "prospect", reward: 880, cargo: {}, rep: 2, text: "Carry a protected survey archive inward to Prospect Reach for duplication and analysis." },
      { id: "pelagos-supplies", title: "Research Exchange", destination: "redMesa", reward: 540, cargo: {}, rep: 1, text: "Deliver sealed research samples to a Kharok materials specialist at Red Mesa Junction." }
    ]
  }
};

const FIRST_FRONTIER_ADDITIONAL_CONTRACTS = {
  meridian: [
    {
      id: "meridian-pelagos",
      title: "Survey Instrument Delivery",
      destination: "pelagos",
      reward: 980,
      cargo: { machineParts: 2 },
      rep: 2,
      text: "Carry precision survey instruments from Meridian Exchange to Pelagos Survey Anchorage. Multiple jumps required."
    }
  ]
};

const FIRST_FRONTIER_CONTACTS = {
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
  },
  orin: {
    name: "Orin Vale",
    role: "Navigation Surveyor",
    location: "caldersDrift",
    intro: "Orin Vale is an independent navigation surveyor who helped turn scattered beacon reports into reliable routes around Calder's Drift. He treats good coordinates like other people treat money."
  },
  draak: {
    name: "Draak Tor",
    role: "Kharok Systems Engineer",
    location: "redMesa",
    intro: "Draak Tor supervises heavy freight systems at Red Mesa Junction. The Kharok engineer speaks in short practical sentences and has little patience for equipment that fails under honest work."
  },
  saeli: {
    name: "Saeli Ren",
    role: "Elyri Survey Coordinator",
    location: "pelagos",
    intro: "Saeli Ren coordinates long-range survey traffic from Pelagos. The Elyri navigator is quiet, observant, and more interested in what an operator notices than how impressively they describe it."
  }
};

const FIRST_FRONTIER_RECURRING_NPCS = {
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

// Dynamic-market content belongs to the world. The Dynamic Markets module owns
// price movement, stock, persistence, buying/selling, and market-memory behavior.
const FIRST_FRONTIER_MARKET_GOODS = {
  ore: { name: "Industrial Ore", category: "Processed Ore", finite: false },
  copperOre: { name: "Copper Concentrate", category: "Processed Ore", finite: true },
  goldOre: { name: "Gold-Bearing Ore", category: "Processed Ore", finite: true },
  food: { name: "Staple Rations", category: "Packaged Food", finite: false },
  preservedProduce: { name: "Preserved Produce", category: "Packaged Food", finite: true },
  specialtyFoods: { name: "Specialty Foods", category: "Packaged Food", finite: true },
  medicine: { name: "Medical Supplies", category: "Medicine", finite: false },
  antibiotics: { name: "Antibiotics", category: "Medicine", finite: true },
  vaccines: { name: "Vaccines", category: "Medicine", finite: true },
  machineParts: { name: "Power Couplings", category: "Machine Parts", finite: false },
  miningComponents: { name: "Mining Components", category: "Machine Parts", finite: true },
  sensorComponents: { name: "Sensor Components", category: "Machine Parts", finite: true },
  luxuries: { name: "Artisan Goods", category: "Luxury Goods", finite: false },
  veylanTextiles: { name: "Veylan Textiles", category: "Luxury Goods", finite: true },
  rareCollectibles: { name: "Rare Collectibles", category: "Luxury Goods", finite: true }
};

const FIRST_FRONTIER_MARKET_CATEGORIES = [
  "Processed Ore",
  "Packaged Food",
  "Medicine",
  "Machine Parts",
  "Luxury Goods"
];

const FIRST_FRONTIER_MARKET_BASES = {
  haven: {
    ore: 17, copperOre: 38, goldOre: 118,
    food: 33, medicine: 60,
    machineParts: 46, luxuries: 84
  },
  meridian: {
    ore: 30, copperOre: 46,
    food: 24, preservedProduce: 43, specialtyFoods: 72,
    medicine: 51, antibiotics: 82, vaccines: 108,
    machineParts: 57, miningComponents: 96, sensorComponents: 122,
    luxuries: 70, veylanTextiles: 128, rareCollectibles: 178
  },
  prospect: {
    food: 48, preservedProduce: 69,
    medicine: 74, antibiotics: 103, vaccines: 136,
    machineParts: 71, sensorComponents: 137,
    luxuries: 101
  },
  caldersDrift: {
    ore: 27, copperOre: 49,
    food: 56, preservedProduce: 76,
    medicine: 81,
    machineParts: 77, sensorComponents: 116,
    luxuries: 110
  },
  redMesa: {
    ore: 14, copperOre: 29, goldOre: 91,
    food: 62,
    medicine: 86, antibiotics: 112,
    machineParts: 65, miningComponents: 73,
    luxuries: 122
  },
  pelagos: {
    food: 67, preservedProduce: 84, specialtyFoods: 101,
    medicine: 63, antibiotics: 88, vaccines: 104,
    machineParts: 89, sensorComponents: 78,
    luxuries: 116, rareCollectibles: 154
  }
};

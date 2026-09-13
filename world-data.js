// Haven's Reach — World Data Foundation
// Authoritative handcrafted geography for the six permanent First Frontier systems.
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
    neighbors: { meridian: 25, caldersDrift: 22 },
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

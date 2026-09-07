const GAME_DATA = {
  systems: {
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
    }
  },
  commodities: {
    ore: { name: "Processed Ore" },
    food: { name: "Packaged Food" },
    medicine: { name: "Medicine" },
    machineParts: { name: "Machine Parts" },
    luxuries: { name: "Luxury Goods" }
  },
  upgrades: [
    { id: "cargo", name: "Cargo Expansion", cost: 550, text: "+4 cargo capacity", apply: state => state.ship.cargoCapacity += 4 },
    { id: "fuel", name: "Auxiliary Fuel Tank", cost: 500, text: "+20 fuel capacity and fuel", apply: state => { state.ship.fuelCapacity += 20; state.ship.fuel += 20; } },
    { id: "engines", name: "Engine Tune", cost: 700, text: "Improves escape options during encounters", apply: state => state.ship.engine += 1 },
    { id: "sensors", name: "Survey Sensor Package", cost: 650, text: "Improves exploration and distress-call outcomes", apply: state => state.ship.sensors += 1 }
  ],
  encounters: [
    {
      id: "pirates",
      title: "Pirate Intercept",
      text: "A patched-together cutter matches course and transmits a demand: hand over 100 credits or part of your cargo.",
      choices: [
        { label: "Pay 100 credits", action: "payPirates" },
        { label: "Try to outrun them", action: "escapePirates" },
        { label: "Offer one unit of cargo", action: "offerCargo" }
      ]
    },
    {
      id: "inspection",
      title: "Customs Inspection",
      text: "A customs patrol requests your manifest and asks you to hold position for a routine scan.",
      choices: [
        { label: "Comply with inspection", action: "complyInspection" },
        { label: "Request expedited clearance", action: "expediteInspection" }
      ]
    },
    {
      id: "distress",
      title: "Distress Call",
      text: "A small survey craft reports a coolant leak and asks passing ships for assistance.",
      choices: [
        { label: "Stop to help", action: "helpDistress" },
        { label: "Log the coordinates and continue", action: "skipDistress" }
      ]
    },
    {
      id: "failure",
      title: "Mechanical Trouble",
      text: "A coolant alarm flashes amber. The old transport can continue, but ignoring it may cost hull integrity.",
      choices: [
        { label: "Make a careful field repair", action: "repairFailure" },
        { label: "Push onward", action: "pushFailure" }
      ]
    }
  ]
};

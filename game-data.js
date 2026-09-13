const GAME_DATA = {
  systems: {
    haven: FIRST_FRONTIER_SYSTEMS.haven,
    meridian: FIRST_FRONTIER_SYSTEMS.meridian,
    prospect: FIRST_FRONTIER_SYSTEMS.prospect
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

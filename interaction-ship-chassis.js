// Haven's Reach — Expansion Foundation Pass 5D3
// Chassis-Aware Travel Encounter Migration
//
// Gives the ship-chassis system explicit precedence for the six travel encounter
// outcomes it modifies. Operator-mission outcomes remain outside this adapter
// because contract-variety.js is their later, intended owner.

const resolveShipChassisBeforeDispatcher = window.resolveEncounter;
const SHIP_CHASSIS_TRAVEL_ACTIONS = new Set([
  "pirateRun",
  "pirateHardBurn",
  "distressTow",
  "distressApproachBeacon",
  "failurePush",
  "failureHull"
]);

HavensInteractionDispatcher.registerEncounterInterceptor("ship-chassis-travel", action => {
  if (!SHIP_CHASSIS_TRAVEL_ACTIONS.has(action)) return false;
  resolveShipChassisBeforeDispatcher(action);
  return true;
});

HavensInteractionDispatcher.installEncounterGateway();

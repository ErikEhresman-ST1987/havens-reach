// Haven's Reach — Expansion Foundation Pass 5B regression repair
// Mission Depth Encounter Migration
//
// Keeps special-mission choice actions reachable through the explicit dispatcher.
// mission-depth.js remains the proven owner of mission outcomes.

const resolveMissionDepthBeforeDispatcher = window.resolveEncounter;
const MISSION_DEPTH_ACTIONS = new Set([
  "missionSciencePrecision",
  "missionScienceWide",
  "missionMiningStable",
  "missionMiningDense",
  "missionTransportFast",
  "missionTransportDocumented",
  "missionSalvageRecorder",
  "missionSalvageSearch"
]);

HavensInteractionDispatcher.registerEncounterHandler("mission-depth", action => {
  if (!MISSION_DEPTH_ACTIONS.has(action)) return false;
  resolveMissionDepthBeforeDispatcher(action);
  return true;
});

HavensInteractionDispatcher.installEncounterGateway();

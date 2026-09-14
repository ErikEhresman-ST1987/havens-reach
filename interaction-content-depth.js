// Haven's Reach — Expansion Foundation Pass 5B regression repair
// Content Depth Encounter Migration
//
// Preserves content-depth NPC and travel encounter actions when later interaction
// adapters reinstall the authoritative encounter gateway.

const resolveContentDepthBeforeDispatcher = window.resolveEncounter;
const CONTENT_DEPTH_ENCOUNTER_ACTIONS = new Set([
  "depthPirateChallenge",
  "depthPirateFee",
  "depthPirateBurn",
  "depthAuditComply",
  "depthAuditRecord",
  "depthProspectorFuel",
  "depthProspectorParts",
  "depthProspectorRoute",
  "depthClampSecure",
  "depthClampMonitor",
  "depthClampRisk"
]);

HavensInteractionDispatcher.registerEncounterHandler("content-depth", action => {
  if (typeof action !== "string") return false;
  if (!action.startsWith("npcDepth:") && !CONTENT_DEPTH_ENCOUNTER_ACTIONS.has(action)) return false;
  resolveContentDepthBeforeDispatcher(action);
  return true;
});

HavensInteractionDispatcher.installEncounterGateway();

// Haven's Reach — Expansion Foundation Pass 5B2
// Persistent Contact Encounter Action Migration
//
// Routes the proven npc-persistence encounter actions through the explicit interaction
// dispatcher. Contact presentation/opening behavior remains owned by npc-persistence.js
// and will be addressed separately during NPC interaction routing work.

const resolveNpcPersistenceBeforeDispatcher = window.resolveEncounter;
const NPC_PERSISTENCE_ACTIONS = new Set([
  "npcMaraGrateful",
  "npcMaraBusiness",
  "npcSeliShare",
  "npcSeliPrivate",
  "npcLenaSupport",
  "npcLenaProfessional",
  "npcLenaTow",
  "npcLenaGuidance",
  "npcLenaLeave",
  "npcClose"
]);

HavensInteractionDispatcher.registerEncounterHandler("npc-persistence", action => {
  if (!NPC_PERSISTENCE_ACTIONS.has(action)) return false;
  resolveNpcPersistenceBeforeDispatcher(action);
  return true;
});

// Remove this owner's legacy resolver wrapper from the active chain. Later modules may
// still wrap the gateway until their own Pass 5 migrations are completed.
HavensInteractionDispatcher.installEncounterGateway();

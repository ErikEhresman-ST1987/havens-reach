// Haven's Reach — Expansion Foundation Pass 5C1
// Core Contact Interaction Migration

const openCoreNpcInteractionBeforeDispatcher = window.openNpcInteraction;
const CORE_CONTACT_IDS = new Set(["mara", "seli", "lena"]);

HavensInteractionDispatcher.registerNpcInteractionHandler("npc-core", id => {
  if (!CORE_CONTACT_IDS.has(id)) return false;
  openCoreNpcInteractionBeforeDispatcher(id);
  return true;
});

HavensInteractionDispatcher.installNpcInteractionGateway();

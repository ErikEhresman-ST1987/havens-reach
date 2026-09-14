// Haven's Reach — Expansion Foundation Pass 5B1
// Rich Encounter Action Migration
//
// Registers the proven richer-encounters resolver with the explicit interaction
// dispatcher. Rich encounter content and outcomes remain owned by richer-encounters.js.

const resolveRichEncounterBeforeDispatcher = window.resolveEncounter;
const RICH_ENCOUNTER_ACTIONS = new Set(
  Object.values(RICH_ENCOUNTERS)
    .flat()
    .flatMap(encounter => encounter.choices || [])
    .map(choice => choice.action)
);

HavensInteractionDispatcher.registerEncounterHandler("rich-encounters", action => {
  if (!RICH_ENCOUNTER_ACTIONS.has(action)) return false;
  resolveRichEncounterBeforeDispatcher(action);
  return true;
});

HavensInteractionDispatcher.installEncounterGateway();

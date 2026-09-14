// Haven's Reach — Expansion Foundation Pass 5B5
// Station Development Encounter Migration
//
// Routes the four proven station-development encounter families through the explicit
// dispatcher while leaving station-development.js behavior and ordering intact.

const resolveStationDevelopmentBeforeDispatcher = window.resolveEncounter;

function stationDevelopmentEncounterAction(action) {
  if (typeof action !== "string") return false;

  return action === "meridianBerthAccept" ||
    action === "meridianBerthLater" ||
    action === "prospectDockAccept" ||
    action === "prospectDockLater" ||
    action === "prospectRecoveryLater" ||
    action.startsWith("prospectRecoveryAccept:") ||
    action === "calderRelayBuild" ||
    action === "calderRelayLater" ||
    action === "calderRelayInconclusive" ||
    action.startsWith("calderRelayAccept:") ||
    action.startsWith("calderRelayDecline:") ||
    action === "pelagosArrayAccept" ||
    action === "pelagosArrayLater" ||
    action === "pelagosAnalysisReview";
}

HavensInteractionDispatcher.registerEncounterHandler("station-development", action => {
  if (!stationDevelopmentEncounterAction(action)) return false;
  resolveStationDevelopmentBeforeDispatcher(action);
  return true;
});

// Remove the station-development resolver wrapper family from the active encounter path.
HavensInteractionDispatcher.installEncounterGateway();

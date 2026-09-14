// Haven's Reach — Expansion Foundation Pass 5B5 / 5E2
// Station Development Interaction Migration
//
// Routes the four proven station-development encounter and NPC interaction
// families through the explicit dispatcher while station-development.js remains
// the owner of their established behavior and precedence.

const resolveStationDevelopmentBeforeDispatcher = window.resolveEncounter;
const openStationDevelopmentBeforeDispatcher = window.openNpcInteraction;

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

function stationDevelopmentNpcInteractionAvailable(id) {
  if (id === "seli") {
    ensureMeridianTradeBerthState();
    return meridianTradeBerthPending();
  }

  if (id === "lena") {
    ensureProspectServiceDockState();
    return prospectServiceDockPending() || prospectRecoveryLeadAvailable();
  }

  if (id === "orin") {
    ensureCalderNavigationRelayState();
    return calderNavigationRelayPending() || calderRelayAnalysisAvailable();
  }

  if (id === "saeli") {
    ensurePelagosSurveyArrayState();
    return pelagosSurveyArrayPending() || pelagosAnalysisReady();
  }

  return false;
}

HavensInteractionDispatcher.registerEncounterHandler("station-development", action => {
  if (!stationDevelopmentEncounterAction(action)) return false;
  resolveStationDevelopmentBeforeDispatcher(action);
  return true;
});

HavensInteractionDispatcher.registerNpcInteractionHandler("station-development", id => {
  if (!stationDevelopmentNpcInteractionAvailable(id)) return false;
  openStationDevelopmentBeforeDispatcher(id);
  return true;
});

// Remove the station-development wrapper families from the active public paths.
HavensInteractionDispatcher.installEncounterGateway();
HavensInteractionDispatcher.installNpcInteractionGateway();

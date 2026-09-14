// Haven's Reach — Expansion Foundation Pass 5D2
// Smuggling Customs Interception Migration
//
// Runs restricted-cargo detection before the normal customs encounter owner.
// Returning false preserves the established customs outcome after an undetected
// scan; returning true stops resolution after confiscation and contract failure.

HavensInteractionDispatcher.registerEncounterInterceptor("smuggling-customs", action => {
  if (!hasActiveContrabandAtDestination() || !customsActionActuallyScans(action)) return false;

  const chance = currentSmugglingDetectionChance();
  if (Math.random() < chance) {
    const dampener = installedCargoDampener();
    const detail = dampener
      ? `${dampener.name} reduced the scan risk, but the cargo signature was still detected.`
      : "The customs scan detected an undeclared restricted cargo signature.";

    failSmugglingContract(detail);
    if (el("encounterDialog").open) el("encounterDialog").close();
    render();
    return true;
  }

  addLog(`Customs scanned the hold but did not identify the restricted cargo. Detection risk on this scan was ${Math.round(chance * 100)}%.`);
  return false;
});

HavensInteractionDispatcher.installEncounterGateway();

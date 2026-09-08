// Haven's Reach — Mission Depth #1
// Adds one meaningful operational decision to each proven special mission type.
// Reuses the existing mission, encounter-dialog, ship-condition, cargo, and reputation systems.
// No branching quest engine or new career layer.

const performOperatorMissionBeforeDepth = performOperatorMission;

function openMissionChoice(title, text, choices) {
  el("encounterTitle").textContent = title;
  el("encounterText").textContent = text;
  el("encounterChoices").innerHTML = choices
    .map(choice => `<button class="secondary" type="button" onclick="resolveEncounter('${choice.action}')">${escapeHtml(choice.label)}</button>`)
    .join("");
  el("encounterDialog").showModal();
}

performOperatorMission = function performDeeperOperatorMission() {
  const contract = state.activeContract;
  if (!isOperatorMission(contract) || contract.destination !== state.location || !contract.missionReady) {
    return performOperatorMissionBeforeDepth();
  }

  if (contract.kind === "science") {
    return openMissionChoice(
      "Beacon Calibration Survey",
      "The calibration zone contains the expected navigation beacons, but your instruments also show faint returns outside the standard survey corridor. You can complete the assigned precision sweep or widen the scan and spend time investigating the weaker signals.",
      [
        { label: "Run the precision calibration", action: "missionSciencePrecision" },
        { label: "Widen the survey sweep", action: "missionScienceWide" }
      ]
    );
  }

  if (contract.kind === "mining") {
    if ((state.ship.cargoCapacity - cargoUsed()) < 2) {
      addLog("The extraction shift needs two free cargo spaces for recovered ore.");
      return render();
    }
    return openMissionChoice(
      "Independent Extraction Shift",
      "The cooperative has assigned you a stable ore seam. A denser pocket is also reachable, but working it will put more strain on a utility transport not built as a dedicated mining vessel.",
      [
        { label: "Work the stable seam", action: "missionMiningStable" },
        { label: "Push into the dense pocket", action: "missionMiningDense" }
      ]
    );
  }

  if (contract.kind === "transport") {
    return openMissionChoice(
      "Detainee Transfer",
      "Haven security is ready to receive the commercial detainee. Port staff offer a quick sealed handoff, while the detainee asks that you remain through the slower documented transfer so there is an independent record of the exchange.",
      [
        { label: "Use the expedited handoff", action: "missionTransportFast" },
        { label: "Stay for the documented transfer", action: "missionTransportDocumented" }
      ]
    );
  }

  if (contract.kind === "salvage") {
    if ((state.ship.cargoCapacity - cargoUsed()) < 1) {
      addLog("You need one free cargo space to bring the recovered recorder aboard.");
      return render();
    }
    return openMissionChoice(
      "Lost Recorder Recovery",
      "You have isolated the recorder beacon among scattered approach debris. The contracted recorder can be recovered immediately, or you can spend additional time scanning the debris field for anything else worth bringing aboard.",
      [
        { label: "Recover the recorder and leave", action: "missionSalvageRecorder" },
        { label: "Search the surrounding debris", action: "missionSalvageSearch" }
      ]
    );
  }

  return performOperatorMissionBeforeDepth();
};

const resolveEncounterBeforeMissionDepth = resolveEncounter;
resolveEncounter = function resolveMissionDepth(action) {
  const contract = state.activeContract;

  function closeDialog() {
    if (el("encounterDialog").open) el("encounterDialog").close();
  }

  if (action === "missionSciencePrecision" && contract?.kind === "science") {
    closeDialog();
    const detail = state.ship.sensors >= 5
      ? "Your high-grade sensors produced an exceptionally clean calibration set with enough detail to flag several minor navigation errors."
      : "You completed the assigned calibration sweep and returned a clean, dependable navigation data set.";
    return finishOperatorMission(detail);
  }

  if (action === "missionScienceWide" && contract?.kind === "science") {
    closeDialog();
    if (state.ship.sensors >= 5) {
      state.credits += 140;
      state.reputation += 1;
      return finishOperatorMission("The wider sweep resolved several faint returns into useful secondary survey data. Pelagos added a 140-credit research bonus and your thorough work improved your standing.");
    }
    if (state.ship.sensors >= 3) {
      return finishOperatorMission("The wider sweep found interesting but inconclusive returns. You completed the assigned calibration successfully, but the extra signals will need better instruments before they become useful.");
    }
  }

  if (action === "missionMiningStable" && contract?.kind === "mining") {
    closeDialog();
    if ((state.ship.cargoCapacity - cargoUsed()) < 2) {
      addLog("The stable seam still requires two free cargo spaces.");
      return render();
    }
    state.cargo.ore = (state.cargo.ore || 0) + 2;
    return finishOperatorMission("You worked the stable seam cleanly and kept 2 units of processed ore as your material share.");
  }

  if (action === "missionMiningDense" && contract?.kind === "mining") {
    closeDialog();
    if ((state.ship.cargoCapacity - cargoUsed()) < 3) {
      addLog("The denser pocket could yield three units, but you need three free cargo spaces before attempting it.");
      return render();
    }
    state.cargo.ore = (state.cargo.ore || 0) + 3;
    state.ship.hull = Math.max(1, state.ship.hull - 4);
    return finishOperatorMission("You pushed into the denser pocket and came away with 3 units of processed ore. The rough extraction cost the Wayfarer 4% hull integrity.");
  }

  if (action === "missionTransportFast" && contract?.kind === "transport") {
    closeDialog();
    state.credits += 75;
    return finishOperatorMission("You used Haven's expedited sealed handoff. Port security added a 75-credit handling premium and the transfer closed quickly.");
  }

  if (action === "missionTransportDocumented" && contract?.kind === "transport") {
    closeDialog();
    state.reputation += 1;
    return finishOperatorMission("You stayed through the documented transfer and signed the independent handoff record. It took longer, but your careful handling earned additional operator standing.");
  }

  if (action === "missionSalvageRecorder" && contract?.kind === "salvage") {
    closeDialog();
    return finishOperatorMission("You recovered the contracted flight recorder intact and left the debris field without taking unnecessary risks.");
  }

  if (action === "missionSalvageSearch" && contract?.kind === "salvage") {
    closeDialog();
    if (state.ship.sensors >= 4 && (state.ship.cargoCapacity - cargoUsed()) >= 2) {
      state.cargo.machineParts = (state.cargo.machineParts || 0) + 1;
      return finishOperatorMission("Your sensors picked a serviceable component out of the surrounding debris. You recovered the flight recorder plus 1 unit of machine parts that had no active claim attached.");
    }
    if (state.ship.sensors >= 4) {
      return finishOperatorMission("Your sensors found a serviceable component in the debris, but with no spare cargo room beyond the recorder you marked its coordinates and completed the contracted recovery.");
    }
    state.ship.hull = Math.max(1, state.ship.hull - 3);
    return finishOperatorMission("The weak sensors made the debris search slow and close. You recovered the recorder, but a minor impact cost the ship 3% hull integrity and nothing else proved worth salvaging.");
  }

  return resolveEncounterBeforeMissionDepth(action);
};

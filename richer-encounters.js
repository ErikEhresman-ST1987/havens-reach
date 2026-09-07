// Haven's Reach — Smallest Meaningful Upgrade #3
// Adds variation and consequence inside the four existing encounter families.
// Core travel, economy, contracts, saves, and UI structure are unchanged.

const RICH_ENCOUNTERS = {
  pirates: [
    {
      title: "Pirate Toll",
      text: "A scarred courier cuts across your route. Its captain demands 100 credits for 'safe passage.'",
      choices: [
        { label: "Pay 100 credits", action: "piratePay" },
        { label: "Try to outrun them", action: "pirateRun" },
        { label: "Offer one unit of cargo", action: "pirateCargo" }
      ]
    },
    {
      title: "Desperate Raiders",
      text: "An aging cutter hails you. The crew sounds more desperate than threatening and asks for supplies before their reactor fails.",
      choices: [
        { label: "Give one unit of cargo", action: "raiderAid" },
        { label: "Offer 60 credits", action: "raiderCredits" },
        { label: "Decline and leave", action: "raiderLeave" }
      ]
    },
    {
      title: "Known Pirate Crew",
      text: "A pirate ship broadcasts a familiar call sign. They have heard of independent operators working this route and want a payment.",
      choices: [
        { label: "Use your reputation", action: "pirateReputation" },
        { label: "Pay 120 credits", action: "piratePay120" },
        { label: "Make a hard burn", action: "pirateHardBurn" }
      ]
    }
  ],

  inspection: [
    {
      title: "Routine Customs Inspection",
      text: "A customs patrol requests your manifest and asks you to hold position for a routine scan.",
      choices: [
        { label: "Comply", action: "customsComply" },
        { label: "Request expedited clearance", action: "customsExpedite" }
      ]
    },
    {
      title: "Cargo Spot Check",
      text: "Customs has increased inspections on this route. An officer asks to verify two cargo seals against your manifest.",
      choices: [
        { label: "Allow the inspection", action: "customsSpotCheck" },
        { label: "Ask for professional courtesy", action: "customsCourtesy" }
      ]
    },
    {
      title: "Priority Traffic Control",
      text: "A customs controller is clearing a congested approach lane. Trusted operators may be waved through ahead of the queue.",
      choices: [
        { label: "Request priority clearance", action: "customsPriority" },
        { label: "Wait your turn", action: "customsWait" }
      ]
    }
  ],

  distress: [
    {
      title: "Survey Craft in Distress",
      text: "A small survey craft reports a coolant leak. Their crew asks whether you can help stabilize the damaged system.",
      choices: [
        { label: "Use your sensors to assist", action: "distressSurvey" },
        { label: "Log the coordinates and continue", action: "distressSkip" }
      ]
    },
    {
      title: "Medical Shuttle Emergency",
      text: "A medical shuttle has lost part of its reserve power. Several patients need to reach the next port safely.",
      choices: [
        { label: "Transfer 8 fuel as emergency power", action: "distressMedicalFuel" },
        { label: "Donate one unit of Medicine", action: "distressMedicalCargo" },
        { label: "Relay the emergency and continue", action: "distressMedicalRelay" }
      ]
    },
    {
      title: "Disabled Frontier Freighter",
      text: "A loaded freighter has suffered an engine-control failure. Its captain asks you to help pull the ship clear of a hazardous drift zone.",
      choices: [
        { label: "Attempt the tow", action: "distressTow" },
        { label: "Transmit repair guidance", action: "distressGuidance" },
        { label: "Continue on course", action: "distressSkip" }
      ]
    },
    {
      title: "Uncertain Distress Beacon",
      text: "Your receiver catches a weak automated distress beacon from an unregistered vessel. The signal pattern is unusual.",
      choices: [
        { label: "Scan before approaching", action: "distressScanBeacon" },
        { label: "Approach immediately", action: "distressApproachBeacon" },
        { label: "Mark the beacon and continue", action: "distressSkip" }
      ]
    }
  ],

  failure: [
    {
      title: "Coolant System Warning",
      text: "A coolant alarm flashes amber. The ship can continue, but ignoring it may cost hull integrity.",
      choices: [
        { label: "Make a careful field repair", action: "failureRepair" },
        { label: "Push onward", action: "failurePush" }
      ]
    },
    {
      title: "Navigation Relay Fault",
      text: "Your navigation relay begins dropping position updates. The fault is manageable, but the route solution is degrading.",
      choices: [
        { label: "Recalibrate with ship sensors", action: "failureSensors" },
        { label: "Replace the relay for 55 credits", action: "failureRelay" }
      ]
    },
    {
      title: "Micrometeorite Strike",
      text: "A cluster of micrometeorites rattles across the hull. One impact has damaged an exterior service panel.",
      choices: [
        { label: "Stop and patch the panel", action: "failurePatch" },
        { label: "Trust the hull and continue", action: "failureHull" }
      ]
    }
  ]
};

let activeRichEncounter = null;

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function removeOneCargo(preferredId = null) {
  let id = preferredId && state.cargo[preferredId] ? preferredId : Object.keys(state.cargo)[0];
  if (!id) return null;
  state.cargo[id] -= 1;
  if (!state.cargo[id]) delete state.cargo[id];
  return id;
}

showRandomEncounter = function() {
  const family = randomFrom(GAME_DATA.encounters).id;
  const variants = RICH_ENCOUNTERS[family] || [];
  activeRichEncounter = variants.length ? randomFrom(variants) : null;
  if (!activeRichEncounter) return;

  el("encounterTitle").textContent = activeRichEncounter.title;
  el("encounterText").textContent = activeRichEncounter.text;
  el("encounterChoices").innerHTML = activeRichEncounter.choices
    .map(choice => `<button class="secondary" type="button" onclick="resolveEncounter('${choice.action}')">${escapeHtml(choice.label)}</button>`)
    .join("");
  el("encounterDialog").showModal();
};

resolveEncounter = function(action) {
  const actions = {
    piratePay() {
      const paid = Math.min(100, state.credits);
      state.credits -= paid;
      addLog(`Paid the pirate toll: ${credits(paid)}.`);
    },
    pirateRun() {
      const chance = Math.min(0.9, 0.42 + state.ship.engine * 0.13);
      if (Math.random() < chance) addLog("Your engines carried you clear before the pirate could match the burn.");
      else {
        state.ship.hull = Math.max(1, state.ship.hull - 10);
        addLog("You escaped, but the hard maneuver cost 10% hull integrity.");
      }
    },
    pirateCargo() {
      const cargoId = removeOneCargo();
      if (cargoId) addLog(`The pirates accepted one unit of ${GAME_DATA.commodities[cargoId]?.name || "cargo"} and broke off.`);
      else actions.piratePay();
    },
    raiderAid() {
      const cargoId = removeOneCargo();
      if (cargoId) {
        state.reputation += 1;
        addLog(`You gave the stranded crew one unit of ${GAME_DATA.commodities[cargoId]?.name || "cargo"}. Word of the gesture spread.`);
      } else {
        addLog("Your cargo bay was empty, so you could not offer supplies.");
      }
    },
    raiderCredits() {
      const paid = Math.min(60, state.credits);
      state.credits -= paid;
      if (paid === 60) state.reputation += 1;
      addLog(`You transferred ${credits(paid)} to the struggling crew and continued.`);
    },
    raiderLeave() {
      addLog("You declined the request and continued without incident.");
    },
    pirateReputation() {
      if (state.reputation >= 5) {
        addLog("Your reputation carried weight. The pirate captain decided an established operator was not worth the trouble.");
      } else {
        const paid = Math.min(70, state.credits);
        state.credits -= paid;
        addLog(`Your name was not strong enough yet. You negotiated the demand down to ${credits(paid)}.`);
      }
    },
    piratePay120() {
      const paid = Math.min(120, state.credits);
      state.credits -= paid;
      addLog(`Paid ${credits(paid)} and continued.`);
    },
    pirateHardBurn() {
      const chance = Math.min(0.92, 0.38 + state.ship.engine * 0.15);
      if (Math.random() < chance) addLog("The Wayfarer surged ahead and left the pirate behind.");
      else {
        state.ship.hull = Math.max(1, state.ship.hull - 14);
        addLog("You got away, but the hard burn and evasive maneuvering cost 14% hull integrity.");
      }
    },

    customsComply() {
      addLog("Customs verified your manifest and cleared you to continue.");
    },
    customsExpedite() {
      if (state.reputation >= 3) addLog("Your operator record earned immediate expedited clearance.");
      else {
        const fee = Math.min(35, state.credits);
        state.credits -= fee;
        addLog(`Customs charged ${credits(fee)} for expedited processing.`);
      }
    },
    customsSpotCheck() {
      addLog("The cargo seals matched the manifest. Customs released you without penalty.");
    },
    customsCourtesy() {
      if (state.reputation >= 4) addLog("The officer recognized your record and waived the spot check.");
      else addLog("The officer declined the request and completed the inspection anyway.");
    },
    customsPriority() {
      if (state.reputation >= 6) addLog("Traffic control recognized your standing and moved you directly through the priority lane.");
      else {
        const fee = Math.min(25, state.credits);
        state.credits -= fee;
        addLog(`Priority clearance was available for ${credits(fee)}. You paid the fee and moved through.`);
      }
    },
    customsWait() {
      addLog("You waited for clearance and continued once the traffic lane reopened.");
    },

    distressSurvey() {
      const reward = 70 + state.ship.sensors * 25;
      state.credits += reward;
      state.reputation += 1;
      addLog(`Your sensors helped isolate the coolant fault. The survey crew paid ${credits(reward)}, and your reputation improved.`);
    },
    distressSkip() {
      addLog("You logged the distress coordinates and continued on course.");
    },
    distressMedicalFuel() {
      if (state.ship.fuel >= 8) {
        state.ship.fuel -= 8;
        state.reputation += 2;
        addLog("You transferred 8 fuel as emergency power. The medical crew made port safely, and your reputation improved significantly.");
      } else {
        addLog("You did not have 8 fuel available for the transfer.");
      }
    },
    distressMedicalCargo() {
      const cargoId = removeOneCargo("medicine");
      if (cargoId === "medicine") {
        state.reputation += 2;
        addLog("You transferred one unit of Medicine to the shuttle. The crew promised your name would be remembered.");
      } else if (cargoId) {
        state.cargo[cargoId] = (state.cargo[cargoId] || 0) + 1;
        addLog("You had cargo aboard, but no Medicine to donate.");
      } else {
        addLog("You had no Medicine aboard to donate.");
      }
    },
    distressMedicalRelay() {
      state.reputation += 1;
      addLog("You relayed the medical emergency to traffic control. Another vessel diverted to assist.");
    },
    distressTow() {
      const chance = Math.min(0.9, 0.35 + state.ship.engine * 0.14);
      if (Math.random() < chance) {
        const reward = 160 + state.ship.engine * 20;
        state.credits += reward;
        state.reputation += 1;
        addLog(`The tow succeeded. The freighter captain transferred ${credits(reward)} in thanks.`);
      } else {
        state.ship.hull = Math.max(1, state.ship.hull - 6);
        addLog("The tow line parted under load. No one was hurt, but the maneuver cost 6% hull integrity.");
      }
    },
    distressGuidance() {
      if (state.ship.sensors >= 3) {
        state.reputation += 1;
        state.credits += 90;
        addLog("Your sensor telemetry helped the freighter crew recover engine control. They sent 90 cr in thanks.");
      } else {
        addLog("Your telemetry helped, but your sensors could not isolate the fault completely.");
      }
    },
    distressScanBeacon() {
      if (state.ship.sensors >= 3) {
        const reward = 140 + state.ship.sensors * 10;
        state.credits += reward;
        addLog(`Your scan revealed an abandoned courier with recoverable emergency stores. You salvaged ${credits(reward)} in value without unnecessary risk.`);
      } else {
        addLog("The scan remained inconclusive. You marked the beacon for a better-equipped survey crew and continued.");
      }
    },
    distressApproachBeacon() {
      if (Math.random() < 0.55) {
        state.credits += 110;
        addLog("The beacon belonged to an abandoned courier. You recovered 110 cr worth of usable equipment.");
      } else {
        state.ship.hull = Math.max(1, state.ship.hull - 7);
        addLog("The vessel was tumbling unpredictably. You withdrew safely, but a collision with debris cost 7% hull integrity.");
      }
    },

    failureRepair() {
      const cost = Math.min(45, state.credits);
      state.credits -= cost;
      addLog(`You spent ${credits(cost)} in supplies and stabilized the coolant system.`);
    },
    failurePush() {
      state.ship.hull = Math.max(1, state.ship.hull - 8);
      addLog("You pushed onward and reached port, but lost 8% hull integrity.");
    },
    failureSensors() {
      const chance = Math.min(0.95, 0.45 + state.ship.sensors * 0.12);
      if (Math.random() < chance) addLog("Your sensor suite reconstructed a stable navigation solution and bypassed the faulty relay.");
      else {
        state.ship.fuel = Math.max(0, state.ship.fuel - 5);
        addLog("The recalibration worked only partially. The longer correction burn consumed 5 additional fuel.");
      }
    },
    failureRelay() {
      const cost = Math.min(55, state.credits);
      state.credits -= cost;
      addLog(`You replaced the failing navigation relay for ${credits(cost)}.`);
    },
    failurePatch() {
      const cost = Math.min(30, state.credits);
      state.credits -= cost;
      addLog(`You spent ${credits(cost)} on sealant and patch material. The exterior panel is secure.`);
    },
    failureHull() {
      const protection = state.ship.shield >= 40 ? 4 : 7;
      state.ship.hull = Math.max(1, state.ship.hull - protection);
      addLog(`You continued without stopping. The damaged panel worsened, costing ${protection}% hull integrity.`);
    }
  };

  actions[action]?.();
  activeRichEncounter = null;
  el("encounterDialog").close();
  render();
};

// Haven's Reach — Expansion Foundation Pass 5D1
// Renewable Field Lead Encounter Routing Repair
//
// Restores explicit routing for renewable NPC field-lead choices after the
// authoritative encounter gateway is reinstalled. field-network-renewal.js
// remains the proven owner of the gameplay behavior.

const resolveFieldNetworkRenewalBeforeDispatcher = window.resolveEncounter;

HavensInteractionDispatcher.registerEncounterHandler("field-network-renewal", action => {
  if (typeof action !== "string") return false;
  if (!action.startsWith("fieldRenewalNpcAccept:") &&
      !action.startsWith("fieldRenewalNpcLater:")) return false;

  resolveFieldNetworkRenewalBeforeDispatcher(action);
  return true;
});

HavensInteractionDispatcher.installEncounterGateway();

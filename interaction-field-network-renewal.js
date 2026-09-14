// Haven's Reach — Expansion Foundation Pass 5D1 / 5E1
// Renewable Field Lead Interaction Ownership
//
// Routes both renewable NPC field-lead choices and the interaction that opens
// their offer. One-time authored leads retain priority. field-network-renewal.js
// remains the proven owner of the gameplay behavior.

const resolveFieldNetworkRenewalBeforeDispatcher = window.resolveEncounter;
const openFieldNetworkRenewalBeforeDispatcher = window.openNpcInteraction;

HavensInteractionDispatcher.registerEncounterHandler("field-network-renewal", action => {
  if (typeof action !== "string") return false;
  if (!action.startsWith("fieldRenewalNpcAccept:") &&
      !action.startsWith("fieldRenewalNpcLater:")) return false;

  resolveFieldNetworkRenewalBeforeDispatcher(action);
  return true;
});

HavensInteractionDispatcher.registerNpcInteractionHandler("field-network-renewal", id => {
  if (npcFieldLeadAvailable(id)) return false;
  if (!fieldRenewalNpcOfferAvailable(id)) return false;

  openFieldNetworkRenewalBeforeDispatcher(id);
  return true;
});

HavensInteractionDispatcher.installEncounterGateway();
HavensInteractionDispatcher.installNpcInteractionGateway();

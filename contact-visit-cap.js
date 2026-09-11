// Haven's Reach — Contact Visit Cap #1
// Completes the three-conversation-per-visit behavior for Mara and Seli.
// The fourth attempt gives one character-specific stopping response, then Catch Up
// becomes Caught Up and remains unavailable until the operator leaves and returns.

function ensureContactVisitStopState() {
  const data = ensureContactConversationState();
  if (!data.visit.stopped || typeof data.visit.stopped !== "object") data.visit.stopped = {};
  return data;
}

function markContactCaughtUpButton(id) {
  const button = view.querySelector(`.familiar-talk[onclick="openFamiliarConversation('${id}')"]`);
  if (!button) return;
  button.disabled = true;
  button.textContent = "Caught Up";
}

const baseOpenContactStoppingForVisitCap = openContactStopping;
openContactStopping = function(id) {
  const data = ensureContactVisitStopState();
  data.visit.stopped[id] = true;
  markContactCaughtUpButton(id);
  return baseOpenContactStoppingForVisitCap(id);
};

// seli-conversations.js deliberately leaves Catch Up in place after the third conversation.
// Its own render pass disables at three; this final pass re-enables the fourth attempt until
// the stopping response has actually been seen, then marks the finished state as Caught Up.
const baseRenderOverviewForVisitCap = renderOverview;
renderOverview = function() {
  baseRenderOverviewForVisitCap();
  const data = ensureContactVisitStopState();
  const localContact = Object.entries(NPC_DATA).find(([, npc]) => npc.location === state.location);
  if (!localContact) return;

  const [id] = localContact;
  if (id !== "mara" && id !== "seli") return;

  const button = view.querySelector(`.familiar-talk[onclick="openFamiliarConversation('${id}')"]`);
  if (button) {
    const stopped = Boolean(data.visit.stopped[id]);
    button.disabled = stopped;
    button.textContent = stopped ? "Caught Up" : "Catch Up";
  }
};

ensureContactVisitStopState();
saveState();

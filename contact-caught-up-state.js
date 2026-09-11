// Haven's Reach — Contact Caught Up Live State
// Keeps the established-contact button visually synchronized when the final
// stopping conversation happens without requiring a Station view rerender.

const baseOpenExpandedContactStoppingCaughtUpState = openExpandedContactStopping;
openExpandedContactStopping = function(id) {
  baseOpenExpandedContactStoppingCaughtUpState(id);
  const button = view.querySelector(`.familiar-talk[onclick="openFamiliarConversation('${id}')"]`);
  if (!button) return;
  button.disabled = true;
  button.textContent = "Caught Up";
};

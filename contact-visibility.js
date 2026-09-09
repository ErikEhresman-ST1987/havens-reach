// Haven's Reach — Contact Visibility Correction
// The captain's log remains a historical record, not the primary UI for an actionable
// local contact. When a known local NPC currently has something to discuss, surface one
// quiet contextual notice near the top of the operator console.

function currentRelevantLocalContact() {
  if (typeof ensureNpcSignalState === "function") ensureNpcSignalState();
  const local = typeof localNpcEntry === "function" ? localNpcEntry() : null;
  if (!local) return null;

  const [id, npc] = local;
  const npcState = state.npcs?.[id];
  if (!npcState?.met || typeof npcOpportunityAvailable !== "function" || !npcOpportunityAvailable(id)) return null;
  return { id, npc };
}

function renderLocalContactNotice() {
  document.querySelectorAll(".local-contact-notice").forEach(node => node.remove());
  const contact = currentRelevantLocalContact();
  if (!contact) return;

  const tabs = document.querySelector(".tabs");
  if (!tabs) return;

  const notice = document.createElement("section");
  notice.className = "local-contact-notice";
  notice.innerHTML = `
    <div>
      <p class="eyebrow">LOCAL CONTACT</p>
      <strong>${escapeHtml(contact.npc.name)} has something to discuss.</strong>
      <p class="muted small">${escapeHtml(contact.npc.role)} • ${escapeHtml(GAME_DATA.systems[state.location].name)}</p>
    </div>
    <button class="secondary" type="button" onclick="openNpcInteraction('${contact.id}')">Talk</button>`;
  tabs.insertAdjacentElement("afterend", notice);
}

const renderBeforeContactVisibility = render;
render = function renderWithContactVisibility() {
  const result = renderBeforeContactVisibility();
  renderLocalContactNotice();
  return result;
};

renderLocalContactNotice();

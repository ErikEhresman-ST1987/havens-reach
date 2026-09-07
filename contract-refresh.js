// Haven's Reach — Smallest Meaningful Correction #1
// Keeps the existing seeded contracts available as repeatable local work.
// This fixes the prototype dead-end where completing all contracts exhausted the board.

renderContracts = function() {
  const contracts = GAME_DATA.systems[state.location].contracts;

  const rows = contracts.map(contract => {
    const completedBefore = state.completedContracts.includes(contract.id);
    const statusText = completedBefore ? "Repeatable route" : "New route";

    return `<div class="contract-row">
      <div>
        <strong>${escapeHtml(contract.title)}</strong>
        <div class="muted small">${escapeHtml(contract.text)}</div>
        <div class="muted small">${statusText}</div>
      </div>
      <div>${escapeHtml(GAME_DATA.systems[contract.destination].name)}</div>
      <div class="good">${credits(contract.reward)}</div>
      <button class="primary" onclick="acceptContract('${contract.id}')" ${state.activeContract ? "disabled" : ""}>Accept</button>
    </div>`;
  }).join("");

  view.innerHTML = `
    <div class="section-heading">
      <div><p class="eyebrow">CONTRACT BOARD</p><h2>Available Work</h2></div>
    </div>
    ${state.activeContract ? `<p class="warn">You already have an active contract. Finish it before accepting another.</p>` : ""}
    <p class="muted small">Routine freight and courier work returns to the board after completion. More varied contract generation can be added later without changing this core loop.</p>
    ${rows}`;
};

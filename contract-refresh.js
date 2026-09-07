// Haven's Reach — Smallest Meaningful Correction #2
// Keeps seeded contracts repeatable and makes active-contract state explicit.
// This avoids the misleading impression that the contract board is reporting a false error.

renderContracts = function() {
  const contracts = GAME_DATA.systems[state.location].contracts;
  const active = state.activeContract;

  const rows = contracts.map(contract => {
    const completedBefore = state.completedContracts.includes(contract.id);
    const statusText = completedBefore ? "Repeatable route" : "New route";
    const isActive = active && active.id === contract.id;
    const buttonLabel = active
      ? (isActive ? "Active Contract" : "Finish Current Contract")
      : "Accept";

    return `<div class="contract-row">
      <div>
        <strong>${escapeHtml(contract.title)}</strong>
        <div class="muted small">${escapeHtml(contract.text)}</div>
        <div class="muted small">${statusText}</div>
      </div>
      <div>${escapeHtml(GAME_DATA.systems[contract.destination].name)}</div>
      <div class="good">${credits(contract.reward)}</div>
      <button class="primary" onclick="acceptContract('${contract.id}')" ${active ? "disabled" : ""}>${buttonLabel}</button>
    </div>`;
  }).join("");

  const activeNotice = active
    ? `<div class="info-card" style="margin-bottom:16px">
         <h3>Active Contract</h3>
         <p><strong>${escapeHtml(active.title)}</strong></p>
         <p class="muted small">Destination: ${escapeHtml(GAME_DATA.systems[active.destination].name)}. Complete this job before accepting another.</p>
       </div>`
    : "";

  view.innerHTML = `
    <div class="section-heading">
      <div><p class="eyebrow">CONTRACT BOARD</p><h2>Available Work</h2></div>
    </div>
    ${activeNotice}
    <p class="muted small">Routine freight and courier work returns to the board after completion. More varied contract generation can be added later without changing this core loop.</p>
    ${rows}`;
};

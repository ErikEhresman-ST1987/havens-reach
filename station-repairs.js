// Haven's Reach — Smallest Meaningful Correction: Station Repairs
// Closes the hull-damage loop without introducing a maintenance subsystem.

const HULL_REPAIR_COST_PER_POINT = 10;

function hullRepairQuote() {
  const missing = Math.max(0, 100 - state.ship.hull);
  const affordable = Math.min(missing, Math.floor(state.credits / HULL_REPAIR_COST_PER_POINT));
  return {
    missing,
    affordable,
    fullCost: missing * HULL_REPAIR_COST_PER_POINT,
    repairCost: affordable * HULL_REPAIR_COST_PER_POINT
  };
}

function repairHull() {
  const quote = hullRepairQuote();
  if (quote.affordable <= 0) return;

  state.credits -= quote.repairCost;
  state.ship.hull = Math.min(100, state.ship.hull + quote.affordable);

  addLog(`Port yard repaired ${quote.affordable}% hull integrity for ${credits(quote.repairCost)} at ${GAME_DATA.systems[state.location].name}.`);
  render();
}

const renderShipBeforeRepairs = renderShip;
renderShip = function renderShipWithRepairs() {
  renderShipBeforeRepairs();

  const quote = hullRepairQuote();
  const systemsCard = view.querySelector('.card-grid');
  if (!systemsCard) return;

  let repairHtml;

  if (quote.missing === 0) {
    repairHtml = `
      <article class="info-card">
        <h3>Port Yard</h3>
        <p><strong>Hull integrity: 100%</strong></p>
        <p class="muted small">No structural repairs are needed.</p>
      </article>`;
  } else if (quote.affordable === 0) {
    repairHtml = `
      <article class="info-card">
        <h3>Port Yard</h3>
        <p><strong>Hull integrity: ${state.ship.hull}%</strong></p>
        <p class="muted small">Repairs cost ${credits(HULL_REPAIR_COST_PER_POINT)} per 1% hull. Full repair: ${credits(quote.fullCost)}.</p>
        <button class="primary" disabled>Insufficient Credits</button>
      </article>`;
  } else {
    const fullRepair = quote.affordable === quote.missing;
    repairHtml = `
      <article class="info-card">
        <h3>Port Yard</h3>
        <p><strong>Hull integrity: ${state.ship.hull}%</strong></p>
        <p class="muted small">Repairs cost ${credits(HULL_REPAIR_COST_PER_POINT)} per 1% hull. Full repair: ${credits(quote.fullCost)}.</p>
        <button class="primary" onclick="repairHull()">${fullRepair ? `Repair Hull — ${credits(quote.repairCost)}` : `Repair ${quote.affordable}% — ${credits(quote.repairCost)}`}</button>
      </article>`;
  }

  systemsCard.insertAdjacentHTML('beforeend', repairHtml);
};

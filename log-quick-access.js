// Haven's Reach — Captain's Log Quick Access #1
// The existing bottom log remains authoritative. This adds a second, temporary
// viewport onto the same state.log data so the player can check history without
// losing their current operational position.

function ensureLogQuickAccess() {
  const tabs = document.querySelector('.tabs');
  if (!tabs) return;

  let row = document.querySelector('.log-quick-row');
  if (!row) {
    row = document.createElement('div');
    row.className = 'log-quick-row';
    row.innerHTML = `<button type="button" class="secondary log-quick-button" onclick="openLogQuickAccess()">Captain's Log</button>`;
    tabs.insertAdjacentElement('afterend', row);
  }

  if (!document.getElementById('logQuickDialog')) {
    const dialog = document.createElement('dialog');
    dialog.id = 'logQuickDialog';
    dialog.innerHTML = `
      <div class="log-quick-card">
        <div class="log-quick-heading">
          <div><p class="eyebrow">CAPTAIN'S LOG</p><h2>Recent Events</h2></div>
          <button type="button" class="secondary log-quick-close" onclick="closeLogQuickAccess()">Close</button>
        </div>
        <div id="logQuickEvents" class="log-quick-events"></div>
      </div>`;
    document.body.appendChild(dialog);

    dialog.addEventListener('click', event => {
      if (event.target === dialog) closeLogQuickAccess();
    });
  }
}

function renderLogQuickEvents() {
  const target = document.getElementById('logQuickEvents');
  if (!target) return;
  target.innerHTML = (state.log || []).map(entry => `<div class="log-entry">${escapeHtml(entry)}</div>`).join('');
}

function openLogQuickAccess() {
  ensureLogQuickAccess();
  renderLogQuickEvents();
  const dialog = document.getElementById('logQuickDialog');
  if (dialog && !dialog.open) dialog.showModal();
}

function closeLogQuickAccess() {
  const dialog = document.getElementById('logQuickDialog');
  if (dialog?.open) dialog.close();
}

ensureLogQuickAccess();

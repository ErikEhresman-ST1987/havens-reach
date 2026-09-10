// Haven's Reach — Station Project Clarity #1
// Pure presentation layer: groups the branching-project explanation and its two choices
// into one visual decision without changing project state, eligibility, costs, or outcomes.

function groupVisibleStationProjectChoice() {
  if (state.location !== "haven") return;
  const buttons = [...view.querySelectorAll('button[onclick*="chooseHavenDevelopment"]')];
  if (buttons.length !== 2 || view.querySelector('.station-project-choice')) return;

  const optionCards = buttons.map(button => button.closest('.haven-project-card')).filter(Boolean);
  if (optionCards.length !== 2) return;

  const introCard = optionCards[0].previousElementSibling;
  if (!introCard?.classList.contains('haven-project-card')) return;

  const group = document.createElement('section');
  group.className = 'station-project-choice';
  group.setAttribute('aria-label', 'Haven station project choice');

  const options = document.createElement('div');
  options.className = 'station-project-options';

  introCard.parentNode.insertBefore(group, introCard);
  group.appendChild(introCard);

  const label = document.createElement('p');
  label.className = 'station-project-options-label';
  label.textContent = 'Choose one direction';
  group.appendChild(label);

  group.appendChild(options);
  optionCards.forEach(card => options.appendChild(card));
}

const renderOverviewBeforeStationProjectClarity = renderOverview;
renderOverview = function renderOverviewWithStationProjectClarity() {
  renderOverviewBeforeStationProjectClarity();
  groupVisibleStationProjectChoice();
};

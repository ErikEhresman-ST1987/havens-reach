(() => {
  'use strict';
  const backdrop=document.getElementById('focus-backdrop'), closeButton=document.getElementById('close-panel'),
    repairButton=document.getElementById('repair-button'), hullValue=document.getElementById('hull-value'),
    creditsValue=document.getElementById('credits-value'), repairCopy=document.getElementById('repair-copy'),
    sceneHost=document.getElementById('scene');
  function renderEngineering(){
    const state=window.HRState.get(), quote=window.HRState.repairQuote();
    hullValue.textContent=`${state.ship.hull}%`; creditsValue.textContent=`${state.credits} cr`;
    if(quote.missing===0){ repairCopy.textContent='Hull is fully restored. Engineering reports nominal condition.'; repairButton.textContent='Hull Nominal'; repairButton.disabled=true; }
    else if(quote.canRepair){
      repairCopy.textContent=quote.repairPoints===quote.missing ? `Haven yard can restore ${quote.missing} hull points for ${quote.cost} credits.` : `Available credits can restore ${quote.repairPoints} of ${quote.missing} missing hull points for ${quote.cost} credits.`;
      repairButton.textContent=`Repair Hull — ${quote.cost} cr`; repairButton.disabled=false;
    } else { repairCopy.textContent=`Hull needs ${quote.missing} points of repair. Insufficient credits for yard service.`; repairButton.textContent='Insufficient Credits'; repairButton.disabled=true; }
  }
  function openEngineering(){ renderEngineering(); backdrop.hidden=false; document.body.classList.add('panel-open'); closeButton.focus(); }
  function closeEngineering(){ backdrop.hidden=true; document.body.classList.remove('panel-open'); document.getElementById('semantic-engineering').focus({preventScroll:true}); }
  function consoleIntent(id){
    if(id==='engineering'){ openEngineering(); return; }
    const names={navigation:'Navigation / Helm',operations:'Operations / Cargo',communications:'Communications'};
    const label=document.getElementById('interaction-label'); label.textContent=`${names[id]} — not active in this proof`;
    window.setTimeout(()=>{ if(label.textContent.includes('not active')) label.textContent=''; },1800);
  }
  window.addEventListener('hr:console',(event)=>consoleIntent(event.detail.id));
  document.querySelectorAll('[data-console]').forEach((button)=>button.addEventListener('click',()=>consoleIntent(button.dataset.console)));
  closeButton.addEventListener('click',closeEngineering);
  backdrop.addEventListener('click',(event)=>{ if(event.target===backdrop) closeEngineering(); });
  document.addEventListener('keydown',(event)=>{ if(event.key==='Escape'&&!backdrop.hidden) closeEngineering(); });
  repairButton.addEventListener('click',()=>{ window.HRState.repairHull(); renderEngineering(); });
  window.HRState.subscribe(()=>{ if(!backdrop.hidden) renderEngineering(); });
  async function start(){
    try { await window.WayfarerScene.mount(sceneHost); document.body.classList.add('ready'); }
    catch(error){ console.error('Wayfarer graphical proof failed to start.',error); document.getElementById('startup-error').hidden=false; }
  }
  window.HavensReachProof={rebuildRenderer:async()=>{const before=JSON.stringify(window.HRState.get()); await window.WayfarerScene.destroy(); await window.WayfarerScene.mount(sceneHost); const after=JSON.stringify(window.HRState.get()); return {unchanged:before===after,before:JSON.parse(before),after:JSON.parse(after)};}};
  start();
})();
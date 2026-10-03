(() => {
  'use strict';
  const backdrop=document.getElementById('focus-backdrop'), engineeringPanel=document.getElementById('engineering-panel'),
    navigationPanel=document.getElementById('navigation-panel'), closeEngineeringButton=document.getElementById('close-engineering'),
    closeNavigationButton=document.getElementById('close-navigation'), repairButton=document.getElementById('repair-button'),
    hullValue=document.getElementById('hull-value'), creditsValue=document.getElementById('credits-value'),
    repairCopy=document.getElementById('repair-copy'), navigationCopy=document.getElementById('navigation-copy'),
    locationName=document.getElementById('location-name'), dockButton=document.getElementById('dock-button'), exitShipButton=document.getElementById('exit-ship-button'), returnShipButton=document.getElementById('return-ship-button'), stationUI=document.getElementById('station-ui'), sceneHost=document.getElementById('scene'), seliPanel=document.getElementById('seli-panel'), closeSeliButton=document.getElementById('close-seli'), seliCopy=document.getElementById('seli-copy'), seliChoices=document.getElementById('seli-choices'),
    communicationsPanel=document.getElementById('communications-panel'), closeCommunicationsButton=document.getElementById('close-communications'), communicationsCopy=document.getElementById('communications-copy'), acceptSupplyRunButton=document.getElementById('accept-supply-run'),
    operationsPanel=document.getElementById('operations-panel'), closeOperationsButton=document.getElementById('close-operations'), operationsCopy=document.getElementById('operations-copy'), completeSupplyRunButton=document.getElementById('complete-supply-run');
  const LOCATION_NAMES={haven:'Haven Orbit',meridian:'Meridian Exchange'};
  let activePanel=null, travelInProgress=false, dockingInProgress=false, stationTransitionInProgress=false;
  function renderLocation(state){
    const base=LOCATION_NAMES[state.location]||state.location;
    locationName.textContent=state.condition==='docked'?base+' — Docked':base;
    dockButton.textContent=state.condition==='docked'?'Undock':'Dock';
    dockButton.disabled=travelInProgress||dockingInProgress||stationTransitionInProgress||state.operatorLocation!=='aboard'||!['stationary','docked'].includes(state.condition);
    dockButton.hidden=state.operatorLocation!=='aboard';
    exitShipButton.hidden=!(state.location==='meridian'&&state.condition==='docked'&&state.operatorLocation==='aboard');
    stationUI.hidden=state.operatorLocation!=='meridian-dock';
  }
  function renderEngineering(){
    const state=window.HRState.get(), quote=window.HRState.repairQuote();
    hullValue.textContent=`${state.ship.hull}%`; creditsValue.textContent=`${state.credits} cr`;
    if(quote.missing===0){ repairCopy.textContent='Hull is fully restored. Engineering reports nominal condition.'; repairButton.textContent='Hull Nominal'; repairButton.disabled=true; }
    else if(state.location!=='haven'){ repairCopy.textContent='Hull service is available at Haven. No yard service is active at Meridian in this proof.'; repairButton.textContent='Service at Haven'; repairButton.disabled=true; }
    else if(quote.canRepair){ repairCopy.textContent=quote.repairPoints===quote.missing ? `Haven yard can restore ${quote.missing} hull points for ${quote.cost} credits.` : `Available credits can restore ${quote.repairPoints} of ${quote.missing} missing hull points for ${quote.cost} credits.`; repairButton.textContent=`Repair Hull — ${quote.cost} cr`; repairButton.disabled=false; }
    else { repairCopy.textContent=`Hull needs ${quote.missing} points of repair. Insufficient credits for yard service.`; repairButton.textContent='Insufficient Credits'; repairButton.disabled=true; }
  }
  function renderNavigation(){
    const state=window.HRState.get();
    navigationCopy.textContent=state.location==='haven'?'Current location: Haven. Meridian Exchange is an established commercial hub on the First Frontier.':'Current location: Meridian Exchange. Haven remains available as the return destination.';
    document.querySelectorAll('[data-destination]').forEach((button)=>{button.disabled=button.dataset.destination===state.location;button.classList.toggle('current',button.disabled);});
  }
  function openPanel(panel){
    activePanel=panel; engineeringPanel.hidden=panel!=='engineering'; navigationPanel.hidden=panel!=='navigation'; seliPanel.hidden=panel!=='seli'; communicationsPanel.hidden=panel!=='communications'; operationsPanel.hidden=panel!=='operations';
    if(panel==='engineering') renderEngineering(); else if(panel==='navigation') renderNavigation(); else if(panel==='seli') renderSeli(); else if(panel==='communications') renderCommunications(); else renderOperations();
    backdrop.hidden=false; document.body.classList.add('panel-open');
    (panel==='engineering'?closeEngineeringButton:panel==='navigation'?closeNavigationButton:panel==='seli'?closeSeliButton:panel==='communications'?closeCommunicationsButton:closeOperationsButton).focus();
  }
  function closePanel(){
    if(!activePanel) return;
    const focusId=activePanel==='engineering'?'semantic-engineering':activePanel==='navigation'?'semantic-navigation':null;
    backdrop.hidden=true; engineeringPanel.hidden=false; navigationPanel.hidden=true; seliPanel.hidden=true; communicationsPanel.hidden=true; operationsPanel.hidden=true; document.body.classList.remove('panel-open');
    activePanel=null; if(focusId) document.getElementById(focusId).focus({preventScroll:true});
  }
  function renderSeli(){
    const seli=window.HRState.get().npcs?.seli||{met:false,memory:{}};
    if(!seli.met){ seliCopy.textContent='Seli Varen is a patient Veylan freight broker who seems to remember every price, promise, and favor that passes through Meridian Exchange.'; seliChoices.innerHTML='<button type="button" data-seli-choice="share">Share some of your market notes</button><button type="button" data-seli-choice="private">Keep your figures private</button>'; return; }
    seliCopy.textContent=seli.memory?.sharedMarketNotes?'Seli treats you as an operator willing to exchange useful information instead of guarding every advantage.':'Seli respects your discretion, though the Veylan broker has not forgotten that you keep your market information close.';
    seliChoices.innerHTML='<button type="button" data-seli-choice="close">Continue</button>';
  }
  function renderCommunications(){
    const s=window.HRState.get(), work=window.HRState.workStatus().supplyRun, completed=s.completedContracts?.includes(work.id), active=s.activeContract?.id===work.id;
    if(s.location!=='haven'){communicationsCopy.innerHTML='<div class="work-card">No Haven postings are available on this local link. Return to Haven to review originating work.</div>';acceptSupplyRunButton.hidden=true;return;}
    if(active){communicationsCopy.innerHTML='<div class="work-card"><strong>Supply Run — Active</strong><p>'+work.text+'</p><div class="work-meta"><span>Destination: Meridian Exchange</span><span>220 cr</span></div></div>';acceptSupplyRunButton.hidden=true;return;}
    communicationsCopy.innerHTML='<div class="work-card"><strong>Supply Run</strong><p>'+work.text+'</p><div class="work-meta"><span>Cargo: 2 Packaged Food</span><span>Reward: 220 cr</span></div></div>';
    acceptSupplyRunButton.hidden=false; acceptSupplyRunButton.disabled=Boolean(s.activeContract); acceptSupplyRunButton.textContent=completed?'Accept Supply Run Again':'Accept Supply Run';
  }
  function renderOperations(){
    const s=window.HRState.get(), w=window.HRState.workStatus(), active=s.activeContract, food=s.cargo?.food||0;
    let job=active?'<div class="work-card"><strong>'+active.title+'</strong><p>'+active.text+'</p><div class="work-meta"><span>Destination: Meridian Exchange</span><span>Reward: 220 cr</span></div></div>':'<div class="work-card">No active work assignment.</div>';
    operationsCopy.innerHTML='<div class="cargo-meter"><strong>Cargo hold</strong><div>'+w.cargoUsed+' / '+w.cargoCapacity+' spaces used</div><div>Packaged Food: '+food+'</div></div>'+job+'<p>Operator standing: <strong>'+s.reputation+'</strong></p>';
    const ready=active?.id==='haven-food'&&s.location==='meridian'&&s.condition==='docked'&&s.operatorLocation==='aboard';
    completeSupplyRunButton.hidden=!ready;
  }
  function personIntent(id){ const s=window.HRState.get(); if(id==='seli'&&s.location==='meridian'&&s.condition==='docked'&&s.operatorLocation==='meridian-dock') openPanel('seli'); }
  function consoleIntent(id){
    if(travelInProgress||dockingInProgress||stationTransitionInProgress||window.HRState.get().operatorLocation!=='aboard') return;
    if(['engineering','navigation','operations','communications'].includes(id)){ openPanel(id); return; }
  }
  window.addEventListener('hr:console',(event)=>consoleIntent(event.detail.id));
  window.addEventListener('hr:person',(event)=>personIntent(event.detail.id));
  document.querySelectorAll('[data-console]').forEach((button)=>button.addEventListener('click',()=>consoleIntent(button.dataset.console)));
  closeEngineeringButton.addEventListener('click',closePanel); closeNavigationButton.addEventListener('click',closePanel); closeSeliButton.addEventListener('click',closePanel); closeCommunicationsButton.addEventListener('click',closePanel); closeOperationsButton.addEventListener('click',closePanel);
  acceptSupplyRunButton.addEventListener('click',()=>{const r=window.HRState.acceptSupplyRun();if(r.ok){renderCommunications();}});
  completeSupplyRunButton.addEventListener('click',()=>{const r=window.HRState.completeSupplyRun();if(r.ok){renderOperations();}});
  seliChoices.addEventListener('click',(event)=>{ const button=event.target.closest('[data-seli-choice]'); if(!button) return; const choice=button.dataset.seliChoice; if(choice==='close'){closePanel();return;} const result=window.HRState.chooseSeliFirstMeeting(choice); if(result.ok) renderSeli(); });
  backdrop.addEventListener('click',(event)=>{ if(event.target===backdrop) closePanel(); });
  document.addEventListener('keydown',(event)=>{ if(event.key==='Escape'&&!backdrop.hidden) closePanel(); });
  repairButton.addEventListener('click',()=>{ window.HRState.repairHull(); renderEngineering(); });
  document.querySelectorAll('[data-destination]').forEach((button)=>button.addEventListener('click',async()=>{
    if(travelInProgress) return;
    const destination=button.dataset.destination, result=window.HRState.beginTravel(destination);
    if(!result.ok) return;
    travelInProgress=true; closePanel();
    locationName.textContent='In Transit';
    try {
      await window.WayfarerScene.showTravel(result.origin,destination);
      window.HRState.completeTravel(destination);
    } catch(error) {
      console.error('Travel presentation failed.',error);
      window.HRState.cancelTravel();
    } finally { travelInProgress=false; renderLocation(window.HRState.get()); }
  }));
  dockButton.addEventListener('click',async()=>{
    if(travelInProgress||dockingInProgress) return;
    const before=window.HRState.get(), mode=before.condition==='docked'?'undock':'dock';
    if(!['stationary','docked'].includes(before.condition)) return;
    dockingInProgress=true; renderLocation(before); locationName.textContent=mode==='dock'?'Docking…':'Undocking…';
    try {
      await window.WayfarerScene.showDocking(mode,before.location);
      if(mode==='dock') window.HRState.dock(); else window.HRState.undock();
    } catch(error){ console.error('Docking presentation failed.',error); }
    finally { dockingInProgress=false; renderLocation(window.HRState.get()); }
  });
  exitShipButton.addEventListener('click',async()=>{
    const before=window.HRState.get();
    if(stationTransitionInProgress||before.location!=='meridian'||before.condition!=='docked'||before.operatorLocation!=='aboard') return;
    stationTransitionInProgress=true; exitShipButton.disabled=true;
    try { await window.WayfarerScene.showStationTransition('LEAVING WAYFARER'); window.HRState.exitShip(); }
    finally { stationTransitionInProgress=false; exitShipButton.disabled=false; renderLocation(window.HRState.get()); }
  });
  returnShipButton.addEventListener('click',async()=>{
    const before=window.HRState.get();
    if(stationTransitionInProgress||before.operatorLocation!=='meridian-dock') return;
    stationTransitionInProgress=true; returnShipButton.disabled=true;
    try { window.HRState.returnToShip(); await window.WayfarerScene.showStationTransition('RETURNING TO WAYFARER'); }
    finally { stationTransitionInProgress=false; returnShipButton.disabled=false; renderLocation(window.HRState.get()); }
  });
  window.HRState.subscribe((state)=>{ if(!travelInProgress&&!dockingInProgress&&!stationTransitionInProgress) renderLocation(state); if(activePanel==='engineering') renderEngineering(); if(activePanel==='navigation') renderNavigation(); if(activePanel==='seli') renderSeli(); if(activePanel==='communications') renderCommunications(); if(activePanel==='operations') renderOperations(); });
  async function start(){
    try { renderLocation(window.HRState.get()); await window.WayfarerScene.mount(sceneHost); document.body.classList.add('ready'); }
    catch(error){ console.error('Wayfarer graphical proof failed to start.',error); document.getElementById('startup-error').hidden=false; }
  }
  window.HavensReachProof={rebuildRenderer:async()=>{const before=JSON.stringify(window.HRState.get()); await window.WayfarerScene.destroy(); await window.WayfarerScene.mount(sceneHost); const after=JSON.stringify(window.HRState.get()); return {unchanged:before===after,before:JSON.parse(before),after:JSON.parse(after)};}};
  start();
})();
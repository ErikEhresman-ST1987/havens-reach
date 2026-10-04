(() => {
'use strict';
const STORAGE_KEY='havensReachGraphicalProofV1',DATA_VERSION=1,REPAIR_COST_PER_POINT=10;
const TRADE_MARKETS={haven:{food:{buy:45,sell:35},machineParts:{buy:80,sell:70},medicine:{buy:70,sell:60}},meridian:{food:{buy:65,sell:55},machineParts:{buy:60,sell:50},medicine:{buy:75,sell:65}}};
const LOCATIONS=new Set(['haven','meridian','prospect','calder']),DOCKABLE=new Set(['haven','meridian','prospect']),SERVICED=new Set(['haven','meridian','prospect']),ROUTES={haven:{meridian:18},meridian:{haven:18,prospect:25},prospect:{meridian:25,calder:22},calder:{prospect:22}};
const CONTRACTS={
 haven:[
  {id:'haven-food',title:'Supply Run',destination:'meridian',reward:220,cargo:{food:2},rep:1,text:'A family-owned canteen needs packaged food delivered to Meridian Exchange.'},
  {id:'haven-survey',title:'Survey Data Courier',destination:'prospect',reward:420,cargo:{},rep:1,text:'Carry sealed geological survey data to Prospect Reach.'},
  {id:'haven-family-parcels',title:'Frontier Family Parcels',destination:'prospect',reward:390,cargo:{},rep:1,text:'Carry a consolidated packet of family parcels and recorded messages from Haven to workers at Prospect Reach.'}
 ],
 meridian:[
  {id:'meridian-parts',title:'Machine Parts Delivery',destination:'prospect',reward:310,cargo:{machineParts:2},rep:1,text:'A Kharok maintenance crew is short on replacement actuator assemblies.'},
  {id:'meridian-meds',title:'Medical Priority',destination:'haven',reward:260,cargo:{medicine:1},rep:1,text:'A clinic on Haven needs a small urgent shipment of medication.'},
  {id:'meridian-canteen-stock',title:'Canteen Restock',destination:'prospect',reward:335,cargo:{food:2},rep:1,text:"Prospect's main canteen is short on packaged staples after a delayed supply run."}
 ],
 prospect:[
  {id:'prospect-samples',title:'Salvage Samples',destination:'meridian',reward:360,cargo:{},rep:1,text:'Transport recovered drive components to a buyer at Meridian Exchange.'},
  {id:'prospect-home',title:'Letter Packet',destination:'haven',reward:180,cargo:{},rep:1,text:'Carry personal correspondence from frontier workers back toward Haven.'},
  {id:'prospect-relay-spares',title:'Relay Spare Set',destination:'calder',reward:405,cargo:{machineParts:1},rep:1,text:"A navigation crew at Calder's Drift needs a compact set of relay spares before its next maintenance pass."}
 ]};
const freshState=()=>({app:'havens-reach-graphical',dataVersion:DATA_VERSION,location:'haven',operatorLocation:'aboard',condition:'stationary',credits:700,ship:{id:'wayfarer',name:'Wayfarer',hull:92,hullMax:100,fuel:80,fuelMax:80,fuelEfficiency:1,cargoCapacity:8},npcs:{seli:{met:false,relationship:0,memory:{}},mara:{met:false,memory:{}}},cargo:{},tradeCargo:{},activeContract:null,completedContracts:[],reputation:0,tripCount:0,contractBoards:{},discovery:{outerBeacon:{status:'unknown',reportsCompared:0},knownLocations:['haven','meridian','prospect'],calderSurvey:{stage:'unexamined',archiveRecovered:false,sharedWithSeli:false}}});
function validState(c){return Boolean(c&&c.app==='havens-reach-graphical'&&c.dataVersion===DATA_VERSION&&LOCATIONS.has(c.location)&&['aboard','haven-repair-bay','meridian-dock','last-lantern'].includes(c.operatorLocation)&&Number.isFinite(c.credits)&&c.credits>=0&&c.ship&&c.ship.id==='wayfarer'&&Number.isFinite(c.ship.hull)&&Number.isFinite(c.ship.hullMax)&&c.ship.hull>=0&&c.ship.hull<=c.ship.hullMax);}
function load(){try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return freshState();const parsed=JSON.parse(raw);return validState(parsed)?parsed:freshState();}catch(error){console.warn('Graphical proof save could not be loaded; using a fresh proof state.',error);return freshState();}}
let state=load(),listeners=new Set(),pendingTravel=null;
function snapshot(){return typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state));}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function notify(){const current=snapshot();listeners.forEach(fn=>fn(current));}
function ensureSeli(){if(!state.npcs||typeof state.npcs!=='object')state.npcs={};if(!state.npcs.seli||typeof state.npcs.seli!=='object')state.npcs.seli={met:false,relationship:0,memory:{}};if(!state.npcs.seli.memory||typeof state.npcs.seli.memory!=='object')state.npcs.seli.memory={};if(!Number.isFinite(state.npcs.seli.relationship))state.npcs.seli.relationship=0;state.npcs.seli.met=Boolean(state.npcs.seli.met);}
function ensureMara(){if(!state.npcs||typeof state.npcs!=='object')state.npcs={};if(!state.npcs.mara||typeof state.npcs.mara!=='object')state.npcs.mara={met:false,memory:{}};if(!state.npcs.mara.memory||typeof state.npcs.mara.memory!=='object')state.npcs.mara.memory={};state.npcs.mara.met=Boolean(state.npcs.mara.met);}
function ensureWorkState(){if(!state.cargo||typeof state.cargo!=='object')state.cargo={};if(!state.tradeCargo||typeof state.tradeCargo!=='object')state.tradeCargo={};if(!Array.isArray(state.completedContracts))state.completedContracts=[];if(!Number.isFinite(state.reputation))state.reputation=0;if(!Number.isFinite(state.tripCount))state.tripCount=0;if(!state.contractBoards||typeof state.contractBoards!=='object')state.contractBoards={};if(!('activeContract'in state))state.activeContract=null;}
function ensureDiscovery(){if(!state.discovery||typeof state.discovery!=='object')state.discovery={};if(!state.discovery.outerBeacon||typeof state.discovery.outerBeacon!=='object')state.discovery.outerBeacon={status:'unknown',reportsCompared:0};if(!Array.isArray(state.discovery.knownLocations))state.discovery.knownLocations=['haven','meridian','prospect'];['haven','meridian','prospect'].forEach(id=>{if(!state.discovery.knownLocations.includes(id))state.discovery.knownLocations.push(id);});if(state.discovery.outerBeacon.status==='confirmed'&&!state.discovery.knownLocations.includes('calder'))state.discovery.knownLocations.push('calder');if(!state.discovery.calderSurvey||typeof state.discovery.calderSurvey!=='object')state.discovery.calderSurvey={stage:'unexamined',archiveRecovered:false,sharedWithSeli:false};state.discovery.calderSurvey.archiveRecovered=Boolean(state.discovery.calderSurvey.archiveRecovered);state.discovery.calderSurvey.sharedWithSeli=Boolean(state.discovery.calderSurvey.sharedWithSeli);}
ensureSeli();ensureMara();ensureWorkState();ensureDiscovery();ensureFuel();
function cargoUsed(){ensureWorkState();return [state.cargo,state.tradeCargo].reduce((total,hold)=>total+Object.values(hold).reduce((sum,qty)=>sum+(Number.isFinite(qty)?qty:0),0),0);}
function cargoNeeded(contract){return Object.values(contract.cargo||{}).reduce((sum,qty)=>sum+qty,0);}
function known(destination){ensureDiscovery();return state.discovery.knownLocations.includes(destination);}
function ensureFuel(){if(!Number.isFinite(state.ship.fuelMax))state.ship.fuelMax=80;if(!Number.isFinite(state.ship.fuel))state.ship.fuel=state.ship.fuelMax;if(!Number.isFinite(state.ship.fuelEfficiency)||state.ship.fuelEfficiency<=0)state.ship.fuelEfficiency=1;state.ship.fuel=Math.max(0,Math.min(state.ship.fuel,state.ship.fuelMax));}
function routeDistance(start,goal){if(start===goal)return 0;const dist={[start]:0},open=[start];while(open.length){open.sort((a,b)=>dist[a]-dist[b]);const current=open.shift();if(current===goal)return dist[current];for(const [next,cost] of Object.entries(ROUTES[current]||{})){const candidate=dist[current]+cost;if(dist[next]===undefined||candidate<dist[next]){dist[next]=candidate;if(!open.includes(next))open.push(next);}}}return Infinity;}
function fuelCost(start,destination){ensureFuel();const distance=routeDistance(start,destination);return Number.isFinite(distance)?Math.ceil(distance*state.ship.fuelEfficiency):Infinity;}
function reserveFrom(destination){if(SERVICED.has(destination))return 0;let best=Infinity;for(const port of SERVICED){const cost=fuelCost(destination,port);if(cost<best)best=cost;}return best;}
function travelQuote(destination){ensureFuel();if(!LOCATIONS.has(destination)||!known(destination)||destination===state.location)return{ok:false,cost:Infinity,reserve:0};const cost=fuelCost(state.location,destination),reserve=reserveFrom(destination),required=cost+reserve;return{ok:state.ship.fuel>=required,cost,reserve,required,fuel:state.ship.fuel,fuelMax:state.ship.fuelMax,serviced:SERVICED.has(destination)};}
function refuelQuote(){ensureFuel();const needed=Math.max(0,state.ship.fuelMax-state.ship.fuel),units=Math.min(needed,Math.floor(state.credits));return{available:SERVICED.has(state.location)&&state.operatorLocation==='aboard'&&state.condition==='docked',needed,units,cost:units,fullCost:needed};}
function refuelToFull(){const q=refuelQuote();if(!q.available||q.units<=0)return{ok:false,quote:q,state:snapshot()};state.ship.fuel+=q.units;state.credits-=q.cost;save();notify();return{ok:true,quote:q,state:snapshot()};}
function shuffled(items){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
function sameSet(a=[],b=[]){return a.length===b.length&&[...a].sort().every((id,i)=>id===[...b].sort()[i]);}
function availablePool(location){return (CONTRACTS[location]||[]).filter(c=>known(c.destination));}
function workOffers(location=state.location){
 ensureWorkState();const pool=availablePool(location),ids=pool.map(c=>c.id),record=state.contractBoards[location];
 if(record&&record.trip===state.tripCount&&Array.isArray(record.offers)){const valid=record.offers.filter(id=>ids.includes(id));if(valid.length)return valid.map(id=>pool.find(c=>c.id===id)).filter(Boolean);}
 const limit=Math.min(2,pool.length);let offers=shuffled(ids).slice(0,limit),previous=record?.offers||[];
 if(pool.length>limit&&sameSet(offers,previous)){for(let n=0;n<5&&sameSet(offers,previous);n++)offers=shuffled(ids).slice(0,limit);}
 state.contractBoards[location]={trip:state.tripCount,offers:[...offers]};save();
 return offers.map(id=>pool.find(c=>c.id===id)).filter(Boolean);
}
function findContract(id){for(const pool of Object.values(CONTRACTS)){const found=pool.find(c=>c.id===id);if(found)return found;}return null;}
function acceptContract(id){
 ensureWorkState();const offer=workOffers(state.location).find(c=>c.id===id);
 if(!offer||state.operatorLocation!=='aboard'||state.activeContract)return{ok:false,state:snapshot()};
 if(cargoUsed()+cargoNeeded(offer)>state.ship.cargoCapacity)return{ok:false,reason:'cargo',state:snapshot()};
 Object.entries(offer.cargo||{}).forEach(([good,qty])=>state.cargo[good]=(state.cargo[good]||0)+qty);
 state.activeContract={...offer,cargo:{...(offer.cargo||{})},origin:state.location};save();notify();return{ok:true,state:snapshot()};
}
function canCompleteActive(){
 ensureWorkState();const c=state.activeContract;if(!c||c.destination!==state.location||state.operatorLocation!=='aboard')return false;
 return DOCKABLE.has(state.location)?state.condition==='docked':state.condition==='stationary';
}
function completeActiveContract(){
 ensureWorkState();const c=state.activeContract;if(!c||!canCompleteActive())return{ok:false,state:snapshot()};
 Object.entries(c.cargo||{}).forEach(([good,qty])=>{state.cargo[good]=Math.max(0,(state.cargo[good]||0)-qty);if(!state.cargo[good])delete state.cargo[good];});
 state.credits+=c.reward;state.reputation+=c.rep||0;state.completedContracts.push(c.id);state.activeContract=null;save();notify();return{ok:true,state:snapshot()};
}
function workStatus(){ensureWorkState();return{offers:workOffers(state.location).map(c=>({...c,cargo:{...(c.cargo||{})}})),cargoUsed:cargoUsed(),cargoCapacity:state.ship.cargoCapacity,canComplete:canCompleteActive()};}
function tradeMarket(){ensureWorkState();const market=TRADE_MARKETS[state.location];if(!market||!['haven-repair-bay','meridian-dock'].includes(state.operatorLocation))return{available:false,location:state.location,goods:{},credits:state.credits,cargoUsed:cargoUsed(),cargoCapacity:state.ship.cargoCapacity,owned:{...state.tradeCargo}};return{available:true,location:state.location,goods:JSON.parse(JSON.stringify(market)),credits:state.credits,cargoUsed:cargoUsed(),cargoCapacity:state.ship.cargoCapacity,owned:{...state.tradeCargo}};}
function buyTradeGood(id){const q=tradeMarket(),price=q.goods?.[id]?.buy;if(!q.available||!Number.isFinite(price)||state.credits<price||cargoUsed()>=state.ship.cargoCapacity)return{ok:false,state:snapshot()};state.credits-=price;state.tradeCargo[id]=(state.tradeCargo[id]||0)+1;save();notify();return{ok:true,state:snapshot()};}
function sellTradeGood(id){const q=tradeMarket(),price=q.goods?.[id]?.sell;if(!q.available||!Number.isFinite(price)||(state.tradeCargo[id]||0)<1)return{ok:false,state:snapshot()};state.tradeCargo[id]-=1;if(!state.tradeCargo[id])delete state.tradeCargo[id];state.credits+=price;save();notify();return{ok:true,state:snapshot()};}
function beginTravel(destination){const quote=travelQuote(destination);if(!quote.ok||state.condition!=='stationary'||state.operatorLocation!=='aboard')return{ok:false,quote,state:snapshot()};state.ship.fuel-=quote.cost;pendingTravel={cost:quote.cost};state={...state,condition:'traveling'};notify();return{ok:true,origin:state.location,destination,quote,state:snapshot()};}
function completeTravel(destination){if(!LOCATIONS.has(destination)||!known(destination)||state.condition!=='traveling')return{ok:false,state:snapshot()};state={...state,location:destination,condition:'stationary',operatorLocation:'aboard',tripCount:state.tripCount+1};pendingTravel=null;save();notify();return{ok:true,state:snapshot()};}
function cancelTravel(){if(state.condition!=='traveling')return{ok:false,state:snapshot()};if(pendingTravel?.cost)state.ship.fuel=Math.min(state.ship.fuelMax,state.ship.fuel+pendingTravel.cost);pendingTravel=null;state={...state,condition:'stationary'};notify();return{ok:true,state:snapshot()};}
function dock(){if(state.condition!=='stationary'||!DOCKABLE.has(state.location)||state.operatorLocation!=='aboard')return{ok:false,state:snapshot()};state={...state,condition:'docked'};save();notify();return{ok:true,state:snapshot()};}
function undock(){if(state.condition!=='docked'||state.operatorLocation!=='aboard')return{ok:false,state:snapshot()};state={...state,condition:'stationary'};save();notify();return{ok:true,state:snapshot()};}
function exitShip(){if(state.condition!=='docked'||state.operatorLocation!=='aboard'||!['haven','meridian','prospect'].includes(state.location))return{ok:false,state:snapshot()};const operatorLocation=state.location==='haven'?'haven-repair-bay':state.location==='meridian'?'meridian-dock':'last-lantern';state={...state,operatorLocation};save();notify();return{ok:true,state:snapshot()};}
function returnToShip(){if(state.condition!=='docked'||!['haven-repair-bay','meridian-dock','last-lantern'].includes(state.operatorLocation))return{ok:false,state:snapshot()};state={...state,operatorLocation:'aboard'};save();notify();return{ok:true,state:snapshot()};}
function compareOuterBeaconReports(){ensureDiscovery();if(state.location!=='prospect'||state.operatorLocation!=='last-lantern')return{ok:false,state:snapshot()};const d=state.discovery.outerBeacon;if(d.status==='confirmed')return{ok:false,state:snapshot()};d.status='confirmed';d.reportsCompared=3;d.note='Three independent survey crews reported the same faint navigation beacon coordinates beyond regular Prospect lanes.';if(!state.discovery.knownLocations.includes('calder'))state.discovery.knownLocations.push('calder');delete state.contractBoards.prospect;save();notify();return{ok:true,state:snapshot()};}
function advanceCalderSurvey(){
 ensureDiscovery();const d=state.discovery.calderSurvey;
 if(state.location!=='calder'||state.operatorLocation!=='aboard'||state.condition!=='stationary'||d.archiveRecovered)return{ok:false,state:snapshot()};
 if(d.stage==='unexamined')d.stage='array-noticed';
 else if(d.stage==='array-noticed')d.stage='array-identified';
 else if(d.stage==='array-identified'){d.stage='archive-recovered';d.archiveRecovered=true;d.note='A surviving Calder survey archive contains repeated observations at consistent coordinates that do not match anything on Wayfarer charts.';}
 else return{ok:false,state:snapshot()};
 save();notify();return{ok:true,state:snapshot()};
}
function shareCalderSurveyWithSeli(){
 ensureDiscovery();ensureSeli();const d=state.discovery.calderSurvey;
 if(!d.archiveRecovered||d.sharedWithSeli||state.operatorLocation!=='last-lantern'||seliPresence()!=='prospect')return{ok:false,state:snapshot()};
 d.sharedWithSeli=true;state.npcs.seli.memory.reviewedCalderSurvey=true;save();notify();return{ok:true,state:snapshot()};
}
function seliPresence(){ensureSeli();const seli=state.npcs.seli;if(!seli.met)return'meridian';const eligibleTrip=Number.isFinite(seli.memory.returnEligibleTrip)?seli.memory.returnEligibleTrip:Math.max(0,state.tripCount-2);return state.tripCount>=eligibleTrip?'prospect':'meridian';}
function chooseSeliFirstMeeting(choice){ensureSeli();const seli=state.npcs.seli;if(seli.met||!['share','private'].includes(choice))return{ok:false,state:snapshot()};seli.met=true;seli.memory.metTrip=state.tripCount;seli.memory.returnEligibleTrip=state.tripCount+2;if(choice==='share'){seli.relationship+=1;seli.memory.sharedMarketNotes=true;}else seli.memory.keptNotesPrivate=true;save();notify();return{ok:true,state:snapshot()};}
function acknowledgeSeliReturn(){ensureSeli();const seli=state.npcs.seli;if(!seli.met||seliPresence()!=='prospect')return{ok:false,state:snapshot()};if(!seli.memory.metAtProspect){seli.memory.metAtProspect=true;seli.memory.prospectMeetingTrip=state.tripCount;save();notify();}return{ok:true,state:snapshot()};}
function chooseMaraFirstMeeting(choice){ensureMara();const mara=state.npcs.mara;if(mara.met||!['thank','value'].includes(choice)||state.location!=='haven'||state.operatorLocation!=='haven-repair-bay')return{ok:false,state:snapshot()};mara.met=true;mara.memory.firstChoice=choice;mara.memory.metTrip=state.tripCount;if(choice==='thank')mara.memory.thankedForWayfarer=true;else mara.memory.askedWayfarerValue=true;save();notify();return{ok:true,state:snapshot()};}
function repairQuote(){const missing=Math.max(0,state.ship.hullMax-state.ship.hull),affordablePoints=Math.floor(state.credits/REPAIR_COST_PER_POINT),repairPoints=Math.min(missing,affordablePoints);return{missing,repairPoints,cost:repairPoints*REPAIR_COST_PER_POINT,fullCost:missing*REPAIR_COST_PER_POINT,canRepair:repairPoints>0};}
function repairHull(){const quote=repairQuote();if(state.location!=='haven'||!quote.canRepair)return{ok:false,quote};state={...state,credits:state.credits-quote.cost,ship:{...state.ship,hull:state.ship.hull+quote.repairPoints}};save();notify();return{ok:true,quote,state:snapshot()};}
function subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);}
window.HRState={get:snapshot,tradeMarket,buyTradeGood,sellTradeGood,advanceCalderSurvey,shareCalderSurveyWithSeli,beginTravel,completeTravel,cancelTravel,dock,undock,exitShip,returnToShip,compareOuterBeaconReports,chooseSeliFirstMeeting,acknowledgeSeliReturn,seliPresence,chooseMaraFirstMeeting,acceptContract,completeActiveContract,workStatus,travelQuote,refuelQuote,refuelToFull,repairQuote,repairHull,subscribe,save};
})();
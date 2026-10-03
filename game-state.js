(() => {
'use strict';
const STORAGE_KEY='havensReachGraphicalProofV1',DATA_VERSION=1,REPAIR_COST_PER_POINT=10;
const LOCATIONS=new Set(['haven','meridian','prospect','calder']),DOCKABLE=new Set(['haven','meridian','prospect']);
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
const freshState=()=>({app:'havens-reach-graphical',dataVersion:DATA_VERSION,location:'haven',operatorLocation:'aboard',condition:'stationary',credits:700,ship:{id:'wayfarer',name:'Wayfarer',hull:92,hullMax:100,fuel:80,fuelMax:80,cargoCapacity:8},npcs:{seli:{met:false,relationship:0,memory:{}}},cargo:{},activeContract:null,completedContracts:[],reputation:0,tripCount:0,contractBoards:{},discovery:{outerBeacon:{status:'unknown',reportsCompared:0},knownLocations:['haven','meridian','prospect']}});
function validState(c){return Boolean(c&&c.app==='havens-reach-graphical'&&c.dataVersion===DATA_VERSION&&LOCATIONS.has(c.location)&&['aboard','meridian-dock','last-lantern'].includes(c.operatorLocation)&&Number.isFinite(c.credits)&&c.credits>=0&&c.ship&&c.ship.id==='wayfarer'&&Number.isFinite(c.ship.hull)&&Number.isFinite(c.ship.hullMax)&&c.ship.hull>=0&&c.ship.hull<=c.ship.hullMax);}
function load(){try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return freshState();const parsed=JSON.parse(raw);return validState(parsed)?parsed:freshState();}catch(error){console.warn('Graphical proof save could not be loaded; using a fresh proof state.',error);return freshState();}}
let state=load(),listeners=new Set();
function snapshot(){return typeof structuredClone==='function'?structuredClone(state):JSON.parse(JSON.stringify(state));}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function notify(){const current=snapshot();listeners.forEach(fn=>fn(current));}
function ensureSeli(){if(!state.npcs||typeof state.npcs!=='object')state.npcs={};if(!state.npcs.seli||typeof state.npcs.seli!=='object')state.npcs.seli={met:false,relationship:0,memory:{}};if(!state.npcs.seli.memory||typeof state.npcs.seli.memory!=='object')state.npcs.seli.memory={};if(!Number.isFinite(state.npcs.seli.relationship))state.npcs.seli.relationship=0;state.npcs.seli.met=Boolean(state.npcs.seli.met);}
function ensureWorkState(){if(!state.cargo||typeof state.cargo!=='object')state.cargo={};if(!Array.isArray(state.completedContracts))state.completedContracts=[];if(!Number.isFinite(state.reputation))state.reputation=0;if(!Number.isFinite(state.tripCount))state.tripCount=0;if(!state.contractBoards||typeof state.contractBoards!=='object')state.contractBoards={};if(!('activeContract'in state))state.activeContract=null;}
function ensureDiscovery(){if(!state.discovery||typeof state.discovery!=='object')state.discovery={};if(!state.discovery.outerBeacon||typeof state.discovery.outerBeacon!=='object')state.discovery.outerBeacon={status:'unknown',reportsCompared:0};if(!Array.isArray(state.discovery.knownLocations))state.discovery.knownLocations=['haven','meridian','prospect'];['haven','meridian','prospect'].forEach(id=>{if(!state.discovery.knownLocations.includes(id))state.discovery.knownLocations.push(id);});if(state.discovery.outerBeacon.status==='confirmed'&&!state.discovery.knownLocations.includes('calder'))state.discovery.knownLocations.push('calder');}
ensureSeli();ensureWorkState();ensureDiscovery();
function cargoUsed(){ensureWorkState();return Object.values(state.cargo).reduce((sum,qty)=>sum+(Number.isFinite(qty)?qty:0),0);}
function cargoNeeded(contract){return Object.values(contract.cargo||{}).reduce((sum,qty)=>sum+qty,0);}
function known(destination){ensureDiscovery();return state.discovery.knownLocations.includes(destination);}
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
function beginTravel(destination){if(!LOCATIONS.has(destination)||!known(destination)||destination===state.location||state.condition!=='stationary'||state.operatorLocation!=='aboard')return{ok:false,state:snapshot()};state={...state,condition:'traveling'};notify();return{ok:true,origin:state.location,destination,state:snapshot()};}
function completeTravel(destination){if(!LOCATIONS.has(destination)||!known(destination)||state.condition!=='traveling')return{ok:false,state:snapshot()};state={...state,location:destination,condition:'stationary',operatorLocation:'aboard',tripCount:state.tripCount+1};save();notify();return{ok:true,state:snapshot()};}
function cancelTravel(){if(state.condition!=='traveling')return{ok:false,state:snapshot()};state={...state,condition:'stationary'};notify();return{ok:true,state:snapshot()};}
function dock(){if(state.condition!=='stationary'||!DOCKABLE.has(state.location)||state.operatorLocation!=='aboard')return{ok:false,state:snapshot()};state={...state,condition:'docked'};save();notify();return{ok:true,state:snapshot()};}
function undock(){if(state.condition!=='docked'||state.operatorLocation!=='aboard')return{ok:false,state:snapshot()};state={...state,condition:'stationary'};save();notify();return{ok:true,state:snapshot()};}
function exitShip(){if(state.condition!=='docked'||state.operatorLocation!=='aboard'||!['meridian','prospect'].includes(state.location))return{ok:false,state:snapshot()};state={...state,operatorLocation:state.location==='meridian'?'meridian-dock':'last-lantern'};save();notify();return{ok:true,state:snapshot()};}
function returnToShip(){if(state.condition!=='docked'||!['meridian-dock','last-lantern'].includes(state.operatorLocation))return{ok:false,state:snapshot()};state={...state,operatorLocation:'aboard'};save();notify();return{ok:true,state:snapshot()};}
function compareOuterBeaconReports(){ensureDiscovery();if(state.location!=='prospect'||state.operatorLocation!=='last-lantern')return{ok:false,state:snapshot()};const d=state.discovery.outerBeacon;if(d.status==='confirmed')return{ok:false,state:snapshot()};d.status='confirmed';d.reportsCompared=3;d.note='Three independent survey crews reported the same faint navigation beacon coordinates beyond regular Prospect lanes.';if(!state.discovery.knownLocations.includes('calder'))state.discovery.knownLocations.push('calder');delete state.contractBoards.prospect;save();notify();return{ok:true,state:snapshot()};}
function chooseSeliFirstMeeting(choice){ensureSeli();const seli=state.npcs.seli;if(seli.met||!['share','private'].includes(choice))return{ok:false,state:snapshot()};seli.met=true;if(choice==='share'){seli.relationship+=1;seli.memory.sharedMarketNotes=true;}else seli.memory.keptNotesPrivate=true;save();notify();return{ok:true,state:snapshot()};}
function repairQuote(){const missing=Math.max(0,state.ship.hullMax-state.ship.hull),affordablePoints=Math.floor(state.credits/REPAIR_COST_PER_POINT),repairPoints=Math.min(missing,affordablePoints);return{missing,repairPoints,cost:repairPoints*REPAIR_COST_PER_POINT,fullCost:missing*REPAIR_COST_PER_POINT,canRepair:repairPoints>0};}
function repairHull(){const quote=repairQuote();if(state.location!=='haven'||!quote.canRepair)return{ok:false,quote};state={...state,credits:state.credits-quote.cost,ship:{...state.ship,hull:state.ship.hull+quote.repairPoints}};save();notify();return{ok:true,quote,state:snapshot()};}
function subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);}
window.HRState={get:snapshot,beginTravel,completeTravel,cancelTravel,dock,undock,exitShip,returnToShip,compareOuterBeaconReports,chooseSeliFirstMeeting,acceptContract,completeActiveContract,workStatus,repairQuote,repairHull,subscribe,save};
})();
(() => {
  'use strict';
  const STORAGE_KEY = 'havensReachGraphicalProofV1';
  const DATA_VERSION = 1;
  const REPAIR_COST_PER_POINT = 10;
  const LOCATIONS = new Set(['haven','meridian']);
  const freshState = () => ({
    app: 'havens-reach-graphical', dataVersion: DATA_VERSION,
    location: 'haven', operatorLocation: 'aboard', condition: 'stationary', credits: 700,
    ship: { id: 'wayfarer', name: 'Wayfarer', hull: 92, hullMax: 100, fuel: 80, fuelMax: 80, cargoCapacity: 8 },
    npcs: { seli: { met: false, relationship: 0, memory: {} } }
  });
  function validState(c) {
    return Boolean(c && c.app === 'havens-reach-graphical' && c.dataVersion === DATA_VERSION &&
      LOCATIONS.has(c.location) && ['aboard','meridian-dock'].includes(c.operatorLocation) &&
      Number.isFinite(c.credits) && c.credits >= 0 && c.ship && c.ship.id === 'wayfarer' &&
      Number.isFinite(c.ship.hull) && Number.isFinite(c.ship.hullMax) &&
      c.ship.hull >= 0 && c.ship.hull <= c.ship.hullMax);
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return freshState();
      const parsed = JSON.parse(raw);
      return validState(parsed) ? parsed : freshState();
    } catch (error) {
      console.warn('Graphical proof save could not be loaded; using a fresh proof state.', error);
      return freshState();
    }
  }
  let state = load();
  function ensureSeli() {
    if (!state.npcs || typeof state.npcs !== 'object') state.npcs = {};
    if (!state.npcs.seli || typeof state.npcs.seli !== 'object') state.npcs.seli = { met: false, relationship: 0, memory: {} };
    if (!state.npcs.seli.memory || typeof state.npcs.seli.memory !== 'object') state.npcs.seli.memory = {};
    if (!Number.isFinite(state.npcs.seli.relationship)) state.npcs.seli.relationship = 0;
    state.npcs.seli.met = Boolean(state.npcs.seli.met);
  }
  ensureSeli();
  const listeners = new Set();
  function snapshot() { return typeof structuredClone === 'function' ? structuredClone(state) : JSON.parse(JSON.stringify(state)); }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function notify() { const current = snapshot(); listeners.forEach((listener) => listener(current)); }
  function beginTravel(destination) {
    if (!LOCATIONS.has(destination) || destination === state.location || state.condition !== 'stationary') return { ok: false, state: snapshot() };
    state = { ...state, condition: 'traveling' };
    notify();
    return { ok: true, origin: state.location, destination, state: snapshot() };
  }
  function completeTravel(destination) {
    if (!LOCATIONS.has(destination) || state.condition !== 'traveling') return { ok: false, state: snapshot() };
    state = { ...state, location: destination, condition: 'stationary' };
    save(); notify();
    return { ok: true, state: snapshot() };
  }
  function cancelTravel() {
    if (state.condition !== 'traveling') return { ok: false, state: snapshot() };
    state = { ...state, condition: 'stationary' };
    notify();
    return { ok: true, state: snapshot() };
  }
  function dock() {
    if (state.condition !== 'stationary') return { ok: false, state: snapshot() };
    state = { ...state, condition: 'docked' };
    save(); notify();
    return { ok: true, state: snapshot() };
  }
  function undock() {
    if (state.condition !== 'docked') return { ok: false, state: snapshot() };
    state = { ...state, condition: 'stationary' };
    save(); notify();
    return { ok: true, state: snapshot() };
  }
  function exitShip() {
    if (state.location !== 'meridian' || state.condition !== 'docked' || state.operatorLocation !== 'aboard') return { ok: false, state: snapshot() };
    state = { ...state, operatorLocation: 'meridian-dock' };
    save(); notify();
    return { ok: true, state: snapshot() };
  }
  function returnToShip() {
    if (state.location !== 'meridian' || state.condition !== 'docked' || state.operatorLocation !== 'meridian-dock') return { ok: false, state: snapshot() };
    state = { ...state, operatorLocation: 'aboard' };
    save(); notify();
    return { ok: true, state: snapshot() };
  }
  function chooseSeliFirstMeeting(choice) {
    ensureSeli();
    const seli = state.npcs.seli;
    if (seli.met || !['share','private'].includes(choice)) return { ok: false, state: snapshot() };
    seli.met = true;
    if (choice === 'share') { seli.relationship += 1; seli.memory.sharedMarketNotes = true; }
    else seli.memory.keptNotesPrivate = true;
    save(); notify();
    return { ok: true, state: snapshot() };
  }
  function repairQuote() {
    const missing = Math.max(0, state.ship.hullMax - state.ship.hull);
    const affordablePoints = Math.floor(state.credits / REPAIR_COST_PER_POINT);
    const repairPoints = Math.min(missing, affordablePoints);
    return { missing, repairPoints, cost: repairPoints * REPAIR_COST_PER_POINT, fullCost: missing * REPAIR_COST_PER_POINT, canRepair: repairPoints > 0 };
  }
  function repairHull() {
    const quote = repairQuote();
    if (state.location !== 'haven' || !quote.canRepair) return { ok: false, quote };
    state = { ...state, credits: state.credits - quote.cost, ship: { ...state.ship, hull: state.ship.hull + quote.repairPoints } };
    save(); notify();
    return { ok: true, quote, state: snapshot() };
  }
  function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  window.HRState = { get: snapshot, beginTravel, completeTravel, cancelTravel, dock, undock, exitShip, returnToShip, chooseSeliFirstMeeting, repairQuote, repairHull, subscribe, save };
})();
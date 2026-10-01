(() => {
  'use strict';
  const STORAGE_KEY = 'havensReachGraphicalProofV1';
  const DATA_VERSION = 1;
  const REPAIR_COST_PER_POINT = 10;
  const freshState = () => ({
    app: 'havens-reach-graphical', dataVersion: DATA_VERSION,
    location: 'haven', operatorLocation: 'aboard', condition: 'stationary', credits: 700,
    ship: { id: 'wayfarer', name: 'Wayfarer', hull: 92, hullMax: 100, fuel: 80, fuelMax: 80, cargoCapacity: 8 }
  });
  function validState(c) {
    return Boolean(c && c.app === 'havens-reach-graphical' && c.dataVersion === DATA_VERSION &&
      c.location === 'haven' && c.operatorLocation === 'aboard' &&
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
  const listeners = new Set();
  function snapshot() { return typeof structuredClone === 'function' ? structuredClone(state) : JSON.parse(JSON.stringify(state)); }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function notify() { const current = snapshot(); listeners.forEach((listener) => listener(current)); }
  function repairQuote() {
    const missing = Math.max(0, state.ship.hullMax - state.ship.hull);
    const affordablePoints = Math.floor(state.credits / REPAIR_COST_PER_POINT);
    const repairPoints = Math.min(missing, affordablePoints);
    return { missing, repairPoints, cost: repairPoints * REPAIR_COST_PER_POINT, fullCost: missing * REPAIR_COST_PER_POINT, canRepair: repairPoints > 0 };
  }
  function repairHull() {
    const quote = repairQuote();
    if (!quote.canRepair) return { ok: false, quote };
    state = { ...state, credits: state.credits - quote.cost, ship: { ...state.ship, hull: state.ship.hull + quote.repairPoints } };
    save(); notify();
    return { ok: true, quote, state: snapshot() };
  }
  function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  window.HRState = { get: snapshot, repairQuote, repairHull, subscribe, save };
})();
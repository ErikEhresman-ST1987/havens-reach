// Haven's Reach — Durable State & Storage Foundation
// Centralizes save-format versioning and conservative structural normalization.
// Specialized systems remain responsible for interpreting their own legacy state.

const HR_SAVE_KEY = "havensReachPrototypeV01";
const HR_SAVE_RECOVERY_KEY = "havensReachRecoveryBackup";
const HR_CURRENT_SAVE_VERSION = 1;

function createDefaultState() {
  return {
    saveVersion: HR_CURRENT_SAVE_VERSION,
    location: "haven",
    credits: 700,
    reputation: 0,
    ship: {
      name: "Wayfarer",
      hull: 100,
      shield: 40,
      engine: 1,
      sensors: 1,
      cargoCapacity: 8,
      fuelCapacity: 80,
      fuel: 80
    },
    cargo: {},
    activeContract: null,
    completedContracts: [],
    upgrades: [],
    log: ["You left Haven with an old utility transport, a small account, and no one deciding where you go next."]
  };
}

function migrateSaveState(savedState) {
  const migrated = savedState && typeof savedState === "object" && !Array.isArray(savedState)
    ? { ...savedState }
    : {};

  const version = Number.isInteger(migrated.saveVersion) ? migrated.saveVersion : 0;

  // Version 0 was the original unversioned save format. Version 1 deliberately
  // preserves every existing property and only establishes an explicit version.
  if (version < 1) migrated.saveVersion = 1;

  return migrated;
}

function normalizeCoreState(savedState) {
  const defaults = createDefaultState();
  const normalized = savedState && typeof savedState === "object" && !Array.isArray(savedState)
    ? { ...savedState }
    : {};

  if (typeof normalized.location !== "string" || !normalized.location) normalized.location = defaults.location;
  if (!Number.isFinite(normalized.credits)) normalized.credits = defaults.credits;
  if (!Number.isFinite(normalized.reputation)) normalized.reputation = defaults.reputation;
  if (!normalized.ship || typeof normalized.ship !== "object" || Array.isArray(normalized.ship)) normalized.ship = { ...defaults.ship };
  if (!normalized.cargo || typeof normalized.cargo !== "object" || Array.isArray(normalized.cargo)) normalized.cargo = {};
  if (!("activeContract" in normalized)) normalized.activeContract = defaults.activeContract;
  if (!Array.isArray(normalized.completedContracts)) normalized.completedContracts = [];
  if (!Array.isArray(normalized.upgrades)) normalized.upgrades = [];
  if (!Array.isArray(normalized.log)) normalized.log = [...defaults.log];
  normalized.saveVersion = HR_CURRENT_SAVE_VERSION;

  return normalized;
}

function loadStoredState() {
  const raw = localStorage.getItem(HR_SAVE_KEY);
  if (!raw) return createDefaultState();

  try {
    const parsed = JSON.parse(raw);
    return normalizeCoreState(migrateSaveState(parsed));
  } catch (error) {
    // Preserve the unreadable value before the app can write a fresh state.
    try {
      localStorage.setItem(HR_SAVE_RECOVERY_KEY, raw);
    } catch {
      // If recovery storage itself is unavailable, continue with a safe in-memory state.
    }
    console.error("Haven's Reach could not read the local save. A fresh in-memory state was created.", error);
    return createDefaultState();
  }
}

function writeStoredState(currentState) {
  currentState.saveVersion = HR_CURRENT_SAVE_VERSION;
  localStorage.setItem(HR_SAVE_KEY, JSON.stringify(currentState));
}

function clearStoredState() {
  localStorage.removeItem(HR_SAVE_KEY);
  localStorage.removeItem(HR_SAVE_RECOVERY_KEY);
}

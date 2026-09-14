// Haven's Reach — People Data Ownership Migration
// During architecture hardening, the consolidated people bundle retains its original
// recurring-NPC literals as rollback material. Runtime ownership now comes from
// world-data.js so handcrafted people definitions have one authoritative source.

if (typeof AMBIENT_NPCS !== "undefined" && typeof FIRST_FRONTIER_RECURRING_NPCS !== "undefined") {
  Object.keys(AMBIENT_NPCS).forEach(id => delete AMBIENT_NPCS[id]);
  Object.assign(AMBIENT_NPCS, FIRST_FRONTIER_RECURRING_NPCS);
}

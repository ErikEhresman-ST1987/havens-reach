# Haven's Reach — Expansion Foundation Regression Baseline

Branch: `expansion-foundation`

Purpose: preserve the proven First Frontier game exactly while the codebase is hardened for the Second Frontier and later final expansion.

This document is a behavior baseline, not a feature roadmap. Architecture work on this branch should be judged against the rule:

> Haven's Reach should look, play, save, travel, trade, converse, discover, develop stations, and behave exactly as it did before structural changes unless a separate gameplay change is explicitly approved.

## Baseline rules

- `main` remains the known-good playable version and GitHub Pages source.
- Architecture work occurs on `expansion-foundation`.
- No Second Frontier gameplay/content should be added during foundation work.
- Make one coherent structural change at a time.
- After each structural change, test the affected behavior before moving on.
- Preserve existing local saves.
- Do not change player-facing behavior as part of cleanup unless separately approved.
- Do not combine unrelated refactors.
- If a structural step cannot be completed with at least 90% confidence, stop and choose a safer path.

## Core regression checklist

### Startup and persistence

- Existing local save loads without reset or lost progress.
- Fresh New Game starts correctly.
- Closing and reopening the page preserves state.
- Current location, credits, ship state, cargo, contracts, NPC state, discoveries, station projects, market memory, field state, and customization survive reload where currently applicable.
- New Game clears the current save and returns to a clean starting state.

### Core operator interface

- Credits, fuel, hull, and cargo display correctly.
- Current location and ship information display correctly.
- Station, Market, Contracts, Travel, and Ship tabs remain usable.
- Captain's Log continues recording and displaying recent events.
- Existing phone and iPad layouts remain usable and visually unchanged unless a separate responsive change is approved.

### Markets and trade

- Market renders correctly at all existing permanent stations.
- Player can buy available commodities.
- Cargo capacity prevents overfilling.
- Insufficient credits prevent purchases.
- Player can sell owned commodities where the port trades them.
- Finite specialty stock decreases on purchase and increases on sale as it currently does.
- Dynamic market conditions persist for their established trip duration.
- Market conditions advance only from real travel as currently implemented.
- Market memory continues recording what the player actually observed.
- Travel/map remembered-market summaries remain correct.

### Contracts

- Contract boards render correctly.
- Only one active contract remains allowed.
- Cargo-space validation still works when accepting cargo contracts.
- Undiscovered destinations remain hidden where current discovery rules require it.
- Active-contract route information remains correct.
- Contract completion occurs on arrival at the correct destination.
- Cargo, credits, reputation, completion history, and follow-on consequences update correctly.
- Repeatable/refreshing authored contracts continue their current cooldown behavior.

### Travel and navigation

- Only currently legitimate adjacent travel can be initiated.
- Known/unknown system rules continue to work.
- Fuel validation and fuel consumption remain correct.
- Arrival/refueling behavior remains unchanged.
- One-leg-at-a-time travel remains intact.
- Travel map shows the player's currently known permanent systems.
- Responsive phone map continues using the proven dynamic layout.
- Active contract route highlighting/information remains correct.
- Brief travel transition remains visible and does not delay play excessively.
- Progressive First Frontier discovery remains unchanged.

### Encounters

- Random travel encounters still occur at the current rate/conditions.
- Encounter dialog opens and closes correctly.
- Existing encounter choices continue producing their established consequences.
- Engine, sensors, reputation, cargo, credits, fuel, and hull continue affecting encounter outcomes where currently applicable.
- Encounter resolution returns cleanly to normal play.

### NPCs and relationships

- Existing permanent contacts appear at the correct stations.
- Meet/Talk behavior remains intact.
- Relationship state and NPC memory persist.
- NPC opportunity signaling remains visible when applicable.
- Contact Catch Up remains available with its established per-visit limit and Caught Up state.
- Leaving and returning resets visit-specific conversation availability as currently intended.
- Recurring NPCs continue moving independently through the existing world.
- Recurring NPCs remember prior meetings and use authored repeat conversations without exposing relationship meters or tiers.

### Cantinas and rumors

- Existing cantinas render at the correct stations.
- Existing rumors/news/discovery interactions continue to work.
- First Frontier discovery opportunities continue to appear only under their current conditions.

### Field exploration

- Existing field-site discovery channels continue working: scanners, NPC leads, cantina leads, and breadcrumbs.
- Active field-site ceiling remains intact.
- Named field sites preserve their completion state.
- Renewable field sites continue renewing under the established quiet-period rules.
- Empty/inconclusive outcomes remain valid outcomes.
- Leaving a resolved transient location removes it as currently intended.
- Existing station-development consequences that generate field/recovery/survey leads remain intact.

### Station development and persistent world change

- Haven station projects remain available under their current conditions.
- Meridian Independent Trade Berth remains functional and its freight consequence continues working.
- Prospect Frontier Service Dock remains functional and can generate its current recovery consequences.
- Calder Navigation Relay remains functional and preserves current analysis/discovery consequences.
- Pelagos Deep Survey Array remains functional and preserves its delayed analysis behavior.
- Draak Tor/Red Mesa existing capital-development consequence remains intact.
- Completed projects remain completed after reload.
- Project requirements, costs, materials, relationship gates, cooldowns, and signposting remain unchanged.

### Ships, upgrades, and operator customization

- Existing ship chassis behavior remains unchanged.
- Existing ship upgrades remain purchasable only when eligible.
- Cargo/fuel/engine/sensor/hull effects remain correct.
- Wayfarer Long-Haul Refit remains intact.
- Captain and ship naming/customization remain persistent.

### Visual identity

- Existing station arrival visuals remain intact.
- Commodity iconography remains intact.
- NPC visual identity remains intact.
- Lightweight visual assets remain functional on phone, iPad, and desktop layouts.
- No architecture pass should increase visual weight or introduce unnecessary animation.

## Structural invariants during migration

The following are deliberately protected while architecture changes underneath them:

1. HTML/CSS/vanilla JavaScript remains the stack.
2. GitHub Pages remains the deployment model.
3. `localStorage` remains the persistence mechanism unless a future requirement proves otherwise.
4. No account, backend, subscription, framework, build system, or mandatory cloud dependency is introduced.
5. Existing save data is treated as user-owned state and must not be discarded by a refactor.
6. First Frontier behavior is the reference implementation for regression testing.
7. Expansion architecture should reduce hidden load-order dependencies rather than create new ones.
8. New content should increasingly be added through stable data/registration points rather than by wrapping global functions.

## Foundation sequence

The currently approved structural sequence is:

1. Regression baseline — this document.
2. Durable versioned state/storage foundation.
3. Authoritative travel lifecycle.
4. Separate stable world content from gameplay engines.
5. General discovery/navigation graph capable of branching regions and independently discovered routes.
6. Explicit interaction ownership for encounters, NPC interactions, opportunities, and station-development hooks.
7. Organize files and retire superseded compatibility/wrapper code only after behavior is proven stable.

Each stage should stop for validation before the next begins.

## Pass 0 completion criterion

Pass 0 is complete when this baseline exists on `expansion-foundation` and no gameplay files have been changed.

# Haven's Reach — Development Handoff

Updated: 2026-09-14  
Active development branch: `expansion-foundation`  
Verified checkpoint: `0d4d65a50b4d99d2c769a9e1c41121db532e04e2` — **Pass 6D inactive Calder relay duplicate retired and verified**

## Current status

The Expansion Foundation hardening work is intact and stable. `main` remains the protected baseline while the branch advances through controlled, tested passes.

- `main` remains the known-good playable First Frontier version and GitHub Pages source.
- All architecture work remains isolated on `expansion-foundation`.
- Existing browser save compatibility has been preserved.
- No rollback, reconstruction, or restart is needed.
- Pass 5 interaction ownership has been structurally audited across the active runtime chain.
- The project owner manually verified the migrated interaction families, including operator missions and restricted-cargo customs failure.
- Pass 5 is complete. Commit `5472a6f` is the current confirmed stable gameplay checkpoint.

The repository is the authority for exact implementation state. This document is the authority for where development should resume.

## Foundation work completed

### Pass 0 — Regression baseline

Complete.

`ARCHITECTURE-REGRESSION-BASELINE.md` defines the protected player-facing behavior and the test checklist for structural work.

### Pass 1 — Durable state and storage foundation

Complete and stable.

- Version-aware state loading and normalization are established.
- Existing local saves remain supported.
- Storage ownership is clearer without changing the player experience.

### Pass 2 — Authoritative travel lifecycle

Complete and stable.

- Travel-dependent systems register through explicit lifecycle hooks.
- Dynamic markets, the field network, progressive discovery, and navigation integration use the travel lifecycle.
- Existing travel behavior and one-leg-at-a-time play remain intact.

### Pass 3 — World-data ownership and structural consolidation

Complete and stable.

- World data ownership was clarified.
- Station-development files were consolidated.
- People and conversation files were consolidated.
- Commodity and NPC visual-identity files were consolidated.
- Transient-field files were consolidated.
- Compatibility files and legacy wrappers were deliberately retained where they still provide a safe rollback path.

### Pass 4 — Discovery and navigation graph

Complete and stable for the First Frontier.

- Navigation is capable of supporting branching regions and independently discovered routes.
- Existing First Frontier discovery and travel behavior remain unchanged.
- Phone and iPad travel-map improvements were tested during this work.

### Pass 5 — Explicit interaction ownership

Complete, structurally audited, and manually verified.

#### Encounter routing

The dispatcher now explicitly routes the proven encounter families, including:

- Rich encounters
- Persistent-contact encounters
- Frontier-contact actions
- NPC-opportunity actions
- Seli private freight
- Draak freight retrofit
- Transient-field leads
- Field Network leads
- Station-development encounters
- Mission-depth encounters
- Content-depth encounters

#### NPC interaction routing

Pass 5C1 migrated and activated:

- Core contacts: Mara, Seli, and Lena
- Frontier contacts: Orin, Draak, and Saeli
- NPC opportunities

Pass 5C2 migrated and activated the specialized later-loaded interactions:

- Seli private-freight referral
- Draak freight-retrofit referral
- Draak transient-field lead
- Field Network NPC leads

Registration precedence is intentional: specialized later-loaded interaction owners receive the first opportunity to handle an NPC, while ordinary conversations remain available underneath them.

#### Pass 5D1 — Renewable Field Lead repair

Implemented, activated, and manually verified.

- Renewable NPC field-lead Accept and Later actions now have explicit dispatcher routing.
- The proven behavior remains owned by `field-network-renewal.js`.
- The project owner generated and accepted a renewable NPC lead and confirmed the expected result.

#### Pass 5D2–5D4 — Cross-cutting interaction precedence

Implemented, activated, and manually verified.

- Smuggling customs detection runs as an explicit interceptor before ordinary customs resolution.
- Chassis-aware travel outcomes retain explicit precedence for the six outcomes they modify.
- Contract-variety mission outcomes retain explicit precedence and match the active mission kind.
- The project owner verified ordinary customs, restricted-cargo detection and confiscation, chassis-aware outcomes, and operator-mission resolution.

#### Pass 5E1–5E2 — Remaining NPC ownership

Implemented, activated, and manually verified.

- Renewable field-lead NPC offers route through the dispatcher while preserving authored one-time lead priority.
- Station-development interactions for Seli, Lena, Orin, and Saeli route through the dispatcher.
- The final runtime gateway is installed after all registered owners, preventing later legacy wrappers from reclaiming the public interaction paths.

#### Final interaction audit

Complete.

- Every reachable encounter and NPC family loaded by `index.html` has an explicit dispatcher owner or deliberate base fallback.
- Interceptor and handler precedence matches the proven legacy behavior.
- No later-loaded wrapper replaces either final dispatcher gateway.
- Duplicate standalone source files not loaded by `index.html` were identified as Pass 6 retirement candidates; they are not active routing gaps.

## Pass 5C2 verification

The project owner tested the current branch after activation and reported that everything looked good.

Treat the following as verified at checkpoint `33ae55aa`:

- Normal game startup and play remain functional.
- Ordinary NPC conversations remain functional.
- Specialized NPC interactions route correctly.
- Encounter choices continue resolving correctly.
- No visible regression was found after the Pass 5C2 activation.

## Pass 6 — Narrow compatibility retirement

In progress.

### Pass 6A — Inactive transient-field duplicate

Implemented and manually verified.

- The retirement audit proved that `transient-field-site.js` was not loaded by `index.html`.
- Its declared behavior is present in the active consolidated owner, `transient-field.js`.
- Only the inactive JavaScript duplicate was removed; `transient-field-site.css` remains active and untouched.
- The project owner reopened the existing save and confirmed normal transient-field interaction behavior.
- Commit `a585703` is the current verified Pass 6 checkpoint.

### Pass 6B — Inactive Meridian berth duplicate

Implemented and manually verified.

- The retirement audit proved that `meridian-trade-berth.js` was not loaded by `index.html`.
- All declared symbols remain present in the active consolidated owner, `station-development.js`.
- The project owner confirmed that Seli's berth memory and the Independent Trade Berth improvement panel remain correct with the existing save.
- Commit `822a24d` is the current verified Pass 6 checkpoint.

### Pass 6C — Inactive Prospect dock duplicate

Implemented and manually verified.

- The retirement audit proved that `prospect-frontier-service-dock.js` was not loaded by `index.html`.
- All declared symbols remain present in the active consolidated owner, `station-development.js`.
- The project owner confirmed that Lena's dock memory and the Frontier Service Dock improvement panel remain correct with the existing save.
- Commit `047eaed` is the current verified Pass 6 checkpoint.

### Pass 6D — Inactive Calder relay duplicate

Implemented and manually verified.

- The retirement audit proved that `calder-navigation-relay.js` was not loaded by `index.html`.
- All declared symbols remain present in the active consolidated owner, `station-development.js`.
- The project owner confirmed that Orin's relay memory and the Navigation Relay improvement panel remain correct with the existing save.
- Commit `0d4d65a` is the current verified Pass 6 checkpoint.

## Important architectural cautions

- Do not merge `expansion-foundation` into `main` merely because an individual pass is stable. Merge only after the full foundation is judged ready.
- Do not delete legacy wrappers or compatibility files yet.
- Do not reorder scripts in `index.html` casually. Some preserved feature implementations still depend on proven load order even though their public routing is now explicit.
- Do not combine wrapper retirement, file reorganization, and new Second Frontier content in one change.
- Do not change save keys or discard unknown saved properties.
- Do not add a framework, build system, backend, account system, or cloud dependency.
- Keep HTML, CSS, vanilla JavaScript, GitHub Pages, and local ownership.
- Apply one coherent structural change at a time and test the affected behavior before continuing.

## Locked progression

Pass 5 is complete at the named stable gameplay checkpoint `5472a6f`. Continue through the following bounded sequence:

1. Perform a read-only Pass 6 retirement audit.
2. Classify each legacy wrapper or compatibility file as active owner, inactive fallback, inactive duplicate, or uncertain.
3. Retire only the smallest proven-inactive batch.
4. Activate and manually verify that batch against `ARCHITECTURE-REGRESSION-BASELINE.md`.
5. Repeat only while another removal is clearly beneficial and equally well proven.
6. Stop hardening when Second Frontier features can be added through stable state, lifecycle, navigation, interaction, and rendering extension points without introducing new global wrapper chains.

Do not turn Pass 6 into a general rewrite. Do not reorganize active files merely for neatness. Never combine uncertain retirement, file reorganization, and new Second Frontier content in one change.

## Post-hardening lessons work

After the Haven's Reach foundation is complete:

1. Make one focused revision to **App Development Principles and Methods** adding an **Architecture Before Expansion** section.
2. Create one lean, reusable **Project Foundation Plan** template for substantial new apps.
3. Require the plan to identify state ownership, save migration, lifecycles, registration points, interaction ownership, rendering ownership, data/behavior boundaries, dependency order, protected behavior, verification, deferrals, and a stopping condition.
4. Leave the Mobile Interface and SVG guidelines lean and unchanged unless later project evidence demonstrates a specific missing rule.

This documentation work must remain grounded in behavior and failure modes observed in Haven's Reach and the other completed apps. It should not grow into a general reference library or collect unsupported best practices.

## Lessons capture queue

These lessons were demonstrated directly by the Haven's Reach hardening and recovery. Preserve them for the post-foundation documentation review; merge them into existing guidance where possible rather than automatically creating more documents.

- **Repository over conversation:** Chat history is working context, not the durable project record. Exact code state belongs in version control, and the current verified state and next step belong in a repository-backed handoff.
- **Separate implementation, activation, and verification:** A change can be written but not loaded, loaded but not exercised, or exercised only on a common path. Record these as distinct states.
- **Cache activation is part of deployment:** For static browser apps, updating a file without updating its cache/version reference can leave users running older code.
- **Test ownership paths, not only visible screens:** Common gameplay can look correct while rare, conditional, or late-game interactions are bypassed. Test representative paths for every registered owner and every cross-cutting rule.
- **Audit the actual runtime chain:** When replacing wrappers, inventory every definition, reassignment, capture, registration, fallback, and script-load position. The intended migration list is not proof that all reachable behavior was migrated.
- **Cross-cutting behavior needs explicit precedence:** Smuggling detection, chassis-aware damage, and varied mission outcomes modify behavior owned elsewhere. Such overlays require a deliberate composition or priority rule rather than competing global wrappers.
- **The second wrapper is an architecture warning:** When a second feature needs to wrap the same shared global function, stop adding wrappers and create a stable registration or lifecycle point before the chain grows.
- **Compatibility code needs a retirement test:** Preserve legacy behavior during migration, but label whether each wrapper is active, inactive fallback, or duplicated compatibility. Remove it only after the replacement path and regression coverage are proven.
- **A successful prototype can outgrow its assumptions:** Hardening should occur when expansion pressure appears, before adding another major region or feature family—not automatically during the earliest experiment and not after unlimited growth.
- **Every hardening effort needs a stopping condition:** The goal is a dependable expansion foundation, not architectural perfection.

## Testing discipline for Pass 6

Use `ARCHITECTURE-REGRESSION-BASELINE.md` as the full reference. At minimum, any retirement batch must verify:

- An ordinary core-contact conversation
- An ordinary frontier-contact conversation
- A currently available NPC opportunity
- The specialized interaction being changed
- Accept/Later or equivalent encounter choices
- Reload with the existing save
- Phone/iPad usability in the affected interface

## Recovery instructions

If a future development chat ends unexpectedly:

1. Do not restart or recreate the project.
2. Inspect the head of `expansion-foundation`.
3. Compare the latest commit with the verified checkpoint `0d4d65a` (Pass 6D), using `5472a6f` as the completed Pass 5 gameplay baseline.
4. Treat later committed changes as implemented but unverified unless the handoff records successful testing.
5. Return to `5472a6f` conceptually—not destructively—when diagnosing a regression.
6. Preserve `main` as the known-good playable baseline.

## Product direction remains unchanged

Haven's Reach is a calm, optimistic, non-combat space-operator game built around trade, travel, discovery, relationships, useful work, station development, and a world that becomes more lived-in through play.

Architecture exists to support that experience. Structural work should reduce fragility and make future expansion safer; it should not become an end in itself.

# Haven's Reach — Development Handoff

Updated: 2026-09-14  
Active development branch: `expansion-foundation`  
Verified checkpoint: `33ae55aad0068c6e3f4bd4263516cbcc10351ba1` — **Activate Pass 5C2 special NPC interaction routing**

## Current status

The Expansion Foundation hardening work is intact and stable. The branch is 68 commits ahead of `main` and 0 commits behind it at this checkpoint.

- `main` remains the known-good playable First Frontier version and GitHub Pages source.
- All architecture work remains isolated on `expansion-foundation`.
- Existing browser save compatibility has been preserved.
- No rollback, reconstruction, or restart is needed.
- Pass 5C2 has been manually tested by the project owner and is a confirmed stable checkpoint.

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

Implemented through Pass 5C2 and manually verified.

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

## Pass 5C2 verification

The project owner tested the current branch after activation and reported that everything looked good.

Treat the following as verified at checkpoint `33ae55aa`:

- Normal game startup and play remain functional.
- Ordinary NPC conversations remain functional.
- Specialized NPC interactions route correctly.
- Encounter choices continue resolving correctly.
- No visible regression was found after the Pass 5C2 activation.

## Important architectural cautions

- Do not merge `expansion-foundation` into `main` merely because an individual pass is stable. Merge only after the full foundation is judged ready.
- Do not delete legacy wrappers or compatibility files yet.
- Do not reorder scripts in `index.html` casually. Some preserved feature implementations still depend on proven load order even though their public routing is now explicit.
- Do not combine wrapper retirement, file reorganization, and new Second Frontier content in one change.
- Do not change save keys or discard unknown saved properties.
- Do not add a framework, build system, backend, account system, or cloud dependency.
- Keep HTML, CSS, vanilla JavaScript, GitHub Pages, and local ownership.
- Apply one coherent structural change at a time and test the affected behavior before continuing.

## Next logical development step

Begin with a read-only completion audit of interaction ownership.

The audit should:

1. Inventory every remaining assignment or wrapper of `window.resolveEncounter` and `window.openNpcInteraction`.
2. Map each legacy wrapper to its explicit dispatcher registration.
3. Identify any interaction family that still reaches the player but lacks explicit ownership.
4. Confirm that specialized NPC precedence matches the proven legacy behavior.
5. Separate wrappers that are now inactive compatibility layers from wrappers that still perform necessary feature work.
6. Recommend the smallest next pass, if any, without deleting compatibility code.

If the audit finds no uncovered player-facing path, declare interaction migration complete and create a named checkpoint before considering file retirement. If it finds an uncovered path, migrate only that family, activate it with a cache-version change, and run the relevant regression tests.

## Testing discipline for the next pass

Use `ARCHITECTURE-REGRESSION-BASELINE.md` as the full reference. At minimum, any interaction-routing change must verify:

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
3. Compare the latest commit with the verified checkpoint `33ae55aa`.
4. Treat later committed changes as implemented but unverified unless the handoff records successful testing.
5. Return to `33ae55aa` conceptually—not destructively—when diagnosing a regression.
6. Preserve `main` as the known-good playable baseline.

## Product direction remains unchanged

Haven's Reach is a calm, optimistic, non-combat space-operator game built around trade, travel, discovery, relationships, useful work, station development, and a world that becomes more lived-in through play.

Architecture exists to support that experience. Structural work should reduce fragility and make future expansion safer; it should not become an end in itself.

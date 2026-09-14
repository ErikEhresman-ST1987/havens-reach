# Haven's Reach — Development Handoff

Updated: 2026-09-14  
Active development branch: `expansion-foundation`  
Verified checkpoint: `89887d141077f442b10ac765327ccb40aceea76e` — **Activate Pass 5D1 renewable field lead routing**

## Current status

The Expansion Foundation hardening work is intact and stable. `main` remains the protected baseline while the branch advances through controlled, tested passes.

- `main` remains the known-good playable First Frontier version and GitHub Pages source.
- All architecture work remains isolated on `expansion-foundation`.
- Existing browser save compatibility has been preserved.
- No rollback, reconstruction, or restart is needed.
- Pass 5C2 and Pass 5D1 have been manually tested by the project owner.
- Pass 5D1 is the current confirmed stable checkpoint.

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

#### Pass 5D1 — Renewable Field Lead repair

Implemented, activated, and manually verified.

- Renewable NPC field-lead Accept and Later actions now have explicit dispatcher routing.
- The proven behavior remains owned by `field-network-renewal.js`.
- The project owner generated and accepted a renewable NPC lead and confirmed the expected result.

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

## Locked progression

The interaction audit is complete. Continue through the following bounded sequence:

1. Repair smuggling-contract customs interception.
2. Repair chassis-aware encounter outcomes.
3. Repair contract-variety precedence.
4. Complete explicit ownership for the remaining station-development and renewable-field NPC hooks.
5. Re-audit interaction ownership. If no reachable path is uncovered, declare Pass 5 complete and create a named stable checkpoint.
6. Perform a narrow Pass 6 cleanup: organize the finished structure and retire only wrappers or compatibility files proven inactive and safe to remove.
7. Stop hardening when Second Frontier features can be added through stable state, lifecycle, navigation, interaction, and rendering extension points without introducing new global wrapper chains.

Do not turn Pass 6 into a general rewrite. Do not combine these repairs. Each remains a separate implementation, activation, and user-verification step.

## Post-hardening lessons work

After the Haven's Reach foundation is complete:

1. Make one focused revision to **App Development Principles and Methods** adding an **Architecture Before Expansion** section.
2. Create one lean, reusable **Project Foundation Plan** template for substantial new apps.
3. Require the plan to identify state ownership, save migration, lifecycles, registration points, interaction ownership, rendering ownership, data/behavior boundaries, dependency order, protected behavior, verification, deferrals, and a stopping condition.
4. Leave the Mobile Interface and SVG guidelines lean and unchanged unless later project evidence demonstrates a specific missing rule.

This documentation work must remain grounded in behavior and failure modes observed in Haven's Reach and the other completed apps. It should not grow into a general reference library or collect unsupported best practices.

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
3. Compare the latest commit with the verified checkpoint `89887d14`.
4. Treat later committed changes as implemented but unverified unless the handoff records successful testing.
5. Return to `89887d14` conceptually—not destructively—when diagnosing a regression.
6. Preserve `main` as the known-good playable baseline.

## Product direction remains unchanged

Haven's Reach is a calm, optimistic, non-combat space-operator game built around trade, travel, discovery, relationships, useful work, station development, and a world that becomes more lived-in through play.

Architecture exists to support that experience. Structural work should reduce fragility and make future expansion safer; it should not become an end in itself.

# Haven's Reach — Current Development Handoff

## Checkpoint

Second Frontier Batch 1, **Crimson Expanse & Still Harbor**, is implemented in the working tree.

The batch adds the first permanent location beyond the six-system First Frontier while deliberately stopping before Information Convergence or discovery of another Second Frontier system.

## Implemented

- Still Harbor is a permanent system connected to Pelagos by one 34-fuel route.
- The route becomes chartable at Pelagos by comparing ordinary outbound flight plans.
- Discovery persists through the existing `state.navigation.knownSystems` save structure.
- Still Harbor has a restrained dark-crimson regional treatment and a lightweight handcrafted arrival scene.
- The station identity emphasizes maintained, mismatched construction and outward corridor traffic.
- Keith T. Maxwell, Gunant, and Tayaln are persistent named contacts using the existing NPC state and dialog structures.
- Keith's Bar uses the established cantina system and presents Keith as its primary contact.
- Crimson Helium and Veyrite use the existing dynamic-market, cargo, market-memory, and commodity-icon systems.
- Three Still Harbor contracts and one Pelagos-to-Still-Harbor provisioning contract use the existing contract system.
- Existing refueling, hull repair, outfitting, market, contract, and travel behavior provides Still Harbor's services; no new service subsystem or upgrade tier was added.
- Still Harbor's overview shows routine outbound traffic without tracking clues or revealing a farther system.

## Foundation correction

Initial rendering now occurs in `bootstrap.js` after all content modules have registered their systems and data. `market-memory.js` also safely declines to snapshot an unregistered location during startup.

This protects reloads when an existing save is docked at a later-added location. It does not redesign navigation or change saved-data format.

The base NPC overview renderer now supports more than one permanent contact at a port. Existing single-contact locations continue to use the same behavior.

## Technical verification completed

- JavaScript syntax check across every repository script
- Referenced-script and stylesheet presence check
- CSS brace and Git whitespace checks
- Full 43-script DOM startup smoke test
- Fresh-game startup at Haven
- Older-save startup at Pelagos
- Still Harbor discovery from Pelagos
- One-leg arrival at Still Harbor and return to Pelagos
- All three permanent contacts present
- Crimson Helium and Veyrite present in the dynamic market
- Still Harbor contract pool present
- Keith's Bar and Keith's primary-contact routing present
- Save/reload while docked at Still Harbor
- First Frontier visual identity restored after leaving the Crimson Expanse
- No console errors produced by the smoke test

## User verification still required

After deployment, verify through normal play on iPhone and iPad:

1. Load an existing save and confirm First Frontier play remains normal.
2. Reach Pelagos and chart the route from the cantina.
3. Travel to Still Harbor through the map.
4. Visit Station, Market, Contracts, Travel, Ship, and Cantina.
5. Meet Keith, Gunant, and Tayaln.
6. Buy or sell both gas commodities.
7. Accept and complete at least one Still Harbor contract.
8. Close and reopen the game while docked at Still Harbor.
9. Confirm text, controls, scrolling, map geometry, and dialog layout remain comfortable on iPhone and iPad.

## Deliberately deferred

- Information Convergence
- Any discoverable system beyond Still Harbor
- Additional Second Frontier topology
- Player gas mining or gas processing
- New upgrade tiers
- Factions, crew, property, industries, fleets, skill trees, and new simulation layers

## Next decision

Do not begin another mechanic immediately. Play Still Harbor and ask:

> What naturally made me curious about what was farther out?

Use that answer to shape the eventual Information Convergence batch.

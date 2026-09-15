# Haven's Reach

A calm, story-rich space operator game about ships, stories, trade, exploration, reputation, and opportunity.

## Current playable build

This repository contains a small vertical slice designed to test the core gameplay loop before expanding the galaxy.

Current build includes:

- 7 permanent handcrafted systems across the First and Second Frontiers
- Still Harbor, the first permanent destination in the Crimson Expanse
- Progressive one-leg-at-a-time route discovery and an operational travel map
- Dynamic port markets, 17 trade commodities, remembered prices, and limited specialty stock
- Rotating contract boards, deliveries, operator missions, and non-combat encounters
- Persistent named contacts, recurring conversations, and a small moving background population
- Temporary field discoveries alongside the permanent route network
- Multiple ship chassis, practical upgrades, repair, refueling, and cargo management
- Credits, fuel, hull, cargo, reputation, and upgrades
- Local browser saving with `localStorage`
- Phone-, tablet-, and desktop-responsive text-and-panel interface
- HTML, CSS, and vanilla JavaScript only

## Core loop

Dock → review opportunities → trade or accept work → travel → resolve encounters → arrive → get paid → improve ship/reputation → choose what to do next.

## Design constraint

This is intentionally not a graphics-heavy space simulator. Graphics and interface elements should communicate useful information. The imagination does the rest.

## Running locally

Open `index.html` in a browser. For normal development, serving the repository with a simple local web server is preferable.

## GitHub Pages

The project is a static website and is ready to be hosted with GitHub Pages. In the repository settings, enable Pages for the `main` branch/root if it is not already enabled.

## Current scope boundary

Still Harbor establishes the doorway into the Second Frontier. Information Convergence, the next outward system, player gas mining, refining, factions, crew, property, and larger simulation layers are deliberately not part of this batch. Play Still Harbor first and let curiosity about what lies farther out identify the next thin point.

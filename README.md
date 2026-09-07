# Haven's Reach

A calm, story-rich space operator game about ships, stories, trade, exploration, reputation, and opportunity.

## Prototype v0.1

This repository contains a small vertical slice designed to test the core gameplay loop before expanding the galaxy.

Current prototype includes:

- 3 handcrafted systems: Haven, Meridian Exchange, and Prospect Reach
- 1 starter utility transport
- 5 trade commodities with local pricing
- Contract board and deliveries
- Credits, fuel, hull, cargo, reputation, and upgrades
- Non-combat operator encounters
- Local browser saving with `localStorage`
- Phone-friendly text-and-panel interface
- HTML, CSS, and vanilla JavaScript only

## Core loop

Dock → review opportunities → trade or accept work → travel → resolve encounters → arrive → get paid → improve ship/reputation → choose what to do next.

## Design constraint

This is intentionally not a graphics-heavy space simulator. Graphics and interface elements should communicate useful information. The imagination does the rest.

## Running locally

Open `index.html` in a browser. For normal development, serving the repository with a simple local web server is preferable.

## GitHub Pages

The project is a static website and is ready to be hosted with GitHub Pages. In the repository settings, enable Pages for the `main` branch/root if it is not already enabled.

## Scope discipline

Do not expand immediately to the planned 12-system galaxy. First determine whether this 3-system loop is understandable, reliable, and fun enough to justify expansion.

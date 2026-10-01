# Haven's Reach — Graphical Proof Assets

## Wayfarer command deck
- Source: user-approved canonical Wayfarer command-deck image supplied in the Haven's Reach development conversation.
- Source SHA-256: `b01095a57329e6d908f963559d29fb4d4a427848487554c12d09c040278bce39`
- Production file: `assets/wayfarer-command-deck.webp`
- Production treatment: approved pixels preserved; WebP production compression; alpha opening added only for the forward viewport so the exterior can be managed independently.
- Production SHA-256 before repository transfer: `34ee0712fd27f3f5c195ea1f9603f0b22626b879be3a91804ca6452a416d9fbb`

## Haven viewport
- Source: viewport region extracted from the same approved canonical image for the first graphical proof.
- Production file: `assets/haven-viewport.webp`
- Production treatment: crop only, WebP production compression; no redraw or restyle.
- Production SHA-256 before repository transfer: `dbf4ed18cae22f6ce5bafcbd52cf2e65d276a5c828e8f9bfe1cbbf4e82f966e6`

## PixiJS
- Selected version: `8.21.0`
- Runtime path: `vendor/pixi.min.js`
- Official release: https://github.com/pixijs/pixijs/releases/tag/v8.21.0
- Production distribution identified by the official release: `pixi.js@8.21.0/dist/pixi.min.js`.
- License: MIT (PixiJS).
- Runtime is vendored locally; normal play must not depend on a CDN.

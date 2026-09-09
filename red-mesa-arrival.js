// Haven's Reach — Station Visual Identity #2 prototype
// One restrained visual-world layer for Red Mesa only. Pure presentation: no state,
// save data, mechanics, external art assets, or animation. If this makes arrival feel
// like returning to a place, the visual grammar can later be considered elsewhere.

function redMesaArrivalArt() {
  return `
    <svg class="red-mesa-scene" viewBox="0 0 900 220" role="img" aria-label="Red Mesa heavy-freight station silhouetted above a rust-colored mining world" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="mesaSky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#09121b" />
          <stop offset="0.58" stop-color="#16202a" />
          <stop offset="1" stop-color="#3a2119" />
        </linearGradient>
        <linearGradient id="mesaWorld" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#a85d35" />
          <stop offset="1" stop-color="#42241d" />
        </linearGradient>
      </defs>
      <rect width="900" height="220" fill="url(#mesaSky)" />
      <g class="mesa-stars" fill="#d9e5ec">
        <circle cx="72" cy="38" r="1.2"/><circle cx="164" cy="76" r="1"/><circle cx="244" cy="31" r="1.1"/>
        <circle cx="354" cy="64" r=".9"/><circle cx="442" cy="27" r="1.1"/><circle cx="548" cy="53" r="1"/>
        <circle cx="657" cy="25" r="1.2"/><circle cx="779" cy="67" r=".9"/><circle cx="847" cy="35" r="1.1"/>
      </g>
      <circle cx="735" cy="205" r="118" fill="url(#mesaWorld)" />
      <path d="M628 175c38-16 82-20 126-9 34 8 64 22 91 42" fill="none" stroke="#d0804c" stroke-width="2" opacity=".45" />
      <path d="M642 195c47-11 102-6 157 19" fill="none" stroke="#6d3928" stroke-width="8" opacity=".55" />

      <g class="mesa-station" fill="#0a1016" stroke="#b86f3e" stroke-width="2">
        <path d="M94 118h390l38 22-38 22H94l-38-22z" />
        <rect x="158" y="88" width="196" height="52" rx="3" />
        <path d="M192 88l20-34h88l25 34" />
        <path d="M116 162v25M458 162v25M140 187h294" />
        <path d="M354 104h95l35 18h-130z" />
        <rect x="205" y="105" width="34" height="15" class="mesa-lit" />
        <rect x="252" y="105" width="34" height="15" class="mesa-lit" />
        <path d="M92 119L52 88M486 120l48-31" />
        <circle cx="52" cy="88" r="5" class="mesa-beacon" />
        <circle cx="534" cy="89" r="5" class="mesa-beacon" />
      </g>

      <g class="mesa-loader" fill="#0a1016" stroke="#899097" stroke-width="2">
        <path d="M506 157h94v18h-94z" />
        <path d="M521 157v-24h18v24M567 157v-31h18v31" />
        <path d="M514 175l-13 19M591 175l13 19" />
      </g>
      <path d="M604 166h68" stroke="#b86f3e" stroke-width="2" stroke-dasharray="5 5" opacity=".7" />
    </svg>`;
}

function renderRedMesaArrival() {
  document.querySelectorAll(".station-arrival-visual").forEach(node => node.remove());
  if (state.location !== "redMesa") return;

  const hero = document.querySelector(".hero-panel");
  if (!hero) return;

  const scene = document.createElement("div");
  scene.className = "station-arrival-visual red-mesa-arrival-visual";
  scene.innerHTML = `
    ${redMesaArrivalArt()}
    <div class="arrival-visual-caption">
      <span class="arrival-visual-label">HEAVY-FREIGHT APPROACH</span>
      <span>Red Mesa Junction • Independent berth corridor</span>
    </div>`;
  hero.insertAdjacentElement("afterend", scene);
}

const renderBeforeRedMesaArrival = render;
render = function renderWithRedMesaArrival() {
  const result = renderBeforeRedMesaArrival();
  renderRedMesaArrival();
  return result;
};

renderRedMesaArrival();

// Haven's Reach — Station Visual Identity #3
// Extends the proven Red Mesa visual-arrival grammar to all six stations.
// Each scene is handcrafted to the station's character, but uses the same lightweight
// inline-SVG architecture: no external art assets, animation, mechanics, or save state.

const STATION_ARRIVAL_SCENES = {
  haven: {
    label: "OLD FREIGHT YARD APPROACH",
    caption: "Haven • Legacy mining and freight district",
    art: () => `
      <svg class="station-scene haven-scene" viewBox="0 0 900 220" role="img" aria-label="Haven's aging freight yards and mining structures" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="havenSky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#08111a"/><stop offset="1" stop-color="#272019"/></linearGradient>
          <linearGradient id="havenGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b97943"/><stop offset="1" stop-color="#4c3224"/></linearGradient>
        </defs>
        <rect width="900" height="220" fill="url(#havenSky)"/>
        <circle cx="760" cy="182" r="92" fill="#2a3033" opacity=".72"/>
        <path d="M0 176h900" stroke="#5f5144" stroke-width="2" opacity=".45"/>
        <g fill="#0a1015" stroke="#c88a4a" stroke-width="2">
          <rect x="104" y="112" width="294" height="54" rx="2"/>
          <path d="M142 112l34-44h94l31 44M181 68v-24M257 68v-31"/>
          <path d="M86 166h360M118 166v27M382 166v27"/>
          <path d="M430 128h92l25 38H430z"/>
          <path d="M520 166h74M555 166v28"/>
        </g>
        <g stroke="#6f8795" stroke-width="2" fill="none" opacity=".85"><path d="M594 194h158"/><path d="M626 194v-48h88v48"/><path d="M644 146v-28h52v28"/></g>
        <g fill="url(#havenGlow)" stroke="#d59a63"><rect x="188" y="128" width="38" height="13"/><rect x="239" y="128" width="38" height="13"/></g>
      </svg>`
  },
  meridian: {
    label: "EXCHANGE TRAFFIC LANE",
    caption: "Meridian • Commercial ring and brokerage district",
    art: () => `
      <svg class="station-scene meridian-scene" viewBox="0 0 900 220" role="img" aria-label="Meridian's organized commercial station and traffic lanes" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="meridianSky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#071318"/><stop offset="1" stop-color="#12302f"/></linearGradient></defs>
        <rect width="900" height="220" fill="url(#meridianSky)"/>
        <g fill="#d8edef" opacity=".55"><circle cx="86" cy="38" r="1"/><circle cx="190" cy="72" r="1"/><circle cx="356" cy="34" r="1"/><circle cx="706" cy="48" r="1"/><circle cx="818" cy="76" r="1"/></g>
        <g fill="none" stroke="#4faaa4" stroke-width="2"><circle cx="450" cy="110" r="70"/><circle cx="450" cy="110" r="38"/><path d="M380 110h140M450 40v140"/></g>
        <g fill="#0a1117" stroke="#b49a58" stroke-width="2"><rect x="412" y="82" width="76" height="56" rx="3"/><path d="M385 74h130l24 36-24 36H385l-24-36z"/></g>
        <g stroke="#4faaa4" stroke-width="2" fill="none" opacity=".7"><path d="M80 72c156 2 204 42 282 38"/><path d="M540 112c102-4 168-38 284-31"/><path d="M94 158c116-14 186-11 285-30"/></g>
        <g fill="#b49a58"><circle cx="142" cy="80" r="4"/><circle cx="256" cy="99" r="4"/><circle cx="650" cy="95" r="4"/><circle cx="754" cy="84" r="4"/></g>
      </svg>`
  },
  prospect: {
    label: "FRONTIER COLONY APPROACH",
    caption: "Prospect Reach • Expanding supply and salvage colony",
    art: () => `
      <svg class="station-scene prospect-scene" viewBox="0 0 900 220" role="img" aria-label="Prospect Reach's improvised frontier colony" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="prospectSky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#08151a"/><stop offset="1" stop-color="#1b302d"/></linearGradient></defs>
        <rect width="900" height="220" fill="url(#prospectSky)"/>
        <circle cx="118" cy="190" r="90" fill="#243334" opacity=".75"/>
        <g fill="#0a1116" stroke="#5ca8a4" stroke-width="2">
          <rect x="298" y="105" width="184" height="58" rx="2"/><rect x="498" y="122" width="102" height="41" rx="2"/><rect x="214" y="132" width="68" height="31" rx="2"/>
          <path d="M335 105l18-34h65l20 34M545 122v-35M566 122v-47"/>
          <path d="M214 163h386M251 163v27M552 163v27"/>
        </g>
        <g stroke="#c6a56b" stroke-width="2" fill="none"><path d="M183 164l39-58 31 26M603 162l55-42 38 23"/><path d="M668 120v-34"/></g>
        <g fill="#c6a56b"><circle cx="668" cy="84" r="4"/><rect x="332" y="123" width="28" height="11"/><rect x="369" y="123" width="28" height="11"/></g>
        <path d="M650 180h128" stroke="#5ca8a4" stroke-width="2" stroke-dasharray="7 6" opacity=".55"/>
      </svg>`
  },
  caldersDrift: {
    label: "BEACON CORRIDOR",
    caption: "Calder's Drift • Navigation cooperative waystation",
    art: () => `
      <svg class="station-scene calder-scene" viewBox="0 0 900 220" role="img" aria-label="Calder's Drift navigation beacon and isolated waystation" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="calderSky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#090d18"/><stop offset="1" stop-color="#232447"/></linearGradient></defs>
        <rect width="900" height="220" fill="url(#calderSky)"/>
        <g fill="#eef0ff" opacity=".7"><circle cx="86" cy="41" r="1"/><circle cx="206" cy="66" r="1"/><circle cx="344" cy="30" r="1"/><circle cx="622" cy="38" r="1"/><circle cx="808" cy="64" r="1"/></g>
        <g fill="#0a1018" stroke="#7577b8" stroke-width="2"><rect x="338" y="120" width="222" height="42" rx="2"/><path d="M378 120l28-24h87l27 24"/></g>
        <g fill="none" stroke="#d29a4d" stroke-width="2"><path d="M450 112V48"/><circle cx="450" cy="46" r="5" fill="#d29a4d"/><path d="M418 66c16-16 48-16 64 0M397 83c28-30 78-30 106 0"/></g>
        <g stroke="#7577b8" stroke-width="2" fill="none" opacity=".65"><path d="M80 178c176-37 326-28 510-5"/><path d="M590 173c81 10 152 9 230-8"/></g>
        <path d="M338 162h222" stroke="#d29a4d" stroke-width="3" opacity=".55"/>
      </svg>`
  },
  redMesa: {
    label: "HEAVY-FREIGHT APPROACH",
    caption: "Red Mesa Junction • Independent berth corridor",
    art: () => `
      <svg class="station-scene red-mesa-scene" viewBox="0 0 900 220" role="img" aria-label="Red Mesa heavy-freight station silhouetted above a rust-colored mining world" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="mesaSky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#09121b"/><stop offset="0.58" stop-color="#16202a"/><stop offset="1" stop-color="#3a2119"/></linearGradient>
          <linearGradient id="mesaWorld" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a85d35"/><stop offset="1" stop-color="#42241d"/></linearGradient>
        </defs>
        <rect width="900" height="220" fill="url(#mesaSky)"/>
        <g fill="#d9e5ec" opacity=".65"><circle cx="72" cy="38" r="1.2"/><circle cx="164" cy="76" r="1"/><circle cx="244" cy="31" r="1.1"/><circle cx="548" cy="53" r="1"/><circle cx="779" cy="67" r=".9"/></g>
        <circle cx="735" cy="205" r="118" fill="url(#mesaWorld)"/>
        <path d="M628 175c38-16 82-20 126-9 34 8 64 22 91 42" fill="none" stroke="#d0804c" stroke-width="2" opacity=".45"/>
        <g fill="#0a1016" stroke="#b86f3e" stroke-width="2"><path d="M94 118h390l38 22-38 22H94l-38-22z"/><rect x="158" y="88" width="196" height="52" rx="3"/><path d="M192 88l20-34h88l25 34"/><path d="M116 162v25M458 162v25M140 187h294"/><rect x="205" y="105" width="34" height="15" fill="#d68a54"/><rect x="252" y="105" width="34" height="15" fill="#d68a54"/></g>
        <g fill="#0a1016" stroke="#899097" stroke-width="2"><path d="M506 157h94v18h-94z"/><path d="M521 157v-24h18v24M567 157v-31h18v31"/></g>
      </svg>`
  },
  pelagos: {
    label: "DEEP-SURVEY ANCHORAGE",
    caption: "Pelagos • Elyri research and survey perimeter",
    art: () => `
      <svg class="station-scene pelagos-scene" viewBox="0 0 900 220" role="img" aria-label="Pelagos deep-survey anchorage in sparse remote space" preserveAspectRatio="xMidYMid slice">
        <defs><linearGradient id="pelagosSky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#090d18"/><stop offset="1" stop-color="#211c3c"/></linearGradient></defs>
        <rect width="900" height="220" fill="url(#pelagosSky)"/>
        <g fill="#e6f8ff" opacity=".68"><circle cx="76" cy="35" r="1"/><circle cx="205" cy="68" r="1"/><circle cx="360" cy="39" r="1"/><circle cx="650" cy="31" r="1"/><circle cx="812" cy="74" r="1"/></g>
        <circle cx="730" cy="156" r="42" fill="none" stroke="#8dd8de" stroke-width="1.5" opacity=".5"/>
        <circle cx="730" cy="156" r="72" fill="none" stroke="#8f78c8" stroke-width="1" opacity=".35" stroke-dasharray="5 7"/>
        <g fill="#0a1018" stroke="#8f78c8" stroke-width="2"><path d="M286 132h220l26 18-26 18H286l-26-18z"/><path d="M350 132l22-34h49l22 34"/></g>
        <g stroke="#8dd8de" stroke-width="2" fill="none"><path d="M396 98V60"/><circle cx="396" cy="56" r="4" fill="#8dd8de"/><path d="M330 168v21M462 168v21"/><path d="M535 151c60-7 104-4 158 4" stroke-dasharray="4 6"/></g>
        <g stroke="#8f78c8" stroke-width="1.5" fill="none" opacity=".55"><path d="M104 181c122-22 244-20 375-3"/><path d="M541 177c82 11 158 8 247-9"/></g>
      </svg>`
  }
};

function renderStationArrivalVisual() {
  document.querySelectorAll(".station-arrival-visual").forEach(node => node.remove());
  const sceneData = STATION_ARRIVAL_SCENES[state.location];
  if (!sceneData) return;
  const hero = document.querySelector(".hero-panel");
  if (!hero) return;

  const scene = document.createElement("div");
  scene.className = `station-arrival-visual station-arrival-${state.location}`;
  scene.innerHTML = `
    ${sceneData.art()}
    <div class="arrival-visual-caption">
      <span class="arrival-visual-label">${escapeHtml(sceneData.label)}</span>
      <span>${escapeHtml(sceneData.caption)}</span>
    </div>`;
  hero.insertAdjacentElement("afterend", scene);
}

const renderBeforeStationArrivalVisuals = render;
render = function renderWithStationArrivalVisuals() {
  const result = renderBeforeStationArrivalVisuals();
  renderStationArrivalVisual();
  return result;
};

renderStationArrivalVisual();

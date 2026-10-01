(() => {
  'use strict';
  const DESIGN_W = 1536, DESIGN_H = 1024;
  const VIEWPORT_CROP = { x: 160, y: 72, w: 1230, h: 463 };
  const VIEWPORT_POLY = [174,82, 1350,82, 1380,522, 170,522];
  let app=null, host=null, unsubscribe=null, engineeringLamp=null, engineeringHotspot=null, elapsed=0;
  const hotspots=[
    {id:'operations',label:'Operations / Cargo',x:248,y:520,w:210,h:190},
    {id:'navigation',label:'Navigation / Helm',x:520,y:520,w:460,h:245},
    {id:'communications',label:'Communications',x:1020,y:520,w:250,h:190},
    {id:'engineering',label:'Engineering',x:1050,y:710,w:235,h:165}
  ];
  function announce(text){ document.getElementById('interaction-label').textContent=text; }
  function request(id){ window.dispatchEvent(new CustomEvent('hr:console',{detail:{id}})); }
  function makeHotspot(def){
    const g=new PIXI.Graphics();
    g.rect(def.x,def.y,def.w,def.h).fill({color:0xffffff,alpha:0.001});
    g.eventMode='static'; g.cursor='pointer';
    g.on('pointerover',()=>announce(def.label)); g.on('pointerout',()=>announce(''));
    g.on('pointertap',()=>request(def.id));
    if(def.id==='engineering') engineeringHotspot=g;
    return g;
  }
  function updateCondition(state){
    if(!engineeringLamp) return;
    const damaged=state.ship.hull<state.ship.hullMax;
    engineeringLamp.clear();
    engineeringLamp.circle(1208,728,7).fill({color:damaged?0xff9d2e:0x62d6c7,alpha:.92});
    engineeringLamp.circle(1208,728,13).stroke({color:damaged?0xff9d2e:0x62d6c7,alpha:.28,width:2});
    if(engineeringHotspot) engineeringHotspot.accessibleTitle=damaged?'Engineering — hull service needed':'Engineering — hull nominal';
  }
  async function mount(target){
    if(app) await destroy();
    host=target; app=new PIXI.Application();
    await app.init({width:DESIGN_W,height:DESIGN_H,background:'#070b12',antialias:true,autoDensity:true,resolution:Math.min(window.devicePixelRatio||1,2)});
    app.canvas.setAttribute('aria-hidden','true'); host.replaceChildren(app.canvas);
    const [deckTexture,havenTexture]=await Promise.all([PIXI.Assets.load('assets/wayfarer-command-deck.webp'),PIXI.Assets.load('assets/haven-viewport.webp')]);
    const haven=new PIXI.Sprite(havenTexture); haven.position.set(VIEWPORT_CROP.x,VIEWPORT_CROP.y); haven.width=VIEWPORT_CROP.w; haven.height=VIEWPORT_CROP.h;
    const viewportMask=new PIXI.Graphics(); viewportMask.poly(VIEWPORT_POLY).fill(0xffffff); haven.mask=viewportMask; app.stage.addChild(haven,viewportMask);
    const deck=new PIXI.Sprite(deckTexture); deck.width=DESIGN_W; deck.height=DESIGN_H; app.stage.addChild(deck);
    engineeringLamp=new PIXI.Graphics(); app.stage.addChild(engineeringLamp);
    hotspots.forEach((def)=>app.stage.addChild(makeHotspot(def)));
    updateCondition(window.HRState.get()); unsubscribe=window.HRState.subscribe(updateCondition);
    app.ticker.add((ticker)=>{
      const state=window.HRState.get();
      if(state.ship.hull>=state.ship.hullMax||matchMedia('(prefers-reduced-motion: reduce)').matches){ if(engineeringLamp) engineeringLamp.alpha=1; return; }
      elapsed+=ticker.deltaMS; if(engineeringLamp) engineeringLamp.alpha=.82+Math.sin(elapsed/720)*.12;
    });
  }
  async function destroy(){
    if(unsubscribe) unsubscribe(); unsubscribe=null; engineeringLamp=null; engineeringHotspot=null; elapsed=0;
    if(app){ app.destroy(true,{children:true}); app=null; }
    if(host) host.replaceChildren();
  }
  window.WayfarerScene={mount,destroy};
})();
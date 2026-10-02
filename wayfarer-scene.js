(() => {
  'use strict';
  const DESIGN_W = 1536, DESIGN_H = 1024;
  const VIEWPORT_CROP = { x: 160, y: 72, w: 1230, h: 463 };
  const VIEWPORT_POLY = [174,82, 1350,82, 1380,522, 170,522];
  const VIEWPORT_ASSETS = { haven:'assets/haven-viewport.webp', meridian:'assets/meridian-viewport.webp' };
  let app=null, host=null, unsubscribe=null, engineeringLamp=null, engineeringHotspot=null, viewportSprite=null, elapsed=0, cueElapsed=0, cueLayer=null;
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
  function addDiscoveryCues(){
    cueLayer=new PIXI.Container();
    hotspots.forEach((def,index)=>{
      const cx=def.x+def.w/2, cy=def.y+def.h/2;
      const glow=new PIXI.Graphics();
      glow.ellipse(cx,cy,def.w*.62,def.h*.58).fill({color:0xf2a84a,alpha:.12});
      glow.ellipse(cx,cy,def.w*.50,def.h*.46).fill({color:0x78cfe0,alpha:.08});
      glow.roundRect(def.x-8,def.y-8,def.w+16,def.h+16,18).stroke({color:0xf3b45e,alpha:.62,width:4});
      glow.alpha=0; glow._cueDelay=index*180; cueLayer.addChild(glow);
    });
    app.stage.addChild(cueLayer);
  }
  function updateCondition(state){
    if(!engineeringLamp) return;
    const damaged=state.ship.hull<state.ship.hullMax;
    engineeringLamp.clear();
    engineeringLamp.circle(1208,728,7).fill({color:damaged?0xff9d2e:0x62d6c7,alpha:.92});
    engineeringLamp.circle(1208,728,13).stroke({color:damaged?0xff9d2e:0x62d6c7,alpha:.28,width:2});
    if(engineeringHotspot) engineeringHotspot.accessibleTitle=damaged?'Engineering — hull service needed':'Engineering — hull nominal';
  }
  async function updateViewport(state){
    if(!viewportSprite) return;
    const asset=VIEWPORT_ASSETS[state.location]||VIEWPORT_ASSETS.haven;
    viewportSprite.texture=await PIXI.Assets.load(asset);
  }
  async function mount(target){
    if(app) await destroy();
    host=target; app=new PIXI.Application();
    await app.init({width:DESIGN_W,height:DESIGN_H,background:'#070b12',antialias:true,autoDensity:true,resolution:Math.min(window.devicePixelRatio||1,2)});
    app.canvas.setAttribute('aria-hidden','true'); host.replaceChildren(app.canvas);
    const state=window.HRState.get();
    const [deckTexture,viewportTexture]=await Promise.all([PIXI.Assets.load('assets/wayfarer-command-deck.webp'),PIXI.Assets.load(VIEWPORT_ASSETS[state.location]||VIEWPORT_ASSETS.haven)]);
    viewportSprite=new PIXI.Sprite(viewportTexture); viewportSprite.position.set(VIEWPORT_CROP.x,VIEWPORT_CROP.y); viewportSprite.width=VIEWPORT_CROP.w; viewportSprite.height=VIEWPORT_CROP.h;
    const viewportMask=new PIXI.Graphics(); viewportMask.poly(VIEWPORT_POLY).fill(0xffffff); viewportSprite.mask=viewportMask; app.stage.addChild(viewportSprite,viewportMask);
    const deck=new PIXI.Sprite(deckTexture); deck.width=DESIGN_W; deck.height=DESIGN_H; app.stage.addChild(deck);
    engineeringLamp=new PIXI.Graphics(); app.stage.addChild(engineeringLamp);
    hotspots.forEach((def)=>app.stage.addChild(makeHotspot(def)));
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches) addDiscoveryCues();
    updateCondition(state);
    unsubscribe=window.HRState.subscribe((next)=>{ updateCondition(next); updateViewport(next); });
    app.ticker.add((ticker)=>{
      const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(cueLayer){
        cueElapsed+=ticker.deltaMS;
        const fadeIn=650, hold=2600, fadeOut=2200, total=fadeIn+hold+fadeOut+540;
        cueLayer.children.forEach((cue)=>{
          const t=Math.max(0,cueElapsed-cue._cueDelay);
          if(t<fadeIn) cue.alpha=t/fadeIn;
          else if(t<fadeIn+hold) cue.alpha=.92+Math.sin(t/520)*.08;
          else cue.alpha=Math.max(0,1-(t-fadeIn-hold)/fadeOut);
        });
        if(cueElapsed>=total){ cueLayer.destroy({children:true}); cueLayer=null; }
      }
      const current=window.HRState.get();
      if(current.ship.hull>=current.ship.hullMax||reduced){ if(engineeringLamp) engineeringLamp.alpha=1; return; }
      elapsed+=ticker.deltaMS; if(engineeringLamp) engineeringLamp.alpha=.82+Math.sin(elapsed/720)*.12;
    });
  }
  async function destroy(){
    if(unsubscribe) unsubscribe(); unsubscribe=null; engineeringLamp=null; engineeringHotspot=null; viewportSprite=null; cueLayer=null; elapsed=0; cueElapsed=0;
    if(app){ app.destroy(true,{children:true}); app=null; }
    if(host) host.replaceChildren();
  }
  window.WayfarerScene={mount,destroy};
})();
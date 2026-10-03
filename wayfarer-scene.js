(() => {
  'use strict';
  const DESIGN_W = 1536, DESIGN_H = 1024;
  const VIEWPORT_CROP = { x: 160, y: 72, w: 1230, h: 463 };
  const VIEWPORT_POLY = [174,82, 1350,82, 1380,522, 170,522];
  const VIEWPORT_ASSETS = {
    haven:{stationary:'assets/haven-viewport.webp',docked:'assets/haven-docked-viewport.webp'},
    meridian:{stationary:'assets/meridian-viewport.webp',docked:'assets/meridian-docked-viewport.webp'}
  };
  let app=null, host=null, unsubscribe=null, engineeringLamp=null, engineeringHotspot=null, viewportSprite=null, elapsed=0, cueElapsed=0, cueLayer=null, travelLayer=null, travelResolve=null;
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
    const family=VIEWPORT_ASSETS[state.location]||VIEWPORT_ASSETS.haven, asset=family[state.condition]||family.stationary;
    viewportSprite.texture=await PIXI.Assets.load(asset);
  }
  async function mount(target){
    if(app) await destroy();
    host=target; app=new PIXI.Application();
    await app.init({width:DESIGN_W,height:DESIGN_H,background:'#070b12',antialias:true,autoDensity:true,resolution:Math.min(window.devicePixelRatio||1,2)});
    app.canvas.setAttribute('aria-hidden','true'); host.replaceChildren(app.canvas);
    const state=window.HRState.get();
    const [deckTexture,viewportTexture]=await Promise.all([PIXI.Assets.load('assets/wayfarer-command-deck.webp'),PIXI.Assets.load((VIEWPORT_ASSETS[state.location]||VIEWPORT_ASSETS.haven)[state.condition]||(VIEWPORT_ASSETS[state.location]||VIEWPORT_ASSETS.haven).stationary)]);
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
  function showTravel(origin,destination){
    return new Promise((resolve)=>{
      if(!app){ resolve(); return; }
      if(travelLayer) travelLayer.destroy({children:true});
      travelResolve=resolve;
      travelLayer=new PIXI.Container();
      const bg=new PIXI.Graphics(); bg.rect(0,0,DESIGN_W,DESIGN_H).fill({color:0x07101a,alpha:.98});
      const title=new PIXI.Text({text:'ESTABLISHED ROUTE',style:{fontFamily:'Arial, sans-serif',fontSize:28,fill:0xefb25d,letterSpacing:4}});
      title.position.set(110,105);
      const originName=origin==='haven'?'HAVEN':'MERIDIAN EXCHANGE', destinationName=destination==='haven'?'HAVEN':'MERIDIAN EXCHANGE';
      const from=new PIXI.Text({text:originName,style:{fontFamily:'Arial, sans-serif',fontSize:24,fill:0xd8e7e9}}); from.position.set(150,690);
      const to=new PIXI.Text({text:destinationName,style:{fontFamily:'Arial, sans-serif',fontSize:24,fill:0xd8e7e9}}); to.anchor.set(1,0); to.position.set(1386,690);
      const route=new PIXI.Graphics(); route.moveTo(230,535).lineTo(1306,535).stroke({color:0x5aa9b7,width:5,alpha:.75});
      route.circle(230,535,13).fill(0x78cfe0); route.circle(1306,535,13).fill(0x78cfe0);
      const ship=new PIXI.Graphics(); ship.moveTo(0,-16).lineTo(32,0).lineTo(0,16).lineTo(8,0).closePath().fill(0xefb25d); ship.position.set(230,535);
      const status=new PIXI.Text({text:'WAYFARER  •  IN TRANSIT',style:{fontFamily:'Arial, sans-serif',fontSize:20,fill:0x9fcbd2,letterSpacing:2}}); status.anchor.set(.5,0); status.position.set(DESIGN_W/2,790);
      travelLayer.addChild(bg,title,route,from,to,ship,status); app.stage.addChild(travelLayer);
      const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches, duration=reduced?1200:4200, start=performance.now();
      function frame(now){
        if(!travelLayer){ resolve(); return; }
        const t=Math.min(1,(now-start)/duration), eased=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
        ship.x=230+(1306-230)*eased;
        if(t<1) requestAnimationFrame(frame);
        else { const done=travelResolve; travelResolve=null; travelLayer.destroy({children:true}); travelLayer=null; if(done) done(); }
      }
      requestAnimationFrame(frame);
    });
  }
  function showDocking(mode,location){
    return new Promise((resolve)=>{
      if(!app){resolve();return;}
      const layer=new PIXI.Container(), reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      const veil=new PIXI.Graphics(); veil.rect(0,0,DESIGN_W,DESIGN_H).fill({color:0x050a0f,alpha:.72});
      const guide=new PIXI.Graphics();
      guide.moveTo(360,250).lineTo(650,512).lineTo(360,774).stroke({color:0x78cfe0,width:3,alpha:.6});
      guide.moveTo(1176,250).lineTo(886,512).lineTo(1176,774).stroke({color:0x78cfe0,width:3,alpha:.6});
      const label=mode==='dock'?'DOCKING APPROACH':'UNDOCKING';
      const place=location==='haven'?'HAVEN':'MERIDIAN EXCHANGE';
      const title=new PIXI.Text({text:label,style:{fontFamily:'Arial, sans-serif',fontSize:30,fill:0xefb25d,letterSpacing:4}});
      title.anchor.set(.5); title.position.set(DESIGN_W/2,430);
      const sub=new PIXI.Text({text:place+'  •  WAYFARER',style:{fontFamily:'Arial, sans-serif',fontSize:20,fill:0xb9dce1,letterSpacing:2}});
      sub.anchor.set(.5); sub.position.set(DESIGN_W/2,485);
      layer.addChild(veil,guide,title,sub); app.stage.addChild(layer);
      const duration=reduced?700:2200,start=performance.now();
      function frame(now){
        const t=Math.min(1,(now-start)/duration);
        guide.alpha=.45+.35*Math.sin(t*Math.PI);
        layer.alpha=t<.15?t/.15:t>.82?(1-t)/.18:1;
        if(t<1) requestAnimationFrame(frame); else {layer.destroy({children:true});resolve();}
      }
      requestAnimationFrame(frame);
    });
  }
  function showStationTransition(label){
    return new Promise((resolve)=>{
      if(!app){resolve();return;}
      const layer=new PIXI.Container(), reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      const veil=new PIXI.Graphics(); veil.rect(0,0,DESIGN_W,DESIGN_H).fill({color:0x05090d,alpha:.92});
      const text=new PIXI.Text({text:label,style:{fontFamily:'Arial, sans-serif',fontSize:28,fill:0xefb25d,letterSpacing:4}});
      text.anchor.set(.5); text.position.set(DESIGN_W/2,DESIGN_H/2);
      layer.addChild(veil,text); app.stage.addChild(layer);
      const duration=reduced?350:900,start=performance.now();
      function frame(now){const t=Math.min(1,(now-start)/duration);layer.alpha=t<.35?t/.35:1-(t-.35)/.65;if(t<1)requestAnimationFrame(frame);else{layer.destroy({children:true});resolve();}}
      requestAnimationFrame(frame);
    });
  }
  async function destroy(){
    if(unsubscribe) unsubscribe(); unsubscribe=null; if(travelResolve){travelResolve();travelResolve=null;} if(travelLayer){travelLayer.destroy({children:true});travelLayer=null;} engineeringLamp=null; engineeringHotspot=null; viewportSprite=null; cueLayer=null; elapsed=0; cueElapsed=0;
    if(app){ app.destroy(true,{children:true}); app=null; }
    if(host) host.replaceChildren();
  }
  window.WayfarerScene={mount,destroy,showTravel,showDocking,showStationTransition};
})();
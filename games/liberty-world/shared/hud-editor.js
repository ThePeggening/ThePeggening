const KEY='pcock.hud.layouts.v1';
const TARGETS=Object.freeze([
  ['brand','BRAND / WORLD NAME','.pc-brandbar'],
  ['status','FEATHERS / LEVEL','.pc-hud-top'],
  ['mission','MISSION / OBJECTIVE','.pc-mission'],
  ['compass','MINIMAP / COMPASS','.pc-compass'],
  ['stick','MOVE STICK','.pc-stick'],
  ['actions','ACTION BUTTONS','.pc-abilities'],
  ['toolbar','JOURNAL / GUIDE / WALLET / MAP / PHOTO / PAUSE','.v-toolbar'],
  ['prompt','INTERACT PROMPT','.pc-world-bubble'],
  ['edge','OBJECTIVE EDGE ARROW','.v-edge'],
  ['signal','SIGNAL MESSAGE','.v-signal'],
  ['toast','NOTIFICATION','.v-toast'],
  ['flight','FLIGHT RETURN','.v-flight-return'],
  ['return','BACK TO ATROPA / WEBSITE','#atropa-liberty-return,#liberty-website-return']
]);
const DEFAULT_LAYOUTS=Object.freeze({
  'mobile-landscape':Object.freeze({
    brand:{x:0,y:0,s:1},status:{x:38,y:2,s:.71},mission:{x:-54,y:-46,s:.54},
    compass:{x:31,y:28,s:.75},stick:{x:0,y:0,s:1},actions:{x:-4,y:-13,s:1.29},
    toolbar:{x:80,y:-2,s:.69},prompt:{x:193,y:-50,s:.85},edge:{x:10,y:-3,s:.77},
    signal:{x:-22,y:65,s:.75},toast:{x:-43,y:-80,s:.59},flight:{x:-191,y:-162,s:.81},return:{x:0,y:0,s:.72}
  }),
  'mobile-portrait':Object.freeze({
    brand:{x:0,y:0,s:1},status:{x:40,y:-2,s:.65},mission:{x:-51,y:-7,s:.54},
    compass:{x:-271,y:-274,s:.81},stick:{x:-14,y:15,s:.93},actions:{x:-6,y:59,s:1.29},
    toolbar:{x:-3,y:3,s:.79},prompt:{x:62,y:-107,s:.84},edge:{x:158,y:-329,s:.85},
    signal:{x:-32,y:-506,s:.79},toast:{x:97,y:-151,s:.48},flight:{x:-30,y:11,s:.68},return:{x:0,y:0,s:.68}
  }),
  'pc-landscape':Object.freeze({}),
  'pc-portrait':Object.freeze({})
});
function defaultsFor(profile){const x=DEFAULT_LAYOUTS[profile]||{};return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,{...v}]));}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function read(){
  try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{};}catch{return {};}
}
function write(data){try{localStorage.setItem(KEY,JSON.stringify(data));}catch{}}
function actualDevice(){return (navigator.maxTouchPoints||0)>0||matchMedia?.('(pointer: coarse)').matches?'mobile':'pc';}
function actualOrientation(){try{if(matchMedia?.('(orientation: landscape)').matches)return 'landscape';if(matchMedia?.('(orientation: portrait)').matches)return 'portrait';}catch{}const t=screen.orientation?.type||'';if(t.startsWith('landscape'))return 'landscape';if(t.startsWith('portrait'))return 'portrait';return innerWidth>=innerHeight?'landscape':'portrait';}
function keyOf(device,orientation){return device+'-'+orientation;}
function copyText(text){
  const fallback=()=>{const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.left='-9999px';ta.style.opacity='0';document.body.append(ta);ta.select();try{document.execCommand('copy');}catch{}ta.remove();};
  if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text).catch(()=>fallback());
  fallback();return Promise.resolve();
}
export function createHudEditor(root){
  let layouts=read(),editing=false,selected=null,onDone=null,overlay=null,bar=null,frames=new Map(),raf=0,previewState=null,previewStyle=null;
  const getProfile=(profile)=>layouts[profile]&&typeof layouts[profile]==='object'?{...defaultsFor(profile),...layouts[profile]}:defaultsFor(profile);
  function target(id){const spec=TARGETS.find(x=>x[0]===id);return spec?root.querySelector(spec[2]):null;}
  function clearTransforms(){
    for(const [id] of TARGETS){const el=target(id);if(!el)continue;el.style.translate='';el.style.scale='';el.style.transformOrigin='';}
  }
  function apply(profile=keyOf(actualDevice(),actualOrientation())){
    clearTransforms();const data=getProfile(profile);
    for(const [id] of TARGETS){const el=target(id),v=data[id];if(!el||!v)continue;el.style.transformOrigin='center center';el.style.translate=`${Number(v.x)||0}px ${Number(v.y)||0}px`;el.style.scale=String(Number(v.s)||1);}
  }
  function saveItem(id,v){const profile=selected;if(!profile)return;const next={...getProfile(profile),[id]:{x:Math.round(v.x),y:Math.round(v.y),s:Math.round(v.s*100)/100}};layouts={...layouts,[profile]:next};write(layouts);}
  function style(el,obj){Object.assign(el.style,obj);return el;}
  function toast(msg){
    let n=document.getElementById('pcock-hud-edit-toast');if(!n){n=document.createElement('div');n.id='pcock-hud-edit-toast';style(n,{position:'fixed',left:'50%',bottom:'76px',translate:'-50% 0',zIndex:'2147483647',padding:'10px 14px',borderRadius:'10px',background:'rgba(8,12,24,.96)',border:'1px solid rgba(255,215,80,.75)',color:'#fff6cf',font:'800 11px Arial,sans-serif',pointerEvents:'none'});document.body.append(n);}n.textContent=msg;n.hidden=false;clearTimeout(n._t);n._t=setTimeout(()=>n.hidden=true,1800);
  }
  function rebuildFrames(){
    if(!editing||!overlay)return;
    const present=new Set();
    for(const [id,label] of TARGETS){
      const el=target(id);if(!el||getComputedStyle(el).display==='none')continue;const visibleRect=el.getBoundingClientRect();if(visibleRect.width<1||visibleRect.height<1)continue;
      present.add(id);let frame=frames.get(id);
      if(!frame){
        frame=document.createElement('div');frame.dataset.hudFrame=id;
        style(frame,{position:'fixed',zIndex:'2147483644',border:'2px dashed #5ce8ff',borderRadius:'8px',pointerEvents:'auto',touchAction:'none',boxShadow:'0 0 0 1px rgba(0,0,0,.75),0 0 18px rgba(92,232,255,.25)'});
        const tag=document.createElement('div');tag.textContent=label;style(tag,{position:'absolute',left:'-2px',top:'-22px',padding:'3px 6px',borderRadius:'5px',background:'rgba(3,10,18,.94)',color:'#9ff4ff',font:'800 9px Arial,sans-serif',whiteSpace:'nowrap',pointerEvents:'none'});
        const handle=document.createElement('div');handle.dataset.resize='1';style(handle,{position:'absolute',width:'22px',height:'22px',right:'-12px',bottom:'-12px',borderRadius:'50%',background:'#34d9ef',border:'3px solid white',boxShadow:'0 2px 8px rgba(0,0,0,.6)',cursor:'nwse-resize',touchAction:'none'});
        frame.append(tag,handle);overlay.append(frame);frames.set(id,frame);
        let drag=null;
        frame.addEventListener('pointerdown',e=>{
          e.preventDefault();e.stopPropagation();const item=getProfile(selected)[id]||{x:0,y:0,s:1};
          drag={pid:e.pointerId,mode:e.target?.dataset?.resize?'scale':'move',x:e.clientX,y:e.clientY,start:{x:Number(item.x)||0,y:Number(item.y)||0,s:Number(item.s)||1},rect:el.getBoundingClientRect()};
          try{frame.setPointerCapture(e.pointerId);}catch{}
        });
        frame.addEventListener('pointermove',e=>{
          if(!drag||drag.pid!==e.pointerId)return;e.preventDefault();e.stopPropagation();
          const dx=e.clientX-drag.x,dy=e.clientY-drag.y;let next;
          if(drag.mode==='scale'){next={x:drag.start.x,y:drag.start.y,s:clamp(drag.start.s+(dx+dy)/280,.35,2.5)};}
          else next={x:drag.start.x+dx,y:drag.start.y+dy,s:drag.start.s};
          saveItem(id,next);apply(selected);positionFrames();
        });
        const end=e=>{if(drag&&drag.pid===e.pointerId)drag=null;};
        frame.addEventListener('pointerup',end);frame.addEventListener('pointercancel',end);
      }
    }
    for(const [id,frame] of [...frames])if(!present.has(id)){frame.remove();frames.delete(id);}
    positionFrames();
  }
  function positionFrames(){
    if(!editing)return;
    for(const [id,frame] of frames){const el=target(id);if(!el)continue;const r=el.getBoundingClientRect();style(frame,{left:Math.round(r.left)+'px',top:Math.round(r.top)+'px',width:Math.max(18,Math.round(r.width))+'px',height:Math.max(18,Math.round(r.height))+'px'});}
  }
  function loop(){if(!editing)return;rebuildFrames();raf=requestAnimationFrame(loop);}
  async function copy(){
    const data=getProfile(selected),items={};
    for(const [id,label] of TARGETS){const el=target(id),v=data[id]||{x:0,y:0,s:1};if(!el){items[id]={label,present:false,offset:v};continue;}const r=el.getBoundingClientRect();items[id]={label,present:true,offset:{x:Number(v.x)||0,y:Number(v.y)||0,scale:Number(v.s)||1},rect:{left:Math.round(r.left),top:Math.round(r.top),width:Math.round(r.width),height:Math.round(r.height)}};}
    const [device,orientation]=selected.split('-');
    const payload={type:'PCOCK_LIBERTY_HUD_LAYOUT_V1',profile:selected,device,orientation,actual:{device:actualDevice(),orientation:actualOrientation()},viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio||1},items};
    await copyText(JSON.stringify(payload,null,2));toast('COPIED '+selected.toUpperCase()+' HUD LAYOUT');
    return payload;
  }
  function stop(reopen=true){
    if(!editing)return;editing=false;cancelAnimationFrame(raf);raf=0;overlay?.remove();overlay=null;bar=null;frames.clear();previewStyle?.remove();previewStyle=null;if(previewState){for(const x of previewState){if(x.el)x.el.hidden=x.hidden;}previewState=null;}root.classList.remove('pc-hud-editing','pc-hud-edit-mobile','pc-hud-edit-pc');const cb=onDone;onDone=null;selected=null;apply();if(reopen)cb?.();
  }
  function start(device,orientation,done){
    stop(false);selected=keyOf(device,orientation);onDone=done;editing=true;previewState=[];const reveal=[root.querySelector('.pc-hud'),...TARGETS.map(([id])=>target(id))];for(const el of [...new Set(reveal.filter(Boolean))]){previewState.push({el,hidden:el.hidden});el.hidden=false;}root.classList.add('pc-hud-editing',device==='mobile'?'pc-hud-edit-mobile':'pc-hud-edit-pc');previewStyle=document.createElement('style');previewStyle.textContent='.pc-root.pc-hud-editing [data-bubble],.pc-root.pc-hud-editing .v-edge,.pc-root.pc-hud-editing .v-signal,.pc-root.pc-hud-editing .v-toast,.pc-root.pc-hud-editing .v-flight-return{display:block!important;visibility:visible!important;opacity:.92!important}.pc-root.pc-hud-edit-mobile .pc-controls{display:flex!important}.pc-root.pc-hud-edit-pc .pc-controls{display:none!important}.pc-root.pc-hud-editing [data-bubble]{transform:none!important;left:50%!important;top:auto!important;bottom:18%!important}.pc-root.pc-hud-editing .v-edge{left:12px!important;top:48%!important}.pc-root.pc-hud-editing .v-toast{top:34%!important}';document.head.append(previewStyle);apply(selected);
    overlay=document.createElement('div');overlay.id='pcock-hud-editor';style(overlay,{position:'fixed',inset:'0',zIndex:'2147483643',pointerEvents:'none'});
    bar=document.createElement('div');style(bar,{position:'fixed',top:'max(8px,env(safe-area-inset-top))',left:'50%',translate:'-50% 0',zIndex:'2147483646',display:'flex',gap:'7px',alignItems:'center',maxWidth:'calc(100vw - 16px)',padding:'8px',borderRadius:'12px',background:'rgba(4,9,18,.95)',border:'1px solid rgba(92,232,255,.65)',boxShadow:'0 8px 28px rgba(0,0,0,.55)',pointerEvents:'auto',font:'800 10px Arial,sans-serif'});
    const title=document.createElement('span');title.textContent='✥ HUD RESIZE · '+device.toUpperCase()+' · '+orientation.toUpperCase();style(title,{color:'#b9f7ff',whiteSpace:'nowrap'});
    const mk=(txt,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=txt;style(b,{minHeight:'34px',padding:'6px 9px',borderRadius:'8px',border:'1px solid rgba(255,255,255,.28)',background:'#182435',color:'white',font:'800 9px Arial,sans-serif',touchAction:'manipulation'});b.onclick=fn;return b;};
    bar.append(title,mk('COPY LAYOUT',()=>copy().catch(()=>toast('COPY FAILED'))),mk('RESET',()=>{layouts={...layouts,[selected]:{}};write(layouts);apply(selected);toast('PROFILE RESET');}),mk('DONE ✓',()=>stop(true)));
    overlay.append(bar);document.body.append(overlay);loop();
  }
  const syncActualProfile=()=>{const orientation=actualOrientation();if(editing&&selected){const device=selected.split('-')[0];const next=keyOf(device,orientation);if(next!==selected){selected=next;if(bar?.firstChild)bar.firstChild.textContent='✥ HUD RESIZE · '+device.toUpperCase()+' · '+orientation.toUpperCase();toast('SWITCHED TO '+next.toUpperCase());}apply(selected);positionFrames();}else apply(keyOf(actualDevice(),orientation));};
  const onResize=()=>syncActualProfile();
  addEventListener('resize',onResize);addEventListener('orientationchange',onResize);
  const mqLandscape=matchMedia?.('(orientation: landscape)');mqLandscape?.addEventListener?.('change',onResize);
  screen.orientation?.addEventListener?.('change',onResize);visualViewport?.addEventListener?.('resize',onResize);
  const observer=new MutationObserver(()=>{if(editing)rebuildFrames();else apply();});observer.observe(root,{childList:true,subtree:true});
  apply();
  const api={start,stop,copy,apply,get editing(){return editing;},get layouts(){return JSON.parse(JSON.stringify(layouts));},activeProfile(){return keyOf(actualDevice(),actualOrientation());},dispose(){stop(false);observer.disconnect();removeEventListener('resize',onResize);removeEventListener('orientationchange',onResize);mqLandscape?.removeEventListener?.('change',onResize);screen.orientation?.removeEventListener?.('change',onResize);visualViewport?.removeEventListener?.('resize',onResize);clearTransforms();}};
  window.__PCOCK_HUD_EDITOR=api;return api;
}

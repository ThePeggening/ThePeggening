const STAGES=Object.freeze({
  LW_STAGE_01:{n:1,milestone:'feather-1',label:'Swap Harbor · HOPE'},
  LW_STAGE_02:{n:2,milestone:'feather-2',label:'Shield Keep · SAFETY'},
  LW_STAGE_03:{n:3,milestone:'feather-3',label:'Pool Springs · GROWTH'},
  LW_STAGE_04:{n:4,milestone:'feather-4',label:'Stables Foundry · STABILITY'},
  LW_STAGE_05:{n:5,milestone:'feather-5',label:'HyperMarket Bazaar · COURAGE'},
  LW_STAGE_06:{n:6,milestone:'feather-6',label:'ZKX Vault + Observatory · INDEPENDENCE'},
  LW_STAGE_07:{n:7,milestone:'finale-complete',label:"Launch Pad + Liberty's Summit · ANTICIPATION"},
});
function complete(state,meta){
  if(!state||!meta)return false;
  if(meta.n===7)return state.finaleComplete===true;
  return state.feathers?.includes(`feather-${meta.n}`)||state.completed?.includes(`chapter-${meta.n}`);
}
export function createAtropaBridge(root,getState){
  const params=new URLSearchParams(location.search);
  const source=params.get('from');
  const fromAtropa=source==='atropa'&&window.parent!==window;
  const fromWebsite=source==='website'&&window.parent!==window;
  if(!fromAtropa&&!fromWebsite)return {update(){},dispose(){}};
  const requested=params.get('stage')||'LW_STAGE_01';
  const meta=STAGES[requested]||STAGES.LW_STAGE_01;
  let disposed=false,sentComplete=false,parentBack=null,parentBackDisplay='';
  const targetOrigin=location.origin;
  const send=(type,extra={})=>{
    if(disposed)return;
    try{window.parent.postMessage({type,stage:requested,...extra},targetOrigin);}catch(_){}
  };
  if(fromWebsite){
    try{
      parentBack=window.parent.document.getElementById('atropa-arcade-back');
      if(parentBack){parentBackDisplay=parentBack.style.display||'';parentBack.style.display='none';}
    }catch(_){}
  }
  const back=document.createElement('button');
  back.type='button';
  back.id=fromWebsite?'liberty-website-return':'atropa-liberty-return';
  back.textContent=fromWebsite?'‹ ATROPA':'‹ RETURN TO ATROPA';
  back.setAttribute('aria-label',fromWebsite?'Back to Atropa website':'Return to Atropa');
  back.style.cssText='position:fixed;z-index:2147483000;min-height:36px;padding:7px 10px;border:1px solid rgba(255,214,88,.78);border-radius:9px;background:rgba(13,16,38,.90);color:#fff7da;font:800 10px/1.05 Arial,sans-serif;letter-spacing:.035em;touch-action:manipulation;white-space:nowrap';
  const placeBack=()=>{const landscape=matchMedia?.('(orientation: landscape)').matches??(innerWidth>=innerHeight);back.style.top='max(8px,env(safe-area-inset-top))';if(landscape){back.style.left='50%';back.style.right='auto';back.style.transform='translateX(-50%)';}else{back.style.left='auto';back.style.right='max(8px,env(safe-area-inset-right))';back.style.transform='none';}};
  placeBack();
  const orientationQuery=matchMedia?.('(orientation: landscape)');
  orientationQuery?.addEventListener?.('change',placeBack);addEventListener('orientationchange',placeBack);visualViewport?.addEventListener?.('resize',placeBack);
  const restoreParent=()=>{try{if(parentBack)parentBack.style.display=parentBackDisplay;}catch(_){}};
  back.addEventListener('click',()=>{
    if(fromWebsite){
      restoreParent();
      try{const b=window.parent.document.getElementById('atropa-arcade-back');if(b){b.click();return;}}catch(_){}
      try{window.parent.history.back();}catch(_){}
      return;
    }
    send('ATROPA_LIBERTY_RETURN');
  });
  root.append(back);
  function update(){
    if(disposed)return;
    if(fromWebsite)return;
    const done=complete(getState?.(),meta);
    if(done&&!sentComplete){
      sentComplete=true;
      back.textContent=`✓ STAGE ${meta.n} COMPLETE · RETURN TO ATROPA`;
      send('ATROPA_LIBERTY_STAGE_COMPLETE',{milestone:meta.milestone});
    }
  }
  if(fromAtropa){
    const alreadyComplete=complete(getState?.(),meta);
    send('ATROPA_LIBERTY_READY',{milestone:meta.milestone,completed:alreadyComplete,label:meta.label});
    update();
  }
  return {
    update,
    dispose(){
      if(disposed)return;
      disposed=true;
      restoreParent();
      orientationQuery?.removeEventListener?.('change',placeBack);removeEventListener('orientationchange',placeBack);visualViewport?.removeEventListener?.('resize',placeBack);
      back.remove();
    }
  };
}

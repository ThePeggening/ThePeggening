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
  const hosted=params.get('from')==='atropa'&&window.parent!==window;
  const requested=params.get('stage')||'LW_STAGE_01';
  const meta=STAGES[requested]||STAGES.LW_STAGE_01;
  if(!hosted)return {update(){},dispose(){}};
  let disposed=false,sentComplete=false;
  const targetOrigin=location.origin;
  const send=(type,extra={})=>{
    if(disposed)return;
    try{window.parent.postMessage({type,stage:requested,...extra},targetOrigin);}catch(_){}
  };
  const back=document.createElement('button');
  back.type='button';
  back.id='atropa-liberty-return';
  back.textContent='‹ RETURN TO ATROPA';
  back.setAttribute('aria-label','Return to Atropa');
  back.style.cssText='position:fixed;top:max(8px,env(safe-area-inset-top));left:max(8px,env(safe-area-inset-left));z-index:2147483000;min-height:44px;padding:10px 14px;border:1px solid rgba(255,214,88,.8);border-radius:9px;background:rgba(13,16,38,.94);color:#fff7da;font:800 11px/1.15 Arial,sans-serif;letter-spacing:.04em;touch-action:manipulation';
  back.addEventListener('click',()=>send('ATROPA_LIBERTY_RETURN'));
  root.append(back);
  function update(){
    if(disposed)return;
    const done=complete(getState?.(),meta);
    if(done&&!sentComplete){
      sentComplete=true;
      back.textContent=`✓ STAGE ${meta.n} COMPLETE · RETURN TO ATROPA`;
      send('ATROPA_LIBERTY_STAGE_COMPLETE',{milestone:meta.milestone});
    }
  }
  const alreadyComplete=complete(getState?.(),meta);
  send('ATROPA_LIBERTY_READY',{milestone:meta.milestone,completed:alreadyComplete,label:meta.label});
  update();
  return {
    update,
    dispose(){
      if(disposed)return;
      disposed=true;
      back.remove();
    }
  };
}

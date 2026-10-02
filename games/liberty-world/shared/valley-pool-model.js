// Additive Chapter 3 model. Fixed water budget, isolated lesson stock, idempotent receipts.
export const poolPlaces=Object.freeze({supplies:{x:60,z:85},nursery:{x:55,z:85},orchard:{x:28,z:76},report:{x:60,z:85}});
export function createPoolModel(state,ledger){
 const record=v=>v&&typeof v==='object'&&!Array.isArray(v),existed=record(state.poolSprings),d=state.poolSprings=existed?state.poolSprings:{};
 d.version=1;for(const k of ['started','deposited','nurserySet','tested','staked','restored','assistance'])d[k]=d[k]===true;
 for(const [k,fallback]of [['nursery',60],['orchard',0]])d[k]=Number.isFinite(d[k])?Math.max(0,Math.min(80,Math.round(d[k]/10)*10)):fallback;
 if(d.nursery+d.orchard>100)d.orchard=100-d.nursery;
 const completed=()=>state.chapter>2||state.feathers?.includes('feather-3')||state.completed?.includes('chapter-3');
 if(completed()){d.restored=true;d.tested=true;d.staked=true;if(!existed){d.nursery=40;d.orchard=40;}}
 if(!existed&&state.chapter===2&&state.step>=2)d.carriedLesson=true;
 const active=()=>state.chapter===2&&!completed();
 const metrics=()=>({nursery:d.nursery,orchard:d.orchard,reserve:100-d.nursery-d.orchard,balanced:d.nursery>=30&&d.orchard>=40&&100-d.nursery-d.orchard>=20});
 const tx=(id,label,changes)=>ledger.transact('pool:'+id,label,changes);
 function start(){if(!active())return {ok:false,error:'This water trial belongs to Chapter 3.'};const a=tx('supplies','Moss issued earmarked Pool lesson supplies · not personal funds',{'Pool USDC':100,'Pool pDAI':100});if(!a.ok)return a;d.started=true;
  const r=tx('deposit',d.carriedLesson?'Earlier Pool lesson carried forward · matched fictional reserves':'Matched Pool lesson reserves deposited · fictional exercise',{'Pool USDC':-100,'Pool pDAI':-100,'Pool LP':100});if(!r.ok)return r;d.deposited=true;state.step=Math.max(2,state.step);return {ok:true};}
 function setValve(key,value){if(!active()||!d.deposited||d.tested||!['nursery','orchard'].includes(key)||!Number.isFinite(Number(value)))return false;const other=key==='nursery'?'orchard':'nursery';d[key]=Math.max(0,Math.min(80,100-d[other],Math.round(Number(value)/10)*10));if(key==='nursery'){d.nurserySet=true;state.step=Math.max(3,state.step);}return true;}
 function test(){if(d.tested)return {ok:true,duplicate:true};if(!active()||!d.deposited)return {ok:false,error:'Collect and deposit Moss’s lesson supplies first.'};const m=metrics();if(!m.balanced)return {ok:false,error:m.nursery<30?'The nursery needs at least 30 water units.':m.orchard<40?'The orchard needs at least 40 water units.':'Keep at least 20 water units in reserve for tomorrow.'};
  const r=tx('water-test',`Water delivered · nursery ${m.nursery} / orchard ${m.orchard} / reserve ${m.reserve}`,{});if(!r.ok)return r;d.tested=true;state.step=4;return {ok:true};}
 function stake(){if(!active()||!d.tested)return {ok:false,error:'Complete the balanced water trial first.'};const r=tx('stake','Pool practice receipt staked · no yield or real transaction',{'Pool LP':-100,'Staked Pool LP':100});if(!r.ok)return r;d.staked=true;state.step=5;return {ok:true};}
 function reset(){if(!active()||!d.deposited||d.tested)return false;d.nursery=60;d.orchard=0;d.nurserySet=false;state.step=2;return true;}
 function ready(){return active()&&d.deposited&&d.tested&&d.staked;}
 function objective(){let id,label;if(!d.deposited){id='supplies';label='Moss · collect the matched practice reserves';}else if(d.staked){id='report';label='Return to Moss · show the water and staking receipts';}else if(d.tested){id='orchard';label='Orchard console · stake the practice receipt';}else if(!d.nurserySet||d.nursery>40){id='nursery';label='Spring wheel · share water with the nursery';}else{id='orchard';label='Orchard wheel · irrigate and keep a reserve';}return {...poolPlaces[id],id:'pool-'+id,kind:'pool',label};}
 return {data:d,active,completed,metrics,start,setValve,test,stake,reset,ready,objective};
}

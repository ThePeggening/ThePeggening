import {harborRoutes,harborDecor} from './valley-harbor-data.js';
const integer=v=>Number.isFinite(v)?Math.max(0,Math.min(1000000,Math.floor(v))):0;
export const cartOffset=time=>Math.sin(time*1.65)*3.6;
export const throwFlight=.55;
export function createHarborModel(state,write=()=>{}){
 const raw=state.harborDays&&typeof state.harborDays==='object'?state.harborDays:{};
 const data=state.harborDays={version:1,sequence:integer(raw.sequence),completed:integer(raw.completed),tickets:integer(raw.tickets),precise:raw.precise===true,decor:harborDecor.filter(d=>raw.decor?.includes?.(d.id)).map(d=>d.id),best:{},active:null};
 for(const r of harborRoutes)data.best[r.id]=Math.min(10,integer(raw.best?.[r.id]));
 const a=raw.active,route=harborRoutes.find(r=>r.id===a?.route);
 if(route&&a&&typeof a==='object'){data.active={id:integer(a.id),route:route.id,collected:Array.isArray(a.collected)?[...new Set(a.collected.filter(n=>Number.isInteger(n)&&n>=0&&n<3))]:[],secret:a.secret===true};data.sequence=Math.max(data.sequence,data.active.id);}
 let round=null,last=null;
 function begin(id){if(data.active)return false;const r=harborRoutes.find(r=>r.id===id);if(!r)return false;data.active={id:++data.sequence,route:id,collected:[],secret:false};last=null;write();return true;}
 function collect(index){const a=data.active;if(!a||round)return false;if(index==='secret'){if(a.secret)return false;a.secret=true;}else{if(!Number.isInteger(index)||index<0||index>2||a.collected.includes(index))return false;a.collected.push(index);}write();return true;}
 function startRound(){if(!data.active||data.active.collected.length!==3)return false;round={id:data.active.id,time:0,throws:0,hits:0,score:0,cooldown:0,flight:null,feedback:'Wait for the marker to enter the center zone.'};last=null;return true;}
 function toss(){if(!round||round.cooldown>0||round.throws>=5)return false;const offset=cartOffset(round.time+throwFlight),hit=Math.abs(offset)<=1.25,perfect=Math.abs(offset)<=.5;round.throws++;round.hits+=Number(hit);round.score+=hit?(perfect?2:1):0;round.cooldown=.85;round.flight={age:0,hit,offset};round.feedback=hit?(perfect?'Perfect delivery!':'On board!'):'Just missed. Your supplies are safe.';return {hit,perfect};}
 function finish(){const a=data.active,r=round;if(!a||!r||a.id!==r.id)return;const success=r.hits>=3,reward=success?2+(r.score>=8?1:0)+(a.secret?1:0):0;last={success,reward,hits:r.hits,score:r.score,route:a.route,secret:a.secret};if(success){data.best[a.route]=Math.max(data.best[a.route],r.score);data.tickets+=reward;data.completed++;data.active=null;write();}round=null;}
 function step(dt){if(!round||!Number.isFinite(dt)||dt<=0)return;round.time+=dt;round.cooldown=Math.max(0,round.cooldown-dt);if(round.flight){round.flight.age+=dt;if(round.flight.age>.8)round.flight=null;}if(round.throws===5&&round.cooldown===0)finish();}
 function buy(id){const d=harborDecor.find(d=>d.id===id);if(!d||data.decor.includes(id)||data.tickets<d.cost)return false;data.tickets-=d.cost;data.decor.push(id);write();return true;}
 return {data,begin,collect,startRound,toss,step,buy,get round(){return round;},get last(){return last;},get route(){return harborRoutes.find(r=>r.id===data.active?.route);},pauseRound(){round=null;last=null;},setPrecise(value){data.precise=!!value;write();}};
}

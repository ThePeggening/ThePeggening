// PCOCK Liberty Crossing: only the crossing rules are new. No Runner or campaign writes.
// Analytic traffic and continuous relative collision checks make low frame rates safe.
import {createCrossingFeatures} from './crossing-features.js?v=r2';
export const CROSSING_BUILD='PCOCK-LIBERTY-CROSSING-R2';
export const STEP=4, HALF_COLUMNS=6, ROAD_HALF_WIDTH=180, HOP_SECONDS=.205;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TAU=Math.PI*2;
function hash(n){n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)/4294967296;}
export function laneAt(row,seed=414){
  const block=Math.floor(row/8),k=((row%8)+8)%8,random=hash(row*137+seed);
  if(row<2||k===0||k===1)return {row,kind:'safe',block,checkpoint:row>=0&&k===1};
  const level=Math.min(9,Math.floor(block/2)),direction=(k+block)%2?1:-1;
  const style=['sedan','taxi','sport','cruiser','roadster','police'][(k+block)%6];
  const length=style==='cruiser'?7.5:5.8,spacing=length+10.5+random*7.5;
  return {row,kind:'road',block,direction,style,length,width:2.65,speed:7+level*.9+(k%3)*1.65,spacing,phase:hash(seed+row*811)*spacing,z:-row*STEP};
}
export function trafficAt(lane,clock,minX=-85,maxX=85){
  if(lane.kind!=='road')return [];
  const offset=lane.phase+lane.direction*lane.speed*clock;
  const first=Math.floor((minX-offset)/lane.spacing)-1,last=Math.ceil((maxX-offset)/lane.spacing)+1,cars=[];
  for(let i=first;i<=last;i++){const x=offset+i*lane.spacing;if(x>=minX&&x<=maxX)cars.push({id:lane.row+':'+i,x,z:lane.z,length:lane.length,width:lane.width,style:lane.style,direction:lane.direction,lane:lane.row});}
  return cars;
}
// Inclusive swept point vs a box, expanded by the peacock's gameplay footprint.
export function sweptBox(ax,az,bx,bz,hx,hz){
  let enter=0,exit=1;
  for(const [a,b,h]of [[ax,bx,hx],[az,bz,hz]]){const delta=b-a;if(Math.abs(delta)<1e-10){if(Math.abs(a)>h)return false;continue;}let t0=(-h-a)/delta,t1=(h-a)/delta;if(t0>t1)[t0,t1]=[t1,t0];enter=Math.max(enter,t0);exit=Math.min(exit,t1);if(enter>exit)return false;}
  return true;
}
export function pickupAt(row,seed=414){
  if(row>1&&row%8===0){const block=Math.floor(row/8);return {id:'seal:'+row,row,x:(Math.floor(hash(seed+row*51)*7)-3)*STEP,kind:block%3===0?'slow':'seal'};}
  return null;
}
export function createCrossingLoop({mode='city',seed=414}={},emit=()=>{}){
  const state={mode,seed,phase:'ready',row:0,col:0,x:0,z:0,px:0,pz:0,hopY:0,previousHopY:0,facing:Math.PI,age:0,clock:0,previousClock:0,maxRow:0,score:0,lives:2,checkpoint:1,hits:0,seals:0,nearMisses:0,combo:1,chain:0,lastForward:-99,slowTime:0,grace:0,recovery:0,finishRow:mode==='city'?97:Infinity,move:null,queued:null,collected:new Set(),nearSeen:new Map(),crash:null};
  const notify=(type,text)=>emit(type,text,state),features=createCrossingFeatures(state,notify);
  function start(){state.phase='run';notify('start','WAIT FOR A GAP. CROSS WHEN IT IS SAFE.');}
  function request(dx,dr){if(state.phase!=='run')return false;dx=Math.sign(Number(dx)||0);dr=Math.sign(Number(dr)||0);if(Math.abs(dx)+Math.abs(dr)!==1)return false;if(state.move){state.queued={dx,dr};return true;}const col=clamp(state.col+dx,-HALF_COLUMNS,HALF_COLUMNS),row=clamp(state.row+dr,Math.max(0,state.checkpoint-9),state.finishRow);if(col===state.col&&row===state.row)return false;state.move={x:state.x,z:state.z,toX:col*STEP,toZ:-row*STEP,col,row,t:0,dr};state.facing=Math.atan2(dx,-dr);return true;}
  function collect(){for(const row of [state.row-1,state.row,state.row+1]){const p=pickupAt(row,seed);if(!p||state.collected.has(p.id)||Math.hypot(state.x-p.x,state.z+row*STEP)>1.15)continue;state.collected.add(p.id);if(p.kind==='slow'){state.slowTime=4.5;state.score+=25;notify('slow','GREEN WAVE · TRAFFIC SLOWED');}else{state.seals++;state.score+=50;notify('seal','LIBERTY SEAL '+state.seals+' · +50');}}}
  function arrive(){const m=state.move;if(!m)return;state.row=m.row;state.col=m.col;state.x=m.toX;state.z=m.toZ;state.hopY=0;state.move=null;
    if(state.row>state.maxRow){const swift=state.age-state.lastForward<1.3;state.chain=swift?state.chain+1:1;state.combo=Math.min(3,1+Math.floor(state.chain/5));state.lastForward=state.age;state.score+=10*state.combo;state.maxRow=state.row;}
    const lane=laneAt(state.row,seed);if(lane.checkpoint&&state.row>state.checkpoint){state.checkpoint=state.row;notify('checkpoint','SAFE ISLAND · CROSSING '+Math.floor(state.row/8));}
    collect();features.arrive();if(state.row>=state.finishRow){state.phase='win';state.queued=null;notify('win','LIBERTY SQUARE · YOU MADE IT');return;}const q=state.queued;state.queued=null;if(q)request(q.dx,q.dr);
  }
  function hit(car){if(state.phase!=='run'||state.grace>0)return;features.hit();state.hits++;state.lives--;state.chain=0;state.combo=1;state.move=state.queued=null;state.hopY=0;state.crash={x:state.x,z:state.z,row:state.maxRow,car:car?.id};if(state.lives>0){state.phase='recover';state.recovery=1.5;notify('life','YOU HAVE 1 LIFE LEFT');}else{state.phase='crash';state.recovery=2.1;notify('crash','END OF THE ROAD');}}
  function recover(){state.row=state.checkpoint;state.col=0;state.x=state.px=0;state.z=state.pz=-state.row*STEP;state.hopY=state.previousHopY=0;state.grace=2.4;state.phase='run';state.crash=null;state.facing=Math.PI;notify('resume','BACK ON THE SAFE ISLAND · WATCH BOTH WAYS');}
  function step(dt){if(!Number.isFinite(dt)||dt<=0)return;if(dt>1/60+.00001){const n=Math.ceil(dt/(1/60));for(let i=0;i<n;i++)step(dt/n);return;}
    if(state.phase==='recover'||state.phase==='crash'){state.recovery-=dt;if(state.recovery<=0){if(state.phase==='recover')recover();else{state.phase='over';notify('over','RUN COMPLETE');}}return;}
    if(state.phase!=='run')return;features.tick(dt);
    state.px=state.x;state.pz=state.z;state.previousHopY=state.hopY;state.previousClock=state.clock;state.age+=dt;state.grace=Math.max(0,state.grace-dt);state.slowTime=Math.max(0,state.slowTime-dt);state.clock+=dt*(state.slowTime>0?.42:1);
    if(state.move){const m=state.move;m.t=Math.min(1,m.t+dt/HOP_SECONDS);const t=m.t*m.t*(3-2*m.t);state.x=m.x+(m.toX-m.x)*t;state.z=m.z+(m.toZ-m.z)*t;state.hopY=Math.sin(m.t*Math.PI)*.62;}
    if(state.age-state.lastForward>1.6){state.combo=1;state.chain=0;}
    const lo=Math.max(2,Math.floor(-Math.max(state.z,state.pz)/STEP)-1),hi=Math.ceil(-Math.min(state.z,state.pz)/STEP)+1;
    for(let row=lo;row<=hi;row++){const lane=laneAt(row,seed);if(lane.kind!=='road')continue;
      const travel=lane.direction*lane.speed*(state.clock-state.previousClock),cars=trafficAt(lane,state.clock,Math.min(state.x,state.px)-lane.length-4,Math.max(state.x,state.px)+lane.length+4);
      for(const car of cars){const ax=state.px-(car.x-travel),az=state.pz-car.z,bx=state.x-car.x,bz=state.z-car.z;
        if(state.grace<=0&&sweptBox(ax,az,bx,bz,car.length/2+.48,car.width/2+.45)){hit(car);return;}
        if(Math.abs(bz)<car.width/2+.8&&Math.abs(bx)>car.length/2+.55&&Math.abs(bx)<car.length/2+1.4&&!state.nearSeen.has(car.id)&&state.grace<=0){state.nearSeen.set(car.id,row);state.nearMisses++;state.score+=15;notify('near','CLOSE CALL · +15');}
      }
    }
    collect();if(state.move?.t>=1)arrive();for(const [key,row]of state.nearSeen)if(row<state.maxRow-20)state.nearSeen.delete(key);
  }
  function snapshot(){return {...state,move:state.move?{...state.move}:null,queued:state.queued?{...state.queued}:null,collected:[...state.collected],nearSeen:state.nearSeen.size};}
  return {state,start,request,step,hit,snapshot,action:features.action,featureAvailability:features.availability};
}

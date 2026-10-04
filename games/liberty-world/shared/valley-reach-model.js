import {commonGuests,commonModes} from './valley-reach-common.js';
import {pipeSolution,chimeSolution} from './valley-reach-data.js';
const number=(v,a,b,f)=>Number.isFinite(v)?Math.max(a,Math.min(b,v)):f;
export function createReachModel(state,write=()=>{}){
 const old=state.lanternReach&&typeof state.lanternReach==='object'&&!Array.isArray(state.lanternReach)?state.lanternReach:{};
 const data=state.lanternReach={version:2,homecoming:old.homecoming===true,commonMode:commonModes.some(m=>m.id===old.commonMode)?old.commonMode:'quiet',heard:commonGuests.filter(g=>Array.isArray(old.heard)&&old.heard.includes(g.name)).map(g=>g.name),visited:old.visited===true,accepted:['lock','mill','archive'].filter(k=>old.accepted?.includes?.(k)),inlet:old.inlet!==false,outlet:old.outlet===true,water:number(old.water,.7,5.5,5.5),bridge:old.bridge===true,gear:old.gear===true,installed:old.installed===true,pipes:[0,1,2].map(i=>Math.floor(number(old.pipes?.[i],0,3,0))),powered:old.powered===true,vault:old.vault===true,atlas:old.atlas===true,ending:['garden','reading'].includes(old.ending)?old.ending:null,rewarded:['lock','mill','archive'].filter(k=>old.rewarded?.includes?.(k))};
 if(!data.ending){data.commonMode='quiet';data.homecoming=false;data.heard=[];}if(data.ending)data.atlas=true;if(data.atlas)data.vault=true;if(data.vault)data.powered=true;if(data.powered){data.installed=data.gear=data.bridge=true;data.pipes=[...pipeSolution];}if(data.installed)data.gear=true;if(data.bridge){data.inlet=false;data.outlet=true;data.water=.7;}
 let chimes=[],saveAge=0;
 const commit=()=>write(),accepted=id=>data.accepted.includes(id),done=id=>id==='lock'?data.bridge:id==='mill'?data.powered:!!data.ending;
 function accept(id){if(!['lock','mill','archive'].includes(id)||id==='mill'&&!data.bridge||id==='archive'&&!data.powered)return false;if(!accepted(id)){data.accepted.push(id);commit();}return true;}
 function turn(id){if(!accepted('lock')||data.bridge||!['inlet','outlet'].includes(id))return false;data[id]=!data[id];commit();return true;}
 function step(dt,active){if(!active||data.bridge||!accepted('lock'))return;const before=data.water;data.water=number(data.water+(data.inlet?.65:0)*dt-(data.outlet?.42:0)*dt,.7,5.5,5.5);if(data.water!==before){saveAge+=dt;if(saveAge>=1||data.water===.7||data.water===5.5){saveAge=0;commit();}}}
 function openBridge(){if(!accepted('lock')||data.bridge||data.inlet||data.water>1.2)return false;data.bridge=true;data.water=.7;data.outlet=true;commit();return true;}
 function takeGear(){if(!accepted('mill')||data.gear)return false;data.gear=true;commit();return true;}
 function power(){if(data.installed&&data.pipes.every((p,i)=>p===pipeSolution[i])){data.powered=true;commit();return true;}return false;}
 function install(){if(!data.gear||data.installed)return false;data.installed=true;power();commit();return true;}
 function rotate(index){if(!accepted('mill')||!Number.isInteger(index)||index<0||index>2||data.powered)return false;data.pipes[index]=(data.pipes[index]+1)%4;power();commit();return true;}
 function ring(id){if(!accepted('archive')||data.vault||!chimeSolution.includes(id))return 'locked';if(id!==chimeSolution[chimes.length]){chimes=[];return 'wrong';}chimes.push(id);if(chimes.length===3){data.vault=true;commit();return 'open';}return 'echo';}
 function takeAtlas(){if(!data.vault||data.atlas)return false;data.atlas=true;commit();return true;}
 function finish(ending){if(!data.atlas||!['garden','reading'].includes(ending))return false;data.ending=ending;commit();return true;}
 function reward(id){if(!done(id)||data.rewarded.includes(id))return false;data.rewarded.push(id);commit();return true;}
 return {data,setCommon(mode){if(!data.ending||!commonModes.some(m=>m.id===mode))return false;data.commonMode=mode;if(mode!=='quiet')data.homecoming=true;commit();return true;},remember(name){if(!data.ending||data.commonMode==='quiet'||!commonGuests.some(g=>g.name===name))return false;if(!data.heard.includes(name)){data.heard.push(name);commit();}return true;},accept,accepted,done,turn,step,openBridge,takeGear,install,rotate,ring,takeAtlas,finish,reward,visit(){if(!data.visited){data.visited=true;commit();}},get flow(){let n=0;while(n<3&&data.pipes[n]===pipeSolution[n])n++;return n;},get echoes(){return chimes.length;}};
}

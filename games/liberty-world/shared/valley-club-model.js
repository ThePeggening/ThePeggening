import {clubCourses,clubFurnishings,clubSlots,clubSummary,medalFor} from './valley-club-data.js';
export function createClubModel(state,write=()=>{}){
 const raw=state.trailClub&&typeof state.trailClub==='object'?state.trailClub:{},data=state.trailClub={version:1,best:{},finishes:0,selected:clubCourses.some(c=>c.id===raw.selected)?raw.selected:'grove',placements:{}};
 for(const c of clubCourses)data.best[c.id]=Number.isFinite(raw.best?.[c.id])&&raw.best[c.id]>0?Math.min(86400,raw.best[c.id]):null;
 data.finishes=Number.isFinite(raw.finishes)?Math.max(0,Math.min(1000000,Math.floor(raw.finishes))):0;
 const unlocked=()=>clubFurnishings.filter(f=>f.unlocked(clubSummary(data.best))).map(f=>f.id),used=new Set();
 for(const slot of clubSlots){const p=raw.placements?.[slot.id];if(p&&unlocked().includes(p.item)&&!used.has(p.item)){data.placements[slot.id]={item:p.item,turn:Number.isInteger(p.turn)?((p.turn%4)+4)%4:0};used.add(p.item);}}
 if(!raw.version)data.placements.west={item:'bench',turn:1};
 let run=null,last=null,previous=null;
 const course=()=>clubCourses.find(c=>c.id===data.selected);
 function choose(id){if(run||!clubCourses.some(c=>c.id===id))return false;data.selected=id;last=null;write();return true;}
 function start(){if(run)return false;run={course:data.selected,gate:0,elapsed:0,countdown:3};last=null;previous=null;return true;}
 function step(dt,p,ground){if(!run||!Number.isFinite(dt)||dt<=0||!p?.position)return null;dt=Math.min(dt,.1);const pos=p.position;
  if(run.countdown>0){run.countdown=Math.max(0,run.countdown-dt);previous={x:pos.x,z:pos.z,y:pos.y};return null;}
  run.elapsed+=dt;const c=course(),target=c.gates[run.gate],dx=pos.x-target.x,dz=pos.z-target.z;
  let near=Math.hypot(dx,dz)<2.4;
  if(!near&&previous){const vx=pos.x-previous.x,vz=pos.z-previous.z,length=vx*vx+vz*vz;if(length>0&&length<4){const t=Math.max(0,Math.min(1,((target.x-previous.x)*vx+(target.z-previous.z)*vz)/length));near=Math.hypot(previous.x+t*vx-target.x,previous.z+t*vz-target.z)<2.4;}}
  previous={x:pos.x,z:pos.z,y:pos.y};const above=pos.y-ground;if(!near||above>3||above<-.4||(target.jump&&(p.onGround||above<.35)))return null;
  run.gate++;if(run.gate<c.gates.length)return {gate:run.gate};
  const before=unlocked(),old=data.best[c.id],time=Math.max(.01,Math.round(run.elapsed*100)/100);data.best[c.id]=old===null?time:Math.min(old,time);data.finishes=Math.min(1000000,data.finishes+1);
  last={course:c.id,time,medal:medalFor(c,time),best:data.best[c.id],improved:old===null||time<old,unlocked:unlocked().filter(id=>!before.includes(id))};run=null;previous=null;write();return {finished:true,...last};
 }
 function place(item,slot){if(run||!unlocked().includes(item)||!clubSlots.some(s=>s.id===slot))return false;const at=data.placements[slot];if(at&&at.item!==item)return false;let turn=0;for(const [id,p]of Object.entries(data.placements))if(p.item===item){turn=p.turn;delete data.placements[id];}data.placements[slot]={item,turn};write();return true;}
 function rotate(slot){const p=data.placements[slot];if(run||!p)return false;p.turn=(p.turn+1)%4;write();return true;}
 function remove(slot){if(run||!data.placements[slot])return false;delete data.placements[slot];write();return true;}
 return {data,choose,start,step,place,rotate,remove,unlocked,get course(){return course();},get run(){return run;},get last(){return last;},get summary(){return clubSummary(data.best);},cancel(){run=null;previous=null;last=null;}};
}

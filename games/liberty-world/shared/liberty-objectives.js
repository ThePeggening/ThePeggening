import {MPH,rampPose} from './liberty-runner-helpers.js?v=r12';
const specs=Object.freeze({
  coast:{token:'Sun Pearl',color:'#ffe389',mph:200,skill:'feathers',goal:1,task:'Find a high-route feather'},
  skyline:{token:'Neon Chip',color:'#62f0ff',mph:210,skill:'drifts',goal:3,task:'Earn 3 perfect drifts'},
  canyon:{token:'Amber Relic',color:'#ffac50',mph:205,skill:'cleanLandings',goal:4,task:'Land 4 clean jumps'},
  alpine:{token:'Frost Crystal',color:'#c6f5ff',mph:210,skill:'loops',goal:3,task:'Complete 3 summit loops'},
  volcano:{token:'Foundry Core',color:'#ff7956',mph:215,skill:'cleanDodges',goal:5,task:'Clear 5 obstacles without a hit'},
  skybreak:{token:'Void Sigil',color:'#cb83ff',mph:300,skill:'overdrives',goal:1,task:'Trigger a 3-ring OVERDRIVE'},
  libertyswap:{token:'Daybreak Seal',color:'#ff963a',mph:310,skill:'overdrives',goal:2,task:'Trigger 2 OVERDRIVES'}
});
export const objectiveSpec=id=>specs[id]||specs.coast;
export function addObjectiveItems(track){
  const occupied=track.items.map(p=>p.s),spec=objectiveSpec(track.config.id);
  function place(type,fraction,index){
    const target=Math.round(track.config.length*fraction);let at=null;
    // Keep new pickups clear of gaps, launch pads and colliders. Never move the existing route.
    for(let offset=0;offset<1500&&at===null;offset+=7)for(const sign of offset?[1,-1]:[1]){
      const s=target+offset*sign;if(s<60||s>track.config.length-80||track.config.gaps.some(([a,b])=>s>a-105&&s<b+85)||track.hazards.some(h=>Math.abs(h.s-s)<38)||occupied.some(d=>Math.abs(d-s)<22))continue;
      if(track.config.forks.some(([a,b])=>Math.abs(s-a)<70||Math.abs(s-b)<70))continue;if(type==='velocity'&&(track.loopAt(s,70)||track.forkAt(s)))continue;at=s;break;
    }
    if(at===null)throw new Error('No safe objective pickup position on '+track.config.id);
    occupied.push(at);const route=type==='relic'&&track.forkAt(at)?1:0;
    track.items.push({id:track.items.length,type,s:at,x:route?0:type==='velocity'?0:[-2.4,2.4,0][index],y:1.5,route,label:type==='relic'?spec.token:'Velocity Coin'});
  }
  [.18,.49,.79].forEach((q,i)=>place('relic',q,i));[.055,.36,.66].forEach((q,i)=>place('velocity',q,i));
  for(const pickup of [...(track.stuntRings||[]),...track.coins]){if(pickup.kind==='loop')continue;const ramp=track.items.find(p=>p.type==='launch'&&pickup.s>=p.gapStart&&pickup.s<=p.gapEnd);if(ramp){const peak=Math.max(16,Math.min(24,(ramp.gapEnd-ramp.gapStart)*.075));pickup.y=rampPose(pickup.s,ramp.s,ramp.landing,peak).y+1;}}
  track.objectives=spec;return track;
}
export function objectiveProgress(track,s){
  const a=objectiveSpec(track.config.id),skill=a.skill==='loops'?s.loopsCleared.size:(s[a.skill]||0),speed=(s.velocityPeak||0)*MPH;
  return [{id:'relics',title:`Collect 3 ${a.token}s`,value:Math.min(3,s.relics||0),target:3,done:(s.relics||0)>=3,detail:'Rare hexagonal coin · '+a.token},
    {id:'velocity',title:`Velocity Coin → ${a.mph} mph`,value:Math.min(a.mph,Math.floor(speed)),target:a.mph,done:(s.velocityCoins||0)>0&&speed>=a.mph,detail:`Collect the lightning coin, then reach ${a.mph} mph`},
    {id:'skill',title:a.task,value:Math.min(a.goal,skill),target:a.goal,done:skill>=a.goal,detail:a.task}];
}
export function masteryResult(previous,track,s){
  const claimed=Array.isArray(previous?.claimed)?previous.claimed.filter(v=>typeof v==='string').slice(0,100):[],earned=[];
  for(const goal of objectiveProgress(track,s)){const id=track.config.id+':'+goal.id;if(goal.done&&!claimed.includes(id)){claimed.push(id);earned.push(goal.title);}}
  return {state:{version:1,claimed},earned,bonus:earned.length*120};
}

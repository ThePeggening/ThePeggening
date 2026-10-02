import {createCourse,clamp,makeFrame} from './liberty-track.js';
function lowerBound(items,s){let a=0,b=items.length;while(a<b){const m=(a+b)>>>1;if(items[m].s<s)a=m+1;else b=m;}return a;}
export function createLibertyLoop(id,upgrades={},emit=()=>{}){
  const track=createCourse(id),level=k=>clamp(upgrades[k]||0,0,3),glideMax=1.5+level('signature')*.5+(track.config.glideBonus||0),boostMax=2.8+level('gasless')*.55;
  const freshState=()=>({crashed:false,crashReason:'',score:0,chain:0,combo:1,maxCombo:1,comboTime:0,feathers:0,magnetTime:0,drifts:0,drifting:false,driftTime:0,drifted:new Set(),dodged:new Set(),picked:new Set(),loopsCleared:new Set(),stuntRingsCollected:new Set(),stuntRingCount:0,airRingChain:0,airRingTime:0,overdrives:0,splits:[],routeChoices:0,pickups:0,distance:0,previous:0,x:0,px:0,y:0,py:0,vy:0,speed:0,age:0,coins:0,jumps:0,hits:0,falls:0,recoveries:0,launches:0,launchStart:0,launchEnd:0,launchPeak:0,route:0,shield:level('runner-shield'),charge:100,boost:0,slide:0,grace:0,glide:glideMax,grounded:true,ended:false,success:false,checkpoint:0,visited:new Set(),collected:new Set(),message:'Follow the $PDAI trail',messageTime:4,coyote:.12});
  const s=freshState();
  let jumpBuffer=0,lastJump=false,lastSlide=false,lastBoost=false,lastFork=null;const main=makeFrame(),branch=makeFrame();
  function chain(points){s.chain++;s.combo=Math.min(5,1+Math.floor(s.chain/12));s.maxCombo=Math.max(s.maxCombo,s.combo);s.score+=points*s.combo;s.comboTime=4;}
  const notify=(type,message)=>{s.message=message;s.messageTime=2.8;emit(type,message);};
  const hazardX=(h,t=s.age)=>h.motion==='sweep'?h.x+Math.sin(t*(h.speed||1)+(h.phase||0))*(h.amp||0):h.x;
  function hit(fall=false){if(s.ended)return;s.hits++;s.falls+=fall?1:0;s.chain=0;s.combo=1;s.comboTime=0;s.boost=0;s.y=s.py=s.vy=0;s.crashReason=fall?'Missed jump':'Obstacle hit';if(track.config.recoverOnCrash&&s.checkpoint>120){s.recoveries++;s.distance=s.previous=Math.max(0,s.checkpoint-12);s.x=s.px=0;s.speed=track.config.speed*.62;s.grounded=true;s.grace=1.6;s.glide=glideMax;s.charge=Math.max(s.charge,55);s.crashed=false;s.ended=false;notify('recover',s.crashReason+' · checkpoint recovery');return;}s.ended=s.crashed=true;s.success=false;notify('hit',s.crashReason+' · restarting from the start');}
  function reset(){Object.assign(s,freshState());jumpBuffer=0;lastJump=lastSlide=lastBoost=false;lastFork=null;return s;}
  function step(dt,input={}){
    if(s.ended)return;dt=Math.min(dt,1/30);s.previous=s.distance;s.px=s.x;s.py=s.y;s.age+=dt;s.grace=Math.max(0,s.grace-dt);s.messageTime=Math.max(0,s.messageTime-dt);s.magnetTime=Math.max(0,s.magnetTime-dt);s.comboTime=Math.max(0,s.comboTime-dt);s.airRingTime=Math.max(0,s.airRingTime-dt);if(!s.airRingTime)s.airRingChain=0;if(!s.comboTime){s.chain=0;s.combo=1;}
    jumpBuffer=Math.max(0,jumpBuffer-dt);if(input.jump&&!lastJump)jumpBuffer=.16;lastJump=!!input.jump;
    if(input.slide&&!lastSlide&&s.grounded){s.slide=.8;notify('slide','Under and through');}lastSlide=!!input.slide;s.slide=Math.max(0,s.slide-dt);
    if(input.boost&&!lastBoost&&s.charge>=30){s.boost=boostMax;s.charge=0;notify('boost','GASLESS BOOST');}lastBoost=!!input.boost;
    s.boost=Math.max(0,s.boost-dt);if(!s.boost)s.charge=Math.min(100,s.charge+dt*(9+level('gasless')*2));
    const loop=track.loopAt(s.distance,12),locked=track.lockedAt?.(s.distance,12)||loop;
    const target=track.config.speed+(s.boost>0?(track.config.boostBonus||36):0)+(s.route?5:0);s.speed+=(target-s.speed)*Math.min(1,dt*4.8);
    s.distance=Math.min(track.config.length,s.distance+s.speed*dt);s.x+=clamp(input.steer||0,-1,1)*dt*13;s.score+=(s.distance-s.previous)*2;
    const fork=track.forkAt(s.distance);if(fork!==lastFork){if(fork)notify('route','FORK AHEAD · keep right for the high route');else if(lastFork){s.route=0;notify('route','Routes reunited');}lastFork=fork;}
    if(fork&&s.previous<fork[0]+22&&s.distance>=fork[0]+22){s.route=s.x>1?1:0;if(s.route){s.routeChoices++;track.sample(s.distance,0,main);track.sample(s.distance,1,branch);s.x-=(branch.x-main.x)*main.rx+(branch.z-main.z)*main.rz;s.px=s.x;}s.x=clamp(s.x,-2.8,2.8);notify('route',s.route?'HIGH ROUTE · faster, narrower, richer':'MAIN ROUTE · follow the coin trail');}
    const corner=track.cornerAt(s.distance);s.drifting=!!(corner&&input.slide&&Math.sign(input.steer)===corner.direction);if(s.drifting){s.driftTime+=dt;if(s.driftTime>.35&&!s.drifted.has(corner.id)){s.drifted.add(corner.id);s.drifts++;chain(350);s.charge=Math.min(100,s.charge+22);notify('drift','PERFECT DRIFT · +22 BOOST');}}else s.driftTime=0;
    const gap=track.gapAt(s.distance),half=track.halfWidth(s.route);
    // Raised rails contain lateral steering; only clearly marked gaps remove the floor.
    s.x=clamp(s.x,-half+.48,half-.48);const onRoad=!gap;
    if(locked){s.x=clamp(s.x,-4.2,4.2);s.y=s.vy=0;s.grounded=true;if(track.config.stunt)s.coyote=.12;jumpBuffer=0;}
    else {
      if(s.grounded&&!onRoad)s.grounded=false;
      s.coyote=s.grounded?.12:Math.max(0,s.coyote-dt);
      if(jumpBuffer>0&&(s.grounded||s.coyote>0)){s.vy=10.8;s.grounded=false;s.coyote=0;jumpBuffer=0;s.slide=0;s.jumps++;notify('jump','Hold Jump to spread your wings');}
      if(!s.grounded){const glide=input.jump&&s.vy<0&&s.glide>0&&s.y>0;if(glide){s.vy=Math.max(-2.8,s.vy-dt*4);s.glide-=dt;}else s.vy-=dt*25;s.y+=s.vy*dt;}
      if(s.launchEnd>s.distance&&s.distance>=s.launchStart){const u=clamp((s.distance-s.launchStart)/Math.max(1,s.launchEnd-s.launchStart),0,1),arc=Math.sin(Math.PI*u)*(s.launchPeak||18);s.y=Math.max(s.y,arc);s.vy=Math.max(s.vy,-1.4);s.grounded=false;}
      if(s.launchEnd&&s.distance>=s.launchEnd&&onRoad){s.launchStart=s.launchEnd=s.launchPeak=0;s.y=s.vy=0;s.grounded=true;s.glide=glideMax;notify('jump','BOOST RAMP LANDING · STUCK IT');}
      if(onRoad&&s.y<=0){
        if(s.py<-.7||track.gapAt(s.previous)&&s.py<-.05){if(!track.config.recoverOnCrash)s.recoveries++;hit(true);return;}
        s.y=s.vy=0;s.grounded=true;s.glide=glideMax;
      }
      if(s.y<-5.5){hit(true);return;}
    }
    if(s.grounded&&!gap&&Math.abs(s.x)<3&&!fork&&!locked&&s.distance>s.checkpoint+80)s.checkpoint=s.distance;
    // Insurance acts before contact. Actual collisions always restart, even with an unused shield.
    if(s.shield&&s.grounded)for(let i=lowerBound(track.hazards,s.distance);i<track.hazards.length&&track.hazards[i].s<s.distance+14;i++){const h=track.hazards[i],hx=hazardX(h);if(h.route!==s.route||Math.abs(hx-s.x)>=1.25||s.dodged.has(h.id)||h.type==='beam'&&s.slide>0)continue;s.dodged.add(h.id);s.shield--;if(h.type==='beam')s.slide=.8;else{s.vy=10.8;s.grounded=false;s.jumps++;}notify('shield','SHIELD DODGE · STAY IN THE FLOW');break;}
    for(let i=lowerBound(track.hazards,s.previous-.1);i<track.hazards.length;i++){const h=track.hazards[i];if(h.s>s.distance+.8)break;if(h.s<s.previous-.1||h.s>s.distance+.8||s.visited.has(h.id)||h.route!==s.route)continue;s.visited.add(h.id);const hx=hazardX(h),collision=Math.abs(hx-s.x)<1.25&&(h.type==='beam'?s.slide<=0&&s.y<3.4:s.y<1.5);if(collision){hit();return;}else{chain(Math.abs(hx-s.x)<2.4?150:75);}}
    for(let i=lowerBound(track.coins,s.previous-2);i<track.coins.length;i++){const c=track.coins[i];if(c.s>s.distance+1.8)break;if(c.s<s.previous-2||c.s>s.distance+1.8||c.route!==s.route||s.collected.has(c.id))continue;if(Math.hypot(c.x-s.x,c.y-(s.y+1))<(s.magnetTime>0?6:1.25+level('magnet')*.9)){s.collected.add(c.id);s.coins++;chain(25);emit('coin');}}
    for(const ring of track.stuntRings||[]){if(ring.s<s.previous-2||ring.s>s.distance+1.8||s.stuntRingsCollected.has(ring.id))continue;if(Math.hypot(ring.x-s.x,ring.y-(s.y+1))<1.9){s.stuntRingsCollected.add(ring.id);s.stuntRingCount++;s.airRingChain=s.airRingTime>0?s.airRingChain+1:1;s.airRingTime=5;chain(ring.kind==='air'?260:180);s.charge=Math.min(100,s.charge+14);if(s.airRingChain>=3){s.overdrives++;s.airRingChain=0;s.airRingTime=0;s.boost=Math.max(s.boost,3.2);s.glide=glideMax;notify('ring','3-RING OVERDRIVE · FULL SEND');}else notify('ring',`STUNT RING ${s.airRingChain} / 3`);}}
    for(const p of track.items){const reach=p.type==='launch'?5.1:1.65;if(p.s<s.previous-.1||p.s>s.distance+.7||p.route!==s.route||s.picked.has(p.id)||Math.abs(p.x-s.x)>reach||s.y>3)continue;s.picked.add(p.id);s.pickups++;chain(p.type==='feather'?1000:100);
      if(p.type==='dash'){s.boost=Math.max(s.boost,track.config.padBoostSeconds||2.4);notify('boost',track.config.stunt?'MEGA BOOST · COMMIT TO THE JUMP':'DASH PAD · FULL THROTTLE');}
      if(p.type==='spring'){s.vy=track.config.springVelocity||14;s.grounded=false;s.y=Math.max(.1,s.y);s.jumps++;notify('jump',track.config.stunt?`${track.config.stuntJumpLabel||'STUNT LAUNCH'} · HOLD TO GLIDE`:'SPRING LAUNCH · HOLD TO GLIDE');}
      if(p.type==='launch'){const span=Math.max(1,(p.gapEnd||p.s+220)-(p.gapStart||p.s));s.launchStart=p.s;s.launchEnd=p.landing||((p.gapEnd||p.s+220)+10);s.launchPeak=Math.max(16,Math.min(24,span*.075));s.launches++;s.boost=Math.max(s.boost,(track.config.padBoostSeconds||5.2)+1.2);s.speed=Math.max(s.speed,track.config.speed+(track.config.boostBonus||52));s.charge=100;s.glide=glideMax;s.vy=Math.max(s.vy,13);s.grounded=false;s.y=Math.max(.2,s.y);s.jumps++;notify('jump',`${track.config.rampLabel||'BOOST RAMP'} · LANDING LOCKED`);}
      if(p.type==='magnet'){s.magnetTime=9;notify('power','COIN MAGNET · 9 SECONDS');}
      if(p.type==='shield'){s.shield=Math.min(3,s.shield+1);notify('shield','SHIELD PICKUP');}
      if(p.type==='feather'){s.feathers++;notify('feather',`SECRET FEATHER · ${s.feathers} / 3`);}
    }
    for(const l of track.loops)if(s.previous<l.end&&s.distance>=l.end&&!s.loopsCleared.has(l.id)){s.loopsCleared.add(l.id);chain(600);notify('loop','LOOP MASTER · KEEP THE CHAIN');}
    for(const d of track.checkpoints)if(s.previous<d&&s.distance>=d){s.splits.push(Math.round(s.age*100)/100);chain(100);notify('checkpoint',`CHECKPOINT · ${(d/1000).toFixed(0)} KM`);}
    const upcoming=track.config.gaps.find(([a])=>a>s.distance&&a-s.distance<Math.max(105,s.speed*2.1));if(upcoming&&(s.messageTime<.2||(upcoming[0]-s.distance<s.speed*.65&&s.grounded))){s.message=track.config.stunt?(upcoming[0]-s.distance<s.speed*.65?'BOOST RAMP NOW · STAY ON THE ROAD':`${track.config.rampLabel||'BOOST RAMP'} AHEAD · AUTO LAUNCH`):upcoming[0]-s.distance<s.speed*.65?'JUMP NOW · HOLD TO GLIDE':'GAP AHEAD · JUMP + HOLD TO GLIDE';s.messageTime=.3;}
    const nextFork=track.config.forks.find(([a])=>a>s.distance&&a-s.distance<Math.max(95,s.speed*1.8));if(nextFork&&s.messageTime<.2){s.message='FORK AHEAD · RIGHT FOR THE HIGH ROUTE';s.messageTime=.3;}
    const nextCorner=track.turns.find(t=>t.start>s.distance&&t.start-s.distance<90);if(nextCorner&&s.messageTime<.2){s.message=`${nextCorner.direction>0?'RIGHT':'LEFT'} SWEEP · HOLD SLIDE + STEER TO DRIFT`;s.messageTime=.3;}const nextSweeper=track.hazards.find(h=>h.motion==='sweep'&&h.s>s.distance&&h.s-s.distance<95);if(nextSweeper&&s.messageTime<.2){s.message='MOVING SWEEPER · DODGE OR JUMP';s.messageTime=.3;}
    if(s.distance>=track.config.length){s.ended=s.success=true;notify('finish',track.config.stunt?`${track.config.stuntFinishLabel||'STUNT COURSE CONQUERED'} · YOU RAN THE IMPOSSIBLE`:'You ran free.');}
  }
  return {state:s,track,step,hit,reset,glideMax,boostMax,magnetRadius:1.25+level('magnet')*.9};
}

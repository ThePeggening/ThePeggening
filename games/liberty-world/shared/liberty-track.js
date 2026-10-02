// Long, deterministic routes; route versioning keeps short-course records intact.
const skybreakPlan=Object.freeze([
  {kind:'straight',length:520,name:'Ignition Causeway',sign:'IGNITION / BUILD SPEED'},
  {kind:'pitch',length:90,pitch:Math.PI/2,lock:true,name:'Wallrise Gate',sign:'VERTICAL WALL / COMMIT'},
  {kind:'straight',length:180,lock:true,name:'Zero Wall'},
  {kind:'pitch',length:90,pitch:-Math.PI/2,lock:true,name:'Sky Shelf Exit'},
  {kind:'straight',length:360,name:'Sky Shelf'},
  {kind:'loop',length:250,pitch:Math.PI*2,yaw:Math.PI*.18,roll:Math.PI*2,lock:true,loop:true,name:'Crown Loop',sign:'CROWN LOOP / NO BRAKES'},
  {kind:'straight',length:240,name:'Halo Link'},
  {kind:'roll',length:300,roll:Math.PI*2,lock:true,name:'Twist Tunnel',sign:'CORKSCREW / HOLD THE LINE'},
  {kind:'straight',length:700,name:'First Void',gaps:[{at:210,length:180,label:'VOID JUMP I'}]},
  {kind:'loop',length:285,pitch:Math.PI*2,yaw:-Math.PI*.32,roll:Math.PI*2,lock:true,loop:true,name:'Broken Halo',sign:'TWISTED HALO'},
  {kind:'straight',length:280,name:'Drop Approach'},
  {kind:'pitch',length:80,pitch:-Math.PI/2,lock:true,name:'Drop Gate',sign:'VERTICAL DROP / STAY ON IT'},
  {kind:'straight',length:210,lock:true,name:'Freefall Wall'},
  {kind:'pitch',length:80,pitch:Math.PI/2,lock:true,name:'Drop Exit'},
  {kind:'straight',length:520,name:'Second Void',gaps:[{at:190,length:180,label:'VOID JUMP II'}]},
  {kind:'loop',length:240,pitch:-Math.PI*2,yaw:Math.PI*.15,roll:-Math.PI*2,lock:true,loop:true,name:'Reverse Crown',sign:'REVERSE LOOP'},
  {kind:'loop',length:260,pitch:Math.PI*2,yaw:Math.PI*.22,roll:Math.PI*2,lock:true,loop:true,name:'Double Crown',sign:'DOUBLE CROWN'},
  {kind:'straight',length:300,name:'Breathing Room'},
  {kind:'roll',length:380,roll:Math.PI*4,lock:true,name:'Double Corkscrew',sign:'DOUBLE CORKSCREW'},
  {kind:'yaw',length:300,yaw:Math.PI*.7,name:'Orbit Bend'},
  {kind:'straight',length:780,name:'Third Void',gaps:[{at:260,length:230,label:'VOID JUMP III'}]},
  {kind:'pitch',length:90,pitch:Math.PI/2,lock:true,name:'Second Wall Gate',sign:'WALL RUN / STRAIGHT UP'},
  {kind:'straight',length:170,lock:true,name:'Second Wall'},
  {kind:'pitch',length:90,pitch:-Math.PI/2,lock:true,name:'Second Wall Exit'},
  {kind:'loop',length:290,pitch:Math.PI*2,yaw:-Math.PI*.28,roll:Math.PI*2,lock:true,loop:true,name:'Spiral Halo',sign:'SPIRAL HALO'},
  {kind:'straight',length:620,name:'Fourth Void',gaps:[{at:210,length:200,label:'VOID JUMP IV'}]},
  {kind:'roll',length:320,roll:-Math.PI*2,lock:true,name:'Counter Corkscrew',sign:'COUNTER TWIST'},
  {kind:'straight',length:900,name:'Fifth Void',gaps:[{at:330,length:280,label:'MEGA VOID'}]},
  {kind:'loop',length:330,pitch:Math.PI*2,yaw:Math.PI*.36,roll:Math.PI*2,lock:true,loop:true,name:'414 Singularity',sign:'414 SINGULARITY'},
  {kind:'yaw',length:300,yaw:-Math.PI*.65,name:'Final Orbit'},
  {kind:'straight',length:1000,name:'Last Impossible Jump',gaps:[{at:360,length:300,label:'FINAL VOID / FLY'}]},
  {kind:'straight',length:600,name:'Freedom Runout',sign:'LAND IT / RUN FREE'}
]);
const skybreakMeta=(()=>{let cursor=0;const sections=[],loops=[],gaps=[],signs=[];for(const spec of skybreakPlan){const start=cursor,end=start+spec.length,section={...spec,start,end,id:sections.length};sections.push(section);if(spec.loop)loops.push([start,Math.max(24,Math.round(spec.length/(Math.PI*2))) ]);for(const gap of spec.gaps||[])gaps.push([start+gap.at,start+gap.at+gap.length,gap.label]);if(spec.sign)signs.push({s:Math.max(8,start-65),text:spec.sign});cursor=end;}return Object.freeze({length:cursor,sections:Object.freeze(sections),loops:Object.freeze(loops),gaps:Object.freeze(gaps),signs:Object.freeze(signs)});})();
const layouts=[
  ['coast','Liberty Coast','01 / ISLAND ODYSSEY',18000,52,24,'Original green run plus a remixed second circuit of jumps, loops and turns'],
  ['skyline','Liberty Skyline','02 / CITY CIRCUIT',9800,56,27,'Glass canyons, rooftop loops and skybridges'],
  ['canyon','Sunstone Canyon','03 / DESERT RUSH',10400,54,29,'Sandstone arches, mesas and desert switchbacks'],
  ['alpine','Frostline Summit','04 / ALPINE EXPEDITION',11000,55,30,'Snowy pines, ice spires and mountain passes'],
  ['volcano','Magma Foundry','05 / VOLCANIC VELOCITY',11800,58,32,'Lava channels, steel gantries and volcanic loops'],
  ['skybreak','Skybreak 414','06 / VERTICAL VOID',skybreakMeta.length,70,42,'Mega jumps, stunt-ring OVERDRIVE, moving sweepers, vertical walls and twisted loops']
];
export const courses=Object.freeze(layouts.map(([id,name,tag,length,speed,radius,description],index)=>{
  if(id==='skybreak')return Object.freeze({id,name,tag,length,speed,description,index,loops:skybreakMeta.loops,loop:skybreakMeta.loops[0],forks:[],gaps:skybreakMeta.gaps.map(([a,b])=>[a,b]),par:Math.round(length/speed*.98),coinGoal:Math.round(length/31),sections:['Ignition','Vertical Spine','Halo Cluster','The Void','Freefall Wall','414 Singularity','Final Flight'],stunt:true,recoverOnCrash:true,springVelocity:22,padBoostSeconds:5.2,boostBonus:52,glideBonus:.8,cameraFar:900,previewDistance:1180});
  const loops=[],forks=[],gaps=[];
  for(let base=0;base<length-1500;base+=1800){loops.push([base+930,radius+(base/1800%2)*3]);forks.push([base+310,base+610]);gaps.push([base+220,base+232],[base+710,base+724],[base+1450,base+1464]);}
  return Object.freeze({id,name,tag,length,speed,description,index,loops,loop:loops[0],forks,gaps,legacyLength:id==='coast'?9000:undefined,par:Math.round(length/speed*.93),coinGoal:Math.round(length/24),sections:id==='coast'?['Original Departure','Original High Road','Original Finish / Remix Gate','Remix Switchbacks','Remix Sky Loops','Remix Wild Run','Final Green Sprint']:['Departure','High Road','Switchback Run','Sky Loop','Wild Frontier','Summit Sprint','Final Stretch']});
}));
export const perks = Object.freeze([
  {id:'magnet',title:'Magnetic personality',short:'Magnet',cost:120,growth:1.9,max:3,kind:'upgrade',effect:l=>`${(1.25+Math.min(3,l)*.9).toFixed(2)} m collection radius`,description:'Pull nearby $PDAI into your trail.'},
  {id:'gasless',title:'Full throttle',short:'Boost',cost:180,growth:1.9,max:3,kind:'upgrade',effect:l=>`${(2.8+Math.min(3,l)*.55).toFixed(2)} s boost · faster recharge`,description:'Hold your speed for longer.'},
  {id:'signature',title:'Spread your wings',short:'Glide',cost:160,growth:1.9,max:3,kind:'upgrade',effect:l=>`${(1.5+Math.min(3,l)*.5).toFixed(1)} s glide`,description:'Float farther after every jump.'},
  {id:'runner-shield',title:'A little insurance',short:'Shield',cost:200,growth:1.9,max:3,kind:'upgrade',effect:l=>`${Math.min(3,l)} automatic dodges per run`,description:'Automatically jump or slide before an obstacle. An actual hit restarts the course.'}
]);
export const disclaimer='Fan-made game. Simulated only. Not financial advice. No real transactions. Nothing here predicts or promises any price.';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function makeFrame(){return {x:0,y:0,z:0,fx:0,fy:0,fz:-1,rx:1,ry:0,rz:0,ux:0,uy:1,uz:0,width:10,loop:false};}
function createSkybreakCourse(config){
  const count=config.length+1,centers=new Float64Array(count*3),fxs=new Float32Array(count),fys=new Float32Array(count),fzs=new Float32Array(count),rxs=new Float32Array(count),rys=new Float32Array(count),rzs=new Float32Array(count),uxs=new Float32Array(count),uys=new Float32Array(count),uzs=new Float32Array(count);
  let x=0,y=38,z=0,yaw=0,pitch=0,roll=0,cursor=0;
  const smooth=t=>t*t*(3-2*t),norm=(x,y,z)=>{const n=Math.hypot(x,y,z)||1;return [x/n,y/n,z/n];};
  function basis(yw,pt,rl){const cp=Math.cos(pt),sp=Math.sin(pt),sy=Math.sin(yw),cy=Math.cos(yw),cr=Math.cos(rl),sr=Math.sin(rl),f=[sy*cp,sp,-cy*cp],r0=[cy,0,sy],u0=[-sy*sp,cp,cy*sp],r=[r0[0]*cr+u0[0]*sr,r0[1]*cr+u0[1]*sr,r0[2]*cr+u0[2]*sr],u=[u0[0]*cr-r0[0]*sr,u0[1]*cr-r0[1]*sr,u0[2]*cr-r0[2]*sr];return {f:norm(...f),r:norm(...r),u:norm(...u)};}
  function store(i,yw,pt,rl){const b=basis(yw,pt,rl);centers.set([x,y,z],i*3);fxs[i]=b.f[0];fys[i]=b.f[1];fzs[i]=b.f[2];rxs[i]=b.r[0];rys[i]=b.r[1];rzs[i]=b.r[2];uxs[i]=b.u[0];uys[i]=b.u[1];uzs[i]=b.u[2];}
  store(0,yaw,pitch,roll);
  for(const sec of skybreakMeta.sections){const sy=yaw,sp=pitch,sr=roll,dy=sec.yaw||0,dp=sec.pitch||0,dr=sec.roll||0,linear=sec.kind==='loop'||sec.kind==='roll';for(let j=1;j<=sec.length;j++){const tm=(j-.5)/sec.length,te=j/sec.length,em=linear?tm:smooth(tm),ee=linear?te:smooth(te),my=sy+dy*em,mp=sp+dp*em,mr=sr+dr*em,b=basis(my,mp,mr);x+=b.f[0];y+=b.f[1];z+=b.f[2];store(cursor+j,sy+dy*ee,sp+dp*ee,sr+dr*ee);}cursor=sec.end;yaw=sy+dy;pitch=sp+dp;roll=sr+dr;}
  const loopMeta=skybreakMeta.sections.filter(s=>s.loop).map((s,id)=>({id,start:s.start,end:s.end,length:s.length,radius:Math.round(s.length/(Math.PI*2)),name:s.name}));
  const locked=skybreakMeta.sections.filter(s=>s.lock),turns=skybreakMeta.sections.filter(s=>s.kind==='yaw').map((s,id)=>({id,start:s.start,end:s.end,from:0,to:s.yaw,direction:Math.sign(s.yaw)}));
  const gapAt=s=>{const g=skybreakMeta.gaps.find(([a,b])=>s>=a&&s<b);return g?[g[0],g[1]]:undefined;},loopAt=(s,padding=0)=>loopMeta.find(l=>s>l.start-padding&&s<l.end+padding),lockedAt=(s,padding=0)=>locked.find(l=>s>l.start-padding&&s<l.end+padding),cornerAt=s=>turns.find(t=>s>=t.start&&s<=t.end),forkAt=()=>undefined;
  function sample(s,route=0,out=makeFrame()){s=clamp(s,0,config.length);const a=Math.floor(s),b=Math.min(a+1,config.length),t=s-a,ix=a*3,jx=b*3,lerp=(A,B)=>A+(B-A)*t;let fx=lerp(fxs[a],fxs[b]),fy=lerp(fys[a],fys[b]),fz=lerp(fzs[a],fzs[b]),fn=Math.hypot(fx,fy,fz)||1;fx/=fn;fy/=fn;fz/=fn;let rx=lerp(rxs[a],rxs[b]),ry=lerp(rys[a],rys[b]),rz=lerp(rzs[a],rzs[b]),dot=rx*fx+ry*fy+rz*fz;rx-=fx*dot;ry-=fy*dot;rz-=fz*dot;const rn=Math.hypot(rx,ry,rz)||1;rx/=rn;ry/=rn;rz/=rn;const ux=ry*fz-rz*fy,uy=rz*fx-rx*fz,uz=rx*fy-ry*fx;Object.assign(out,{x:lerp(centers[ix],centers[jx]),y:lerp(centers[ix+1],centers[jx+1]),z:lerp(centers[ix+2],centers[jx+2]),fx,fy,fz,rx,ry,rz,ux,uy,uz,width:10,loop:!!lockedAt(s)});return out;}
  const sweepCandidates=[1860,3180,4550,6680,7870,9040,10620];
  const hazards=[];for(let s=150,i=0;s<config.length-120;s+=245,i++){if(gapAt(s)||lockedAt(s,65)||skybreakMeta.gaps.some(([a,b])=>s>a-90&&s<b+70)||sweepCandidates.some(q=>Math.abs(q-s)<70))continue;hazards.push({id:hazards.length,s,x:[-2.8,0,2.8][i%3],type:i%3===1?'beam':'barrier',route:0});}
  sweepCandidates.forEach((s,i)=>{if(s<config.length-80&&!gapAt(s)&&!lockedAt(s,65))hazards.push({id:hazards.length,s,x:0,type:'sweep',route:0,motion:'sweep',amp:2.7,speed:1.25+(i%3)*.22,phase:i*1.73});});hazards.sort((a,b)=>a.s-b.s);hazards.forEach((h,i)=>h.id=i);
  const stuntRings=[];let ringId=0;skybreakMeta.gaps.forEach(([a,b],gi)=>{const xs=gi%2?[-1.8,1.8,0]:[1.8,-1.8,0],ys=[5.1,8.4,5.6],ts=[.22,.5,.78];for(let i=0;i<3;i++)stuntRings.push({id:ringId++,s:a+(b-a)*ts[i],x:xs[i],y:ys[i],kind:'air',set:gi});});
  loopMeta.forEach((l,li)=>{for(const [t,x]of [[.34,li%2?1.5:-1.5],[.68,li%2?-1.5:1.5]])stuntRings.push({id:ringId++,s:l.start+l.length*t,x,y:1.35,kind:'loop',set:10+li});});
  const energyGates=[];let gateId=0;for(const sec of locked){for(let s=sec.start+24;s<sec.end-12;s+=42)energyGates.push({id:gateId++,s,style:sec.kind==='roll'?'twist':sec.kind==='loop'?'halo':'wall'});}
  const coins=[];for(let s=18;s<config.length-12;s+=7){const gap=skybreakMeta.gaps.find(([a,b])=>s>=a&&s<b),near=hazards.find(h=>Math.abs(h.s-s)<20),hx=near?.motion==='sweep'?0:near?.x,x=near?(hx===0?-2.8:0):Math.sin(Math.floor(s/110)*1.31)*2.25;let cy=1.1;if(gap){const u=(s-gap[0])/(gap[1]-gap[0]);cy=3+Math.sin(Math.PI*u)*13;}coins.push({id:coins.length,s,x,y:cy,route:0});}
  const items=[],put=(type,s,x=0,extra={})=>{if(s>8&&s<config.length-8)items.push({id:items.length,type,s,x,route:0,y:type==='spring'||type==='dash'||type==='launch'?0:1.4,...extra});};
  for(const [a,b]of skybreakMeta.gaps){put('dash',a-78,0);put('launch',a-30,0,{gapStart:a,gapEnd:b,landing:b+10});put('dash',b+20,0);}
  for(const s of [1450,4920,9210])put('feather',s,0);
  for(let s=600;s<config.length-300;s+=980)if(!gapAt(s)&&!lockedAt(s,80))put(s%1960<900?'shield':'magnet',s,0);
  const checkpoints=[];for(let target=850;target<config.length;target+=850){let s=target;while(s<config.length-80&&(gapAt(s)||lockedAt(s,20)))s+=25;checkpoints.push(Math.round(s));}
  const safeSections=skybreakMeta.sections.filter(s=>!s.lock),stuntSigns=[...skybreakMeta.signs,...skybreakMeta.gaps.flatMap(([a,b,label])=>[{s:Math.max(8,a-125),text:'414 BOOST RAMP / STAY CENTER'},{s:Math.max(8,a-82),text:label||'MEGA GAP'}])];
  function edges(){return {left:-5,right:5,railLeft:true,railRight:true,sep:18};}
  function cuts(start,end,spacing=2){const list=[start,end];for(let s=start+spacing;s<end;s+=spacing)list.push(s);for(const [a,b]of skybreakMeta.gaps)for(const q of [a,b])if(q>start&&q<end)list.push(q);for(const sec of skybreakMeta.sections)for(const q of [sec.start,sec.end])if(q>start&&q<end)list.push(q);return [...new Set(list)].sort((a,b)=>a-b);}
  return {config,hazards,coins,items,stuntRings,energyGates,checkpoints,loops:loopMeta,turns,sample,forkAt,loopAt,lockedAt,cornerAt,edges,loopStart:loopMeta[0].start,loopLength:loopMeta[0].length,gapAt,cuts,halfWidth:()=>5,stuntSigns,safeSections};
}
export function createCourse(id='coast'){
  const config=courses.find(c=>c.id===id)||courses[0];if(config.id==='skybreak')return createSkybreakCourse(config);const city=config.id==='skyline',loops=config.loops.map(([start,radius],id)=>({id,start,radius,length:Math.round(radius*2*Math.PI),end:start+Math.round(radius*2*Math.PI)}));
  const loopAt=(s,padding=0)=>loops.find(l=>s>l.start-padding&&s<l.end+padding),forkAt=s=>config.forks.find(f=>s>=f[0]&&s<=f[1]),gapAt=s=>config.gaps.find(([a,b])=>s>=a&&s<b);
  const turns=[];let heading=0;const baseTurns=[.85,-.8,1.08,-.65,0,-1.05,.72],remixTurns=[-.72,1.02,-.48,.9,-1.1,.35,-.88];const turnStarts=[];if(config.id==='coast'&&config.legacyLength){for(let start=90;start<config.legacyLength-200;start+=340)turnStarts.push({start,remix:false});for(let start=config.legacyLength+90;start<config.length-200;start+=340)turnStarts.push({start,remix:true});}else for(let start=90;start<config.length-200;start+=340)turnStarts.push({start,remix:false});let remixIndex=0;for(let i=0;i<turnStarts.length;i++){const {start,remix}=turnStarts[i],end=start+180;if(loops.some(l=>start<l.end+70&&end>l.start-70))continue;const to=remix?remixTurns[(remixIndex++*3+1)%remixTurns.length]:baseTurns[(i+config.index)%baseTurns.length];turns.push({id:turns.length,start,end,from:heading,to,direction:Math.sign(to-heading)});heading=to;}
  function yaw(s){let h=0;for(const t of turns){if(s<t.start)break;if(s>=t.end)h=t.to;else{const u=(s-t.start)/(t.end-t.start);return t.from+(t.to-t.from)*u*u*(3-2*u);}}return h;}
  const cornerAt=s=>turns.find(t=>s>=t.start&&s<=t.end&&Math.abs(t.to-t.from)>.35);
  const centers=new Float64Array((config.length+1)*3),angles=new Float32Array(config.length+1);let x=0,z=0,removed=0,cursor=0;
  const height=q=>(city?18:config.id==='alpine'?25:10)+(city?14:9)*Math.sin(q/280)**2;
  centers[1]=height(0);
  function ground(end){for(let s=cursor+1;s<=end;s++){const h=yaw(s-.5);x+=Math.sin(h);z-=Math.cos(h);centers.set([x,height(s-removed),z],s*3);angles[s]=yaw(s);}cursor=end;}
  for(const l of loops){ground(l.start);const ax=x,az=z,h=yaw(l.start),base=height(l.start-removed);l.yaw=h;
    for(let j=1;j<=l.length;j++){const t=j/l.length,theta=t*Math.PI*2;centers.set([ax+Math.sin(h)*l.radius*Math.sin(theta)+Math.cos(h)*12*t,base+l.radius*(1-Math.cos(theta)),az-Math.cos(h)*l.radius*Math.sin(theta)+Math.sin(h)*12*t],(l.start+j)*3);angles[l.start+j]=h;}
    x=centers[l.end*3];z=centers[l.end*3+2];removed+=l.length;cursor=l.end;
  }ground(config.length);
  function sample(s,route=0,out=makeFrame()){
    s=clamp(s,0,config.length);const a=Math.floor(s),b=Math.min(a+1,config.length),t=s-a,active=loopAt(s),h=active?active.yaw:angles[a]+(angles[b]-angles[a])*t;let removed=0;for(const l of loops)removed+=clamp(s-l.start,0,l.length);
    const q=s-removed,dy=(city?28:18)/280*Math.sin(q/280)*Math.cos(q/280),theta=active?(s-active.start)/active.length*Math.PI*2:0,co=active?Math.cos(theta):1,si=active?Math.sin(theta):dy,n=active?1:Math.hypot(1,dy),fx=Math.sin(h),fz=-Math.cos(h);
    Object.assign(out,{x:centers[a*3]*(1-t)+centers[b*3]*t,y:centers[a*3+1]*(1-t)+centers[b*3+1]*t,z:centers[a*3+2]*(1-t)+centers[b*3+2]*t,fx:fx*co/n,fy:si/n,fz:fz*co/n,rx:Math.cos(h),ry:0,rz:Math.sin(h),ux:-fx*si/n,uy:co/n,uz:-fz*si/n,width:10,loop:!!active});
    const fork=forkAt(s);if(route&&fork){const u=(s-fork[0])/(fork[1]-fork[0]),v=Math.sin(Math.PI*u)**2,lift=Math.max(0,(v-.55)/.45)**2;out.x+=out.rx*v*18;out.z+=out.rz*v*18;out.y+=lift*(city?16:10);out.width=8;}return out;
  }
  const hazards=[];for(let s=115,i=0;s<config.length-110;s+=city?112:123,i++){
    if(config.id==='coast'&&config.legacyLength&&s>=config.legacyLength-110&&s<config.legacyLength)continue;if(config.gaps.some(([a,b])=>s>a-65&&s<b+65)||loopAt(s,80)||config.forks.some(([a,b])=>Math.abs(s-a)<60||Math.abs(s-b)<60))continue;
    hazards.push({id:hazards.length,s,x:[-2.8,0,2.8][i%3],type:i%3===1?'beam':'barrier',route:0});
    if(forkAt(s))hazards.push({id:hazards.length,s:s+15,x:0,type:'barrier',route:1});
  }
  const coins=[];for(let s=20;s<config.length-12;s+=6){if(config.id==='coast'&&config.legacyLength&&s>=config.legacyLength-12&&s<config.legacyLength)continue;const gap=config.gaps.find(([a,b])=>s>a-14&&s<b+14),fork=forkAt(s),near=hazards.find(h=>h.route===0&&Math.abs(h.s-s)<20),x=near?(near.x===0?-2.8:0):Math.sin(Math.floor(s/84)*1.7)*2.4;
    coins.push({id:coins.length,s,x,y:gap?2.5:1.1,route:0});if(fork&&s>fork[0]+25&&s<fork[1]-20)coins.push({id:coins.length,s,x:0,y:1.15,route:1});}
  const items=[],put=(type,s,x=0,route=0)=>items.push({id:items.length,type,s,x,route,y:type==='spring'||type==='dash'?0:1.4});
  for(let s=150,i=0;s<config.length-100;s+=520,i++){if(config.id==='coast'&&config.legacyLength&&s>=config.legacyLength-100&&s<config.legacyLength)continue;if(!loopAt(s,100)&&!gapAt(s)&&!hazards.some(h=>Math.abs(h.s-s)<35))put(['dash','magnet','shield','dash'][i%4],s,[-2.6,0,2.6,0][i%4]);}
  config.gaps.forEach(([a],i)=>{if(i%3===2)put('spring',a-40,0);});
  for(let i=0;i<3;i++){const featherForks=config.id==='coast'&&config.legacyLength?config.forks.filter(f=>f[0]<config.legacyLength):config.forks,fork=featherForks[Math.round(i*(featherForks.length-1)/2)];let pick=Math.round((fork[0]+fork[1])/2),best=-Infinity;for(let d=fork[0]+80;d<fork[1]-65;d+=5){const clearance=Math.min(150,...hazards.filter(h=>h.route===1).map(h=>Math.abs(h.s-d))),value=clearance-Math.abs(d-(fork[0]+fork[1])/2)*.12;if(value>best){pick=d;best=value;}}put('feather',pick,0,1);}
  const checkpoints=[];for(let s=1000;s<config.length;s+=1000)checkpoints.push(s);
  // Shared junctions have one outside perimeter. Interior curbs/rails never cross a playable deck.
  function edges(s,route=0){const fork=forkAt(s),sep=fork?18*Math.sin(Math.PI*(s-fork[0])/(fork[1]-fork[0]))**2:18;
    return route?{left:fork&&sep<9?clamp(5-sep,-4,4):-4,right:4,railLeft:!fork||sep>=9,railRight:!fork||sep>1,sep}:{left:-5,right:5,railLeft:true,railRight:!fork||sep<=1||sep>=9,sep};}
  function cuts(start,end,spacing=2){const list=[start,end];for(let s=start+spacing;s<end;s+=spacing)list.push(s);for(const [a,b]of config.gaps)for(const s of [a,b])if(s>start&&s<end)list.push(s);for(const [a,b]of config.forks)for(const sep of [1,9]){const u=Math.asin(Math.sqrt(sep/18))/Math.PI;for(const s of [a+(b-a)*u,b-(b-a)*u])if(s>start&&s<end)list.push(s);}for(const l of loops)for(const s of [l.start,l.end])if(s>start&&s<end)list.push(s);return [...new Set(list)].sort((a,b)=>a-b);}
  return {config,hazards,coins,items,checkpoints,loops,turns,sample,forkAt,loopAt,cornerAt,edges,loopStart:loops[0].start,loopLength:loops[0].length,gapAt,cuts,halfWidth:route=>route?4:5};
}

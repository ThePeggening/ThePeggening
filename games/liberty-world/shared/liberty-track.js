// Long, deterministic routes; route versioning keeps short-course records intact.
const layouts=[
  ['coast','Liberty Coast','01 / ISLAND ODYSSEY',9000,52,24,'Palms, ocean loops and island shortcuts'],
  ['skyline','Liberty Skyline','02 / CITY CIRCUIT',9800,56,27,'Glass canyons, rooftop loops and skybridges'],
  ['canyon','Sunstone Canyon','03 / DESERT RUSH',10400,54,29,'Sandstone arches, mesas and desert switchbacks'],
  ['alpine','Frostline Summit','04 / ALPINE EXPEDITION',11000,55,30,'Snowy pines, ice spires and mountain passes'],
  ['volcano','Magma Foundry','05 / VOLCANIC VELOCITY',11800,58,32,'Lava channels, steel gantries and volcanic loops']
];
export const courses=Object.freeze(layouts.map(([id,name,tag,length,speed,radius,description],index)=>{
  const loops=[],forks=[],gaps=[];
  for(let base=0;base<length-1500;base+=1800){loops.push([base+930,radius+(base/1800%2)*3]);forks.push([base+310,base+610]);gaps.push([base+220,base+232],[base+710,base+724],[base+1450,base+1464]);}
  return Object.freeze({id,name,tag,length,speed,description,index,loops,loop:loops[0],forks,gaps,par:Math.round(length/speed*.93),coinGoal:Math.round(length/24),sections:['Departure','High Road','Switchback Run','Sky Loop','Wild Frontier','Summit Sprint','Final Stretch']});
}));
export const perks = Object.freeze([
  {id:'magnet',title:'Magnetic personality',short:'Magnet',cost:120,growth:1.9,max:3,kind:'upgrade',effect:l=>`${(1.25+Math.min(3,l)*.9).toFixed(2)} m collection radius`,description:'Pull nearby $PDAI into your trail.'},
  {id:'gasless',title:'Full throttle',short:'Boost',cost:180,growth:1.9,max:3,kind:'upgrade',effect:l=>`${(2.8+Math.min(3,l)*.55).toFixed(2)} s boost · faster recharge`,description:'Hold your speed for longer.'},
  {id:'signature',title:'Spread your wings',short:'Glide',cost:160,growth:1.9,max:3,kind:'upgrade',effect:l=>`${(1.5+Math.min(3,l)*.5).toFixed(1)} s glide`,description:'Float farther after every jump.'},
  {id:'runner-shield',title:'A little insurance',short:'Shield',cost:200,growth:1.9,max:3,kind:'upgrade',effect:l=>`${Math.min(3,l)} automatic dodges per run`,description:'Automatically jump or slide before an obstacle. An actual hit restarts the course.'}
]);
export const disclaimer='Fan-made game. Simulated only. Not financial advice. No real transactions. Nothing here predicts or promises any price.';
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function makeFrame(){return {x:0,y:0,z:0,fx:0,fy:0,fz:-1,rx:1,rz:0,ux:0,uy:1,uz:0,width:10,loop:false};}
export function createCourse(id='coast'){
  const config=courses.find(c=>c.id===id)||courses[0],city=config.id==='skyline',loops=config.loops.map(([start,radius],id)=>({id,start,radius,length:Math.round(radius*2*Math.PI),end:start+Math.round(radius*2*Math.PI)}));
  const loopAt=(s,padding=0)=>loops.find(l=>s>l.start-padding&&s<l.end+padding),forkAt=s=>config.forks.find(f=>s>=f[0]&&s<=f[1]),gapAt=s=>config.gaps.find(([a,b])=>s>=a&&s<b);
  const turns=[];let heading=0;for(let start=90,i=0;start<config.length-200;start+=340,i++){const end=start+180;if(loops.some(l=>start<l.end+70&&end>l.start-70))continue;const to=[.85,-.8,1.08,-.65,0,-1.05,.72][(i+config.index)%7];turns.push({id:turns.length,start,end,from:heading,to,direction:Math.sign(to-heading)});heading=to;}
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
    Object.assign(out,{x:centers[a*3]*(1-t)+centers[b*3]*t,y:centers[a*3+1]*(1-t)+centers[b*3+1]*t,z:centers[a*3+2]*(1-t)+centers[b*3+2]*t,fx:fx*co/n,fy:si/n,fz:fz*co/n,rx:Math.cos(h),rz:Math.sin(h),ux:-fx*si/n,uy:co/n,uz:-fz*si/n,width:10,loop:!!active});
    const fork=forkAt(s);if(route&&fork){const u=(s-fork[0])/(fork[1]-fork[0]),v=Math.sin(Math.PI*u)**2,lift=Math.max(0,(v-.55)/.45)**2;out.x+=out.rx*v*18;out.z+=out.rz*v*18;out.y+=lift*(city?16:10);out.width=8;}return out;
  }
  const hazards=[];for(let s=115,i=0;s<config.length-110;s+=city?112:123,i++){
    if(config.gaps.some(([a,b])=>s>a-65&&s<b+65)||loopAt(s,80)||config.forks.some(([a,b])=>Math.abs(s-a)<60||Math.abs(s-b)<60))continue;
    hazards.push({id:hazards.length,s,x:[-2.8,0,2.8][i%3],type:i%3===1?'beam':'barrier',route:0});
    if(forkAt(s))hazards.push({id:hazards.length,s:s+15,x:0,type:'barrier',route:1});
  }
  const coins=[];for(let s=20;s<config.length-12;s+=6){const gap=config.gaps.find(([a,b])=>s>a-14&&s<b+14),fork=forkAt(s),near=hazards.find(h=>h.route===0&&Math.abs(h.s-s)<20),x=near?(near.x===0?-2.8:0):Math.sin(Math.floor(s/84)*1.7)*2.4;
    coins.push({id:coins.length,s,x,y:gap?2.5:1.1,route:0});if(fork&&s>fork[0]+25&&s<fork[1]-20)coins.push({id:coins.length,s,x:0,y:1.15,route:1});}
  const items=[],put=(type,s,x=0,route=0)=>items.push({id:items.length,type,s,x,route,y:type==='spring'||type==='dash'?0:1.4});
  for(let s=150,i=0;s<config.length-100;s+=520,i++)if(!loopAt(s,100)&&!gapAt(s)&&!hazards.some(h=>Math.abs(h.s-s)<35))put(['dash','magnet','shield','dash'][i%4],s,[-2.6,0,2.6,0][i%4]);
  config.gaps.forEach(([a],i)=>{if(i%3===2)put('spring',a-40,0);});
  for(let i=0;i<3;i++){const fork=config.forks[Math.round(i*(config.forks.length-1)/2)];let pick=Math.round((fork[0]+fork[1])/2),best=-Infinity;for(let d=fork[0]+80;d<fork[1]-65;d+=5){const clearance=Math.min(150,...hazards.filter(h=>h.route===1).map(h=>Math.abs(h.s-d))),value=clearance-Math.abs(d-(fork[0]+fork[1])/2)*.12;if(value>best){pick=d;best=value;}}put('feather',pick,0,1);}
  const checkpoints=[];for(let s=1000;s<config.length;s+=1000)checkpoints.push(s);
  // Shared junctions have one outside perimeter. Interior curbs/rails never cross a playable deck.
  function edges(s,route=0){const fork=forkAt(s),sep=fork?18*Math.sin(Math.PI*(s-fork[0])/(fork[1]-fork[0]))**2:18;
    return route?{left:fork&&sep<9?clamp(5-sep,-4,4):-4,right:4,railLeft:!fork||sep>=9,railRight:!fork||sep>1,sep}:{left:-5,right:5,railLeft:true,railRight:!fork||sep<=1||sep>=9,sep};}
  function cuts(start,end,spacing=2){const list=[start,end];for(let s=start+spacing;s<end;s+=spacing)list.push(s);for(const [a,b]of config.gaps)for(const s of [a,b])if(s>start&&s<end)list.push(s);for(const [a,b]of config.forks)for(const sep of [1,9]){const u=Math.asin(Math.sqrt(sep/18))/Math.PI;for(const s of [a+(b-a)*u,b-(b-a)*u])if(s>start&&s<end)list.push(s);}for(const l of loops)for(const s of [l.start,l.end])if(s>start&&s<end)list.push(s);return [...new Set(list)].sort((a,b)=>a-b);}
  return {config,hazards,coins,items,checkpoints,loops,turns,sample,forkAt,loopAt,cornerAt,edges,loopStart:loops[0].start,loopLength:loops[0].length,gapAt,cuts,halfWidth:route=>route?4:5};
}

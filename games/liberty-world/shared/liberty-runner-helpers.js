// Runner-only helpers. No changes to Valley or Ghost Route input/physics.
export const RUNNER_RULES='runner-r12-lives-objectives';
export const MPH=2.2369362921;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const smooth01=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export const perkLevel=v=>clamp(Math.floor(Number.isFinite(v)?v:0),0,10);
export function perkStats(upgrades={}){
  const m=perkLevel(upgrades.magnet),b=perkLevel(upgrades.gasless),g=perkLevel(upgrades.signature),shield=perkLevel(upgrades['runner-shield']);
  return {magnet:1.25+Math.min(m,3)*.9+Math.max(0,m-3)*.2,boost:2.8+Math.min(b,3)*.55+Math.max(0,b-3)*.25,glide:1.5+Math.min(g,3)*.5+Math.max(0,g-3)*.2,recharge:9+b*2,shield};
}
// Full downward pull only; diagonal/horizontal steering must never trigger crouch.
export function slidePull(x,z,latched=false){return z>=(latched?.72:.92)&&z>Math.abs(x)*1.65;}
// A C1-continuous launch arc: both endpoints have zero slope. It owns height,
// rather than clamping gravity to a minimum and snapping to the road at the end.
export function rampPose(distance,start,end,peak,entryY=0){
  const span=Math.max(1,end-start),u=clamp((distance-start)/span,0,1),a=u*(1-u);
  return {u,y:Math.max(0,entryY)*(1-smooth01(u))+16*peak*a*a,dy:(32*peak*a*(1-2*u)-Math.max(0,entryY)*6*a)/span};
}
export function makeGhostRecorder(){
  const samples=[];let next=0;
  return {sample(s,force=false){if(!force&&s.age<next)return;next=s.age+.25;const row=[+s.age.toFixed(3),+s.distance.toFixed(2),+s.x.toFixed(2),+s.y.toFixed(2),s.route,s.slide>0?1:0];if(samples.length&&row[0]===samples.at(-1)[0])samples[samples.length-1]=row;else if(samples.length<2400)samples.push(row);},finish(s,length){this.sample(s,true);return s.success&&s.hits===0&&s.recoveries===0&&samples.length>4?{version:1,rules:RUNNER_RULES,length,time:+s.age.toFixed(3),samples}:null;}};
}
export function validGhost(value,length){
  if(!value||value.version!==1||value.rules!==RUNNER_RULES||value.length!==length||!Number.isFinite(value.time)||value.time<=0||!Array.isArray(value.samples)||value.samples.length<5||value.samples.length>2400)return null;
  let time=-1,d=-1;for(const row of value.samples){if(!Array.isArray(row)||row.length!==6||!row.every(Number.isFinite)||row[0]<=time||row[1]<d||row[1]>length+.1||Math.abs(row[2])>6||row[3]<-6||row[3]>100||![0,1].includes(row[4])||![0,1].includes(row[5]))return null;time=row[0];d=row[1];}
  return Math.abs(d-length)<.1&&Math.abs(time-value.time)<.1?value:null;
}
export function ghostAt(ghost,time){
  if(!ghost||time<0||time>ghost.time)return null;const rows=ghost.samples;let lo=0,hi=rows.length-1;
  while(lo<hi){const mid=(lo+hi+1)>>>1;if(rows[mid][0]<=time)lo=mid;else hi=mid-1;}
  const a=rows[lo],b=rows[Math.min(lo+1,rows.length-1)],u=clamp((time-a[0])/Math.max(.001,b[0]-a[0]),0,1);
  return {distance:a[1]+(b[1]-a[1])*u,x:a[2]+(b[2]-a[2])*u,y:a[3]+(b[3]-a[3])*u,route:u<.5?a[4]:b[4],slide:a[5]};
}

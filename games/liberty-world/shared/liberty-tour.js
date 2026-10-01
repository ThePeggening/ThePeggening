import {courses} from './liberty-track.js';
// The R4 tour has its own records; R1-R3 times and every campaign field are preserved.
export const freshTour=()=>({version:4,records:{},claimed:[],daily:{},trail:'pulse'});
export function dailyChallenge(date=new Date()){
  const key=date.toISOString().slice(0,10),day=Math.floor(Date.parse(key)/86400000),kind=day%3,dailyCourses=courses.filter(c=>!c.stunt);
  return {key,map:dailyCourses[day%dailyCourses.length].id,kind,title:['Coin chase','Keep your flow','Score attack'][kind],description:['Finish with 500 coins','Finish with at most 3 hits','Finish with 100,000 points'][kind],reward:200};
}
export function tourGoals(config,s){return [{id:'coins',title:`Collect ${config.coinGoal} coins`,done:s.coins>=config.coinGoal,value:`${s.coins}/${config.coinGoal}`},{id:'feathers',title:config.stunt?'Find all 3 Skybreak feathers':'Find all 3 high-route feathers',done:s.feathers>=3,value:`${s.feathers}/3`},{id:'time',title:`Finish under ${config.par}s`,done:s.age<=config.par,value:`${s.age.toFixed(1)}s / ${config.par}s`}];}
export function settleTour(previous,config,s,success,daily=null){
  const tour=structuredClone(previous||freshTour()),goals=tourGoals(config,s),stars=success?goals.filter(g=>g.done).length:0,rank=success?(stars===3&&s.hits===0?'S':stars>=2?'A':stars>=1?'B':'C'):'—';let bonus=0,newBest=false;const earned=[];
  if(success){for(const g of goals)if(g.done){const id=config.id+':'+g.id;if(!tour.claimed.includes(id)){tour.claimed.push(id);bonus+=100;earned.push(g.title);}}
    const old=tour.records[config.id];newBest=!old||s.age<old.time;tour.records[config.id]={time:newBest?Math.round(s.age*100)/100:old.time,score:Math.max(old?.score||0,Math.floor(s.score)),stars:tour.claimed.filter(id=>id.startsWith(config.id+':')).length,rank:!old||'SABC'.indexOf(rank)<'SABC'.indexOf(old.rank)?rank:old.rank,splits:newBest?s.splits.slice():old.splits||[],finishes:(old?.finishes||0)+1};
    if(daily&&daily.map===config.id&&!tour.daily[daily.key]&&[s.coins>=500,s.hits<=3,s.score>=100000][daily.kind]){tour.daily[daily.key]=true;bonus+=daily.reward;earned.push('Daily challenge');const keys=Object.keys(tour.daily).sort();for(const key of keys.slice(0,-60))delete tour.daily[key];}
  }
  return {tour,goals,rank,stars,bonus,newBest,earned};
}
export const trailChoices=[{id:'pulse',name:'Pulse cyan',need:0},{id:'gold',name:'Golden freedom',need:3},{id:'magenta',name:'Magenta comet',need:8},{id:'rainbow',name:'Rainbow champion',need:15}];
export const medalCount=tour=>Object.values(tour?.records||{}).reduce((n,r)=>n+(r.stars||0),0);

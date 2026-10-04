import {segmentDistance} from './valley-terrain.js';
export const clubCamp=Object.freeze({x:-48,z:42});
export const clubStart=Object.freeze({x:-46,z:34});
const gate=(x,z,jump=false)=>Object.freeze({x,z,jump});
export const clubCourses=Object.freeze([
 {id:'grove',title:'Grove hop',description:'A winding woodland loop with two low jump gates.',gold:24,silver:36,gates:[gate(-48,23),gate(-36,12),gate(-22,20,true),gate(-12,36),gate(-22,48,true),gate(-39,55),gate(-46,34)]},
 {id:'harbor',title:'Harbor ribbon',description:'Follow the near bank, round the loading dock and race home.',gold:44,silver:65,gates:[gate(-30,26),gate(-8,12),gate(14,-4),gate(28,-18),gate(28,-38),gate(18,-49,true),gate(-3,-35),gate(-26,-10),gate(-46,34)]},
 {id:'market',title:'Market meander',description:'A longer lap around the festival approaches with two jump gates.',gold:35,silver:55,gates:[gate(-30,48),gate(-13,64,true),gate(-12,83),gate(8,85),gate(18,70,true),gate(9,53),gate(-11,45),gate(-30,40),gate(-46,34)]}
]);
export const clubSlots=Object.freeze([{id:'west',title:'West pad',x:-55,z:44},{id:'north',title:'North pad',x:-51,z:49},{id:'east',title:'East pad',x:-43,z:47},{id:'south',title:'South pad',x:-44,z:40}]);
export const clubFurnishings=Object.freeze([
 {id:'bench',title:'Trail bench',rule:'Yours from the start',unlocked:()=>true},
 {id:'lantern',title:'Camp lantern',rule:'Finish any course',unlocked:s=>s.finished>=1},
 {id:'planter',title:'Wildflower planter',rule:'Finish two different courses',unlocked:s=>s.finished>=2},
 {id:'picnic',title:'Picnic table',rule:'Finish all three courses',unlocked:s=>s.finished>=3},
 {id:'pennant',title:'Club pennants',rule:'Earn silver on any course',unlocked:s=>s.silver>=1},
 {id:'telescope',title:'Stargazer telescope',rule:'Earn silver on all three courses',unlocked:s=>s.silver>=3}
]);
export const medalFor=(course,time)=>!Number.isFinite(time)||time<=0?0:time<=course.gold?3:time<=course.silver?2:1;
export const medalName=rank=>['Unrun','Bronze','Silver','Gold'][rank]||'Unrun';
export function clubSummary(best){const ranks=clubCourses.map(c=>medalFor(c,best[c.id]));return {finished:ranks.filter(n=>n>0).length,silver:ranks.filter(n=>n>=2).length,gold:ranks.filter(n=>n===3).length};}
export function clubClear(x,z){if(Math.hypot(x-clubCamp.x,z-clubCamp.z)<12)return true;for(const course of clubCourses){let last=clubStart;for(const p of course.gates){if(segmentDistance(x,z,last.x,last.z,p.x,p.z)<4.5)return true;last=p;}}return false;}
export function clubNote(summary){return summary.finished===0?'Moss left a bench and a note: “A path feels different when it leads back to a place of your own.”':summary.finished<3?'Moss: “I saw your course mark on the board. Try another path; we can make room for flowers and a picnic.”':summary.silver<3?'Moss: “Every path leads home now. Your picnic table is ready. The telescope is waiting for three silver medals.”':'Moss: “You made a meeting place out of a clearing. Put up the telescope, move the benches, and make yourself at home.”';}

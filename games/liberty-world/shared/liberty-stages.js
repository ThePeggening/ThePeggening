// Shared crossover presentation. These IDs and completion criteria preserve existing saves.
export const libertyStages=Object.freeze([
 {n:1,id:'LW_STAGE_01',milestone:'feather-1',place:'Swap Harbor',theme:'Hope',task:'Help Nessa reconnect the harbor and route the practice cargo.',lesson:'A clear destination gives a route its purpose.'},
 {n:2,id:'LW_STAGE_02',milestone:'feather-2',place:'Shield Keep',theme:'Safety',task:'Help Liberty carry a practice parcel along the sheltered path.',lesson:'A safer journey begins by deciding what needs protection.'},
 {n:3,id:'LW_STAGE_03',milestone:'feather-3',place:'Pool Springs',theme:'Growth',task:'Help Moss share the springs with the orchard.',lesson:'Shared reserves matter when more than one neighbour needs them.'},
 {n:4,id:'LW_STAGE_04',milestone:'feather-4',place:'Stables Foundry',theme:'Stability',task:'Help Ivo restore the Foundry valves and its steady rhythm.',lesson:'Read the whole system, not just one promising gauge.'},
 {n:5,id:'LW_STAGE_05',milestone:'feather-5',place:'HyperMarket Bazaar',theme:'Courage',task:'Help Tavi resolve the festival question using its written rule.',lesson:'Evidence matters more than the loudest prediction.'},
 {n:6,id:'LW_STAGE_06',milestone:'feather-6',place:'ZKX Vault + Observatory',theme:'Independence',task:'Help Orin trace the fictional receipt to the Observatory.',lesson:'A delivery record tells you what happened, not what must happen next.'},
 {n:7,id:'LW_STAGE_07',milestone:'finale-complete',place:"Liberty's Summit",theme:'Anticipation',task:'Help Rook reach the summit and finish the Valley finale.',lesson:'The seven lessons reconnect a community. There is no promised price outcome.'}
]);
export const stageFor=id=>libertyStages.find(s=>s.id===id)||libertyStages[0];
export function stageEarned(state,stage){if(!state)return false;return stage.n===7?state.finaleComplete===true:Array.isArray(state.feathers)&&state.feathers.includes(stage.milestone)||Array.isArray(state.completed)&&state.completed.includes('chapter-'+stage.n);}
export function stageBrief(state,stage){
 const chapter=Number.isFinite(state?.chapter)?state.chapter:-1,done=stageEarned(state,stage);
 const current=chapter<0?'Prologue · meet Pulse Guy':chapter>=7?'The Valley finale':`${chapter+1} · ${libertyStages[chapter].place}`;
 return {done,current,catchUp:!done&&chapter<stage.n-1,heading:done?'ATROPA ASSIGNMENT COMPLETE':`ATROPA ASSIGNMENT ${stage.n} · ${stage.theme.toUpperCase()}`,task:stage.task,explanation:done?stage.lesson:chapter<stage.n-1?`Your Liberty adventure is at ${current}. Follow the main story through the earlier chapters, then continue to ${stage.place}. Nothing is skipped or awarded automatically.`:`Continue your saved Liberty adventure at ${stage.place}. This assignment is separate from optional arcade records.`};
}

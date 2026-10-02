// Authored additions reuse existing districts, trails, residents and closing scenes.
export const communityPlaces=Object.freeze({
 foundry:{start:{x:111,z:5},reserve:{x:116,z:13},route:{x:119,z:13},load:{x:122,z:13},report:{x:111,z:5}},
 market:{start:{x:0,z:86},rule:{x:-8,z:96},predict:{x:-8,z:96},fruit:{x:-11,z:91},keeper:{x:-9,z:107},tower:{x:9,z:107},resolve:{x:0,z:86}},
 vault:{start:{x:-98,z:77},seal:{x:-98,z:77},archive:{x:-80,z:64},harbor:{x:36,z:-25},shore:{x:84,z:-15},deliver:{x:147,z:-135}},
 summit:{start:{x:-60,z:-82},supply:{x:-43,z:-92},repair:{x:-83,z:-108},jump:{x:-110,z:-140},friend:{x:-130,z:-165},finish:{x:-148,z:-184}}
});
export const communityRoutes=Object.freeze([
 {id:'short',name:'Short pipe',input:30,gross:24,routeCost:0,otherCost:6,capacity:50},
 {id:'harbor',name:'Harbor relay',input:30,gross:25,routeCost:1,otherCost:3,capacity:50},
 {id:'thin',name:'Small reserve',input:30,gross:26,routeCost:1,otherCost:2,capacity:8}
]);
export const festivalEvidence=Object.freeze({
 fruit:{title:'Moss’s fruit stall',text:'A crate from the watered orchard arrived after the first bell. The stallkeeper heard another bell later. A memory of “a bell” cannot identify which event settled Tavi’s question.'},
 keeper:{title:'Bellkeeper’s shift note',text:'The second bell at 18:03 was the shift-change bell. The festival rule concerns the FIRST rain bell. This note explains the apparent contradiction but is not the signed event log.'},
 tower:{title:'Signed tower record · FESTIVAL-005',text:'EVENT: FESTIVAL-005. FIRST RAIN BELL: 17:48. SUNSET: 18:00. SOURCE: Tower event ledger, sealed before resolution. Compare this event and time with the rule written before the prediction.'}
});
export const vaultProofs=Object.freeze({archive:{stamp:'A-17',next:'Swap Harbor dispatch',text:'Archive entry: LV-006 · checksum 7C6 · sealed route to the Observatory. Next accepted stamp: H-04.'},harbor:{stamp:'H-04',next:'Far-shore receiving post',text:'Harbor dispatch: LV-006 · checksum 7C6 · received from A-17. The parcel remained sealed on Nessa’s rebuilt crossing. Next accepted stamp: C-09.'},shore:{stamp:'C-09',next:'Observatory',text:'Far-shore receipt: LV-006 · checksum 7C6 · received from H-04. The Observatory can verify this chain without reading the parcel’s contents.'}});
export const neighborWork=Object.freeze({
 'moss-seeds':{mode:'plant',title:'Three little seeds',steps:[{x:28,z:76,label:'Plant the first seed by the orchard path'},{x:31,z:72,label:'Plant a second seed in the lower bed'},{x:34,z:78,label:'Plant the last seed in the upper bed'}],hint:'Plant each seed where the gold trail ends. The later water trial will help this orchard grow.'},
 'ivo-tools':{mode:'repair',title:'Borrowed tools',steps:[{x:124,z:27,label:'Find Ivo’s tool roll'},{x:119,z:13,label:'Repair the Foundry feed joint'}],hint:'Use the tool roll to align both halves of the joint; the notches must face one another.'},
 'orin-map':{mode:'trace',title:'A map without names',steps:[{x:-80,z:64,label:'Inspect the archive’s public route marker'},{x:-88,z:70,label:'Match the anonymous route at the waypost'}],hint:'Match the route symbol, not a resident’s private details. The archive stamp is a crescent.'}
});
export const communityLocations=[...Object.values(communityPlaces).flatMap(x=>Object.values(x)),...Object.values(neighborWork).flatMap(x=>x.steps)];
export function residentReaction(state,name){const has=n=>state.feathers.includes('feather-'+n);return ({Nessa:has(1)?'The bridge is open. Those reserve crates for Moss finally reached the other shore.':'The bridge still needs its first successful delivery.',Moss:has(3)?'The orchard has water, and Tavi has fruit for the festival. You left enough for tomorrow.':has(1)?'Nessa has reopened the route. Now I need to learn how to share what arrives.':'There are seeds here. I am still waiting for the harbor supplies.',Ivo:has(4)?'The valves are steady. Tavi’s opening bell can finally have reliable power.':has(3)?'The orchard is ready. The Foundry must keep its rhythm if the festival is to begin.':'I keep looking at one dial and missing what the rest of the machine needs.',Tavi:has(5)?'Moss brought fruit. Ivo restored the power. The record settled the question—not the loudest voice.':has(4)?'The Foundry is steady. Help me settle the festival question from evidence.':'A festival needs a working community, not just a hopeful prediction.',Orin:has(6)?'The delivery is verified, and the letter is still sealed. That is enough.':has(5)?'The festival is open. I have one private parcel and a public route to check.':'Privacy should protect a journey, not prevent it.',Rook:has(7)?'There is a place on the summit for the next friend. No promise was needed.':has(6)?'Orin’s records are in order. Bring the lessons to the unfinished path.':'The notice still says COMING. A drawing of a road is not a finished road.'})[name]||'There is always something small we can do for a neighbour.';}

// Spatial interaction and checkpoint checks in the host shim, not a renderer.
const assert=require('node:assert/strict'),{setup}=require('./test-maria-414-source.cjs');
const native={v:1,complete:true,step:4,inside:false,hasRifles:true,rewarded:true};
for(const mirror of [false,true]){
 const p=mirror?'sommiMirror414':'maria414',key=mirror?'atropa_sommi_414_same_night_v1':'atropa_maria_414_reclaimed_v1';
 const make=saved=>{const h=setup(saved,{mirror,skin:mirror?'sommi':'maria-414',native});h.game[p+'Start']();if(h.game[p+'Cine'])h.game[p+'Cine'].el.children.at(-1).onclick();return h;};
 const q=h=>h.context['__'+p+'Quest'].read();
 const go=(h,it)=>{h.game.playerPos.copy(it.pos);h.game.interact(it);};
 const button=(h,label)=>{const b=h.doc.getElementById(p+'-dialog').children[0].children.find(x=>x.tagName==='button'&&x.textContent===label);assert.ok(b,'Missing button '+label);b.onclick();};
 const reload=h=>{h.game[p+'Pause']();return make(JSON.parse(h.storage.get(key)));};
 let h=make({v:1,started:true,step:1,seen:[0]});
 go(h,h.game[p+'World'].nodeMeshes.get(1).it);button(h,'FOLLOW THE RECORDINGS');assert.equal(q(h).step,1);
 for(let n=0;n<2;n++){
  const it=h.game[p+'World'].puzzleMeshes.get('1:'+n).it;
  h.game.playerPos.set(900,12,900);h.game.interact(it);assert.ok(!h.game[p+'Dialog'],'Distant evidence cannot be read');
  go(h,it);button(h,'SAVE LOCAL RECORDING');
 }
 assert.deepEqual([...q(h).puzzles.house.collected],[0,1]);h=reload(h);assert.deepEqual([...q(h).puzzles.house.collected],[0,1]);
 const last=h.game[p+'World'].puzzleMeshes.get('1:2').it;assert.deepEqual(h.game.questWaypointPos().toArray(),last.pos.toArray());
 go(h,last);button(h,'SAVE LOCAL RECORDING');go(h,h.game[p+'World'].nodeMeshes.get(1).it);
 const houseBefore=JSON.stringify(q(h).puzzles.house);button(h,'OPTIONAL HELP / NEXT EVENT');assert.equal(h.doc.getElementById(p+'-feedback').textContent,'Next event: ALARM DISABLED.');assert.equal(JSON.stringify(q(h).puzzles.house),houseBefore,'Timeline help changes no state');
 button(h,'CASE REMOVED');assert.deepEqual([...q(h).puzzles.house.ordered],[]);assert.equal(q(h).puzzles.house.collected.length,3);
 button(h,'ALARM DISABLED');button(h,'CLOSE');h=reload(h);assert.deepEqual([...q(h).puzzles.house.ordered],[0]);
 go(h,h.game[p+'World'].nodeMeshes.get(1).it);button(h,'CASE REMOVED');button(h,'CARRIER WAKES');assert.equal(q(h).step,2);
 const crash=make({v:1,started:true,step:1,seen:[0],puzzles:{house:{collected:[0,1,2],ordered:[0,1,2]}}});go(crash,crash.game[p+'World'].nodeMeshes.get(1).it);button(crash,'COMMIT RECONSTRUCTION');assert.equal(q(crash).step,2);
 h=make({v:1,started:true,step:10,seen:[0,1,2,3]});
 go(h,h.game[p+'World'].nodeMeshes.get(10).it);const powerBefore=JSON.stringify(q(h).puzzles.power);for(const answer of ['CARRIER RETURN must use GROUND','EMERGENCY LIGHTS must use ISOLATED BUS','CAGE BRAKE must use LIFT LINE']){button(h,'OPTIONAL HELP / REVEAL A ROUTE');assert.ok(h.doc.getElementById(p+'-feedback').textContent.includes(answer));}assert.equal(JSON.stringify(q(h).puzzles.power),powerBefore,'Power help changes no state');button(h,'TEST CIRCUIT');assert.equal(q(h).step,10);
 const rotary=h.game[p+'World'].puzzleMeshes.get('10:0').it;go(h,rotary);go(h,rotary);assert.equal(q(h).puzzles.power.routes[0],2);
 h=reload(h);assert.equal(q(h).puzzles.power.routes[0],2);
 go(h,h.game[p+'World'].nodeMeshes.get(10).it);button(h,'TEST CIRCUIT');assert.equal(q(h).puzzles.power.routes[0],2,'Rejected circuit retains the current settings');
 for(const [n,turns] of [[0,1],[1,1],[2,2]])for(let turn=0;turn<turns;turn++)go(h,h.game[p+'World'].puzzleMeshes.get('10:'+n).it);
 assert.deepEqual([...q(h).puzzles.power.routes],[3,1,2]);go(h,h.game[p+'World'].nodeMeshes.get(10).it);button(h,'RESTORE EMERGENCY POWER');assert.equal(q(h).step,11);h.game.updatePlayer(.1);assert.equal(h.game[p+'World'].rooms.get(3).ambient.intensity,1.3);
 const coded=make({v:1,started:true,step:6,seen:[0,1,2]});go(coded,coded.game[p+'World'].nodeMeshes.get(6).it);const codeBefore=q(coded).step;for(const answer of ['digit 1 is 4','digit 2 is 1','digit 3 is 4']){button(coded,'OPTIONAL HELP / REVEAL NEXT DIGIT');assert.ok(coded.doc.getElementById(p+'-feedback').textContent.includes(answer));}assert.equal(q(coded).step,codeBefore,'Code help advances no state');
 const legacy=make({v:1,started:true,step:11,seen:[0,1,2,3]});assert.equal(q(legacy).step,11);assert.deepEqual([...q(legacy).puzzles.power.routes],[3,1,2]);
 const malformed=make({v:1,started:true,step:1,seen:[0],puzzles:{house:{collected:[0,0,'1',8],ordered:[2,0]},power:{routes:[99,'1',-1]}}});assert.deepEqual([...q(malformed).puzzles.house.collected],[0]);assert.deepEqual([...q(malformed).puzzles.house.ordered],[]);assert.deepEqual([...q(malformed).puzzles.power.routes],[0,0,0]);
}
console.log('PASS: both spatial puzzles; evidence proximity/prerequisites; wrong-order retry; partial collection/order/routing reload; commit recovery; wrong-circuit retention; actual power restore; legacy indices and malformed sub-checkpoints. Full-game validation pending.');

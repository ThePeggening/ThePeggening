// Save/retry/prerequisite checks. Browser tests separately verify the renderer.
const assert=require('node:assert/strict'),{setup}=require('./test-maria-414-source.cjs');
for(const mirror of [false,true]){
 const p=mirror?'sommiMirror414':'maria414',key=mirror?'atropa_sommi_414_same_night_v1':'atropa_maria_414_reclaimed_v1';
 const make=(step,puzzles)=>{const h=setup({v:1,started:true,step,seen:Array.from({length:10},(_,i)=>i),puzzles},{mirror,skin:mirror?'sommi':'maria-414',native:{v:1,complete:true,step:4,hasRifles:true,rewarded:true}});h.game[p+'Start']();if(h.game[p+'Cine'])h.game[p+'Cine'].el.children.at(-1).onclick();return h;};
 const api=h=>h.context['__'+p+'Quest'],q=h=>api(h).read(),world=h=>h.game[p+'World'];
 const visit=(h,it)=>{h.game.playerPos.copy(it.pos);h.game.interact(it)};
 const els=h=>h.doc.getElementById(p+'-dialog').children[0].children;
 const button=(h,t)=>{const b=els(h).find(b=>b.tagName==='button'&&b.textContent===t);assert.ok(b,'Missing '+t);b.onclick();};
 const cells=h=>els(h).find(e=>e.children.some(x=>x.dataset.depthCell!==undefined)).children;
 const reload=h=>{h.game[p+'Pause']();const saved=JSON.parse(h.storage.get(key));return make(saved.step,saved.puzzles)};
 let h=make(8);visit(h,world(h).nodeMeshes.get(8).it);button(h,'FOLLOW THE CABLE PLATES');assert.equal(q(h).step,8);
 const evidence=world(h).depthMeshes.get('8:0').it;h.game.playerPos.set(999,12,999);h.game.interact(evidence);assert.ok(!h.game[p+'Dialog']);
 visit(h,evidence);button(h,'RECORD CABLE EVIDENCE');h=reload(h);assert.deepEqual([...q(h).puzzles.exit.collected],[0]);
 for(let n=1;n<4;n++){visit(h,world(h).depthMeshes.get('8:'+n).it);button(h,'RECORD CABLE EVIDENCE')}
 visit(h,world(h).nodeMeshes.get(8).it);button(h,'TEST LIVE ROUTE');assert.equal(q(h).puzzles.exit.solved,false);const route=els(h).find(b=>b.dataset.depthRoute==='0');route.onclick();button(h,'CLOSE');h=reload(h);assert.equal(q(h).puzzles.exit.routes[0],1);
 visit(h,world(h).nodeMeshes.get(8).it);for(const[n,t]of[3,1,2,0].entries()){const b=els(h).find(b=>b.dataset.depthRoute===String(n));while(q(h).puzzles.exit.routes[n]!==t)b.onclick()};button(h,'TEST LIVE ROUTE');assert.equal(q(h).puzzles.exit.solved,true);assert.equal(q(h).step,8);
 for(let stage=0;stage<3;stage++){
  h=make(17+stage);visit(h,world(h).nodeMeshes.get(17+stage).it);const old=JSON.stringify(q(h).puzzles);button(h,'BLUEPRINT HINT');assert.equal(JSON.stringify(q(h).puzzles),old,'Hint changes no state');button(h,'ISOLATE CIRCUIT');assert.equal(q(h).puzzles.engine.solved[stage],false);
  cells(h)[0].onclick();const changed=q(h).puzzles.engine.turns[stage][0];button(h,'CLOSE');h=reload(h);assert.equal(q(h).puzzles.engine.turns[stage][0],changed);
  visit(h,world(h).nodeMeshes.get(17+stage).it);for(let n=0;n<16;n++)while(q(h).puzzles.engine.turns[stage][n]!==0)cells(h)[n].onclick();const flow=api(h).depth.engineFlow(stage,q(h).puzzles.engine.turns[stage]);assert.ok(flow.solved);assert.equal(flow.leaks,0);assert.equal(flow.visited.size,16);button(h,'ISOLATE CIRCUIT');assert.equal(q(h).step,17+stage,'Repair retains timed stabilizer action');assert.equal(q(h).puzzles.engine.solved[stage],true);
 }
 h=make(29);visit(h,world(h).nodeMeshes.get(29).it);button(h,'FOLLOW THE DISTRICT PANELS');
 for(let district=0;district<4;district++){
  visit(h,world(h).depthMeshes.get('29:'+district).it);const old=JSON.stringify(q(h).puzzles.district);button(h,'REPAIR HINT');assert.equal(JSON.stringify(q(h).puzzles.district),old);button(h,'RESTORE DISTRICT');assert.equal(q(h).puzzles.district.done[district],false);cells(h)[0].onclick();const partial=[...q(h).puzzles.district.boards[district]];button(h,'CLOSE');h=reload(h);assert.deepEqual([...q(h).puzzles.district.boards[district]],partial);
  visit(h,world(h).depthMeshes.get('29:'+district).it);if(district===0){let tries=0;while(!q(h).puzzles.district.boards[district].every(Boolean)){button(h,'REPAIR HINT');const text=h.doc.getElementById(p+'-feedback').textContent,m=/Try ([A-E])([1-5])/.exec(text);assert.ok(m,'Hint names an actionable cell');cells(h)[(Number(m[2])-1)*5+m[1].charCodeAt(0)-65].onclick();assert.ok(++tries<=25,'Hints reach a repair without cycling');}}else{const solution=api(h).depth.districtSolution(q(h).puzzles.district.boards[district]);assert.ok(solution);for(const cell of solution)cells(h)[cell].onclick();}assert.ok(q(h).puzzles.district.boards[district].every(Boolean));button(h,'RESTORE DISTRICT');assert.equal(q(h).puzzles.district.done[district],true);assert.equal(q(h).step,29);h.game.updatePlayer(10);for(const block of world(h).rooms.get(8).reconstruction.blocks)assert.equal(block.light.material.color.value,q(h).puzzles.district.done[block.district]?'#67c8d1':'#30424c','City district follows actual repair');
  visit(h,world(h).depthMeshes.get('29:'+district).it);button(h,'CONTINUE RESTORATION');assert.equal(q(h).puzzles.district.done.filter(Boolean).length,district+1);
 }
 const legacy=make(30);assert.ok(q(legacy).puzzles.exit.solved);assert.ok(q(legacy).puzzles.engine.solved.every(Boolean));assert.ok(q(legacy).puzzles.district.done.every(Boolean));
 const malformed=make(8,{exit:{collected:[0,0,7,'1'],routes:[99,-1,'3',0],solved:true},engine:{turns:[[99]],solved:[true]},district:{boards:[[99]],done:[true]}});assert.deepEqual([...q(malformed).puzzles.exit.collected],[0]);assert.equal(q(malformed).puzzles.exit.solved,false);assert.ok(q(malformed).puzzles.engine.turns[0].every(n=>Number.isInteger(n)&&n>=0&&n<4));assert.equal(q(malformed).puzzles.engine.solved[0],false);
 console.log('PASS depth mechanics',p);
}

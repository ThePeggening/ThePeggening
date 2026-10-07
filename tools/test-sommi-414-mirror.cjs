// Host-shim quest checks, not a renderer or full-game walkthrough.
const assert=require('node:assert/strict'),{setup,preparePuzzle}=require('./test-maria-414-source.cjs');
const native={v:1,complete:true,step:4,offered:true,inside:false,hasRifles:true,alarmOff:true,rewarded:true};
const blocked=setup(null,{mirror:true,skin:'sommi',native:{...native,complete:false}});
assert.equal(blocked.game.sommiMirror414Start(),false,'Native rifle theft must finish first');
assert.equal(blocked.game.maria414Start(),false,'Sommi must not start Maria route');
const h=setup(null,{mirror:true,skin:'sommi',native}),q=()=>h.context.__sommiMirror414Quest.read();
const initialNative=h.storage.get('atropa_sommi_414_house_v1');
function skip(){const c=h.game.sommiMirror414Cine;if(c)c.el.children.at(-1).onclick()}
function tick(seconds){for(let t=0;t<seconds;t+=.1)h.game.updatePlayer(.1)}
assert.equal(h.game.sommiMirror414Start(),true);assert.equal(q().rifles,true);assert.equal(h.context.__sommi414QuestCard().character,'SOMMI');
for(let i=0;i<32;i++){
 skip();assert.equal(q().step,i);preparePuzzle(h,'sommiMirror414',i);if(i===1)continue;const w=h.game.sommiMirror414World,nd=w.nodeMeshes.get(i),kind=h.context.__sommiMirror414Quest.steps[i][6];h.game.playerPos.copy(nd.it.pos);
 if(kind==='trace')tick(6.2);if(kind==='pulse')w.clock=3.5;
 h.game.interact(nd.it);
 if(kind==='code')for(const n of ['4','1','4'])h.doc.getElementById('sommiMirror414-dialog').children[0].children.find(x=>x.tagName==='button'&&x.textContent===n).onclick();
 else if(h.game.sommiMirror414Dialog)h.doc.getElementById('sommiMirror414-dialog').children[0].children.find(x=>x.tagName==='button'&&x.textContent!=='CLOSE').onclick();
 if(i===16)assert.equal(q().rifles,false,'Case must be seated before engine isolation');
 if(i===20)assert.equal(q().rifles,true,'Case must return after extraction');
 if(i===8){skip();h.game.sommiMirror414Pause();assert.equal(h.game.sommiMirror414Inside,false);h.game.sommiMirror414Start();assert.equal(q().step,9)}
}
assert.equal(q().complete,true);assert.equal(h.game.sommiMirror414Inside,false);assert.equal(h.state.pls,464);assert.equal(h.storage.get('atropa_sommi_414_house_v1'),initialNative);assert.equal(h.storage.has('atropa_maria_414_reclaimed_v1'),false);assert.equal(h.state.mainQuestIndex,2);assert.deepEqual(h.state.mainQuests,['original']);
assert.equal(h.game.sommiMirror414Replay(),true);for(let i=0;i<10;i++)skip();assert.equal(h.state.pls,464);assert.equal(h.game.sommiMirror414Inside,false);
console.log('PASS: Sommi native-raid gate; 32 companion objectives; case seat/extract; pause/resume; reward once and replay; Maria save and native raid untouched; campaign intact. Full-game validation remains pending.');

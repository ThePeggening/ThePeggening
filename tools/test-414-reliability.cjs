// Checkpoint and replay regressions in the host shim; not a rendering test.
const assert=require('node:assert/strict'),{setup}=require('./test-maria-414-source.cjs');
const native={v:1,complete:true,step:4,inside:false,hasRifles:true,rewarded:true};
const completed={v:1,started:true,complete:true,rewarded:true,step:31,checkpoint:31,rifles:false,elapsed:42,seen:[0,1,2,3,4,5,6,7,8,9]};
for(const mirror of [false,true]){
 const p=mirror?'sommiMirror414':'maria414',key=mirror?'atropa_sommi_414_same_night_v1':'atropa_maria_414_reclaimed_v1';
 const make=saved=>setup(saved,{mirror,skin:mirror?'sommi':'maria-414',native});
 const h=make(completed),q=()=>h.context['__'+p+'Quest'].read();
 const rawBefore=h.storage.get(key),pos=h.game.playerPos.clone(),sky=h.game.scene.background;
 assert.equal(h.game[p+'Recordings'](),true);
 const card=h.doc.getElementById(p+'-dialog').children[0];
 const choices=card.children.filter(x=>x.tagName==='button'&&x.textContent!=='CLOSE');
 assert.equal(choices.length,11);
 choices[7].onclick();assert.equal(h.game[p+'Cine'].act,6);assert.equal(h.game[p+'World'].room,6);
 h.game.updatePlayer(13);assert.equal(h.storage.get(key),rawBefore,'Replay must not autosave elapsed time or progression');
 h.game[p+'Cine'].el.children.at(-1).onclick();
 assert.equal(h.game[p+'Inside'],false);assert.equal(h.game[p+'World'].replaying,false);assert.equal(h.game.scene.background,sky);assert.deepEqual(h.game.playerPos,pos);assert.equal(h.storage.get(key),rawBefore);assert.equal(h.state.pls,50);
 for(let act=0;act<10;act++){
  assert.equal(h.game[p+'Replay'](act,true),true);assert.equal(h.game[p+'Cine'].act,act);
  h.game[p+'Cine'].el.children.at(-1).onclick();assert.equal(h.game[p+'Inside'],false);
 }
 const banner={id:414,title:'City introduction',startedAt:123},lookBeat={campaignBannerId:414};
 h.state.campaignBanner=banner;h.game.lookBeat=lookBeat;
 assert.equal(h.game[p+'Replay'](0,true),true);
 assert.equal(h.state.campaignBanner,null,'City banner must not overlap a recording');assert.equal(h.game.lookBeat,null);
 h.game[p+'Cine'].el.children.at(-1).onclick();assert.equal(h.state.campaignBanner,banner,'Return must restore the pending city introduction');assert.equal(h.game.lookBeat,lookBeat);
 assert.equal(h.game[p+'Replay'](-1,true),false);assert.equal(h.game[p+'Replay'](10,true),false);assert.equal(h.game[p+'Replay'](1.5,true),false);
 h.context.loadSkinId=()=>mirror?'maria-414':'sommi';assert.equal(h.game[p+'Replay'](),false,'Wrong character cannot replay this route');
 h.context.loadSkinId=()=>mirror?'sommi':'maria-414';h.game.treasuryInside=true;assert.equal(h.game[p+'Replay'](),false);h.game.treasuryInside=false;
 assert.equal(h.game[p+'Recordings'](),true);
 let stopped=false;for(const fn of h.listeners.get('keydown'))fn({key:'Escape',preventDefault(){},stopImmediatePropagation(){stopped=true;}});
 assert.equal(stopped,true);assert.equal(h.game[p+'Dialog'],null);assert.equal(h.state.panel,null);
 const bad=make({v:1,started:true,step:4.9,elapsed:'broken',seen:[1,1,-2,200,'4'],rewarded:'yes',rifles:'yes'});
 const normalized=bad.context['__'+p+'Quest'].read();assert.equal(normalized.step,4);assert.equal(normalized.elapsed,0);assert.equal(normalized.rewarded,false);assert.equal(normalized.rifles,false);assert.deepEqual([...normalized.seen],[1]);assert.equal(bad.game[p+'Start'](),true);
 for(const step of ['NaN','Infinity',-99,999]){const sample=make({v:1,step});const n=sample.context['__'+p+'Quest'].read().step;assert.ok(Number.isInteger(n)&&n>=0&&n<32);}
 const legacy=make({v:1,complete:true,step:4});assert.equal(legacy.context['__'+p+'Quest'].read().step,31);assert.equal(legacy.game[p+'Replay'](9,true),true);legacy.game[p+'Cine'].el.children.at(-1).onclick();assert.equal(legacy.state.pls,50);
}
// Maria can continue for the session when browser storage throws. Sommi cannot
// establish its native raid prerequisite without readable native storage.
const offline=setup();offline.context.localStorage.getItem=()=>{throw Error('storage blocked');};offline.context.localStorage.setItem=()=>{throw Error('storage blocked');};
assert.equal(offline.game.maria414Start(),true);offline.game.maria414Cine.el.children.at(-1).onclick();
const node=offline.game.maria414World.nodeMeshes.get(0);offline.game.playerPos.copy(node.it.pos);offline.game.interact(node.it);
offline.doc.getElementById('maria414-dialog').children[0].children.find(x=>x.tagName==='button'&&x.textContent==='Save recording / continue').onclick();assert.equal(offline.context.__maria414Quest.read().step,1);
console.log('PASS: both chapter pickers; ten individual replays; replay save/reward isolation; character/Treasury gates; Escape from gallery; malformed checkpoint recovery; blocked storage session progress. Full-game validation pending.');

// Animation and resource lifetime checks with fixture rigs; not a visual test.
const assert=require('node:assert/strict'),{setup}=require('./test-maria-414-source.cjs');
const native={v:1,complete:true,step:4,inside:false,hasRifles:true,rewarded:true};
function rigFixture(duration){
 const calls=[],actions=[],uncached=[];
 const rig={ready:true,walk:{getClip(){return {clone(){return {duration};}};}},update(dt,speed,grounded,onBoard){calls.push({dt,speed,grounded,onBoard,self:this});},mixer:{clipAction(clip){const action={clip,stop(){this.stopped=true;return this;},play(){this.stopped=false;return this;},setEffectiveWeight(weight){this.weight=weight;return this;}};actions.push(action);return action;},update(){},uncacheAction(clip){uncached.push(clip);}}};
 return {rig,calls,actions,uncached,original:rig.update};
}
(async()=>{
for(const mirror of [false,true]){
 const p=mirror?'sommiMirror414':'maria414',player=rigFixture(),npc=rigFixture();let h,actor;
 const makeActor=()=>{actor=new h.context.THREE.Group();actor.userData.externalRig=npc.rig;actor.userData.legs={l:new h.context.THREE.Group(),r:new h.context.THREE.Group(),phase:0,gaitBlend29:0};return actor;};
 h=setup({v:1,started:true,step:22,seen:[0,1,2,3,4,5]},{mirror,skin:mirror?'sommi':'maria-414',native,globals:{PLAYER_SKINS:[{id:'maria-414'}],buildSommiPlayer:makeActor,buildPlayerSkin:makeActor}});
 h.game.player.userData.externalRig=player.rig;h.game[p+'Start']();await Promise.resolve();await Promise.resolve();assert.ok(actor);
 const room=h.game[p+'World'].rooms.get(6);assert.notEqual(player.rig.update,player.original);
 player.rig.update(.1,0,true,false);assert.equal(player.calls.length,0);assert.equal(player.actions[0].paused,true);assert.equal(player.actions[0].time,.28);
 player.rig.update(.1,2,true,false);assert.equal(player.calls.at(-1).self,player.rig);assert.equal(player.calls.at(-1).speed,2);
 for(let n=0;n<20;n++)h.game.updatePlayer(.1);assert.ok(actor.position.z>-24&&actor.position.z<-12);assert.ok(npc.calls.some(call=>call.speed>0));assert.ok(actor.userData.legs.phase>0);
 h.game[p+'Cine'].el.children.at(-1).onclick();assert.equal(actor.position.z,-12);assert.equal(actor.userData.legs.gaitBlend29,0);
 h.game[p+'Pause']();assert.equal(player.rig.update,player.original);assert.equal(npc.rig.update,npc.original);assert.equal(player.uncached.length,1);assert.equal(npc.uncached.length,1);
 h.game[p+'Start']();h.game.updatePlayer(.1);assert.equal(player.actions.length,2);assert.equal(npc.actions.length,2);
 const nextPlayer=rigFixture();h.game.player.userData.externalRig=nextPlayer.rig;h.game.updatePlayer(.1);assert.equal(player.rig.update,player.original);assert.notEqual(nextPlayer.rig.update,nextPlayer.original);
 npc.rig.failed=true;h.game.updatePlayer(.1);assert.equal(actor.visible,false);assert.ok(room.actorVoiceFallback);
 const resources=new Set();for(const root of [h.game[p+'World'].entry,room.root]){const visit=o=>{if(o===actor)return;for(const resource of [o.geometry,...[].concat(o.material||[]),...[].concat(o.material||[]).map(m=>m.map)])if(resource&&!resources.has(resource)){resource.disposals=0;resource.dispose=()=>resource.disposals++;resources.add(resource);}for(const child of o.children)visit(child);};visit(root);}
 const shared={disposals:0,dispose(){this.disposals++;}},actorMesh=new h.context.THREE.Mesh(shared,shared);actor.add(actorMesh);h.game.player.add(new h.context.THREE.Mesh(shared,shared));
 h.game.dispose();assert.equal(h.game[p+'World'],null);assert.equal(nextPlayer.rig.update,nextPlayer.original);assert.equal(shared.disposals,0,'Imported/shared character resources must survive');assert.ok([...resources].every(resource=>resource.disposals===1));assert.equal(h.game.interactables.some(it=>it.id.startsWith(p+'-')),false);assert.equal(room.root.parent,null);
 // A newer wrapper installed by another feature is preserved on exit.
 const newer=rigFixture(),other=setup({v:1,started:true,step:0,seen:[0]},{mirror,skin:mirror?'sommi':'maria-414',native});other.game.player.userData.externalRig=newer.rig;other.game[p+'Start']();const otherWrapper=()=>{};newer.rig.update=otherWrapper;other.game[p+'Pause']();assert.equal(newer.rig.update,otherWrapper);
 // Disposing before asynchronous encounter construction must cancel attachment.
 let built=0;const late=setup({v:1,started:true,step:22,seen:[0,1,2,3,4,5]},{mirror,skin:mirror?'sommi':'maria-414',native,globals:{PLAYER_SKINS:[{id:'maria-414'}],buildSommiPlayer:()=>{built++;},buildPlayerSkin:()=>{built++;}}});late.game[p+'Start']();late.game.dispose();await Promise.resolve();await Promise.resolve();assert.equal(built,0);
 const failed=setup({v:1,started:true,step:22,seen:[0,1,2,3,4,5]},{mirror,skin:mirror?'sommi':'maria-414',native,globals:{PLAYER_SKINS:[{id:'maria-414'}],__atropaPrimePacked:()=>{throw Error('prime failed');},buildPlayerSkin:()=>{throw Error('model failed');}}});assert.equal(failed.game[p+'Start'](),true);for(let i=0;i<4;i++)await Promise.resolve();assert.ok(failed.game[p+'World'].rooms.get(6).actorVoiceFallback);
 const standing=rigFixture(1.2),poseHost=setup({v:1,started:true,step:0,seen:[0]},{mirror,skin:mirror?'sommi':'maria-414',native});poseHost.game.player.userData.externalRig=standing.rig;poseHost.game[p+'Start']();standing.rig.update(.1,0,true,false);
 assert.equal(standing.actions.length,2);assert.equal(standing.actions[0].weight,.5);assert.equal(standing.actions[1].weight,.5);assert.ok(Math.abs(standing.actions[1].time-.88)<1e-9);assert.ok(standing.actions.every(action=>action.paused));
 standing.rig.update(.1,2,true,false);assert.ok(standing.actions.every(action=>action.stopped));assert.equal(standing.calls.at(-1).speed,2);poseHost.game[p+'Pause']();assert.equal(standing.uncached.length,2);assert.equal(standing.rig.update,standing.original);
}
console.log('PASS: both encounter entrances/gaits; skip pose; player/NPC idle scope; pause/resume and rig replacement; model-failure voice link; owned-resource cleanup; shared-character preservation; newer-wrapper preservation; async disposal cancellation. Full-game visual validation pending.');
})().catch(error=>{console.error(error);process.exitCode=1;});

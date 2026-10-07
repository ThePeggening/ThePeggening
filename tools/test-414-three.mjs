// Real Three.js scene math with a mocked host and canvas. No WebGL rendering.
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import fixture from './test-maria-414-source.cjs';
const THREE=process.env.THREE_MODULE_PATH?await import(pathToFileURL(path.resolve(process.env.THREE_MODULE_PATH)).href):await import('three');
const native={v:1,complete:true,step:4,inside:false,hasRifles:true,rewarded:true};
const saved={v:1,started:true,complete:true,rewarded:true,step:31,rifles:false,elapsed:42,seen:[0,1,2,3,4,5,6,7,8,9]};
for(const mirror of [false,true]){
 const p=mirror?'sommiMirror414':'maria414';
 const h=fixture.setup(saved,{mirror,skin:mirror?'sommi':'maria-414',native,THREE,globals:{
  PLAYER_SKINS:[{id:'maria-414'}],buildPlayerSkin:()=>new THREE.Group(),
  buildCosmosSky:radius=>new THREE.Mesh(new THREE.SphereGeometry(radius,12,8),new THREE.MeshBasicMaterial({side:THREE.BackSide,transparent:true,depthWrite:false}))
 }});
 const world=h.game[p+'World'],snapshot=h.game.scene.background;
 for(let act=0;act<10;act++){
  assert.equal(h.game[p+'Replay'](act,true),true);
  await Promise.resolve();await Promise.resolve();
  h.game.updatePlayer(.1);h.game.scene.updateMatrixWorld(true);
  const room=world.rooms.get(Math.min(act,8));
  let meshes=0;room.root.traverse(obj=>{
   assert.ok(obj.matrixWorld.elements.every(Number.isFinite),'Scene transform must stay finite');
   if(obj.isMesh){meshes++;obj.geometry.computeBoundingBox();assert.ok(!obj.geometry.boundingBox.isEmpty(),'Mesh bounds must not be empty');}
   if(obj.isInstancedMesh){const matrix=new THREE.Matrix4();for(let n=0;n<obj.count;n++){obj.getMatrixAt(n,matrix);assert.ok(matrix.elements.every(Number.isFinite),'Instanced architectural transforms must be finite');}obj.computeBoundingBox();assert.ok(!obj.boundingBox.isEmpty(),'Instanced architectural bounds must not be empty');}
  });assert.ok(meshes>20);
  assert.ok(h.game.camera.projectionMatrix.elements.every(Number.isFinite));
  assert.ok(room.root.children.some(o=>o.name==='414-inlaid-stone-floor'),'Every environment has the new authored floor');
  assert.ok(room.root.children.some(o=>o.name==='414-airborne-memory'&&o.isInstancedMesh),'Atmospheric details are batched');
  if(act===5){assert.ok(room.root.children.some(o=>o.name==='414-segmented-containment'));assert.ok(room.root.children.some(o=>o.name==='414-engine-cathedral-ribs'));assert.equal(room.energy.visible,true);}
  const ray=new THREE.Raycaster(new THREE.Vector3(room.root.position.x,room.root.position.y+1,room.root.position.z+20),new THREE.Vector3(0,-1,0));
  const hits=ray.intersectObject(room.root,true);assert.ok(hits.some(hit=>Math.abs(hit.point.y-room.root.position.y)<.001),'A solid floor must support the entrance');
  if(act===1){assert.equal(room.sky.material.opacity,1);assert.equal(room.sky.geometry.parameters.radius,260);assert.equal(room.sky.parent,room.root);assert.equal(room.sky.visible,false);assert.equal(room.horizon.parent,room.root);}
  if(act===6)assert.equal(room.actor?.parent,room.root,'Registered character encounter must attach to its room');
  h.game[p+'Cine'].el.children.at(-1).onclick();assert.equal(h.game[p+'Inside'],false);assert.equal(h.game.scene.background,snapshot);
 }
 for(const step of [8,29]){
  const h=fixture.setup({v:1,started:true,step,seen:[0,1,2,3,4,5,6,7,8,9]},{mirror,skin:mirror?'sommi':'maria-414',native,THREE});h.game[p+'Start']();h.game.scene.updateMatrixWorld(true);
  const w=h.game[p+'World'],nds=[...w.depthMeshes.values()];assert.equal(nds.length,4);
  for(const nd of nds){nd.root.traverse(obj=>assert.ok(obj.matrixWorld.elements.every(Number.isFinite)));const ray=new THREE.Raycaster(nd.it.pos.clone().add(new THREE.Vector3(0,8,0)),new THREE.Vector3(0,-1,0));assert.ok(ray.intersectObject(nd.root.parent,true).some(hit=>Math.abs(hit.point.y-nd.it.pos.y)<.001),'Depth terminal has a solid floor');}
  fixture.preparePuzzle(h,p,step);h.game.updatePlayer(10);h.game.scene.updateMatrixWorld(true);for(const nd of nds)nd.root.traverse(obj=>assert.ok(obj.matrixWorld.elements.every(Number.isFinite)));
  h.game.dispose();assert.equal(h.game[p+'World'],null);assert.ok(!h.game.interactables.some(it=>it.id.startsWith(p+'-depth-')),'Depth interactables removed on disposal');
 }
 for(const step of [1,10]){
  const puzzle=fixture.setup({v:1,started:true,step,seen:[0,1,2,3]},{mirror,skin:mirror?'sommi':'maria-414',native,THREE});
  puzzle.game[p+'Start']();puzzle.game.scene.updateMatrixWorld(true);
  const nds=[...puzzle.game[p+'World'].puzzleMeshes.values()];assert.equal(nds.length,3);
  for(const nd of nds){assert.equal(nd.root.visible,true);nd.root.traverse(obj=>assert.ok(obj.matrixWorld.elements.every(Number.isFinite)));}
  fixture.preparePuzzle(puzzle,p,step);puzzle.game.scene.updateMatrixWorld(true);
  for(const nd of nds)nd.root.traverse(obj=>assert.ok(obj.matrixWorld.elements.every(Number.isFinite),'Updated puzzle transforms must remain finite'));
 }
}
console.log(`PASS: real Three.js r${THREE.REVISION} scene math; both routes and all ten acts; finite transforms/projection, mesh bounds, solid entrance floors, room-local sky, registered encounter and spatial puzzle terminals. No rendering/native-control validation.`);

import * as THREE from 'three';
import {brand} from './brand.js';
import {worldPalette as W} from './world-palette.js';
import {mergeParts} from './scene-kit.js';
// Hand-placed destinations supplement the seeded forest/village chunks.
export function createValleyScenery(scene,toon,resources,kit,height,colliders,surfaces,waterMaterial=null){
 const B=brand.colors,box=resources.own(new THREE.BoxGeometry(1,1,1)),dummy=new THREE.Object3D(),groups=[],parts=[];
 function piece(geometry,color,x,y,z,sx,sy,sz,yaw=0){dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(0,yaw,0);dummy.updateMatrix();parts.push({geometry,matrix:dummy.matrix.clone(),color});}
 function batch(x,z){const geo=resources.own(mergeParts(parts)),mesh=new THREE.Mesh(geo,kit.material),hull=new THREE.Mesh(geo,kit.outline);parts.length=0;scene.add(hull,mesh);groups.push({x,z,mesh,hull});}
 // Cave mouth, dark walkable chamber and archaeological ruin, each with a hidden corner.
 for(const [x,z]of [[-166,-131],[159,127]]){const y=height(x,z),cave=x<0;
  for(const dx of [-4,4]){piece(box,W.stone,x+dx,y+3,z,2.2,6,7);colliders.push({x:x+dx,z,w:1.1,d:3.5,bottom:y,top:y+6});}
  piece(box,cave?W.rockDark:W.stone,x,y+6,z,10,2,cave?8:2);surfaces.push({x,z,w:5,d:4,top:y+7,bottom:y});
  if(cave){piece(box,W.rockDark,x,y+2,z-4,10,6,1);colliders.push({x,z:z-4,w:5,d:.5,bottom:y,top:y+6});}
  else for(const dx of [-8,8])piece(kit.templates.rock,B.text,x+dx,y,z+6,4,4,4);
  piece(kit.templates['signal-lamp'],B.text,x-2,y,z+3,1,1,1);batch(x,z);
 }
 // Mountain switchbacks: a visible continuous path with lamps at turns.
 const turns=[[-66,-97],[-74,-114],[-155,-134],[-77,-155],[-160,-177],[-155,-195]];
 for(let j=1;j<turns.length;j++){const [ax,az]=turns[j-1],[bx,bz]=turns[j],len=Math.hypot(bx-ax,bz-az),n=Math.ceil(len/2);for(let i=0;i<n;i++){const t=(i+.5)/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t;piece(box,W.path,x,height(x,z)+.06,z,3,.12,len/n+1,Math.atan2(bx-ax,bz-az));}piece(kit.templates['signal-lamp'],B.text,bx,height(bx,bz),bz,.8,.8,.8);}batch(-125,-155);
 // Cultivated fields, irrigated rows and a visible granary beside the windmill.
 for(let row=0;row<5;row++)for(let col=0;col<12;col++){const x=14+row*1.4,z=63+col*.8,y=height(x,z);piece(box,W.wood,x,y+.08,z,1.1,.15,.65);piece(box,W.flowerGold,x,y+.65,z,.14,1.1,.14);piece(kit.templates.rock,B.text,x,y+.05,z,.28,.28,.28);}piece(kit.templates.house,B.text,10,height(10,64),64,1,1,1);batch(18,69);
 // Lake pier and harbor coast, safe decks over real water.
 for(const [x,z,w,d]of [[115,-218,26,5]]){const y=height(x,z);piece(box,W.wood,x,y+.25,z,w,.5,d);surfaces.push({x,z,w:w/2,d:d/2,top:y+.5,bottom:0});for(let i=-w/2;i<=w/2;i+=3)for(const side of [-1,1])piece(box,W.barkLight,x+i,y+1,z+side*d/2,.22,2,.22);piece(kit.templates['signal-lamp'],B.text,x,y,z,1,1,1);batch(x,z);}
 // Continuous, gently stepped lake boardwalk: shore approach, water, island.
 // Each physical surface exactly matches its visible plank.
 const shore=height(54,97)+.1;for(let x=54;x<=86;x++){const top=shore+(.68-shore)*Math.min(1,(x-54)/7);piece(box,x%2?W.wood:W.barkLight,x,top-.16,97,1.04,.32,5);surfaces.push({x,z:97,w:.52,d:2.5,top,bottom:top-.32,walkway:true});if(x%4===2)for(const side of [-1,1]){piece(box,W.wood,x,top+.45,97+side*2.38,.18,.9,.18);piece(box,W.wood,x,top-.7,97+side*1.9,.26,1.4,.26);}}piece(kit.templates['signal-lamp'],B.text,65,.68,99,1,1,1);batch(72,97);
 const sea=new THREE.Mesh(resources.own(new THREE.PlaneGeometry(150,50)),waterMaterial||toon.material(W.water));sea.rotation.x=-Math.PI/2;sea.position.set(165,17,-237);scene.add(sea);toon.hull(sea);
 piece(kit.templates.lighthouse,B.text,100,height(100,-215),-215,1,1,1);batch(100,-215);
 // Lantern flock, butterflies and rain are fixed-capacity instanced pools.
 const lanternGeo=resources.own(new THREE.IcosahedronGeometry(.35,0)),lantern=new THREE.InstancedMesh(lanternGeo,toon.material(B.gold),16),lanternHull=new THREE.InstancedMesh(lanternGeo,toon.outline(B.glow),16),wingGeo=resources.own(new THREE.PlaneGeometry(.4,.3)),butterflies=new THREE.InstancedMesh(wingGeo,toon.material(W.flower,{side:THREE.DoubleSide}),20),rain=new THREE.InstancedMesh(box,toon.material(W.water),80);for(const obj of [lantern,lanternHull,butterflies,rain]){resources.own(obj);scene.add(obj);}
 return {update(time,focus,weather,reduceMotion){for(const g of groups)g.mesh.visible=g.hull.visible=Math.hypot(focus.x-g.x,focus.z-g.z)<145;
  for(let i=0;i<16;i++){const a=i*6.28/16,x=Math.sin(a)*22,z=Math.cos(a)*22-20;dummy.position.set(x,height(x,z)+7+(reduceMotion?0:Math.sin(time*.4+i)),z);dummy.scale.set(.8,1.2,.8);dummy.rotation.set(0,a,0);dummy.updateMatrix();lantern.setMatrixAt(i,dummy.matrix);lanternHull.setMatrixAt(i,dummy.matrix);}lantern.instanceMatrix.needsUpdate=lanternHull.instanceMatrix.needsUpdate=true;
  for(let i=0;i<20;i++){const x=focus.x+Math.sin(time*.5+i)*12,z=focus.z+Math.cos(time*.3+i)*12;dummy.position.set(x,height(x,z)+1.4+Math.sin(time+i)*.3,z);dummy.scale.set(Math.max(.1,Math.abs(Math.sin(time*9+i))),1,1);dummy.rotation.set(0,time+i,.4);dummy.updateMatrix();butterflies.setMatrixAt(i,dummy.matrix);}butterflies.instanceMatrix.needsUpdate=true;
  rain.visible=weather==='rain';if(rain.visible){for(let i=0;i<80;i++){dummy.position.set(focus.x+(i*7%31)-15,focus.y+12-(time*13+i)%12,focus.z+(i*11%29)-14);dummy.scale.set(.025,.65,.025);dummy.rotation.set(0,0,.2);dummy.updateMatrix();rain.setMatrixAt(i,dummy.matrix);}rain.instanceMatrix.needsUpdate=true;}
 }};
}

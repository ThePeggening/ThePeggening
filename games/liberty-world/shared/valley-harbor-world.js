import * as THREE from 'three';
import {brand} from './brand.js';
import {worldPalette as W} from './world-palette.js';
import {mergeParts} from './scene-kit.js';
import {harborDock as dock} from './valley-harbor-data.js';
import {cartOffset,throwFlight} from './valley-harbor-model.js';
export function createHarborWorld(scene,toon,resources,world,model){
 const B=brand.colors,root=new THREE.Group();root.name='Harbor Days';scene.add(root);
 const box=resources.own(new THREE.BoxGeometry(1,1,1)),cyl=resources.own(new THREE.CylinderGeometry(.5,.5,1,8)),orb=resources.own(new THREE.SphereGeometry(.5,8,6)),flag=resources.own(new THREE.ConeGeometry(.5,1,3)),dummy=new THREE.Object3D(),mat=toon.material(B.text,{vertexColors:true});
 function shape(parts,g,c,x,y,z,sx,sy=sx,sz=sx,rz=0){dummy.position.set(x,y,z);dummy.rotation.set(0,0,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();parts.push({geometry:g,color:c,matrix:dummy.matrix.clone()});}
 function mesh(parts,parent=root){const m=new THREE.Mesh(resources.own(mergeParts(parts)),mat);parent.add(m);return m;}
 const station=new THREE.Group();station.position.set(dock.x,world.heightAt(dock.x,dock.z),dock.z);root.add(station);
 const parts=[];shape(parts,box,W.wood,-3,1,0,.2,2,.2);shape(parts,box,W.wood,-5,1,0,.2,2,.2);shape(parts,box,B.surface,-4,2,0,2.6,1.3,.16);
 // Flush floor stripes keep the walking corridor clear.
 for(let i=0;i<5;i++)shape(parts,box,i%2?B.gold:W.wood,0,.06,-i*1.5,2,.09,.22);
 shape(parts,box,W.wood,0,.05,-7,9,.08,.12);mesh(parts,station);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle=B.surface;ctx.fillRect(0,0,512,256);ctx.textAlign='center';ctx.fillStyle=B.gold;ctx.font='800 45px Arial';ctx.fillText('HARBOR DAYS',256,75);ctx.fillStyle=B.text;ctx.font='600 27px Arial';ctx.fillText('SALVAGE · LOAD · DECORATE',256,135);ctx.fillStyle=B.primary;ctx.font='700 32px Arial';ctx.fillText('E / TAP TO JOIN',256,202);
 const texture=resources.own(new THREE.CanvasTexture(canvas));texture.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Mesh(resources.own(new THREE.PlaneGeometry(2.5,1.22)),resources.own(new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide})));sign.position.set(-4,2,.09);station.add(sign);
 const crateParts=[];shape(crateParts,box,W.wood,0,.5,0,1,1,1);shape(crateParts,box,B.pulseBlue,0,.51,0,1.04,.3,1.04);shape(crateParts,box,B.gold,0,1.03,0,.2,.06,.9);shape(crateParts,box,B.gold,0,1.04,0,.9,.06,.2);
 const crateGeo=resources.own(mergeParts(crateParts)),crates=Array.from({length:3},()=>{const m=new THREE.Mesh(crateGeo,mat);root.add(m);return m;});
 const keepsake=new THREE.Mesh(resources.own(new THREE.OctahedronGeometry(.43)),toon.material(B.gold));root.add(keepsake);
 const cartParts=[];shape(cartParts,box,W.wood,0,.65,0,2.2,.2,1.5);shape(cartParts,box,B.primary,0,1.02,-.75,2.2,.65,.12);for(const x of [-1.1,1.1])shape(cartParts,box,B.primary,x,1.02,0,.12,.65,1.5);for(const x of [-.85,.85])for(const z of [-.5,.5])shape(cartParts,cyl,W.outline,x,.3,z,.5,.2,.5,Math.PI/2);const cart=mesh(cartParts,station);cart.position.z=-7;
 const cargo=resources.own(new THREE.InstancedMesh(crateGeo,mat,5));cart.add(cargo);for(let i=0;i<5;i++){dummy.position.set((i%3-1)*.58,.78+Math.floor(i/3)*.5,(i%2-.5)*.4);dummy.rotation.set(0,0,0);dummy.scale.setScalar(.48);dummy.updateMatrix();cargo.setMatrixAt(i,dummy.matrix);}cargo.instanceMatrix.needsUpdate=true;cargo.computeBoundingSphere();cargo.count=0;
 const parcel=new THREE.Mesh(crateGeo,mat);parcel.scale.setScalar(.45);station.add(parcel);parcel.visible=false;
 const decor={};let deco=[];for(const x of [-6,6]){shape(deco,box,W.wood,x,1.8,-7,.16,3.6,.16);shape(deco,box,B.primary,x,3.5,-7,.7,.65,.7);shape(deco,box,B.gold,x,3.5,-6.63,.4,.4,.04);}decor.lanterns=mesh(deco,station);
 deco=[];for(const x of [-5,5])shape(deco,box,W.wood,x,2,-9,.14,4,.14);shape(deco,box,W.wood,0,4,-9,10,.06,.06);for(let i=0;i<9;i++)shape(deco,flag,[B.primary,B.accent,B.gold][i%3],i-4,3.65,-9,.72,.68,.08,Math.PI);decor.pennants=mesh(deco,station);
 deco=[];shape(deco,box,W.wood,7,.9,-2,2.8,.16,1.3);for(const x of [6,8])shape(deco,box,W.wood,x,.45,-2,.16,.9,.8);for(const z of [-3.2,-.8]){shape(deco,box,W.barkLight,7,.45,z,3,.15,.5);for(const x of [6,8])shape(deco,box,W.wood,x,.2,z,.16,.4,.4);}for(const [x,z,c]of [[6,-3.3,B.accent],[8,-.7,B.pulseBlue]]){shape(deco,box,c,x,.95,z,.5,1,.4);shape(deco,orb,W.plaza,x,1.7,z,.55);shape(deco,box,W.wood,x,1.1,z-.3,.6,.15,.6);}decor.picnic=mesh(deco,station);
 let clock=0;
 function update(dt,focus,reduceMotion){clock+=dt;const near=Math.hypot(focus.x-dock.x,focus.z-dock.z)<90;station.visible=near;for(const [id,m]of Object.entries(decor))m.visible=model.data.decor.includes(id);const a=model.data.active,r=model.route;
  for(let i=0;i<3;i++){const m=crates[i],p=r?.points[i];m.visible=!!p&&!a.collected.includes(i)&&Math.hypot(focus.x-p.x,focus.z-p.z)<85;if(m.visible)m.position.set(p.x,world.heightAt(p.x,p.z),p.z);}
  keepsake.visible=!!r&&!a.secret&&Math.hypot(focus.x-r.secret.x,focus.z-r.secret.z)<45;if(keepsake.visible){keepsake.position.set(r.secret.x,world.heightAt(r.secret.x,r.secret.z)+.85,r.secret.z);keepsake.rotation.y=reduceMotion?0:clock;}
  const round=model.round;cart.position.x=round?cartOffset(round.time):0;const f=round?.flight;cargo.count=round?round.hits-(f?.hit&&f.age<throwFlight?1:0):model.data.completed?3:0;parcel.visible=near&&!!f&&f.age<=throwFlight;if(parcel.visible){const t=Math.min(1,f.age/throwFlight);parcel.position.set(0,1+Math.sin(t*Math.PI)*2.8+.2*t,-7*t);parcel.rotation.set(t*2,0,t);}
 }
 resources.onDispose(()=>root.remove());return {update,marker:station,get stats(){return {visibleCrates:crates.filter(m=>m.visible).length,decorations:model.data.decor.length,textureMB:.67,meshes:12};}};
}

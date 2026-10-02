// Pool Springs additions use the Valley's existing materials/geometry kit. No terrain replacement.
import * as THREE from 'three';
import {brand} from './brand.js';
import {worldPalette as W} from './world-palette.js';
import {poolPlaces} from './valley-pool-model.js?v=s1';
import {mergeParts} from './scene-kit.js';
export function createPoolWorld(scene,toon,resources,world,model){
 const B=brand.colors,root=new THREE.Group();root.name='Pool Springs · shared water trial';scene.add(root);resources.onDispose(()=>root.removeFromParent());
 const box=resources.own(new THREE.BoxGeometry(1,1,1)),cylinder=resources.own(new THREE.CylinderGeometry(1,1,1,12)),ring=resources.own(new THREE.TorusGeometry(.57,.07,6,16)),dummy=new THREE.Object3D(),parts=[],height=world.heightAt;
 function add(g,c,x,y,z,sx,sy=sx,sz=sx,rx=0,ry=0){dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(rx,ry,0);dummy.updateMatrix();parts.push({geometry:g,color:c,matrix:dummy.matrix.clone()});}
 const wheels=[],waters=[],boards=[];const waterMat=resources.own(new THREE.MeshStandardMaterial({color:'#69d7df',roughness:.3,metalness:.05,transparent:true,opacity:.83}));
 const nursery=poolPlaces.nursery,orchard=poolPlaces.orchard;
 for(const [key,p]of [['nursery',nursery],['orchard',orchard]]){const y=height(p.x,p.z),wx=p.x,wz=p.z-1.4;
  add(cylinder,W.stone,wx,y+.15,wz,.85,.3,.85);add(box,W.wood,wx,y+.85,wz,.22,1.6,.22);add(box,B.surface,wx,y+2.8,wz,2.7,.94,.14);
  const wheel=new THREE.Group();wheel.position.set(wx,y+1.52,wz+.16);const rim=new THREE.Mesh(ring,toon.material(B.gold));wheel.add(rim);for(const angle of [0,Math.PI/2]){const spoke=new THREE.Mesh(box,toon.material(W.barkLight));spoke.scale.set(.075,1.04,.075);spoke.rotation.z=angle;wheel.add(spoke);}root.add(wheel);wheels.push({key,wheel});
  const bx=p.x+2.15,bz=p.z-1.4,by=height(bx,bz);add(cylinder,W.stone,bx,by+.1,bz,1.15,.2,1.15);for(let i=0;i<12;i++){const a=i*Math.PI/6;add(box,W.rockLight,bx+Math.sin(a)*1.04,by+.58,bz+Math.cos(a)*1.04,.55,.98,.16,0,a);}
  const water=new THREE.Mesh(cylinder,waterMat);water.scale.set(.93,.06,.93);water.position.set(bx,by+.22,bz);root.add(water);waters.push({key,water,by});
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;const ctx=canvas.getContext('2d'),tex=resources.own(new THREE.CanvasTexture(canvas));tex.colorSpace=THREE.SRGBColorSpace;
  const geo=resources.own(new THREE.PlaneGeometry(2.62,.82)),mat=resources.own(new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide})),sign=new THREE.Mesh(geo,mat);sign.position.set(wx,y+2.8,wz+.08);root.add(sign);boards.push({key,ctx,tex,last:''});
 }
 // A light, raised feeder pipe crosses the river without changing its collision or bridges.
 const pts=[[57.15,83.6],[53,81.8],[47,80],[41,79],[35,77],[30.15,74.6]].map(([x,z])=>new THREE.Vector3(x,Math.max(1.8,height(x,z)+.28),z));
 const curve=new THREE.CatmullRomCurve3(pts),pipeGeo=resources.own(new THREE.TubeGeometry(curve,56,.17,6,false)),pipe=new THREE.Mesh(pipeGeo,toon.material(W.stone));root.add(pipe);
 const dotGeo=resources.own(new THREE.SphereGeometry(.14,6,4)),dots=resources.own(new THREE.InstancedMesh(dotGeo,resources.own(new THREE.MeshBasicMaterial({color:B.pulseCyan})),14));dots.frustumCulled=false;dots.count=0;root.add(dots);
 const plants=new THREE.Group();plants.position.set(orchard.x+2.2,height(orchard.x+2.2,orchard.z+2),orchard.z+2);root.add(plants);
 for(let i=0;i<5;i++){const stem=new THREE.Mesh(box,toon.material(W.leaf));stem.scale.set(.07,.45,.07);stem.position.set((i-2)*.45,.24,0);plants.add(stem);const bloom=new THREE.Mesh(resources.own(new THREE.IcosahedronGeometry(.18,0)),toon.material(i%2?W.flower:W.flowerGold));bloom.position.set((i-2)*.45,.58,0);plants.add(bloom);}
 const reserve=new THREE.Mesh(cylinder,waterMat);reserve.position.set(nursery.x+4.5,height(nursery.x+4.5,nursery.z-1.4)+.4,nursery.z-1.4);reserve.scale.set(.8,.3,.8);root.add(reserve);add(cylinder,W.rockDark,reserve.position.x,reserve.position.y-.16,reserve.position.z,.97,.16,.97);
 const staticGeo=resources.own(mergeParts(parts)),staticMesh=new THREE.Mesh(staticGeo,world.kit.material),hull=new THREE.Mesh(staticGeo,world.kit.outline);root.add(hull,staticMesh);
 const rvY=height(reserve.position.x,reserve.position.z);let time=0;
 function update(dt,focus,reduceMotion=false){time+=dt;root.visible=Math.min(Math.hypot(focus.x-nursery.x,focus.z-nursery.z),Math.hypot(focus.x-orchard.x,focus.z-orchard.z))<95;if(!root.visible)return;
  const d=model.data,m=model.metrics(),hasWater=d.deposited||d.restored;
  for(const w of wheels){const target=-m[w.key]/80*Math.PI*1.5;w.wheel.rotation.z=reduceMotion?target:THREE.MathUtils.lerp(w.wheel.rotation.z,target,1-Math.exp(-dt*9));}
  for(const a of waters){const fill=hasWater?m[a.key]/100:0;a.water.visible=fill>0;a.water.scale.y=Math.max(.012,fill*.9);a.water.position.y=a.by+.21+a.water.scale.y*.5;}
  reserve.visible=hasWater;reserve.scale.y=Math.max(.025,m.reserve/100*.9);reserve.position.y=rvY+.14+reserve.scale.y*.5;
  dots.count=hasWater&&m.orchard>0?14:0;for(let i=0;i<dots.count;i++){const t=reduceMotion?i/14:(i/14+time*.12)%1;dummy.position.copy(curve.getPoint(t));dummy.position.y+=.11;dummy.scale.setScalar(1);dummy.rotation.set(0,0,0);dummy.updateMatrix();dots.setMatrixAt(i,dummy.matrix);}dots.instanceMatrix.needsUpdate=true;
  plants.scale.y=d.tested||d.restored?1:.26;
  for(const b of boards){const text=(b.key==='nursery'?'SPRING · NURSERY':'ORCHARD WHEEL')+'|'+(hasWater?m[b.key]+' / 100 WATER':'AWAITING SUPPLIES');if(text===b.last)continue;b.last=text;const c=b.ctx;c.fillStyle=B.surface;c.fillRect(0,0,512,160);c.fillStyle=B.primary;c.fillRect(0,150,512,10);c.textAlign='center';c.textBaseline='middle';c.fillStyle=B.text;c.font='800 31px Arial';c.fillText(text.split('|')[0],256,46);c.fillStyle=B.gold;c.font='700 26px Arial';c.fillText(text.split('|')[1],256,107);b.tex.needsUpdate=true;}
 }
 return {update,wheel:key=>wheels.find(w=>w.key===key)?.wheel,get stats(){return {visible:root.visible,flowMarkers:dots.count,nursery:model.metrics().nursery,orchard:model.metrics().orchard,reserve:model.metrics().reserve,irrigated:model.data.tested||model.data.restored};}};
}

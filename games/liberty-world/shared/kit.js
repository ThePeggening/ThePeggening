import * as THREE from 'three';
import {brand} from './brand.js';
import {worldPalette as W} from './world-palette.js';
import {heightAt} from './terrain.js';
import {rng} from './rng.js';
const B=brand.colors;
export function createKit(scene,toon,resources,assets){
  const geometries={box:resources.own(new THREE.BoxGeometry(1,1,1)),cylinder:resources.own(new THREE.CylinderGeometry(.5,.5,1,8)),cone:resources.own(new THREE.ConeGeometry(.5,1,7)),leaf:resources.own(new THREE.IcosahedronGeometry(.5,1)),rock:resources.own(new THREE.IcosahedronGeometry(.5,0)),ring:resources.own(new THREE.TorusGeometry(.5,.09,6,16))};
  const batches=new Map(),dummy=new THREE.Object3D(),color=new THREE.Color();
  function part(shape,key,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0){if(!batches.has(shape))batches.set(shape,[]);batches.get(shape).push({color:key,x,y,z,sx,sy,sz,rx,ry,rz});}
  function compose(key,x,z,scale=1){if(assets?.envModels[key]){const model=assets.instantiateEnv(key);model.position.set(x,heightAt(x,z),z);model.scale.multiplyScalar(scale);scene.add(model);return;}
    const y=heightAt(x,z),p=(shape,color,px,py,pz,sx,sy,sz,rx=0,ry=0,rz=0)=>part(shape,color,x+px*scale,y+py*scale,z+pz*scale,sx*scale,sy*scale,sz*scale,rx,ry,rz);
    if(key==='liberty-arch'){
      p('box',W.stone,0,.15,0,9,.3,3);p('box',W.rockLight,0,.45,0,8,.3,2.5);
      for(const side of [-1,1]){p('box',W.rockDark,side*3,.7,0,1.7,.4,1.5);p('cylinder',B.primary,side*3,2.35,0,1.1,3,1.1);for(const h of [1,3.7])p('cylinder',B.gradientMiddle,side*3,h,0,1.45,.32,1.45);p('box',B.glow,side*3,2.6,.65,.62,1.5,.06);p('leaf',B.gold,side*3,4.1,0,1,1.1,1);}
      p('box',B.primary,0,4.3,0,7,.65,1);p('box',B.accent,0,4.75,0,7.7,.22,1.4);p('ring',B.gold,0,5.35,.18,1.9,1.9,1.9);p('leaf',B.logoCoral,0,5.35,.22,.75,1.1,.3);
      for(let i=0;i<5;i++)p('leaf',[B.primary,B.accent,B.gold,B.logoCoral,B.glow][i],(i-2)*.36,5.45+Math.sin(i/4*Math.PI)*.5,.18,.3,.95,.16,0,0,-(i-2)*.28);
      p('box',B.accent,-4,3,-.1,.75,1.5,.09,0,0,-.1);p('box',B.primary,4,3,-.1,.75,1.5,.09,0,0,.1);
    }else if(key==='signal-spire'){
      p('cylinder',W.stone,0,.3,0,4,.6,4);p('cylinder',B.surface2,0,4.2,0,.5,8,.5);
      for(let i=0;i<5;i++){const c=[B.pulseRed,B.pulseMagenta,B.pulsePurple,B.pulseBlue,B.pulseCyan][i];p('box',c,0,1.9+i*1.45,0,2.9-i*.3,.65,1.4,0,.32,0);p('box',B.text,0,2.3+i*1.45,0,2.5-i*.3,.06,1.2,0,.32,0);}
      p('cone',B.pulseCyan,0,9.3,0,.8,1.9,.8);
    }else if(key==='wooden-bridge'){
      for(let i=0;i<10;i++)p('box',i%2?W.wood:W.barkLight,0,.8,(i-4.5)*.65,4,.26,.58);
      for(const side of [-1,1]){for(let i=0;i<4;i++)p('box',W.wood,side*2,1.6,(i-1.5)*2,.22,1.8,.22);p('box',B.primary,side*2,2.2,0,.2,.2,6.6);p('box',W.wood,side*2,1.35,0,.16,.16,6.6);}
    }else if(key==='signal-lamp'){
      p('cylinder',W.stone,0,.18,0,.9,.36,.9);p('cylinder',B.glow,0,1.5,0,.18,2.8,.18);p('cylinder',B.primary,0,2.7,0,.45,.25,.45);p('leaf',B.gold,0,3.1,0,.72,.95,.72);p('cone',B.glow,0,3.75,0,1,.4,1);
    }else if(key==='planter'){
      p('box',W.wood,0,.4,0,1.6,.8,1.2);p('box',W.barkLight,0,.8,0,1.8,.15,1.4);for(const side of [-1,1])p('box',B.accent,side*.85,.4,.61,.07,.6,.06);for(let i=0;i<4;i++){p('cylinder',W.pine,(i-1.5)*.3,1.1,0,.06,.65,.06);p('leaf',i%2?W.flower:W.flowerGold,(i-1.5)*.3,1.45,0,.45,.25,.4);}
    }else if(key==='tree'){
      p('cylinder',W.wood,0,1.5,0,.6,3,.6);p('cylinder',W.barkLight,-.25,2,.1,.35,1.4,.35,0,0,-.55);p('leaf',W.leaf,0,3.5,0,3.8,3.1,3.5);p('leaf',W.leafLight,-1.1,3.8,.3,2.5,2.1,2.3);p('leaf',W.pine,.9,3,.2,2.8,2,2.5);
    }else if(key==='rock'){
      p('rock',W.rockDark,0,.38,0,1.6,.9,1.3,0,.4,.1);p('rock',W.rockLight,-.3,.73,-.1,.9,.8,.8,0,-.3,.15);p('rock',W.stone,.65,.2,.5,.7,.5,.6);
    }
  }
  compose('liberty-arch',0,-6);compose('signal-spire',17,-20);compose('wooden-bridge',-15,-15);for(const [x,z]of [[-6,3],[6,3],[-6,-11],[6,-11]])compose('signal-lamp',x,z);compose('planter',-4,-4);compose('planter',4,-4);
  const random=rng(991);for(let i=0;i<28;i++){let x=(random()-.5)*90,z=(random()-.5)*80-10;if(Math.abs(x)<16&&z>-30&&z<38)x=(x<0?-1:1)*(22+random()*6);if(Math.hypot(x-14,z-23)<12)z-=24;compose('tree',x,z,.8+random()*.5);}for(let i=0;i<34;i++)compose('rock',(random()-.5)*74,(random()-.5)*65,.4+random()*.7);
  // Path and rails make the small foundation course legible without a hub build.
  for(let i=0;i<9;i++){const z=10-i*3;part('box',W.path,0,heightAt(0,z)+.035,z,4.3,.07,3.05);part('box',B.primary,2.3,heightAt(2.3,z)+.04,z,.12,.1,2.4);part('box',B.accent,-2.3,heightAt(-2.3,z)+.04,z,.12,.1,2.4);}
  part('box',W.wood,0,.48,1.5,3.1,.35,.3);for(const side of [-1,1])part('box',W.stone,side*1.6,.32,1.5,.4,.65,.65);
  for(let i=0;i<95;i++){const x=(random()-.5)*54,z=(random()-.5)*48; if(Math.abs(x)<3&&z<14&&z>-20)continue;const y=heightAt(x,z);part('leaf',W.flowerGold,x,y+.48,z,.15,.12,.15);for(let j=0;j<5;j++){const a=j/5*Math.PI*2;part('rock',i%3?W.cloud:W.flower,x+Math.cos(a)*.17,y+.45,z+Math.sin(a)*.17,.24,.14,.24);}part('cylinder',W.pine,x,y+.18,z,.06,.45,.06);}
  const main=toon.material(B.text),edge=toon.outline(B.text);for(const [shape,list]of batches){const mesh=new THREE.InstancedMesh(geometries[shape],main,list.length),hull=new THREE.InstancedMesh(geometries[shape],edge,list.length);resources.own(mesh);resources.own(hull);mesh.castShadow=true;mesh.receiveShadow=true;for(let i=0;i<list.length;i++){const p=list[i];dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.rx,p.ry,p.rz);dummy.scale.set(p.sx,p.sy,p.sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);hull.setMatrixAt(i,dummy.matrix);color.set(p.color);mesh.setColorAt(i,color);hull.setColorAt(i,toon.tint(p.color));}mesh.instanceMatrix.needsUpdate=hull.instanceMatrix.needsUpdate=true;hull.renderOrder=-1;scene.add(hull,mesh);}
  const grassGeo=resources.own(new THREE.ConeGeometry(.19,.7,3));grassGeo.translate(0,.35,0);const grass=new THREE.InstancedMesh(grassGeo,toon.grassMaterial(),560),grassHull=new THREE.InstancedMesh(grassGeo,toon.wind(toon.outline(W.grassDark,false,.45)),560);resources.own(grass);resources.own(grassHull);for(let i=0;i<560;i++){const x=(random()-.5)*60,z=(random()-.5)*55;dummy.position.set(x,heightAt(x,z),z);dummy.rotation.set(0,random()*6.28,0);const hidden=Math.abs(x)<2.8&&z<14&&z>-19;dummy.scale.setScalar(hidden?0:.65+random()*.9);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);grassHull.setMatrixAt(i,dummy.matrix);grass.setColorAt(i,color.set(i%3?W.grass:W.grassLight));}grass.instanceMatrix.needsUpdate=grassHull.instanceMatrix.needsUpdate=true;scene.add(grassHull,grass);
  const water=new THREE.Mesh(resources.own(new THREE.PlaneGeometry(9,38,1,1)),resources.own(new THREE.MeshBasicMaterial({color:W.water})));water.rotation.x=-Math.PI/2;water.position.set(-15,.26,-17);scene.add(water);
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d'),gradient=c.createLinearGradient(0,0,512,0);gradient.addColorStop(0,B.gradientOrange);gradient.addColorStop(.55,B.gradientMiddle);gradient.addColorStop(1,B.accent);c.fillStyle=gradient;c.fillRect(0,0,512,128);c.fillStyle=B.text;c.textAlign='center';c.font='400 38px "Soloist Extra Italic"';c.fillText('LIBERTY',256,53);c.font='700 18px "BT Beau Sans"';c.fillText('SHARED FOUNDATION',256,92);const texture=resources.own(new THREE.CanvasTexture(canvas));texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;const sign=new THREE.Mesh(resources.own(new THREE.PlaneGeometry(4.2,1.05)),resources.own(new THREE.MeshBasicMaterial({map:texture})));sign.position.set(0,4.27,.53-6);scene.add(sign);
  return {grass,grassHull,batches,colliders:[{x:-3,z:-6,w:.7,d:.7},{x:3,z:-6,w:.7,d:.7}],setFoliage(density){grass.count=grassHull.count=Math.floor(560*density);}};
}

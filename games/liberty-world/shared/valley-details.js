import * as THREE from 'three';
import {brand} from './brand.js';
import {worldPalette as W} from './world-palette.js';
import {mergeParts} from './scene-kit.js';
import {rng} from './rng.js';

// District furniture stays in a few static batches. Clear roads and quest spots
// remain traversable; these details do not introduce new invisible colliders.
export function createValleyDetails(scene,toon,resources,kit,height,districts){
 const B=brand.colors,random=rng(91137),dummy=new THREE.Object3D(),parts=[],groups=[],signs=[],reveals=[],gears=[];
 const box=resources.own(new THREE.BoxGeometry(1,1,1)),sphere=resources.own(new THREE.IcosahedronGeometry(1,1)),lowSphere=resources.own(new THREE.IcosahedronGeometry(1,0)),ring=resources.own(new THREE.TorusGeometry(1,.14,4,12)),cylinder=resources.own(new THREE.CylinderGeometry(.5,.5,1,8)),leaf=resources.own(new THREE.ConeGeometry(.5,1,3));
 function piece(g,color,x,y,z,sx,sy=sx,sz=sx,yaw=0,roll=0){dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(0,yaw,roll);dummy.updateMatrix();parts.push({geometry:g,matrix:dummy.matrix.clone(),color});}
 function batch(x,z,threshold=0){if(!parts.length)return;const geo=resources.own(mergeParts(parts)),mesh=new THREE.Mesh(geo,kit.material),hull=new THREE.Mesh(geo,kit.outline);parts.length=0;scene.add(hull,mesh);const g={x,z,mesh,hull,threshold};groups.push(g);if(threshold)reveals.push(g);return g;}
 function planted(x,z,size=1){const y=height(x,z);piece(box,W.stone,x,y+.26,z,2.3*size,.5,1.05*size);piece(box,W.wood,x,y+.54,z,2*size,.08,.8*size);for(let i=0;i<4;i++){const dx=(i-1.5)*.46*size;piece(lowSphere,i%2?W.leaf:W.pine,x+dx,y+.78,z,.45*size,.42,.4);piece(lowSphere,i%2?W.flowerGold:W.flower,x+dx,y+1.1,z,.16,.15,.16);}}
 function bench(x,z,yaw=0){const y=height(x,z);piece(box,W.wood,x,y+.72,z,2.8,.2,.9,yaw);for(const side of [-1,1])piece(box,W.stone,x+side,y+.32,z,.25,.65,.65);piece(box,W.barkLight,x,y+1.35,z-.35,2.8,.65,.12,yaw);}
 function broadleaf(x,z,s=1){const y=height(x,z);piece(cylinder,W.wood,x,y+1.8*s,z,.45*s,3.6*s,.45*s);for(let i=0;i<3;i++)piece(sphere,[W.pine,W.leaf,W.leafLight][i],x+(i-1)*.8*s,y+(3.4+i*.3)*s,z+(i%2)*.65*s,1.65*s,1.25*s,1.5*s);}
 // A tended entrance, lamps, curbstones and a sheltered community square.
 for(const side of [-1,1]){
  for(let z=-8;z<36;z+=3.2)piece(box,W.stone,side*5.15,height(side*5.15,z)+.14,z,.42,.28,2.85);
  for(const z of [3,23]){planted(side*8.4,z);bench(side*10.4,z-3);piece(kit.templates['signal-lamp'],B.text,side*6.4,height(side*6.4,z),z,.88,.88,.88);}
  for(const z of [32,-8])broadleaf(side*13,z,.9);
  for(let i=0;i<7;i++)piece(leaf,i%2?B.primary:B.accent,side*(.6+i*.63),7.3-Math.sin(i*.43)*.4,14.15,.42,.7,.07,0,Math.PI);
 }
 for(let i=0;i<16;i++){const a=i*Math.PI/8,x=Math.sin(a)*14,z=-20+Math.cos(a)*14;piece(box,W.stone,x,height(x,z)+.16,z,2.8,.32,.5,a);}
 for(const x of [-10,10]){planted(x,-30,1.25);bench(x,-34);}
 batch(0,0);
 // Natural stone trim, inset doors and window frames give the branded halls scale.
 for(const d of districts.filter(d=>d.key==='product-hall')){const {x,z}=d,s=d.scale,y=height(x,z);
  piece(box,W.stone,x,y+.8*s,z+2.08*s,4.3*s,.38*s,.28*s);
  for(const dx of [-1.88,1.88]){piece(box,W.stone,x+dx*s,y+2.7*s,z+2.08*s,.23*s,3.1*s,.25*s);piece(box,W.rockLight,x+dx*s,y+4.13*s,z+2.14*s,.43*s,.25*s,.4*s);}
  piece(box,B.surface,x,y+1.7*s,z+2.07*s,1.14*s,1.85*s,.09);
  piece(box,W.barkLight,x,y+2.67*s,z+2.17*s,1.32*s,.12*s,.24*s);
  piece(box,B.primary,x+.38*s,y+1.62*s,z+2.2*s,.06*s,.2*s,.07*s);
  for(const dx of [-1.3,1.3]){piece(box,W.rockLight,x+dx*s,y+2.7*s,z+2.2*s,.68*s,.12*s,.2*s);piece(box,W.rockLight,x+dx*s,y+2.7*s,z+2.2*s,.07*s,1.4*s,.2*s);}
  planted(x-2.8*s,z+1.6*s);planted(x+2.8*s,z+1.6*s);
  if(d.id==='harbor'){for(let i=0;i<4;i++)piece(kit.templates.crate,B.text,x-8+i*1.1,y,z-7,1,1,1);piece(cylinder,W.wood,x+7,y+3,z, .45,6,.45);piece(box,W.barkLight,x+5.5,y+5.7,z,3.5,.3,.3);piece(ring,W.barkLight,x+4.1,y+4.8,z,.65,.65,.65);}
  if(d.id==='shield'){for(let i=0;i<7;i++)piece(box,W.stone,x+(i-3)*1.4,y+4.35*s,z+2*s,.68,.85,.6);piece(ring,B.gold,x,y+3.7*s,z+2.2*s,.8,.8,.2);}
  if(d.id==='stables'){for(const side of [-1,1]){piece(cylinder,W.rockDark,x+side*4,y+6,z-4,1.1,12,1.1);piece(cylinder,B.primary,x+side*4,y+10.5,z-4,1.25,.7,1.25);}const gear=new THREE.Mesh(ring,kit.material);gear.position.set(x,y+3.6*s,z+2.3*s);gear.scale.setScalar(1.1);scene.add(gear);gear.material=toon.material(B.gold);const hull=toon.hull(gear);gears.push({mesh:gear,hull,x,z});}
  if(d.id==='vault')for(let i=0;i<3;i++)piece(ring,i%2?B.primary:B.accent,x,y+2.4*s,z+2.25*s+i*.06,1.6-i*.23,1.6-i*.23,.2);
  batch(x,z);
 }
 // Striped market canopies and goods; the festival bunting arrives with Feather 5.
 for(const [x,z]of [[-9,107],[9,107],[-11,91]]){const y=height(x,z);piece(box,W.wood,x,y+1,z,3,.3,1.8);for(const dx of [-1.4,1.4])for(const dz of [-.85,.85])piece(box,W.barkLight,x+dx,y+1.7,z+dz,.14,3.4,.14);for(let i=0;i<6;i++)piece(box,i%2?W.cloud:B.accent,x+(i-2.5)*.54,y+3.45,z,.54,.13,2.4,0,.08);for(let i=0;i<5;i++)piece(lowSphere,i%2?W.flowerGold:W.leafLight,x+(i-2)*.44,y+1.38,z,.22,.22,.22);}
 batch(0,100);
 for(let i=0;i<18;i++)piece(leaf,i%2?B.primary:B.accent,(i-8.5)*1.2,6-Math.sin(i/17*Math.PI)*1.1,90,.62,.85,.07,0,Math.PI);batch(0,100,5);
 // Reeds, smooth bank stones and the orchard's fruit visibly return with Growth.
 for(let i=0;i<22;i++){const a=i*.286,x=95+Math.sin(a)*36.8,z=100+Math.cos(a)*36.8,y=height(x,z);piece(lowSphere,i%3?W.rockDark:W.rockLight,x,y+.24,z,.8,.48,.68);for(let j=0;j<3;j++)piece(leaf,j%2?W.leaf:W.pine,x+j*.22,y+.5,z,.15,.9+random()*.6,.15);}
 for(const [x,z]of [[30,82],[34,78],[31,72]])broadleaf(x,z,.8);batch(65,86);
 for(let i=0;i<21;i++){const x=30+(i%3)*2,z=73+Math.floor(i/3)*1.4;piece(lowSphere,i%2?W.flowerGold:W.flower,x,height(x,z)+2.6,z,.2,.23,.2);}batch(30,77,3);
 // Local sign atlas uses only the locked brand palette and original lettering.
 const titles=['LIBERTY VALLEY',...districts.map(d=>d.name.toUpperCase())],canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');
 for(let i=0;i<titles.length;i++){const x=(i%4)*256,y=Math.floor(i/4)*64;ctx.fillStyle=B.surface;ctx.fillRect(x,y,256,64);const stripe=ctx.createLinearGradient(x,y,x+256,y);stripe.addColorStop(0,B.primary);stripe.addColorStop(1,B.accent);ctx.fillStyle=stripe;ctx.fillRect(x,y+58,256,6);ctx.strokeStyle=B.primary;ctx.lineWidth=3;ctx.strokeRect(x+3,y+3,250,58);ctx.fillStyle=B.text;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='800 '+(titles[i].length>18?15:19)+'px '+brand.typography.body;ctx.fillText(titles[i],x+128,y+26,236);ctx.fillStyle=B.textSecondary;ctx.font='500 9px '+brand.typography.body;ctx.fillText(i?'SEVEN FEATHERS · ONE VALLEY':'MAKE ROOM FOR A FRIEND',x+128,y+46,236);}
 const atlas=resources.own(new THREE.CanvasTexture(canvas));atlas.colorSpace=THREE.SRGBColorSpace;atlas.anisotropy=2;const signMaterial=resources.own(new THREE.MeshBasicMaterial({map:atlas,side:THREE.DoubleSide}));
 function sign(index,x,y,z,width){const geo=resources.own(new THREE.PlaneGeometry(width,width*.25)),uv=geo.attributes.uv;for(let i=0;i<uv.count;i++){uv.setXY(i,((index%4)+.01+uv.getX(i)*.98)/4,1-(Math.floor(index/4)+.01+(1-uv.getY(i))*.98)/4);}const m=new THREE.Mesh(geo,signMaterial);m.position.set(x,y,z);m.userData.signId=titles[index];scene.add(m);signs.push(m);}
 sign(0,0,height(0,13)+7.5,14.07,6.8);
 for(let i=0;i<districts.length;i++){const d=districts[i],s=d.scale||1;let y=2.4,z=2.1,width=3.8;if(d.key==='product-hall'){y=3.55*s;z=2.22*s;width=2.9*s;}else if(d.key==='liberty-statue'){y=.32*s;z=1.8*s+.1;width=2.1*s;}else if(d.key==='signal-spire'){y=.36*s;z=2*s+.1;width=2.5*s;}else if(d.key==='lighthouse')z=1.5*s+.1;else if(d.key==='windmill')z=1.4*s+.1;else if(d.key==='house')z=2.3*s+.1;sign(i+1,d.x,height(d.x,d.z)+y,d.z+z,width);}
 const beamGeo=resources.own(new THREE.ConeGeometry(2.6,24,8,1,true)),beamMaterial=resources.own(new THREE.MeshBasicMaterial({color:B.gold,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide})),coastBeam=new THREE.Mesh(beamGeo,beamMaterial);coastBeam.rotation.x=Math.PI/2;coastBeam.position.set(155,height(155,-145)+15,-131);scene.add(coastBeam);
 return {textureMB:1024*256*4*4/3/1048576,update(focus,progress,time,reduceMotion){const feathers=Math.round(progress*7);for(const g of groups)g.mesh.visible=g.hull.visible=feathers>=g.threshold&&Math.hypot(focus.x-g.x,focus.z-g.z)<100;for(const sign of signs)sign.visible=Math.hypot(focus.x-sign.position.x,focus.z-sign.position.z)<100;for(const g of gears){g.mesh.visible=g.hull.visible=Math.hypot(focus.x-g.x,focus.z-g.z)<100;g.mesh.rotation.z=g.hull.rotation.z=feathers>=4&&!reduceMotion?time*.22:0;}coastBeam.visible=feathers>=6&&Math.hypot(focus.x-155,focus.z+145)<110;}};
}

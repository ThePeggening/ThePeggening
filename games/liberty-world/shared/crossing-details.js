// R2 visual overlay: reusable instancing and decorations, no replacement world/character.
import * as THREE from 'three';
import {brand} from './brand.js';
import {forecastClock} from './crossing-features.js?v=r2';
import {trafficAt,laneAt} from './crossing-loop.js?v=r2';
const B=brand.colors;
export function createCrossingDetails(root,resources,W){
  const dummy=new THREE.Object3D(),box=resources.own(new THREE.BoxGeometry(1,1,1));
  function pool(geometry,material,count){const p=resources.own(new THREE.InstancedMesh(geometry,resources.own(material),count));p.frustumCulled=false;p.count=0;p.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(p);return p;}
  const head=pool(box,new THREE.MeshBasicMaterial({color:'#fff4c2',toneMapped:false}),160),tail=pool(box,new THREE.MeshBasicMaterial({color:'#ed3f4e',toneMapped:false}),160);
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=64;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,128,64);ctx.strokeStyle='#59f7ff';ctx.lineWidth=5;ctx.strokeRect(4,4,120,56);ctx.setLineDash([6,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(8,32);ctx.lineTo(120,32);ctx.stroke();
  const scanTexture=resources.own(new THREE.CanvasTexture(canvas));scanTexture.colorSpace=THREE.SRGBColorSpace;
  const forecast=pool(resources.own(new THREE.PlaneGeometry(1,1)),new THREE.MeshBasicMaterial({map:scanTexture,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),128);
  const parcel=new THREE.Group(),paint=resources.own(new THREE.MeshStandardMaterial({color:B.primary,roughness:.32,metalness:.12})),ribbon=resources.own(new THREE.MeshBasicMaterial({color:B.gold}));
  function part(parent,material,x,y,z,sx,sy,sz){const m=new THREE.Mesh(box,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
  part(parcel,paint,0,0,0,.62,.65,.52);part(parcel,ribbon,0,0,.269,.13,.68,.02);part(parcel,ribbon,0,.335,0,.13,.02,.54);part(parcel,ribbon,0,0,.28,.64,.11,.018);root.add(parcel);
  const beacon=new THREE.Group(),gold=resources.own(new THREE.MeshBasicMaterial({color:B.gold,transparent:true,opacity:.85,depthWrite:false})),pad=new THREE.Mesh(resources.own(new THREE.CylinderGeometry(1.55,1.55,.045,24)),gold);beacon.add(pad);
  const ring=new THREE.Mesh(resources.own(new THREE.TorusGeometry(1.05,.075,6,28)),gold);ring.position.y=2.3;beacon.add(ring);const arrow=new THREE.Mesh(resources.own(new THREE.ConeGeometry(.4,.55,4)),gold);arrow.rotation.z=Math.PI;arrow.position.y=1.35;beacon.add(arrow);root.add(beacon);
  function instance(mesh,i,x,y,z,sx,sy,sz,rx=0,ry=0){dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}
  function decorate(add,road,parts,b){
    const start=b*8,z=-start*4;
    // Island promenade: pale paving, inset orange/magenta edge tiles, drain strips.
    add(road,box,'#cfdbc5',0,.035,z-2,53,.055,1.5);
    for(let x=-24;x<=24;x+=4){add(road,box,'#94ac9d',x,.068,z-2,.025,.014,1.46);for(const s of [-1,1])add(road,box,s<0?B.primary:B.accent,x,.049,z+s*1.78,.25,.03,.14);}
    for(const side of [-1,1]){const x=side*27.5;add(parts,box,'#244238',x,.3,z-2,2.6,.6,1.6);add(parts,box,'#e9e2c9',x,.73,z-2,2.9,.22,1.9);add(parts,box,W.grass,x,.94,z-2,2.1,.18,1.1);for(const dx of [-.6,0,.6])add(parts,box,side<0?B.primary:B.accent,x+dx,1.23,z-2,.18,.52,.2);}
    // Small depot kiosk and lamp details stay outside the playable columns.
    for(const side of [-1,1]){const x=side*30;add(parts,box,'#172e39',x,1.1,z-3.7,1.3,2.2,.8);add(parts,box,'#f5e9cb',x,2.3,z-3.7,1.7,.22,1.1);add(parts,box,side<0?B.primary:B.accent,x,1.3,z-3.22,.86,1.15,.08);add(parts,box,B.gold,x,1.64,z-3.14,.62,.07,.04);}
    for(let row=start+2;row<=start+7;row++)for(const x of [-29,29]){add(road,box,'#152733',x,.026,-row*4,1.05,.04,.8);for(let k=-2;k<=2;k++)add(road,box,'#526772',x+k*.16,.051,-row*4,.07,.012,.66);}
  }
  function update(s,time,cars,quality,motion=true){
    let h=0;for(const c of cars){if(h+2>160||Math.abs(c.z-s.z)>44)continue;for(const side of [-1,1]){instance(head,h,c.x+c.direction*c.length*.485,.7,c.z+side*.86,.09,.17,.46);instance(tail,h,c.x-c.direction*c.length*.486,.67,c.z+side*.87,.09,.15,.39);h++;}}head.count=tail.count=h;head.instanceMatrix.needsUpdate=tail.instanceMatrix.needsUpdate=true;
    let n=0;if(s.scoutTime>0){const first=Math.max(2,s.row),end=Math.min(first+8,s.finishRow-1),clock=forecastClock(s);for(let row=first;row<=end;row++)for(const c of trafficAt(laneAt(row,s.seed),clock,s.x-30,s.x+30)){if(n>=128)break;instance(forecast,n++,c.x,.075,c.z,c.length+.1,c.width+.1,1,-Math.PI/2);}}forecast.count=n;forecast.instanceMatrix.needsUpdate=true;
    const live=['run','recover'].includes(s.phase);parcel.visible=!!s.courier&&live;beacon.visible=!!s.courier&&live;
    if(parcel.visible){parcel.position.set(s.x+Math.cos(s.facing)*1.05,1.85+s.hopY,s.z-Math.sin(s.facing)*1.05);parcel.rotation.set(0,s.facing,0);const c=s.courier;beacon.position.set(c.x,.095,c.z);ring.rotation.y=motion?time*.9:0;arrow.position.y=1.35+(motion?Math.sin(time*2.8)*.12:0);}
  }
  return {decorate,update,get stats(){return {forecastMarks:forecast.count,vehicleLights:head.count+tail.count,courierBeacon:beacon.visible};}};
}

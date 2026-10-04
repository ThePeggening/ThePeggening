import * as THREE from 'three';
import {createReachCommon} from './valley-reach-common-world.js';
import {brand} from './brand.js';
import {worldPalette as W} from './world-palette.js';
import {mergeParts} from './scene-kit.js';
import {reachSites as S,reachRoad,inCanal,inArchive,reachInside} from './valley-reach-data.js';
export function createReachWorld(scene,toon,resources,kit,heightAt,waterMaterial){
 const B=brand.colors,root=new THREE.Group(),dummy=new THREE.Object3D(),staticMeshes=[],colliders=[],labels=[];root.name='Lantern Reach · canal restoration';scene.add(root);let model=null,time=0;
 const box=resources.own(new THREE.BoxGeometry(1,1,1)),cylinder=resources.own(new THREE.CylinderGeometry(.5,.5,1,10)),cone=resources.own(new THREE.ConeGeometry(.5,1,8)),rock=resources.own(new THREE.IcosahedronGeometry(1,1)),ring=resources.own(new THREE.TorusGeometry(1,.13,5,20)),mat=kit.material;
 function part(a,g,c,x,y,z,sx,sy=sx,sz=sx,rx=0,ry=0,rz=0){dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();a.push({geometry:g,color:c,matrix:dummy.matrix.clone()});}
 function mesh(a,parent=root){const m=new THREE.Mesh(resources.own(mergeParts(a)),mat);parent.add(m);return m;}
 function solid(x,z,w,d,y,h){colliders.push({x,z,w:w/2,d:d/2,bottom:y,top:y+h});}
 function lamp(a,x,z,y=6){part(a,box,W.wood,x,y+2.4,z,.18,4.8,.18);part(a,box,B.surface,x,y+4.5,z,.85,1,.85);part(a,box,B.gold,x,y+4.5,z+.43,.55,.65,.05);part(a,cone,W.wood,x,y+5.2,z,1.2,.5,1.2);}
 function tree(a,x,z,s=1){const y=heightAt(x,z);part(a,cylinder,W.wood,x,y+2.3*s,z,.55*s,4.6*s,.55*s);part(a,rock,W.leaf,x,y+5*s,z,3*s,2.8*s,3*s);part(a,rock,W.leafLight,x+s,y+6*s,z,2*s,2*s,2*s);solid(x,z,.6,.6,y,4*s);}
 function house(a,x,z,w,d,h,open=false){part(a,box,W.construction,x,6+h/2,z,w,h,d);part(a,box,W.rockDark,x,6.3,z,w+.6,.6,d+.6);for(const side of [-1,1]){part(a,box,W.coastWood,x+side*w*.24,6+h+1.3,z,w*.58,.35,d+1.6,0,0,side*-.5);for(const dz of [-d/2,d/2])part(a,box,W.wood,x+side*w/2,6+h/2,z+dz,.2,h+.1,.2);}for(const dx of [-w*.27,w*.27]){part(a,box,B.surface,x+dx,6+h*.6,z+d/2+.03,1.6,1.7,.08);part(a,box,B.gold,x+dx,6+h*.6,z+d/2+.09,.07,1.7,.04);}part(a,box,W.wood,x,7.4,z+d/2+.04,1.7,2.8,.1);if(!open)solid(x,z,w,d,6,h+2);}
 function cluster(x,z,a){const m=mesh(a);staticMeshes.push({x,z,m});return m;}
 // West quay: boathouses, stacked cargo, shaded landing and lock approach.
 let a=[];house(a,644,87,15,11,6);house(a,674,134,12,10,5);house(a,674,78,9,9,5);
 for(let i=0;i<32;i++)part(a,box,W.coastWood,637+i*.85,6.08,111,.78,.15,8);
 for(const x of [636,664])for(const z of [106,116])part(a,cylinder,W.wood,x,6.65,z,.35,2.4,.35);
 for(let i=0;i<6;i++){const x=661+(i%3)*1.5,z=87+Math.floor(i/3)*1.5;part(a,box,W.barkLight,x,6.65,z,1.2,1.3,1.2);part(a,box,W.wood,x,6.65,z+.61,1.2,.14,.04);solid(x,z,1.2,1.2,6,1.3);}
 for(const [x,z]of [[630,76],[655,65],[686,65],[696,138],[661,153],[628,144]])tree(a,x,z,1.2);for(const [x,z]of [[638,118],[660,108],[701,103]])lamp(a,x,z);
 cluster(655,108,a);
 // Canal retaining walls have a real gap for the restored crossing.
 a=[];for(const x of [725,751])for(const [z,length]of [[30,128],[177,144]]){part(a,box,W.rockDark,x,3.7,z,2.5,5.4,length);part(a,box,W.rockLight,x,6.45,z,3,.35,length);solid(x,z,2.5,length,0,6.6);}
 for(const z of [-24,241])part(a,box,W.rockDark,738,3,z,28,6,3);
 for(const z of [85,119]){part(a,box,W.wood,738,2.5,z,24,4,.45);for(const x of [727,749])part(a,box,W.wood,x,4.2,z,1,8.4,1);}
 for(const [x,z]of [[715,86],[715,119],[756,97],[756,112]])lamp(a,x,z);
 cluster(738,104,a);
 function water(x,z,w,d,y){const m=new THREE.Mesh(resources.own(new THREE.PlaneGeometry(w,d)),waterMaterial);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);root.add(m);return m;}
 const canalWater=[water(738,30,22,108,5),water(738,181,22,120,5),water(640,116.5,40,25,4.9)],lockWater=water(738,102,22,33,5.5),archiveWater=water(912,159,42,40,5.3);
 a=[];part(a,kit.templates.boat,B.text,630,4.9,120,1.8,1.8,1.8);mesh(a);
 const bridge=new THREE.Group();root.add(bridge);a=[];for(let i=0;i<43;i++)part(a,box,W.barkLight,717+i,6.12,100,.93,.24,6);for(const z of [97,103]){part(a,box,W.wood,738,7.2,z,44,.16,.16);for(let x=717;x<=759;x+=3)part(a,box,W.wood,x,6.7,z,.16,1.4,.16);}mesh(a,bridge);
 a=[];part(a,box,W.wood,718,8.3,100,.4,4.6,6);const closedBridge=mesh(a);
 const sluices=['inlet','outlet'].map(id=>{const p=S[id],g=new THREE.Group();g.position.set(p.x,7.3,p.z);root.add(g);a=[];part(a,ring,B.gold,0,0,0,.8,.8,.8,0,Math.PI/2);part(a,box,W.wood,0,0,0,.15,1.5,.15);part(a,box,W.wood,0,0,0,.15,.15,1.5);mesh(a,g);return g;});
 // Mill yard: exposed hydraulic circuit, working waterwheel, orchard and climbable aqueduct.
 a=[];house(a,832,63,14,12,8);part(a,cylinder,W.rockDark,828,15,65,6,18,6);part(a,cone,W.coastWood,828,25,65,9,4,9);solid(828,65,6,6,6,18);
 for(const [x,z]of [[778,32],[790,18],[817,13],[864,6],[872,67],[773,76],[786,117],[814,120]])tree(a,x,z,1.2);
 for(const [x,z]of [[781,60],[826,40],[856,56]])lamp(a,x,z);
 // Ramp top: y=14 at z=14; bottom: y=6 at z=54. It is broad enough for touch steering.
 part(a,box,W.rockDark,850,6.2,34,10,.4,40);for(let z=14;z<=54;z+=2){const h=6+(54-z)*.2;part(a,box,W.rockLight,850,h-.2,z,10,.4,2.05);for(const x of [845,855]){part(a,box,W.wood,x,h+.7,z,.12,1.4,.12);part(a,box,W.wood,x,h+1.3,z,.12,.12,2.1);}}
 part(a,box,W.rockLight,850,13.8,10,10,.4,8);for(const x of [846,854])for(const z of [10,22,34,46])part(a,box,W.rockDark,x,(6+(54-z)*.2)/2,z,1.4,6+(54-z)*.2,1.4);
 for(const x of [795,801,807,813])for(const z of [99,107]){part(a,box,W.wood,x,6.3,z,4,.6,5);part(a,box,W.ground,x,6.63,z,3.7,.08,4.7);}
 cluster(820,63,a);
 const wheel=new THREE.Group();wheel.position.set(841,10,63);root.add(wheel);a=[];part(a,ring,W.wood,0,0,0,4,4,4,0,Math.PI/2);for(let i=0;i<12;i++){const t=i*Math.PI/6;part(a,box,W.barkLight,0,Math.cos(t)*3.5,Math.sin(t)*3.5,2,.8,1.2,t);part(a,box,W.wood,0,0,0,.25,7,.3,t);}mesh(a,wheel);
 a=[];part(a,ring,B.gold,0,0,0,.9,.9,.9,Math.PI/2);for(let i=0;i<8;i++){const t=i*Math.PI/4;part(a,box,W.wood,Math.sin(t),0,Math.cos(t),.3,.25,.3);}const gear=mesh(a);gear.position.set(850,14.6,14);
 const elbows=[0,1,2].map(i=>{const p=S['pipe'+i],g=new THREE.Group();g.position.set(p.x,6.35,p.z);root.add(g);a=[];part(a,box,W.coastWood,0,0,-1.4,.9,.5,3.7);part(a,box,W.coastWood,1.4,0,0,3.7,.5,.9);part(a,cylinder,B.gold,0,.5,0,1,.25,1);mesh(a,g);return g;});
 const flowMeshes=[];for(const [x,z,sx,sz]of [[790,50,14,.55],[800,44,.55,6],[806,38,6,.55],[812,46,.55,10],[819,52,14,.55]]){a=[];part(a,box,W.rockDark,x,6.14,z,sx+.5,.28,sz+.5);mesh(a);const m=water(x,z,sx,sz,6.3);flowMeshes.push(m);}
 a=[];for(const x of [795,801,807,813])for(const z of [99,107])for(let i=0;i<4;i++){part(a,box,W.grassDark,x-1.2+i*.8,7.1,z,.07,.9,.07);part(a,rock,W.flowerGold,x-1.2+i*.8,7.65,z,.3,.3,.3);}const flowers=mesh(a);
 // Archive: a roofless, readable interior, descending entrance and sealed east room.
 a=[];for(const z of [137,181]){part(a,box,W.rockDark,911,4,z,47,4,1);solid(911,z,47,1,2,4);}for(const [z,d]of [[144,12],[172,16]]){part(a,box,W.rockLight,887,5,z,1,6,d);solid(887,z,1,d,2,6);}part(a,box,W.rockLight,934,4,159,1,4,44);solid(934,159,1,44,2,4);
 for(const x of [889,905,932])for(const z of [139,179]){part(a,cylinder,W.rockLight,x,6,z,1.2,8,1.2);part(a,box,W.rockDark,x,10,z,2,.5,2);}
 for(const z of [146,171]){part(a,box,W.rockDark,906,4.7,z,1,5.4,16);solid(906,z,1,16,2,5.4);}part(a,box,W.rockLight,906,8,158,2,1,9);
 for(const z of [145,173])for(let x=914;x<=926;x+=4){part(a,box,W.wood,x,3.8,z,2.4,3.6,1);for(let i=0;i<5;i++)part(a,box,i%2?B.primary:W.barkLight,x-.9+i*.45,4,z+.53,.27,2.4,.12);solid(x,z,2.4,1,2,3.6);}
 part(a,box,W.rockLight,922,2.45,158,3,.9,3);for(const [x,z]of [[873,141],[873,176],[935,194],[892,201]])tree(a,x,z,1.2);lamp(a,880,131);lamp(a,881,178);cluster(906,158,a);
 a=[];for(let z=154;z<=162;z+=.8)part(a,box,B.surface,906,4.5,z,.18,5,.16);part(a,box,B.gold,906,6.7,158,.22,.16,8);const vaultGate=mesh(a);
 a=[];part(a,box,B.primary,922,3.03,158,1.8,.2,1.5);part(a,box,B.gold,922,3.15,158,1.5,.04,1.2);const atlas=mesh(a);
 const bells=['river','grain','stars'].map((id,i)=>{const p=S[id];a=[];part(a,box,W.wood,p.x,4,p.z,.2,4,.2);part(a,cone,[W.water,W.meadowGold,B.primary][i],p.x,5.7,p.z,1.2,1.3,1.2);part(a,cylinder,B.gold,p.x,5.1,p.z,1.3,.15,1.3);return mesh(a);});
 // Worn flagstones, wall courses and reading alcoves survive the flood.
 a=[];for(let x=898;x<932;x+=3)for(let z=140;z<179;z+=3)part(a,box,(x+z)%2?W.stone:W.rockLight,x,2.025,z,2.94,.05,2.94);
 for(const z of [137.6,180.4])for(let x=890;x<=931;x+=4){part(a,box,W.rockLight,x,3.2,z,3.9,.16,.12);part(a,box,W.rockLight,x,4.7,z,3.9,.12,.12);}
 for(const z of [142,176]){part(a,box,W.barkLight,913,2.65,z,4,.18,1);for(const x of [911.5,914.5])part(a,box,W.wood,x,2.3,z,.2,.6,.8);}
 for(const [x,z]of [[915,141],[929,175]]){part(a,cylinder,W.rockLight,x,2.6,z,.9,1.2,.9);part(a,rock,W.rockDark,x+1,2.3,z,1.1,.4,.8);}cluster(911,159,a);
 // Return destination: the player's choice visibly changes the riverside common.
 a=[];for(let i=0;i<17;i++)part(a,box,W.coastWood,876+i,6.12,220,.9,.25,12);for(const x of [875,893])for(const z of [214,226])lamp(a,x,z);cluster(884,220,a);
 a=[];for(const x of [879,889]){part(a,box,W.wood,x,6.9,220,2.8,.2,1.2);for(const dx of [-1,1])part(a,box,W.wood,x+dx,6.4,220,.2,.8,1);}part(a,box,W.wood,884,7.4,217,3,2.8,.7);for(let i=0;i<6;i++)part(a,box,i%2?B.gold:B.primary,883+i*.35,7.5,217.4,.23,1.8,.16);const reading=mesh(a);
 a=[];for(const x of [879,889])for(const z of [217,223]){part(a,box,W.wood,x,6.4,z,2.5,.8,2.5);for(let i=0;i<4;i++)part(a,rock,i%2?W.flower:W.flowerGold,x+(i%2-.5),7.2,z+(Math.floor(i/2)-.5),.5,.6,.5);}const garden=mesh(a);
 // Cast and signage remain visible at human scale, with recognizable clothes and faces.
 const residents=['nessa','ivo','orin'].map((id,i)=>{a=[];part(a,cylinder,[B.primary,W.barkLight,B.pulseBlue][i],0,.9,0,.8,1.4,.7);part(a,rock,W.plaza,0,1.9,0,.42,.45,.4);for(const x of [-.13,.13])part(a,box,B.surface,x,1.95,.37,.065,.07,.04);part(a,cone,W.wood,0,2.32,0,.95,.35,.95);const m=mesh(a);m.position.set(S[id].x,6,S[id].z);return m;});
 // Stone paths and small authored details make the district readable at walking scale.
 const lanes=[...reachRoad.slice(1).map((p,i)=>[reachRoad[i],p]),[[768,100],[785,65]],[[785,65],[800,50]],[[800,50],[800,38]],[[800,38],[812,38]],[[827,52],[850,54]],[[872,110],[879,126]],[[878,158],[884,220]]];
 a=[];for(const [from,to]of lanes){const dx=to[0]-from[0],dz=to[1]-from[1],len=Math.hypot(dx,dz),steps=Math.ceil(len/2);for(let i=0;i<steps;i++){const t=(i+.5)/steps,x=from[0]+dx*t,z=from[1]+dz*t;if(inCanal(x,z)||x<620||x<662&&z>103)continue;part(a,box,i%3?W.path:W.plaza,x,heightAt(x,z)+.045,z,4,.08,len/steps+.1,0,Math.atan2(dx,dz));}}cluster(778,120,a);
 a=[];for(let i=0;i<120;i++){const x=625+(i*47%304),z=-8+(i*61%244);if(inCanal(x,z)||inArchive(x,z)||x<662&&z>103&&z<130||Object.values(S).some(p=>Math.hypot(x-p.x,z-p.z)<7)||lanes.some(([f,t])=>{const dx=t[0]-f[0],dz=t[1]-f[1],q=Math.max(0,Math.min(1,((x-f[0])*dx+(z-f[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(x-f[0]-q*dx,z-f[1]-q*dz)<4;}))continue;const h=heightAt(x,z);for(let k=0;k<5;k++){const px=x+(k%3)*.55,pz=z+Math.floor(k/3)*.55;part(a,cone,W.meadowGrass,px,h+.4,pz,.35,.8,.25);if(i%3===0)part(a,rock,i%2?W.flower:W.flowerGold,px,h+.75,pz,.16,.14,.16);}if(i%9===0)part(a,rock,W.rockLight,x,h+.5,z,1,.6,.8);}cluster(778,120,a);
 a=[];for(const [x,z]of [[681,100],[776,106],[868,123],[883,206]]){part(a,box,W.barkLight,x,6.75,z,3,.18,.75);part(a,box,W.wood,x,7.35,z+.4,3,.8,.1);for(const dx of [-1.1,1.1])part(a,box,W.wood,x+dx,6.35,z,.15,.7,.7);}for(const x of [668,678,688]){part(a,box,W.wood,x,7.1,146,4,.2,2);part(a,box,W.coastWood,x,9.7,146,4.7,.2,3.3,0,0,.13);for(const dx of [-1.8,1.8])part(a,box,W.wood,x+dx,7.9,146,.15,3.8,.15);for(let i=0;i<5;i++)part(a,rock,W.flowerGold,x-1.5+i*.7,7.45,146,.25,.3,.25);}cluster(750,140,a);
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const ctx=canvas.getContext('2d'),texts=['LANTERN QUAY','LOCK CONTROLS','THE SILENT MILL','AQUEDUCT RAMP','LANTERN ARCHIVE','RIVERSIDE COMMON','NESSA','IVO','ORIN'];ctx.fillStyle=B.surface;ctx.fillRect(0,0,1024,1024);ctx.textAlign='center';ctx.fillStyle=B.gold;ctx.font='700 59px Arial';texts.forEach((s,i)=>ctx.fillText(s,512,i*112+76));const tex=resources.own(new THREE.CanvasTexture(canvas));tex.colorSpace=THREE.SRGBColorSpace;const lm=resources.own(new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));
 for(const [i,x,z,y,w]of [[0,657,104,9,5],[1,708,104,8.8,4],[2,811,28,8.8,5],[3,842,55,8.8,5],[4,880,141,8.8,5],[5,884,210,8.8,5],[6,657,112,9.3,3],[7,785,65,9.3,3],[8,879,126,9.3,3]]){const geo=resources.own(new THREE.PlaneGeometry(w,w/9));const uv=geo.attributes.uv;for(let j=0;j<uv.count;j++)uv.setY(j,1-(i+1)*112/1024+uv.getY(j)*112/1024);const m=new THREE.Mesh(geo,lm);m.position.set(x,y,z);root.add(m);labels.push(m);}
 const common=createReachCommon(root,resources,kit,()=>model?.data);
 resources.onDispose(()=>root.removeFromParent());
 function blocked(x,z,y){if(Math.abs(x)>598||Math.abs(z)>598){if(!reachInside(x,z))return true;}if(x<620)return false;if(x>=845&&x<=855&&z>=6&&z<=54&&groundAt(x,z,y)>y+.65)return true;if(!model?.data.bridge&&Math.abs(x-718)<.7&&Math.abs(z-100)<3.5&&y<11)return true;if(!model?.data.vault&&Math.abs(x-906)<.7&&Math.abs(z-158)<4.5&&y<7.6)return true;for(const c of colliders)if(y<c.top-.25&&y+2>c.bottom&&Math.abs(x-c.x)<c.w+.32&&Math.abs(z-c.z)<c.d+.32)return true;return false;}
 function groundAt(x,z,y){if(x>=636&&x<=665&&z>=106&&z<=116)return 6.24;if(x>=845&&x<=855&&z>=6&&z<=54)return z<14?14:6+(54-z)*.2;if(model?.data.bridge&&x>=716&&x<=760&&Math.abs(z-100)<3.1)return 6.24;return -Infinity;}
 function unsafe(x,z,y){if(x<620)return false;const supported=groundAt(x,z,y);if(Number.isFinite(supported)&&y>=supported-.3)return false;if(x>=620&&x<=660&&z>=104&&z<=129)return y<4.8;if(inCanal(x,z))return y<(z>85&&z<119?(model?.data.water??5.5):5)-.1;if(inArchive(x,z)&&!model?.data.powered)return y<5.1;return false;}
 function update(dt,focus,settings,camera){time+=dt;root.visible=focus.x>510;if(!root.visible)return;const d=model?.data||{};common.update(dt,focus,settings.reduceMotion,camera);for(const c of staticMeshes)c.m.visible=Math.hypot(c.x-focus.x,c.z-focus.z)<180;for(const [labelIndex,l] of labels.entries()){l.visible=!(labelIndex>=6&&d.ending&&d.commonMode!=='quiet')&&Math.hypot(l.position.x-focus.x,l.position.z-focus.z)<85;l.quaternion.copy(camera.quaternion);}bridge.visible=!!d.bridge;closedBridge.visible=!d.bridge;lockWater.position.y=d.water??5.5;archiveWater.visible=!d.powered;vaultGate.visible=!d.vault;atlas.visible=!d.atlas;gear.visible=!d.gear;flowers.visible=!!d.powered;reading.visible=d.ending==='reading';garden.visible=d.ending==='garden';for(let i=0;i<3;i++)elbows[i].rotation.y=-(d.pipes?.[i]||0)*Math.PI/2;flowMeshes.forEach((m,i)=>m.visible=i<=(model?.flow||0)+(d.powered?1:0));if(d.powered&&!settings.reduceMotion)wheel.rotation.x+=dt*.6;sluices[0].rotation.x=d.inlet?0:Math.PI/2;sluices[1].rotation.x=d.outlet?Math.PI/2:0;for(const m of residents){m.visible=!(d.ending&&d.commonMode!=='quiet');m.rotation.y=Math.atan2(focus.x-m.position.x,focus.z-m.position.z);}}
 return {root,blocked,groundAt,unsafe,update,get navigationKey(){return [model?.data.bridge,model?.data.powered,model?.data.vault].join(":");},bind(m){model=m;},get stats(){return {region:'Lantern Reach',land:{west:598,east:940,north:-40,south:260},bridge:!!model?.data.bridge,mill:!!model?.data.powered,archive:!!model?.data.vault,common:model?.data.ending||null,gathering:common.stats,textureMB:5.34+common.textureMB};}};
}

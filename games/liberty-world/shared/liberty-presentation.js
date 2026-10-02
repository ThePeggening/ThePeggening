import * as THREE from 'three';
import {brand} from './brand.js';
import {ghostAt,smooth01} from './liberty-runner-helpers.js?v=r12';
const B=brand.colors;
// Reuse the loaded PCOCK model; clone its skeleton, not the asset download.
function copyActor(source){
  const root=source.clone(true),pairs=new Map();function pair(a,b){pairs.set(a,b);for(let i=0;i<a.children.length;i++)pair(a.children[i],b.children[i]);}pair(source,root);
  pairs.forEach((copy,original)=>{if(original.isSkinnedMesh){copy.skeleton=original.skeleton.clone();copy.skeleton.bones=original.skeleton.bones.map(b=>pairs.get(b));copy.bindMatrix.copy(original.bindMatrix);copy.bind(copy.skeleton,copy.bindMatrix);}});return root;
}
export function createRunnerPresentation(scene,actor,resources){
  const ghost=copyActor(actor.root),ghostMats=[];ghost.traverse(o=>{if(o.isMesh){const source=Array.isArray(o.material)?o.material:[o.material];const mats=source.map(m=>{const q=resources.own(new THREE.MeshBasicMaterial({color:B.pulseCyan,map:m?.map||null,transparent:true,opacity:.26,depthWrite:false,side:THREE.DoubleSide}));ghostMats.push(q);return q;});o.material=Array.isArray(o.material)?mats:mats[0];o.castShadow=false;o.receiveShadow=false;}});ghost.visible=false;scene.add(ghost);
  const ghostCanvas=document.createElement('canvas');ghostCanvas.width=320;ghostCanvas.height=72;const gx=ghostCanvas.getContext('2d');gx.fillStyle='#071922';gx.fillRect(0,0,320,72);gx.strokeStyle=B.pulseCyan;gx.lineWidth=4;gx.strokeRect(2,2,316,68);gx.fillStyle=B.pulseCyan;gx.font='800 30px sans-serif';gx.textAlign='center';gx.fillText('BEST GHOST',160,47);const ghostLabelTexture=resources.own(new THREE.CanvasTexture(ghostCanvas));ghostLabelTexture.colorSpace=THREE.SRGBColorSpace;const ghostLabel=new THREE.Sprite(resources.own(new THREE.SpriteMaterial({map:ghostLabelTexture,transparent:true,opacity:.88,depthWrite:false})));ghostLabel.position.y=3.2;ghostLabel.scale.set(3.2,.72,1);ghost.add(ghostLabel);
  const mixer=new THREE.AnimationMixer(ghost),clip=actor.walk?.getClip?.();if(clip)mixer.clipAction(clip).play();
  const basis=new THREE.Matrix4(),r=new THREE.Vector3(),u=new THREE.Vector3(),forward=new THREE.Vector3(),back=new THREE.Vector3();
  const flagRoot=new THREE.Group();flagRoot.visible=false;scene.add(flagRoot);
  const pole=new THREE.Mesh(resources.own(new THREE.CylinderGeometry(.055,.07,4.3,8)),resources.own(new THREE.MeshBasicMaterial({color:B.primary})));pole.position.set(2.9,2.15,0);flagRoot.add(pole);
  const clothGeo=resources.own(new THREE.PlaneGeometry(2.1,1.25,12,5));clothGeo.translate(1.05,0,0);
  const cloth=new THREE.Mesh(clothGeo,resources.own(new THREE.MeshBasicMaterial({color:B.accent,side:THREE.DoubleSide})));cloth.position.set(2.9,3.55,0);flagRoot.add(cloth);
  const basePositions=clothGeo.attributes.position.array.slice();
  const c=document.createElement('canvas');c.width=640;c.height=192;const labelTexture=resources.own(new THREE.CanvasTexture(c));labelTexture.colorSpace=THREE.SRGBColorSpace;
  const label=new THREE.Sprite(resources.own(new THREE.SpriteMaterial({map:labelTexture,depthTest:false,transparent:true})));label.scale.set(6.4,1.92,1);label.position.set(2.9,5.45,0);flagRoot.add(label);
  let crash=null,crashAge=0,shot='chase',ghostShown=false;
  function frame(track,d,route){const f=track.sample(d,route);r.set(f.rx,f.ry||0,f.rz);u.set(f.ux,f.uy,f.uz);forward.set(f.fx,f.fy,f.fz);return f;}
  function startCrash(track,s){
    const p=s.crashPoint||{distance:s.distance,x:s.x,y:s.y,route:s.route},f=frame(track,p.distance,p.route);crash={...p,r:r.clone(),u:u.clone(),f:forward.clone(),center:new THREE.Vector3(f.x,f.y,f.z).addScaledVector(r,p.x)};crashAge=0;
    flagRoot.position.copy(crash.center);basis.makeBasis(r,u,back.copy(forward).negate());flagRoot.quaternion.setFromRotationMatrix(basis);flagRoot.visible=true;ghost.visible=false;
    const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle=B.bg;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=B.primary;ctx.fillRect(0,0,c.width,9);ctx.textAlign='center';ctx.fillStyle=B.text;ctx.font='800 64px sans-serif';ctx.fillText(Math.floor(p.distance).toLocaleString()+' m',320,91);ctx.font='700 23px sans-serif';ctx.fillText(track.config.name.toUpperCase(),320,150,605);labelTexture.needsUpdate=true;
  }
  function stopCrash(){crash=null;flagRoot.visible=false;crashAge=0;}
  function camera({s,track,position,forward:F,up:U,right:R,goal,look,settings,dt,playing,screen}){
    shot='chase';
    if(screen==='crash'&&crash){
      crashAge+=dt;const t=smooth01(crashAge/2.6),angle=settings.reduceMotion?.25:.2+t*.48;
      goal.copy(crash.center).addScaledVector(crash.f,-12-Math.sin(angle)*5).addScaledVector(crash.r,-7*Math.cos(angle)).addScaledVector(crash.u,6+t*2);
      look.copy(crash.center).addScaledVector(crash.r,1.8).addScaledVector(crash.u,2.7);shot='crash flag';flagRoot.scale.setScalar(.1+.9*smooth01(crashAge/.25));
      const a=clothGeo.attributes.position;for(let i=0;i<a.count;i++){const x=basePositions[i*3];a.setZ(i,settings.reduceMotion?0:Math.sin(crashAge*6+x*2.8)*.10*x);}a.needsUpdate=true;return;
    }
    if(!playing||!settings.jumpCamera||settings.reduceMotion||s.grounded)return;
    let mix=0;if(s.launchEnd>s.launchStart&&s.launchEnd>s.distance){const v=(s.distance-s.launchStart)/(s.launchEnd-s.launchStart);mix=smooth01(v/.18)*smooth01((.84-v)/.22);}else if(s.airAge>.08){mix=smooth01((s.airAge-.08)/.28)*smooth01(s.y/2.2);}
    if(mix<=0)return;const side=s.launches%2?1:-1,wide=s.launches%3===0;
    goal.copy(position).addScaledVector(F,-10.8-(wide?7:2)*mix).addScaledVector(R,side*(wide?3.5:7)*mix).addScaledVector(U,4.8+(wide?4:1.2)*mix);
    look.copy(position).addScaledVector(F,14-9*mix).addScaledVector(U,2.32);shot=wide?'wide flight':'side flight';
  }
  function updateGhost(data,s,track,scale,enabled,dt){
    const p=enabled?ghostAt(data,s.age):null;ghostShown=!!p&&Math.abs(p.distance-s.distance)<150&&Math.abs(p.distance-s.distance)>2.5;ghost.visible=ghostShown;
    if(!ghostShown)return;const f=frame(track,p.distance,p.route);ghost.position.set(f.x,f.y+.06,f.z).addScaledVector(r,p.x).addScaledVector(u,p.y);basis.makeBasis(back.copy(r).negate(),u,forward);ghost.quaternion.setFromRotationMatrix(basis);ghost.scale.set(scale,scale*(p.slide?.52:1),scale);mixer.update(dt);ghostMats.forEach(m=>m.opacity=.20+.1*Math.min(1,Math.abs(p.distance-s.distance)/20));
  }
  resources.onDispose(()=>{mixer.stopAllAction();mixer.uncacheRoot(ghost);ghost.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose();});scene.remove(ghost);scene.remove(flagRoot);});
  return {camera,updateGhost,startCrash,stopCrash,get shot(){return shot;},get ghostVisible(){return ghostShown;},get flagVisible(){return flagRoot.visible;},get crashAge(){return crashAge;}};
}

import * as THREE from 'three';
import {brand} from './brand.js';
import {runnerBiome} from './liberty-biomes.js';
import {createRunnerSurfaces} from './liberty-surfaces.js';
import {authoredTemplates} from './scene-kit.js';
import {mergeRunnerParts} from './liberty-geometry.js';
import {createCrossingScenery} from './crossing-scenery.js';
import {createCrossingFleet} from './crossing-fleet.js';
import {STEP,laneAt,trafficAt,pickupAt,ROAD_HALF_WIDTH} from './crossing-loop.js?v=r2';
import {createCrossingDetails} from './crossing-details.js?v=r2';
const B=brand.colors;
export function createCrossingWorld(scene,resources,profile){
  const W=runnerBiome('libertyswap').colors,root=new THREE.Group();root.name='Liberty Crossing / Runner scenery';scene.add(root);resources.onDispose(()=>root.removeFromParent());
  const surfaces=createRunnerSurfaces(resources,true,W,profile.detail,'libertyswap'),templates=authoredTemplates();Object.values(templates).forEach(g=>resources.own(g));
  const box=resources.own(new THREE.BoxGeometry(1,1,1)),rock=resources.own(new THREE.IcosahedronGeometry(.5,1)),trunk=resources.own(new THREE.CylinderGeometry(.35,.5,1,6)),dummy=new THREE.Object3D();
  function add(parts,geometry,color,x,y,z,sx,sy,sz,ry=0){dummy.position.set(x,y,z);dummy.rotation.set(0,ry,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();parts.push({geometry,color,matrix:dummy.matrix.clone()});}
  const details=createCrossingDetails(root,resources,W),detailCars=[];
  const {palm,terrainShapes,mountain}=createCrossingScenery(resources,W,add,trunk,rock);
  function merge(parts,material,parent=root){const g=resources.own(mergeRunnerParts(parts)),m=new THREE.Mesh(g,material);parent.add(m);return m;}
  // Same gradient-sphere shader as Runner; natural sky stays blue, independent of road branding.
  const sky=new THREE.Mesh(resources.own(new THREE.SphereGeometry(430,24,16)),resources.own(new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(W.skyTop)},bottom:{value:new THREE.Color(W.sky)}},vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 p;uniform vec3 top;uniform vec3 bottom;void main(){gl_FragColor=vec4(mix(bottom,top,smoothstep(-40.,320.,p.y)),1.);\n#include <colorspace_fragment>\n}'})));root.add(sky);
  const water=new THREE.Mesh(resources.own(new THREE.PlaneGeometry(1500,1500)),surfaces.water);water.rotation.x=-Math.PI/2;water.position.y=-7;root.add(water);
  const cloudMat=resources.own(new THREE.MeshBasicMaterial({vertexColors:true})),clouds=[];
  for(let i=0;i<10;i++){const parts=[];for(let j=0;j<5;j++)add(parts,rock,j?W.cloud:W.mountainFar,(j-2)*5,Math.sin(j)*2,Math.cos(j)*2,10+(i*j%7),5+(j%3),7+(i%4));const m=merge(parts,cloudMat);clouds.push(m);m.userData.offset=(i-5)*55;m.position.set(m.userData.offset,60+i%3*15,-150);}
  const sun=new THREE.Mesh(resources.own(new THREE.SphereGeometry(12,16,12)),resources.own(new THREE.MeshBasicMaterial({color:W.sun})));root.add(sun);
  const carMat=resources.own(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.34,metalness:.23,side:THREE.DoubleSide})),fleet=createCrossingFleet(resources),carPools=new Map();
  const palette={sedan:B.primary,taxi:'#f4ce49',sport:B.accent,cruiser:'#a7e2e8',roadster:'#008cc1',police:'#f7faf6'};
  // Bake the existing Most Wanted models once, then instance them. No duplicated car builders.
  for(const [style,color]of Object.entries(palette)){
    const model=fleet.create(style,color,true),parts=[],farParts=[],farSeen=new Set();const driver=fleet.driver(Object.keys(palette).indexOf(style));driver.group.position.set(.4,.03,-.26);model.body.add(driver.group);model.group.updateMatrixWorld(true);
    model.group.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh){const mat=Array.isArray(o.material)?o.material[0]:o.material;resources.own(o.geometry);resources.own(mat);parts.push({geometry:o.geometry,matrix:o.matrixWorld.clone(),color:mat.color||B.text});const far=o.geometry.userData.coastFarGeometry;if(far&&!farSeen.has(far)){farSeen.add(far);resources.own(far);farParts.push({geometry:far,matrix:o.matrixWorld.clone(),color:mat.color||B.text});}}});
    const geo=resources.own(mergeRunnerParts(parts));geo.computeBoundingBox();const extent=geo.boundingBox.getSize(new THREE.Vector3()),mid=geo.boundingBox.getCenter(new THREE.Vector3());geo.translate(-mid.x,-geo.boundingBox.min.y,-mid.z);const mesh=resources.own(new THREE.InstancedMesh(geo,carMat,130));mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.count=0;mesh.userData.extent=extent;root.add(mesh);carPools.set(style,mesh);if(farParts.length){const fg=resources.own(mergeRunnerParts(farParts));fg.computeBoundingBox();const ex=fg.boundingBox.getSize(new THREE.Vector3()),ct=fg.boundingBox.getCenter(new THREE.Vector3());fg.translate(-ct.x,-fg.boundingBox.min.y,-ct.z);const fm=resources.own(new THREE.InstancedMesh(fg,carMat,130));fm.instanceMatrix.setUsage(THREE.DynamicDrawUsage);fm.frustumCulled=false;fm.count=0;fm.userData.extent=ex;root.add(fm);carPools.set('far:'+style,fm);}
  }
  const shadowMat=resources.own(new THREE.MeshBasicMaterial({map:surfaces.shadow,transparent:true,opacity:.46,depthWrite:false})),shadowPool=resources.own(new THREE.InstancedMesh(resources.own(new THREE.PlaneGeometry(1,1)),shadowMat,640));shadowPool.frustumCulled=false;shadowPool.count=0;root.add(shadowPool);
  const coinGeo=resources.own(new THREE.TorusGeometry(.68,.15,6,20)),coinPool=resources.own(new THREE.InstancedMesh(coinGeo,resources.own(new THREE.MeshStandardMaterial({color:B.gold,emissive:B.primary,emissiveIntensity:.15,metalness:.35,roughness:.3})),24));coinPool.frustumCulled=false;root.add(coinPool);
  const slowPool=resources.own(new THREE.InstancedMesh(resources.own(new THREE.OctahedronGeometry(.78,0)),resources.own(new THREE.MeshStandardMaterial({color:B.pulseCyan,emissive:B.success,emissiveIntensity:.3,metalness:.2,roughness:.3})),24));slowPool.frustumCulled=false;root.add(slowPool);
  const labelTexture=(text,accent=B.primary)=>{const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=B.bgHigh;ctx.fillRect(0,0,512,128);ctx.fillStyle=accent;ctx.fillRect(0,116,512,12);ctx.fillStyle=B.text;ctx.font='800 40px Segoe UI';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64,480);const t=resources.own(new THREE.CanvasTexture(c));t.colorSpace=THREE.SRGBColorSpace;return t;};
  const labelMats={start:resources.own(new THREE.MeshBasicMaterial({map:labelTexture('LIBERTY CROSSING'),side:THREE.DoubleSide})),safe:resources.own(new THREE.MeshBasicMaterial({map:labelTexture('SAFE ISLAND',B.success),side:THREE.DoubleSide})),finish:resources.own(new THREE.MeshBasicMaterial({map:labelTexture('LIBERTY SQUARE',B.gold),side:THREE.DoubleSide}))};
  const viewFrustum=new THREE.Frustum(),viewMatrix=new THREE.Matrix4(),carBounds=new THREE.Sphere(new THREE.Vector3(),5);const blockCache=new Map();let seed=414,worldMode='city',clock=0,quality=profile;const rowWindow={behind:6,ahead:23};
  function buildBlock(b){const parent=new THREE.Group(),road=[],scenery=[];root.add(parent);const start=b*8;
    for(let row=start;row<start+8;row++){
      const lane=laneAt(row,seed),z=-row*STEP,safe=lane.kind==='safe'||worldMode==='city'&&row>=97;
      add(road,box,safe?W.grass:'#283744',0,-.3,z,ROAD_HALF_WIDTH*2,.6,STEP);
      if(!safe){
        for(let x=-90;x<=90;x+=8)add(road,box,'#e8e9db',x,.016,z-STEP*.5,3.5,.033,.11);
        for(const side of [-1,1]){add(scenery,box,side<0?B.primary:B.accent,side*31,.11,z,.24,.22,3.2);}
        // Large travel-direction arrows are visible before stepping off the island.
        for(const x of [-17,0,17]){const dir=lane.direction;add(road,box,'#697b89',x,.028,z,1.3,.024,.15);for(const side of [-1,1])add(road,box,'#697b89',x+dir*.55,.028,z+side*.2,.62,.024,.11,-dir*side*.68);}
      }else{
        if(row%8===0){add(road,box,'#c2d0c4',0,.016,z+1.88,ROAD_HALF_WIDTH*2,.05,.24);for(let x=-26;x<=26;x+=2)add(road,box,'#dfdfbc',x,.026,z,.7,.025,1.5);}
        for(const side of [-1,1]){const x=side*(32+(b%3)*2);palm(scenery,x,0,z,1.3);if(quality.detail>0){add(scenery,templates.planter,B.text,x-side*4,0,z,.9,.9,.9);add(scenery,templates.rock,B.text,x+side*4,0,z+1,3,2,3);}}
      }
    }
    details.decorate(add,road,scenery,b);
    for(const side of [-1,1]){const z=-(start+4)*STEP,x=side*(45+b%3*6);add(scenery,terrainShapes[b%3],B.text,x,-1,z,24,9,27);palm(scenery,x,-.2,z,2);add(scenery,templates.house,B.text,x+side*3,0,z-10,1.7,1.7,1.7,side<0?-.35:.35);add(scenery,mountain,B.text,side*140,-2,z-90,125,64,140);}
    for(const side of [-1,1]){const x=side*29,z=-(start+1)*STEP;add(scenery,templates['signal-lamp'],B.text,x,0,z,1.7,1.7,1.7);}
    const roadMesh=merge(road,surfaces.road,parent),sceneMesh=merge(scenery,surfaces.scenery,parent),signGeo=resources.own(new THREE.PlaneGeometry(7.5,1.85));
    const sign=new THREE.Mesh(signGeo,b===0?labelMats.start:worldMode==='city'&&b===12?labelMats.finish:labelMats.safe);sign.position.set(-24,3.8,-(start+1)*STEP);parent.add(sign);
    if(worldMode==='city'&&b===12){const parts=[];add(parts,templates['liberty-statue'],B.text,0,0,-(start+5)*STEP,2.2,2.2,2.2);merge(parts,surfaces.scenery,parent);}
    blockCache.set(b,{parent,owned:[...parent.children].filter(x=>x.geometry).map(x=>x.geometry)});
  }
  function disposeBlock(b){const block=blockCache.get(b);if(!block)return;block.parent.removeFromParent();for(const g of block.owned){g.dispose();resources.items.delete(g);}blockCache.delete(b);}
  const flag=new THREE.Group(),flagPole=new THREE.Mesh(resources.own(new THREE.CylinderGeometry(.08,.08,5,8)),resources.own(new THREE.MeshStandardMaterial({color:B.text}))),flagBanner=new THREE.Mesh(resources.own(new THREE.PlaneGeometry(4,1.5)),resources.own(new THREE.MeshBasicMaterial({map:labelTexture('END OF THE ROAD',B.accent),side:THREE.DoubleSide})));flagPole.position.y=2.5;flagBanner.position.set(1.8,4,0);flag.add(flagPole,flagBanner);flag.visible=false;root.add(flag);
  function update(s,time,camera,motion=true){detailCars.length=0;if(camera){camera.updateMatrixWorld();viewMatrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);viewFrustum.setFromProjectionMatrix(viewMatrix);}clock=s.clock;seed=s.seed;worldMode=s.mode;const center=-s.z/STEP,min=Math.max(0,Math.floor(center-rowWindow.behind)),max=Math.min(s.finishRow+6,Math.ceil(center+rowWindow.ahead));const low=Math.floor(min/8),high=Math.floor(max/8);for(let b=low;b<=high;b++)if(!blockCache.has(b))buildBlock(b);for(const b of [...blockCache.keys()])if(b<low-1||b>high+1)disposeBlock(b);
    const counts={};let shadows=0,sealCount=0,slowCount=0;
    for(let row=min;row<=max;row++){
      if(row<s.finishRow){for(const car of trafficAt(laneAt(row,seed),clock,-85,85)){if(camera){carBounds.center.set(car.x,1,car.z);if(!viewFrustum.intersectsSphere(carBounds))continue;}const key=row>center+(quality.detail>=2?10:6)&&carPools.has('far:'+car.style)?'far:'+car.style:car.style,mesh=carPools.get(key),i=counts[key]||0;if(i>=130)continue;dummy.position.set(car.x,0,car.z);dummy.rotation.set(0,car.direction*Math.PI/2,0);dummy.scale.set(car.width/mesh.userData.extent.x,1.25,car.length/mesh.userData.extent.z);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);counts[key]=i+1;detailCars.push(car);
        if(shadows<640){dummy.position.set(car.x,.022,car.z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(car.length+1,3.5,1);dummy.updateMatrix();shadowPool.setMatrixAt(shadows++,dummy.matrix);}
      }}
      const p=pickupAt(row,seed);if(p&&!s.collected.has(p.id)){dummy.position.set(p.x,1.4+Math.sin(time*2+row)*.17,-row*STEP);dummy.rotation.set(.1, time*1.25,0);dummy.scale.setScalar(1);dummy.updateMatrix();if(p.kind==='slow')slowPool.setMatrixAt(slowCount++,dummy.matrix);else coinPool.setMatrixAt(sealCount++,dummy.matrix);}
    }
    for(const [style,m]of carPools){m.count=counts[style]||0;m.instanceMatrix.needsUpdate=true;}shadowPool.count=shadows;shadowPool.instanceMatrix.needsUpdate=true;coinPool.count=sealCount;coinPool.instanceMatrix.needsUpdate=true;slowPool.count=slowCount;slowPool.instanceMatrix.needsUpdate=true;
    details.update(s,time,detailCars,quality,motion);sky.position.set(s.x*.25,0,s.z);water.position.set(0,-7,s.z);sun.position.set(190,140,s.z-245);clouds.forEach((m,i)=>m.position.set(m.userData.offset+Math.sin(time*.015+i)*4,60+i%3*15,s.z-170-(i%3)*45));surfaces.time.value=time;flag.visible=['crash','over'].includes(s.phase);if(flag.visible&&s.crash){flag.position.set(s.crash.x,0,s.crash.z);if(flag.userData.row!==s.crash.row){flag.userData.row=s.crash.row;const c=flagBanner.material.map.image,ctx=c.getContext('2d');ctx.fillStyle=B.bgHigh;ctx.fillRect(0,0,512,128);ctx.fillStyle=B.accent;ctx.fillRect(0,116,512,12);ctx.fillStyle=B.text;ctx.font='800 40px Segoe UI';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s.crash.row+' ROWS CROSSED',256,64,480);flagBanner.material.map.needsUpdate=true;}}
  }
  function reset(){for(const b of [...blockCache.keys()])disposeBlock(b);flag.visible=false;}
  return {update,reset,shadowTexture:surfaces.shadow,setQuality(p){quality=p;surfaces.setDetail(p.detail);reset();},get stats(){return {blocks:blockCache.size,cars:[...carPools.values()].reduce((n,m)=>n+m.count,0),roadWidth:ROAD_HALF_WIDTH*2,templates:6,...details.stats};}};
}

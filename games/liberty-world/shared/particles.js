import * as THREE from 'three';
import {Pool} from './disposal.js';
import {worldPalette as W} from './world-palette.js';
import {brand} from './brand.js';
import {rng} from './rng.js';
export function createParticles(scene,resources){const pool=new Pool(24,()=>({active:false,x:0,y:0,z:0,vx:0,vz:0,age:0})),geo=resources.own(new THREE.IcosahedronGeometry(.1,0)),mat=resources.own(new THREE.MeshBasicMaterial({color:brand.colors.text})),mesh=resources.own(new THREE.InstancedMesh(geo,mat,24)),dummy=new THREE.Object3D(),color=new THREE.Color(),random=rng(727);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;scene.add(mesh);let ember=false;
  function emit(x,y,z){const p=pool.acquire();if(!p)return;p.x=x;p.y=y+.08;p.z=z;p.vx=(random()-.5)*.5;p.vz=(random()-.5)*.5;p.age=0;}
  function update(dt){let count=0;for(const p of pool.items)if(p.active){p.age+=dt;if(p.age>.6){pool.release(p);continue;}dummy.position.set(p.x+p.vx*p.age,p.y+p.age*.28,p.z+p.vz*p.age);dummy.scale.setScalar((1-(p.age/.6)**2)*(ember?1.1:.8));dummy.rotation.set(0,p.age*3,0);dummy.updateMatrix();mesh.setMatrixAt(count,dummy.matrix);mesh.setColorAt(count,color.set(ember?brand.colors.primary:W.path));count++;}mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
  return {pool,emit,update,setEmber(value){ember=value;},reset(){pool.reset();mesh.count=0;}};
}

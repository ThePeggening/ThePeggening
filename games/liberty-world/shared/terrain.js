import * as THREE from 'three';
import {worldPalette as W} from './world-palette.js';
function lattice(x,z){let n=Math.imul(x,374761393)^Math.imul(z,668265263)^7331;n=Math.imul(n^n>>>13,1274126177);return ((n^n>>>16)>>>0)/4294967295;}
function noise(x,z){const a=Math.floor(x),b=Math.floor(z),u=x-a,v=z-b,s=u*u*(3-2*u),t=v*v*(3-2*v);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(lattice(a,b),lattice(a+1,b),s),THREE.MathUtils.lerp(lattice(a,b+1),lattice(a+1,b+1),s),t);}
export function heightAt(x,z){const d=Math.hypot(x*.85,z+5),flatten=THREE.MathUtils.smoothstep(d,9,25);return .15+flatten*((noise(x*.035,z*.035)-.25)*8+(noise(x*.10,z*.10)-.5)*2+(noise(x*.23,z*.23)-.5)*.55);}
export function createTerrain(scene,toon,resources){
  const material=toon.material(W.ground,{vertexColors:true}),hullMaterial=toon.outline(W.outline),chunks=[],color=new THREE.Color();
  for(let gx=-2;gx<2;gx++)for(let gz=-2;gz<2;gz++){
    const size=32,geo=resources.own(new THREE.PlaneGeometry(size,size,16,16));geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,colors=new Float32Array(pos.count*3);
    for(let i=0;i<pos.count;i++){const x=pos.getX(i)+gx*size+size/2,z=pos.getZ(i)+gz*size+size/2,y=heightAt(x,z);pos.setY(i,y);color.set(y>4?W.grassLight:y>2?W.ground:W.grass);color.toArray(colors,i*3);}geo.setAttribute('color',new THREE.BufferAttribute(colors,3));geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,material);mesh.position.set(gx*size+size/2,0,gz*size+size/2);mesh.receiveShadow=true;scene.add(mesh);const hull=new THREE.Mesh(geo,hullMaterial);hull.position.copy(mesh.position);hull.renderOrder=-1;scene.add(hull);chunks.push({mesh,hull,x:mesh.position.x,z:mesh.position.z});
  }
  function update(camera,distance=95){let active=0;for(const c of chunks){const visible=Math.hypot(c.x-camera.position.x,c.z-camera.position.z)<distance+24;c.mesh.visible=c.hull.visible=visible;if(visible)active++;}return active;}
  return {heightAt,chunks,update};
}

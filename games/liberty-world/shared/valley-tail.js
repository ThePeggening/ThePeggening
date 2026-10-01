import {worldPalette as W} from './world-palette.js';
import * as THREE from 'three';
// Original closed feather vanes, independently hinged. Supplied assets remain untouched.
export const fanTextureMB=512*1024*4*4/3/1048576;
export const fanScale=.50;
export function createPeacockFan(resources){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;const c=canvas.getContext('2d'),wash=c.createLinearGradient(0,0,512,0);
 for(const [at,color]of [[0,W.featherEdge],[.22,W.featherGreen],[.48,W.featherBright],[.55,W.featherGreen],[.78,W.featherBarb],[1,W.featherEdge]])wash.addColorStop(at,color);c.fillStyle=wash;c.fillRect(0,0,512,1024);
 // Fine alternating barbs and a raised-looking central rachis remain readable up close.
 for(let y=4;y<1024;y+=5){const alternate=Math.floor(y/5)%3;c.strokeStyle=alternate?W.featherBarb:W.featherShadow;c.globalAlpha=alternate?.55:.7;c.lineWidth=alternate?1.2:2;c.beginPath();c.moveTo(256,y);c.bezierCurveTo(183,y-30,76,y-58,0,y-140);c.moveTo(256,y);c.bezierCurveTo(329,y-30,436,y-58,512,y-140);c.stroke();}c.globalAlpha=1;
 function oval(x,y,rx,ry,inner,outer){const gradient=c.createRadialGradient(x-14,y-15,8,x,y,Math.max(rx,ry));gradient.addColorStop(0,inner);gradient.addColorStop(1,outer);c.fillStyle=gradient;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
 oval(256,246,183,193,W.featherEyeGreen,W.featherEdge);oval(256,249,143,153,W.featherGold,W.featherGoldDeep);oval(256,260,109,116,W.featherTeal,W.featherSky);oval(256,266,72,77,W.featherBlueBright,W.featherBlue);
 c.fillStyle=W.featherBlue;c.beginPath();c.moveTo(256,320);c.bezierCurveTo(173,280,207,228,244,260);c.bezierCurveTo(269,211,326,251,256,320);c.fill();oval(286,277,16,22,W.featherSky,W.featherTeal);
 c.strokeStyle=W.featherShaft;c.lineWidth=3;c.beginPath();c.moveTo(256,1024);c.quadraticCurveTo(249,674,256,438);c.stroke();c.strokeStyle=W.featherShadow;c.lineWidth=1;c.beginPath();c.moveTo(253,1024);c.quadraticCurveTo(246,674,253,438);c.stroke();
 const texture=resources.own(new THREE.CanvasTexture(canvas));texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;const positions=[],uvs=[],indices=[],colors=[],skinIndices=[],skinWeights=[],color=new THREE.Color(),v=new THREE.Vector3(),bones=[],vanes=[],hinges=new THREE.Bone();hinges.name='Tail root';
 function feather(angle,length,width,depth,index){const bone=new THREE.Bone();bone.name='Tail feather '+(index+1);bone.position.set(0,.02,depth);bone.rotation.set(-.40,0,-angle);hinges.add(bone);bone.updateMatrix();bones.push(bone);vanes.push({angle,length,width,depth,lean:-.40});const matrix=bone.matrix,rows=14,base=positions.length/3,stride=(rows+1)*3;color.set(index%3===0?W.featherTint:W.featherWhite);
  function vertex(x,y,z,u,t){v.set(x,y,z).applyMatrix4(matrix);positions.push(v.x,v.y,v.z);uvs.push(u,t);colors.push(color.r,color.g,color.b);skinIndices.push(index+1,0,0,0);skinWeights.push(1,0,0,0);}
  for(const face of [1,-1])for(let i=0;i<=rows;i++){const t=i/rows,w=Math.max(.006,width*Math.pow(Math.sin(Math.PI*t),.62)*(i%2?.96:1)),half=.012+.042*Math.sqrt(Math.sin(Math.PI*t));for(const side of [-1,0,1])vertex(side*w,t*length,-.12*t*t-.06*(1-side*side)*Math.sin(Math.PI*t)+face*half,(side+1)/2,t);}
  for(let i=0;i<rows;i++)for(let j=0;j<2;j++){const a=base+i*3+j,b=a+stride;indices.push(a,a+1,a+3,a+1,a+4,a+3,b,b+3,b+1,b+1,b+3,b+4);}
  for(let i=0;i<rows;i++)for(const j of [0,2]){const a=base+i*3+j,b=a+stride;if(j===0)indices.push(a,a+3,b,b,a+3,b+3);else indices.push(a,b,a+3,b,b+3,a+3);}
  for(const row of [0,rows])for(let j=0;j<2;j++){const a=base+row*3+j,b=a+stride;if(row===0)indices.push(a,b,a+1,a+1,b,b+1);else indices.push(a,a+1,b,a+1,b+1,b);}
  // The raised shaft has real volume and shares this mesh/material/draw call.
  const shaft=positions.length/3;color.set(W.featherShaft);for(let i=0;i<=5;i++){const t=i/5;for(let j=0;j<3;j++){const a=j*Math.PI*2/3;vertex(Math.cos(a)*.012,t*length*.75,-.12*(t*.75)**2+.075+Math.sin(a)*.012,.5,.02);}}
  for(let i=0;i<5;i++)for(let j=0;j<3;j++){const a=shaft+i*3+j,b=shaft+i*3+(j+1)%3;indices.push(a,b,a+3,b,b+3,a+3);}indices.push(shaft,shaft+2,shaft+1,shaft+15,shaft+16,shaft+17);
 }
 for(let i=0;i<12;i++)feather((i-5.5)*.213,1.52-Math.abs(i-5.5)*.03,.21,-.54,i);
 for(let i=0;i<9;i++)feather((i-4)*.27,1.03-Math.abs(i-4)*.02,.17,-.64,i+12);
 const geometry=resources.own(new THREE.BufferGeometry());geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeights,4));geometry.setIndex(indices);geometry.computeVertexNormals();
 const material=resources.own(new THREE.MeshStandardMaterial({map:texture,color:W.featherWhite,vertexColors:true,roughness:.68,metalness:.08,side:THREE.DoubleSide})),mesh=new THREE.SkinnedMesh(geometry,material),root=new THREE.Group();mesh.add(hinges);mesh.updateMatrixWorld(true);const skeleton=new THREE.Skeleton([hinges,...bones]);mesh.bind(skeleton);resources.onDispose(()=>skeleton.dispose());root.name='Attached peacock feather fan';root.userData.reference='photo_2026-09-30_19-03-46.jpg';root.userData.feathers=21;root.userData.mount='rump';root.userData.articulation='21 closed volumetric vanes with individual hinges';root.add(mesh);mesh.name='Articulated 3D green gold turquoise and blue eye feathers';mesh.userData.vanes=vanes;mesh.frustumCulled=false;
 let time=0,energy=0;root.animate=(dt,{speed=0,gliding=false,reduceMotion=false}={})=>{time+=dt;energy+=(Math.min(1,speed/8)-energy)*Math.min(1,dt*6);for(let i=0;i<bones.length;i++){const b=bones[i],a=vanes[i].angle,wave=reduceMotion?0:Math.sin(time*(2.1+energy*3)+i*.61)*(energy*.035+.008);b.rotation.x=-.40-energy*.10+(gliding?.08:0)+wave;b.rotation.y=wave*.55;b.rotation.z=-a+wave*.28;}};
 const tuftGeometry=resources.own(new THREE.IcosahedronGeometry(1,2)),blueMaterial=resources.own(new THREE.MeshStandardMaterial({color:W.peacockRump,roughness:.86})),rump=new THREE.Mesh(tuftGeometry,blueMaterial);rump.name='Blue rump connection overlapping the body';rump.position.set(0,.01,.18);rump.scale.set(.29,.25,.6);root.add(rump);
 const cover=new THREE.Mesh(tuftGeometry,resources.own(new THREE.MeshStandardMaterial({color:W.featherGreen,roughness:.8})));cover.name='Short overlapping tail coverts';cover.position.set(0,.035,-.23);cover.scale.set(.25,.19,.43);root.add(cover);return root;
}

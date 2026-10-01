import * as THREE from 'three';
import {brand} from './brand.js';
import {worldPalette as W} from './world-palette.js';
import {rng} from './rng.js';
import {regionRoutes} from './valley-terrain.js';

// Original, seeded surface paintings. Small shared maps add detail without geometry.
export function createValleyMaterials(toon,resources,districts){
 const random=rng(739201),textures=[];
 function paint(size,draw,repeat=true){const canvas=document.createElement('canvas');canvas.width=canvas.height=size;draw(canvas.getContext('2d'),size);const map=resources.own(new THREE.CanvasTexture(canvas));map.wrapS=map.wrapT=repeat?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping;map.anisotropy=2;textures.push(map);return map;}
 const gray=value=>'rgb('+value+','+value+','+value+')';
 const grass=paint(512,(c,n)=>{c.fillStyle=gray(208);c.fillRect(0,0,n,n);for(let i=0;i<150;i++){const x=random()*n,y=random()*n,r=12+random()*38,gradient=c.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,gray(155+Math.floor(random()*65)));gradient.addColorStop(1,'rgba(200,200,200,0)');c.fillStyle=gradient;c.fillRect(x-r,y-r,r*2,r*2);}for(let i=0;i<2800;i++){const x=random()*n,y=random()*n,l=3+random()*8;c.strokeStyle=gray(135+Math.floor(random()*103));c.lineWidth=.6+random();c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-2,y-l*.6,x+(random()-.5)*6,y-l);c.stroke();}for(let i=0;i<170;i++){c.fillStyle=gray(170+Math.floor(random()*60));c.beginPath();c.ellipse(random()*n,random()*n,1+random()*2,.8,random()*6.28,0,6.28);c.fill();}});
 const gravel=paint(512,(c,n)=>{c.fillStyle=gray(215);c.fillRect(0,0,n,n);for(let i=0;i<2500;i++){const x=random()*n,y=random()*n,r=.5+random()*3.8;c.fillStyle=gray(138+Math.floor(random()*75));c.beginPath();c.ellipse(x,y+r*.25,r,r*.58,random()*3,0,6.28);c.fill();c.fillStyle=gray(192+Math.floor(random()*55));c.beginPath();c.ellipse(x,y,r*.8,r*.42,0,0,6.28);c.fill();}for(let i=0;i<22;i++){c.strokeStyle=gray(180);c.lineWidth=.7;c.beginPath();const x=random()*n,y=random()*n;c.moveTo(x,y);c.lineTo(x+12,y+5);c.lineTo(x+18,y+16);c.stroke();}});
 const stone=paint(512,(c,n)=>{c.fillStyle=gray(112);c.fillRect(0,0,n,n);for(let row=-1;row<9;row++)for(let col=-1;col<9;col++){const x=col*64+(row%2)*32,y=row*64,v=180+Math.floor(random()*57);c.fillStyle=gray(v);c.beginPath();c.roundRect(x+2,y+2,60,60,4);c.fill();c.strokeStyle=gray(Math.min(255,v+30));c.lineWidth=2;c.beginPath();c.moveTo(x+5,y+56);c.lineTo(x+5,y+6);c.lineTo(x+56,y+6);c.stroke();c.strokeStyle=gray(v-35);c.beginPath();c.moveTo(x+7,y+58);c.lineTo(x+58,y+58);c.lineTo(x+58,y+8);c.stroke();for(let i=0;i<42;i++){c.fillStyle=gray(v-18+Math.floor(random()*36));c.fillRect(x+7+random()*48,y+7+random()*48,1+random()*2,1);}if(random()<.22){c.strokeStyle=gray(v-46);c.lineWidth=.8;c.beginPath();c.moveTo(x+8,y+4);c.lineTo(x+15,y+17);c.lineTo(x+10,y+28);c.stroke();}}});
 const wood=paint(512,(c,n)=>{c.fillStyle=gray(198);c.fillRect(0,0,n,n);for(let col=0;col<8;col++){const base=175+Math.floor(random()*51);c.fillStyle=gray(base);c.fillRect(col*64+2,0,60,n);c.fillStyle=gray(100);c.fillRect(col*64,0,2,n);c.fillStyle=gray(base+34);c.fillRect(col*64+3,0,2,n);for(let i=0;i<22;i++){const x=col*64+5+random()*52;c.strokeStyle=gray(base-45+Math.floor(random()*50));c.lineWidth=.6+random();c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x+9,170,x-8,360,x,n);c.stroke();}for(const y of [18,494]){c.fillStyle=gray(92);c.beginPath();c.arc(col*64+10,y,2,0,6.28);c.fill();}const x=col*64+25,y=90+random()*280;for(let i=0;i<3;i++){c.strokeStyle=gray(base-35+i*7);c.beginPath();c.ellipse(x,y,3+i*2,8+i*4,.1,0,6.28);c.stroke();}}});
 const roof=paint(512,(c,n)=>{c.fillStyle=gray(99);c.fillRect(0,0,n,n);for(let row=-1;row<9;row++)for(let col=-1;col<9;col++){const x=col*64+(row%2)*32,y=row*64,v=164+Math.floor(random()*68);c.fillStyle=gray(v);c.beginPath();c.roundRect(x+2,y+2,59,61,[2,2,9,9]);c.fill();c.strokeStyle=gray(v+21);c.lineWidth=2;c.beginPath();c.moveTo(x+6,y+5);c.lineTo(x+6,y+51);c.quadraticCurveTo(x+30,y+66,x+57,y+51);c.stroke();c.strokeStyle=gray(v-34);c.beginPath();c.moveTo(x+58,y+5);c.lineTo(x+58,y+57);c.stroke();}});
 const layout=paint(1024,(c,n)=>{c.fillStyle='#000';c.fillRect(0,0,n,n);const x=v=>(v+600)*n/1200,z=v=>(600-v)*n/1200;c.strokeStyle='#f00';c.lineCap='round';c.lineWidth=9*n/1200;for(const d of districts.filter(d=>!['plaza','spire'].includes(d.id))){c.beginPath();c.moveTo(x(0),z(-20));c.lineTo(x(d.x),z(d.z));c.stroke();}c.beginPath();c.moveTo(x(0),z(42));c.lineTo(x(0),z(-20));c.stroke();for(const route of regionRoutes){c.beginPath();route.forEach((p,i)=>i?c.lineTo(x(p[0]),z(p[1])):c.moveTo(x(p[0]),z(p[1])));c.stroke();}c.fillStyle='#ff0';c.beginPath();c.arc(x(0),z(-20),14*n/1200,0,6.28);c.fill();},false);
 const shared={uGrass:{value:grass},uGravel:{value:gravel},uStone:{value:stone},uWood:{value:wood},uRoof:{value:roof},uLayout:{value:layout},uGrassColor:{value:new THREE.Color(W.grass)},uPathColor:{value:new THREE.Color(W.path)},uPlazaColor:{value:new THREE.Color(W.plaza)},uWaterLight:{value:new THREE.Color(W.waterLight)},uValleyTime:toon.time,uRestore:{value:0},uCanyon:{value:new THREE.Color(W.canyon)},uFrost:{value:new THREE.Color(W.frostGround)},uCoast:{value:new THREE.Color(W.coastGrass)}};
 function coordinates(s){s.vertexShader='varying vec3 vValleyPosition;varying vec3 vValleyNormal;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
 vec4 valleyLocal=vec4(transformed,1.0);vec3 valleyNormal=objectNormal;
 #ifdef USE_INSTANCING
 valleyLocal=instanceMatrix*valleyLocal;valleyNormal=mat3(instanceMatrix)*valleyNormal;
 #endif
 vValleyPosition=(modelMatrix*valleyLocal).xyz;vValleyNormal=normalize(mat3(modelMatrix)*valleyNormal);`);s.fragmentShader='varying vec3 vValleyPosition;varying vec3 vValleyNormal;\n'+s.fragmentShader;}
 function surface(material,key,fragment,vertex=''){const previous=material.onBeforeCompile;material.onBeforeCompile=s=>{previous(s);Object.assign(s.uniforms,shared);coordinates(s);s.fragmentShader='uniform sampler2D uGrass,uGravel,uStone,uWood,uRoof,uLayout;uniform vec3 uGrassColor,uPathColor,uPlazaColor,uWaterLight,uCanyon,uFrost,uCoast;uniform float uValleyTime,uRestore;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+fragment);if(vertex)vertex(s);};material.customProgramCacheKey=()=>key;return material;}
 const terrain=surface(toon.material(W.ground),'valley-painted-ground-v3',`
 vec2 valleyUV=vValleyPosition.xz;
 vec2 pathMask=texture2D(uLayout,valleyUV/1200.0+0.5).rg;
 float lawn=texture2D(uGrass,valleyUV*0.18).r;
 float grit=texture2D(uGravel,valleyUV*0.27).r;
 float pavers=texture2D(uStone,valleyUV*0.13).r;
 vec3 natural=mix(uGrassColor,uCanyon,smoothstep(250.0,330.0,-valleyUV.x)*(1.0-smoothstep(170.0,250.0,-valleyUV.y)));natural=mix(natural,uFrost,smoothstep(260.0,360.0,-valleyUV.y));natural=mix(natural,uCoast,smoothstep(240.0,330.0,valleyUV.y));vec3 land=natural*(0.61+lawn*0.61);
 vec3 trail=uPathColor*(0.50+grit*0.67);
 vec3 square=uPlazaColor*(0.38+pavers*0.76);
 float inlay=1.0-smoothstep(0.025,0.06,abs(fract(length(valleyUV-vec2(0.0,-20.0))*.19)-.5));square=mix(square,uPlazaColor*.62,inlay*.22);
 diffuseColor.rgb=mix(mix(land,trail,smoothstep(0.12,0.9,pathMask.r)),square,smoothstep(0.12,0.9,pathMask.g));
 float lightness=dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722));
 diffuseColor.rgb=mix(vec3(lightness),diffuseColor.rgb,0.77+uRestore*0.23);`);
 const props=surface(toon.material(brand.colors.text,{vertexColors:true}),'valley-painted-props-v3',`
 vec3 face=abs(vValleyNormal);vec2 surfaceUV=face.y>0.68?vValleyPosition.xz:face.x>face.z?vValleyPosition.zy:vValleyPosition.xy;
 float pigment=1.0;
 if(vSurface.x>0.5){pigment=face.y>0.18&&face.y<0.94?texture2D(uRoof,surfaceUV*0.37).r:texture2D(uWood,surfaceUV*0.3).r;diffuseColor.rgb*=0.48+pigment*0.66;}
 else if(vSurface.y>0.1){pigment=vSurface.y>0.8?texture2D(uStone,surfaceUV*0.18).r:texture2D(uGravel,surfaceUV*0.28).r;diffuseColor.rgb*=0.42+pigment*0.73;}
 else if(vSurface.z>0.5){pigment=texture2D(uGrass,surfaceUV*0.18).r;diffuseColor.rgb*=0.66+pigment*0.42;}
 else if(vSurface.w>0.5){pigment=texture2D(uGravel,surfaceUV*0.42).r;diffuseColor.rgb*=0.72+pigment*0.31;}`,s=>{
   for(const [key,value]of Object.entries({uWoodColor:W.wood,uBarkColor:W.barkLight,uStoneColor:W.stone,uRockColor:W.rockDark,uRockLightColor:W.rockLight,uPlasterColor:W.plaza,uLeafColor:W.leaf,uLeafLightColor:W.leafLight,uPineColor:W.pine}))s.uniforms[key]={value:new THREE.Color(value)};
   s.vertexShader='varying vec4 vSurface;uniform vec3 uWoodColor,uBarkColor,uStoneColor,uRockColor,uRockLightColor,uPlasterColor,uLeafColor,uLeafLightColor,uPineColor;\n'+s.vertexShader;
   s.vertexShader=s.vertexShader.replace('#include <color_vertex>',`#include <color_vertex>
   vSurface=vec4(0.0);
   #ifdef USE_COLOR
   vSurface.x=1.0-step(0.012,min(distance(color,uWoodColor),distance(color,uBarkColor)));
   vSurface.y=(1.0-step(0.012,distance(color,uStoneColor)))+0.5*(1.0-step(0.012,min(distance(color,uRockColor),distance(color,uRockLightColor))));
   vSurface.z=1.0-step(0.012,min(distance(color,uLeafColor),min(distance(color,uLeafLightColor),distance(color,uPineColor))));
   vSurface.w=1.0-step(0.012,distance(color,uPlasterColor));
   #endif`);s.fragmentShader='varying vec4 vSurface;\n'+s.fragmentShader;
 });
 const water=surface(toon.material(W.water),'valley-water-ripples-v3',`
 vec2 waterUV=vValleyPosition.xz;float ripple=sin(waterUV.x*1.8+sin(waterUV.y*1.2+uValleyTime*.55)*1.4+uValleyTime*.65);
 float fleck=texture2D(uGravel,waterUV*.12+vec2(uValleyTime*.008,0.0)).r;
 float foam=smoothstep(.92,.99,ripple)*smoothstep(.77,.9,fleck);
 float shore=max(1.0-smoothstep(.2,1.2,abs(length(waterUV-vec2(95.0,100.0))-35.0)),1.0-smoothstep(.15,.6,abs(abs(waterUV.x-44.0)-3.45)));
 diffuseColor.rgb=mix(diffuseColor.rgb*(.80+fleck*.23),uWaterLight,max(foam*.68,shore*(.3+sin(uValleyTime+waterUV.y)*.06)));`);
 return {terrain,props,water,setProgress(value){shared.uRestore.value=value;},textureMB:textures.reduce((sum,t)=>sum+t.image.width*t.image.height*4*4/3/1048576,0)};
}

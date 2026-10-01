import * as THREE from 'three';
import {authoredTemplates,mergeParts} from './scene-kit.js';
import {worldPalette as W} from './world-palette.js';
import {brand} from './brand.js';

// Original modular art, exported to the Valley GLB manifest. Distant forms share
// the same silhouettes; only nearby bark, joinery and small fittings add geometry.
export function authoredValleyTemplates(){
 const models=authoredTemplates(),B=brand.colors,g={box:new THREE.BoxGeometry(1,1,1),sphere:new THREE.IcosahedronGeometry(.5,0),cylinder:new THREE.CylinderGeometry(.42,.5,1,6),cone:new THREE.ConeGeometry(.5,1,6)},parts=[],d=new THREE.Object3D();
 function piece(shape,color,x,y,z,sx,sy=sx,sz=sx,rx=0,ry=0,rz=0){d.position.set(x,y,z);d.rotation.set(rx,ry,rz);d.scale.set(sx,sy,sz);d.updateMatrix();parts.push({geometry:typeof shape==='string'?g[shape]:shape,matrix:d.matrix.clone(),color});}
 function finish(key){models[key]=mergeParts(parts);parts.length=0;}
 function canopy(detailed){piece('cylinder',W.wood,0,1.75,0,.65,3.5,.65,0,0,.045);for(const [x,y,z,s,c]of [[-.8,3.7,.1,2.8,W.pine],[.9,4,.1,2.65,W.leaf],[0,5,-.25,2.7,W.leafLight]])piece('sphere',c,x,y,z,s,s*.85,s,0,x,0);if(detailed){for(const [x,y,z,s,c]of [[-.9,4.5,-.9,1.7,W.leaf],[.85,3.55,.9,1.8,W.leafLight]])piece('sphere',c,x,y,z,s,s*.8,s,0,z,.2);for(const side of [-1,1]){piece('cylinder',W.barkLight,side*.45,2.7,0,.24,1.6,.24,0,0,side*-.62);piece('box',W.wood,side*.34,.16,.18,.8,.22,.3,0,side*.5,side*-.15);}piece('sphere',W.rockDark,-.3,.08,-.2,.8,.2,.7);}}
 const oldTree=models.tree;canopy(false);finish('tree-far');canopy(true);finish('tree');oldTree.dispose();
 models['house-far']=models.house;piece(models.house,B.text,0,0,0,1);piece('box',W.rockDark,0,.13,0,4.55,.25,4.55);
 for(const x of [-2.1,2.1])for(const z of [-2.1,2.1]){piece('box',W.stone,x,1.65,z,.24,3.25,.24);piece('box',W.barkLight,x,3.28,z,.3,.18,.3);}
 piece('box',W.barkLight,0,3.3,2.28,4.6,.22,.22);piece('box',W.barkLight,0,3.3,-2.28,4.6,.22,.22);
 for(const x of [-1.45,1.45]){piece('box',W.water,x,1.92,2.335,.58,.63,.035);piece('box',W.barkLight,x,1.92,2.38,.065,.7,.065);for(const side of [-1,1])piece('box',W.wood,x+side*.49,1.92,2.34,.18,.86,.08);piece('box',W.wood,x,1.36,2.52,1,.24,.38);for(const side of [-1,1])piece('sphere',side>0?W.flower:W.leaf,x+side*.25,1.56,2.52,.22,.28,.22);}
 for(const side of [-1,1]){piece('box',W.barkLight,side*2.24,1.85,.1,.1,1.22,1.18);piece('box',W.water,side*2.3,1.85,.1,.06,.96,.9);piece('box',W.barkLight,side*2.34,1.85,.1,.08,.08,1.05);piece('box',W.barkLight,side*2.34,1.85,.1,.08,1.05,.07);}
 for(const side of [-1,1])piece('box',W.barkLight,side*.64,1.12,2.36,.14,2.14,.15);piece('box',W.barkLight,0,2.17,2.36,1.42,.15,.2);piece('sphere',B.gold,.32,1.1,2.36,.085,.085,.085);
 for(let i=0;i<3;i++)piece('box',W.stone,0,.1+i*.13,2.68-i*.23,1.7-i*.1,.2,1.2-i*.2);
 piece('box',W.wood,0,2.65,2.6,1.9,.18,1.2,.08);piece('box',W.rockDark,1.25,5.25,-.9,.7,.16,.75);finish('house');
 models['rock-far']=models.rock;parts.push({geometry:models.rock,matrix:new THREE.Matrix4().makeScale(1.35,.9,1),color:B.text});piece('sphere',W.rockLight,.15,.55,-.2,.8,.24,.55,0,.4,.12);piece('sphere',W.pine,-.3,.48,.1,.55,.09,.5);finish('rock');
 for(const key of ['product-hall','lighthouse','windmill']){
  const original=models[key];piece(original,B.text,0,0,0,1);
  if(key==='product-hall'){piece('cylinder',W.stone,0,.12,0,5.3,.24,5.3);for(const x of [-1.88,1.88])for(const z of [-1.88,1.88]){piece('box',W.rockLight,x,2.55,z,.22,3.3,.22);piece('box',B.primary,x,4.2,z,.48,.24,.48);}for(const side of [-1,1])for(const z of [-1,1]){piece('box',W.wood,side*2.03,2.7,z,.12,1.55,.8);piece('box',W.water,side*2.11,2.7,z,.04,1.22,.54);piece('box',W.barkLight,side*2.15,2.7,z,.05,.08,.66);}piece('box',B.glow,0,6.24,0,.5,.35,.5);}
  else if(key==='lighthouse'){for(const y of [1,3,5,7])piece('cylinder',W.rockLight,0,y,0,3.08,.12,3.08);piece('cylinder',W.wood,0,9.72,0,3.4,.2,3.4);for(let i=0;i<8;i++){const a=i*Math.PI/4;piece('box',W.barkLight,Math.sin(a)*1.52,10.1,Math.cos(a)*1.52,.1,.75,.1);}piece('box',W.wood,0,1.05,1.32,1.1,2,.15);}
  else{for(const x of [-.5,.5])piece('box',W.barkLight,x,1.15,1.32,.15,2.2,.15);piece('box',W.wood,0,1.15,1.35,.85,2.1,.1);for(const side of [-1,1]){piece('box',W.cloud,side*1.55,5,.93,1.55,.45,.055);piece('box',W.cloud,0,5+side*1.55,.97,.45,1.55,.055);}}
  finish(key);original.dispose();
 }
 for(const geo of Object.values(g))geo.dispose();return models;
}

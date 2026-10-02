// Extracted unchanged from the current Liberty Runner scenery helpers.
import * as THREE from 'three';
import {rng} from './rng.js';
import {brand} from './brand.js';
const B=brand.colors;
export function createCrossingScenery(resources,W,add,trunk,rock){
  const frond=(()=>{const p=[];const edge=(t,side)=>[side*.72*Math.sin(Math.PI*t),Math.sin(t*Math.PI)*.55-t*.9,t*4.6];for(let i=0;i<5;i++){const a=i/5,b=(i+1)/5;for(const v of [edge(a,-1),edge(b,-1),edge(a,1),edge(a,1),edge(b,-1),edge(b,1)])p.push(...v);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();return resources.own(g);})();
  function palm(parts,x,y,z,scale=1){for(let i=0;i<4;i++)add(parts,trunk,i%2?W.wood:W.barkLight,x+i*.14*scale,y+(i+.5)*1.6*scale,z,.42*scale,1.65*scale,.42*scale);for(let i=0;i<7;i++){add(parts,frond,i%2?W.leaf:W.pine,x+.42*scale,y+6.8*scale,z,scale,scale,scale,i*Math.PI*2/7);}add(parts,rock,W.wood,x+.42*scale,y+6.45*scale,z,.75*scale,.6*scale,.75*scale);}
  function terrainGeometry(seed){const rand=rng(seed),vertices=[],colors=[],tint=new THREE.Color(),n=28,heights=[0,-.02,-.28,-1],radii=[.89,1,1.02,.69],angles=Array.from({length:n},(_,i)=>({a:i/n*Math.PI*2,r:.82+rand()*.2,h:rand()*.055}));
    const point=(ring,i)=>{const p=angles[(i+n)%n];return [Math.cos(p.a)*p.r*radii[ring],heights[ring]+(ring<2?p.h:0),Math.sin(p.a)*p.r*radii[ring]];};
    function vertex(v,color){vertices.push(...v);tint.set(color);colors.push(tint.r,tint.g,tint.b);}
    for(let i=0;i<n;i++){vertex([0,.045,0],W.grass);vertex(point(0,i+1),W.grass);vertex(point(0,i),W.grass);for(let ring=0;ring<3;ring++){const shade=ring===0?W.grassDark:ring===1?W.rockLight:W.rockDark;for(const p of [point(ring,i),point(ring,i+1),point(ring+1,i),point(ring+1,i),point(ring,i+1),point(ring+1,i+1)])vertex(p,shade);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();for(let i=0;i<n;i++)for(let j=0;j<3;j++)g.attributes.normal.setXYZ(i*21+j,0,1,0);return resources.own(g);}
  const terrainShapes=[terrainGeometry(13),terrainGeometry(98),terrainGeometry(471)];
  const mountain=(()=>{const rand=rng(427),positions=[],colors=[],color=new THREE.Color(),n=10,rings=[[-.5,.7],[-.05,.43],[.23,.22],[.5,0]],offset=Array.from({length:n},()=>.72+rand()*.4);function p(r,i){const a=i/n*Math.PI*2,[y,radius]=rings[r];return [Math.cos(a)*radius*offset[i%n]+(r===2?.07:0),y,Math.sin(a)*radius*offset[i%n]];}for(let r=0;r<3;r++)for(let i=0;i<n;i++){color.set(r>=1?W.grassLight:i%2?W.mountainNear:W.rockLight);for(const v of [p(r,i),p(r,i+1),p(r+1,i),p(r+1,i),p(r,i+1),p(r+1,i+1)]){positions.push(...v);colors.push(color.r,color.g,color.b);}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();return resources.own(geo);})();

return {palm,terrainShapes,mountain};
}

import * as THREE from 'three';
import {brand} from './brand.js';
import {worldPalette as W} from './world-palette.js';
export function createToon(resources){
  const time={value:0},resolution={value:new THREE.Vector2(1280,720)};
  const ramp=resources.own(new THREE.DataTexture(new Uint8Array(W.ramp.flatMap(v=>[v,v,v,255])),3,1,THREE.RGBAFormat));ramp.minFilter=ramp.magFilter=THREE.NearestFilter;ramp.generateMipmaps=false;ramp.needsUpdate=true;
  function material(color,options={}){const {rim=.11,...surface}=options,m=resources.own(new THREE.MeshToonMaterial({color,gradientMap:ramp,...surface}));m.userData.rimStrength=rim;m.onBeforeCompile=s=>{s.uniforms.uRim={value:new THREE.Color(W.warmKey)};s.uniforms.uRimStrength={value:rim};s.fragmentShader='uniform vec3 uRim;uniform float uRimStrength;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>','float rim=pow(1.0-max(0.0,dot(normal,normalize(vViewPosition))),4.0);outgoingLight+=uRim*rim*uRimStrength;\n#include <opaque_fragment>');};m.customProgramCacheKey=()=> 'pcock-s1-three-band-rim';return m;}
  function outline(color=W.outline,vertexColors=false,width=1.6){const m=resources.own(new THREE.MeshBasicMaterial({color,side:THREE.BackSide,depthWrite:true,vertexColors}));m.onBeforeCompile=s=>{s.uniforms.uResolution=resolution;s.uniforms.uHullWidth={value:width};s.vertexShader='uniform vec2 uResolution;uniform float uHullWidth;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
vec3 edgeNormal=normal;
#ifdef USE_SKINNING
 edgeNormal=mat3(skinMatrix)*edgeNormal;
#endif
#ifdef USE_INSTANCING
 edgeNormal=mat3(instanceMatrix)*edgeNormal;
#endif
edgeNormal=normalize(normalMatrix*edgeNormal);
gl_Position.xy+=edgeNormal.xy*uHullWidth*2.0/uResolution*gl_Position.w;`);};m.customProgramCacheKey=()=> 'pcock-s1-colored-hull';return m;}
  function tint(color){return new THREE.Color(color).multiply(new THREE.Color(.24,.29,.35));}
  function hull(mesh){const h=mesh.clone(false);h.material=outline(tint(mesh.material.color||W.stone));h.userData.hull=true;h.renderOrder=-1;h.castShadow=false;h.receiveShadow=false;mesh.parent.add(h);return h;}
  function wind(material){const compile=material.onBeforeCompile;material.onBeforeCompile=s=>{compile(s);s.uniforms.uWind=time;s.vertexShader='uniform float uWind;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\n transformed.x+=sin(uWind*1.4+instanceMatrix[3].x*.7+instanceMatrix[3].z*.45)*0.12*position.y;\n#endif');};material.customProgramCacheKey=()=> 'pcock-s1-wind-'+material.type;return material;}
  function grassMaterial(){return wind(material(brand.colors.text));}
  return {material,outline,hull,tint,grassMaterial,wind,time,resolution,ramp};
}

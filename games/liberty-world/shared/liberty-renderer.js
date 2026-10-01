import * as THREE from 'three';
import {worldPalette as W} from './world-palette.js';
// Runner-only budgets: the Valley renderer and its saved preferences are independent.
export const runnerProfiles=Object.freeze({
  Low:{dpr:1,pixels:240000,behind:100,ahead:240,grass:0,detail:0},
  Medium:{dpr:1.25,pixels:950000,behind:130,ahead:320,grass:.5,detail:2},
  High:{dpr:1.5,pixels:2100000,behind:150,ahead:360,grass:1,detail:2},
  Ultra:{dpr:2,pixels:3700000,behind:150,ahead:400,grass:1,detail:3}
});
export function createRunnerRenderer(container,settings,resources){
  const renderer=resources.own(new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false}));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.info.autoReset=false;renderer.setClearColor(W.sky);renderer.domElement.setAttribute('aria-label','Liberty Runner world');container.append(renderer.domElement);
  const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info'),software=/swiftshader|llvmpipe|software/i.test(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'');
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(64,1,.1,650),sun=new THREE.DirectionalLight(W.warmKey,2.1);scene.fog=new THREE.Fog(W.fog,120,300);sun.position.set(-25,40,20);scene.add(sun,new THREE.HemisphereLight(W.sky,W.coolFill,1.35));
  let preset=settings.preset==='Auto'?(software?'Low':'High'):settings.preset,scale=1,last=0,nextFrame=0,acc=0,raf=0,running=false,contextLost=false,frameMs=16.7,adjust=0,slow=0,stable=0,qualityHandler=()=>{},isRunning=()=>true;
  const deterministic=new URLSearchParams(location.search).has('shot'),metrics={fps:60,frameMs:16.7,cpuMs:0,drawCalls:0,triangles:0,activePreset:preset,renderScale:1,dpr:1,contextLost:false,softwareGraphics:software};
  function resize(){const rect=container.getBoundingClientRect(),w=Math.max(1,rect.width),h=Math.max(1,rect.height),p=runnerProfiles[preset];const native=Math.min(devicePixelRatio||1,p.dpr),budget=Math.sqrt(p.pixels/(w*h)),dpr=Math.min(native,budget)*settings.renderScale*scale;
    if(Math.abs(metrics.dpr-dpr)>.005||renderer.domElement.width!==Math.floor(w*dpr)||renderer.domElement.height!==Math.floor(h*dpr)){renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);}metrics.dpr=dpr;metrics.renderScale=settings.renderScale*scale;metrics.bufferWidth=renderer.domElement.width;metrics.bufferHeight=renderer.domElement.height;camera.aspect=w/h;camera.updateProjectionMatrix();}
  function notifyQuality(){metrics.activePreset=preset;qualityHandler(runnerProfiles[preset],preset);resize();}
  function applySettings(){preset=settings.preset==='Auto'?(software?'Low':'High'):settings.preset;if(!runnerProfiles[preset])preset='Medium';scale=1;adjust=slow=stable=nextFrame=0;notifyQuality();}
  function render(){renderer.info.reset();renderer.setRenderTarget(null);renderer.render(scene,camera);metrics.drawCalls=renderer.info.render.calls;metrics.triangles=renderer.info.render.triangles;}
  function start(fixed,interpolate){if(running)return;running=true;function tick(now){raf=requestAnimationFrame(tick);if(document.hidden||contextLost){last=nextFrame=0;acc=0;return;}if(!last){last=now;nextFrame=now;return;}const playing=isRunning(),target=playing?settings.fpsCap:30,raw=now-last,interval=target?1000/target:0;if(interval&&now+.35<nextFrame)return;if(interval){nextFrame+=interval;if(nextFrame<now)nextFrame=now+interval;}else nextFrame=now;last=now;const dt=Math.min(raw/1000,.25),begin=performance.now();
      // Up to 15 small physics steps catch up after a hitch; never take a giant collision step.
      if(playing){acc+=dt;let steps=0;while(acc>=1/60&&steps++<15){fixed(1/60);acc-=1/60;}}else acc=0;
      interpolate(Math.min(1,acc*60),dt);render();metrics.cpuMs+=(performance.now()-begin-metrics.cpuMs)*.08;frameMs+=(raw-frameMs)*.1;Object.assign(metrics,{fps:Math.round(1000/Math.max(1,frameMs)),frameMs:Math.round(frameMs*100)/100});if(playing)metrics.lastRunFPS=metrics.fps;
      if(playing&&!deterministic&&settings.preset==='Auto'){const desired=target||60;adjust+=raw/1000;slow=frameMs>Math.max(38,1000/desired*1.35)?slow+raw/1000:0;stable=frameMs<1000/desired*1.15?stable+raw/1000:0;
        if(slow>1.2&&preset!=='Low'){preset=preset==='High'?'Medium':'Low';scale=1;slow=stable=0;notifyQuality();}
        if(adjust>1.2){adjust=0;const next=slow>.5?Math.max(.65,scale-.1):stable>8?Math.min(1,scale+.05):scale;if(next!==scale){scale=next;stable=0;resize();}}}
    }raf=requestAnimationFrame(tick);}
  const observer=new ResizeObserver(resize);observer.observe(container);visualViewport?.addEventListener('resize',resize);
  const lost=e=>{e.preventDefault();contextLost=metrics.contextLost=true;},restored=()=>{contextLost=metrics.contextLost=false;last=0;acc=0;resize();};renderer.domElement.addEventListener('webglcontextlost',lost);renderer.domElement.addEventListener('webglcontextrestored',restored);
  resources.onDispose(()=>{running=false;cancelAnimationFrame(raf);observer.disconnect();visualViewport?.removeEventListener('resize',resize);renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('webglcontextrestored',restored);renderer.domElement.remove();});resize();
  return {renderer,scene,camera,sun,metrics,start,render,resize,applySettings,setQualityHandler(fn){qualityHandler=fn;notifyQuality();},setRunning(fn){isRunning=fn;last=0;acc=0;},get preset(){return preset;}};
}

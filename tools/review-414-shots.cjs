// Rendered review evidence, not a normal traversal or play-duration test.
const puppeteer=require(process.env.MARIA414_PUPPETEER||'puppeteer');
const fs=require('fs'),path=require('path');
const base=path.resolve(__dirname,'..');
const url=process.env.MARIA414_URL||'http://127.0.0.1:8415/index.html?classic';
let browser;const renderErrors=[];
async function click(page,label){await page.evaluate(t=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===t);if(!b)throw Error('Missing '+t);b.click()},label)}
async function boot(mirror){
 const page=await browser.newPage();await page.setViewport({width:1440,height:900});
 await page.evaluateOnNewDocument(m=>{
  localStorage.clear();localStorage.setItem('atropa_skin_v1',m?'sommi':'maria-414');
  localStorage.setItem('atropa_prestige_v1',JSON.stringify({seenIntro:true,trialDone:true,trialOutcome:'completed'}));
  localStorage.setItem('atropa_settings_v1',JSON.stringify({renderScale:.8,shadows:false,uiScale:1}));
  localStorage.setItem(m?'atropa_sommi_414_same_night_v1':'atropa_maria_414_reclaimed_v1',JSON.stringify({v:1,started:true,complete:true,rewarded:true,step:31,seen:[0,1,2,3,4,5,6,7,8,9]}));
  if(m)localStorage.setItem('atropa_sommi_414_house_v1',JSON.stringify({v:1,complete:true,step:4,inside:false,hasRifles:true,rewarded:true}));
 },mirror);
 page.on('pageerror',e=>{renderErrors.push(e.message);console.error('PAGEERROR',e.message)});
 page.on('console',m=>{if(m.type()==='error'&&/shader|WebGLProgram|compile|414/i.test(m.text())){renderErrors.push(m.text());console.error('RENDERERROR',m.text())}});
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 await page.evaluate(async()=>{await window.__atropaStartMain();document.getElementById('atropa-site-front')?.remove();document.getElementById('atropa-site-splash')?.remove();document.documentElement.classList.remove('atropa-site-visible')});
 await click(page,'ENTER');await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='CONTINUE →'));await click(page,'CONTINUE →');await page.waitForFunction(()=>window.__game);await click(page,'ENTER THE CITY →');return page;
}
(async()=>{
 browser=await puppeteer.launch({headless:true,args:['--enable-unsafe-swiftshader']});
 const report=[];
 for(const mirror of [false,true]){
  const page=await boot(mirror),p=mirror?'sommiMirror414':'maria414',frames=[];
  for(let act=0;act<10;act++){
   await page.evaluate(({p,act})=>{if(!window.__game[p+'Replay'](act,true))throw Error('Replay failed '+act)}, {p,act});
   await new Promise(r=>setTimeout(r,act===6?3500:300));
   const shotRender=[];for(let shot=0;shot<3;shot++){
    await page.evaluate(({p,shot})=>{const c=window.__game[p+'Cine'];c.t=c.duration*(shot+.3)/3;},{p,shot});
    await new Promise(r=>setTimeout(r,120));
    const frame=await page.screenshot();frames.push({label:`ACT ${act+1} / SHOT ${shot+1}`,src:'data:image/png;base64,'+Buffer.from(frame).toString('base64')});
    if(!mirror&&shot===0&&[0,1,2,4,5,6,7,8].includes(act))fs.writeFileSync(path.join(base,`r6-maria414-act-${act+1}.png`),frame);
    shotRender.push(await page.evaluate(()=>{const i=window.__game.renderer.info;return {calls:i.render.calls,triangles:i.render.triangles}}));
   }
   const state=await page.evaluate(p=>{const g=window.__game,w=g[p+'World'],r=w.rooms.get(w.room),info=g.renderer?.info;let meshes=0,instances=0;r.root.traverse(o=>{if(o.isMesh)meshes++;if(o.isInstancedMesh)instances+=o.count;});return {act:g[p+'Cine'].act,frameBroke:!!g.frameBroke,meshes,instances,render:info?{calls:info.render.calls,triangles:info.render.triangles,geometries:info.memory.geometries,textures:info.memory.textures}:null,actor:r.actor?{visible:r.actor.visible,pos:r.actor.position.toArray(),nativeSommiMesh:!!r.actor.getObjectByName('sommi-model'),shaderGait:!!r.actor.userData.legs?.sommiShaderWalk,rigReady:!!r.actor.userData.externalRig?.ready,rigFailed:!!r.actor.userData.externalRig?.failed}:null,voiceFallback:!!r.actorVoiceFallback}},p);
   if(state.frameBroke)throw Error('Native render loop failed in '+p+' act '+act);
   if(act===6&&(!state.actor||!(state.actor.rigReady||(state.actor.nativeSommiMesh&&state.actor.shaderGait))||state.actor.rigFailed||state.voiceFallback))throw Error('Encounter character did not render correctly: '+JSON.stringify(state.actor));
   report.push({route:p,...state,shotRender});console.log('SHOT_PASS',p,act+1,JSON.stringify(shotRender));await page.evaluate(p=>document.querySelector('#'+p+'-cine button')?.click(),p);
  }
  const sheet=await browser.newPage();await sheet.setViewport({width:1440,height:3200,deviceScaleFactor:1});
  await sheet.setContent('<html><body style="margin:0;background:#070c15;color:#ecd092;font:14px Arial;display:grid;grid-template-columns:repeat(3,480px)">'+frames.map(f=>'<div style="height:320px"><div style="padding:5px">'+f.label+'</div><img style="width:480px;height:300px" src="'+f.src+'"></div>').join('')+'</body></html>');
  await sheet.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await sheet.screenshot({path:path.join(base,mirror?'sommi414-shot-review.png':'maria414-shot-review.png')});
  await sheet.close();console.log('SHOT_METRICS',p,JSON.stringify(report.filter(r=>r.route===p)));
  await page.setViewport({width:390,height:844});await page.evaluate(p=>window.__game[p+'Replay'](6,true),p);await new Promise(r=>setTimeout(r,1800));
  await page.evaluate(p=>{const c=window.__game[p+'Cine'];c.t=c.duration*.78},p);await new Promise(r=>setTimeout(r,120));
  await page.screenshot({path:path.join(base,mirror?'sommi414-encounter-portrait.png':'maria414-encounter-portrait.png')});await page.close();console.log('RENDERED',p,'30 desktop shot samples + portrait encounter');
 }
 if(renderErrors.length)throw Error('Rendering errors: '+renderErrors.join('\n'));
 fs.writeFileSync(path.join(base,'414-shot-review.json'),JSON.stringify({environment:'Headless Chromium / software WebGL; draw counts, not a physical-phone FPS benchmark',renderErrors,shots:report},null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1}).finally(async()=>{await browser?.close()});

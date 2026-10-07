// Scenario screenshots and native camera checks. Checkpoint seeding is explicit;
// this is not a progression, physical-device, or human-play-duration test.
const puppeteer=require(process.env.MARIA414_PUPPETEER||'puppeteer');
const fs=require('fs'),path=require('path');
const base=path.resolve(__dirname,'..'),url=process.env.MARIA414_URL||'http://127.0.0.1:8417/index.html?classic';
let browser;const errors=[],report=[];
async function click(page,label){await page.evaluate(t=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===t);if(!b)throw Error('Missing '+t);b.click()},label)}
(async()=>{
 browser=await puppeteer.launch({headless:true,args:['--enable-unsafe-swiftshader']});
 for(const mobile of [false,true]){
  const page=await browser.newPage();await page.setViewport(mobile?{width:390,height:844,isMobile:true,hasTouch:true}:{width:1440,height:900});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|WebGLProgram|compile/i.test(m.text()))errors.push(m.text())});
  await page.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('atropa_skin_v1','maria-414');localStorage.setItem('atropa_prestige_v1',JSON.stringify({seenIntro:true,trialDone:true,trialOutcome:'completed'}));localStorage.setItem('atropa_settings_v1',JSON.stringify({renderScale:.8,shadows:false,uiScale:1}))});
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  await page.evaluate(async()=>{await window.__atropaStartMain();document.getElementById('atropa-site-front')?.remove();document.getElementById('atropa-site-splash')?.remove();document.documentElement.classList.remove('atropa-site-visible')});
  await click(page,'ENTER');await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='CONTINUE →'));await click(page,'CONTINUE →');await page.waitForFunction(()=>window.__game);await click(page,'ENTER THE CITY →');
  for(const [room,step] of [0,3,7,10,13,17,22,24,28].entries()){
   await page.evaluate(step=>{const g=window.__game;g.maria414Pause();localStorage.setItem('atropa_maria_414_reclaimed_v1',JSON.stringify({v:1,started:true,step,seen:[0,1,2,3,4,5,6,7,8,9],rifles:step>=20&&step<28}));if(!g.maria414Start())throw Error('Scenario failed '+step)},step);
   for(const mode of ['chase','overhead']){
    await page.evaluate(mode=>{const g=window.__game;g.viewMode=mode;g.viewBlend=g.viewBlendTarget=mode==='overhead'?0:1;g.camYaw=0;g.camPitch=.28},mode);
    await new Promise(r=>setTimeout(r,650));
    const state=await page.evaluate(()=>{const g=window.__game,w=g.maria414World,i=g.renderer.info;return {room:w.room,frameBroke:!!g.frameBroke,camera:g.camera.position.toArray(),player:g.playerPos.toArray(),calls:i.render.calls,triangles:i.render.triangles,dialog:!!g.maria414Dialog,programErrors:i.programs.filter(p=>p.diagnostics?.runnable===false).length}});
    if(state.room!==room||state.frameBroke||state.programErrors||state.camera.some(x=>!Number.isFinite(x)))throw Error('Bad native camera/render state '+JSON.stringify(state));
    report.push({mobile,mode,...state});await page.screenshot({path:path.join(base,`r6-play-${mobile?'portrait':'desktop'}-${room}-${mode}.png`)});
   }
   console.log('PLAY_VIEWS_PASS',mobile?'portrait':'desktop',room);
  }
  await page.close();
 }
 if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync(path.join(base,'r6-play-views.json'),JSON.stringify({environment:'Headless Chromium; 390x844 touch emulation is not a physical phone',errors,report},null,2));
 console.log('PASS 36 native chase/overhead scenario renders across all nine rooms');
})().catch(e=>{console.error(e.stack);process.exitCode=1}).finally(async()=>{await browser?.close()});

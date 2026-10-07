const puppeteer=require(process.env.MARIA414_PUPPETEER || 'puppeteer');
const fs=require('fs'),path=require('path');
const base=path.resolve(__dirname,'..'),url=process.env.MARIA414_URL || 'http://127.0.0.1:8414/index.html?classic';
let browser;
const errors=[];
async function boot(mobile=false){
 const page=await browser.newPage();page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message)});
 await page.setViewport(mobile?{width:390,height:844,isMobile:true,hasTouch:true}:{width:1440,height:900});
 const seed=await page.evaluateOnNewDocument(isMobile=>{
  localStorage.clear();localStorage.setItem('atropa_skin_v1','sommi');localStorage.setItem('atropa_sommi_414_house_v1',JSON.stringify({v:1,complete:true,step:4,inside:false,hasRifles:true,rewarded:true}));
  if(!isMobile)localStorage.setItem('atropa_prestige_v1',JSON.stringify({seenIntro:true,trialDone:true,trialOutcome:'completed'}));
  localStorage.setItem('atropa_settings_v1',JSON.stringify({renderScale:.6,shadows:false,uiScale:1}));
 },mobile);
 page.sommiMirror414Seed=seed.identifier;
 await launch(page);return page;
}
async function launch(page){
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 await page.evaluate(async()=>{await window.__atropaStartMain();document.getElementById('atropa-site-front')?.remove();document.getElementById('atropa-site-splash')?.remove();document.documentElement.classList.remove('atropa-site-visible');});
 await click(page,'ENTER');await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='CONTINUE →'));
 await click(page,'CONTINUE →');await page.waitForFunction(()=>window.__game);await click(page,'ENTER THE CITY →');
}
async function click(page,text){await page.evaluate(t=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===t);if(!b)throw Error('Missing button '+t);b.click()},text);}
async function skip(page){await page.evaluate(()=>document.querySelector('#sommiMirror414-cine button')?.click());}

// Uses the host's native tap-to-walk movement; no objective teleports, time
// scaling, or cinematic skips. Dialogues are clicked promptly, so this is a
// traversal baseline rather than a measured first-time human playthrough.
let readingWords=0;
async function cinematicDone(page){await page.waitForFunction(()=>!window.__game.sommiMirror414Cine,{timeout:45000});}
async function walk(page,step,puzzle=null,depth=false){
 for(let retry=0;retry<10;retry++){
  if(step===13||step===14)await page.waitForFunction(()=>window.__game.sommiMirror414World.clock%5>=2.9,{timeout:8000});
  const started=await page.evaluate(({step,puzzle,depth})=>{
   const g=window.__game,w=g.sommiMirror414World,q=window.__sommiMirror414Quest.read();if(q.step!==step)return false;
   const it=puzzle===null?w.nodeMeshes.get(step).it:(depth?w.depthMeshes:w.puzzleMeshes).get(step+':'+puzzle).it;
   if(g.playerPos.distanceTo(it.pos)<2.5)return false;
   const target=(step===13||step===14)&&puzzle===null?g.questWaypointPos():it.pos;
   g.moveTarget={x:target.x,z:target.z,lastD:1e9,still:0};return true;
  },{step,puzzle,depth});
  if(!started)return;
  await page.waitForFunction(({step,puzzle,depth})=>{const g=window.__game,q=window.__sommiMirror414Quest.read();if(q.step!==step)return true;const w=g.sommiMirror414World,it=puzzle===null?w.nodeMeshes.get(step).it:(depth?w.depthMeshes:w.puzzleMeshes).get(step+':'+puzzle).it;return g.playerPos.distanceTo(it.pos)<2.5||!g.moveTarget},{timeout:30000},{step,puzzle,depth});
  const reached=await page.evaluate(({step,puzzle,depth})=>{const g=window.__game,q=window.__sommiMirror414Quest.read();if(q.step!==step)return true;const w=g.sommiMirror414World,it=puzzle===null?w.nodeMeshes.get(step).it:(depth?w.depthMeshes:w.puzzleMeshes).get(step+':'+puzzle).it;const ok=g.playerPos.distanceTo(it.pos)<2.5;g.moveTarget=null;g.playerVel.set(0,0,0);return ok},{step,puzzle,depth});
  if(reached)return;
  await new Promise(r=>setTimeout(r,300));
 }
 throw Error('Native traversal stalled at '+step+' puzzle '+puzzle);
}
async function interactAt(page,step,puzzle=null,depth=false){await walk(page,step,puzzle,depth);await page.evaluate(({step,puzzle,depth})=>{if(window.__sommiMirror414Quest.read().step!==step)return;const g=window.__game,w=g.sommiMirror414World;g.interact(puzzle===null?w.nodeMeshes.get(step).it:(depth?w.depthMeshes:w.puzzleMeshes).get(step+':'+puzzle).it)},{step,puzzle,depth});}
async function recordReading(page){const words=await page.evaluate(()=>{const el=document.querySelector('#sommiMirror414-dialog p');return el?el.textContent.trim().split(/\s+/).length:0});readingWords+=words;}
(async()=>{
 browser=await puppeteer.launch({headless:true,args:['--enable-unsafe-swiftshader']});const page=await boot(false);await page.waitForFunction(()=>window.__game?.sommiMirror414Inside);const start=Date.now();
 for(let i=0;i<32;i++){
  await cinematicDone(page);const kind=await page.evaluate(i=>window.__sommiMirror414Quest.steps[i][6],i);
  if(i===1){
   for(let n=0;n<3;n++){await interactAt(page,i,n);await recordReading(page);await click(page,'SAVE LOCAL RECORDING')}
   await interactAt(page,i);await recordReading(page);for(const title of ['ALARM DISABLED','CASE REMOVED','CARRIER WAKES'])await click(page,title);
  }else{
   if(i===8){
    for(let n=0;n<4;n++){await interactAt(page,i,n,true);await recordReading(page);await click(page,'RECORD CABLE EVIDENCE')}
    await interactAt(page,i);await recordReading(page);await page.evaluate(()=>{const api=window.__sommiMirror414Quest;for(const[n,target]of[3,1,2,0].entries())while(api.read().puzzles.exit.routes[n]!==target)document.querySelector('#sommiMirror414-dialog [data-depth-route="'+n+'"]').click()});await click(page,'TEST LIVE ROUTE');
   }
   if(i>=17&&i<=19){await interactAt(page,i);await recordReading(page);await page.evaluate(i=>{const api=window.__sommiMirror414Quest;for(let n=0;n<16;n++)while(api.read().puzzles.engine.turns[i-17][n]!==0)document.querySelector('#sommiMirror414-dialog [data-depth-cell="'+n+'"]').click()},i);await click(page,'ISOLATE CIRCUIT');}
   if(i===29){for(let n=0;n<4;n++){await interactAt(page,i,n,true);await recordReading(page);await page.evaluate(n=>{const api=window.__sommiMirror414Quest;for(const cell of api.depth.districtSolution(api.read().puzzles.district.boards[n]))document.querySelector('#sommiMirror414-dialog [data-depth-cell="'+cell+'"]').click()},n);await click(page,'RESTORE DISTRICT');}}
   if(i===10){for(const [n,turns] of [[0,3],[1,1],[2,2]])for(let turn=0;turn<turns;turn++)await interactAt(page,i,n);}
   if(kind==='trace')await page.waitForFunction(()=>window.__game.sommiMirror414World.rooms.get(1).carrier.phase>=1,{timeout:12000});
   await walk(page,i);
   if(kind==='pulse')await page.waitForFunction(i=>{const g=window.__game,q=window.__sommiMirror414Quest.read();if(q.step!==i)return true;const phase=g.sommiMirror414World.clock%5;if(phase>=2.9&&phase<4.3)g.interact(g.sommiMirror414World.nodeMeshes.get(i).it);return window.__sommiMirror414Quest.read().step!==i},{timeout:12000},i);
   else await interactAt(page,i);await recordReading(page);
   if(kind==='code'){await click(page,'4');await click(page,'1');await click(page,'4')}
   else await page.evaluate(()=>[...document.querySelectorAll('#sommiMirror414-dialog button')].find(b=>b.textContent!=='CLOSE')?.click());
  }
  const q=await page.evaluate(()=>window.__sommiMirror414Quest.read());if(!q.complete&&q.step!==i+1)throw Error('Traversal expected '+(i+1)+' got '+q.step);
  console.log('WALKED',i+1,'elapsed_seconds',Math.round((Date.now()-start)/1000));
 }
 const result=await page.evaluate(()=>({state:window.__sommiMirror414Quest.read(),inside:window.__game.sommiMirror414Inside,frameBroke:!!window.__game.frameBroke}));
 const report={...result,wallSeconds:Math.round((Date.now()-start)/1000),readingWords,readingEstimateSecondsAt210wpm:Math.round(readingWords/210*60),nativeTapToWalk:true,objectiveTeleports:false,cinematicSkips:false,humanPlayDuration:false,errors};
 fs.writeFileSync(path.join(base,'sommiMirror414-traversal-timing.json'),JSON.stringify(report,null,2));if(!result.state.complete||result.inside||result.frameBroke||errors.length)throw Error('Traversal failed');console.log('PASS native traversal baseline',JSON.stringify(report));
})().catch(e=>{console.error(e.stack);process.exitCode=1}).finally(async()=>{await browser?.close()});

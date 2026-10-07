const puppeteer=require(process.env.MARIA414_PUPPETEER || 'puppeteer');
const fs=require('fs'),path=require('path');
const base=path.resolve(__dirname,'..'),url=process.env.MARIA414_URL || 'http://127.0.0.1:8414/index.html?classic';
let browser;
const errors=[];
async function boot(mobile=false){
 const page=await browser.newPage();page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message)});
 await page.setViewport(mobile?{width:390,height:844,isMobile:true,hasTouch:true}:{width:1440,height:900});
 const seed=await page.evaluateOnNewDocument(isMobile=>{
  localStorage.clear();localStorage.setItem('atropa_skin_v1','maria-414');
  if(!isMobile)localStorage.setItem('atropa_prestige_v1',JSON.stringify({seenIntro:true,trialDone:true,trialOutcome:'completed'}));
  localStorage.setItem('atropa_settings_v1',JSON.stringify({renderScale:.6,shadows:false,uiScale:1}));
 },mobile);
 page.maria414Seed=seed.identifier;
 await launch(page);return page;
}
async function launch(page){
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 await page.evaluate(async()=>{await window.__atropaStartMain();document.getElementById('atropa-site-front')?.remove();document.getElementById('atropa-site-splash')?.remove();document.documentElement.classList.remove('atropa-site-visible');});
 await click(page,'ENTER');await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='CONTINUE →'));
 await click(page,'CONTINUE →');await page.waitForFunction(()=>window.__game);await click(page,'ENTER THE CITY →');
}
async function click(page,text){await page.evaluate(t=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===t);if(!b)throw Error('Missing button '+t);b.click()},text);}
async function skip(page){await page.evaluate(()=>document.querySelector('#maria414-cine button')?.click());}
async function preparePuzzle(page,i){
 if(![1,8,10,17,18,19,29].includes(i))return;
 await page.evaluate(step=>{
  const g=window.__game,w=g.maria414World,visit=it=>{g.playerPos.copy(it.pos);g.player.position.copy(g.playerPos);g.playerVel.set(0,0,0);g._storyCutsceneFrozenPos=null;g.interact(it);};

  const api=window.__maria414Quest,click=t=>{const b=[...document.querySelectorAll('#maria414-dialog button')].find(b=>b.textContent===t);if(!b)throw Error('Missing depth button '+t);b.click()},cell=n=>document.querySelector('#maria414-dialog [data-depth-cell="'+n+'"]');
  if(step===8){for(let n=0;n<4;n++){visit(w.depthMeshes.get('8:'+n).it);click('RECORD CABLE EVIDENCE')};visit(w.nodeMeshes.get(step).it);for(const [n,target] of [3,1,2,0].entries())while(api.read().puzzles.exit.routes[n]!==target)document.querySelector('#maria414-dialog [data-depth-route="'+n+'"]').click();click('TEST LIVE ROUTE');return;}
  if(step>=17&&step<=19){visit(w.nodeMeshes.get(step).it);for(let n=0;n<16;n++)while(api.read().puzzles.engine.turns[step-17][n]!==0)cell(n).click();click('ISOLATE CIRCUIT');return;}
  if(step===29){for(let n=0;n<4;n++){visit(w.depthMeshes.get('29:'+n).it);for(const pos of api.depth.districtSolution(api.read().puzzles.district.boards[n]))cell(pos).click();click('RESTORE DISTRICT')};return;}
  if(step===1){
   for(let n=0;n<3;n++){visit(w.puzzleMeshes.get('1:'+n).it);[...document.querySelectorAll('#maria414-dialog button')].find(b=>b.textContent==='SAVE LOCAL RECORDING').click();}
   visit(w.nodeMeshes.get(1).it);
   for(const title of ['ALARM DISABLED','CASE REMOVED','CARRIER WAKES'])[...document.querySelectorAll('#maria414-dialog button')].find(b=>b.textContent===title).click();
   if(window.__maria414Quest.read().step!==2)throw Error('House timeline did not advance');
  }else{for(const [n,turns] of [[0,3],[1,1],[2,2]])for(let turn=0;turn<turns;turn++)visit(w.puzzleMeshes.get('10:'+n).it);}
 },i);
}
async function objective(page,i){
 await skip(page);await preparePuzzle(page,i);if(i===1){console.log('OBJECTIVE 2 house timeline');return;}
 const stepKind=await page.evaluate(i=>window.__maria414Quest.steps[i][6],i);
 if(stepKind==='trace')await page.waitForFunction(()=>window.__game.maria414World.rooms.get(1).carrier.phase>=1,{timeout:12000});
 const result=await page.evaluate(expected=>{
  const g=window.__game,q=window.__maria414Quest.read();if(q.step!==expected)throw Error('Expected '+expected+' got '+q.step);if(g.frameBroke)throw Error('Game frame stopped');
  const nd=g.maria414World.nodeMeshes.get(q.step);g.playerPos.copy(nd.it.pos);g.playerVel.set(0,0,0);g.player.position.copy(g.playerPos);g._storyCutsceneFrozenPos=null;
  const kind=window.__maria414Quest.steps[q.step][6];
  if(kind==='pulse'){g.maria414World.clock=1;g.interact(nd.it);if(window.__maria414Quest.read().step!==expected)throw Error('Red pulse accepted');g.maria414World.clock=3.5;}
  g.interact(nd.it);return {kind,dialog:!!g.maria414Dialog};
 },i);
 if(result.kind==='code'){
  await click(page,'7');if(await page.evaluate(()=>window.__maria414Quest.read().step)!==i)throw Error('Wrong code advanced');
  await click(page,'4');await click(page,'1');await click(page,'4');
 }else if(result.dialog)await page.evaluate(()=>[...document.querySelectorAll('#maria414-dialog button')].find(b=>b.textContent!=='CLOSE').click());
 console.log('OBJECTIVE',i+1,result.kind);
}
(async()=>{
 browser=await puppeteer.launch({headless:true,args:['--enable-unsafe-swiftshader']});
 const page=await boot(false);await page.waitForFunction(()=>window.__game?.maria414Inside,{timeout:30000});
 await page.screenshot({path:path.join(base,'test414-opening.png')});await skip(page);
 const initial=await page.evaluate(()=>window.__maria414Quest.snapshot());
 const beforeMove=await page.evaluate(()=>window.__game.playerPos.toArray());
 await page.keyboard.down('w');await new Promise(r=>setTimeout(r,800));await page.keyboard.up('w');
 const moved=await page.evaluate(p=>Math.hypot(...window.__game.playerPos.toArray().map((v,i)=>v-p[i])),beforeMove);
 if(moved<.5)throw Error('Normal keyboard movement did not move Maria');
 await page.waitForFunction(()=>document.querySelector('canvas[data-maria414-room="0"]'));
 console.log('NORMAL MOVEMENT AND INTERIOR MINIMAP OK');
 await page.evaluate(()=>window.__game.maria414Pause());if(await page.evaluate(()=>window.__game.maria414Inside))throw Error('Pause did not exit');await page.evaluate(()=>window.__game.maria414Start());
 for(let i=0;i<25;i++){
  await objective(page,i);
  if(i===6){
   await skip(page);await page.removeScriptToEvaluateOnNewDocument(page.maria414Seed);
   await launch(page);await page.waitForFunction(()=>window.__game);
   if(await page.evaluate(()=>window.__maria414Quest.read().step)!==7)throw Error('Reload lost checkpoint');
   await page.evaluate(()=>window.__game.maria414Start());
   await page.waitForFunction(()=>document.querySelector('canvas[data-maria414-room="2"]'));
   console.log('RELOAD / RESUME AND ROOM MAP TRANSITION OK');
  }
  if(i===17){await skip(page);await page.waitForFunction(()=>document.querySelector('canvas[data-maria414-room="5"]'));await new Promise(r=>setTimeout(r,400));await page.screenshot({path:path.join(base,'test414-engine.png')});}
  if(i===21){
   await new Promise(r=>setTimeout(r,2200));await page.screenshot({path:path.join(base,'test414-encounter-entry.png')});await skip(page);
   await page.waitForFunction(()=>{const r=window.__game.maria414World.rooms.get(6);return r.actorVoiceFallback||(r.actor?.visible&&Math.abs(r.actor.position.z+12)<.01&&(!r.actor.userData.externalRig||r.actor.userData.externalRig.ready));});
   await page.screenshot({path:path.join(base,'test414-sommi.png')});
  }
 }
 await page.evaluate(()=>{window.__game.maria414World.collapse=.001;window.__game.updatePlayer(.05)});
 if(await page.evaluate(()=>window.__maria414Quest.read().step)!==24)throw Error('Collapse retry missing');console.log('COLLAPSE RETRY OK');
 for(let i=24;i<32;i++)await objective(page,i);
 const final=await page.evaluate(()=>({state:window.__maria414Quest.read(),inside:window.__game.maria414Inside,...window.__maria414Quest.snapshot(),pos:window.__game.playerPos.toArray(),frameBroke:!!window.__game.frameBroke}));
 if(!final.state.complete||final.inside||final.frameBroke)throw Error('Bad completion');if(final.pls-initial.pls!==414)throw Error('Reward wrong');
 if(JSON.stringify(final.mainQuests)!==JSON.stringify(initial.mainQuests)||final.mainQuestIndex!==initial.mainQuestIndex)throw Error('Campaign changed');
 await page.waitForFunction(()=>!document.querySelector('canvas[data-maria414-room]'));
 await page.evaluate(()=>{window.__game.maria414Start();for(let n=0;n<10;n++)document.querySelector('#maria414-cine button')?.click()});
 const after=await page.evaluate(()=>({pls:window.__maria414Quest.snapshot().pls,inside:window.__game.maria414Inside}));if(after.pls!==final.pls||after.inside)throw Error('Replay reward/return error');
 await page.evaluate(()=>{if(!window.__game.maria414Recordings())throw Error('Completed story gallery did not open')});
 await page.screenshot({path:path.join(base,'maria414-recordings.png')});
 await page.evaluate(()=>{const buttons=[...document.querySelectorAll('#maria414-dialog button')];if(buttons.length!==12)throw Error('Chapter picker options missing');buttons[7].click();if(window.__game.maria414Cine?.act!==6)throw Error('Wrong selected act')});
 await skip(page);if(await page.evaluate(()=>window.__game.maria414Inside))throw Error('Single-act replay did not return');
 await page.evaluate(()=>window.__game.maria414Recordings());await page.keyboard.press('Escape');
 if(await page.evaluate(()=>!!window.__game.maria414Dialog))throw Error('Gallery Escape did not close');
 console.log('CHAPTER PICKER / SINGLE ACT / ESCAPE OK');
 console.log('DESKTOP COMPLETE: 32 objectives, 10 acts, reward once, campaign intact, replay intact');await page.close();
 const mobile=await boot(true);await mobile.waitForFunction(()=>window.__game?.tut,{timeout:30000});
 if(await mobile.evaluate(()=>!!window.__game.maria414Inside))throw Error('Quest interrupted tutorial');
 await mobile.evaluate(()=>window.__game.finishTutorial('completed'));await mobile.waitForFunction(()=>window.__game?.maria414Inside);
 await mobile.screenshot({path:path.join(base,'test414-mobile.png')});await mobile.tap('#maria414-cine button');await mobile.waitForFunction(()=>document.querySelector('canvas[data-maria414-room="0"]'));await new Promise(r=>setTimeout(r,400));
 if(await mobile.evaluate(()=>document.body.innerText.includes('GRADUATED')))throw Error('Graduation toast overlaps Maria opening');
 await mobile.screenshot({path:path.join(base,'test414-mobile-play.png')});await mobile.tap('#maria414-return');
 if(await mobile.evaluate(()=>window.__game.maria414Inside))throw Error('Mobile exit failed');
 console.log('MOBILE: tutorial gate, graduation trigger, touch skip, return verified');
 fs.writeFileSync(path.join(base,'test414-result.json'),JSON.stringify({objectives:32,acts:10,reward:final.pls-initial.pls,campaignUnchanged:true,replayNoReward:true,keyboardMovement:true,reloadResume:true,interiorMinimap:true,mobile:true,errors},null,2));
 if(errors.length)throw Error(errors.join('; '));console.log('PASS');
})().catch(e=>{console.error(e.stack);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});

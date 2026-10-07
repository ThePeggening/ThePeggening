// Exercise the existing raid before the companion; never seed raid completion.
const puppeteer=require(process.env.MARIA414_PUPPETEER||'puppeteer');
const fs=require('fs'),path=require('path');let browser;
const root=path.resolve(__dirname,'..'),url=process.env.MARIA414_URL||'http://127.0.0.1:8415/index.html?classic';
async function click(page,label){await page.evaluate(t=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===t);if(!b)throw Error('Missing '+t);b.click()},label)}
async function raid(page,id,type,next){
 await page.evaluate(id=>{const g=window.__game,it=g.interactables.find(x=>x.id===id);if(!it)throw Error('Missing native interactable '+id);g.playerPos.copy(it.pos);g.player.position.copy(it.pos);g.playerVel.set(0,0,0);g._storyCutsceneFrozenPos=null;g.interact(it)},id);
 await page.waitForFunction(type=>window.__game.sommi414Cine?.type===type,{},type);
 await page.evaluate(()=>window.__game.sommi414FinishCine(true));
 await page.waitForFunction(step=>JSON.parse(localStorage.getItem('atropa_sommi_414_house_v1')).step===step,{},next);
 console.log('NATIVE',type,'step',next);
}
(async()=>{
 browser=await puppeteer.launch({headless:true,args:['--enable-unsafe-swiftshader']});const page=await browser.newPage();await page.setViewport({width:1440,height:900});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('atropa_skin_v1','sommi');localStorage.setItem('atropa_prestige_v1',JSON.stringify({seenIntro:true,trialDone:true,trialOutcome:'completed'}));localStorage.setItem('atropa_settings_v1',JSON.stringify({renderScale:.6,shadows:false,uiScale:1}))});
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.evaluate(async()=>{await window.__atropaStartMain();document.getElementById('atropa-site-front')?.remove();document.getElementById('atropa-site-splash')?.remove();document.documentElement.classList.remove('atropa-site-visible')});
 await click(page,'ENTER');await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(x=>x.textContent.trim()==='CONTINUE →'));await click(page,'CONTINUE →');await page.waitForFunction(()=>window.__game);await click(page,'ENTER THE CITY →');
 await new Promise(r=>setTimeout(r,1000));await page.evaluate(()=>document.querySelector('[aria-label="Exit chapter cutscene"]')?.click());
 if(await page.evaluate(()=>!!window.__game.sommiMirror414Inside))throw Error('Companion bypassed native raid');
 const initial=await page.evaluate(()=>window.__sommiMirror414Quest.snapshot());
 await raid(page,'sommi414-house-door','arrival',1);await raid(page,'sommi414-house-door','entry',2);await raid(page,'sommi414-breaker','reveal',3);await raid(page,'sommi414-rack','take',4);
 await page.evaluate(()=>{const g=window.__game,it=g.interactables.find(x=>x.id==='sommi414-exit');g.playerPos.copy(it.pos);g.player.position.copy(it.pos);g.interact(it)});
 await page.waitForFunction(()=>window.__game.sommi414Cine?.type==='escape');await page.evaluate(()=>window.__game.sommi414FinishCine(true));
 await page.waitForFunction(()=>window.__game.sommiMirror414Inside,{timeout:30000});
 const result=await page.evaluate(()=>({native:JSON.parse(localStorage.getItem('atropa_sommi_414_house_v1')),mirror:window.__sommiMirror414Quest.read(),frameBroke:!!window.__game.frameBroke,...window.__sommiMirror414Quest.snapshot()}));
 if(!result.native.complete||!result.native.rewarded||!result.mirror.started||result.mirror.step!==0||!result.mirror.rifles||result.mirror.rewarded||result.frameBroke)throw Error('Bad native transition '+JSON.stringify(result));
 if(result.mainQuestIndex!==initial.mainQuestIndex||JSON.stringify(result.mainQuests)!==JSON.stringify(initial.mainQuests))throw Error('Campaign changed');
 const nativeRaw=await page.evaluate(()=>localStorage.getItem('atropa_sommi_414_house_v1'));await page.evaluate(()=>window.__game.sommiMirror414Pause());
 if(await page.evaluate(()=>localStorage.getItem('atropa_sommi_414_house_v1'))!==nativeRaw)throw Error('Companion pause changed native raid save');
 if(errors.length)throw Error(errors.join('; '));fs.writeFileSync(path.join(root,'sommi414-native-transition.json'),JSON.stringify({nativeComplete:true,companionStarted:true,caseCarried:true,campaignUnchanged:true,nativeSavePreserved:true,errors},null,2));console.log('PASS: original raid → companion, case carried, campaign and native save preserved');
})().catch(e=>{console.error(e.stack);process.exitCode=1}).finally(async()=>{await browser?.close()});

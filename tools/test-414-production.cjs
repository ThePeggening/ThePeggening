const puppeteer=require(process.env.MARIA414_PUPPETEER || 'puppeteer');
const fs=require('fs'),path=require('path');
const url=process.env.MARIA414_URL || 'https://thepeggening.github.io/ThePeggening/?classic';
let browser;
const errors=[];
async function boot(mobile=false){
 const page=await browser.newPage();page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message)});
 await page.setViewport({width:1440,height:900});
 const seed=await page.evaluateOnNewDocument(isMobile=>{
  localStorage.clear();localStorage.setItem('atropa_skin_v1',isMobile?'sommi':'maria-414');if(isMobile)localStorage.setItem('atropa_sommi_414_house_v1',JSON.stringify({v:1,complete:true,step:4,inside:false,hasRifles:true,rewarded:true}));
  localStorage.setItem('atropa_prestige_v1',JSON.stringify({seenIntro:true,trialDone:true,trialOutcome:'completed'}));
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

(async()=>{
 browser=await puppeteer.launch({headless:true,args:['--enable-unsafe-swiftshader']});
 for(const mirror of [false,true]){
  const page=await boot(mirror),p=mirror?'sommiMirror414':'maria414';await page.waitForFunction(p=>window.__game?.[p+'Inside'],{timeout:60000},p);
  const report=await page.evaluate(({p,mirror})=>{const api=window['__'+p+'Quest'],g=window.__game;if(!g[p+'World'].rooms.get(0).root.getObjectByName('414-family-memory-cabinets'))throw Error('Missing 414 visual upgrade');if(api.revision!==(mirror?4:5))throw Error('Wrong production revision');const q=api.read();if(q.step!==0||q.puzzles.engine.turns.length!==3||q.puzzles.district.boards.length!==4)throw Error('Depth content missing');document.querySelector('#'+p+'-cine button').click();const it=g[p+'World'].nodeMeshes.get(0).it;g.playerPos.copy(it.pos);g.player.position.copy(g.playerPos);g._storyCutsceneFrozenPos=null;g.interact(it);[...document.querySelectorAll('#'+p+'-dialog button')].find(b=>b.textContent!=='CLOSE').click();if(api.read().step!==1)throw Error('First objective failed');g[p+'Pause']();if(g[p+'Inside']||g.frameBroke)throw Error('Production exit failed');return {route:p,revision:api.revision,started:true,firstObjectivePassed:true,paused:true,engineCircuits:q.puzzles.engine.turns.length,districtBoards:q.puzzles.district.boards.length}}, {p,mirror});
  console.log('LIVE_GAME_PASS',JSON.stringify(report));await page.close();
 }
 if(errors.length)throw Error(errors.join('; '));console.log('PASS deployed R6 boot and entry for both characters');
})().catch(e=>{console.error(e.stack);process.exitCode=1}).finally(async()=>{await browser?.close()});

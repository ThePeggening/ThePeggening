// Rendered review evidence, not a normal traversal or play-duration test.
const puppeteer=require(process.env.MARIA414_PUPPETEER||'puppeteer');
const fs=require('fs'),path=require('path');
const base=path.resolve(__dirname,'..');
const url=process.env.MARIA414_URL||'http://127.0.0.1:8415/index.html?classic';
let browser;
async function click(page,label){await page.evaluate(t=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===t);if(!b)throw Error('Missing '+t);b.click()},label)}
async function boot(mirror,step,mobile){
 const page=await browser.newPage();await page.setViewport(mobile?{width:390,height:844,isMobile:true,hasTouch:true}:{width:1440,height:900});
 await page.evaluateOnNewDocument(({m,step})=>{
  localStorage.clear();localStorage.setItem('atropa_skin_v1',m?'sommi':'maria-414');
  localStorage.setItem('atropa_prestige_v1',JSON.stringify({seenIntro:true,trialDone:true,trialOutcome:'completed'}));
  localStorage.setItem('atropa_settings_v1',JSON.stringify({renderScale:.8,shadows:false,uiScale:1}));
  localStorage.setItem(m?'atropa_sommi_414_same_night_v1':'atropa_maria_414_reclaimed_v1',JSON.stringify({v:1,started:true,complete:false,rewarded:false,step,seen:[0,1,2,3,4,5,6,7,8,9]}));
  if(m)localStorage.setItem('atropa_sommi_414_house_v1',JSON.stringify({v:1,complete:true,step:4,inside:false,hasRifles:true,rewarded:true}));
 },{m:mirror,step});
 page.on('pageerror',e=>console.error('PAGEERROR',e.message));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 await page.evaluate(async()=>{await window.__atropaStartMain();document.getElementById('atropa-site-front')?.remove();document.getElementById('atropa-site-splash')?.remove();document.documentElement.classList.remove('atropa-site-visible')});
 await click(page,'ENTER');await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='CONTINUE →'));await click(page,'CONTINUE →');await page.waitForFunction(()=>window.__game);await click(page,'ENTER THE CITY →');return page;
}
const errors=[];
(async()=>{
 browser=await puppeteer.launch({headless:true,args:['--enable-unsafe-swiftshader']});const report=[];
 for(const mirror of [false,true])for(const mobile of [false,true])for(const step of [8,17,29]){
  const page=await boot(mirror,step,mobile),p=mirror?'sommiMirror414':'maria414';page.on('pageerror',e=>errors.push(e.message));
  await page.evaluate(p=>window.__game[p+'Start'](),p);await page.evaluate(p=>document.querySelector('#'+p+'-cine button')?.click(),p);
  await page.evaluate(({p,step})=>{const g=window.__game,w=g[p+'World'],visit=it=>{g.playerPos.copy(it.pos);g.player.position.copy(g.playerPos);g._storyCutsceneFrozenPos=null;g.interact(it)};
   if(step===8){for(let n=0;n<4;n++){visit(w.depthMeshes.get('8:'+n).it);[...document.querySelectorAll('#'+p+'-dialog button')].find(b=>b.textContent==='RECORD CABLE EVIDENCE').click()}}
   visit(step===29?w.depthMeshes.get('29:0').it:w.nodeMeshes.get(step).it);
  },{p,step});
  const help=await page.evaluate(({p,step})=>{const api=window['__'+p+'Quest'],before=JSON.stringify(api.read().puzzles),label=step===8?'OPTIONAL HELP / REVEAL A ROUTE':step===17?'OPTIONAL HELP / NEXT CORRECT TILE':'OPTIONAL HELP / NEXT CORRECT MOVE',b=[...document.querySelectorAll('#'+p+'-dialog button')].find(b=>b.textContent===label);if(!b)throw Error('Missing optional help '+label);b.click();const feedback=document.querySelector('#'+p+'-feedback').textContent;if(!feedback)throw Error('Optional help gave no guidance');return {feedback,unchanged:before===JSON.stringify(api.read().puzzles)}},{p,step});
  if(!help.unchanged)throw Error('Optional help changed puzzle state '+p+' '+step);
  const rects=await page.evaluate(p=>{const card=document.querySelector('#'+p+'-dialog').children[0],r=card.getBoundingClientRect();return {card:{x:r.x,y:r.y,width:r.width,height:r.height},viewport:{width:innerWidth,height:innerHeight},cells:[...card.querySelectorAll('[data-depth-cell]')].map(b=>{const r=b.getBoundingClientRect();return {x:r.x,width:r.width,height:r.height}}),overflow:card.scrollHeight>card.clientHeight}},p);
  if(rects.card.x<0||rects.card.x+rects.card.width>rects.viewport.width+1||rects.card.y<0||rects.card.y+rects.card.height>rects.viewport.height+1)throw Error('Card outside viewport '+p+' '+step);
  if(rects.cells.some(r=>r.width<43.9||r.height<43.9||r.x<0||r.x+r.width>rects.viewport.width+1))throw Error('Grid cell sizing '+p+' '+step);
  await page.screenshot({path:path.join(base,`r5-${p}-${mobile?'mobile':'desktop'}-${step}.png`)});
  if(mobile&&step!==8){const selector='#'+p+'-dialog [data-depth-cell="0"]';const before=await page.evaluate(({p,step})=>JSON.stringify(window['__'+p+'Quest'].read().puzzles[step===29?'district':'engine']),{p,step});await page.tap(selector);const after=await page.evaluate(({p,step})=>JSON.stringify(window['__'+p+'Quest'].read().puzzles[step===29?'district':'engine']),{p,step});if(before===after)throw Error('Touch did not rotate/toggle');}
  const close=await page.$('#'+p+'-dialog > div > button:last-child');await close.evaluate(el=>el.scrollIntoView({block:'center'}));if(mobile)await close.tap();else await close.click();if(await page.evaluate(p=>!!window.__game[p+'Dialog'],p))throw Error('Close failed');
  report.push({route:p,step,mobile,...rects});console.log('DEPTH UI PASS',p,mobile?'portrait':'desktop',step);await page.close();
 }
 fs.writeFileSync(path.join(base,'r5-depth-browser-report.json'),JSON.stringify({report,errors},null,2));if(errors.length)throw Error(errors.join(';'));console.log('PASS all depth UI sizes and touch');
})().catch(e=>{console.error(e.stack);process.exitCode=1}).finally(async()=>{await browser?.close()});

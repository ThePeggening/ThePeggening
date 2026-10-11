#!/usr/bin/env node
'use strict';
// Continuous, isolated, visible-button regression of the player's entry path.
// No seeded storage, private runtime bridge, forced launcher, or removed overlay.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const arg=(key,fallback)=>{const i=process.argv.indexOf('--'+key);return i<0?fallback:process.argv[i+1];};
const puppeteer=require(arg('puppeteer',process.env.ATROPA_PUPPETEER_MODULE||'puppeteer'));
const input=arg('url');if(!input)throw new Error('--url is required');
const scenario=arg('scenario','grand');if(!['grand','other','existing'].includes(scenario))throw new Error('--scenario must be grand, other, or existing');
const output=path.resolve(arg('output','./inquisitor-entry-results'));fs.mkdirSync(output,{recursive:true});
const viewport={width:Number(arg('width',390)),height:Number(arg('height',844)),isMobile:true,hasTouch:true,deviceScaleFactor:1};
const timeout=180000,nap=ms=>new Promise(r=>setTimeout(r,ms));
const report={url:input,scenario,started:new Date().toISOString(),viewport,checks:[],navigation:[],errors:[]};
let browser,page;
function check(ok,name,data){report.checks.push({name,pass:!!ok,data});assert.ok(ok,name+(data?' '+JSON.stringify(data):''));}
async function until(fn,name,ms=timeout){const end=Date.now()+ms;let last;while(Date.now()<end){last=await fn();if(last)return last;await nap(120);}throw new Error(name+' timed out: '+JSON.stringify(last));}
async function visibleButton(label){for(const frame of page.frames())try{
 const handle=await frame.evaluateHandle(label=>[...document.querySelectorAll('button,a,[role=button]')].find(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return !el.disabled&&r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&[el.innerText?.trim(),el.getAttribute('aria-label'),el.title].includes(label);})||null,label);
 const element=handle.asElement();if(element)return{frame,element};await handle.dispose();
}catch(_){}return null;}
async function click(label){const match=await until(()=>visibleButton(label),'Visible button '+label);await match.element.click();await match.element.dispose();report.navigation.push({click:label,frame:match.frame.url(),url:page.url()});console.log('CLICK '+label+' '+page.url());}
async function selector(){for(const frame of page.frames())try{if(await frame.$('.atropa-char-dots'))return frame;}catch(_){}return null;}
async function shot(name){await page.screenshot({path:path.join(output,name+'.png'),fullPage:false});}
async function selectorMetrics(frame){return frame.evaluate(()=>{const box=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};};return{url:location.href,width:innerWidth,height:innerHeight,visualWidth:visualViewport?.width,scrollWidth:document.documentElement.scrollWidth,screenWidth:screen.width,dots:[...document.querySelectorAll('.atropa-char-dots button')].map(el=>({name:el.getAttribute('aria-label'),label:el.innerText,selected:el.getAttribute('aria-current'),...box(el)})),body:document.body.innerText.slice(0,250)};});}
async function previewMetrics(frame){return frame.evaluate(()=>{
 // Read the existing preview ref. No hook, renderer or game state is changed.
 const el=document.querySelector('.atropa-char-select');if(!el)return null;
 let fiber=el[Object.getOwnPropertyNames(el).find(key=>key.startsWith('__reactFiber$'))];
 while(fiber&&fiber.type?.name!=='CharacterSelect')fiber=fiber.return;
 for(let hook=fiber?.memoizedState;hook;hook=hook.next){const r=hook.memoizedState?.current;if(!r?.group||!r.renderer||!r.scene)continue;
  const rig=r.group.userData.externalRig;let meshes=0,skinned=0;rig?.model?.traverse(o=>{if(o.isMesh)meshes++;if(o.isSkinnedMesh)skinned++;});
  return{skin:r.group.userData.hostedLibertyPlayer,ready:!!rig?.ready,failed:!!rig?.failed,error:rig?.error,model:!!rig?.model,meshes,skinned,visible:r.group.visible,swap:r.swap,frame:r.renderer.info.render.frame};
 }return null;
});}
async function waitPreview(frame){const result=await until(async()=>{const r=await previewMetrics(frame);if(r?.failed)throw new Error('Character preview model failed: '+JSON.stringify(r));return r?.skin==='grand-inquisitor'&&r.ready&&r.model&&r.meshes>0&&r.visible&&r.swap<=0?r:false;},'Grand preview model fully mounted and visible',90000);await nap(1200);console.log('PREVIEW READY '+JSON.stringify(result));return result;}
async function renderedButtonMatching(pattern){for(const frame of page.frames())try{const text=await frame.evaluate(pattern=>[...document.querySelectorAll('button')].filter(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return !el.disabled&&r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';}).map(el=>el.innerText.trim()).find(text=>new RegExp(pattern,'i').test(text))||null,pattern);if(text)return text;}catch(_){}return null;}
async function routingChecks(){
 const base=new URL(input);base.pathname=base.pathname.replace(/(?:index\.html|Atropa-P50-Grand-Inquisitor-Update\.html)?$/,'');base.search='';base.hash='';
 report.routes=[];
 for(const filename of ['', 'index.html', 'Atropa-P50-Grand-Inquisitor-Update.html']){
  const context=await browser.createBrowserContext(),route=await context.newPage(),url=new URL(filename,base);
  url.search='?entry-check='+encodeURIComponent(filename||'root');url.hash='#entry-retained';
  await route.setRequestInterception(true);route.on('request',request=>(request.resourceType()==='document'?request.continue():request.abort()).catch(()=>{}));
  const navigations=[];route.on('framenavigated',frame=>{if(frame===route.mainFrame())navigations.push(frame.url());});
  await route.goto(url.href,{waitUntil:'domcontentloaded',timeout});
  await nap(1000);
  const final=new URL(route.url());check(final.href===url.href,'Native entry keeps its original path, query and hash',{from:url.href,to:final.href});
  const heading=await route.evaluate(()=>({title:document.title,headings:[...document.querySelectorAll('h1,h2,.eyebrow')].map(el=>el.innerText).join(' ')}));
  check(!/grand inquisitor|unwritten verdict/i.test(heading.title+' '+heading.headings),'Website loading and headings retain Atropa branding',heading);
  report.routes.push({from:url.href,to:final.href,navigations,heading});
  if(filename==='Atropa-P50-Grand-Inquisitor-Update.html'){
   // The compatibility wrapper is neutral; failed fetches return to the native site.
   const recovery=await until(async()=>{const handles=await route.$$('a[href]');for(const handle of handles){const match=await handle.evaluate(el=>el.innerText==='Open Atropa'&&el.getBoundingClientRect().width>0);if(match)return handle;await handle.dispose();}return null;},'Native Atropa recovery link',20000);
   await recovery.click();await recovery.dispose();
   await until(async()=>new URL(route.url()).pathname.endsWith('/index.html'),'Native recovery route',25000);await nap(1000);
   const bypass=new URL(route.url());check(bypass.pathname.endsWith('/index.html')&&navigations.length<5,'Error recovery opens native Atropa without a redirect loop',bypass.href);
   report.routes.push({recovery:bypass.href,navigations});
  }
  await context.close();
 }
}
async function homeCheck(name){
 await until(()=>visibleButton('PLAY NOW'),'Visible website launcher');
 const requested=new URL(input),actual=new URL(page.url());
 check(actual.href===requested.href,'Normal website opens at the requested URL',{requested:requested.href,actual:actual.href});
 report.sourceSha256=await page.evaluate(()=>document.getElementById('atropa-src')?.getAttribute('data-raw-sha256')||null);
 if(arg('expected-source-sha'))check(report.sourceSha256===arg('expected-source-sha'),'Launcher contains expected compiled source',report.sourceSha256);
 const headings=[];for(const frame of page.frames())try{headings.push(await frame.evaluate(()=>({url:location.href,title:document.title,headings:[...document.querySelectorAll('h1,h2,.eyebrow')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0;}).map(el=>el.innerText).join(' ')})));}catch(_){}
 check(headings.every(h=>!/grand inquisitor|unwritten verdict/i.test(h.title+' '+h.headings)),'Original Atropa homepage has no Inquisitor takeover',headings);
 await shot(name);console.log('HOMEPAGE '+JSON.stringify({url:page.url(),source:report.sourceSha256,headings}));
}
async function readGame(frame){return frame.evaluate(()=>{
 const g=window.__game;if(!g)return null;
 const r=g.inquisitorRuntime,w=g.inquisitorWorld,guide=w?.guide,rig=g.player?.userData.externalRig;
 const q=window.__grandInquisitorQuest?.serialize(g);
 return{inside:!!g.inquisitorInside,tut:!!g.tut,tutorialDecided:!!g._inquisitorTutorialDecided,skin:g.player?.userData.hostedLibertyPlayer,
  q,rigReady:!!rig?.ready,rigFailed:!!rig?.failed,cinematic:!!r?.presentation.cinematic,clip:r?.clip,
  activeClip:rig?.activeDance?.getClip?.()?.name||null,actionTime:rig?.activeDance?.time,actionDuration:rig?.activeDance?.getClip?.()?.duration,
  dance:rig?.danceMode||null,player:g.playerPos.toArray(),yaw:g.camYaw,frames:g.renderer?.info.render.frame||0,
  guide:guide?{active:guide.active,kind:guide.kind,target:guide.target.toArray(),worldTarget:guide.worldTarget.toArray(),from:guide.from.toArray(),distance:guide.distance,visible:guide.root.visible,count:guide.trail.count,color:guide.color,material:'#'+guide.trail.material.color.getHexString()}:null,
  targets:w&&q?w.rooms[q.stage].targets.map(t=>t.pos.toArray()):[],message:r?.message||'',hud:!!document.querySelector('.gip-root')};
});}
async function gameFrame(){for(const frame of page.frames())try{if(await frame.evaluate(()=>!!window.__game))return frame;}catch(_){}return null;}
async function enterWorld(){
 return until(async()=>{
  const classic=await renderedButtonMatching('CLASSIC.*The Peggening');if(classic){await click(classic);await nap(250);return false;}
  for(const label of ['CONTINUE →','CONTINUE','ENTER THE CITY →','ENTER THE CITY','BEGIN'])if(await visibleButton(label)){await click(label);await nap(250);return false;}
  const frame=await gameFrame();if(!frame)return false;const s=await readGame(frame);
  if(s.rigFailed)throw new Error('Player model failed '+JSON.stringify(s));
  return s.tut||s.inside||s.tutorialDecided?frame:false;
 },'Visible mode, load and world entry');
}
async function skipOnboarding(frame){
 const before=await readGame(frame);if(!before.tut)return false;
 await shot('entry-04-onboarding');const label=await until(()=>renderedButtonMatching('skip'),'Visible onboarding skip');await click(label);return true;
}
async function importVeteran(){
 const fixturePath=arg('fixture');if(!fixturePath)throw new Error('--fixture is required for existing-save scenario');
 const fixture=JSON.parse(fs.readFileSync(fixturePath,'utf8'));
 const pack=fixture.magic?fixture:{magic:'ATROPA_SAVE_TRANSFER_V1',version:1,exportedAt:Date.now(),modeKey:'atropa_classic_save_v1',keys:fixture.keys};
 const save=JSON.parse(pack.keys.atropa_classic_save_v1);report.veteranBefore={chapter:save.quests.campaign.chapter,main:save.quests.mainQuestIndex,pls:save.econ.pls};
 check(report.veteranBefore.chapter===5&&report.veteranBefore.main>3&&!save.quests.grandInquisitor?.started,'Imported fixture is an established campaign with no Grand introduction',report.veteranBefore);
 const file=path.join(output,'native-veteran-import.json');fs.writeFileSync(file,JSON.stringify(pack));
 await click('ENTER');await until(()=>visibleButton('IMPORT BACKUP'),'Native import button');
 const chooserPromise=page.waitForFileChooser();await click('IMPORT BACKUP');const chooser=await chooserPromise;
 const navigation=page.waitForNavigation({waitUntil:'domcontentloaded',timeout});await chooser.accept([file]);await navigation;
 await homeCheck('entry-01b-website-after-import');await click('PLAY NOW');return until(selector,'Selector after native save import');
}
async function playableChecks(frame){
 const intro=await readGame(frame);check(intro.guide&&!intro.guide.active&&!intro.guide.visible&&intro.guide.count===0,'Red guide is hidden throughout the introduction',intro.guide);
 await click('Skip current cinematic');
 const initial=await until(async()=>{const s=await readGame(frame);return s.inside&&!s.cinematic&&s.guide?.active&&s.guide.count>0?s:false;},'Playable red guide appears');
 const target=initial.guide.worldTarget,index=initial.targets.findIndex(p=>Math.hypot(p[0]-target[0],p[2]-target[2])<.01);
 check(initial.guide.color==='#ff3434'&&initial.guide.material==='#ff3434'&&initial.guide.visible&&index>=0&&!initial.q.seals[index],'Red floor arrows and beacon lead to an unfinished actual seal',initial.guide);
 report.guideInitial=initial.guide;await shot('entry-06-red-guide');
 // Drag the visible mobile joystick. Reading camera yaw only translates the
 // desired screen drag; all displacement comes from the native movement loop.
 const joy=await frame.$('.gip-joystick'),box=await joy.boundingBox();await joy.dispose();check(box&&box.width>=44,'Visible joystick accepts the real approach');
 const cdp=await page.createCDPSession(),cx=box.x+box.width/2,cy=box.y+box.height/2;
 const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:7,radiusX:2,radiusY:2,force:1}]});
 await touch('touchStart',cx,cy);let approached;
 try{approached=await until(async()=>{
  const s=await readGame(frame),dx=target[0]-s.player[0],dz=target[2]-s.player[2],distance=Math.hypot(dx,dz);
  if(distance<=10)return s;const cosine=Math.cos(s.yaw),sine=Math.sin(s.yaw);
  await touch('touchMove',cx+(dx*cosine-dz*sine)/distance*42,cy+(dx*sine+dz*cosine)/distance*42);return false;
 },'Native joystick follows the red guide into attack range',35000);}finally{await touch('touchEnd');await cdp.detach();}
 check(Math.hypot(approached.player[0]-initial.player[0],approached.player[2]-initial.player[2])>10,'Actual mobile movement reaches the first seal',approached.player);
 const attack=await frame.$('.gip-attack');await attack.tap();await attack.dispose();const strike=await readGame(frame);
 check(strike.activeClip==='Sweeping_Kick'&&strike.dance,'First trusted attack performs the authored sweeping kick',strike);report.firstStrike=strike;
 await until(async()=>{const s=await readGame(frame);return s.activeClip==='Sweeping_Kick'&&s.actionTime>=1.1?s:false;},'Sweeping kick reaches its visible contact pose',6000);await shot('entry-07-first-strike');
 const hit=await until(async()=>{const s=await readGame(frame);return s.q.seals[index]?s:false;},'First native strike breaks the targeted seal',10000);
 check(hit.q.seals[index]&&hit.guide.active&&Math.hypot(hit.guide.worldTarget[0]-target[0],hit.guide.worldTarget[2]-target[2])>1,'Real hit retargets the red guide to the next unfinished seal',hit);
 report.guideAfterHit=hit.guide;await shot('entry-08-guide-retargeted');
 const retained=await frame.evaluateHandle(()=>window.__game.inquisitorWorld.guide);await click('Pause quest or return');
 const city=await until(async()=>{const s=await readGame(frame);return !s.inside&&!s.guide&&!s.hud?s:false;},'Pause restores ordinary city');
 const disposed=await retained.evaluate(guide=>({active:guide.active,visible:guide.root.visible,count:guide.trail.count}));await retained.dispose();
 check(!disposed.active&&!disposed.visible&&disposed.count===0,'Leaving the quest removes its red guide',disposed);check(city.q.seals[index],'First seal checkpoint persists after return to the city');await shot('entry-09-return-city');
}
(async()=>{
 browser=await puppeteer.launch({headless:true,defaultViewport:viewport,args:['--enable-unsafe-swiftshader','--disable-dev-shm-usage','--window-size='+viewport.width+','+viewport.height]});
 const context=await browser.createBrowserContext();page=await context.newPage();await page.setViewport(viewport);page.setDefaultTimeout(timeout);
 page.on('framenavigated',frame=>report.navigation.push({navigated:frame.url(),main:frame===page.mainFrame()}));page.on('pageerror',error=>report.errors.push(error.message));page.on('requestfinished',request=>{if(request.url().includes('/assets/models/crimson-wraith.glb'))report.characterAssetLoaded=request.url();});
 await page.goto(input,{waitUntil:'domcontentloaded',timeout});
 await homeCheck('entry-01-website');await click('PLAY NOW');
 let frame=await until(selector,'Actual character selector');
 if(scenario==='existing')frame=await importVeteran();
 // Browser fullscreen can resize a headless window; keep the requested device
 // viewport constant without changing the page or its gameplay state.
 await page.setViewport(viewport);await nap(1200);
 report.selector=await selectorMetrics(frame);console.log('SELECTOR '+JSON.stringify(report.selector));await shot('entry-02-selector');
 check(report.selector.dots.length===12,'Twelve characters are present in the real selector');
 const grand=report.selector.dots.find(d=>d.name==='Grand Inquisitor Cicero');check(!!grand,'Grand Inquisitor is a visible selector choice',grand);
 check(report.selector.width===viewport.width&&report.selector.height===viewport.height,'Requested mobile viewport remains exact',report.selector);
 check(report.selector.dots.every(d=>d.x>=-1&&d.x+d.w<=viewport.width+1),'All twelve body choices fit the mobile viewport',report.selector.dots);
 check(report.selector.dots.every(d=>d.w>=44&&d.h>=44),'All twelve body choices have 44px touch targets',report.selector.dots);
 check(grand.label==='XII','Grand uses the XII numeral',grand);
 if(scenario==='other'){
  const acolyte=report.selector.dots.find(d=>/acolyte/i.test(d.name));check(!!acolyte,'Ordinary Acolyte remains selectable');await click(acolyte.name);await click('ENTER');
  frame=await enterWorld();check(await skipOnboarding(frame),'Ordinary character receives the normal onboarding');
  const ready=await until(async()=>{const s=await readGame(frame);return !s.tut&&s.tutorialDecided?s:false;},'Ordinary city after onboarding');
  const after=await until(async()=>{const s=await readGame(frame);return s.frames>ready.frames+100?s:false;},'Ordinary city continues rendering',20000);
  check(!after.inside&&!after.q?.started&&!after.guide&&!after.hud,'Another character starts no Grand intro, quest, guide or HUD',after);
  await shot('entry-other-normal-city');report.other=after;report.finalURL=page.url();check(!report.errors.length,'No page errors',report.errors);report.status='PASS';console.log('PASS '+JSON.stringify({scenario,checks:report.checks.length,url:page.url(),output}));return;
 }
 await click('Maria 414');await until(async()=>(await selectorMetrics(frame)).dots.find(d=>d.name==='Maria 414')?.selected==='true','Maria selected');
 await click('next body');await until(async()=>(await selectorMetrics(frame)).dots.find(d=>d.name==='Grand Inquisitor Cicero')?.selected==='true','Visible next-body selects Grand');
 report.previewPortrait=await waitPreview(frame);report.selected=await selectorMetrics(frame);await shot('entry-03-grand-selected');console.log('GRAND SELECTED '+JSON.stringify({url:page.url(),body:report.selected.body}));
 check(report.selected.dots.find(d=>d.name==='Grand Inquisitor Cicero').selected==='true','Maria next-body leads to Grand');
 await page.setViewport({...viewport,width:915,height:412});await nap(800);
 report.landscape=await selectorMetrics(frame);console.log('LANDSCAPE '+JSON.stringify(report.landscape));
 check(report.landscape.width===915&&report.landscape.height===412&&report.landscape.dots.every(d=>d.x>=-1&&d.x+d.w<=916&&d.y>=-1&&d.y+d.h<=413&&d.w>=44&&d.h>=44),'Landscape shows all twelve usable body choices',report.landscape);
 await click('Maria 414');await until(async()=>(await selectorMetrics(frame)).dots.find(d=>d.name==='Maria 414')?.selected==='true','Landscape Maria selected');
 await click('next body');await until(async()=>(await selectorMetrics(frame)).dots.find(d=>d.name==='Grand Inquisitor Cicero')?.selected==='true','Landscape next-body selects Grand');
 report.previewLandscape=await waitPreview(frame);await shot('entry-03b-grand-landscape');await page.setViewport(viewport);await nap(800);
 await click('ENTER');
 frame=await enterWorld();
 if(scenario==='grand')check(await skipOnboarding(frame),'Fresh Grand receives normal onboarding before its exclusive introduction');
 else check(!(await readGame(frame)).tut,'Imported veteran bypasses fresh onboarding');
 const state=await until(async()=>{const s=await readGame(frame);if(s.rigFailed)throw new Error('Grand rig failed');return s.inside&&s.rigReady&&s.cinematic?s:false;},'Exclusive introduction starts through native entry');
 check(state.q?.started&&state.q.stage===0&&state.clip===0,'Grand introduction starts through complete visible entry path',state);
 await shot('entry-05-grand-intro');report.intro=state;report.finalURL=page.url();
 if(scenario==='existing'){
  const after=await frame.evaluate(()=>{const save=JSON.parse(localStorage.getItem('atropa_classic_save_v1'));return{chapter:save.quests.campaign.chapter,main:save.quests.mainQuestIndex,pls:save.econ.pls,grand:save.quests.grandInquisitor};});
  check(after.chapter===report.veteranBefore.chapter&&after.main===report.veteranBefore.main&&after.pls===report.veteranBefore.pls,'Native import and Grand auto-intro preserve advanced campaign progress',after);report.veteranAfter=after;
 }else{await playableChecks(frame);if(!process.argv.includes('--skip-route-checks'))await routingChecks();}
 check(!report.errors.length,'No page errors',report.errors);report.status='PASS';console.log('PASS '+JSON.stringify({scenario,checks:report.checks.length,url:page.url(),output}));
})().catch(async error=>{report.status='FAIL';report.error=String(error.stack||error);console.error(report.error);try{await shot('entry-failure');}catch(_){}process.exitCode=1;}).finally(async()=>{report.finished=new Date().toISOString();fs.writeFileSync(path.join(output,'grand-inquisitor-entry-results.json'),JSON.stringify(report,null,2));if(browser)await browser.close();});

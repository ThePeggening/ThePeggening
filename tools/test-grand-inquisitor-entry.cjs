#!/usr/bin/env node
'use strict';
// Continuous, isolated, visible-button regression of the player's entry path.
// No seeded storage, private runtime bridge, forced launcher, or removed overlay.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const arg=(key,fallback)=>{const i=process.argv.indexOf('--'+key);return i<0?fallback:process.argv[i+1];};
const puppeteer=require(arg('puppeteer',process.env.ATROPA_PUPPETEER_MODULE||'puppeteer'));
const input=arg('url');if(!input)throw new Error('--url is required');
const output=path.resolve(arg('output','./inquisitor-entry-results'));fs.mkdirSync(output,{recursive:true});
const viewport={width:Number(arg('width',390)),height:Number(arg('height',844)),isMobile:true,hasTouch:true,deviceScaleFactor:1};
const timeout=180000,nap=ms=>new Promise(r=>setTimeout(r,ms));
const report={url:input,started:new Date().toISOString(),viewport,checks:[],navigation:[],errors:[]};
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
  await until(async()=>new URL(route.url()).pathname.endsWith('/Atropa-P50-Grand-Inquisitor-Update.html'),'Root/index/direct update routing',25000);
  const final=new URL(route.url());check([...url.searchParams].every(([key,value])=>final.searchParams.get(key)===value)&&final.hash===url.hash,'Entry route retains query and hash',{from:url.href,to:final.href});
  report.routes.push({from:url.href,to:final.href,navigations});
  if(filename==='Atropa-P50-Grand-Inquisitor-Update.html'){
   // Blocked story fetch exercises the actual visible error-recovery link.
   const recovery=await until(async()=>{const handles=await route.$$('a[href]');for(const handle of handles){const href=await handle.evaluate(el=>el.href);if(new URL(href).searchParams.get('atropa-base')==='1')return handle;await handle.dispose();}return null;},'Previous-version recovery link',20000);
   await recovery.click();await recovery.dispose();
   await until(async()=>new URL(route.url()).searchParams.get('atropa-base')==='1','Previous-version bypass route',25000);await nap(1200);
   const bypass=new URL(route.url());check(bypass.pathname.endsWith('/index.html')&&bypass.searchParams.get('atropa-base')==='1','Error recovery opens previous version without redirect loop',bypass.href);
   report.routes.push({recovery:bypass.href,navigations});
  }
  await context.close();
 }
}
(async()=>{
 browser=await puppeteer.launch({headless:true,defaultViewport:viewport,args:['--enable-unsafe-swiftshader','--disable-dev-shm-usage','--window-size='+viewport.width+','+viewport.height]});
 const context=await browser.createBrowserContext();page=await context.newPage();await page.setViewport(viewport);page.setDefaultTimeout(timeout);
 page.on('framenavigated',frame=>report.navigation.push({navigated:frame.url(),main:frame===page.mainFrame()}));page.on('pageerror',error=>report.errors.push(error.message));page.on('requestfinished',request=>{if(request.url().includes('/assets/models/crimson-wraith.glb'))report.characterAssetLoaded=request.url();});
 await page.goto(input,{waitUntil:'domcontentloaded',timeout});
 await until(()=>visibleButton('PLAY NOW'),'Visible website launcher');
 report.sourceSha256=await page.evaluate(()=>document.getElementById('atropa-src')?.getAttribute('data-raw-sha256')||null);
 if(arg('expected-source-sha'))check(report.sourceSha256===arg('expected-source-sha'),'Launcher contains expected compiled source',report.sourceSha256);
 await shot('entry-01-website');await click('PLAY NOW');
 const frame=await until(selector,'Actual character selector');
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
 await until(async()=>{
  const classic=await renderedButtonMatching('CLASSIC.*The Peggening');if(classic){await click(classic);await nap(250);return false;}
  for(const label of ['CONTINUE →','CONTINUE','ENTER THE CITY →','ENTER THE CITY','BEGIN'])if(await visibleButton(label)){await click(label);await nap(250);return false;}
  for(const f of page.frames())try{if(await f.evaluate(()=>!!window.__game?.tut))return f;}catch(_){}
  return false;
 },'Visible world entry and fresh onboarding');
 await shot('entry-04-onboarding');
 // Select the real tutorial skip control by its rendered label.
 let skipLabel=await until(async()=>{for(const f of page.frames())try{const s=await f.evaluate(()=>[...document.querySelectorAll('button')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&!el.disabled;}).map(el=>el.innerText.trim()).find(text=>/skip/i.test(text)));if(s)return s;}catch(_){}return false;},'Visible onboarding skip');
 await click(skipLabel);
 const state=await until(async()=>{for(const f of page.frames())try{const s=await f.evaluate(()=>{const g=window.__game;if(!g?.inquisitorInside)return null;return{inside:true,rigReady:!!g.player?.userData?.externalRig?.ready,skin:g.player?.userData?.hostedLibertyPlayer,q:window.__grandInquisitorQuest?.serialize(g),cinematic:!!g.inquisitorRuntime?.presentation.cinematic,clip:g.inquisitorRuntime?.clip};});if(s?.rigReady&&s.cinematic)return s;}catch(_){}return false;},'Exclusive intro starts after visible onboarding skip');
 check(state.q?.started&&state.q.stage===0&&state.clip===0,'Fresh Grand introduction starts through complete visible entry path',state);
 await shot('entry-05-grand-intro');report.intro=state;report.finalURL=page.url();check(!report.errors.length,'No page errors',report.errors);
 await routingChecks();
 report.status='PASS';console.log('PASS '+JSON.stringify({checks:report.checks.length,url:page.url(),output}));
})().catch(async error=>{report.status='FAIL';report.error=String(error.stack||error);console.error(report.error);try{await shot('entry-failure');}catch(_){}process.exitCode=1;}).finally(async()=>{report.finished=new Date().toISOString();fs.writeFileSync(path.join(output,'grand-inquisitor-entry-results.json'),JSON.stringify(report,null,2));if(browser)await browser.close();});

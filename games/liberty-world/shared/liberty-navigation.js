import {stageFor} from './liberty-stages.js?v=s1';
const base=new URL('../',import.meta.url);
export function resolveLibertyContext(current,initial,embedded){
 if(!embedded)return null;
 for(const value of [initial,current]){try{const u=new URL(value,base),from=u.searchParams.get('from');if(u.origin!==base.origin||!u.pathname.startsWith(base.pathname)||!['atropa','website'].includes(from))continue;return {from,stage:from==='atropa'?stageFor(u.searchParams.get('stage')).id:null};}catch{}}
 return null;
}
export function libertyContext(){
 try{if(parent===window||parent.location.origin!==location.origin)return null;const f=window.frameElement;const stored=f?.dataset.lwFrom;if(['atropa','website'].includes(stored))return {from:stored,stage:stored==='atropa'?stageFor(f.dataset.lwStage).id:null};
  const ctx=resolveLibertyContext(location.href,f?.getAttribute('src')?new URL(f.getAttribute('src'),parent.location.href).href:null,true);if(ctx&&f){f.dataset.lwFrom=ctx.from;if(ctx.stage)f.dataset.lwStage=ctx.stage;}return ctx;
 }catch{return null;}
}
export function libertyUrl(path){
 const u=new URL(path,location.href);if(u.origin!==base.origin||!u.pathname.startsWith(base.pathname))return u.href;
 if(u.pathname===base.pathname+'index.html'&&location.pathname.startsWith(base.pathname+'games/')&&(!u.searchParams.has('return')||u.searchParams.get('return')==='hub'))u.searchParams.set('return','arcade');
 const ctx=libertyContext();if(ctx){u.searchParams.set('from',ctx.from);if(ctx.stage)u.searchParams.set('stage',ctx.stage);else u.searchParams.delete('stage');}else{u.searchParams.delete('from');u.searchParams.delete('stage');}
 // Fun mode stays fun through mini-game detours, but never makes the Valley a fake save slot.
 if(u.pathname.startsWith(base.pathname+'games/')&&new URLSearchParams(location.search).get('fun')==='1'&&!u.searchParams.has('fun'))u.searchParams.set('fun','1');
 return u.href;
}
export const navigateLiberty=path=>location.assign(libertyUrl(path));
export function installLibertyNavigation(root,{beforeLeave=()=>{}}={}){
 const ctx=libertyContext();let disposed=false;const beforeExit=()=>beforeLeave();window.__LIBERTY_NAV_BEFORE_EXIT=beforeExit;
 // Upgrade a cached older Atropa shell too; no session-wide context leaks to standalone tabs.
 if(ctx){try{if(!parent.__LIBERTY_HOST_S1&&!parent.document.getElementById('liberty-host-bootstrap-s1')){const script=parent.document.createElement('script');script.id='liberty-host-bootstrap-s1';script.type='module';script.src=new URL('./liberty-host.js?v=s1',import.meta.url).href;parent.document.head.append(script);}}catch{}}
 function anchors(node){if(!(node instanceof Element))return;const list=node.matches('a[href]')?[node]:[];list.push(...node.querySelectorAll('a[href]'));for(const a of list){if(a.download||a.target==='_blank')continue;const raw=a.getAttribute('href');if(!raw||raw.startsWith('#'))continue;try{const u=new URL(raw,location.href);if(u.origin===base.origin&&u.pathname.startsWith(base.pathname)&&u.pathname.endsWith('.html')){const next=libertyUrl(raw);if(a.href!==next)a.href=next;}}catch{}}}
 function click(e){const a=e.target.closest?.('a[href]');if(!a||a.download||a.target==='_blank'||e.defaultPrevented)return;try{const u=new URL(a.href);if(u.origin===base.origin&&u.pathname.startsWith(base.pathname)&&u.pathname.endsWith('.html')){a.href=libertyUrl(a.href);beforeLeave();}}catch{}}
 anchors(root);const observer=new MutationObserver(records=>{for(const r of records)if(r.type==='attributes')anchors(r.target);else for(const n of r.addedNodes)anchors(n);});observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});root.addEventListener('click',click,true);
 if(ctx)parent.postMessage({type:'LIBERTY_NAV_READY',from:ctx.from,stage:ctx.stage,page:location.pathname.split('/').pop()},location.origin);
 return {context:ctx,dispose(){if(disposed)return;disposed=true;observer.disconnect();root.removeEventListener('click',click,true);if(window.__LIBERTY_NAV_BEFORE_EXIT===beforeExit)delete window.__LIBERTY_NAV_BEFORE_EXIT;}};
}

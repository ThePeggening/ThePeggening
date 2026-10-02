import {stageFor,stageEarned,stageBrief} from './liberty-stages.js?v=s1';
import {libertyContext} from './liberty-navigation.js?v=s1';
export function createAtropaBridge(root,getState,{story=null}={}){
 const ctx=libertyContext();if(!ctx)return {update(){},dispose(){},info:()=>null};
 const meta=stageFor(ctx.stage),fromAtropa=ctx.from==='atropa';let disposed=false,sentComplete=false,pendingDebrief=false,wasDone=stageEarned(getState?.(),meta),banner=null,bannerParent=null,lastBrief='';
 const send=(type,extra={})=>{if(!disposed)parent.postMessage({type,stage:meta.id,...extra},location.origin);};
 function returnHome(){try{story?.savePosition();}catch{}if(fromAtropa){send('ATROPA_LIBERTY_RETURN');return;}try{const b=parent.document.getElementById('atropa-arcade-back');if(b)b.click();}catch{}}
 const back=document.createElement('button');back.type='button';back.id=fromAtropa?'atropa-liberty-return':'liberty-website-return';back.className='v-context-back';back.textContent='‹ RETURN TO ATROPA';back.setAttribute('aria-label',fromAtropa?'Return to Atropa main game':'Return to Atropa website');back.onclick=returnHome;root.append(back);
 const assignment=document.createElement('button');assignment.type='button';assignment.className='pc-button v-assignment-button';assignment.textContent='Atropa assignment';assignment.onclick=show;
 function append(p,tag,cls,text){const e=document.createElement(tag);e.className=cls;e.textContent=text;p.append(e);return e;}
 function show(){
  if(!story||!fromAtropa)return;const v=stageBrief(getState(),meta),p=story.panel('Atropa assignment');p.classList.add('v-assignment');p.dataset.choiceMenu='true';
  append(p,'small','v-eyebrow',v.heading);append(p,'h3','',`${meta.place} · ${meta.theme}`);append(p,'p','v-dialogue',v.task);append(p,'p','',`Your saved Liberty progress: ${v.current}.`);append(p,'p','v-guide-note',v.explanation);
  append(p,'p','v-small','Runner, Ghost Route and Liberty Crossing are optional detours. Their scores do not replace story feathers. You can return to Atropa at any time; your actual Liberty progress is kept.');
  const follow=append(p,'button','pc-button pc-primary',v.done?'Keep exploring Liberty World':v.catchUp?'Follow the earlier chapters':'Follow this story chapter');follow.type='button';follow.onclick=()=>{story.journey.main();if(!story.running)story.start();};
  const leave=append(p,'button','pc-button',v.done?'Return to Atropa · assignment complete':'Return to Atropa · continue later');leave.type='button';leave.onclick=returnHome;
 }
 function refreshBrief(){
  if(!story||!fromAtropa)return;const toolbar=root.querySelector('.v-toolbar');if(toolbar&&!assignment.isConnected)toolbar.append(assignment);
  const title=root.querySelector('.v-title');if(title!==bannerParent){banner?.remove();banner=null;bannerParent=title;lastBrief='';}
  if(!title)return;const v=stageBrief(getState(),meta),text=`${v.heading}\n${meta.place} · ${meta.theme}\nCurrent adventure: ${v.current}. ${v.done?'Your milestone is already recorded.':v.catchUp?'Finish the earlier chapters first; your assignment will wait.':meta.task}`;
  if(!banner){banner=document.createElement('button');banner.type='button';banner.className='v-crossover-banner';banner.onclick=show;const play=title.querySelector('.pc-primary');title.insertBefore(banner,play||title.lastElementChild);}if(text!==lastBrief){banner.textContent=text;lastBrief=text;}
 }
 function update(){
  if(disposed)return;back.hidden=window.frameElement?.dataset.lwManaged==='s1';refreshBrief();if(!fromAtropa)return;
  const done=stageEarned(getState?.(),meta),cinematic=!!story?.cinematic;if(done&&!wasDone)pendingDebrief=true;wasDone=done;
  if(done&&!cinematic&&!sentComplete){sentComplete=true;back.textContent=`✓ STAGE ${meta.n} COMPLETE · RETURN TO ATROPA`;assignment.textContent='✓ Atropa assignment';send('ATROPA_LIBERTY_STAGE_COMPLETE',{milestone:meta.milestone});}
  // Invite return only after the closing beat and any field-guide card, not during the scene.
  if(pendingDebrief&&done&&story?.running&&!story.modal&&!cinematic){pendingDebrief=false;show();}
 }
 if(fromAtropa)send('ATROPA_LIBERTY_READY',{milestone:meta.milestone,completed:wasDone&&!story?.cinematic,label:meta.place+' · '+meta.theme});update();
 return {update,show,info:()=>fromAtropa?{stage:meta.id,...stageBrief(getState?.(),meta)}:{from:'website'},dispose(){disposed=true;back.remove();assignment.remove();banner?.remove();}};
}

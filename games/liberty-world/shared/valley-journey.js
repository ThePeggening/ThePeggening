import {neighborTaskObjective} from './valley-community-model.js?v=s2';
import {arcadeBest} from './liberty-arcade.js?v=s1';
import {element,button} from './hud-kit.js';
import {markNext} from './valley-guide.js';
import {sideQuests} from './valley-data.js?v=s1';
import {content} from './valley-content.js';
import {secrets} from './valley-extras.js';

export function createJourney({reach,club,harbor,skills,adventure,state,save,world,mover,panel,close,notify,mainObjective,followSide,followSecret,clearTargets,extras,onPhoto,onSprint,communityEnabled=false}){
 const groups=[['story','Main story'],['reach','Lantern Reach · new district'],['expeditions','Frontier expeditions'],['neighbors','Neighbor missions'],['skills','Skills & supply quests'],['discoveries','Easter eggs & lore'],['hunt','Hunt feathers'],['shrines','Feather Shrines'],['academy','Academy lessons'],['wardrobe','Tail wardrobe'],['extras','Sprint, signals & photos'],['trails','Trail Club & camp'],['harbor','Harbor Days · play again'],['games','Optional game gates']];
 state.guideCategory||='story';
 const distance=e=>Math.hypot((e.x??mover.player.position.x)-mover.player.position.x,(e.z??mover.player.position.z)-mover.player.position.z);
 function entries(group){
  if(group==='reach')return reach.entries();if(group==='trails')return club.entries();if(group==='harbor')return harbor.entries();
  if(group==='skills')return skills.entries();
  if(group==='story'){const o=mainObjective();return[{id:'story',title:state.finaleComplete?'Seven feathers · story complete':o.label,done:!!state.finaleComplete,...o}];}
  if(group==='expeditions')return adventure.entries();
  if(group==='neighbors')return sideQuests.map(q=>{const s=state.side[q.id],n=world.npcs.find(n=>n.name===q.giver),atGiver=!s||s.stage;const task=communityEnabled?neighborTaskObjective(state,q):null;if(task)return {...q,...task,done:false};return {...q,x:atGiver?(n?.x??q.x):q.tx,z:atGiver?(n?.z??q.z):q.tz,done:!!s?.done,kind:s?'side':'side-start',label:!s?'Talk to '+q.giver+' · '+q.title:s.stage?'Return to '+q.giver+' · '+q.title:q.description};});
  if(group==='discoveries')return secrets.map(s=>({...s,done:state.secrets.includes(s.id),locked:s.id==='seven-colors'&&state.feathers.length<7,label:'Discover · '+s.title,kind:'secret'}));
  if(group==='hunt')return world.collectibles.map((f,i)=>({...f,title:'Hunt feather '+String(i+1).padStart(3,'0'),label:'Collect hunt feather '+String(i+1).padStart(3,'0')+' · walk through it',done:state.hunt.includes(f.id),kind:'hunt'}));
  if(group==='shrines')return world.shrines.map(s=>({id:s.id,x:s.x,z:s.z,title:s.name,label:'Discover '+s.name+' shrine · walk into the yellow ring',done:state.visited.includes(s.id),kind:'shrine-guide'}));
  if(group==='academy')return content.LESSONS.map(l=>({...l,title:l.title,done:state.academy.includes(l.id),kind:'guide-menu',label:'Open Guide · '+l.title}));
  if(group==='wardrobe')return content.COSMETICS.map(c=>({...c,title:c.name,done:save.state.profile.unlocks.includes(c.id)||(c.id==='torchbearer'&&state.feathers.length===7&&Object.values(state.side).filter(q=>q.done).length===12)||(c.unlock.type==='points'&&save.state.profile.xp>=c.unlock.value),kind:'guide-menu',label:'Open Guide · unlock '+c.name}));
  if(group==='extras')return[{id:'sprint',title:'Pulse Line Sprint',done:!!state.sprintComplete,kind:'guide-menu'},{id:'signals',title:'Read the Signal Tower',done:!!state.signalsRead,kind:'guide-menu'},{id:'photo',title:'Take a Valley photo',done:!!state.photoTaken,kind:'guide-menu'}];
  return world.gates.map(g=>({...g,title:g.name,done:arcadeBest(g.id,save)>0,kind:'game-guide',label:'Visit '+g.name+' · optional'}));
 }
 function next(group){return entries(group).filter(e=>!e.done&&!e.locked).sort((a,b)=>distance(a)-distance(b))[0];}
 function recommend(){if(!state.finaleComplete)return {group:'story',entry:entries('story')[0]};for(const [group]of groups.slice(1,-1)){const entry=next(group);if(entry)return {group,entry};}return null;}
 function select(group,id){clearTargets();state.guideCategory=group;state.guideFocus=id;save.write();const e=entries(group).find(e=>e.id===id)||next(group);if(!e){show();return;}if(e.locked){notify('Finish the required earlier stories first. The guide will bring you back.');select('story','story');return;}if(group==='reach'){reach.show();return;}if(group==='trails'){club.show();return;}if(group==='harbor'){harbor.show();return;}if(group==='expeditions'){adventure.select(e.id);return;}if(group==='neighbors')followSide(e.id);if(group==='discoveries')followSecret(e);if(group==='academy'){extras.lesson(content.LESSONS.find(l=>l.id===e.id));return;}if(group==='wardrobe'){extras.wardrobe();return;}if(group==='extras'){if(id==='signals')extras.signals();else if(id==='sprint')onSprint();else{close();onPhoto();}return;}close();notify('GUIDE · '+(e.label||e.title));}
 function show(group=null){const p=panel(group?groups.find(g=>g[0]===group)[1]:'Adventure Guide');p.append(element('p','v-guide-intro','Yellow rings show what to click. Follow the gold trail to the next destination. Every activity below keeps its progress.'));
  const recommendation=recommend();let suggested;
  if(!group){if(recommendation){suggested=button('Continue guided adventure',()=>select(recommendation.group,recommendation.entry.id),'pc-button pc-primary');p.append(suggested,element('p','v-small','Recommended next: '+(recommendation.entry.label||recommendation.entry.title)));}for(const [key,title]of groups){const all=entries(key),done=all.filter(e=>e.done).length;p.append(button(title+' · '+done+' / '+all.length,()=>show(key),'pc-button v-guide-row'));}p.append(button('Back to adventure',close,'pc-button'));}
  else{const all=entries(group),remaining=all.filter(e=>!e.done).length;p.append(element('p','',remaining?'Choose any entry. Its destination and next action will stay on screen.':'This collection is complete. You can still revisit it.'));const recommended=next(group);for(const e of all){const label=e.title+(e.done?' · complete':e.locked?' · complete earlier stories':' · guide me'),b=button(label,()=>{if(e.done&&group==='discoveries')extras.inspect(e);else if(e.done&&group==='shrines')extras.travel?.();else select(group,e.id);},'pc-button v-guide-row');b.dataset.guideActivity=group+':'+e.id;p.append(b);if(recommended?.id===e.id)suggested=b;}p.append(button('All activities',()=>show(),'pc-button'));}
  if(suggested)markNext(p,suggested,'Start the highlighted activity, or choose any other entry.');return p;
 }
 function objective(){let group=state.guideCategory;if(group==='reach')return {...reach.objective(),guideGroup:group};if(group==='trails')return {...club.objective(),guideGroup:group};if(group==='harbor')return {...harbor.objective(),guideGroup:group};if(group==='story'&&!state.finaleComplete)return null;if(group==='story'){const r=recommend();if(!r)return null;group=state.guideCategory=r.group;state.guideFocus=r.entry.id;save.write();}
  let e=entries(group).find(e=>e.id===state.guideFocus&&(!e.done||(group==='expeditions'&&adventure.data.active===e.id))&&!e.locked);if(!e){e=next(group);if(!e){const r=recommend();if(!r)return null;group=state.guideCategory=r.group;e=r.entry;}if(state.guideFocus!==e.id){state.guideFocus=e.id;save.write();}if(group==='neighbors')followSide(e.id);if(group==='discoveries')followSecret(e);}
  if(group==='skills')return {...skills.objective(e.id),guideGroup:group};if(group==='expeditions'){adventure.track(e.id);return {...adventure.objective(),guideGroup:group};}return {id:e.id,x:e.x??mover.player.position.x,z:e.z??mover.player.position.z,label:e.label||e.title,kind:e.kind,guideGroup:group};
 }
 function interact(o){if(o.kind==='guide-menu'){select(o.guideGroup,o.id);return true;}return false;}
 function summary(){return groups.map(([id,title])=>{const all=entries(id);return{id,title,total:all.length,done:all.filter(e=>e.done).length};});}
 return {show,select,objective,interact,summary,entries,recommend,main(){clearTargets();state.guideCategory='story';state.guideFocus='story';save.write();close();}};
}

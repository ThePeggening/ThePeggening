import {element,button} from './hud-kit.js';
import {navigateLiberty} from './liberty-navigation.js?v=s1';
export const libertyMiniGames=Object.freeze([
 {id:'gasless-run',name:'PCOCK Runner',url:'./games/gasless-run.html',tag:'SPEED · STUNTS · PERSONAL-BEST GHOST',copy:'Seven courses: coast, city, canyon, alpine, foundry, Skybreak and Daybreak. Race the routes, collect items and complete course objectives.',save:'Play saves existing Runner coins, upgrades, medals and records.'},
 {id:'ghost-route',name:'Ghost Route',url:'./games/ghost-route.html',tag:'STEALTH · COURIERS · SHELTERED PATHS',copy:'Carry the practice delivery through guarded routes. Read the patrols and use cover instead of racing blindly.',save:'Play uses the existing Ghost Route progression and local rewards.'},
 {id:'liberty-crossing',name:'Liberty Crossing',url:'./games/liberty-crossing.html',tag:'TRAFFIC · SIGNAL SCOUT · COURIER ROUTES',copy:'Cross the wide roads, use safe islands, forecast traffic and deliver optional parcels. City Crossing and Endless Traffic.',save:'Play saves Crossing personal bests only. No Runner or story currency.'}
]);
export function arcadeBest(id,save){try{if(id==='liberty-crossing'){const r=JSON.parse(localStorage.getItem('pcock.crossing.records.v1')||'{}');return Math.max(0,Number(r.city?.score)||0,Number(r.endless?.score)||0);}return id==='gasless-run'?Math.max(0,...Object.values(save.state.profile.story.libertyRunnerTour?.records||{}).map(r=>Number(r.score)||0)):save.state.games[id]?.best||0;}catch{return 0;}}
export function showLibertyArcade(story,save,{practiceOnly=false,back=()=>story.close()}={}){
 const p=story.panel(practiceOnly?'Liberty Arcade · Practice':'Liberty Arcade',back);p.classList.add('v-arcade-panel');p.dataset.choiceMenu='true';
 p.append(element('p','v-guide-note',practiceOnly?'Practice mode: no currency, XP, feathers, rewards, medals, best scores or unlocks are saved.':'Three optional games. Play with each game’s existing local progression, or use Practice for a no-rewards attempt. None is required to finish the Valley story.'));
 const jumps=element('nav','v-arcade-jump');jumps.setAttribute('aria-label','Choose a mini-game');const grid=element('div','v-arcade-grid');p.append(jumps);
 for(const g of libertyMiniGames){const card=element('article','v-arcade-card');card.dataset.arcade=g.id;card.id='arcade-card-'+g.id;jumps.append(button(g.name,()=>card.scrollIntoView({block:'start',behavior:'auto'}),'pc-button'));card.append(element('small','v-eyebrow',g.tag),element('h3','',g.name),element('p','',g.copy),element('p','v-small',practiceOnly?'Practice: your existing records stay unchanged.':g.save),element('small','v-small','Local best: '+arcadeBest(g.id,save).toLocaleString()+' points'));
  const actions=element('div','v-arcade-actions'),launch=practice=>{story.savePosition();navigateLiberty(g.url+(practice?'?fun=1':''));};if(!practiceOnly)actions.append(button('Play '+g.name,()=>launch(false),'pc-button pc-primary'));actions.append(button('Practice '+g.name,()=>launch(true),'pc-button'+(practiceOnly?' pc-primary':'')));card.append(actions);grid.append(card);
 }
 p.append(grid,element('p','v-small','Your original Atropa entry and stage are preserved through every detour. In-game currency is fictional; no real wallet connection.'),button('Back to Liberty World',back,'pc-button pc-primary'));
 return p;
}

import {utcDay} from './rng.js';
export const SAVE_KEY='pcock.save', SAVE_VERSION=4;
export const RESTART_BACKUP_KEY=SAVE_KEY+'.before-start-over';
export const GAME_IDS=Object.freeze(['gasless-run','peg-keeper','ghost-route']);
const defaults=Object.freeze({preset:'Auto',renderScale:1,viewDistance:95,shadows:'blob',outlines:'hull',postFX:'vignette',foliage:1,particles:1,fpsCap:60,cameraShake:true,reduceMotion:false,colorSafe:false,musicVolume:.16,sfxVolume:.35,sensitivity:1,leftHanded:false,controlOpacity:.8,layout:'spread'});
const safeRead=(storage,key)=>{try{return JSON.parse(storage.getItem(key));}catch{return null;}};
const integer=(value,max=100000000)=>Number.isFinite(value)?Math.max(0,Math.min(max,Math.floor(value))):0;
const strings=value=>Array.isArray(value)?[...new Set(value.filter(v=>typeof v==='string'&&v.length<=80))].slice(0,100):[];
const map=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
export function freshSave(){return {saveVersion:SAVE_VERSION,profile:{feathers:0,xp:0,unlocks:['original'],cosmetic:'original',achievements:[],story:{}},games:Object.fromEntries(GAME_IDS.map(id=>[id,{currency:0,upgrades:{},boosts:{},skins:['original'],skin:'original',runs:0,best:0,top:[],stars:{},missions:{tier:0,progress:[0,0,0]},stats:{distance:0,jumps:0,pickups:0},tutorialSeen:false,featureUnlocks:['play','settings','how'],daily:{date:null,streak:0}}])),settings:{...defaults},receipts:[],migration:{legacyRead:false},createdAt:utcDay()};}
export function migrateSave(raw,legacy={}){
  const next=freshSave();raw=map(raw);if(/^\d{4}-\d{2}-\d{2}$/.test(raw.createdAt))next.createdAt=raw.createdAt;
  if(raw.saveVersion>=4){const p=map(raw.profile);for(const k of ['feathers','xp'])next.profile[k]=integer(p[k]);next.profile.unlocks=strings(p.unlocks);if(!next.profile.unlocks.includes('original'))next.profile.unlocks.unshift('original');next.profile.achievements=strings(p.achievements);next.profile.cosmetic=typeof p.cosmetic==='string'&&next.profile.unlocks.includes(p.cosmetic)?p.cosmetic:'original';next.profile.story=map(p.story);
    for(const id of GAME_IDS){const old=map(map(raw.games)[id]),game=next.games[id];for(const k of ['currency','runs','best'])game[k]=integer(old[k]);for(const k of ['upgrades','boosts','stars'])for(const [key,value]of Object.entries(map(old[k])).slice(0,60)){if(/^[\w-]{1,60}$/.test(key))game[k][key]=integer(value,k==='stars'?3:k==='upgrades'?20:99);}game.skins=strings(old.skins);if(!game.skins.includes('original'))game.skins.unshift('original');game.skin=game.skins.includes(old.skin)?old.skin:'original';game.top=Array.isArray(old.top)?old.top.filter(v=>Number.isFinite(v.score)).slice(0,10).map(v=>({score:integer(v.score),date:typeof v.date==='string'?v.date.slice(0,10):utcDay()})):[];game.tutorialSeen=Boolean(old.tutorialSeen);game.featureUnlocks=strings(old.featureUnlocks);game.missions.tier=integer(old.missions?.tier,50);game.missions.progress=[0,1,2].map(i=>integer(old.missions?.progress?.[i]));for(const k of Object.keys(game.stats))game.stats[k]=integer(old.stats?.[k]);game.daily={date:/^\d{4}-\d{2}-\d{2}$/.test(old.daily?.date)?old.daily.date:null,streak:integer(old.daily?.streak,999)};}
    next.receipts=strings(raw.receipts);next.migration=map(raw.migration);
  }else{const story=map(legacy.progress||raw);next.profile.story={...story,completed:strings(story.completed),feathers:strings(story.feathers)};next.profile.unlocks=strings(story.cosmetics||['original']);if(!next.profile.unlocks.includes('original'))next.profile.unlocks.unshift('original');next.profile.cosmetic=story.cosmetic||'original';next.migration={legacyRead:true,fromStoryVersion:integer(story.saveVersion,3),arcade:map(legacy.arcade)};for(const id of GAME_IDS)next.games[id].best=integer(legacy.arcade?.bests?.[id]);}
  const sourceSettings=map(raw.settings||legacy.settings);
  for(const [key,value] of Object.entries(defaults)){if(typeof sourceSettings[key]===typeof value)next.settings[key]=sourceSettings[key];}
  if(!['Auto','Low','Medium','High','Ultra'].includes(next.settings.preset))next.settings.preset='Auto';
  for(const [key,min,max]of [['renderScale',.6,1],['viewDistance',45,130],['foliage',0,1],['particles',0,1],['musicVolume',0,.6],['sfxVolume',0,.8],['sensitivity',.3,2],['controlOpacity',.25,1]])next.settings[key]=Math.min(max,Math.max(min,Number.isFinite(next.settings[key])?next.settings[key]:defaults[key]));
  return next;
}
export function createSave(storage=localStorage){
  let state=migrateSave(safeRead(storage,SAVE_KEY),{progress:safeRead(storage,'pcock.progress'),settings:safeRead(storage,'pcock.settings'),arcade:safeRead(storage,'pcock.arcade')}),error=null;const listeners=new Set();
  function write(){try{storage.setItem(SAVE_KEY,JSON.stringify(state));error=null;}catch(e){error='Save unavailable: '+e.name;}for(const listener of listeners)listener(state);return !error;}
  function replace(next){next=migrateSave(next);try{storage.setItem(SAVE_KEY,JSON.stringify(next));state=next;error=null;}catch(e){error='Save unavailable: '+e.name;return false;}for(const listener of listeners)listener(state);return true;}
  function startOver(){try{storage.setItem(RESTART_BACKUP_KEY,JSON.stringify({savedAt:new Date().toISOString(),save:state}));}catch(e){error='Backup unavailable: '+e.name;return false;}const next=freshSave();next.settings={...state.settings};if(state.profile.story.libertyRunnerSettings)next.profile.story.libertyRunnerSettings={...state.profile.story.libertyRunnerSettings};return replace(next);}
  function restorePrevious(){const previous=safeRead(storage,RESTART_BACKUP_KEY);if(!previous?.save?.saveVersion){error='No previous game is available.';return false;}return replace(previous.save);}
  write();
  const onStorage=e=>{if(e.key===SAVE_KEY&&e.newValue){try{state=migrateSave(JSON.parse(e.newValue));for(const listener of listeners)listener(state);}catch{}}};
  globalThis.addEventListener?.('storage',onStorage);
  return {get state(){return state;},get error(){return error;},write,update(fn){fn(state);write();return state;},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},reset(){return replace(freshSave());},startOver,restorePrevious,get hasPrevious(){return !!safeRead(storage,RESTART_BACKUP_KEY)?.save?.saveVersion;},dispose(){listeners.clear();globalThis.removeEventListener?.('storage',onStorage);}};
}
export function levelFromXp(xp){return 1+Math.floor(Math.sqrt(Math.max(0,xp)/100));}
export function levelProgress(xp){const level=levelFromXp(xp),base=(level-1)**2*100,next=level**2*100;return {level,current:xp-base,required:next-base,fraction:(xp-base)/(next-base)};}

import {currencies} from './economy.js';
// Small foundation contracts, not the full game content for S3/S4/S5.
const definitions={
  'gasless-run':{title:'GASLESS RUN',verb:'glide',upgrade:'Longer glide',effect:'Glide stamina',unit:'seconds',base:1.5,step:.7},
  'peg-keeper':{title:'PEG KEEPER',verb:'dash',upgrade:'Stronger dash',effect:'Dash speed',unit:'m/s',base:9,step:1.5},
  'ghost-route':{title:'GHOST ROUTE',verb:'glide',upgrade:'Quiet wings',effect:'Glide stamina',unit:'seconds',base:1.5,step:.7}
};
export function shellConfig(id='gasless-run'){
  const d=definitions[id]||definitions['gasless-run'];if(!definitions[id])id='gasless-run';
  return {id,title:d.title,currency:currencies[id],subtitle:'Shared foundation preview',returnUrl:new URL('../index.html?return=hub',import.meta.url).href,
    upgrades:[{id:'signature',kind:'upgrade',title:d.upgrade,description:`${d.effect}: ${d.base} → ${d.base+d.step} ${d.unit} at level 1.`,cost:50,growth:1.6,max:5,base:d.base,step:d.step,effect:d.effect,unit:d.unit,recommended:true},
      {id:'magnet',kind:'upgrade',title:'Feather magnet',description:'Pickup radius grows by 0.5 m per level. Feel it in the test scene.',cost:60,growth:1.5,max:5,base:1,step:.5,effect:'Pickup radius',unit:'m'},
      {id:'head-start',kind:'boost',title:'Bright start',description:'One run: begin with 10 points and a momentum pulse.',cost:20},
      {id:'signal-tail',kind:'skin',title:'Signal tail',description:'Original PulseChain-inspired tail colors.',cost:100},
      {id:'wayfarer-hat',kind:'skin',title:'Wayfarer hat',description:'An original cone cap with a gold band.',cost:70},
      {id:'ember-trail',kind:'skin',title:'Ember trail',description:'Brand-colored sparks follow your steps.',cost:80}],
    skins:[{id:'original',title:'Liberty plume',category:'tail',description:'The original seven-color fan.'},{id:'signal-tail',title:'Signal tail',category:'tail',description:'Unlocked in the Store.'},{id:'wayfarer-hat',title:'Wayfarer hat',category:'hat',description:'Unlocked in the Store.'},{id:'ember-trail',title:'Ember trail',category:'trail',description:'Unlocked in the Store.'}],
    missions:[{id:'explore',title:'Find your feet',metric:'distance',target:20},{id:'jump',title:'Spread your wings',metric:'jumps',target:1},{id:'collect',title:'Follow the signal',metric:'pickups',target:3}],
    tips:['WASD or the left stick moves.','Tap Jump; hold to glide while airborne.','Dash follows your movement direction.','Earn game currency; 10% also becomes shared Feathers.'],
    tutorial:['Move through the feather arch.','Jump over the low rail. Hold Jump to glide.','Collect three signal feathers, then visit the finish beacon.']};
}

import {gameEnabled} from './game-availability.js';
// ===== MODULE: DATA:VALLEY_PRODUCTS =====
export const districts=Object.freeze([
 {id:'plaza',name:'Liberty Plaza',x:0,z:-20,key:'liberty-statue',scale:2.3},
 {id:'harbor',name:'Swap Harbor',x:74,z:-20,key:'product-hall',scale:2.2,url:'https://libertyswap.finance/',lesson:'State the outcome; let a simulated route connect the chains.'},
 {id:'shield',name:'Shield Keep',x:-75,z:-20,key:'product-hall',scale:2.5,url:'https://libertyswap.finance/shield/',lesson:'Public is exposed; Private uses a shield to protect the route.'},
 {id:'pool',name:'Pool Springs',x:95,z:100,key:'product-hall',scale:1.8,url:'https://pool.libertyswap.finance/',lesson:'Liquidity is a shared reserve; all balances here are fictional.'},
 {id:'stables',name:'Stables Foundry',x:125,z:5,key:'product-hall',scale:2.7,url:'https://libertyswap.finance/stables-coin/',lesson:'Keep the fictional gauge balanced with buy and sell liquidity.'},
 {id:'market',name:'HyperMarket Bazaar',x:0,z:100,key:'product-hall',scale:2,url:'https://hypermarket.libertyswap.finance/',lesson:'An odds display describes a prediction, never a certainty.'},
 {id:'vault',name:'ZKX Vault',x:-115,z:80,key:'product-hall',scale:2.2,url:'https://libertyswap.finance/',lesson:'Choose a public or private route; never share keys or seed phrases.'},
 {id:'observatory',name:'Observatory',x:155,z:-145,key:'lighthouse',scale:1.5,url:'https://scan.libertyswap.finance/',lesson:'A route receipt describes what happened in the simulation.'},
 {id:'launch',name:'Launch Pad',x:-110,z:-100,key:'signal-spire',scale:1.8,url:'https://launchpad.libertyswap.finance/',lesson:'A launchpad is a starting place; coming products remain teasers.'},
 {id:'construction',name:'Construction Row',x:-65,z:-95,key:'house',scale:1.6},
 {id:'spire',name:'PulseChain Spire',x:22,z:-42,key:'signal-spire',scale:2.5},
 {id:'summit',name:"Liberty's Summit",x:-155,z:-195,key:'liberty-statue',scale:1.8},
 {id:'windmill',name:'Orchard Village',x:25,z:75,key:'windmill',scale:1.5}
]);
export const namedResidents=Object.freeze([
 {id:'pulse',name:'Pulse Guy',x:0,z:29,work:'plaza'}, {id:'liberty',name:'Liberty',x:-5,z:-14,work:'plaza'},
 {id:'nessa',name:'Nessa',x:33,z:-20,work:'harbor'}, {id:'moss',name:'Moss',x:60,z:85,work:'pool'},
 {id:'ivo',name:'Ivo',x:111,z:5,work:'stables'}, {id:'tavi',name:'Tavi',x:0,z:86,work:'market'},
 {id:'orin',name:'Orin',x:-98,z:77,work:'vault'}, {id:'rook',name:'Rook',x:-60,z:-82,work:'construction'}
]);
export const gates=Object.freeze([
 {id:'gasless-run',name:'Liberty Runner',x:23,z:6,url:'./games/gasless-run.html?return=valley'},
 {id:'ghost-route',name:'Ghost Route',x:-51,z:-15,url:'./games/ghost-route.html?return=hub'}
].filter(game=>gameEnabled(game.id)));
// ===== MODULE: DATA:SIDE_QUESTS =====
export const sideQuests=Object.freeze([
 ['nessa-net','Nessa','A net for tomorrow',33,-20,64,-34,'Recover the dock net beside the ferry.'],
 ['nessa-letter','Nessa','Across the water',33,-20,84,-15,'Deliver a note to the harbor doorstep.'],
 ['moss-seeds','Moss','Three little seeds',60,85,28,76,'Bring the windmill seed pouch to the orchard.'],
 ['moss-picnic','Moss','Room at the table',60,85,97,140,'Carry an invitation to the lakeside picnic.'],
 ['ivo-tools','Ivo','Borrowed tools',111,5,124,27,'Find the tool roll beside the Foundry workshop.'],
 ['ivo-bell','Ivo','A bell for the shift',111,5,15,-35,'Fetch the repaired bell from the plaza.'],
 ['tavi-lantern','Tavi','Lantern keeper',0,86,-17,98,'Find the lantern by the quiet market stall.'],
 ['tavi-fruit','Tavi','A fair share',0,86,30,78,'Bring the orchard basket to the market.'],
 ['orin-map','Orin','A map without names',-98,77,-80,64,'Recover a route map without private details.'],
 ['orin-post','Orin','Safe arrival',-98,77,147,-135,'Carry a sealed fictional parcel to the lighthouse.'],
 ['rook-boards','Rook','One more plank',-60,-82,-43,-92,'Find the stacked bridge boards.'],
 ['rook-summit','Rook','The view from here',-60,-82,-150,-183,'Reach the summit trail marker and return.']
].map(([id,giver,title,x,z,tx,tz,description])=>({id,giver,title,x,z,tx,tz,description,reward:8})));
export const disclaimer='Fan-made game. Simulated only. Not financial advice. No real transactions. Nothing here predicts or promises any price.';

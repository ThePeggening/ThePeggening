// Shipping status is separate from save IDs, preserving historical progress.
export const gameAvailability=Object.freeze([
 Object.freeze({id:'gasless-run',name:'Liberty Runner',enabled:true,status:'Completed rebuild'}),
 Object.freeze({id:'ghost-route',name:'Ghost Route',enabled:true,status:'Completed rebuild'}),
 Object.freeze({id:'peg-keeper',name:'Peg Keeper',enabled:false,status:'Unfinished rebuild · on hold'})
]);
export const gameEnabled=id=>gameAvailability.some(game=>game.id===id&&game.enabled);

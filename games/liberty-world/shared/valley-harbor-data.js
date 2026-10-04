export const harborDock=Object.freeze({x:28,z:-52});
export const harborRoutes=Object.freeze([
 {id:'shore',title:'Shoreline salvage',description:'A short loop along the near bank.',clue:'Search the near bank south of Nessa, then the path toward the plaza.',points:[{x:34,z:-16},{x:29,z:-7},{x:19,z:-20}],secret:{x:36,z:-36},secretClue:'A forgotten keepsake waits between the loading dock and Nessa, beside the near bank.'},
 {id:'grove',title:'Grove gathering',description:'A woodland loop past the practice trees.',clue:'Look around the three practice trees southwest of the plaza.',points:[{x:-14,z:27},{x:-29,z:38},{x:-20,z:18}],secret:{x:-33,z:25},secretClue:'Look beyond the west edge of the practice grove for a keepsake.'},
 {id:'market',title:'Market lantern run',description:'Collect supplies around the festival approaches.',clue:'Search both sides of the southern road and the edge of the Market.',points:[{x:10,z:70},{x:-12,z:83},{x:16,z:87}],secret:{x:-18,z:70},secretClue:'A keepsake rests northwest of the Market, away from the main road.'}
]);
export const harborDecor=Object.freeze([
 {id:'lanterns',title:'Warm dock lanterns',cost:2,description:'Light the posts around your loading dock.'},
 {id:'pennants',title:'Festival pennants',cost:3,description:'Raise a colorful banner over the dock.'},
 {id:'picnic',title:'Harbor picnic table',cost:4,description:'Make a little gathering place beside the dock.'}
]);
// Reserve only these small interaction spaces from procedural clutter.
export const harborPlaces=[harborDock,{x:harborDock.x,z:harborDock.z-7},...harborRoutes.flatMap(r=>[...r.points,r.secret])];

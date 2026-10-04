// Lantern Reach is additional land east of the former 598 m world edge.
export const reachRegion={id:'reach',name:'Lantern Reach',x:650,z:110,description:'A drowned canal town. Reopen the lock, wake the mill and recover its forgotten atlas.'};
export const reachRoad=[[250,35],[400,70],[590,110],[650,110],[716,100],[768,100],[790,72],[824,64],[872,110],[880,158]];
export const reachSites={
 ferry:{x:24,z:-43,label:'Lantern Reach ferry'},landing:{x:645,z:110,label:'Return ferry'},nessa:{x:657,z:112,label:'Nessa · A light across the water'},
 inlet:{x:710,z:90,label:'Upper sluice · inlet'},outlet:{x:710,z:114,label:'Lower sluice · drain'},winch:{x:718,z:100,label:'Release the lock bridge'},
 ivo:{x:785,z:65,label:'Ivo · The silent mill'},gear:{x:850,z:14,y:14,label:'Recover the mill gear · climb the aqueduct ramp'},mill:{x:827,z:52,label:'Mill gearbox'},
 pipe0:{x:800,z:50,label:'Canal elbow A'},pipe1:{x:800,z:38,label:'Canal elbow B'},pipe2:{x:812,z:38,label:'Canal elbow C'},
 orin:{x:879,z:126,label:'Orin · Names worth keeping'},mural:{x:886,z:140,label:'Read the archive mural'},
 river:{x:894,z:148,label:'Ring the river chime'},grain:{x:894,z:158,label:'Ring the grain chime'},stars:{x:894,z:168,label:'Ring the stars chime'},atlas:{x:922,z:158,label:'Recover the Lantern atlas'},
 overlook:{x:884,z:220,label:'Lantern overlook'}
};
export const reachQuests=[{id:'lock',title:'Nessa · A light across the water'},{id:'mill',title:'Ivo · The silent mill'},{id:'archive',title:'Orin · Names worth keeping'}];
export const pipeSolution=[3,1,2]; // Elbow openings: N+E, E+S, S+W, W+N.
export const chimeSolution=['river','grain','stars'];
export const reachInside=(x,z)=>x>=598&&x<=940&&z>=-40&&z<=260;
export const inCanal=(x,z)=>x>726&&x<750&&z>-22&&z<240;
export const inArchive=(x,z)=>x>888&&x<933&&z>138&&z<180;
export function reachHeight(x,z,old){if(x<=600)return old;const t=Math.min(1,(x-600)/24),s=t*t*(3-2*t);let h=6;
 if(inCanal(x,z)||x>=620&&x<=660&&z>=104&&z<=129)h=.5;
 if(inArchive(x,z))h=2;
 // Broad stairs are terrain, so actor feet and the rendered floor share the same triangles.
 if(x>=878&&x<=896&&z>=153&&z<=163)h=6-4*Math.min(1,(x-878)/18);
 return old+(h-old)*s;
}

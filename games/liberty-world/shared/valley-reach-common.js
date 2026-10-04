export const commonGuests=[
 {id:'guest-nessa',name:'Nessa',x:876,z:217},
 {id:'guest-ivo',name:'Ivo',x:892,z:217},
 {id:'guest-orin',name:'Orin',x:889,z:224},
 {id:'guest-moss',name:'Moss',x:880,z:227},
 {id:'guest-tavi',name:'Tavi',x:889,z:232},
 {id:'guest-rook',name:'Rook',x:878,z:232}
];
export const commonModes=[{id:'quiet',title:'Quiet afternoon',description:'Pack away the gathering. Keep your garden or reading terrace.'},{id:'market',title:'Canal market',description:'Open the stalls, hang the pennants and welcome six neighbours.'},{id:'stories',title:'Story circle',description:'Gather beside the lanterns and hear what your work meant to everyone.'}];
export function reachMemory(state,name){const d=state.lanternReach||{};
 if(name==='Nessa'&&d.bridge)return 'And the Lantern crossing is still open. Every boat no longer has to be the only way home.';
 if(name==='Ivo'&&d.powered)return 'Your Lantern mill is turning, the nursery has water and the archive pump is working.';
 if(name==='Orin'&&d.atlas)return 'The Lantern atlas is safe. Its old names belong to the town again.';
 if(name==='Moss'&&d.powered)return 'I planted the first cuttings in the mill nursery you watered.';
 if(name==='Tavi'&&d.homecoming)return 'We finally opened the Lantern common together. A festival has a place to come back to.';
 if(name==='Rook'&&d.homecoming)return 'I brought a chair to Lantern Reach. This time there was a finished place to put it.';
 return '';
}
export function commonConversation(state,name){const d=state.lanternReach||{},has=n=>state.feathers?.includes('feather-'+n),mood=d.commonMode;
 const lines={
 Nessa:[reachMemory(state,'Nessa'),'I saw someone take a basket across without stopping to ask for help. That is the part I will remember.','When you are ready to leave, the quay boat will take you back to Swap Harbor. We will keep this place open.'],
 Ivo:[reachMemory(state,'Ivo'),'The best sound in the yard is not the wheel. It is the moment everyone stops worrying that the wheel might stop.',mood==='market'?'Moss has brought seedlings to the stalls. They came from the nursery you restored.':'I left the workshop for an evening. It feels strange, in a good way.'],
 Orin:[reachMemory(state,'Orin'),d.ending==='reading'?'I have left the atlas on the reading terrace. It should be read, not locked away again.':'The atlas had a garden drawn into its margin. Now that little drawing has somewhere to grow.','A place can remember people without keeping them from leaving. Come back whenever you want.'],
 Moss:[has(3)?'First you shared the spring with my orchard. Then you brought water to this nursery. I have two places to plant now.':'I brought cuttings from the old orchard. Your mill has given them a new home.',mood==='market'?'Tavi keeps trying to arrange my seedlings by height. I keep moving the small ones into the sun.':'There is nothing to harvest tonight. Sit with us for a moment. Let something grow without watching it.'],
 Tavi:[state.harborDays?.decor?.length?'The harbor decorations were a beginning. Now we have a whole common to fill.':'A bell, a table and someone willing to stay: that is enough to begin a gathering.','Choose the market or the story circle whenever you like. No tickets, deadlines or missed days. This place is yours to enjoy.'],
 Rook:[has(7)?'The summit is a real path now. So is this crossing. You have a habit of finishing the roads people only talk about.':'I am still learning the difference between drawing a place and building one. You have given me a good example.','There is another chair beside me. I kept it clear for the next person who arrives.']
 };return lines[name]||['It is good to see the common open again.'];
}

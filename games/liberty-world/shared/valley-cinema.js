import * as THREE from 'three';

// Authored story beats: each is a distinct camera composition and performance.
// Existing scene IDs and one-time completion records remain save-compatible.
const scripts={
 opening:[['Toll Lands','The roads were open. Somehow, every step still felt smaller.','wide'],['PCOCK','A folded tail. A held breath. Another gate.','close','shiver'],['Pulse Guy','Hey, my guy. You do not have to find the whole way at once.','two','wave'],['Pulse Guy','Walk with me. We will find the first step together.','reveal','point']],
 'chapter-1-open':[['Nessa','The bridge timber is here. The people who need it are over there.','wide'],['Nessa','I kept choosing every turn for everyone. Nothing moved.','close'],['Pulse Guy','Start with where you want to arrive. We can work out the road.','two','point']],
 'chapter-1-close':[['Swap Harbor','Timber crosses the water. Two unfinished shores become one road.','wide'],['Nessa','I did not need to control every turn. I needed to trust the destination.','two','wave'],['Pulse Guy','Look at that first color, my guy. You made room for hope.','close','celebrate']],
 'chapter-2-open':[['Liberty','I tried to watch every road. I cannot shelter everyone alone.','wide'],['Liberty','This parcel needs a quiet path. Help me keep its journey private.','two','point'],['Pulse Guy','Quiet does not mean alone. I am coming with you.','close','nod']],
 'chapter-2-close':[['Shield Keep','One small lamp lights the next. The courier reaches a waiting hand.','wide'],['Liberty','Safety can be something we build together.','two','nod'],['Pulse Guy','A second color. A road where you can breathe.','close','celebrate']],
 'chapter-3-open':[['Moss','I saved every seed for a better season. Then I stopped planting.','wide'],['Moss','The spring cannot feed the orchard while I keep every gate shut.','close'],['Pulse Guy','Let us leave enough for tomorrow, and share enough for today.','two','point']],
 'chapter-3-close':[['Pool Springs','Water finds the roots. Small green things make a brave return.','wide'],['Moss','I set out one bowl. Then I remembered who helped me.','two','wave'],['Pulse Guy','There is room at this table, my guy. There always should have been.','close','nod']],
 'fee-storm':[['Liberty Plaza','The toll bells return. Even the new roads seem to narrow.','wide','shiver'],['Liberty','I thought, if I carried enough, no one else would feel the weight.','two','shiver'],['PCOCK','The colors are still there. Tonight, they are hard to see.','close','shiver'],['Pulse Guy','Then tonight we stop carrying them alone.','two','nod']],
 friendship:[['Pulse Guy','No joke this time, my guy. That was frightening.','two'],['Pulse Guy','You do not owe the Valley another brave face. Sit with me.','close','nod'],['A quiet moment','The torch is dim. Neither friend leaves.','still'],['Pulse Guy','One breath. Then one small step. I am still here.','reveal','point']],
 'chapter-4-open':[['Ivo','The gauge stopped. I kept staring, as if a number could fix itself.','wide'],['Ivo','The people at these valves need a partner, not another alarm.','close'],['Pulse Guy','We will listen to the machine. And to each other.','two','nod']],
 'chapter-4-close':[['Stables Foundry','A valve turns. Then another. The workshop finds its rhythm.','wide'],['Ivo','A steady light is a better victory than a louder warning.','two','nod'],['Pulse Guy','Four colors. You are finding your balance.','close','celebrate']],
 'chapter-5-open':[['Tavi','Everyone had an answer. I could barely hear the question.','wide'],['Tavi','If I ring the bell, will the quiet neighbors get their turn?','close'],['Pulse Guy','Give them a clear question. Give them time. Then listen.','two','point']],
 'chapter-5-close':[['HyperMarket','The opening bell rings. A small voice finishes its first whole sentence.','wide'],['Tavi','Being brave was admitting that I did not know.','two','wave'],['Pulse Guy','And being fair meant listening when the answer arrived.','close','nod']],
 'chapter-6-open':[['Orin','I kept every letter safe. I forgot that letters are meant to arrive.','wide'],['Orin','Help me protect this journey without closing its horizon.','close'],['Pulse Guy','We can respect a secret and still offer a hand.','two','nod']],
 'chapter-6-close':[['The coast','A light crosses the water. A sealed letter reaches its owner.','wide'],['Orin','The destination is enough. The rest belongs to them.','two','nod'],['Pulse Guy','Six colors, my guy. And a little more room to choose.','close','celebrate']],
 'chapter-7-open':[['Rook','I promised a finished road. All I have is a careful beginning.','wide'],['Rook','Will you still walk with me if the map has empty spaces?','close'],['Pulse Guy','Leave them there. Tomorrow needs somewhere to go.','two','point']],
 'chapter-7-close':[['Liberty’s Summit','The last turn opens onto a horizon no gate can contain.','wide'],['Rook','I will keep the next promise small enough to carry.','two','nod'],['Pulse Guy','Seven colors. You never had to earn a place beside me.','close','celebrate']],
 'peg-engine':[['Stables Foundry','Seven lessons become seven working lights. The fictional engine wakes.','wide'],['Liberty','A machine can keep a rhythm. People give it a reason.','two','point'],['The Valley','Across the roads, one torch answers another.','reveal','celebrate']],
 finale:[['Liberty Valley','The roads lead home. The plaza fills with the people who kept a place for each other.','wide','celebrate'],['Liberty','Hope. Safety. Growth. Stability. Courage. Independence. Anticipation.','two','wave'],['PCOCK','Seven bright colors catch the light. There is nothing left to hide.','close','celebrate'],['Pulse Guy','Nice view, my guy. Even better company.','two','nod'],['A place for a friend','The Valley keeps its lights on. The friends stay a little longer.','still']]
};
export const storySceneIds=Object.freeze(Object.keys(scripts));
export const cinematicCoverage=Object.freeze(storySceneIds.map(id=>({id,shots:scripts[id].length})));
const neighborEndings={
 'nessa-net':'Nessa repairs one net, then hangs a second hook for whoever needs to borrow it.',
 'nessa-letter':'A reply crosses the same water. Nessa reads it twice before smiling.',
 'moss-seeds':'Moss plants two seeds and gives the third to a neighbor. Tomorrow can grow in more than one garden.',
 'moss-picnic':'The invitation becomes another place at the table. Nobody has to arrive alone.',
 'ivo-tools':'Ivo returns every tool to its place, then writes a small note: Please borrow these.',
 'ivo-bell':'The bell rings once. This time, it means the shift is over and everyone can rest.',
 'tavi-lantern':'Tavi hangs the lantern above the quiet stall. Its keeper finally looks up.',
 'tavi-fruit':'Tavi divides the basket evenly and saves the last piece for the person who carried it.',
 'orin-map':'Orin unfolds a useful map. It shows the roads without exposing the people who travel them.',
 'orin-post':'The sealed parcel arrives. Orin needs no private details to know that the journey mattered.',
 'rook-boards':'One borrowed plank closes a gap. Rook crosses last, after everyone else is safely over.',
 'rook-summit':'Rook listens to your quiet chirp and looks toward the summit. There is time to walk there together.'
};
export const neighborEnding=q=>neighborEndings[q.id]||q.description;
const compositions={wide:{eye:[13,7,15],look:[0,1.5,0],fov:48},close:{eye:[.6,2.6,5.5],look:[-.8,1.5,.2],fov:36},two:{eye:[5,3.1,8],look:[0,1.4,0],fov:42},reveal:{eye:[-11,6,13],look:[0,2,0],fov:48},still:{eye:[-5,3.6,9],look:[0,1.5,0],fov:42}};
export function createCinematicScene(id,title,line,focus,duration,world){
 const beats=scripts[id]||[[title,line,'wide'],['Pulse Guy',id.startsWith('neighbor-')?'A small kindness can change somebody’s whole day. Thank you for making the journey.':'A little piece of the Valley found its way back into the story.','two','nod']];
 let anchor={x:focus.x,z:focus.z};if(Math.abs(focus.x-44)<1&&Math.abs(focus.z+20)<1){anchor.x=33;anchor.z=-20;}if(id==='fee-storm'){anchor.x=0;anchor.z=-7;}if(id==='peg-engine')anchor.z+=13;if(id==='finale')anchor.z+=12;
 anchor=world.cinemaCamera?.stage(anchor)||anchor;return {id,title,line,focus:{...anchor},origin:{...anchor},anchor,duration:Math.max(duration,...beats.map(b=>(b[1].split(/\s+/).length/2.8+1.5)*beats.length)),beats,age:0,beat:-1,frame:null,world};
}
const eye=new THREE.Vector3(),look=new THREE.Vector3();
export function updateCinematic(scene,camera,reduceMotion){
 const index=Math.min(scene.beats.length-1,Math.floor(scene.age/scene.duration*scene.beats.length)),beat=scene.beats[index],shot=beat[2],composition=compositions[shot],u=(scene.age/(scene.duration/scene.beats.length))%1;
 let base=shot==='wide'?scene.origin:scene.anchor;if(scene.id==='finale'&&index===0)base={x:0,z:-7};scene.focus.x=base.x;scene.focus.z=base.z;
 const y=scene.world.heightAt(base.x,base.z),drift=reduceMotion||shot==='still'?0:(u-.5)*1.3;
 eye.set(base.x+composition.eye[0]+drift,y+composition.eye[1],base.z+composition.eye[2]-drift*.4);look.set(base.x+composition.look[0],y+composition.look[1],base.z+composition.look[2]);const visibility=scene.world.cinemaCamera?.solve(eye,look,scene,index,camera);camera.position.copy(eye);camera.lookAt(look);if(camera.fov!==Math.max(48,composition.fov)){camera.fov=Math.max(48,composition.fov);camera.updateProjectionMatrix();}
 scene.frame={id:scene.id,visibility,index,speaker:beat[0],text:beat[1],shot,gesture:beat[3]||'listen',anchor:scene.id==='finale'&&index===0?base:scene.anchor,cast:scene.id==='finale'||scene.id==='peg-engine'||scene.id.includes('chapter-2')||scene.id==='fee-storm'?'all':'friends',age:scene.age,storm:scene.id==='fee-storm'};return scene.frame;
}
export function createCastStaging(actor,guides,world){
 const originals=new Map(),axis=new THREE.Vector3(0,0,1);let active=false;
 function pose(root,gesture,t){for(const side of ['Left','Right']){const arm=root.getObjectByName('mixamorig'+side+'Arm')||root.getObjectByName('mixamorig:'+side+'Arm');if(!arm)continue;if(!originals.has(arm))originals.set(arm,arm.quaternion.clone());arm.quaternion.copy(originals.get(arm));if(side==='Right'&&(gesture==='wave'||gesture==='celebrate'||gesture==='point'))arm.rotateOnAxis(axis,gesture==='point'?-.65:-.9+Math.sin(t*3)*.12);}}
 return {update(frame,reduceMotion){if(!frame){if(active){for(const [bone,rest]of originals)bone.quaternion.copy(rest);actor.root.rotation.x=0;for(const g of guides)g.group.rotation.z=0;}active=false;return;}active=true;const a=frame.anchor,t=reduceMotion?0:frame.age;actor.root.position.set(a.x-1.4,world.heightAt(a.x-1.4,a.z+.4),a.z+.4);actor.root.rotation.set(frame.gesture==='shiver'?Math.sin(t*9)*.015:Math.sin(t*1.4)*.015,.25,0);pose(actor.model||actor.root,frame.gesture,t);for(const g of guides){g.group.visible=g.index===0||frame.cast==='all';const x=a.x+(g.index===0?1.45:-3.4),z=a.z+(g.index===0?0:-.3);g.group.position.set(x,world.heightAt(x,z),z);g.group.rotation.set(0,g.index===0?-.25:.3,Math.sin(t*1.8)*.012);pose(g.group,frame.gesture,t);}}};
}

// MARIA 414 — RECLAIMED · R5. Embedded in the packed Classic game by build-maria-414.py.
// Fictional story. Save state and rewards are independent of the main campaign.
(() => {
 'use strict';
 if (Game.prototype.maria414Revision) return;
 Game.prototype.maria414Revision = 5;
 const KEY='atropa_maria_414_reclaimed_v1', REWARD=414;
 const ACTS=['The Empty Rack','Ghost in the Signal','The Wrong Exit','Blackout','Below 414','The Rifle Engine','Sommi','The 414 Collapse','Reclaimed','The Signal Remains'];
 const ORIGIN={x:900,y:12,z:900}, WIDTH=56, DEPTH=70;
 const V=(x,y,z)=>new THREE.Vector3(x,y,z);
 const point=(room,x=0,y=0,z=0)=>V(ORIGIN.x+x,ORIGIN.y+y,ORIGIN.z-room*160+z);
 const eligible=()=>!CW&&!FR&&loadSkinId()==='maria-414';
 const fresh=()=>({v:1,started:false,step:0,complete:false,rewarded:false,rifles:false,elapsed:0,seen:[],checkpoint:0,puzzles:{house:{collected:[],ordered:[]},power:{routes:[0,0,0]},...freshDepth()}});
 let cached=null, cachedRaw=null;
 function read(){
  let raw;try{raw=localStorage.getItem(KEY);}catch(_){return cached||(cached=fresh());}
  if(cached&&cachedRaw===raw)return cached;
  let q;try{q=JSON.parse(raw||'null');}catch(_){}
  cached={...fresh(),...(q?.v===1?q:{})};
  const step=Number(cached.step),elapsed=Number(cached.elapsed);
  cached.step=Number.isFinite(step)?Math.max(0,Math.min(STEPS.length-1,Math.floor(step))):0;
  cached.elapsed=Number.isFinite(elapsed)?Math.max(0,elapsed):0;
  cached.checkpoint=cached.step;
  cached.seen=Array.isArray(cached.seen)?[...new Set(cached.seen.filter(x=>Number.isInteger(x)&&x>=0&&x<10))]:[];
  cached.complete=cached.complete===true;cached.started=cached.started===true;
  cached.rewarded=cached.rewarded===true;cached.rifles=cached.rifles===true;
  if(cached.complete){cached.started=true;cached.rewarded=true;cached.rifles=false;cached.step=STEPS.length-1;cached.checkpoint=cached.step;}
  const p=cached.puzzles,validIds=a=>Array.isArray(a)?[...new Set(a.filter(x=>Number.isInteger(x)&&x>=0&&x<3))]:[];
  const collected=validIds(p?.house?.collected),ordered=validIds(p?.house?.ordered);let prefix=0;
  while(prefix<ordered.length&&ordered[prefix]===prefix&&collected.includes(prefix))prefix++;
  cached.puzzles={house:{collected:cached.step>1?[0,1,2]:collected,ordered:cached.step>1?[0,1,2]:ordered.slice(0,prefix)},power:{routes:cached.step>10?[3,1,2]:[0,1,2].map(i=>Number.isInteger(p?.power?.routes?.[i])&&p.power.routes[i]>=0&&p.power.routes[i]<4?p.power.routes[i]:0)}};
  Object.assign(cached.puzzles,normalizeDepth(p,cached.step));
  cachedRaw=raw;return cached;
 }
 function write(q){cached={...q,v:1};const raw=JSON.stringify(cached);try{localStorage.setItem(KEY,raw);cachedRaw=raw;}catch(_){try{cachedRaw=localStorage.getItem(KEY);}catch(_){cachedRaw=null;}Quests.toast('Story checkpoint is held for this session. Browser storage is unavailable.');}return cached;}
 function graduated(){
  const s=store.get();if(s.tut)return false;
  const p=loadPrestigeSave();
  return p?.trialOutcome==='completed'||(p?.trialDone===true&&p?.trialOutcome!=='skipped')||campaignLegacyVeteranHasProgress();
 }
 const STEPS=[
  [0,0,-15,-24,'Inspect the empty rifle rack','The catches are open. Nothing has been forced.','inspect'],
  [0,0,15,-18,'Read the house recorder','Find the camera buffer beside the server wall.','inspect'],
  [0,0,0,24,'Follow the stolen signal','Use the maintenance passage behind the reconstruction table.','travel',1],
  [1,1,-19,16,'Recover signal fragment 1/3','The stolen carrier has crossed onto the roof. Read its first trace.','trace'],
  [1,1,18,-3,'Recover signal fragment 2/3','Follow the moving carrier across the illuminated rooftop.','trace'],
  [1,1,-12,-23,'Recover signal fragment 3/3','The final trace ends beside the roof receiver.','trace'],
  [1,1,15,-26,'Tune the carrier','The three recovered digits form the carrier: 4, then 1, then 4.','code'],
  [2,2,0,-22,'Try the marked exit','The exit is broadcasting Maria’s own return code.','inspect'],
  [2,2,-19,6,'Find the real route','Read four cable plates and reconstruct their destinations at the service conduit.','inspect'],
  [2,2,18,23,'Open the service hatch','The line disappears under the building.','travel',3],
  [3,3,-17,15,'Restore emergency power','Follow the amber floor lights to the manual breaker.','inspect'],
  [3,3,16,-20,'Restart the descent cage','Wait for its pulse, then engage the lift brake.','pulse'],
  [3,3,0,-27,'Descend below 414','Enter the emergency lift.','travel',4],
  [4,4,-20,14,'Cross the first scan gate','Follow the outer service lane. Cross the short final gap when the beams turn gold.','reach'],
  [4,4,19,-9,'Cross the second scan gate','Follow the service lane around the sweeps. Wait for gold before the final crossing.','reach'],
  [4,4,-15,-25,'Open the engine access','Enter the carrier found upstairs: 4, 1, 4.','code'],
  [4,4,0,26,'Enter the rifle engine','The rifles are connected to something much larger.','travel',5],
  [5,5,-21,15,'Release stabilizer 1/3','Rebuild the 16-segment circuit, then isolate the left collar on gold.','pulse'],
  [5,5,21,4,'Release stabilizer 2/3','Reconnect the second circuit layout, then engage the far-side collar on gold.','pulse'],
  [5,5,-17,-24,'Release stabilizer 3/3','Rebuild the spiral circuit and isolate the final collar on gold.','pulse'],
  [5,5,14,-25,'Extract the 414 rifle case','Take the case from the open extraction cradle.','take'],
  [6,6,0,-10,'Find Sommi','The signal is coming from a living person.','travel',6],
  [6,6,-16,-21,'Open Sommi’s confession','The house recorder and the stolen carrier tell the same story.','dialogue'],
  [6,6,17,22,'Choose the way out','Sommi knows a second route. Keep the rifles and open it together.','travel',7],
  [7,7,-18,12,'Collapse: reach relay A','The shutdown has started. Follow the guide before the purge reaches the case.','reach'],
  [7,7,18,-5,'Collapse: reach relay B','The floor remains solid. Follow the next illuminated relay.','reach'],
  [7,7,-16,-24,'Collapse: release the blast door','Get to the manual door release.','inspect'],
  [7,7,0,27,'Escape with the rifles','Enter the return lift. If the purge catches you, retry from relay A.','travel',8],
  [8,8,-15,-24,'Return the 414 rifles','Put the case back into Maria’s family rack.','return'],
  [8,8,16,-18,'Reconcile the house recorder','Restore the four district panels, then put both accounts on record.','inspect'],
  [9,8,0,24,'Read the remaining signal','One message survived after the engine stopped.','inspect'],
  [9,8,0,27,'Return to Atropa','The rifles are home. The same night now has two accounts.','finish']
 ];
 const CLUES={
 0:['EMPTY RACK','Four open catches. No broken lock. The alarm was disabled before the case moved. Whoever came here knew the house.'],
 1:['HOUSE RECORDER','A familiar figure enters through the front door. The case leaves intact. The image corrupts when its carrier meets a second signal below the floor.'],
 3:['FRAGMENT 1 / 4','First carrier digit recovered: 4. The rifle case answered a receiver farther down the line.'],
 4:['FRAGMENT 2 / 1','Second carrier digit recovered: 1. Someone diverted the return circuit away from the house.'],
 5:['FRAGMENT 3 / 4','Third carrier digit recovered: 4. Complete carrier: 4 → 1 → 4. The marked exit began broadcasting before the case arrived.'],
 7:['THE WRONG EXIT','The door repeats Maria’s voice. Behind it: a blank wall. There is no return cable. The service hatch is the only live route.'],
 8:['SERVICE CONDUIT','The stolen carrier does not leave the building. It goes down. Three emergency relays still have power.'],
 10:['BLACKOUT / MANUAL BUS','Emergency power restored. The city feed stays isolated while you are below. The cage brake is red during its sweep and gold when it can be engaged.'],
 26:['BLAST DOOR / MANUAL RELEASE','The safety interlock has opened. The return lift is at the illuminated end of this corridor. Keep the case with you.'],
 29:['THE SAME NIGHT','SOMMI: “I disabled the alarm, took the case and left. Then the carrier woke up. I followed it because I thought I could fix it before anyone noticed.”\n\nMARIA: “You should have told me.”\n\nSOMMI: “I am telling you now.”'],
 30:['THE SIGNAL REMAINS','No outgoing transmitter remains connected. Yet one message is still arriving: “You returned what was taken. Who returned you?”\n\nMaria saves the entire recording.']
 };
 const LINES=[
  [['MARIA','The house is awake. The rack is empty.'],['HOUSE RECORDER','Local access. No forced entry.'],['MARIA','Then whoever took them knew where to look.']],
  [['MARIA','The recorder rebuilt the route. It crosses the roof.'],['CARRIER 414','Return address interrupted.'],['MARIA','Run all you like. The signal leaves a trail.']],
  [['SYSTEM','Welcome home, Maria.'],['MARIA','That door has no cable.'],['SYSTEM','Please remain where you are.']],
  [['MARIA','Lights out. Fine.'],['EMERGENCY BUS','Manual power only.'],['MARIA','You can switch off the room. You cannot switch off the trail.']],
  [['MARIA','There was always another floor.'],['SUBLEVEL 414','Carrier accepted. Scan cycle live.'],['MARIA','Let’s see what the house was hiding.']],
  [['MARIA','Those are my rifles.'],['RIFLE ENGINE','Four-one-four. Return circuit engaged.'],['MARIA','They are not being stored. They are keeping this thing alive.']],
  [['MARIA','Sommi.'],['SOMMI','I took them. I thought I was borrowing a story.'],['MARIA','You carried the keys straight into the lock.'],['SOMMI','Then let me help you get them out.']],
  [['SYSTEM','Return circuit removed. Purge sequence armed.'],['SOMMI','There’s a way back. Keep moving.'],['MARIA','The case stays with me.']],
  [['MARIA','Back where they belong.'],['SOMMI','I owe your aunt a better explanation than “borrowed”.'],['MARIA','Start with the truth.']],
  [['HOUSE RECORDER','The rack is restored. The carrier is not silent.'],['UNKNOWN SIGNAL','You returned what was taken. Who returned you?'],['MARIA','Keep the recording. Every second.'],['UNKNOWN SIGNAL','RESTORED? NO.']]
 ];
 const S=(c,glow=null)=>new THREE.MeshStandardMaterial({color:c,roughness:.82,metalness:.2,emissive:glow||0,emissiveIntensity:glow?.7:0});
 const BASIC=c=>new THREE.MeshBasicMaterial({color:c});
 const HOUSE_EVIDENCE=[
  {title:'ALARM DISABLED',x:-21,z:14,body:'23:41 / LOCAL SWITCH\nThe alarm was disabled from inside the house. No remote command and no forced entry.'},
  {title:'CASE REMOVED',x:18,z:8,body:'23:43 / RACK LOAD SENSOR\nThe case left its catches intact, two minutes after the alarm was disabled.'},
  {title:'CARRIER WAKES',x:8,z:-25,body:'23:44 / RETURN CIRCUIT\nThe second signal appeared after the case left the rack. It points toward the rooftop receivers.'}
 ];
 const POWER_ROUTES=['MAIN CARRIER','ISOLATED BUS','LIFT LINE','GROUND'];
 const POWER_SWITCHES=[{title:'CARRIER RETURN',x:-21,z:-8,correct:3},{title:'EMERGENCY LIGHTS',x:0,z:6,correct:1},{title:'CAGE BRAKE',x:21,z:11,correct:2}];
 const POWER_MANUAL='Ground the carrier return. Feed emergency lights from the isolated bus. Feed the cage brake from the lift line.\n\nEach nearby rotary switch changes its route when you interact. Return to this breaker to test the circuit.';
 // R5: physical evidence, engine circuits and district restoration.
 const EXIT_PORTS=['VOICE REPLAY','CITY FEED','RIFLE CARRIER','SERVICE LIFT'];
 const EXIT_DESTINATIONS=['HOUSE RETURN','ISOLATED BUS','SUBLEVEL ENGINE','BROADCAST LOOP'];
 const EXIT_ROUTE=[3,1,2,0];
 const EXIT_EVIDENCE=[
  {x:-12,z:-18,title:'VOICE / NO MICROPHONE',body:'The door answers before anyone speaks. Its waveform is identical to the archived welcome message, right down to a clipped breath at the end. There is no live microphone on the far side.\n\nThe voice cable ends at the broadcast loop. A familiar voice is being used as a destination label; it is not evidence that anyone is waiting behind the door.'},
  {x:12,z:-16,title:'POWER / LOCAL SUPPLY',body:'The city feed crosses this floor without entering the marked door. A fuse box separates the supply from the carrier equipment. Its isolation light is still on.\n\nThe power line terminates at the isolated bus. Disconnecting the broadcast cannot turn off this local supply. The emergency lift below should still be reachable if its service route can be found.'},
  {x:-12,z:18,title:'CASE / DOWNWARD LOAD',body:'A fresh groove crosses the cable jacket. It was made by the same case latch recorded upstairs. There is no outgoing load at the false exit: all four rifle channels bend downward together.\n\nThe carrier line terminates at the sublevel engine. The case has never left the building. Someone has hidden the destination by repeating a return code over the wrong door.'},
  {x:12,z:18,title:'LIFT / RETURN ADDRESS',body:'The maintenance plate is older than the voice recorder. Its stamped return address is the family house, and the lift cable continues past the sealed wall through a narrow service chase.\n\nThe service lift terminates at the house return. That is the real way home. Reconstruct the four cable destinations at the conduit console; a copied voice must not be allowed to choose the route.'}
 ];
 const ENGINE_PATHS=[[0,1,2,3,7,6,5,4,8,9,10,11,15,14,13,12],[0,4,8,12,13,9,5,1,2,6,10,14,15,11,7,3],[0,1,2,3,7,11,15,14,13,12,8,4,5,6,10,9]];
 const ENGINE_OUTLETS=[{cell:12,side:4},{cell:3,side:2},{cell:9,side:0}];
 const ENGINE_SEEDS=[[1,3,1,2,2,1,3,1,1,2,1,3,3,1,2,1],[3,1,2,1,1,3,1,2,2,1,3,1,1,2,1,3],[1,2,3,1,3,1,2,1,1,3,1,2,2,1,3,1]];
 const DISTRICTS=[{name:'HOMES',x:-12,z:14},{name:'CLINIC',x:-12,z:-14},{name:'WORKSHOP',x:12,z:14},{name:'TRANSIT',x:12,z:-14}];
 const DISTRICT_SEEDS=[[0,3,7,10,14,18,21,24],[1,4,6,9,11,15,17,20,23],[0,2,5,8,12,13,16,19,22,24],[1,3,6,7,10,14,17,18,21,23]];
 function turnMask(mask,turn){for(let n=0;n<turn;n++)mask=((mask<<1)&15)|(mask>>3);return mask;}
 function engineMasks(stage){
  const masks=Array(16).fill(0),path=ENGINE_PATHS[stage];
  const direction=(a,b)=>b===a-4?1:b===a+1?2:b===a+4?4:8;
  path.forEach((cell,i)=>{if(i)masks[cell]|=direction(cell,path[i-1]);if(i<path.length-1)masks[cell]|=direction(cell,path[i+1]);});
  masks[0]|=8;masks[ENGINE_OUTLETS[stage].cell]|=ENGINE_OUTLETS[stage].side;return masks;
 }
 function engineFlow(stage,turns){
  const masks=engineMasks(stage).map((mask,i)=>turnMask(mask,turns[i])),visited=new Set(),queue=[];
  if(masks[0]&8){visited.add(0);queue.push(0);}let leaks=0;
  while(queue.length){const cell=queue.shift(),row=Math.floor(cell/4),col=cell%4;
   for(const [side,opposite,dr,dc]of [[1,4,-1,0],[2,8,0,1],[4,1,1,0],[8,2,0,-1]])if(masks[cell]&side){
    const rr=row+dr,cc=col+dc,out=ENGINE_OUTLETS[stage];
    if(rr<0||rr>=4||cc<0||cc>=4){if(!(cell===0&&side===8)&&!(cell===out.cell&&side===out.side))leaks++;continue;}
    const next=rr*4+cc;if(!(masks[next]&opposite)){leaks++;continue;}if(!visited.has(next)){visited.add(next);queue.push(next);}
   }
  }
  const out=ENGINE_OUTLETS[stage],solved=visited.size===16&&leaks===0&&visited.has(out.cell)&&(!out.side||!!(masks[out.cell]&out.side));
  return {masks,visited,leaks,solved};
 }
 function flipDistrict(board,cell){const row=Math.floor(cell/5),col=cell%5;for(const [dr,dc]of [[0,0],[-1,0],[0,1],[1,0],[0,-1]]){const r=row+dr,c=col+dc;if(r>=0&&r<5&&c>=0&&c<5)board[r*5+c]^=1;}return board;}
 function districtSeed(i){const board=Array(25).fill(1);for(const cell of DISTRICT_SEEDS[i])flipDistrict(board,cell);return board;}
 function districtSolution(board){
  const rows=Array.from({length:25},(_,cell)=>{let mask=(1-board[cell])<<25;const row=Math.floor(cell/5),col=cell%5;for(const [dr,dc]of [[0,0],[-1,0],[0,1],[1,0],[0,-1]]){const r=row+dr,c=col+dc;if(r>=0&&r<5&&c>=0&&c<5)mask|=1<<(r*5+c);}return mask;});
  const pivots=[];let rank=0;
  for(let col=0;col<25;col++){const hit=rows.findIndex((mask,i)=>i>=rank&&!!(mask&(1<<col)));if(hit<0)continue;[rows[rank],rows[hit]]=[rows[hit],rows[rank]];for(let r=0;r<25;r++)if(r!==rank&&(rows[r]&(1<<col)))rows[r]^=rows[rank];pivots.push(col);rank++;}
  if(rows.some(mask=>(mask&0x1ffffff)===0&&!!(mask&(1<<25))))return null;
  return pivots.filter((_,r)=>!!(rows[r]&(1<<25)));
 }
 function freshDepth(){return {exit:{collected:[],routes:[0,0,0,0],solved:false},engine:{turns:ENGINE_SEEDS.map(a=>a.slice()),solved:[false,false,false]},district:{boards:DISTRICTS.map((_,i)=>districtSeed(i)),done:[false,false,false,false]}};}
 function normalizeDepth(p,step){
  const d=freshDepth(),ints=(a,n,max,fallback)=>Array.from({length:n},(_,i)=>Number.isInteger(a?.[i])&&a[i]>=0&&a[i]<=max?a[i]:fallback[i]);
  d.exit.collected=step>8?[0,1,2,3]:Array.isArray(p?.exit?.collected)?[...new Set(p.exit.collected.filter(n=>Number.isInteger(n)&&n>=0&&n<4))]:[];
  d.exit.routes=step>8?EXIT_ROUTE.slice():ints(p?.exit?.routes,4,3,d.exit.routes);d.exit.solved=step>8||(p?.exit?.solved===true&&d.exit.collected.length===4&&d.exit.routes.every((v,i)=>v===EXIT_ROUTE[i]));
  for(let i=0;i<3;i++){d.engine.turns[i]=step>17+i?Array(16).fill(0):ints(p?.engine?.turns?.[i],16,3,d.engine.turns[i]);d.engine.solved[i]=step>17+i||(p?.engine?.solved?.[i]===true&&engineFlow(i,d.engine.turns[i]).solved);}
  for(let i=0;i<4;i++){const b=p?.district?.boards?.[i];d.district.boards[i]=step>29?Array(25).fill(1):Array.isArray(b)&&b.length===25&&b.every(x=>x===0||x===1)&&districtSolution(b)!==null?b.slice():d.district.boards[i];d.district.done[i]=step>29||(p?.district?.done?.[i]===true&&d.district.boards[i].every(x=>x===1));}
  return d;
 }
 function depthNodes(game){
  const w=game.maria414World,q=read();if(!w.depthMeshes)w.depthMeshes=new Map();
  if(q.step!==8&&q.step!==29)return [];
  const defs=q.step===8?EXIT_EVIDENCE:DISTRICTS,room=getRoom(game,q.step===8?2:8);
  return defs.map((d,index)=>{const key=q.step+':'+index;if(w.depthMeshes.has(key))return w.depthMeshes.get(key);
   const root=new THREE.Group();root.name='maria414-depth-'+key;root.position.set(d.x,0,d.z);room.root.add(root);
   box(root,2.1,1.5,1.8,S('#26384b'),0,.75);const marker=box(root,.28,.28,.28,BASIC('#79becb'),0,1.8);
   const label=textPanel(root,q.step===8?d.title:'DISTRICT / '+d.name,q.step===8?'CABLE EVIDENCE / LOCAL TRACE':'RESTORE EVERY NODE / NEIGHBOUR RELAYS',0,3,.9,5,2.2);
   const lamps=[];if(q.step===29)for(let n=0;n<25;n++)lamps.push(box(root,.19,.19,.1,BASIC('#263747'),-.6+(n%5)*.3,2.15-Math.floor(n/5)*.3,.98));
   const it={id:'maria414-depth-'+q.step+'-'+index,pos:point(room.i,d.x,0,d.z),radius:3.4,prompt:()=>q.step===8?'E — '+d.title+' · trace cable':'E — '+d.name+' · restoration panel'};
   const nd={root,it,marker,label,lamps,index,step:q.step};w.depthMeshes.set(key,nd);game.interactables.push(it);return nd;
  });
 }
 function updateDepthNodes(game){
  const w=game.maria414World,q=read();depthNodes(game);
  for(const nd of w.depthMeshes?.values()||[]){nd.root.visible=w.inside&&!w.replaying&&q.step===nd.step;
   const done=nd.step===8?q.puzzles.exit.collected.includes(nd.index):q.puzzles.district.done[nd.index];nd.marker.material.color.set(done?'#79d7a0':'#f4c976');
   for(let i=0;i<nd.lamps.length;i++)nd.lamps[i].material.color.set(q.puzzles.district.boards[nd.index][i]?'#79d7c7':'#263747');
  }
 }
 function depthNext(game){
  const q=read(),nds=depthNodes(game),unfinished=nds.filter(nd=>q.step===8?!q.puzzles.exit.collected.includes(nd.index):!q.puzzles.district.done[nd.index]);
  if(unfinished.length)return unfinished.reduce((a,b)=>game.playerPos.distanceTo(a.it.pos)<game.playerPos.distanceTo(b.it.pos)?a:b).it;return null;
 }
 function depthHint(){const q=read();if(q.step===8)return `CABLE EVIDENCE · ${q.puzzles.exit.collected.length}/4 · ${q.puzzles.exit.solved?'ROUTE RECONSTRUCTED':'CONDUIT UNRESOLVED'}`;if(q.step>=17&&q.step<=19){const i=q.step-17,flow=engineFlow(i,q.puzzles.engine.turns[i]);return `STABILIZER ${i+1} · ${flow.visited.size}/16 CONNECTED · ${q.puzzles.engine.solved[i]?'ISOLATED / WAIT FOR GOLD':'REBUILD THE CIRCUIT'}`;}if(q.step===29)return `DISTRICT RETURN · ${q.puzzles.district.done.filter(Boolean).length}/4 RESTORED`;return null;}
 function depthButton(card,label,handler){const b=document.createElement('button');b.textContent=label;b.style.cssText='width:100%;min-height:44px;margin-top:8px;padding:10px;background:#182c40;border:1px solid #536f82;color:#ecf5fa;font:bold 12px Arial;touch-action:manipulation';b.onclick=handler;card.insertBefore(b,card.children[card.children.length-1]);return b;}
 function cableConsole(game){
  const q=read();if(q.puzzles.exit.collected.length<4){dialog(game,'CONDUIT / MISSING TRACES','The copied door voice is one cable, not the whole route. Read the four physical cable plates around this floor, then match each line to its actual destination. Your recorded evidence is retained.',[['FOLLOW THE CABLE PLATES',()=>closeDialog(game)]]);return;}
  dialog(game,'CONDUIT / RECONSTRUCT THE ROUTE','Match each cable to the destination established by its plate. Press a row to change its destination. Wrong tests keep the current settings.',[]);
  const el=game.maria414Dialog,card=el.children[0],buttons=[],feedback=document.getElementById('maria414-feedback');
  const render=()=>buttons.forEach((b,i)=>b.textContent=EXIT_PORTS[i]+' → '+EXIT_DESTINATIONS[read().puzzles.exit.routes[i]]);
  for(let i=0;i<4;i++){const b=depthButton(card,'',()=>{if(game.maria414Dialog!==el||read().step!==8)return;const q=read();q.puzzles.exit.routes[i]=(q.puzzles.exit.routes[i]+1)%4;write(q);render();});b.dataset.depthRoute=String(i);buttons.push(b);}
  let hintIndex=0;depthButton(card,'OPTIONAL HELP / REVEAL A ROUTE',()=>{if(game.maria414Dialog!==el||read().step!==8)return;const i=hintIndex++%4;feedback.textContent='Help '+(i+1)+'/4: '+EXIT_PORTS[i]+' connects to '+EXIT_DESTINATIONS[EXIT_ROUTE[i]]+'.';});
  depthButton(card,'TEST LIVE ROUTE',()=>{if(game.maria414Dialog!==el||read().step!==8)return;const q=read();if(!q.puzzles.exit.routes.every((v,i)=>v===EXIT_ROUTE[i])){feedback.textContent='Route rejected. Check the four recorded cable destinations. Your settings are retained.';game.sfx?.burn?.();return;}q.puzzles.exit.solved=true;write(q);closeDialog(game);refresh();Quests.toast('LIVE SERVICE ROUTE RECONSTRUCTED · return to the conduit to open it.');});render();
 }
 function pipeSVG(mask,color){let lines='';for(const [bit,x,y]of [[1,50,0],[2,100,50],[4,50,100],[8,0,50]])if(mask&bit)lines+=`<path d="M50 50 L${x} ${y}"/>`;return `<svg viewBox="0 0 100 100" style="width:100%;height:100%;max-height:62px" aria-hidden="true"><g fill="none" stroke="${color}" stroke-width="15" stroke-linecap="round">${lines}</g><circle cx="50" cy="50" r="10" fill="${color}"/></svg>`;}
 function engineConsole(game,stage){
  const step=17+stage,out=ENGINE_OUTLETS[stage];dialog(game,'STABILIZER '+(stage+1)+' / COLD CIRCUIT','Rotate the segments to connect every tile. Feed enters A1 from the left. '+(out.side?'Return exits '+String.fromCharCode(65+out.cell%4)+(Math.floor(out.cell/4)+1)+(out.side===4?' at the bottom.':' on the right.'):'The central receiver at B3 is the return.')+' Cyan marks connected tiles. Repair all open links before isolating the collar.',[]);
  const el=game.maria414Dialog,card=el.children[0],feedback=document.getElementById('maria414-feedback'),grid=document.createElement('div'),cells=[];
  grid.style.cssText='display:grid;grid-template-columns:repeat(4,minmax(44px,1fr));gap:5px;margin:12px 0';card.insertBefore(grid,feedback);
  let commit;const render=()=>{const flow=engineFlow(stage,read().puzzles.engine.turns[stage]);cells.forEach((b,i)=>{b.innerHTML='<span style="position:absolute;left:5px;top:3px;font:9px Arial;color:#9bb9c6">'+String.fromCharCode(65+i%4)+(Math.floor(i/4)+1)+'</span>'+pipeSVG(flow.masks[i],flow.visited.has(i)?'#78dbc9':'#8eabb8');b.setAttribute('aria-label','Rotate '+String.fromCharCode(65+i%4)+(Math.floor(i/4)+1));});feedback.textContent=flow.visited.size?`${flow.visited.size}/16 connected · ${flow.leaks} open links`:'Feed disconnected · rotate A1 to open the left inlet.';if(commit){commit.disabled=!flow.solved;commit.style.opacity=flow.solved?'1':'.45';}};
  for(let i=0;i<16;i++){const b=document.createElement('button');b.dataset.depthCell=String(i);b.style.cssText='position:relative;min-height:58px;padding:5px;background:#102333;border:1px solid #3c6573;border-radius:3px;touch-action:manipulation';b.onclick=()=>{if(game.maria414Dialog!==el||read().step!==step)return;const q=read();q.puzzles.engine.turns[stage][i]=(q.puzzles.engine.turns[stage][i]+1)%4;write(q);render();};grid.append(b);cells.push(b);}
  depthButton(card,'OPTIONAL HELP / NEXT CORRECT TILE',()=>{const q=read(),flow=engineFlow(stage,q.puzzles.engine.turns[stage]);if(flow.solved){feedback.textContent='All links are connected. Isolate the circuit.';return;}const base=engineMasks(stage),i=flow.masks.findIndex((mask,i)=>mask!==base[i]);if(i>=0){const names=[[1,'NORTH'],[2,'EAST'],[4,'SOUTH'],[8,'WEST']].filter(([bit])=>base[i]&bit).map(([,name])=>name);feedback.textContent='Blueprint: '+String.fromCharCode(65+i%4)+(Math.floor(i/4)+1)+' connects '+names.join(' / ')+'.';}});
  commit=depthButton(card,'ISOLATE CIRCUIT',()=>{if(game.maria414Dialog!==el||read().step!==step)return;const q=read();if(!engineFlow(stage,q.puzzles.engine.turns[stage]).solved){feedback.textContent='Open links remain. Your rotated segments are retained.';return;}q.puzzles.engine.solved[stage]=true;write(q);closeDialog(game);refresh();game.sfx?.win?.();Quests.toast('CIRCUIT ISOLATED · engage the stabilizer when its indicator is gold.');});render();
 }
 function districtConsole(game,index){
  if(read().puzzles.district.done[index]){dialog(game,DISTRICTS[index].name+' / RESTORED','Every node in this district is live. Its repair is recorded. Continue with the other districts, then return to the house recorder.',[['CONTINUE RESTORATION',()=>closeDialog(game)]]);return;}
  dialog(game,DISTRICTS[index].name+' / RETURN GRID','Restore all 25 nodes. Pressing a node flips it and its immediate neighbours. Cyan is live; dark is offline. Every change is saved. Work down the rows, or request a repair hint when you need one.',[]);
  const el=game.maria414Dialog,card=el.children[0],feedback=document.getElementById('maria414-feedback'),grid=document.createElement('div'),cells=[];let commit;
  grid.style.cssText='display:grid;grid-template-columns:repeat(5,minmax(44px,1fr));gap:4px;margin:12px 0';card.insertBefore(grid,feedback);
  const render=()=>{const board=read().puzzles.district.boards[index];cells.forEach((b,i)=>{b.style.background=board[i]?'#236c67':'#112533';b.style.color=board[i]?'#d9fff3':'#8ba5b3';b.textContent=String.fromCharCode(65+i%5)+(Math.floor(i/5)+1);b.setAttribute('aria-label',b.textContent+(board[i]?' live':' offline'));});feedback.textContent=board.filter(Boolean).length+'/25 live';if(commit){commit.disabled=!board.every(Boolean);commit.style.opacity=board.every(Boolean)?'1':'.45';}updateDepthNodes(game);};
  for(let i=0;i<25;i++){const b=document.createElement('button');b.dataset.depthCell=String(i);b.style.cssText='min-height:44px;padding:0;border:1px solid #517d87;border-radius:3px;font:bold 11px Arial;touch-action:manipulation';b.onclick=()=>{if(game.maria414Dialog!==el||read().step!==29)return;const q=read();flipDistrict(q.puzzles.district.boards[index],i);write(q);render();};grid.append(b);cells.push(b);}
  depthButton(card,'OPTIONAL HELP / NEXT CORRECT MOVE',()=>{const solution=districtSolution(read().puzzles.district.boards[index]);feedback.textContent=solution?.length?'Try '+String.fromCharCode(65+solution[0]%5)+(Math.floor(solution[0]/5)+1)+' next. It is one step in a complete repair.':'Every node is live. Commit this district.';});
  commit=depthButton(card,'RESTORE DISTRICT',()=>{if(game.maria414Dialog!==el||read().step!==29)return;const q=read();if(!q.puzzles.district.boards[index].every(Boolean)){feedback.textContent='Offline nodes remain. Your current repair is retained.';return;}q.puzzles.district.done[index]=true;write(q);closeDialog(game);updateDepthNodes(game);refresh();game.sfx?.win?.();Quests.toast(DISTRICTS[index].name+' RESTORED · '+q.puzzles.district.done.filter(Boolean).length+'/4 districts');});render();
 }
 function depthInteract(game,it){
  const nd=[...game.maria414World.depthMeshes?.values()||[]].find(nd=>nd.it.id===it.id),q=read();if(!nd||nd.step!==q.step||!game.maria414Inside||game.maria414Cine||game.maria414Dialog||q.complete||game.playerPos.distanceTo(nd.it.pos)>it.radius+.3)return true;
  if(nd.step===8){const d=EXIT_EVIDENCE[nd.index];dialog(game,d.title,d.body,[[q.puzzles.exit.collected.includes(nd.index)?'EVIDENCE RECORDED':'RECORD CABLE EVIDENCE',()=>{const q=read();q.puzzles.exit.collected=[...new Set([...q.puzzles.exit.collected,nd.index])];write(q);closeDialog(game);updateDepthNodes(game);refresh();}]]);}else districtConsole(game,nd.index);return true;
 }
 function depthObjective(game,index){
  const q=read();if(index===8&&!q.puzzles.exit.solved){cableConsole(game);return true;}
  if(index>=17&&index<=19&&!q.puzzles.engine.solved[index-17]){engineConsole(game,index-17);return true;}
  if(index===29&&!q.puzzles.district.done.every(Boolean)){dialog(game,'HOUSE RETURN / FOUR DISTRICTS OFFLINE','The rifles are home, but the return circuits are fragmented. Repair the four district panels around the reconstruction table. Completed districts stay restored; partial repairs survive leaving and reloading.',[['FOLLOW THE DISTRICT PANELS',()=>closeDialog(game)]]);return true;}return false;
 }

 function box(g,w,h,d,m,x=0,y=0,z=0){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.receiveShadow=true;g.add(mesh);return mesh;}
 function textPanel(g,title,body,x,y,z,w=8,h=3){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#07111c';ctx.fillRect(0,0,1024,512);
  ctx.fillStyle='#f4c976';ctx.font='bold 54px Arial';ctx.fillText(title,48,90);
  ctx.fillStyle='#d6e8f1';ctx.font='35px Arial';let yy=166,line='';
  for(const word of body.split(' ')){const next=line+word+' ';if(ctx.measureText(next).width>920){ctx.fillText(line,48,yy);yy+=49;line=word+' ';}else line=next;}ctx.fillText(line,48,yy);
  ctx.fillStyle='#70bfc4';ctx.font='24px monospace';ctx.fillText('414 / LOCAL ARCHIVE',48,465);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));mesh.position.set(x,y,z);g.add(mesh);return mesh;
 }
 function rifle(g,x,y,z){
  const r=new THREE.Group();r.position.set(x,y,z);g.add(r);const steel=S('#6b7785'),dark=S('#101923');
  box(r,2.8,.22,.2,dark);box(r,1.2,.09,.09,steel,1.7,.05);box(r,.2,.65,.18,dark,-.4,-.34);box(r,.23,.6,.16,steel,.2,-.29);box(r,.8,.3,.22,dark,-1.6);box(r,.58,.08,.12,steel,.2,.22);
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,1.15,10),steel);barrel.rotation.z=Math.PI/2;barrel.position.set(1.8,.045,0);r.add(barrel);
  box(r,.4,.17,.19,steel,2.3,.04);box(r,.34,.09,.12,S('#8c7660'),-.2,.16);box(r,.1,.3,.12,steel,-.56,-.32).rotation.z=-.35;
  for(let n=0;n<8;n++)box(r,.04,.24,.21,steel,.65+n*.1,0);return r;
 }
 function ring(g,r,y,z,color){const mesh=new THREE.Mesh(new THREE.TorusGeometry(r,.14,8,64),BASIC(color));mesh.position.set(0,y,z);g.add(mesh);return mesh;}
 // Original 414 art direction: inherited brass/stone above, a fractured return machine below.
 // Repeated architectural details are instanced. No downloaded textures, bloom passes or
 // scene-global renderer settings: these streamed rooms remain independent of the city.
 const STYLES=[
  ['#171820','#29202a','#776351','#f5c78b','#79aaa8'],
  ['#141f30','#182d45','#617689','#8cc9eb','#edba81'],
  ['#20202d','#35303d','#93816e','#ffe2ae','#c9a3ec'],
  ['#131c20','#16292c','#697676','#ee9e54','#67a89f'],
  ['#15202a','#203545','#5c788a','#84d8e1','#e0b477'],
  ['#141424','#282236','#807159','#efbd81','#9e9ced'],
  ['#202225','#323136','#8d7e65','#efd4a7','#81bfb4'],
  ['#1d1821','#2d2530','#74636a','#ed7652','#e5bb79'],
  ['#202025','#302731','#99806a','#ffdaa1','#91c7b6']
 ];
 function surface(color,kind='stone'){
  const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
  x.fillStyle=color;x.fillRect(0,0,256,256);
  for(let n=0;n<64;n++){const a=(n*73+19)%256,b=(n*47+11)%256;
   x.strokeStyle=n%3?'rgba(255,255,255,.045)':'rgba(0,0,0,.16)';x.lineWidth=kind==='metal'?1:2;x.beginPath();x.moveTo(a,b);
   x.lineTo(kind==='metal'?a:((a+83)%256),kind==='metal'?256:((b+29)%256));x.stroke();
  }
  x.strokeStyle='rgba(0,0,0,.3)';x.lineWidth=3;x.strokeRect(3,3,250,250);
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({color:'#ffffff',map,roughness:kind==='metal'?.34:.64,metalness:kind==='metal'?.72:.26});
 }
 function batch(g,material,parts,name){
  if(!parts.length)return null;
  const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material,parts.length),o=new THREE.Object3D();mesh.name=name||'414-architectural-detail';
  parts.forEach((p,i)=>{o.position.set(p[3]||0,p[4]||0,p[5]||0);o.scale.set(p[0],p[1],p[2]);o.rotation.set(0,p[7]||0,p[6]||0);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);});
  mesh.receiveShadow=true;g.add(mesh);return mesh;
 }
 function arch(g,width,rise,spring,z,material,name){
  const p=[],n=22;for(let j=0;j<n;j++){
   const a=j/n*Math.PI,b=(j+1)/n*Math.PI,x1=Math.cos(a)*width/2,y1=spring+Math.sin(a)*rise,x2=Math.cos(b)*width/2,y2=spring+Math.sin(b)*rise;
   p.push([Math.hypot(x2-x1,y2-y1)+.08,.34,.48,(x1+x2)/2,(y1+y2)/2,z,Math.atan2(y2-y1,x2-x1)]);
  }
  p.push([.6,spring,.8,-width/2,spring/2,z],[.6,spring,.8,width/2,spring/2,z]);return batch(g,material,p,name||'414-vault-arch');
 }
 function glow(room,x,y,z,width,height,color,rotation=0){
  if(!room.glowMap){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),grad=ctx.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'rgba(255,255,255,.55)');grad.addColorStop(.3,'rgba(255,255,255,.18)');grad.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);room.glowMap=new THREE.CanvasTexture(c);}
  const m=new THREE.MeshBasicMaterial({map:room.glowMap,color,transparent:true,opacity:.55,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}),mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),m);
  mesh.position.set(x,y,z);mesh.rotation.y=rotation;room.root.add(mesh);return mesh;
 }
 function conduit(g,a,b,r,material){
  const delta=V(...b).sub(V(...a)),length=delta.length(),mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,length,8),material);
  mesh.position.set(...a.map((v,i)=>(v+b[i])/2));
  mesh.quaternion.setFromUnitVectors(V(0,1,0),delta.normalize());g.add(mesh);return mesh;
 }
 function seal(room,x,z,r,label,color){
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');
  ctx.clearRect(0,0,512,512);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=3;
  for(const rr of [203,219,239]){ctx.beginPath();ctx.arc(256,256,rr,0,Math.PI*2);ctx.stroke();}
  for(let n=0;n<48;n++){const a=n/48*Math.PI*2;ctx.beginPath();ctx.moveTo(256+Math.cos(a)*222,256+Math.sin(a)*222);ctx.lineTo(256+Math.cos(a)*(n%4?231:239),256+Math.sin(a)*(n%4?231:239));ctx.stroke();}
  ctx.textAlign='center';ctx.font='600 138px Georgia';ctx.fillText('414',256,291);ctx.font='17px Arial';ctx.fillText(label,256,340);
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(r*2,r*2),new THREE.MeshBasicMaterial({map,transparent:true,opacity:.36,depthWrite:false}));mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.048,z);room.root.add(mesh);return mesh;
 }
 function motes(room,color,count=34){
  const mesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.045,0),BASIC(color),count);mesh.name='414-airborne-memory';room.root.add(mesh);
  room.dust={mesh,count,dummy:new THREE.Object3D()};
 }
 function energySkin(room){
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},power:{value:1}},
   vertexShader:'varying vec3 p; varying vec3 n; varying vec3 eye; void main(){p=position;n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);eye=-mv.xyz;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform float time;uniform float power;varying vec3 p;varying vec3 n;varying vec3 eye;void main(){float rim=pow(1.0-abs(dot(normalize(n),normalize(eye))),2.2);float flow=sin(p.y*8.0+sin(p.x*3.0+time)*1.7-time*2.0);float lattice=pow(max(0.0,sin(p.x*11.0+p.z*9.0-time*.8)*sin(p.y*12.0+time)),6.0);vec3 blue=vec3(.32,.65,.92);vec3 gold=vec3(1.0,.55,.19);vec3 col=mix(blue,gold,.5+.5*sin(p.y*.9-time*.45));gl_FragColor=vec4(col*(.65+rim+abs(flow)*.22),power*(.1+rim*.65+lattice*.18));}'});
  const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(3.6,3),material);mesh.position.set(0,8,-2);mesh.name='414-living-carrier-surface';room.root.add(mesh);room.plasma=mesh;
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.26,.5,19,12,1,true),new THREE.MeshBasicMaterial({color:'#ffe8be',transparent:true,opacity:.52,depthWrite:false,blending:THREE.AdditiveBlending}));beam.position.set(0,11,-2);room.root.add(beam);room.engineBeam=beam;
 }
 function horizon(room){
  const g=room.root;
  // The host's transparent cosmos layer otherwise draws over the opaque new horizon.
  // Only this room-local copy is hidden; leaving restores the untouched native city sky.
  if(room.sky)room.sky.visible=false;
  const sky=new THREE.Mesh(new THREE.SphereGeometry(245,28,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{time:{value:0}},
   vertexShader:'varying vec3 direction;void main(){direction=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
   fragmentShader:'uniform float time;varying vec3 direction;void main(){vec3 d=normalize(direction);float h=max(0.0,d.y);vec3 col=mix(vec3(.11,.18,.25),vec3(.008,.017,.055),smoothstep(0.0,.65,h));float ribbon=exp(-abs(d.y-.20-.035*sin(d.x*9.0+time*.03)-.03*sin(d.z*7.0))*31.0)*smoothstep(.0,.14,h);col+=ribbon*vec3(.12,.16,.18);gl_FragColor=vec4(col,1.0);}'}));sky.name='414-original-night-horizon';g.add(sky);room.horizon=sky;
  const stars=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.18,0),BASIC('#c1cfdf'),120),dummy=new THREE.Object3D();stars.name='414-distant-star-field';
  for(let n=0;n<120;n++){const a=n*2.39996,y=45+(n*47%155),r=Math.sqrt(235*235-y*y);dummy.position.set(Math.cos(a)*r,y,Math.sin(a)*r);dummy.scale.setScalar(n%7?.6:1.3);dummy.updateMatrix();stars.setMatrixAt(n,dummy.matrix);}g.add(stars);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(14,24,16),BASIC('#c8bcb0'));moon.position.set(-66,63,-179);g.add(moon);
  const eclipse=new THREE.Mesh(new THREE.SphereGeometry(13.5,24,16),BASIC('#0a1830'));eclipse.position.set(-62,64,-172);g.add(eclipse);glow(room,-66,63,-182,55,55,'#a7c5cd');
 }
 function architecture(room){
  const g=room.root,i=room.i,c=STYLES[i],p=room.palette={stone:surface(c[1]),metal:surface(c[2],'metal'),dark:S(c[0]),warm:BASIC(c[3]),cool:BASIC(c[4])};
  const rim=[],lights=[],panels=[],floor=[],relief=[];
  // Deep perimeter bays create a lit silhouette. Interiors keep a continuous ground plane
  // and a cutaway ceiling; nothing new blocks the native service lanes or character walk.
  for(const side of [-1,1])for(let z=-28;z<=28;z+=8){
   panels.push([.12,room.wallHeight-2,7.5,side*27.65,room.wallHeight/2,z]);
   rim.push([.22,room.wallHeight-.8,.32,side*27.25,room.wallHeight/2,z-3.8]);
   lights.push([.12,8,.14,side*27,5,z-3.55]);
   for(let n=0;n<6;n++){relief.push([.06,5.8,.06,side*27.35,8,z-2.5+n]);relief.push([.06,.06,6,side*27.35,5+n,z]);}
  }
  if(i!==1){batch(g,p.stone,panels,'414-recessed-wall-bays');batch(g,p.metal,rim,'414-wall-ribs');batch(g,p.warm,lights,'414-practical-wall-lights');batch(g,p.metal,relief,'414-wall-relief');}
  for(let x=-24;x<=24;x+=8)for(let z=-28;z<=28;z+=8)floor.push([7.8,.022,7.8,x,.012,z]);
  batch(g,surface(c[0]),floor,'414-inlaid-stone-floor');
  const inlay=[];for(const x of [-25.5,25.5])inlay.push([.08,.012,65,x,.038,0]);for(const z of [-32,32])inlay.push([51,.012,.08,0,.038,z]);batch(g,p.metal,inlay,'414-brass-floor-inlay');
  const family=i===0||i===8;
  if(family){
   for(const z of [-29,-13,3,19]){arch(g,51,7,11,z,p.metal);arch(g,49.6,6.5,11,z-.4,p.warm,'414-archive-arch-light');}
   const cases=[],spines=[],backs=[];
   for(const side of [-1,1])for(const z of [-24,-8,8,24]){
    cases.push([3.1,8,5.8,side*25.1,4,z]);backs.push([.12,6.9,5.2,side*23.49,4,z]);
    for(let row=0;row<5;row++){cases.push([3.4,.12,6,side*25,1+row*1.35,z]);for(let n=0;n<16;n++)spines.push([.24,.72+(n%4)*.1,.22,side*23.3,1.55+row*1.35,z-2.4+n*.3]);}
   }
   batch(g,p.dark,cases,'414-family-memory-cabinets');batch(g,p.stone,backs,'414-cabinet-recesses');batch(g,p.metal,spines,'414-archived-memory-spines');
   for(const x of [-15,15]){arch(g,13,3.1,6.4,-28,p.metal,'414-family-vault-surround').position.x=x;glow(room,x,6,-27.8,17,12,c[3]);}
   for(const x of [-20,20]){const lamp=new THREE.Mesh(new THREE.CylinderGeometry(.75,1.2,.7,12),p.metal);lamp.position.set(x,6.3,20);g.add(lamp);box(g,.12,6,.12,p.metal,x,3,20);box(g,1,.08,1,p.warm,x,6,20);glow(room,x,6,19.8,6,6,c[3]);}
   seal(room,0,22,6,'FAMILY / LOCAL ARCHIVE',c[3]);motes(room,c[3],28);
   const mount=[],channels=[];for(let n=0;n<4;n++){channels.push([9,.53,.08,-15,2.1+n*.95,-26.69]);for(const x of [-17,-13]){mount.push([.2,.3,.36,x,2.1+n*.95,-26.4]);mount.push([.38,.08,.38,x,2+n*.95,-26.34]);}}
   batch(g,p.dark,channels,'414-recessed-rifle-channels');batch(g,p.metal,mount,'414-machined-rifle-catches');
  }else if(i===1){
   horizon(room);
   const vents=[],slats=[];for(const side of [-1,1])for(const z of [-25,-9,8,25]){vents.push([4,1.7,5,side*25,.85,z]);for(let n=0;n<12;n++)slats.push([3.8,.06,.1,side*25,1.73,z-2+n*.34]);}
   batch(g,p.dark,vents,'414-rooftop-plant');batch(g,p.metal,slats,'414-vent-louvres');
   for(const x of [-25,25])for(const z of [-30,29]){conduit(g,[x,0,z],[x,11,z],.12,p.metal);conduit(g,[x-2,8,z],[x+2,8,z],.08,p.metal);for(let n=0;n<3;n++)box(g,2.4,.06,.09,p.cool,x,9+n*.7,z);}
   const circuit=[];for(const z of [-26,-10,6,22])circuit.push([42,.025,.05,0,.035,z]);for(const x of [-21,0,21])circuit.push([.05,.025,56,x,.035,0]);batch(g,p.cool,circuit,'414-rooftop-signal-traces');
   motes(room,c[4],28);
  }else if(i===2){
   for(const z of [-29,-16,-3,10,23]){arch(g,49,10,9,z,p.metal,'414-copied-archive-ribs');arch(g,47.5,9.5,9,z-.25,p.warm,'414-false-welcome-light');}
   const facade=[],fractures=[];for(let n=0;n<14;n++){const x=-12+(n%7)*4,y=6+Math.floor(n/7)*7;facade.push([3.6,6.5,.35,x,y,-29.5,n%2?.045:-.04]);fractures.push([.09,6.3,.12,x+1.8,y,-29.1,n%2?.045:-.04]);}
   batch(g,p.stone,facade,'414-sealed-return-wall');batch(g,p.cool,fractures,'414-fractured-exit-lines');
   arch(g,15,5,9,-27.7,p.warm,'414-deceptive-portal');glow(room,0,9,-27.5,26,24,c[3]);seal(room,0,1,9,'RETURN / ADDRESS NOT FOUND',c[3]);
   for(let n=0;n<4;n++){const r=ring(g,8+n*2,10+n*.5,-29,c[4]);r.rotation.y=.12*n;room.animated.push({mesh:r,axis:'z',speed:(n%2?1:-1)*.035});}
   motes(room,c[4],36);
  }else if(i===3){
   const banks=[],fins=[],power=[];for(const side of [-1,1])for(const z of [-25,-10,5,20]){
    banks.push([7,12,5,side*23,6,z]);for(let n=0;n<9;n++){fins.push([7.2,.16,5.2,side*23,1+n*1.2,z]);power.push([.06,.44,.09,side*19.35,1.5+n*1.2,z+2.65]);}
    for(const xoff of [-2,2])conduit(g,[side*23+xoff,12,z],[side*23+xoff,17,z],.24,p.metal);
   }
   batch(g,p.dark,banks,'414-emergency-capacitor-banks');batch(g,p.metal,fins,'414-capacitor-cooling-fins');room.busGlow=batch(g,p.warm,power,'414-manual-bus-indicators');
   for(const z of [-26,-10,6,22])arch(g,40,5,12,z,p.metal,'414-power-vault');
   for(const x of [-8,8])conduit(g,[x,1,-30],[x,13,-30],.35,p.metal);
   for(let j=0;j<3;j++){const r=ring(g,7.5+j*.7,7,-30+j*.15,c[3]);r.material.color.set(j?'#513c28':c[3]);}
   const cables=[];for(let n=0;n<6;n++)cables.push([.19,.18,64,-12+n*4,16,0]);batch(g,p.metal,cables,'414-overhead-bus-manifold');
   seal(room,0,19,5,'EMERGENCY / MANUAL BUS',c[3]);motes(room,c[3],18);
  }else if(i===4){
   for(const z of [-28,-20,-12,-4,4,12,20,28]){arch(g,43,6,9,z,p.metal,'414-scan-vault');arch(g,41.5,5.6,9,z-.18,p.cool,'414-scan-rib-light');}
   const stripes=[],route=[];for(const side of [-1,1])for(let z=-30;z<=30;z+=4){stripes.push([1.7,.025,.14,side*25,.037,z,0,side*.55]);route.push([.08,.025,3,side*23,.037,z]);}
   batch(g,p.metal,stripes,'414-service-lane-chevrons');batch(g,p.warm,route,'414-safe-perimeter-lane');
   room.scanVeils=[];for(const h of room.hazards){const plane=new THREE.Mesh(new THREE.PlaneGeometry(42,9),new THREE.MeshBasicMaterial({color:c[4],transparent:true,opacity:.035,depthWrite:false,side:THREE.DoubleSide}));plane.position.set(0,5,h.position.z);g.add(plane);room.scanVeils.push(plane);}
   seal(room,0,23,5,'SUBLEVEL / CARRIER CONTROL',c[4]);motes(room,c[3],24);
  }else if(i===5){
   for(const z of [-30,-15,1,18]){arch(g,52,15,14,z,p.metal,'414-engine-cathedral-ribs');arch(g,50.8,14.5,14,z-.2,p.cool,'414-engine-arch-light');}
   const buttress=[],segments=[],fins=[];for(const side of [-1,1])for(const z of [-26,-10,6,22]){buttress.push([2.6,22,3,side*26,11,z]);for(let n=0;n<8;n++)fins.push([3.1,.28,3.5,side*26,2+n*2.7,z]);}
   batch(g,p.dark,buttress,'414-engine-buttresses');batch(g,p.metal,fins,'414-engine-buttress-armour');
   const orbit=new THREE.Group();orbit.name='414-segmented-containment';orbit.position.set(0,8,-2);g.add(orbit);
   for(let n=0;n<40;n++){const a=n/40*Math.PI*2;segments.push([1.1,.5,1.2,Math.cos(a)*9,Math.sin(a)*9,0,a+Math.PI/2]);}
   batch(orbit,p.metal,segments,'414-rotor-segments');room.animated.push({mesh:orbit,axis:'y',speed:.095});
   for(const r of [4.3,6.3,8.4,11.3]){const torus=new THREE.Mesh(new THREE.TorusGeometry(r,.28,8,64),p.metal);torus.rotation.x=Math.PI/2;torus.position.set(0,.32,-2);g.add(torus);}
   seal(room,0,-2,13,'CARRIER / RETURN ENGINE',c[3]);
   const cage=[],energy=[];for(let n=0;n<16;n++){const a=n/16*Math.PI*2,x=Math.cos(a)*5,z=Math.sin(a)*5-2;cage.push([.22,19,.22,x,12,z]);energy.push([.07,15,.07,x*.75,11,(z+2)*.75-2]);}
   batch(g,p.metal,cage,'414-core-filament-cage');room.energy=batch(g,p.cool,energy,'414-captive-carrier-filaments');
   energySkin(room);
   const turbine=new THREE.Group();turbine.name='414-suspended-turbine-crown';turbine.position.set(0,20,-2);g.add(turbine);const blades=[];
   for(let n=0;n<28;n++){const a=n/28*Math.PI*2;blades.push([1.8,.18,4,Math.cos(a)*5,0,Math.sin(a)*5,0,-a+.35]);}batch(turbine,p.metal,blades,'414-turbine-blades');room.animated.push({mesh:turbine,axis:'y',speed:.17});
   for(const y of [3,20]){const cap=new THREE.Mesh(new THREE.CylinderGeometry(5.5,6,.8,32,1,true),p.metal);cap.position.set(0,y,-2);g.add(cap);}
   for(let j=0;j<3;j++){const r=ring(g,4.1+j*.75,18+j*1.2,-2,c[3]);r.rotation.x=Math.PI/2;room.animated.push({mesh:r,axis:'z',speed:.07*(j+1)});}
   for(const [x,z] of [[-21,15],[21,4],[-17,-24]]){conduit(g,[x,1.4,z],[Math.sign(x)*7,6,-2],.1,p.metal);conduit(g,[x,1.6,z],[Math.sign(x)*7,6.2,-2],.045,p.warm);}
   arch(g,9,3,3,-29,p.metal,'414-rifle-cradle-surround').position.x=14;glow(room,14,3,-28.6,12,9,c[3]);
   room.engineAuras=[glow(room,0,10,-2.3,20,26,c[4]),glow(room,0,10,-2.3,20,26,c[4],Math.PI/2)];motes(room,c[3],54);
  }else if(i===6){
   for(const z of [-30,-15,3,22]){arch(g,50,10,10,z,p.stone,'414-confession-arcade');arch(g,48.4,9.4,10,z-.2,p.metal,'414-arcade-brass-edge');}
   const screens=[],pillars=[];for(const side of [-1,1])for(const z of [-24,-8,8,24]){pillars.push([2,11,2,side*25,5.5,z]);for(let n=0;n<10;n++)screens.push([.12,7,.22,side*26,7,z-2.5+n*.55]);}
   batch(g,p.stone,pillars,'414-quiet-arcade-piers');batch(g,p.metal,screens,'414-archive-divider-fins');
   const back=new THREE.Mesh(new THREE.PlaneGeometry(25,13),p.dark);back.position.set(0,7,-32);g.add(back);
   arch(g,18,6,7,-30,p.warm,'414-confession-halo');glow(room,0,8,-30,29,24,c[3]);seal(room,0,-13,8,'THE SAME NIGHT / TWO ACCOUNTS',c[3]);motes(room,c[3],24);
   for(const side of [-1,1]){box(g,12,.32,3,p.stone,side*18,.6,12);box(g,12,.14,2.8,p.metal,side*18,.85,12);glow(room,side*18,1,10.5,13,4,c[4]);}
  }else if(i===7){
   const armour=[],cracks=[];for(const side of [-1,1])for(let z=-28;z<=28;z+=8){armour.push([2,14,4,side*26,7,z,side*.045]);cracks.push([.1,12,.1,side*24.8,7,z+1,side*.035]);}
   batch(g,p.metal,armour,'414-purge-corridor-armour');room.alarm=batch(g,p.warm,cracks,'414-purge-cracks');
   for(const z of [-28,-12,4,20])arch(g,45,5,11,z,p.metal,'414-purge-vault');
   const guide=[];for(const side of [-1,1])for(let z=-30;z<=30;z+=4)guide.push([.13,.025,2,side*21,.04,z]);batch(g,p.cool,guide,'414-return-corridor-guides');
   arch(g,12,4,6,31,p.cool,'414-manual-return-door');glow(room,0,6,30.8,20,16,c[4]);motes(room,c[3],44);
   const sparks=new THREE.InstancedMesh(new THREE.BoxGeometry(.025,.24,.025),BASIC('#ffbf73'),72);sparks.name='414-failing-conduit-sparks';g.add(sparks);room.sparks={mesh:sparks,dummy:new THREE.Object3D()};
  }
 }
 function tickArchitecture(room,clock,visualStep,game){
  const d=room.dust;if(d){for(let n=0;n<d.count;n++){const a=n*2.399963,x=Math.sin(a)*22,z=Math.cos(a*1.71)*29,y=.7+((n*.83+clock*(room.i===7?2.6:.13))%12);d.dummy.position.set(x,y,z);d.dummy.scale.setScalar(.5+(n%4)*.3);d.dummy.rotation.set(clock*.12,a,0);d.dummy.updateMatrix();d.mesh.setMatrixAt(n,d.dummy.matrix);}if(d.mesh.instanceMatrix)d.mesh.instanceMatrix.needsUpdate=true;}
  if(room.scanVeils)room.scanVeils.forEach((m,i)=>{m.position.z=room.hazards[i].position.z;m.material.color.set(clock%5<2.7?'#ef7062':'#d5af62');m.material.opacity=clock%5<2.7?.045:.014;});
  if(room.energy){const live=visualStep<20;room.energy.visible=live;room.engineAuras.forEach(m=>m.material.opacity=live?.38+Math.sin(clock*1.5)*.05:.08);}
  if(room.plasma){room.plasma.position.y=room.engineCore.position.y;room.plasma.rotation.y=clock*.08;room.plasma.material.uniforms.time.value=clock;room.plasma.material.uniforms.power.value=visualStep<20?1:.12;room.engineBeam.visible=visualStep<20;}
  if(room.horizon)room.horizon.material.uniforms.time.value=clock;
  if(room.busGlow)room.busGlow.visible=!(game.maria414Cine?.act===3&&game.maria414Cine.t<6);
  if(room.alarm)room.alarm.material.color.set(Math.sin(clock*3)>.5?'#f6a068':'#963c34');
  if(room.sparks){const s=room.sparks;for(let n=0;n<72;n++){const age=(clock*3+n*.27)%5,side=n%2?1:-1;s.dummy.position.set(side*(24-age*.27),9-age*1.35,-26+(n%9)*6+Math.sin(n*3.3)*age*.4);s.dummy.rotation.set(0,0,side*.4);s.dummy.updateMatrix();s.mesh.setMatrixAt(n,s.dummy.matrix);}if(s.mesh.instanceMatrix)s.mesh.instanceMatrix.needsUpdate=true;}
 }
 function reconstruction(room,x,z){
  const city=new THREE.Group();city.name='maria414-forensic-reconstruction';city.position.set(x,1.55,z);room.root.add(city);
  const blocks=[];box(city,12,.12,9,S('#101f32'));const frame=S('#9b8165'),windows=[[],[],[],[]];
  for(const px of [-6.2,6.2])box(city,.12,.22,9.4,frame,px,.02);for(const pz of [-4.7,4.7])box(city,12.5,.22,.12,frame,0,.02,pz);
  for(let district=0;district<4;district++)for(let n=0;n<6;n++){
   const px=-4.6+(district%2)*5.3+(n%3)*1.2,pz=-3.2+Math.floor(district/2)*3.9+Math.floor(n/3)*1.25,h=.65+((district*7+n*3)%8)*.28;
   box(city,.8,h,.8,S('#244856'),px,h/2,pz);box(city,.46,.25,.46,S('#395766'),px,h+.15,pz);
   for(let y=.25;y<h;y+=.3)for(let j=0;j<3;j++)windows[district].push([.1,.09,.012,px-.25+j*.25,y,pz+.41]);
   const light=box(city,.82,.12,.82,BASIC('#67c8d1'),px,h+.08,pz);blocks.push({light,district});
  }
  const districtWindows=windows.map((parts,i)=>batch(city,BASIC('#accdc1'),parts,'414-hologram-district-'+i));
  for(let lane=-3;lane<=3;lane+=3){box(city,11,.025,.04,BASIC('#71a5b2'),0,.09,lane);box(city,.035,.025,8,BASIC('#71a5b2'),lane,.09);}
  const pulse=ring(city,2.7,.16,0,'#efc16c');pulse.rotation.x=Math.PI/2;
  room.reconstruction={city,blocks,pulse,districtWindows,time:0};
  textPanel(room.root,room.i===8?'RETURN CIRCUIT / DISTRICTS':'FORENSIC RECONSTRUCTION','LOCAL MODEL / HOUSE RECORDER / CARRIER 414',x,4.7,z-4.7,11,2.6);
 }
 function rooftop(room){
  const root=room.root,building=S('#15283b'),lit=BASIC('#a6c6db');
  if(typeof buildCosmosSky==='function'){
   const sky=buildCosmosSky(260);sky.name='maria414-rooftop-cosmos';sky.material.opacity=1;root.add(sky);room.sky=sky;
  }
  const skyline=new THREE.Group();skyline.name='maria414-rooftop-skyline';root.add(skyline);
  // A layered city horizon, entirely outside the solid playable roof. Windows share one draw.
  const facades=[],windows=[],spires=[];
  for(let n=0;n<40;n++){
   const side=n%4,lane=Math.floor(n/4),offset=-70+lane*15;
   const x=side===0?-80:side===1?80:offset,z=side===2?-95:side===3?95:offset;
   const h=18+(n*17%48);facades.push([8,h,9,x,h/2-12,z]);facades.push([5,h*.23,6,x,h-12+h*.115,z]);
   for(let row=0;row<Math.floor(h/2.5);row++)for(let col=0;col<4;col++)if((row*13+col*3+n)%5){windows.push([.72,.85,.08,x-2.7+col*1.8,row*2.5-10,z+4.55]);windows.push([.08,.85,.72,x+(x>0?-4.05:4.05),row*2.5-10,z-2.7+col*1.8]);}
   spires.push([.15,6,.15,x,h-9,z]);
   box(skyline,.14,1.4,.14,BASIC(n%3?'#6eaaad':'#d4af75'),x,h-11,z);
  }
  batch(skyline,building,facades,'414-layered-city-towers');batch(skyline,lit,windows,'414-city-window-field');batch(skyline,S('#576b7a'),spires,'414-city-antennae');
  for(let z=-30;z<=30;z+=10)for(const x of [-26,26])box(root,.2,2.8,.2,S('#5b6e83'),x,1.4,z);
  textPanel(root,'ROOF RECEIVER / 414','CARRIER TRACE LIVE. THREE FRAGMENTS. ONE RETURN ADDRESS.',0,4,-33,17,3.5);
  const carrier=new THREE.Group();carrier.name='maria414-stolen-carrier';root.add(carrier);
  const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,1),BASIC('#f3cb7b'));carrier.add(core);
  const halo=ring(carrier,1.1,0,0,'#7dd4da');room.carrier={root:carrier,core,halo};
  const trail=[];for(let n=0;n<18;n++){const p=new THREE.Mesh(new THREE.IcosahedronGeometry(.07,0),BASIC('#86bdc6'));root.add(p);trail.push(p);}room.carrier.trail=trail;
 }
 function createRoom(game,i){
  const root=new THREE.Group();root.name='maria414-room-'+i;root.position.copy(point(i));root.visible=false;
  const c=STYLES[i],wall=S(c[1]),floor=S(c[0]),metal=S(c[2]),gold=BASIC(c[3]),cyan=BASIC(c[4]);
  const roof=i===1,wallHeight=roof?1.25:i===5?32:22;
  box(root,WIDTH,.7,DEPTH,floor,0,-.35);box(root,.6,wallHeight,DEPTH,wall,-WIDTH/2,wallHeight/2);box(root,.6,wallHeight,DEPTH,wall,WIDTH/2,wallHeight/2);box(root,WIDTH,wallHeight,.6,wall,0,wallHeight/2,-DEPTH/2);
  box(root,22,wallHeight,.6,wall,-17,wallHeight/2,DEPTH/2);box(root,22,wallHeight,.6,wall,17,wallHeight/2,DEPTH/2);
  const hemisphere=new THREE.HemisphereLight(0xc9dceb,0x241c29,1.8),ambient=new THREE.AmbientLight(0xb9bbc8,1.05);root.add(hemisphere,ambient);
  const light=new THREE.PointLight(i===0||i===8||i===6?0xffd29b:i===3?0xe7ad5c:0x9baddc,650,90,2);light.position.set(0,12,0);root.add(light);
  const fill=new THREE.PointLight(i===5?0xd7a279:0x8ebfca,390,65,2);fill.position.set(-18,8,-20);root.add(fill);
  const roomNotes=['FAMILY ARCHIVE / ACCESS LOG RETAINED','CITY RECEIVERS / STOLEN CARRIER LIVE','COPIED RETURN ADDRESS / NO OUTGOING ROUTE','EMERGENCY POWER / MANUAL SERVICE ONLY','SUBLEVEL CONTROL / RED ACTIVE / GOLD SAFE','FOUR RIFLE CHANNELS / ONE RETURN ENGINE','THE SAME NIGHT / TWO ACCOUNTS','PURGE ARMED / MANUAL RETURN STILL LIVE','FAMILY ARCHIVE / RETURN CIRCUIT RESTORATION'];
  const sign=textPanel(root,i===8?'414 HOUSE / RETURN':ACTS[Math.min(i,9)].toUpperCase(),roomNotes[i],0,i===5?25:16,-34.5,18,4);
  const room={root,i,wallHeight,light,fill,sign,hemisphere,ambient,animated:[],racks:[],hazards:[],drones:[],collars:[]};
  if(i===0||i===8){
   reconstruction(room,0,6);
   box(root,14,.6,10,metal,0,1.2,6);for(const x of [-5,5])box(root,1.1,1.2,6,wall,x,.6,6);box(root,12,5,.5,wall,-15,3.4,-27);
   for(let n=0;n<4;n++){box(root,5,.09,.16,gold,-15,1.9+n*.95,-26.55);const r=rifle(root,-15,2.1+n*.95,-26.2);r.visible=i===8&&read().rifles===false;room.racks.push(r);}
   textPanel(root,'FAMILY RACK / 414','LOCAL ACCESS. CATCHES OPEN. NO FORCED ENTRY.',-15,7.3,-27,12,3);
   textPanel(root,'HOUSE RECORDER','Camera buffer: someone knew the alarm. The return carrier is 414.',15,4.4,-22,10,4);
  }else if(i===1){
   rooftop(room);
   box(root,8,.06,52,S('#0a2030'),0,.04,0);
   for(const x of [-13,13])for(let z=-25;z<30;z+=10){box(root,.32,5.5,.32,metal,x,2.75,z);box(root,.1,4,.1,cyan,x,3,z+.25);}
  }else if(i===2){
   box(root,13,12,1,S('#312742'),0,6,-28);for(const x of [-7,7])box(root,.18,11,.2,gold,x,5.5,-27.4);
   textPanel(root,'EXIT / WELCOME HOME','RETURN CODE ACCEPTED. PLEASE REMAIN WHERE YOU ARE.',0,6,-27.3,11,4);
  }else if(i===3){
   room.light.intensity=160;room.fill.intensity=100;
   for(let z=-28;z<28;z+=4){box(root,.16,.06,1.8,gold,-3,.05,z);box(root,.16,.06,1.8,gold,3,.05,z);}
   const lift=ring(root,9,7,-29,'#c98a39');room.animated.push({mesh:lift,axis:'z',speed:.1});
  }else if(i===4){
   for(let j=0;j<2;j++){const sweep=box(root,44,.07,.14,BASIC('#d56959'),0,.8,j? -12:10);room.hazards.push(sweep);}
   textPanel(root,'SCAN CYCLE','RED = ACTIVE. GOLD = SAFE. Cross between the sweeps.',0,8,-34,15,4);
  }else if(i===5){
   // Giant suspended engine. The pedestrian perimeter is kept clear.
   box(root,13,.12,20,metal,0,.06,-2);
   for(let j=0;j<5;j++){const r=ring(root,6+j*1.1,8,-2,j%2?'#b685b9':'#73c7cc');r.rotation.y=j*.5;room.animated.push({mesh:r,axis:j%2?'z':'y',speed:(j%2?-1:1)*(.09+j*.05)});}
   const core=new THREE.Mesh(new THREE.IcosahedronGeometry(3.1,1),new THREE.MeshStandardMaterial({color:'#142d42',metalness:.8,roughness:.35,emissive:'#327d90',emissiveIntensity:1.1}));core.position.set(0,8,-2);root.add(core);room.engineCore=core;room.animated.push({mesh:core,axis:'y',speed:.24});
   for(const [x,z] of [[-21,15],[21,4],[-17,-24]]){const cable=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,18,8),gold);cable.position.set(x*.55,5,z*.55);cable.rotation.z=Math.PI/3;root.add(cable);const collar=box(root,2,.3,2,BASIC('#f0c87b'),x,1.7,z);room.collars.push(collar);}
   box(root,7,2,3,metal,14,1,-28);for(let j=0;j<4;j++)room.racks.push(rifle(root,14,1.5+j*.3,-27));
  }else if(i===6){
   textPanel(root,'SECOND RETURN ROUTE','HOUSE RECORDER / SAME NIGHT / TWO ACCOUNTS',-16,5,-25,12,4);
   // Use Sommi's actual uploaded mesh; it is primed asynchronously only for this encounter.
   let packed;try{packed=window.__atropaPrimePacked?.('sommi-glb');}catch(error){packed=Promise.reject(error);}
   Promise.resolve(packed).then(()=>{
    if(game.disposed||!room.root.parent)return;
    const actor=buildSommiPlayer();actor.position.set(0,0,-24);actor.rotation.y=0;root.add(actor);room.actor=actor;
   }).catch(()=>{if(game.disposed||!root.parent)return;room.actorVoiceFallback=textPanel(root,'SOMMI / VOICE LINK','I took them. Let me help you get them out.',0,4,-14,10,3);});
  }else if(i===7){
   for(let n=0;n<18;n++){const debris=new THREE.Mesh(n%3?new THREE.TetrahedronGeometry(.45+n%3*.22):new THREE.BoxGeometry(2.4,.18,1.5),S('#76859a'));debris.position.set((n%2?-1:1)*(22+n%3),7+n%6,-28+n*3);root.add(debris);room.drones.push(debris);}
   textPanel(root,'MANUAL RETURN','SOLID FLOOR. FOLLOW RELAYS. DO NOT LEAVE THE CASE.',0,9,-34,16,4);
  }
  architecture(room);tickArchitecture(room,0,read().step,game);game.scene.add(root);return room;
 }
 function build(game){
  if(game.maria414World)return;
  game.maria414World={rooms:new Map(),nodeMeshes:new Map(),puzzleMeshes:new Map(),depthMeshes:new Map(),nodes:[],inside:false,room:-1,clock:0,saveClock:0,lastStep:-1,guide:null,collapse:70};
  // The door sits in the city. The sublevels are streamed only when needed.
  const x=-99,z=73,y=game.groundH(x,z),root=new THREE.Group();root.name='maria414-city-entry';root.position.set(x,y,z);
  const metal=S('#172438'),glow=BASIC('#79becb');
  box(root,6,.3,5,metal,0,.15);for(const px of [-2.5,2.5]){box(root,.6,7,.6,metal,px,3.5);box(root,.12,5.8,.12,glow,px,3.5,.4);}box(root,6,.5,1,metal,0,7);textPanel(root,'414 / RECLAIMED','MARIA’S FAMILY HOUSE. ENTER THE STORY.',0,5,.5,5,2.4);game.scene.add(root);
  game.maria414World.entry=root;game.maria414World.entryPos=V(x,y,z+3);
  game.interactables.push({id:'maria414-entry',pos:game.maria414World.entryPos,radius:4,prompt:()=>read().complete?'E — THE SAME NIGHT · replay recording':'E — MARIA 414 · enter / resume RECLAIMED'});
 }
 function getRoom(game,i){const w=game.maria414World;let room=w.rooms.get(i);if(!room){room=createRoom(game,i);w.rooms.set(i,room);}return room;}
 function node(game,index){
  const w=game.maria414World;if(w.nodeMeshes.has(index))return w.nodeMeshes.get(index);
  const def=STEPS[index],room=getRoom(game,def[1]),[,,x,z]=def,root=new THREE.Group();root.position.set(x,0,z);root.name='maria414-objective-'+index;
  const stand=box(root,2,1.4,1.4,S('#27384b'),0,.7),screen=textPanel(root,'414 / '+(index+1),def[4],0,2.3,.74,3.8,1.8);
  const beam=ring(root,1.2,.12,0,'#ffd078');beam.rotation.x=Math.PI/2;
  room.root.add(root);const it={id:'maria414-step-'+index,pos:point(def[1],x,0,z),radius:3.4,prompt:()=>`E — ${def[4]}`};
  const result={root,it,screen,stand,beam};w.nodeMeshes.set(index,result);game.interactables.push(it);w.nodes.push(it);return result;
 }
 function puzzleNodes(game,step=read().step){
  if(step!==1&&step!==10)return [];
  const w=game.maria414World,defs=step===1?HOUSE_EVIDENCE:POWER_SWITCHES,room=getRoom(game,step===1?0:3);
  return defs.map((d,index)=>{
   const key=step+':'+index;if(w.puzzleMeshes.has(key))return w.puzzleMeshes.get(key);
   const root=new THREE.Group();root.name='maria414-'+(step===1?'evidence':'rotary')+'-'+index;root.position.set(d.x,0,d.z);room.root.add(root);
   box(root,1.7,1.3,1.5,S('#27384b'),0,.65);const marker=box(root,.3,.3,.3,BASIC('#79becb'),0,1.6);
   const it={id:'maria414-puzzle-'+step+'-'+index,pos:point(room.i,d.x,0,d.z),radius:3.4,prompt:()=>step===1?`E — ${d.title} · ${read().puzzles.house.collected.includes(index)?'recorded':'inspect'}`:`E — ${d.title} · ${POWER_ROUTES[read().puzzles.power.routes[index]]} · rotate`};
   const nd={root,it,index,step,marker,lastRoute:null,label:null};w.puzzleMeshes.set(key,nd);game.interactables.push(it);return nd;
  });
 }
 function updatePuzzles(game){
  const w=game.maria414World,q=read();puzzleNodes(game);
  for(const nd of w.puzzleMeshes.values()){
   nd.root.visible=w.inside&&!w.replaying&&q.step===nd.step;
   const collected=q.puzzles.house.collected.includes(nd.index),route=q.puzzles.power.routes[nd.index];
   nd.marker.material.color.set(nd.step===1&&collected?'#ffd078':nd.step===10&&route===POWER_SWITCHES[nd.index].correct?'#79d7a0':'#79becb');
   const title=nd.step===1?HOUSE_EVIDENCE[nd.index].title:POWER_SWITCHES[nd.index].title,body=nd.step===1?(collected?'EVIDENCE RECORDED':'HOUSE RECORDER / LOCAL BUFFER'):POWER_ROUTES[route];
   if(nd.lastRoute!==body){if(nd.label){nd.label.material.map?.dispose?.();nd.label.material.dispose?.();nd.label.geometry.dispose?.();nd.label.removeFromParent();}nd.label=textPanel(nd.root,title,body,0,2.5,.78,5,2.5);nd.lastRoute=body;}
  }
 }
 function activeTargets(game){return [node(game,read().step).it,...puzzleNodes(game).map(nd=>nd.it),...depthNodes(game).map(nd=>nd.it)];}
 function nextTarget(game){
  const q=read(),nds=puzzleNodes(game),needed=nds.filter(nd=>q.step===1?!q.puzzles.house.collected.includes(nd.index):q.puzzles.power.routes[nd.index]!==POWER_SWITCHES[nd.index].correct);
  const deeper=depthNext(game);if(deeper)return deeper;
  if(q.step===13||q.step===14){
   const p=game.playerPos.clone().sub(point(4));let route;
   if(q.step===13){if(p.x>-22&&p.z>20)route=[-23,22];else if(p.x<=-21&&p.z>15)route=[-23,14];}
   else if(p.z>-22&&p.x<21){route=p.x>-22?[-23,16]:[-23,-24];}
   else if(p.z<=-22&&p.x<22)route=[23,-24];
   else if(p.x>=21&&p.z<-10)route=[23,-9];
   if(route)return {id:'maria414-service-lane',pos:point(4,route[0],0,route[1]),radius:1,prompt:()=> 'Follow the outer service lane'};
  }
  return needed.length?needed.reduce((best,nd)=>game.playerPos.distanceTo(nd.it.pos)<game.playerPos.distanceTo(best.it.pos)?nd:best).it:node(game,q.step).it;
 }
 function puzzleHint(){const q=read();return q.step===1?`HOUSE RECORDINGS · ${q.puzzles.house.collected.length}/3 · timeline ${q.puzzles.house.ordered.length}/3`:q.step===10?`EMERGENCY CIRCUIT · ${q.puzzles.power.routes.filter((v,i)=>v===POWER_SWITCHES[i].correct).length}/3 routes matched`:depthHint();}
 function houseTimeline(game){
  const q=read(),h=q.puzzles.house;
  if(h.collected.length<3){dialog(game,'HOUSE RECORDER / MISSING BUFFERS',`Recover the three nearby local recordings first. ${h.collected.length}/3 saved. The gold guide points to an unrecorded terminal.`,[['FOLLOW THE RECORDINGS',()=>closeDialog(game)]]);return;}
  if(h.ordered.length===3){dialog(game,'HOUSE RECORDER / TIMELINE RESTORED','All three events are in order. Commit the reconstructed route to the rooftop receivers.',[['COMMIT RECONSTRUCTION',()=>{closeDialog(game);advance(game);}]]);return;}
  const notes=HOUSE_EVIDENCE.map(d=>d.title+'\n'+d.body).join('\n\n');
  const show=()=>{const q=read(),h=q.puzzles.house;
   dialog(game,'HOUSE RECORDER / RECONSTRUCT THE NIGHT',`${notes}\n\nSelect the events in the order they happened. ${h.ordered.length}/3 placed. A wrong event resets the ordering only.`,HOUSE_EVIDENCE.filter((_,i)=>!h.ordered.includes(i)).map(d=>[d.title,()=>{
    const q=read(),h=q.puzzles.house,index=HOUSE_EVIDENCE.indexOf(d);
    if(index!==h.ordered.length){h.ordered=[];write(q);Quests.toast('Timeline contradiction. The recordings are retained; reconstruct the order again.');show();return;}
    h.ordered.push(index);write(q);if(h.ordered.length===3){closeDialog(game);advance(game);}else show();
   }]));
   const card=game.maria414Dialog.children[0];depthButton(card,'OPTIONAL HELP / NEXT EVENT',()=>{const h=read().puzzles.house,f=document.getElementById('maria414-feedback'),i=h.ordered.length;if(f)f.textContent=i<3?'Next event: '+HOUSE_EVIDENCE[i].title+'.':'Timeline complete. Commit the reconstruction.';});
  };show();
 }
 function powerCircuit(game){
  const q=read(),matched=q.puzzles.power.routes.every((v,i)=>v===POWER_SWITCHES[i].correct);
  dialog(game,'EMERGENCY BUS / MANUAL ROUTING',POWER_MANUAL+'\n\n'+POWER_SWITCHES.map((d,i)=>d.title+' → '+POWER_ROUTES[q.puzzles.power.routes[i]]).join('\n'),[[matched?'RESTORE EMERGENCY POWER':'TEST CIRCUIT',()=>{
   if(!read().puzzles.power.routes.every((v,i)=>v===POWER_SWITCHES[i].correct)){Quests.toast('Circuit rejected. Check the three rotary switches; your current settings are retained.');closeDialog(game);return;}
   closeDialog(game);advance(game);
  }]]);
  const card=game.maria414Dialog.children[0],feedback=document.getElementById('maria414-feedback');let hintIndex=0;depthButton(card,'OPTIONAL HELP / REVEAL A ROUTE',()=>{const i=hintIndex++%3;feedback.textContent='Help '+(i+1)+'/3: '+POWER_SWITCHES[i].title+' must use '+POWER_ROUTES[POWER_SWITCHES[i].correct]+'.';});
 }
 function teleport(game,pos){game.playerPos.copy(pos);game.playerVel?.set(0,0,0);game.player?.position.copy(pos);game.ohFollow?.set(pos.x,pos.z);game.keys={};game.moveTarget=null;game.touchMoveVec=null;game._storyCutsceneFrozenPos=null;game.camYaw=0;game.camPitch=.28;}
 function idleController(rig,active){
  if(!rig?.ready||!rig.walk?.getClip||!rig.mixer?.clipAction||typeof rig.update!=='function')return null;
  const clip=rig.walk.getClip().clone(),action=rig.mixer.clipAction(clip),counterClip=Number.isFinite(clip.duration)&&clip.duration>0?rig.walk.getClip().clone():null,counter=counterClip?rig.mixer.clipAction(counterClip):null,original=rig.update;
  const wrapped=function(delta,speed=0,grounded=true,onBoard=false){
   if(active()&&speed<.1&&grounded&&!onBoard&&!rig.danceMode){if(rig.active){rig.active.stop();rig.active=null;}action.enabled=true;action.setEffectiveWeight(counter ? .5 : 1);action.play();action.paused=true;action.time=.28;if(counter){counter.enabled=true;counter.setEffectiveWeight(.5);counter.play();counter.paused=true;counter.time=(.28+clip.duration*.5)%clip.duration;}rig.mixer.update(delta);return;}
   action.stop();counter?.stop();return original.call(this,delta,speed,grounded,onBoard);
  };rig.update=wrapped;
  return {rig,release(){action.stop();counter?.stop();if(rig.update===wrapped)rig.update=original;rig.mixer.uncacheAction?.(clip);if(counterClip)rig.mixer.uncacheAction?.(counterClip);}};
 }
 function playerIdle(game){
  const w=game.maria414World,rig=game.player?.userData?.externalRig;
  if(w.playerIdle?.rig!==rig){w.playerIdle?.release();w.playerIdle=null;}
  if(!w.playerIdle)w.playerIdle=idleController(rig,()=>game.maria414Inside);
 }
 function releaseIdle(game){
  const w=game.maria414World;w.playerIdle?.release();w.playerIdle=null;
  for(const room of w.rooms.values()){room.actorIdle?.release();room.actorIdle=null;room.actorPrev=null;}
 }
 function tickActor(game,room,dt){
  const actor=room.actor;if(!actor)return;
  const rig=actor.userData.externalRig;
  if(rig?.failed){actor.visible=false;if(!room.actorVoiceFallback){room.actorVoiceFallback=textPanel(room.root,'SOMMI / VOICE LINK','I took them. Let me help you get them out.',0,4,-14,10,3);}return;}
  actor.visible=true;
  const t=game.maria414Cine?.act===6?Math.min(1,game.maria414Cine.t/5):1;
  const z=-24+12*(t*t*(3-2*t)),previous=room.actorPrev??z,speed=dt>0?Math.abs(z-previous)/dt:0;actor.position.set(0,0,z);room.actorPrev=z;
  const local=game.playerPos.clone().sub(point(room.i));actor.rotation.y=Math.atan2(local.x-actor.position.x,local.z-actor.position.z);
  if(room.actorIdle?.rig!==rig){room.actorIdle?.release();room.actorIdle=null;}
  if(!room.actorIdle)room.actorIdle=idleController(rig,()=>game.maria414Inside&&room.root.visible);
  if(rig?.ready)rig.update(dt,speed,true,false);
  const legs=actor.userData.legs;if(legs){const blend=Math.min(1,speed/1.5);legs.phase=(legs.phase||0)+dt*Math.min(2.6,speed/.85)*Math.PI*2;legs.gaitBlend29=dt===0?blend:(legs.gaitBlend29||0)+(blend-(legs.gaitBlend29||0))*(1-Math.exp(-12*dt));const swing=Math.sin(legs.phase)*.62*blend;if(legs.l)legs.l.rotation.x=swing;if(legs.r)legs.r.rotation.x=-swing;if(legs.armL)legs.armL.rotation.x=(legs.armLBase||0)-swing*.55;if(legs.armR)legs.armR.rotation.x=(legs.armRBase||0)+swing*(legs.armRMul??.55);}
 }
 function hideHost(game){
  const w=game.maria414World;
  if(w.snapshot)return;
  w.snapshot={pos:game.playerPos.clone(),yaw:game.playerYaw,camYaw:game.camYaw,camPitch:game.camPitch,background:game.scene.background,fog:game.scene.fog,objects:game.scene.children.map(x=>[x,x.visible]),viewBlend:game.viewBlend,viewTarget:game.viewBlendTarget,campaignBanner:store.get().campaignBanner,lookBeat:game.lookBeat};
  // Suspend the city's presentation while this interior owns the camera and HUD.
  game.lookBeat=null;store.set({campaignBanner:null});
  for(const [obj] of w.snapshot.objects)if(obj!==game.player&&obj!==game.camera)obj.visible=false;
  game.scene.background=new THREE.Color('#040914');game.scene.fog=new THREE.FogExp2('#07111c',.006);
  game.viewBlend=1;game.viewBlendTarget=1;game.microWorldSuspendNow?.();
 }
 function enter(game,roomIndex,restore=false){
  build(game);const w=game.maria414World;hideHost(game);game.maria414Inside=true;w.inside=true;
  for(const room of w.rooms.values())room.root.visible=false;
  const room=getRoom(game,roomIndex);room.root.visible=true;w.room=roomIndex;
  if(roomIndex===5)getRoom(game,6); // Prime the encounter while the player is in the engine.
  game.scene.background=roomIndex===1?w.snapshot.background:new THREE.Color('#040914');
  game.scene.fog=new THREE.FogExp2('#07111c',roomIndex===1?.0015:.006);
  teleport(game,point(roomIndex,0,0,22));game.playerYaw=Math.PI;
  playerIdle(game);
  game.tutThreatGrace=Math.max(30,game.tutThreatGrace||0);store.set({panel:null,chatOpen:false,prompt:'',questToast:null,questDir:null,questDist:null});
  const q=read();sync(game);
  if(!restore&&!q.seen.includes(STEPS[q.step][0]))cinematic(game,STEPS[q.step][0]);
 }
 function leave(game){
  const w=game.maria414World;if(!w)return;
  finishCine(game,false);closeDialog(game);w.inside=false;w.replaying=false;game.maria414Inside=false;releaseIdle(game);
  for(const room of w.rooms.values())room.root.visible=false;
  for(const nd of w.nodeMeshes.values())nd.root.visible=false;
  for(const nd of w.puzzleMeshes.values())nd.root.visible=false;
  for(const nd of w.depthMeshes.values())nd.root.visible=false;
  w.guide?.removeFromParent();w.guide=null;
  const snap=w.snapshot;if(snap){for(const [obj,visible]of snap.objects)obj.visible=visible;game.scene.background=snap.background;game.scene.fog=snap.fog;teleport(game,snap.pos);game.playerYaw=snap.yaw;game.camYaw=snap.camYaw;game.camPitch=snap.camPitch;game.viewBlend=snap.viewBlend;game.viewBlendTarget=snap.viewTarget;game.lookBeat=snap.lookBeat;if(snap.campaignBanner&&!store.get().campaignBanner)store.set({campaignBanner:snap.campaignBanner});w.snapshot=null;}
  game._storyCutsceneFrozenPos=null;game.clock?.getDelta();store.set({panel:null,maria414CineActive:false,prompt:'',questDir:null,questDist:null});
  document.getElementById('maria414-return')?.remove();game.canvas?.focus?.();refresh();
 }
 function destroyWorld(game){
  const w=game.maria414World;if(!w)return;
  releaseIdle(game);const geometries=new Set(),materials=new Set(),textures=new Set();
  const collect=obj=>{if(!obj)return;const visit=o=>{if([...w.rooms.values()].some(room=>room.actor===o))return;if(o.geometry)geometries.add(o.geometry);for(const m of [].concat(o.material||[])){materials.add(m);if(m.map)textures.add(m.map);}for(const child of o.children||[])visit(child);};visit(obj);obj.removeFromParent();};
  collect(w.entry);collect(w.guide);collect(w.case);for(const room of w.rooms.values())collect(room.root);
  for(const resource of [...textures,...materials,...geometries])resource.dispose?.();
  const owned=new Set([...w.nodes,...[...w.puzzleMeshes.values()].map(nd=>nd.it),...[...w.depthMeshes.values()].map(nd=>nd.it)]);game.interactables=game.interactables.filter(it=>it.id!=='maria414-entry'&&!owned.has(it));
  w.rooms.clear();w.nodeMeshes.clear();w.puzzleMeshes.clear();w.depthMeshes.clear();w.nodes=[];w.case=null;w.entry=null;game.maria414World=null;
 }
 function refresh(){store.set({sommi414UiVersion:(Number(store.get().sommi414UiVersion)||0)+1});}
 function sync(game){
  const w=game.maria414World,q=read();for(const [ix,nd]of w.nodeMeshes)nd.root.visible=ix===q.step&&w.inside;
  if(w.inside&&!q.complete){const nd=node(game,q.step);nd.root.visible=true;}
  updatePuzzles(game);updateDepthNodes(game);
  for(const room of w.rooms.values())for(const r of room.racks)r.visible=room.i===0?false:room.i===8?q.step>=29:!q.rifles;
  if(q.rifles&&q.step<29&&!w.case){const c=new THREE.Group();box(c,.65,1.5,.25,S('#192534'));box(c,.06,1.2,.28,BASIC('#cb9d53'),.27);c.position.set(.55,1.3,-.35);c.rotation.z=.15;game.player.add(c);w.case=c;}
  if(w.case&&(!q.rifles||q.step>=29)){w.case.removeFromParent();w.case=null;}
  if(w.inside&&!document.getElementById('maria414-return')){const b=document.createElement('button');b.id='maria414-return';b.textContent='‹ PAUSE STORY / RETURN';b.style.cssText='position:fixed;left:max(8px,env(safe-area-inset-left));top:max(8px,env(safe-area-inset-top));z-index:1800;color:#f4d299;background:#0a1222e8;border:1px solid #806346;padding:9px 12px;font:700 10px Arial;touch-action:manipulation';b.onclick=()=>{saveTime(game);leave(game);};document.body.appendChild(b);}
  if(q.step!==w.lastStep&&w.rooms.get(1)?.carrier){w.rooms.get(1).carrier.time=0;w.rooms.get(1).carrier.phase=0;}
  w.lastStep=q.step;refresh();
 }
 function saveTime(game){const q=read(),w=game.maria414World;if(w&&!w.replaying){q.elapsed+=Math.round(w.saveClock);w.saveClock=0;write(q);}game.saveFR?.();}
 function advance(game){
  const q=read();if(q.complete||!game.maria414Inside)return;
  q.step=Math.min(STEPS.length-1,q.step+1);q.checkpoint=q.step;write(q);sync(game);game.sfx?.pickup?.();
  const next=STEPS[q.step];if(next[1]!==game.maria414World.room)enter(game,next[1]);else if(!q.seen.includes(next[0]))cinematic(game,next[0]);
 }
 function start(game){
  if(game.disposed||!eligible()||!graduated()||game.tut||game.inst||game.dysActive||game.treasuryInside)return false;
  build(game);const q=read();if(q.complete)return replay(game);
  q.started=true;write(q);enter(game,STEPS[q.step][1],q.seen.includes(STEPS[q.step][0]));return true;
 }
 function closeDialog(game){document.getElementById('maria414-dialog')?.remove();if(game.maria414Dialog){game.maria414Dialog=null;if(store.get().panel?.type==='maria414-dialog')store.set({panel:null});}game.keys={};game.touchMoveVec=null;game.moveTarget=null;}
 function dialog(game,title,body,buttons){
  closeDialog(game);const el=document.createElement('div');el.id='maria414-dialog';el.setAttribute('role','dialog');el.setAttribute('aria-label',title);
  el.style.cssText='position:fixed;inset:0;z-index:2147482501;background:#01061199;display:flex;align-items:center;justify-content:center;color:#e6f0f7;font:15px/1.6 Arial;padding:18px;box-sizing:border-box';
  const card=document.createElement('div');card.style.cssText='width:min(540px,90vw);max-height:80dvh;overflow:auto;background:#0c1728;border:1px solid #a8834a;padding:24px;box-sizing:border-box';
  const h=document.createElement('h2');h.textContent=title;h.style.cssText='font:700 18px Arial;color:#f1c878;margin:0 0 14px';card.append(h);
  const p=document.createElement('p');p.textContent=body;p.style.whiteSpace='pre-line';card.append(p);
  const feedback=document.createElement('p');feedback.id='maria414-feedback';feedback.setAttribute('role','status');feedback.style.color='#f1c878';card.append(feedback);
  for(const [label,fn]of buttons){const b=document.createElement('button');b.textContent=label;b.style.cssText='display:block;width:100%;margin-top:9px;min-height:44px;padding:10px;background:#1a2b43;color:#eaf4f8;border:1px solid #526880;font:bold 13px Arial;touch-action:manipulation';b.onclick=fn;card.append(b);}
  const cancel=document.createElement('button');cancel.textContent='CLOSE';cancel.style.cssText='margin-top:14px;background:transparent;border:0;color:#8babc3;min-height:40px';cancel.onclick=()=>closeDialog(game);card.append(cancel);
  el.append(card);document.body.append(el);game.maria414Dialog=el;store.set({panel:{type:'maria414-dialog'}});game.keys={};game.playerVel.set(0,0,0);try{document.exitPointerLock?.();}catch(_){}
 }
 function code(game){let entered=[],hintIndex=0;dialog(game,'CARRIER / MANUAL INPUT','Three signal fragments. One carrier. Enter the recovered three-digit sequence. Wrong input resets this console only.',[1,4,7].map(n=>[String(n),()=>{entered.push(n);const f=document.getElementById('maria414-feedback');const correct=[4,1,4];if(n!==correct[entered.length-1]){entered=[];if(f)f.textContent='Carrier rejected. Retry from the first digit.';game.sfx?.burn?.();return;}if(f)f.textContent=entered.join(' → ');if(entered.length===3){closeDialog(game);advance(game);}}]));const card=game.maria414Dialog.children[0],feedback=document.getElementById('maria414-feedback'),correct=[4,1,4];depthButton(card,'OPTIONAL HELP / REVEAL NEXT DIGIT',()=>{const i=hintIndex++%3;feedback.textContent='Help '+(i+1)+'/3: digit '+(i+1)+' is '+correct[i]+'.';});}
 function interact(game,it){
  if(it.id==='maria414-entry'){return read().complete?recordings(game):start(game),true;}
  if(it.id.startsWith('maria414-depth-'))return depthInteract(game,it);
  if(it.id.startsWith('maria414-puzzle-')){
   const nd=[...game.maria414World.puzzleMeshes.values()].find(nd=>nd.it.id===it.id),q=read();
   if(!nd||nd.step!==q.step||!game.maria414Inside||game.maria414Cine||game.maria414Dialog||q.complete||game.playerPos.distanceTo(nd.it.pos)>it.radius+.3)return true;
   if(nd.step===1){const d=HOUSE_EVIDENCE[nd.index];dialog(game,d.title,d.body,[[q.puzzles.house.collected.includes(nd.index)?'RECORDING SAVED':'SAVE LOCAL RECORDING',()=>{const q=read();q.puzzles.house.collected=[...new Set([...q.puzzles.house.collected,nd.index])];write(q);closeDialog(game);updatePuzzles(game);refresh();}]]);}
   else{q.puzzles.power.routes[nd.index]=(q.puzzles.power.routes[nd.index]+1)%4;write(q);updatePuzzles(game);refresh();Quests.toast(POWER_SWITCHES[nd.index].title+' → '+POWER_ROUTES[q.puzzles.power.routes[nd.index]]);}
   return true;
  }
  if(!it.id.startsWith('maria414-step-'))return false;
  const q=read(),index=Number(it.id.slice(14));
  if(index!==q.step||!game.maria414Inside||game.maria414Cine||q.complete)return true;
  if(game.playerPos.distanceTo(it.pos)>it.radius+.3)return true;
  const def=STEPS[index],kind=def[6];
  if(depthObjective(game,index))return true;
  if(index===1){houseTimeline(game);return true;}
  if(index===10){powerCircuit(game);return true;}
  if(kind==='code'){code(game);return true;}
  if(kind==='trace'&&(getRoom(game,1).carrier.phase||0)<1){Quests.toast('The carrier is still moving. Follow its light to the receiver.');return true;}
  if(kind==='pulse'){
   const phase=game.maria414World.clock%5;if(phase<2.7){Quests.toast('Indicator red. Wait for gold, then press E.');return true;}
  }
  if(kind==='dialogue'){
   dialog(game,'SOMMI / THE SAME NIGHT','SOMMI: “I went in after the alarm. I took the case. The carrier followed me down here.”\n\nMARIA: “The rifles come home with me. You help open the return route.”', [['Open the return route',()=>{closeDialog(game);advance(game);game.maria414World.collapse=70;write({...read(),collapseStarted:true});}]]);return true;
  }
  if((kind==='inspect'||kind==='trace')&&CLUES[index]){const [title,body]=CLUES[index];dialog(game,title,body,[['Save recording / continue',()=>{closeDialog(game);advance(game);}]]);return true;}
  if(kind==='take'){q.rifles=true;write(q);game.sfx?.win?.();}
  if(kind==='return'){q.rifles=false;write(q);}
  if(kind==='finish'){
   if(!q.rewarded){store.mutate(s=>{s.pls+=REWARD;});q.rewarded=true;}
   q.complete=true;q.rifles=false;write(q);saveTime(game);leave(game);store.pushFeed('MARIA 414 — RECLAIMED. The rifles are home. +414 in-game PLS. THE SAME NIGHT recording unlocked.','event');Quests.toast('RECLAIMED · +414 PLS · THE SAME NIGHT unlocked');game.sfx?.win?.();game.saveFR?.();return true;
  }
  advance(game);return true;
 }
 function overlay(game,act){
  const el=document.createElement('div');el.id='maria414-cine';el.style.cssText='position:fixed;inset:0;z-index:2147482500;pointer-events:auto;color:white;font-family:Arial;background:linear-gradient(180deg,#01030a55,transparent 30%,transparent 65%,#01030a99)';
  el.innerHTML='<div style="position:absolute;top:0;left:0;right:0;height:8%;background:#01030a"></div><div style="position:absolute;bottom:0;left:0;right:0;height:8%;background:#01030a"></div><div id="maria414-cine-title" style="position:absolute;top:11%;left:6%;max-width:calc(100% - 145px);font:700 clamp(9px,1.2vw,12px)/1.5 Arial;letter-spacing:.12em;color:#f3c778"></div><div style="position:absolute;left:12%;right:12%;bottom:13%;text-align:center;text-shadow:0 2px 5px black"><div id="maria414-speaker" style="color:#f3c778;font:700 11px Arial;margin-bottom:8px"></div><div id="maria414-line" style="font:700 clamp(15px,2.5vw,24px)/1.4 Arial"></div></div>';
  el.querySelector('#maria414-cine-title').textContent=`MARIA 414 / ${String(act+1).padStart(2,'0')} / ${ACTS[act].toUpperCase()}`;
  const b=document.createElement('button');b.textContent='SKIP · ESC';b.style.cssText='position:absolute;right:4%;top:10%;padding:12px;background:#0d1726dd;border:1px solid #8a774e;color:#f3d6a0;font:700 11px Arial;min-height:44px';b.onclick=()=>finishCine(game,true);el.append(b);document.body.append(el);return el;
 }
 function cinematic(game,act,preview=false){
  if(game.maria414Cine||game.disposed)return;
  const w=game.maria414World,q=read();if(!preview){q.seen=[...new Set([...q.seen,act])];write(q);}
  const room=w.room>=0?w.room:0;const duration=Math.max(act===5?24:act===6?26:18,LINES[act].length*6);
  if(act===8)getRoom(game,room).reconstruction.time=0;
  if(act===6){teleport(game,point(room,0,0,-6));game.playerYaw=Math.PI;game.player.rotation.y=Math.PI;const r=getRoom(game,room);r.actorPrev=null;const legs=r.actor?.userData?.legs;if(legs){legs.phase=0;legs.gaitBlend29=0;}}
  game.maria414Cine={act,t:0,duration,el:overlay(game,act),last:-1,room,preview,fov:game.camera.fov,shot:-1};
  game.camera.fov=innerHeight>innerWidth?74:58;game.camera.updateProjectionMatrix();game.keys={};game.moveTarget=null;game.touchMoveVec=null;game.playerVel.set(0,0,0);store.set({panel:{type:'maria414-cine'},maria414CineActive:true});try{document.exitPointerLock?.();}catch(_){}
  // First camera pose is installed synchronously to avoid an exterior-frame flash.
  tickCine(game,0);
 }
 function finishCine(game,continueReplay=true){
  const c=game.maria414Cine;if(!c)return;game.maria414Cine=null;c.el?.remove();game.camera.fov=c.fov;game.camera.updateProjectionMatrix();game.keys={};game.moveTarget=null;game.touchMoveVec=null;game._storyCutsceneFrozenPos=null;store.set({maria414CineActive:false});if(store.get().panel?.type==='maria414-cine')store.set({panel:null});
  if(c.act===6)tickActor(game,getRoom(game,c.room),0);
  if(c.preview&&continueReplay){const w=game.maria414World;w.replayAct++;if(!w.replaySingle&&w.replayAct<10){const act=w.replayAct;const room=Math.min(act,8);for(const r of w.rooms.values())r.root.visible=false;getRoom(game,room).root.visible=true;w.room=room;game.scene.background=room===1?w.snapshot.background:new THREE.Color('#040914');game.scene.fog=new THREE.FogExp2('#07111c',room===1?.0015:.006);teleport(game,point(room,0,0,20));cinematic(game,act,true);}else{w.replaying=false;leave(game);}}
 }
 function tickCine(game,dt){
  const c=game.maria414Cine;if(!c)return;c.t+=dt;const k=Math.min(.999,c.t/c.duration),segment=Math.floor(k*3),u=(k*3)%1,e=u*u*(3-2*u),room=c.room;
  const sceneShots={
   0:[ [[-10,7,-17],[-9,5,-21],[-15,3,-26]],[[10,9,20],[7,6,13],[0,3,6]],[[11,5,-7],[9,4,-13],[15,4,-22]] ],
   1:[ [[-24,12,26],[-18,9,19],[0,6,-45]],[[22,7,14],[16,5,2],[-8,2,-12]],[[-20,4,-16],[-17,3,-20],[-12,2,-23]] ],
   2:[ [[-20,9,24],[-16,7,15],[0,9,-27]],[[13,5,-10],[9,4,-17],[0,6,-28]],[[-17,5,15],[-13,3,9],[-19,2,6]] ],
   3:[ [[-10,7,19],[-9,4,16],[-17,2,15]],[[10,7,8],[10,4,-8],[16,2,-20]],[[7,10,-19],[5,7,-23],[0,7,-29]] ],
   4:[ [[-20,9,24],[-16,5,18],[0,1,10]],[[20,6,9],[18,4,-3],[0,1,-12]],[[0,10,-12],[0,7,-20],[0,8,-34]] ],
   7:[ [[-21,12,27],[-19,9,19],[0,5,-18]],[[20,8,14],[20,5,1],[-16,2,-24]],[[7,5,17],[5,3,22],[0,3,29]] ],
   8:[ [[-10,6,-16],[-9,5,-20],[-15,3,-26]],[[12,8,15],[8,6,12],[0,3,6]],[[11,5,-9],[9,4,-14],[16,4,-22]] ],
   9:[ [[11,5,-12],[9,4,-16],[16,4,-22]],[[9,7,15],[6,5,12],[0,3,6]],[[0,4,15],[0,3,19],[0,3,-24]] ]
  };
  const poses=sceneShots[c.act]||[ [[-23,11,28],[-15,9,20],[0,5,-8]],[[19,7,15],[14,5,-7],[-10,3,-18]],[[-12,4,-6],[9,3,9],[0,2,17]] ];
  if(c.act===5){poses[0]=[[-23,14,25],[-20,11,18],[0,12,-2]];poses[1]=[[19,8,14],[20,11,-8],[0,11,-2]];poses[2]=[[19,4,-15],[18,3,-20],[14,2,-27]];}
  if(c.act===6){poses[0]=[[9,3.2,-12],[8,2.7,-10],[0,1.6,-18]];poses[1]=[[7,3,-5],[6,2.6,-7],[0,1.5,-12]];poses[2]=[[-8,3,-9],[-7,2.6,-9],[0,1.5,-9]];if(innerHeight>innerWidth)for(const pose of poses){pose[0][0]*=1.6;pose[1][0]*=1.6;}}
  const [a,b,l]=poses[segment];game.camera.position.lerpVectors(point(room,...a),point(room,...b),e);game.camera.lookAt(point(room,...l));
  const ix=Math.min(LINES[c.act].length-1,Math.floor(k*LINES[c.act].length));if(ix!==c.last){c.last=ix;c.el.querySelector('#maria414-speaker').textContent=LINES[c.act][ix][0];c.el.querySelector('#maria414-line').textContent=LINES[c.act][ix][1];game.sfx?.pickup?.();}
  if(c.t>=c.duration)finishCine(game,true);
 }
 function replayReady(game){return eligible()&&graduated()&&read().complete&&!game.disposed&&!game.maria414Inside&&!game.inst&&!game.dysActive&&!game.tut&&!game.treasuryInside;}
 function recordings(game){
  if(!replayReady(game))return false;
  dialog(game,'MARIA 414 / RECORDINGS','Choose a chapter or watch the full recording.',[
   ['PLAY ALL TEN ACTS',()=>{closeDialog(game);replay(game);}],
   ...ACTS.map((title,act)=>[`${String(act+1).padStart(2,'0')} / ${title}`,()=>{closeDialog(game);replay(game,act,true);}])
  ]);return true;
 }
 function replay(game,act=0,single=false){
  if(!replayReady(game)||!Number.isInteger(act)||act<0||act>=ACTS.length)return false;
  build(game);const w=game.maria414World;w.replaying=true;w.replaySingle=single;w.replayAct=act;hideHost(game);game.maria414Inside=true;w.inside=true;w.room=Math.min(act,8);
  for(const r of w.rooms.values())r.root.visible=false;
  getRoom(game,w.room).root.visible=true;game.scene.background=w.room===1?w.snapshot.background:new THREE.Color('#040914');game.scene.fog=new THREE.FogExp2('#07111c',w.room===1?.0015:.006);
  teleport(game,point(w.room,0,0,20));playerIdle(game);sync(game);cinematic(game,act,true);return true;
 }
 function guide(game,dt){
  const w=game.maria414World,q=read();if(q.complete||w.replaying||game.maria414Cine||game.maria414Dialog||!w.inside)return;
  const target=nextTarget(game).pos;
  if(!w.guide){w.guide=new THREE.Group();w.guide.name='maria414-local-guide';for(let i=0;i<12;i++){const p=new THREE.Mesh(new THREE.ConeGeometry(.13,.45,4),BASIC('#efc16c'));p.rotation.x=Math.PI/2;w.guide.add(p);}game.scene.add(w.guide);}
  w.guide.visible=true;const d=target.clone().sub(game.playerPos);d.y=0;const length=d.length(),unit=d.clone().normalize();
  w.guide.children.forEach((m,i)=>{const f=Math.min(length,1+i*Math.min(2,length/12));m.position.copy(game.playerPos).addScaledVector(unit,f);m.position.y=ORIGIN.y+.15;m.rotation.z=-Math.atan2(unit.x,unit.z);});
  const sy=Math.sin(game.camYaw),cy=Math.cos(game.camYaw);const dir=Math.atan2(d.x*cy-d.z*sy,-(d.x*sy+d.z*cy))*180/Math.PI;w.uiT=(w.uiT||0)+dt;if(w.uiT>.15){w.uiT=0;store.set({questDir:dir,questDist:Math.round(length),px:Math.round(game.playerPos.x),pz:Math.round(game.playerPos.z)});}
 }
 // Draw into the native minimap: its position, hide toggle and HUD scaling remain shared.
 Game.prototype.maria414DrawMinimap=function(cv,size){
  if(!this.maria414Inside){delete cv.dataset.maria414Room;return false;}
  const w=this.maria414World,ctx=cv.getContext('2d');if(!ctx||!w)return false;
  cv.dataset.maria414Room=String(w.room);
  const half=size/2,r=half-6,scale=(size-34)/Math.hypot(WIDTH,DEPTH);
  const project=(x,z)=>[half+(x-ORIGIN.x)*scale,half+(z-(ORIGIN.z-w.room*160))*scale];
  const q=read(),def=STEPS[q.step],room=getRoom(this,w.room);
  ctx.clearRect(0,0,size,size);ctx.save();ctx.beginPath();ctx.arc(half,half,r,0,Math.PI*2);ctx.clip();
  ctx.fillStyle='#081221ee';ctx.fillRect(0,0,size,size);
  const left=half-WIDTH*scale/2,top=half-DEPTH*scale/2;
  ctx.fillStyle='#263b4a';ctx.fillRect(left,top,WIDTH*scale,DEPTH*scale);
  ctx.strokeStyle='#71939c';ctx.lineWidth=1;ctx.strokeRect(left,top,WIDTH*scale,DEPTH*scale);
  ctx.strokeStyle='#48606c';ctx.lineWidth=.5;
  for(let z=-28;z<=28;z+=14){const y=half+z*scale;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(left+WIDTH*scale,y);ctx.stroke();}
  if(w.room===4)for(const h of room.hazards){const y=half+h.position.z*scale;ctx.strokeStyle=w.clock%5<2.7?'#ed776b':'#dbbb77';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(left+4,y);ctx.lineTo(left+WIDTH*scale-4,y);ctx.stroke();}
  if(room.carrier){const p=room.carrier.root.position;ctx.fillStyle='#79d1dc';ctx.beginPath();ctx.arc(half+p.x*scale,half+p.z*scale,2,0,Math.PI*2);ctx.fill();}
  const [px,py]=project(this.playerPos.x,this.playerPos.z);
  if(!q.complete&&!w.replaying&&def[1]===w.room){
   for(const nd of [...puzzleNodes(this),...depthNodes(this)]){const [x,y]=project(nd.it.pos.x,nd.it.pos.z);ctx.fillStyle=(nd.step===1&&q.puzzles.house.collected.includes(nd.index))||(nd.step===8&&q.puzzles.exit.collected.includes(nd.index))||(nd.step===29&&q.puzzles.district.done[nd.index])?'#79d7a0':'#79becb';ctx.fillRect(x-2,y-2,4,4);}
   const target=nextTarget(this).pos,[tx,ty]=project(target.x,target.z);
   ctx.setLineDash([2,3]);ctx.strokeStyle='#f0c678';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(tx,ty);ctx.stroke();ctx.setLineDash([]);
   ctx.fillStyle='#ffd078';ctx.beginPath();ctx.arc(tx,ty,3,0,Math.PI*2);ctx.fill();
  }
  ctx.save();ctx.translate(px,py);ctx.rotate(-this.playerYaw);ctx.fillStyle='#e7f3fa';ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(-3,3);ctx.lineTo(3,3);ctx.closePath();ctx.fill();ctx.restore();
  ctx.fillStyle='#f4c976';ctx.font=`bold ${size<110?8:9}px Arial`;ctx.textAlign='center';ctx.fillText(w.room===1?'414 / ROOF':`414 / ${w.room+1}`,half,15);
  ctx.restore();ctx.strokeStyle='#9b895f';ctx.lineWidth=1;ctx.beginPath();ctx.arc(half,half,r,0,Math.PI*2);ctx.stroke();return true;
 };
 function tick(game,dt){
  if(!eligible())return;
  const q=read();if(!q.started&&!q.complete&&graduated()&&!game.tut&&!store.get().tut&&store.get().phase==='playing'&&!store.get().panel&&!game.inst&&!game.dysActive&&!store.get().campaignBanner&&!game.treasuryInside){start(game);return;}
  const w=game.maria414World;if(!w||!w.inside)return;
  playerIdle(game);
  w.clock+=dt;
  if(!w.replaying){w.saveClock+=dt;if(w.saveClock>=12)saveTime(game);}
  const room=getRoom(game,w.room);
  tickActor(game,room,dt);
  const visualStep=w.replaying?[0,3,7,10,13,17,22,24,28,30][w.replayAct]:q.step;
  room.animated.forEach(a=>{a.mesh.rotation[a.axis]+=dt*a.speed*(visualStep>=20?.2:1);});
  room.hazards.forEach((h,i)=>{h.position.z=(i? -12:10)+Math.sin(w.clock*.8+i*2)*9;h.material.color.set(w.clock%5<2.7?'#d56959':'#d5af62');});
  room.drones.forEach((m,i)=>{m.rotation.x+=dt*(i%3+.4);m.rotation.z+=dt*.3;m.position.y-=dt*(2+i%4);if(m.position.y<.4)m.position.y=12+i%3;});
  if(room.carrier){
   const c=room.carrier,step=Math.max(3,Math.min(5,visualStep)),prev=step===3?[0,22]:[STEPS[step-1][2],STEPS[step-1][3]],next=[STEPS[step][2],STEPS[step][3]];
   if(!game.maria414Dialog){c.time=(c.time||0)+dt;}c.phase=Math.min(1,(c.time||0)/6);
   const pos=t=>V(prev[0]+(next[0]-prev[0])*t,2.3+Math.sin(t*Math.PI)*1.5,prev[1]+(next[1]-prev[1])*t);
   c.root.position.copy(pos(c.phase));c.core.rotation.y+=dt*1.1;c.halo.rotation.y+=dt*.8;
   c.trail.forEach((p,i)=>{p.position.copy(pos(Math.max(0,c.phase-i*.025)));p.visible=visualStep<=5&&c.phase<1;});
   c.root.visible=visualStep<=6||w.replaying;
  }
  if(room.engineCore){
   room.collars.forEach((c,i)=>c.material.color.set(visualStep>17+i?'#394a59':'#f0c87b'));
   room.engineCore.material.emissiveIntensity=visualStep>=20?.14:.7+(20-visualStep)*.13+Math.sin(w.clock*2)*.12;
   room.engineCore.position.y=visualStep>=20?6:8+Math.sin(w.clock*.8)*.2;
  }
  if(w.room===3){
   const early=game.maria414Cine?.act===3&&game.maria414Cine.t<6,restored=visualStep>=11;
   room.hemisphere.intensity=early?.035:restored?1.6:.22;room.ambient.intensity=early?.025:restored?1.3:.17;
   room.light.intensity=early?4:restored?400:100;room.fill.intensity=early?4:restored?220:65;
  }
  if(w.room===7){room.light.intensity=180+Math.sin(w.clock*6)*100;room.fill.intensity=110;}
  if(room.reconstruction){
   const c=room.reconstruction;c.time+=dt;c.pulse.scale.setScalar(1+Math.sin(w.clock*1.1)*.045);
   const sting=game.maria414Cine?.act===9&&game.maria414Cine.t>=game.maria414Cine.duration*.75;
   c.blocks.forEach(({light,district})=>{const repaired=w.replaying||visualStep<29||q.puzzles.district.done[district];light.material.color.set(sting?'#203142':!repaired?'#30424c':room.i===8&&c.time<(district+1)*2?'#30424c':'#67c8d1');});
   c.districtWindows.forEach((m,district)=>{const live=!sting&&(w.replaying||visualStep<29||q.puzzles.district.done[district])&&!(room.i===8&&c.time<(district+1)*2);m.material.color.set(live?'#accdc1':'#17232c');});
   if(room.i===8){room.light.intensity=sting?3:650;room.fill.intensity=sting?3:390;room.hemisphere.intensity=sting?.06:2.6;room.ambient.intensity=sting?.04:2.2;}
  }
  tickArchitecture(room,w.clock,visualStep,game);
  for(const [ix,nd]of w.nodeMeshes){if(ix===q.step)nd.screen.quaternion.copy(game.camera.quaternion);if(ix===q.step&&STEPS[ix][6]==='pulse')nd.beam.material.color.set(w.clock%5<2.7?'#d56959':'#ffd078');}
  if(game.maria414Cine){if(w.guide)w.guide.visible=false;tickCine(game,dt);return;}
  if(store.get().panel)return;
  if(w.room===4&&q.step>=13&&q.step<=14&&w.clock%5<2.7){
   for(const h of room.hazards)if(Math.abs(game.playerPos.z-(ORIGIN.z-4*160+h.position.z))<.35&&Math.abs(game.playerPos.x-ORIGIN.x)<21){teleport(game,point(4,q.step===13?0:-20,0,q.step===13?23:16));Quests.toast('SCAN CONTACT · gate checkpoint restored');w.clock=3;break;}
  }
  if(w.room===7&&q.step>=24&&q.step<=27){
   w.collapse-=dt;const sec=Math.max(0,Math.ceil(w.collapse));if(sec!==w.lastSec){w.lastSec=sec;refresh();}
   if(w.collapse<=0){q.step=24;write(q);w.collapse=70;teleport(game,point(7,0,0,24));sync(game);Quests.toast('PURGE CAUGHT THE LIFT · retry from relay A. Rifles retained.');}
  }
  if(STEPS[q.step][6]==='reach'&&game.playerPos.distanceTo(node(game,q.step).it.pos)<2.8){advance(game);}
  guide(game,dt);
 }
 const oldActive=window.__sommi414StoryActive,oldCard=window.__sommi414QuestCard;
 window.__maria414StoryActive=()=>eligible()&&read().started&&!read().complete;
 window.__sommi414StoryActive=()=>window.__maria414StoryActive()||oldActive?.()||false;
 window.__sommi414QuestCard=()=>{
  if(!window.__maria414StoryActive())return oldCard?.();
  const q=read(),def=STEPS[q.step],w=window.__game?.maria414World;
  return {character:'MARIA',label:'MARIA 414 · RECLAIMED',location:ACTS[def[0]].toUpperCase(),step:q.step+1,total:STEPS.length,title:def[4],desc:def[5],next:q.step===1?'Save the three local recordings, then reconstruct their order at the house recorder.':q.step===10?'Read the breaker instructions, rotate the three switches and test the circuit.':q.step===8?'Read the four cable plates, then reconstruct the service route.':q.step>=17&&q.step<=19?'Connect every circuit segment, then engage the stabilizer on gold.':q.step===29?'Restore the four district panels, then return to the house recorder.':def[6]==='trace'?'Follow the carrier light; save its trace at the gold receiver.':def[6]==='reach'?'Walk to the gold marker.':'Follow the gold guide. Press E or the touch interact button at the console.',hint:puzzleHint()||(w?.room===7?`PURGE · ${Math.ceil(w.collapse)}s`:`ACT ${def[0]+1}/10 · CHECKPOINT SAVED`),reward:REWARD};
 };
 const baseBuild=Game.prototype.buildWorld;Game.prototype.buildWorld=function(...args){const out=baseBuild.apply(this,args);if(eligible())build(this);return out;};
 const ground=Game.prototype.groundH;Game.prototype.groundH=function(x,z){if(this.maria414Inside)return ORIGIN.y;return ground.call(this,x,z);};
 const baseInteract=Game.prototype.interact;Game.prototype.interact=function(target=null){const it=target||this.nearestInteractable();if(eligible()&&it?.id?.startsWith('maria414-')){if(!storyCutsceneInputLocked(store.get()))interact(this,it);return;}return baseInteract.call(this,target);};
 const nearest=Game.prototype.nearestInteractable;Game.prototype.nearestInteractable=function(){if(this.maria414Inside){if(this.maria414Cine||read().complete)return null;return activeTargets(this).filter(it=>this.playerPos.distanceTo(it.pos)<it.radius).sort((a,b)=>this.playerPos.distanceTo(a.pos)-this.playerPos.distanceTo(b.pos))[0]||null;}return nearest.call(this);};
 const update=Game.prototype.updatePlayer;Game.prototype.updatePlayer=function(dt){const out=update.call(this,dt);if(this.maria414Inside&&!this.maria414Cine){const room=this.maria414World.room;this.playerPos.x=THREE.MathUtils.clamp(this.playerPos.x,ORIGIN.x-WIDTH/2+1.2,ORIGIN.x+WIDTH/2-1.2);this.playerPos.z=THREE.MathUtils.clamp(this.playerPos.z,ORIGIN.z-room*160-DEPTH/2+1.2,ORIGIN.z-room*160+DEPTH/2-1.2);this.player.position.copy(this.playerPos);if(this.viewBlend>.5){this.camera.position.x=THREE.MathUtils.clamp(this.camera.position.x,ORIGIN.x-WIDTH/2+1,ORIGIN.x+WIDTH/2-1);this.camera.position.z=THREE.MathUtils.clamp(this.camera.position.z,ORIGIN.z-room*160-DEPTH/2+1,ORIGIN.z-room*160+DEPTH/2-1);this.camera.position.y=Math.min(ORIGIN.y+13,this.camera.position.y);this.camera.lookAt(this.playerPos.clone().add(V(0,1.7,0)));}}tick(this,dt);return out;};
 const waypoint=Game.prototype.questWaypointPos;Game.prototype.questWaypointPos=function(){if(window.__maria414StoryActive()&&!this.tut){build(this);return this.maria414Inside?nextTarget(this).pos:this.maria414World.entryPos;}return waypoint.call(this);};
 const stepInfo=Game.prototype.questStepInfo;Game.prototype.questStepInfo=function(...args){if(window.__maria414StoryActive()&&!this.tut){const q=read(),d=STEPS[q.step];return {text:`MARIA 414 · ${ACTS[d[0]]} — ${d[4]}. ${d[5]}`,wp:this.maria414Inside?'maria414-step-'+q.step:'maria414-entry'};}return stepInfo.apply(this,args);};
 const dayNight=Game.prototype.updateDayNight;Game.prototype.updateDayNight=function(dt){if(!this.maria414Inside)return dayNight.call(this,dt);};
 const save=Game.prototype.saveFR;Game.prototype.saveFR=function(...args){const snap=this.maria414World?.snapshot;if(!this.maria414Inside||!snap)return save.apply(this,args);const p=this.playerPos.clone();this.playerPos.copy(snap.pos);try{return save.apply(this,args);}finally{this.playerPos.copy(p);}};
 const graduation=Game.prototype.finishTutorial;Game.prototype.finishTutorial=function(outcome){const ok=graduation.call(this,outcome);if(ok&&outcome==='completed'&&eligible())start(this);return ok;};
 const dispose=Game.prototype.dispose;Game.prototype.dispose=function(...args){if(this.maria414World){saveTime(this);leave(this);destroyWorld(this);}return dispose.apply(this,args);};
 Game.prototype.maria414Start=function(){return start(this);};Game.prototype.maria414Pause=function(){saveTime(this);leave(this);};
 Game.prototype.maria414Replay=function(act=0,single=false){return replay(this,act,single);};
 Game.prototype.maria414Recordings=function(){return recordings(this);};
 window.__maria414Quest={revision:5,acts:ACTS,steps:STEPS,read,snapshot:()=>({pls:store.get().pls,mainQuests:store.get().mainQuests,mainQuestIndex:store.get().mainQuestIndex}),begin:start,interact,replay,checkpoint:()=>read().step,depth:{engineFlow,districtSolution,districtSeed}};
 const onKey=e=>{const g=window.__game;if(!g||(!g.maria414Inside&&!g.maria414Dialog))return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(g.maria414Dialog)closeDialog(g);else if(g.maria414Cine)finishCine(g,true);else{saveTime(g);leave(g);}}};window.addEventListener('keydown',onKey,true);
})();
// END MARIA 414 — RECLAIMED R5

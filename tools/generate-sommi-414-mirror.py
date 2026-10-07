"""Generate Sommi's companion route from the shared quest implementation.
The native five-objective rifle raid remains the prerequisite and is not rewritten.
"""
from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[1]
s=(root/'quests'/'maria-414-reclaimed.js').read_text()
s=s.replace('maria414','sommiMirror414').replace('maria-414-', 'sommi-mirror-414-')
s=s.replace('// MARIA 414 — RECLAIMED · R5.', '// SOMMI 414 — THE SAME NIGHT · R4.').replace('// END MARIA 414 — RECLAIMED R5','// END SOMMI 414 — THE SAME NIGHT R4')
s=s.replace('atropa_maria_414_reclaimed_v1','atropa_sommi_414_same_night_v1')
s=s.replace('sommiMirror414Revision = 5','sommiMirror414Revision = 4').replace('__sommiMirror414Quest={revision:5','__sommiMirror414Quest={revision:4')
s=s.replace('Select the events in the order they happened.', 'Put your actions on record in the order they happened.')
s=s.replace("const eligible=()=>!CW&&!FR&&loadSkinId()==='maria-414';", "const eligible=()=>{if(CW||FR||loadSkinId()!=='sommi')return false;try{const q=JSON.parse(localStorage.getItem('atropa_sommi_414_house_v1')||'null');return q?.v===1&&q.complete===true;}catch(_){return false;}};")
s=s.replace('const ORIGIN={x:900,y:12,z:900}', 'const ORIGIN={x:900,y:12,z:-800}')
s=s.replace('const x=-99,z=73', 'const x=-82,z=74')
s=s.replace('it.id.slice(14)', "it.id.slice('sommiMirror414-step-'.length)")
s=s.replace('rifles:false,elapsed:0', 'rifles:true,elapsed:0')
s=s.replace("const actor=buildSommiPlayer();", "if(typeof PLAYER_SKINS==='undefined'||!PLAYER_SKINS.some(s=>s.id==='maria-414'))throw new Error('Maria model not available in this build');const actor=buildPlayerSkin('maria-414');")
s=s.replace("window.__atropaPrimePacked?.('sommi-glb')", 'undefined')
s=s.replace("// Use Sommi's actual uploaded mesh; it is primed asynchronously only for this encounter.", "// Use the registered Maria model; unavailable models get an explicit voice link.")
s=s.replace("textPanel(root,'SOMMI / VOICE LINK','I took them. Let me help you get them out.'", "textPanel(root,'MARIA / VOICE LINK','The rifles come home. You open the way out.'")
s=s.replace("[['Open the return route',", "[['Tell Maria the truth / open the return route',")
s=s.replace("'SOMMI / THE SAME NIGHT','SOMMI: “I went in after the alarm. I took the case. The carrier followed me down here.”\\n\\nMARIA: “The rifles come home with me. You help open the return route.”'", "'MARIA / THE SAME NIGHT','SOMMI: “I disabled the alarm. I took the case. When the engine answered, I thought I could fix it before you noticed.”\\n\\nMARIA: “Start with the truth. Then help me get them home.”'")
s=s.replace('q.checkpoint=q.step;write(q);', 'q.checkpoint=q.step;if(q.step===17)q.rifles=false;write(q);')
s=s.replace("'MARIA’S FAMILY HOUSE. ENTER THE STORY.'", "'SOMMI / AFTER THE RAID / THE SAME NIGHT'")
s=s.replace("character:'MARIA'", "character:'SOMMI'")
s=s.replace('MARIA 414 · RECLAIMED','SOMMI · THE SAME NIGHT').replace('MARIA 414 — RECLAIMED','SOMMI — THE SAME NIGHT').replace('MARIA 414 /','SOMMI / THE SAME NIGHT /').replace('E — MARIA 414 · enter / resume RECLAIMED','E — SOMMI · enter / resume THE SAME NIGHT')
s=s.replace('MARIA 414 · ${ACTS', 'SOMMI · ${ACTS').replace("'414 / RECLAIMED'", "'414 / THE SAME NIGHT'").replace("'RECLAIMED · +414 PLS · THE SAME NIGHT unlocked'", "'SOMMI · +414 PLS · THE SAME NIGHT unlocked'")
s=s.replace("'MARIA 414 / RECORDINGS'", "'SOMMI / THE SAME NIGHT / RECORDINGS'")
s=s.replace("textPanel(root,'SECOND RETURN ROUTE','HOUSE RECORDER / SAME NIGHT / TWO ACCOUNTS'", "textPanel(root,'MARIA / RETURN ROUTE','HOUSE RECORDER / SAME NIGHT / TWO ACCOUNTS'")
s=s.replace("textPanel(root,i===6?'RETURN ROUTE'", "textPanel(root,i===6?'MARIA / RETURN ROUTE'")
acts=['Borrowed','No Silent Exit','The Door That Knows','Power Debt','Under the House','The Price of Borrowing','Maria','A Way Back','The Truth Comes Home','The Other Account']
lines=[
 [['SOMMI','I got out. So why is the case still answering the house?'],['HOUSE RECORDER','Local access. Sommi. Rack alarm disabled.'],['SOMMI','I was going to tell her. After I figured this out.']],
 [['SOMMI','Someone copied my route across the roof.'],['CARRIER 414','Borrower detected. Return circuit interrupted.'],['SOMMI','That is not a tracker. It is calling the case home.']],
 [['SYSTEM','Your exit has been approved.'],['SOMMI','That is the same voice from inside the case.'],['SYSTEM','Please remain where you are.']],
 [['SOMMI','I switched off one alarm. Not the whole building.'],['EMERGENCY BUS','Carrier debt. Manual power only.'],['SOMMI','Breaker first. Again.']],
 [['SOMMI','The route goes underneath the house.'],['SUBLEVEL 414','Borrowed carrier accepted.'],['SOMMI','I should have put them back when I had the chance.']],
 [['SOMMI','It said the cradle would clear the return circuit.'],['RIFLE ENGINE','Four-one-four. Carrier seated.'],['SOMMI','Now it will not release the case. I have to disconnect it.']],
 [['MARIA','Sommi.'],['SOMMI','I disabled the alarm. I took the case.'],['MARIA','And then you brought it here.'],['SOMMI','I thought I could fix it before anyone noticed.']],
 [['SYSTEM','Borrowed carrier released. Purge armed.'],['MARIA','Keep the case. I will take it at the house.'],['SOMMI','The second route. I know where it goes.']],
 [['SOMMI','Back where they belong.'],['MARIA','No more borrowing without asking.'],['SOMMI','Your aunt is going to want the long version, isn’t she?']],
 [['HOUSE RECORDER','The same night. Two accounts.'],['SOMMI','Do not delete the part where I took them.'],['MARIA','We keep all of it.'],['UNKNOWN SIGNAL','RESTORED? NO.']]
]
# Keep indices and mechanics aligned while authoring the opposite account.
base=[
('Inspect the empty catches','The rack is empty because you took the case. Check what its carrier woke.'),
('Read your recorded entry','The recorder kept the moment you disabled the alarm.'),
('Trace the borrowed carrier','Take the case across the rooftop. Its signal is still moving.'),
('Recover your rooftop trace 1/3','Follow the moving carrier to the first receiver.'),
('Recover your rooftop trace 2/3','The second receiver has copied your route across the roof.'),
('Recover your rooftop trace 3/3','The last receiver points back below the house.'),
('Answer the carrier','The copied return code is 4, then 1, then 4.'),
('Try the promised exit','The system claims it can erase the return debt.'),
('Inspect the disconnected door','Trace four cable plates and reconstruct the actual service route.'),
('Open the actual route','Follow the service line below the house.'),
('Restore the emergency bus','You cut the rack alarm. Restore the bus you accidentally woke.'),
('Release the descent brake','Wait for gold before releasing the cage.'),
('Follow the case below 414','The engine is answering the borrowed carrier.'),
('Cross the first scan gate','Use the outer service lane. Cross the short final gap when the beams turn gold.'),
('Cross the second scan gate','Follow the service lane around the sweeps. Wait for gold before the final crossing.'),
('Open the carrier cradle','Answer the engine with 4, 1, 4.'),
('Seat the case in the cradle','The machine promises to clear the return circuit. Place the case.'),
('Disconnect collar 1/3','The cradle has locked the rifles. Rebuild the first circuit, then engage its gold collar.'),
('Disconnect collar 2/3','Reconnect every segment of the second circuit, then engage its gold collar.'),
('Disconnect collar 3/3','Rebuild the spiral circuit and free the final gold collar.'),
('Take the case back','The engine is isolated. Remove the borrowed rifles.'),
('Meet Maria','She followed the same signal. She knows who took the rifles.'),
('Tell Maria the truth','Keep your entire account on the recorder.'),
('Open the second return route','You know another way out. Use it together.'),
('Collapse: reach relay A','Carry the case to the first illuminated relay.'),
('Collapse: reach relay B','Keep moving through the shutdown.'),
('Collapse: release the blast door','Open the manual door for the return lift.'),
('Bring the rifles home','Maria is waiting for the case at the house.'),
('Put back what you borrowed','Return the case to the family rack.'),
('Save your full confession','Restore the four district circuits, then keep both accounts on record.'),
('Read the other account','Maria saved the unknown message alongside your recording.'),
('Return to Atropa','The theft is on record. The rifles are home.')]
original_steps=re.search(r' const STEPS=\[\n(.*?)\n \];',s,re.S)
assert original_steps
rows=[]
for i,row in enumerate(original_steps[1].splitlines()):
 row=re.sub(r"'[^']*','[^']*'",lambda _:json.dumps(base[i][0],ensure_ascii=False)+','+json.dumps(base[i][1],ensure_ascii=False),row,count=1)
 rows.append(row)
s=s[:original_steps.start()]+" const STEPS=[\n"+'\n'.join(rows)+"\n ];"+s[original_steps.end():]
a=s.index(' const ACTS=');b=s.index('\n',a);s=s[:a]+' const ACTS='+json.dumps(acts,ensure_ascii=False)+';'+s[b:]
a=s.index(' const LINES=');b=s.index('\n const S=',a);s=s[:a]+' const LINES='+json.dumps(lines,ensure_ascii=False)+';'+s[b:]
clues={
0:['EMPTY CATCHES','The alarm did not fail. You disabled it. The rack did not open itself. You took the case. Its return circuit is still connected to the house.'],
1:['YOUR ENTRY / HOUSE RECORDER','The recorder shows the entire raid: your arrival, the breaker, the open rack and your exit. The case started answering a second carrier after you left.'],
3:['YOUR TRACE 1 / 4','The roof receiver copied your route. First carrier digit: 4.'],
4:['YOUR TRACE 2 / 1','Second carrier digit: 1. The return circuit is broadcasting below the house.'],
5:['YOUR TRACE 3 / 4','Third carrier digit: 4. Return carrier: 4 → 1 → 4. The machine knows which case you took.'],
7:['APPROVED EXIT / NO CABLE','The door repeats the voice from the case. There is a wall behind it. The promise to erase the return debt was bait.'],
8:['SERVICE LINE','The live cable goes below the house. The emergency bus can still release the descent cage.'],
10:['EMERGENCY BUS','Manual power restored. The cage brake is red during its sweep and gold when it can be engaged.'],
26:['BLAST DOOR','The manual safety interlock is open. Bring the case to the illuminated lift.'],
29:['THE FULL CONFESSION','SOMMI: “I disabled the alarm. I took the case. I put it in the cradle because it promised to fix the carrier.”\n\nMARIA: “We keep that part in the recording too.”\n\nSOMMI: “All of it.”'],
30:['THE OTHER ACCOUNT','Maria recorded the unknown message: “You returned what was taken. Who returned you?”\n\nThe same night now has two accounts. Neither is erased.']}
a=s.index(' const CLUES=');b=s.index('\n const LINES=',a);s=s[:a]+' const CLUES='+json.dumps(clues,ensure_ascii=False)+';'+s[b:]
# Native raid progression is untouched. The companion route owns a separate save.
s=s.replace("window.__sommiMirror414Quest={", "window.__sommiMirror414Eligible=eligible;\n window.__sommiMirror414Quest={")
out=root/'quests'/'sommi-414-mirror.js';out.write_text(s)
print(out.name,'generated; 32 objectives; independent save; requires completed native Sommi raid')

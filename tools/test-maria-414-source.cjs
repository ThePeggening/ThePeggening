// Quest logic checks in a host shim. This is not a WebGL or full-game test.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
class Vec{
 constructor(x=0,y=0,z=0){this.set(x,y,z)}set(x,y,z){Object.assign(this,{x,y,z});return this}setScalar(v){return this.set(v,v,v)}copy(p){return this.set(p.x,p.y,p.z)}clone(){return new Vec(this.x,this.y,this.z)}add(p){this.x+=p.x;this.y+=p.y;this.z+=p.z;return this}sub(p){this.x-=p.x;this.y-=p.y;this.z-=p.z;return this}addScaledVector(p,s){this.x+=p.x*s;this.y+=p.y*s;this.z+=p.z*s;return this}length(){return Math.hypot(this.x,this.y,this.z)}normalize(){return this.length()?this.set(this.x/this.length(),this.y/this.length(),this.z/this.length()):this}distanceTo(p){return this.clone().sub(p).length()}toArray(){return [this.x,this.y,this.z]}lerpVectors(a,b,t){return this.copy(a).addScaledVector(b.clone().sub(a),t)}
}
class Color{constructor(value){this.set(value)}set(value){this.value=value;return this}}
class Obj{
 constructor(){this.position=new Vec();this.rotation=new Vec();this.scale=new Vec(1,1,1);this.quaternion={copy(){}};this.children=[];this.userData={};this.visible=true;this.matrix={}}
 add(...objects){for(const obj of objects){obj.removeFromParent();obj.parent=this;this.children.push(obj)}}removeFromParent(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null}updateMatrix(){}setMatrixAt(){}setColorAt(){}lookAt(p){this.lastLook=p.clone()}updateProjectionMatrix(){}
}
class Mat{constructor(opts={}){Object.assign(this,opts);this.color=new Color(opts.color)}}
class Mesh extends Obj{constructor(geometry,material){super();this.geometry=geometry;this.material=material}}
class Light extends Obj{constructor(color,b=1,intensity){super();this.intensity=intensity??b}}
const draw=new Proxy({measureText:t=>({width:t.length*14})},{get:(t,k)=>k in t?t[k]:(()=>{})});
class El{
 constructor(tag,doc){this.tagName=tag;this.doc=doc;this.style={};this.children=[];this.dataset={};this.textContent='';this.queries={}}
 append(...els){this.children.push(...els)}appendChild(el){this.append(el)}remove(){if(this.id)this.doc.ids.delete(this.id);for(const x of this.children)x.remove()}
 insertBefore(el,before){const i=this.children.indexOf(before);if(i<0)this.append(el);else this.children.splice(i,0,el);return el;}
 setAttribute(){}getContext(){return draw}querySelector(q){if(!this.queries[q])this.queries[q]=new El('span',this.doc);return this.queries[q]}
 set id(v){this._id=v;this.doc.ids.set(v,this)}get id(){return this._id}
}
function setup(saved,options={}){
 const Vector=options.THREE?.Vector3||Vec,HostGroup=options.THREE?.Group||Obj;
 const doc={ids:new Map(),createElement(tag){return new El(tag,this)},getElementById(id){return this.ids.get(id)},exitPointerLock(){}};doc.body=new El('body',doc);
 const storage=new Map(saved?[[options.mirror?'atropa_sommi_414_same_night_v1':'atropa_maria_414_reclaimed_v1',JSON.stringify(saved)]]:[]);
 if(options.native)storage.set('atropa_sommi_414_house_v1',JSON.stringify(options.native));
 const state={phase:'playing',pls:50,mainQuests:['original'],mainQuestIndex:2,sommi414UiVersion:0,panel:null};
 class Game{
  constructor(){this.scene=options.THREE?new options.THREE.Scene():new Obj();this.scene.background=options.THREE?new options.THREE.Color('#171030'):{originalSky:true};this.scene.fog=options.THREE?new options.THREE.FogExp2('#171030',.001):{originalFog:true};this.player=new HostGroup();this.playerPos=new Vector(2,0,3);this.playerVel=new Vector();this.camera=options.THREE?new options.THREE.PerspectiveCamera(60,1.6,.1,1000):new Obj();this.camera.fov=60;this.scene.add(this.player,this.camera);this.interactables=[];this.playerYaw=0;this.camYaw=0;this.camPitch=0;this.viewBlend=1;this.viewBlendTarget=1;this.clock={getDelta(){}};this.canvas={focus(){}};this.sfx={pickup(){},win(){},burn(){}}}
  buildWorld(){}groundH(){return 0}interact(){}nearestInteractable(){return null}updatePlayer(){}questWaypointPos(){return new Vec()}questStepInfo(){return {text:'old'}}updateDayNight(){}saveFR(){this.savedPosition=this.playerPos.clone()}finishTutorial(){return true}dispose(){}
 }
 const THREE={Vector3:Vec,Color,Group:Obj,Object3D:Obj,Mesh,InstancedMesh:Mesh,MeshStandardMaterial:Mat,MeshBasicMaterial:Mat,HemisphereLight:Light,AmbientLight:Light,PointLight:Light,FogExp2:class{constructor(color,density){Object.assign(this,{color,density})}},CanvasTexture:class{},MathUtils:{clamp:(v,a,b)=>Math.max(a,Math.min(v,b))}};
 for(const k of ['BoxGeometry','PlaneGeometry','TorusGeometry','CylinderGeometry','IcosahedronGeometry','TetrahedronGeometry','ConeGeometry'])THREE[k]=class{};
 const context={Game,THREE:options.THREE||THREE,CW:false,FR:false,loadSkinId:()=> options.skin||'maria-414',loadPrestigeSave:()=>({trialOutcome:'completed'}),campaignLegacyVeteranHasProgress:()=>false,store:{get:()=>state,set:next=>Object.assign(state,next),mutate:fn=>fn(state),pushFeed(){}},Quests:{toast(){}},storyCutsceneInputLocked:s=>!!(s.maria414CineActive||s.sommiMirror414CineActive),document:doc,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},innerHeight:900,innerWidth:1440,buildSommiPlayer:()=>new HostGroup(),console,...options.globals};
 const listeners=new Map();context.window=context;context.addEventListener=(name,fn)=>{if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(fn);};
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../quests/maria-414-reclaimed.js'),'utf8'),context);
 if(options.mirror)vm.runInContext(fs.readFileSync(path.join(__dirname,'../quests/sommi-414-mirror.js'),'utf8'),context);
 const game=new Game();context.__game=game;game.buildWorld();return {game,context,state,doc,storage,listeners};
}
function skip(h){const c=h.game.maria414Cine;if(c)c.el.children.at(-1).onclick()}
function tick(h,seconds){for(let t=0;t<seconds;t+=.1)h.game.updatePlayer(.1)}
function button(h,label){const dialog=h.doc.getElementById('maria414-dialog'),card=dialog.children[0];return card.children.find(x=>x.tagName==='button'&&x.textContent===label)}
function preparePuzzle(h,p,index){
 const w=h.game[p+'World'];
 if(index===8||index>=17&&index<=19||index===29){
  const api=h.context['__'+p+'Quest'],q=()=>api.read(),buttons=()=>{const collect=el=>el.children.flatMap(child=>[child,...collect(child)]);return collect(h.doc.getElementById(p+'-dialog'));},press=label=>{const b=buttons().find(b=>b.tagName==='button'&&b.textContent===label);assert.ok(b,'Missing '+label);b.onclick();},go=it=>{h.game.playerPos.copy(it.pos);h.game.interact(it);};
  if(index===8){for(let n=0;n<4;n++)if(!q().puzzles.exit.collected.includes(n)){go(w.depthMeshes.get('8:'+n).it);press('RECORD CABLE EVIDENCE');}if(!q().puzzles.exit.solved){go(w.nodeMeshes.get(8).it);for(let n=0;n<4;n++)while(q().puzzles.exit.routes[n]!==[3,1,2,0][n])buttons().find(b=>b.dataset.depthRoute===String(n)).onclick();press('TEST LIVE ROUTE');}}
  if(index>=17&&index<=19&&!q().puzzles.engine.solved[index-17]){const stage=index-17;go(w.nodeMeshes.get(index).it);for(let n=0;n<16;n++)while(q().puzzles.engine.turns[stage][n]!==0)buttons().find(b=>b.dataset.depthCell===String(n)).onclick();press('ISOLATE CIRCUIT');}
  if(index===29){for(let n=0;n<4;n++)if(!q().puzzles.district.done[n]){go(w.depthMeshes.get('29:'+n).it);for(const cell of api.depth.districtSolution(q().puzzles.district.boards[n]))buttons().find(b=>b.dataset.depthCell===String(cell)).onclick();press('RESTORE DISTRICT');}}
  return;
 }
 if(index===1){for(let n=0;n<3;n++){const it=w.puzzleMeshes.get('1:'+n).it;h.game.playerPos.copy(it.pos);assert.equal(h.game.nearestInteractable().id,it.id);h.game.interact(it);h.doc.getElementById(p+'-dialog').children[0].children.find(x=>x.tagName==='button'&&x.textContent!=='CLOSE').onclick();}
  const it=w.nodeMeshes.get(1).it;h.game.playerPos.copy(it.pos);h.game.interact(it);for(const title of ['ALARM DISABLED','CASE REMOVED','CARRIER WAKES'])h.doc.getElementById(p+'-dialog').children[0].children.find(x=>x.tagName==='button'&&x.textContent===title).onclick();
 }else if(index===10){for(const [n,turns] of [[0,3],[1,1],[2,2]]){const it=w.puzzleMeshes.get('10:'+n).it;h.game.playerPos.copy(it.pos);assert.equal(h.game.nearestInteractable().id,it.id);for(let turn=0;turn<turns;turn++)h.game.interact(it);}}
}
function completeObjective(h,index){
 skip(h);const q=h.context.__maria414Quest.read();assert.equal(q.step,index);preparePuzzle(h,'maria414',index);if(index===1)return;const nd=h.game.maria414World.nodeMeshes.get(index),kind=h.context.__maria414Quest.steps[index][6];h.game.playerPos.copy(nd.it.pos);
 if(kind==='trace'){
  if(h.game.maria414World.rooms.get(1).carrier.phase<1){h.game.interact(nd.it);assert.ok(!h.game.maria414Dialog,'trace must not open before arrival');}
  tick(h,6.2);
 }
 if(kind==='pulse')h.game.maria414World.clock=3.5;
 h.game.interact(nd.it);
 if(kind==='code'){for(const n of ['4','1','4'])button(h,n).onclick()}
 else if(h.game.maria414Dialog){const card=h.doc.getElementById('maria414-dialog').children[0];card.children.find(x=>x.tagName==='button'&&x.textContent!=='CLOSE').onclick()}
}
const h=setup();assert.equal(h.game.maria414Start(),true);const original=h.game.maria414World.snapshot;
for(let i=0;i<32;i++){
 completeObjective(h,i);
 if(i===2){assert.equal(h.game.scene.background,original.background);assert.equal(h.game.maria414World.rooms.get(1).root.children.some(x=>x.name==='maria414-rooftop-skyline'),true)}
 if(i===9){tick(h,.1);assert.equal(h.game.maria414World.rooms.get(3).ambient.intensity,.025);skip(h);tick(h,.1);assert.equal(h.game.maria414World.rooms.get(3).ambient.intensity,.17)}
 if(i===10){tick(h,.1);assert.equal(h.game.maria414World.rooms.get(3).ambient.intensity,1.3)}
 if(i===19){tick(h,.1);assert.equal(h.game.maria414World.rooms.get(5).engineCore.material.emissiveIntensity,.14)}
 if(i===23){skip(h);h.game.maria414World.collapse=.01;tick(h,.1);assert.equal(h.context.__maria414Quest.read().step,24)}
 if(i===27){
  tick(h,.1);const r=h.game.maria414World.rooms.get(8).reconstruction;assert.equal(r.blocks[0].light.material.color.value,'#30424c');tick(h,2.1);assert.equal(r.blocks[0].light.material.color.value,'#67c8d1');assert.equal(r.blocks.at(-1).light.material.color.value,'#30424c');
 }
 if(i===29){tick(h,18.2);assert.equal(h.game.maria414Cine.el.querySelector('#maria414-line').textContent,'RESTORED? NO.');tick(h,.1);assert.equal(h.game.maria414World.rooms.get(8).ambient.intensity,.04)}
}
assert.equal(h.context.__maria414Quest.read().complete,true);assert.equal(h.state.pls,464);assert.equal(h.game.scene.background,original.background);assert.equal(h.game.scene.fog,original.fog);assert.deepEqual(h.state.mainQuests,['original']);assert.equal(h.state.mainQuestIndex,2);
assert.equal(h.game.maria414Replay(),true);for(let i=0;i<10;i++){skip(h);if(i===4){tick(h,.1);assert.ok(h.game.maria414World.rooms.get(5).engineCore.material.emissiveIntensity>.7,'Replay engine must start powered')}}assert.equal(h.state.pls,464);assert.equal(h.game.maria414Inside,false);
const resume=setup({v:1,started:true,step:4,seen:[0,1],rifles:false});resume.game.maria414Start();tick(resume,6.2);assert.equal(resume.context.__maria414Quest.read().step,4);completeObjective(resume,4);assert.equal(resume.context.__maria414Quest.read().step,5);
const sommi=setup({v:1,started:true,step:22,seen:[0,1,2,3,4,5],rifles:true});sommi.game.maria414Start();tick(sommi,20.2);assert.equal(sommi.game.maria414Cine.el.querySelector('#maria414-line').textContent,'Then let me help you get them out.');
console.log('PASS: 32 objectives in host shim; trace gate; R1 save resume; blackout restoration; engine shutdown; district relight; final sting; fourth Sommi line; campaign/sky restoration; reward once and replay. Full-game/browser validation remains pending.');
module.exports={setup,preparePuzzle};

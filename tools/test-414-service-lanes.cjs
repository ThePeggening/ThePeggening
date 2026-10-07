const assert=require('node:assert/strict'),{setup}=require('./test-maria-414-source.cjs');
const native={v:1,complete:true,step:4,inside:false,hasRifles:true,rewarded:true};
for(const mirror of [false,true])for(const step of [13,14]){
 const p=mirror?'sommiMirror414':'maria414';
 const h=setup({v:1,started:true,step,seen:[0,1,2,3,4]},{mirror,skin:mirror?'sommi':'maria-414',native});
 h.game[p+'Start']();const origin=h.game[p+'World'].rooms.get(4).root.position;
 const cases=step===13?[[[0,22],[-23,22]],[[-23,22],[-23,14]],[[-23,14],[-20,14]]]:[[[-23,14],[-23,-24]],[[-23,-24],[23,-24]],[[23,-24],[23,-9]],[[23,-9],[19,-9]]];
 for(const [[x,z],[tx,tz]] of cases){
  h.game.playerPos.set(origin.x+x,origin.y,origin.z+z);const target=h.game.questWaypointPos();
  assert.equal(target.x-origin.x,tx);assert.equal(target.z-origin.z,tz);assert.equal(target.y,origin.y);
  assert.ok(Math.abs(tx)<28&&Math.abs(tz)<36,'Service route must stay on the solid room floor');
 }
 assert.equal(h.context['__'+p+'Quest'].read().step,step,'Guidance must not advance the quest');
}
console.log('PASS: both scan gates and both routes; outer service-lane guidance, solid-floor bounds and unchanged progression');

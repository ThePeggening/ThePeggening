// Optional R2 systems layered onto the original crossing simulation.
// Neither feature changes lane movement, collisions, lives, or campaign saves.
export const SCOUT_HORIZON=1.2,SCOUT_DURATION=4;
export function forecastClock(state,seconds=SCOUT_HORIZON){const slow=Math.min(Math.max(0,state.slowTime||0),seconds);return state.clock+slow*.42+seconds-slow;}
export function safeIsland(state){const k=((state.row%8)+8)%8;return state.row<2||k===0||k===1;}
export function courierOffer(state){
  const block=Math.floor(state.row/8);let row=block*8+17;if(row>state.finishRow)return null;if(state.mode==='city'&&row===97)row=96;
  const columns=[-4,3,-3,4,-2,2],col=columns[(block+Math.floor(state.seed/137))%columns.length];
  return {id:'courier:'+block,block,row,col,x:col*4,z:-row*4,name:row===97?'LIBERTY SQUARE':['SHIELD POST','POOL DEPOT','SWAP HARBOR'][block%3]};
}
export function createCrossingFeatures(state,notify){
  Object.assign(state,{scoutTime:0,scoutUsed:[],scouts:0,courier:null,courierOffered:[],deliveries:0,courierStreak:0,bestCourierStreak:0,courierLost:0,deliveryBonus:0});
  function availability(){const block=Math.floor(state.row/8),safe=state.phase==='run'&&!state.move&&safeIsland(state),offer=courierOffer(state);return {safe,canScout:safe&&!state.scoutUsed.includes(block),canCourier:safe&&!state.courier&&!!offer&&!state.courierOffered.includes(offer.id),offer};}
  function action(kind){
    const a=availability();if(kind==='scout'&&a.canScout){state.scoutUsed.push(Math.floor(state.row/8));if(state.scoutUsed.length>32)state.scoutUsed.shift();state.scoutTime=SCOUT_DURATION;state.scouts++;notify('scout','SIGNAL SCOUT · CYAN MARKS SHOW TRAFFIC +1.2s');return true;}
    if(kind==='courier'&&a.canCourier){state.courier={...a.offer};state.courierOffered.push(a.offer.id);if(state.courierOffered.length>32)state.courierOffered.shift();notify('courier','PARCEL ACCEPTED · ROW '+a.offer.row+' · '+(a.offer.col<0?'LEFT':'RIGHT')+' DEPOT');return true;}
    return false;
  }
  function tick(dt){state.scoutTime=Math.max(0,state.scoutTime-dt);}
  function arrive(){
    const c=state.courier;if(!c)return;
    if(state.row===c.row&&state.col===c.col){state.deliveries++;state.courierStreak++;state.bestCourierStreak=Math.max(state.bestCourierStreak,state.courierStreak);const reward=200+Math.min(4,state.courierStreak-1)*75;state.score+=reward;state.deliveryBonus+=reward;state.courier=null;notify('delivered','DELIVERED · +'+reward+' · '+state.courierStreak+' SAFE IN A ROW');}
    else if(state.row>c.row+7){state.courier=null;state.courierStreak=0;state.courierLost++;notify('parcel-lost','DEPOT PASSED · NEXT ISLAND, NEW ROUTE');}
  }
  function hit(){state.scoutTime=0;if(state.courier){state.courier=null;state.courierLost++;notify('parcel-lost','PARCEL LOST IN THE COLLISION');}state.courierStreak=0;}
  return {availability,action,tick,arrive,hit};
}

export class Resources {
  constructor(){this.items=new Set();this.cleanups=[];this.disposed=false;}
  own(item){this.items.add(item);return item;}
  onDispose(fn){this.cleanups.push(fn);return fn;}
  dispose(){if(this.disposed)return;this.disposed=true;for(const fn of this.cleanups.splice(0))fn();for(const item of this.items)item.dispose?.();this.items.clear();}
}
export class Pool {
  constructor(size,create){this.items=Array.from({length:size},create);this.capacity=size;this.active=0;}
  acquire(){for(const item of this.items)if(!item.active){item.active=true;this.active++;return item;}return null;}
  release(item){if(item?.active){item.active=false;this.active--;}}
  reset(){for(const item of this.items)this.release(item);}
}
export function spring(state,target,dt,speed=20){dt=Math.min(dt,.04);state.velocity+=(target-state.value)*speed*speed*dt;state.velocity*=Math.exp(-2*speed*.8*dt);state.value+=state.velocity*dt;return state.value;}

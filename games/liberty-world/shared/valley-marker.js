// Keep the offscreen destination readable around the actual responsive HUD.
export function createHudMarker(root,marker){
 const selector='.pc-brandbar,.pc-mission,.pc-hud-top,.v-toolbar,.pc-compass,.v-signal,.v-flight-return,.pc-desktop-help,[data-stick],[data-jump],[data-dash]',observed=new Set();let dirty=true,boxes=[],width=0,height=0;
 const invalidate=()=>{dirty=true;},resize=new ResizeObserver(invalidate),changes=new MutationObserver(records=>{if(records.some(r=>r.target===root||r.target.matches?.(selector+',.pc-hud')))invalidate();});
 resize.observe(marker);changes.observe(root,{subtree:true,attributes:true,attributeFilter:['hidden','class']});addEventListener('resize',invalidate);
 function refresh(){boxes=[];for(const node of root.querySelectorAll(selector)){if(!observed.has(node)){observed.add(node);resize.observe(node);}const b=node.getBoundingClientRect();if(b.width&&b.height&&getComputedStyle(node).visibility!=='hidden')boxes.push(b);}width=marker.offsetWidth;height=marker.offsetHeight;dirty=false;}
 function place(x,y){
  if(marker.hidden)return;if(dirty)refresh();const margin=12,gap=12,maxX=Math.max(margin,innerWidth-width-margin),maxY=Math.max(margin,innerHeight-height-margin),clampX=n=>Math.max(margin,Math.min(maxX,n)),clampY=n=>Math.max(margin,Math.min(maxY,n));x=clampX(x);y=clampY(y);
  const clear=(a,b)=>boxes.every(r=>a+width+gap<=r.left||a-gap>=r.right||b+height+gap<=r.top||b-gap>=r.bottom);let bestX=x,bestY=y;
  if(!clear(x,y)){const xs=[x,margin,maxX],ys=[y,margin,maxY];for(const r of boxes){xs.push(clampX(r.left-width-gap),clampX(r.right+gap));ys.push(clampY(r.top-height-gap),clampY(r.bottom+gap));}let score=Infinity;for(const a of xs)for(const b of ys){const d=(a-x)**2+(b-y)**2;if(d<score&&clear(a,b)){score=d;bestX=a;bestY=b;}}if(!Number.isFinite(score)){marker.hidden=true;return;}}
  const left=bestX+'px',top=bestY+'px';if(marker.style.left!==left)marker.style.left=left;if(marker.style.top!==top)marker.style.top=top;
 }
 return {place,dispose(){resize.disconnect();changes.disconnect();removeEventListener('resize',invalidate);observed.clear();boxes=[];}};
}

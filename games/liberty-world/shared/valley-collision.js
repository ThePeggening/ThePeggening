// Static scenery shares this small spatial index with movement and route finding.
// Bucket membership includes the original collision margin and building surfaces.
export function collisionIndex(items,margin=.4,step=12){
 const cells=new Map(),empty=[];
 for(const item of items){const left=Math.floor((item.x-item.w-margin)/step),right=Math.floor((item.x+item.w+margin)/step),top=Math.floor((item.z-item.d-margin)/step),bottom=Math.floor((item.z+item.d+margin)/step);for(let x=left;x<=right;x++)for(let z=top;z<=bottom;z++){const key=x+':'+z;let bucket=cells.get(key);if(!bucket)cells.set(key,bucket=[]);bucket.push(item);}}
 return (x,z)=>cells.get(Math.floor(x/step)+':'+Math.floor(z/step))||empty;
}

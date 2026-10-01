import * as THREE from 'three';
// Merge directly into final typed arrays; no per-piece geometry clones or growing JS arrays.
export function mergeRunnerParts(parts){
  let count=0;for(const p of parts)count+=p.geometry.index?.count||p.geometry.attributes.position.count;
  const positions=new Float32Array(count*3),normals=new Float32Array(count*3),colors=new Float32Array(count*3),nm=new THREE.Matrix3(),color=new THREE.Color();let offset=0;
  for(const part of parts){const geo=part.geometry,a=geo.attributes.position,b=geo.attributes.normal,c=geo.attributes.color,index=geo.index,m=part.matrix.elements;nm.getNormalMatrix(part.matrix);const n=nm.elements;color.set(part.color||'#ffffff');
    for(let j=0,len=index?.count||a.count;j<len;j++){const i=index?index.getX(j):j,x=a.getX(i),y=a.getY(i),z=a.getZ(i),bx=b.getX(i),by=b.getY(i),bz=b.getZ(i);
      positions[offset]=m[0]*x+m[4]*y+m[8]*z+m[12];positions[offset+1]=m[1]*x+m[5]*y+m[9]*z+m[13];positions[offset+2]=m[2]*x+m[6]*y+m[10]*z+m[14];
      const nx=n[0]*bx+n[3]*by+n[6]*bz,ny=n[1]*bx+n[4]*by+n[7]*bz,nz=n[2]*bx+n[5]*by+n[8]*bz,length=Math.hypot(nx,ny,nz)||1;normals[offset]=nx/length;normals[offset+1]=ny/length;normals[offset+2]=nz/length;
      colors[offset]=(c?c.getX(i):1)*color.r;colors[offset+1]=(c?c.getY(i):1)*color.g;colors[offset+2]=(c?c.getZ(i):1)*color.b;offset+=3;
    }
  }
  const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(positions,3));out.setAttribute('normal',new THREE.BufferAttribute(normals,3));out.setAttribute('color',new THREE.BufferAttribute(colors,3));out.computeBoundingSphere();return out;
}

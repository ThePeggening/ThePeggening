import {reachHeight} from './valley-reach-data.js';
import {districts} from './valley-data.js';
export const WORLD_EDGE=940,TERRAIN_STEP=50/12;
export const regionRoutes=[[[0,-20],[-190,35],[-285,80],[-420,130]],[[-155,-195],[-230,-265],[-350,-415]],[[0,100],[35,215],[160,320],[280,410]]];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
export function segmentDistance(x,z,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(x-ax-t*dx,z-az-t*dz);}
export function roadDistance(x,z){let d=Math.abs(x)<5&&z>=-20&&z<=45?0:999;for(const r of districts.filter(d=>!['plaza','spire'].includes(d.id)))d=Math.min(d,segmentDistance(x,z,0,-20,r.x,r.z));if(Math.max(Math.abs(x),Math.abs(z))>175)for(const route of regionRoutes)for(let i=1;i<route.length;i++)d=Math.min(d,segmentDistance(x,z,...route[i-1],...route[i]));return d;}
export function rawHeight(x,z){const mountain=Math.max(0,-z-100)*.15+Math.max(0,Math.abs(x)-180)*.1,waves=Math.sin(x*.025)*Math.cos(z*.029)*3+Math.sin(x*.093+z*.04)*.7,flat=smooth(5,14,roadDistance(x,z)),lake=Math.hypot(x-95,z-100);if(lake<35)return .08+.96*(1-smooth(11,16,lake));if(Math.abs(x-44)<3.8&&Math.abs(z)<245)return .08;const old=1+mountain+waves*flat,outer=4+Math.max(0,-z-210)*.14+Math.sin(x*.017)*Math.cos(z*.021)*5*flat;const land=old+(outer-old)*smooth(225,285,Math.max(Math.abs(x),Math.abs(z)));return reachHeight(x,z,land+(-4-land)*smooth(470,505,z));}
// PlaneGeometry's two triangles are also the authority for feet, houses and props.
// Sampling an analytic hill between vertices buried actors under its rendered chord.
export function valleyHeight(x,z){const gx=Math.floor(x/TERRAIN_STEP),gz=Math.floor(z/TERRAIN_STEP),ax=gx*TERRAIN_STEP,az=gz*TERRAIN_STEP,u=(x-ax)/TERRAIN_STEP,v=(z-az)/TERRAIN_STEP,a=rawHeight(ax,az),b=rawHeight(ax+TERRAIN_STEP,az),c=rawHeight(ax,az+TERRAIN_STEP),d=rawHeight(ax+TERRAIN_STEP,az+TERRAIN_STEP);return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);}

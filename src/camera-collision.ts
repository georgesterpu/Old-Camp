import type {Obstacle} from './world';
import {terrainHeight} from './terrain';
export function cameraClearance(origin:{x:number;y:number;z:number},target:{x:number;y:number;z:number},obstacles:Obstacle[]){
 const dx=target.x-origin.x,dy=target.y-origin.y,dz=target.z-origin.z,length=Math.hypot(dx,dy,dz);let distance=length;
 for(const box of obstacles){
  const c=Math.cos(box.a),s=Math.sin(box.a),x=origin.x-box.x,z=origin.z-box.z;
  const start=[c*x-s*z,origin.y-terrainHeight(box.x,box.z)-(box.floor||0),s*x+c*z],delta=[c*dx-s*dz,dy,s*dx+c*dz];
  const min=[-box.w/2-.18,-.12,-box.d/2-.18],max=[box.w/2+.18,(box.height??3.5)+.18,box.d/2+.18];let near=0,far=1;
  for(let axis=0;axis<3;axis++){if(Math.abs(delta[axis])<.00001){if(start[axis]<min[axis]||start[axis]>max[axis]){near=2;break}}else{let a=(min[axis]-start[axis])/delta[axis],b=(max[axis]-start[axis])/delta[axis];if(a>b)[a,b]=[b,a];near=Math.max(near,a);far=Math.min(far,b);if(near>far)break}}
  if(near>0&&near<=far&&near<=1)distance=Math.min(distance,Math.max(.55,near*length-.12));
 }return distance;
}

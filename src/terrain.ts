import { Mesh, VertexData, Scene, StandardMaterial, Color3 } from '@babylonjs/core';
const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
export const riverX=(z:number)=>107+Math.sin(z*.018)*13;
export function terrainHeight(x:number,z:number){
 const distance=Math.max(Math.abs(x)-23,-10-z,z-39);
 const plateau=1-smooth(-1,10,distance);
 const rough=.48*Math.sin(x*.11)*Math.cos(z*.085)+.24*Math.sin(z*.17+x*.06);
 const hills=smooth(62,155,Math.hypot(x,z))*(4.5+Math.sin(x*.034)*Math.cos(z*.035)*5.5);
 const base=rough*(1-plateau)+2.5*plateau+hills;const channel=1-smooth(7,17,Math.abs(x-riverX(z)));return base*(1-channel)-2.1*channel;
}
export function createMountainRidges(scene:Scene,material:StandardMaterial){
 const steps=112,positions:number[]=[],uvs:number[]=[],indices:number[]=[],colors:number[]=[];
 const radii=[235,275,330,405,510],levels=[0,47,30,85,0];
 for(let ring=0;ring<radii.length;ring++)for(let i=0;i<=steps;i++){
  const a=i/steps*Math.PI*2;const jag=Math.sin(a*13+ring)*Math.sin(a*7.1+2)+Math.cos(a*23)*.25;
  const radius=radii[ring]+Math.sin(a*9+ring)*9;
  const h=levels[ring]*(.7+jag*.37)+terrainHeight(Math.sin(a)*radius,Math.cos(a)*radius)-4;
  positions.push(Math.sin(a)*radius,h,Math.cos(a)*radius);uvs.push(i/steps*42,ring*5);const shade=.72+Math.sin(a*3+ring)*.12;colors.push(shade,shade*1.01,shade*.98,1);
 }
 for(let r=0;r<radii.length-1;r++)for(let i=0;i<steps;i++){const a=r*(steps+1)+i,b=a+steps+1;indices.push(a,a+1,b,a+1,b+1,b)}
 const normals:number[]=[];VertexData.ComputeNormals(positions,indices,normals);const mesh=new Mesh('layered mountain ridges',scene),data=new VertexData();data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;data.colors=colors;data.applyToMesh(mesh);mesh.material=material;material.backFaceCulling=false;mesh.isPickable=false;return mesh;
}
export function addGroundCover(scene:Scene){
 const positions:number[]=[],indices:number[]=[],colors:number[]=[],uvs:number[]=[];let seed=9527;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<4400;i++){
  const x=(random()-.5)*172,z=(random()-.5)*175,r=Math.hypot(x,z);
  if(r<22||Math.abs(x)<7&&z<45||Math.abs(x)<25&&z>-15&&z<43||r>34&&r<46&&random()<.88)continue;
  if(r<60&&random()<.65)continue;
  for(let blade=0;blade<3;blade++){const a=blade*2.1+random(),width=.07+random()*.06,height=.15+random()*.34;const y=terrainHeight(x,z),base=positions.length/3;positions.push(x-Math.cos(a)*width,y,z-Math.sin(a)*width,x+Math.cos(a)*width,y,z+Math.sin(a)*width,x+Math.sin(a)*.13,y+height,z+Math.cos(a)*.13);indices.push(base,base+2,base+1);const c=.6+random()*.35;colors.push(.21*c,.27*c,.15*c,1,.21*c,.27*c,.15*c,1,.38*c,.39*c,.24*c,1);uvs.push(0,0,1,0,.5,1)}
 }
 const normals:number[]=[];VertexData.ComputeNormals(positions,indices,normals);const mesh=new Mesh('sparse valley grasses',scene),data=new VertexData();data.positions=positions;data.indices=indices;data.normals=normals;data.colors=colors;data.uvs=uvs;data.applyToMesh(mesh);const mat=new StandardMaterial('dry grass',scene);mat.diffuseColor=Color3.White();mat.specularColor=Color3.Black();mat.backFaceCulling=false;mesh.material=mat;mesh.isPickable=false;mesh.receiveShadows=true;
}
export function bridgeHeight(x:number){const cx=riverX(-75),deck=Math.max(terrainHeight(cx-16,-75),terrainHeight(cx+16,-75))+.3;const distance=Math.abs(x-cx);if(distance<=13.6)return deck;const bank=terrainHeight(x,-75);return deck+(bank-deck)*Math.min(1,(distance-13.6)/4.5)}
export function walkHeight(x:number,z:number){return Math.abs(z+75)<2.2&&Math.abs(x-riverX(-75))<18.1?bridgeHeight(x):terrainHeight(x,z)}

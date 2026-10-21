import { Scene, Camera, Engine, MeshBuilder, StandardMaterial, Color3, MirrorTexture, Plane, Vector3, Mesh, VertexData } from '@babylonjs/core';
import { terrainHeight } from './terrain';
export function finishLighting(scene:Scene,camera:Camera){
 const software=/swiftshader|llvmpipe|software|lavapipe/i.test((scene.getEngine() as Engine).getGlInfo().renderer);
 // Use the multisampled main framebuffer in both modes. Chaining the HDR and
 // SSAO pipelines produced a black scene on some integrated graphics drivers.
 // High improves native resolution, surface relief and shadow quality without
 // requiring floating-point post-process render targets.
 return {setDetailed(_enabled:boolean){scene.imageProcessingConfiguration.applyByPostProcess=false;},software};
}
export function addPuddles(scene:Scene){
 const reflection=new MirrorTexture('still rainwater',256,scene,true);reflection.mirrorPlane=new Plane(0,-1,0,terrainHeight(1,-41)+.035);reflection.refreshRate=0;reflection.level=.56;reflection.renderList=scene.meshes.filter(m=>m.name.endsWith(' architecture')||m.name==='overcast valley sky');
 const mat=new StandardMaterial('rainwater',scene);mat.diffuseColor=new Color3(.09,.12,.13);mat.specularColor=new Color3(.7,.7,.6);mat.specularPower=96;mat.reflectionTexture=reflection;mat.alpha=.78;mat.backFaceCulling=false;
 for(const [x,z,w,d] of [[1,-41,1.7,.85],[-2,-53,1.15,.65],[2.9,-25,1.2,.6],[-30,22,.95,.5],[29,3,1.6,.7]]){
  const points:number[]=[x,terrainHeight(x,z)+.035,z],uvs:number[]=[.5,.5],indices:number[]=[];const segments=24;
  for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,r=1+Math.sin(a*5)*.09+Math.cos(a*7)*.05;const px=x+Math.sin(a)*w*r,pz=z+Math.cos(a)*d*r;points.push(px,terrainHeight(px,pz)+.035,pz);uvs.push(Math.sin(a)*.5+.5,Math.cos(a)*.5+.5);if(i>0)indices.push(0,i+1,i)}
  const normals:number[]=[];VertexData.ComputeNormals(points,indices,normals);const data=new VertexData();data.positions=points;data.indices=indices;data.uvs=uvs;data.normals=normals;const mesh=new Mesh('rain puddle',scene);data.applyToMesh(mesh);mesh.material=mat;mesh.isPickable=false;
 }
}

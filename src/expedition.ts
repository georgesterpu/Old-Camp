import {Scene,Mesh,MeshBuilder,StandardMaterial,Color3,Vector3,TransformNode,DynamicTexture,Texture} from '@babylonjs/core';
import {landmarks} from './wilderness';
import {terrainHeight} from './terrain';
export interface ExpeditionSave {found:string[];smith:number;herbs:number[];soup:boolean;weapon:boolean;wins:number}
export const freshExpedition=():ExpeditionSave=>({found:[],smith:0,herbs:[],soup:false,weapon:false,wins:0});
export interface FieldItem {id:string;label:string;kind:'hammer'|'herb';root:TransformNode;taken:boolean;position:Vector3}
export function buildExpedition(scene:Scene,save:ExpeditionSave){
 const items:FieldItem[]=[];
 const iron=new StandardMaterial('weathered tool steel',scene);iron.diffuseColor=new Color3(.25,.27,.26);iron.specularColor=new Color3(.2,.22,.22);
 const wood=new StandardMaterial('hammer handle',scene);wood.diffuseColor=new Color3(.32,.23,.13);
 const green=new StandardMaterial('healing herb foliage',scene);green.diffuseColor=new Color3(.25,.37,.16);green.specularColor=Color3.Black();
 const flower=new StandardMaterial('meadow herb flowers',scene);flower.diffuseColor=new Color3(.6,.64,.35);flower.emissiveColor=new Color3(.03,.035,.01);flower.specularColor=Color3.Black();
 function item(id:string,label:string,kind:FieldItem['kind'],x:number,z:number){const root=new TransformNode(label,scene);root.position.set(x,terrainHeight(x,z),z);const it={id,label,kind,root,position:root.position,taken:kind==='hammer'?save.smith>=2:save.herbs.includes(Number(id))};items.push(it);root.setEnabled(!it.taken);return root}
 const hammer=item('hammer','Huno’s lost hammer','hammer',-112,79);hammer.rotation.z=.35;
 const handle=MeshBuilder.CreateCylinder('oak hammer haft',{height:.72,diameter:.065,tessellation:12},scene);handle.parent=hammer;handle.position.y=.43;handle.material=wood;
 const head=MeshBuilder.CreateBox('forged hammer head',{width:.35,height:.17,depth:.16},scene);head.parent=hammer;head.position.y=.72;head.material=iron;
 for(const [i,[x,z]] of [[-83,-99],[-97,-111],[-84,-116],[82,-65],[92,83],[8,138]].entries()){
  const root=item(String(i),'Meadow healing herb','herb',x,z);
  for(let j=0;j<6;j++){const a=j*2.4;const leaf=MeshBuilder.CreateSphere('herb leaf',{diameter:.22,segments:6},scene);leaf.scaling.set(.35,.15,1.7);leaf.position.set(Math.sin(a)*.15,.15+j*.035,Math.cos(a)*.15);leaf.rotation.y=-a;leaf.parent=root;leaf.material=green}
  const stem=MeshBuilder.CreateCylinder('herb stem',{height:.55,diameter:.022,tessellation:5},scene);stem.parent=root;stem.position.y=.27;stem.material=green;
  for(let j=0;j<5;j++){const f=MeshBuilder.CreateSphere('small pale flowers',{diameter:.07,segments:4},scene);f.parent=root;f.position.set(Math.sin(j*2)*.07,.52+j*.012,Math.cos(j*2)*.07);f.material=flower}
 }
 // Small readable signposts at the two camp roads point toward the new destinations.
 const signs=[{x:-4,z:-79,lines:['← FORGOTTEN SHRINE','RIVER CROSSING →']},{x:-5,z:78,lines:['← OLD WORKINGS','HIGH ROAD ↑']}];
 for(const sign of signs){const y=terrainHeight(sign.x,sign.z);const tex=new DynamicTexture('hand-painted waymarker',{width:1024,height:256},scene,true,Texture.TRILINEAR_SAMPLINGMODE);const c=tex.getContext() as unknown as CanvasRenderingContext2D;c.fillStyle='#4b4130';c.fillRect(0,0,1024,256);for(let i=0;i<800;i++){c.fillStyle=i%2?'#d8c28a08':'#100e0915';c.fillRect(Math.random()*1024,Math.random()*256,Math.random()*80,1)}c.fillStyle='#c4b68f';c.font='36px Georgia';c.textAlign='center';sign.lines.forEach((line,i)=>c.fillText(line,512,91+i*85));tex.update();const m=new StandardMaterial('waymarker lettering',scene);m.diffuseTexture=tex;m.specularColor=Color3.Black();const board=MeshBuilder.CreateBox('carved timber waymarker',{width:3.8,height:.95,depth:.12},scene);board.position.set(sign.x,y+2.2,sign.z);board.material=m;const post=MeshBuilder.CreateCylinder('waymarker post',{height:2.6,diameter:.15,tessellation:8},scene);post.position.set(sign.x,y+1.3,sign.z);post.material=wood}
 return {items,landmarks};
}

import {Scene,Mesh,MeshBuilder,VertexData,Vector3,Color3,StandardMaterial,Texture,TransformNode,Skeleton,Bone,Matrix,DynamicTexture} from '@babylonjs/core';
import data from '../assets/human.json';
import skinURL from '../assets/source/male-skin.png';
import type {SurfaceSet} from './surfaces';
import type {Person} from './world';
export function createCharacterFactory(scene:Scene,surfaces:SurfaceSet){
 const skin=new StandardMaterial('human skin · Drummyfish CC0',scene);skin.diffuseTexture=new Texture(skinURL,scene,false,true,Texture.TRILINEAR_SAMPLINGMODE);skin.diffuseTexture.anisotropicFilteringLevel=8;skin.specularColor=new Color3(.055,.045,.04);skin.specularPower=28;
 const hair=new StandardMaterial('rough dark hair',scene);hair.diffuseColor=Color3.FromHexString('#29241e');hair.diffuseTexture=surfaces.bark.color;hair.specularColor=Color3.Black();
 const palettes=['#7c7663','#786049','#555e56','#93856a','#574c43','#786b5b'];let characterIndex=0;
 return function makeCharacter(name:string,role:string,x:number,z:number,guard=false):Person{
  const root=new TransformNode(name,scene);root.position.set(x,0,z);root.scaling.setAll(1.1);
  const skeleton=new Skeleton(name+' human rig',name+' rig',scene);
  const bone=(n:string,parent:Bone|null,p:Vector3)=>new Bone(n,skeleton,parent,Matrix.Translation(p.x,p.y,p.z));
  const hips=bone('pelvis',null,new Vector3(0,0,-.12));
  const spine=bone('spine',hips,new Vector3(0,1.05,.12));
  const head=bone('head',spine,new Vector3(0,.43,.015));
  const arms:Bone[]=[],elbows:Bone[]=[],legs:Bone[]=[],knees:Bone[]=[];
  for(const sign of [-1,1]){
   const arm=bone('upper arm '+sign,spine,new Vector3(sign*.19,.365,0));arms.push(arm);
   elbows.push(bone('elbow '+sign,arm,new Vector3(sign*.245,-.08,.015)));
   const leg=bone('thigh '+sign,hips,new Vector3(sign*.095,.87,.12));legs.push(leg);
   knees.push(bone('knee '+sign,leg,new Vector3(0,-.43,0)));
  }
  const tint=guard?'#722e27':palettes[characterIndex++%palettes.length];
  const cloth=new StandardMaterial(name+' worn wool',scene);cloth.diffuseTexture=surfaces.fabric.color.clone();cloth.bumpTexture=surfaces.fabric.normal.clone();for(const t of [cloth.diffuseTexture,cloth.bumpTexture]){(t as Texture).uScale=8;(t as Texture).vScale=8;}cloth.diffuseColor=Color3.FromHexString(tint);cloth.specularColor=Color3.Black();
  const trousers=new StandardMaterial(name+' worn hide',scene);trousers.diffuseTexture=surfaces.leather.color;trousers.bumpTexture=surfaces.leather.normal;trousers.diffuseColor=new Color3(.48,.44,.38);trousers.specularColor=new Color3(.035,.03,.025);
  const boots=trousers.clone(name+' boots');boots.diffuseColor=new Color3(.23,.21,.19);
  const flesh=skin.clone(name+' complexion');flesh.diffuseColor=name==='Thorus'?new Color3(.68,.51,.39):new Color3(.92,.86,.78);
  const vest=trousers.clone(name+' fitted leather vest');vest.diffuseColor=guard?new Color3(.58,.24,.20):new Color3(.38,.32,.24);
  const materials=[flesh,cloth,trousers,boots,hair,vest];
  const groups=materials.map(()=>({positions:[] as number[],uvs:[] as number[],indices:[] as number[],matricesIndices:[] as number[],matricesWeights:[] as number[]}));
  const p=data.positions as number[],uv=data.uvs as number[];
  const clamp=(v:number)=>Math.max(0,Math.min(1,v));
  for(let i=0;i<data.indices.length;i+=3){
   const ids=(data.indices as number[]).slice(i,i+3);let cx=0,cy=0,cz=0;for(const v of ids){cx+=p[v*3]/3;cy+=p[v*3+1]/3;cz+=p[v*3+2]/3}
   const arm=Math.abs(cx)>.205&&cy>1.02;
   const scalp=cy>1.67&&cz<.205||cy>1.61&&cz<.078;
   let type=scalp?4:cy>1.465||arm&&Math.abs(cx)>.32?0:cy<.21?3:cy<.91?2:1;
   if(type===1&&cy>1.07&&cy<1.44&&Math.abs(cx)<.18)type=5;
   const group=groups[type],base=group.positions.length/3;
   for(const vi of ids){
    let vx=p[vi*3],vy=p[vi*3+1],vz=p[vi*3+2];
    const ax=Math.abs(vx),side=vx<0?0:1;
    let b1=hips,b2=spine,w=clamp((vy-.85)/.25);
    if(vy>1.46&&ax<.18){b1=spine;b2=head;w=clamp((vy-1.44)/.09)}
    else if(ax>.18&&vy>1.02){b1=spine;b2=arms[side];w=clamp((ax-.17)/.08);if(ax>.36){b1=arms[side];b2=elbows[side];w=clamp((ax-.37)/.13)}}
    else if(vy<.87){b1=hips;b2=legs[side];w=clamp((.91-vy)/.15);if(vy<.53){b1=legs[side];b2=knees[side];w=clamp((.53-vy)/.15)}}
    if(type===1||type===2||type===3||type===5){vx*=type===1?1.075:1.07;vz=.125+(vz-.125)*(type===1?1.12:1.12)}
    group.positions.push(vx,vy,vz-.12);
    // Skeletal pivots use the same recentered depth as the source mesh.
    group.matricesIndices.push(b1.getIndex(),b2.getIndex(),0,0);group.matricesWeights.push(1-w,w,0,0);
    if(type===0||type===4)group.uvs.push(uv[vi*2],uv[vi*2+1]);else group.uvs.push(Math.atan2(vx,vz-.125)/Math.PI*1.5,vy*2.6);
   }
   group.indices.push(base,base+1,base+2);
  }
  // Shift pivots with the model's depth; bind matrices retain the original A-pose.
  skeleton.computeAbsoluteMatrices();
  let skinnedMesh:Mesh|undefined;
  for(let i=0;i<groups.length;i++){
   const g=groups[i];if(!g.positions.length)continue;
   const mesh=new Mesh(name+' '+['face and hands','wool tunic','leather trousers','boots','hair','leather vest'][i],scene);const vd=new VertexData();vd.positions=g.positions;vd.indices=g.indices;vd.uvs=g.uvs;const normals:number[]=[];VertexData.ComputeNormals(g.positions,g.indices,normals);
   // OBJ UV seams duplicate vertices. Average coincident surface normals so the
   // subdivided face and limbs stay smooth instead of lighting as separate tiles.
   const smooth=new Map<string,Vector3>();
   for(let v=0;v<g.positions.length;v+=3){const key=g.positions.slice(v,v+3).join(',');const n=smooth.get(key)||Vector3.Zero();n.x+=normals[v];n.y+=normals[v+1];n.z+=normals[v+2];smooth.set(key,n)}
   for(let v=0;v<g.positions.length;v+=3){const n=smooth.get(g.positions.slice(v,v+3).join(','))!.normalize();normals[v]=n.x;normals[v+1]=n.y;normals[v+2]=n.z}
   vd.normals=normals;vd.matricesIndices=g.matricesIndices;vd.matricesWeights=g.matricesWeights;vd.applyToMesh(mesh);skinnedMesh??=mesh;mesh.material=materials[i];mesh.skeleton=skeleton;mesh.parent=root;mesh.receiveShadows=true;mesh.isPickable=false;mesh.alwaysSelectAsActiveMesh=true;
  }
  if(name==='Nameless Hero'||name==='Diego'){const tail=MeshBuilder.CreateTube(name+' tied ponytail',{path:[new Vector3(0,1.65,-.06),new Vector3(0,1.55,-.12),new Vector3(0,1.37,-.10)],radiusFunction:i=>i===2?.019:.035,tessellation:12,cap:Mesh.CAP_ALL},scene);tail.parent=root;tail.material=hair;tail.isPickable=false;}
  const limbNodes=[0,1].map(()=>new TransformNode(name+' arm controller',scene));const legNodes=[0,1].map(()=>new TransformNode(name+' leg controller',scene));for(const node of [...limbNodes,...legNodes])node.parent=root;
  const belt=MeshBuilder.CreateCylinder(name+' leather belt',{height:.065,diameter:.32,tessellation:28},scene);belt.scaling.set(1.02,1,.63);belt.position.set(0,.94,.005);belt.parent=root;belt.material=trousers;belt.isPickable=false;
  const weapon=new TransformNode(name+' iron sword',scene);weapon.parent=root;weapon.position.set(-.2,.97,-.18);weapon.rotation.z=-.22;weapon.setEnabled(guard);
  const steel=new StandardMaterial(name+' forged steel',scene);steel.diffuseColor=new Color3(.39,.42,.43);steel.specularColor=new Color3(.5,.52,.53);steel.specularPower=64;
  const blade=MeshBuilder.CreateBox('tempered blade',{width:.055,height:.72,depth:.023},scene);blade.parent=weapon;blade.position.y=-.46;blade.material=steel;
  const cross=MeshBuilder.CreateBox('crossguard',{width:.23,height:.035,depth:.045},scene);cross.parent=weapon;cross.position.y=-.09;cross.material=steel;
  const grip=MeshBuilder.CreateCylinder('leather sword grip',{diameter:.045,height:.15,tessellation:10},scene);grip.parent=weapon;grip.position.y=0;grip.material=trousers;
  let wasDrawn=false;
  const setWeapon=(drawn:boolean,guarding=false)=>{if(drawn!==wasDrawn){if(drawn&&skinnedMesh){weapon.attachToBone(elbows[1],skinnedMesh);weapon.position.set(.25,-.13,.035);weapon.rotation.set(-Math.PI/2,0,0)}else{weapon.detachFromBone();weapon.parent=root;weapon.position.set(-.2,.97,-.18);weapon.rotation.set(0,0,-.22)}wasDrawn=drawn}if(drawn)weapon.rotation.x=guarding?-.3:-Math.PI/2};
  const person:Person={weapon,setWeapon,name,role,root,arms:limbNodes,legs:legNodes,home:root.position.clone(),phase:characterIndex*.73,pose:(t:number,moving=false)=>{
   for(let i=0;i<2;i++){
    const a=limbNodes[i].rotation.x,l=legNodes[i].rotation.x;
    arms[i].setRotation(new Vector3(a*.8,0,i===0?1.04:-1.04));
    elbows[i].setRotation(new Vector3(0,(i===0?1:-1)*(.12+Math.max(0,-a)*.4),0));
    legs[i].setRotation(new Vector3(l,0,0));knees[i].setRotation(new Vector3(-Math.max(0,-l)*.95,0,0));
   }
   spine.setRotation(new Vector3(Math.sin(t*1.7+characterIndex)*.008,0,0));head.setRotation(new Vector3(0,Math.sin(t*.35+characterIndex)*.045,0));
  }};person.pose!(0);return person;
 };
}

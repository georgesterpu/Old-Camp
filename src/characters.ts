import {Scene,Mesh,MeshBuilder,VertexData,Vector3,Color3,StandardMaterial,Texture,TransformNode,Skeleton,Bone,Matrix,DynamicTexture,VertexBuffer} from '@babylonjs/core';
import data from '../assets/human.json';
import skinURL from '../assets/source/male-skin.png';
import type {SurfaceSet} from './surfaces';
import type {Person} from './world';
import {appearanceColors,normalizeAppearance,residentAppearance,type Appearance} from './appearance';
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export function createCharacterFactory(scene:Scene,surfaces:SurfaceSet){
 const skin=new StandardMaterial('human skin · Drummyfish CC0',scene);skin.diffuseTexture=new Texture(skinURL,scene,false,true,Texture.TRILINEAR_SAMPLINGMODE);skin.diffuseTexture.anisotropicFilteringLevel=8;skin.specularColor=new Color3(.055,.045,.04);skin.specularPower=28;
 // Fine, neutral strands preserve hair colours without the old bark/fabric pattern.
 const strands=new DynamicTexture('fine hair strands',{width:256,height:256},scene,true,Texture.TRILINEAR_SAMPLINGMODE);
 const ctx=strands.getContext();ctx.fillStyle='#c8c8c8';ctx.fillRect(0,0,256,256);
 let grain=1977;for(let i=0;i<1300;i++){grain=(Math.imul(grain,1664525)+1013904223)>>>0;const x=grain%256;grain=(Math.imul(grain,1664525)+1013904223)>>>0;const y=grain%256;ctx.strokeStyle=i%3?'#ffffff16':'#00000025';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+2,y+8+grain%24);ctx.stroke()}strands.update();strands.anisotropicFilteringLevel=8;
 return function makeCharacter(name:string,role:string,x:number,z:number,guard=false):Person{
  const root=new TransformNode(name,scene);root.position.set(x,0,z);
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
  const cloth=new StandardMaterial(name+' worn wool',scene);cloth.diffuseTexture=surfaces.fabric.color.clone();cloth.bumpTexture=surfaces.fabric.normal.clone();for(const t of [cloth.diffuseTexture,cloth.bumpTexture]){(t as Texture).uScale=8;(t as Texture).vScale=8;}cloth.specularColor=Color3.Black();
  const trousers=new StandardMaterial(name+' worn hide',scene);trousers.diffuseTexture=surfaces.leather.color;trousers.bumpTexture=surfaces.leather.normal;trousers.specularColor=new Color3(.035,.03,.025);
  const boots=trousers.clone(name+' boots');boots.diffuseColor=new Color3(.23,.21,.19);
  const flesh=skin.clone(name+' complexion');
  // Hair uses fine woven grain rather than coarse tree bark; each person owns the tint.
  const hair=new StandardMaterial(name+' hair',scene);hair.diffuseTexture=strands;hair.specularColor=Color3.Black();
  const beard=new StandardMaterial(name+' facial hair',scene);beard.diffuseTexture=strands;beard.specularColor=Color3.Black();
  const vest=trousers.clone(name+' fitted leather');
  const trim=new StandardMaterial(name+' iron and fastenings',scene);trim.diffuseColor=new Color3(.35,.37,.36);trim.specularColor=new Color3(.2,.21,.2);
  const materials=[flesh,cloth,trousers,boots,hair,vest,beard,trim];
  const partNames=['face and hands','wool tunic','leather trousers','boots','hair','outer garment','facial hair','fastenings'];
  const meshes=materials.map((material,i)=>{const mesh=new Mesh(name+' '+partNames[i],scene);mesh.material=material;mesh.skeleton=skeleton;mesh.parent=root;mesh.receiveShadows=true;mesh.isPickable=false;mesh.alwaysSelectAsActiveMesh=true;return mesh});
  const skinnedMesh=meshes[0];
  skeleton.computeAbsoluteMatrices();
  let extras:Mesh[]=[];
  let appearance=residentAppearance(name,role,x,z);
  function applyAppearance(value:Appearance){
   appearance=normalizeAppearance(value);const a=appearance;
   const build={slender:[.9,1],average:[1,1],stocky:[1.16,.98],tall:[.98,1.09]}[a.build];root.scaling.set(1.1*build[0],1.1*build[1],1.1);
   flesh.diffuseColor=Color3.FromHexString(appearanceColors.skin[a.skin]);
   hair.diffuseColor=Color3.FromHexString(appearanceColors.hair[a.hairColor]).scale(.55);beard.diffuseColor=hair.diffuseColor.scale(a.facialHair==='stubble'?.74:.9);
   cloth.diffuseColor=Color3.FromHexString(appearanceColors.cloth[a.clothColor]);trousers.diffuseColor=Color3.FromHexString(appearanceColors.trousers[a.trouserColor]);
   vest.diffuseColor=Color3.FromHexString(a.outfit==='guard'?'#7b3d32':a.outfit==='jerkin'?'#716044':a.outfit==='apron'?'#624c35':'#4c3930');
   const groups=materials.map(()=>({positions:[] as number[],uvs:[] as number[],indices:[] as number[],matricesIndices:[] as number[],matricesWeights:[] as number[]}));
   const p=data.positions as number[],uv=data.uvs as number[];
   for(let i=0;i<data.indices.length;i+=3){
    const ids=(data.indices as number[]).slice(i,i+3);let cx=0,cy=0,cz=0;for(const v of ids){cx+=p[v*3]/3;cy+=p[v*3+1]/3;cz+=p[v*3+2]/3}
    const ax=Math.abs(cx),arm=ax>.205&&cy>1.02;
    const forehead=cz>.16;
    let scalp=false;
    if(a.hairStyle==='cropped'||a.hairStyle==='ponytail')scalp=cy>(forehead?1.685:1.635)||cy>1.59&&cz<.09;
    if(a.hairStyle==='swept')scalp=cy>(forehead?1.658+cx*.32:1.625)||cy>1.59&&cz<.09;
    if(a.hairStyle==='mohawk')scalp=ax<.029&&cy>1.66||ax<.03&&cy>1.59&&cz<.08;
    if(a.hairStyle==='long')scalp=cy>(forehead?1.68:1.60)||cy>1.49&&cz<.09;
    const front=cz>.158&&ax<.079&&cy>1.49&&cy<1.59;
    const moustache=cy>1.551&&cy<1.574&&ax<.037;
    const beardArea=front&&(a.facialHair==='beard'&&cy<1.557||a.facialHair==='stubble'&&cy<1.557||a.facialHair==='moustache'&&moustache||a.facialHair==='goatee'&&(moustache||ax<.027&&cy<1.542));
    const bareArm=arm&&(a.outfit==='jerkin'||a.outfit==='apron'||ax>.32);
    const hem=a.outfit==='tunic'?.83:.91;
    let type=scalp?4:beardArea?6:cy>1.465||bareArm?0:cy<.21?3:cy<hem?2:1;
    if(type===1){
     if(a.outfit==='vest'&&cy>1.04&&cy<1.44&&ax<.18)type=5;
     if(a.outfit==='jerkin'&&cy>1.01&&ax<.21)type=5;
     if(a.outfit==='guard'&&cy>1.02&&cy<1.44&&ax<.19)type=5;
     if(a.outfit==='apron'&&cy>.89&&ax<.13&&cz>.14)type=5;
    }
    const group=groups[type],base=group.positions.length/3;
    for(const vi of ids){
     let vx=p[vi*3],vy=p[vi*3+1],vz=p[vi*3+2];const ax=Math.abs(vx),side=vx<0?0:1;
     let b1=hips,b2=spine,w=clamp((vy-.85)/.25);
     if(vy>1.46&&ax<.18){b1=spine;b2=head;w=clamp((vy-1.44)/.09)}
     else if(ax>.18&&vy>1.02){b1=spine;b2=arms[side];w=clamp((ax-.17)/.08);if(ax>.36){b1=arms[side];b2=elbows[side];w=clamp((ax-.37)/.13)}}
     else if(vy<.87){b1=hips;b2=legs[side];w=clamp((.91-vy)/.15);if(vy<.53){b1=legs[side];b2=knees[side];w=clamp((.53-vy)/.15)}}
     // Change the actual head surface while preserving its UVs and neck seam.
     if(vy>1.49&&ax<.13){
      const blend=clamp((vy-1.49)/.055),jaw=clamp((1.64-vy)/.11);
      vx*=1+blend*({lean:-.07,broad:.2,angular:.16*jaw,round:.13}[a.face]);
      vz+=blend*({lean:0,broad:.003,angular:-.009*jaw,round:.008}[a.face]);
      const nose=clamp(1-ax/.026)*clamp(1-Math.abs(vy-1.605)/.047)*clamp((vz-.19)/.025);
      vz+=nose*({straight:0,narrow:.006,broad:.01,hooked:.025}[a.nose]);
      if(a.nose==='broad'&&vz>.205&&vy>1.565&&vy<1.635)vx*=1+.18*clamp(1-ax/.04);
     }
     // Deform coincident vertices identically across material boundaries, so
     // hairlines, sleeves and necklines never open cracks in the surface.
     if(vy<1.47){const sleeve=vy>1.02&&ax>.2?(a.outfit==='jerkin'||a.outfit==='apron'?0:clamp((.35-ax)/.045)):1;const puff=clamp((1.47-vy)/.04)*sleeve;vx*=1+.07*puff;vz=.125+(vz-.125)*(1+.12*puff)}
     if(vy>1.61&&ax<.13){const crest=a.hairStyle==='mohawk'?clamp((.04-ax)/.025):1;const lift=a.hairStyle==='mohawk'?.05:a.hairStyle==='swept'?.025:a.hairStyle==='long'?.014:0;const w=clamp((vy-1.61)/.1)*crest;vy+=lift*w;vx*=1+.025*w;vz=.14+(vz-.14)*(1+.025*w)}
     if(a.facialHair==='beard'&&vy>1.49&&vy<1.56&&ax<.085&&vz>.16){const w=clamp((1.56-vy)/.05)*clamp((vz-.16)/.04);vy-=w*.025;vz+=w*.004}
     group.positions.push(vx,vy,vz-.12);group.matricesIndices.push(b1.getIndex(),b2.getIndex(),0,0);group.matricesWeights.push(1-w,w,0,0);
     if(type===0||type===4||type===6)group.uvs.push(uv[vi*2],uv[vi*2+1]);else group.uvs.push(Math.atan2(vx,vz-.125)/Math.PI*1.5,vy*2.6);
    }
    group.indices.push(base,base+1,base+2);
   }
   // A hanging apron is one continuous panel, rather than painted trouser legs.
   if(a.outfit==='apron'){
    const g=groups[5],base=g.positions.length/3;
    for(const [vx,vy,vz] of [[-.11,1.36,.102],[.11,1.36,.102],[-.17,.64,.15],[.17,.64,.15]]){g.positions.push(vx,vy,vz);g.uvs.push(vx*4,vy*3);g.matricesIndices.push(hips.getIndex(),spine.getIndex(),0,0);const w=clamp((vy-.85)/.25);g.matricesWeights.push(1-w,w,0,0)}
    g.indices.push(base,base+1,base+2,base+1,base+3,base+2);vest.backFaceCulling=false;
   }
   for(let i=0;i<groups.length;i++){
    const g=groups[i],mesh=meshes[i];mesh.setEnabled(g.positions.length>0);if(!g.positions.length)continue;
    const vd=new VertexData();vd.positions=g.positions;vd.indices=g.indices;vd.uvs=g.uvs;const normals:number[]=[];VertexData.ComputeNormals(g.positions,g.indices,normals);
    // Smooth UV seam duplicates as in the original subdivided human mesh.
    const smooth=new Map<string,Vector3>();for(let v=0;v<g.positions.length;v+=3){const key=g.positions.slice(v,v+3).join(',');const n=smooth.get(key)||Vector3.Zero();n.x+=normals[v];n.y+=normals[v+1];n.z+=normals[v+2];smooth.set(key,n)}
    for(let v=0;v<g.positions.length;v+=3){const n=smooth.get(g.positions.slice(v,v+3).join(','))!.normalize();normals[v]=n.x;normals[v+1]=n.y;normals[v+2]=n.z}
    vd.normals=normals;vd.matricesIndices=g.matricesIndices;vd.matricesWeights=g.matricesWeights;vd.applyToMesh(mesh);mesh.refreshBoundingInfo();
   }
   for(const mesh of extras)mesh.dispose();extras=[];
      // Skin accessories to the same rig and keep them below the character root.
   // Bone-parented meshes fall outside that hierarchy and the camp's static
   // batching would otherwise freeze them into the scenery.
   const bindAccessory=(mesh:Mesh,target:Bone,position:Vector3,material:StandardMaterial)=>{
    const rest=target===head?new Vector3(0,1.48,.015):new Vector3(0,1.05,0);
    mesh.bakeTransformIntoVertices(Matrix.Scaling(mesh.scaling.x,mesh.scaling.y,mesh.scaling.z).multiply(Matrix.Translation(position.x+rest.x,position.y+rest.y,position.z+rest.z)));mesh.scaling.setAll(1);
    const indices:number[]=[],weights:number[]=[];for(let i=0;i<mesh.getTotalVertices();i++){indices.push(target.getIndex(),0,0,0);weights.push(1,0,0,0)}
    mesh.setVerticesData(VertexBuffer.MatricesIndicesKind,indices);mesh.setVerticesData(VertexBuffer.MatricesWeightsKind,weights);mesh.skeleton=skeleton;mesh.parent=root;mesh.material=material;mesh.isPickable=false;mesh.receiveShadows=true;mesh.alwaysSelectAsActiveMesh=true;extras.push(mesh);return mesh;
   };
   const attachHead=(mesh:Mesh,position:Vector3,material=hair)=>bindAccessory(mesh,head,position,material);
   if(a.hairStyle==='ponytail'){
    attachHead(MeshBuilder.CreateTube(name+' tied ponytail',{path:[new Vector3(0,0,0),new Vector3(0,-.08,-.045),new Vector3(0,-.26,-.035)],radiusFunction:i=>i===2?.017:.03,tessellation:10,cap:Mesh.CAP_ALL},scene),new Vector3(0,.18,-.095));
   }
   if(a.hairStyle==='long')for(const side of [-1,1]){
    attachHead(MeshBuilder.CreateTube(name+' loose hair',{path:[new Vector3(side*.066,.17,-.025),new Vector3(side*.083,.03,-.06),new Vector3(side*.085,-.1,-.05)],radiusFunction:i=>i===2?.025:.034,tessellation:10,cap:Mesh.CAP_ALL},scene),Vector3.Zero());
   }
   function cheekPoint(x:number,y:number){
    let z=.19;
    for(let i=0;i<data.indices.length;i+=3){const ids=data.indices.slice(i,i+3);const [a,b,c]=ids.map(id=>new Vector3(p[id*3],p[id*3+1],p[id*3+2]));if(Math.max(a.y,b.y,c.y)<y||Math.min(a.y,b.y,c.y)>y)continue;const denominator=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(denominator)<1e-10)continue;const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/denominator,v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/denominator;if(u>=0&&v>=0&&u+v<=1)z=Math.max(z,u*a.z+v*b.z+(1-u-v)*c.z)}
    const blend=clamp((y-1.49)/.055),jaw=clamp((1.64-y)/.11);
    x*=1+blend*({lean:-.07,broad:.2,angular:.16*jaw,round:.13}[a.face]);z+=blend*({lean:0,broad:.003,angular:-.009*jaw,round:.008}[a.face]);
    return new Vector3(x,y-1.48,z-.135+.0015);
   }
   if(a.mark!=='none'){
    const mark=new StandardMaterial(name+' face detail',scene);mark.diffuseColor=a.mark==='scar'?flesh.diffuseColor.scale(.65).add(new Color3(.035,.008,.006)):Color3.FromHexString('#61402b').toLinearSpace();mark.specularColor=Color3.Black();
    if(a.mark==='scar'){
     const scar=MeshBuilder.CreateTube(name+' cheek scar',{path:[cheekPoint(.047,1.598),cheekPoint(.05,1.58),cheekPoint(.053,1.563)],radius:.0016,tessellation:5},scene);
     attachHead(scar,Vector3.Zero(),mark);
    }else for(const side of [-1,1])for(let i=0;i<5;i++){
     const dot=MeshBuilder.CreateSphere(name+' freckle',{diameter:.0032,segments:4},scene);attachHead(dot,cheekPoint(side*(.032+i*.006),1.597-(i%2)*.006),mark);
    }
    // Dispose the detail's private material with the last mesh when rebuilding.
    extras[extras.length-1].onDisposeObservable.addOnce(()=>mark.dispose());
   }
   if(a.outfit==='guard')for(const side of [-1,1]){
    const pad=MeshBuilder.CreateSphere(name+' shoulder armour',{diameter:1,segments:10},scene);pad.scaling.set(.19,.09,.23);bindAccessory(pad,spine,new Vector3(side*.19,.365,-.005),trim);
   }
  }
  applyAppearance(appearance);
  const limbNodes=[0,1].map(()=>new TransformNode(name+' arm controller',scene)),legNodes=[0,1].map(()=>new TransformNode(name+' leg controller',scene));for(const node of [...limbNodes,...legNodes])node.parent=root;
  const belt=MeshBuilder.CreateCylinder(name+' leather belt',{height:.065,diameter:.32,tessellation:28},scene);belt.scaling.set(1.02,1,.63);belt.position.set(0,.94,.005);belt.parent=root;belt.material=trousers;belt.isPickable=false;
  const weapon=new TransformNode(name+' iron sword',scene);weapon.parent=root;weapon.position.set(-.2,.97,-.18);weapon.rotation.z=-.22;weapon.setEnabled(guard);
  const steel=new StandardMaterial(name+' forged steel',scene);steel.diffuseColor=new Color3(.39,.42,.43);steel.specularColor=new Color3(.5,.52,.53);steel.specularPower=64;
  const blade=MeshBuilder.CreateBox('tempered blade',{width:.055,height:.72,depth:.023},scene);blade.parent=weapon;blade.position.y=-.46;blade.material=steel;
  const cross=MeshBuilder.CreateBox('crossguard',{width:.23,height:.035,depth:.045},scene);cross.parent=weapon;cross.position.y=-.09;cross.material=steel;
  const grip=MeshBuilder.CreateCylinder('leather sword grip',{diameter:.045,height:.15,tessellation:10},scene);grip.parent=weapon;grip.material=trousers;
  let wasDrawn=false;
  const setWeapon=(drawn:boolean,guarding=false)=>{if(drawn!==wasDrawn){if(drawn){weapon.attachToBone(elbows[1],skinnedMesh);weapon.position.set(.25,-.13,.035);weapon.rotation.set(-Math.PI/2,0,0)}else{weapon.detachFromBone();weapon.parent=root;weapon.position.set(-.2,.97,-.18);weapon.rotation.set(0,0,-.22)}wasDrawn=drawn}if(drawn)weapon.rotation.x=guarding?-.3:-Math.PI/2};
  const phase=(Math.abs(x*7+z*11)%31)*.73;
  const person:Person={weapon,setWeapon,name,role,root,arms:limbNodes,legs:legNodes,home:root.position.clone(),phase,get appearance(){return {...appearance}},setAppearance:applyAppearance,pose:(t:number)=>{
   for(let i=0;i<2;i++){
    const a=limbNodes[i].rotation.x,l=legNodes[i].rotation.x;
    arms[i].setRotation(new Vector3(a*.8,0,i===0?1.04:-1.04));elbows[i].setRotation(new Vector3(0,(i===0?1:-1)*(.12+Math.max(0,-a)*.4),0));
    legs[i].setRotation(new Vector3(l,0,0));knees[i].setRotation(new Vector3(-Math.max(0,-l)*.95,0,0));
   }
   spine.setRotation(new Vector3(Math.sin(t*1.7+phase)*.008,0,0));head.setRotation(new Vector3(0,Math.sin(t*.35+phase)*.045,0));
  }};person.pose!(0);return person;
 };
}
import { Scene, Mesh, MeshBuilder, VertexData, Vector3, Color3, StandardMaterial, DynamicTexture, TransformNode, PointLight, DirectionalLight, ShadowGenerator, Texture, Vector4, VertexBuffer } from '@babylonjs/core';
import {createCharacterFactory} from './characters';
import type {GaitPose} from './gait';
import type {Appearance} from './appearance';
import {buildWilderness} from './wilderness';
import type { SurfaceSet } from './surfaces';
import { terrainHeight, createMountainRidges, addGroundCover } from './terrain';
export interface Obstacle {x:number;z:number;w:number;d:number;a:number;height?:number;floor?:number;cameraOnly?:boolean}
export interface Person {readonly appearance:Appearance;setAppearance:(value:Appearance)=>void;name:string;role:string;root:TransformNode;arms:TransformNode[];legs:TransformNode[];home:Vector3;phase:number;pose?:(t:number,moving?:boolean)=>void;setGait?:(pose:GaitPose|null)=>void;motionDiagnostics?:()=>{ankles:number[][];soles:number[][];knees:number[][];hip:number[];head:number[];angles:{hip:number;knee:number;roll:number;reach:number;clamped:boolean}[]};weapon?:TransformNode;setWeapon?:(drawn:boolean,guard?:boolean)=>void}
export interface Ore {mesh:Mesh;taken:boolean}
export interface Camp {obstacles:Obstacle[];people:Person[];ores:Ore[];fires:{mesh:Mesh;light:PointLight;base:Vector3}[];banners:Mesh[];hero:Person;animate:(t:number)=>void}
let seed=1977;
export function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
const rgb=(hex:string)=>Color3.FromHexString(hex);
export function buildCamp(scene:Scene,sun:DirectionalLight,surfaces:SurfaceSet):Camp {
 const obstacles:Obstacle[]=[],people:Person[]=[],ores:Ore[]=[],fires:Camp['fires']=[],banners:Mesh[]=[];
 const statics:Mesh[]=[],shadowCasters:Mesh[]=[];
 const mats:Record<string,StandardMaterial>={};
 function material(name:string,color:string,kind='plain',scale=1){
  const m=new StandardMaterial(name,scene);m.diffuseColor=rgb(color);m.specularColor=new Color3(.025,.025,.02);mats[name]=m;
  if(kind==='stone'||kind==='wood'&&name!=='leather'||kind==='roof'){const surface=surfaces[kind as 'stone'|'wood'|'roof'];m.diffuseTexture=surface.color;m.bumpTexture=surface.normal;m.diffuseColor=Color3.White();if(name==='dark structural timber')m.diffuseColor=new Color3(.57,.54,.49);return m;}
  if(kind!=='plain'){
   const tex=new DynamicTexture(name+' texture',{width:256,height:256},scene,false,Texture.TRILINEAR_SAMPLINGMODE);const c=tex.getContext() as unknown as CanvasRenderingContext2D;
   c.fillStyle=color;c.fillRect(0,0,256,256);
   if(kind==='stone'){
    c.fillStyle='#32362e';c.fillRect(0,0,256,256);
    for(let row=0;row<8;row++)for(let col=-1;col<5;col++){
     const x=col*68+(row%2)*34,y=row*32;const l=rand()*22+66;c.fillStyle=`rgb(${l+4},${l+5},${l})`;c.fillRect(x+2,y+2,64,28);
     c.strokeStyle='#9c9a7a33';c.strokeRect(x+3,y+3,62,26);
     for(let j=0;j<22;j++){c.fillStyle=rand()>.5?'#090e0a22':'#cac5a51a';c.fillRect(x+rand()*64,y+rand()*28,rand()*12+1,rand()*3+1)}
    }
   }else if(kind==='wood'){
    for(let x=0;x<256;x+=32){const b=rand()*18+46;c.fillStyle=`rgb(${b+17},${b+10},${b-3})`;c.fillRect(x+1,0,30,256);c.fillStyle='#1c211bb0';c.fillRect(x,0,2,256);for(let j=0;j<85;j++){c.fillStyle=rand()>.5?'#151b1444':'#ac9c7340';c.fillRect(x+rand()*30,rand()*256,1,rand()*55+3)}}
   }else if(kind==='roof'){
    for(let y=0;y<256;y+=22)for(let x=-20;x<256;x+=43){let b=rand()*18+25;c.fillStyle=`rgb(${b+5},${b+10},${b+5})`;c.fillRect(x+(y%44?21:0),y,41,20);c.fillStyle='#979a6d22';c.fillRect(x+(y%44?21:0),y,41,2)}
   }else if(kind==='plaster'){
    for(let i=0;i<2500;i++){c.fillStyle=rand()>.5?'#e5d7ab12':'#242c1b16';c.fillRect(rand()*256,rand()*256,rand()*8+2,rand()*8+2)}
    for(let i=0;i<18;i++){c.strokeStyle='#363d2c33';c.beginPath();let x=rand()*256,y=rand()*256;c.moveTo(x,y);for(let j=0;j<5;j++){x+=rand()*10-5;y+=rand()*10;c.lineTo(x,y)}c.stroke()}
   }
   for(let i=0;i<8500;i++){c.fillStyle=rand()>.5?'#fff9d708':'#000b0a12';c.fillRect(rand()*256,rand()*256,1,1)}
   tex.update();tex.wrapU=Texture.WRAP_ADDRESSMODE;tex.wrapV=Texture.WRAP_ADDRESSMODE;tex.uScale=scale;tex.vScale=scale;m.diffuseTexture=tex;m.diffuseColor=Color3.White();
  }return m;
 }
 const stone=material('castle stone','#8a8b75','stone',2),darkStone=material('old foundations','#6a6b55','stone'),wood=material('weathered timber','#9d8d68','wood'),beam=material('dark structural timber','#484532','wood'),roof=material('mossy shingles','#676e53','roof',2),plaster=material('mud plaster','#999278','plaster'),canvas=material('faded ochre canvas','#9b8b60','plaster'),red=material('guard red','#6c2b22','plaster'),iron=material('black iron','#343a35'),skin=material('skin','#9c8063'),hair=material('hair','#322f22'),cloth=material('prisoner linen','#78745a','plaster'),leather=material('leather','#493f35','plaster'),black=material('doorway darkness','#171b13'),green=material('mountain scrub','#434b30','plaster'),rock=material('cliff rock','#666d5c','plaster');
 function box(name:string,x:number,y:number,z:number,w:number,h:number,d:number,mat:StandardMaterial,parent?:TransformNode,angle=0,shadow=true){const m=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d,faceUV:[new Vector4(0,0,w/3,h/3),new Vector4(0,0,w/3,h/3),new Vector4(0,0,d/3,h/3),new Vector4(0,0,d/3,h/3),new Vector4(0,0,w/3,d/3),new Vector4(0,0,w/3,d/3)]},scene);m.position.set(x,y,z);m.rotation.y=angle;m.material=mat;if(parent)m.parent=parent;else statics.push(m);if(shadow)shadowCasters.push(m);m.receiveShadows=true;return m}
 function cylinder(name:string,x:number,y:number,z:number,h:number,d:number,mat:StandardMaterial,parent?:TransformNode,top?:number,tess=7){const m=MeshBuilder.CreateCylinder(name,{height:h,diameter:d,diameterTop:top??d,tessellation:tess},scene);m.position.set(x,y,z);m.material=mat;if(parent)m.parent=parent;else statics.push(m);m.receiveShadows=true;shadowCasters.push(m);return m}
 function sphere(name:string,x:number,y:number,z:number,size:number,mat:StandardMaterial,parent?:TransformNode){const m=MeshBuilder.CreateSphere(name,{diameter:size,segments:12},scene);m.position.set(x,y,z);m.material=mat;if(parent)m.parent=parent;else statics.push(m);shadowCasters.push(m);return m}
 function obstacle(x:number,z:number,w:number,d:number,a=0,height=3.5,floor=0,cameraOnly=false){obstacles.push({x,z,w,d,a,height,floor,cameraOnly})}
 function timberBetween(a:Vector3,b:Vector3,width:number,mat=beam,parent?:TransformNode){const m=box('timber brace',0,0,0,width,Vector3.Distance(a,b),width,mat,parent);m.position=Vector3.Center(a,b);m.rotationQuaternion=undefined as never;m.rotation=Vector3.Zero();const delta=b.subtract(a);m.rotation.z=-Math.atan2(delta.x,Math.sqrt(delta.y*delta.y+delta.z*delta.z));m.rotation.x=Math.atan2(delta.z,delta.y);return m}
 function roofMesh(name:string,w:number,d:number,height:number,y:number,parent:TransformNode,mat=roof){const m=new Mesh(name,scene);const positions=[-w/2,y,-d/2,w/2,y,-d/2,0,y+height,-d/2,-w/2,y,d/2,w/2,y,d/2,0,y+height,d/2];const indices=[0,2,3,3,2,5,2,1,5,5,1,4,0,1,2,3,5,4];const data=new VertexData();data.positions=positions;data.indices=indices;data.uvs=[0,0,w/3,0,w/6,height/3,0,d/3,w/3,d/3,w/6,(d+height)/3];const normals:number[]=[];VertexData.ComputeNormals(positions,indices,normals);data.normals=normals;data.applyToMesh(m);m.material=mat;m.parent=parent;m.receiveShadows=true;shadowCasters.push(m);return m}
 // An uneven basin rising to the castle plateau, with close-up tiled earth.
 const earth=material('valley earth','#c8c3b6');earth.diffuseTexture=surfaces.mud.color;earth.bumpTexture=surfaces.mud.normal;surfaces.mud.color.uScale=160;surfaces.mud.color.vScale=160;surfaces.mud.normal.uScale=160;surfaces.mud.normal.vScale=160;
 const ground=MeshBuilder.CreateGround('valley floor',{width:640,height:640,subdivisions:256,updatable:true},scene);ground.material=earth;ground.receiveShadows=true;
 const positions=ground.getVerticesData(VertexBuffer.PositionKind)!;const colors:number[]=[];
 for(let i=0;i<positions.length;i+=3){const x=positions[i],z=positions[i+2];positions[i+1]=terrainHeight(x,z);const ringDistance=Math.abs(Math.hypot(x/37,(z-3)/43)-1)*38;const path=Math.abs(x)<5.4&&z<45||ringDistance<4.5;const tone=path?.98:.84+Math.sin(x*.13)*Math.cos(z*.17)*.08;colors.push(tone,path?tone: tone*1.04,path?tone*.97:tone*.86,1)}
 ground.updateVerticesData(VertexBuffer.PositionKind,positions);ground.setVerticesData(VertexBuffer.ColorKind,colors);const normals:number[]=[];VertexData.ComputeNormals(positions,ground.getIndices()!,normals);ground.updateVerticesData(VertexBuffer.NormalKind,normals);
 const far=MeshBuilder.CreateGround('distant earth',{width:900,height:900},scene);far.position.y=-4;far.material=green;
 rock.diffuseTexture=surfaces.rock.color;rock.bumpTexture=surfaces.rock.normal;createMountainRidges(scene,rock);addGroundCover(scene);
 // The original camp's rough oval: reclaimed stone underneath layered planks and stakes.
 for(let i=0;i<154;i++){
  const a=i/154*Math.PI*2,x=Math.sin(a)*58,z=Math.cos(a)*64;
  if(Math.abs(x)<5.3&&Math.abs(z)>59)continue;
  const height=4.6+rand()*1.7;
  box('broken outer stone',x,.65,z,2.65,1.3,1.1,darkStone,undefined,a);
  for(let j=0;j<3;j++)box('salvaged horizontal planks',x,1.55+j*.97,z,2.7,.87,.32,wood,undefined,a+(rand()-.5)*.08);
  const pole=cylinder('palisade stake',x,height/2,z,height,.28,beam,undefined,.07,5);pole.rotation.z=(rand()-.5)*.13;
  obstacle(x,z,2.7,1.4,a,height);
 }
 function watchtower(x:number,z:number,a:number){const root=new TransformNode('gate watchtower',scene);root.position.set(x,0,z);root.rotation.y=a;
  for(const px of [-2,2])for(const pz of [-2,2])box('tower support',px,3,pz,.38,6,.38,beam,root);
  box('watch platform',0,4.5,0,5,.28,5,wood,root);for(const px of [-2.4,2.4])box('wood parapet',px,5.2,0,.2,1.3,5,wood,root);box('front parapet',0,5.2,2.4,5,1.3,.2,wood,root);roofMesh('watchtower roof',6,6,1.6,7,root);for(const px of [-2.2,2.2])for(const pz of [-2.2,2.2])box('roof support',px,6,pz,.18,2.2,.18,beam,root);
  timberBetween(new Vector3(-2,.1,-2),new Vector3(2,4.3,-2),.2,beam,root);obstacle(x,z,4.5,4.5,a);
 }
 watchtower(-7,-63,0);watchtower(7,-63,0);box('north gate crossbeam',0,5.8,-63,11,.5,.7,beam);box('gate top boards',0,6.2,-63,10,.6,.2,wood);
 watchtower(-7,63,Math.PI);watchtower(7,63,Math.PI);
 // Stone castle: gatehouse, curtain walls, keep and the unmistakable crowned tower.
 const cx=0,front=-6,back=36;
 function wall(x:number,z:number,w:number,d:number,a=0,h=10){box('castle curtain wall',x,h/2,z,w,h,d,stone,undefined,a);obstacle(x,z,w,d,a,h+1.6);box('wall coping',x,h+.16,z,w+.25,.4,d+.25,darkStone,undefined,a);const n=Math.floor(w/2.2);for(let i=0;i<n;i++){const px=(i-(n-1)/2)*2.2;box('battlement',x+Math.cos(a)*px,h+.8,z-Math.sin(a)*px,1.15,1.6,d+.35,stone,undefined,a)}}
 wall(-12,front,17,2.5);wall(12,front,17,2.5);wall(-21,15,42,2.5,Math.PI/2);wall(21,15,42,2.5,Math.PI/2);wall(0,back,44,2.5);
 box('gate arch lintel',0,9.15,front,7,2.7,3.3,stone);box('gate arch top',0,10.5,front,9,1.2,4,darkStone);for(const x of [-4.3,4.3]){box('gatehouse pier',x,6,front,2,12,5,stone);obstacle(x,front,2,5);box('gatehouse coping',x,12.3,front,2.5,.6,5.5,darkStone)}
 // Wedge-like arch stones and heavy buttresses break up the castle's flat silhouette.
 for(let i=0;i<15;i++){const a=i/14*Math.PI;const block=box('gate arch voussoir',Math.cos(a)*3.45,4.25+Math.sin(a)*3.45,front-.18,.77,1.12,3.9,darkStone);block.rotation.z=a-Math.PI/2;}
 for(const x of [-16,-10,10,16]){box('buttress foundation',x,.65,-7.3,2.4,1.3,4.1,darkStone);box('castle buttress',x,3.7,-7.1,1.65,6.4,3.5,stone);box('buttress cap',x,7.05,-7,1.85,.5,3.4,darkStone);obstacle(x,-7.3,2.2,3.7);}
 // A raised portcullis leaves the gate traversable.
 for(let x=-2.9;x<3;x+=.5)box('portcullis',x,7.2,front-.9,.09,3.5,.12,iron);
 for(let y=5.8;y<9;y+=.8)box('portcullis crossbar',0,y,front-.9,6,.09,.15,iron);
 function banner(x:number,y:number,z:number){
  const bannerTexture=new DynamicTexture('faded camp heraldry',{width:256,height:512},scene,true);const c=bannerTexture.getContext() as unknown as CanvasRenderingContext2D;
  c.fillStyle='#5d211c';c.fillRect(0,0,256,512);for(let i=0;i<6000;i++){c.fillStyle=rand()>.5?'#e4b77c10':'#120d0b20';c.fillRect(rand()*256,rand()*512,rand()*2+1,rand()*8+1)}
  c.strokeStyle='#af9454';c.lineWidth=4;c.beginPath();c.moveTo(45,90);c.lineTo(211,90);c.lineTo(201,260);c.lineTo(128,318);c.lineTo(55,260);c.closePath();c.stroke();
  c.lineWidth=8;c.beginPath();c.moveTo(79,140);c.lineTo(176,263);c.moveTo(177,140);c.lineTo(80,263);c.stroke();c.lineWidth=5;c.beginPath();c.moveTo(67,234);c.lineTo(101,260);c.moveTo(158,260);c.lineTo(191,234);c.stroke();
  c.fillStyle='#b29858';c.beginPath();c.moveTo(128,168);c.lineTo(148,196);c.lineTo(128,225);c.lineTo(108,196);c.closePath();c.fill();
  c.globalCompositeOperation='destination-out';for(const px of [0,74,145,220]){c.beginPath();c.moveTo(px,512);c.lineTo(px+8,463+rand()*28);c.lineTo(px+22,512);c.fill()}c.globalCompositeOperation='source-over';bannerTexture.update();bannerTexture.hasAlpha=true;
  const bannerMat=material('worn heraldic cloth'+x,'#ffffff');bannerMat.diffuseTexture=bannerTexture;bannerMat.useAlphaFromDiffuseTexture=true;bannerMat.backFaceCulling=false;
  const m=MeshBuilder.CreatePlane('weathered red banner',{width:1.5,height:3.8,sideOrientation:Mesh.DOUBLESIDE},scene);m.position.set(x,y,z);m.material=bannerMat;banners.push(m);box('banner rod',x,y+2,z,2,.12,.12,iron);
 }
 banner(-6,7.1,front-1.3);banner(6,7.1,front-1.3);
 function tower(x:number,z:number,h:number,w:number,crown=false){box('square stone tower',x,h/2,z,w,h,w,stone);obstacle(x,z,w,w,0,h+2);box('tower crown',x,h-.5,z,w+1.2,1.2,w+1.2,darkStone);for(const side of [-1,1])for(let i=-1;i<=1;i++){box('tower merlon',x+i*w/3,h+.8,z+side*w/2,1.3,2,1.1,stone);box('tower merlon',x+side*w/2,h+.8,z+i*w/3,1.1,2,1.3,stone)}for(let y=6;y<h-2;y+=5){box('arrow slit',x,y,z-w/2-.02,.3,1.7,.05,black,undefined,0,false);box('slit ledge',x,y-.9,z-w/2-.16,.7,.15,.4,darkStone)}if(crown){for(const dx of [-1,1])for(const dz of [-1,1])cylinder('crown spire',x+dx*w*.43,h+4,z+dz*w*.43,6,.65,iron,undefined,.015,5);cylinder('central spire',x,h+6,z,8,.9,iron,undefined,.01,5)}}
 tower(-17,31,27,6.5,true);tower(19,33,16,6);tower(-20,-3,14,5.5);tower(20,-3,14,5.5);
 const keep=new TransformNode('Gomez keep',scene);keep.position.set(2,0,26);box('great hall',0,8,0,22,16,15,stone,keep);obstacle(2,26,22,15);roofMesh('keep roof',25,18,6,16,keep);for(let x=-8;x<=8;x+=4){box('hall window',x,12,-7.53,1,2.6,.05,black,keep);box('window stone lintel',x,13.4,-7.6,1.5,.25,.3,darkStone,keep)}box('great hall door',0,2.2,-7.6,2.3,4.4,.1,wood,keep);box('door iron cross',0,2.2,-7.7,2.1,.12,.1,iron,keep);
 const mage=new TransformNode('fire mages quarters',scene);mage.position.set(-13,0,14);box('mage house',0,4,0,8,8,10,plaster,mage);roofMesh('mage roof',10,12,4,8,mage);obstacle(-13,14,8,10);box('mage timber',0,4,-5.04,.3,8,.3,beam,mage);
 // Outer-ring huts: every house has its own skew, patched roof and usable doorway.
 function hut(x:number,z:number,a:number,w=5,d=5.5,h=3.2,style=0){const root=new TransformNode('outer ring hut',scene);root.position.set(x,0,z);root.rotation.y=a;box('hut rear',0,h/2,d/2,w,h,.18,style%2?wood:plaster,root);box('hut left',-w/2,h/2,0,.18,h,d,wood,root);box('hut right',w/2,h/2,0,.18,h,d,style%2?plaster:wood,root);const doorW=1.35;for(const sign of [-1,1])box('front plaster',sign*(w+doorW)/4,h/2,-d/2,(w-doorW)/2,h,.17,plaster,root);box('door lintel',0,h-.35,-d/2,doorW,.7,.2,wood,root);box('inside dirt floor',0,.06,0,w,.12,d,beam,root);roofMesh('crooked shingle roof',w+.9,d+1.2,1.8,h,root,style%3===0?wood:roof);
  for(const xx of [-w/2,w/2])for(const zz of [-d/2,d/2])box('hut post',xx,h/2,zz,.23,h+.3,.24,beam,root);
  box('front roof beam',0,h,-d/2-.1,w+.4,.24,.3,beam,root);box('door post',-.8,1.3,-d/2-.12,.15,2.6,.2,beam,root);box('door post',.8,1.3,-d/2-.12,.15,2.6,.2,beam,root);
  timberBetween(new Vector3(-w/2,.2,-d/2-.14),new Vector3(-.9,h-.2,-d/2-.14),.14,beam,root);
  for(let i=0;i<3;i++){const patch=box('roof patch',-w*.2+i*.16,h+1.2,d*.12,.14,2.8,.11,beam,root);patch.rotation.x=Math.PI/2;patch.rotation.z=-.55}
  // Boarded windows, crooked eaves and improvised lean-tos give the lane its prison-camp character.
  box('hut window recess',w*.32,1.9,-d/2-.105,.72,.85,.035,black,root);
  for(const xx of [-.28,.28])box('window frame',w*.32+xx,1.9,-d/2-.15,.09,1,.1,beam,root);
  box('window shutter',w*.32,1.9,-d/2-.21,.8,.12,.1,wood,root);
  if(style%3===0){const awning=box('patched lean-to roof',0,2.7,-d/2-1.1,w+1,.1,2.8,roof,root);awning.rotation.x=-.18;for(const xx of [-w/2-.25,w/2+.25]){const post=box('awning prop',xx,1.25,-d/2-2.2,.13,2.5,.15,beam,root);post.rotation.z=xx>0?.06:-.05}}
  for(const sign of [-1,1])timberBetween(new Vector3(sign*w/2-.15,h,-d/2-.5),new Vector3(sign*.1,h+1.7,-d/2-.5),.12,beam,root);
  obstacle(x,z,w+.9,d+1.2,a,2,h-.1,true);
  // Collisions follow the walls; doorways and interiors remain accessible.
  const localObstacle=(lx:number,lz:number,ww:number,dd:number)=>obstacle(x+Math.cos(a)*lx+Math.sin(a)*lz,z-Math.sin(a)*lx+Math.cos(a)*lz,ww,dd,a);
  localObstacle(-w/2,0,.35,d);localObstacle(w/2,0,.35,d);localObstacle(0,d/2,w,.35);for(const sign of [-1,1])localObstacle(sign*(w+doorW)/4,-d/2,(w-doorW)/2,.3);
  box('bed frame',-w*.27,.35,.5,1.4,.45,2.6,beam,root);box('straw mattress',-w*.27,.65,.5,1.3,.25,2.5,canvas,root);box('pillow',-w*.27,.83,1.35,1,.17,.55,cloth,root);
  if(style%2===0){cylinder('chimney',w*.3,h+1.2,d*.2,3,.55,darkStone,root,.55,4)}
  return root;
 }
 const huts:{x:number;z:number;a:number;w:number;d:number}[]=[];
 for(let i=0;i<30;i++){const a=i/30*Math.PI*2+.04+(rand()-.5)*.07;if(Math.abs(Math.sin(a))<.19)continue;const radius=49+rand()*3;const x=Math.sin(a)*radius,z=Math.cos(a)*(radius+5);const angle=Math.atan2(-x,-z)+Math.PI;const w=4.3+rand()*2,d=4.8+rand()*2;hut(x,z,angle,w,d,2.8+rand()*.8,i);huts.push({x,z,a:angle,w,d})}
 hut(-10,-47,-Math.PI/2,5,6,3.3,5);hut(10,-49,Math.PI/2,5,7,3.6,1);hut(-11,-16,-Math.PI/2,5,6,3.2,2);hut(12,-18,Math.PI/2,4.8,5.5,3.4,3);
 hut(-20,-30,-.35,7,6,3.4,2);hut(20,-31,.4,6.7,6,3.2,3);hut(30,-16,Math.PI/2,6,7,3.5,1);hut(-34,20,-Math.PI/2,6,6,3,4);
 // Arena: a sunken-feeling timber enclosure with open entrances.
 const arenaX=-34,arenaZ=3;
 for(let i=0;i<30;i++){const a=i/30*Math.PI*2;if(Math.abs(Math.sin(a))<.22)continue;const x=arenaX+Math.sin(a)*8,z=arenaZ+Math.cos(a)*8;box('arena rail',x,.85,z,1.7,.22,.18,beam,undefined,a);box('arena lower rail',x,.4,z,1.7,.18,.16,wood,undefined,a);cylinder('arena post',x,1,z,2,.2,beam);obstacle(x,z,1.7,.3,a,1.3)}
 // Camp clutter: barrels, crates, carts, rough benches and a smithy.
 function barrel(x:number,z:number){cylinder('barrel',x,.65,z,1.3,.85,wood);for(const y of [.18,1.05]){const m=MeshBuilder.CreateTorus('iron barrel hoop',{diameter:.86,thickness:.055,tessellation:10},scene);m.position.set(x,y,z);m.material=iron;statics.push(m)}obstacle(x,z,.85,.85,0,1.4)}
 function crate(x:number,z:number,a=0){box('crate',x,.5,z,1,1,1,wood,undefined,a);box('crate strap',x,.5,z-.51,.13,1.04,.05,beam,undefined,a);obstacle(x,z,1,1,a,1.05)}
 for(let i=0;i<40;i++){let a=rand()*Math.PI*2,r=43+rand()*7,x=Math.sin(a)*r,z=Math.cos(a)*(r+4);if(Math.abs(x)<8)continue;if(i%2)barrel(x,z);else crate(x,z,rand())}
 function bench(x:number,z:number,a=0){const p=new TransformNode('rough bench',scene);p.position.set(x,0,z);p.rotation.y=a;box('bench seat',0,.6,0,2.6,.2,.6,wood,p);for(const xx of [-.9,.9])box('bench leg',xx,.3,0,.3,.6,.5,beam,p)}
 function fire(x:number,z:number,size=1,torch=false){const base=new Vector3(x,torch?2.6:.3,z);if(torch){cylinder('torch post',x,1.4,z,2.8,.16,beam);cylinder('torch basket',x,2.65,z,.4,.38,iron,undefined,.5)}else{for(let i=0;i<11;i++){let a=i/11*Math.PI*2;const m=sphere('fire ring stone',x+Math.sin(a)*size,.16,z+Math.cos(a)*size,.45,darkStone);m.scaling.y=.7}for(let i=0;i<4;i++){const m=cylinder('charred log',x+(rand()-.5)*size,.2,z+(rand()-.5)*size,1.7*size,.2,beam);m.rotation.set(Math.PI/2,rand()*6,0)}}
  const flameMat=material('flame'+x+z,'#f8ad47');flameMat.emissiveColor=new Color3(1,.36,.04);flameMat.disableLighting=true;flameMat.alpha=.87;
  const flame=MeshBuilder.CreateSphere('living flame',{diameter:size*.8,segments:3},scene);flame.position=base.add(new Vector3(0,size*.6,0));flame.scaling.set(.7,1.8,.7);flame.material=flameMat;
  const light=new PointLight('firelight',base.add(new Vector3(0,1,0)),scene);light.diffuse=new Color3(1,.46,.13);light.intensity=1.5;light.range=torch?9:13;
  fires.push({mesh:flame,light,base});
  // wisps are animated geometry rather than external sprites.
  const smokeMat=material('smoke'+x+z,'#6b7262');smokeMat.alpha=.12;smokeMat.disableLighting=true;smokeMat.emissiveColor=rgb('#5c6157');
  for(let i=0;i<3;i++){const m=MeshBuilder.CreateSphere('smoke wisp',{diameter:1+i*.4,segments:12},scene);m.position=base.add(new Vector3(.15*i,2+i*1.3,0));m.material=smokeMat;m.isPickable=false;smoke.push({mesh:m,base:m.position.clone(),offset:rand()*6})}
 }
 const smoke:{mesh:Mesh;base:Vector3;offset:number}[]=[];
 fire(-10,-32,1.1);fire(30,27,.85);fire(-35,32,.8);fire(11,7,.8);for(const [x,z] of [[-4,-58],[4,-58],[-5,-10],[5,-10],[-18,10],[18,10]])fire(x,z,.45,true);
 for(const [x,z,a] of [[-12,-35,0],[-14,-30,1.6],[-7,-29,0],[28,30,0],[32,24,1.3]])bench(x,z,a);
 // Marketplace on the eastern side.
 for(let i=0;i<3;i++){const root=new TransformNode('market stall',scene);root.position.set(32+i%2*8,0,8+i*9);root.rotation.y=-Math.PI/2;box('stall counter',0,1.1,0,4.5,.22,2,wood,root);for(const x of [-2,2])for(const z of [-.8,.8])box('market post',x,1.7,z,.14,3.4,.14,beam,root);const canopy=box('sagging canvas canopy',0,3.25,0,5,.1,3.5,i%2?red:canvas,root);canopy.rotation.z=.08;for(let n=0;n<8;n++){const m=sphere('market produce',-1.6+rand()*3.1,1.4,(rand()-.5)*1.1,.25,rand()>.5?canvas:green,root);m.scaling.y=.8}obstacle(root.position.x,root.position.z,2,4.5)}
 box('smith stone forge',26,.9,-23,3,1.8,2.5,darkStone);box('forge coals',26,1.85,-23,2.4,.12,1.8,red);box('anvil foot',23,.5,-24,.6,1,.6,beam);box('anvil',23,1.05,-24,1.4,.35,.6,iron);box('anvil horn',23.8,1.1,-24,.5,.2,.4,iron);obstacle(26,-23,3,2.5);fire(26,-23,.45);
 const cart=new TransformNode('ore cart',scene);cart.position.set(17,0,-43);cart.rotation.y=.4;box('cart bed',0,.75,0,2.4,.2,3.5,wood,cart);for(const x of [-1.2,1.2]){box('cart sides',x,1.2,0,.12,1,3.5,wood,cart);const wheel=MeshBuilder.CreateTorus('cart wheel',{diameter:1.25,thickness:.13,tessellation:10},scene);wheel.parent=cart;wheel.position.set(x,.6,.5);wheel.rotation.z=Math.PI/2;wheel.material=beam;for(let i=0;i<4;i++){const spoke=box('wheel spoke',x,.6,.5,.07,1.18,.07,wood,cart);spoke.rotation.x=i*Math.PI/4}}for(const x of [-.8,.8])box('cart handles',x,.65,-2.8,.14,.14,2.2,beam,cart);obstacle(17,-43,2.5,3.5,.4);
 // Trees and boulders outside the palisade.
 for(let i=0;i<65;i++){const a=rand()*Math.PI*2,r=76+rand()*48,x=Math.sin(a)*r,z=Math.cos(a)*r;if(Math.abs(x)<8&&z<0)continue;const h=6+rand()*7;cylinder('pine trunk',x,h*.45,z,h*.9,.35,beam);for(let j=0;j<3;j++)cylinder('pine needles',x,h*.6+j*h*.18,z,h*.55,4.3-j,green,undefined,.05,6)}
 for(let i=0;i<130;i++){const a=rand()*6.283,r=67+rand()*58;const m=sphere('valley boulder',Math.sin(a)*r,.3,Math.cos(a)*r,1+rand()*4,rock);m.scaling.set(1,.5+rand(),.7+rand());m.rotation.set(rand(),rand(),rand())}
 const makePerson=createCharacterFactory(scene,surfaces);
 function person(name:string,role:string,x:number,z:number,guard=false){const p=makePerson(name,role,x,z,guard);people.push(p);return p;}
 person('Diego','Shadow',-13,-28,true);person('Thorus','Gatekeeper',-2.7,-10,true);person('Huno','Blacksmith',22,-23);person('Fisk','Trader',31,10);person('Scatty','Arena master',-31,-7,true);person('Grim','Digger',-8,-35);person('Snaf','Cook',-17,-29);person('Guard','Guard',5,-56,true);person('Guard','Guard',-5,-56,true);person('Digger','Digger',30,30);person('Shadow','Shadow',-39,27,true);person('Guard','Guard',5,11,true);
 const hero=person('Nameless Hero','Newcomer',0,-70);people.pop();
 const oreMat=material('magic ore','#7b82a0');oreMat.emissiveColor=new Color3(.12,.12,.21);oreMat.specularColor=new Color3(.3,.3,.4);
 for(const [x,z] of [[-23,-43],[17,-40],[36,-20],[39,29],[-36,36],[-29,13],[12,44],[8,-19]]){const m=MeshBuilder.CreatePolyhedron('ore nugget',{type:1,size:.24},scene);m.position.set(x,.32,z);m.material=oreMat;ores.push({mesh:m,taken:false})}
 buildWilderness(scene,surfaces,obstacles);
 // Place buildings and inhabitants on the same terrain used by the controller.
 for(const node of scene.transformNodes){if(!node.parent){node.position.y+=terrainHeight(node.position.x,node.position.z)}}
 for(const mesh of scene.meshes){if(!mesh.parent&&!mesh.metadata?.grounded&&!['valley floor','distant earth','layered mountain ridges','sparse valley grasses','overcast valley sky','wilderness rocks','pine forest','wilderness water'].includes(mesh.name))mesh.position.y+=terrainHeight(mesh.position.x,mesh.position.z)}
 for(const f of fires){const elevation=terrainHeight(f.base.x,f.base.z);f.base.y+=elevation;f.light.position.y+=elevation}
 for(const s of smoke)s.base.y+=terrainHeight(s.base.x,s.base.z);
 for(const person of [...people,hero])person.home.y=terrainHeight(person.home.x,person.home.z);
 // Merge static architecture by material to keep draw calls low on integrated GPUs.
 scene.meshes.slice().forEach(m=>{if(m instanceof Mesh&&m.parent&&m.name!=='living flame'&&!people.some(p=>m.isDescendantOf(p.root))&&!m.isDescendantOf(hero.root)&&!banners.includes(m)){m.computeWorldMatrix(true);m.bakeTransformIntoVertices(m.getWorldMatrix());m.parent=null;m.position.setAll(0);m.rotation.setAll(0);m.rotationQuaternion=null;m.scaling.setAll(1);statics.push(m)}});
 const groups=new Map<StandardMaterial,Mesh[]>();for(const m of new Set(statics)){if(!m.isDisposed()&&m.material instanceof StandardMaterial){const list=groups.get(m.material)||[];list.push(m);groups.set(m.material,list)}}
 const merged:Mesh[]=[];for(const [mat,meshes] of groups){if(meshes.length<2){merged.push(...meshes);continue}const m=Mesh.MergeMeshes(meshes,true,true,undefined,false,false);if(m){m.name=mat.name+' architecture';m.material=mat;m.receiveShadows=true;merged.push(m)}}
 const shadows=new ShadowGenerator(2048,sun);shadows.usePercentageCloserFiltering=true;shadows.filteringQuality=ShadowGenerator.QUALITY_LOW;shadows.bias=.002;shadows.normalBias=.04;shadows.setDarkness(.36);for(const m of merged)if(!m.name.startsWith('cliff rock')&&!m.name.startsWith('mountain scrub'))shadows.addShadowCaster(m);for(const p of people)for(const m of p.root.getChildMeshes())shadows.addShadowCaster(m as Mesh);sun.shadowMinZ=1;sun.shadowMaxZ=230;sun.autoCalcShadowZBounds=false;sun.shadowFrustumSize=165;sun.shadowOrthoScale=.1;shadows.getShadowMap()!.refreshRate=0;
 function animate(t:number){for(const f of fires){const flicker=.9+Math.sin(t*11+f.base.x)*.1+Math.sin(t*19)*.05;f.mesh.scaling.y=1.6*flicker;f.mesh.scaling.x=.65+Math.sin(t*8)*.1;f.light.intensity=1.8*flicker;f.mesh.rotation.y=t*2}for(const s of smoke){const age=(t*.3+s.offset)%3;s.mesh.position.set(s.base.x+Math.sin(t*.5+s.offset)*.8,s.base.y+age*.8,s.base.z+age*.45);s.mesh.scaling.setAll(.6+age*.5);s.mesh.visibility=(1-age/3)*.7}for(const b of banners)b.rotation.y=Math.sin(t*1.3+b.position.x)*.07;for(const p of people){p.pose?.(t);p.root.rotation.y=Vector3.Distance(p.root.position,hero.root.position)<3.5?Math.atan2(hero.root.position.x-p.root.position.x,hero.root.position.z-p.root.position.z):Math.atan2(-p.home.x,-p.home.z)+Math.sin(t*.15+p.phase)*.12;p.arms[0].rotation.x=Math.sin(t+p.phase)*.06;p.arms[1].rotation.x=-Math.sin(t+p.phase)*.06}for(const o of ores)if(!o.taken){o.mesh.rotation.y=t*.35;o.mesh.position.y=terrainHeight(o.mesh.position.x,o.mesh.position.z)+.32+Math.sin(t*2+o.mesh.position.x)*.04}}
 return {obstacles,people,ores,fires,banners,hero,animate};
}

import {Scene,Mesh,MeshBuilder,VertexData,Vector3,Color3,StandardMaterial,DynamicTexture,Texture,TransformNode,ShaderMaterial} from '@babylonjs/core';
import pineBoughURL from '../assets/pine-bough-v1.webp';
import {terrainHeight,riverX,bridgeHeight} from './terrain';
import type {SurfaceSet} from './surfaces';
import type {Obstacle} from './world';
export const landmarks=[
 {id:'mine',name:'The abandoned workings',x:-112,z:76,description:'The timbers are still sound. The ore seam is not. Someone has left a smith’s hammer beside the last cart.'},
 {id:'watch',name:'The broken watchtower',x:101,z:94,description:'Before the barrier, a royal watch stood over this road. Now its fire burns for nobody. The camp looks almost peaceful from here.'},
 {id:'circle',name:'The forgotten shrine',x:-91,z:-108,description:'Seven stones, older than the kingdom. Their inscriptions have been rubbed away by rain, but the offering bowl is warm.'},
 {id:'bridge',name:'The river crossing',x:riverX(-75),z:-75,description:'The river passes under the barrier. Men have tried to follow it. Their empty boats always come back.'},
 {id:'overlook',name:'The high road',x:0,z:153,description:'Smoke rises from the camp below. Beyond it, the mountain pass disappears into the blue prison. For now, this valley is home.'},
] as const;
export function buildWilderness(scene:Scene,s:SurfaceSet,obstacles:Obstacle[]){
 let seed=8219;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const groups=new Map<StandardMaterial,Mesh[]>();
 const mat=(name:string,key:keyof SurfaceSet,tint='#ffffff')=>{const m=new StandardMaterial(name,scene);m.diffuseTexture=s[key].color;m.bumpTexture=s[key].normal;m.diffuseColor=Color3.FromHexString(tint);m.specularColor=new Color3(.035,.035,.03);return m};
 const stone=mat('valley outcrops','rock','#b5b5a6'),masonry=mat('ruined stonework','stone','#b9b8a4'),wood=mat('mine timber','wood','#9b9181'),bark=mat('pine trunks','bark','#aaa596');
 const add=(m:Mesh,material:StandardMaterial)=>{m.material=material;m.receiveShadows=true;m.metadata={grounded:true};m.isPickable=false;const group=groups.get(material)||[];group.push(m);groups.set(material,group);return m};
 const box=(name:string,x:number,y:number,z:number,w:number,h:number,d:number,m:StandardMaterial,a=0)=>{const mesh=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d,wrap:true},scene);mesh.position.set(x,y,z);mesh.rotation.y=a;return add(mesh,m)};
 function rock(x:number,z:number,size:number){const m=MeshBuilder.CreateSphere('eroded boulder',{diameter:2,segments:8},scene);const p=m.getVerticesData('position')!;for(let i=0;i<p.length;i+=3){const r=1+Math.sin(p[i]*11+p[i+1]*7+p[i+2]*5)*.12;for(let j=0;j<3;j++)p[i+j]*=r}m.updateVerticesData('position',p);m.position.set(x,terrainHeight(x,z)+size*.24,z);m.scaling.set(size,size*(.5+rand()*.65),size*(.7+rand()*.4));m.rotation.y=rand()*6.28;add(m,stone);if(size>1.5)obstacles.push({x,z,w:size*1.5,d:size*1.4,a:0,height:size});}
 for(let i=0;i<100;i++){const a=rand()*Math.PI*2,r=78+rand()*145,x=Math.sin(a)*r,z=Math.cos(a)*r;if(Math.abs(x-riverX(z))<17||landmarks.some(l=>Math.hypot(l.x-x,l.z-z)<14)||Math.abs(x)<8)continue;rock(x,z,1+rand()*3.5)}
 // Needle-covered branch cards; fine twigs and needles leave a natural, irregular silhouette.
 const needle=new Texture(pineBoughURL,scene,false,false,Texture.TRILINEAR_SAMPLINGMODE);needle.hasAlpha=true;needle.anisotropicFilteringLevel=16;
 const foliage=new StandardMaterial('pine needles',scene);foliage.diffuseTexture=needle;foliage.useAlphaFromDiffuseTexture=true;foliage.transparencyMode=1;foliage.alphaCutOff=.38;foliage.backFaceCulling=false;foliage.specularColor=Color3.Black();foliage.ambientColor=new Color3(.18,.19,.13);
 for(let i=0;i<245;i++){
  const a=rand()*Math.PI*2,r=78+rand()*143,x=Math.sin(a)*r,z=Math.cos(a)*r;
  if(Math.abs(x-riverX(z))<14||Math.abs(x)<8||landmarks.some(l=>Math.hypot(l.x-x,l.z-z)<14)||Math.abs(z+108)<5&&x<0||Math.abs(z-76)<6&&x<0)continue;
  const y=terrainHeight(x,z),h=8+rand()*10;
  const trunk=MeshBuilder.CreateCylinder('mature pine',{height:h,diameterBottom:.65,diameterTop:.13,tessellation:9},scene);trunk.position.set(x,y+h/2,z);add(trunk,bark);obstacles.push({x,z,w:.7,d:.7,a:0,height:h});
  for(let j=0;j<12;j++){const f=j/12,height=h*(.28+f*.7),width=(1-f)*3.6+.2;for(let k=0;k<5;k++){const angle=k/5*Math.PI*2+j*.93+rand()*.35,len=width*(.75+rand()*.4);const card=MeshBuilder.CreatePlane('pine bough',{width:len*1.65,height:len*.85,sideOrientation:Mesh.DOUBLESIDE},scene);card.rotation.set(.5+rand()*.7,angle,0);card.position.set(x+Math.cos(angle)*len*.6,y+height,z-Math.sin(angle)*len*.6);add(card,foliage)}}
 }
 // A real traversable wooden bridge over a shallow, carved riverbed.
 const bz=-75,bx=riverX(bz),by=terrainHeight(bx-14,bz)+.4;
 for(let i=-20;i<=20;i++){box('bridge plank',bx+i*.88,bridgeHeight(bx+i*.88),bz,.84,.20,4,wood);for(const sign of [-1,1])if(i%5===0){box('bridge upright',bx+i*.88,by+.65,bz+sign*1.9,.16,1.5,.16,wood)}}
 for(const sign of [-1,1]){box('bridge handrail',bx,by+1.27,bz+sign*1.9,28,.14,.14,wood);box('bridge joist',bx,by-.25,bz+sign*1.4,29,.5,.3,wood)}
 // Broken tower: doorway, collapsed walls, old stair and a camp view through the breach.
 const tx=101,tz=94,ty=terrainHeight(tx,tz);
 for(const sign of [-1,1]){box('watchtower surviving wall',tx+sign*5,ty+3,tz,.9,6+sign,10,masonry);obstacles.push({x:tx+sign*5,z:tz,w:1,d:10,a:0,height:7});box('watchtower front',tx+sign*3.5,ty+2,tz-5,3,4,1,masonry);obstacles.push({x:tx+sign*3.5,z:tz-5,w:3,d:1,a:0,height:4})}
 box('watchtower back',tx,ty+2,tz+5,10,4,1,masonry);obstacles.push({x:tx,z:tz+5,w:10,d:1,a:0,height:4});
 for(let i=0;i<16;i++){const a=rand()*6.28;rock(tx+Math.sin(a)*(7+rand()*4),tz+Math.cos(a)*(7+rand()*4),.5+rand())}
 // Abandoned adit built into a rough cliff. The entrance is a walkable alcove.
 const mx=-112,mz=76,my=terrainHeight(mx,mz);
 for(const sign of [-1,1])for(let i=0;i<4;i++)rock(mx+sign*(5+i*2),mz+3+i,3+rand()*2);
 const dark=new StandardMaterial('adit darkness',scene);dark.diffuseColor=new Color3(.018,.021,.018);dark.specularColor=Color3.Black();
 box('mine rear',mx,my+2.5,mz+9,8,5,.6,dark);obstacles.push({x:mx,z:mz+9,w:8,d:1,a:0,height:5});
 for(const dz of [0,3,6]){for(const sign of [-1,1]){box('mine prop',mx+sign*2.6,my+2.1,mz+dz,.42,4.2,.42,wood);obstacles.push({x:mx+sign*2.6,z:mz+dz,w:.5,d:.5,a:0,height:4})}box('mine lintel',mx,my+4.2,mz+dz,6.1,.5,.5,wood)}
 box('mine ceiling',mx,my+4.65,mz+4.5,6,.7,11,stone);
 for(const sign of [-1,1])box('rusted mine rails',mx+sign*.65,my+.08,mz+1,.07,.08,18,wood);
 for(let i=-8;i<9;i+=2)box('rail sleepers',mx,my+.03,mz+i,1.9,.09,.17,wood);
 // A roofless wayside shrine, with seven standing stones and a central offering.
 const sx=-91,sz=-108,sy=terrainHeight(sx,sz);
 for(let i=0;i<7;i++){const a=i/7*Math.PI*2,x=sx+Math.sin(a)*8,z=sz+Math.cos(a)*8,y=terrainHeight(x,z),h=2.7+rand();const m=box('ancient standing stone',x,y+h/2,z,1.2,h,.85,stone,a);m.rotation.z=(rand()-.5)*.16;obstacles.push({x,z,w:1.2,d:.85,a,height:h})}
 const altar=MeshBuilder.CreateCylinder('offering altar',{height:.8,diameter:2.2,tessellation:16},scene);altar.position.set(sx,sy+.4,sz);add(altar,masonry);
 // All scenery is merged per material, retaining photographed textures and close detail.
 for(const [material,meshes] of groups){const joined=Mesh.MergeMeshes(meshes,true,true);if(joined){joined.name=material===foliage?'pine forest':'wilderness '+material.name;joined.material=material;joined.metadata={grounded:true};joined.isPickable=false;joined.receiveShadows=true}}
 // Flowing water, with continuous world-space ripples rather than a flat blue plane.
 const water=new ShaderMaterial('river surface',scene,{vertexSource:`precision highp float;attribute vec3 position;uniform mat4 worldViewProjection;varying vec3 p;void main(){p=position;gl_Position=worldViewProjection*vec4(position,1.);}`,fragmentSource:`precision highp float;varying vec3 p;uniform float time;void main(){float a=sin(p.x*3.+sin(p.z*.6+time)*.5+time*1.4);float b=sin(p.z*8.-time*2.+p.x*1.7);float ripple=pow(max(0.,a*b),12.);vec3 col=mix(vec3(.09,.15,.16),vec3(.32,.40,.40),.45+.13*sin(p.z*.12+p.x*.8));col+=ripple*.17;gl_FragColor=vec4(col,.92);}`},{attributes:['position'],uniforms:['worldViewProjection','time'],needAlphaBlending:true});water.backFaceCulling=false;
 const wp:number[]=[],wi:number[]=[];for(let i=0;i<=180;i++){const z=-210+i*2.33,x=riverX(z);wp.push(x-7,-1.15,z,x+7,-1.15,z);if(i<180){const b=i*2;wi.push(b,b+1,b+2,b+1,b+3,b+2)}}const wd=new VertexData();wd.positions=wp;wd.indices=wi;const wm=new Mesh('wilderness water',scene);wd.applyToMesh(wm);wm.material=water;wm.isPickable=false;wm.metadata={grounded:true};scene.onBeforeRenderObservable.add(()=>water.setFloat('time',performance.now()/1000));
}

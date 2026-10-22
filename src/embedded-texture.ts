import {Scene,Texture} from '@babylonjs/core';

/** Decode embedded images before upload; never silently accept Babylon's error texture. */
export async function loadEmbeddedTexture(scene:Scene,dataURL:string,name:string):Promise<Texture>{
 const comma=dataURL.indexOf(','),mime=/^data:([^;]+);base64$/.exec(dataURL.slice(0,comma))?.[1];
 if(!mime)throw Error(`Invalid embedded image: ${name}`);
 const binary=atob(dataURL.slice(comma+1)),bytes=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 const blob=new Blob([bytes],{type:mime});
 for(let attempt=1;attempt<=2;attempt++){
  const url=URL.createObjectURL(blob),image=new Image();image.alt=name;image.src=url;
  let texture:Texture|undefined;
  try{
   await image.decode();
   // Supplying the decoded image bypasses a second asynchronous URL decode in
   // the engine. Short blob URLs also avoid retaining giant data URLs as keys.
   texture=await new Promise<Texture>((resolve,reject)=>{
    const candidate=new Texture(null,scene,false,false,Texture.TRILINEAR_SAMPLINGMODE,()=>resolve(candidate),()=>reject(Error(`Texture upload failed: ${name}`)));
    texture=candidate;candidate.name=name;candidate.updateURL(url,image);
   });
   if(texture.loadingError||!texture.isReady())throw Error(`Texture not ready: ${name}`);
   texture.metadata={embedded:true,attempts:attempt};
   // Keep the source available for clones and WebGL context restoration.
   scene.onDisposeObservable.addOnce(()=>URL.revokeObjectURL(url));
   return texture;
  }catch{
   texture?.dispose();URL.revokeObjectURL(url);
   if(attempt===2)throw Error(`Could not load embedded texture: ${name}. Reload the game to retry.`);
  }
 }
 throw Error(`Could not load embedded texture: ${name}`);
}

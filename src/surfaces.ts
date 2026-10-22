import { Scene, Texture } from '@babylonjs/core';
import {loadEmbeddedTexture} from './embedded-texture';
import stone from '../assets/textures/stone-diff.webp';
import stoneN from '../assets/textures/stone-normal.webp';
import wood from '../assets/textures/wood-diff.webp';
import woodN from '../assets/textures/wood-normal.webp';
import roof from '../assets/textures/roof-diff.webp';
import roofN from '../assets/textures/roof-normal.webp';
import mud from '../assets/textures/mud-diff.webp';
import mudN from '../assets/textures/mud-normal.webp';
import rock from '../assets/textures/rock-diff.webp';
import rockN from '../assets/textures/rock-normal.webp';
import bark from '../assets/textures/bark-diff.webp';
import barkN from '../assets/textures/bark-normal.webp';
import leather from '../assets/textures/leather-diff.webp';
import leatherN from '../assets/textures/leather-normal.webp';
import fabric from '../assets/textures/fabric-diff.webp';
import fabricN from '../assets/textures/fabric-normal.webp';
export type SurfaceName='stone'|'wood'|'roof'|'mud'|'rock'|'bark'|'leather'|'fabric';
export type SurfaceSet=Record<SurfaceName,{color:Texture;normal:Texture}>;
export async function createSurfaces(scene:Scene):Promise<SurfaceSet>{
 const result={} as SurfaceSet;
 for(const [name,url,normalURL] of [['stone',stone,stoneN],['wood',wood,woodN],['roof',roof,roofN],['mud',mud,mudN],['rock',rock,rockN],['bark',bark,barkN],['leather',leather,leatherN],['fabric',fabric,fabricN]] as const){
  // Load in sequence to limit peak decode memory on browser reloads.
  const color=await loadEmbeddedTexture(scene,url,name+' color');
  const normal=await loadEmbeddedTexture(scene,normalURL,name+' normal');
  for(const texture of [color,normal]){texture.wrapU=texture.wrapV=Texture.WRAP_ADDRESSMODE;texture.anisotropicFilteringLevel=16;}
  normal.gammaSpace=false;normal.level=name==='mud'?.5:.65;result[name]={color,normal};
 }
 return result;
}

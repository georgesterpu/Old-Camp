import {freshExpedition} from './expedition';
import {normalizeAppearance,validAppearance} from './appearance';
import {landmarks} from './wilderness';
/** Validate portable save data before applying it to live game state. */
export function parseSave(text:string){
 const data=JSON.parse(text);if(!data||typeof data!=='object'||!Number.isInteger(data.stage)||data.stage<0||data.stage>3)throw Error('Invalid chapter');
 if(!Number.isFinite(data.x)||!Number.isFinite(data.z)||Math.hypot(data.x,data.z)>226||!Number.isFinite(data.yaw))throw Error('Invalid position');
 const integer=(value:unknown,max:number)=>typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<=max;
 if(!integer(data.ore,99999)||!Array.isArray(data.collected)||data.collected.some((i:unknown)=>!integer(i,7)))throw Error('Invalid inventory');
 const exp={...freshExpedition(),...data.expedition};
 if(!integer(exp.smith,3)||!integer(exp.wins,99999)||typeof exp.weapon!=='boolean'||typeof exp.soup!=='boolean'||!Array.isArray(exp.herbs)||exp.herbs.some((i:unknown)=>!integer(i,5))||!Array.isArray(exp.found)||exp.found.some((id:unknown)=>!landmarks.some(l=>l.id===id)))throw Error('Invalid journey');
 if(data.appearance!==undefined&&!validAppearance(data.appearance))throw Error('Invalid appearance');
 return {appearance:normalizeAppearance(data.appearance),stage:data.stage as number,ore:data.ore as number,collected:[...new Set(data.collected)] as number[],x:data.x as number,z:data.z as number,yaw:data.yaw as number,seen:Array.isArray(data.seen)?data.seen.filter((s:unknown)=>typeof s==='string'&&s.length<100).slice(0,30):[],expedition:{...exp,herbs:[...new Set(exp.herbs)],found:[...new Set(exp.found)]}};
}

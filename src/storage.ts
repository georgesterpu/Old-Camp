import {parseSave} from './save';
type Store=Pick<Storage,'getItem'|'setItem'>;
export const JOURNEY_KEY='old-camp-progress',BACKUP_KEY='old-camp-progress-backup';
/** A corrupt primary must never replace the last valid backup. */
export function loadJourney(storage:Store){
 let damaged=false;
 for(const key of [JOURNEY_KEY,BACKUP_KEY]){
  try{const text=storage.getItem(key);if(!text)continue;return {save:parseSave(text),recovered:key===BACKUP_KEY,damaged}}
  catch{damaged=true}
 }
 return {save:null,recovered:false,damaged};
}
export function storeJourney(storage:Store,text:string){
 parseSave(text);
 let previous:string|null=null;try{const value=storage.getItem(JOURNEY_KEY);if(value){parseSave(value);previous=value}}catch{}
 // Backup failure must not prevent a primary save (for example near the storage quota).
 try{storage.setItem(BACKUP_KEY,previous??text)}catch{}
 storage.setItem(JOURNEY_KEY,text);
}

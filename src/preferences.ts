export interface Preferences {graphics:'auto'|'high'|'balanced';muted:boolean;music:boolean}
const key='old-camp-preferences';
export function loadPreferences(storage:Pick<Storage,'getItem'>):Preferences {
 const defaults:Preferences={graphics:'auto',muted:false,music:true};
 try{const value=JSON.parse(storage.getItem(key)||'null');if(value&&typeof value==='object'){if(['auto','high','balanced'].includes(value.graphics))defaults.graphics=value.graphics;if(typeof value.muted==='boolean')defaults.muted=value.muted;if(typeof value.music==='boolean')defaults.music=value.music}}catch{}return defaults;
}
export function savePreferences(storage:Pick<Storage,'setItem'>,preferences:Preferences){try{storage.setItem(key,JSON.stringify(preferences))}catch{}}

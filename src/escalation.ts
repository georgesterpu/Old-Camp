import {pay,standing,logEvent,type ColonySave} from './colony';

export type Charter='undecided'|'commons'|'watch';
export interface CrisisSave {
 stage:'dormant'|'signals'|'assault'|'return'|'complete';
 repaired:string[];integrity:number;charter:Charter;attempts:number;
 patrolShift:number;patrolClaimed:boolean;
}
export const freshCrisis=():CrisisSave=>({stage:'dormant',repaired:[],integrity:100,charter:'undecided',attempts:0,patrolShift:-1,patrolClaimed:false});
export const signalSites=[
 {id:'signal-shrine',label:'Shrine signal',x:-84,z:-113},
 {id:'signal-river',label:'Ferryman’s signal',x:79,z:-86},
 {id:'signal-road',label:'High-road signal',x:8,z:151}
] as const;
export const lastLight={x:8,z:151};
export const signalCover=[{x:2,z:147,w:2.4,d:1.1},{x:14,z:147,w:2.4,d:1.1}];
export function normalizeCrisis(value:unknown):CrisisSave {
 const s=freshCrisis();if(!value||typeof value!=='object'||Array.isArray(value))return s;
 const v=value as Record<string,unknown>;
 if(['dormant','signals','assault','return','complete'].includes(v.stage as string))s.stage=v.stage as CrisisSave['stage'];
 if(Array.isArray(v.repaired))s.repaired=[...new Set(v.repaired.filter((id):id is string=>signalSites.some(p=>p.id===id)))];
 if(typeof v.integrity==='number'&&Number.isFinite(v.integrity)&&v.integrity>=0&&v.integrity<=100)s.integrity=v.integrity;
 if(['undecided','commons','watch'].includes(v.charter as string))s.charter=v.charter as Charter;
 for(const k of ['attempts','patrolShift'] as const)if(typeof v[k]==='number'&&Number.isInteger(v[k])&&v[k]>= (k==='patrolShift'?-1:0)&&v[k]<=2e6)s[k]=v[k];
 s.patrolClaimed=v.patrolClaimed===true;
 if(s.stage==='dormant')return freshCrisis();
 if(['assault','return','complete'].includes(s.stage)&&s.repaired.length!==3)s.stage='signals';
 if(s.stage!=='complete')s.charter='undecided';
 else if(s.charter==='undecided')s.stage='return';
 return s;
}
export function beginCrisis(s:ColonySave){
 if(s.outcome==='undecided'||s.crisis.stage!=='dormant')return false;
 s.crisis.stage='signals';s.watch.active=false;
 logEvent(s,'Grim’s sister is on the next ore cart. A displaced levy crew is cutting the valley’s signal line. Restore three beacons before calling the caravan through.');return true;
}
export function repairSignal(s:ColonySave,id:string){
 if(s.crisis.stage!=='signals'||!signalSites.some(p=>p.id===id)||s.crisis.repaired.includes(id)||!pay(s,{wood:1,iron:1}))return false;
 s.crisis.repaired.push(id);logEvent(s,`${signalSites.find(p=>p.id===id)!.label} restored. ${s.crisis.repaired.length} of 3 lights ready.`);return true;
}
export function patchBeacon(s:ColonySave){
 if(s.crisis.stage!=='assault'||s.crisis.integrity>=100||!pay(s,{wood:1,iron:1}))return false;
 s.crisis.integrity=Math.min(100,s.crisis.integrity+35);return true;
}
export function crisisObjective(s:ColonySave){
 const c=s.crisis;if(s.outcome==='undecided')return null;
 if(c.stage==='dormant')return {text:'Grim has news of the next ore cart. Ask him about the signal line.',x:-8,z:-35,label:'Grim · the last light'};
 if(c.stage==='signals'){
  const site=signalSites.find(p=>!c.repaired.includes(p.id));
  return site?{text:`Restore ${site.label}: 1 timber + 1 iron. ${c.repaired.length}/3 signals ready.`,...site}:
   {text:'The signal line is ready. Light the high-road beacon to call the caravan. Bring spare timber and iron for emergency repairs.',...lastLight,label:'High-road beacon · call the caravan'};
 }
 if(c.stage==='assault')return {text:`Defend the last light · ${Math.ceil(c.integrity)}% integrity. Intercept the levy crew; E at the beacon repairs 35% for 1 timber + 1 iron.`,...lastLight,label:'Last light · defend the beacon'};
 if(c.stage==='return')return {text:'The caravan is through. Return to Grim and decide who will keep the signal road open.',x:-8,z:-35,label:'Grim · a way home'};
 return null;
}
export function settleCharter(s:ColonySave,charter:Exclude<Charter,'undecided'>){
 if(s.crisis.stage!=='return')return false;s.crisis.stage='complete';s.crisis.charter=charter;
 standing(s,charter==='commons'?'diggers':'guards',15);standing(s,'shadows',5);
 s.stocks[charter==='commons'?'food':'watch']=Math.min(10,s.stocks[charter==='commons'?'food':'watch']+4);
 logEvent(s,charter==='commons'?'Grim’s sister made it home. The signal road belongs to the camp together: the caravan brings food every shift.':'Grim’s sister made it home. The watch takes responsibility for the road: each shift brings new patrol supplies.');return true;
}
export function crisisRumor(s:ColonySave,name:string){
 const c=s.crisis;if(s.outcome==='undecided')return '';
 if(name==='Grim')return c.stage==='dormant'?'My sister is on the next ore cart. The levy men have gone after the signal line. No lights means no safe road. I can’t leave her out there.':c.stage==='return'?'I heard the cart at the gate. She’s here. You brought her home. Now tell me: who keeps that road safe for the next family?':c.stage==='complete'?'She asked who lit the road. I told her your name. There’s a place for you at our fire.':'Three lights. That is all that stands between her cart and the dark. Thank you for going.';
 if(name==='Thorus')return s.outcome==='sealed'?'You trusted the watch with the mine. We will intercept a flanker before he reaches the final beacon.':'You gave the seam to the diggers. They can send repair timber; my watch has no men to spare for the beacon.';
 if(name==='Snaf'&&c.stage==='complete')return c.charter==='commons'?'The caravan brought grain. For once, we’re cooking for tomorrow as well as today.':'The watch escorted the food carts. I’ve put a bowl aside for Grim’s sister.';
 return '';
}

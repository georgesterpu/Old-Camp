import {gatheringSites,siteAvailable,resourceNames,price,type ColonySave,type Resource} from './colony';
import {signalSites} from './escalation';
export interface CampaignGuide {title:string;text:string;requirements:string;route:string;button:string;steps:{label:string;done:boolean}[]}
/** All guidance follows existing campaign gates; it never introduces another mandatory grind. */
export function campaignGuide(s:ColonySave,p:{stage:number;weapon:boolean;ore:number;smith?:number}):CampaignGuide {
 const steps=[{label:'Earn a place and a blade',done:p.stage===3&&p.weapon},{label:'Prepare food, tools and a watch',done:s.outcome!=='undecided'||s.aid.food&&s.aid.tools&&s.aid.watch},{label:'Decide the mine’s future',done:s.outcome!=='undecided'},{label:'Restore the signals and defend the caravan',done:['return','complete'].includes(s.crisis.stage)},{label:'Choose a road charter · campaign ending',done:s.crisis.stage==='complete'}];
 const make=(title:string,text:string,route:string,button:string,requirements=''):CampaignGuide=>({title,text,route,button,requirements,steps});
 const material=(cost:Partial<Record<Resource,number>>,owner:string,title:string,text:string)=>{
  const entries=Object.entries(cost) as [Resource,number][],requirements=entries.map(([k,n])=>`${resourceNames[k]} ${s.inventory[k]}/${n}`).join(' · '),missing=entries.find(([k,n])=>s.inventory[k]<n);
  if(!missing)return make(title,text,owner,`Track ${owner}`,requirements);
  const [kind,n]=missing;
  if(kind==='ration'){
   const need=n-s.inventory.ration;
   if(p.ore>=need*price(s,2))return make(title,'Buy the missing rations from Fisk, or cook them at Snaf’s pot. The delivery needs two rations in your pack.','Fisk','Track Fisk',requirements);
   if(s.inventory.herb>=need&&s.inventory.wood>=need)return make(title,'Cook the missing ration at Snaf’s pot, then deliver the pair.','Snaf','Track Snaf',requirements);
   return material({herb:need,wood:need},'Snaf',title,'Cook rations at Snaf’s pot, then supply the communal meal.');
  }
  if(!['wood','iron','herb'].includes(kind))return make(title,text,owner,`Track ${owner}`,requirements);
  const available=gatheringSites.some(site=>site.kind===kind&&siteAvailable(s,site));
  return make(title,available?`Gather the missing ${resourceNames[kind].toLowerCase()}, then return to ${owner}.`:'The remaining patches need two shifts to recover. Rest at Snaf’s fire or buy supplies from Fisk. Each rest advances one shift.',available?kind:'Snaf',available?`Find ${resourceNames[kind].toLowerCase()}`:'Track Snaf to rest',requirements);
 };
 if(p.stage<3)return make('A place in the camp',p.stage===0?'Speak to Diego by the fire. He will explain how to earn admission.':p.stage===1?`Diego needs three ore nuggets: ${Math.min(p.ore,3)}/3. Look around the huts, forge and market.`:'Diego has vouched for you. Ask Thorus for castle admission.',p.stage===2?'Thorus':p.stage===1&&p.ore<3?'ore':'Diego',p.stage===1&&p.ore<3?'Find loose ore':`Track ${p.stage===2?'Thorus':'Diego'}`);
 if(!p.weapon)return make('Earn your blade',p.smith===1?'Recover Huno’s hammer from the old workings west of the south gate, then return to his forge.':'Ask Huno for work. Recover his hammer from the old workings and return it.',p.smith===1?'hammer':'Huno',p.smith===1?'Track Huno’s hammer':'Track Huno');
 if(!s.active)return make('Prepare the camp','Ask Diego to begin the mine expedition. Three supply jobs prepare the camp permanently; daily stock levels are not extra entry gates.','Diego','Track Diego');
 if(s.outcome==='undecided'){
  if(!s.aid.food)return material({ration:2},'Snaf','Feed the camp','Give Snaf two rations.');
  if(!s.aid.tools)return material({wood:2,iron:2},'Huno','Replace the tools','Give Huno two timber and two iron.');
  if(!s.aid.watch)return material({wood:1,iron:1},'Thorus','Secure the watch','Deliver the spear materials, or defeat the north-road levy instead.');
  if(!s.mineCleared)return make('Break the mine levy','The camp is prepared. Drive off the overseer’s crew; take healing supplies and use reach, flanks and fresh guards.','mine','Track the old mine');
  return make('Choose the mine’s future','Return to Diego. Reopen the seam for the diggers or seal it for the watch. Either choice continues the campaign.','Diego','Track Diego');
 }
 if(s.crisis.stage==='dormant')return make('The last light','Grim’s sister is on the next caravan. Ask him about the signal line. The ruined watch is optional.','Grim','Track Grim');
 if(s.crisis.stage==='signals'){
  const site=signalSites.find(site=>!s.crisis.repaired.includes(site.id));
  if(site){const hint=material({wood:1,iron:1},site.label,'Restore the signal line',`${s.crisis.repaired.length}/3 signals restored. Use E at ${site.label}.`);if(s.inventory.wood&&s.inventory.iron){hint.route=site.id;hint.button=`Track ${site.label}`;hint.text=`${s.crisis.repaired.length}/3 restored. Press E at ${site.label}; each repair uses one timber and one iron.`}return hint}
  return make('Call the caravan','All signals are restored. Press E again at the high-road beacon. Bring spare timber and iron; beacon repairs cost one of each.','signal-road','Track the last light');
 }
 if(s.crisis.stage==='assault')return make('Hold the last light',`Beacon integrity ${Math.ceil(s.crisis.integrity)}%. Intercept attackers; leave fire-pot circles. E at the beacon repairs 35% for one timber and one iron.`,'signal-road','Track the beacon',`Repair timber ${s.inventory.wood} · iron ${s.inventory.iron}`);
 if(s.crisis.stage==='return')return make('Bring the story home','Return to Grim and choose the road charter. This settlement decision completes the campaign.','Grim','Track Grim');
 return make('Campaign complete · optional afterword','Your ending is saved. Defend the ruined watch once after the ending, or revisit the valley at your own pace.','watch-board','Track the keeper’s watch');
}

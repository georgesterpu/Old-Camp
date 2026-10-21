import {test,expect} from 'bun:test';
import {freshColony,normalizeColony,validColony,gather,craft,contribute,rescue,advanceColony,DAY_SECONDS} from '../src/colony';
import {freshCampaign,finishCampaign,recordStat,postgameWatchComplete} from '../src/campaign';
import {campaignGuide} from '../src/campaign-guide';
import {parseSave} from '../src/save';
import {loadJourney,storeJourney,JOURNEY_KEY,BACKUP_KEY} from '../src/storage';
import {loadPreferences,savePreferences} from '../src/preferences';
const progress={stage:3,weapon:true,ore:10};
function complete(){const s=freshColony();s.active=true;s.mineCleared=true;s.outcome='opened';s.crisis={...s.crisis,stage:'complete',charter:'commons',repaired:['signal-shrine','signal-river','signal-road']};return s}
function portable(colony=freshColony()){return JSON.stringify({stage:3,ore:10,collected:[],x:0,z:-70,yaw:0,colony})}
function storage(){const data=new Map<string,string>();return {data,getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)}}}
test('the charter completes the campaign once and postgame never rewrites the ending',()=>{
 const s=freshColony();expect(finishCampaign(s,20)).toBe(false);Object.assign(s,complete());recordStat(s,'seconds',3599);recordStat(s,'foes',8);s.watch.wins=2;expect(finishCampaign(s,35)).toBe(true);const ending=JSON.stringify(s.campaign.ending);recordStat(s,'foes',3);recordStat(s,'seconds',100);expect(finishCampaign(s,99)).toBe(false);expect(JSON.stringify(s.campaign.ending)).toBe(ending);expect(postgameWatchComplete(s)).toBe(false);s.watch.wins++;expect(postgameWatchComplete(s)).toBe(true);
});
test('all four mine and charter combinations retain valid immutable ending records',()=>{
 for(const mine of ['opened','sealed'] as const)for(const charter of ['commons','watch'] as const){const s=complete();s.outcome=mine;s.crisis.charter=charter;finishCampaign(s,25);s.campaign.seen=true;expect(validColony(s)).toBe(true);expect(parseSave(portable(s)).colony.campaign).toEqual(s.campaign)}
});
test('legacy campaigns are labelled partial and invalid or forged result states are rejected',()=>{
 expect(parseSave(JSON.stringify({stage:2,ore:1,collected:[],x:0,z:-70,yaw:0})).colony.campaign.partial).toBe(true);
 const {campaign,...legacy}=complete(),loaded=normalizeColony(legacy);expect(validColony(legacy)).toBe(true);expect(loaded.campaign.partial).toBe(true);expect(finishCampaign(loaded,10)).toBe(true);expect(loaded.campaign.ending?.partial).toBe(true);
 const s=complete();finishCampaign(s,10);for(const bad of [{stats:{...s.campaign.stats,foes:-1}},{seen:'yes'},{ending:{...s.campaign.ending,ore:1.5}},{failure:{kind:'defeat',oreLost:99}}])expect(validColony({...s,campaign:{...s.campaign,...bad}})).toBe(false);
 expect(validColony({...s,crisis:{...s.crisis,stage:'signals',charter:'undecided'}})).toBe(false);
});
test('action statistics count successful actions and rests do not count as active play time',()=>{
 const s=freshColony();gather(s,'timber-north');gather(s,'timber-north');s.inventory.herb=2;craft(s,'salve');craft(s,'salve');s.active=true;contribute(s,'food');contribute(s,'food');rescue(s,10);advanceColony(s,DAY_SECONDS*2);
 expect(s.campaign.stats).toEqual({...freshCampaign().stats,gathered:3,crafted:1,contracts:1,rescues:1});
});
test('guidance explains missing material gates and routes gathering, cooking and campaign closure',()=>{
 const s=freshColony();expect(campaignGuide(s,{...progress,stage:1,ore:1}).route).toBe('ore');expect(campaignGuide(s,{...progress,weapon:false,smith:1}).route).toBe('hammer');s.active=true;s.aid.food=true;expect(campaignGuide(s,progress).route).toBe('wood');s.inventory.wood=2;expect(campaignGuide(s,progress).route).toBe('iron');s.inventory.iron=2;expect(campaignGuide(s,progress).route).toBe('Huno');s.aid={food:true,tools:true,watch:true};s.mineCleared=true;s.outcome='sealed';expect(campaignGuide(s,progress).route).toBe('Grim');s.crisis.stage='signals';expect(campaignGuide(s,progress).route).toBe('signal-shrine');Object.assign(s,complete());expect(campaignGuide(s,progress).steps.every(step=>step.done)).toBe(true);
});
test('a corrupt local primary falls back to the last validated save',()=>{
 const store=storage(),first=portable();storeJourney(store,first);const s=freshColony();s.inventory.wood=3;storeJourney(store,portable(s));store.setItem(JOURNEY_KEY,'{"stage":3,"x":null}');const loaded=loadJourney(store);expect(loaded.recovered).toBe(true);expect(loaded.save?.colony.inventory.wood).toBe(0);expect(store.getItem(BACKUP_KEY)).toBe(first);
});
test('save writes never replace a good backup with corrupt data and a full backup quota does not lose the primary',()=>{
 const store=storage(),first=portable();storeJourney(store,first);store.setItem(JOURNEY_KEY,'bad');const s=freshColony();s.inventory.wood=2;storeJourney(store,portable(s));expect(loadJourney(store).save?.colony.inventory.wood).toBe(2);expect(()=>storeJourney(store,'bad')).toThrow();expect(loadJourney(store).save?.colony.inventory.wood).toBe(2);
 const limited={getItem:store.getItem,setItem:(key:string,value:string)=>{if(key===BACKUP_KEY)throw Error('Quota');store.setItem(key,value)}};s.inventory.wood=4;storeJourney(limited,portable(s));expect(loadJourney(store).save?.colony.inventory.wood).toBe(4);
});
test('preferences survive reload, reject malformed fields, and tolerate unavailable storage',()=>{
 const store=storage();savePreferences(store,{graphics:'balanced',muted:true,music:false});expect(loadPreferences(store)).toEqual({graphics:'balanced',muted:true,music:false});store.setItem('old-camp-preferences','{"graphics":"ultra","muted":"yes","music":true}');expect(loadPreferences(store)).toEqual({graphics:'auto',muted:false,music:true});expect(loadPreferences({getItem:()=>{throw Error('Unavailable')}})).toEqual({graphics:'auto',muted:false,music:true});expect(()=>savePreferences({setItem:()=>{throw Error('Unavailable')}},{graphics:'auto',muted:false,music:true})).not.toThrow();
});

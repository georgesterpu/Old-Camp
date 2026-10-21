import type {ColonySave,MineOutcome} from './colony';
import type {Charter} from './escalation';

export interface RunStats {seconds:number;foes:number;gathered:number;crafted:number;contracts:number;rescues:number}
export interface Ending {
 mine:Exclude<MineOutcome,'undecided'>;charter:Exclude<Charter,'undecided'>;
 stats:RunStats;ore:number;caches:number;watchWins:number;upgrade:number;partial:boolean;
}
export interface CampaignSave {
 stats:RunStats;partial:boolean;ending:Ending|null;seen:boolean;
 failure:null|{kind:'defeat'|'signal';oreLost:number};
}
export const freshStats=():RunStats=>({seconds:0,foes:0,gathered:0,crafted:0,contracts:0,rescues:0});
export const freshCampaign=():CampaignSave=>({stats:freshStats(),partial:false,ending:null,seen:false,failure:null});
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const count=(v:unknown,max=1e7)=>typeof v==='number'&&Number.isFinite(v)&&Number.isInteger(v)&&v>=0&&v<=max;
function normalizeStats(v:unknown){const s=freshStats();if(object(v))for(const k of Object.keys(s) as (keyof RunStats)[])if(typeof v[k]==='number'&&Number.isFinite(v[k])&&Number(v[k])>=0&&Number(v[k])<=1e9&&(k==='seconds'||Number.isInteger(v[k])))s[k]=Number(v[k]);return s}
export function normalizeCampaign(value:unknown,legacy=false):CampaignSave {
 const s=freshCampaign();s.partial=legacy;if(!object(value))return s;
 s.stats=normalizeStats(value.stats);s.partial=value.partial===true;s.seen=value.seen===true;
 if(object(value.failure)&&['defeat','signal'].includes(value.failure.kind as string)&&count(value.failure.oreLost,6))s.failure={kind:value.failure.kind as 'defeat'|'signal',oreLost:value.failure.oreLost as number};
 const e=value.ending;
 if(object(e)&&['opened','sealed'].includes(e.mine as string)&&['commons','watch'].includes(e.charter as string)&&count(e.ore,99999)&&count(e.caches,3)&&count(e.watchWins,999)&&count(e.upgrade,3)){
  s.ending={mine:e.mine as Ending['mine'],charter:e.charter as Ending['charter'],stats:normalizeStats(e.stats),ore:e.ore as number,caches:e.caches as number,watchWins:e.watchWins as number,upgrade:e.upgrade as number,partial:e.partial===true};
 }
 if(!s.ending)s.seen=false;return s;
}
export function recordStat(s:ColonySave,key:keyof RunStats,n=1){if(Number.isFinite(n)&&n>0)s.campaign.stats[key]=Math.min(1e9,s.campaign.stats[key]+n)}
/** A campaign ends at its settlement decision; postgame can never rewrite this snapshot. */
export function finishCampaign(s:ColonySave,ore:number){
 if(s.campaign.ending||s.crisis.stage!=='complete'||s.outcome==='undecided'||s.crisis.charter==='undecided')return false;
 s.campaign.ending={mine:s.outcome,charter:s.crisis.charter,stats:{...s.campaign.stats},ore:Math.min(99999,Math.max(0,Math.floor(ore))),caches:s.caches.length,watchWins:s.watch.wins,upgrade:s.upgrade,partial:s.campaign.partial};
 s.campaign.seen=false;s.campaign.failure=null;return true;
}
export function endingCopy(e:Ending){
 const mine=e.mine==='opened'?'The diggers return to a seam they can call their own.':'The sealed mine is quiet. The watch keeps the levy men off the road.';
 return {title:e.charter==='commons'?'A road for everyone':'A promise kept',text:`${mine} ${e.charter==='commons'?'At the communal pot, the caravan’s grain is shared. The road belongs to the people who kept its lights burning.':'The watch takes an oath to keep the signal road open. Fresh patrols escort the next carts through.'} Mara sits beside Grim’s fire. You arrived here owing a stranger three pieces of ore. You leave this story with a place in the camp.`};
}
export function playTime(seconds:number){const total=Math.floor(seconds/60);return total<1?'Under a minute':total<60?`${total} min`:`${Math.floor(total/60)} h ${total%60} min`}
export function postgameWatchComplete(s:ColonySave){return !!s.campaign.ending&&s.watch.wins>s.campaign.ending.watchWins}

/** The second chapter's rules. No renderer, DOM or wall clock: saves and tests use the same simulation. */
import {freshCrisis,normalizeCrisis,crisisObjective,crisisRumor,type CrisisSave} from './escalation';
import {freshCampaign,normalizeCampaign,recordStat,type CampaignSave} from './campaign';
export const DAY_SECONDS=900;
export type Resource='wood'|'iron'|'herb'|'ration'|'salve';
export type Faction='diggers'|'shadows'|'guards';
export type WeaponClass='sword'|'axe'|'spear';
export type MineOutcome='undecided'|'opened'|'sealed';
export interface ColonySave {
 version:1;crisis:CrisisSave;campaign:CampaignSave;clock:number;health:number;inventory:Record<Resource,number>;
 reputation:Record<Faction,number>;stocks:{food:number;tools:number;watch:number};
 aid:{food:boolean;tools:boolean;watch:boolean};active:boolean;mineCleared:boolean;outcome:MineOutcome;
 equipped:WeaponClass;weapons:WeaponClass[];upgrade:number;durability:number;
 gathered:Record<string,number>;caches:string[];enemies:Record<string,{health:number;day:number}>;
 contracts:Record<string,number>;trade:Record<string,number>;discovered:string[];
 watch:{active:boolean;wave:number;wins:number};log:{day:number;text:string}[];
 settings:{reducedMotion:boolean;highContrast:boolean;explorer:boolean};
}
export const freshColony=():ColonySave=>({version:1,crisis:freshCrisis(),campaign:freshCampaign(),clock:0,health:100,inventory:{wood:0,iron:0,herb:0,ration:2,salve:1},reputation:{diggers:0,shadows:0,guards:0},stocks:{food:2,tools:2,watch:2},aid:{food:false,tools:false,watch:false},active:false,mineCleared:false,outcome:'undecided',equipped:'sword',weapons:['sword'],upgrade:0,durability:100,gathered:{},caches:[],enemies:{},contracts:{},trade:{},discovered:[],watch:{active:false,wave:0,wins:0},log:[],settings:{reducedMotion:false,highContrast:false,explorer:false}});
export const resourceNames:Record<Resource,string>={wood:'Timber',iron:'Iron scrap',herb:'Bitterleaf',ration:'Rations',salve:'Healing salves'};
export const weaponProfiles={sword:{label:'Camp sword',damage:15,range:2.7,windup:.18,recovery:.65,cost:.25},axe:{label:'Woodcutter’s axe',damage:24,range:2.3,windup:.32,recovery:.92,cost:.34},spear:{label:'Watch spear',damage:13,range:3.6,windup:.23,recovery:.76,cost:.23}} as const;
export const dayOf=(s:ColonySave)=>Math.floor(s.clock/DAY_SECONDS);
export const hourOf=(s:ColonySave)=>(8+s.clock/DAY_SECONDS*24)%24;
export function timeLabel(s:ColonySave){const h=hourOf(s);return `Day ${dayOf(s)+1} · ${String(Math.floor(h)).padStart(2,'0')}:${String(Math.floor(h%1*60)).padStart(2,'0')}`}
export const prepared=(s:ColonySave)=>s.aid.food&&s.aid.tools&&s.aid.watch;
const bounded=(v:unknown,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max;
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
/** Tolerant for local recovery; portable imports use strict validation below. */
export function normalizeColony(value:unknown):ColonySave {
 const base=freshColony();if(!record(value))return base;base.crisis=normalizeCrisis(value.crisis);base.campaign=normalizeCampaign(value.campaign,value.campaign===undefined);
 for(const k of ['clock','health','upgrade','durability'] as const)if(bounded(value[k],k==='clock'?1e9:k==='upgrade'?3:100))base[k]=k==='upgrade'?Math.floor(value[k] as number):value[k] as number;
 for(const k of ['active','mineCleared'] as const)if(typeof value[k]==='boolean')base[k]=value[k];
 for(const k of ['inventory','reputation','stocks'] as const)if(record(value[k]))for(const field of Object.keys(base[k])){const n=value[k][field];if(typeof n==='number'&&Number.isInteger(n)&&n>=(k==='reputation'?-100:0)&&n<=(k==='inventory'?999:100))Object.assign(base[k],{[field]:n})}
 for(const k of ['aid','settings'] as const)if(record(value[k]))for(const field of Object.keys(base[k]))if(typeof value[k][field]==='boolean')Object.assign(base[k],{[field]:value[k][field]});
 if(['undecided','opened','sealed'].includes(value.outcome as string))base.outcome=value.outcome as MineOutcome;
 if(Array.isArray(value.weapons)){base.weapons=[...new Set(value.weapons.filter((v):v is WeaponClass=>['sword','axe','spear'].includes(v as string)))];if(!base.weapons.includes('sword'))base.weapons.unshift('sword')}
 if(base.weapons.includes(value.equipped as WeaponClass))base.equipped=value.equipped as WeaponClass;
 for(const k of ['gathered','contracts','trade'] as const)if(record(value[k]))for(const [id,n] of Object.entries(value[k]).slice(0,100))if(/^[a-z0-9-]{1,40}$/.test(id)&&bounded(n,1e9))base[k][id]=Math.floor(n as number);
 if(record(value.enemies))for(const [id,e] of Object.entries(value.enemies).slice(0,50))if(/^[a-z0-9-]{1,40}$/.test(id)&&record(e)&&bounded(e.health,1000)&&bounded(e.day,2e6))base.enemies[id]={health:e.health as number,day:e.day as number};
 for(const k of ['caches','discovered'] as const)if(Array.isArray(value[k]))base[k]=[...new Set(value[k].filter((id):id is string=>typeof id==='string'&&/^[a-z0-9-]{1,40}$/.test(id)))].slice(0,60);
 if(record(value.watch)){base.watch={active:value.watch.active===true,wave:bounded(value.watch.wave,2)?Math.floor(value.watch.wave as number):0,wins:bounded(value.watch.wins,999)?Math.floor(value.watch.wins as number):0}}
 if(Array.isArray(value.log))base.log=value.log.filter(e=>record(e)&&bounded(e.day,2e6)&&typeof e.text==='string'&&e.text.length<=240).slice(-24).map(e=>({day:e.day,text:e.text}));
 // Impossible campaign states cannot unlock rewards on a corrupt local save.
 if(!base.active){base.mineCleared=false;base.outcome='undecided';base.watch.active=false}
 if(base.outcome!=='undecided'&&!base.mineCleared)base.outcome='undecided';
 if(base.outcome==='undecided'){base.watch.active=false;base.crisis=freshCrisis()}
 if(base.crisis.stage==='assault')base.watch.active=false;
 if(base.crisis.stage!=='complete'||base.campaign.ending?.mine!==base.outcome||base.campaign.ending?.charter!==base.crisis.charter){base.campaign.ending=null;base.campaign.seen=false}
 return base;
}
export function validColony(value:unknown){
 if(!record(value)||value.version!==1)return false;
 // Normalizing and comparing known fields validates types, ranges and invariants.
 const normalized=normalizeColony(value);
 const ordered=(v:unknown):unknown=>Array.isArray(v)?v.map(ordered):record(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,ordered(v[k])])):v;
 return Object.keys(normalized).every(k=>(k==='crisis'||k==='campaign')&&value[k]===undefined||JSON.stringify(ordered(value[k]))===JSON.stringify(ordered(normalized[k as keyof ColonySave])));
}
export function logEvent(s:ColonySave,text:string){s.log.push({day:dayOf(s),text});if(s.log.length>24)s.log.shift()}
export function standing(s:ColonySave,f:Faction,amount:number){s.reputation[f]=Math.max(-100,Math.min(100,s.reputation[f]+amount))}
export function advanceColony(s:ColonySave,dt:number){
 const before=dayOf(s);s.clock+=Math.max(0,dt);
 if(!s.active||before===dayOf(s))return;
 const elapsed=dayOf(s)-before;
 for(const k of ['food','tools','watch'] as const)s.stocks[k]=Math.max(0,s.stocks[k]-elapsed*(s.outcome==='opened'&&k==='tools'?2:1));
 if(s.crisis.stage==='complete'){const k=s.crisis.charter==='commons'?'food':'watch';s.stocks[k]=Math.min(10,s.stocks[k]+elapsed*2);logEvent(s,`The signal-road caravan brings ${k==='food'?'grain for the communal pot':'supplies for the road watch'}.`)}
 logEvent(s,s.stocks.food===0?'The communal pot is empty. Snaf is looking for provisions.':s.stocks.watch===0?'The watch is stretched thin. Road patrols are paying more.':'A new shift begins. The market restocks and old gathering sites recover.');
}
export function price(s:ColonySave,base:number){const rep=Math.max(-20,Math.min(40,s.reputation.shadows)),shortage=dayOf(s)%3===2?1.15:1;return Math.max(1,Math.ceil(base/2),Math.ceil(base*shortage)-Math.floor(Math.max(0,rep)/20)+Math.ceil(Math.max(0,-rep)/20))}
export function canPay(s:ColonySave,cost:Partial<Record<Resource,number>>){return Object.entries(cost).every(([k,n])=>s.inventory[k as Resource]>=n!)}
export function pay(s:ColonySave,cost:Partial<Record<Resource,number>>){if(!canPay(s,cost))return false;for(const [k,n] of Object.entries(cost))s.inventory[k as Resource]-=n!;return true}
export function addResource(s:ColonySave,k:Resource,n:number){s.inventory[k]=Math.min(999,s.inventory[k]+n)}
export const recipes={salve:{name:'Brew a healing salve',cost:{herb:2},output:'salve'},ration:{name:'Cook a trail ration',cost:{herb:1,wood:1},output:'ration'}} as const;
export function craft(s:ColonySave,recipe:keyof typeof recipes){const r=recipes[recipe];if(!pay(s,r.cost))return false;addResource(s,r.output,1);recordStat(s,'crafted');logEvent(s,`${resourceNames[r.output]} prepared at the camp.`);return true}
export function contribute(s:ColonySave,kind:'food'|'tools'|'watch'){
 const costs={food:{ration:2},tools:{wood:2,iron:2},watch:{iron:1,wood:1}} as const;
 if(s.contracts[kind]===dayOf(s)||!pay(s,costs[kind]))return false;
 s.contracts[kind]=dayOf(s);s.aid[kind]=true;s.stocks[kind]=Math.min(10,s.stocks[kind]+3);
 recordStat(s,'contracts');
 standing(s,kind==='food'?'diggers':kind==='tools'?'shadows':'guards',4);
 logEvent(s,`${kind==='food'?'The pot is stocked':kind==='tools'?'Huno’s replacement tools are ready':'The watch receives fresh spear shafts'}. The camp will remember.`);return true;
}
export function resolveMine(s:ColonySave,outcome:Exclude<MineOutcome,'undecided'>){
 if(!s.active||!s.mineCleared||s.outcome!=='undecided')return false;
 s.outcome=outcome;standing(s,outcome==='opened'?'diggers':'guards',20);standing(s,outcome==='opened'?'guards':'diggers',-6);s.stocks.tools=Math.min(10,s.stocks.tools+2);
 logEvent(s,outcome==='opened'?'The old mine reopens under the diggers. Ore yields increase; the guards lose their levy.':'The old mine is sealed by the watch. The north road is safer; the diggers lose their claim.');return true;
}
export function useSupply(s:ColonySave,item:'salve'|'ration'){
 if(s.health>=100||s.inventory[item]===0)return false;s.inventory[item]--;s.health=Math.min(100,s.health+(item==='salve'?50:22));return true;
}
export function rescue(s:ColonySave,ore:number){
 recordStat(s,'rescues');
 const lost=Math.min(6,Math.ceil(ore*.2));if(s.crisis.stage==='assault')s.crisis.stage='signals';s.health=65;s.durability=Math.max(0,s.durability-12);s.watch.active=false;
 logEvent(s,`The camp watch brings you home. ${lost} ore lost; your gear needs attention. Quest items are safe.`);return lost;
}
export interface GatheringSite {id:string;label:string;kind:Resource|'cache'|'watch';x:number;z:number;amount:number;clue?:string}
export const gatheringSites:GatheringSite[]=[
 {id:'timber-north',label:'Fallen pine timber',kind:'wood',x:-48,z:-87,amount:3},
 {id:'timber-west',label:'Dry fallen branches',kind:'wood',x:-91,z:36,amount:3},
 {id:'timber-south',label:'Abandoned sleeper stack',kind:'wood',x:-66,z:88,amount:4},
 {id:'timber-east',label:'Storm-felled timber',kind:'wood',x:72,z:69,amount:3},
 {id:'iron-mine',label:'Loose mine iron',kind:'iron',x:-119,z:88,amount:3},
 {id:'iron-river',label:'Rusted bridge fittings',kind:'iron',x:88,z:-79,amount:2},
 {id:'iron-watch',label:'Broken watch equipment',kind:'iron',x:95,z:88,amount:3},
 {id:'herb-shrine',label:'Bitterleaf patch',kind:'herb',x:-91,z:-104,amount:3},
 {id:'herb-meadow',label:'Riverbank bitterleaf',kind:'herb',x:79,z:-59,amount:3},
 {id:'herb-road',label:'High-road bitterleaf',kind:'herb',x:7,z:145,amount:3},
 {id:'cache-shrine',label:'Pilgrim’s hidden coffer',kind:'cache',x:-98,z:-118,amount:1,clue:'The shrine’s inscription names a north-facing stone. Beneath it: a pilgrim’s salves and a note about the mine’s overseer.'},
 {id:'cache-road',label:'Smuggler’s road cache',kind:'cache',x:-9,z:164,amount:1,clue:'Fisk’s waybill reveals the old mine was closed to conceal a private ore levy, not because its seam was exhausted.'},
 {id:'cache-river',label:'Ferryman’s sealed chest',kind:'cache',x:91,z:-92,amount:1,clue:'The ferryman’s ledger records ore leaving the valley without the diggers being paid. Diego should see this.'},
 {id:'watch-board',label:'The ruined watch beacon',kind:'watch',x:101,z:82,amount:1}
];
export function siteAvailable(s:ColonySave,site:GatheringSite){if(site.kind==='watch')return true;if(site.kind==='cache')return !s.caches.includes(site.id);return s.gathered[site.id]===undefined||dayOf(s)-s.gathered[site.id]>=2}
export function gather(s:ColonySave,id:string){
 const site=gatheringSites.find(v=>v.id===id);if(!site||!siteAvailable(s,site)||site.kind==='watch')return {ok:false,ore:0,text:'This site needs two shifts to recover.'};
 if(site.kind==='cache'){s.caches.push(id);addResource(s,'salve',1);addResource(s,'iron',2);standing(s,'diggers',2);logEvent(s,site.clue!);return {ok:true,ore:4,text:site.clue!}}
 s.gathered[id]=dayOf(s);const n=site.amount+(s.outcome==='opened'&&site.kind==='iron'?2:0);addResource(s,site.kind,n);recordStat(s,'gathered',n);return {ok:true,ore:0,text:`+${n} ${resourceNames[site.kind]}. This site recovers after two shifts.`};
}
export function currentObjective(s:ColonySave,stage:number,hasWeapon:boolean){
 if(stage<3)return null;
 if(!hasWeapon)return {text:'Earn a blade from Huno before taking on the mine crisis.',x:22,z:-23,label:'Huno · earn a blade'};
 if(!s.active)return {text:'Ask Diego about the old mine supply crisis.',x:-13,z:-28,label:'Diego · camp affairs'};
 if(s.watch.active)return {text:`Night watch: survive wave ${s.watch.wave+1} of 3. Retreat to the camp if needed.`,x:101,z:82,label:'Ruined watch · defend the beacon'};
 const crisis=crisisObjective(s);if(crisis)return crisis;
 if(s.outcome!=='undecided')return {text:s.watch.active?`Night watch: survive wave ${s.watch.wave+1} of 3. Retreat to the camp if needed.`:'The camp has changed. Take new supply contracts, upgrade your weapon, or light the ruined watch beacon.',x:101,z:82,label:'Ruined watch · repeatable challenge'};
 if(!s.aid.food)return {text:'Stock Snaf’s pot: bring 2 rations. Cook or trade for them.',x:-17,z:-29,label:'Snaf · supply the pot'};
 if(!s.aid.tools)return {text:'Help Huno replace the tools: 2 timber + 2 iron scrap.',x:22,z:-23,label:'Huno · replacement tools'};
 if(!s.aid.watch)return {text:'Supply Thorus’s watch (1 timber + 1 iron), or clear the north-road patrol.',x:-2.7,z:-10,label:'Thorus · arm the watch'};
 if(!s.mineCleared)return {text:'Break the overseer’s hold on the old mine. Bring healing supplies.',x:-128,z:96,label:'Old mine · armed crew'};
 if(s.outcome==='undecided')return {text:'Return to Diego. Reopen the mine for the diggers, or seal it for the watch.',x:-13,z:-28,label:'Diego · decide the mine’s future'};
 return {text:s.watch.active?`Night watch: survive wave ${s.watch.wave+1} of 3. Retreat to the camp if needed.`:'The camp has changed. Take new supply contracts, upgrade your weapon, or light the ruined watch beacon.',x:101,z:82,label:'Ruined watch · repeatable challenge'};
}
export function rumor(s:ColonySave,name:string){
 const news=crisisRumor(s,name);if(news)return news;
 if(name==='Huno')return s.outcome==='opened'?'The diggers are bringing real iron back. Mine piles now yield extra scrap.':'The mine’s overseer fights behind a guard. An axe can break it; a spear can keep you out of his reach.';
 if(name==='Fisk')return 'An old waybill lies in a cache beyond the high road. I can sell supplies, but the market only restocks each shift. Shadows’ standing brings better prices.';
 if(name==='Snaf')return s.stocks.food===0?'The pot is empty. A pair of rations feeds the next shift.':'Bitterleaf and dry timber make a trail ration. Two bitterleaf make a salve. Ask me to cook them at the pot.';
 if(name==='Thorus')return s.outcome==='sealed'?'The old mine is shut. We have pulled one patrol off the north road. The watchtower still needs a defender.':'A road crew has been taking ore north of the camp. Strike their flank, or catch a blow with a fresh guard. Do not fight all three at once.';
 if(name==='Grim')return 'The old shrine hides a pilgrim’s coffer. The high road and river have caches too. The notes inside tell you why the mine really closed.';
 return s.outcome==='undecided'?'Tools, food and a watch. Give the camp those three things, then face the mine crew. After that, you decide who gets the seam.':'People have noticed what you did. The mine has a new future; keeping this camp supplied is still a daily job.';
}

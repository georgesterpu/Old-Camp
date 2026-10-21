import {Scene,Mesh,MeshBuilder,TransformNode,StandardMaterial,DynamicTexture,Texture,Color3,Vector3,type DirectionalLight,type HemisphericLight} from '@babylonjs/core';
import {createCharacterFactory} from './characters';
import {createCampLedger} from './camp-ledger';
import {freshColony,normalizeColony,resourceNames,weaponProfiles,gatheringSites,siteAvailable,gather,currentObjective,dayOf,hourOf,timeLabel,advanceColony,DAY_SECONDS,contribute,craft,canPay,pay,addResource,price,useSupply,resolveMine,rescue,logEvent,rumor,type ColonySave,type Resource,type WeaponClass} from './colony';
import {ValleyCombat,enemyDefinitions,enemyProfiles,type Enemy,type CombatEvent} from './valley-combat';
import {signalSites,signalCover,lastLight,beginCrisis,repairSignal,patchBeacon,settleCharter,crisisRumor} from './escalation';
import {recordStat,finishCampaign,postgameWatchComplete} from './campaign';
import {campaignGuide} from './campaign-guide';
import {terrainHeight,walkHeight} from './terrain';
import type {Person} from './world';
import type {SurfaceSet} from './surfaces';
import type {SwordHandling} from './sword';
interface Context {
 scene:Scene;surfaces:SurfaceSet;hero:Person;people:Person[];sun:DirectionalLight;hemi:HemisphericLight;software:boolean;initial:unknown;
 progress:()=>{stage:number;weapon:boolean;ore:number;smith?:number};looseOre:()=>{x:number;z:number}[];ore:(amount:number)=>void;changed:()=>void;persist:()=>void;result:(review?:boolean)=>void;
 notify:(title:string,text?:string)=>void;open:()=>void;close:()=>void;rescue:()=>void;impact:(hurt:boolean)=>void;
 audio:(kind:'hit'|'block'|'swing')=>void;blocked:(x:number,z:number)=>boolean;viewWeapon:TransformNode;
}
export interface ValleyFocus {label:string;detail:string;activate:()=>void}
const html=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const styled=new WeakMap<TransformNode,{kind:WeaponClass;axe:Mesh[];spear:Mesh[]}>();
function styleWeapon(node:TransformNode,kind:WeaponClass,scene:Scene){
 let style=styled.get(node);if(style?.kind===kind)return;
 const children=node.getChildMeshes(),blade=children.find(m=>m.name.includes('tempered blade')),guard=children.find(m=>m.name.includes('crossguard')),grip=children.find(m=>m.name.includes('sword grip'));
 if(!style){
  const part=(name:string,shape:'box'|'shaft'|'point',x:number,y:number)=>{const m=shape==='box'?MeshBuilder.CreateBox(name,{width:.28,height:.23,depth:.04},scene):MeshBuilder.CreateCylinder(name,{height:shape==='point'?.28:shape==='shaft'?1.55:.6,diameter:shape==='point'?.095:.035,diameterTop:shape==='point'?0:undefined,tessellation:8},scene);m.parent=node;m.position.set(x,y,0);m.material=shape==='shaft'?grip?.material??null:blade?.material??null;m.isPickable=false;return m};
  style={kind,axe:[part('axe iron head','box',.075,-.39),part('axe wooden haft','shaft',0,-.2)],spear:[part('spear ash shaft','shaft',0,-.65),part('spear steel point','point',0,-1.55)]};style.axe[1].scaling.y=.46;styled.set(node,style);
 }
 style.kind=kind;blade?.setEnabled(kind==='sword');guard?.setEnabled(kind==='sword');for(const m of style.axe)m.setEnabled(kind==='axe');for(const m of style.spear)m.setEnabled(kind==='spear');
}
export function createColonyGame(ctx:Context){
 const {scene,hero,people}=ctx;let state=normalizeColony(ctx.initial),combat=new ValleyCombat(state),tracked:string|null=null,lastHud='',lastGossip=-40,worldTime=0,restoreEnergy=false;
 const near=(name:string)=>people.some(p=>p.name===name&&Vector3.Distance(p.root.position,hero.root.position)<4.5);
 const nearestNames=()=>people.filter(p=>Vector3.Distance(p.root.position,hero.root.position)<4.5).map(p=>p.name);
 const mat=(name:string,color:string,key?:'wood'|'leather'|'stone')=>{const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(color);m.specularColor=Color3.Black();if(key)m.diffuseTexture=ctx.surfaces[key].color;return m};
 const wood=mat('colony supplies timber','#8b7859','wood'),metal=mat('colony salvaged iron','#7e8988'),herbMat=mat('bitterleaf green','#7b9148'),gold=mat('sealed cache brass','#a4915c'),coal=mat('beacon charcoal','#403a2e');
 function safePoint(x:number,z:number){if(!ctx.blocked(x,z))return {x,z};for(let r=1;r<9;r++)for(let i=0;i<16;i++){const nx=x+Math.sin(i/16*Math.PI*2)*r,nz=z+Math.cos(i/16*Math.PI*2)*r;if(!ctx.blocked(nx,nz))return {x:nx,z:nz}}return {x,z}}
 const sites=gatheringSites.map(site=>{
  const spot=safePoint(site.x,site.z),root=new TransformNode(site.label,scene);root.position.set(spot.x,terrainHeight(spot.x,spot.z),spot.z);
  const box=(name:string,w:number,h:number,d:number,x:number,y:number,z:number,material:StandardMaterial)=>{const m=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.parent=root;m.position.set(x,y,z);m.material=material;m.isPickable=false;m.receiveShadows=true;return m};
  if(site.kind==='wood')for(let i=0;i<3;i++){const log=MeshBuilder.CreateCylinder('gatherable pine log',{height:1.5,diameter:.18,tessellation:9},scene);log.parent=root;log.rotation.z=Math.PI/2;log.rotation.y=i*.23;log.position.set(0,.14+i*.12,i*.12);log.material=wood;log.isPickable=false}
  else if(site.kind==='iron')for(let i=0;i<4;i++){const iron=box('recoverable iron scrap',.24,.14,.37,(i%2)*.27,.1+Math.floor(i/2)*.13,0,metal);iron.rotation.y=i*.8}
  else if(site.kind==='herb')for(let i=0;i<7;i++){const sprig=MeshBuilder.CreateSphere('bitterleaf leaves',{diameter:.2,segments:6},scene);sprig.scaling.set(.4,1.5,1);sprig.parent=root;sprig.position.set(Math.sin(i*2)*.2,.2,Math.cos(i*2)*.2);sprig.material=herbMat;sprig.isPickable=false}
  else if(site.kind==='cache'){box('buried coffer',.65,.3,.4,0,.15,0,wood);for(const x of [-.23,.23])box('cache brass binding',.035,.33,.44,x,.16,0,gold)}
  else{box('watch beacon brazier',.9,.25,.9,0,.9,0,metal);for(const x of [-.3,.3])box('beacon legs',.08,.9,.08,x,.45,0,metal);box('beacon fuel',.65,.18,.6,0,1.1,0,coal)}
  return {...site,...spot,root};
 });
 const makeCharacter=createCharacterFactory(scene,ctx.surfaces);
 const signalFire=mat('signal flame amber','#ffc773');signalFire.emissiveColor=Color3.FromHexString('#ff9d38');
 const signals=signalSites.map(site=>{
  const spot=safePoint(site.x,site.z),root=new TransformNode(site.label,scene);root.position.set(spot.x,terrainHeight(spot.x,spot.z),spot.z);
  const pole=MeshBuilder.CreateCylinder(site.label+' timber mast',{height:2.8,diameter:.22,tessellation:8},scene);pole.parent=root;pole.position.y=1.4;pole.material=wood;pole.isPickable=false;
  const basket=MeshBuilder.CreateBox('signal iron basket',{width:.8,height:.35,depth:.8},scene);basket.parent=root;basket.position.y=2.7;basket.material=metal;basket.isPickable=false;
  const flame=MeshBuilder.CreateSphere('restored signal flame',{diameter:.65,segments:8},scene);flame.parent=root;flame.position.y=3.15;flame.scaling.y=1.7;flame.material=signalFire;flame.isPickable=false;
  return {...site,...spot,root,flame};
 });
 const hazardMaterial=mat('fire pot landing warning','#ff672f');hazardMaterial.emissiveColor=new Color3(1,.19,.025);
 const cover=signalCover.map(p=>{const root=new TransformNode('signal-road timber cover',scene);root.position.set(p.x,terrainHeight(p.x,p.z),p.z);for(let i=0;i<3;i++){const beam=MeshBuilder.CreateBox('stacked signal-road sleeper',{width:p.w,height:.28,depth:p.d},scene);beam.parent=root;beam.position.y=.16+i*.28;beam.material=wood;beam.isPickable=false}return root});
 const hazardRings=Array.from({length:8},(_,i)=>{const ring=MeshBuilder.CreateTorus('fire pot impact area '+i,{diameter:3.6,thickness:.09,tessellation:32},scene);ring.material=hazardMaterial;ring.isPickable=false;ring.setEnabled(false);return ring});
 const actorData=combat.enemies.map((e,i)=>{
  const actor=makeCharacter(e.name,'Valley crew',e.x,e.z,true);
  actor.setAppearance({...actor.appearance,skin:i%2?'olive':'umber',hairStyle:e.type==='brute'?'shaved':e.type==='overseer'?'swept':'cropped',hairColor:e.type==='overseer'?'grey':'brown',facialHair:e.type==='brute'?'beard':'stubble',outfit:e.type==='sentinel'||e.type==='overseer'?'guard':'jerkin',clothColor:e.type==='firebrand'?'rust':e.type==='skirmisher'?'blue':e.group==='mine'?'plum':'charcoal',mark:'scar',build:e.type==='brute'?'stocky':'average'});
  actor.setWeapon?.(true);styleWeapon(actor.weapon!,e.type==='brute'?'axe':e.type==='raider'||e.type==='skirmisher'?'spear':'sword',scene);actor.root.setEnabled(false);actor.weapon?.setEnabled(false);
  if(e.type==='firebrand'){const pot=MeshBuilder.CreateSphere('levy fire pot',{diameter:.25,segments:8},scene);pot.parent=actor.arms[1];pot.position.set(0,-.52,0);pot.material=signalFire;pot.isPickable=false}
  if(ctx.software)for(const m of actor.root.getChildMeshes())if(m.material instanceof StandardMaterial){m.material.bumpTexture=null;m.material.maxSimultaneousLights=2}
  const ring=MeshBuilder.CreateTorus(e.name+' attack warning',{diameter:e.type==='brute'?2.5:1.8,thickness:.055,tessellation:28},scene),warning=mat(e.name+' telegraph','#d4a34e');warning.emissiveColor=new Color3(.3,.15,.02);ring.material=warning;ring.isPickable=false;ring.setEnabled(false);
  return {actor,ring,warning};
 });
 const supplies=new TransformNode('visible camp stores',scene);supplies.position.set(-15,terrainHeight(-15,-32),-32);
 const stores=(['food','tools','watch'] as const).flatMap((kind,col)=>[0,1,2].map(i=>{const m=MeshBuilder.CreateBox(kind+' supply crate',{width:.65,height:.45,depth:.55},scene);m.parent=supplies;m.position.set(col*.85,.23+i*.43,0);m.material=kind==='tools'?metal:wood;m.isPickable=false;return {kind,index:i,mesh:m}}));
 const barricade=new TransformNode('watch-sealed mine entrance',scene);barricade.position.set(-112,terrainHeight(-112,75),75);
 for(const y of [.6,1.3,2]){const beam=MeshBuilder.CreateBox('watch barricade plank',{width:5.4,height:.22,depth:.18},scene);beam.parent=barricade;beam.position.y=y;beam.material=wood;beam.isPickable=false}
 const reopened=makeCharacter('Mine shift foreman','Digger',-111,70);reopened.setAppearance({...reopened.appearance,outfit:'apron',hairStyle:'shaved',facialHair:'beard',clothColor:'ochre'});reopened.root.position.y=terrainHeight(-111,70);reopened.root.setEnabled(false);
 const sister=makeCharacter('Mara','Caravan survivor',-10,-33);sister.setAppearance({...sister.appearance,hairStyle:'swept',hairColor:'auburn',outfit:'tunic',clothColor:'moss'});sister.root.position.y=terrainHeight(-10,-33);sister.root.setEnabled(false);
 const mineSign=MeshBuilder.CreatePlane('mine outcome notice',{width:2.8,height:.65,sideOrientation:Mesh.DOUBLESIDE},scene);mineSign.position.set(-108,terrainHeight(-108,72)+1.6,72);mineSign.rotation.y=Math.PI;mineSign.isPickable=false;
 const signTexture=new DynamicTexture('mine future lettering',{width:512,height:128},scene,false);const signMat=mat('mine future sign','#ffffff');signMat.diffuseTexture=signTexture;mineSign.material=signMat;let shownOutcome='';
 const hud=document.createElement('div');hud.id='colony-hud';hud.innerHTML='<div id="colony-clock"></div><div id="colony-tracker"></div><div id="colony-health"></div><div id="colony-enemy" aria-live="polite"></div>';document.getElementById('hud')!.append(hud);
 const stamp=document.createElement('p');stamp.className='alpha-stamp';stamp.textContent='RELEASE CANDIDATE 1 · A PLACE WORTH KEEPING';document.querySelector('#start-screen .menu')!.prepend(stamp);
 document.querySelector('#map-panel p')!.textContent='◆ You · ◇ Ore · ● People · ■ Discovered supplies · red: known threats · gold ring: tracked destination';
 const flash=document.createElement('div');flash.id='impact-flash';document.body.append(flash);let flashAge=0;
 const ledger=createCampLedger({state:()=>state,ore:()=>ctx.progress().ore,stage:()=>ctx.progress().stage,hasWeapon:()=>ctx.progress().weapon,nearby:nearestNames,guide:()=>campaignGuide(state,ctx.progress()),act:action,close:()=>close()});
 function commit(text:string){ctx.changed();ctx.persist();return text}
 function quickChoices(name:string){
  const s=state,p=ctx.progress(),list:{text:string;what:string;arg?:string}[]=[];
  const add=(text:string,what:string,arg?:string)=>list.push({text,what,arg});
  if(name==='Grim'&&s.outcome!=='undecided'){
   if(s.crisis.stage==='dormant')add('Your sister’s caravan? Tell me what happened. [Chapter III]','crisis');
   if(s.crisis.stage==='return'){add('Keep the road in common hands. [Food caravans · +25 ore]','charter','commons');add('Give the watch the road charter. [Safer patrols · +25 ore]','charter','watch')}
  }
  if(name==='Diego'&&p.stage===3&&p.weapon&&!s.active)add('Let’s prepare the mine expedition. [Chapter II]','begin');
  if(s.active)for(const kind of ['food','tools','watch'] as const){const owner={food:'Snaf',tools:'Huno',watch:'Thorus'}[kind],cost={food:{ration:2},tools:{wood:2,iron:2},watch:{wood:1,iron:1}}[kind];if(name===owner&&s.contracts[kind]!==dayOf(s)&&canPay(s,cost))add(`Deliver ${kind==='food'?'2 rations':kind==='tools'?'2 timber + 2 iron':'1 timber + 1 iron'}. [+3 ore · standing]`,'contribute',kind)}
  if(name==='Snaf'){
   if(s.inventory.herb>=2)add('Brew a salve. [2 bitterleaf]','craft','salve');
   if(s.inventory.herb&&s.inventory.wood)add('Cook a ration. [1 bitterleaf + 1 timber]','craft','ration');
   if(!combat.threatened)add('Rest by the pot until the next shift.','rest');
  }
  if(name==='Huno'&&p.weapon){
   if(s.durability<100)add('Repair my equipment. [3 ore + 1 iron]','repair');
   if(s.upgrade<3)add(`Temper my weapon. [${8+s.upgrade*6} ore + ${2+s.upgrade} iron]`,'upgrade');
  }
  if(name==='Fisk'){add(`Buy a salve. [${price(s,4)} ore]`,'buy','salve');add(`Buy a ration. [${price(s,2)} ore]`,'buy','ration')}
  return list.map(({text,what,arg})=>({text,action:()=>{const result=action(what,arg);ctx.notify(name,result)}}));
 }
 function need(name:string){return near(name)?'':`Visit ${name} in person. Use Field notes to track them.`}
 function action(what:string,arg=''):string{
  const s=state,progress=ctx.progress();let message='';
  if(s.trade.day!==dayOf(s))s.trade={day:dayOf(s)};
  const spend=(ore:number,resources:Partial<Record<Resource,number>>)=>{if(progress.ore<ore||!canPay(s,resources))return false;pay(s,resources);ctx.ore(-ore);return true};
  if(what==='use'){if(arg!=='salve'&&arg!=='ration')return 'Unknown supply.';message=useSupply(s,arg)?'Health restored.':'You need that supply and a wound to treat.'}
  else if(what==='results'){if(!s.campaign.ending)return 'The campaign ends when you choose the road charter with Grim.';ctx.result(true);return 'Campaign ending recalled.'}
  else if(what==='guide'){const guide=campaignGuide(s,progress);return action('track',guide.route)}
  else if(what==='equip'){if(!progress.weapon||!s.weapons.includes(arg as WeaponClass))return 'Earn or forge this weapon first.';s.equipped=arg as WeaponClass;message=`Equipped ${weaponProfiles[s.equipped].label}.`}
  else if(what==='crisis'){if(need('Grim'))return need('Grim');if(!beginCrisis(s))return 'Resolve the mine first. Grim’s signal mission can only begin once.';tracked=null;message='Chapter III · The Last Light. Restore three signals: 1 timber + 1 iron each.'}
  else if(what==='charter'){if(need('Grim'))return need('Grim');if(arg!=='commons'&&arg!=='watch')return 'Choose the commons or the watch.';if(!settleCharter(s,arg))return 'Bring the caravan through first. The road charter can only be awarded once.';ctx.ore(25);finishCampaign(s,ctx.progress().ore);ctx.result();tracked=null;message='A way home · +25 ore. Mara is safe beside Grim’s fire. Your road charter will shape every new shift.'}
  else if(what==='begin'){if(need('Diego'))return need('Diego');if(progress.stage<3||!progress.weapon)return 'Earn castle admission and Huno’s blade first.';if(s.active)return 'The expedition is already underway.';s.active=true;logEvent(s,'Diego asks you to prepare food, tools and a watch. The old mine’s future is now in your hands.');message='A mine worth fighting for · chapter II begun.'}
  else if(what==='buy'){
   if(need('Fisk'))return need('Fisk');const base={ration:2,salve:4,iron:3,wood:2}[arg as 'ration'];if(base===undefined)return 'This supply is not for sale.';const key=`buy-${arg}`,cost=price(s,base);if((s.trade[key]??0)>=4)return 'Sold out until the next shift.';if(!spend(cost,{}))return `Need ${cost} ore.`;addResource(s,arg as Resource,1);s.trade[key]=(s.trade[key]??0)+1;message=`Bought ${resourceNames[arg as Resource]} · −${cost} ore.`;
  }else if(what==='sell'){
   if(need('Fisk'))return need('Fisk');if(!['iron','wood','herb'].includes(arg))return 'That item is not for sale.';const key=`sell-${arg}`;if((s.trade[key]??0)>=8)return 'Fisk has enough of that until next shift.';if(!pay(s,{[arg]:1}))return 'Your pack has none to sell.';s.trade[key]=(s.trade[key]??0)+1;ctx.ore(arg==='iron'?2:1);message='Trade complete.';
  }else if(what==='craft'){if(need('Snaf'))return need('Snaf');if(arg!=='salve'&&arg!=='ration')return 'Unknown recipe.';message=craft(s,arg)?`${resourceNames[arg]} prepared.`:'Missing ingredients. Costs are shown beside the recipe.'}
  else if(what==='repair'||what==='upgrade'||what==='forge'){
   if(need('Huno'))return need('Huno');if(!progress.weapon)return 'Earn Huno’s blade first.';
   if(what==='repair'){if(s.durability>=100)return 'Your gear is already sound.';if(!spend(3,{iron:1}))return 'Repair needs 3 ore and 1 iron.';s.durability=100;message='Your equipment is sound again.'}
   else if(what==='upgrade'){if(s.upgrade>=3)return 'Your weapon is fully tempered.';if(!spend(8+s.upgrade*6,{iron:2+s.upgrade}))return 'Need more ore or iron for this temper.';s.upgrade++;s.durability=100;logEvent(s,`Huno tempers your weapons to level ${s.upgrade}.`);message=`Temper ${s.upgrade}: +${s.upgrade*4} weapon damage.`}
   else{if(arg!=='axe'&&arg!=='spear')return 'Unknown weapon.';if(s.weapons.includes(arg))return 'You already own this weapon.';if(!spend(arg==='axe'?6:5,arg==='axe'?{iron:2,wood:1}:{iron:1,wood:2}))return 'Missing ore or materials for that weapon.';s.weapons.push(arg);s.equipped=arg;message=`${weaponProfiles[arg].label} forged and equipped.`}
  }else if(what==='contribute'){
   if(!s.active)return 'Ask Diego to begin the expedition first.';if(!['food','tools','watch'].includes(arg))return 'Unknown contract.';const kind=arg as 'food'|'tools'|'watch',person={food:'Snaf',tools:'Huno',watch:'Thorus'}[kind];if(need(person))return need(person);if(!contribute(s,kind))return s.contracts[kind]===dayOf(s)?'That contract is complete for this shift.':'Bring the listed materials.';ctx.ore(3);message='Supplies delivered · +3 ore, +4 standing. Expedition preparation credited.';
  }else if(what==='resolve'){
   if(need('Diego'))return need('Diego');if(arg!=='opened'&&arg!=='sealed')return 'Unknown resolution.';if(!resolveMine(s,arg))return 'Drive the overseer out first. Each journey has one mine resolution.';ctx.ore(15);message=arg==='opened'?'The diggers reopen the seam. +15 ore.':'The watch seals the seam. +15 ore.';
  }else if(what==='rest'){
   if(need('Snaf'))return need('Snaf');if(combat.threatened)return 'Lose your pursuers before resting.';advanceColony(s,DAY_SECONDS-(s.clock%DAY_SECONDS));s.health=100;restoreEnergy=true;s.trade={day:dayOf(s)};combat.sync();message='A new shift. Health restored; the camp has used its daily supplies.';
  }else if(what==='track'){
   if(['wood','iron','herb'].includes(arg)){const site=sites.filter(v=>v.kind===arg&&siteAvailable(s,v)).sort((a,b)=>Math.hypot(a.x-hero.root.position.x,a.z-hero.root.position.z)-Math.hypot(b.x-hero.root.position.x,b.z-hero.root.position.z))[0];if(!site)return 'Those patches are exhausted. Rest at Snaf’s fire; sites recover after two shifts.';tracked=site.id;if(!s.discovered.includes(site.id))s.discovered.push(site.id);message=`${site.label} marked on your compass and map.`}else{tracked=arg;message='Route marked on your compass and valley map.'}
  }
  else if(what==='setting'){
   if(!['explorer','reducedMotion','highContrast'].includes(arg))return 'Unknown setting.';const key=arg as keyof ColonySave['settings'];s.settings[key]=!s.settings[key];message='Preference saved.';
  }else return 'No action available.';
  combat.sync();refreshWorld();return commit(message);
 }
 function open(name?:string){ctx.open();ledger.open(name)}
 function close(){ledger.close();ctx.close()}
 function refreshWorld(){
  for(const p of cover)p.setEnabled(state.crisis.stage!=='dormant');
  for(const site of signals){site.root.setEnabled(state.crisis.stage!=='dormant');site.flame.setEnabled(state.crisis.repaired.includes(site.id)&&(site.id!=='signal-road'||state.crisis.stage!=='signals'||state.crisis.attempts===0))}
  sister.root.setEnabled(state.crisis.stage==='return'||state.crisis.stage==='complete');
  for(const site of sites)site.root.setEnabled(siteAvailable(state,site));
  supplies.setEnabled(state.active);for(const v of stores)v.mesh.setEnabled(state.stocks[v.kind]>v.index*3);
  barricade.setEnabled(state.outcome==='sealed');reopened.root.setEnabled(state.outcome==='opened');
  mineSign.setEnabled(state.outcome!=='undecided');if(shownOutcome!==state.outcome){shownOutcome=state.outcome;const c=signTexture.getContext() as unknown as CanvasRenderingContext2D;c.fillStyle='#302b20';c.fillRect(0,0,512,128);c.fillStyle='#d5c294';c.font='30px Georgia';c.textAlign='center';c.fillText(state.outcome==='opened'?'THE DIGGERS’ FREE SEAM':'SEALED BY THE CAMP WATCH',256,75);signTexture.update()}
  document.body.classList.toggle('high-contrast',state.settings.highContrast);
 }
 function target(){
  if(state.crisis.stage==='assault')return {...lastLight,label:`Last light · ${Math.ceil(state.crisis.integrity)}% integrity`};
  if(tracked==='mine')return {x:-128,z:96,label:'Old mine · overseer’s crew'};
  if(tracked==='hammer')return {x:-112,z:79,label:'Old workings · Huno’s hammer'};
  if(tracked==='ore'){const ore=ctx.looseOre().sort((a,b)=>Math.hypot(a.x-hero.root.position.x,a.z-hero.root.position.z)-Math.hypot(b.x-hero.root.position.x,b.z-hero.root.position.z))[0];if(ore)return {...ore,label:'Loose ore nugget'};tracked=null}
  const signal=signals.find(site=>site.id===tracked);if(signal)return {x:signal.x,z:signal.z,label:signal.label};
  if(tracked){const person=people.find(p=>p.name===tracked);if(person)return {x:person.root.position.x,z:person.root.position.z,label:person.name};const site=sites.find(s=>s.id===tracked);if(site)return {x:site.x,z:site.z,label:site.label};if(tracked==='road')return {x:-27,z:-97,label:'The road levy'}}
  const obj=currentObjective(state,ctx.progress().stage,ctx.progress().weapon);if(!obj)return null;
  // Schedule changes never leave a destination marker pointing at an empty home.
  const name=obj.label.split(' · ')[0],person=people.find(p=>p.name===name);return person?{...obj,x:person.root.position.x,z:person.root.position.z}:obj;
 }
 function focus(maxDistance:number):ValleyFocus|null{
  if(sister.root.isEnabled()&&Vector3.Distance(sister.root.position,hero.root.position)<Math.min(2.7,maxDistance))return {label:'Mara · caravan survivor',detail:'Speak with Grim’s sister',activate:()=>ctx.notify('Mara','All I could see was that last light. Grim said you kept it burning. I thought nobody in this valley would come for us.')};
  if(state.crisis.stage!=='dormant'){
   const site=signals.find(p=>Math.hypot(p.x-hero.root.position.x,p.z-hero.root.position.z)<Math.min(2.7,maxDistance));
   if(site&&(!state.crisis.repaired.includes(site.id)||site.id==='signal-road'))return {label:site.label,detail:!state.crisis.repaired.includes(site.id)?'Restore signal · 1 timber + 1 iron':state.crisis.stage==='assault'?'Repair beacon +35% · 1 timber + 1 iron':state.crisis.stage==='signals'?'Call the caravan · defend the last light':'The caravan made it through',activate:()=>{
    if(Math.hypot(site.x-hero.root.position.x,site.z-hero.root.position.z)>3)return;
    let text='The signal line is already restored.';
    if(!state.crisis.repaired.includes(site.id)){text=repairSignal(state,site.id)?`${site.label} restored · ${state.crisis.repaired.length}/3 lights.`:'Need 1 timber + 1 iron. Restore signals before calling the caravan.';if(tracked===site.id)tracked=null}
    else if(site.id==='signal-road'&&state.crisis.stage==='assault')text=patchBeacon(state)?'Beacon reinforced · +35% integrity.':'Need a damaged beacon, 1 timber and 1 iron.';
    else if(site.id==='signal-road'&&state.crisis.stage==='signals')text=combat.startSignal()?'The last light · intercept the levy crew. E here repairs the beacon.':state.watch.active?'Finish or retreat from the ruined watch first.':'Restore all three signals first.';
    combat.sync();refreshWorld();ctx.notify(text);ctx.changed();ctx.persist();
   }};
  }
  let best=sites.filter(site=>site.root.isEnabled()&&Math.hypot(site.x-hero.root.position.x,site.z-hero.root.position.z)<Math.min(2.7,maxDistance)).sort((a,b)=>Math.hypot(a.x-hero.root.position.x,a.z-hero.root.position.z)-Math.hypot(b.x-hero.root.position.x,b.z-hero.root.position.z))[0];
  if(!best)return null;const site=best;
  return {label:site.label,detail:site.kind==='watch'?'Light beacon · three waves · retreat is possible':site.kind==='cache'?'Hidden supplies & evidence':`Gather ${resourceNames[site.kind]} · recovers after two shifts`,activate:()=>{
   if(Math.hypot(site.x-hero.root.position.x,site.z-hero.root.position.z)>3)return;
   if(site.kind==='watch'){if(state.outcome==='undecided'){ctx.notify('The beacon is cold','Decide the old mine’s future with Diego first.');return}if(!combat.startWatch()){ctx.notify('The watch is already underway');return}ctx.notify('Hold the ruined beacon','Three waves. Use reach and fresh guards; retreat if needed.');ctx.changed();ctx.persist();return}
   const result=gather(state,site.id);if(!result.ok){ctx.notify('Nothing left to collect',result.text);return}if(tracked===site.id)tracked=null;ctx.ore(result.ore);ctx.notify(site.label,result.text);refreshWorld();ctx.changed();ctx.persist();
  }};
 }
 function events(list:CombatEvent[]){for(const event of list){
  if(event.kind==='defeat')recordStat(state,'foes');
  if(event.kind==='clear'&&event.text.startsWith('Signal lost')){state.campaign.failure={kind:'signal',oreLost:0};ctx.result()}
  if(event.ore)ctx.ore(event.ore);
  if(event.kind==='hurt'){ctx.audio('hit');ctx.impact(true);flashAge=.28}
  else if(event.kind==='hit'||event.kind==='defeat'){ctx.audio('hit');ctx.impact(false)}
  else if(event.kind==='parry'||event.kind==='block'){ctx.audio('block');if(event.kind==='parry')ctx.impact(false)}
  ctx.notify(event.text,event.kind==='defeat'?'The crew is driven off. Wounds and defeats persist with your save.':'');
 }if(list.length){ctx.changed();ctx.persist()}}
 function update(dt:number,yaw:number,sword:SwordHandling,practice=false){
  recordStat(state,'seconds',Math.min(.5,Math.max(0,dt)));
  if(finishCampaign(state,ctx.progress().ore)){ctx.changed();ctx.persist();ctx.result()}
  if(restoreEnergy){sword.energy=1;sword.draw(false);restoreEnergy=false}
  worldTime+=dt;for(const s of signals){s.flame.scaling.y=1.6+Math.sin(worldTime*8+s.x)*.15;s.flame.rotation.y=worldTime*.7}const oldDay=dayOf(state);advanceColony(state,dt);if(dayOf(state)!==oldDay){state.trade={day:dayOf(state)};refreshWorld();ctx.changed();ctx.persist()}
  sword.weaponClass=practice?'sword':state.equipped;styleWeapon(hero.weapon!,practice?'sword':state.equipped,scene);styleWeapon(ctx.viewWeapon,practice?'sword':state.equipped,scene);
  combat.sync();for(const e of combat.enemies)if(e.enabled&&e.health>0&&ctx.blocked(e.x,e.z)){const p=safePoint(e.x,e.z);e.x=p.x;e.z=p.z}
  if(!practice){const results:CombatEvent[]=[];for(let remaining=Math.min(dt,.5);remaining>0&&state.health>0;){const slice=Math.min(remaining,1/60);remaining-=slice;results.push(...combat.update(slice,{x:hero.root.position.x,z:hero.root.position.z,yaw},sword,ctx.blocked))}events(results)}
  if(state.health<=0){const lost=rescue(state,ctx.progress().ore);state.campaign.failure={kind:'defeat',oreLost:lost};ctx.ore(-lost);ctx.rescue();ctx.result();for(const e of combat.enemies){e.aggro=false;e.mode=e.health>0?'idle':'down';e.timer=1}ctx.notify('The watch brings you home','Quest items are safe. Eat, rest, or use a salve; repair damaged gear at Huno’s forge.');ctx.changed();ctx.persist()}
  const impacts=[...combat.hazards,...combat.enemies.filter(e=>e.enabled&&e.health>0&&e.type==='firebrand'&&e.mode==='windup').map(e=>({x:e.aimX??e.x,z:e.aimZ??e.z,remaining:e.timer}))];
  hazardRings.forEach((ring,i)=>{const h=impacts[i];ring.setEnabled(!!h);if(h){ring.position.set(h.x,terrainHeight(h.x,h.z)+.09,h.z);ring.scaling.setAll(.8+Math.max(0,1-h.remaining)*.2)}});
  refreshWorld();
  for(let i=0;i<combat.enemies.length;i++){
   const e=combat.enemies[i],{actor,ring,warning}=actorData[i],distance=Math.hypot(e.x-hero.root.position.x,e.z-hero.root.position.z),visible=e.enabled&&e.health>0&&distance<75;
   actor.root.setEnabled(visible);actor.weapon?.setEnabled(visible&&e.type!=='firebrand');if(!visible){ring.setEnabled(false);continue}
   actor.root.position.set(e.x,terrainHeight(e.x,e.z),e.z);actor.root.rotation.y=e.heading;
   const stride=e.mode==='approach'?Math.sin(worldTime*9+i)*.45:0;actor.legs[0].rotation.x=stride;actor.legs[1].rotation.x=-stride;actor.arms[1].rotation.x=e.mode==='windup'?-1.4:e.mode==='recover'?.6:e.mode==='stagger'?.8:-.2;actor.pose?.(worldTime);
   ring.setEnabled(distance<20&&(e.mode==='windup'||e.mode==='stagger'));ring.position.set(e.x,terrainHeight(e.x,e.z)+.04,e.z);const color=e.mode==='stagger'?'#b19bd7':state.settings.highContrast?'#fff23b':'#e9a047';warning.diffuseColor=Color3.FromHexString(color);warning.emissiveColor=warning.diffuseColor.scale(.5);ring.scaling.setAll(e.mode==='windup'?.65+.65*(1-e.timer/enemyProfiles[e.type].windup):1);
  }
  if(state.active){
   const hour=hourOf(state),atFire=hour>=18||hour<6;
   for(const p of people){if(practice&&p.name==='Scatty'||['Thorus','Snaf'].includes(p.name))continue;const route=p.name==='Huno'?[[16,-28],[5,-28],[-13,-32]]:p.name==='Fisk'?[[30,-5],[25,-16],[16,-28],[5,-28],[-13,-32]]:p.name==='Scatty'?[[-31,-16],[-24,-26],[-13,-32]]:p.name==='Diego'?[[-12,-32]]:p.name==='Grim'?[[-12,-35],[-13,-32]]:p.role==='Guard'?[[p.home.x+1.6,p.home.z]]:p.role==='Digger'?[[p.home.x-1.2,p.home.z+1.2]]:p.role==='Shadow'?[[p.home.x+1.2,p.home.z-1.2]]:[];
    if(!route.length)continue;const points=atFire?route:route.slice().reverse().concat([[p.home.x,p.home.z]]);let index=(p.root.metadata?.routineIndex as number|undefined)??0;if(p.root.metadata?.atFire!==atFire){index=0;p.root.metadata={atFire,routineIndex:0}}
    const goal=points[Math.min(index,points.length-1)],pos=p.root.position,d=Math.hypot(goal[0]-pos.x,goal[1]-pos.z);if(d>.4){const dx=(goal[0]-pos.x)/d*dt*.95,dz=(goal[1]-pos.z)/d*dt*.95;if(!ctx.blocked(pos.x+dx,pos.z))pos.x+=dx;if(!ctx.blocked(pos.x,pos.z+dz))pos.z+=dz;pos.y=terrainHeight(pos.x,pos.z);p.root.rotation.y=Math.atan2(dx,dz);p.legs[0].rotation.x=Math.sin(worldTime*6)*.3;p.legs[1].rotation.x=-p.legs[0].rotation.x;p.pose?.(worldTime)}else if(index<points.length-1)p.root.metadata!.routineIndex=index+1;
   }
   if(worldTime-lastGossip>45){const p=people.find(p=>['Snaf','Grim','Fisk'].includes(p.name)&&Vector3.Distance(p.root.position,hero.root.position)<5);if(p){ctx.notify(`${p.name}, overheard`,rumor(state,p.name));lastGossip=worldTime}}
  }
  const hour=hourOf(state),daylight=.42+.58*Math.max(0,Math.sin((hour-6)/12*Math.PI));ctx.hemi.intensity=.45+.45*daylight;ctx.sun.intensity=.35+1.3*daylight;scene.fogDensity=.0047+(1-daylight)*.0015;
  flashAge=Math.max(0,flashAge-dt);flash.style.opacity=state.settings.reducedMotion?'0':String(flashAge*.7);
  const t=target(),distance=t?Math.round(Math.hypot(t.x-hero.root.position.x,t.z-hero.root.position.z)):0,bearing=t?Math.atan2(t.x-hero.root.position.x,t.z-hero.root.position.z)-yaw:0;
  const arrow=['↑','↗','→','↘','↓','↙','←','↖'][((Math.round(bearing/(Math.PI/4))%8)+8)%8];
  const enemy=combat.enemies.filter(e=>e.enabled&&e.health>0&&Math.hypot(e.x-hero.root.position.x,e.z-hero.root.position.z)<9).sort((a,b)=>Math.hypot(a.x-hero.root.position.x,a.z-hero.root.position.z)-Math.hypot(b.x-hero.root.position.x,b.z-hero.root.position.z))[0];
  const output=[timeLabel(state),t?`${arrow} ${t.label} · ${distance}m`:'I · pack, supplies & camp affairs',`${Math.ceil(state.health)} / 100 health · ${weaponProfiles[state.equipped].label} · ${Math.round(state.durability)}% gear${state.durability<30?' · WORN: repair at Huno':''} · ${sword.energy<.2?'LOW ENERGY — recover':Math.round(sword.energy*100)+'% energy'}`,enemy?`${enemy.name} · ${Math.ceil(enemy.health)} / ${enemy.maxHealth} · ${enemy.mode==='windup'?(enemy.type==='firebrand'?'FIRE POT — leave the orange circle':`STRIKE IN ${enemy.timer.toFixed(1)}s — guard or dodge`):enemy.mode==='stagger'?'STAGGERED — counter':'watch their reach'}`:''];
  const key=output.join('|');if(key!==lastHud){lastHud=key;['colony-clock','colony-tracker','colony-health','colony-enemy'].forEach((id,i)=>document.getElementById(id)!.textContent=output[i]);const bar=document.getElementById('health-fill');if(bar){bar.style.width=state.health+'%';bar.parentElement!.setAttribute('aria-valuenow',String(Math.round(state.health)))}}
 }
 function decorateJournal(content:HTMLElement){
  const h=document.createElement('h3');h.textContent=state.outcome==='undecided'?'Chapter II · A mine worth fighting for':'Chapter III · The Last Light';const p=document.createElement('p');p.textContent=currentObjective(state,ctx.progress().stage,ctx.progress().weapon)?.text??'Earn admission to the castle, then speak to Diego about the mine. Press I to inspect your pack.';content.append(h,p);
  const guide=campaignGuide(state,ctx.progress());const route=document.createElement('p');route.textContent=guide.requirements?guide.text+' '+guide.requirements:guide.text;content.append(route);if(state.campaign.ending){const button=document.createElement('button');button.className='small';button.textContent='Review campaign ending';button.onclick=()=>ctx.result(true);content.append(button)}
  for(const entry of state.log.slice(-8).reverse()){const note=document.createElement('p');note.textContent=`Shift ${entry.day+1}: ${entry.text}`;content.append(note)}
 }
 refreshWorld();
 return {get state(){return state},get isOpen(){return ledger.isOpen},get combat(){return combat},open,close,action,focus,update,target,decorateJournal,quickChoices,
  guide:()=>campaignGuide(state,ctx.progress()),
  ensureEnding:()=>finishCampaign(state,ctx.progress().ore),
  retrySignal(){const nearBeacon=Math.hypot(hero.root.position.x-lastLight.x,hero.root.position.z-lastLight.z)<3;tracked='signal-road';const started=nearBeacon&&combat.startSignal();refreshWorld();ctx.changed();ctx.persist();ctx.notify(started?'The last light is rekindled':'High-road beacon marked',started?'Intercept the levy crew. Repairs cost one timber and one iron.':'Return to the beacon and press E when ready.');},
  objective:()=>currentObjective(state,ctx.progress().stage,ctx.progress().weapon),
  strike:(sword:SwordHandling,yaw:number)=>events(combat.strike({x:hero.root.position.x,z:hero.root.position.z,yaw},state.equipped,sword.combo,ctx.blocked)),
  reaction:(name:string)=>crisisRumor(state,name)||(!state.active?'':name==='Snaf'&&state.reputation.diggers>3?'You kept the pot going. There is always a place by my fire for you.':name==='Huno'&&state.reputation.shadows>3?'You did right by this camp. Let us put that iron to work.':name==='Thorus'&&state.reputation.guards<0?'The mine was your choice. Do not expect the watch to applaud it.':name==='Grim'&&state.outcome==='sealed'?'You gave our seam to the guards. Some of us will remember that.':''),
  threats:()=>combat.enemies.filter(e=>e.enabled&&e.health>0&&e.aggro).map(e=>new Vector3(e.x,terrainHeight(e.x,e.z),e.z)),
  daylight:()=>.42+.58*Math.max(0,Math.sin((hourOf(state)-6)/12*Math.PI)),
  load(value:unknown){state=normalizeColony(value);if(state.trade.day!==dayOf(state))state.trade={day:dayOf(state)};combat=new ValleyCombat(state);tracked=null;lastHud='';restoreEnergy=false;for(const p of people){p.root.position.copyFrom(p.home);p.root.metadata=null}refreshWorld();if(ledger.isOpen)ledger.refresh()},
  activity:(name:string)=>!state.active?'':name==='Thorus'?'On watch':name==='Snaf'?'Tending the pot':hourOf(state)>=18||hourOf(state)<6?'Off shift · heading to supper':'Working the day shift',
  drawMap(c:CanvasRenderingContext2D,px:(x:number)=>number,pz:(z:number)=>number){c.save();c.font='10px Georgia';if(state.crisis.stage!=='dormant')for(const signal of signals){c.fillStyle=state.crisis.repaired.includes(signal.id)?'#af7b2d':'#625343';c.beginPath();c.arc(px(signal.x),pz(signal.z),4,0,Math.PI*2);c.fill();c.fillText(signal.label,px(signal.x)+6,pz(signal.z)-5)}for(const site of sites)if(state.discovered.includes(site.id)&&siteAvailable(state,site)){c.fillStyle=site.kind==='cache'?'#734883':'#3e6650';c.fillRect(px(site.x)-3,pz(site.z)-3,6,6)}for(const e of combat.enemies)if(e.enabled&&e.health>0&&state.discovered.includes(e.group==='road'?'road':e.group==='mine'?'mine-crew':e.group==='signal'?'signal-road':e.group==='patrol'?'patrol':'watch-board')){c.fillStyle='#9b3025';c.beginPath();c.arc(px(e.x),pz(e.z),3,0,Math.PI*2);c.fill()}const t=target();if(t){c.strokeStyle='#8b6524';c.lineWidth=2;c.beginPath();c.arc(px(t.x),pz(t.z),7,0,Math.PI*2);c.stroke();c.fillStyle='#4a3822';c.fillText(t.label,px(t.x),pz(t.z)-11)}c.restore()},
  discover(){for(const s of sites)if(!state.discovered.includes(s.id)&&Math.hypot(s.x-hero.root.position.x,s.z-hero.root.position.z)<18)state.discovered.push(s.id);for(const e of combat.enemies)if(e.enabled&&Math.hypot(e.x-hero.root.position.x,e.z-hero.root.position.z)<18){const id=e.group==='road'?'road':e.group==='mine'?'mine-crew':e.group==='signal'?'signal-road':e.group==='patrol'?'patrol':'watch-board';if(!state.discovered.includes(id))state.discovered.push(id)}},
  diagnostics:()=>({state:JSON.parse(JSON.stringify(state)),enemies:combat.enemies.map(e=>({...e})),signals:signals.map(s=>({id:s.id,x:s.x,z:s.z,repaired:state.crisis.repaired.includes(s.id)})),hazards:combat.hazards,sites:sites.map(s=>({id:s.id,kind:s.kind,x:s.x,z:s.z,available:siteAvailable(state,s)})),residents:people.map(p=>({name:p.name,x:p.root.position.x,z:p.root.position.z})),target:target(),open:ledger.isOpen})};
}

import {dayOf,prepared,standing,logEvent,weaponProfiles,type ColonySave,type WeaponClass} from './colony';
import type {SwordHandling} from './sword';
import {lastLight} from './escalation';
export type Archetype='raider'|'sentinel'|'brute'|'overseer'|'skirmisher'|'firebrand';
export interface EnemyDefinition {id:string;name:string;type:Archetype;x:number;z:number;group:'road'|'mine'|'watch'|'signal'|'patrol'}
export const enemyDefinitions:EnemyDefinition[]=[
 {id:'road-scout',name:'Road scout',type:'raider',x:-24,z:-96,group:'road'},
 {id:'road-shield',name:'Ore collector',type:'sentinel',x:-28,z:-100,group:'road'},
 {id:'road-brute',name:'Road enforcer',type:'brute',x:-31,z:-94,group:'road'},
 {id:'mine-scout',name:'Mine lookout',type:'raider',x:-122,z:97,group:'mine'},
 {id:'mine-shield',name:'Levy guard',type:'sentinel',x:-129,z:91,group:'mine'},
 {id:'mine-overseer',name:'The ore overseer',type:'overseer',x:-132,z:99,group:'mine'},
 {id:'watch-0',name:'Watch challenger',type:'raider',x:100,z:75,group:'watch'},
 {id:'watch-1',name:'Watch challenger',type:'sentinel',x:107,z:80,group:'watch'},
 {id:'watch-2',name:'Watch challenger',type:'brute',x:94,z:80,group:'watch'},
 {id:'signal-captain',name:'The displaced levy captain',type:'overseer',x:5,z:165,group:'signal'},
 {id:'signal-pike',name:'Levy outrider',type:'skirmisher',x:17,z:161,group:'signal'},
 {id:'signal-fire',name:'Levy firebrand',type:'firebrand',x:0,z:162,group:'signal'},
 {id:'signal-flank',name:'Levy flanker',type:'skirmisher',x:14,z:157,group:'signal'},
 {id:'patrol-pike',name:'Roving levy hunter',type:'skirmisher',x:68,z:-57,group:'patrol'},
 {id:'patrol-fire',name:'Roving firebrand',type:'firebrand',x:72,z:-55,group:'patrol'}
];
export const enemyProfiles={raider:{health:42,damage:10,speed:2.55,windup:.62,range:2.15,recovery:1.05},sentinel:{health:64,damage:12,speed:1.75,windup:.85,range:2.4,recovery:1.4},brute:{health:84,damage:20,speed:1.55,windup:1.15,range:2.7,recovery:1.65},overseer:{health:155,damage:22,speed:2.05,windup:.95,range:2.8,recovery:1.2},skirmisher:{health:58,damage:13,speed:3.1,windup:.48,range:3.6,recovery:1.45},firebrand:{health:48,damage:16,speed:1.9,windup:1.3,range:9,recovery:2.5}} as const;
export interface Enemy extends EnemyDefinition {health:number;maxHealth:number;heading:number;mode:'idle'|'approach'|'windup'|'recover'|'stagger'|'down';timer:number;enabled:boolean;aggro:boolean;phase:number;aimX?:number;aimZ?:number;targetBeacon?:boolean}
export interface FireHazard {x:number;z:number;remaining:number;beacon:boolean}
/** Sample the whole segment: low cover and narrow walls must stop a throw too. */
function obstructed(x:number,z:number,tx:number,tz:number,blocked:(x:number,z:number)=>boolean){const steps=Math.ceil(Math.hypot(tx-x,tz-z)/.4);for(let i=1;i<steps;i++)if(blocked(x+(tx-x)*i/steps,z+(tz-z)*i/steps))return true;return false}
export interface CombatEvent {kind:'hit'|'hurt'|'block'|'parry'|'dodge'|'defeat'|'clear'|'wave'|'win';text:string;ore?:number;amount?:number}
export class ValleyCombat {
 enemies:Enemy[]=[];hazards:FireHazard[]=[];dodgeRemaining=0;dodgeHeading=0;private clock=0;private nextWave=0;
 constructor(public state:ColonySave){this.reset()}
 private home(e:Enemy){if(e.group==='patrol'){const east=this.state.crisis.patrolShift%2===0;return {x:(east?68:-82)+(e.type==='firebrand'?4:0),z:east?-57:-110}}return enemyDefinitions[e.phase]}
 startSignal(){
  const s=this.state;if(s.crisis.stage!=='signals'||s.crisis.repaired.length!==3||s.watch.active)return false;
  s.crisis.stage='assault';s.crisis.attempts++;s.crisis.integrity=100;this.hazards=[];
  if(s.outcome==='opened'&&s.crisis.attempts===1)s.inventory.wood=Math.min(999,s.inventory.wood+2);
  for(const e of this.enemies.filter(e=>e.group==='signal')){delete s.enemies[e.id];Object.assign(e,this.home(e));e.aggro=true;e.mode='approach';e.timer=2}
  this.sync();logEvent(s,s.outcome==='sealed'?'The watch reinforces the last light. One fewer levy flanker can reach the palisade.':s.crisis.attempts===1?'The diggers send two spare timbers. The levy captain is coming: defend the last light.':'The last light is rekindled. Intercept the levy crew before they cut the signal.');return true;
 }
 reset(){this.enemies=enemyDefinitions.map((d,i)=>({...d,health:1,maxHealth:1,heading:Math.PI,mode:'idle',timer:.5+i*.17,enabled:false,aggro:false,phase:i}));this.hazards=[];this.dodgeRemaining=0;this.nextWave=0;this.sync();for(const e of this.enemies.filter(e=>e.group==='patrol'))Object.assign(e,this.home(e))}
 sync(){
  const s=this.state,day=dayOf(s);
  if(s.crisis.stage!=='dormant'){
   const shift=day*2+(s.clock%900>=375?1:0);
   if(shift!==s.crisis.patrolShift){s.crisis.patrolShift=shift;s.crisis.patrolClaimed=false;for(const e of this.enemies.filter(e=>e.group==='patrol')){delete s.enemies[e.id];Object.assign(e,this.home(e));e.mode='idle';e.aggro=false;e.timer=1}logEvent(s,`Levy hunters were seen ${shift%2===0?'near the river bitterleaf':'at the old shrine'}. Break their patrol and recover the stolen supplies.`)}
  }
  for(const e of this.enemies){const profile=enemyProfiles[e.type];e.maxHealth=profile.health+(e.group==='watch'?(s.watch.wave*12+Math.min(5,s.watch.wins)*8):0);
   e.enabled=s.active&&(e.group==='road'?!(s.outcome==='sealed'&&e.type==='brute'):e.group==='mine'?prepared(s)&&!s.mineCleared:e.group==='signal'?s.crisis.stage==='assault'&&!(s.outcome==='sealed'&&e.id==='signal-flank'):e.group==='patrol'?s.crisis.stage!=='dormant'&&!(s.crisis.charter==='watch'&&e.type==='firebrand'):s.watch.active);
   const record=s.enemies[e.id];e.health=record&&!(e.group==='road'&&record.health===0&&day-record.day>=2)?Math.min(e.maxHealth,record.health):e.maxHealth;
   if(e.health===0)e.mode='down';else if(e.mode==='down')e.mode='idle';
  }
 }
 dodge(sword:SwordHandling,heading:number){if(!sword.drawn||sword.energy<.22||this.dodgeRemaining>0)return false;sword.energy-=.22;sword.draw(true);this.dodgeHeading=heading;this.dodgeRemaining=.32;return true}
 get dodging(){return this.dodgeRemaining>0}
 get invulnerable(){return this.dodgeRemaining>.06&&this.dodgeRemaining<.29}
 get threatened(){return this.enemies.some(e=>e.enabled&&e.health>0&&e.aggro)}
 private remember(e:Enemy){this.state.enemies[e.id]={health:Math.max(0,e.health),day:dayOf(this.state)}}
 strike(player:{x:number;z:number;yaw:number},weapon:WeaponClass,combo:number,blocked=(_x:number,_z:number)=>false):CombatEvent[]{
  const p=weaponProfiles[weapon],s=this.state;
  const candidates=this.enemies.filter(e=>e.enabled&&e.health>0&&Math.hypot(e.x-player.x,e.z-player.z)<p.range&&Math.cos(Math.atan2(e.x-player.x,e.z-player.z)-player.yaw)>.42&&!obstructed(player.x,player.z,e.x,e.z,blocked));
  candidates.sort((a,b)=>Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z));const e=candidates[0];if(!e)return [];
  const front=Math.cos(Math.atan2(player.x-e.x,player.z-e.z)-e.heading)>.3;
  const guarded=(e.type==='sentinel'||e.type==='overseer')&&front&&e.mode!=='stagger'&&e.mode!=='recover'&&e.mode!=='windup';
  const breaksGuard=weapon==='axe'||combo===2;
  let damage=Math.round((p.damage+s.upgrade*4)*(1+combo*.15)*(.55+.45*s.durability/100));if(guarded&&!breaksGuard)damage=Math.ceil(damage*.25);
  s.durability=Math.max(0,s.durability-.7);e.health=Math.max(0,e.health-damage);e.aggro=true;
  if(e.health===0){e.mode='down';this.remember(e);return [{kind:'defeat',text:`${e.name} is driven off. +${e.group==='mine'?4:2} ore.`,ore:e.group==='mine'?4:2}]}
  if(!guarded||breaksGuard){e.mode='stagger';e.timer=breaksGuard?.7:.3}
  this.remember(e);return [{kind:guarded&&!breaksGuard?'block':'hit',text:guarded&&!breaksGuard?'Guarded. Flank, finish a combo, or use an axe.':`${breaksGuard&&guarded?'Guard broken · ':''}${damage} damage${combo===2?' · combo finisher':''}`,amount:damage}];
 }
 update(dt:number,player:{x:number;z:number;yaw:number},sword:SwordHandling,blocked:(x:number,z:number)=>boolean):CombatEvent[]{
  const events:CombatEvent[]=[];this.clock+=dt;this.dodgeRemaining=Math.max(0,this.dodgeRemaining-dt);const s=this.state;
  for(const h of this.hazards){h.remaining-=dt;if(h.remaining>0)continue;
   if(h.beacon&&s.crisis.stage==='assault'){s.crisis.integrity=Math.max(0,s.crisis.integrity-12);events.push({kind:'wave',text:'Fire hits the signal · −12 beacon integrity.'})}
   if(Math.hypot(player.x-h.x,player.z-h.z)<1.8&&!this.invulnerable){const damage=s.settings.explorer?8:16;s.health=Math.max(0,s.health-damage);events.push({kind:'hurt',text:'Fire pot · move out of the marked ground!',amount:damage})}
  }this.hazards=this.hazards.filter(h=>h.remaining>0);
  let attackers=this.enemies.filter(e=>e.enabled&&e.health>0&&e.mode==='windup').length;
  for(const e of this.enemies){
   if(!e.enabled||e.health<=0)continue;const p=enemyProfiles[e.type],def=this.home(e),siege=e.group==='signal'&&s.crisis.stage==='assault',toPlayer=Math.hypot(player.x-e.x,player.z-e.z),beacon=siege&&toPlayer>6;
   const target=beacon?lastLight:player,dx=target.x-e.x,dz=target.z-e.z,d=Math.hypot(dx,dz),home=Math.hypot(e.x-def.x,e.z-def.z);
   const fellow=this.enemies.some(f=>f!==e&&f.enabled&&f.group===e.group&&f.aggro&&Math.hypot(f.x-e.x,f.z-e.z)<16);
   if(d<11||fellow||siege)e.aggro=true;
   if(!siege&&(d>27||home>28||Math.hypot(player.x/62,player.z/69)<1))e.aggro=false;
   e.timer=Math.max(0,e.timer-dt);
   if(e.mode==='stagger'||e.mode==='recover'){if(e.timer===0)e.mode='approach';continue}
   if(e.mode==='windup'){
    if(e.timer>0)continue;
    e.mode='recover';e.timer=p.recovery;attackers--;
    if(e.type==='firebrand'){if(e.aggro&&!obstructed(e.x,e.z,e.aimX??target.x,e.aimZ??target.z,blocked))this.hazards.push({x:e.aimX??target.x,z:e.aimZ??target.z,remaining:.85,beacon:e.targetBeacon===true});continue}
    const ax=(e.targetBeacon?lastLight.x:player.x)-e.x,az=(e.targetBeacon?lastLight.z:player.z)-e.z,reach=Math.hypot(ax,az);
    const facingEnemy=Math.cos(Math.atan2(ax,az)-e.heading)>.45;
    if(!e.aggro||reach>p.range+.3||!facingEnemy||obstructed(e.x,e.z,e.x+ax,e.z+az,blocked))continue;
    if(e.targetBeacon){s.crisis.integrity=Math.max(0,s.crisis.integrity-p.damage*.6);events.push({kind:'wave',text:`${e.name} strikes the beacon. Intercept them!`});continue}
    if(this.invulnerable){events.push({kind:'dodge',text:'Clean evade.'});continue}
    const facing=Math.cos(Math.atan2(-dx,-dz)-player.yaw);
    if(sword.parry(facing)){e.mode='stagger';e.timer=1.3;sword.energy=Math.min(1,sword.energy+.12);events.push({kind:'parry',text:'Perfect guard · counter now.'});continue}
    if(sword.block(facing)){events.push({kind:'block',text:'Blow guarded.'});continue}
    const broken=sword.guarding&&sword.energy<.2,damage=Math.round(p.damage*(s.settings.explorer?.5:1)*(broken?1.25:1));if(broken){sword.energy=0;sword.draw(true)}s.durability=Math.max(0,s.durability-.8);s.health=Math.max(0,s.health-damage);events.push({kind:'hurt',text:broken?`Guard broken · ${damage} damage. Recover your energy.`:`${e.name} · ${damage} damage.`,amount:damage});if(s.health===0)return events;continue;
   }
   let tx=def.x+Math.sin(this.clock*.18+e.phase)*2,tz=def.z+Math.cos(this.clock*.18+e.phase)*2,speed=.65;
   if(e.aggro){
    e.heading=Math.atan2(dx,dz);e.mode='approach';speed=p.speed;
    if(d<p.range+.05&&attackers<2&&e.timer===0){e.mode='windup';e.targetBeacon=beacon;e.aimX=target.x;e.aimZ=target.z;e.timer=p.windup*(e.type==='overseer'&&e.health<e.maxHealth*.5?.75:1);attackers++;continue}
    const flank=(e.phase%2?1:-1)*(attackers>0?1.7:.6);tx=target.x+Math.cos(e.heading)*flank;tz=target.z-Math.sin(e.heading)*flank;
    if(d<p.range*.8){tx=e.x-dx/Math.max(d,.01);tz=e.z-dz/Math.max(d,.01);speed=1}
    if(e.type==='skirmisher'&&sword.active&&d<3){tx=e.x-dx/Math.max(d,.01)*3;tz=e.z-dz/Math.max(d,.01)*3;speed=p.speed*1.3}
   }else e.mode='idle';
   const distance=Math.hypot(tx-e.x,tz-e.z);if(distance>.2){const mx=(tx-e.x)/distance*speed*dt,mz=(tz-e.z)/distance*speed*dt;if(!blocked(e.x+mx,e.z))e.x+=mx;if(!blocked(e.x,e.z+mz))e.z+=mz;if(!e.aggro)e.heading=Math.atan2(mx,mz)}
  }
  if(s.crisis.stage==='assault'){
   if(s.crisis.integrity<=0||Math.hypot(player.x-lastLight.x,player.z-lastLight.z)>48){s.crisis.stage='signals';this.hazards=[];logEvent(s,'The last light went dark. The caravan waits in shelter. Return to the high-road beacon to try again; the restored signal line is safe.');events.push({kind:'clear',text:'Signal lost · relight the high-road beacon to retry.'})}
   else if(this.enemies.filter(e=>e.group==='signal'&&e.enabled).every(e=>e.health<=0)){s.crisis.stage='return';this.hazards=[];logEvent(s,'The levy captain retreats. The caravan answers the last light. Grim is waiting at the campfire.');events.push({kind:'clear',text:'The caravan is through · return to Grim.'})}
  }
  const patrol=this.enemies.filter(e=>e.group==='patrol'&&e.enabled);
  if(patrol.length&&!s.crisis.patrolClaimed&&patrol.every(e=>e.health<=0)){s.crisis.patrolClaimed=true;s.stocks.food=Math.min(10,s.stocks.food+2);s.inventory.ration=Math.min(999,s.inventory.ration+2);standing(s,'diggers',3);logEvent(s,'Recovered stolen caravan provisions: two trail rations and food for the camp.');events.push({kind:'clear',text:'Levy patrol broken · +2 rations, +2 camp food.'})}
  const road=this.enemies.filter(e=>e.group==='road'&&e.enabled);
  if(s.active&&!s.aid.watch&&road.every(e=>e.health===0)){s.aid.watch=true;s.stocks.watch=Math.min(10,s.stocks.watch+3);standing(s,'guards',6);logEvent(s,'The road levy is broken. Thorus commits the freed watch to the mine expedition.');events.push({kind:'clear',text:'Road levy broken · watch prepared.'})}
  if(s.active&&prepared(s)&&!s.mineCleared&&this.enemies.filter(e=>e.group==='mine').every(e=>e.health===0)){s.mineCleared=true;standing(s,'shadows',8);logEvent(s,'The overseer has been driven from the mine. Diego is waiting for your decision.');events.push({kind:'clear',text:'The mine is yours to change. Return to Diego.'})}
  if(s.watch.active&&this.enemies.filter(e=>e.group==='watch').every(e=>e.health===0)){
   if(this.nextWave===0){this.nextWave=3;events.push({kind:'wave',text:s.watch.wave<2?'Wave cleared · catch your breath.':'The beacon holds.'})}
   this.nextWave-=dt;if(this.nextWave<=0){this.nextWave=0;if(s.watch.wave===2){s.watch.active=false;s.watch.wins++;standing(s,'guards',5);const reward=12+Math.min(5,s.watch.wins)*3;logEvent(s,`The ruined watch holds for the ${s.watch.wins} time. ${reward} ore earned.`);events.push({kind:'win',text:`Watch defended · +${reward} ore.`,ore:reward})}else{s.watch.wave++;for(const e of this.enemies.filter(e=>e.group==='watch')){delete s.enemies[e.id];e.x=enemyDefinitions[e.phase].x;e.z=enemyDefinitions[e.phase].z;e.aggro=true;e.mode='approach';e.timer=1}this.sync();events.push({kind:'wave',text:`Wave ${s.watch.wave+1} of 3 · hold the beacon.`})}}
  }
  if(s.watch.active&&Math.hypot(player.x-100,player.z-99)>42){s.watch.active=false;this.nextWave=0;logEvent(s,'You withdrew from the ruined watch. The beacon can be attempted again.');events.push({kind:'clear',text:'Watch abandoned · retreat recorded.'})}
  return events;
 }
 startWatch(){const s=this.state;if(s.outcome==='undecided'||s.watch.active||s.crisis.stage==='assault')return false;s.watch.active=true;s.watch.wave=0;for(const e of this.enemies.filter(e=>e.group==='watch')){delete s.enemies[e.id];e.x=enemyDefinitions[e.phase].x;e.z=enemyDefinitions[e.phase].z;e.aggro=true;e.mode='approach';e.timer=1.5}this.sync();logEvent(s,'The ruined beacon is lit. Three waves will test the new watch.');return true}
}

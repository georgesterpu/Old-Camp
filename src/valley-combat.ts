import {dayOf,prepared,standing,logEvent,weaponProfiles,type ColonySave,type WeaponClass} from './colony';
import type {SwordHandling} from './sword';
export type Archetype='raider'|'sentinel'|'brute'|'overseer';
export interface EnemyDefinition {id:string;name:string;type:Archetype;x:number;z:number;group:'road'|'mine'|'watch'}
export const enemyDefinitions:EnemyDefinition[]=[
 {id:'road-scout',name:'Road scout',type:'raider',x:-24,z:-96,group:'road'},
 {id:'road-shield',name:'Ore collector',type:'sentinel',x:-28,z:-100,group:'road'},
 {id:'road-brute',name:'Road enforcer',type:'brute',x:-31,z:-94,group:'road'},
 {id:'mine-scout',name:'Mine lookout',type:'raider',x:-122,z:97,group:'mine'},
 {id:'mine-shield',name:'Levy guard',type:'sentinel',x:-129,z:91,group:'mine'},
 {id:'mine-overseer',name:'The ore overseer',type:'overseer',x:-132,z:99,group:'mine'},
 {id:'watch-0',name:'Watch challenger',type:'raider',x:100,z:75,group:'watch'},
 {id:'watch-1',name:'Watch challenger',type:'sentinel',x:107,z:80,group:'watch'},
 {id:'watch-2',name:'Watch challenger',type:'brute',x:94,z:80,group:'watch'}
];
export const enemyProfiles={raider:{health:42,damage:10,speed:2.55,windup:.62,range:2.15,recovery:1.05},sentinel:{health:64,damage:12,speed:1.75,windup:.85,range:2.4,recovery:1.4},brute:{health:84,damage:20,speed:1.55,windup:1.15,range:2.7,recovery:1.65},overseer:{health:155,damage:22,speed:2.05,windup:.95,range:2.8,recovery:1.2}} as const;
export interface Enemy extends EnemyDefinition {health:number;maxHealth:number;heading:number;mode:'idle'|'approach'|'windup'|'recover'|'stagger'|'down';timer:number;enabled:boolean;aggro:boolean;phase:number}
export interface CombatEvent {kind:'hit'|'hurt'|'block'|'parry'|'dodge'|'defeat'|'clear'|'wave'|'win';text:string;ore?:number;amount?:number}
export class ValleyCombat {
 enemies:Enemy[]=[];dodgeRemaining=0;dodgeHeading=0;private clock=0;private nextWave=0;
 constructor(public state:ColonySave){this.reset()}
 reset(){this.enemies=enemyDefinitions.map((d,i)=>({...d,health:1,maxHealth:1,heading:Math.PI,mode:'idle',timer:.5+i*.17,enabled:false,aggro:false,phase:i}));this.dodgeRemaining=0;this.nextWave=0;this.sync()}
 sync(){
  const s=this.state,day=dayOf(s);
  for(const e of this.enemies){const profile=enemyProfiles[e.type];e.maxHealth=profile.health+(e.group==='watch'?(s.watch.wave*12+Math.min(5,s.watch.wins)*8):0);
   e.enabled=s.active&&(e.group==='road'?!(s.outcome==='sealed'&&e.type==='brute'):e.group==='mine'?prepared(s)&&!s.mineCleared:s.watch.active);
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
  const candidates=this.enemies.filter(e=>e.enabled&&e.health>0&&Math.hypot(e.x-player.x,e.z-player.z)<p.range&&Math.cos(Math.atan2(e.x-player.x,e.z-player.z)-player.yaw)>.42&&!blocked((e.x+player.x)/2,(e.z+player.z)/2));
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
  let attackers=this.enemies.filter(e=>e.enabled&&e.health>0&&e.mode==='windup').length;
  for(const e of this.enemies){
   if(!e.enabled||e.health<=0)continue;const p=enemyProfiles[e.type],dx=player.x-e.x,dz=player.z-e.z,d=Math.hypot(dx,dz),home=Math.hypot(e.x-enemyDefinitions[e.phase].x,e.z-enemyDefinitions[e.phase].z);
   const fellow=this.enemies.some(f=>f!==e&&f.enabled&&f.group===e.group&&f.aggro&&Math.hypot(f.x-e.x,f.z-e.z)<16);
   if(d<11||fellow)e.aggro=true;
   if(d>27||home>28||Math.hypot(player.x/62,player.z/69)<1)e.aggro=false;
   e.timer=Math.max(0,e.timer-dt);
   if(e.mode==='stagger'||e.mode==='recover'){if(e.timer===0)e.mode='approach';continue}
   if(e.mode==='windup'){
    if(e.timer>0)continue;
    e.mode='recover';e.timer=p.recovery;attackers--;
    const facingEnemy=Math.cos(Math.atan2(dx,dz)-e.heading)>.45;
    if(!e.aggro||d>p.range+.3||!facingEnemy||blocked((e.x+player.x)/2,(e.z+player.z)/2))continue;
    if(this.invulnerable){events.push({kind:'dodge',text:'Clean evade.'});continue}
    const facing=Math.cos(Math.atan2(-dx,-dz)-player.yaw);
    if(sword.parry(facing)){e.mode='stagger';e.timer=1.3;sword.energy=Math.min(1,sword.energy+.12);events.push({kind:'parry',text:'Perfect guard · counter now.'});continue}
    if(sword.block(facing)){events.push({kind:'block',text:'Blow guarded.'});continue}
    const damage=Math.round(p.damage*(s.settings.explorer?.5:1));s.health=Math.max(0,s.health-damage);events.push({kind:'hurt',text:`${e.name} · ${damage} damage.`,amount:damage});if(s.health===0)return events;continue;
   }
   const def=enemyDefinitions[e.phase];let tx=def.x+Math.sin(this.clock*.18+e.phase)*2,tz=def.z+Math.cos(this.clock*.18+e.phase)*2,speed=.65;
   if(e.aggro){
    e.heading=Math.atan2(dx,dz);e.mode='approach';speed=p.speed;
    if(d<p.range+.05&&attackers<2&&e.timer===0){e.mode='windup';e.timer=p.windup*(e.type==='overseer'&&e.health<e.maxHealth*.5?.75:1);attackers++;continue}
    const flank=(e.phase%2?1:-1)*(attackers>0?1.7:.6);tx=player.x+Math.cos(e.heading)*flank;tz=player.z-Math.sin(e.heading)*flank;
    if(d<p.range*.8){tx=e.x-dx/Math.max(d,.01);tz=e.z-dz/Math.max(d,.01);speed=1}
   }else e.mode='idle';
   const distance=Math.hypot(tx-e.x,tz-e.z);if(distance>.2){const mx=(tx-e.x)/distance*speed*dt,mz=(tz-e.z)/distance*speed*dt;if(!blocked(e.x+mx,e.z))e.x+=mx;if(!blocked(e.x,e.z+mz))e.z+=mz;if(!e.aggro)e.heading=Math.atan2(mx,mz)}
  }
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
 startWatch(){const s=this.state;if(s.outcome==='undecided'||s.watch.active)return false;s.watch.active=true;s.watch.wave=0;for(const e of this.enemies.filter(e=>e.group==='watch')){delete s.enemies[e.id];e.x=enemyDefinitions[e.phase].x;e.z=enemyDefinitions[e.phase].z;e.aggro=true;e.mode='approach';e.timer=1.5}this.sync();logEvent(s,'The ruined beacon is lit. Three waves will test the new watch.');return true}
}

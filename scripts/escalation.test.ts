import {test,expect} from 'bun:test';
import {freshColony,normalizeColony,validColony,advanceColony,DAY_SECONDS,currentObjective,rescue} from '../src/colony';
import {freshCrisis,beginCrisis,repairSignal,patchBeacon,settleCharter,signalSites} from '../src/escalation';
import {ValleyCombat,enemyProfiles} from '../src/valley-combat';
import {SwordHandling} from '../src/sword';
const home={x:0,z:-70,yaw:0},beacon={x:8,z:151,yaw:0};
function fixture(outcome:'opened'|'sealed'='opened'){
 const s=freshColony();s.active=true;s.mineCleared=true;s.outcome=outcome;s.aid={food:true,tools:true,watch:true};s.inventory.wood=8;s.inventory.iron=8;
 beginCrisis(s);for(const p of signalSites)repairSignal(s,p.id);return s;
}
test('old portable Alpha II saves migrate without resetting their mine or appearance',()=>{
 const s=fixture();const {crisis,...old}=s;expect(validColony(old)).toBe(true);const loaded=normalizeColony(old);expect(loaded.crisis).toEqual(freshCrisis());expect(loaded.outcome).toBe('opened');
 for(const bad of [{stage:'oops'},{stage:'assault',repaired:[]},{integrity:-1},{attempts:1.5}])expect(validColony({...s,crisis:{...s.crisis,...bad}})).toBe(false);
});
test('signal repairs cost actual materials once and require the mine outcome',()=>{
 const s=freshColony();expect(beginCrisis(s)).toBe(false);s.active=true;s.mineCleared=true;s.outcome='sealed';expect(beginCrisis(s)).toBe(true);expect(beginCrisis(s)).toBe(false);
 expect(repairSignal(s,'signal-shrine')).toBe(false);s.inventory.wood=1;s.inventory.iron=1;expect(repairSignal(s,'signal-shrine')).toBe(true);expect(repairSignal(s,'signal-shrine')).toBe(false);expect(s.inventory.wood).toBe(0);expect(currentObjective(s,3,true)?.label).toBe('Ferryman’s signal');
});
test('mine branch changes final assault and beacon repairs are atomic',()=>{
 for(const branch of ['opened','sealed'] as const){const s=fixture(branch),c=new ValleyCombat(s);expect(c.startSignal()).toBe(true);expect(c.startWatch()).toBe(false);expect(c.enemies.filter(e=>e.group==='signal'&&e.enabled)).toHaveLength(branch==='opened'?4:3);expect(s.inventory.wood).toBe(branch==='opened'?7:5);expect(patchBeacon(s)).toBe(false);s.crisis.integrity=40;expect(patchBeacon(s)).toBe(true);expect(s.crisis.integrity).toBe(75);s.inventory.iron=0;expect(patchBeacon(s)).toBe(false);expect(s.crisis.integrity).toBe(75)}
});
test('beacon siege damages the objective, retreats reset safely, and rescue keeps signals',()=>{
 const s=fixture(),c=new ValleyCombat(s),sw=new SwordHandling();c.startSignal();
 for(let i=0;i<400&&s.crisis.stage==='assault';i++)c.update(.1,{x:35,z:151,yaw:0},sw,()=>false);
 expect(s.crisis.stage).toBe('signals');expect(s.crisis.repaired).toHaveLength(3);expect(c.startSignal()).toBe(true);c.update(.1,home,sw,()=>false);expect(s.crisis.stage).toBe('signals');expect(c.startSignal()).toBe(true);rescue(s,10);expect(s.crisis.stage).toBe('signals');expect(s.crisis.repaired).toHaveLength(3);
 expect(s.inventory.wood).toBe(7); // Retrying cannot farm the diggers’ one-time gift.
});
test('victory unlocks one permanent charter with real recurring camp benefits',()=>{
 for(const charter of ['commons','watch'] as const){const s=fixture(),c=new ValleyCombat(s),sw=new SwordHandling();expect(settleCharter(s,charter)).toBe(false);c.startSignal();for(const e of c.enemies.filter(e=>e.group==='signal')){e.health=0;s.enemies[e.id]={health:0,day:0}}c.update(.1,beacon,sw,()=>false);expect(s.crisis.stage).toBe('return');expect(settleCharter(s,charter)).toBe(true);expect(settleCharter(s,charter==='commons'?'watch':'commons')).toBe(false);s.stocks={food:2,tools:2,watch:2};advanceColony(s,DAY_SECONDS);expect(s.stocks[charter==='commons'?'food':'watch']).toBe(3);expect(normalizeColony(JSON.parse(JSON.stringify(s)))).toEqual(s)}
});
test('firebrands lock an impact location and cover blocks their throw',()=>{
 const s=fixture(),c=new ValleyCombat(s),sw=new SwordHandling();for(const e of c.enemies)e.enabled=false;const e=c.enemies.find(e=>e.type==='firebrand')!;
 Object.assign(e,{enabled:true,x:0,z:162,aggro:true,mode:'windup',timer:.05,aimX:0,aimZ:168,targetBeacon:false});
 const target={x:0,z:168,yaw:Math.PI};c.update(.1,target,sw,()=>false);expect(c.hazards).toHaveLength(1);for(let i=0;i<9;i++)c.update(.1,{...target,x:4},sw,()=>false);expect(s.health).toBe(100);
 Object.assign(e,{mode:'windup',timer:.05});c.update(.1,target,sw,()=>true);expect(c.hazards).toHaveLength(0);
 Object.assign(e,{mode:'windup',timer:.05});c.update(.1,target,sw,()=>false);for(let i=0;i<9;i++)c.update(.1,target,sw,()=>false);expect(s.health).toBe(84);
});
test('roving patrols change grounds at evening, pay once, and a watch charter suppresses firebrands',()=>{
 const s=fixture(),c=new ValleyCombat(s),sw=new SwordHandling();const east=c.enemies.find(e=>e.id==='patrol-pike')!.x;
 for(const e of c.enemies.filter(e=>e.group==='patrol')){e.health=0;s.enemies[e.id]={health:0,day:0}}
 const food=s.inventory.ration;c.update(.1,home,sw,()=>false);c.update(.1,home,sw,()=>false);expect(s.inventory.ration).toBe(food+2);
 s.clock=400;c.sync();expect(c.enemies.find(e=>e.id==='patrol-pike')!.x).not.toBe(east);expect(c.enemies.find(e=>e.id==='patrol-pike')!.health).toBe(enemyProfiles.skirmisher.health);
 const loaded=new ValleyCombat(normalizeColony(JSON.parse(JSON.stringify(s))));expect(loaded.enemies.find(e=>e.id==='patrol-pike')!.x).toBe(-82);
 s.crisis.stage='return';settleCharter(s,'watch');c.sync();expect(c.enemies.find(e=>e.id==='patrol-fire')!.enabled).toBe(false);
});
test('an exhausted guard breaks and wears equipment while a fresh parry still counters',()=>{
 const s=fixture(),c=new ValleyCombat(s),sw=new SwordHandling();for(const e of c.enemies)e.enabled=false;const e=c.enemies[0];Object.assign(e,{enabled:true,x:0,z:-98,health:42,maxHealth:42,aggro:true,heading:Math.PI,mode:'windup',timer:.01});sw.draw();sw.energy=.15;sw.update(.2,true);const events=c.update(.02,{x:0,z:-100,yaw:0},sw,()=>false);expect(events.some(e=>e.text.includes('Guard broken'))).toBe(true);expect(sw.energy).toBe(0);expect(s.durability).toBeLessThan(100);
});
test('outriders make a faster backstep against committed attacks than ordinary approach',()=>{
 const distances=[];for(const attacking of [false,true]){const s=fixture(),c=new ValleyCombat(s),sw=new SwordHandling();for(const e of c.enemies)e.enabled=false;const e=c.enemies[0];Object.assign(e,{type:'skirmisher',x:-25,z:-96,enabled:true,aggro:true,mode:'approach',timer:10});sw.draw();if(attacking)sw.attack();c.update(.1,{x:-25,z:-98,yaw:0},sw,()=>false);distances.push(e.z+96)}
 expect(distances[1]).toBeGreaterThan(distances[0]*3);
});

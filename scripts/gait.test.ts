import {test,expect} from 'bun:test';
import {Quaternion,Vector3} from '@babylonjs/core/Maths/math.vector';
import {GaitController,LEG,solveLeg,WALK_SPEED,SPRINT_SPEED,type GaitInput} from '../src/gait';
const input=(z=0):GaitInput=>({x:0,y:0,z,heading:0,scaleX:1.1,scaleY:1.1,scaleZ:1.1,grounded:true,ground:()=>0});
test('leg IK reaches forward, backward and lateral targets with knees bending forward',()=>{
 for(const target of [[0,-.70,.2],[0,-.68,-.22],[.14,-.7,.12],[-.12,-.69,-.1]]){
  const [x,y,z]=target,a=solveLeg(x,y,z),q=Quaternion.RotationAxis(Vector3.Forward(),a.roll).multiply(Quaternion.RotationAxis(Vector3.Right(),a.hip));
  const knee=new Vector3(0,-LEG.upper,0).rotateByQuaternionToRef(q,Vector3.Zero());
  const ankle=knee.add(new Vector3(0,-LEG.lower,0).rotateByQuaternionToRef(q.multiply(Quaternion.RotationAxis(Vector3.Right(),a.knee)),Vector3.Zero()));
  expect(Vector3.Distance(ankle,new Vector3(x,y,z))).toBeLessThan(.00001);expect(a.knee).toBeGreaterThan(0);expect(knee.z).toBeGreaterThan(z*.5-.05);
 }
 for(const p of [[0,0,0],[0,-10,0],[0,-.1,0]]){const a=solveLeg(...p as [number,number,number]);expect(Number.isFinite(a.hip+a.knee+a.roll)).toBe(true)}
});
test('steady walking plants stance feet in world space and lifts the swing foot',()=>{
 const gait=new GaitController();gait.update(0,input());let previous=gait.diagnostics(),contacts=0,lifts=0;
 for(let i=1;i<=180;i++){const p=gait.update(1/60,input(i*WALK_SPEED/60));expect(p.pelvisY).toBeGreaterThanOrEqual(-.079);if(i>60)for(let j=0;j<2;j++){const f=p.feet[j],old=previous.feet[j];if(f.contact&&old.contact&&f.phase>old.phase){expect(Math.hypot(f.worldX-old.worldX,f.worldZ-old.worldZ)).toBeLessThan(.0001);contacts++}if(!f.contact&&f.worldY>.135)lifts++}previous=gait.diagnostics()}
 expect(contacts).toBeGreaterThan(70);expect(lifts).toBeGreaterThan(20);
});
test('walking and running cadence stays stable across frame rates and is below the old tiny-step cadence',()=>{
 for(const speed of [WALK_SPEED,SPRINT_SPEED]){const steps=[];for(const hz of [15,30,60,120]){const gait=new GaitController();gait.update(0,input());let hits=0;for(let i=1;i<=hz*4;i++)hits+=gait.update(1/hz,input(i*speed/hz)).landings;steps.push(hits)}expect(Math.max(...steps)-Math.min(...steps)).toBeLessThanOrEqual(1);if(speed===WALK_SPEED){expect(steps[2]).toBeGreaterThanOrEqual(10);expect(steps[2]).toBeLessThanOrEqual(11)}}
});
test('walls and stopping settle to idle without cycling feet in place',()=>{
 const gait=new GaitController();gait.update(0,input());for(let i=1;i<=90;i++)gait.update(1/60,input(i*WALK_SPEED/60));const phase=gait.pose.phase;let hits=0;for(let i=0;i<90;i++)hits+=gait.update(1/60,input(90*WALK_SPEED/60)).landings;expect(gait.pose.weight).toBeLessThan(.001);expect(gait.pose.phase).toBe(phase);expect(hits).toBe(0);for(const f of gait.pose.feet){expect(Math.abs(f.z)).toBeLessThan(.001);expect(f.y).toBeCloseTo(LEG.ankle,3)}
});
test('walk/run blends preserve phase; jumping releases contact; teleports reset without phantom steps',()=>{
 const gait=new GaitController();gait.update(0,input());let z=0;for(let i=0;i<60;i++){z+=WALK_SPEED/60;gait.update(1/60,input(z))}const phase=gait.pose.phase;z+=SPRINT_SPEED/60;const run=gait.update(1/60,input(z));expect(run.phase).toBeGreaterThan(phase);expect(run.run).toBeGreaterThan(0);expect(run.run).toBeLessThan(.2);
 for(let i=0;i<12;i++)gait.update(1/60,{...input(z),grounded:false,y:.4});expect(gait.pose.feet.every(f=>!f.contact)).toBe(true);expect(gait.pose.air).toBeGreaterThan(.9);
 gait.update(1/60,input(z+30));expect(gait.pose.landings).toBe(0);expect(gait.pose.weight).toBeLessThan(.001);
});

test('sprint recovery stays within leg reach and torso suspension stays quiet',()=>{
 const gait=new GaitController();gait.update(0,input());let min=Infinity,max=-Infinity,hits=0;
 for(let i=1;i<=240;i++){
  const p=gait.update(1/60,input(i*SPRINT_SPEED/60));
  if(i<120)continue;
  min=Math.min(min,p.pelvisY);max=Math.max(max,p.pelvisY);hits+=p.landings;
  for(const f of p.feet)expect(Math.abs(f.z)).toBeLessThan(.32);
 }
 expect(max-min).toBeLessThan(.015);
 expect(hits).toBeGreaterThanOrEqual(8);expect(hits).toBeLessThanOrEqual(10);
});
test('slope samples tilt planted boots and accommodate every supported character height',()=>{
 for(const scaleY of [1.078,1.1,1.199]){const gait=new GaitController();const ground=(_x:number,z:number)=>z*.12;gait.update(0,{...input(),scaleY,ground});let tilted=false;for(let i=1;i<100;i++){const z=i*WALK_SPEED/60,p=gait.update(1/60,{...input(z),y:ground(0,z),scaleY,ground});for(const f of p.feet){if(f.contact&&Math.abs(f.pitch)>.02)tilted=true;expect(Number.isFinite(f.x+f.y+f.z+p.pelvisY)).toBe(true)}}expect(tilted).toBe(true)}
});

test('quarter turns and reversals release support feet before crossing or twisting',()=>{
 for(const speed of [WALK_SPEED,SPRINT_SPEED])for(const turn of [Math.PI/2,-Math.PI/2,Math.PI,-Math.PI]){
  const gait=new GaitController();let x=0,z=0,heading=0,previous:ReturnType<GaitController['diagnostics']>|null=null,oldHeading=0,lifted=0;
  for(let i=0;i<180;i++){
   const target=i<90?0:turn;heading+=Math.atan2(Math.sin(target-heading),Math.cos(target-heading))*(1-Math.exp(-12/60));x+=Math.sin(target)*speed/60;z+=Math.cos(target)*speed/60;
   const p=gait.update(1/60,{...input(z),x,heading});
   if(i>=90)for(let side=0;side<2;side++){
    const f=p.feet[side],old=previous?.feet[side];expect(f.x*(side===0?-1:1)).toBeGreaterThan(.035);expect(Math.abs(f.x)).toBeLessThan(.23);expect(Math.abs(f.z)).toBeLessThan(.39);
    if(!f.contact&&f.y>.12)lifted++;
    if(old&&f.contact&&old.contact&&f.phase>old.phase){const angle=heading+f.yaw-oldHeading-old.yaw;expect(Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))).toBeLessThan(.001)}
   }
   previous=gait.diagnostics();oldHeading=heading;
  }
  expect(lifted).toBeGreaterThan(0);
 }
});

test('turning in place uses small recovery steps and settles without wandering',()=>{
 const gait=new GaitController();gait.update(0,input());let lifted=0;
 for(let i=1;i<=120;i++){
  const p=gait.update(1/60,{...input(),heading:i/120*Math.PI});
  for(const [i,f] of p.feet.entries()){expect(f.x*(i===0?-1:1)).toBeGreaterThan(.025);expect(Math.abs(f.z)).toBeLessThan(.08);if(f.y>.12)lifted++}
 }
 expect(lifted).toBeGreaterThan(10);
 for(let i=0;i<90;i++)gait.update(1/60,{...input(),heading:Math.PI});
 expect(gait.pose.weight).toBe(0);expect(gait.pose.feet.every(f=>Math.abs(f.z)<.001)).toBe(true);
});

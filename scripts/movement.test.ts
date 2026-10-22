import {test,expect} from 'bun:test';
import {Locomotion} from '../src/movement';
function travel(sprint:boolean,hz:number,diagonal=false){const mover=new Locomotion();let x=0,z=0;for(let i=0;i<hz*2;i++){const delta=mover.step(1/hz,{forward:1,side:diagonal?1:0,sprint},0);x+=delta.dx;z+=delta.dz}return Math.hypot(x,z)}
test('Shift sprint covers more than twice the walking distance',()=>expect(travel(true,60)/travel(false,60)).toBeGreaterThan(2.4));
test('movement speed stays consistent at 15, 30, 60 and 120 Hz',()=>{for(const hz of [15,30,120])expect(Math.abs(travel(true,hz)-travel(true,60))).toBeLessThan(.2)});
test('diagonal input has no speed advantage',()=>expect(travel(true,60,true)).toBeCloseTo(travel(true,60),6));
test('movement follows camera heading',()=>{const mover=new Locomotion();const delta=mover.step(.2,{forward:1,side:0,sprint:false},Math.PI/2);expect(delta.dx).toBeGreaterThan(.35);expect(Math.abs(delta.dz)).toBeLessThan(.0001)});
test('released controls decelerate to a stop and sprint has no stamina lockout',()=>{const mover=new Locomotion();for(let i=0;i<60*30;i++)mover.step(1/60,{forward:1,side:0,sprint:true},0);expect(mover.running).toBe(true);expect(mover.speed).toBeCloseTo(7.2,2);for(let i=0;i<60;i++)mover.step(1/60,{forward:0,side:0,sprint:false},0);expect(mover.speed).toBe(0)});

test('the first Shift step reaches full sprint speed immediately',()=>{const mover=new Locomotion();mover.step(1/60,{forward:1,side:0,sprint:false},0);const first=mover.step(1/60,{forward:1,side:0,sprint:true},0);expect(first.speed).toBe(7.2);expect(first.dz).toBeCloseTo(7.2/60,8)});

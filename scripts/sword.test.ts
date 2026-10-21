import {test,expect} from 'bun:test';
import {SwordHandling} from '../src/sword';
test('sheathed weapon cannot strike and drawing has no movement effects',()=>{const s=new SwordHandling();expect(s.attack()).toBe(false);s.draw();expect(s.attack()).toBe(true);expect(s.energy).toBeCloseTo(.75)});
test('one strike occurs per swing regardless of frame rate',()=>{for(const hz of [15,30,60,120]){const s=new SwordHandling();s.draw();s.attack();let hits=0;for(let i=0;i<hz;i++)if(s.update(1/hz))hits++;expect(hits).toBe(1);expect(s.active).toBe(false)}});
test('recovery prevents spam; a late input buffers the next swing',()=>{const s=new SwordHandling();s.draw();s.attack();s.update(.3);expect(s.attack()).toBe(false);s.update(.2);s.attack();s.update(.16);expect(s.active).toBe(true);expect(s.elapsed).toBe(0)});
test('guard only blocks frontal strikes and costs energy',()=>{const s=new SwordHandling();s.draw();s.update(.01,true);expect(s.block(-1)).toBe(false);expect(s.block(1)).toBe(true);expect(s.energy).toBeCloseTo(.8);s.energy=.1;expect(s.block(1)).toBe(false)});
test('sheathing cancels a pending swing',()=>{const s=new SwordHandling();s.draw();s.attack();s.draw(false);expect(s.update(.3)).toBe(false);expect(s.active).toBe(false)});

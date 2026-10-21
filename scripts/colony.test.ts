import {test,expect} from 'bun:test';
import {freshColony,normalizeColony,validColony,advanceColony,DAY_SECONDS,gather,gatheringSites,siteAvailable,craft,contribute,prepared,resolveMine,rescue,useSupply,price,currentObjective} from '../src/colony';
import {parseSave} from '../src/save';
test('older saves gain safe chapter II defaults without changing chapter I',()=>{const s=parseSave(JSON.stringify({stage:2,ore:4,collected:[1],x:0,z:-70,yaw:0}));expect(s.stage).toBe(2);expect(s.colony).toEqual(freshColony());expect(s.colony.active).toBe(false)});
test('gathering and cache rewards survive reload and cannot be claimed twice',()=>{
 const s=freshColony();expect(gather(s,'timber-north').ok).toBe(true);expect(s.inventory.wood).toBe(3);expect(gather(s,'timber-north').ok).toBe(false);
 const loaded=normalizeColony(JSON.parse(JSON.stringify(s)));expect(gather(loaded,'timber-north').ok).toBe(false);advanceColony(loaded,DAY_SECONDS*2);expect(gather(loaded,'timber-north').ok).toBe(true);
 const first=gather(s,'cache-shrine');expect(first.ore).toBe(4);expect(s.inventory.salve).toBe(2);expect(gather(s,'cache-shrine').ok).toBe(false);expect(s.log[0].text).toContain('pilgrim');
});
test('crafting fails atomically and consumes the stated resources on success',()=>{const s=freshColony();expect(craft(s,'salve')).toBe(false);expect(s.inventory.herb).toBe(0);s.inventory.herb=3;s.inventory.wood=1;expect(craft(s,'salve')).toBe(true);expect(s.inventory.herb).toBe(1);expect(craft(s,'ration')).toBe(true);expect(s.inventory.herb).toBe(0);expect(s.inventory.wood).toBe(0);expect(s.inventory.ration).toBe(3)});
test('supply contracts are once per shift while preparation remains credited',()=>{
 const s=freshColony();s.active=true;s.inventory.wood=8;s.inventory.iron=8;
 expect(contribute(s,'food')).toBe(true);expect(contribute(s,'food')).toBe(false);expect(contribute(s,'tools')).toBe(true);expect(contribute(s,'watch')).toBe(true);expect(prepared(s)).toBe(true);
 expect(s.reputation).toEqual({diggers:4,shadows:4,guards:4});advanceColony(s,DAY_SECONDS*20);expect(s.stocks).toEqual({food:0,tools:0,watch:0});expect(prepared(s)).toBe(true);s.inventory.ration=2;expect(contribute(s,'food')).toBe(true);
});
test('mine outcomes are exclusive, change standing and improve real resource yield',()=>{
 const s=freshColony();expect(resolveMine(s,'opened')).toBe(false);s.active=true;s.mineCleared=true;expect(resolveMine(s,'opened')).toBe(true);expect(resolveMine(s,'sealed')).toBe(false);expect(s.reputation.diggers).toBe(20);expect(s.reputation.guards).toBe(-6);gather(s,'iron-mine');expect(s.inventory.iron).toBe(5);expect(currentObjective(s,3,true)?.label).toContain('watch');
});
test('supplies cannot be wasted at full health and rescue keeps campaign items',()=>{const s=freshColony();s.active=true;s.mineCleared=true;s.outcome='opened';s.caches=['cache-shrine'];s.health=80;expect(useSupply(s,'ration')).toBe(true);expect(s.health).toBe(100);expect(useSupply(s,'salve')).toBe(false);expect(rescue(s,100)).toBe(6);expect(s.health).toBe(65);expect(s.caches).toEqual(['cache-shrine']);expect(s.outcome).toBe('opened')});
test('portable state validates nested data independently of object key order',()=>{
 const s=freshColony();expect(validColony(s)).toBe(true);expect(validColony({...s,inventory:{salve:1,ration:2,herb:0,iron:0,wood:0}})).toBe(true);
 for(const patch of [{health:NaN},{clock:-1},{inventory:{...s.inventory,wood:-1}},{inventory:{...s.inventory,wood:1.5}},{upgrade:1.5},{equipped:'wand'},{active:true,outcome:'opened',mineCleared:false},{enemies:{bad:{health:-1,day:0}}},{settings:{...s.settings,explorer:'yes'}}])expect(validColony({...s,...patch})).toBe(false);
});
test('standing improves real supply prices without buy-sell arbitrage',()=>{const s=freshColony();expect(currentObjective(s,0,false)).toBe(null);expect(currentObjective(s,3,false)?.label).toContain('Huno');const base=price(s,10);s.reputation.shadows=20;expect(price(s,4)).toBe(3);expect(price(s,2)).toBe(1);s.reputation.shadows=40;expect(price(s,10)).toBeLessThan(base);expect(price(s,3)).toBeGreaterThanOrEqual(2);s.clock=DAY_SECONDS*2;expect(price(s,4)).toBe(3)});

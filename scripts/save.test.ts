import {test,expect} from 'bun:test';
import {parseSave} from '../src/save';
const valid={stage:1,ore:3,collected:[0,1,2],x:0,z:-70,yaw:0,seen:[]};
test('older saves gain default expedition state',()=>expect(parseSave(JSON.stringify(valid)).expedition.weapon).toBe(false));
test('portable saves retain quest and exploration progress',()=>{const parsed=parseSave(JSON.stringify({...valid,expedition:{smith:3,weapon:true,herbs:[0,1,2],found:['mine'],soup:true,wins:2}}));expect(parsed.expedition.wins).toBe(2);expect(parsed.expedition.found).toEqual(['mine'])});
test('corrupted portable saves cannot set invalid world or inventory state',()=>{for(const patch of [{stage:99},{x:10000},{ore:-1},{collected:[19]},{expedition:{herbs:[99]}},{expedition:{found:['missing']}}])expect(()=>parseSave(JSON.stringify({...valid,...patch}))).toThrow()});

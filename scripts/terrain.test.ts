import {test,expect} from 'bun:test';
import {terrainHeight,walkHeight,riverX,bridgeHeight} from '../src/terrain';
test('bridge floor stays above the carved riverbed',()=>{const x=riverX(-75);expect(walkHeight(x,-75)).toBeGreaterThan(terrainHeight(x,-75)+1);expect(walkHeight(x,-75)).toBe(bridgeHeight(x))});
test('bridge approaches join the banks continuously',()=>{const center=riverX(-75);for(const sign of [-1,1]){const x=center+sign*18.1;expect(Math.abs(walkHeight(x,-75)-walkHeight(x-sign*.01,-75))).toBeLessThan(.04)}});
test('ground height is unchanged outside the bridge',()=>{for(const [x,z] of [[0,-70],[-112,76],[-91,-108],[101,94]])expect(walkHeight(x,z)).toBe(terrainHeight(x,z))});

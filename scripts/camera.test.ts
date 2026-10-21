import {test,expect} from 'bun:test';
import {cameraClearance} from '../src/camera-collision';
import {terrainHeight} from '../src/terrain';
const y=terrainHeight(0,-3)+1.5;
test('camera stops before a wall',()=>{const distance=cameraClearance({x:0,y,z:0},{x:0,y,z:-6},[{x:0,z:-3,w:4,d:.5,a:0,height:3}]);expect(distance).toBeGreaterThan(2);expect(distance).toBeLessThan(3)});
test('low props do not pull a shoulder-height camera inward',()=>expect(cameraClearance({x:0,y,z:0},{x:0,y,z:-6},[{x:0,z:-3,w:1,d:1,a:0,height:.5}])).toBe(6));
test('camera respects rotated walls',()=>expect(cameraClearance({x:0,y,z:0},{x:6,y,z:0},[{x:3,z:0,w:.5,d:4,a:Math.PI/4,height:3}])).toBeLessThan(4));

import {test,expect} from 'bun:test';
import {appearanceOptions,defaultAppearance,normalizeAppearance,randomAppearance,residentAppearance,validAppearance,type AppearanceKey} from '../src/appearance';
import {parseSave} from '../src/save';
const oldSave={stage:1,ore:3,collected:[0,1,2],x:0,z:-70,yaw:0,seen:[]};
test('old journeys acquire a complete default appearance',()=>{
 expect(parseSave(JSON.stringify(oldSave)).appearance).toEqual(defaultAppearance);
 expect(normalizeAppearance({skin:'deep',hairStyle:'invalid',outfit:null})).toEqual({...defaultAppearance,skin:'deep'});
 expect(normalizeAppearance(null)).toEqual(defaultAppearance);
});
test('portable journeys retain every appearance field',()=>{
 const appearance=randomAppearance(()=>.7);
 expect(parseSave(JSON.stringify({...oldSave,appearance})).appearance).toEqual(appearance);
 for(const key of Object.keys(appearanceOptions) as AppearanceKey[]){
  expect(()=>parseSave(JSON.stringify({...oldSave,appearance:{...appearance,[key]:'invalid'}}))).toThrow('Invalid appearance');
 }
 expect(()=>parseSave(JSON.stringify({...oldSave,appearance:null}))).toThrow();
 expect(()=>parseSave(JSON.stringify({...oldSave,appearance:[]}))).toThrow();
});
test('named residents have distinct stable identities and role appropriate clothing',()=>{
 const names=['Diego','Thorus','Huno','Fisk','Scatty','Grim','Snaf'];
 const looks=names.map(name=>residentAppearance(name,'Resident',0,0));
 expect(new Set(looks.map(a=>JSON.stringify(a))).size).toBe(names.length);
 expect(new Set(looks.map(a=>a.hairStyle)).size).toBe(6);
 expect(new Set(looks.map(a=>a.outfit)).size).toBe(5);
 expect(residentAppearance('Huno','Blacksmith',22,-23).outfit).toBe('apron');
 expect(residentAppearance('Thorus','Gatekeeper',-2.7,-10).skin).toBe('deep');
 const first=residentAppearance('Guard','Guard',5,-56);
 residentAppearance('Digger','Digger',9,9);
 expect(residentAppearance('Guard','Guard',5,-56)).toEqual(first);
 expect(residentAppearance('Guard','Guard',-5,-56)).not.toEqual(first);
 expect(first.outfit).toBe('guard');
});
test('randomised appearances always use supported choices and do not share defaults',()=>{
 for(let i=0;i<100;i++)expect(validAppearance(randomAppearance())).toBe(true);
 const result=normalizeAppearance(defaultAppearance);result.hairColor='white';expect(defaultAppearance.hairColor).toBe('brown');
 expect(validAppearance({skin:'deep'})).toBe(false);
 expect(validAppearance({...defaultAppearance,skin:'toString'})).toBe(false);
});
/** Serializable appearance choices shared by residents, the editor and portable saves. */
export const appearanceOptions = {
 skin: {porcelain:'Fair', sand:'Sand', olive:'Olive', bronze:'Bronze', umber:'Umber', deep:'Deep'},
 hairStyle: {shaved:'Shaved', cropped:'Close crop', swept:'Side swept', mohawk:'Mohawk', ponytail:'Tied back', long:'Shoulder length'},
 hairColor: {black:'Black', brown:'Chestnut', auburn:'Auburn', copper:'Copper', blond:'Flaxen', grey:'Grey', white:'Silver'},
 facialHair: {none:'Clean shaven', stubble:'Stubble', moustache:'Moustache', goatee:'Goatee', beard:'Full beard'},
 face: {lean:'Lean', broad:'Broad', angular:'Angular', round:'Round'},
 nose: {straight:'Straight', narrow:'Narrow', broad:'Broad', hooked:'Hooked'},
 mark: {none:'None', scar:'Cheek scar', freckles:'Freckles'},
 build: {slender:'Slender', average:'Average', stocky:'Stocky', tall:'Tall'},
 outfit: {tunic:'Linen tunic', vest:'Leather vest', guard:'Guard armour', apron:'Smith’s apron', jerkin:'Sleeveless jerkin'},
 clothColor: {oat:'Oat linen', rust:'Rust red', blue:'Woad blue', moss:'Moss green', plum:'Faded plum', charcoal:'Charcoal', ochre:'Ochre'},
 trouserColor: {earth:'Earth', charcoal:'Charcoal', tan:'Tan', slate:'Slate'}
} as const;
export type Appearance = {-readonly [K in keyof typeof appearanceOptions]: keyof (typeof appearanceOptions)[K]};
export type AppearanceKey = keyof Appearance;
export const appearanceLabels: Record<AppearanceKey,string> = {
 skin:'Complexion',hairStyle:'Hair style',hairColor:'Hair colour',facialHair:'Facial hair',face:'Face shape',nose:'Nose',mark:'Face details',build:'Build',outfit:'Clothing',clothColor:'Cloth colour',trouserColor:'Trouser colour'
};
export const appearanceColors = {
 skin:{porcelain:'#f4d9c5',sand:'#dcb691',olive:'#bba07b',bronze:'#b37a53',umber:'#855d43',deep:'#5a3c30'},
 hair:{black:'#201c19',brown:'#574032',auburn:'#763d29',copper:'#a36136',blond:'#c4a66a',grey:'#807e76',white:'#c6c3b3'},
 cloth:{oat:'#c2ad83',rust:'#98483d',blue:'#4e6c85',moss:'#667b51',plum:'#795465',charcoal:'#535252',ochre:'#aa8650'},
 trousers:{earth:'#6c5846',charcoal:'#393937',tan:'#9c8060',slate:'#56616b'}
} as const;
export const defaultAppearance: Readonly<Appearance> = {
 skin:'sand',hairStyle:'ponytail',hairColor:'brown',facialHair:'none',face:'lean',nose:'straight',mark:'none',build:'average',outfit:'vest',clothColor:'oat',trouserColor:'earth'
};
export function normalizeAppearance(value:unknown):Appearance {
 const result={...defaultAppearance};
 if(!value||typeof value!=='object'||Array.isArray(value))return result;
 for(const key of Object.keys(appearanceOptions) as AppearanceKey[]){
  const choice=(value as Record<string,unknown>)[key];
  if(typeof choice==='string'&&Object.hasOwn(appearanceOptions[key],choice))Object.assign(result,{[key]:choice});
 }
 return result;
}
export function validAppearance(value:unknown):value is Appearance {
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 return (Object.keys(appearanceOptions) as AppearanceKey[]).every(key=>{
  const choice=(value as Record<string,unknown>)[key];return typeof choice==='string'&&Object.hasOwn(appearanceOptions[key],choice);
 });
}
export function randomAppearance(random= Math.random):Appearance {
 const result={...defaultAppearance};
 for(const key of Object.keys(appearanceOptions) as AppearanceKey[]){const choices=Object.keys(appearanceOptions[key]);Object.assign(result,{[key]:choices[Math.min(choices.length-1,Math.floor(random()*choices.length))]})}
 return result;
}
const residents:Record<string,Partial<Appearance>>={
 Diego:{skin:'olive',hairStyle:'ponytail',hairColor:'black',facialHair:'goatee',face:'lean',nose:'hooked',mark:'scar',outfit:'vest',clothColor:'rust'},
 Thorus:{skin:'deep',hairStyle:'cropped',hairColor:'black',facialHair:'none',face:'broad',nose:'broad',build:'stocky',outfit:'guard',clothColor:'rust',trouserColor:'charcoal'},
 Huno:{skin:'bronze',hairStyle:'shaved',hairColor:'grey',facialHair:'beard',face:'broad',nose:'broad',build:'stocky',outfit:'apron',clothColor:'oat'},
 Fisk:{skin:'sand',hairStyle:'swept',hairColor:'auburn',facialHair:'moustache',face:'round',nose:'straight',outfit:'vest',clothColor:'plum'},
 Scatty:{skin:'umber',hairStyle:'mohawk',hairColor:'black',facialHair:'stubble',face:'angular',nose:'broad',mark:'scar',build:'tall',outfit:'jerkin',clothColor:'charcoal'},
 Grim:{skin:'porcelain',hairStyle:'long',hairColor:'blond',facialHair:'stubble',face:'lean',nose:'narrow',build:'slender',outfit:'tunic',clothColor:'moss'},
 Snaf:{skin:'sand',hairStyle:'cropped',hairColor:'copper',facialHair:'beard',face:'round',nose:'broad',mark:'freckles',build:'stocky',outfit:'tunic',clothColor:'ochre'}
};
/** Coordinate seed distinguishes repeated names and never depends on spawn order. */
export function residentAppearance(name:string,role:string,x:number,z:number):Appearance {
 if(name==='Nameless Hero')return {...defaultAppearance};
 let seed=2166136261;for(const c of `${name}:${role}:${x}:${z}`)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
 const result=randomAppearance(()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296});
 result.outfit=role==='Guard'||role==='Gatekeeper'?'guard':role==='Shadow'?'vest':'tunic';
 if(result.outfit==='guard')result.clothColor='rust';
 return {...result,...residents[name]};
}
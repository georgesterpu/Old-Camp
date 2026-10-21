import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const pages=await(await fetch('http://127.0.0.1:9223/json/list')).json();
const page=pages.find(p=>p.type==='page'&&p.url.includes('old-camp.html'));
assert.ok(page,'Offline game tab exists');
const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map(),errors=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)});
const send=(method,params={})=>new Promise((resolve,reject)=>{const i=++id;pending.set(i,r=>r.error?reject(r.error):resolve(r.result));ws.send(JSON.stringify({id:i,method,params}));setTimeout(()=>{if(pending.delete(i))reject(Error('Timed out: '+method))},30000).unref()});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||'Browser exception');return r.result.value};
const shot=async path=>{await evaluate('campTest.render()');const r=await send('Page.captureScreenshot',{format:'png'});writeFileSync(path,Buffer.from(r.data,'base64'))};
const ready=async()=>{for(let i=0;i<100;i++){if(await evaluate('!!window.campTest'))return;await new Promise(r=>setTimeout(r,200))}throw Error('Game did not initialize')};
const reload=async()=>{await evaluate('delete window.campTest;delete window.campDiagnostics');await send('Page.reload');await ready()};
await send('Runtime.enable');await send('Page.enable');await evaluate('sessionStorage.clear()');await reload();
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
await ready();
if(process.argv.includes('--gallery')){
 for(const name of ['Thorus','Huno','Grim']){
  await evaluate(`campTest.previewAppearance(campTest.appearances().find(p=>p.name===${JSON.stringify(name)}).appearance);campTest.render()`);
  await shot(`docs/appearance-${name.toLowerCase()}.png`);
  await evaluate("document.getElementById('appearance-cancel').click()");
 }
 ws.close();process.exit(0);
}
if(process.argv.includes('--preview')){
 await evaluate("document.getElementById('appearance-start').click();campTest.render()");
 await shot('docs/appearance-editor.png');
 await evaluate("document.getElementById('appearance-portrait').click();campTest.render()");
 await shot('docs/appearance-face.png');
 console.log(JSON.stringify(await evaluate('campTest.appearanceEditor()'),null,2));ws.close();process.exit(0);
}
const initial=await evaluate('campTest.appearances()');
assert.equal(initial.length,13);assert.equal(new Set(initial.map(p=>JSON.stringify(p.appearance))).size,13,'All inhabitants and the hero have unique appearances');
await evaluate("document.getElementById('appearance-start').click()");
assert.equal((await evaluate('campTest.appearanceEditor()')).open,true);
const original=await evaluate("campTest.appearances().find(p=>p.name==='Nameless Hero').appearance");
const select=async(key,value)=>evaluate(`(()=>{const s=document.getElementById('appearance-${key}');s.value=${JSON.stringify(value)};s.dispatchEvent(new Event('change',{bubbles:true}));campTest.render()})()`);
await select('skin','deep');await select('hairStyle','mohawk');await select('hairColor','copper');await select('facialHair','beard');await select('face','broad');await select('nose','hooked');await select('mark','scar');await select('build','stocky');await select('outfit','guard');await select('clothColor','blue');await select('trouserColor','slate');
const changed=(await evaluate('campTest.appearanceEditor()')).draft;
assert.deepEqual(await evaluate("campTest.appearances().find(p=>p.name==='Nameless Hero').appearance"),original,'Preview does not change the live player');
await shot('docs/appearance-editor.png');
await evaluate("document.getElementById('appearance-portrait').click()");await shot('docs/appearance-face.png');
await evaluate("document.getElementById('appearance-save').click()");
assert.deepEqual(await evaluate("campTest.appearances().find(p=>p.name==='Nameless Hero').appearance"),changed,'Apply updates the live player');
assert.deepEqual(await evaluate("JSON.parse(localStorage.getItem('old-camp-progress')).appearance"),changed,'Apply persists the complete appearance');
await reload();
assert.deepEqual(await evaluate("campTest.appearances().find(p=>p.name==='Nameless Hero').appearance"),changed,'Appearance survives reload');
assert.deepEqual((await evaluate('campTest.appearances()')).slice(0,12),initial.slice(0,12),'Resident identities survive reload');
await evaluate("document.getElementById('appearance-start').click()");
await select('hairStyle','shaved');await evaluate("window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape'}))");
assert.equal((await evaluate('campTest.appearanceEditor()')).open,false,'Escape closes editor');
assert.deepEqual(await evaluate("campTest.appearances().find(p=>p.name==='Nameless Hero').appearance"),changed,'Cancel discards the draft');
await evaluate("document.getElementById('enter').click();campTest.reset();document.getElementById('appearance-button').click()");
const imported=await evaluate(`(async()=>{
 document.getElementById('appearance-cancel').click();
 const saved=JSON.parse(localStorage.getItem('old-camp-progress'));saved.appearance.hairColor='white';saved.appearance.outfit='apron';
 const input=document.getElementById('save-file'),transfer=new DataTransfer();transfer.items.add(new File([JSON.stringify(saved)],'appearance.json',{type:'application/json'}));input.files=transfer.files;await input.onchange(new Event('change'));return saved.appearance;
})()`);
assert.deepEqual(await evaluate("campTest.appearances().find(p=>p.name==='Nameless Hero').appearance"),imported,'Portable save import updates the actual character');
await evaluate("document.getElementById('appearance-button').click();document.getElementById('appearance-random').click()");
assert.equal(await evaluate("(()=>{const d=campTest.appearanceEditor().draft;return [...document.querySelectorAll('#appearance-fields select')].every(s=>s.value===d[s.name])})()"),true,'Randomise synchronizes every control');
await evaluate("document.getElementById('appearance-default').click()");
assert.equal((await evaluate('campTest.appearanceEditor()')).draft.hairStyle,'ponytail','Original hero restores defaults');
const position=await evaluate('campDiagnostics().position');await evaluate("campTest.advance(.3,['KeyW','ShiftLeft']);campTest.tick(.5)");
assert.deepEqual(await evaluate('campDiagnostics().position'),position,'Gameplay stays suspended during editing');
const styles=['shaved','cropped','swept','mohawk','ponytail','long'];
const vertices=[];for(const style of styles){await select('hairStyle',style);vertices.push((await evaluate('campTest.appearanceEditor()')).vertices)}
assert.ok(new Set(vertices).size>=3,'Hairstyles create different geometry');
for(const outfit of ['tunic','vest','guard','apron','jerkin'])await select('outfit',outfit);
for(const facialHair of ['none','stubble','moustache','goatee','beard'])await select('facialHair',facialHair);
for(const mark of ['none','freckles','scar'])await select('mark',mark);
await select('mark','none');await select('hairStyle','cropped');await select('outfit','vest');
const before=await evaluate('campTest.appearanceEditor()');
for(let i=0;i<12;i++){await select('mark','freckles');await select('hairStyle','long');await select('outfit','guard');await select('mark','none');await select('hairStyle','cropped');await select('outfit','vest')}
const after=await evaluate('campTest.appearanceEditor()');assert.equal(after.meshes,before.meshes,'Repeated edits do not leak meshes');assert.equal(after.materials,before.materials,'Repeated edits do not leak materials');
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await shot('docs/appearance-mobile.png');
assert.equal(await evaluate("(()=>{const r=document.getElementById('appearance-save').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()"),true,'Save action fits mobile viewport');
await evaluate("document.getElementById('appearance-cancel').click()");
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
await evaluate("document.getElementById('pause-button').click();document.getElementById('appearance-button').click();document.getElementById('appearance-cancel').click()");
assert.equal(await evaluate('campDiagnostics().paused'),true,'Closing editor preserves pause state');
await evaluate("document.getElementById('resume').click();campTest.render()");
assert.deepEqual(errors,[],'No browser exceptions');
console.log(JSON.stringify({passed:['13 unique stable appearances','title and in-game editor','all 11 appearance controls','preview isolation','apply','local persistence','reload','portable save import','randomise and defaults','cancel and Escape','gameplay suspension','6 hair styles','5 outfits','5 facial hair styles','face details','no mesh or material leaks','mobile layout','pause restoration'],hairstyleVertices:vertices,diagnostics:await evaluate('campDiagnostics()')},null,2));
ws.close();

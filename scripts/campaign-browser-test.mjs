import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
mkdirSync('.cache',{recursive:true});
const pages=await(await fetch('http://127.0.0.1:9223/json/list')).json(),page=pages.find(p=>p.type==='page'&&p.url.includes('old-camp.html'));
assert.ok(page,'Offline QA tab');const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)});
const send=(method,params={})=>new Promise((resolve,reject)=>{const i=++id;pending.set(i,r=>r.error?reject(r.error):resolve(r.result));ws.send(JSON.stringify({id:i,method,params}));setTimeout(()=>{if(pending.delete(i))reject(Error('Timed out: '+method))},60000).unref()});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||'Browser exception');return r.result.value};
async function ready(){for(let i=0;i<160;i++){try{if(await evaluate('!!window.campTest'))return}catch{}await new Promise(r=>setTimeout(r,200))}throw Error('Game not ready: '+errors.join('\n'))}
async function reload(){await evaluate('delete window.campTest;delete window.campDiagnostics');await send('Page.reload');await ready()}
const click=selector=>evaluate(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});if(!b)throw Error('Missing control '+${JSON.stringify(selector)});b.click()})()`);
const state=()=>evaluate('campTest.colony()');
const shot=async name=>{await evaluate('campTest.tick(0);campTest.render()');const r=await send('Page.captureScreenshot',{format:'png'});writeFileSync(`.cache/rc1-${name}.png`,Buffer.from(r.data,'base64'))};
async function at(name){const p=(await state()).residents.find(p=>p.name===name);await evaluate(`campTest.teleport(${p.x},${p.z})`)}
async function choose(text){assert.equal(await evaluate(`(()=>{const b=[...document.querySelectorAll('#choices button')].find(b=>b.textContent.includes(${JSON.stringify(text)}));b?.click();return !!b})()`),true,text)}
async function service(name,action,arg=''){await at(name);const result=await evaluate(`campTest.colonyAction(${JSON.stringify(action)},${JSON.stringify(arg)})`);return result}
async function fight(ids){
 for(const id of ids){
  const initial=(await state()).enemies.find(e=>e.id===id);await evaluate(`campTest.colonyAction('equip',${JSON.stringify(initial.type==='skirmisher'?'spear':'axe')})`);
  for(let tries=0;tries<28;tries++){
   let model=await state(),enemy=model.enemies.find(e=>e.id===id);if(enemy.health<=0)break;
   assert.equal(await evaluate('campDiagnostics().resultOpen'),false,'No unplanned defeat during '+id);
   if(model.state.crisis.stage==='assault'&&model.state.crisis.integrity<65){await evaluate('campTest.teleport(8,151);campTest.tick(0);campTest.interact()')}
   if(model.state.health<60)await evaluate('campTest.colonyAction("use","salve")');
   let position;for(let i=0;i<16;i++){const angle=enemy.heading+Math.PI+i/16*Math.PI*2,x=enemy.x+Math.sin(angle)*1.1,z=enemy.z+Math.cos(angle)*1.1;if(!await evaluate(`campTest.blocked(${x},${z})`)){position={x,z,yaw:angle+Math.PI};break}}
   assert.ok(position,'Reachable melee position');if(!await evaluate('campTest.combat().drawn'))await evaluate('campTest.toggleSword()');
   await evaluate(`campTest.teleport(${position.x},${position.z});campTest.view(${position.yaw});campTest.attack();for(let i=0;i<11;i++)campTest.advance(.1)`);
  }
  assert.equal((await state()).enemies.find(e=>e.id===id).health,0,id+' defeated through ordinary strikes');
 }
}
await send('Runtime.enable');await send('Page.enable');await ready();await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
if(!await evaluate('campDiagnostics().started'))await click('#enter');await evaluate('campTest.reset()');
// Start from a real new journey. Only travel is accelerated; no campaign or inventory fixtures.
await at('Diego');await evaluate('campTest.interact()');await click('#choices button');
for(const ore of await evaluate('campTest.orePositions()'))await evaluate(`campTest.teleport(${ore.x},${ore.z});campTest.interact()`);
await at('Diego');await evaluate('campTest.interact()');await click('#choices button');await at('Thorus');await evaluate('campTest.interact()');await click('#choices button');assert.equal(await evaluate('campDiagnostics().stage'),3);
await at('Huno');await evaluate('campTest.interact()');await click('#choices button');const hammer=await evaluate('campTest.fieldItems().find(i=>i.kind==="hammer")');await evaluate(`campTest.teleport(${hammer.x},${hammer.z});campTest.interact()`);await at('Huno');await evaluate('campTest.interact()');await click('#choices button');assert.equal(await evaluate('campTest.journey().weapon'),true);
for(const herb of await evaluate('campTest.fieldItems().filter(i=>i.kind==="herb").slice(0,3)'))await evaluate(`campTest.teleport(${herb.x},${herb.z});campTest.interact()`);await at('Snaf');await evaluate('campTest.interact()');await click('#choices button');
for(const site of (await state()).sites.filter(s=>s.kind!=='watch')){await evaluate(`campTest.teleport(${site.x},${site.z});campTest.tick(0);campTest.interact()`);assert.equal((await state()).sites.find(s=>s.id===site.id).available,false,site.id+' gathered')}
assert.match(await service('Diego','begin'),/chapter II begun/);for(const [name,kind] of [['Snaf','food'],['Huno','tools'],['Thorus','watch']])assert.match(await service(name,'contribute',kind),/Supplies delivered/);
assert.match(await service('Huno','forge','axe'),/forged/);assert.match(await service('Huno','forge','spear'),/forged/);assert.match(await service('Huno','upgrade'),/Temper/);
for(let i=0;i<4;i++)assert.match(await service('Snaf','craft','salve'),/prepared/);
await fight(['mine-scout','mine-shield','mine-overseer']);assert.equal((await state()).state.mineCleared,true);assert.match(await service('Diego','resolve','opened'),/reopen/);
await at('Grim');await evaluate('campTest.interact()');await choose('Chapter III');for(const site of (await state()).signals)await evaluate(`campTest.teleport(${site.x},${site.z});campTest.tick(0);campTest.interact()`);
await evaluate('campTest.teleport(8,151);campTest.tick(0);campTest.interact()');assert.equal((await state()).state.crisis.stage,'assault');await fight(['signal-fire','signal-pike','signal-flank','signal-captain']);assert.equal((await state()).state.crisis.stage,'return');
await at('Grim');await evaluate('campTest.interact()');await choose('common hands');assert.equal(await evaluate('campDiagnostics().resultKind'),'victory');assert.match(await evaluate('document.getElementById("campaign-result").textContent'),/CAMPAIGN COMPLETE/);await shot('ending');
const ending=(await state()).state.campaign.ending;assert.ok(ending.stats.foes>=7);assert.equal(ending.stats.contracts,3);assert.equal(ending.stats.crafted,4);assert.equal(ending.partial,false);assert.equal(ending.caches,3);
const before=(await state()).state.clock;await evaluate('campTest.advance(.5,["KeyW","KeyF"])');assert.equal((await state()).state.clock,before,'Ending suspends simulation');
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await shot('ending-mobile');assert.equal(await evaluate('(()=>{const r=document.querySelector("[data-result-continue]").getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()'),true,'Ending remains usable on mobile');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
await reload();assert.equal(await evaluate('campDiagnostics().resultKind'),'victory','Unacknowledged ending survives reload');await click('[data-result-continue]');assert.equal((await state()).state.campaign.seen,true);await reload();assert.equal(await evaluate('campDiagnostics().resultOpen'),false,'Acknowledged ending does not reopen');assert.deepEqual((await state()).state.campaign.ending,ending);
await evaluate('campTest.showResults()');assert.equal(await evaluate('campDiagnostics().resultKind'),'victory');await click('[data-result="watch"]');assert.equal((await state()).target.label,'The ruined watch beacon','Postgame has a clear optional route');
// Test persistent failure screens and loss recovery independently from the winning run.
const completed=(await state()).state;await evaluate('campTest.colonyFixture({...campTest.colony().state,health:1});campTest.teleport(-24,-97);for(let i=0;i<55;i++)campTest.advance(.1)');assert.equal(await evaluate('campDiagnostics().resultKind'),'defeat');assert.equal((await state()).state.health,65);await shot('defeat');await reload();assert.equal(await evaluate('campDiagnostics().resultKind'),'defeat');await click('[data-result-continue]');assert.equal((await state()).state.campaign.failure,null);assert.deepEqual((await state()).state.campaign.ending,ending,'Postgame defeat keeps the winning result');
// A bad primary should recover its verified predecessor rather than start over.
await evaluate(`campTest.colonyFixture(${JSON.stringify(completed)});localStorage.setItem('old-camp-progress-backup',localStorage.getItem('old-camp-progress'));localStorage.setItem('old-camp-progress','broken');window.__nativeSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='old-camp-progress')throw new DOMException('Simulated interrupted write','QuotaExceededError');return window.__nativeSet.call(this,k,v)}`);await reload();assert.equal((await state()).state.crisis.charter,'commons');assert.match(await evaluate('document.getElementById("toast").textContent'),/backup was recovered/);
// Exercise controller focus, tab switching, activation, back, and select editing.
await evaluate(`(()=>{window.__originalPads=navigator.getGamepads;window.__qaPad={connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.__qaPad]});window.__press=i=>{window.__qaPad.buttons.forEach(b=>b.pressed=false);campTest.tick(0);window.__qaPad.buttons[i].pressed=true;campTest.tick(.1);window.__qaPad.buttons[i].pressed=false;campTest.tick(0)}})()`);
await evaluate('campTest.openPack();window.__press(5)');assert.equal(await evaluate('document.querySelector("#camp-ledger [aria-pressed=true]").dataset.tab'),'camp');await evaluate('window.__press(13)');assert.equal(await evaluate('document.activeElement.closest("#camp-ledger")?.id'),'camp-ledger');await evaluate('window.__press(1)');assert.equal((await state()).open,false);
await evaluate('campTest.showResults();window.__press(1)');assert.equal(await evaluate('campDiagnostics().resultOpen'),false,'Controller B closes results');
await evaluate('document.getElementById("appearance-button").click();const select=document.querySelector("#appearance-fields select");select.selectedIndex=0;select.focus()');const oldSelect=await evaluate('document.querySelector("#appearance-fields select").selectedIndex');await evaluate('window.__press(15)');assert.equal(await evaluate('document.querySelector("#appearance-fields select").selectedIndex'),oldSelect+1,'Controller edits appearance select');await evaluate('window.__press(1);Object.defineProperty(navigator,"getGamepads",{configurable:true,value:window.__originalPads})');
await click('#graphics-button');const graphics=await evaluate('document.getElementById("graphics-button").textContent');await reload();assert.equal(await evaluate('document.getElementById("graphics-button").textContent'),graphics,'Graphics preference survives reload');await click('#graphics-button');
assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:['full three-chapter campaign without progress or inventory fixtures','all gathering and material costs','real mine and final combat','charter ending','accurate run statistics','simulation suspension','mobile ending actions','unacknowledged ending reload','ending acknowledgement','postgame objective','explicit defeat and reload','frozen ending through postgame defeat','corrupt autosave backup recovery','controller pack tabs focus and back','controller result dismissal','controller appearance editing'],ending},null,2));ws.close();

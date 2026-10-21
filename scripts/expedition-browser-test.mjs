import assert from 'node:assert/strict';
const pages=await(await fetch('http://127.0.0.1:9223/json/list')).json(),page=pages.find(p=>p.type==='page'&&(p.url.includes('4317')||(p.url.includes('old-camp.html')||p.url.includes('Play%20Old%20Camp.html'))));
assert.ok(page,'Offline QA page exists');const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)});
const send=(method,params={})=>new Promise((resolve,reject)=>{const i=++id;pending.set(i,r=>r.error?reject(r.error):resolve(r.result));ws.send(JSON.stringify({id:i,method,params}));setTimeout(()=>{if(pending.has(i))reject(Error(method+' timed out'))},30000).unref()});
await send('Runtime.enable');
const r=await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>{
 const check=(value,label)=>{if(!value)throw Error(label)};const t=campTest;if(!campDiagnostics().started)document.getElementById('enter').click();t.reset();
 const select=()=>document.querySelector('#choices button').click();
 t.teleport(22,-23);t.interact();check(document.getElementById('speaker').textContent==='Huno','Huno dialogue');select();check(t.journey().smith===1,'Hammer quest accepted');
 const hammer=t.fieldItems().find(i=>i.kind==='hammer');t.teleport(hammer.x,hammer.z);t.interact();check(t.journey().smith===2,'Hammer recovered');
 t.teleport(22,-23);t.interact();select();check(t.journey().weapon&&t.journey().smith===3,'Huno rewards sword');
 for(const herb of t.fieldItems().filter(i=>i.kind==='herb').slice(0,3)){t.teleport(herb.x,herb.z);t.interact()}
 check(t.journey().herbs.length===3,'Three herbs gathered');t.teleport(-17,-29);t.interact();check(document.getElementById('speaker').textContent==='Snaf','Snaf dialogue');select();check(t.journey().soup,'Snaf quest completed');check(campDiagnostics().ore===5,'Supper reward');
 for(const [x,z] of [[-112,76],[101,94],[-91,-108],[107+Math.sin(-75*.018)*13,-75],[0,153]]){t.teleport(x,z);t.advance(.016)}check(t.journey().found.length===5,'All landmarks recorded');
 const bx=107+Math.sin(-75*.018)*13;check(!t.blocked(bx,-75),'Bridge passable');check(t.blocked(bx,-65),'River cannot be walked through');
 t.startSpar();check(t.combat().active&&t.combat().drawn,'Spar starts with sword drawn');
 for(let i=0;i<3;i++){const p=t.combat().enemyPosition;t.teleport(p[0],p[2]-1.7);t.view(0);t.attack();t.advance(.2);check(t.combat().hits===i+1,'Timed sword hit '+i);t.advance(.5)}check(!t.combat().active&&t.journey().wins===1,'Arena win');check(campDiagnostics().ore===15,'Arena ore reward');
 t.toggleSword();check(!t.combat().drawn,'Sheathe');t.toggleSword();check(t.combat().drawn,'Draw');t.advance(.01,['KeyQ']);check(t.combat().guarding,'Held guard');
 const d=campDiagnostics();check(d.wildlife.birds===9&&d.wildlife.deer===5&&d.wildlife.hares===5&&d.wildlife.insects===26,'Wildlife populations');
 document.getElementById('journal-button').click();check(document.getElementById('journal-content').textContent.includes('5 / 5'),'Exploration journal');document.getElementById('journal-button').click();
 const stored=JSON.parse(localStorage.getItem('old-camp-progress'));check(stored.expedition.wins===1&&stored.expedition.weapon,'Side quests persist');
 return {passed:['hammer recovery','sword reward','herb collection','Snaf reward','five discoveries','bridge crossing','river collision','timed sword hits','arena win and reward','draw and sheathe','held guard','wildlife population','exploration journal','persistent side quests'],journey:t.journey(),diagnostics:d};
})()`});
if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||JSON.stringify(r.exceptionDetails));assert.deepEqual(errors,[]);console.log(JSON.stringify(r.result.value,null,2));ws.close();

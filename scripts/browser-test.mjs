import assert from 'node:assert/strict';
const pages=await(await fetch('http://127.0.0.1:9223/json/list')).json();const page=pages.find(p=>p.type==='page'&&(p.url.includes('4317')||(p.url.includes('old-camp.html')||p.url.includes('Play%20Old%20Camp.html'))));
const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();const errors=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text)});
const send=(method,params={})=>new Promise((resolve,reject)=>{const i=++id;pending.set(i,r=>r.error?reject(r.error):resolve(r.result));ws.send(JSON.stringify({id:i,method,params}));setTimeout(()=>{if(pending.has(i))reject(new Error('Timed out: '+method))},30000).unref()});
await send('Runtime.enable');
const result=await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>{
const check=(ok,message)=>{if(!ok)throw Error(message)};
check(!!window.campTest,'Game ready and QA mode enabled');
const test=window.campTest;
document.getElementById('enter').click();test.reset();
check(window.campDiagnostics().started,'Start button');
const before=window.campDiagnostics().position[2];test.advance(.25,['KeyW']);check(window.campDiagnostics().position[2]>before,'Forward movement');
check(test.blocked(-21,15),'Castle wall blocks movement');check(!test.blocked(0,-63),'North gate is passable');check(test.blocked(0,-6),'Castle gate initially blocks movement');
test.teleport(-13,-30);check(window.campDiagnostics().nearest==='Diego','Diego interaction range');test.interact();check(window.campDiagnostics().inDialog,'Dialogue opens');document.querySelector('#choices button').click();check(window.campDiagnostics().stage===1,'Quest accepted');
for(const p of test.orePositions().slice(0,3)){test.teleport(p.x,p.z);test.interact()}
check(window.campDiagnostics().ore===3,'Three ore pickups');check(document.getElementById('objective').textContent.includes('Return to Diego'),'Return objective updates');
test.teleport(-13,-30);test.interact();document.querySelector('#choices button').click();check(window.campDiagnostics().stage===2,'Ore handed to Diego');check(window.campDiagnostics().ore===0,'Ore payment deducted');
test.teleport(-2.7,-12);test.interact();check(document.getElementById('speaker').textContent==='Thorus','Thorus dialogue');document.querySelector('#choices button').click();check(window.campDiagnostics().stage===3,'Quest completed');check(!test.blocked(0,-6),'Castle gate opens');
document.getElementById('map-button').click();check(!document.getElementById('map-panel').classList.contains('hidden'),'Map opens');document.getElementById('map-close').click();check(document.getElementById('map-panel').classList.contains('hidden'),'Map closes');
document.getElementById('pause-button').click();check(window.campDiagnostics().paused,'Pause');document.getElementById('resume').click();check(!window.campDiagnostics().paused,'Resume');
window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyV'}));test.advance(.016);window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyV'}));test.advance(.016);
test.reset();test.teleport(0,-45);test.advance(.016);
return {passed:['start','movement','wall collision','gate collision','dialogue','quest acceptance','ore collection','objective update','payment','Thorus admission','gate unlock','map','pause/resume','view toggle'],diagnostics:window.campDiagnostics()};
})()`});
if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||JSON.stringify(result.exceptionDetails));
assert.equal(errors.length,0,errors.join('\n'));console.log(JSON.stringify(result.result.value,null,2));ws.close();

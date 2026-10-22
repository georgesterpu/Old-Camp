import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
mkdirSync('.cache',{recursive:true});
const pages=await(await fetch('http://127.0.0.1:9223/json/list')).json();
const page=pages.find(p=>p.type==='page'&&p.url.includes('old-camp.html'));
assert.ok(page,'Open old-camp.html?qa&still in the QA browser');
const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map(),errors=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)});
const send=(method,params={})=>new Promise((resolve,reject)=>{const i=++id;pending.set(i,m=>m.error?reject(m.error):resolve(m.result));ws.send(JSON.stringify({id:i,method,params}));setTimeout(()=>{if(pending.delete(i))reject(Error('CDP timeout: '+method))},60000).unref()});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};
try{
 await send('Runtime.enable');await send('Page.reload',{ignoreCache:true});
 for(let i=0;i<120;i++){await new Promise(r=>setTimeout(r,200));if(await evaluate('!!window.campTest'))break}
 assert.ok(await evaluate('!!window.campTest'),'Game initialized');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await evaluate(`if(!campDiagnostics().started)document.getElementById('enter').click();campTest.render()`);
 const results=[];
 for(const running of [false,true]){
  const frames=await evaluate(`(()=>{campTest.reset();campTest.teleport(0,-70);const frames=[];for(let i=0;i<240;i++){campTest.advance(1/60,${running?"['KeyW','ShiftLeft']":"['KeyW']"});if(i>=120)frames.push({g:campTest.gait(),d:campDiagnostics()})}return frames})()`);
  const heads=frames.map(f=>f.g.rig.head[1]-f.d.position[1]);
  const headTravel=Math.max(...heads)-Math.min(...heads);
  assert.ok(headTravel<.018,`${running?'Sprint':'Walk'} head travel ${headTravel} exceeds 18 mm`);
  const maxReach=Math.max(...frames.flatMap(f=>f.g.feet.map(p=>Math.abs(p.z))));
  assert.ok(maxReach<.37,'Recovery does not overshoot into a lunge');
  let planted=0,maxError=0;
  for(let i=1;i<frames.length;i++)for(let side=0;side<2;side++){
   const f=frames[i].g.feet[side],old=frames[i-1].g.feet[side];
   const ankle=frames[i].g.rig.ankles[side];
   maxError=Math.max(maxError,Math.hypot(ankle[0]-f.worldX,ankle[1]-f.worldY,ankle[2]-f.worldZ));
   if(f.contact&&old.contact&&f.phase>old.phase){assert.ok(Math.hypot(f.worldX-old.worldX,f.worldZ-old.worldZ)<.0001,'Stance foot stays planted');planted++}
  }
  assert.ok(planted>20,'Cycle contains support contacts');assert.ok(maxError<.025,`Actual skinned rig follows foot targets (${maxError})`);
  const steps=frames.reduce((n,f)=>n+f.g.landings,0);assert.ok(steps>=(running?8:5)&&steps<=(running?10:6),'Distance-driven cadence');
  results.push({mode:running?'sprint':'walk',headTravelMm:Math.round(headTravel*1000),maxFootReach:Math.round(maxReach*100)/100,stepsInTwoSeconds:steps,maxAnkleErrorMm:Math.round(maxError*1000)});
  await evaluate('campTest.view(-1.35,.08,3.1);campTest.render()');
  const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(`.cache/gait-${running?'sprint':'walk'}.png`,Buffer.from(shot.data,'base64'));
 }
 await evaluate(`campTest.reset();for(let i=0;i<60;i++)campTest.advance(1/60,['KeyW']);for(let i=0;i<90;i++)campTest.advance(1/60,[])`);
 assert.ok((await evaluate('campTest.gait()')).weight<.001,'Releasing movement settles to idle');
 await evaluate(`campTest.advance(1/60,['Space']);for(let i=0;i<6;i++)campTest.advance(1/60,['KeyW'])`);
 assert.ok((await evaluate('campTest.gait()')).feet.every(f=>!f.contact),'Jump releases ground contacts');
 const turns=[];
 for(const running of [false,true]){
  const frames=await evaluate(`(()=>{campTest.reset();campTest.teleport(0,-95);const frames=[];for(let i=0;i<90;i++)campTest.advance(1/60,${running?"['KeyW','ShiftLeft']":"['KeyW']"});for(const key of ['KeyD','KeyS','KeyW','KeyA'])for(let i=0;i<30;i++){campTest.advance(1/60,[key${running?",'ShiftLeft'":""}]);frames.push(campTest.gait())}return frames})()`);
  for(const g of frames)for(let side=0;side<2;side++){
   const f=g.feet[side];assert.ok(f.x*(side===0?-1:1)>.025,'Turning feet stay on their own side');assert.ok(Math.abs(f.x)<.24&&Math.abs(f.z)<.42,'Turning feet stay within reach');
   assert.ok(g.rig.angles[side].knee>=0&&g.rig.angles[side].knee<2,'Turning knees keep a natural bend direction');
  }
  turns.push({mode:running?'sprint':'walk',frames:frames.length,maxLateralReach:Math.max(...frames.flatMap(g=>g.feet.map(f=>Math.abs(f.x))))});
 }
 const pivot=await evaluate(`(()=>{campTest.reset();campTest.teleport(0,-95);campTest.colonyFixture(campTest.colony().state,{weapon:true});campTest.toggleSword();for(let i=0;i<90;i++)campTest.advance(1/60);campTest.view(Math.PI);const frames=[];for(let i=0;i<90;i++){campTest.advance(1/60);frames.push(campTest.gait())}return frames})()`);
 assert.ok(pivot.some(g=>g.feet.some(f=>!f.contact&&f.y>.12)),'Turn in place lifts and replants feet');
 for(const g of pivot)for(let side=0;side<2;side++)assert.ok(g.feet[side].x*(side===0?-1:1)>.025,'Pivot feet do not cross');
 await evaluate(`campTest.reset();campTest.teleport(0,-95);campTest.colonyFixture(campTest.colony().state,{weapon:true});campTest.toggleSword();campTest.view(Math.PI);for(let i=0;i<8;i++)campTest.advance(1/60);campTest.view(campTest.gait().heading-1.35,.08,3.1);campTest.render()`);
 const pivotShot=await send('Page.captureScreenshot',{format:'png'});writeFileSync('.cache/gait-pivot.png',Buffer.from(pivotShot.data,'base64'));
 assert.deepEqual(errors,[],'No browser exceptions');console.log(JSON.stringify({passed:true,results,turns,pivotFrames:pivot.length},null,2));
}finally{ws.close()}

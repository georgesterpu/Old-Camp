import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
// Start a separate Firefox profile with --headless --remote-debugging-port 9224.
mkdirSync('.cache',{recursive:true});
const ws=new WebSocket('ws://127.0.0.1:9224/session');
await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
let id=0;const pending=new Map(),errors=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}else if(m.method==='log.entryAdded'&&m.params.type==='javascript'&&m.params.level==='error')errors.push(m.params.text)});
const send=(method,params={})=>new Promise((resolve,reject)=>{const i=++id;pending.set(i,m=>m.type==='error'?reject(Error(method+': '+m.message)):resolve(m.result));ws.send(JSON.stringify({id:i,method,params}));setTimeout(()=>{if(pending.delete(i))reject(Error('Timeout: '+method))},60000).unref()});
let session=false;
try{
 const info=await send('session.new',{capabilities:{}});session=true;
 await send('session.subscribe',{events:['log.entryAdded']});
 const context=(await send('browsingContext.getTree')).contexts[0].context;
 await send('browsingContext.setViewport',{context,viewport:{width:1280,height:800},devicePixelRatio:1});
 const evaluate=async expression=>{const r=await send('script.evaluate',{expression:`(async()=>JSON.stringify(await(${expression})))()`,target:{context},awaitPromise:true});if(r.type==='exception')throw Error(r.exceptionDetails.text);return JSON.parse(r.result.value)};
 const url=new URL('../old-camp.html?qa&still',import.meta.url).href;
 let loaded=false;
 async function load(recovery=false,reload=false){
  if(loaded||reload)await send('browsingContext.reload',{context,wait:'complete'});else await send('browsingContext.navigate',{context,url,wait:'complete'});loaded=true;
  for(let i=0;i<160;i++){if(await evaluate(recovery?`!!document.getElementById('boot-recovery')`:'!!window.campTest')){assert.deepEqual(await evaluate(`performance.getEntriesByType('resource').filter(e=>/^https?:/.test(e.name)).map(e=>e.name)`),[],'No network assets required');return}await new Promise(r=>setTimeout(r,150))}
  throw Error('Game did not reach '+(recovery?'recovery':'ready')+': '+JSON.stringify(await evaluate(`({url:location.href,loading:document.getElementById('loading')?.textContent,recovery:document.getElementById('boot-recovery')?.textContent,decoder:HTMLImageElement.prototype.decode.toString()})`)));
 }
 const results=[];
 await load();
 const textures=await evaluate('campTest.textures()');assert.equal(textures.length,16);
 assert.ok(textures.every(t=>t.ready&&!t.error&&t.source==='blob'),'Every surface decodes and uploads successfully');
 for(const high of [true,false]){
  const pixels=await evaluate(`(async()=>{if(!campDiagnostics().started)document.getElementById('enter').click();campTest.teleport(0,-70);campTest.view(0,.18,5);campTest.quality(${high});campTest.render();return {ground:await campTest.groundTexturePixels(),scene:await campTest.pixels()}})()`);
  assert.ok(pixels.ground.samples>0&&pixels.ground.redFraction<.01,'Ground contains real earth pixels, not a red checkerboard');
  assert.ok(pixels.scene.mean>2&&pixels.scene.max-pixels.scene.min>20,'Scene renders');
  const shot=await send('browsingContext.captureScreenshot',{context});writeFileSync(`.cache/firefox-ground-${high?'high':'balanced'}.png`,Buffer.from(shot.data,'base64'));
  results.push({quality:high?'high':'balanced',...pixels});
 }
 const once=await send('script.addPreloadScript',{contexts:[context],functionDeclaration:`()=>{const decode=HTMLImageElement.prototype.decode;let failed=false;HTMLImageElement.prototype.decode=function(){if(this.alt==='mud color'&&!failed){failed=true;return Promise.reject(Error('QA first decode failed'))}return decode.call(this)}}`});
 await load();const retried=await evaluate(`({texture:campTest.textures().find(t=>t.surface==='mud'&&t.kind==='color'),pixels:await campTest.groundTexturePixels()})`);
 assert.equal(retried.texture.attempts,2,'Failed ground decode retries');assert.equal(retried.texture.error,false);assert.ok(retried.pixels.redFraction<.01,'Retry restores original terrain pixels');
 await send('script.removePreloadScript',{script:once.script});
 const always=await send('script.addPreloadScript',{contexts:[context],functionDeclaration:`()=>{const decode=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=function(){if(this.alt==='mud color')return Promise.reject(Error('QA permanent decode failure'));return decode.call(this)}}`});
 await load(true);assert.equal(await evaluate('!!window.campTest'),false,'Unrecoverable texture failure cannot enter a broken game');
 assert.match(await evaluate(`document.getElementById('boot-recovery').textContent`),/Reload/);
 await send('script.removePreloadScript',{script:always.script});
 await load(false,true);assert.ok((await evaluate('campTest.textures()')).every(t=>t.ready&&!t.error));
 assert.equal(errors.filter(e=>!e.includes('Could not load embedded texture: mud color')).length,0,'No unexpected JavaScript errors');
 console.log(JSON.stringify({passed:true,browser:info.capabilities.browserVersion,results,retry:retried.texture.attempts,persistentFailure:'recovery shown'},null,2));
}finally{if(session)await send('session.end').catch(()=>{});ws.close()}

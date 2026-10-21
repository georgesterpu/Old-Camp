import { writeFileSync } from 'node:fs';
const pages=await (await fetch('http://127.0.0.1:9223/json/list')).json();
const page=pages.find(p=>p.type==='page'&&(p.url.includes('4317')||(p.url.includes('/old-camp.html')||p.url.includes('Play%20Old%20Camp.html'))));
if(!page)throw new Error('QA page missing');
const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}else if(m.method==='Runtime.exceptionThrown')console.log('BROWSER ERROR',JSON.stringify(m.params.exceptionDetails))});
const send=(method,params={})=>new Promise((resolve,reject)=>{const i=++id;pending.set(i,r=>r.error?reject(r.error):resolve(r.result));ws.send(JSON.stringify({id:i,method,params}));setTimeout(()=>{if(pending.has(i)){pending.delete(i);reject(new Error('CDP timeout '+method))}},60000).unref()});
await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
if(process.argv[2]?.startsWith('navigate:')){console.log(await send('Page.navigate',{url:process.argv[2].slice(9)}));ws.close();process.exit(0)}
if(process.argv[2]==='close-browser'){await send('Browser.close');process.exit(0)}
const expression=process.argv[2]||'({diagnostics:window.campDiagnostics?.(),loading:document.getElementById("loading").textContent,button:document.getElementById("enter").disabled})';
console.log(JSON.stringify(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}),null,2));
if(process.argv[3]){const screenshot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(process.argv[3],Buffer.from(screenshot.data,'base64'));console.log('Screenshot:',process.argv[3])}
ws.close();

export {};
let revision=Date.now();
const clients=new Map<object,unknown>();
const sockets=new Set<{send:(data:string)=>unknown}>();
const server=Bun.serve({port:4317,hostname:'127.0.0.1',async fetch(req,server){const path=new URL(req.url).pathname;if(path==='/live'){if(server.upgrade(req))return;return new Response('Upgrade required',{status:400})}if(path==='/health')return Response.json({ok:true,revision,clients:[...clients.values()]});return new Response(await Bun.file('old-camp.html').arrayBuffer(),{headers:{'Content-Type':'text/html','Cache-Control':'no-store'}})},websocket:{open(ws){sockets.add(ws);ws.send(String(revision))},close(ws){sockets.delete(ws);clients.delete(ws)},message(ws,message){try{const data=JSON.parse(String(message));clients.set(ws,{...data,lastSeen:Date.now()})}catch{}}}});
const {watch}=await import('node:fs');
let pending:ReturnType<typeof setTimeout>;
watch('.',(_event,filename)=>{if(filename!=='old-camp.html')return;clearTimeout(pending);pending=setTimeout(()=>{revision=Date.now();for(const ws of sockets)ws.send(String(revision))},150)});
console.log(`Live Old Camp: ${server.url}`);

import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const args=process.argv.slice(2),portIndex=args.indexOf('--port');
const port=Number(portIndex<0?9445:args[portIndex+1]);
if(args.some((arg,index)=>!['--port','--watch','--restore'].includes(arg)&&!(portIndex>=0&&index===portIndex+1))||args.filter(arg=>arg==='--port').length>1||args.includes('--restore')&&args.includes('--watch'))throw new Error('Unsupported arguments');
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid loopback port');
const restoring=args.includes('--restore'),watch=args.includes('--watch');
const payload=restoring?'window.__DRAGON_ATELIER__?.dispose(); ({active:false,restored:true})':
 await fs.readFile(fileURLToPath(new URL('../dist/dragon-atelier.js',import.meta.url)),'utf8');
const base=`http://127.0.0.1:${port}`;
async function boundedJson(path){
 const response=await fetch(base+path,{signal:AbortSignal.timeout(4000),redirect:'error'});
 if(!response.ok)throw new Error('CDP unavailable');
 const text=await response.text();if(text.length>262144)throw new Error('CDP metadata too large');
 return JSON.parse(text);
}
const version=await boundedJson('/json/version');
const browserUrl=new URL(version.webSocketDebuggerUrl);
if(browserUrl.protocol!=='ws:'||browserUrl.hostname!=='127.0.0.1'||Number(browserUrl.port)!==port||!browserUrl.pathname.startsWith('/devtools/browser/'))throw new Error('Unexpected debugger identity');
const browserId=browserUrl.pathname;
async function evaluate(target,expression){
 const url=new URL(target.webSocketDebuggerUrl);
 if(url.hostname!=='127.0.0.1'||Number(url.port)!==port||url.protocol!=='ws:'||url.pathname!==`/devtools/page/${target.id}`)throw new Error('Nonlocal CDP target rejected');
 const ws=new WebSocket(url);await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;setTimeout(()=>no(new Error('CDP open timeout')),5000).unref();});
 try {
  const result=await new Promise((ok,no)=>{
   const timer=setTimeout(()=>no(new Error('CDP evaluation timeout')),5000);
   ws.onmessage=event=>{const msg=JSON.parse(event.data);if(msg.id===1){clearTimeout(timer);if(msg.error)no(new Error(msg.error.message));else ok(msg.result);}};
   ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression,returnByValue:true,awaitPromise:true}}));
  });
  if(result.exceptionDetails)throw new Error('Renderer rejected theme');return result.result?.value;
 }finally{ws.close();}
}
let previous='';
async function apply(){
 const now=await boundedJson('/json/version');
 if(new URL(now.webSocketDebuggerUrl).pathname!==browserId)throw new Error('Browser changed; relaunch explicitly');
 const targets=await boundedJson('/json/list');
 const main=targets.filter(t=>t.type==='page'&&t.url==='app://-/index.html');
 if(!main.length)throw new Error('Official main renderer not found; no other page modified');
 for(const target of main){
  const status=await evaluate(target,restoring?payload:watch?
    `window.__DRAGON_ATELIER__ ? window.__DRAGON_ATELIER__.status : ${payload}`:payload);
  const line=JSON.stringify(status);if(line!==previous){console.log(line);previous=line;}
 }
}
await apply();
if(watch){
 let busy=false;
 const timer=setInterval(async()=>{if(busy)return;busy=true;try{await apply();}catch(e){clearInterval(timer);console.error(e.message);process.exitCode=1;}finally{busy=false;}},8000);
 const stop=async()=>{clearInterval(timer);process.exit(0);};
 process.on('SIGINT',stop);process.on('SIGTERM',stop);
}

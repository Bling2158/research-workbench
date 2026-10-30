// Optional stdio bridge for clients that cannot connect directly to remote HTTP MCP.
import readline from 'node:readline';
const url=process.env.WORKBENCH_MCP_URL,token=process.env.WORKBENCH_MCP_TOKEN;
if(!url||!token){console.error('Set WORKBENCH_MCP_URL and WORKBENCH_MCP_TOKEN.');process.exit(1)}
const rl=readline.createInterface({input:process.stdin});
for await(const line of rl){let request;try{request=JSON.parse(line);const r=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',Accept:'application/json, text/event-stream'},body:line,signal:AbortSignal.timeout(30000)});if(r.status===202)continue;if(!r.ok)throw Error('MCP HTTP '+r.status);process.stdout.write(JSON.stringify(await r.json())+'\n')}catch(e){if(request?.id!==undefined)process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:request.id,error:{code:-32603,message:e.message}})+'\n');else console.error(e.message)}}

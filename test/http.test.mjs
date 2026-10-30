import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {makeHandler} from '../lib/http.mjs';
import {emptyState} from '../lib/store.mjs';
test('authenticated HTTP flow, privacy, deletion, idempotency and origin checks',async()=>{const original={...process.env};process.env.WORKBENCH_ACCESS_TOKEN='a'.repeat(40);process.env.MCP_CODEX_TOKEN='c'.repeat(40);process.env.DEEPSEEK_API_KEY='mock';let s=emptyState(),invocations=0;const store={read:async()=>structuredClone(s),update:async fn=>{const copy=structuredClone(s),r=await fn(copy);s=copy;return r}};const handler=makeHandler({store,agent:async()=>{invocations++;return {text:'模拟供应商返回',usage:[],receipts:[]}}});const server=http.createServer(handler);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 async function request(route,data,token='a'.repeat(40),extra={}){const r=await fetch(base+route,{method:data?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...extra},body:data?JSON.stringify(data):undefined});return {status:r.status,data:await r.json()}}
 try{assert.equal((await request('/api/state',null,'invalid')).status,401);assert.equal((await request('/api/state',null,'c'.repeat(40))).status,403);assert.equal((await request('/api/state',null,undefined,{Origin:'https://evil.example'})).status,403);
 const session=(await request('/api/session',{title:'新对话'})).data;const payload={sessionId:session.id,model:'deepseek-flash',effort:'high',message:'今天开心',requestId:'req1'};assert.equal((await request('/api/chat',payload)).status,200);assert.equal((await request('/api/chat',payload)).data.duplicate,true);assert.equal(invocations,1);
 const personal=(await request('/api/record',{text:'秘密生活',scope:'personal'})).data;assert.equal((await request('/mcp',{jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'get_research_context'}},'c'.repeat(40))).data.result.content[0].text.includes('秘密生活'),false);
 assert.equal((await request('/api/edit-record',{id:personal.id,version:0,text:'不能覆盖'})).status,409);
 assert.equal((await request('/api/delete',{id:personal.id,type:'record'})).status,200);assert(!JSON.stringify((await request('/api/export')).data).includes('秘密生活'));
 assert.equal((await request('/api/record',{text:'测试',scope:'personal',image:{mime:'image/png',data:'aGVsbG8='}})).status,400);
 await request('/api/delete',{id:session.id,type:'session'});assert.equal((await request('/api/session/'+session.id)).status,404);
 }finally{await new Promise(r=>server.close(r));for(const k of Object.keys(process.env))if(!(k in original))delete process.env[k];Object.assign(process.env,original)}});

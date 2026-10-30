import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
export const emptyState=()=>({version:0,projects:[],records:[],sessions:[],proposals:[],events:[],usage:{}});
export class Conflict extends Error { constructor(){super('数据已被另一窗口更新，请刷新后重试。');this.status=409} }
export function apiHeaders(key){return {apikey:key,...(key?.startsWith('eyJ')?{Authorization:`Bearer ${key}`} : {}),'Content-Type':'application/json'}}
export class Store {
 constructor({dir=process.env.DATA_DIR||'.data',url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY}={}){this.dir=path.resolve(dir);this.url=url;this.key=key;this.queue=Promise.resolve();if(process.env.VERCEL&&(!url||!key))throw new Error('云端必须配置 Supabase，禁止使用临时文件存储。')}
 async remote(route,body){const r=await fetch(`${this.url}/rest/v1/${route}`,{method:body?'POST':'GET',headers:apiHeaders(this.key),body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error('云端存储失败，请检查 Supabase 配置。');return r.json()}
 async read(){if(this.url){const rows=await this.remote('workbench_state?id=eq.main&select=payload');if(!rows.length)throw new Error('请先执行 schema.sql 初始化云端数据库。');return rows[0].payload}try{return JSON.parse(await readFile(path.join(this.dir,'state.json'),'utf8'))}catch(e){if(e.code==='ENOENT')return emptyState();throw e}}
 async revision(){if(this.url){const rows=await this.remote('workbench_state?id=eq.main&select=version:payload->version');return rows[0]?.version}return (await this.read()).version}
 async update(fn){const work=async()=>{const s=await this.read(),v=s.version;const result=await fn(s);s.version=v+1;const encoded=JSON.stringify(s);if(Buffer.byteLength(encoded)>(this.url?3000000:20000000)){const e=new Error('当前版本档案容量已达保护上限，请先导出；需要扩展分表存储后再继续添加。');e.status=413;throw e}if(this.url){const ok=await this.remote('rpc/save_workbench',{expected_version:v,next_payload:s});if(!ok)throw new Conflict()}else{await mkdir(this.dir,{recursive:true});const file=path.join(this.dir,'state.json'),tmp=file+'.tmp';await writeFile(tmp,encoded,{mode:0o600});await rename(tmp,file)}return result};const p=this.queue.then(work);this.queue=p.catch(()=>{});return p}
}

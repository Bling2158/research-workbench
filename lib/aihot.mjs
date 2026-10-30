import {fail} from './domain.mjs';
// Read-only proxy for the owner's AI 资讯 page. AIHOT allows anonymous personal use; the CSP keeps the
// browser on our own origin, so the server fetches and briefly caches the JSON API.
const BASE='https://aihot.news/api/v1/',TTL=5*60000;
const ROUTES={latest:'items',hot:'hot-topics',daily:'dailies/latest',weekly:'weeklies/latest',monthly:'monthlies/latest'};
const CATEGORIES=['ai-models','ai-products','industry','paper','tip','opinion'];
const cache=new Map();
export async function aihotFeed(kind,params={},fetcher=fetch){const path=ROUTES[kind];if(!path)fail('未知的资讯栏目');const q=new URLSearchParams();
 if(kind==='latest'){q.set('mode',params.mode==='all'?'all':'selected');q.set('window',params.window==='7d'?'7d':'24h');if(CATEGORIES.includes(params.category))q.set('category',params.category);q.set('limit','20');if(typeof params.cursor==='string'&&/^[\w.-]{1,600}$/.test(params.cursor))q.set('cursor',params.cursor)}
 const key=path+'?'+q,hit=cache.get(key);if(hit&&Date.now()-hit.time<TTL)return hit.data;
 let r;try{r=await fetcher(BASE+key,{headers:{'User-Agent':'aihot-api/2.0.0',Accept:'application/json'},signal:AbortSignal.timeout(15000)})}catch{fail('AIHOT 暂时连不上，请稍后再试。',502)}
 if(r.status===429)fail('AIHOT 请求太频繁，请稍等一分钟。',429);if(!r.ok)fail(`AIHOT 暂时不可用（${r.status}）。`,502);
 const data=await r.json();if(cache.size>60)cache.delete(cache.keys().next().value);cache.set(key,{time:Date.now(),data});return data}

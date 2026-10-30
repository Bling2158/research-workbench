import {fail,search} from './domain.mjs';
// Layered, compact reads for AI agents: a one-screen overview first, details only on request.
// Research scope only; personal records and anything marked aiReadable:false never leave here.
const DAY=86400000;
const day=t=>t?String(t).slice(0,10):undefined;
const snip=(t,n)=>{t=String(t||'').replace(/\s+/g,' ').trim();return t.length>n?t.slice(0,n)+'…':t};
// Drop empty fields so agents read signal, not blanks.
const compact=o=>Object.fromEntries(Object.entries(o).filter(([,v])=>v!==undefined&&v!==null&&v!==''&&!(Array.isArray(v)&&!v.length)));
const readable=s=>s.records.filter(r=>r.scope==='research'&&r.aiReadable!==false);
const ACTIVE=['已投稿','在审','编辑处理中','外审中','返修中','已接收'];
// Imported decision logs ("历史待判断事项｜…" with 键：值 lines) reduced to what a reader needs.
export function decisionOf(r){if(!/^历史待判断事项｜/.test(r.text)&&r.source?.collection!=='decisions')return null;const lines=r.text.split('\n'),get=k=>lines.find(l=>l.startsWith(k+'：'))?.slice(k.length+1).trim();return compact({id:r.id,title:lines[0].replace(/^历史待判断事项｜/,''),status:get('原状态')||'待判断',question:get('问题'),decision:get('决定'),snoozed_until:get('暂缓至'),date:day(r.updatedAt)})}
const isOpen=d=>!['已决定','不再需要'].includes(d.status);
const projectName=(s,id)=>s.projects.find(p=>p.id===id)?.name;
const noteRow=(s,r,n)=>compact({id:r.id,project:projectName(s,r.projectId),date:day(r.updatedAt),kind:r.kind==='memory'?'长期约定':undefined,text:snip(r.text,n)});
const paperRow=p=>compact({id:p.id,title:snip(p.title,90),status:p.status,journal:p.journal,due:p.dueDate});

export function researchOverview(s,now=Date.now()){const recs=readable(s),papers=s.submissions||[],soon=new Date(now+30*DAY).toISOString().slice(0,10),since=now-7*DAY;
 const decisions=recs.map(r=>[r,decisionOf(r)]).filter(([,d])=>d);
 return {date:new Date(now).toISOString().slice(0,10),
  projects:s.projects.map(p=>compact({id:p.id,version:p.version,name:p.name,stage:p.stage,next:snip(p.nextAction,140),updated:day(p.updatedAt),open_decisions:decisions.filter(([r,d])=>r.projectId===p.id&&isOpen(d)).length||undefined,notes:recs.filter(r=>r.projectId===p.id&&!decisionOf(r)).length||undefined})),
  papers:{total:papers.length,published:papers.filter(p=>p.status==='已发表').length,in_progress:papers.filter(p=>ACTIVE.includes(p.status)).map(paperRow)},
  deadlines:papers.filter(p=>p.dueDate&&p.dueDate<=soon&&ACTIVE.concat('准备投稿').includes(p.status)).map(paperRow),
  open_decisions:decisions.filter(([,d])=>isOpen(d)).map(([r,d])=>compact({id:d.id,project:projectName(s,r.projectId),title:d.title,snoozed_until:d.snoozed_until})),
  recent_7d:recs.filter(r=>Date.parse(r.updatedAt)>=since).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0,6).map(r=>{const d=decisionOf(r);return d?compact({id:r.id,project:projectName(s,r.projectId),date:day(r.updatedAt),kind:'决策',text:`${d.title}（${d.status}）`}):noteRow(s,r,90)}),
  next_step:'要细节调用 get_project（某个项目 id，或 all 读取全部）；按关键词找记录用 search_records；读单条全文用 get_record；了解某日之后的变化用 get_changes。'}}

export function projectDetail(s,a={}){const id=a.project_id,notesLimit=Math.min(Math.max(Number(a.notes_limit)||8,0),30),list=id==='all'?s.projects:s.projects.filter(p=>p.id===id);if(!list.length)fail('项目不存在，请先用 get_overview 查看项目 id',404);
 const recs=readable(s),papers=s.submissions||[];
 const one=p=>{const mine=recs.filter(r=>r.projectId===p.id).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))),notes=mine.filter(r=>!decisionOf(r));return compact({id:p.id,version:p.version,name:p.name,stage:p.stage,question:p.question,goal:p.goal,progress:p.progress,completed:p.completed,next_action:p.nextAction,updated:day(p.updatedAt),decisions:mine.map(decisionOf).filter(Boolean),notes_total:notes.length,recent_notes:notes.slice(0,notesLimit).map(r=>noteRow(s,r,240)),papers:papers.filter(x=>x.projectId===p.id).map(paperRow)})};
 return id==='all'?{projects:list.map(one),note:'记录只给前 240 字摘要；需要全文用 get_record。'}:{project:one(list[0])}}

export function searchRecords(s,a={}){const q=String(a.query||'').trim();if(!q)fail('请提供检索词');const limit=Math.min(Math.max(Number(a.limit)||8,1),10),since=a.since?Date.parse(a.since):0;
 let pool=readable(s).filter(r=>(!a.project_id||r.projectId===a.project_id)&&(!since||Date.parse(r.updatedAt)>=since));
 const terms=q.toLowerCase().split(/[\s,，、;；]+/).filter(Boolean),hay=r=>(r.text+' '+(projectName(s,r.projectId)||'')).toLowerCase();
 let hits=pool.map(r=>({r,score:terms.reduce((n,t)=>n+(hay(r).includes(t)?10+hay(r).split(t).length-2:0),0)})).filter(x=>x.score>0).sort((x,y)=>y.score-x.score).map(x=>x.r);
 // Chinese queries have no spaces to split on, so fall back to character-pair matching over the record text only.
 if(!hits.length&&/[一-鿿]/.test(q)){const ids=new Set(search(pool.map(r=>({id:r.id,text:r.text})),q,limit).map(x=>x.id));hits=pool.filter(r=>ids.has(r.id))}
 return {query:q,results:hits.slice(0,limit).map(r=>{const t=r.text,i=Math.max(0,t.toLowerCase().indexOf(terms[0])),start=Math.max(0,i-60);return compact({id:r.id,project:projectName(s,r.projectId),date:day(r.updatedAt),kind:decisionOf(r)?'决策':r.kind==='memory'?'长期约定':undefined,text:(start?'…':'')+snip(t.slice(start),200)})}),note:'这是摘要；需要全文用 get_record。'}}

export function getRecord(s,a={}){const r=readable(s).find(x=>x.id===a.record_id);if(!r)fail('记录不存在或不在科研范围内',404);return {record:compact({id:r.id,project:projectName(s,r.projectId),date:day(r.updatedAt),kind:r.kind==='memory'?'长期约定':undefined,decision:decisionOf(r)||undefined,text:r.text})}}

export function changesSince(s,a={}){const t=Date.parse(a.since);if(!Number.isFinite(t))fail('since 需要日期，例如 2026-10-25');const after=x=>x&&Date.parse(x)>=t,recs=readable(s);
 return compact({since:day(new Date(t).toISOString()),projects:s.projects.filter(p=>after(p.updatedAt)).map(p=>compact({id:p.id,name:p.name,stage:p.stage,next:snip(p.nextAction,140),updated:day(p.updatedAt)})),
  new_notes:recs.filter(r=>after(r.createdAt)&&!decisionOf(r)).slice(-15).map(r=>noteRow(s,r,140)),
  // decision logs are summarised below, never as raw text
  decisions:recs.filter(r=>after(r.updatedAt)).map(decisionOf).filter(Boolean),
  papers:(s.submissions||[]).filter(p=>after(p.updatedAt)||(p.history||[]).some(h=>after(h.time))).map(paperRow),
  note:'只列出变化；细节用 get_project 或 get_record。'})}

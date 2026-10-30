import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState} from '../lib/store.mjs';
import {addRecord,saveProject} from '../lib/domain.mjs';
import {researchOverview,projectDetail,searchRecords,getRecord,changesSince} from '../lib/research-read.mjs';
import {rpc} from '../lib/mcp.mjs';
function fixture(){const s=emptyState(),a=saveProject(s,{name:'Delta 示例项目'}),b=saveProject(s,{name:'示例项目乙'});a.nextAction='审阅主图';
 addRecord(s,{text:'Delta 图件需要补数据来源',scope:'research',projectId:a.id});addRecord(s,{text:'示例乙的流域分析完成',scope:'research',projectId:b.id});
 addRecord(s,{text:'历史待判断事项｜确认样本口径\n问题：是否用全样本？\n原状态：待判断\nsourceHash: abc',scope:'research',projectId:a.id});
 addRecord(s,{text:'秘密日记 Delta',scope:'personal'});const hidden=addRecord(s,{text:'不给AI看的 Delta',scope:'research',projectId:a.id});hidden.aiReadable=false;
 s.submissions=[{id:'p1',version:1,title:'Paper',status:'外审中',journal:'J',dueDate:'2026-11-05',projectId:b.id,history:[]}];return {s,a,b}}
test('overview is compact, carries versions and open decisions, and never leaks personal or hidden records',()=>{const {s,a}=fixture(),o=researchOverview(s,Date.parse('2026-10-30'));const text=JSON.stringify(o);
 assert(!text.includes('秘密日记')&&!text.includes('不给AI看'));assert.equal(o.projects.find(p=>p.id===a.id).version,1);assert.equal(o.projects.find(p=>p.id===a.id).open_decisions,1);assert.equal(o.deadlines[0].id,'p1');assert(!text.includes('sourceHash'));assert(!/"question":""/.test(text))});
test('get_project returns one project or all, with decisions reduced to question/status',()=>{const {s,a}=fixture(),one=projectDetail(s,{project_id:a.id}).project;assert.equal(one.decisions[0].question,'是否用全样本？');assert.equal(one.notes_total,1);assert.equal(projectDetail(s,{project_id:'all'}).projects.length,2);assert.throws(()=>projectDetail(s,{project_id:'nope'}),/不存在/)});
test('search_records matches whole terms within a project and stays in research scope',()=>{const {s,b}=fixture();const all=searchRecords(s,{query:'Delta'}).results;assert.equal(all.length,2);assert(all.every(r=>r.project==='Delta 示例项目'));assert.equal(searchRecords(s,{query:'Delta',project_id:b.id}).results.length,0);assert.throws(()=>getRecord(s,{record_id:s.records.find(r=>r.scope==='personal').id}),/不存在/)});
test('changes feed lists only what moved after the date',()=>{const {s}=fixture();const c=changesSince(s,{since:'2000-01-01'});assert.equal(c.projects.length,2);assert.equal(c.new_notes.length,2);assert.throws(()=>changesSince(s,{since:'x'}),/since/)});
test('MCP sends a reading guide on connect and keeps the old tool name as the overview',async()=>{const {s}=fixture(),store={read:async()=>s};const init=await rpc(store,{jsonrpc:'2.0',id:1,method:'initialize',params:{}},'claude');assert.match(init.result.instructions,/get_overview/);const old=await rpc(store,{jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'get_research_context'}},'claude');assert(JSON.parse(old.result.content[0].text).next_step);const list=await rpc(store,{jsonrpc:'2.0',id:3,method:'tools/list'},'claude');for(const n of ['get_overview','get_project','search_records','get_record','get_changes'])assert(list.result.tools.some(t=>t.name===n&&t.annotations.readOnlyHint))});

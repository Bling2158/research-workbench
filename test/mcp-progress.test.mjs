import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState} from '../lib/store.mjs';
import {saveProject,updateProjectProgress} from '../lib/domain.mjs';
test('MCP progress writes immediately, preserves question, prevents stale overwrite and duplicate notes',()=>{const s=emptyState(),p=saveProject(s,{name:'test'});p.question='用户更正的问题';const a={project_id:p.id,expected_version:1,request_id:'operation-1',progress:'完成数据核对',stage:'数据处理',next_action:'分析结果'};const result=updateProjectProgress(s,a,'codex');assert.equal(result.status,'saved');assert.equal(p.progress,a.progress);assert.equal(p.question,'用户更正的问题');assert.equal(s.records.length,1);assert.equal(s.proposals.length,0);assert.equal(updateProjectProgress(s,a,'codex').duplicate,true);assert.equal(s.records.length,1);assert.throws(()=>updateProjectProgress(s,{...a,request_id:'operation-2'},'codex'),/版本/);assert.throws(()=>updateProjectProgress(s,{...a,progress:'different'},'codex'),/不同内容/)});

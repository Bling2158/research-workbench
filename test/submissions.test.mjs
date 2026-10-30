import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState} from '../lib/store.mjs';
import {saveSubmission,deleteSubmission} from '../lib/submissions.mjs';
test('submission creates and updates with status history, preserves other records',()=>{const s=emptyState();s.records.push({id:'keep',text:'unrelated'});const a=saveSubmission(s,{title:'Paper A',journal:'Journal',status:'已投稿',submittedAt:'2026-10-29'});const b=saveSubmission(s,{id:a.id,version:1,title:'Paper A revised',journal:'Journal',status:'返修中',dueDate:'2026-12-01'});assert.equal(a.id,b.id);assert.equal(b.history.length,2);assert.equal(b.version,2);assert.throws(()=>saveSubmission(s,{id:a.id,version:1,title:'stale',status:'已接收'}),/另一窗口/);deleteSubmission(s,a.id);assert.equal(s.submissions.length,0);assert.equal(s.records[0].id,'keep')});
test('submission rejects invalid dates, status and missing title',()=>{const s=emptyState();for(const fields of [{title:''},{title:'x',dueDate:'2026-02-30'},{title:'x',status:'自动接收'},{title:'x',projectId:'missing'}])assert.throws(()=>saveSubmission(s,fields));assert.equal(s.submissions?.length||0,0)});

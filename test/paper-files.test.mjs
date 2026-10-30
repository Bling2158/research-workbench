import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState} from '../lib/store.mjs';
import {saveSubmission,deleteSubmission} from '../lib/submissions.mjs';
import {cleanupPaperFiles,activePaperFiles} from '../lib/paper-files.mjs';
import {usageStatus} from '../lib/media.mjs';
test('verified publication dates editable without changing manuscript status or attachments',()=>{const s=emptyState();const p=saveSubmission(s,{title:'paper',status:'已发表'});p.pdfs=[{id:'pdf1',bytes:123}];const updated=saveSubmission(s,{id:p.id,version:1,title:'paper',status:'已发表',receivedAt:'2025-02-06',revisedAt:'2025-07-14',acceptedAt:'2025-08-17',publishedOnlineAt:'2025-08-18'});assert.equal(updated.status,'已发表');assert.equal(updated.submittedAt,'');assert.equal(updated.acceptedAt,'2025-08-17');assert.equal(updated.pdfs.length,1);assert.throws(()=>saveSubmission(s,{id:p.id,version:2,title:'paper',status:'已发表',receivedAt:'2025-02-30'}),/日期/)});
test('PDF usage counted and deletion cleanup removes unreferenced files only',async()=>{const s=emptyState();const a={id:'a',bytes:200},b={id:'b',bytes:300};s.pdfFiles=[a,b];s.submissions=[{id:'p',pdfs:[a]}];assert.equal(usageStatus(s,true).items[1].used,500);const store={read:async()=>s,update:async f=>f(s)};await cleanupPaperFiles(store);assert.deepEqual(s.pdfFiles,[a]);deleteSubmission(s,'p');await cleanupPaperFiles(store);assert.equal(activePaperFiles(s).length,0);assert.equal(s.pdfFiles.length,0)});

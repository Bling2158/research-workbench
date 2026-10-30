// Demo mode: fictional data, no API keys, no database. Run `npm run demo` and open the printed address.
import {mkdir,writeFile,access} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const dir='.data-demo',file=dir+'/state.json';
process.env.DATA_DIR=dir;process.env.WORKBENCH_ACCESS_TOKEN='demo-access-token-for-local-preview-only-000';
for(const k of Object.keys(process.env))if(k.startsWith('SUPABASE_')||k.endsWith('_API_KEY'))delete process.env[k];
const ago=d=>new Date(Date.now()-d*86400000).toISOString(),ahead=d=>new Date(Date.now()+d*86400000).toISOString().slice(0,10);
const project=(id,name,stage,d,extra={})=>({id,version:1,name,stage,updatedAt:ago(d),...extra});
const note=(text,projectId,d,extra={})=>({id:randomUUID(),text,scope:'research',projectId,kind:'note',version:1,createdAt:ago(d),updatedAt:ago(d),source:'user',attachments:[],...extra});
const paper=(id,title,journal,status,extra={})=>({id,version:1,title,journal,status,manuscriptId:'',submittedAt:'',dueDate:'',notes:'',projectId:null,updatedAt:ago(3),history:[],...extra});
const state={version:1,usage:{},events:[],proposals:[],sessions:[],
 projects:[project('demo-a','示例 A：城市热岛的遥感分析','数据处理',1,{question:'城市扩张如何改变夜间热岛强度？',nextAction:'完成 2015–2025 年地表温度时序的季节分解。'}),
  project('demo-b','示例 B：河流泥沙输移模拟','写论文',4,{question:'极端降雨后泥沙通量的恢复需要多久？',nextAction:'整理讨论部分，补充与已有观测的对比。'}),
  project('demo-c','示例 C：文献综述','暂停',20,{nextAction:'等确定核心问题后再继续。'}),
  project('demo-d','示例 D：已完成的课程项目','完成',200)],
 records:[note('季节分解后残差仍有年周期，需要检查参考站点。','demo-a',0),
  note('讨论部分初稿完成，图 4 的配色需要统一。','demo-b',2),
  note('历史待判断事项｜确定主分析方案\n问题：主分析采用方案 A 还是方案 B？\n原状态：待判断','demo-a',6),
  note('长期约定：所有图件使用无衬线字体，色带用色盲友好配色。',null,9,{kind:'memory'})],
 submissions:[paper('demo-p1','An example study of urban heat islands','Example Journal of Remote Sensing','返修中',{dueDate:ahead(5),projectId:'demo-a'}),
  paper('demo-p2','A sediment transport example','Example Hydrology Letters','外审中',{projectId:'demo-b'}),
  paper('demo-p3','An earlier published example','Example Earth Science','已发表',{year:new Date().getFullYear()})]};
await mkdir(dir,{recursive:true});
try{await access(file)}catch{await writeFile(file,JSON.stringify(state))}
console.log('Demo data in .data-demo/ (fictional). Open: http://127.0.0.1:'+(process.env.PORT||8787)+'/#access='+process.env.WORKBENCH_ACCESS_TOKEN);
await import('../server.mjs');

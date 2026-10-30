import http from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {makeHandler,security} from './lib/http.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));process.chdir(root);
if(!process.env.WORKBENCH_ACCESS_TOKEN){await mkdir('.data',{recursive:true});try{process.env.WORKBENCH_ACCESS_TOKEN=await readFile('.data/access-token','utf8')}catch(e){if(e.code!=='ENOENT')throw e;process.env.WORKBENCH_ACCESS_TOKEN=randomBytes(32).toString('hex');await writeFile('.data/access-token',process.env.WORKBENCH_ACCESS_TOKEN,{mode:0o600})}}
const port=Number(process.env.PORT||8787),handler=makeHandler();
const assets={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/views.js':'views.js','/mark.svg':'mark.svg','/config.js':'config.js'};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{const route=new URL(req.url,'http://localhost').pathname;if(!['127.0.0.1:'+port,'localhost:'+port].includes(req.headers.host)){res.writeHead(403);return res.end('Host not allowed')}if(route.startsWith('/api/')||route==='/mcp')return handler(req,res);security(res);if(req.method!=='GET'||!assets[route]){res.writeHead(404);return res.end()}try{const file=assets[route];res.setHeader('Content-Type',types[path.extname(file)]);res.end(await readFile(path.join(root,'public',file)))}catch{res.writeHead(500);res.end('Unable to load page')}});
server.listen(port,'127.0.0.1',()=>{console.log(`Workbench: http://127.0.0.1:${port}`);console.log('Local access token is stored in .data/access-token. No credentials are printed.');if(process.argv.includes('--open')&&process.platform==='win32'){const url=`http://127.0.0.1:${port}/#access=${process.env.WORKBENCH_ACCESS_TOKEN}`;spawn('powershell.exe',['-NoProfile','-WindowStyle','Hidden','-Command',`Start-Process '${url}'`],{windowsHide:true,stdio:'ignore'})}});

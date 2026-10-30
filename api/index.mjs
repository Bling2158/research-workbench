import {makeHandler,send} from '../lib/http.mjs';
let handler;
export default async function(req,res){try{handler??=makeHandler();return await handler(req,res)}catch{send(res,503,{error:'云端存储尚未配置，请先完成部署设置。'})}}

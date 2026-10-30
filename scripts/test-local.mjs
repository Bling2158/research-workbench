import {spawn} from 'node:child_process';
const env={...process.env};
for(const key of Object.keys(env))if(key.startsWith('VERCEL')||key.startsWith('SUPABASE_')||key.endsWith('_API_KEY')||key.endsWith('_TOKEN')||key==='APP_ORIGIN'||key==='DATA_DIR')delete env[key];
const child=spawn(process.execPath,['--test','test/*.test.mjs'],{stdio:'inherit',env});
child.on('error',()=>process.exit(1));child.on('exit',code=>process.exit(code??1));

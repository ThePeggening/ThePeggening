import {serve} from './server.mjs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const app=await serve(root,{port:Number(process.env.PORT||8080),host:process.env.HOST||'127.0.0.1'});
console.log(`PCOCK: ${app.url} (Ctrl+C to stop)`);

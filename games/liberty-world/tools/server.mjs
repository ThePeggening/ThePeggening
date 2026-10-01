import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.glb':'model/gltf-binary','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.otf':'font/otf','.ttf':'font/ttf','.woff2':'font/woff2','.md':'text/plain; charset=utf-8'};
export async function serve(root,{port=0,prefix='/pcock/',host='127.0.0.1'}={}){
  root=path.resolve(root);const server=http.createServer(async(req,res)=>{
    try{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name==='/')name=prefix;if(!name.startsWith(prefix)){res.writeHead(404).end();return;}
      name=name.slice(prefix.length)||'index.html';const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
      const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(bytes);
    }catch{res.writeHead(404).end('Not found');}
  });await new Promise(resolve=>server.listen(port,host,resolve));
  return {server,url:`http://127.0.0.1:${server.address().port}${prefix}`,close:()=>new Promise(resolve=>server.close(resolve))};
}

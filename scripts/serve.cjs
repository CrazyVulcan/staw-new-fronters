const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.ttf':'font/ttf','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
  if(name==='/')name='/index.html';
  const file=['src','public'].map(dir=>path.resolve(root,dir,'.'+name)).find(f=>(f.startsWith(path.join(root,'src')+path.sep)||f.startsWith(path.join(root,'public')+path.sep))&&fs.existsSync(f)&&fs.statSync(f).isFile());
  if(!file){res.writeHead(404);return res.end('Not found');}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(file).pipe(res);
}).listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log('Fleet builder: http://127.0.0.1:'+(process.env.PORT||4173)));

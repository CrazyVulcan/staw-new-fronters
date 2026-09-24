// Deterministic TTS-sheet extraction: card ID -> deck cell -> local WebP.
const fs=require('fs'),p=require('path'),crypto=require('crypto');
const sharp=require(process.env.STAW_NODE_MODULES?p.join(process.env.STAW_NODE_MODULES,'sharp'):'sharp');
const root=p.resolve(__dirname,'..'),routes=JSON.parse(fs.readFileSync(p.join(root,'public/data/tts-routes.json'),'utf8'));
const cache=p.join(root,'.asset-cache');fs.mkdirSync(cache,{recursive:true});fs.mkdirSync(p.join(root,'public/cards'),{recursive:true});
async function walk(dir){const out=[];for(const x of fs.readdirSync(dir,{withFileTypes:true})){if(x.name==='staw-new-frontiers')continue;const f=p.join(dir,x.name);if(x.isDirectory())out.push(...await walk(f));else if(/\.(png|jpg|jpeg)$/i.test(f))out.push(f);}return out;}
async function hash(f){const h=crypto.createHash('sha1');for await(const c of fs.createReadStream(f))h.update(c);return h.digest('hex').toUpperCase();}
(async()=>{
 const byFace=Map.groupBy(Object.entries(routes),([key,r])=>r.face);
 const needed=new Set([...byFace.keys()].map(u=>u.split('/').filter(Boolean).at(-1).toUpperCase()));const local=new Map();
 if(process.argv[2])for(const f of await walk(process.argv[2])){const h=await hash(f);if(needed.has(h))local.set(h,f);}
 console.log('Matched local source images:',local.size,'/',byFace.size);
 const failures=[];let done=0;
 for(const [url,entries] of byFace){
  try{
   const sha=url.split('/').filter(Boolean).at(-1).toUpperCase();let file=local.get(sha)||p.join(cache,crypto.createHash('sha256').update(url).digest('hex'));
   if(!fs.existsSync(file)){const response=await fetch(url,{signal:AbortSignal.timeout(90000)});if(!response.ok)throw Error('HTTP '+response.status);fs.writeFileSync(file,Buffer.from(await response.arrayBuffer()));}
   const meta=await sharp(file).metadata();const r=entries[0][1];
   for(const [key,route]of entries){
    const left=Math.round((route.index%route.width)*meta.width/route.width),top=Math.round(Math.floor(route.index/route.width)*meta.height/route.height);
    const right=Math.round(((route.index%route.width)+1)*meta.width/route.width),bottom=Math.round((Math.floor(route.index/route.width)+1)*meta.height/route.height);
    const name=key.replace(':','-')+'.webp';
    await sharp(file).extract({left,top,width:right-left,height:bottom-top}).resize({width:500,withoutEnlargement:true}).webp({quality:86}).toFile(p.join(root,'public/cards',name));
    route.localImage='cards/'+name;route.aspect=(right-left)/(bottom-top);
   }
   console.log('Images',++done,'/',byFace.size,entries.length,'cards');
  }catch(e){failures.push({url,error:e.message});console.log('Failed:',e.message);}
 }
 fs.writeFileSync(p.join(root,'public/data/tts-routes.json'),JSON.stringify(routes,null,2));
 fs.writeFileSync(p.join(root,'public/data/image-audit.json'),JSON.stringify({images:Object.values(routes).filter(r=>r.localImage).length,failures},null,2));
 if(failures.length)process.exitCode=1;
})();

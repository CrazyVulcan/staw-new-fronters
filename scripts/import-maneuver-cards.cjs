const fs=require('fs'),path=require('path'),crypto=require('crypto'),childProcess=require('child_process');

(async()=>{

const root=path.resolve(__dirname,'..');
const source=process.argv[2];
if(!source)throw Error('Usage: node scripts/import-maneuver-cards.cjs "path/to/Maneuver Cards.json"');

const saved=JSON.parse(fs.readFileSync(path.resolve(source),'utf8'));
const data=JSON.parse(fs.readFileSync(path.join(root,'public/data/data.json'),'utf8'));
const deck=(saved.ObjectStates||[]).find(object=>Array.isArray(object.ContainedObjects));
if(!deck)throw Error('The supplied saved object does not contain a card deck.');

const normalize=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
const aliases={
  'Cardassian Keldon Class':'Keldon Class',
  'Breen Battle Cruiser':'Breen Battle Cruiser Class',
  'Nor Class Orbital Space Station':'Nor Class',
  'Romulan Bird-of-Prey Class':'Romulan Bird-of-Prey',
  'Galaxy Class (MU)':'Galaxy Class'
};
const references=(deck.ContainedObjects||[]).map(card=>{
  const custom=Object.values(card.CustomDeck||{})[0]||deck.CustomDeck?.[String(Math.floor(Number(card.CardID)/100))];
  if(!custom?.FaceURL)return null;
  return {
    name:String(card.Nickname||'').trim(),
    sourceShipId:String(card.Description||'').trim()||null,
    face:custom.FaceURL,
    back:custom.BackURL||null
  };
}).filter(Boolean);

const shipsByClass=new Map();
for(const ship of data.ships||[]){if(!shipsByClass.has(ship.class))shipsByClass.set(ship.class,[]);shipsByClass.get(ship.class).push(ship);}
const classData=new Map((data.shipClasses||[]).map(entry=>[entry.name,entry]));
const classes={};
for(const className of [...shipsByClass.keys()].sort((a,b)=>a.localeCompare(b))){
  const shipIds=new Set(shipsByClass.get(className).map(ship=>ship.id));
  const target=normalize(aliases[className]||className);
  const cards=references.filter(card=>shipIds.has(card.sourceShipId)||normalize(card.name)===target);
  const unique=cards.filter((card,index,list)=>list.findIndex(other=>other.face===card.face&&other.sourceShipId===card.sourceShipId)===index);
  classes[className]={maneuvers:classData.get(className)?.maneuvers||null,cards:unique};
}

const assetDirectory=path.join(root,'public/maneuvers');
fs.mkdirSync(assetDirectory,{recursive:true});
for(const reference of references){
  const extension=path.extname(new URL(reference.face).pathname).toLowerCase()||'.jpg';
  const hash=crypto.createHash('sha1').update(reference.face).digest('hex');
  const filename=hash+'.source'+extension;
  const destination=path.join(assetDirectory,filename);
  reference.sourceFace=reference.face;
  reference._hash=hash;
  reference._filename=filename;
  if(!fs.existsSync(path.join(assetDirectory,hash+'.jpg'))&&!fs.existsSync(destination)){
    const response=await fetch(reference.face);
    if(!response.ok)throw Error(`Unable to download ${reference.face}: ${response.status}`);
    fs.writeFileSync(destination,Buffer.from(await response.arrayBuffer()));
  }
}
if(process.platform==='win32'){
  const result=childProcess.spawnSync('powershell',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(__dirname,'optimize-maneuver-images.ps1'),assetDirectory],{stdio:'inherit'});
  if(result.status!==0)throw Error('Unable to optimize the maneuver-card images.');
}
for(const reference of references){const optimized=reference._hash+'.jpg';reference.image='maneuvers/'+(fs.existsSync(path.join(assetDirectory,optimized))?optimized:reference._filename);delete reference.face;delete reference._hash;delete reference._filename;}

const output={schemaVersion:1,source:path.basename(source),classes};
const destination=path.join(root,'public/data/maneuver-cards.json');
fs.writeFileSync(destination,JSON.stringify(output,null,2)+'\n');
const withImages=Object.values(classes).filter(entry=>entry.cards.length).length;
console.log(`Imported ${references.length} maneuver-card scans for ${withImages}/${Object.keys(classes).length} builder classes.`);
})().catch(error=>{console.error(error);process.exitCode=1;});

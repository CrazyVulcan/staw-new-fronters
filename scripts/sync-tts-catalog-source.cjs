const fs=require('fs'),p=require('path');
const root=p.resolve(__dirname,'..'),catalog=JSON.parse(fs.readFileSync(p.join(root,'vendor/tts-catalog.json'),'utf8'));
const target=p.join(root,'vendor/tts-importer-source.lua');
let lua=fs.readFileSync(target,'utf8');
const header={...catalog,cards:[]};
lua=lua.replace(/CATALOG_DATA = JSON\.decode\(\[===\[[^\r\n]*\]===\]\)/,'CATALOG_DATA = JSON.decode([===['+JSON.stringify(header)+']===])');
const size=1100,jobs=[];
for(let offset=0;offset<catalog.cards.length;offset+=size){
 const chunk=catalog.cards.slice(offset,offset+size);
 jobs.push('{target=CATALOG_DATA["cards"],offset='+offset+',json=[===['+JSON.stringify(chunk)+']===]}');
}
const start=lua.indexOf('local startupJobs = {');
const standard=lua.indexOf('STANDARD_BASE =',start);
const end=lua.lastIndexOf('}',standard);
if(start<0||standard<0||end<start)throw Error('Could not locate startupJobs in TTS importer source.');
lua=lua.slice(0,start)+'local startupJobs = {\n'+jobs.join(',\n')+'\n}\n'+lua.slice(standard);
fs.writeFileSync(target,lua);
console.log('Synced '+catalog.cards.length+' TTS catalog cards in '+jobs.length+' startup chunks.');

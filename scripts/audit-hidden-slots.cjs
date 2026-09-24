const fs=require('fs'),p=require('path');
const root=p.resolve(__dirname,'..'),ruleFile='vendor/utopia/js/common/utopia-card-rules.js';
const lines=fs.readFileSync(p.join(root,ruleFile),'utf8').split(/\r?\n/),data=JSON.parse(fs.readFileSync(p.join(root,'public/data/data.json'),'utf8'));
const catalog=Object.entries(data).filter(([name])=>!['sets','shipClasses'].includes(name)).flatMap(([,rows])=>rows);
const byKey=new Map(catalog.map(card=>[(card.catalogType||card.type)+':'+card.id,card]));
let current='';const found=new Map();
for(let i=0;i<lines.length;i++){
 const match=lines[i].match(/^\s*"([^"]+)"\s*:\s*\{/);if(match)current=match[1];
 if(/faceDown\s*:\s*true/.test(lines[i])){const row=found.get(current)||{cardKey:current,name:byKey.get(current)?.name||'Unknown',hiddenSlots:0,sourceLines:[]};row.hiddenSlots++;row.sourceLines.push(i+1);found.set(current,row);}
}
const cards=[...found.values()].sort((a,b)=>a.cardKey.localeCompare(b.cardKey)),audit={source:ruleFile,meaning:'Generated upgrade slots that Utopia marks faceDown. Occupants export to TTS with a # prefix.',cardCount:cards.length,hiddenSlotCount:cards.reduce((n,c)=>n+c.hiddenSlots,0),cards};
fs.writeFileSync(p.join(root,'public/data/hidden-slot-audit.json'),JSON.stringify(audit,null,2)+'\n');
console.log(`${audit.hiddenSlotCount} hidden slots across ${audit.cardCount} cards.`);

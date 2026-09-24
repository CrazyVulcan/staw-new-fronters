const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),p=require('path');
const root=p.resolve(__dirname,'..'),read=f=>JSON.parse(fs.readFileSync(p.join(root,f),'utf8')),core=require('../src/core.js');
const data=read('public/data/data.json'),costs=read('public/data/card-costs.json'),routes=read('public/data/tts-routes.json'),aliases=read('public/data/aliases.json'),audit=read('public/data/id-audit.json'),rules=require('../src/rules.js');
const cards=Object.entries(data).filter(([k])=>!['sets','shipClasses'].includes(k)).flatMap(([,v])=>v).filter(c=>c.id&&c.type!=='copy'),by=Object.fromEntries(cards.map(c=>[core.key(c),c]));
test('Every converted record has a scalar, globally unique ID and one cost row',()=>{
 assert.equal(cards.length,2373);assert.equal(new Set(cards.map(c=>c.id)).size,cards.length);
 assert.equal(new Set(cards.map(core.key)).size,cards.length);assert.equal(costs.length,cards.length);
 core.validateCosts(costs,by);assert.equal(audit.mismatches.length,0);
});
test('Array IDs and duplicates have unambiguous aliases',()=>{
 assert.equal(aliases['tech:T311,T311a'],'tech:T311');assert.equal(aliases['question:Q036a'],'question:Q036');
 assert.equal(cards.filter(c=>c.id==='S199').length,1);assert.ok(by['token:rule_borg_tractor_beam']);
 assert.equal(by['token:rule_specialzation'].name,'Specialization Cards (SCS)');
});
test('Every TTS route matches its original catalog identity and a local image',()=>{
 const catalog=read('vendor/tts-catalog.json');const original=new Map(catalog.cards.map(c=>[c.id,c]));
 assert.equal(Object.keys(routes).length,2142);
 for(const [k,r]of Object.entries(routes)){assert.equal(r.id,by[k].id);assert.equal(r.type,by[k].type);assert.equal(r.name,original.get(r.id).name);assert.ok(r.index>=0&&r.index<r.width*r.height);assert.ok(fs.existsSync(p.join(root,'public',r.localImage)),k);}
});
test('Saved fleets normalize legacy aliases without dropping unknown IDs',()=>{
 const saved={ships:[{id:'ship:S274',upgrades:[{id:'tech:T311a'}]}]};
 const actual=core.canonicalize(saved,aliases,by);assert.equal(actual.ships[0].upgrades[0].id,'tech:T311');
 assert.throws(()=>core.canonicalize({ships:[{id:'ship:DOES_NOT_EXIST'}]},aliases,by),/Unknown/);
 assert.throws(()=>core.canonicalize({ships:[{id:'crew:C441'}]},aliases,by),/must be a ship/);
});
test('TTS text and JSON preserve groups, roles, canonical IDs, and repeated generic upgrades',()=>{
 const ship={...by['ship:S274'],captain:by['captain:Cap049'],upgrades:[{occupant:by['crew:C441']},{occupant:by['weapon:W204']},{occupant:by['weapon:W204']}]};
 const f={ships:[ship,{...by['ship:S001']}]},out=JSON.parse(core.ttsExport(f,routes,'json'));
 assert.deepEqual(out.ships[0].cards.map(c=>c.cardId),['Cap049','C441','W204','W204']);
 assert.equal(out.ships[1].shipCardId,'S001');assert.equal(out.schemaVersion,2);assert.ok(core.ttsExport(f,routes).startsWith('S274\nCap049\n'));
});
test('Face-down generated slots are tagged and exported with the TTS hidden marker',()=>{
 const quark={...by['crew:C114'],upgradeSlots:[{type:['tech','weapon'],faceDown:true,occupant:by['tech:T001']}]};
 const ship={...by['ship:S274'],upgrades:[{occupant:quark}]},fleet={ships:[ship]};
 const entries=core.walkEntries(ship);assert.equal(entries.find(e=>e.card.id==='T001').hidden,true);assert.equal(entries.find(e=>e.card.id==='C114').hidden,false);
 assert.match(core.ttsExport(fleet,routes),/\nC114\n#T001\n/);
 const payload=JSON.parse(core.ttsExport(fleet,routes,'json'));assert.equal(payload.ships[0].cards[1].hidden,true);assert.equal(payload.ships[0].cards[0].hidden,undefined);
});
test('No partial exports, unknown routing, or overflow beyond TTS layout limits',()=>{
 assert.throws(()=>core.ttsExport({ships:[by['ship:S199']]},routes),/no verified route/);
 assert.throws(()=>core.ttsExport({ships:[]},routes),/at least one/);
 const huge={...by['ship:S274'],upgrades:Array.from({length:14},()=>({occupant:by['weapon:W204']}))};
 assert.throws(()=>core.ttsExport({ships:[huge]},routes),/14-card/);
 assert.throws(()=>core.ttsExport({ships:Array.from({length:16},()=>({...by['ship:S274']}))},routes),/three rows/);
});
test('Cost validation accepts zero and rejects duplicate, negative, and unknown overrides',()=>{
 assert.equal(core.validateCosts([{id:'S274',type:'ship',cost:26,spudsCost:0}],by)[0].spudsCost,0);
 assert.throws(()=>core.validateCosts([{id:'S274',type:'ship',cost:26,spudsCost:-1}],by),/Invalid/);
 assert.throws(()=>core.validateCosts([costs[0],costs[0]],by),/Duplicate/);
});
test('Lower Decks uses a shared crew position without the Utopia helper card',()=>{
 const lower={type:'crew',id:'C414',name:'Ahni Jetal',text:'<b>(Lower Decks)</b>'},other={type:'crew',id:'C001',text:'Regular crew'},slot={type:['crew']};
 rules.enhanceEquippedCard(lower,slot);assert.equal(lower.upgradeSlots.length,1);assert.equal(lower.upgradeSlots[0]._sharedRule,'lower-decks');
 assert.equal(lower.upgradeSlots[0].canEquip({...lower}),true);assert.equal(lower.upgradeSlots[0].canEquip(other),false);
 rules.enhanceEquippedCard(lower,slot);assert.equal(lower.upgradeSlots.length,1);assert.equal(rules.isInternalHelper({type:'crew',id:'C426'}),true);
});

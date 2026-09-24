const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),p=require('path');
const root=p.resolve(__dirname,'..');
const read=file=>fs.readFileSync(p.join(root,file),'utf8');

test('Root GitHub Pages entry point uses existing app with public asset paths',()=>{
 const html=read('index.html'),css=read('style.css'),app=read('src/app.js');
 for(const file of ['index.html','style.css','src/core.js','src/rules.js','src/app.js','public/css/font-staw.css','public/vendor/jquery.js','public/data/card-costs.json']){
  assert.ok(fs.existsSync(p.join(root,file)),file);
 }
 assert.match(html,/window\.RemodulatedConfig=\{assetBase:'public'\}/);
 assert.match(html,/href="public\/css\/font-staw\.css"/);
 assert.match(html,/src="src\/app\.js"/);
 assert.match(html,/href="public\/data\/card-costs\.json"/);
 assert.match(css,/url\('public\/fonts\/Swiss1\.ttf'\)/);
 assert.match(css,/url\('src\/favicon\.svg'\)/);
 assert.match(app,/const assetPath=path=>/);
 assert.match(app,/const assetUrl=path=>/);
 assert.match(app,/fetch\(assetPath\('data\/'\+f\+'\.json'\)\)/);
});

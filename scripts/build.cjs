const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
// Build only copies known public files. Editable catalogs are never regenerated here.
fs.cpSync(path.join(root,'public'),path.join(root,'dist'),{recursive:true});
fs.cpSync(path.join(root,'src'),path.join(root,'dist'),{recursive:true});
console.log('Static site built in dist/');

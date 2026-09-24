const fs=require('fs'),p=require('path');
const file=process.argv[2];if(!file)throw Error('Usage: node scripts/update-tts-hidden-import.cjs "path-to-save.json"');
const raw=fs.readFileSync(file,'utf8'),save=JSON.parse(raw);if(typeof save.LuaScript!=='string')throw Error('The save has no global LuaScript.');
if(save.LuaScript.includes('local hidden=id:sub(1,1)=="#"')){console.log('TTS save already supports # hidden-card imports.');process.exit(0);}
function once(source,before,after,label){const at=source.indexOf(before);if(at<0)throw Error('Cannot locate '+label+' in this save; nothing was changed.');if(source.indexOf(before,at+1)>=0)throw Error('Found more than one '+label+' block; nothing was changed.');return source.slice(0,at)+after+source.slice(at+before.length);}
let lua=save.LuaScript;
lua=once(lua,`        if id~="" then
            local card=CATALOG[id]`,`        if id~="" then
            local hidden=id:sub(1,1)=="#"
            if hidden then id=id:sub(2):match("^%s*(.-)%s*$") end
            local card=CATALOG[id]`,'fleet ID parser');
lua=once(lua,`                table.insert(fleet.resources,{cardId=id,role="resource"})
            elseif current then
                table.insert(current.cards,{cardId=id,role=card.type or "upgrade"})`,`                table.insert(fleet.resources,{cardId=id,role="resource",hidden=hidden or nil})
            elseif current then
                table.insert(current.cards,{cardId=id,role=card.type or "upgrade",hidden=hidden or nil})`,'fleet entry parser');
lua=once(lua,`        for _,group in ipairs(row.groups) do
            local s=group.shipIndex and shipInstances[group.shipIndex] or nil
            for j,entry in ipairs(group.entries) do
                local slot=group.start+j-1
                local x=rowDirection*(left+(slot-1)*spacing)
                table.insert(jobs,{ship=s,cardId=entry.cardId,root=not group.standalone and j==1,position={x,1.2,z},index=j-1,standalone=group.standalone})`,`        for _,group in ipairs(row.groups) do
            local s=group.shipIndex and shipInstances[group.shipIndex] or nil
            local anchorSlot=group.start
            local hiddenOffset=0
            for j,entry in ipairs(group.entries) do
                local slot=group.start+j-1
                if entry.hidden then hiddenOffset=hiddenOffset+1 else anchorSlot=slot;hiddenOffset=0 end
                local x=rowDirection*(left+((entry.hidden and anchorSlot or slot)-1)*spacing+(entry.hidden and hiddenOffset*0.42 or 0))
                local cardZ=z+(entry.hidden and sign*hiddenOffset*0.18 or 0)
                table.insert(jobs,{ship=s,cardId=entry.cardId,root=not group.standalone and j==1,hidden=entry.hidden==true,position={x,entry.hidden and 1.24 or 1.2,cardZ},index=j-1,standalone=group.standalone})`,'fleet layout');
lua=once(lua,`                if STA2E.imports[key]~=tx then object.destruct();return end
                table.insert(tx.objects,object)`,`                if STA2E.imports[key]~=tx then object.destruct();return end
                if job.hidden then object.flip() end
                table.insert(tx.objects,object)`,'spawn callback');
save.LuaScript=lua;
const backup=file+'.before-hidden-import.bak';if(!fs.existsSync(backup))fs.copyFileSync(file,backup);
const next=JSON.stringify(save,null,2)+'\n';JSON.parse(next);fs.writeFileSync(file,next);
console.log('Updated TTS save. Backup: '+backup);

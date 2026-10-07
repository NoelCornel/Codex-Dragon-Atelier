import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
const tokens=JSON.parse(await fs.readFile(new URL('../src/tokens.json',import.meta.url),'utf8'));
function luminance(hex){const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
for(const [mode,t]of Object.entries(tokens))test(`${mode}: readable text on every defined reading surface`,()=>{
 for(const surface of ['background','panel','panelAlt'])for(const ink of ['text','muted'])assert.ok(ratio(t[ink],t[surface])>=4.5,`${ink}/${surface} contrast failed`);
 assert.ok(ratio(t.accent,t.background)>=3,'focus contrast failed');
});
test('light mode is a muted light surface and dark mode is low luminance',()=>{
 assert.ok(luminance(tokens.light.background)<.85);assert.ok(luminance(tokens.light.background)>.65);
 assert.ok(luminance(tokens.dark.background)<.035);
});

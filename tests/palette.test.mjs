import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
const tokens=JSON.parse(await fs.readFile(new URL('../src/tokens.json',import.meta.url),'utf8'));
function luminance(hex){const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
for(const [mode,t]of Object.entries(tokens))test(`${mode}: readable text on every defined reading surface`,()=>{
 for(const surface of ['background','scene','sidebar','panel','panelAlt','surface3','elevated','composer','code']) {
  for(const ink of ['text','muted','textTertiary','link','linkHover'])assert.ok(ratio(t[ink],t[surface])>=4.5,`${ink}/${surface} contrast failed`);
  for(const boundary of ['focus','controlBorder'])assert.ok(ratio(t[boundary],t[surface])>=3,`${boundary}/${surface} contrast failed`);
 }
 assert.ok(ratio(t.placeholder,t.composer)>=4.5,'placeholder contrast failed');
 for(const bg of ['accent','accentHover','accentActive'])assert.ok(ratio(t.onAccent,t[bg])>=4.5,`button/${bg} contrast failed`);
});
test('light mode is a muted light surface and dark mode is low luminance',()=>{
 assert.ok(luminance(tokens.light.background)<.85);assert.ok(luminance(tokens.light.background)>.65);
 assert.ok(luminance(tokens.dark.background)<.035);
});

test('native bindings have palette roles and preserve status/diff/terminal semantics',async()=>{
 const bindings=JSON.parse(await fs.readFile(new URL('../src/native-token-map.json',import.meta.url),'utf8'));
 for(const [native,role]of Object.entries(bindings)) {
  assert.ok(tokens.dark[role]&&tokens.light[role],`undefined ${native}/${role}`);
  assert.doesNotMatch(native,/danger|success|caution|warning|info|diff|terminal/i);
 }
});

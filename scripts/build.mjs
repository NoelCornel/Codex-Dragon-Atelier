import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'dist');await fs.mkdir(out,{recursive:true});
const [layout,renderer,adapter,colors,bindings]=await Promise.all([
 fs.readFile(path.join(root,'src/atelier.css'),'utf8'),
 fs.readFile(path.join(root,'src/renderer.js'),'utf8'),
 fs.readFile(path.join(root,'src/adapter.json'),'utf8').then(JSON.parse),
 fs.readFile(path.join(root,'src/tokens.json'),'utf8').then(JSON.parse),
 fs.readFile(path.join(root,'src/native-token-map.json'),'utf8').then(JSON.parse)
]);
const declarations=t=>Object.entries(t).map(([role,value])=>`  --da-${role}: ${value};`).join('\n');
for(const role of Object.values(bindings)) {
 if(!colors.dark[role]||!colors.light[role])throw new Error(`Missing palette role: ${role}`);
}
// One palette source for full CSS and official native sharing codes. High contrast
// leaves the native client in charge instead of retaining the custom palette.
const css=`@media (forced-colors:none) {\nhtml[data-dragon-atelier] {\n${declarations(colors.dark)}\n  --da-bg:var(--da-background); --da-alt:var(--da-panelAlt);\n}\nhtml[data-dragon-atelier][data-da-mode=light] {\n${declarations(colors.light)}\n}\nhtml[data-dragon-atelier],html[data-dragon-atelier] [data-da-part] {\n${Object.entries(bindings).map(([name,role])=>`  ${name}:var(--da-${role}) !important;`).join('\n')}\n}\n${layout}\n}\n@media (forced-colors:active) {#dragon-atelier-scene {display:none !important;}}`;
const sprite=await fs.readFile(path.join(root,'assets/dragon-chibi-apprentice-cutout-v1.png'));
const pngDimensions=b=>({width:b.readUInt32BE(16),height:b.readUInt32BE(20)});
const version=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8')).version;
// Published HD chibi illustration, background-only alpha edit. Native low-res
// desktop sprite sheet is archived, not enlarged into a decorative backdrop.
const qSize=pngDimensions(sprite);
const config={css,adapter,version,edition:'q',artwork:'apprentice-hd-cutout-v1',cellPixels:qSize.width,cellAspect:qSize.width/qSize.height,reducedImage:'data:image/png;base64,'+sprite.toString('base64')};
await fs.writeFile(path.join(out,'dragon-atelier.js'),renderer.replace('__ATELIER_CONFIG__',JSON.stringify(config)));
await fs.writeFile(path.join(out,'dragon-atelier-q.js'),renderer.replace('__ATELIER_CONFIG__',JSON.stringify(config)));
const portraitImages={},portraitSizes=[];
for(const [side,file,mime] of [['left','dragon-mature-generated-v1.png','image/png'],['right','dragon-young-generated-v1.png','image/png']]) {
 const bytes=await fs.readFile(path.join(root,'assets',file));portraitImages[side]=`data:${mime};base64,`+bytes.toString('base64');portraitSizes.push(pngDimensions(bytes));
}
await fs.writeFile(path.join(out,'dragon-atelier-portrait.js'),renderer.replace('__ATELIER_CONFIG__',JSON.stringify({css,adapter,version,edition:'portrait',artwork:'generated-adult-companions-v1',aspects:portraitSizes.map(s=>s.width/s.height),pixelHeights:portraitSizes.map(s=>s.height),images:portraitImages})));
for(const variant of ['dark','light']) {
 const t=colors[variant];
 const share={codeThemeId:'codex',theme:{accent:t.accent,accentSource:'custom',contrast:variant==='dark'?55:45,
  fonts:{code:null,ui:null},ink:t.text,opaqueWindows:true,
  semanticColors:{diffAdded:variant==='dark'?'#40c977':'#008635',diffRemoved:variant==='dark'?'#ff6764':'#e02e2a',skill:variant==='dark'?'#ad7bf9':'#8046d9'},surface:t.background},variant};
 await fs.writeFile(path.join(out,`native-${variant}.txt`),'codex-theme-v1:'+JSON.stringify(share)+'\n');
}
const files=['dragon-atelier.js','dragon-atelier-q.js','dragon-atelier-portrait.js','native-dark.txt','native-light.txt'];
await fs.writeFile(path.join(out,'SHA256SUMS.txt'),(await Promise.all(files.map(async f=>createHash('sha256').update(await fs.readFile(path.join(out,f))).digest('hex')+'  '+f))).join('\n')+'\n');
console.log('Built dual appearance native themes and reversible renderer');

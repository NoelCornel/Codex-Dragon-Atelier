import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'dist');await fs.mkdir(out,{recursive:true});
const [css,renderer,adapter]=await Promise.all([
 fs.readFile(path.join(root,'src/atelier.css'),'utf8'),
 fs.readFile(path.join(root,'src/renderer.js'),'utf8'),
 fs.readFile(path.join(root,'src/adapter.json'),'utf8').then(JSON.parse)
]);
const assetNames=['dragon-idle.webp','dragon-waving.webp'];
const images=await Promise.all(assetNames.map(async name=>'data:image/webp;base64,'+(await fs.readFile(path.join(root,'assets',name))).toString('base64')));
const sprite=await fs.readFile(path.join(root,'assets/dragon-spritesheet.webp')).catch(()=>null);
const config={css,adapter,images,reducedImage:sprite?'data:image/webp;base64,'+sprite.toString('base64'):images[0]};
await fs.writeFile(path.join(out,'dragon-atelier.js'),renderer.replace('__ATELIER_CONFIG__',JSON.stringify(config)));
const colors=JSON.parse(await fs.readFile(path.join(root,'src/tokens.json'),'utf8'));
for(const variant of ['dark','light']) {
 const t=colors[variant];
 const share={codeThemeId:'codex',theme:{accent:t.accent,accentSource:'custom',contrast:variant==='dark'?55:45,
  fonts:{code:null,ui:null},ink:t.text,opaqueWindows:true,
  semanticColors:{diffAdded:variant==='dark'?'#40c977':'#008635',diffRemoved:variant==='dark'?'#ff6764':'#e02e2a',skill:variant==='dark'?'#ad7bf9':'#8046d9'},surface:t.background},variant};
 await fs.writeFile(path.join(out,`native-${variant}.txt`),'codex-theme-v1:'+JSON.stringify(share)+'\n');
}
const files=['dragon-atelier.js','native-dark.txt','native-light.txt'];
await fs.writeFile(path.join(out,'SHA256SUMS.txt'),(await Promise.all(files.map(async f=>createHash('sha256').update(await fs.readFile(path.join(out,f))).digest('hex')+'  '+f))).join('\n')+'\n');
console.log('Built dual appearance native themes and reversible renderer');

import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
const files=['README.md','NOTICE.md','LICENSE','package.json',
 '启动龙娘工坊.cmd','启动Q版背景.cmd','启动立绘背景.cmd','恢复装饰.cmd','记录窗口遮挡.cmd','解除开屏遮挡.cmd','scripts/Launch.ps1','scripts/Restore.ps1','scripts/Inspect-BlockingWindow.ps1',
 'scripts/apply.mjs','scripts/build.mjs','scripts/package.mjs',
 'dist/dragon-atelier.js','dist/dragon-atelier-q.js','dist/dragon-atelier-portrait.js','dist/native-dark.txt','dist/native-light.txt','dist/SHA256SUMS.txt',
 'assets/dragon-idle.webp','assets/dragon-waving.webp','assets/dragon-spritesheet.webp','assets/SOURCES.json',
 'assets/dragon-portrait-original.jpg','assets/dragon-portrait-orbit.png','assets/dragon-portrait-original-cutout.png','assets/dragon-portrait-orbit-cutout.png',
 'src/renderer.js','src/atelier.css','src/tokens.json','src/adapter.json',
 'tests/palette.test.mjs','tests/browser-regression.py',
 'docs/DESIGN.md','docs/VALIDATION.md','docs/WINDOW_RECOVERY.md','docs/images/background-q-dark.png','docs/images/background-q-light.png','docs/images/background-portrait-dark.png','docs/images/background-portrait-light.png',
 'LICENSES/Artwork-CC-BY-NC-4.0.txt','LICENSES/Upstream-Pets-NOTICE.md','LICENSES/Dynamic-Skin-MIT.txt',
 'LICENSES/AI-Fanworks-NOTICE.md','LICENSES/Artwork-CC-BY-NC-SA-4.0.txt',
 'patches/README.md','patches/dynamic-skin-manager-payload.patch'];
for(const f of files)await fs.access(path.join(root,f));
const out=path.join(root,'dist',`codex-dragon-atelier-v${pkg.version}-windows.zip`);
// Use a bounded allowlist; never package credentials, profiles or local QA evidence.
const temp=path.join(root,'dist','package-list.json');
await fs.writeFile(temp,JSON.stringify({root,out,files}));
try {
 execFileSync(process.env.PYTHON||'python',['-c',
  'import json,sys,zipfile,pathlib; d=json.load(open(sys.argv[1],encoding="utf-8")); z=zipfile.ZipFile(d["out"],"w",zipfile.ZIP_DEFLATED); [z.write(pathlib.Path(d["root"])/f,"Codex-Dragon-Atelier/"+f) for f in d["files"]]; z.close()',temp],{stdio:'inherit'});
}finally{await fs.unlink(temp);}
const releases=[path.basename(out),'native-dark.txt','native-light.txt'];
await fs.writeFile(path.join(root,'dist','RELEASE-SHA256SUMS.txt'),(await Promise.all(releases.map(async f=>
 createHash('sha256').update(await fs.readFile(path.join(root,'dist',f))).digest('hex')+'  '+f))).join('\n')+'\n');
console.log(`Packaged ${pkg.version}: ${files.length} allowlisted files`);

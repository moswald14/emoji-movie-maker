import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=dirname(fileURLToPath(import.meta.url));
let html=await readFile(resolve(root,'src/index.html'),'utf8');
const css=await readFile(resolve(root,'src/style.css'),'utf8');
const engine=await readFile(resolve(root,'src/engine.js'),'utf8');
const app=await readFile(resolve(root,'src/app.js'),'utf8');
const safeScript=s=>s.replace(/<\/script/gi,'<\\/script');
html=html.replace('<!-- STYLES -->',`<style>\n${css}\n</style>`).replace('<!-- ENGINE -->',`<script id="movie-engine">\n${safeScript(engine)}\n</script>`).replace('<!-- APP -->',`<script>\n${safeScript(app)}\n</script>`);
await mkdir(resolve(root,'dist'),{recursive:true});
await writeFile(resolve(root,'dist/index.html'),html,'utf8');
await mkdir(resolve(root,'docs'),{recursive:true});
await writeFile(resolve(root,'docs/index.html'),html,'utf8');
await writeFile(resolve(root,'docs/.nojekyll'),'','utf8');
const copyToIndex=process.argv.indexOf('--copy-to');
if(copyToIndex!==-1){
  const target=process.argv[copyToIndex+1];
  if(!target||target.startsWith('--'))throw new Error('--copy-to needs a destination HTML file.');
  const destination=resolve(process.cwd(),target);
  await mkdir(dirname(destination),{recursive:true});
  await writeFile(destination,html,'utf8');
}
console.log(`Built offline movie studio (${Math.round(Buffer.byteLength(html)/1024)} KB).`);

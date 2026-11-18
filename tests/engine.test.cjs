const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
require('../src/engine.js');
const F = globalThis.EmojiFilm;

test('the starting story has three complete scenes and lasts twelve seconds',()=>{
  const p=F.demo();assert.equal(p.scenes.length,3);assert.equal(F.total(p),12);
  assert.ok(p.scenes.every(s=>s.caption&&s.actors.length));
  assert.equal(new Set(p.scenes.flatMap(s=>[s.id,...s.actors.map(a=>a.id)])).size,12);
});
test('scene timing uses exact boundaries and includes the last frame',()=>{
  const p=F.demo();assert.equal(F.locate(p,3.999).index,0);assert.equal(F.locate(p,4).index,1);
  assert.equal(F.locate(p,8).index,2);assert.equal(F.locate(p,12).local,4);
  assert.equal(F.locate(p,-100).local,0);assert.equal(F.locate(p,999).index,2);
});
test('fractional durations and reordered scenes retain a continuous timeline',()=>{
  const p=F.demo();p.scenes[0].duration=1.5;p.scenes[1].duration=2.5;p.scenes[2].duration=3;
  p.scenes.reverse();assert.equal(F.total(p),7);assert.equal(F.startOf(p,1),3);assert.equal(F.startOf(p,2),5.5);
  assert.equal(F.locate(p,5.5).scene.id,p.scenes[2].id);
});
test('all three shapes have the intended native export resolution',()=>{
  assert.deepEqual(F.dimensions('landscape'),[1280,720]);assert.deepEqual(F.dimensions('portrait'),[720,1280]);assert.deepEqual(F.dimensions('square'),[960,960]);
});
test('saved projects round-trip without changing the actual movie content',()=>{
  const original=F.demo(),safe=F.sanitize(JSON.parse(JSON.stringify(original)));
  function withoutIds(value){return JSON.parse(JSON.stringify(value),(k,v)=>k==='id'?undefined:v);}
  assert.deepEqual(withoutIds(safe),withoutIds(original));
});
test('invalid, empty, future, and oversized projects are rejected',()=>{
  for(const input of [null,{},[],{version:1,scenes:[]},{version:99,scenes:[{}]},{version:1,scenes:[null]}])assert.throws(()=>F.sanitize(input));
  assert.throws(()=>F.sanitize({version:1,scenes:Array.from({length:31},()=>({}))}),/30/);
});
test('imported positions, sizes, duration and non-finite values are bounded',()=>{
  const safe=F.sanitize({version:1,title:'x'.repeat(200),ratio:'bad',music:'bad',scenes:[{duration:Infinity,theme:'bad',transition:'script',caption:'a'.repeat(500),actors:[{emoji:'🐈',x:Infinity,y:-999,size:9999,motion:'bad',rotation:9999}]}]});
  assert.equal(safe.title.length,80);assert.equal(safe.ratio,'landscape');assert.equal(safe.music,'none');
  const s=safe.scenes[0],a=s.actors[0];assert.equal(s.duration,4);assert.equal(s.caption.length,180);assert.equal(s.transition,'fade');assert.equal(a.x,.5);assert.equal(a.y,.08);assert.equal(a.size,320);assert.equal(a.rotation,180);assert.equal(a.motion,'still');
});
test('import limits character count and replaces duplicate supplied identifiers',()=>{
  const safe=F.sanitize({version:1,scenes:[{id:'same',actors:Array.from({length:100},()=>({id:'same',emoji:'🧑🏽‍🚀'}))}]});
  const actors=safe.scenes[0].actors;assert.equal(actors.length,40);assert.equal(new Set(actors.map(a=>a.id)).size,40);assert.equal(actors[0].emoji,'🧑🏽‍🚀');
});
test('overlapping characters select the one on top and empty space selects nothing',()=>{
  const a=F.actor('🐈',.5,.5,100,'still'),b=F.actor('🐕',.5,.5,100,'still'),s=F.scene({actors:[a,b]});
  assert.equal(F.hitTest(s,.5,.5,0,1280,720).id,b.id);assert.equal(F.hitTest(s,.1,.1,0,1280,720),null);
});
test('moving characters can be selected at their visible animated position',()=>{
  const a=F.actor('🚀',.5,.5,100,'travel'),s=F.scene({duration:4,actors:[a]});
  assert.equal(F.hitTest(s,.285,.5,0,1280,720).id,a.id);assert.equal(F.hitTest(s,.5,.5,0,1280,720),null);
});
test('every animation produces a finite pose in each movie shape',()=>{
  for(const motion of Object.keys(F.MOTIONS))for(const t of [0,.05,.6,2,4]){
    const p=F.pose(F.actor('✨',.5,.5,150,motion),t,4);assert.ok(Object.values(p).every(Number.isFinite));assert.ok(p.scale>0);
  }
});
test('long unbroken and non-Latin captions wrap within the movie width',()=>{
  const ctx={measureText:text=>({width:Array.from(text).length*10})};
  const lines=F.wrap(ctx,'一二三四五六七八九十一二三四五六七八九十',80,3);
  assert.equal(lines.length,3);assert.ok(lines.every(l=>ctx.measureText(l).width<=80));
  const long=F.wrap(ctx,'averylongwordthatislargerthanthecaptionarea'.repeat(8),80,3);assert.ok(long.at(-1).endsWith('…'));assert.ok(long.every(l=>ctx.measureText(l).width<=80));
});
test('built offline HTML has no external assets and every embedded script parses',()=>{
  const html=readFileSync(require('node:path').resolve(__dirname,'../dist/index.html'),'utf8');
  assert.doesNotMatch(html,/<(?:script|link|img)\b[^>]*(?:src|href)=["']https?:/i);
  const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,3);
  for(const [,source] of scripts)assert.doesNotThrow(()=>new vm.Script(source));
});
test('GitHub Pages serves the same complete app as the offline download',()=>{
  const path=require('node:path');
  const offline=readFileSync(path.resolve(__dirname,'../dist/index.html'),'utf8');
  const hosted=readFileSync(path.resolve(__dirname,'../docs/index.html'),'utf8');
  assert.equal(hosted,offline);
  assert.equal(readFileSync(path.resolve(__dirname,'../docs/.nojekyll'),'utf8'),'');
});
test('recorded WebM gets an explicit duration without changing its media bytes',async()=>{
  // Minimal live Segment: Info(TimestampScale=1,000,000), followed by a Cluster.
  const header=Buffer.from('1a45dfa3801853806701ffffffffffffff1549a966872ad7b1830f4240','hex');
  const media=Buffer.from('1f43b67586e78100a38100','hex');
  const input=new Blob([header,media],{type:'video/webm'});
  const fixed=Buffer.from(await (await F.fixWebmDuration(input,12)).arrayBuffer());
  const durationAt=fixed.indexOf(Buffer.from('448988','hex'));
  assert.notEqual(durationAt,-1);assert.equal(fixed.readDoubleBE(durationAt+3),12000);
  assert.deepEqual(fixed.subarray(-media.length),media);assert.equal(fixed.length,input.size+11);
});
test('duration metadata respects a non-default timestamp scale',async()=>{
  const input=new Blob([Buffer.from('1853806701ffffffffffffff1549a966872ad7b1831e8480','hex')],{type:'video/webm'});
  const fixed=Buffer.from(await (await F.fixWebmDuration(input,7.5)).arrayBuffer());
  const at=fixed.indexOf(Buffer.from('448988','hex'));assert.equal(fixed.readDoubleBE(at+3),3750);
});
test('unrecognized containers and invalid durations are preserved',async()=>{
  const input=new Blob(['not a webm'],{type:'video/webm'});assert.equal(await F.fixWebmDuration(input,4),input);
  const mp4=new Blob(['mp4'],{type:'video/mp4'});assert.equal(await F.fixWebmDuration(mp4,4),mp4);
  assert.equal(await F.fixWebmDuration(input,NaN),input);
});

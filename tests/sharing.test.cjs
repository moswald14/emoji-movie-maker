const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../src/sharing.js');
const S=globalThis.EmojiShare;
const movie={name:'my-movie.mp4',type:'video/mp4',size:1200};

test('social video export prefers MP4 when MP4 and WebM are available',()=>{
  const type=S.chooseVideoType(()=>true);
  assert.ok(type.startsWith('video/mp4'));
  assert.ok(type.includes('avc1'));
});
test('video export keeps working when a browser only records WebM',()=>{
  assert.equal(S.chooseVideoType(type=>type==='video/webm'),'video/webm');
});
test('a rejected codec probe does not prevent trying compatible formats',()=>{
  assert.equal(S.chooseVideoType(type=>{if(type.includes('mp4'))throw new Error('Unsupported codec');return type==='video/webm;codecs=vp8,opus';}),'video/webm;codecs=vp8,opus');
});
test('recording is unavailable when no candidate format is supported',()=>{
  assert.equal(S.chooseVideoType(()=>false),null);
});
test('shared files use a simple video MIME type without codec parameters',()=>{
  assert.equal(S.mimeType('video/MP4;codecs=avc1,mp4a.40.2'),'video/mp4');
  assert.equal(S.mimeType('video/webm;codecs=vp9,opus'),'video/webm');
});
test('native sharing checks this exact file and requires a working share API',()=>{
  let received;
  const device={canShare:data=>{received=data;return true;},share:()=>Promise.resolve()};
  assert.equal(S.canShareVideo(movie,device),true);
  assert.equal(received.files[0],movie);
  assert.equal(S.canShareVideo(movie,{canShare:()=>true}),false);
  assert.equal(S.canShareVideo(movie,{share:()=>Promise.resolve()}),false);
});
test('sharing starts immediately during the click and passes the finished video',async()=>{
  let received;
  const device={canShare:()=>true,share:data=>{received=data;return Promise.resolve();}};
  const pending=S.shareVideo(movie,'My little story',device);
  assert.equal(received.files[0],movie);
  assert.equal(received.title,'My little story');
  assert.deepEqual(await pending,{status:'shared'});
});
test('cancelling the device share sheet is handled as a cancellation',async()=>{
  const device={canShare:()=>true,share:async()=>{throw Object.assign(new Error('Cancelled'),{name:'AbortError'});}};
  assert.deepEqual(await S.shareVideo(movie,'Story',device),{status:'cancelled'});
});
test('unsupported devices return a fallback result without attempting an upload',async()=>{
  let called=false;
  const device={canShare:()=>false,share:async()=>{called=true;}};
  assert.deepEqual(await S.shareVideo(movie,'Story',device),{status:'unsupported'});
  assert.equal(called,false);
  assert.equal(S.canShareVideo(movie,{canShare:()=>{throw new Error('Blocked');},share:()=>{}}),false);
});
test('failed transfers are not reported as successfully shared',async()=>{
  const denied=Object.assign(new Error('Sharing is not allowed'),{name:'NotAllowedError'});
  const device={canShare:()=>true,share:async()=>{throw denied;}};
  await assert.rejects(S.shareVideo(movie,'Story',device),error=>error===denied);
});

(function () {
  'use strict';
  const F = window.EmojiFilm;
  const S = window.EmojiShare;
  const $ = id => document.getElementById(id);
  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const STORAGE = 'emoji-movie-maker.project.v1';
  const CATEGORIES = {
    Popular: [['🧑‍🚀','astronaut space person'],['🚀','rocket space ship'],['👽','alien space green'],['🌕','moon full space'],['🪐','planet saturn space'],['✨','sparkles stars magic'],['🥹','happy tears emotional face'],['😎','cool sunglasses face'],['🥰','love hearts smile face'],['👻','ghost halloween'],['🤖','robot technology'],['🐸','frog animal'],['🐈','cat kitten animal'],['🦋','butterfly animal'],['🍄','mushroom nature'],['🌈','rainbow nature'],['🌻','sunflower flower'],['🌵','cactus desert'],['🔥','fire hot'],['💛','yellow heart love'],['🎈','balloon party'],['🎉','party confetti'],['🍿','popcorn movie'],['🛸','ufo spaceship space'],['🌎','earth planet world'],['⭐','star sky'],['🎸','guitar music'],['🦖','dinosaur trex animal'],['🐌','snail animal'],['🍕','pizza food']],
    Faces: [['😀','grinning happy face'],['😄','smile happy face'],['😂','laugh crying face'],['🥹','happy tears face'],['🥰','love hearts face'],['😍','heart eyes face'],['😎','cool sunglasses face'],['🤩','star eyes face'],['🥳','party face'],['😴','sleep tired face'],['🤔','thinking face'],['😮','surprised face'],['😱','scream scared face'],['🥺','pleading sad face'],['😭','cry sad face'],['😡','angry face'],['🤯','exploding mind face'],['🤠','cowboy face'],['🤡','clown face'],['👽','alien space'],['🤖','robot'],['👻','ghost'],['💀','skull'],['😈','devil'],['🧑‍🚀','astronaut person space'],['🧙','wizard person magic'],['🧚','fairy person'],['🧜','mermaid person'],['🕺','dancing person'],['🏃','running person']],
    Animals: [['🐈','cat kitten'],['🐕','dog puppy'],['🐇','rabbit bunny'],['🐻','bear'],['🐼','panda bear'],['🦊','fox'],['🐸','frog'],['🐵','monkey'],['🦁','lion'],['🐯','tiger'],['🐨','koala'],['🐧','penguin'],['🐤','chick bird'],['🦉','owl bird'],['🦆','duck bird'],['🦋','butterfly insect'],['🐝','bee insect'],['🐌','snail'],['🐞','ladybug insect'],['🦖','dinosaur trex'],['🦕','dinosaur long neck'],['🐢','turtle'],['🐙','octopus sea'],['🐬','dolphin sea'],['🐳','whale sea'],['🦈','shark fish'],['🐠','tropical fish'],['🦀','crab sea'],['🦄','unicorn magic'],['🐉','dragon magic']],
    Nature: [['🌕','moon full'],['🌙','moon crescent'],['☀️','sun sunny'],['⭐','star'],['🌟','glowing star'],['✨','sparkles magic'],['🌈','rainbow'],['☁️','cloud weather'],['🌧️','rain raincloud weather'],['⚡','lightning bolt'],['❄️','snowflake winter'],['🔥','fire hot'],['🌊','wave ocean water'],['💧','water drop'],['🌎','earth world planet'],['🪐','planet saturn'],['🌲','evergreen tree'],['🌳','tree'],['🌴','palm tree beach'],['🌵','cactus desert'],['🌻','sunflower flower'],['🌸','cherry blossom flower'],['🌷','tulip flower'],['🌹','rose flower'],['🍄','mushroom'],['🍀','clover lucky'],['🍃','leaves wind'],['🍂','autumn leaf'],['🪨','rock stone'],['🏔️','mountain snow']],
    Food: [['🍕','pizza'],['🍔','burger hamburger'],['🌮','taco'],['🌭','hotdog'],['🍟','fries potatoes'],['🍜','noodles ramen soup'],['🍣','sushi'],['🥑','avocado'],['🥦','broccoli'],['🥕','carrot'],['🍓','strawberry'],['🍒','cherries'],['🍉','watermelon'],['🍌','banana'],['🍋','lemon'],['🍊','orange tangerine'],['🍎','apple'],['🍍','pineapple'],['🍑','peach'],['🍇','grapes'],['🍩','donut doughnut'],['🍪','cookie'],['🧁','cupcake'],['🎂','birthday cake'],['🍦','icecream'],['🍿','popcorn'],['🍫','chocolate'],['🍭','lollipop candy'],['☕','coffee tea'],['🧋','bubble tea boba']],
    Props: [['🚀','rocket spaceship'],['🛸','ufo spaceship'],['✈️','airplane travel'],['🚗','car travel'],['🚲','bicycle bike'],['⛵','sailboat ship'],['🏠','house home'],['🏰','castle'],['⛺','tent camping'],['🎪','circus tent'],['🎈','balloon party'],['🎉','party confetti'],['🎬','movie clapperboard'],['🎥','camera movie'],['🎸','guitar music'],['🎹','piano music'],['🎵','music note'],['🎤','microphone singing'],['⚽','soccer football'],['🏀','basketball'],['🎲','dice game'],['🪁','kite'],['💎','diamond gem'],['👑','crown king queen'],['🪄','magic wand'],['🔮','crystal ball magic'],['🧸','teddy bear'],['🎁','gift present'],['💌','love letter'],['💛','yellow heart love'],['❤️','red heart love'],['💜','purple heart love'],['💥','explosion boom'],['💫','dizzy star'],['💤','sleep zzz']]
  };
  const canvas = $('stage'), ctx = canvas.getContext('2d');
  let project, selectedIndex = 0, selectedId = null, time = 0, playing = false, muted = true;
  let frame = 0, lastTick = 0, saveTimer, toastTimer, activeCategory = 'Popular', drag = null;
  const undo = [], redo = [], soundtrack = new F.Soundtrack();
  let exporting = false, recording = null, editCommit = null, lastExportURL = null, lastShareFile = null;
  $('export-dialog').insertBefore($('export-complete-template').content.cloneNode(true), $('export-fineprint'));
  let loadWarning = '';
  try {
    const stored = localStorage.getItem(STORAGE);
    project = stored ? F.sanitize(JSON.parse(stored)) : F.demo();
  } catch (_) { project = F.demo(); loadWarning = 'We could not restore your last movie. A fresh space adventure is ready.'; }
  const current = () => project.scenes[selectedIndex];
  const currentActor = () => current().actors.find(a => a.id === selectedId);
  const localTime = () => F.clamp(time - F.startOf(project, selectedIndex), 0, current().duration);
  function toast(message) { $('toast').textContent = message; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3600); }
  function saveNow() {
    clearTimeout(saveTimer);
    try { localStorage.setItem(STORAGE, JSON.stringify(project)); $('save-status').innerHTML = '<span class="status-dot"></span> Saved on this device'; }
    catch (_) { $('save-status').textContent = 'Download a project to save'; }
  }
  function save() { $('save-status').textContent = 'Saving…'; clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 250); }
  function remember(before) { undo.push(before); if (undo.length > 60) undo.shift(); redo.length = 0; updateUndo(); }
  function commit(change, options = {}) {
    if (editCommit) editCommit();
    pause(); const before = JSON.stringify(project); change();
    if (before !== JSON.stringify(project)) { remember(before); save(); }
    if (options.seek) time = F.startOf(project, selectedIndex);
    time = Math.min(time, F.total(project));
    renderUI();
  }
  function continuous(element, apply, after = () => {}) {
    let before = null;
    const finish = () => {
      if (before !== null && before !== JSON.stringify(project)) remember(before);
      before = null; if (editCommit === finish) editCommit = null;
    };
    element.addEventListener('input', () => {
      if (editCommit && editCommit !== finish) editCommit();
      if (before === null) { before = JSON.stringify(project); pause(); }
      editCommit = finish; apply(element.value); save(); after(); draw(); updateTransport();
    });
    element.addEventListener('change', () => { finish(); renderUI(); });
    element.addEventListener('blur', finish);
  }
  function updateUndo() { $('undo-btn').disabled = !undo.length; $('redo-btn').disabled = !redo.length; }
  function restore(from, to) {
    if (editCommit) editCommit(); if (!from.length) return;
    pause(); to.push(JSON.stringify(project)); project = JSON.parse(from.pop());
    selectedIndex = Math.min(selectedIndex, project.scenes.length - 1); selectedId = null; time = F.startOf(project, selectedIndex); save(); renderUI();
  }
  function updateDimensions() {
    const [w, h] = F.dimensions(project.ratio);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    $('stage-wrap').className = 'stage-wrap' + (project.ratio === 'landscape' ? '' : ' ' + project.ratio);
    $('theater-canvas').width = w; $('theater-canvas').height = h;
  }
  function draw() {
    if (playing || !selectedId) F.render(ctx, project, time);
    else F.renderScene(ctx, current(), localTime(), canvas.width, canvas.height, selectedId);
    if ($('theater-dialog').open) F.render($('theater-canvas').getContext('2d'), project, time);
  }
  function updateTransport() {
    const length = F.total(project);
    $('current-time').textContent = F.timecode(time); $('total-time').textContent = F.timecode(length);
    $('playhead').max = length; $('playhead').value = time;
    $('playhead').style.background = `linear-gradient(to right, #e8794f ${time / length * 100}%, #e4dfd5 ${time / length * 100}%)`;
    $('play-btn').innerHTML = icon(playing ? 'pause' : 'play'); $('play-btn').classList.toggle('playing', playing); $('play-btn').setAttribute('aria-label', playing ? 'Pause movie' : 'Play movie');
    $('theater-play').innerHTML = icon(playing ? 'pause' : 'play') + `<span>${playing ? 'Pause movie' : 'Play movie'}</span>`;
    $('theater-time').textContent = F.timecode(time) + ' / ' + F.timecode(length);
    $('scene-label').textContent = 'SCENE ' + String(selectedIndex + 1).padStart(2, '0');
    $('sound-btn').innerHTML = icon(muted ? 'mute' : 'volume'); $('sound-btn').setAttribute('aria-label', muted ? 'Unmute preview music' : 'Mute preview music'); $('sound-btn').title = muted ? 'Unmute preview music' : 'Mute preview music';
  }
  function renderLibrary() {
    $('categories').innerHTML = Object.keys(CATEGORIES).map(c => `<button class="category-tab ${c === activeCategory ? 'active' : ''}" data-category="${c}" aria-pressed="${c === activeCategory}">${c}</button>`).join('');
    const query = $('emoji-search').value.toLowerCase().trim();
    const all = query ? Object.values(CATEGORIES).flat() : CATEGORIES[activeCategory];
    const seen = new Set(); const list = all.filter(([emoji, name]) => { if (seen.has(emoji) || (query && !name.includes(query) && !emoji.includes(query))) return false; seen.add(emoji); return true; });
    $('emoji-grid').innerHTML = list.map(([emoji, name]) => `<button class="emoji-button" data-emoji="${escape(emoji)}" aria-label="Add ${escape(name)}" title="${escape(name)}">${emoji}</button>`).join('') || '<p class="no-emojis">No little stars found. Try “cat”, “space”, or paste your own below.</p>';
  }
  function renderBackdrops() {
    const bg = { space: 'linear-gradient(135deg,#272b4f,#756288)', sunset: 'linear-gradient(135deg,#eda590,#ffe2af)', meadow: 'linear-gradient(145deg,#d6ebd7,#95b88e)', ocean: 'linear-gradient(145deg,#a7e1e7,#67abc7)', city: 'linear-gradient(145deg,#434c70,#9696b8)', studio: 'linear-gradient(145deg,#fbe2d5,#e7aba6)' };
    $('backdrops').innerHTML = Object.entries(F.THEMES).map(([key, theme]) => `<button class="backdrop-button ${key === current().theme ? 'active' : ''}" data-theme="${key}" style="--backdrop:${bg[key]}" aria-label="${theme.name}" aria-pressed="${key === current().theme}" title="${theme.name}"><span>${theme.emoji}</span></button>`).join('');
  }
  function renderTimeline() {
    $('timeline-track').innerHTML = project.scenes.map((s, i) => `<article class="scene-card ${i === selectedIndex ? 'active' : ''}" draggable="true" data-scene="${i}" aria-grabbed="false"><button class="scene-card-button" data-select="${i}" aria-label="Scene ${i + 1}: ${escape(s.name)}, ${s.duration} seconds" aria-pressed="${i === selectedIndex}"><div class="scene-thumb"><canvas width="320" height="180" data-thumb="${i}" aria-hidden="true"></canvas><span class="thumb-index">${String(i + 1).padStart(2,'0')}</span><span class="thumb-duration">${s.duration}s</span></div><div class="scene-name-row"><b>${escape(s.name)}</b><span aria-hidden="true">⠿</span></div></button></article>`).join('') + `<button class="add-scene-card" id="add-scene-card">${icon('plus')}<span>A new chapter</span></button>`;
    document.querySelectorAll('[data-thumb]').forEach(c => {
      const s = project.scenes[Number(c.dataset.thumb)], [w,h] = F.dimensions(project.ratio);
      c.width = 320; c.height = Math.round(320 * h / w); F.renderScene(c.getContext('2d'), s, Math.min(.9, s.duration / 2), c.width, c.height);
    });
    $('scene-count').textContent = project.scenes.length + (project.scenes.length === 1 ? ' scene' : ' scenes');
    $('movie-length').textContent = `${F.total(project)} seconds of possibility`;
    $('delete-scene').disabled = project.scenes.length === 1; $('scene-left').disabled = selectedIndex === 0; $('scene-right').disabled = selectedIndex === project.scenes.length - 1;
    $('add-scene').disabled = project.scenes.length >= 30; $('add-scene-card').disabled = project.scenes.length >= 30; $('duplicate-scene').disabled = project.scenes.length >= 30;
  }
  function updateInspector() {
    const s = current(); $('inspector-number').textContent = String(selectedIndex + 1).padStart(2,'0');
    $('scene-name').value = s.name; $('caption').value = s.caption; $('caption-count').textContent = `${s.caption.length}/180`;
    $('duration').value = s.duration; $('duration-less').disabled = s.duration <= 1; $('duration-more').disabled = s.duration >= 15;
    $('transition').value = s.transition; $('ratio-select').value = project.ratio; $('music-select').value = project.music; $('project-title').value = project.title;
    const a = currentActor(); $('actor-settings').hidden = !a;
    if (a) { $('actor-emoji').textContent = a.emoji; $('motion').value = a.motion; $('actor-size').value = a.size; $('size-value').textContent = Math.round(a.size); $('actor-flip').setAttribute('aria-pressed', a.flip); }
    $('selected-hint').innerHTML = a ? '<span class="mini-key">↔</span> Drag to move · arrow keys to nudge · Del to remove' : '<span class="mini-key">↖</span> Click a character to make it yours';
    renderBackdrops();
  }
  function renderUI() { updateDimensions(); updateInspector(); renderTimeline(); updateTransport(); updateUndo(); draw(); }
  function selectScene(index, seek = true) {
    if (editCommit) editCommit(); pause(); selectedIndex = F.clamp(index, 0, project.scenes.length - 1); selectedId = null;
    if (seek) time = F.startOf(project, selectedIndex);
    renderUI();
  }
  function addEmoji(emoji) {
    if (current().actors.length >= 40) return toast('This scene already has 40 stars. Give the next scene a turn.');
    commit(() => { const count = current().actors.length; const a = F.actor(emoji, .35 + (count % 4) * .1, .42 + (count % 3) * .05, 155, 'float'); current().actors.push(a); selectedId = a.id; });
    toast('A new star is born. Drag it to find its spot.');
  }
  function addScene() {
    if (project.scenes.length >= 30) return;
    commit(() => { const s = F.scene({ name: `Scene ${project.scenes.length + 1}`, theme: current().theme }); project.scenes.splice(selectedIndex + 1, 0, s); selectedIndex++; selectedId = null; }, { seek: true });
    scrollSelected();
  }
  function scrollSelected() { document.querySelector(`[data-scene="${selectedIndex}"]`)?.scrollIntoView({ behavior:'smooth', block:'nearest', inline:'nearest' }); }
  function moveScene(from, to) {
    if (from === to || to < 0 || to >= project.scenes.length) return;
    commit(() => { const s = project.scenes.splice(from, 1)[0]; project.scenes.splice(to, 0, s); selectedIndex = to; selectedId = null; }, { seek: true }); scrollSelected();
  }
  function pause() { playing = false; cancelAnimationFrame(frame); soundtrack.stop(); updateTransport(); }
  function tick(now) {
    if (!playing) return;
    time += Math.min((now - lastTick) / 1000, .15); lastTick = now;
    if (time >= F.total(project)) { time = F.total(project); selectedIndex = project.scenes.length - 1; pause(); renderUI(); return; }
    const index = F.locate(project, time).index;
    if (index !== selectedIndex) { selectedIndex = index; updateInspector(); document.querySelectorAll('[data-scene]').forEach(card => { const active = Number(card.dataset.scene) === index; card.classList.toggle('active', active); card.querySelector('button').setAttribute('aria-pressed', active); }); }
    draw(); updateTransport(); frame = requestAnimationFrame(tick);
  }
  function play() {
    if (exporting) return;
    if (playing) { pause(); draw(); return; }
    if (editCommit) editCommit();
    if (time >= F.total(project) - .02) { time = 0; selectedIndex = 0; }
    selectedId = null; playing = true; updateInspector(); lastTick = performance.now();
    if (!muted && project.music !== 'none') soundtrack.start(project.music, time).catch(err => toast(err.message));
    updateTransport(); frame = requestAnimationFrame(tick);
  }
  function seek(value) { pause(); time = F.clamp(Number(value), 0, F.total(project)); selectedIndex = F.locate(project, time).index; selectedId = null; renderUI(); }
  function removeActor() { if (!currentActor()) return; commit(() => { current().actors = current().actors.filter(a => a.id !== selectedId); selectedId = null; }); }
  function slug() { return (project.title.trim() || 'my-emoji-movie').replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/\s+/g,'-').slice(0,80) || 'my-emoji-movie'; }
  function download(blob, name, retain = false) {
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); if (!retain) setTimeout(() => URL.revokeObjectURL(url), 60000);
    return {url, name};
  }
  function finishExport(blob, name, preview = null) {
    if(lastExportURL)URL.revokeObjectURL(lastExportURL);
    const result = download(blob, name, true); lastExportURL = result.url;
    $('export-choices').hidden = true; $('export-progress').hidden = true; $('export-go').hidden = true; $('cancel-export').hidden = true; $('export-complete').hidden = false;
    $('export-download').href = result.url; $('export-download').download = result.name; $('export-result-name').textContent = result.name;
    if(preview?.type==='video'){
      $('export-video').hidden=false;$('export-video').src=result.url;
      try{lastShareFile=new File([blob],name,{type:S.mimeType(blob.type)});}catch(_){lastShareFile=null;}
      $('social-sharing').hidden=false;
      const direct=S.canShareVideo(lastShareFile);
      $('share-video').hidden=!lastShareFile;
      $('share-video').disabled=false;
      $('share-video').innerHTML=icon(direct?'share':'download')+(direct?'Share video':'Download for social media');
      $('share-hint').textContent=direct?'Choose an installed app in your device’s share menu. You’ll review the post there.':'Save your video, then open a platform below and select that file. You’ll finish the post there.';
      $('share-format').textContent=S.mimeType(blob.type)==='video/mp4'?'MP4 video · Ready to upload and share.':'WebM video · If a platform asks for MP4, try a browser that offers MP4 recording.';
      $('export-download').textContent='Download video';
      $('export-download').classList.add('video-download');
    }
    if(preview?.type==='player'){$('export-player').hidden=false;$('export-player').srcdoc=preview.html;}
    $('export-fineprint').textContent = 'Your file is ready to keep or share.';
  }
  function saveProject() { if (editCommit) editCommit(); download(new Blob([JSON.stringify(project, null, 2)], {type:'application/json'}), slug() + '.emoji.json'); toast('Project copy downloaded. Open it here whenever you like.'); }

  // This function is serialized into the standalone HTML movie. It has no editor dependencies.
  function standalonePlayer() {
    const F = window.EmojiFilm, project = JSON.parse(document.getElementById('film-data').textContent), canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d');
    const [w,h] = F.dimensions(project.ratio); canvas.width = w; canvas.height = h;
    const play = document.getElementById('player-play'), seek = document.getElementById('player-seek'), sound = document.getElementById('player-sound'), label = document.getElementById('player-time');
    const audio = new F.Soundtrack(); let time = 0, running = false, muted = true, last = 0, frame;
    seek.max = F.total(project); document.getElementById('player-title').textContent = project.title;
    function render() { F.render(ctx, project, time); seek.value = time; label.textContent = F.timecode(time) + ' / ' + F.timecode(F.total(project)); play.textContent = running ? 'Ⅱ Pause' : time >= F.total(project) ? '↺ Replay' : '▶ Play movie'; }
    function stop() { running = false; cancelAnimationFrame(frame); audio.stop(); render(); }
    function tick(now) { if (!running) return; time = Math.min(time + Math.min((now-last)/1000,.15),F.total(project)); last = now; render(); if(time >= F.total(project)) stop(); else frame = requestAnimationFrame(tick); }
    function toggle() { if(running) return stop(); if(time >= F.total(project)) time=0; running=true; last=performance.now(); if(!muted) audio.start(project.music,time).catch(()=>{}); render(); frame=requestAnimationFrame(tick); }
    play.onclick = toggle;
    seek.oninput = () => { const value=Number(seek.value); stop(); time=value; render(); };
    sound.onclick = () => { muted=!muted; sound.textContent=muted?'♫ Sound off':'♫ Sound on'; sound.setAttribute('aria-pressed',String(!muted)); if(muted) audio.stop(); else if(running) audio.start(project.music,time).catch(()=>{}); };
    document.addEventListener('keydown',e=>{if(e.code==='Space'&&e.target.tagName!=='INPUT'&&e.target.tagName!=='BUTTON'){e.preventDefault();toggle();}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    window.addEventListener('pagehide',()=>audio.close()); render();
  }
  function playerHTML() {
    const data = JSON.stringify(project).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    const engine = $('movie-engine').textContent;
    return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(project.title)} — An emoji movie</title><style>*{box-sizing:border-box}body{margin:0;background:#191d2f;color:#fff8ef;font-family:"Segoe UI",Arial,sans-serif;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px}.player{width:min(1100px,100%);text-align:center}small{color:#aaa0bb;font-size:10px;letter-spacing:2px}h1{font-size:clamp(22px,4vw,36px);font-weight:500;letter-spacing:-1px;margin:12px 0 25px}canvas{display:block;width:auto;height:auto;max-width:100%;max-height:68dvh;margin:auto;border-radius:12px}nav{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:20px;flex-wrap:wrap}button{background:#e8794f;color:white;border:0;padding:12px 18px;border-radius:8px;cursor:pointer;font:600 12px "Segoe UI",sans-serif}button:last-child{background:#302d44;color:#d9cfe8}input{accent-color:#e8794f;width:min(300px,70vw);cursor:pointer}#player-time{color:#b9afc7;font-size:11px;font-variant-numeric:tabular-nums}footer{font-size:10px;color:#776e8a;margin-top:23px}button:focus-visible,input:focus-visible{outline:3px solid #dab3ff;outline-offset:4px}</style><main class="player"><small>AN EMOJI MOVIE</small><h1 id="player-title"></h1><canvas aria-label="Animated emoji movie"></canvas><nav><button id="player-play">▶ Play movie</button><input id="player-seek" type="range" min="0" value="0" step=".01" aria-label="Movie playhead"><span id="player-time"></span><button id="player-sound" aria-pressed="false">♫ Sound off</button></nav><footer>Made with Emoji Movie Maker · Little characters. Big stories.</footer></main><script type="application/json" id="film-data">${data}<\/script><script>${engine}<\/script><script>(${standalonePlayer.toString()})();<\/script></html>`;
  }
  function videoType() {
    if (!window.MediaRecorder || !canvas.captureStream) return null;
    return S.chooseVideoType(type=>MediaRecorder.isTypeSupported(type));
  }
  function openExport() {
    if (editCommit) editCommit(); pause();
    $('export-summary').textContent = `${project.title || 'Untitled movie'} · ${project.scenes.length} ${project.scenes.length===1?'scene':'scenes'} · ${F.total(project)}s · ${F.dimensions(project.ratio).join(' × ')}`;
    const supported = videoType(); const radio = document.querySelector('input[name="export-format"][value="video"]'); radio.disabled = !supported;
    $('video-description').textContent = supported ? `An animated ${supported.includes('mp4')?'MP4':'WebM'} movie, ready to download or share.` : 'Video recording is unavailable here. Try Chrome or Edge.';
    if (!supported) document.querySelector('input[name="export-format"][value="player"]').checked = true;
    resetExport(); updateExportChoice(); $('export-dialog').showModal();
  }
  function updateExportChoice() { const type = document.querySelector('input[name="export-format"]:checked').value; $('export-go').innerHTML = icon('download') + `<span>${{video:'Download video',player:'Download playable movie',project:'Download project'}[type]}</span>`; $('export-fineprint').textContent = type === 'video' ? 'Video records in real time. Keep this tab visible.' : 'Made on your device. Your movie stays yours.'; }
  function stopExportPreview(){ $('export-video').pause(); $('export-video').removeAttribute('src'); $('export-video').load(); $('export-player').removeAttribute('srcdoc'); $('export-video').hidden=true; $('export-player').hidden=true; $('social-sharing').hidden=true; lastShareFile=null; $('export-download').textContent='Download file again'; $('export-download').classList.remove('video-download'); }
  function resetExport() { exporting = false; stopExportPreview(); if(lastExportURL){URL.revokeObjectURL(lastExportURL);lastExportURL=null;} $('export-complete').hidden = true; $('export-progress').hidden = true; $('export-choices').hidden = false; $('cancel-export').hidden = true; $('export-go').hidden = false; $('export-go').disabled = false; $('progress-fill').style.width = '0%'; }
  async function exportVideo() {
    const mime = videoType(); if (!mime || exporting) return;
    exporting = true; $('export-choices').hidden = true; $('export-progress').hidden = false; $('export-go').hidden = true; $('cancel-export').hidden = false; $('progress-label').textContent = 'Setting the scene…';
    const film = F.copy(project), output = document.createElement('canvas'), [w,h] = F.dimensions(film.ratio); output.width=w; output.height=h;
    const out = output.getContext('2d'); F.render(out, film, 0);
    const stream = output.captureStream(30), audio = new F.Soundtrack(), chunks = []; let timer, recorder, cancelled = false;
    const cleanup = () => { clearTimeout(timer); stream.getTracks().forEach(t=>t.stop()); audio.close(); recording = null; resetExport(); };
    const cancel = () => { cancelled = true; if(recorder && recorder.state !== 'inactive') recorder.stop(); else cleanup(); };
    recording = { cancel };
    try {
      if (film.music !== 'none') {
        const ac = await audio.ensure(); if (!exporting || cancelled) { cleanup(); return; }
        const destination = ac.createMediaStreamDestination(); stream.addTrack(destination.stream.getAudioTracks()[0]);
        await audio.start(film.music, 0, destination);
      }
      if (cancelled || !exporting) { cleanup(); return; }
      recorder = new MediaRecorder(stream, {mimeType:mime, videoBitsPerSecond:4500000});
      recorder.ondataavailable = event => { if(event.data.size) chunks.push(event.data); };
      recorder.onerror = () => { cancelled=true; cleanup(); toast('Video recording failed. You can still download a playable movie.'); };
      recorder.onstop = async () => {
        $('progress-label').textContent='Adding the final touches…';
        const raw = new Blob(chunks, {type:recorder.mimeType || mime});
        const blob = cancelled ? raw : await F.fixWebmDuration(raw,F.total(film)); cleanup();
        if(!cancelled && blob.size) { finishExport(blob,slug()+ (mime.includes('mp4')?'.mp4':'.webm'),{type:'video'}); toast('That’s a wrap! Your movie video is ready.'); }
        else if(!cancelled) toast('The recording was empty. Try the playable movie download.');
      };
      recorder.start(200);
      const began = performance.now(), length = F.total(film);
      const recordFrame = () => {
        if (cancelled || recorder.state === 'inactive') return;
        const t = Math.min((performance.now()-began)/1000,length); F.render(out,film,t);
        const pct = Math.min(100,Math.floor(t/length*100)); $('progress-fill').style.width = pct+'%'; $('progress-label').textContent = `Rolling… ${pct}% · ${Math.ceil(length-t)}s to go`;
        if(t>=length) { audio.stop(); setTimeout(()=>{if(recorder.state!=='inactive')recorder.stop();},80); } else timer=setTimeout(recordFrame,1000/30);
      };
      recordFrame();
    } catch(err) { cancelled=true; if(recorder && recorder.state!=='inactive') recorder.stop(); cleanup(); toast('Could not record a video here. Download a playable movie, or try Chrome or Edge.'); }
  }

  $('categories').onclick = e => { const btn=e.target.closest('[data-category]'); if(btn){activeCategory=btn.dataset.category;$('emoji-search').value='';renderLibrary();} };
  $('emoji-search').oninput = renderLibrary;
  $('emoji-grid').onclick = e => { const btn=e.target.closest('[data-emoji]'); if(btn)addEmoji(btn.dataset.emoji); };
  $('custom-add').onclick = () => {
    const text = $('custom-emoji').value.trim(); if (!text) return $('custom-emoji').focus();
    // A grapheme keeps flags, skin tones, and joined emoji families together.
    const first = typeof Intl.Segmenter === 'function' ? Array.from(new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text))[0].segment : Array.from(text).slice(0,4).join('');
    if(!/\p{Extended_Pictographic}|\p{Regional_Indicator}|[0-9#*]\uFE0F?\u20E3/u.test(first))return toast('Paste an emoji, like 🦊 or 🪄, to add a new star.');
    addEmoji(first); $('custom-emoji').value='';
  };
  $('custom-emoji').onkeydown = e => {if(e.key==='Enter'){e.preventDefault();$('custom-add').click();}};
  $('motion').innerHTML = Object.entries(F.MOTIONS).map(([key,name])=>`<option value="${key}">${name}</option>`).join('');
  continuous($('project-title'),v=>{project.title=v;});
  continuous($('scene-name'),v=>{current().name=v;},renderTimeline);
  continuous($('caption'),v=>{current().caption=v;$('caption-count').textContent=`${v.length}/180`;},renderTimeline);
  continuous($('duration'),v=>{if(v!==''&&Number.isFinite(Number(v))){current().duration=F.clamp(Number(v),1,15);time=F.startOf(project,selectedIndex);}},renderTimeline);
  continuous($('actor-size'),v=>{const a=currentActor();if(a){a.size=Number(v);$('size-value').textContent=v;}},renderTimeline);
  function changeDuration(amount){commit(()=>{current().duration=F.clamp(Math.round((current().duration+amount)*2)/2,1,15);},{seek:true});}
  $('duration-less').onclick=()=>changeDuration(-.5); $('duration-more').onclick=()=>changeDuration(.5);
  $('transition').onchange=e=>commit(()=>{current().transition=e.target.value;});
  $('ratio-select').onchange=e=>commit(()=>{project.ratio=e.target.value;});
  $('music-select').onchange=e=>commit(()=>{project.music=e.target.value;});
  $('backdrops').onclick=e=>{const btn=e.target.closest('[data-theme]');if(btn)commit(()=>{current().theme=btn.dataset.theme;});};
  $('motion').onchange=e=>commit(()=>{const a=currentActor();if(a)a.motion=e.target.value;});
  $('actor-flip').onclick=()=>commit(()=>{const a=currentActor();if(a)a.flip=!a.flip;});
  $('actor-delete').onclick=removeActor;
  $('bring-front').onclick=()=>commit(()=>{const a=currentActor();if(a){current().actors=current().actors.filter(x=>x.id!==a.id);current().actors.push(a);}});
  $('undo-btn').onclick=()=>restore(undo,redo); $('redo-btn').onclick=()=>restore(redo,undo);
  $('play-btn').onclick=play; $('restart-btn').onclick=()=>seek(0); $('playhead').oninput=e=>seek(e.target.value);
  $('sound-btn').onclick=()=>{muted=!muted;if(muted)soundtrack.stop();else if(playing)soundtrack.start(project.music,time).catch(e=>toast(e.message));else toast(project.music==='none'?'Choose a soundtrack in scene settings.':'Sound is on. Press play to hear your soundtrack.');updateTransport();};
  $('add-scene').onclick=addScene;
  $('duplicate-scene').onclick=()=>{if(project.scenes.length>=30)return;commit(()=>{const s=F.copy(current());s.id=F.uid();s.name=(s.name+' (copy)').slice(0,60);s.actors.forEach(a=>a.id=F.uid());project.scenes.splice(selectedIndex+1,0,s);selectedIndex++;selectedId=null;},{seek:true});scrollSelected();};
  $('delete-scene').onclick=()=>{if(project.scenes.length<=1)return;commit(()=>{project.scenes.splice(selectedIndex,1);selectedIndex=Math.min(selectedIndex,project.scenes.length-1);selectedId=null;},{seek:true});};
  $('scene-left').onclick=()=>moveScene(selectedIndex,selectedIndex-1); $('scene-right').onclick=()=>moveScene(selectedIndex,selectedIndex+1);
  $('timeline-track').onclick=e=>{const btn=e.target.closest('[data-select]');if(btn)selectScene(Number(btn.dataset.select));else if(e.target.closest('#add-scene-card'))addScene();};
  let draggedIndex=null;
  $('timeline-track').addEventListener('dragstart',e=>{const card=e.target.closest('[data-scene]');if(!card)return;draggedIndex=Number(card.dataset.scene);e.dataTransfer.setData('text/plain',String(draggedIndex));e.dataTransfer.effectAllowed='move';card.setAttribute('aria-grabbed','true');});
  $('timeline-track').addEventListener('dragover',e=>{const card=e.target.closest('[data-scene]');if(card&&draggedIndex!==null){e.preventDefault();e.dataTransfer.dropEffect='move';document.querySelectorAll('.drag-over').forEach(c=>c.classList.remove('drag-over'));card.classList.add('drag-over');}});
  $('timeline-track').addEventListener('drop',e=>{e.preventDefault();const card=e.target.closest('[data-scene]');if(card&&draggedIndex!==null)moveScene(draggedIndex,Number(card.dataset.scene));draggedIndex=null;});
  $('timeline-track').addEventListener('dragend',()=>{draggedIndex=null;document.querySelectorAll('[data-scene]').forEach(c=>{c.classList.remove('drag-over');c.setAttribute('aria-grabbed','false');});});
  function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};}
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0||exporting)return; if(editCommit)editCommit(); pause();const p=point(e),a=F.hitTest(current(),p.x,p.y,localTime(),canvas.width,canvas.height);
    selectedId=a?a.id:null;updateInspector();draw();canvas.focus({preventScroll:true});
    if(a){drag={id:a.id,start:p,x:a.x,y:a.y,before:JSON.stringify(project)};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';}
  });
  canvas.addEventListener('pointermove',e=>{
    const p=point(e);if(!drag){canvas.style.cursor=F.hitTest(current(),p.x,p.y,localTime(),canvas.width,canvas.height)?'grab':'default';return;}
    const a=currentActor();if(!a)return;a.x=F.clamp(drag.x+p.x-drag.start.x,.06,.94);a.y=F.clamp(drag.y+p.y-drag.start.y,.08,.84);draw();
  });
  function finishDrag(){if(!drag)return;if(drag.before!==JSON.stringify(project)){remember(drag.before);save();renderTimeline();}drag=null;canvas.style.cursor='grab';}
  canvas.addEventListener('pointerup',finishDrag);canvas.addEventListener('pointercancel',finishDrag);canvas.addEventListener('lostpointercapture',finishDrag);
  canvas.addEventListener('keydown',e=>{const a=currentActor();if(!a)return;const dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(dir){e.preventDefault();commit(()=>{const step=e.shiftKey ? .04 : .008;a.x=F.clamp(a.x+dir[0]*step,.06,.94);a.y=F.clamp(a.y+dir[1]*step,.08,.84);});}else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();removeActor();}});
  document.addEventListener('keydown',e=>{
    const editing=/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!editing){e.preventDefault();restore(e.shiftKey?redo:undo,e.shiftKey?undo:redo);return;}
    if(editing||exporting||document.querySelector('dialog[open]'))return;
    if(e.code==='Space'&&e.target.tagName!=='BUTTON'){e.preventDefault();play();}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveProject();}
  });
  $('fullscreen-btn').onclick=()=>{pause();$('theater-title').textContent=project.title||'Untitled movie';$('theater-dialog').showModal();draw();};
  $('theater-close').onclick=()=>{$('theater-dialog').close();pause();draw();};$('theater-play').onclick=play;
  $('theater-dialog').addEventListener('close',()=>{pause();draw();});
  $('help-btn').onclick=()=>{pause();$('help-dialog').showModal();};
  $('projects-btn').onclick=()=>{if(editCommit)editCommit();pause();$('project-dialog').showModal();};
  $('save-project').onclick=()=>{saveProject();$('project-dialog').close();};$('open-project').onclick=()=>$('project-file').click();
  function replaceProject(next){commit(()=>{project=next;selectedIndex=0;selectedId=null;time=0;});$('project-dialog').close();}
  $('new-project').onclick=()=>{saveProject();replaceProject({version:1,title:'My little movie',ratio:'landscape',music:'none',scenes:[F.scene({name:'The beginning',theme:'meadow',actors:[F.actor('🐈',.5,.55,180,'bounce')]})]});toast('A blank canvas and one curious cat. Make it yours.');};
  $('load-demo').onclick=()=>{saveProject();replaceProject(F.demo());toast('The space adventure is back. Your previous movie was downloaded.');};
  $('project-file').onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    try{if(file.size>2000000)throw new Error('That file is too large. Choose a project under 2 MB.');const next=F.sanitize(JSON.parse(await file.text()));replaceProject(next);toast('Project opened. Lights, camera, emoji!');}
    catch(err){toast(err instanceof SyntaxError?'That file is not a readable project. Choose an Emoji Movie Maker JSON file.':err.message);}
    finally{e.target.value='';}
  };
  $('export-btn').onclick=openExport;
  document.querySelectorAll('input[name="export-format"]').forEach(el=>el.onchange=updateExportChoice);
  $('export-go').onclick=()=>{const type=document.querySelector('input[name="export-format"]:checked').value;if(type==='video')exportVideo();else if(type==='project'){finishExport(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),slug()+'.emoji.json');}else{const html=playerHTML();finishExport(new Blob([html],{type:'text/html;charset=utf-8'}),slug()+'.movie.html',{type:'player',html});toast('Playable movie ready. Share the HTML file to share your story.');}};
  $('export-done').onclick=()=>$('export-dialog').close();
  $('share-video').onclick=async()=>{
    const file=lastShareFile;if(!file)return;
    if(!S.canShareVideo(file)){
      download(file,file.name);
      $('share-hint').textContent='Your video is downloaded. Open a platform below, select this file, and finish your post.';
      toast('Video downloaded. Choose a platform below to upload it.');
      return;
    }
    const button=$('share-video');button.disabled=true;
    try{
      const result=await S.shareVideo(file,project.title||'My emoji movie');
      if(result.status==='shared')toast('Your movie was passed to the share app. Finish your post there.');
      else if(result.status==='cancelled')toast('Sharing cancelled. Your movie is still ready.');
      else toast('Use Download video, then choose an upload page below.');
    }catch(_){$('share-hint').textContent='This device couldn’t share the file directly. Download the video, then select it on an upload page below.';toast('Direct sharing is unavailable. Your video is still ready to download.');}
    finally{button.disabled=false;}
  };
  $('cancel-export').onclick=()=>{recording?.cancel();toast('Recording cancelled. Your movie is still here.');};
  $('export-dialog').addEventListener('close',()=>{if(exporting)recording?.cancel();stopExportPreview();});
  $('export-dialog').addEventListener('cancel',()=>{if(exporting)recording?.cancel();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(playing)pause();if(exporting){recording?.cancel();toast('Recording paused by a hidden tab. Keep this tab visible and try again.');}}});
  window.addEventListener('pagehide',()=>{saveNow();soundtrack.close();recording?.cancel();if(lastExportURL)URL.revokeObjectURL(lastExportURL);});
  document.querySelector('.brand').onclick=e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});};
  renderLibrary();renderUI();saveNow();if(loadWarning)toast(loadWarning);
})();

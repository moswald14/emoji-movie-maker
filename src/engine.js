/* Emoji Movie Maker — shared editor and exported-player rendering. */
(function (root) {
  'use strict';
  const VERSION = 1;
  const FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  const THEMES = {
    space: { name: 'Deep space', emoji: '🪐', color: '#272343', ink: '#ffffff' },
    sunset: { name: 'Golden hour', emoji: '🌅', color: '#edab91', ink: '#4c2939' },
    meadow: { name: 'Daydream meadow', emoji: '🌿', color: '#b9dabf', ink: '#264939' },
    ocean: { name: 'Under the sea', emoji: '🫧', color: '#8dd4e4', ink: '#133a58' },
    city: { name: 'City lights', emoji: '🌃', color: '#6576a4', ink: '#ffffff' },
    studio: { name: 'Peach studio', emoji: '🍑', color: '#f4cec1', ink: '#693f43' }
  };
  const MOTIONS = { float: 'Float', bounce: 'Bounce', travel: 'Glide across', wiggle: 'Wiggle', spin: 'Spin', pop: 'Pop in', still: 'Stay still' };
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const number = (v, fallback, min, max) => typeof v === 'number' && Number.isFinite(v) ? clamp(v, min, max) : fallback;
  const uid = () => 'e' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const copy = v => JSON.parse(JSON.stringify(v));
  const dimensions = ratio => ratio === 'portrait' ? [720, 1280] : ratio === 'square' ? [960, 960] : [1280, 720];
  function actor(emoji, x, y, size = 150, motion = 'float') {
    return { id: uid(), emoji, x, y, size, motion, flip: false, rotation: 0 };
  }
  function scene(overrides = {}) {
    return { id: uid(), name: 'New scene', duration: 4, theme: 'space', caption: '', transition: 'fade', actors: [], ...overrides };
  }
  function demo() {
    return { version: VERSION, title: 'One small leap', ratio: 'landscape', music: 'orbit', scenes: [
      scene({ name: 'The big idea', duration: 4, caption: 'Every adventure starts with a little curiosity.', actors: [actor('🧑‍🚀', .28, .57, 182, 'float'), actor('🚀', .62, .46, 208, 'float'), actor('🌕', .83, .23, 85, 'still')] }),
      scene({ name: 'A new friend', duration: 4, theme: 'sunset', caption: 'And sometimes, a very unexpected friend.', actors: [actor('🧑‍🚀', .31, .58, 174, 'bounce'), actor('👽', .66, .56, 185, 'wiggle'), actor('💛', .50, .28, 84, 'pop')] }),
      scene({ name: 'Off we go', duration: 4, caption: 'The universe is better together.', actors: [actor('🚀', .50, .45, 225, 'travel'), actor('✨', .25, .35, 90, 'spin'), actor('🪐', .79, .26, 116, 'float')] })
    ] };
  }
  function sanitize(raw) {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.scenes) || !raw.scenes.length) throw new Error('Choose an Emoji Movie Maker project file.');
    if (raw.version !== VERSION) throw new Error('This project uses an unsupported version.');
    if (raw.scenes.length > 30) throw new Error('A movie can have up to 30 scenes.');
    const safe = { version: VERSION, title: String(raw.title || 'Untitled movie').slice(0, 80), ratio: ['landscape', 'portrait', 'square'].includes(raw.ratio) ? raw.ratio : 'landscape', music: ['none', 'orbit', 'playful', 'dream'].includes(raw.music) ? raw.music : 'none', scenes: [] };
    for (const s of raw.scenes) {
      if (!s || typeof s !== 'object') throw new Error('This project contains an unreadable scene.');
      safe.scenes.push(scene({ name: String(s.name || 'Untitled scene').slice(0, 60), duration: number(s.duration, 4, 1, 15), theme: THEMES[s.theme] ? s.theme : 'space', caption: String(s.caption || '').slice(0, 180), transition: s.transition === 'cut' ? 'cut' : 'fade', actors: (Array.isArray(s.actors) ? s.actors : []).slice(0, 40).filter(a => a && typeof a === 'object').map(a => ({ id: uid(), emoji: String(a.emoji || '✨').slice(0, 24), x: number(a.x, .5, .06, .94), y: number(a.y, .5, .08, .84), size: number(a.size, 150, 48, 320), motion: MOTIONS[a.motion] ? a.motion : 'still', flip: !!a.flip, rotation: number(a.rotation, 0, -180, 180) })) }));
    }
    return safe;
  }
  function total(project) { return project.scenes.reduce((n, s) => n + s.duration, 0); }
  function locate(project, time) {
    const t = clamp(Number(time) || 0, 0, total(project));
    let start = 0;
    for (let i = 0; i < project.scenes.length; i++) {
      const s = project.scenes[i];
      if (t < start + s.duration || i === project.scenes.length - 1) return { scene: s, index: i, local: Math.min(s.duration, t - start), start };
      start += s.duration;
    }
  }
  function startOf(project, index) { return project.scenes.slice(0, index).reduce((n, s) => n + s.duration, 0); }
  function pose(a, time, duration) {
    const phase = time * Math.PI * 1.4;
    let dx = 0, dy = 0, rotation = a.rotation * Math.PI / 180, scale = 1;
    if (a.motion === 'float') { dy = Math.sin(phase) * .023; rotation += Math.sin(phase * .6) * .045; }
    if (a.motion === 'bounce') dy = -Math.abs(Math.sin(phase * 1.2)) * .065;
    if (a.motion === 'travel') { dx = (time / duration - .5) * .43; dy = -Math.sin(time / duration * Math.PI) * .07; }
    if (a.motion === 'wiggle') rotation += Math.sin(phase * 2.5) * .16;
    if (a.motion === 'spin') rotation += time * .85;
    if (a.motion === 'pop') { const p = clamp(time / .6, 0, 1); scale = p === 1 ? 1 : Math.max(.01, 1 - Math.pow(1 - p, 3) * Math.cos(p * Math.PI * 3)); }
    return { x: a.x + dx, y: a.y + dy, rotation, scale };
  }
  function roundRect(ctx, x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function ellipse(ctx, x, y, rx, ry, color, rotation = 0) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  }
  function background(ctx, theme, w, h, t) {
    const grad = ctx.createLinearGradient(0, 0, w * .3, h);
    const palettes = { space: ['#171c39', '#3a3159'], sunset: ['#ebad9c', '#ffe1b5'], meadow: ['#d8eddd', '#c9dfc8'], ocean: ['#b8e9e9', '#3b91b9'], city: ['#293451', '#9091b6'], studio: ['#fbe4d9', '#edb6af'] };
    const p = palettes[theme] || palettes.space;
    grad.addColorStop(0, p[0]); grad.addColorStop(1, p[1]); ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    if (theme === 'space') {
      ctx.save(); ctx.strokeStyle = 'rgba(205,195,244,.09)'; ctx.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(w * .55, h * .48, w * (.36 + i * .12), h * (.29 + i * .1), -.22, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
      for (let i = 0; i < 80; i++) {
        const x = ((i * 743 + 67) % 1280) / 1280 * w, y = ((i * 359 + 41) % 720) / 720 * h;
        const a = .26 + .47 * (Math.sin(t * .8 + i * 2) + 1) / 2;
        ellipse(ctx, x, y, (i % 4 === 0 ? 1.8 : 1) * w / 1280, (i % 4 === 0 ? 1.8 : 1) * w / 1280, `rgba(255,241,213,${a})`);
        if (i % 19 === 0) { ctx.strokeStyle = `rgba(255,220,164,${a})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); ctx.stroke(); }
      }
      ellipse(ctx, w * .02, h * 1.3, w * .47, h * .51, '#555477', -.3);
      ellipse(ctx, w * .03, h * 1.29, w * .43, h * .48, '#66618b', -.3);
    } else if (theme === 'sunset') {
      ellipse(ctx, w * .75, h * .33, h * .17, h * .17, '#fff0c4');
      ctx.fillStyle = '#db9ca0'; ctx.beginPath(); ctx.moveTo(0, h * .73); ctx.bezierCurveTo(w * .2, h * .42, w * .5, h * .91, w, h * .55); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
      ctx.fillStyle = '#a78098'; ctx.beginPath(); ctx.moveTo(0, h * .86); ctx.bezierCurveTo(w * .4, h * .63, w * .65, h * .65, w, h * .84); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    } else if (theme === 'meadow') {
      ellipse(ctx, w * .8, h * .24, h * .105, h * .105, '#fff3bb');
      for (let i = 0; i < 4; i++) { const x = ((i * .27 + .1 + t * .003) % 1.2) * w; ellipse(ctx, x, h * (.2 + i % 2 * .12), w * .07, h * .03, '#edf6ea'); ellipse(ctx, x + w * .04, h * (.19 + i % 2 * .12), w * .05, h * .035, '#edf6ea'); }
      ellipse(ctx, w * .15, h * 1.21, w * .7, h * .55, '#a8c89c'); ellipse(ctx, w * .9, h * 1.08, w * .7, h * .38, '#8fb88b');
      for (let i = 0; i < 22; i++) { const x = ((i * 197) % 1280) / 1280 * w, y = h * (.84 + (i % 5) * .029); ellipse(ctx, x, y, w * .003, w * .003, i % 2 ? '#f9ebaf' : '#f3d7e4'); }
    } else if (theme === 'ocean') {
      ctx.save(); ctx.globalAlpha = .08; ctx.fillStyle = '#fff';
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(w * (.13 + i * .24), 0); ctx.lineTo(w * (.28 + i * .24), h); ctx.lineTo(w * (.09 + i * .24), h); ctx.lineTo(w * (.16 + i * .24), 0); ctx.fill(); } ctx.restore();
      ellipse(ctx, w * .4, h * 1.2, w, h * .31, '#d4ceaa');
      for (let i = 0; i < 16; i++) { ctx.strokeStyle = 'rgba(238,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(w * (((i * .347) % 1)), h * ((i * .193 - t * .018 + 5) % 1), w * (.004 + i % 3 * .004), 0, Math.PI * 2); ctx.stroke(); }
      for (let i = 0; i < 7; i++) { ctx.strokeStyle = i % 2 ? '#527f75' : '#75a58e'; ctx.lineWidth = w * .012; ctx.beginPath(); ctx.moveTo(w * (.07 + i * .15), h); ctx.bezierCurveTo(w * (.02 + i * .15), h * .86, w * (.12 + i * .15), h * .86, w * (.07 + i * .15), h * .75); ctx.stroke(); }
    } else if (theme === 'city') {
      ellipse(ctx, w * .81, h * .22, h * .085, h * .085, '#f6e3b6');
      for (let i = 0; i < 16; i++) { const x = i / 15 * w, bh = h * (.2 + ((i * 7) % 6) * .065); ctx.fillStyle = i % 2 ? '#35405c' : '#424766'; ctx.fillRect(x, h - bh, w * .075, bh); ctx.fillStyle = '#dbbf94'; for (let row = 0; row < bh / 33 - 1; row++) { for (let col = 0; col < 3; col++) { if ((i + row + col) % 3) ctx.fillRect(x + w * .013 + col * w * .018, h - bh + 18 + row * 33, w * .006, h * .013); } } }
    } else {
      ellipse(ctx, w * .12, h * .15, w * .18, w * .18, 'rgba(255,255,255,.19)');
      ellipse(ctx, w * .93, h * .95, w * .3, w * .3, 'rgba(181,110,119,.09)');
      ctx.save(); ctx.strokeStyle = 'rgba(150,83,87,.10)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(w * .8, h * .24, h * .16, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
  }
  function wrap(ctx, text, maxWidth, limit = 3) {
    // Segment by code point so long words and non-Latin captions still fit.
    const lines = []; let line = '';
    for (const token of text.split(/(\s+)/)) {
      if (token === '\n') { lines.push(line.trim()); line = ''; continue; }
      if (ctx.measureText(line + token).width <= maxWidth) { line += token; continue; }
      if (line.trim()) { lines.push(line.trim()); line = ''; }
      for (const char of token) {
        if (ctx.measureText(line + char).width > maxWidth && line) { lines.push(line.trim()); line = ''; }
        line += char;
      }
    }
    if (line.trim()) lines.push(line.trim());
    if (lines.length > limit) {
      lines.length = limit;
      let last = lines[limit - 1];
      while (last && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
      lines[limit - 1] = last + '…';
    }
    return lines;
  }
  function renderScene(ctx, s, t, w, h, selectedId = null) {
    background(ctx, s.theme, w, h, t);
    const unit = Math.min(w / 1280, h / 720);
    for (const a of s.actors) {
      const p = pose(a, t, s.duration), size = a.size * unit;
      ctx.save(); ctx.translate(p.x * w, p.y * h); ctx.rotate(p.rotation); ctx.scale((a.flip ? -1 : 1) * p.scale, p.scale);
      ctx.font = `${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(8,13,32,.15)'; ctx.shadowBlur = size * .1; ctx.shadowOffsetY = size * .055; ctx.fillText(a.emoji, 0, size * .05); ctx.restore();
      if (a.id === selectedId) {
        ctx.save(); ctx.translate(p.x * w, p.y * h); ctx.rotate(p.rotation); ctx.strokeStyle = '#ffd49e'; ctx.lineWidth = 2.5 * unit; ctx.setLineDash([7 * unit, 5 * unit]); roundRect(ctx, -size * .59, -size * .59, size * 1.18, size * 1.18, 14 * unit); ctx.stroke(); ctx.restore();
      }
    }
    if (s.caption.trim()) {
      const fs = Math.max(27 * unit, w * (h > w ? .041 : .025)); ctx.font = `600 ${fs}px "Segoe UI", Arial, sans-serif`;
      const lines = wrap(ctx, s.caption, w * .81, 3), lineH = fs * 1.43, boxH = lines.length * lineH + fs * .63;
      const y = h - boxH - h * .047;
      const max = Math.min(w * .89, Math.max(...lines.map(l => ctx.measureText(l).width)) + fs * 1.7);
      ctx.fillStyle = 'rgba(16,21,38,.74)'; roundRect(ctx, (w - max) / 2, y, max, boxH, fs * .42); ctx.fill();
      ctx.fillStyle = '#fffdf7'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; lines.forEach((line, i) => ctx.fillText(line, w / 2, y + fs * .315 + lineH * (i + .5)));
    }
  }
  let transitionCanvas;
  function render(ctx, project, time, selectedId = null) {
    const { scene: s, index, local } = locate(project, time), w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.save(); renderScene(ctx, s, local, w, h, selectedId);
    if (index > 0 && s.transition === 'fade' && local < .4 && !selectedId) {
      if (!transitionCanvas && typeof document !== 'undefined') transitionCanvas = document.createElement('canvas');
      if (transitionCanvas) {
        transitionCanvas.width = w; transitionCanvas.height = h;
        const prev = project.scenes[index - 1]; renderScene(transitionCanvas.getContext('2d'), prev, prev.duration, w, h);
        ctx.globalAlpha = 1 - local / .4; ctx.drawImage(transitionCanvas, 0, 0);
      }
    }
    ctx.restore();
  }
  function hitTest(s, x, y, t, w, h) {
    const unit = Math.min(w / 1280, h / 720);
    for (let i = s.actors.length - 1; i >= 0; i--) {
      const a = s.actors[i], p = pose(a, t, s.duration);
      const dx = x * w - p.x * w, dy = y * h - p.y * h;
      const rx = dx * Math.cos(-p.rotation) - dy * Math.sin(-p.rotation), ry = dx * Math.sin(-p.rotation) + dy * Math.cos(-p.rotation);
      if (Math.abs(rx) < a.size * unit * .58 * p.scale && Math.abs(ry) < a.size * unit * .58 * p.scale) return a;
    }
    return null;
  }
  function timecode(time) { return `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`; }
  // Live MediaRecorder WebM streams omit Duration. Update their small Info header;
  // retain the encoded media as Blob slices. IDs and tick units follow Matroska:
  // https://www.matroska.org/technical/elements.html
  async function fixWebmDuration(blob, seconds) {
    if (!blob.type.includes('webm') || !Number.isFinite(seconds) || seconds <= 0) return blob;
    try {
      const bytes = new Uint8Array(await blob.slice(0, 65536).arrayBuffer());
      function vint(at, id = false) {
        if (at >= bytes.length || !bytes[at]) throw new Error('Invalid EBML header');
        let mask = 128, width = 1;
        while (!(bytes[at] & mask)) { mask >>= 1; width++; }
        if (width > (id ? 4 : 8) || at + width > bytes.length) throw new Error('Invalid EBML integer');
        let value = id ? bytes[at] : bytes[at] & (mask - 1);
        let unknown = !id && value === mask - 1;
        for (let i=1;i<width;i++) { value = value * 256 + bytes[at+i]; unknown = unknown && bytes[at+i] === 255; }
        return { value, width, unknown };
      }
      function element(at, end) {
        const id = vint(at,true), size = vint(at+id.width), data = at + id.width + size.width;
        return { id:id.value, at, sizeAt:at+id.width, size, data, end:size.unknown ? end : data+size.value };
      }
      function sizeBytes(value, width) {
        if (value >= Math.pow(2,7*width)-1) throw new Error('Header size overflow');
        const out = new Uint8Array(width);
        for(let i=width-1;i>=0;i--){out[i]=value%256;value=Math.floor(value/256);}
        out[0] |= 1 << (8-width); return out;
      }
      let segment;
      for(let at=0;at<bytes.length;){const e=element(at,blob.size);if(e.id===0x18538067){segment=e;break;}if(e.end<=at||e.end>bytes.length)break;at=e.end;}
      if(!segment)return blob;
      let info;
      for(let at=segment.data;at<Math.min(segment.end,bytes.length);){
        const e=element(at,segment.end);
        // Indexed files already have a finalized container; their seek offsets must stay intact.
        if(e.id===0x114D9B74)return blob;
        if(e.id===0x1549A966){info=e;break;}if(e.end<=at||e.end>bytes.length)break;at=e.end;
      }
      if(!info||info.end>bytes.length||info.size.unknown)return blob;
      let scale=1000000,duration=null;const parts=[];
      for(let at=info.data;at<info.end;){
        const e=element(at,info.end);if(e.end>info.end||e.end<=at)return blob;
        if(e.id===0x2AD7B1){scale=0;for(let i=e.data;i<e.end;i++)scale=scale*256+bytes[i];}
        if(e.id===0x4489)duration=e;
        if(e.id!==0xBF&&e.id!==0x4489)parts.push(bytes.slice(e.at,e.end));
        at=e.end;
      }
      if(!scale)return blob;
      const payload = new Uint8Array(8); new DataView(payload.buffer).setFloat64(0,seconds*1e9/scale);
      parts.push(new Uint8Array([0x44,0x89,0x88]),payload);
      const dataLength=parts.reduce((n,a)=>n+a.length,0);
      let width=info.size.width;while(dataLength>=Math.pow(2,7*width)-1)width++;
      const infoBlob=new Blob([bytes.slice(info.at,info.sizeAt),sizeBytes(dataLength,width),...parts]);
      const delta=infoBlob.size-(info.end-info.at),prefix=bytes.slice(0,info.at);
      if(!segment.size.unknown)prefix.set(sizeBytes(segment.size.value+delta,segment.size.width),segment.sizeAt);
      return new Blob([prefix,infoBlob,blob.slice(info.end)],{type:blob.type});
    } catch (_) { return blob; }
  }
  class Soundtrack {
    async ensure() {
      const Audio = root.AudioContext || root.webkitAudioContext;
      if (!Audio) throw new Error('Sound is unavailable in this browser.');
      if (!this.context || this.context.state === 'closed') this.context = new Audio();
      if (this.context.state === 'suspended') await this.context.resume();
      return this.context;
    }
    async start(mode, offset = 0, destination = null) {
      this.stop();
      if (mode === 'none') return;
      const generation = this.generation;
      const ctx = await this.ensure();
      if (this.generation !== generation) return;
      const settings = {
        orbit: { notes: [60, 67, 72, 76, 67, 64, 72, 67], step: .65, length: 1.4, type: 'sine', volume: .075 },
        playful: { notes: [72, 76, 79, 76, 74, 77, 81, 79, 72, 76, 79, 84, 81, 77, 74, 67], step: .28, length: .23, type: 'triangle', volume: .055 },
        dream: { notes: [60, 64, 69, 72, 71, 67, 64, 59], step: .8, length: 1.8, type: 'sine', volume: .07 }
      };
      const s = settings[mode] || settings.orbit;
      this.bus = ctx.createGain(); this.bus.gain.value = 1; this.bus.connect(destination || ctx.destination);
      const bus = this.bus, base = ctx.currentTime - offset;
      let index = Math.floor(offset / s.step);
      const schedule = () => {
        while (base + index * s.step < ctx.currentTime + .6) {
          const at = base + index * s.step;
          if (at >= ctx.currentTime - .02) {
            const begin = Math.max(ctx.currentTime + .005, at), osc = ctx.createOscillator(), gain = ctx.createGain();
            osc.type = s.type; osc.frequency.value = 440 * Math.pow(2, (s.notes[index % s.notes.length] - 69) / 12);
            gain.gain.setValueAtTime(.0001, begin); gain.gain.exponentialRampToValueAtTime(s.volume, begin + .025); gain.gain.exponentialRampToValueAtTime(.0001, begin + s.length);
            osc.connect(gain); gain.connect(bus); osc.start(begin); osc.stop(begin + s.length + .02);
          }
          index++;
        }
      };
      schedule(); this.timer = setInterval(schedule, 120);
    }
    stop() {
      this.generation = (this.generation || 0) + 1;
      clearInterval(this.timer); this.timer = null;
      if (this.bus && this.context && this.context.state !== 'closed') {
        const bus = this.bus, now = this.context.currentTime;
        bus.gain.cancelScheduledValues(now); bus.gain.setTargetAtTime(.0001, now, .015);
        setTimeout(() => { try { bus.disconnect(); } catch (_) { /* Already closed. */ } }, 100);
      }
      this.bus = null;
    }
    close() { this.stop(); if (this.context && this.context.state !== 'closed') return this.context.close(); }
  }
  root.EmojiFilm = { VERSION, FONT, THEMES, MOTIONS, clamp, uid, copy, actor, scene, demo, sanitize, dimensions, total, locate, startOf, pose, render, renderScene, hitTest, timecode, wrap, fixWebmDuration, Soundtrack };
})(typeof window !== 'undefined' ? window : globalThis);

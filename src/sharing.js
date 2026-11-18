(function (root) {
  'use strict';
  const VIDEO_TYPES = [
    'video/mp4;codecs=avc1.42E01F,mp4a.40.2',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ];
  function chooseVideoType(supports) {
    for (const type of VIDEO_TYPES) {
      try { if (supports(type)) return type; } catch (_) { /* Try the next codec. */ }
    }
    return null;
  }
  function mimeType(value) { return String(value || '').split(';')[0].trim().toLowerCase(); }
  function canShareVideo(file, device = root.navigator) {
    if (!file || typeof device?.share !== 'function' || typeof device?.canShare !== 'function') return false;
    try { return device.canShare({ files: [file] }) === true; } catch (_) { return false; }
  }
  async function shareVideo(file, title, device = root.navigator) {
    if (!canShareVideo(file, device)) return { status: 'unsupported' };
    try {
      // Call the device API before yielding, while the button's user gesture is active.
      await device.share({ files: [file], title: String(title || 'My emoji movie').slice(0, 80) });
      return { status: 'shared' };
    } catch (error) {
      if (error?.name === 'AbortError') return { status: 'cancelled' };
      throw error;
    }
  }
  root.EmojiShare = { chooseVideoType, mimeType, canShareVideo, shareVideo };
})(typeof window !== 'undefined' ? window : globalThis);

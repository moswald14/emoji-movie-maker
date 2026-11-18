# Verification — 17 November 2026

## Passed

- `node --check src/app.js` and `node --check src/engine.js`.
- `node --test tests/engine.test.cjs`: 16 passing checks for scene boundaries, fractional durations, export resolutions, project validation, Unicode emoji, animated hit testing, caption wrapping, standalone script syntax, and WebM duration metadata.
- Chrome: added a cat through emoji search, changed its animation and size, dragged it on the canvas, changed a scene name and caption, duplicated a scene, and restored these edits after reloading the page.
- Scene ordering, undo, and redo were checked against the displayed card order.
- Phone-sized browser layout: the page had no horizontal overflow at 375 CSS pixels; portrait canvas resolution was 720 × 1280. This was a browser viewport check, not a physical phone test.
- The exported standalone HTML movie ran inside the export preview. Seeking reached 0:12 / 0:12, and Replay restarted playback with an advancing playhead.
- An actual WebM recording of the default three-scene story loaded into a native video element with readyState 4, width 1280, height 720, duration 12 seconds, and no media error. Native playback advanced successfully.
- The initial WebM recording had an infinite reported duration; the final exporter adds the missing duration metadata. A fresh recording confirmed the corrected 12-second duration.
- The offline HTML bundles all CSS and scripts and contains no remote asset dependencies.

## Limits

- The browser automation service cannot retrieve Blob downloads. Generated download links and the actual corresponding player/video contents were verified through the in-app export previews; saving the downloads to a particular user folder was not verified.
- Safari, physical phones, maximum-length projects, and audible sound quality were not checked. The soundtrack generator and recording audio route are implemented with Web Audio.
- Online publication could not be attempted successfully because the connected Sites service failed during startup. No confirmed site ID or deployed URL was returned. The complete offline application is the delivered result.

## Format reference

WebM duration handling follows the [Matroska element specification](https://www.matroska.org/technical/elements.html) and [timestamp notes](https://www.matroska.org/technical/notes.html). The patch targets the live, unindexed containers emitted by MediaRecorder; indexed containers are preserved.

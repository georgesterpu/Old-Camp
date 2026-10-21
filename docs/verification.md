# Valley Edition verification

- TypeScript: `bun run check`.
- Unit checks: 20 passing tests for movement, camera collision, sword timing,
  directional guard, river/bridge elevation, save validation and migration.
- Original browser quest: 14 checks passed, including collision, dialogue,
  collection, payment, castle admission, map, pause and view switching.
- Expedition browser flow: hammer recovery and sword reward, three herbs and
  Snaf reward, five discoveries, bridge and river collision, timed sword hits,
  arena win and reward, draw/sheathe, held guard, population counts, journal,
  and persisted progress passed.
- High-render regression: replacing the HDR/SSAO chain restores visible output;
  sampled scene pixels include nonzero luminance and varied color.
- Native keyboard and audio controls: sprint/release, audio unlock, mixer and
  music signals, mute, separate music toggle, Escape pause/release and resume
  pointer recapture passed. Browser output was muted throughout.
- Extracted package: starts with HTTP, HTTPS and WebSocket requests blocked;
  no remote requests, High and Balanced both produce varied scene pixels,
  portable-save buttons present, and no browser exceptions.
- Portable save import: a JSON file supplied through the file input restored
  ore and journey state successfully.
- Windows ZIP: archive integrity verified, embedded HTML byte-identical to the
  built game, asset credits and engine notices included.

Browser checks run in a muted Linux Chrome session using SwiftShader. They do
not establish Windows compatibility or frame rate on a particular gaming PC.
Headless Chrome does not deliver native relative mouse deltas in this environment;
the mouse-look handler is checked with relative-motion events. The underlying
steering and movement code are preserved from the prior working build.

The user also confirmed that High graphics now renders correctly on the laptop.

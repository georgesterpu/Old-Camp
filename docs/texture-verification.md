# Firefox texture loading - 22 October 2026

The player reported red/black ground in Firefox in both graphics modes. Earlier
Edge captures and a fresh Firefox session showed normal ground, so the original
trigger was not reproduced. The player confirmed that the updated loader restored
the ground in their session.

Surface images now decode from embedded bytes through short local Blob URLs before
GPU upload. Loading is sequential to reduce peak decode pressure, and each image
gets one retry with a fresh URL. Startup checks readiness and loading errors rather
than accepting the engine's checkerboard fallback. A second failure opens the
existing recovery screen. Image resolution and source assets are unchanged.

Source URLs remain available for texture clones and graphics-context restoration,
then are revoked when the scene is disposed. Page navigation releases the engine's
GPU resources; returning from the back/forward cache reloads the disposed game.

`bun scripts/firefox-texture-browser-test.mjs` passes in Windows Firefox 158.0.1:

- All 16 surface textures decode and upload without errors.
- High and Balanced render the scene. Each samples 1,024 ground texture pixels,
  with zero saturated red checkerboard pixels in those samples.
- A deliberately failed first ground-image decode retries successfully and
  restores the original terrain pixels.
- Two deliberately failed decodes show recovery and prevent entry into a broken
  game. Removing the injected failure and reloading restores a healthy scene.
- The page requires no remote asset requests. Screenshots stay in `.cache`.

The normal render and retry cases were visually inspected. Sampled pixels and a
controlled decode failure do not establish the cause of every possible GPU or
browser failure.

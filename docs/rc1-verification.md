# Release Candidate 1 verification — 21 October 2026

Version: **1.3.0-rc.1**. The title screen identifies the build as
**RELEASE CANDIDATE 1 · A PLACE WORTH KEEPING**.

The campaign is the existing three chapters, with the road charter as its explicit
finish. There is no new chapter, region or combat subsystem in this pass.

## Checks passed

- TypeScript, standalone build and **57 unit tests** pass. The new rules cover all
  four mine/charter ending combinations, immutable ending snapshots, action statistics,
  legacy save migration, malformed records, backup recovery and preference persistence.
- A browser playthrough completes the three-chapter campaign from a new journey.
  It earns castle admission and the blade, gathers actual resources, crafts supplies,
  completes contracts, forges and upgrades weapons, defeats the mine and final crews
  through normal attack timing, and chooses the charter. No progress, inventory or
  enemy-death fixtures are used for that winning run. Travel is accelerated with
  QA teleports, so this is an integration check rather than a pacing measurement.
- The ending records seven foes, thirty gathered materials, four prepared supplies,
  three deliveries and all three caches in that run. Its snapshot survives reload
  and subsequent postgame defeat without changing. An unacknowledged ending reopens
  on entry; an acknowledged ending remains available for review from the journal.
- The result screen pauses gameplay and its actions remain usable at **390×844**.
  Continuing explicitly enters postgame; the optional keeper’s watch has a route.
- Defeat has a persistent recovery screen, 65-health rescue, stated ore loss and
  retained quest progress. Beacon loss has preparation and retry options. The
  third-chapter regression checks withdrawal, retry and both charter outcomes.
- A corrupted local primary save, with its final write interrupted, recovers the
  validated backup on reload. Older completed journeys receive a labelled partial
  statistics record, including saves that predate the colony systems entirely.
- Controller pack focus, tab switching, back, result dismissal and appearance
  selection pass with a simulated standard gamepad. Keyboard focus stays inside
  active menus; graphics selection survives reload.
- Original adventure, expedition and mine regressions pass. Appearance checks cover
  all hair, clothing and facial options, save/import, preview isolation, cancellation,
  mobile layout and repeated edits without mesh/material leaks.
- Native mouse capture and looking, both Shift keys, immediate sprint/release,
  audio and music signals, independent mute/music controls, Escape and recapture pass.
- The extracted Windows ZIP starts directly from a file URL with external HTTP,
  HTTPS and WebSocket requests blocked. High and Balanced render visible scenes;
  there are no remote asset requests or startup exceptions.
- A simulated graphics failure presents a recovery screen, pauses active gameplay
  and keeps the last valid save available to download.
- ZIP CRC and byte comparisons pass. The HTML inside the ZIP matches both standalone
  HTML copies. The package includes instructions, asset/engine credits and `BUILD.json`;
  the release directory includes SHA-256 checksums. `git diff --check` passes.

## Exact browser target

Windows **Microsoft Edge 155.0.4283.62**, WebGL 2, ANGLE / SwiftShader, muted headless
test profile. Native input is delivered through the browser’s debugging interface.
Desktop UI checks use 1440×900; the extracted package is also checked at 800×600.
Mobile layout checks use 390×844. This verifies the desktop browser implementation
and responsive layout, not phone hardware or gaming-GPU frame rate.

The tests run against the generated file, not the development server. QA-only hooks
require `?qa`; normal launches expose only read-only diagnostics.

## Release artifacts

- `old-camp.html` — rebuilt standalone game.
- `dist/index.html` — byte-identical copy.
- `release/Old-Camp-Valley-Edition-Windows.zip` — no-install sharing package.
- `release/Old-Camp-Valley-Edition-Source.zip` — editable source, assets, tests and docs.
- `release/BUILD.json` and `release/SHA256SUMS.txt` — exact build and archive identity.

`bun run package` finds Python 3 on PATH, through `PYTHON`, the Windows launcher,
or an already-installed uv interpreter. It does not download an interpreter.

## Human release gates still open

This is a release candidate, not a claim that the game has completed human acceptance
testing. Before calling it a final release:

1. Time a fresh campaign using ordinary travel. The proposed **1–3 hour** duration
   remains a target; accelerated automated runs cannot establish it. Check whether
   gathering, repeat visits and menus feel useful rather than repetitive.
2. Play the final fight on physical gaming hardware and a physical controller.
   Check telegraph readability, beacon pressure, recovery options and comfort.
3. Do an independent Chrome pass if Chrome is to receive the same support claim
   as the tested Edge target. Chrome was not installed in this test environment.
4. Export a real journey before moving the HTML or extracting a new release, then
   verify import into the intended player browser/profile. File-URL storage can
   differ between browsers and locations.

No campaign-duration promise or physical-controller certification is inferred from
the automated checks. Existing Explorer, reduced-motion and high-contrast settings
remain available; browser audio policies may require an initial mouse click.

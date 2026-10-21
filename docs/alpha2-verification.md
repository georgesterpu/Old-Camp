# Alpha II verification — 21 October 2026

The standalone `old-camp.html` and `dist/index.html` are rebuilt from the final source.
The title screen identifies this build as **ALPHA II · SUPPLY & CONSEQUENCE**.
No new packages, remote services or runtime downloads were introduced.

## Automated checks

- TypeScript check and standalone build pass.
- All 40 unit tests pass: existing movement, camera, terrain,
  character appearance, portable saves and sword checks; new gathering depletion,
  replenishment, crafting, contracts, faction standing, exclusive mine resolutions,
  healing, rescue, schema validation, weapon reach, guard breaks, parries, dodges,
  frame-rate-independent enemy wind-ups and three-wave watch rewards.
- The original browser adventure passes: start, movement, collisions, dialogue,
  ore collection, Diego's payment, castle admission, map, pause and view switching.
- The original expedition browser checks pass: hammer, blade, herbs, supper reward,
  discoveries, bridge and river collision, arena victory, draw/sheath and held guard.
- Appearance regression checks pass: unique residents, all customization controls,
  preview isolation, save/import, reload, cancellation, memory stability and mobile layout.
- Native mouse capture and looking, both Shift keys, sprint release, audio and music
  output, independent mute/music controls, Escape pause/release and resume recapture pass.
- The new colony browser playthrough passes 24 groups of checks. It supplies the
  completed opening-chapter fixture, then gathers actual world resources, crafts,
  trades, forges an axe and defeats the mine crew through ordinary attack timing.
  Both mine resolutions, the sealed entrance, changed patrol population, extra iron,
  watch start/retreat, saves, persistent defeats, rescue, rest, finite market stock,
  resource routing, evening routines, moving destinations, night-time arena bouts,
  mobile layout and storage-error feedback are exercised.
- Standard gamepad movement, sprint, looking and Start pause/resume are checked with
  a simulated connected gamepad. Physical controller feel is not established by this.
- No browser exceptions during the successful browser playthroughs.
- Both generated HTML copies have matching SHA-256 hashes. `git diff --check` passes.

Browser testing uses the built file URL in muted Windows Edge with WebGL 2 and
SwiftShader. The tests use a dedicated browser profile and `?qa&still`; QA fixtures
are absent on an ordinary launch. These checks do not establish gaming-GPU frame rate.

## What to try manually

1. Refresh the built HTML; check the Alpha II title-screen badge.
2. Press **I**. Track timber, iron or bitterleaf from the pack and follow the compass.
3. With castle admission and Huno's blade earned, speak to Diego and open **Supplies,
   trade and camp news → Camp affairs**. Begin the expedition.
4. Stock the pot, replace the tools and supply the watch, or fight the road levy.
5. Try an axe against a sentinel's frontal guard, a spear's reach, a fresh parry and
   a dodge. Defeat the mine crew and read both consequences before choosing at Diego.
6. Visit the mine after the decision, then attempt the ruined watch beacon.
7. Export a save, reload, and confirm appearance, inventory, wounds, gear, standing
   and the mine's future are retained.

This adds a connected second chapter and repeatable systems. It does not implement
every item in the alpha feedback: there is no full campaign, body-part damage,
large faction war, cave network, seasonal simulation or controller-operated menus.

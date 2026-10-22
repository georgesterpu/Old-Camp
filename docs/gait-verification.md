# Locomotion pass — 22 October 2026

The player now uses separate stance and recovery phases, distance-driven cadence,
world-space foot contacts, an analytic two-joint leg solver and independent ankle
orientation. The rig's pelvis rotates about the hips. The belt follows the pelvis;
sword poses retain their combat overrides. NPCs retain their existing routine
animation, with corrected knee flexion and level ankles.

The follow-up tuning addresses forward lunges, head bob and sprint overreach:

- Walking uses a shorter step and lower foot clearance.
- Sprint recovery eases relative to the moving body, avoiding an oversized forward
  reach followed by a pullback before landing.
- Pelvis height varies less, and the torso absorbs 80% of its vertical displacement.
- Walking is 1.8 m/s; sprint remains 7.2 m/s, with immediate Shift response.
- Camera movement has no additional gait bob.
- Sharp turns release a strained support foot into a short lifted recovery step
  before it crosses under the body or twists too far. Turns in place advance a
  small stepping cycle without predicting a forward walking stride.

Validation:

- `bun run build`: TypeScript and offline build pass.
- `bun test`: 66 tests pass, including leg forward kinematics, planted contacts,
  cadence across 15–120 Hz, stopping, transitions, jumping, slopes, body heights,
  quarter turns, reversals and turns in place.
- `bun scripts/gait-browser-test.mjs`: passes against the built offline HTML in
  Windows Edge, checked with SwiftShader and AMD hardware rendering. Over the sampled two-second cycles, head height
  relative to the character root varies less than 6 mm in both gaits.
  The sample contains five to six walking steps and nine sprinting steps; maximum local
  forward/back foot reach is 0.31 m and 0.29 m respectively. Actual ankle positions
  stay within 22 mm of the targets on the sampled terrain.
  Walking and running turns are sampled over 120 frames each; feet remain on their
  own side with lateral reach below 0.22 m. An additional 90-frame armed pivot
  verifies that turning in place lifts and replants the feet.
- `bun scripts/controls-browser-test.mjs`: native movement, both Shift keys,
  mouse capture/look, pause/resume and audio controls pass.
- `bun scripts/appearance-browser-test.mjs`: appearance controls, all hair and
  outfit variants, preview isolation, save/reload and portable import pass after
  the rig changes, with no mesh or material leaks.
- `bun scripts/campaign-browser-test.mjs`: the complete three-chapter campaign,
  actual mine and final combat, ending statistics, failure/reload, backup recovery
  and controller menus pass. The controller-select fixture starts below the last
  option, so the increment assertion is independent of the saved appearance.

Cycle poses were inspected from the side. This remains procedural animation on the
existing lightweight rig; these checks do not establish motion-capture quality or
performance on another GPU. All automated browser screenshot paths now use `.cache`,
preserving the existing documentation images.

# Alpha III verification — 21 October 2026

The current standalone build identifies itself as **ALPHA III · THE LAST LIGHT**.
It adds a third chapter in the existing valley, direct conversation services, clearer
combat warnings, roving patrols, and a permanent road charter. No packages or runtime
network dependencies were added.

## Rules and compatibility

- TypeScript and standalone build pass. The build writes the same HTML to
  `old-camp.html` and `dist/index.html`.
- All **49 unit tests** pass, including nine third-chapter tests for older portable
  saves, repair costs, mine-dependent opposition, beacon damage, retreat, rescue,
  retry, exclusive charters, recurring supplies, fire-pot targeting and cover,
  patrol rotation, guard exhaustion and outrider backsteps.
- The third chapter is optional until the player starts it with Grim after resolving
  the mine. Existing first- and second-chapter saves migrate to a dormant third chapter.
- Repairs spend one timber and one iron each. Failed actions do not spend materials.
  A retry preserves the repaired network and resets the final encounter. The diggers’
  two-timber gift is awarded once, preventing retreat from becoming a free timber source.
- Commons and watch charters are permanent and pay their completion reward once.
  Commons brings food each shift; watch brings patrol supplies and removes roving
  firebrands. Patrol loot can be recovered only once per patrol shift.

## Browser playthroughs

Tests use the built file URL in muted Windows Edge, WebGL 2 / SwiftShader, with a
dedicated profile and `?qa&still`. The QA-only fixtures do not exist in ordinary play.

- The opening adventure passes movement, collisions, quests, castle admission, map,
  pause and camera-view checks.
- The original expedition passes hammer/blade, herbs/supper, five discoveries,
  bridge/river collision, sword timing, arena victory and persistence checks.
- The mine-chapter regression passes gathering, depletion, crafting, trade, real
  combat, both mine outcomes, the barricade, watch defense, rescue, rest, schedules,
  moving destinations, simulated gamepad controls and storage-failure feedback.
- `scripts/escalation-browser-test.mjs` exercises Grim’s actual conversation, three
  physical signal repairs, material consumption, four-enemy defense, beacon damage
  and repairs through E, timber collision, objective routing and mid-fight save/reload.
  It defeats the new crew using ordinary sword handling: spear reach against outriders
  and an axe against the captain. Fixtures supply completed earlier chapters,
  earned gear and supplies; enemies are not killed by a test-only shortcut.
- The same playthrough checks Grim’s homecoming, Mara’s response, both charters,
  direct cooking/repair, the two-card field pack, mobile layout, H healing, Z weapon
  cycling, the sealed-mine reinforcement, withdrawal and retry, and charter reload.
- The appearance browser regression passes all 18 groups, including every hair,
  outfit and facial-hair option, preview isolation, save/import, reload, mobile
  layout, cancellation and repeated edits without mesh or material leaks.
- The controls regression passes all 13 groups: native pointer capture and mouse
  movement, both Shift keys, immediate sprint/release, audio unlock, music and
  ambient signals, independent music/master mute, Escape and resume recapture.
- No runtime exceptions occur in the successful automated playthroughs. Both HTML
  copies have matching SHA-256 hashes; `git diff --check` passes.

## Try it

1. Refresh `old-camp.html` and check the Alpha III badge.
2. With the mine resolved, talk to Grim about his sister’s caravan.
3. Follow the next objective and map to restore all three signals. Bring at least
   three timber and three iron, plus spare repair supplies and healing.
4. Press E again at the high-road signal. Intercept enemies heading for the beacon,
   leave orange impact circles, use timber as cover, and repair the beacon as needed.
5. Return to Grim, choose the road charter, and speak with Mara at the fire.
6. Rest at Snaf’s fire to see recurring supplies; revisit the river and shrine as
   rival patrols change grounds. The ruined watch remains available after the ending.

This is a connected third chapter and a bounded world simulation. There is no new
region, full-length campaign, unrestricted faction war, or general NPC society model.
Automated teleport-assisted playthroughs establish mechanics and integration, not
natural campaign pacing or gaming-GPU performance. Physical gamepad feel remains
a separate manual check; menus still use keyboard, mouse or touch.

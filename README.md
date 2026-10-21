# The Old Camp — Valley Edition

An offline Gothic-inspired exploration game: a working camp, a much larger wild valley,
textured human characters, photographed surfaces, original music, and peaceful wildlife.
An unofficial tribute; no original Gothic game data is required or distributed.

## Release Candidate 1: A Place Worth Keeping

The existing three chapters now form a campaign with a definite ending:
earn admission and a blade → prepare the camp → decide the mine → defend the signal
road → choose the road charter with Grim. That final charter triggers **Campaign complete**,
an epilogue and a frozen results summary. There is no fourth chapter or new region.

Refresh **old-camp.html** and check for **RELEASE CANDIDATE 1**. Existing journeys continue;
an already-completed Alpha III journey receives its ending on the next entry. Its action
counts are labelled as recorded from this update onward, since older builds did not track them.

- The ending records the mine and road outcomes, active play time, foes driven off,
  gathered materials, crafted supplies, deliveries, rescues, caches and remaining ore.
  Menus and resting do not add to active play time. Postgame cannot overwrite the ending.
- **Defeat** and **defense lost** have explicit recovery screens. Defeat costs a little
  ore and gear condition, returns you with 65 health, and keeps campaign progress.
  A lost beacon can be retried without restoring the whole signal network.
- The pack shows all five campaign milestones, missing materials and one next-route button.
  Completed mine management cards disappear from the main camp flow. Daily stores are
  repeatable support activities; depleted stocks do not undo expedition preparation.
- After the ending, the optional **keeper’s watch** asks for one successful ruined-watch
  defense. Existing later defenses grow harder. To try different outcomes, continue to
  the journal and choose **Start a new journey**; appearance and accessibility choices stay.
- Local saves receive the same validation as imported saves. A previous valid save is
  kept as a backup and recovered automatically if the primary is damaged. Graphics,
  master mute and music preferences survive reloads. If graphics startup fails, a recovery
  screen offers reload and download of the last valid local save.
- Controller menus use D-pad / left stick for focus, **A** to activate, **B** to return,
  **LB/RB** for pack tabs, and left/right to edit appearance choices. Keyboard focus stays
  inside the active menu. A mouse click may still be required by the browser to unlock audio.

The Windows sharing ZIP contains the standalone game, instructions, credits and a build
manifest with the HTML hash. Export your journey before moving the file to a new folder.

**Release status:** RC1 is a testable closure build. The 1–3 hour campaign length is a
playtest target, not a measured promise. The automated full-campaign run accelerates
travel and does not establish natural pacing, physical-controller feel or gaming-GPU
performance. See [release verification](docs/rc1-verification.md).

## Chapter III: The Last Light

The mine decision now leads into a third chapter with a personal stake: Grim’s sister
Mara is on the next ore cart, and displaced levy men are cutting the signal road.
This chapter remains the final pressure event in the release-candidate campaign.

**Continue an existing journey:** after either mine resolution, talk to **Grim** and
choose his **Chapter III** conversation. Existing saves and portable Alpha II exports
keep their appearances, inventory and mine outcome.

- Restore signals at the shrine, river and high road: **E**, costing **1 timber + 1 iron**
  each. The objective, compass and map guide the next repair.
- At the restored high-road signal, press **E** again to call the caravan. Intercept
  the levy captain, long-reach outriders and a firebrand before they destroy the light.
  **E** at a damaged beacon repairs **35%** for **1 timber + 1 iron**. Timber cover stops
  movement and attacks; orange impact circles show where fire pots will land.
- The mine matters again: sealing it lets the watch intercept one flanker; reopening
  it brings two spare timbers from the diggers. Retreat or defeat preserves the signal
  repairs and lets you retry the assault. There is no off-screen countdown.
- Return to Grim. A **commons charter** brings food each shift; a **watch charter** brings
  watch supplies and suppresses roving firebrands. Both permanently change standing,
  pay **25 ore**, and bring Mara to the campfire with her own response.
- Roving levy patrols change hunting grounds between day and evening, revisiting the
  river bitterleaf and shrine. Defeating a patrol recovers rations and camp food once
  per patrol shift. Repeated road contests and the ruined watch continue after the ending.

Management takes fewer steps: named residents offer direct cooking, deliveries, repairs,
trade and chapter choices in conversation. The pack shows usable nearby services and a
clear next objective; away from camp services it shows supplies and equipment.
**H** uses a salve and **Z** cycles owned weapons. Wind-ups show a countdown, energy and
worn gear warnings are visible, and an exhausted guard can break under a blow.

This extends the existing valley into a three-chapter mini-RPG. It does not add a new
region, a full-length campaign, or a general-purpose society simulation.

## Chapter II: Supply & Consequence

The opening adventure now leads into **A mine worth fighting for**, a second chapter
built around gathering, supplies, trade, combat and a permanent decision about the mine.
This chapter remains available before The Last Light.

**To begin:** earn castle admission from Thorus and a blade from Huno. Return to Diego,
talk to him, and choose **Supplies, trade and camp news**. In **Camp affairs**, begin the
mine expedition. Existing saves keep their first-chapter progress and appearances.

- **Gather and prepare.** Timber, iron scrap and bitterleaf replenish after two shifts.
  Press **I → Pack & equipment → Find timber / iron / bitterleaf** to track an available
  site. Quest herbs from the first adventure are separate from crafting bitterleaf.
- **Spend ore.** Fisk buys gathered materials and sells supplies with limited stock per
  shift. Huno repairs gear, tempers weapons through three upgrades, and forges an axe
  or spear. Snaf cooks rations and brews salves. Services require visiting the resident.
  Every 20 Shadow standing reduces purchase prices by one ore, up to two ore off;
  prices have a floor that prevents buying iron just to sell it back at a profit.
- **Support the camp.** Food, tools and watch contracts consume materials and reward ore
  and standing with diggers, Shadows or guards. Contracts renew each shift. Stores run
  down over time; expedition preparation stays credited. Defeating the north-road levy
  is an alternative to supplying the watch.
- **Fight with a plan.** Raiders, sentinels, brutes and the mine overseer have different
  attack timings. Use weapon reach, flanking, three-hit combos, axe guard breaks,
  timed parries and dodges. Attacks have visible warning rings and raised-arm wind-ups.
  The overseer accelerates below half health. Wounds, gear wear and enemy defeats save.
- **Change the mine.** After driving out its crew, choose at Diego's fire: reopen it for
  the diggers (better iron recovery, digger standing), or seal it for the watch (guard
  standing, fewer road enemies). The entrance and work site visibly change. Each option
  loses standing with the other group; the choice is permanent for that journey.
- **Keep playing.** Either resolution unlocks the ruined watch beacon: three waves,
  an ore reward, and harder subsequent defenses, with difficulty increases capped at five.
  Supply contracts, replenishing sites, market shifts and hidden lore caches support
  further expeditions. Withdrawing more than 42m abandons a watch attempt.

A shift lasts **15 minutes of active play**. Resting at Snaf's fire restores health and
energy and advances to the next shift; camp stores are consumed and the market restocks.
The clock changes the valley's lighting and residents' routines. Tracking a resident
follows their current position. Wildlife flees approaching hostile crews as well as people.

The camp and its residents remain safe. Defeat in the valley returns you to the north
gate with 65 health, up to six ore lost and damaged equipment; quest items and campaign
decisions are kept. **R** cannot teleport you away from active pursuers.

**I → Field notes & settings** contains rumours, the event log, Explorer mode (half
incoming valley damage), reduced motion, and high-contrast menus. Keyboard focus stays
inside the pack while it is open. The pack, appearance editor, map, journal and pause
screen suspend gameplay. Saves live in the same browser on the same computer; use the
journal's Export/Import save buttons for a portable copy. Storage failures show a warning.

## Play or share

Build the game using the steps below, then open **old-camp.html** in current Microsoft Edge or Chrome. It runs directly from disk;
there is no installation, account, server, network connection, or development setup.
Press **F11** for fullscreen. Hardware acceleration should be enabled in the browser.

**Send `release/Old-Camp-Valley-Edition-Windows.zip` to another player.** Extract it,
then double-click **Play Old Camp.html**. All artwork, engine code, and audio generation
are inside that file. The accompanying `START HERE.txt` describes controls and the first
adventure. The package also contains asset credits and engine license notices.

Progress saves in that browser on that computer. Keep the game file in the same folder
between sessions. Save export/import in the journal provides a portable backup.

## Editable source

This repository includes the complete editable game source and local assets.
Generated HTML, installed dependencies, and release archives are excluded from Git.

The optional `release/Old-Camp-Valley-Edition-Source.zip` includes the complete
source, local assets, licenses, scripts, and documentation. See [EDITING.md](EDITING.md)
for Windows setup and a guide to the code. Regenerate it with `bun run package:source`.

## The valley

The playable boundary extends about 226 metres from the camp centre, with a 640-metre
terrain mesh and layered mountain scenery beyond. The old boundary was a 220-metre-wide
square. The expanded map includes a pine forest, a carved river and traversable bridge,
abandoned mine workings, ruined watchtower, standing-stone shrine, and the high road.
Five discovered landmarks add lore to the journal.

Nine ravens circle overhead; five deer and five hares graze, wander, and flee when
approached. Twenty-six butterflies flutter around meadow herbs and the riverbank.
Wildlife does not attack or block movement. Distant bird calls accompany the woods.

Characters use Drummyfish's CC0 textured human geometry, subdivided once and adapted with
clothing, hair, and a blended skeleton. Surface scans from Poly Haven retain their 1K/2K
resolution, mipmaps, and anisotropic filtering. High graphics uses native display resolution
(up to 2× device pixel ratio), antialiasing, surface relief, and detailed shadows. Balanced reduces
effects for slower machines. No pixel-art or nearest-neighbour texture filter is used.

## Character appearances

Residents have stable individual complexions, face and nose shapes, haircuts, hair colours,
facial hair, builds, and role-specific outfits. Repeated guards have different features.

Choose **Customise your character** on the title screen, or **Appearance** in the camp.
Use the lit preview to rotate your character and switch between face detail and the full
outfit. Choose a look, randomise it, or return to the original hero. **Save appearance**
keeps it with your journey, including exported saves; **Cancel / Esc** discards edits.
Older saves receive the original hero's appearance. Starting a new journey keeps your look.

## A first adventure

1. Find **Diego**, west of the entrance lane. Recover three ore nuggets and earn admission
   from **Thorus** to the castle courtyard.
2. Ask **Huno** at the eastern smithy about work. Leave by the south gate, head west, and
   recover his hammer from the old workings. Return it to earn a sword.
3. Ask **Snaf** about the pot. Find three meadow herbs near the shrine west of the north
   road; return them for supper and five ore.
4. Challenge **Scatty** by the arena. First to three clean hits earns ten ore. Watch his
   wind-up, hold a frontal guard, or step out of reach.
5. Follow the waymarkers and use the valley map to find the remaining landmarks.

## Controls

- **WASD / arrows** move; **Shift** sprint; **Space** jump.
- Click the scene for mouse-look; **Esc** releases the mouse / pauses. Drag also works.
- Mouse wheel changes camera distance; **V** switches first / third person.
- **E** talks / collects. **M** opens the map; **J** opens the journal; **I** opens pack and camp affairs.
- **Tab** draws / sheathes an earned weapon. **F / left click** strikes; **C** dodges.
- **H** uses a healing salve; **Z** cycles owned weapons.
- **Q / right click** holds guard. A strike has a short wind-up and recovery; guard costs
  energy when it stops a frontal blow. Energy recovers automatically and never limits sprinting.
- **P** hides the HUD for pictures. **R** returns to the north gate when not pursued.
- Touch movement, interaction, strike, guard, dodge and healing buttons are available.
- Standard gamepad: left stick moves; right stick looks; left-stick press sprints;
  **A** jumps, **X** interacts, **Y** draws, **RT** strikes, **LT** guards, **B** dodges,
  **Start** pauses, and **Back** opens the pack. Menus use keyboard, mouse or touch.

Swordplay targets the practice opponent during a bout. Townspeople and wildlife remain
peaceful; hostile valley crews appear only after you start the mine expedition.
The movement speeds and camera-relative steering from the earlier build are preserved.

## Development and verification

Bun and TypeScript; Babylon.js 9.31.0. Install Bun (the original toolchain is
`bun@1.4.3`), open a terminal in the repository folder, and run:

```sh
bun install --frozen-lockfile
bun run build
bun test
bun run dev
```

Open http://127.0.0.1:4317/ for the local preview. Stop it with **Ctrl+C**.
Rebuild after editing source files; the preview reloads after a successful build.
Builds replace files atomically. `bun run package` rebuilds the Windows sharing ZIP.
Packaging requires Python 3; the wrapper finds PATH, PYTHON, the Windows launcher or an existing uv interpreter. Ordinary development requires Bun only.

The browser regression scripts connect to a local Chrome DevTools endpoint on port 9223:
`browser-test.mjs`, `expedition-browser-test.mjs`, `controls-browser-test.mjs`,
`appearance-browser-test.mjs`, `colony-browser-test.mjs`, `escalation-browser-test.mjs`,
`campaign-browser-test.mjs`, and `package-browser-test.mjs`.
Open the game with `?qa` for the test hooks, or `?qa&still` for single-frame inspection.
QA hooks are absent during a normal launch. Test browsers should use `--mute-audio`.

The final package is tested directly with a file URL and external requests blocked.
Earlier browser verification used Linux and a software-rendered browser. Actual
gaming-GPU performance needs testing on the player's machine.

Alpha II regression verification also runs in muted Windows Edge with SwiftShader. The colony
browser test exercises gathering, crafting, real weapon strikes through the mine fight,
branching consequences, persistent wounds and inventory, defeat rescue, and mobile menus.
Controller mapping is checked with a simulated standard gamepad; physical-controller
feel and performance still need testing on the player's hardware.

Asset sources and licenses: `licenses/ASSET-CREDITS.txt`. Generated-art prompts and mesh
preparation: `assets/README.md` and `scripts/prepare-human.py`.

This is a compact fan adventure, not a complete Gothic remake. The full Colony, original
quests, hostile wildlife, and original copyrighted music or dialogue are not included.

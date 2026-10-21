# The Old Camp — Valley Edition

An offline Gothic-inspired exploration game: a working camp, a much larger wild valley,
textured human characters, photographed surfaces, original music, and peaceful wildlife.
An unofficial tribute; no original Gothic game data is required or distributed.

## Alpha II: Supply & Consequence

The opening adventure now leads into **A mine worth fighting for**, a second chapter
built around gathering, supplies, trade, combat and a permanent decision about the mine.
The title screen displays **ALPHA II · SUPPLY & CONSEQUENCE** in the current build.

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
Packaging scripts require Python 3; ordinary development requires Bun only.

The browser regression scripts connect to a local Chrome DevTools endpoint on port 9223:
`browser-test.mjs`, `expedition-browser-test.mjs`, `controls-browser-test.mjs`,
`appearance-browser-test.mjs`, `colony-browser-test.mjs`, and `package-browser-test.mjs`.
Open the game with `?qa` for the test hooks, or `?qa&still` for single-frame inspection.
QA hooks are absent during a normal launch. Test browsers should use `--mute-audio`.

The final package is tested directly with a file URL and external requests blocked.
Earlier browser verification used Linux and a software-rendered browser. Actual
gaming-GPU performance needs testing on the player's machine.

Alpha II verification also runs in muted Windows Edge with SwiftShader. The colony
browser test exercises gathering, crafting, real weapon strikes through the mine fight,
branching consequences, persistent wounds and inventory, defeat rescue, and mobile menus.
Controller mapping is checked with a simulated standard gamepad; physical-controller
feel and performance still need testing on the player's hardware.

Asset sources and licenses: `licenses/ASSET-CREDITS.txt`. Generated-art prompts and mesh
preparation: `assets/README.md` and `scripts/prepare-human.py`.

This is a compact fan adventure, not a complete Gothic remake. The full Colony, original
quests, hostile wildlife, and original copyrighted music or dialogue are not included.

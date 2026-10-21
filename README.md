# The Old Camp — Valley Edition

An offline Gothic-inspired exploration game: a working camp, a much larger wild valley,
textured human characters, photographed surfaces, original music, and peaceful wildlife.
An unofficial tribute; no original Gothic game data is required or distributed.

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
- **E** talks / collects. **M** opens the map; **J** opens the journal.
- **Tab** draws / sheathes an earned sword. **F / left click** strikes.
- **Q / right click** holds guard. A strike has a short wind-up and recovery; guard costs
  energy when it stops a frontal blow. Energy recovers automatically and never limits sprinting.
- **P** hides the HUD for pictures. **R** returns to the north gate.
- Touch movement, interaction, strike, and guard buttons are available.

Swordplay targets the practice opponent during a bout. Townspeople and wildlife remain
peaceful. The movement speeds and camera-relative steering from the earlier build are preserved.

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
and `package-browser-test.mjs`.
Open the game with `?qa` for the test hooks, or `?qa&still` for single-frame inspection.
QA hooks are absent during a normal launch. Test browsers should use `--mute-audio`.

The final package is tested directly with a file URL and external requests blocked.
Earlier browser verification used Linux and a software-rendered browser. Actual
gaming-GPU performance needs testing on the player's machine.

Asset sources and licenses: `licenses/ASSET-CREDITS.txt`. Generated-art prompts and mesh
preparation: `assets/README.md` and `scripts/prepare-human.py`.

This is a compact fan adventure, not a complete Gothic remake. The full Colony, original
quests, hostile wildlife, and original copyrighted music or dialogue are not included.

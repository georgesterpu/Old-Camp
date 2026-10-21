# Editing The Old Camp on Windows

The Git repository and source ZIP contain the editable game and all local artwork.
The optional Windows ZIP is the ready-to-play version.

## Start editing

1. Clone the repository or extract the source ZIP. Open the project folder in your editor.
2. Install Bun from https://bun.sh and reopen your terminal. The project records
   its original toolchain in `package.json` (`bun@1.4.3`).
3. Open a terminal in the project folder and run:

   ```powershell
   bun install --frozen-lockfile
   bun run build
   bun run dev
   ```

4. Open http://127.0.0.1:4317/ in Edge or Chrome.
5. Make a change, then run `bun run build` in a second terminal in the same folder.
   The preview reloads after a successful build. **Saving a source file alone does
   not rebuild the game.**

You can also open the generated `old-camp.html` directly. It is the complete,
offline game; send that file to someone to share your edited version.
An internet connection is needed for the initial dependency installation, not
for playing the built game. Normal editing and building require Bun only.

## Where to change things

| File | What it controls |
| --- | --- |
| `src/main.ts` | Controls, dialogue, quests, interactions, camera, and game loop |
| `src/world.ts` | Camp buildings, residents, ore, fires, and collision obstacles |
| `src/terrain.ts` | Ground elevation, mountains, bridge walking height, grass |
| `src/wilderness.ts` | Forest, river, mine, ruins, shrine, and landmark locations |
| `src/characters.ts` | Human meshes, clothing, skeleton, poses, and swords |
| `src/appearance.ts` | Appearance choices, palettes, and stable resident identities |
| `src/customization.ts` | Hero appearance controls and the isolated preview scene |
| `src/wildlife.ts` | Ravens, deer, hares, butterflies, and their behavior |
| `src/sword.ts` | Strike timing, recovery, energy, and guarding |
| `src/expedition.ts` | Quest items, herbs, hammer, and waymarkers |
| `src/index.html` | Menus, HUD, journal, map panel, and styling |
| `src/audio.ts`, `src/music.ts` | Synthesized ambience, effects, and original score |
| `src/surfaces.ts`, `assets/` | Surface maps, skin, generated artwork, and mesh data |

A small first change: edit Diego's dialogue in `src/main.ts`, rebuild, and talk
to him. To add a destination, study the `landmarks` list and geometry helpers in
`src/wilderness.ts`; update collision obstacles when adding solid structures.

## Check and share a change

```powershell
bun run check
bun test
bun run build
```

`old-camp.html` is the standalone output. `dist/index.html` is an identical copy.
Do not edit either generated file; change `src/` and rebuild.

Optional: install Python 3 to use `bun run package` for the Windows sharing ZIP
or `bun run package:source` for another source archive. These scripts invoke
`python`; use `python scripts/package.py` directly if preferred. Python is also
used by `scripts/prepare-human.py` to regenerate `assets/human.json` from the
original OBJ. It is not needed for ordinary game changes.

The browser regression scripts require a separate Chrome DevTools session on
port 9223; `bun test` does not. Run `node scripts/appearance-browser-test.mjs`
with an offline game tab opened using `?qa&still` to check customization.
Launch test browsers with `--mute-audio`.

## Saves, assets, and credits

Use the in-game journal's Export save before experimenting. Import save restores
that JSON backup; the journal also offers a new journey.

Keep `licenses/` with shared releases. Third-party engine and asset licenses are
recorded there. Generated-art prompts and the human-mesh workflow are documented
in `assets/README.md`. This is an unofficial Gothic-inspired fan adventure.

The archive excludes installed dependencies, generated builds, old checkpoints,
and release ZIPs. Everything needed to rebuild is included.

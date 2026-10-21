"""Build a no-install Windows sharing archive using only Python's standard library."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json
root=Path(__file__).resolve().parent.parent
release=root/'release';release.mkdir(exist_ok=True)
readme='''THE OLD CAMP — VALLEY EDITION

PLAY ON WINDOWS
1. Extract this ZIP to a folder.
2. Double-click "Play Old Camp.html".
3. Use Microsoft Edge or Google Chrome. Press F11 for fullscreen.

No installation, internet, account, game engine, or development tools are needed.
All game assets and code are embedded inside the HTML file.
If Windows opens a different app, right-click the HTML, choose Open with,
and select Edge or Chrome. Enable browser hardware acceleration for smooth 3D.

CONTROLS
WASD / arrows: move        Shift: sprint        Space: jump
Click scene: mouse-look   Esc: release / pause
Mouse wheel: camera distance                   V: first / third person
E: talk / collect         M: map                J: journal
Tab: draw / sheathe       F or left click: strike
Q or right click: hold guard                    P: hide HUD
R: return to the north gate

ALPHA III CONTROLS
I: pack, equipment, trade, camp affairs and field notes
C: dodge (costs energy)   Fresh Q / right-click guard: timed parry
H: healing salve         Z: cycle owned weapons
Touch buttons also include dodge and healing.
Standard gamepad: left stick move, right stick look, left-stick press sprint,
A jump, X interact, Y draw, RT strike, LT guard, B dodge, Start pause, Back pack.
Menus use keyboard, mouse or touch.

A FIRST ADVENTURE
Meet Diego west of the entrance lane and earn a place in the castle.
Ask Huno at the eastern smithy for work. Recover his hammer from the
abandoned mine west of the south gate, and he will reward you with a sword.
Snaf needs three meadow herbs from the shrine west of the north road.
Scatty offers practice bouts at the arena: first to three clean hits.
Hold guard toward his attack or move out of reach when he winds up.
Use the map and waymarkers to explore the five landmarks beyond the walls.
Deer, hares, ravens and butterflies are peaceful; animals flee when approached.

ALPHA II: A MINE WORTH FIGHTING FOR
After earning castle admission and Huno's blade, return to Diego and choose
"Supplies, trade and camp news". Begin the mine expedition in Camp affairs.
Supply Snaf's pot, Huno's tools and Thorus's watch, or defeat the north-road levy.
Use ore for trade, repairs, weapon tempering and forging an axe or spear.
Press I and use Find timber / iron / bitterleaf to track gathering sites.
Sites recover after two shifts. Rest at Snaf's fire to start a new shift.
Drive the overseer from the mine, then decide its future with Diego. Both
resolutions change the valley and unlock the repeatable ruined-watch challenge.
If defeated, the watch brings you home; campaign decisions and quest items stay.
Field notes includes Explorer mode, reduced motion, high contrast and rumours.

ALPHA III: THE LAST LIGHT
After either mine decision, talk to Grim about his sister's caravan.
Restore the shrine, river and high-road signals: E costs 1 timber + 1 iron each.
Press E at the restored high-road beacon to begin the final defense.
Intercept the levy crew. Orange circles mark incoming fire pots; timber gives cover.
E at the damaged beacon repairs 35 percent for 1 timber + 1 iron.
Return to Grim for the commons or watch road charter. Both bring Mara home.
Named residents offer direct services in conversation, alongside the pack menus.

YOUR JOURNEY
Progress saves automatically in the same browser on this computer.
Keep the HTML in the same folder between visits. For a portable backup,
open the journal and choose Export save. Import save restores that JSON file
on another computer or browser.

GRAPHICS AND SOUND
High uses native resolution, surface relief, and detailed shadows.
Balanced reduces GPU load. Both use the same reliable rendering path.
Click the scene or sound button to enable ambience and the original score.
Music and ambience have separate controls; you can also load your own soundtrack.

An unofficial Gothic-inspired fan adventure. No original game files are included.
See CREDITS for source and license information.
'''
readme=readme.replace('ALPHA III CONTROLS','RELEASE CANDIDATE 1 CONTROLS').replace('Menus use keyboard, mouse or touch.','Menus: D-pad / left stick focus, A activates, B returns. LB / RB changes pack tabs.\nLeft / right edits appearance choices. Keyboard, mouse and touch are also supported.')
readme=readme.replace('YOUR JOURNEY','''CAMPAIGN ENDING
The road charter at Grim's fire completes the campaign and opens its results screen.
The ending records your mine and road choices, active play time and action statistics.
Continue into postgame to revisit the valley. The optional keeper's watch asks for
one ruined-watch defense after the ending; continuing never changes your ending.
Defeat and a lost beacon show explicit recovery screens. Quest progress stays safe.
The pack shows the five campaign milestones, missing materials, and a route button.

YOUR JOURNEY''')
readme=readme.replace('Progress saves automatically in the same browser on this computer.','Progress saves automatically in the same browser on this computer.\nA verified previous-save backup is used automatically if the primary save is damaged.')
html_digest=hashlib.sha256((root/'old-camp.html').read_bytes()).hexdigest()
build={'version':json.loads((root/'package.json').read_text())['version'],'html_sha256':html_digest,'html_bytes':(root/'old-camp.html').stat().st_size,'target':'Windows desktop Microsoft Edge / Chrome, file URL, offline','campaign':'Three chapters; charter decision is the campaign ending'}
manifest=json.dumps(build,indent=2)+'\n'
(release/'BUILD.json').write_text(manifest,encoding='utf-8')
archive=release/'Old-Camp-Valley-Edition-Windows.zip'
with ZipFile(archive,'w',ZIP_DEFLATED,compresslevel=9) as z:
 z.write(root/'old-camp.html','Play Old Camp.html')
 z.writestr('START HERE.txt',readme)
 z.writestr('BUILD.json',manifest)
 for path in sorted((root/'licenses').glob('*.txt')):z.write(path,'CREDITS/'+path.name)
(release/'START HERE.txt').write_text(readme,encoding='utf-8')
digest=hashlib.sha256(archive.read_bytes()).hexdigest()
checksums=release/'SHA256SUMS.txt'
lines=checksums.read_text().splitlines() if checksums.exists() else []
lines=[line for line in lines if not line.endswith('  '+archive.name)]
lines.append(digest+'  '+archive.name)
checksums.write_text('\n'.join(sorted(lines))+'\n')
with ZipFile(archive) as z:
 assert z.testzip() is None
 assert z.read('Play Old Camp.html')==(root/'old-camp.html').read_bytes()
print(f'{archive}: {archive.stat().st_size/1024/1024:.1f} MB; ZIP integrity verified')

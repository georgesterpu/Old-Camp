"""Build a no-install Windows sharing archive using only Python's standard library."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
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

A FIRST ADVENTURE
Meet Diego west of the entrance lane and earn a place in the castle.
Ask Huno at the eastern smithy for work. Recover his hammer from the
abandoned mine west of the south gate, and he will reward you with a sword.
Snaf needs three meadow herbs from the shrine west of the north road.
Scatty offers practice bouts at the arena: first to three clean hits.
Hold guard toward his attack or move out of reach when he winds up.
Use the map and waymarkers to explore the five landmarks beyond the walls.
Deer, hares, ravens and butterflies are peaceful; animals flee when approached.

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
archive=release/'Old-Camp-Valley-Edition-Windows.zip'
with ZipFile(archive,'w',ZIP_DEFLATED,compresslevel=9) as z:
 z.write(root/'old-camp.html','Play Old Camp.html')
 z.writestr('START HERE.txt',readme)
 for path in sorted((root/'licenses').glob('*.txt')):z.write(path,'CREDITS/'+path.name)
(release/'START HERE.txt').write_text(readme)
digest=hashlib.sha256(archive.read_bytes()).hexdigest()
(release/'SHA256SUMS.txt').write_text(digest+'  '+archive.name+'\n')
with ZipFile(archive) as z:
 assert z.testzip() is None
 assert z.read('Play Old Camp.html')==(root/'old-camp.html').read_bytes()
print(f'{archive}: {archive.stat().st_size/1024/1024:.1f} MB; ZIP integrity verified')

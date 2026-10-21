"""Package editable game source and local assets, without dependencies or builds."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib

root = Path(__file__).resolve().parent.parent
release = root / 'release'
release.mkdir(exist_ok=True)
archive = release / 'Old-Camp-Valley-Edition-Source.zip'
root_files = ['README.md', 'EDITING.md', 'package.json', 'bun.lock', 'tsconfig.json', '.gitignore']
folders = ['src', 'assets', 'licenses', 'scripts', 'docs']
files = [root / name for name in root_files]
for folder in folders:
    files.extend(path for path in (root / folder).rglob('*')
                 if path.is_file() and '__pycache__' not in path.parts and path.suffix != '.pyc')
files = sorted(files)
assert all(path.is_file() for path in files)
with ZipFile(archive, 'w', ZIP_DEFLATED, compresslevel=6) as z:
    for path in files:
        z.write(path, 'Old-Camp-Source/' + path.relative_to(root).as_posix())
with ZipFile(archive) as z:
    assert z.testzip() is None
    assert len(z.namelist()) == len(files)
    for path in files:
        assert z.read('Old-Camp-Source/' + path.relative_to(root).as_posix()) == path.read_bytes()
manifest = release / 'SHA256SUMS.txt'
lines = manifest.read_text().splitlines() if manifest.exists() else []
lines = [line for line in lines if not line.endswith('  ' + archive.name)]
lines.append(hashlib.sha256(archive.read_bytes()).hexdigest() + '  ' + archive.name)
manifest.write_text('\n'.join(sorted(lines)) + '\n')
print(f'{archive}: {archive.stat().st_size / 1024 / 1024:.1f} MB; '
      f'{len(files)} files; ZIP contents and integrity verified')

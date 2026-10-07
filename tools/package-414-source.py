"""Package the quest source update, excluding any older full-game HTML."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib, json, zipfile

root = Path(__file__).resolve().parents[1]
files = [
    'quests/maria-414-reclaimed.js', 'quests/sommi-414-mirror.js',
    'tools/build-maria-414.py', 'tools/generate-sommi-414-mirror.py',
    'tools/test-maria-414-source.cjs', 'tools/test-sommi-414-mirror.cjs',
    'tools/test-414-reliability.cjs', 'tools/test-414-puzzles.cjs', 'tools/test-414-animation.cjs', 'tools/test-414-three.mjs',
    'tools/test-maria-414-builder.py', 'tools/test-maria-414.cjs',
    'tools/test-sommi-414-browser.cjs', 'tools/package-414-source.py',
    'tools/test-sommi-native-transition.cjs', 'tools/review-414-shots.cjs',
    'tools/test-414-native-traversal.cjs', 'tools/test-414-service-lanes.cjs',
    'tools/test-414-depth.cjs', 'tools/test-414-depth-browser.cjs', 'tools/test-sommi-414-native-traversal.cjs',
    'docs/414_RECLAIMED_SAME_NIGHT_R5.md', 'docs/414_R5_VALIDATION.json',
]
readme = """414 — Reclaimed / The Same Night R5 SOURCE UPDATE

Four cable evidence terminals and route reconstruction; three 4x4 engine
circuits; four 5x5 district relay boards with visible city restoration.
Both character routes retain 32 objectives and 10 cinematic acts. Partial
repairs are saved. Hints do not solve boards. Existing saves remain compatible.

Read docs/414_RECLAIMED_SAME_NIGHT_R5.md for validation and timing limits.
Apply to an isolated copy of TODAY'S latest full game and retain its assets.
No older full index.html is included in this bundle.

From the isolated checkout after copying quests/, tools/, and docs/:
  python3 tools/build-maria-414.py

Sommi's module is generated. Edit the Maria implementation and the generator,
then rerun tools/generate-sommi-414-mirror.py and both route checks.

The 30–45 minute first-time play target has not been established by a human
playthrough. Physical phone testing and performance benchmarking remain.
"""
manifest = {
    'prepared_utc_date': datetime.now(timezone.utc).date().isoformat(),
    'kind': 'source update',
    'integration_revision': 'R53.16-414-RECLAIMED-SAME-NIGHT-R5',
    'files': {name: hashlib.sha256((root / name).read_bytes()).hexdigest() for name in files},
}
out = root / '414-Reclaimed-Same-Night-R5-Source-Update.zip'
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for name in files:
        archive.write(root / name, name)
    archive.writestr('README.txt', readme)
    archive.writestr('SHA256-MANIFEST.json', json.dumps(manifest, indent=2) + '\n')
with zipfile.ZipFile(out) as archive:
    assert archive.testzip() is None
print(out.name, out.stat().st_size, 'bytes;', len(files) + 2, 'entries; SHA256', hashlib.sha256(out.read_bytes()).hexdigest())

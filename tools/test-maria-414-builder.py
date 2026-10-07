"""Synthetic packed-file tests; do not substitute for a full-game build."""
import ast, gzip, hashlib, re, subprocess, tempfile, sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
builder=root/'tools'/'build-maria-414.py'
# Reuse the actual codec functions to construct and inspect fixtures.
tree=ast.parse(builder.read_text())
codec=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in {'digit','dec','ed','enc'}]
ns={'N':52496};exec(compile(ast.Module(body=codec,type_ignores=[]),str(builder),'exec'),ns)
prefix='''const useGameSelector=()=>false;
const maria414CineActive = useGameSelector((s) => !!s.maria414CineActive);
const maria414Title = window.__maria414StoryActive?.() ? window.__sommi414QuestCard?.()?.title : null;
function drawMinimap(cv,g,size){ if (g.maria414DrawMinimap?.(cv, size)) return; }
function campaignBeginChapterOnePresentation() {}
const DEV_CUTSCENE_CATALOG = Object.freeze([{id:'native-scene',label:'Native scene'}]);
function replayFixture(id,g){
    throw new Error('Unknown cutscene preview.');
}
function fixture(st,storyLocked,tradeFocus){
 if (!this.sommi414Inside && !this.maria414Inside && !this.treasuryInside) {}
 const worldActivityPaused = storyLocked || tradeFocus || !!this.treasuryInside || !!this.maria414Inside;
 if (!storyLocked && !tradeFocus && !this.maria414Inside) {}
 if (!this.maria414Inside && !this.treasuryInside) {}
 return st.dysCutsceneActive || st.maria414CineActive;
}
'''
old=prefix+'// MARIA 414 — RECLAIMED · R1.\nconst oldModuleSentinel=1;\n// END MARIA 414 — RECLAIMED R1\nconst preservedSuffix = 414;\n'
packed=ns['enc'](gzip.compress(old.encode(),mtime=0))
html=f'<html data-integration-revision="R53.13-MARIA-414-RECLAIMED-R1"><script id="atropa-src" type="application/octet-stream" data-raw-size="{len(old.encode())}" data-raw-sha256="{hashlib.sha256(old.encode()).hexdigest()}">{packed}</script><script id="other-pkg" type="text/plain">UNCHANGED_PAYLOAD</script></html>'
for encoding,mirror in [('utf-8',False),('utf-16',False),('utf-8',True),('utf-16',True)]:
 with tempfile.TemporaryDirectory() as tmp:
  fixture=Path(tmp);(fixture/'quests').mkdir();(fixture/'quests'/'maria-414-reclaimed.js').write_bytes((root/'quests'/'maria-414-reclaimed.js').read_bytes());(fixture/'index.html').write_bytes(html.encode(encoding))
  if mirror:(fixture/'quests'/'sommi-414-mirror.js').write_bytes((root/'quests'/'sommi-414-mirror.js').read_bytes())
  subprocess.run([sys.executable,str(builder),str(fixture)],check=True,capture_output=True)
  first=(fixture/'index.html').read_bytes();decoded=first.decode(encoding)
  match=re.search(r'<script id="atropa-src"[^>]*>(.*?)</script>',decoded,re.S)
  source=gzip.decompress(ns['dec'](match[1])).decode()
  assert 'const preservedSuffix = 414;' in source
  assert 'oldModuleSentinel' not in source
  assert source.count('// MARIA 414 — RECLAIMED · R5.')==1
  assert '<script id="other-pkg" type="text/plain">UNCHANGED_PAYLOAD</script>' in decoded
  backup='index.pre-414-r6.backup.html' if mirror else 'index.pre-maria414-r5.backup.html'
  assert (fixture/backup).read_bytes()==html.encode(encoding)
  if mirror:
   assert source.count('// SOMMI 414 — THE SAME NIGHT · R4.')==1
   assert '!this.sommi414Inside && !this.maria414Inside && !this.sommiMirror414Inside && !this.treasuryInside' in source
   assert '|| !!this.maria414Inside || !!this.sommiMirror414Inside;' in source
   assert '!storyLocked && !tradeFocus && !this.maria414Inside && !this.sommiMirror414Inside)' in source
   assert 'st.dysCutsceneActive || st.maria414CineActive || st.sommiMirror414CineActive' in source
   assert 'window.__sommiMirror414Eligible?.() && !window.__sommiMirror414Quest' in source
   assert source.count("id: 'sommi414-same-night'")==1
   assert source.count("if (id === 'sommi414-same-night')")==1
   assert "{id:'native-scene',label:'Native scene'}" in source
  subprocess.run([sys.executable,str(builder),str(fixture)],check=True,capture_output=True)
  assert (fixture/'index.html').read_bytes()==first,'Rebuild must be deterministic'
print('PASS: Maria alone and both routes; UTF-8/UTF-16; R1 replacement; mirror locks and campaign gate; trailing source and other payload preserved; pre-build backup; deterministic repeated build.')

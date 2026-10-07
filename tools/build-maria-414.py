from pathlib import Path
import re, gzip, hashlib, sys, subprocess

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
path = root / 'index.html'
original = path.read_bytes()
encoding = 'utf-16' if original[:2] == b'\xff\xfe' else 'utf-8'
html = original.decode(encoding)
match = re.search(r'(<script id="atropa-src"[^>]*>)(.*?)(</script>)', html, re.S)
assert match, 'Packed Classic source not found'
N = 52496
def digit(cp):
    if 0x100 <= cp < 0x740: return cp - 0x100
    if 0x800 <= cp < 0xd00: return 1600 + cp - 0x800
    if 0x3400 <= cp < 0xd800: return 2880 + cp - 0x3400
    if 0xe000 <= cp < 0xfdd0: return 44864 + cp - 0xe000
    raise ValueError(hex(cp))
def dec(raw):
    assert raw.startswith('~47:')
    sep=raw.index(':',4);size=int(raw[4:sep]);text=raw[sep+1:]
    out=bytearray(size);cursor=acc=bits=0
    for i in range(0,len(text),3):
        v=digit(ord(text[i]))+digit(ord(text[i+1]))*N+digit(ord(text[i+2]))*N*N
        left=47
        while left>0 and cursor<size:
            take=min(8-bits,left);mod=1<<take;acc+=(v%mod)<<bits;v//=mod;bits+=take;left-=take
            if bits==8:out[cursor]=acc;cursor+=1;acc=bits=0
    assert cursor==size
    return bytes(out)
def ed(d):
    if d<1600:return chr(0x100+d)
    if d<2880:return chr(0x800+d-1600)
    if d<44864:return chr(0x3400+d-2880)
    return chr(0xe000+d-44864)
def enc(data):
    def emit(v):
        a=v%N;v//=N;b=v%N;v//=N;return ed(a)+ed(b)+ed(v)
    parts=[];acc=bits=0
    for byte in data:
        acc|=byte<<bits;bits+=8
        while bits>=47:parts.append(emit(acc&((1<<47)-1)));acc>>=47;bits-=47
    if bits:parts.append(emit(acc))
    return f'~47:{len(data)}:'+''.join(parts)
source=gzip.decompress(dec(match[2])).decode()
old_sha=re.search(r'data-raw-sha256="([a-f0-9]+)"',match[1])
assert old_sha and hashlib.sha256(source.encode()).hexdigest()==old_sha[1], 'Input checksum mismatch'
source=source.replace('\r\n','\n')
def replace(old,new):
    global source
    assert old in source, 'Missing patch anchor: '+old[:120]
    source=source.replace(old,new,1)
begin='// MARIA 414 — RECLAIMED · R'
slot='// __MARIA414_MODULE_SLOT__'
if begin in source:
    old_module=re.search(r'// MARIA 414 — RECLAIMED · R\d+\..*?// END MARIA 414 — RECLAIMED R\d+[^\r\n]*',source,re.S)
    assert old_module, 'Existing Maria module end marker not found'
    assert slot not in source, 'Unexpected module slot in input'
    source=source[:old_module.start()]+slot+source[old_module.end():]
else:
    replace("!this.sommi414Inside && !this.treasuryInside", "!this.sommi414Inside && !this.maria414Inside && !this.treasuryInside")
    replace("const worldActivityPaused = storyLocked || tradeFocus || !!this.treasuryInside;", "const worldActivityPaused = storyLocked || tradeFocus || !!this.treasuryInside || !!this.maria414Inside;")
    replace("if (!storyLocked && !tradeFocus) {\n                    this.updateMoveMark(dt);", "if (!storyLocked && !tradeFocus && !this.maria414Inside) {\n                    this.updateMoveMark(dt);")
    replace("if (!this.treasuryInside && !(this.dysEndingCutscene?.active", "if (!this.maria414Inside && !this.treasuryInside && !(this.dysEndingCutscene?.active")
    replace("if (!this.treasuryInside && !this.inst && !this.dysActive && !(this.dysEndingCutscene?.active", "if (!this.maria414Inside && !this.treasuryInside && !this.inst && !this.dysActive && !(this.dysEndingCutscene?.active")
    replace("st.system0Ended || st.dysCutsceneActive", "st.system0Ended || st.dysCutsceneActive || st.maria414CineActive")
    replace("function campaignBeginChapterOnePresentation() {", "function campaignBeginChapterOnePresentation() {\n    if (window.__maria414StoryActive?.() || (!CW && !FR && loadSkinId() === 'maria-414' && !window.__maria414Quest?.read()?.started && loadPrestigeSave()?.trialOutcome === 'completed')) return;")
    # Preserve the native tracker layout and reuse it for the character-specific quest.
    a=source.index('    const sommi414OwnsTracker =');b=source.index("    // Coexistence Steven's book prologue",a)
    tracker=source[a:b]
    tracker=tracker.replace('`SOMMI · ${d.step}', "`${d.character || 'SOMMI'} · ${d.step}")
    tracker=tracker.replace('`SOMMI STORY · ${d.step}', "`${d.label || 'SOMMI STORY'} · ${d.step}")
    tracker=tracker.replace('}, "414 HOUSE"),', '}, d.location || "414 HOUSE"),')
    source=source[:a]+tracker+source[b:]
    replace("const DEV_CUTSCENE_CATALOG = Object.freeze([", "const DEV_CUTSCENE_CATALOG = Object.freeze([\n    { id: 'maria414-same-night', label: 'MARIA 414 — THE SAME NIGHT', tone: 'gold' },")
    replace("    throw new Error('Unknown cutscene preview.');", "    if (id === 'maria414-same-night') {\n        if (!g.maria414Replay?.()) throw new Error('Complete Maria 414 — Reclaimed, then replay from the 414 entrance.');\n        return id;\n    }\n    throw new Error('Unknown cutscene preview.');")
if 'const maria414CineActive = useGameSelector' not in source:
    replace('    const cutsceneOnly = !inInstance && (campaignCutsceneActive', '    const maria414CineActive = useGameSelector((s) => !!s.maria414CineActive);\n    const cutsceneOnly = !inInstance && (maria414CineActive || campaignCutsceneActive')
if 'const maria414Title =' not in source:
    replace('    const title = tut ? tutTitle : (eventIITitle || questTitle);', "    const maria414Title = window.__maria414StoryActive?.() ? window.__sommi414QuestCard?.()?.title : null;\n    const title = tut ? tutTitle : (maria414Title || eventIITitle || questTitle);")
if 'g.maria414DrawMinimap?.(cv, size)' not in source:
    replace('function drawMinimap(cv, g, layer, inDysnomia, size) {', 'function drawMinimap(cv, g, layer, inDysnomia, size) {\n    if (g.maria414DrawMinimap?.(cv, size)) return;')
module=(root/'quests'/'maria-414-reclaimed.js').read_text(encoding='utf-8').rstrip('\r\n')
source=source.replace(slot,module,1) if slot in source else source.rstrip()+'\n\n'+module+'\n'
mirror_path=root/'quests'/'sommi-414-mirror.js'
if mirror_path.exists():
    mirror=mirror_path.read_text(encoding='utf-8').rstrip('\r\n')
    old_mirror=re.search(r'// SOMMI 414 — THE SAME NIGHT · R\d+\..*?// END SOMMI 414 — THE SAME NIGHT R\d+[^\r\n]*',source,re.S)
    if old_mirror:
        source=source[:old_mirror.start()]+mirror+source[old_mirror.end():]
    else:
        source=source.rstrip()+'\n\n'+mirror+'\n'
    if "id: 'sommi414-same-night'" not in source:
        replace("const DEV_CUTSCENE_CATALOG = Object.freeze([", "const DEV_CUTSCENE_CATALOG = Object.freeze([\n    { id: 'sommi414-same-night', label: 'SOMMI — THE SAME NIGHT', tone: 'gold' },")
    if "if (id === 'sommi414-same-night')" not in source:
        replace("    throw new Error('Unknown cutscene preview.');", "    if (id === 'sommi414-same-night') {\n        if (!g.sommiMirror414Replay?.()) throw new Error('Select Sommi and complete The Same Night before replaying it.');\n        return id;\n    }\n    throw new Error('Unknown cutscene preview.');")
    upgrades=[
      ('!this.sommi414Inside && !this.maria414Inside && !this.treasuryInside', '!this.sommi414Inside && !this.maria414Inside && !this.sommiMirror414Inside && !this.treasuryInside'),
      ('|| !!this.maria414Inside;', '|| !!this.maria414Inside || !!this.sommiMirror414Inside;'),
      ('!storyLocked && !tradeFocus && !this.maria414Inside)', '!storyLocked && !tradeFocus && !this.maria414Inside && !this.sommiMirror414Inside)'),
      ('!this.maria414Inside && !this.treasuryInside', '!this.maria414Inside && !this.sommiMirror414Inside && !this.treasuryInside'),
      ('st.dysCutsceneActive || st.maria414CineActive', 'st.dysCutsceneActive || st.maria414CineActive || st.sommiMirror414CineActive'),
      ('(s) => !!s.maria414CineActive)', '(s) => !!s.maria414CineActive || !!s.sommiMirror414CineActive)'),
      ('window.__maria414StoryActive?.() ? window.__sommi414QuestCard?.()?.title', '(window.__maria414StoryActive?.() || window.__sommiMirror414StoryActive?.()) ? window.__sommi414QuestCard?.()?.title'),
      ('if (g.maria414DrawMinimap?.(cv, size)) return;', 'if (g.sommiMirror414DrawMinimap?.(cv, size) || g.maria414DrawMinimap?.(cv, size)) return;'),
    ]
    for i,(before,after) in enumerate(upgrades):
        assert before in source or after in source, 'Missing mirror integration anchor: '+before
        protected=f'// __MIRROR_UPGRADE_{i}__'
        source=source.replace(after,protected).replace(before,after).replace(protected,after)
    if 'window.__sommiMirror414Eligible?.() && !window.__sommiMirror414Quest' not in source:
        replace('function campaignBeginChapterOnePresentation() {', 'function campaignBeginChapterOnePresentation() {\n    if (window.__sommiMirror414StoryActive?.() || (window.__sommiMirror414Eligible?.() && !window.__sommiMirror414Quest?.read()?.started)) return;')
# A replay can start while a previously-created campaign banner is suspended.
# Do not mark another chapter introduction as seen inside either quest scene.
scene_gate='\n    if (window.__game?.maria414Inside || window.__game?.sommiMirror414Inside) return; // 414 presentation gate\n'
source=re.sub(r'(function campaignBegin(?:Chapter(?:One|Two|Three|Four|Five|Six)|Epilogue)Presentation\(\) \{)(?!'+re.escape(scene_gate)+')',lambda m:m[1]+scene_gate,source)
check=root/'maria414-syntax.tmp.js';check.write_text(source,encoding='utf-8')
try:subprocess.run(['node','--check',str(check)],check=True,capture_output=True)
finally:check.unlink(missing_ok=True)
raw=source.encode();sha=hashlib.sha256(raw).hexdigest();packed=enc(gzip.compress(raw,9,mtime=0))
assert gzip.decompress(dec(packed))==raw, 'Roundtrip mismatch'
tag=re.sub(r'data-raw-size="\d+"',f'data-raw-size="{len(raw)}"',match[1])
tag=re.sub(r'data-raw-sha256="[a-f0-9]+"',f'data-raw-sha256="{sha}"',tag)
result=html[:match.start()]+tag+packed+match[3]+html[match.end():]
revision='R53.17-414-RECLAIMED-SAME-NIGHT-R6' if mirror_path.exists() else 'R53.17-MARIA-414-RECLAIMED-R5'
result=re.sub(r'data-integration-revision="[^"]+"',f'data-integration-revision="{revision}"',result,count=1)
out=result.encode(encoding)
# Every other packed payload is preserved exactly.
old_packages=dict(re.findall(r'<script id="([^"]+)"[^>]*type="(?:application/octet-stream|text/plain)"[^>]*>(.*?)</script>',html,re.S))
new_packages=dict(re.findall(r'<script id="([^"]+)"[^>]*type="(?:application/octet-stream|text/plain)"[^>]*>(.*?)</script>',result,re.S))
assert all(new_packages.get(k)==v for k,v in old_packages.items() if k!='atropa-src')
backup=root/('index.pre-414-r6.backup.html' if mirror_path.exists() else 'index.pre-maria414-r5.backup.html')
if not backup.exists():backup.write_bytes(original)
tmp=path.with_suffix('.html.new');tmp.write_bytes(out);tmp.replace(path)
print('Built',revision,len(out),'bytes; decoded source',len(raw),'bytes; SHA256',sha)
print('Other packed packages preserved:',len(old_packages)-1)

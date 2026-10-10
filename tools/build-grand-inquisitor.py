#!/usr/bin/env python3
"""Build the P50 Grand Inquisitor overlay.

Usage: python tools/build-grand-inquisitor.py [repository-root] [--promote]

The authoritative packed Classic source is read from index.html. All patches
have unique, checked anchors. The emitted runtime uses the existing packed-47
format; the thin update page installs that precompiled package into the same
host HTML and leaves all other embedded games/assets unchanged. The optional
--promote flag connects the normal website entry to the separate update page,
preserving every original packed payload and the query string/fragment.
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile


REVISION = "P50-GRAND-INQUISITOR-THE-UNWRITTEN-VERDICT-R2"
ALPHABET_SIZE = 52496
PACKAGE_NAME = "grand-inquisitor-runtime.pkg"
MANIFEST_NAME = "grand-inquisitor-runtime.manifest.json"
PAGE_NAME = "Atropa-P50-Grand-Inquisitor-Update.html"
MODULE_NAMES = (
    "grand-inquisitor-world.js",
    "grand-inquisitor-presentation.js",
    "grand-inquisitor.js",
)
SOURCE_RE = re.compile(r'(<script id="atropa-src"[^>]*>)(.*?)(</script>)', re.S)
SHA_RE = re.compile(r'data-raw-sha256="([a-f0-9]{64})"')
SIZE_RE = re.compile(r'data-raw-size="(\d+)"')


def sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def read_html(value: bytes) -> str:
    if value.startswith((b"\xff\xfe", b"\xfe\xff")):
        return value.decode("utf-16")
    if value[:16].count(b"\x00") >= 4:
        return value.decode("utf-16le" if value[:1] != b"\x00" else "utf-16be")
    return value.decode("utf-8-sig")


def promote_entry(root: Path) -> None:
    """Route the normal website to P50; keep the original game as a fallback."""
    index = root / "index.html"
    original = index.read_bytes()
    html = read_html(original)
    marker = 'id="atropa-p50-default-entry"'
    previous_guard = re.compile(r'\n?<script id="atropa-p50-default-entry">.*?</script>\n?', re.S)
    if marker in html and len(previous_guard.findall(html)) != 1:
        raise ValueError("Expected one existing default-entry guard")
    plain_html = previous_guard.sub("", html, count=1) if marker in html else html
    if html.count("<head>") != 1:
        raise ValueError("Expected one normal host head before promoting P50")
    guard = '''
<script id="atropa-p50-default-entry">
(() => {
  if (!/^https?:$/.test(location.protocol)) return;
  const destination = new URL(location.href);
  if (destination.searchParams.get('atropa-base') === '1') return;
  if (!/\\/(?:index\\.html)?$/i.test(destination.pathname)) return;
  destination.pathname = destination.pathname.replace(/(?:index\\.html)?$/i, 'Atropa-P50-Grand-Inquisitor-Update.html');
  destination.searchParams.set('atropa-update', 'P50-R2');
  location.replace(destination.href);
})();
</script>
'''
    updated = plain_html.replace("<head>", "<head>" + guard, 1)
    if updated.replace(guard, "", 1) != plain_html:
        raise ValueError("Entry promotion changed unrelated host content")
    if original.startswith(b"\xff\xfe"):
        encoded = b"\xff\xfe" + updated.encode("utf-16le")
    elif original.startswith(b"\xfe\xff"):
        encoded = b"\xfe\xff" + updated.encode("utf-16be")
    else:
        encoded = (b"\xef\xbb\xbf" if original.startswith(b"\xef\xbb\xbf") else b"") + updated.encode("utf-8")
    index.write_bytes(encoded)


def packed_digit(cp: int) -> int:
    if 0x100 <= cp < 0x740:
        return cp - 0x100
    if 0x800 <= cp < 0xD00:
        return 1600 + cp - 0x800
    if 0x3400 <= cp < 0xD800:
        return 2880 + cp - 0x3400
    if 0xE000 <= cp < 0xFDD0:
        return 44864 + cp - 0xE000
    raise ValueError(f"Invalid packed character U+{cp:04X}")


def decode47(raw: str) -> bytes:
    header = re.match(r"~47:(\d+):", raw)
    if not header:
        raise ValueError("Expected a packed-47 source package")
    size = int(header[1])
    if size <= 0 or size > 100_000_000:
        raise ValueError("Packed source size is outside the supported range")
    encoded = raw[header.end():]
    if len(encoded) % 3:
        raise ValueError("Packed source ended inside a character group")
    if len(encoded) != ((size * 8 + 46) // 47) * 3:
        raise ValueError("Packed source length does not match its declared size")
    result = bytearray(size)
    cursor = acc = bits = 0
    for i in range(0, len(encoded), 3):
        value = (packed_digit(ord(encoded[i])) +
                 packed_digit(ord(encoded[i + 1])) * ALPHABET_SIZE +
                 packed_digit(ord(encoded[i + 2])) * ALPHABET_SIZE**2)
        remaining = 47
        while remaining > 0 and cursor < size:
            take = min(8 - bits, remaining)
            mod = 1 << take
            acc += (value % mod) << bits
            value //= mod
            bits += take
            remaining -= take
            if bits == 8:
                result[cursor] = acc
                cursor += 1
                acc = bits = 0
    if cursor != size:
        raise ValueError("Packed source ended before its declared size")
    return bytes(result)


def encode_digit(value: int) -> str:
    if value < 1600:
        return chr(0x100 + value)
    if value < 2880:
        return chr(0x800 + value - 1600)
    if value < 44864:
        return chr(0x3400 + value - 2880)
    return chr(0xE000 + value - 44864)


def encode47(data: bytes) -> str:
    def emit(value: int) -> str:
        a = value % ALPHABET_SIZE
        value //= ALPHABET_SIZE
        b = value % ALPHABET_SIZE
        value //= ALPHABET_SIZE
        return encode_digit(a) + encode_digit(b) + encode_digit(value)

    parts = []
    acc = bits = 0
    for byte in data:
        acc |= byte << bits
        bits += 8
        while bits >= 47:
            parts.append(emit(acc & ((1 << 47) - 1)))
            acc >>= 47
            bits -= 47
    if bits:
        parts.append(emit(acc))
    return f"~47:{len(data)}:" + "".join(parts)


def patch_source(source: str) -> tuple[str, list[str]]:
    """Apply narrowly scoped host integrations; return an auditable patch list."""
    if "// GRAND INQUISITOR P50 HOST INTEGRATION" in source:
        raise ValueError("Input already contains P50; build from the unchanged base index.html")
    patches: list[str] = []

    def replace(old: str, new: str, label: str, count: int = 1) -> None:
        nonlocal source
        found = source.count(old)
        if found != count:
            raise ValueError(f"{label}: expected {count} source anchor(s), found {found}: {old[:110]}")
        source = source.replace(old, new)
        patches.append(label)

    replace(
        "const PLAYER_SKINS = [",
        """// GRAND INQUISITOR P50 HOST INTEGRATION
function buildGrandInquisitorPlayer() {
    return buildHostedLibertyPlayer({
        id: 'grand-inquisitor',
        name: 'Grand Inquisitor Cicero',
        url: './assets/models/crimson-wraith.glb',
        height: 2.9,
        weaponMount: [-0.48, 1.45, 0.18],
        danceClips: ['Backflip', 'Backflip_Jump', 'Backflip_Sweep_Kick', 'Boxing_Practice', 'Right_Hand_Sword_Slash', 'Sweeping_Kick', 'Sword_Judgment'],
    });
}

const PLAYER_SKINS = [""",
        "Register exact uploaded Grand Inquisitor rig",
    )
    maria_skin = "    { id: 'maria-414', name: 'Maria 414', blurb: 'playable character · original animated 3D model', build: buildMaria414Player },"
    replace(maria_skin, maria_skin + "\n    { id: 'grand-inquisitor', name: 'Grand Inquisitor Cicero', blurb: 'The Unwritten Verdict · exclusive cinematic intro and six trials · seven attacks', build: buildGrandInquisitorPlayer },", "Add canonical playable character")
    replace(
        "const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];",
        "const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];",
        "Label Grand Inquisitor as body XII in the visible selector",
    )
    replace(
        "        const v = localStorage.getItem(SKIN_KEY);\n        return PLAYER_SKINS.some((s) => s.id === v) ? v : 'acolyte';",
        "        const saved = localStorage.getItem(SKIN_KEY);\n        const v = saved === 'crimson-wraith' ? 'grand-inquisitor' : saved;\n        if (saved === 'crimson-wraith') { try { localStorage.setItem(SKIN_KEY, v); } catch (_) {} }\n        return PLAYER_SKINS.some((s) => s.id === v) ? v : 'acolyte';",
        "Migrate legacy skin id without forcing a character",
    )
    replace("        localStorage.setItem(SKIN_KEY, id);", "        localStorage.setItem(SKIN_KEY, id === 'crimson-wraith' ? 'grand-inquisitor' : id);", "Normalize legacy character selection writes")
    replace("function buildPlayerSkin(id) {\n", "function buildPlayerSkin(id) {\n    if (id === 'crimson-wraith') id = 'grand-inquisitor';\n", "Resolve legacy explicit rig requests")

    for action in ("startDance", "stopDance"):
        replace(
            f"if (this.player?.userData?.hostedLibertyPlayer !== 'maria-414' || !rig?.{action})",
            f"if (!['maria-414', 'grand-inquisitor'].includes(this.player?.userData?.hostedLibertyPlayer) || !rig?.{action})",
            f"Enable native Grand Inquisitor {action}",
        )
    replace("    const isMaria = loadSkinId() === 'maria-414';", "    const activeSkin = loadSkinId();\n    const isMaria = activeSkin === 'maria-414';\n    const isInquisitor = activeSkin === 'grand-inquisitor';", "Recognize attack control character")
    replace("    if (!isMaria || (mobile ? !isTouch : isTouch))", "    if ((!isMaria && !isInquisitor) || (mobile ? !isTouch : isTouch))", "Show attack button on correct input surface")
    replace(
        "        'data-maria-dance': '1',\n        'aria-label': 'Maria 414 dance',\n        title: 'DANCE — tap for one cycle, hold to keep cycling',",
        "        'data-maria-dance': isMaria ? '1' : undefined,\n        'data-inquisitor-attack': isInquisitor ? '1' : undefined,\n        'aria-label': isInquisitor ? 'Grand Inquisitor attack sequence' : 'Maria 414 dance',\n        title: isInquisitor ? 'ATTACK — tap to play all seven attacks and backflips; hold to repeat' : 'DANCE — tap for one cycle, hold to keep cycling',",
        "Name native attack controls accessibly",
    )
    replace("    }, props), 'DANCE');", "    }, props), isInquisitor ? 'ATTACK' : 'DANCE');", "Label native Grand Inquisitor attack control")

    replace(
        "            quests: {\n                mainQuestIndex: s.mainQuestIndex,",
        "            quests: {\n                grandInquisitor: window.__grandInquisitorQuest?.serialize?.(this) ?? this.inquisitorState ?? null,\n                mainQuestIndex: s.mainQuestIndex,",
        "Persist character quest atomically in each world save",
    )
    replace("    hydrateFR(save) {\n", "    hydrateFR(save) {\n        window.__grandInquisitorQuest?.hydrate?.(this, save.quests?.grandInquisitor);\n", "Hydrate character quest before boot's first save")
    replace(
        "    await game.start();\n    if (!game.disposed)\n        game.startTutorial(options);",
        "    game._inquisitorTutorialDecided = false;\n    try {\n        await game.start();\n        if (!game.disposed) game.startTutorial(options);\n    } finally {\n        if (!game.disposed) game._inquisitorTutorialDecided = true;\n    }",
        "Defer exclusive intro until native onboarding decision",
    )

    # Retain native movement/camera; suspend only city simulation and its bounds.
    replace("    microWorldAllowed(st = store.get()) {\n", "    microWorldAllowed(st = store.get()) {\n        if (this.inquisitorInside) return false;\n", "Keep uploaded player visible instead of entering micro mode")
    replace("!this.maria414Inside && !this.sommiMirror414Inside && !this.treasuryInside", "!this.inquisitorInside && !this.maria414Inside && !this.sommiMirror414Inside && !this.treasuryInside", "Suspend city visual ticks and radial boundary", count=3)
    replace("!storyLocked && !tradeFocus && !this.maria414Inside && !this.sommiMirror414Inside", "!storyLocked && !tradeFocus && !this.inquisitorInside && !this.maria414Inside && !this.sommiMirror414Inside", "Pause world simulation while character story owns scene")
    replace("const worldActivityPaused = storyLocked || tradeFocus || !!this.treasuryInside || !!this.maria414Inside || !!this.sommiMirror414Inside;", "const worldActivityPaused = storyLocked || tradeFocus || !!this.inquisitorInside || !!this.treasuryInside || !!this.maria414Inside || !!this.sommiMirror414Inside;", "Pause city threats and system ticks during story")
    replace("        const cols = this.layer === 2 ? this.l2Colliders : this.colliders;", "        const cols = this.inquisitorInside ? [] : this.layer === 2 ? this.l2Colliders : this.colliders;", "Avoid collisions with suspended city geometry")
    replace("        if (this.layer === 2 && this.playerPos.y < 260) {", "        if (!this.inquisitorInside && this.layer === 2 && this.playerPos.y < 260) {", "Support advanced THE LIGHT saves without fall recovery hijack")
    replace("        if (s.phase === 'playing' && !cutsceneLocked) {\n            this.shrines.forEach", "        if (s.phase === 'playing' && !cutsceneLocked && !this.inquisitorInside) {\n            this.shrines.forEach", "Pause proximity economy and city shout input")
    replace("    updateDayNight(dt) {\n", "    updateDayNight(dt) {\n        if (this.inquisitorInside) return;\n", "Preserve authored quest lighting")
    replace("    updateSim(dt) {\n", "    updateSim(dt) {\n        if (this.inquisitorInside) return;\n", "Guard direct simulation calls")
    replace("        if (!this.musicBroke) {", "        if (!this.musicBroke && !this.inquisitorInside) {", "Allow dedicated quest soundtrack to own scene")
    replace("st.dysCutsceneActive || st.maria414CineActive || st.sommiMirror414CineActive", "st.dysCutsceneActive || st.inquisitorCineActive || st.maria414CineActive || st.sommiMirror414CineActive", "Lock native input during Inquisitor cinematics")
    replace("    campaignWorldBeat(banner) {\n", "    campaignWorldBeat(banner) {\n        if (this.inquisitorInside || window.__grandInquisitorQuest?.pending?.(this)) return;\n", "Prevent campaign camera from interrupting exclusive intro")

    gate = "    if (window.__game?.inquisitorInside || window.__grandInquisitorQuest?.pending?.(window.__game)) return; // P50 character presentation gate\n"
    presentations = re.compile(r"(function campaignBegin(?:Chapter(?:One|Two|Three|Four|Five|Six)|Epilogue)Presentation\(\) \{\n)")
    source, count = presentations.subn(lambda m: m[1] + gate, source)
    if count != 7:
        raise ValueError(f"Expected seven campaign presentation hooks, found {count}")
    patches.append("Defer all seven campaign introductions to selected character story")
    replace(
        "    const cutsceneOnly = !inInstance && (maria414CineActive",
        "    const inquisitorInside = useGameSelector((s) => !!s.inquisitorInside);\n    const inquisitorCineActive = useGameSelector((s) => !!s.inquisitorCineActive);\n    const cutsceneOnly = !inInstance && (inquisitorCineActive || maria414CineActive",
        "Subscribe native HUD to story ownership without conditional hooks",
    )
    replace("    if (inst?.kind === 'OrbGame')\n        return null;", "    if (inquisitorInside) return null;\n    if (inst?.kind === 'OrbGame')\n        return null;", "Yield full HUD to compact character story controls")

    # A full Event II run can be present on an advanced save irrespective of skin.
    # Each wrapper still calls its predecessor, preserving movement and older fixes.
    for name in ("vdeBaseUpdatePlayer", "vdeBaseUpdatePlayerStage13", "vdeBaseUpdatePlayerStage16", "vdeBaseUpdatePlayerStage19", "vdeBaseUpdatePlayerStage23"):
        anchor = f"  const {name} = Game.prototype.updatePlayer;\n  Game.prototype.updatePlayer = function(dt) {{\n"
        replace(anchor, anchor + f"    if (this.inquisitorInside || window.__grandInquisitorQuest?.pending?.(this)) return {name}.call(this, dt);\n", f"Suspend {name} while exclusive quest is pending or active")
    replace("Game.prototype.updatePlayer=function(dt){const out=vdeOldUpdate.call(this,dt);vdeAccessEnsure(this);", "Game.prototype.updatePlayer=function(dt){if(this.inquisitorInside||window.__grandInquisitorQuest?.pending?.(this))return vdeOldUpdate.call(this,dt);const out=vdeOldUpdate.call(this,dt);vdeAccessEnsure(this);", "Suspend Event II presentation intensity and entry rebuild")
    replace("Game.prototype.updatePlayer=function(dt){if(vdeLastWordPending()", "Game.prototype.updatePlayer=function(dt){if(this.inquisitorInside||window.__grandInquisitorQuest?.pending?.(this))return vdeLastWordUpdate.call(this,dt);if(vdeLastWordPending()", "Defer Event II closing scene while exclusive intro owns camera")
    replace("function tick(g,dt){const r=ensure(g);if(!r)return;style();", "function tick(g,dt){if(g.inquisitorInside)return;const r=ensure(g);if(!r)return;style();", "Suspend Treasury earnings and exterior visibility during quest")
    replace("Game.prototype.updatePlayer=function(dt){const r=this._treasury;if(r?.film)", "Game.prototype.updatePlayer=function(dt){if(this.inquisitorInside)return update.call(this,dt);const r=this._treasury;if(r?.film)", "Suspend Treasury presentation during character story")
    replace("return !g||CW||FR||runtime.active||runtime.transition||document.hidden", "return !g||CW||FR||g.inquisitorInside||window.__grandInquisitorQuest?.pending?.(g)||runtime.active||runtime.transition||document.hidden", "Prevent Somewhere Before dream from interrupting quest")

    replace("const DEV_CUTSCENE_CATALOG = Object.freeze([", "const DEV_CUTSCENE_CATALOG = Object.freeze([\n    { id: 'grand-inquisitor-unwritten-verdict', label: 'GRAND INQUISITOR — THE UNWRITTEN VERDICT', tone: 'gold' },", "Add native recording catalog entry")
    replace(
        "    if (id === 'maria414-same-night') {",
        "    if (id === 'grand-inquisitor-unwritten-verdict') {\n        if (!g.inquisitorRecordings?.()) throw new Error('Select Grand Inquisitor Cicero and complete The Unwritten Verdict to open its recordings.');\n        return id;\n    }\n    if (id === 'maria414-same-night') {",
        "Route native archive entry to character recordings",
    )
    # Extend the current STORIES & WORLDS record, retaining its styling and score.
    replace(
        "    const house = json('atropa_sommi_414_house_v1', 1) || {};",
        """    const inquisitor = safe(() => window.__grandInquisitorQuest?.indexEntry?.(window.__game));
    if (inquisitor) {
        const q = safe(() => window.__grandInquisitorQuest?.read?.(window.__game)) || {};
        const complete = inquisitor.complete === true, started = q.started === true;
        const total = n(inquisitor.total, 100) || 6, stage = n(inquisitor.stage, total - 1);
        const entry = row(inquisitor.id || 'grand-inquisitor-unwritten-verdict',
            (inquisitor.character || 'Grand Inquisitor Cicero') + ' · ' + (inquisitor.title || 'The Unwritten Verdict'),
            inquisitor.description || 'Character-exclusive introduction · six trials and seven cinematics', complete, started,
            complete ? 'Verdict recorded. Replay the full sequence or individual chapters.' : inquisitor.next || 'Select Grand Inquisitor Cicero. His story begins after onboarding, including on an existing campaign save.',
            [['STATUS', status(complete, started)], ['TRIAL', complete ? total + ' / ' + total : started ? (stage + 1) + ' / ' + total : '—'], ['CHARACTER', 'Grand Inquisitor Cicero'], ['NEXT', inquisitor.next || (complete ? 'Recordings unlocked' : 'Begin after onboarding')]]);
        entry.nativeActions = [{ label: complete ? 'RECORDINGS' : started ? 'RESUME STORY' : 'START STORY', tip: 'Continue through the original character story', go: () => {
            const g = window.__game;
            if (!g || loadSkinId() !== 'grand-inquisitor') { Quests.toast('Select Grand Inquisitor Cicero to enter this story.'); return; }
            const before = store.get().panel;
            store.set({ panel: null });
            const ok = complete ? g.inquisitorRecordings?.() : g.inquisitorStart?.();
            if (ok === false) { store.set({ panel: before }); Quests.toast('Finish or leave the current activity, then resume the Inquisitor story.'); }
        }}];
        stories.unshift(entry);
    }
    const house = json('atropa_sommi_414_house_v1', 1) || {};""",
        "Show authoritative quest progress and resume in existing Index",
    )
    replace("    const stt = cat.summaryOnly ? { label: 'READ ONLY', tone: '#9fb3c8' } : IX_STATE[rowState(row)];", "    const stt = cat.summaryOnly && !row.nativeActions ? { label: 'READ ONLY', tone: '#9fb3c8' } : IX_STATE[rowState(row)];", "Display active status for actionable character record")
    replace("    const acts = cat.acts ? cat.acts(row) : [];", "    const acts = row.nativeActions || (cat.acts ? cat.acts(row) : []);", "Use native Index action buttons for the new story only")
    return source, patches


def update_source_tag(tag: str, raw_size: int, raw_sha: str) -> str:
    if not SHA_RE.search(tag) or not SIZE_RE.search(tag):
        raise ValueError("Source package is missing checksum or size metadata")
    tag = SHA_RE.sub(f'data-raw-sha256="{raw_sha}"', tag, count=1)
    return SIZE_RE.sub(f'data-raw-size="{raw_size}"', tag, count=1)


def wrapper_html(manifest: dict) -> str:
    # Embed exact build metadata. No browser-side source rewriting/recompilation,
    # forced selection, save mutation, or navigation to a different URL.
    meta = json.dumps({key: manifest[key] for key in ("revision", "sourceSha256", "sourceRawBytes", "baseSourceSha256", "packageSha256")}, separators=(",", ":"))
    picker_css = '''<style id="atropa-p50-character-picker">
.atropa-char-select .atropa-char-dots{display:grid!important;grid-template-columns:repeat(12,minmax(0,1fr));width:min(100%,576px);max-width:100%;gap:4px!important;flex-shrink:0}
.atropa-char-select .atropa-char-dots>button{min-width:0;min-height:44px;justify-content:center;padding:4px!important;border-radius:9px}
@media(max-width:640px){.atropa-char-select .atropa-char-dots{grid-template-columns:repeat(6,minmax(0,1fr))}}
@media(orientation:landscape) and (max-height:540px) and (min-width:600px){
.atropa-char-select .atropa-char-layout{grid-template-rows:18px 23px 92px minmax(37px,auto) minmax(70px,1fr) 46px!important}
.atropa-char-select .atropa-char-dots{grid-template-columns:repeat(6,minmax(0,1fr));align-self:center}
.atropa-char-select .atropa-char-name h1{white-space:normal!important;line-height:1.1;font-size:clamp(16px,2.5vw,22px)!important}
}
</style>'''
    return r'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#090610">
  <title>ATROPA — Grand Inquisitor Cicero · The Unwritten Verdict</title>
  <style>
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#090610;color:#ece3d4;font:15px/1.6 system-ui,sans-serif}body{min-height:100dvh;display:grid;place-items:center;background:radial-gradient(ellipse at 50% 35%,#30132788,transparent 62%),#090610}main{width:min(530px,calc(100% - 40px));text-align:center;padding:32px 0}.eyebrow{color:#c6a164;font-size:10px;letter-spacing:.26em;text-transform:uppercase}h1{font:500 clamp(25px,6vw,42px)/1.18 Georgia,serif;margin:20px 0 13px}.subtitle{color:#a899a5;font-size:12px}.bar{margin:28px auto 15px;height:3px;width:82%;overflow:hidden;background:#332232}.bar i{display:block;width:32%;height:100%;background:linear-gradient(90deg,transparent,#e8bf73,transparent);animation:load 1.8s ease-in-out infinite}#status{font-size:12px;overflow-wrap:anywhere}#recover{margin-top:20px}a{display:inline-block;padding:9px 17px;margin:4px;border:1px solid #8b6a45;border-radius:4px;color:#f2d4a4;text-decoration:none;font-size:12px}a:focus-visible{outline:2px solid #edc780;outline-offset:4px}.error .bar{display:none}@keyframes load{from{transform:translateX(-100%)}to{transform:translateX(410%)}}@media(prefers-reduced-motion:reduce){.bar i{animation:none;width:100%}}
  </style>
</head>
<body>
  <main id="loader"><div class="eyebrow">ATROPA · THE PEGGENING</div><h1>THE UNWRITTEN VERDICT</h1><p class="subtitle">Grand Inquisitor Cicero</p><div class="bar" aria-hidden="true"><i></i></div><p id="status" role="status">Preparing Atropa…</p><div id="recover" hidden><a id="retry" href="">Retry loading</a><a href="./index.html?atropa-base=1">Open previous version</a></div></main>
  <script>
  (async () => {
    'use strict';
    const build = __P50_BUILD_METADATA__;
    const status = document.getElementById('status');
    const read = async (path) => { const response = await fetch(path, {cache:'no-store'}); if (!response.ok) throw new Error('Loading ' + path + ' failed (' + response.status + ').'); return new Uint8Array(await response.arrayBuffer()); };
    const hash = async (bytes) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
    const htmlText = (bytes) => { const le=bytes[0]===255&&bytes[1]===254,be=bytes[0]===254&&bytes[1]===255;return new TextDecoder(le?'utf-16le':be?'utf-16be':'utf-8',{fatal:true}).decode(bytes); };
    try {
      status.textContent = 'Loading Atropa and the Inquisitor story…';
      const [hostBytes,packageBytes] = await Promise.all([read('./index.html'),read('./quests/grand-inquisitor-runtime.pkg')]);
      if (!globalThis.crypto?.subtle) throw new Error('Open this update through its hosted HTTPS game link.');
      if (await hash(packageBytes) !== build.packageSha256) throw new Error('The story download was incomplete. Retry loading.');
      let html = htmlText(hostBytes);
      const pattern = /(<script id="atropa-src"[^>]*>)(.*?)(<\/script>)/s;
      const match = pattern.exec(html);
      if (!match) throw new Error('The Atropa source package was not found.');
      const baseHash = /data-raw-sha256="([a-f0-9]{64})"/.exec(match[1]);
      if (!baseHash || baseHash[1] !== build.baseSourceSha256) throw new Error('Atropa has changed since this story build. Open Atropa below while this update is refreshed.');
      const packed = new TextDecoder('utf-8',{fatal:true}).decode(packageBytes);
      if (!/^~47:\d+:/.test(packed)) throw new Error('The Inquisitor story package has an invalid format.');
      if (!/data-raw-size="\d+"/.test(match[1])) throw new Error('Atropa source metadata is missing.');
      const tag = match[1].replace(/data-raw-sha256="[a-f0-9]{64}"/,'data-raw-sha256="'+build.sourceSha256+'"').replace(/data-raw-size="\d+"/,'data-raw-size="'+build.sourceRawBytes+'"');
      html = html.slice(0,match.index)+tag+packed+match[3]+html.slice(match.index+match[0].length);
      html = html.replace(/data-integration-revision="[^"]*"/,'data-integration-revision="'+build.revision+'"');
      html = html.replace('</head>', __P50_PICKER_STYLES__ + '</head>');
      status.textContent = 'Entering Atropa…';
      document.open();document.write(html);document.close();
    } catch (error) {
      console.error('[Grand Inquisitor P50 loader]',error);
      document.getElementById('loader').classList.add('error');
      status.textContent = error?.message || 'Atropa could not load. Retry below.';
      document.getElementById('retry').href = window.location.href;
      document.getElementById('recover').hidden = false;
    }
  })();
  </script>
</body>
</html>
'''.replace("__P50_BUILD_METADATA__", meta).replace("__P50_PICKER_STYLES__", json.dumps(picker_css))


def build(root: Path) -> dict:
    index = root / "index.html"
    original_bytes = index.read_bytes()
    html = read_html(original_bytes)
    matches = list(SOURCE_RE.finditer(html))
    if len(matches) != 1:
        raise ValueError(f"Expected one packed Classic source, found {len(matches)}")
    match = matches[0]
    raw_base = gzip.decompress(decode47(match[2]))
    checksum = SHA_RE.search(match[1])
    original_size = SIZE_RE.search(match[1])
    if not checksum or sha256(raw_base) != checksum[1]:
        raise ValueError("Input Classic source checksum mismatch")
    if not original_size or len(raw_base) != int(original_size[1]):
        raise ValueError("Input Classic source size mismatch")

    source, patches = patch_source(raw_base.decode("utf-8").replace("\r\n", "\n"))
    module_hashes = {}
    for name in MODULE_NAMES:
        path = root / "quests" / name
        if not path.is_file():
            raise ValueError(f"Required quest module is not ready: {path}")
        module = path.read_bytes()
        module_hashes[name] = sha256(module)
        source += "\n\n// P50 MODULE: " + name + "\n" + module.decode("utf-8").rstrip() + "\n"
    raw_source = source.encode("utf-8")
    with tempfile.TemporaryDirectory(prefix="atropa-p50-check-") as scratch:
        script = Path(scratch) / "atropa-p50.js"
        script.write_bytes(raw_source)
        check = subprocess.run(["node", "--check", str(script)], capture_output=True, text=True)
        if check.returncode:
            raise ValueError("Compiled JavaScript syntax check failed:\n" + check.stderr)

    packed = encode47(gzip.compress(raw_source, compresslevel=9, mtime=0))
    if gzip.decompress(decode47(packed)) != raw_source:
        raise ValueError("Packed source roundtrip mismatch")
    package_bytes = packed.encode("utf-8")
    source_sha = sha256(raw_source)
    source_tag = update_source_tag(match[1], len(raw_source), source_sha)
    patched_html = html[:match.start()] + source_tag + packed + match[3] + html[match.end():]
    new_match = SOURCE_RE.search(patched_html)
    if not new_match or new_match[2] != packed:
        raise ValueError("Could not install the new source package into the host")
    # Removing just atropa-src must produce byte-identical Unicode host markup.
    # This covers every other payload, loader, setting and embedded child game.
    if html[:match.start()] + html[match.end():] != patched_html[:new_match.start()] + patched_html[new_match.end():]:
        raise ValueError("An unrelated host or embedded payload changed")

    manifest = {
        "revision": REVISION,
        "sourceSha256": source_sha,
        "sourceRawBytes": len(raw_source),
        "baseSourceSha256": checksum[1],
        "baseSourceRawBytes": len(raw_base),
        "baseHtmlSha256": sha256(original_bytes),
        "package": "quests/" + PACKAGE_NAME,
        "packageSha256": sha256(package_bytes),
        "packageBytes": len(package_bytes),
        "wrapper": PAGE_NAME,
        "modules": module_hashes,
        "patches": patches,
        "validation": {"nodeSyntax": True, "packedRoundtrip": True, "unrelatedHostMarkupPreserved": True},
    }
    wrapper = wrapper_html(manifest)
    wrapper_scripts = re.findall(r"<script>(.*?)</script>", wrapper, re.S)
    if len(wrapper_scripts) != 1:
        raise ValueError("Update wrapper script was not generated correctly")
    with tempfile.TemporaryDirectory(prefix="atropa-p50-wrapper-") as scratch:
        script = Path(scratch) / "wrapper.js"
        script.write_text(wrapper_scripts[0], encoding="utf-8")
        check = subprocess.run(["node", "--check", str(script)], capture_output=True, text=True)
        if check.returncode:
            raise ValueError("Loader JavaScript syntax check failed:\n" + check.stderr)
    (root / "quests" / PACKAGE_NAME).write_bytes(package_bytes)
    (root / "quests" / MANIFEST_NAME).write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    (root / PAGE_NAME).write_text(wrapper, encoding="utf-8")
    if index.read_bytes() != original_bytes:
        raise ValueError("index.html changed while building; do not publish this output")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--promote", action="store_true", help="Connect the normal website to P50 while retaining all original game payloads")
    options = parser.parse_args()
    root = options.root.resolve()
    previous_index = (root / "index.html").read_bytes() if options.promote else None
    try:
        if options.promote:
            promote_entry(root)
        manifest = build(root)
    except Exception:
        if previous_index is not None:
            (root / "index.html").write_bytes(previous_index)
        raise
    print(f"Built {manifest['revision']}")
    print(f"Source: {manifest['sourceRawBytes']:,} bytes; SHA256 {manifest['sourceSha256']}")
    print(f"Runtime package: {manifest['packageBytes']:,} bytes; {len(manifest['patches'])} checked host integrations")
    print("Verified: JavaScript syntax, packed roundtrip, unchanged embedded host payloads and unchanged index.html.")
    print(f"Page: {manifest['wrapper']}")


if __name__ == "__main__":
    main()

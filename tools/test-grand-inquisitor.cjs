#!/usr/bin/env node
'use strict';
/**
 * Integration tests against the actual packed P50 page and its real Classic game.
 * No game, renderer, save store, animation rig, or quest implementation is mocked.
 * Every run uses a fresh browser profile and isolated contexts, never a user's save.
 *
 * node tools/test-grand-inquisitor.cjs --url http://127.0.0.1:8460/Atropa-P50-Grand-Inquisitor-Update.html \
 *   --puppeteer /absolute/path/to/puppeteer.js --output ./inquisitor-test-results
 *
 * Optional: --executable /path/to/chrome --headful --only substring
 * Public release smoke: --only Hosted --expected-source-sha <decoded source SHA256>
 * Environment: ATROPA_TEST_URL, ATROPA_PUPPETEER_MODULE, ATROPA_BROWSER_EXECUTABLE.
 *
 * Test checkpoints deliberately place the real player beside a target or restore
 * a valid late checkpoint. They test lifecycle, actual attack/input dispatch,
 * render geometry, persistence and replay; they do not claim full manual traversal
 * of every encounter or a visual art-direction review.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function option(name, fallback = undefined) {
  const at = process.argv.indexOf('--' + name);
  return at >= 0 ? process.argv[at + 1] : fallback;
}
const targetURL = option('url', process.env.ATROPA_TEST_URL);
if (!targetURL) {
  console.error('Usage: node tools/test-grand-inquisitor.cjs --url <hosted P50 HTML> [--puppeteer <module>] [--output <directory>]');
  process.exit(2);
}
const startURL = new URL(targetURL);
if (!startURL.searchParams.has('classic')) startURL.searchParams.set('classic', '1');
const output = path.resolve(option('output', './inquisitor-test-results'));
const timeout = Number(option('timeout-ms', 180000));
const only = option('only', '').toLowerCase();
const expectedSourceSha = option('expected-source-sha');
const modulePath = option('puppeteer', process.env.ATROPA_PUPPETEER_MODULE);
const puppeteer = modulePath ? require(modulePath) : (() => {
  try { return require('puppeteer'); } catch (_) { return require('puppeteer-core'); }
})();
fs.mkdirSync(output, { recursive: true });

const report = { url: startURL.href, started: new Date().toISOString(), actualHost: true, cases: [], checks: 0 };
let browser;
const nap = ms => new Promise(resolve => setTimeout(resolve, ms));
const expectedClips = ['Backflip', 'Backflip_Jump', 'Backflip_Sweep_Kick', 'Boxing_Practice', 'Right_Hand_Sword_Slash', 'Sweeping_Kick', 'Sword_Judgment'];

function check(condition, text, detail = undefined) {
  report.checks++;
  assert.ok(condition, detail === undefined ? text : text + ': ' + JSON.stringify(detail));
}
function equal(actual, expected, text) {
  report.checks++;
  assert.deepEqual(actual, expected, text);
}
async function eventually(read, predicate, text, limit = 25000) {
  const deadline = Date.now() + limit;
  let last;
  while (Date.now() < deadline) {
    last = await read();
    if (predicate(last)) return last;
    await nap(100);
  }
  throw new Error(text + ' timed out; last=' + JSON.stringify(last));
}
async function frames(page) {
  for (const frame of page.frames()) {
    try {
      if (await frame.evaluate(() => typeof window.__grandInquisitorQuest === 'object' && typeof store === 'object')) return frame;
    } catch (_) { /* A document.write or detached boot frame is still loading. */ }
  }
  return null;
}
async function gameFrame(page) {
  return eventually(() => frames(page), Boolean, 'Classic runtime frame', timeout);
}
async function button(frame, pattern, required = true) {
  const expression = pattern.source, flags = pattern.flags;
  const handle = await frame.evaluateHandle((expression, flags) => {
    const re = new RegExp(expression, flags);
    return [...document.querySelectorAll('button,[role="button"],a')].find(el => {
      const rect = el.getBoundingClientRect(), style = getComputedStyle(el);
      return !el.disabled && rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
        && re.test((el.textContent || '').trim());
    }) || null;
  }, expression, flags);
  const el = handle.asElement();
  if (!el) { await handle.dispose(); if (required) throw new Error('Button missing: ' + pattern); return false; }
  await el.click(); await handle.dispose(); return true;
}
async function snapshot(frame) {
  return frame.evaluate(() => {
    const g = window.__game, s = store.get(), api = window.__grandInquisitorQuest;
    if (!g) return { phase: s.phase, game: false };
    return {
      game: true, phase: s.phase, selected: loadSkinId(), hosted: g.player?.userData?.hostedLibertyPlayer,
      decided: !!g._inquisitorTutorialDecided, tut: !!g.tut, inside: !!g.inquisitorInside,
      cinematic: !!g.inquisitorRuntime?.presentation.cinematic, clip: g.inquisitorRuntime?.clip ?? null,
      q: api.serialize(g), chapter: s.campaign?.chapter, banner: !!s.campaignBanner, panel: s.panel?.type || null,
      pos: g.playerPos.toArray(), layer: g.layer, visible: g.player.visible,
      rigReady: !!g.player.userData.externalRig?.ready, rigFailed: !!g.player.userData.externalRig?.failed,
      paused: !!g._inquisitorPaused,
      rigError: g.player.userData.externalRig?.error || '', dance: g.player.userData.externalRig?.danceMode || null,
      pendingHit: !!g.inquisitorRuntime?.pendingHit, frame: g.renderer?.info?.render?.frame || 0,
    };
  });
}
async function boot(page) {
  if (!await frames(page)) {
    await page.waitForFunction(() => typeof window.__atropaStartMain === 'function' || typeof window.__grandInquisitorQuest === 'object', { timeout });
    await page.evaluate(async () => {
      // The actual host deliberately uses strict indirect eval. Export its real
      // private references only inside this isolated test document; the shipped
      // package and application remain byte-for-byte unchanged.
      if (!window.__p50QaRuntimeBridge && typeof window.__grandInquisitorQuest !== 'object') {
        const nativeEval = window.eval;
        window.eval = function(source) {
          if (typeof source === 'string' && source.includes('// GRAND INQUISITOR P50 HOST INTEGRATION')) {
            window.eval = nativeEval;
            // Hash exactly the decoded production source before adding this
            // test-only bridge; the launcher removes the packed script element.
            window.__p50QaSourceSha = crypto.subtle.digest('SHA-256', new TextEncoder().encode(source))
              .then(hash => Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join(''));
            return nativeEval(source + '\n;Object.assign(window,{store,loadSkinId,frSaveKey,indexStoryWorldRows,loadPrestigeSave,DEV_CHAPTER_QUESTS,devFinishQuest,freshCampaignState,devApplyStateGuards,atropaTransferCollect,atropaTransferJson,atropaTransferImportRaw,loadSettings,saveSettings});window.__p50QaRuntimeBridge=true;\n');
          }
          return nativeEval(source);
        };
      }
      if (typeof window.__atropaStartMain === 'function') await window.__atropaStartMain();
      document.getElementById('atropa-site-front')?.remove();
      document.getElementById('atropa-site-splash')?.remove();
      document.documentElement.classList.remove('atropa-site-visible');
    });
    process.stdout.write('BOOT native launcher completed\n');
  }
  const frame = await gameFrame(page);
  process.stdout.write('BOOT actual Classic runtime and test bridge available\n');
  // The actual character picker is used. Its selected body comes from the fixture.
  await eventually(async () => {
    const s = await snapshot(frame);
    if (s.game && s.phase === 'playing') return true;
    if (await button(frame, /^ENTER$/, false)) { process.stdout.write('BOOT selected character ENTER\n'); return false; }
    if (await button(frame, /^CONTINUE\s*[→➜]?$/, false)) { process.stdout.write('BOOT world CONTINUE\n'); return false; }
    if (await button(frame, /^ENTER THE CITY\s*[→➜]?$/, false)) { process.stdout.write('BOOT ENTER THE CITY\n'); return false; }
    if (await button(frame, /^BEGIN$/, false)) return false;
    return false;
  }, Boolean, 'Actual character/world/city boot controls', timeout);
  return frame;
}
async function contextCase(name, seed, run, viewport = { width: 1280, height: 900, deviceScaleFactor: 1 }) {
  if (only && !name.toLowerCase().includes(only)) return;
  const started = Date.now();
  const context = browser.createBrowserContext ? await browser.createBrowserContext() : await browser.createIncognitoBrowserContext();
  const page = await context.newPage(), errors = [], failures = [];
  const item = { name, checksBefore: report.checks, errors, failedRequests: failures };
  report.cases.push(item);
  process.stdout.write('RUN ' + name + '\n');
  try {
    await page.setViewport(viewport);
    page.setDefaultTimeout(timeout);
    page.on('pageerror', error => { const msg = String(error.message || error).slice(0, 1600); errors.push(msg); process.stderr.write('PAGE ERROR ' + msg + '\n'); });
    page.on('requestfailed', request => failures.push({ url: request.url().slice(0, 250), error: request.failure()?.errorText }));
    await page.evaluateOnNewDocument(seed => {
      try {
        if (localStorage.getItem('__atropa_p50_qa_seed')) return;
        for (const [key, value] of Object.entries(seed)) localStorage.setItem(key, value);
        localStorage.setItem('__atropa_p50_qa_seed', 'isolated-test-context');
      } catch (_) { /* The outer shell may temporarily have an opaque origin. */ }
    }, seed);
    await page.goto(startURL.href, { waitUntil: 'domcontentloaded', timeout });
    const frame = await boot(page);
    item.sourceSha256 = await frame.evaluate(async () => await window.__p50QaSourceSha || null);
    if (expectedSourceSha) equal(item.sourceSha256, expectedSourceSha, 'Actual evaluated production source matches expected build SHA');
    await run({ page, frame, context });
    check(!errors.some(e => /Grand Inquisitor|GrandInquisitor|inquisitor|React error #(?:310|311|321)|Rendered (?:more|fewer) hooks/i.test(e)), 'No quest or hook runtime errors', errors);
    item.status = 'PASS';
    process.stdout.write('PASS ' + name + ' (' + (report.checks - item.checksBefore) + ' checks)\n');
  } catch (error) {
    item.status = 'FAIL'; item.error = String(error.stack || error);
    const file = path.join(output, name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '-failure.png');
    try { await page.screenshot({ path: file, fullPage: false }); item.screenshot = file; } catch (_) {}
    try { const frame = await frames(page); item.lastState = frame ? await snapshot(frame) : null; } catch (_) {}
    process.stderr.write('FAIL ' + name + '\n' + item.error + '\n');
  } finally {
    item.durationMs = Date.now() - started; item.checks = report.checks - item.checksBefore; delete item.checksBefore;
    await context.close();
    fs.writeFileSync(path.join(output, 'grand-inquisitor-results.json'), JSON.stringify(report, null, 2));
  }
}
async function waitInside(frame, stage = undefined) {
  return eventually(async () => {
    const s = await snapshot(frame);
    if (s.rigFailed || (s.paused && s.q?.started && !s.inside)) throw new Error('Quest/model failed before entry: ' + JSON.stringify(s));
    return s;
  }, s => s.inside && s.rigReady && (stage === undefined || s.q.stage === stage), 'Exclusive quest auto-start', timeout);
}
async function finishScene(frame) {
  const before = await snapshot(frame);
  check(before.cinematic, 'Scene is active before skip');
  await frame.evaluate(() => window.__grandInquisitorQuest.finishClip(window.__game));
  await eventually(() => snapshot(frame), s => !s.cinematic || s.clip !== before.clip || !s.inside, 'Scene skip commits actual callback');
}
async function putByTarget(frame, stage, index, distance = 2) {
  await frame.evaluate((stage, index, distance) => {
    const g = window.__game, p = g.inquisitorWorld.target(stage, index);
    p.y = g.groundH(p.x, p.z); p.z += distance;
    g.keys = {}; g.touchMoveVec = null; g.moveTarget = null;
    g.playerVel.set(0, 0, 0); g.playerPos.copy(p); g.player.position.copy(p); g.grounded = true;
    // Placement is a fixture. Let actual subsequent frames establish rig velocity.
  }, stage, index, distance);
  const start = (await snapshot(frame)).frame;
  await eventually(() => snapshot(frame), s => s.frame > start + 2, 'Native render frames after target placement');
}
async function key(frame, value, type) {
  await frame.evaluate((value, type) => window.dispatchEvent(new KeyboardEvent(type, { key: value, code: value === ' ' ? 'Space' : 'Key' + value.toUpperCase(), bubbles: true, cancelable: true })), value, type);
}
async function cityRecord(frame) {
  return frame.evaluate(() => {
    const g = window.__game, s = store.get();
    return { chapter: s.campaign?.chapter, main: s.mainQuestIndex, done: s.mainQuests.filter(q => q.done).map(q => q.id),
      pls: s.pls, shares: s.shares, antiRug: s.antiRug, relics: s.relics, layer: g.layer, pos: g.playerPos.toArray(),
      camera: { yaw: g.camYaw, pitch: g.camPitch, view: g.viewMode, zoom: g.zoomMul, chase: g.chaseZoom, fov: g.camera.fov } };
  });
}
function hostProgress(record) { return { chapter: record.chapter, main: record.main, done: record.done, antiRug: record.antiRug, relics: record.relics }; }
async function worldAssertions(frame) {
  const state = await frame.evaluate(() => {
    const g = window.__game, w = g.inquisitorWorld, r = g.inquisitorRuntime;
    const clone = w.target(0, 0), original = clone.toArray(); clone.x += 999;
    const invalid = []; let geometries = 0, meshes = 0;
    w.root.traverse(o => { if (o.isMesh) meshes++; const a = o.geometry?.attributes?.position; if (a) { geometries++; for (const n of a.array) if (!Number.isFinite(n)) { invalid.push(o.name); break; } } });
    return { rooms: w.rooms.length, targets: w.rooms.map(x => x.targets.length), rootVisible: w.root.visible,
      visible: w.rooms.map(x => x.root.visible), original, again: w.target(0, 0).toArray(), geometries, meshes, invalid,
      floor: w.rooms.map(x => ({ top: x.floor.position.y + x.floor.scale.y / 2, size: x.floor.scale.toArray() })),
      clips: g.player.userData.externalRig.danceActions.map(a => a.getClip().name),
      stage: r.stage, renderCalls: g.renderer.info.render.calls, triangles: g.renderer.info.render.triangles,
      playerVisible: g.player.visible, microAllowed: g.microWorldAllowed(store.get()), hostObjectsHidden: r.snapshot.objects.every(([o]) => o === g.player || o === g.camera || !o.visible) };
  });
  equal(state.rooms, 6, 'Six real Three.js chambers constructed');
  equal(state.targets, [3, 3, 3, 3, 4, 1], 'All seventeen real interaction/attack targets exist');
  equal(state.original, state.again, 'World target accessor returns a clone');
  equal(state.visible.filter(Boolean).length, 1, 'Only the current chamber is visible');
  check(state.rootVisible && state.visible[state.stage], 'Active quest chamber is visible');
  check(state.geometries > 30 && state.meshes > 30 && state.invalid.length === 0, 'Real chamber geometry is populated and finite', state);
  check(state.floor.every(f => Math.abs(f.top) < 1e-8 && f.size[0] >= 60 && f.size[2] >= 70), 'All rooms have a continuous floor at player ground height', state.floor);
  equal(state.clips, expectedClips, 'Uploaded GLB contains all seven exact attack clips in order');
  check(state.playerVisible && !state.microAllowed && state.hostObjectsHidden, 'Quest owns player and scene visibility');
  check(state.renderCalls > 0 && state.triangles > 0, 'Actual WebGL renderer draws non-empty scene');
}

(async () => {
  const executablePath = option('executable', process.env.ATROPA_BROWSER_EXECUTABLE);
  browser = await puppeteer.launch({ headless: !process.argv.includes('--headful'), ...(executablePath ? { executablePath } : {}),
    protocolTimeout: timeout, args: ['--enable-unsafe-swiftshader', '--disable-dev-shm-usage', ...(process.platform === 'linux' ? ['--no-sandbox'] : [])] });

  await contextCase('Hosted Grand introduction, full model and native attack', {
    atropa_skin_v1: 'grand-inquisitor', atropa_prestige_v1: JSON.stringify({ trialDone: true, trialOutcome: 'completed', seenIntro: true })
  }, async ({ page, frame }) => {
    const state = await waitInside(frame, 0);
    equal(state.selected, 'grand-inquisitor', 'Hosted game retains explicit Grand selection');
    check(state.cinematic && state.clip === 0 && !state.tut && !state.banner, 'Hosted Grand intro starts before campaign presentation');
    await worldAssertions(frame);
    const clips = await frame.evaluate(() => window.__game.player.userData.externalRig.danceActions.map(a => ({ name: a.getClip().name, duration: a.getClip().duration })));
    check(clips.every(clip => clip.duration > 0), 'Hosted model loads every complete animation clip', clips);
    process.stdout.write('HOSTED actual model clips ' + JSON.stringify(clips) + '\n');
    await nap(1500);
    await page.screenshot({ path: path.join(output, 'hosted-grand-intro.png') });
    await finishScene(frame); await putByTarget(frame, 0, 0);
    await key(frame, 'q', 'keydown'); await key(frame, 'q', 'keyup');
    await eventually(() => snapshot(frame), current => current.q.seals[0], 'Hosted native animation impact opens actual first seal', 15000);
    check(await frame.evaluate(() => JSON.parse(localStorage.getItem(frSaveKey())).quests.grandInquisitor.seals[0]), 'Hosted impact persists in native world save');
    await page.screenshot({ path: path.join(output, 'hosted-grand-gameplay.png') });
  });

  await contextCase('Fresh Grand skip, active attacks, puzzle, checkpoint and Index resume', { atropa_skin_v1: 'grand-inquisitor' }, async ({ page, frame }) => {
    let state = await snapshot(frame);
    check(state.tut && !state.inside && !state.q.started, 'Fresh onboarding owns the game before Grand intro', state);
    check(await frame.evaluate(() => window.__game.skipTutorial()), 'Actual native skipTutorial succeeds');
    state = await waitInside(frame, 0);
    const firstRig = await frame.evaluate(() => window.__game.player.userData.externalRig.danceActions.map(a => ({ name: a.getClip().name, duration: a.getClip().duration })));
    process.stdout.write('FIRST QUEST FRAME ' + JSON.stringify({ state, clips: firstRig }) + '\n');
    await page.screenshot({ path: path.join(output, 'fresh-inquisitor-intro.png') });
    process.stdout.write('SCREENSHOT ' + path.join(output, 'fresh-inquisitor-intro.png') + '\n');
    equal(state.clip, 0, 'First exclusive scene starts immediately after skip');
    check(!state.banner && state.layer === 1 && state.pos[0] > 1000, 'Campaign presentation and city do not interrupt intro');
    await worldAssertions(frame);
    await eventually(() => frame.evaluate(() => window.__game.inquisitorRuntime.presentation.cinematic?.t || 0), t => t >= 9.8, 'Summons close-up shot', 18000);
    await page.screenshot({ path: path.join(output, 'fresh-inquisitor-summons-close.png') });
    await finishScene(frame);
    await page.screenshot({ path: path.join(output, 'fresh-inquisitor-gameplay.png') });
    await putByTarget(frame, 0, 0);
    await key(frame, 'q', 'keydown'); await key(frame, 'q', 'keyup');
    await eventually(() => snapshot(frame), s => s.q.seals.some(Boolean), 'Native Q attack animation produces real seal hit', 15000);
    check(await frame.evaluate(() => JSON.parse(localStorage.getItem(frSaveKey())).quests.grandInquisitor.seals.some(Boolean)), 'Attack checkpoint is inside native v6 world save');
    await key(frame, 'w', 'keydown');
    await eventually(() => snapshot(frame), s => !s.dance && !s.pendingHit, 'Native movement interrupts attack and cancels pending hit');
    await key(frame, 'w', 'keyup');
    for (let i = 0; i < 3; i++) {
      if ((await snapshot(frame)).q.seals[i]) continue;
      await putByTarget(frame, 0, i);
      check(await frame.evaluate(() => window.__game.inquisitorAttack()), 'Real attack starts beside remaining seal');
      await eventually(() => snapshot(frame), s => s.q.seals[i] || s.q.stage > 0, 'Seal ' + i + ' checkpoint', 15000);
      await frame.evaluate(() => window.__game.mariaDanceStop());
    }
    await eventually(() => snapshot(frame), s => s.q.stage === 1, 'All three seals unlock archive trial');
    await page.screenshot({ path: path.join(output, 'archive-gameplay.png') });
    // The actual coupled station interactions solve the authored [3,1,2] puzzle.
    for (const index of [0, 2, 2]) {
      await putByTarget(frame, 1, index);
      await nap(260);
      check(await frame.evaluate(() => window.__game.interact()), 'Native interact turns archive station ' + index);
    }
    state = await snapshot(frame);
    equal(state.q.turns, [3, 1, 2], 'Coupled stations reconstruct the divided record');
    equal(state.clip, 1, 'Puzzle completion starts its cinematic');
    await finishScene(frame); // The next authored scene introduces the Erasure.
    state = await snapshot(frame); equal(state.q.stage, 2, 'Archive transitions to the Erasure'); equal(state.clip, 2, 'Erasure intro is recorded as pending');
    const prior = state.q;
    await frame.evaluate(async () => { window.__game.saveFR(); await window.__game._durableSave; });
    await page.reload({ waitUntil: 'domcontentloaded', timeout }); frame = await boot(page);
    state = await waitInside(frame, 2);
    equal(state.clip, 2, 'Reload resumes interrupted cinematic at the existing stage');
    equal(state.q.seals, prior.seals, 'Earlier attack checkpoints survive actual boot hydration');
    equal(state.q.turns, prior.turns, 'Puzzle checkpoint survives reload');
    await finishScene(frame);
    const restored = await frame.evaluate(() => {
      const g = window.__game, r = g.inquisitorRuntime, p = r.snapshot.pos.toArray(), layer = r.snapshot.layer;
      const owned = [g.inquisitorWorld.root, r.fx.root];
      const ok = g.inquisitorPause();
      return { ok, expected: p, actual: g.playerPos.toArray(), layer, actualLayer: g.layer, disposed: owned.every(o => !o.parent),
        row: indexStoryWorldRows(store.get()).find(x => x.key === 'grand-inquisitor-unwritten-verdict')?.nativeActions?.[0]?.label };
    });
    check(restored.ok && restored.disposed, 'Pause disposes quest-owned scene resources');
    equal(restored.actual, restored.expected, 'Pause restores exact saved city position');
    equal(restored.actualLayer, restored.layer, 'Pause restores city layer');
    equal(restored.row, 'RESUME STORY', 'Existing Index exposes an actionable resume entry');
    await nap(700); check(!(await snapshot(frame)).inside, 'Pausing does not immediately auto-enter again');
    await frame.evaluate(() => indexStoryWorldRows(store.get()).find(x => x.key === 'grand-inquisitor-unwritten-verdict').nativeActions[0].go());
    await waitInside(frame, 2);
    const { runTrialSequence } = require('./grand-inquisitor-trial-scenarios.cjs');
    await runTrialSequence({ page, frame, check, equal, eventually, snapshot, putByTarget, key, nap, finishScene, output });
  });

  await contextCase('Fresh Grand completed onboarding and restart lifecycle', { atropa_skin_v1: 'grand-inquisitor' }, async ({ frame }) => {
    check((await snapshot(frame)).tut, 'Fresh completed-onboarding case begins in native tutorial');
    check(await frame.evaluate(() => window.__game.finishTutorial('completed')), 'Actual native completed endpoint succeeds');
    const state = await waitInside(frame, 0);
    equal(state.clip, 0, 'Completed onboarding starts first Grand scene');
    equal(await frame.evaluate(() => loadPrestigeSave().trialOutcome), 'completed', 'Native profile stores completed tutorial outcome');
    // Exercise the exact old micro-world ownership that previously risked an
    // invisible player or 72-degree city camera after returning from a story.
    await frame.evaluate(() => { window.__game.inquisitorPause(); store.set({ panel: null, campaignBanner: null }); window.__game.lookBeat = null; });
    await nap(250);
    const microBaseline = await frame.evaluate(() => {
      const g = window.__game; store.set({ panel: null, campaignBanner: null }); g.lookBeat = null;
      const baseline = { fov: g.camera.fov, near: g.camera.near };
      saveSettings({ ...loadSettings(), microWorld: true, sfx: true, music: true });
      g.sfx.ensure(); g.music.tick(.25, g.nightK || 0, false);
      return baseline;
    });
    await eventually(() => frame.evaluate(() => ({ owned: window.__game._microPlayerOwned, projection: !!window.__game._microProjection })), x => x.owned && x.projection, 'Native micro-world acquires player and camera');
    check(await frame.evaluate(() => window.__game.inquisitorStart()), 'Story starts from active micro-world');
    await waitInside(frame, 0); await nap(250);
    const microInside = await frame.evaluate(() => {
      const g = window.__game, r = g.inquisitorRuntime;
      return { visible: g.player.visible, own: !!g._microPlayerOwned, fov: r.snapshot.fov, near: r.snapshot.near,
        audio: r.snapshot.audio.map(a => ({ kind: a.kind, before: a.value, now: a.gain.value })) };
    });
    check(microInside.visible && !microInside.own, 'Quest releases micro-world hidden-player ownership');
    equal({ fov: microInside.fov, near: microInside.near }, microBaseline, 'Quest snapshots restored normal camera baseline');
    check(microInside.audio.some(a => a.kind === 'music') && microInside.audio.every(a => Math.abs(a.now) < .002), 'Existing city music and drones are silent inside quest', microInside.audio);
    await frame.evaluate(() => { const g = window.__game; g.inquisitorPause(); saveSettings({ ...loadSettings(), microWorld: false }); store.set({ panel: null, campaignBanner: null }); g.lookBeat = null; });
    await eventually(() => frame.evaluate(() => ({ visible: window.__game.player.visible, owned: !!window.__game._microPlayerOwned, near: window.__game.camera.near })), x => x.visible && !x.owned && Math.abs(x.near - microBaseline.near) < .0001, 'Disabling micro-world after story leaves visible player and normal projection');
    await frame.evaluate(() => window.__game.restart());
    const resumed = await eventually(() => snapshot(frame), s => s.tut || s.inside, 'Restart reaches tutorial or fresh exclusive intro', 30000);
    if (resumed.tut) { await frame.evaluate(() => window.__game.skipTutorial()); await waitInside(frame, 0); }
    equal((await snapshot(frame)).q.stage, 0, 'New run starts a new first trial');
  });

  let advancedSeed = null;
  await contextCase('Other character unchanged and native advanced save fixture', { atropa_skin_v1: 'acolyte' }, async ({ frame }) => {
    equal((await snapshot(frame)).selected, 'acolyte', 'P50 does not force Grand selection');
    await frame.evaluate(() => window.__game.skipTutorial());
    await nap(800);
    const state = await snapshot(frame);
    check(!state.inside && !state.q.started, 'Another character never starts the exclusive quest');
    const result = await frame.evaluate(async () => {
      const g = window.__game;
      // Build a genuine veteran save from the live host state using its existing
      // quest definitions, state guards and saveFR serializer.
      store.mutate(st => {
        for (let chapter = 1; chapter <= 4; chapter++) for (const id of DEV_CHAPTER_QUESTS[chapter] || []) devFinishQuest(st, id);
        st.campaign = { ...freshCampaignState(), chapter: 5, completed: [1, 2, 3, 4], introSeen: [1, 2, 3, 4], finaleSeen: [1, 2, 3, 4] };
        st.mainQuestIndex = st.mainQuests.findIndex(q => !q.done); st.phase = 'playing'; st.campaignBanner = null; st.panel = null;
        st.pls = 73129; st.shares = 123; st.antiRug = 73; st.lightUnlocked = true; st.gatewayRedirect = 'light';
        devApplyStateGuards(st);
      });
      g.lookBeat = null; g.keys = {}; g.moveTarget = null; g.playerVel.set(0, 0, 0);
      g.playerPos.set(23, g.groundH(23, 41), 41); g.player.position.copy(g.playerPos);
      g.camYaw = .63; g.camPitch = .44; g.viewMode = 'chase'; g.chaseZoom = 1.35; g.zoomMul = 1.1;
      if (!g.saveFR()) throw new Error('Could not create real host checkpoint');
      await g._durableSave;
      const pack = atropaTransferCollect(), key = frSaveKey(), save = JSON.parse(pack.keys[key]);
      // A pre-P50 save has no Grand state at all; preserve its actual v6 shape.
      delete save.quests.grandInquisitor; pack.keys[key] = JSON.stringify(save);
      delete pack.keys[key + '_lastgood']; pack.keys.atropa_skin_v1 = 'grand-inquisitor';
      return { seed: pack.keys, chapter: save.quests.campaign.chapter, main: save.quests.mainQuestIndex, pls: save.econ.pls };
    });
    equal(result.chapter, 5, 'Veteran fixture is the real chapter-five campaign save');
    check(result.main > 3 && result.pls === 73129, 'Veteran fixture has substantial completed progress and balance');
    advancedSeed = result.seed;
    fs.writeFileSync(path.join(output, 'advanced-test-fixture.json'), JSON.stringify({ note: 'Synthetic test account, serialized by the actual running game', keys: advancedSeed }, null, 2));
  });

  async function advancedCase({ page, frame }, legacy = false) {
    let state = await waitInside(frame, 0);
    equal(state.selected, 'grand-inquisitor', legacy ? 'Legacy skin id migrates canonically' : 'Explicit Grand selection is retained');
    equal(state.chapter, 5, 'Advanced campaign chapter survives auto-intro');
    equal(state.clip, 0, 'Advanced save receives the complete first intro');
    check(!state.tut && !state.banner, 'Veteran onboarding and campaign banner do not preempt Grand');
    const mainBefore = await frame.evaluate(() => {
      const g = window.__game; g.saveFR(); const p = JSON.parse(localStorage.getItem(frSaveKey()));
      return { main: p.quests.mainQuestIndex, chapter: p.quests.campaign.chapter, pls: p.econ.pls,
        antiRug: p.econ.antiRug, pos: p.pos, camera: p.camera, q: p.quests.grandInquisitor, keys: Object.keys(localStorage).filter(k => /^atropa_.*inquisitor/i.test(k)) };
    });
    equal(mainBefore.pos, { x: 23, z: 41 }, 'Saving from intro preserves host position instead of sanctum position');
    check(mainBefore.pls === 73129 && mainBefore.main > 3 && mainBefore.q.started, 'Host economy/progression and quest checkpoint share native save');
    equal(mainBefore.keys, [], 'No separate global Grand completion key leaks across imported runs');
    if (legacy) return;
    await finishScene(frame);
    const nativeBefore = await frame.evaluate(() => {
      const g = window.__game, snap = g.inquisitorRuntime.snapshot;
      const expected = { pos: snap.pos.toArray(), layer: snap.layer, yaw: snap.camYaw, pitch: snap.camPitch, mode: snap.viewMode, zoom: snap.zoomMul, chase: snap.chaseZoom, fov: snap.fov };
      g.inquisitorPause();
      return { expected, actual: { pos: g.playerPos.toArray(), layer: g.layer, yaw: g.camYaw, pitch: g.camPitch, mode: g.viewMode, zoom: g.zoomMul, chase: g.chaseZoom, fov: g.camera.fov } };
    });
    equal(nativeBefore.actual, nativeBefore.expected, 'Pause restores advanced host camera, layer and position exactly');
    const progress = hostProgress(await cityRecord(frame));
    // Restore a legitimate final-door checkpoint through the host hydrate/save
    // path. Final completion itself still uses the native interact + scene callback.
    await frame.evaluate(() => {
      const g = window.__game, api = window.__grandInquisitorQuest;
      api.hydrate(g, { ...api.serialize(g), started: true, stage: 5, seen: [0, 1, 2, 3, 4, 5], pendingClip: null, doorOpened: false, complete: false });
      g._inquisitorPaused = true; store.set({ panel: null, campaignBanner: null }); g.lookBeat = null;
      if (!g.inquisitorStart()) throw new Error('Final checkpoint could not resume');
    });
    await putByTarget(frame, 5, 0);
    check(await frame.evaluate(() => window.__game.interact()), 'Final door opens through native interact');
    state = await snapshot(frame); equal(state.clip, 6, 'Door starts the seventh scene');
    await finishScene(frame);
    state = await snapshot(frame); check(state.q.complete && !state.inside, 'Completion returns to city and unlocks recordings');
    equal(hostProgress(await cityRecord(frame)), progress, 'Completing character story preserves advanced campaign progress');
    const completed = state.q;
    await frame.evaluate(() => { store.set({ campaignBanner: null, panel: null }); window.__game.lookBeat = null; });
    check(await frame.evaluate(() => window.__game.inquisitorRecordings()), 'Completed story opens recordings menu');
    equal(await frame.evaluate(() => document.querySelectorAll('#inquisitor-recordings button').length), 9, 'Menu offers all seven individual scenes, full sequence and close');
    await button(frame, /^PLAY ALL SEVEN SCENES$/);
    const seen = [];
    for (let i = 0; i < 7; i++) {
      state = await snapshot(frame); seen.push(state.clip);
      check(state.inside && state.cinematic, 'Replay scene ' + i + ' owns scene');
      equal(state.q, completed, 'Replay scene ' + i + ' leaves completed quest immutable');
      await finishScene(frame);
    }
    equal(seen, [0, 1, 2, 3, 4, 5, 6], 'Full replay visits all seven scenes in order');
    state = await snapshot(frame); check(!state.inside, 'Full replay returns to city'); equal(state.q, completed, 'Replay leaves persistent completion unchanged');
    // Export uses the existing transfer mechanism and embeds the same q state.
    const pack = await frame.evaluate(() => JSON.parse(atropaTransferJson(window.__game)));
    const keyName = await frame.evaluate(() => frSaveKey());
    equal(JSON.parse(pack.keys[keyName]).quests.grandInquisitor, completed, 'Native export includes completed character quest');
    const oldSave = JSON.parse(pack.keys[keyName]); delete oldSave.quests.grandInquisitor;
    pack.keys[keyName] = JSON.stringify(oldSave); delete pack.keys[keyName + '_lastgood'];
    const imported = await frame.evaluate(raw => {
      const g = window.__game; atropaTransferImportRaw(raw);
      const before = localStorage.getItem(frSaveKey()), staleWrite = g.saveFR(), after = localStorage.getItem(frSaveKey());
      return { staleWrite, unchanged: before === after, containsOldCompletion: !!JSON.parse(after).quests.grandInquisitor };
    }, JSON.stringify(pack));
    check(imported.staleWrite === false && imported.unchanged, 'Import generation prevents old live game overwriting imported save');
    check(!imported.containsOldCompletion, 'Import of pre-P50 save removes old quest completion with that world');
    await page.reload({ waitUntil: 'domcontentloaded', timeout }); frame = await boot(page);
    state = await waitInside(frame, 0);
    check(!state.q.complete && state.clip === 0, 'Imported old world gets its own first Grand intro');
  }

  // --only can still run the advanced tests alone: supply a previously generated
  // fixture with --fixture <advanced-test-fixture.json>.
  const fixture = option('fixture');
  if (!advancedSeed && fixture) advancedSeed = JSON.parse(fs.readFileSync(fixture, 'utf8')).keys;
  if (advancedSeed) {
    await contextCase('Advanced save, city restoration, completion, seven replays and import', advancedSeed, advancedCase);
    await contextCase('Legacy Crimson Wraith id migrates on advanced load', { ...advancedSeed, atropa_skin_v1: 'crimson-wraith' }, args => advancedCase(args, true));
    await contextCase('Camera archive framing and native core approach', advancedSeed, async ({ page, frame }) => {
      await waitInside(frame, 0);
      const { runCameraSmoke } = require('./grand-inquisitor-trial-scenarios.cjs');
      await runCameraSmoke({ page, frame, check, equal, eventually, snapshot, putByTarget, key, nap, finishScene, output });
    });
  } else if (!only || /advanced|legacy/.test(only)) {
    report.cases.push({ name: 'Advanced fixture dependency', status: 'FAIL', error: 'Advanced fixture was not produced; run all tests or use --fixture.' });
  }

  for (const viewport of [{ width: 390, height: 844 }, { width: 915, height: 412 }]) {
    await contextCase('Mobile ' + viewport.width + 'x' + viewport.height + ' dialogue and native controls', {
      atropa_skin_v1: 'grand-inquisitor', atropa_prestige_v1: JSON.stringify({ trialDone: true, trialOutcome: 'completed', seenIntro: true })
    }, async ({ page, frame }) => {
      await waitInside(frame, 0);
      await nap(2200);
      const film = await frame.evaluate(() => {
        const sub = document.querySelector('.gip-sub'), line = document.querySelector('.gip-line');
        const visible = el => el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0;
        return { width: innerWidth, height: innerHeight, overflow: document.documentElement.scrollWidth > innerWidth + 1,
          subtitleHeight: sub?.getBoundingClientRect().height || 0, lineClip: line ? line.scrollHeight > line.clientHeight + 1 : false,
          buttons: [...document.querySelectorAll('[class*="gip"] button')].filter(visible).map(el => ({ text: el.textContent.trim(), width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })) };
      });
      check(!film.overflow && film.subtitleHeight <= film.height * .20 + 1 && !film.lineClip, 'Mobile cinematic dialogue fits without clipping', film);
      check(film.buttons.every(b => b.width >= 44 && b.height >= 44), 'Visible cinematic buttons meet 44px targets', film.buttons);
      check(!film.buttons.some(b => /ATTACK|JUMP|INTERACT/i.test(b.text)), 'Gameplay controls are hidden during film');
      await page.screenshot({ path: path.join(output, 'mobile-' + viewport.width + 'x' + viewport.height + '-intro.png') });
      await finishScene(frame);
      const controls = await frame.evaluate(() => [...document.querySelectorAll('[class*="gip"] button')].filter(el => {
        const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none';
      }).map(el => ({ text: el.textContent.trim(), aria: el.getAttribute('aria-label'), classes: el.className, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })));
      check(controls.every(b => b.width >= 44 && b.height >= 44), 'Mobile gameplay controls meet 44px targets', controls);
      check(['gip-attack', 'gip-jump', 'gip-interact'].every(name => controls.some(b => b.classes.split(/\s+/).includes(name))), 'Mobile attack, jump and contextual interact are present', controls);
      check(await frame.evaluate(() => document.querySelector('.gip-joystick').getBoundingClientRect().width > 44), 'Touch-only movement joystick is available');
      await page.screenshot({ path: path.join(output, 'mobile-' + viewport.width + 'x' + viewport.height + '-gameplay.png') });
      const attack = await frame.$('.gip-attack'); await attack.tap(); await attack.dispose();
      await eventually(() => snapshot(frame), s => !!s.dance, 'Trusted mobile ATTACK tap starts the real animation chain');
      const start = (await snapshot(frame)).pos;
      await frame.evaluate(() => {
        const el = document.querySelector('.gip-joystick'), r = el.getBoundingClientRect();
        el.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 91, pointerType: 'touch', clientX: r.x + r.width / 2 + 36, clientY: r.y + r.height / 2, bubbles: true, cancelable: true, buttons: 1 }));
      });
      await eventually(() => snapshot(frame), s => Math.hypot(s.pos[0] - start[0], s.pos[2] - start[2]) > .35 && !s.dance, 'Mobile joystick moves actual player and interrupts attack');
      await frame.evaluate(() => document.querySelector('.gip-joystick').dispatchEvent(new PointerEvent('pointerup', { pointerId: 91, pointerType: 'touch', bubbles: true, cancelable: true })));
      check(await frame.evaluate(() => window.__game.touchMoveVec === null), 'Releasing joystick clears movement state');
      const jump = await frame.$('.gip-jump'); await jump.tap(); await jump.dispose();
      await eventually(() => snapshot(frame), s => s.pos[1] > 24.05, 'Trusted mobile JUMP tap uses native airborne movement');
      await frame.evaluate(() => {
        const g = window.__game, api = window.__grandInquisitorQuest; g.inquisitorPause();
        api.hydrate(g, { ...api.serialize(g), stage: 1, turns: [0, 0, 0], seen: [0], pendingClip: null });
        store.set({ panel: null, campaignBanner: null }); g.lookBeat = null;
        if (!g.inquisitorStart()) throw new Error('Mobile archive checkpoint could not start');
      });
      await waitInside(frame, 1); await putByTarget(frame, 1, 0);
      await eventually(() => frame.evaluate(() => !document.querySelector('.gip-interact').disabled), Boolean, 'Contextual mobile interact enables beside real archive station');
      const interact = await frame.$('.gip-interact'); await interact.tap(); await interact.dispose();
      equal((await snapshot(frame)).q.turns, [1, 1, 0], 'Trusted mobile contextual action turns the two linked archive stations');
      await page.screenshot({ path: path.join(output, 'mobile-' + viewport.width + 'x' + viewport.height + '-archive.png') });
    }, { ...viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  }
})().catch(error => {
  report.fatal = String(error.stack || error); console.error(report.fatal); process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close();
  report.finished = new Date().toISOString(); report.passed = report.cases.filter(x => x.status === 'PASS').length;
  report.failed = report.cases.filter(x => x.status === 'FAIL').length;
  fs.writeFileSync(path.join(output, 'grand-inquisitor-results.json'), JSON.stringify(report, null, 2));
  process.stdout.write(JSON.stringify({ passed: report.passed, failed: report.failed, checks: report.checks, output }) + '\n');
  if (report.failed || report.fatal || report.passed === 0) process.exitCode = 1;
});

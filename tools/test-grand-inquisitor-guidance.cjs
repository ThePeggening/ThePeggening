#!/usr/bin/env node
'use strict';

// Focused guidance checks against the real packed game. The shared integration
// harness supplies its isolated browser, native launcher and private-store bridge.
// Checkpoints use the public hydrate API. Only the player's fixture position is
// placed; witness movement, wardens, damage, puzzle turns and scenes stay native.
const fs = require('node:fs');
const path = require('node:path');
const harnessSource = fs.readFileSync(path.join(__dirname, 'test-grand-inquisitor.cjs'), 'utf8').replace(/^#![^\r\n]*\r?\n/, '');
const mainBoundary = harnessSource.indexOf('\n(async () => {\n  const executablePath');
if (mainBoundary < 0) throw new Error('The shared real-host integration harness entry was not found.');

async function runGuidanceTests() {
  const metrics = { started: new Date().toISOString(), actualHost: true, checkpointFixtures: true, stages: [], puzzle: [], screenshots: [], events: [] };
  const log = (event, detail = {}) => {
    metrics.events.push({ event, ...detail });
    process.stdout.write('GUIDE ' + event + ' ' + JSON.stringify(detail) + '\n');
  };
  const executablePath = option('executable', process.env.ATROPA_BROWSER_EXECUTABLE);
  browser = await puppeteer.launch({ headless: !process.argv.includes('--headful'), ...(executablePath ? { executablePath } : {}),
    protocolTimeout: timeout, args: ['--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--window-size=390,844', ...(process.platform === 'linux' ? ['--no-sandbox'] : [])] });
  try {
    await contextCase('Focused red guide in all six quest stages', {
      atropa_skin_v1: 'grand-inquisitor',
      atropa_prestige_v1: JSON.stringify({ trialDone: true, trialOutcome: 'completed', seenIntro: true }),
    }, async ({ page, frame }) => {
      metrics.sourceSha256 = await frame.evaluate(async () => await window.__p50QaSourceSha);
      const read = () => frame.evaluate(() => {
        const g = window.__game, r = g.inquisitorRuntime, w = g.inquisitorWorld, guide = w?.guide;
        const q = window.__grandInquisitorQuest.serialize(g), origin = w?.rooms[r?.stage ?? q.stage]?.root.position;
        const arrows = [], matrix = g.player.matrix.clone();
        let lowestArrowVertex = Infinity;
        if (guide) {
          const a = guide.trail.geometry.attributes.position;
          for (let i = 0; i < a.count; i++) lowestArrowVertex = Math.min(lowestArrowVertex, a.getY(i));
          for (let i = 0; i < guide.trail.count; i++) {
            guide.trail.getMatrixAt(i, matrix);
            const e = matrix.elements, pos = g.playerPos.clone().set(e[12], e[13], e[14]);
            const projected = pos.clone().add(guide.root.position).project(g.camera);
            arrows.push({ pos: pos.toArray(), forward: [e[8], e[10]], projected: projected.toArray(),
              inFrame: Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1 && Math.abs(projected.z) < 1 });
          }
        }
        const pointer = guide?.root.getObjectByName('inquisitor-red-target-pointer');
        return {
          q, inside: !!g.inquisitorInside, cinematic: !!r?.presentation.cinematic, clip: r?.clip ?? null,
          replay: !!r?.replay, frame: g.renderer.info.render.frame, clock: r?.clock ?? 0,
          player: g.playerPos.toArray(), origin: origin?.toArray(),
          witness: r?.witness.toArray(), witnessDistance: r ? Math.hypot(g.playerPos.x - r.witness.x, g.playerPos.z - r.witness.z) : null,
          relaySpawned: r?.relaySpawned, purgeHP: r?.purgeHP, integrity: r?.integrity,
          guards: r?.fx.guards.map(x => ({ hp: x.hp, visible: x.mesh.visible, pos: x.mesh.position.toArray() })) || [],
          bossExposed: r?.bossExposed, targets: w?.rooms[r?.stage ?? q.stage]?.targets.map(t => t.pos.toArray()) || [],
          guide: guide ? { active: guide.active, visible: guide.root.visible, kind: guide.kind, count: guide.trail.count,
            target: guide.target.toArray(), worldTarget: guide.worldTarget.toArray(), from: guide.from.toArray(),
            distance: guide.distance, color: '#' + guide.trail.material.color.getHexString(), arrows,
            lowestArrowVertex, pointerY: pointer?.position.y, pointerScale: pointer?.scale.y,
            parented: !!guide.root.parent, beaconVisible: guide.beacon.visible } : null,
        };
      });
      const settle = async (count = 12) => {
        const first = (await read()).frame;
        return eventually(read, s => s.frame > first + count, 'Live render frames settle', 15000);
      };
      const shoot = async (name, validate = true) => {
        const s = await settle(16), file = path.join(output, name + '.png');
        await page.screenshot({ path: file, fullPage: false });
        const visibleArrows = s.guide?.arrows.filter(a => a.inFrame).length || 0;
        metrics.screenshots.push({ file, stage: s.q.stage, kind: s.guide?.kind, visibleArrows, totalArrows: s.guide?.count });
        if (validate) check(visibleArrows > 0, 'Portrait view contains visible red floor arrows: ' + name, { visibleArrows, guide: s.guide });
        return s;
      };
      const distance = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
      const expectTarget = (s, kind, position, label) => {
        check(!!s.guide?.active && s.guide.visible && s.guide.beaconVisible, label + ': scoped guide is active');
        equal(s.guide.kind, kind, label + ': canonical objective kind');
        check(distance(s.guide.worldTarget, position) < .04, label + ': destination follows the actual target', { guide: s.guide.worldTarget, expected: position });
        equal(s.guide.color, '#ff3434', label + ': floor arrows use the requested red');
        check(s.guide.arrows.every(a => a.pos[1] + s.guide.lowestArrowVertex > .08), label + ': every arrow sits above the solid floor');
        check(s.guide.arrows.every(a => Math.abs(a.pos[0]) <= 32 && Math.abs(a.pos[2]) <= 40), label + ': path remains inside the room floor');
      };
      const placeLocal = async (x, z) => {
        await frame.evaluate((x, z) => {
          const g = window.__game, origin = g.inquisitorWorld.rooms[g.inquisitorRuntime.stage].root.position;
          g.mariaDanceStop(); g.keys = {}; g.touchMoveVec = null; g.moveTarget = null; g.playerVel.set(0, 0, 0);
          g.playerPos.set(origin.x + x, origin.y, origin.z + z); g.player.position.copy(g.playerPos); g.grounded = true;
        }, x, z);
        return settle(3);
      };
      const checkpoint = async (stage, overrides = {}) => {
        const result = await frame.evaluate((stage, overrides) => {
          const g = window.__game, api = window.__grandInquisitorQuest;
          const seen = stage === 1 ? [0] : Array.from({ length: stage + 1 }, (_, i) => i);
          api.hydrate(g, { v: 1, started: true, complete: false, stage, seals: [false, false, false], turns: [0, 0, 0],
            relay: 0, locks: [false, false, false], bossPhase: 0, doorOpened: false, seen, pendingClip: null, ...overrides });
          g.lookBeat = null; store.set({ panel: null, campaignBanner: null });
          return g.inquisitorStart();
        }, stage, overrides);
        check(result, 'Real checkpoint resumes stage ' + stage);
        return eventually(read, s => s.inside && !s.cinematic && s.q.stage === stage && s.guide?.active, 'Live guide after checkpoint ' + stage, 25000);
      };
      const hidden = (s, label) => check(!s.guide || (!s.guide.active && !s.guide.visible && s.guide.count === 0), label);

      if (process.argv.includes('--visual-only')) {
        const initial = await waitInside(frame, 0); if (initial.cinematic) await finishScene(frame);
        const settleCamera = async () => {
          const first = await read();
          return eventually(read, x => x.frame > first.frame + 50 && x.clock > first.clock + 1.4, 'Native camera settles after a remote checkpoint jump', 15000);
        };
        for (const stage of [1, 3, 5]) {
          await checkpoint(stage); await settleCamera();
          let at = await shoot('guide-' + String(stage).padStart(2, '0') + '-settled-portrait');
          expectTarget(at, stage === 1 ? 'station' : stage === 3 ? 'clock' : 'door', at.guide.worldTarget, 'Settled portrait stage ' + stage);
          if (stage === 1) {
            const index = at.targets.findIndex(p => distance(p, at.guide.worldTarget) < .04);
            await putByTarget(frame, 1, index, 12); await settleCamera();
            at = await shoot('guide-01-archive-marker-close-portrait');
            check(at.guide.pointerY - .65 * at.guide.pointerScale > 6.15, 'Close archive marker clears the station label');
          }
          metrics.stages.push({ stage, settledVisual: true }); log('settled-visual', { stage });
        }
        return;
      }

      let s = await waitInside(frame, 0);
      check(s.cinematic, 'Fresh selected character starts the actual Summons');
      hidden(await read(), 'Red guide stays hidden during the Summons cinematic');
      await finishScene(frame);
      s = await eventually(read, x => x.guide?.active && x.guide.count > 0, 'First red seal objective');
      let nearest = s.targets.reduce((best, p, i) => distance(s.player, p) < distance(s.player, s.targets[best]) ? i : best, 0);
      expectTarget(s, 'seal', s.targets[nearest], 'Summons');
      check(s.guide.arrows.every(a => a.forward[0] * (s.guide.target[0] - a.pos[0]) + a.forward[1] * (s.guide.target[2] - a.pos[2]) > 0), 'All seal arrow tips point forward toward the seal');
      s = await shoot('guide-00-summons-portrait'); metrics.stages.push({ stage: 0, kind: s.guide.kind, count: s.guide.count });
      log('stage-0', { count: s.guide.count });

      s = await checkpoint(1);
      s = await shoot('guide-01-archive-portrait');
      check(s.guide.pointerY - .65 * s.guide.pointerScale > 6.15, 'Archive downward marker clears the physical station label', { pointerY: s.guide.pointerY, pointerScale: s.guide.pointerScale, labelTop: 6.04 });
      const goal = [3, 1, 2];
      const moved = (turns, index) => turns.map((v, i) => (v + (i === index || i === (index + 1) % 3 ? 1 : 0)) % 4);
      const shortest = start => {
        const queue = [{ turns: start, distance: 0 }], visited = new Set([start.join(',')]);
        for (let i = 0; i < queue.length; i++) {
          const at = queue[i]; if (at.turns.join(',') === goal.join(',')) return at.distance;
          for (let station = 0; station < 3; station++) { const turns = moved(at.turns, station), key = turns.join(','); if (!visited.has(key)) { visited.add(key); queue.push({ turns, distance: at.distance + 1 }); } }
        }
        return Infinity;
      };
      for (let step = 0; step < 10 && !s.q.aligned.every(Boolean); step++) {
        const index = s.targets.findIndex(p => distance(p, s.guide.worldTarget) < .04), before = s.q.turns;
        check(index >= 0, 'Archive guide chooses a physical station');
        expectTarget(s, 'station', s.targets[index], 'Archive move ' + step);
        equal(shortest(moved(before, index)), shortest(before) - 1, 'Guided station strictly shortens the independently solved puzzle');
        metrics.puzzle.push({ turns: before, station: index, remaining: shortest(before) });
        await putByTarget(frame, 1, index, 2); await nap(280);
        check(await frame.evaluate(() => window.__game.interact()), 'Actual archive interaction turns the guided station');
        s = await eventually(read, x => x.q.turns.join(',') !== before.join(','), 'Native linked archive turn');
        if (!s.cinematic) s = await settle(2);
      }
      equal(s.q.turns, goal, 'Following the red guide solves all three linked histories');
      equal(metrics.puzzle.length, 3, 'Fresh linked archive is solved in three guided turns');
      s = await settle(2); check(s.cinematic && s.clip === 1, 'Native solved archive starts its recorded scene'); hidden(s, 'Guide disappears during divided-record reveal');
      metrics.stages.push({ stage: 1, moves: metrics.puzzle.length, markerClearsLabel: true }); log('stage-1', { moves: metrics.puzzle });

      s = await checkpoint(2);
      expectTarget(s, 'escort', s.targets[0], 'Initial witness escort');
      await shoot('guide-02-erasure-escort-portrait');
      s = await placeLocal(24, 33);
      s = await eventually(read, x => x.guide?.kind === 'witness', 'Guide returns to a distant witness');
      expectTarget(s, 'witness', s.witness, 'Lost witness');
      // Place only the player near the live witness, then follow the native moving
      // guard midpoint. This exposes all transient routing states without a replay.
      await frame.evaluate(() => {
        const g = window.__game, p = g.inquisitorRuntime.witness.clone(); p.x -= 4; p.z -= 4; p.y = g.groundH(p.x, p.z);
        g.playerPos.copy(p); g.player.position.copy(p); g.playerVel.set(0, 0, 0); g.grounded = true;
      });
      s = await eventually(read, x => x.relaySpawned === 0 && x.guards.some(g => g.hp > 0) && x.guide.kind === 'warden', 'Native guard spawn retargets the red guide');
      const livingNearest = s.guards.filter(g => g.hp > 0 && g.visible).sort((a, b) => distance(s.player, a.pos) - distance(s.player, b.pos))[0];
      expectTarget(s, 'warden', livingNearest.pos, 'Active warden');
      await shoot('guide-02-erasure-warden-portrait');
      let attacked = false; const combatDeadline = Date.now() + 40000;
      while (Date.now() < combatDeadline) {
        s = await read();
        if (s.guards.every(g => g.hp <= 0)) { await frame.evaluate(() => window.__game.mariaDanceStop()); break; }
        const living = s.guards.filter(g => g.hp > 0).sort((a, b) => distance(s.witness, a.pos) - distance(s.witness, b.pos));
        if (!attacked && distance(s.witness, living[0].pos) < 20) {
          await frame.evaluate(() => {
            const g = window.__game, r = g.inquisitorRuntime;
            const guard = r.fx.guards.filter(x => x.hp > 0).sort((a, b) => a.mesh.position.distanceTo(r.witness) - b.mesh.position.distanceTo(r.witness))[0];
            const p = r.witness.clone().lerp(guard.mesh.position, .5); p.y = g.groundH(p.x, p.z);
            g.playerPos.copy(p); g.player.position.copy(p); g.playerVel.set(0, 0, 0); g.grounded = true;
          });
          check(await frame.evaluate(() => window.__game.inquisitorAttack(true)), 'Native attack chain starts against the live wardens'); attacked = true;
        }
        await nap(100);
      }
      s = await eventually(read, x => x.guards.every(g => g.hp <= 0) && x.guide.kind === 'relay', 'Defeated native wardens reveal the purge-relay objective', 10000);
      expectTarget(s, 'relay', s.targets[0], 'Purge relay after live combat'); check(s.purgeHP > 0, 'Guide marks the still-intact purge relay');
      metrics.stages.push({ stage: 2, kinds: ['escort', 'witness', 'warden', 'relay'], integrity: s.integrity });
      for (const relay of [1, 2]) { s = await checkpoint(2, { relay }); expectTarget(s, 'escort', s.targets[relay], 'Saved relay ' + relay); }
      log('stage-2', { switches: metrics.stages[2].kinds, integrity: metrics.stages[2].integrity });

      s = await checkpoint(3);
      expectTarget(s, 'clock', s.targets[0], 'First clock'); await shoot('guide-03-clock-portrait');
      await placeLocal(0, 0);
      s = await eventually(read, x => (x.clock % 5.6) < 1.8 && x.guide.arrows.some(a => Math.abs(a.pos[0] + 12.6) < .05 && Math.abs(a.pos[2] - 10) < 2.2), 'Charged clock red path uses the outer lane');
      check(s.guide.arrows.every(a => !(Math.abs(a.pos[0]) < 10 && Math.abs(a.pos[2] - 10) < 1.15)), 'Charged clock arrows avoid the exact native damaging strip');
      check(s.guide.arrows.filter(a => Math.abs(a.pos[2] - 10) < 2.2).every(a => Math.abs(a.pos[0]) > 11.25), 'Crossing arrows visibly use the safe outside lane');
      metrics.clockRoute = s.guide.arrows.map(a => a.pos);
      await shoot('guide-03-clock-safe-lane-portrait', false);
      for (const next of [1, 2]) { s = await checkpoint(3, { locks: [0, 1, 2].map(i => i < next) }); expectTarget(s, 'clock', s.targets[next], 'Saved next clock ' + next); }
      metrics.stages.push({ stage: 3, allLocksRoute: true, chargedLaneSafe: true }); log('stage-3');

      for (const bossPhase of [0, 1, 2]) {
        s = await checkpoint(4, { bossPhase }); expectTarget(s, 'station', s.targets[bossPhase], 'Tribunal station phase ' + bossPhase);
        if (bossPhase === 0) await shoot('guide-04-tribunal-station-portrait');
        await putByTarget(frame, 4, bossPhase, 2);
        check(await frame.evaluate(() => window.__game.interact()), 'Actual correct station exposes crown phase ' + bossPhase);
        s = await eventually(read, x => x.bossExposed > 0 && x.guide.kind === 'core', 'Red guide switches to reachable core phase ' + bossPhase);
        expectTarget(s, 'core', s.targets[3], 'Exposed core phase ' + bossPhase);
        if (bossPhase === 0) { await placeLocal(0, 18); await shoot('guide-04-tribunal-core-portrait'); }
      }
      metrics.stages.push({ stage: 4, stationsAndCore: [0, 1, 2] }); log('stage-4');

      s = await checkpoint(5); expectTarget(s, 'door', s.targets[0], 'Final door cradle'); await shoot('guide-05-door-portrait');
      await frame.evaluate(() => { window.__p50RetiredGuide = window.__game.inquisitorWorld.guide; });
      await putByTarget(frame, 5, 0, 2); check(await frame.evaluate(() => window.__game.interact()), 'Native door interaction starts the final scene');
      s = await eventually(read, x => x.cinematic && x.clip === 6, 'Actual door reveal begins');
      s = await settle(2); hidden(s, 'Red guide is hidden throughout the door reveal');
      await finishScene(frame); s = await eventually(read, x => x.q.complete && !x.inside, 'Door callback completes and leaves the quest'); hidden(s, 'No guide remains after completion');
      const disposed = await frame.evaluate(() => { const a = window.__p50RetiredGuide; return { active: a.active, visible: a.root.visible, count: a.trail.count, parented: !!a.root.parent }; });
      equal(disposed, { active: false, visible: false, count: 0, parented: false }, 'Disposed guide retains no active scene attachment');
      check(await frame.evaluate(() => { const g = window.__game; g.lookBeat = null; store.set({ panel: null, campaignBanner: null }); return g.inquisitorReplay(0); }), 'Completed quest can start a native recording replay');
      s = await eventually(read, x => x.replay && x.cinematic, 'Native replay begins'); hidden(s, 'Recorded cinematic replay never displays navigation');
      await frame.evaluate(() => { window.__p50RetiredGuide = window.__game.inquisitorWorld.guide; window.__game.inquisitorPause(); });
      s = await read(); hidden(s, 'Pause removes the replay guide');
      const pausedGuide = await frame.evaluate(() => { const a = window.__p50RetiredGuide; return { active: a.active, visible: a.root.visible, count: a.trail.count }; });
      equal(pausedGuide, { active: false, visible: false, count: 0 }, 'Pause explicitly hides and empties retained guide meshes');
      metrics.stages.push({ stage: 5, finalSceneHidden: true, completedDisposed: true, replayHidden: true, pauseHidden: true }); log('stage-5');
    }, { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  } finally {
    metrics.finished = new Date().toISOString(); metrics.checks = report.checks;
    metrics.status = report.cases.length > 0 && report.cases.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL';
    metrics.cases = report.cases;
    fs.writeFileSync(path.join(output, 'grand-inquisitor-guidance.json'), JSON.stringify(metrics, null, 2));
    await browser?.close();
  }
  if (metrics.status !== 'PASS') process.exitCode = 1;
  process.stdout.write('GUIDANCE ' + metrics.status + ' ' + report.checks + ' checks\n');
}

new Function('require', '__dirname', '__filename', harnessSource.slice(0, mainBoundary) + '\nreturn (' + runGuidanceTests.toString() + ')();')
  (require, __dirname, __filename).catch(error => { console.error(error.stack || error); process.exitCode = 1; });

'use strict';

// Real-host continuation of the fresh-player integration case. Only player
// fixture placement and ordinary input APIs are used. The witness, wardens,
// health, clocks, quest flags and cinematic callbacks advance in the live game.
const fs = require('node:fs');
const path = require('node:path');

async function runTrialSequence({ page, frame, check, equal, eventually, snapshot, putByTarget, key, nap, finishScene, output }) {
  const metrics = { started: new Date().toISOString(), realGameplay: true, escort: [], clocks: [], boss: [], screenshots: [], events: [] };
  const log = (event, detail = {}) => {
    metrics.events.push({ at: new Date().toISOString(), event, ...detail });
    process.stdout.write('TRIAL ' + event + ' ' + JSON.stringify(detail) + '\n');
  };
  const read = () => frame.evaluate(() => {
    const g = window.__game, r = g.inquisitorRuntime, q = window.__grandInquisitorQuest.serialize(g);
    return {
      q, inside: !!g.inquisitorInside, cinematic: !!r?.presentation.cinematic, clip: r?.clip ?? null,
      clock: r?.clock ?? 0, integrity: r?.integrity ?? null, damageGrace: r?.damageGrace ?? 0,
      stageTime: r?.stageTime ?? 0, message: r?.message || '', player: g.playerPos.toArray(),
      witness: r?.witness.toArray() || null, witnessDistance: r ? Math.hypot(g.playerPos.x - r.witness.x, g.playerPos.z - r.witness.z) : null,
      relaySpawned: r?.relaySpawned ?? -1, purgeHP: r?.purgeHP ?? null, escortArrived: !!r?.escortArrived,
      guards: r ? r.fx.guards.map(x => ({ hp: x.hp, visible: x.mesh.visible, pos: x.mesh.position.toArray() })) : [],
      bossExposed: r?.bossExposed ?? 0, bossStation: r?.bossStation ?? -1, doorOpen: r?.doorOpen ?? 0,
      dance: g.player.userData.externalRig?.danceMode || null,
      activeClip: g.player.userData.externalRig?.activeDance?.getClip?.()?.name || null,
      pendingHit: r?.pendingHit ? { ...r.pendingHit } : null,
      moveTarget: g.moveTarget ? { x: g.moveTarget.x, z: g.moveTarget.z } : null,
      renderedFrame: g.renderer?.info?.render?.frame || 0,
    };
  });
  const shot = async name => {
    const file = path.join(output, name + '.png');
    await page.screenshot({ path: file, fullPage: false });
    metrics.screenshots.push(file); return file;
  };
  const stop = async () => {
    await key(frame, 'q', 'keyup');
    await frame.evaluate(() => window.__game.mariaDanceStop());
  };
  const startAttack = async (loop = false) => frame.evaluate(loop => window.__game.inquisitorAttack(loop), loop);
  const phase = (time, index) => ((time + index * .8) % 5.6 + 5.6) % 5.6;
  const targetDistance = (stage, index) => frame.evaluate((stage, index) => {
    const g = window.__game, p = g.inquisitorWorld?.target(stage, index);
    return p ? Math.hypot(g.playerPos.x - p.x, g.playerPos.z - p.z) : Infinity;
  }, stage, index);
  const waitRender = async count => {
    const first = (await read()).renderedFrame;
    return eventually(read, s => s.renderedFrame > first + count, 'Native frames advance after trial input', 18000);
  };

  // This calls the real, quest-aware click-to-move handler, then lets native
  // movement cover the distance. It is used for the timed boss approaches.
  const walkToTarget = async (stage, index, offset = 2) => {
    const result = await frame.evaluate((stage, index, offset) => {
      const g = window.__game, worldPoint = g.inquisitorWorld.target(stage, index);
      worldPoint.y = g.groundH(worldPoint.x, worldPoint.z); worldPoint.z += offset;
      const projected = worldPoint.clone().project(g.camera), rect = g.canvas.getBoundingClientRect();
      g.clickToMove({ clientX: rect.left + (projected.x + 1) * rect.width / 2, clientY: rect.top + (1 - projected.y) * rect.height / 2 });
      return { requested: { x: worldPoint.x, z: worldPoint.z }, actual: g.moveTarget ? { x: g.moveTarget.x, z: g.moveTarget.z } : null };
    }, stage, index, offset);
    check(!!result.actual && Math.abs(result.requested.x - result.actual.x) < .03 && Math.abs(result.requested.z - result.actual.z) < .03,
      'Native click-to-move resolves the actual elevated quest floor', result);
    return result;
  };

  try {
    let s = await read();
    equal(s.q.stage, 2, 'Full trial sequence resumes from the real Erasure checkpoint');
    check(s.inside && s.q.relay === 0, 'Escort begins with three uncleared real relays', s);
    if (s.cinematic) await finishScene(frame);
    await stop();
    metrics.animationDurations = await frame.evaluate(() => window.__game.player.userData.externalRig.danceActions.map(a => ({ name: a.getClip().name, duration: a.getClip().duration })));
    await shot('trial-02-erasure-start');

    // Escort the actual moving witness. Player placement is a fixture only when
    // it would otherwise get more than eight metres ahead; all attacks, enemy
    // pursuit, damage, witness travel and checkpoint triggers remain native.
    for (let relay = 0; relay < 3; relay++) {
      const entry = { relay, started: Date.now(), attackStarts: 0, wardensSeen: 0, wardenHitsObserved: 0, purgeHitsObserved: 0,
        witnessTravel: 0, playerRepositions: 0, resets: 0, minIntegrity: 3, attackClips: [], cleared: false };
      metrics.escort.push(entry); log('escort-begin', { relay });
      let previous = await read(), guardShot = false, latestW = previous.witness, observedClips = new Set();
      const deadline = Date.now() + 240000;
      while (Date.now() < deadline) {
        s = await read();
        if (s.q.stage > 2 || s.q.relay > relay) { entry.cleared = true; break; }
        check(s.inside && s.q.stage === 2 && s.q.relay === relay, 'Escort stays at its current native checkpoint', s);
        entry.minIntegrity = Math.min(entry.minIntegrity, s.integrity);
        if (s.activeClip) observedClips.add(s.activeClip);
        if (latestW && s.witness) entry.witnessTravel += Math.hypot(latestW[0] - s.witness[0], latestW[2] - s.witness[2]);
        latestW = s.witness;
        if (s.clock + .08 < previous.clock) {
          entry.resets++; log('escort-checkpoint-restored', { relay, resets: entry.resets, integrity: s.integrity });
          if (entry.resets > 1) throw new Error('Escort balance failure: relay ' + (relay + 1) + ' repeatedly resets while native attack is active and player stays near witness; state=' + JSON.stringify(s));
        }
        if (s.relaySpawned === relay) {
          entry.wardensSeen = Math.max(entry.wardensSeen, s.guards.filter(g => g.visible || g.hp > 0).length);
          if (previous.relaySpawned === relay) {
            for (let i = 0; i < s.guards.length; i++) entry.wardenHitsObserved += Math.max(0, (previous.guards[i]?.hp || 0) - s.guards[i].hp);
            entry.purgeHitsObserved += Math.max(0, (previous.purgeHP || 0) - s.purgeHP);
          }
          if (!guardShot && s.guards.some(g => g.hp > 0)) { await shot('trial-02-erasure-relay-' + (relay + 1)); guardShot = true; }
        }
        // Never move or teleport the witness. Follow its current live position.
        if (s.witnessDistance > 8.0) {
          await stop();
          await frame.evaluate(() => {
            const g = window.__game, r = g.inquisitorRuntime;
            if (!r || window.__grandInquisitorQuest.read(g).stage !== 2) return;
            const p = r.witness.clone(); p.y = g.groundH(p.x, p.z); p.z += 3;
            g.keys = {}; g.touchMoveVec = null; g.moveTarget = null; g.playerVel.set(0, 0, 0);
            g.playerPos.copy(p); g.player.position.copy(p); g.grounded = true;
          });
          entry.playerRepositions++; await waitRender(2); s = await read();
        }
        if (!s.dance && s.relaySpawned === relay && (s.guards.some(g => g.hp > 0) || s.purgeHP > 0)) {
          if (await startAttack(true)) entry.attackStarts++;
        }
        previous = s;
        await nap(110);
      }
      entry.attackClips = [...observedClips]; entry.durationMs = Date.now() - entry.started; delete entry.started;
      check(entry.cleared, 'Native witness escort, wardens and purge clear relay ' + (relay + 1), { entry, last: s });
      check(entry.wardensSeen >= (relay === 0 ? 2 : 3), 'Real wardens spawned for relay ' + (relay + 1), entry);
      check(entry.wardenHitsObserved > 0 && entry.attackStarts > 0, 'Real attack animations damage wardens before relay clears', entry);
      check(entry.witnessTravel > 4, 'Witness reaches relay through actual per-frame escort motion', entry);
      await stop(); log('escort-cleared', entry);
    }
    s = await eventually(read, s => s.q.stage === 3, 'All real escorts unlock the clock chamber', 20000);
    equal(s.q.relay, 3, 'All three escort records persist');
    equal(s.clip, 3, 'Escort completion opens the clock cinematic');
    await shot('trial-03-clock-intro'); await finishScene(frame);

    // A deliberately mistimed attack must leave the first lock intact. The test
    // waits for an actual charged interval; it never sets the clock itself.
    await putByTarget(frame, 3, 0, 2); await stop();
    await eventually(read, s => s.q.stage === 3 && phase(s.clock, 0) > .08 && phase(s.clock, 0) < 1.0, 'Natural charged clock window', 45000);
    check(await startAttack(), 'Native attack starts during charged interval');
    s = await eventually(read, s => /ring is still charged/i.test(s.message), 'Charged clock rejects actual impact', 12000);
    check(!s.q.locks[0], 'Mistimed attack cannot complete the charged clock');
    await shot('trial-03-clock-charged'); await stop();

    for (let index = 0; index < 3; index++) {
      await putByTarget(frame, 3, index, 2); await stop();
      s = await eventually(read, s => s.q.stage === 3 && phase(s.clock, index) >= 2.82 && phase(s.clock, index) < 4.35, 'Natural gold interval for clock ' + (index + 1), 45000);
      const beforeClock = s.clock;
      check(await startAttack(), 'Native attack starts at gold clock ' + (index + 1));
      s = await eventually(read, s => s.q.locks[index] || s.q.stage > 3, 'Real impact arrests clock ' + (index + 1), 15000);
      check(s.q.locks[index], 'Clock ' + (index + 1) + ' remains arrested in the native checkpoint');
      metrics.clocks.push({ index, attackClock: beforeClock, completedClock: s.clock, integrity: s.integrity });
      if (index < 2) await shot('trial-03-clock-' + (index + 1) + '-locked');
      await stop();
    }
    s = await eventually(read, s => s.q.stage === 4, 'All three natural clock locks unlock the Tribunal', 20000);
    equal(s.q.locks, [true, true, true], 'All real clock locks persist'); equal(s.clip, 4, 'Tribunal begins with its authored introduction');
    await shot('trial-04-tribunal-intro'); await finishScene(frame);

    // The first wrong station is intentionally attempted. A valid station then
    // opens and naturally times out before being opened again, proving a missed
    // damage window can be recovered without a save reset or progress mutation.
    await putByTarget(frame, 4, 1, 2); await nap(280);
    check(!(await frame.evaluate(() => window.__game.interact())), 'Incorrect Tribunal station refuses to expose the core');
    s = await read(); equal(s.q.bossPhase, 0, 'Incorrect station cannot advance the boss'); equal(s.bossExposed, 0, 'Incorrect station leaves the core shielded');
    await putByTarget(frame, 4, 0, 2); await nap(280);
    check(await frame.evaluate(() => window.__game.interact()), 'Correct Tribunal station opens a real timed exposure');
    s = await read(); check(s.bossExposed > 10 && s.bossExposed <= 12, 'Core exposure starts with the authored twelve-second window', s);
    await waitRender(2); await shot('trial-04-core-exposed');
    s = await eventually(read, s => s.q.stage === 4 && s.bossExposed === 0, 'Unused exposure expires on the real clock', 40000);
    equal(s.q.bossPhase, 0, 'Letting exposure expire does not damage the crown');
    log('boss-expired-exposure-recovered');

    for (let phaseIndex = 0; phaseIndex < 3; phaseIndex++) {
      await stop(); await putByTarget(frame, 4, phaseIndex, phaseIndex === 2 ? 3 : 2); await nap(280);
      const before = await read(); equal(before.q.bossPhase, phaseIndex, 'Boss is at expected intact band before phase ' + (phaseIndex + 1));
      check(await frame.evaluate(() => window.__game.interact()), 'Correct station exposes boss band ' + (phaseIndex + 1));
      const exposedAt = await read();
      // The third station's legitimate interaction circle already overlaps the
      // fourteen-metre core range. Do not project an offscreen point behind the
      // chase camera; no approach is needed from that position.
      let moved = false;
      if (await targetDistance(4, 3) > 13.6) {
        await walkToTarget(4, 3, 2); moved = true;
        await eventually(async () => ({ state: await read(), distance: await targetDistance(4, 3) }), value => value.state.bossExposed > 0 && value.distance <= 12,
          'Native movement reaches boss attack range during exposure ' + (phaseIndex + 1), 25000);
      }
      check(await startAttack(), 'Real attack animation starts in exposed-core range');
      s = await eventually(read, s => s.q.bossPhase === phaseIndex + 1, 'Real core strike breaks band ' + (phaseIndex + 1), 15000);
      metrics.boss.push({ phase: phaseIndex + 1, startExposure: exposedAt.bossExposed, integrityBefore: before.integrity, integrityAfter: s.integrity,
        movement: moved ? 'native clickToMove' : 'station interaction circle already within core range', attack: 'native rig hit callback' });
      log('boss-band-broken', { phase: phaseIndex + 1, integrity: s.integrity });
      if (phaseIndex < 2) { await stop(); await shot('trial-04-boss-band-' + (phaseIndex + 1) + '-broken'); }
    }
    s = await read(); equal(s.clip, 5, 'Third real boss strike starts the finisher');
    // Allow the finisher to complete naturally, including the synchronized core
    // destruction at 2.8 seconds. This tests the real duration callback as well.
    await eventually(read, s => s.clip === 5 && s.clock >= 3.25, 'Finisher reaches its physical crown impact', 20000);
    await shot('trial-04-final-verdict-impact');
    s = await eventually(read, s => s.q.stage === 5 && !s.cinematic, 'Natural finisher callback unlocks the final door', 60000);
    equal(s.q.bossPhase, 3, 'Three destroyed crown bands remain saved'); check(!s.q.complete, 'Reaching the door alone does not award completion');
    await shot('trial-05-door-closed');

    await putByTarget(frame, 5, 0, 2); await nap(280);
    check(await frame.evaluate(() => window.__game.interact()), 'Actual final-door interaction begins the reveal');
    s = await read(); equal(s.clip, 6, 'Final door owns the seventh cinematic');
    const doorStartClock = s.clock;
    await eventually(read, s => s.clip === 6 && s.doorOpen > .98 && s.clock - doorStartClock >= 15.0, 'Door opens fully during its natural 414 reveal', 55000);
    await shot('trial-05-414-revelation');
    s = await eventually(read, s => s.q.complete && !s.inside, 'Natural final reveal completes quest and returns to city', 65000);
    equal(s.q.seals, [true, true, true], 'Completion retains actual seal accomplishments'); equal(s.q.turns, [3, 1, 2], 'Completion retains actual archive solution');
    equal(s.q.relay, 3, 'Completion retains all actual escorts'); equal(s.q.locks, [true, true, true], 'Completion retains all actual clock locks');
    equal(s.q.bossPhase, 3, 'Completion retains all actual crown strikes'); check(s.q.doorOpened, 'Completion retains the final physical door interaction');
    equal(s.q.seen.slice().sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6], 'Full playable path records all seven scenes');
    check(await frame.evaluate(() => JSON.parse(localStorage.getItem(frSaveKey())).quests.grandInquisitor.complete === true), 'Naturally completed quest is in the actual native save');
    await shot('trial-06-return-to-atropa');
    metrics.status = 'PASS'; log('complete', { escortResets: metrics.escort.reduce((sum, e) => sum + e.resets, 0), bossPhases: metrics.boss.length });
    return metrics;
  } catch (error) {
    metrics.status = 'FAIL'; metrics.error = String(error.stack || error);
    try { metrics.lastState = await read(); await shot('trial-sequence-failure'); } catch (_) {}
    throw error;
  } finally {
    metrics.finished = new Date().toISOString();
    fs.writeFileSync(path.join(output, 'grand-inquisitor-trial-sequence.json'), JSON.stringify(metrics, null, 2));
  }
}

module.exports = runTrialSequence;
module.exports.runTrialSequence = runTrialSequence;

// Focused regression for the final chase-camera framing change. The two stage
// setups use the public checkpoint hydration path in this isolated test account.
// Within the Tribunal, exposure, movement, attack impacts and saved phases all
// advance through native gameplay; neither the clock nor boss health is changed.
async function runCameraSmoke({ page, frame, check, equal, eventually, snapshot, putByTarget, key, nap, finishScene, output }) {
  const metrics = { started: new Date().toISOString(), checkpointFixtures: [1, 4], boss: [], screenshots: [] };
  const read = () => frame.evaluate(() => {
    const g = window.__game, r = g.inquisitorRuntime, q = window.__grandInquisitorQuest.serialize(g);
    const core = q.stage === 4 ? g.inquisitorWorld?.target(4, 3) : null;
    return { q, inside: !!g.inquisitorInside, cinematic: !!r?.presentation.cinematic, clock: r?.clock ?? 0,
      frame: g.renderer?.info?.render?.frame || 0, bossExposed: r?.bossExposed ?? 0, integrity: r?.integrity ?? null,
      player: g.playerPos.toArray(), camera: g.camera.position.toArray(),
      coreDistance: core ? Math.hypot(g.playerPos.x - core.x, g.playerPos.z - core.z) : null };
  });
  const shot = async name => {
    const file = path.join(output, name + '.png');
    await page.screenshot({ path: file, fullPage: false }); metrics.screenshots.push(file);
  };
  const stop = async () => {
    await key(frame, 'q', 'keyup'); await frame.evaluate(() => window.__game.mariaDanceStop());
  };
  const settle = async () => {
    const first = await read();
    return eventually(read, s => s.frame > first.frame + 30 && s.clock > first.clock + .75,
      'Native gameplay camera settles over real render frames', 25000);
  };
  const checkpoint = async stage => {
    const result = await frame.evaluate(stage => {
      const g = window.__game, api = window.__grandInquisitorQuest;
      if (g.inquisitorInside) g.inquisitorPause();
      api.hydrate(g, { ...api.serialize(g), started: true, complete: false, stage,
        seals: [true, true, true], turns: stage === 1 ? [0, 0, 0] : [3, 1, 2],
        relay: stage === 1 ? 0 : 3, locks: stage === 1 ? [false, false, false] : [true, true, true],
        bossPhase: 0, doorOpened: false, seen: stage === 1 ? [0] : [0, 1, 2, 3, 4], pendingClip: null });
      g._inquisitorPaused = true; store.set({ panel: null, campaignBanner: null }); g.lookBeat = null;
      return g.inquisitorStart();
    }, stage);
    check(result, 'Valid camera-smoke checkpoint resumes through native start', { stage });
    const state = await eventually(read, s => s.inside && !s.cinematic && s.q.stage === stage,
      'Camera smoke enters expected playable chamber ' + stage, 20000);
    await settle(); return state;
  };

  try {
    const initial = await snapshot(frame);
    check(initial.inside && initial.q.stage === 0, 'Camera smoke starts from the real exclusive Grand introduction');
    await checkpoint(1);
    metrics.archive = await frame.evaluate(() => {
      const g = window.__game, room = g.inquisitorWorld.rooms[1], visual = room.visual;
      const project = p => {
        const ndc = p.clone().project(g.camera);
        return { world: p.toArray(), ndc: ndc.toArray(), inFrame: Math.abs(ndc.x) < .98 && Math.abs(ndc.y) < .98 && ndc.z > -1 && ndc.z < 1 };
      };
      const landmarks = {};
      visual.discs.forEach((disc, i) => {
        const p = disc.root.getWorldPosition(g.playerPos.clone());
        landmarks[i === 0 ? 'ethereumCenter' : 'pulsechainCenter'] = project(p);
        landmarks[i === 0 ? 'ethereumTop' : 'pulsechainTop'] = project(p.clone().add({ x: 0, y: 10.1, z: 0 }));
      });
      landmarks.pdaiRecord = project(visual.pdaiRecord.getWorldPosition(g.playerPos.clone()));
      landmarks.playerFeet = project(g.playerPos);
      landmarks.playerHead = project(g.playerPos.clone().add({ x: 0, y: 3.2, z: 0 }));
      return { player: g.playerPos.toArray(), camera: g.camera.position.toArray(), fov: g.camera.fov, landmarks };
    });
    await shot('camera-01-archive-gameplay');
    for (const name of ['ethereumCenter', 'pulsechainCenter', 'pdaiRecord', 'playerFeet', 'playerHead']) {
      check(metrics.archive.landmarks[name].inFrame, 'Archive gameplay camera retains ' + name, metrics.archive.landmarks[name]);
    }
    // Disc-top coordinates are retained for the visual review rather than being
    // a brittle assertion that every enormous architectural feature must fit.
    process.stdout.write('CAMERA archive ' + JSON.stringify(metrics.archive) + '\n');

    await checkpoint(4); await shot('camera-04-tribunal-gameplay');
    for (let index = 0; index < 2; index++) {
      await stop(); await putByTarget(frame, 4, index, 2); await settle();
      const before = await read(); equal(before.q.bossPhase, index, 'Camera smoke reaches expected real crown phase');
      check(await frame.evaluate(() => window.__game.interact()), 'Station ' + (index + 1) + ' opens real core exposure with new camera');
      const approach = await frame.evaluate(() => {
        const g = window.__game, core = g.inquisitorWorld.target(4, 3);
        const destination = g.playerPos.clone().lerp(core, .62);
        destination.y = g.groundH(destination.x, destination.z);
        const projected = destination.clone().project(g.camera), rect = g.canvas.getBoundingClientRect();
        const visible = Math.abs(projected.x) < .96 && Math.abs(projected.y) < .96 && projected.z > -1 && projected.z < 1;
        const result = { from: g.playerPos.toArray(), requested: destination.toArray(), ndc: projected.toArray(), visible,
          client: { x: rect.left + (projected.x + 1) * rect.width / 2, y: rect.top + (1 - projected.y) * rect.height / 2 },
          exposure: g.inquisitorRuntime.bossExposed, actual: null };
        // A projected point outside the viewport is not a real player click.
        if (!visible) return result;
        g.clickToMove({ clientX: result.client.x, clientY: result.client.y });
        result.actual = g.moveTarget ? { x: g.moveTarget.x, z: g.moveTarget.z } : null;
        return result;
      });
      check(approach.visible, 'Core approach projects onto visible playable floor from station ' + (index + 1), approach);
      check(approach.actual && Math.abs(approach.actual.x - approach.requested[0]) < .03 && Math.abs(approach.actual.z - approach.requested[2]) < .03,
        'Visible click resolves elevated quest floor with new camera', approach);
      const reached = await eventually(read, s => s.bossExposed > 0 && s.coreDistance <= 12,
        'Actual walking reaches core range during the timed exposure', 20000);
      check(Math.hypot(reached.player[0] - before.player[0], reached.player[2] - before.player[2]) > 4,
        'Native movement covers the station-to-core approach');
      check(await frame.evaluate(() => window.__game.inquisitorAttack(false)), 'Native attack begins after camera-smoke approach');
      const struck = await eventually(read, s => s.q.bossPhase === index + 1,
        'Real rig impact breaks crown band after visible camera-smoke click', 15000);
      metrics.boss.push({ phase: index + 1, approach, reachedDistance: reached.coreDistance,
        exposureAtAttack: reached.bossExposed, integrity: struck.integrity });
      await stop(); await shot('camera-04-station-' + (index + 1) + '-core-strike');
    }
    const done = await read(); equal(done.q.bossPhase, 2, 'Two actual impacts persist after final camera regression');
    metrics.status = 'PASS'; process.stdout.write('CAMERA complete ' + JSON.stringify({ phases: metrics.boss.length }) + '\n');
    return metrics;
  } catch (error) {
    metrics.status = 'FAIL'; metrics.error = String(error.stack || error);
    try { metrics.lastState = await read(); await shot('camera-smoke-failure'); } catch (_) {}
    throw error;
  } finally {
    metrics.finished = new Date().toISOString();
    fs.writeFileSync(path.join(output, 'grand-inquisitor-camera-smoke.json'), JSON.stringify(metrics, null, 2));
  }
}

module.exports.runCameraSmoke = runCameraSmoke;

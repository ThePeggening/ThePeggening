// GRAND INQUISITOR CICERO — THE UNWRITTEN VERDICT · P50
// Original fictional character story. Progress is part of the active world save.
(() => {
  'use strict';
  if (Game.prototype.inquisitorRevision) return;
  Game.prototype.inquisitorRevision = 1;

  const ORIGIN = { x: 1600, y: 24, z: 1600 };
  const TITLES = ['The Summons', 'The Divided Record', 'The Erasure', 'The Stolen Hour', 'The Tribunal', 'The Door'];
  const TARGET_TURNS = [3, 1, 2];
  // Work backwards through the linked stations. Merely pointing at the first
  // unmatched dial can send the player around a loop because each turns two.
  const LEDGER_GUIDE = (() => {
    const next = new Map([[TARGET_TURNS.join(','), null]]), queue = [TARGET_TURNS];
    for (let cursor = 0; cursor < queue.length; cursor++) {
      for (let station = 0; station < 3; station++) {
        const previous = queue[cursor].slice();
        for (const i of [station, (station + 1) % 3]) previous[i] = (previous[i] + 3) % 4;
        const key = previous.join(',');
        if (!next.has(key)) { next.set(key, station); queue.push(previous); }
      }
    }
    return next;
  })();
  // Long source clips include several motions. Give the sustained sequences
  // several impact beats so a six-second boxing clip remains active in combat.
  const ATTACK_IMPACTS = {
    Sweeping_Kick: [.51, .61], Boxing_Practice: [.09, .24, .39, .54, .69, .84],
    Right_Hand_Sword_Slash: [.30], Sword_Judgment: [.13, .45, .76],
    Backflip_Sweep_Kick: [.14, .40, .72], Backflip_Jump: [], Backflip: [],
  };
  const CLIP_STAGE = [0, 1, 2, 3, 4, 4, 5];
  const INTRO_CLIP = { 0: 0, 2: 2, 3: 3, 4: 4 };
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const int = (v, min, max, fallback = min) => Number.isFinite(Number(v)) ? clamp(Math.floor(Number(v)), min, max) : fallback;
  const bools = v => [0, 1, 2].map(i => v?.[i] === true);
  const selected = () => !CW && !FR && loadSkinId() === 'grand-inquisitor';
  const fresh = () => ({ v: 1, started: false, complete: false, stage: 0, seals: [false, false, false], turns: [0, 0, 0], aligned: [false, false, false], relay: 0, locks: [false, false, false], bossPhase: 0, doorOpened: false, seen: [], pendingClip: null, elapsed: 0 });

  function normalize(input) {
    const p = input?.v === 1 ? input : {}, q = fresh();
    q.started = p.started === true;
    q.complete = p.complete === true;
    q.stage = int(p.stage, 0, 5);
    q.seals = bools(p.seals);
    q.turns = [0, 1, 2].map(i => int(p.turns?.[i], 0, 3));
    q.aligned = q.turns.map((v, i) => v === TARGET_TURNS[i]);
    q.relay = int(p.relay, 0, 3);
    q.locks = bools(p.locks);
    q.bossPhase = int(p.bossPhase, 0, 3);
    q.doorOpened = p.doorOpened === true;
    q.seen = Array.isArray(p.seen) ? [...new Set(p.seen.filter(v => Number.isInteger(v) && v >= 0 && v <= 6))] : [];
    q.pendingClip = Number.isInteger(p.pendingClip) && p.pendingClip >= 0 && p.pendingClip <= 6 ? p.pendingClip : null;
    q.elapsed = Math.max(0, Number(p.elapsed) || 0);
    if (q.stage > 0) q.seals = [true, true, true];
    if (q.stage > 1) { q.turns = TARGET_TURNS.slice(); q.aligned = [true, true, true]; }
    if (q.stage > 2) q.relay = 3;
    if (q.stage > 3) q.locks = [true, true, true];
    if (q.stage > 4) q.bossPhase = 3;
    if (q.complete) { q.started = true; q.stage = 5; q.doorOpened = true; q.pendingClip = null; q.bossPhase = 3; q.seals = q.aligned = q.locks = [true, true, true]; q.turns = TARGET_TURNS.slice(); q.relay = 3; }
    if (!q.started && !q.complete) return fresh();
    if (q.pendingClip !== null && CLIP_STAGE[q.pendingClip] !== q.stage) q.pendingClip = null;
    return q;
  }

  function read(game = window.__game) {
    if (!game) return fresh();
    if (!game.inquisitorState) game.inquisitorState = fresh();
    return game.inquisitorState;
  }
  function serialize(game = window.__game) { return normalize(read(game)); }
  function hydrate(game, state) {
    if (game.inquisitorInside) leave(game, { save: false, quiet: true });
    game.inquisitorState = normalize(state);
    game._inquisitorPaused = false;
    game._inquisitorModelUnavailable = false;
    return game.inquisitorState;
  }
  function writable(game) {
    if (!game || game.disposed || window.__atropaPersistencePausedR39) return false;
    try {
      return !game._checkpointGeneration || localStorage.getItem(FR_CHECKPOINT_GENERATION_KEY) === game._checkpointGeneration;
    } catch (_) { return false; }
  }
  function checkpoint(game) {
    const r = game.inquisitorRuntime;
    if (r?.replay || !writable(game)) return false;
    const q = read(game);
    if (r) { q.elapsed += r.unsavedTime; r.unsavedTime = 0; }
    const ok = game.saveFR?.() === true;
    if (r) r.saved = ok;
    return ok;
  }
  function graduated(game) {
    if (!game?._inquisitorTutorialDecided || game._startingFR || game.tut || store.get().tut) return false;
    const p = loadPrestigeSave();
    return !!(p?.trialDone || p?.trialOutcome === 'completed' || p?.trialOutcome === 'skipped' || campaignLegacyVeteranHasProgress() || campaignVeteranEvidence(store.get()));
  }
  function pending(game = window.__game) {
    return selected() && !!game && !game.disposed && !read(game).complete && !game._inquisitorPaused && !game._inquisitorModelUnavailable;
  }
  function safeCity(game, allowMenu = false) {
    const s = store.get();
    return !!game && !game.disposed && !document.hidden && selected() && graduated(game) && s.phase === 'playing'
      && !game.inst && !game.dysActive && !game.tut && !s.tut && !game.treasuryInside
      && !game.maria414Inside && !game.sommi414Inside && !game.sommiMirror414Inside
      && !game.pylon && !game.calib && !game.eyeLens && !game.lookBeat && !game.dialBeat
      && !s.hudEdit && !s.chatOpen && !game.tradeModeToken
      && (!s.panel || (allowMenu && s.panel.type === 'inquisitor-recordings'))
      && !storyCutsceneInputLocked({ ...s, campaignBanner: null });
  }
  function ready(game = window.__game) {
    const rig = game?.player?.userData?.externalRig;
    return safeCity(game) && game.player.userData.hostedLibertyPlayer === 'grand-inquisitor' && !!rig?.ready && !rig.failed;
  }
  function clearInput(game) {
    game.keys = {}; game.touchMoveVec = null; game.moveTarget = null; game.mouseDrag = null;
    game.playerVel?.set(0, 0, 0); game._storyCutsceneFrozenPos = null;
    game.player?.userData?.externalRig?.stopDance?.(0.08);
    if (game.inquisitorRuntime) game.inquisitorRuntime.pendingHit = null;
  }
  function teleport(game, pos) {
    clearInput(game); game.playerPos.copy(pos); game.player.position.copy(pos); game.grounded = true;
    game._externalWalkPrev?.copy(pos);
    game.ohFollow?.set(pos.x, pos.z); game.playerYaw = Math.PI; game.player.rotation.y = Math.PI;
    game.camYaw = 0; game.camPitch = 0.24;
  }
  function state(game) { return game.inquisitorRuntime?.replayState || read(game); }
  function roomFront(stage) { return stage === 0 ? -28 : stage === 5 ? -23 : -32; }
  function target(game, index, stage = state(game).stage) { return game.inquisitorWorld?.target(stage, index); }
  function distance(game, pos) { return Math.hypot(game.playerPos.x - pos.x, game.playerPos.z - pos.z); }
  function toast(game, text, seconds = 4) {
    const r = game.inquisitorRuntime; if (r) { r.message = text; r.messageTime = seconds; }
  }

  function makeEffects(game) {
    const root = new THREE.Group(); root.name = 'inquisitor-combat-effects';
    game.scene.add(root);
    const resources = [], own = o => (resources.push(o), o);
    const ink = own(new THREE.MeshStandardMaterial({ color: '#151426', roughness: .88, metalness: .25 }));
    const metal = own(new THREE.MeshStandardMaterial({ color: '#947247', roughness: .36, metalness: .65, emissive: '#472309', emissiveIntensity: .35 }));
    const ember = own(new THREE.MeshBasicMaterial({ color: '#ff5b64', transparent: true, opacity: .9 }));
    const robeGeo = own(new THREE.ConeGeometry(.85, 2.35, 7));
    const maskGeo = own(new THREE.OctahedronGeometry(.38, 0));
    const bandGeo = own(new THREE.TorusGeometry(.42, .055, 5, 16));
    const handGeo = own(new THREE.BoxGeometry(.15, 1.15, .18));
    const guards = [];
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group(); g.name = 'inquisitor-null-warden-' + i;
      const robe = new THREE.Mesh(robeGeo, ink); robe.position.y = 1.15; g.add(robe);
      const face = new THREE.Mesh(maskGeo, ember); face.position.set(0, 2.3, .1); face.scale.set(.7, 1, .35); g.add(face);
      const halo = new THREE.Mesh(bandGeo, metal); halo.position.set(0, 2.3, .15); g.add(halo);
      for (const sign of [-1, 1]) { const arm = new THREE.Mesh(handGeo, metal); arm.position.set(sign * .7, 1.6, .05); arm.rotation.z = sign * .27; g.add(arm); }
      root.add(g); g.visible = false; guards.push({ mesh: g, hp: 0, clock: i * .6, strike: 1.8 + i * .3 });
    }
    const bolts = [];
    for (let i = 0; i < 7; i++) {
      const geo = own(new THREE.BufferGeometry()); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const mat = own(new THREE.LineBasicMaterial({ color: '#ffe1a0', transparent: true, opacity: 1, depthTest: true }));
      const mesh = new THREE.Line(geo, mat); mesh.frustumCulled = false; mesh.visible = false; root.add(mesh); bolts.push({ mesh, time: 0 });
    }
    const particleGeo = own(new THREE.BufferGeometry());
    const coords = new Float32Array(96 * 3), velocities = new Float32Array(96 * 3), life = new Float32Array(96);
    particleGeo.setAttribute('position', new THREE.BufferAttribute(coords, 3));
    const particleMat = own(new THREE.PointsMaterial({ color: '#ffce79', size: .12, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending }));
    const particles = new THREE.Points(particleGeo, particleMat); particles.frustumCulled = false; root.add(particles);
    let cursor = 0, boltCursor = 0;
    function burst(pos, count = 20) {
      for (let n = 0; n < count; n++) { const i = cursor++ % 96, j = i * 3; coords[j] = pos.x; coords[j + 1] = pos.y; coords[j + 2] = pos.z; velocities[j] = (Math.random() - .5) * 7; velocities[j + 1] = 1 + Math.random() * 4; velocities[j + 2] = (Math.random() - .5) * 7; life[i] = .35 + Math.random() * .65; }
    }
    function bolt(from, to) { const b = bolts[boltCursor++ % bolts.length], p = b.mesh.geometry.attributes.position; p.setXYZ(0, from.x, from.y, from.z); p.setXYZ(1, to.x, to.y, to.z); p.needsUpdate = true; b.time = .22; b.mesh.visible = true; burst(to); }
    function tick(dt) {
      for (const b of bolts) if (b.time > 0) { b.time -= dt; b.mesh.material.opacity = Math.max(0, b.time / .22); b.mesh.visible = b.time > 0; }
      let active = false;
      for (let i = 0; i < life.length; i++) { const j = i * 3; if (life[i] > 0) { active = true; life[i] -= dt; coords[j] += velocities[j] * dt; coords[j + 1] += velocities[j + 1] * dt; coords[j + 2] += velocities[j + 2] * dt; velocities[j + 1] -= dt * 6; } else { coords[j] = 0; coords[j + 1] = -10000; coords[j + 2] = 0; } }
      particleGeo.attributes.position.needsUpdate = true; particles.visible = active;
    }
    return { root, guards, burst, bolt, tick, hideGuards() { for (const g of guards) { g.mesh.visible = false; g.hp = 0; } }, dispose() { root.removeFromParent(); for (const r of resources) r.dispose(); } };
  }

  function hideHost(game) {
    const r = game.inquisitorRuntime, s = store.get();
    // Release the city's first-person ownership before taking a normal baseline.
    // Its next city tick can acquire that ownership again after the story returns.
    game.microWorldSuspendNow?.();
    r.snapshot = {
      pos: game.playerPos.clone(), yaw: game.playerYaw, camYaw: game.camYaw, camPitch: game.camPitch,
      fov: game.camera.fov, near: game.camera.near, cameraPos: game.camera.position.clone(), cameraQuat: game.camera.quaternion.clone(),
      layer: game.layer, viewMode: game.viewMode, viewBlend: game.viewBlend, viewTarget: game.viewBlendTarget,
      chaseZoom: game.chaseZoom, zoomMul: game.zoomMul, background: game.scene.background, fog: game.scene.fog,
      playerVisible: game.player.visible, campaignBanner: s.campaignBanner, lookBeat: game.lookBeat,
      uiHidden: s.uiHidden, questFocus: s.questFocus, playerView: s.viewMode,
      objects: game.scene.children.filter(o => o !== game.inquisitorWorld.root && o !== r.fx.root).map(o => [o, o.visible]),
      audio: [],
    };
    const ctx = game.sfx?.ctx;
    const duck = (gain, kind, id = null) => {
      if (!gain || !ctx || ctx.state === 'closed') return;
      const value = gain.value;
      r.snapshot.audio.push({ gain, value, kind, id });
      gain.cancelScheduledValues(ctx.currentTime);
      gain.setValueAtTime(value, ctx.currentTime);
      gain.linearRampToValueAtTime(0, ctx.currentTime + .15);
    };
    duck(game.music?.bus?.gain, 'music');
    game.sfx?.droneVoices?.forEach((voice, id) => duck(voice.g?.gain, 'drone', id));
    game.inquisitorInside = true;
    for (const [o] of r.snapshot.objects) if (o !== game.player && o !== game.camera) o.visible = false;
    game.player.visible = true; game.lookBeat = null; game.layer = 1;
    game.viewMode = 'chase'; game.viewBlend = 1; game.viewBlendTarget = 1; game.chaseZoom = 1.12;
    game.scene.background = new THREE.Color('#070a17'); game.scene.fog = new THREE.FogExp2('#0b101c', .0035);
    game.camera.fov = innerHeight > innerWidth ? 72 : 58; game.camera.updateProjectionMatrix();
    game.tutThreatGrace = Math.max(30, game.tutThreatGrace || 0);
    store.set({ inquisitorInside: true, inquisitorCineActive: false, campaignBanner: null, panel: null, chatOpen: false, questToast: null, prompt: '', questDir: null, questDist: null });
  }

  function buildRuntime(game, replay = false) {
    if (game.inquisitorRuntime) return game.inquisitorRuntime;
    const mobile = (navigator.maxTouchPoints || 0) > 0 || matchMedia('(pointer: coarse)').matches;
    game.inquisitorWorld = GrandInquisitorWorld.create({ THREE, origin: ORIGIN, quality: mobile ? 'mobile' : 'desktop' });
    game.inquisitorWorld.root.visible = false; game.scene.add(game.inquisitorWorld.root);
    const r = game.inquisitorRuntime = {
      replay, replayState: null, replayIds: [], replayIndex: 0, stage: 0, clock: 0, stageTime: 0,
      unsavedTime: 0, saved: true, integrity: 3, damageGrace: 0, cooldown: 0, pendingHit: null,
      message: '', messageTime: 0, lastHud: '', doorOpen: 0, witness: V(), escortArrived: false,
      relaySpawned: -1, purgeHP: 2, bossExposed: 0, bossStation: -1, stageFx: 0,
    };
    r.fx = makeEffects(game);
    r.presentation = GrandInquisitorPresentation.create(game, {
      attackStart: loop => attack(game, loop), attackStop: () => stopAttack(game),
      interact: () => interact(game), pause: () => leave(game), skip: () => finishClip(game),
    });
    hideHost(game); armRig(game); return r;
  }
  function setStage(game, stage, resetPosition = true) {
    const r = game.inquisitorRuntime, q = state(game); if (!r) return;
    r.stage = stage; q.stage = stage; r.clock = 0; r.stageTime = 0; r.integrity = 3; r.damageGrace = 1.5;
    r.purgeHP = 2; r.relaySpawned = -1; r.escortArrived = false; r.bossExposed = 0; r.bossStation = -1;
    r.doorOpen = 0; r.fx.hideGuards(); game.inquisitorWorld.setStage(stage); game.inquisitorWorld.root.visible = true;
    const spawn = game.inquisitorWorld.spawn(stage);
    if (stage === 2 && q.relay > 0) spawn.copy(target(game, q.relay - 1)).add(V(0, 0, 5));
    if (stage === 3) { const next = q.locks.findIndex(v => !v); if (next > 0) spawn.copy(target(game, next - 1)).add(V(0, 0, 5)); }
    spawn.y = ORIGIN.y; if (resetPosition) teleport(game, spawn);
    r.witness.copy(spawn).add(V(0, 1.8, -2));
    toast(game, ['Follow the red arrows to a seal, then ATTACK. Move to interrupt your attack chain.', 'Follow the red arrows to the next station. Each turn also moves its neighbour.', 'Follow the red guide. Stay with the witness, clear the wardens, and break each purge relay.', 'Follow the red arrows. Strike the mechanism when its ring turns gold.', 'Follow the red arrows to the gold station. Redirect the witness, then strike the exposed core.', 'Follow the red arrows. Carry the surviving record to the door.'][stage], 7);
    if (!r.replay) checkpoint(game);
  }
  function begin(game = window.__game) {
    if (!ready(game) || game.inquisitorInside || read(game).complete) return false;
    document.getElementById('inquisitor-resume')?.remove();
    game._inquisitorPaused = false;
    const q = read(game); q.started = true;
    try {
      buildRuntime(game); setStage(game, q.stage);
      // Best-effort on entry. Browsers without a fresh user activation reject
      // auto-fullscreen; the quest keeps its always-visible FULL button.
      game.inquisitorRuntime.presentation.requestFullscreen();
      if (q.pendingClip !== null) playClip(game, q.pendingClip);
      else if (INTRO_CLIP[q.stage] !== undefined && !q.seen.includes(INTRO_CLIP[q.stage])) playClip(game, INTRO_CLIP[q.stage]);
      else resolveCompletedCheckpoint(game);
      checkpoint(game); return true;
    } catch (e) {
      console.error('[Grand Inquisitor] introduction failed', e);
      leave(game, { save: false, quiet: true }); game._inquisitorPaused = true;
      Quests.toast('The Inquisition could not open. Your city is safe. Resume the story from the Index to retry.');
      return false;
    }
  }
  function transition(game, next, clip = null) {
    const q = read(game); q.pendingClip = null; setStage(game, next);
    if (clip !== null) playClip(game, clip); else checkpoint(game);
  }
  function resolveCompletedCheckpoint(game) {
    const q = read(game); if (game.inquisitorRuntime?.replay) return;
    if (q.stage === 0 && q.seals.every(Boolean)) transition(game, 1);
    else if (q.stage === 1 && q.aligned.every(Boolean)) playClip(game, 1);
    else if (q.stage === 2 && q.relay === 3) transition(game, 3, 3);
    else if (q.stage === 3 && q.locks.every(Boolean)) transition(game, 4, 4);
    else if (q.stage === 4 && q.bossPhase === 3) playClip(game, 5);
    else if (q.stage === 5 && q.doorOpened) playClip(game, 6);
  }
  function playClip(game, id) {
    const r = game.inquisitorRuntime; if (!r || r.presentation.cinematic) return false;
    clearInput(game); r.clip = id;
    if (!r.replay) { read(game).pendingClip = id; checkpoint(game); }
    store.set({ inquisitorCineActive: true, panel: { type: 'inquisitor-cine' }, prompt: '' });
    r.presentation.play(id, () => afterClip(game, id));
    if (id === 5) {
      const rig = game.player?.userData?.externalRig;
      if (rig?.ready && !rig.failed) {
        const judgment = rig.danceActions.findIndex(action => /sword.?judgment/i.test(action.getClip?.().name || ''));
        rig.danceMode = 'once';
        rig.playDanceIndex(judgment >= 0 ? judgment : 6);
      }
    }
    return true;
  }
  function finishClip(game) { game.inquisitorRuntime?.presentation.finish(true); }
  function afterClip(game, id) {
    const r = game.inquisitorRuntime; if (!r) return;
    clearInput(game); r.clip = null;
    store.set({ inquisitorCineActive: false, panel: null });
    if (r.replay) {
      r.replayIndex++;
      if (r.replayIndex < r.replayIds.length) runReplayClip(game); else leave(game, { save: false, quiet: true });
      return;
    }
    const q = read(game); q.seen = [...new Set([...q.seen, id])]; q.pendingClip = null;
    if (id === 1) transition(game, 2, 2);
    else if (id === 5) transition(game, 5);
    else if (id === 6) {
      q.complete = true; q.stage = 5; q.doorOpened = true;
      checkpoint(game); leave(game, { quiet: true });
      Quests.toast('THE INQUISITION BEGINS · The Unwritten Verdict is complete. Its seven scenes are now in the Index.');
    } else { checkpoint(game); toast(game, id === 4 ? 'Follow the red guide to the gold station. Turn the witness toward the crown.' : 'Follow the red arrows. Your checkpoint is saved.', 5); }
  }

  function armRig(game) {
    const rig = game.player?.userData?.externalRig;
    if (!rig?.ready || rig._inquisitorOwned) return;
    rig._inquisitorOwned = true; const play = rig.playDanceIndex;
    rig._inquisitorOriginalPlay = play;
    rig.playDanceIndex = function(index) {
      const ok = play.call(this, index), r = game.inquisitorRuntime;
      if (ok && game.inquisitorInside && r && !r.replay && !r.presentation.cinematic) {
        const clip = this.activeDance?.getClip?.(), duration = clip?.duration || 1.2;
        r.pendingHit = { elapsed: 0, times: (ATTACK_IMPACTS[clip?.name] || []).map(mark => Math.max(.16, duration * mark)), index, clip: clip?.name };
        faceAttackTarget(game);
      }
      return ok;
    };
  }
  function disarmRig(game) {
    const rig = game.player?.userData?.externalRig;
    if (!rig?._inquisitorOwned) return;
    rig.stopDance(.08); rig.playDanceIndex = rig._inquisitorOriginalPlay;
    delete rig._inquisitorOriginalPlay; delete rig._inquisitorOwned;
  }
  function attack(game, loop = false) {
    const r = game?.inquisitorRuntime;
    if (!game?.inquisitorInside || !r || r.replay || r.presentation.cinematic || document.hidden || store.get().panel) return false;
    const rig = game.player?.userData?.externalRig;
    if (!rig?.ready || rig.failed) { toast(game, 'The character is still loading.'); return false; }
    armRig(game); game.sfx.ensure(); game.keys = {}; game.touchMoveVec = null; game.moveTarget = null; game.playerVel.set(0, 0, 0);
    if (rig.danceMode) { if (loop) rig.danceMode = 'loop'; return true; }
    faceAttackTarget(game); return rig.startDance(!!loop);
  }
  function stopAttack(game) { game?.player?.userData?.externalRig?.stopDance?.(.08); if (game?.inquisitorRuntime) game.inquisitorRuntime.pendingHit = null; }
  function nearestGuard(game, range = 13) {
    const guards = game.inquisitorRuntime.fx.guards.filter(g => g.hp > 0 && g.mesh.visible && distance(game, g.mesh.position) <= range);
    return guards.sort((a, b) => distance(game, a.mesh.position) - distance(game, b.mesh.position))[0] || null;
  }
  function attackTarget(game) {
    const q = state(game), r = game.inquisitorRuntime;
    const guard = nearestGuard(game); if (guard) return { guard, pos: guard.mesh.position.clone().add(V(0, 1.5, 0)) };
    const candidates = [];
    if (q.stage === 0) q.seals.forEach((v, i) => { if (!v) candidates.push(i); });
    if (q.stage === 2 && q.relay < 3 && r.relaySpawned === q.relay && r.purgeHP > 0 && !r.fx.guards.some(g => g.hp > 0)) candidates.push(q.relay);
    if (q.stage === 3) { const i = q.locks.findIndex(v => !v); if (i >= 0) candidates.push(i); }
    if (q.stage === 4 && r.bossExposed > 0) candidates.push(3);
    return candidates.map(index => ({ index, pos: target(game, index) })).filter(t => t.pos && distance(game, t.pos) <= 14).sort((a, b) => distance(game, a.pos) - distance(game, b.pos))[0] || null;
  }
  function faceAttackTarget(game) { const t = attackTarget(game); if (!t) return; game.playerYaw = Math.atan2(t.pos.x - game.playerPos.x, t.pos.z - game.playerPos.z); game.player.rotation.y = game.playerYaw; }
  function hit(game) {
    const r = game.inquisitorRuntime, q = read(game); if (!r || r.replay || r.presentation.cinematic) return;
    const t = attackTarget(game);
    if (!t) { toast(game, q.stage === 4 ? 'Redirect the witness at the gold station before striking the core.' : q.stage === 1 ? 'Use INTERACT at the three archive stations.' : 'Move closer to a glowing seal, warden, or mechanism.', 2); return; }
    r.fx.bolt(game.playerPos.clone().add(V(0, 1.7, 0)), t.pos); r.presentation.cue('hit');
    if (t.guard) { t.guard.hp--; if (t.guard.hp <= 0) { t.guard.mesh.visible = false; r.fx.burst(t.pos, 28); } return; }
    if (q.stage === 0) {
      q.seals[t.index] = true; checkpoint(game); r.presentation.cue('seal');
      toast(game, ['One seal broken. The record is opening.', 'The Tribunal is losing its grip.', 'The threshold is yours.'][q.seals.filter(Boolean).length - 1]);
      if (q.seals.every(Boolean)) { r.transitionWait = .9; r.transitionTo = 1; }
    } else if (q.stage === 2) {
      r.purgeHP--; if (r.purgeHP <= 0) { r.presentation.cue('purge'); toast(game, 'Relay released. Bring the witness into the gold circle.'); }
    } else if (q.stage === 3) {
      if (!clockOpen(r, t.index)) { toast(game, 'The ring is still charged. Strike when the mechanism turns gold.', 2); r.presentation.cue('clock'); return; }
      q.locks[t.index] = true; checkpoint(game); r.presentation.cue('clock');
      toast(game, 'Clock ' + (t.index + 1) + ' arrested.');
      if (q.locks.every(Boolean)) { r.transitionWait = 1.1; r.transitionTo = 4; r.transitionClip = 4; }
    } else if (q.stage === 4 && r.bossExposed > 0) {
      q.bossPhase++; r.bossExposed = 0; r.bossStation = -1; r.clock = 0; r.integrity = Math.min(3, r.integrity + 1);
      checkpoint(game); r.presentation.cue('boss');
      toast(game, q.bossPhase === 1 ? '“An exception.” — “Write it down.”' : q.bossPhase === 2 ? 'The last band is exposed. Finish the examination.' : 'The verdict cannot hold.');
      if (q.bossPhase === 3) playClip(game, 5);
    }
  }
  function clockOpen(r, index) { return ((r.clock + index * .8) % 5.6) >= 2.6; }
  function correctBossStation(game) { return [0, 1, 2][state(game).bossPhase] ?? 2; }
  function nearestInteraction(game) {
    const q = state(game), r = game.inquisitorRuntime;
    if (!r || r.replay || r.presentation.cinematic || document.hidden) return null;
    let indices = [];
    if (q.stage === 1) indices = [0, 1, 2];
    if (q.stage === 4 && q.bossPhase < 3 && r.bossExposed <= 0) indices = [0, 1, 2];
    if (q.stage === 5 && !q.doorOpened) indices = [0];
    return indices.map(index => ({ id: 'inquisitor-' + q.stage + '-' + index, index, pos: target(game, index), radius: 4.4, prompt: () => q.stage === 1 ? 'E — TURN ARCHIVE STATION' : q.stage === 4 ? 'E — REDIRECT THE WITNESS' : 'E — OPEN THE DOOR' })).filter(t => t.pos && distance(game, t.pos) < t.radius).sort((a, b) => distance(game, a.pos) - distance(game, b.pos))[0] || null;
  }
  function interact(game = window.__game, explicit = null) {
    const r = game?.inquisitorRuntime;
    if (!r || !game.inquisitorInside || r.replay || r.presentation.cinematic || document.hidden || store.get().panel || r.cooldown > 0) return false;
    const it = nearestInteraction(game); if (!it || (explicit && explicit.id !== it.id)) { toast(game, 'Walk into the gold circle to interact.', 2); return false; }
    const q = read(game); r.cooldown = .22; game.sfx.ensure();
    if (q.stage === 1) {
      for (const ix of [it.index, (it.index + 1) % 3]) q.turns[ix] = (q.turns[ix] + 1) % 4;
      q.aligned = q.turns.map((v, i) => v === TARGET_TURNS[i]); checkpoint(game); r.presentation.cue('align');
      toast(game, q.aligned.every(Boolean) ? 'Same origin. Different history.' : q.aligned.filter(Boolean).length + '/3 histories aligned. Each station also turns the next.', 4);
      if (q.aligned.every(Boolean)) playClip(game, 1);
    } else if (q.stage === 4) {
      if (it.index !== correctBossStation(game)) { toast(game, 'This sight line is blocked. Find the gold station.', 3); return false; }
      r.bossStation = it.index; r.bossExposed = 12; r.presentation.cue('align'); r.fx.bolt(it.pos.clone().add(V(0, 1, 0)), target(game, 3).clone().add(V(0, 8, 0)));
      toast(game, 'Core exposed. Approach the central receiver and ATTACK.', 5);
    } else if (q.stage === 5) { q.doorOpened = true; checkpoint(game); r.presentation.cue('door'); playClip(game, 6); }
    return true;
  }

  function spawnRelayGuards(game) {
    const q = read(game), r = game.inquisitorRuntime, p = target(game, q.relay);
    r.relaySpawned = q.relay; r.purgeHP = 2; r.damageGrace = 1;
    r.fx.guards.forEach((g, i) => { g.hp = q.relay === 0 && i === 2 ? 0 : 2; g.mesh.visible = g.hp > 0; g.mesh.position.set(p.x + (i - 1) * 4.5, ORIGIN.y, p.z - 4 - (i % 2) * 2); g.strike = 2.5 + i * .7; });
    r.presentation.cue('purge'); toast(game, 'The archive is erasing itself. Break the wardens, then the relay.', 4);
  }
  function damage(game, message) {
    const r = game.inquisitorRuntime; if (r.damageGrace > 0 || r.presentation.cinematic || r.replay) return;
    r.integrity--; r.damageGrace = 2.1; r.presentation.cue('purge'); toast(game, message, 2.5);
    if (r.integrity <= 0) {
      const q = read(game); setStage(game, q.stage); toast(game, 'CHECKPOINT RESTORED · Your completed relays and world progress are safe.', 5);
    }
  }
  function tickEscort(game, dt) {
    const q = read(game), r = game.inquisitorRuntime; if (q.relay >= 3) return;
    const p = target(game, q.relay), to = p.clone().sub(r.witness); to.y = 0; const remaining = to.length();
    const playerNear = distance(game, r.witness) < 13;
    if (playerNear && remaining > .8) r.witness.addScaledVector(to.normalize(), Math.min(4.5 * dt, remaining));
    r.witness.y = ORIGIN.y + 1.8; r.escortArrived = remaining < 1;
    if (r.relaySpawned !== q.relay && distance(game, p) < 22) spawnRelayGuards(game);
    for (const g of r.fx.guards) if (g.hp > 0) {
      g.clock += dt; g.mesh.position.y = ORIGIN.y + .12 + Math.sin(g.clock * 2) * .13;
      const dx = r.witness.x - g.mesh.position.x, dz = r.witness.z - g.mesh.position.z, d = Math.hypot(dx, dz);
      g.mesh.rotation.y = Math.atan2(game.playerPos.x - g.mesh.position.x, game.playerPos.z - g.mesh.position.z);
      if (d > 2.8) { g.mesh.position.x += dx / d * dt * 1.6; g.mesh.position.z += dz / d * dt * 1.6; }
      else { g.strike -= dt; if (g.strike < 0) { damage(game, 'The witness is under attack. Clear the nearby wardens.'); g.strike = 3; } }
    }
    if (r.relaySpawned === q.relay && r.purgeHP <= 0 && r.escortArrived) {
      q.relay++; checkpoint(game); r.fx.hideGuards(); r.relaySpawned = -1; r.purgeHP = 2; r.integrity = 3;
      r.presentation.cue('align'); toast(game, q.relay < 3 ? 'Record protected. Continue to the next relay.' : 'The record survived. The Tribunal is ahead.');
      if (q.relay === 3) transition(game, 3, 3);
    }
  }
  function tickHazards(game, dt) {
    const q = read(game), r = game.inquisitorRuntime;
    if (q.stage === 3) {
      const i = q.locks.findIndex(v => !v); if (i < 0) return;
      const z = ORIGIN.z - 3 * 160 + [10, -8, -26][i];
      if (!clockOpen(r, i) && Math.abs(game.playerPos.z - z) < 1.15 && Math.abs(game.playerPos.x - ORIGIN.x) < 10) damage(game, 'Charged ring. Use the gold interval or the safe outer lane.');
    }
    if (q.stage === 4 && q.bossPhase < 3) {
      const local = game.playerPos.clone().sub(V(ORIGIN.x, ORIGIN.y, ORIGIN.z - 4 * 160));
      const phase = r.clock % 6;
      if (phase > 3.7 && phase < 4.2 && Math.abs(local.z - (8 - q.bossPhase * 8)) < 1.15 && Math.abs(local.x) < 24) damage(game, 'Purge sweep. Move beyond the crimson floor band.');
      if (r.bossExposed > 0) { r.bossExposed = Math.max(0, r.bossExposed - dt); if (r.bossExposed === 0) toast(game, 'The crown closed. Redirect the witness again.', 3); }
    }
  }
  function objective(game) {
    const q = state(game), r = game.inquisitorRuntime;
    const done = [q.seals.filter(Boolean).length, q.aligned.filter(Boolean).length, q.relay, q.locks.filter(Boolean).length, q.bossPhase, q.doorOpened ? 1 : 0][q.stage];
    const objectives = ['Break the three seals', 'Reconstruct the divided record', 'Protect the surviving record', 'Stop the clock. Reach the Tribunal.', r?.bossExposed > 0 ? 'Strike the exposed core' : 'Turn the witness on the Tribunal', 'Open the door beneath the world'];
    const defaultHints = [
      'Follow the red arrows · ATTACK / Q opens with a sweeping kick. Move to interrupt the combo.',
      'Follow the red guide · INTERACT / E turns this station and the next. Align all three fixed marks.',
      r?.relaySpawned === q.relay && r?.fx.guards.some(g => g.hp > 0) ? 'ATTACK the wardens. Their crimson masks mark the threat.' : r?.purgeHP > 0 ? 'Stay near the witness. Break the purge relay after its wardens.' : 'Walk with the witness to the cleared relay.',
      'Outer lanes are safe. ATTACK the next mechanism while it glows gold.',
      r?.bossExposed > 0 ? 'Core open · ' + Math.ceil(r.bossExposed) + 's · approach the center, then ATTACK.' : 'Gold station ' + (correctBossStation(game) + 1) + ' has the clear sight line. INTERACT there.',
      'Follow the red arrows. INTERACT at the record cradle.'
    ];
    const total = q.stage === 5 ? 1 : 3;
    return { stage: q.stage, objective: objectives[q.stage], hint: r?.messageTime > 0 ? r.message : defaultHints[q.stage], progress: { current: done, total, label: done + ' / ' + total }, integrity: q.stage === 2 || q.stage === 3 || q.stage === 4 ? r?.integrity : null, canInteract: !!nearestInteraction(game), nearLabel: q.stage === 1 ? 'TURN' : q.stage === 5 ? 'OPEN' : 'ALIGN', attackLabel: 'ATTACK', paused: false, replay: !!r?.replay };
  }
  function visualState(game) {
    const q = state(game), r = game.inquisitorRuntime;
    const offset = V(ORIGIN.x, ORIGIN.y, ORIGIN.z - r.stage * 160);
    const activeClock = q.locks.findIndex(v => !v);
    const period = q.stage === 3 ? 5.6 : 6;
    const guide = guideObjective(game);
    return { ...q, stage: r.stage, clock: r.clock, witnessLocal: r.witness.clone().sub(offset).toArray(), playerLocal: game.playerPos.clone().sub(offset).toArray(), guideTargetLocal: guide?.pos ? guide.pos.clone().sub(offset).toArray() : null, guideKind: guide?.kind || null, guideEnabled: !r.replay && !q.complete, clockOpen: clockOpen(r, Math.max(0, activeClock)), hazardPhase: (r.clock % period) / period, bossExposed: r.bossExposed > 0, bossStation: correctBossStation(game), doorOpen: r.doorOpen, cinematic: !!r.presentation.cinematic, relayCleared: r.purgeHP <= 0, guardHP: r.fx.guards.map(g => g.hp), externalCombat: true, paused: document.hidden };
  }
  function guideObjective(game) {
    const q = state(game), r = game.inquisitorRuntime;
    if (!r || r.presentation.cinematic || r.replay || q.complete) return null;
    const at = (index, kind) => index >= 0 ? { pos: target(game, index), kind } : null;
    if (q.stage === 0) {
      const index = q.seals.map((done, i) => done ? null : { i, d: distance(game, target(game, i)) }).filter(Boolean).sort((a, b) => a.d - b.d)[0]?.i;
      return at(index ?? -1, 'seal');
    }
    if (q.stage === 1) {
      const next = LEDGER_GUIDE.get(q.turns.join(','));
      return at(next === null ? -1 : next ?? q.aligned.findIndex(v => !v), 'station');
    }
    if (q.stage === 2) {
      if (q.relay >= 3) return null;
      if (distance(game, r.witness) > 12) return { pos: r.witness, kind: 'witness' };
      const guard = r.fx.guards.filter(g => g.hp > 0 && g.mesh.visible).sort((a, b) => distance(game, a.mesh.position) - distance(game, b.mesh.position))[0];
      if (guard) return { pos: guard.mesh.position, kind: 'warden' };
      return at(q.relay, r.relaySpawned === q.relay && r.purgeHP > 0 ? 'relay' : 'escort');
    }
    if (q.stage === 3) return at(q.locks.findIndex(v => !v), 'clock');
    if (q.stage === 4) return q.bossPhase >= 3 ? null : at(r.bossExposed > 0 ? 3 : correctBossStation(game), r.bossExposed > 0 ? 'core' : 'station');
    return q.doorOpened ? null : at(0, 'door');
  }
  function waypoint(game) { return guideObjective(game)?.pos || null; }
  function tick(game, dt) {
    let r = game.inquisitorRuntime;
    if (game.inquisitorInside && !selected()) { leave(game, { quiet: true }); return; }
    if (!game.inquisitorInside) {
      if (pending(game) && game._inquisitorTutorialDecided && game.player?.userData?.externalRig?.failed) {
        game._inquisitorModelUnavailable = true; Quests.toast('Grand Inquisitor model could not load. Reload to retry; your campaign is safe.');
      }
      if (pending(game) && ready(game)) begin(game);
      return;
    }
    if (!r || game.disposed || document.hidden || window.__atropaPersistencePausedR39) return;
    if (!writable(game)) { leave(game, { save: false, quiet: true }); return; }
    dt = clamp(Number(dt) || 0, 0, .05);
    r.clock += dt; r.stageTime += dt; r.damageGrace = Math.max(0, r.damageGrace - dt); r.cooldown = Math.max(0, r.cooldown - dt); r.messageTime = Math.max(0, r.messageTime - dt);
    if (!r.replay) { r.unsavedTime += dt; if (r.unsavedTime >= 10) checkpoint(game); }
    if (r.clip === 6) r.doorOpen = Math.min(1, r.doorOpen + dt / 9);
    game.player.visible = true;
    if (!r.presentation.cinematic && !r.replay) {
      const q = read(game); const c = ORIGIN.z - q.stage * 160;
      game.playerPos.x = clamp(game.playerPos.x, ORIGIN.x - 28, ORIGIN.x + 28);
      game.playerPos.z = clamp(game.playerPos.z, c + roomFront(q.stage), c + 34);
      game.player.position.copy(game.playerPos);
      if (r.pendingHit) {
        const rig = game.player.userData.externalRig;
        if (!rig?.danceMode) r.pendingHit = null;
        else {
          const impacts = r.pendingHit; impacts.elapsed += dt;
          while (impacts.times.length && impacts.elapsed >= impacts.times[0]) {
            impacts.times.shift(); hit(game);
            if (r.pendingHit !== impacts || game.inquisitorRuntime !== r || r.presentation.cinematic) break;
          }
          if (r.pendingHit === impacts && impacts.times.length === 0) r.pendingHit = null;
        }
      }
      if (q.stage === 2) tickEscort(game, dt);
      tickHazards(game, dt);
      if (r.transitionWait !== undefined) { r.transitionWait -= dt; if (r.transitionWait <= 0) { const next = r.transitionTo, clip = r.transitionClip ?? null; delete r.transitionWait; delete r.transitionTo; delete r.transitionClip; transition(game, next, clip); } }
      const look = game.playerPos.clone().add(V(-Math.sin(game.camYaw) * 4.5, 3.6, -Math.cos(game.camYaw) * 4.5));
      game.camera.position.x = clamp(game.camera.position.x, ORIGIN.x - 29.2, ORIGIN.x + 29.2);
      game.camera.position.z = clamp(game.camera.position.z, c + (q.stage === 0 || q.stage === 5 ? roomFront(q.stage) - .8 : -36), c + 38);
      game.camera.position.y = clamp(game.camera.position.y, ORIGIN.y + 2.5, ORIGIN.y + 19);
      game.camera.lookAt(look);
    }
    if (game.inquisitorRuntime !== r) return;
    r.fx.tick(dt); const visual = visualState(game); game.inquisitorWorld.tick(dt, visual);
    r.presentation.setHUD(objective(game)); r.presentation.tick(dt, visual);
  }

  function leave(game = window.__game, options = {}) {
    const r = game?.inquisitorRuntime;
    if (!r) return false;
    if (options.save !== false && !r.replay) checkpoint(game);
    game._inquisitorPaused = true;
    r.presentation.finish(false); clearInput(game); disarmRig(game);
    const snap = r.snapshot;
    game.inquisitorInside = false;
    if (snap) {
      for (const [o, visible] of snap.objects) if (o.parent || o === game.scene) o.visible = visible;
      game.scene.background = snap.background; game.scene.fog = snap.fog; game.layer = snap.layer;
      teleport(game, snap.pos); game.playerYaw = snap.yaw; game.player.rotation.y = snap.yaw;
      game.camYaw = snap.camYaw; game.camPitch = snap.camPitch; game.viewMode = snap.viewMode;
      game.viewBlend = snap.viewBlend; game.viewBlendTarget = snap.viewTarget; game.chaseZoom = snap.chaseZoom; game.zoomMul = snap.zoomMul;
      game.camera.fov = snap.fov; game.camera.near = snap.near; game.camera.position.copy(snap.cameraPos); game.camera.quaternion.copy(snap.cameraQuat); game.camera.updateProjectionMatrix();
      game.player.visible = snap.playerVisible; game.lookBeat = snap.lookBeat;
      const ctx = game.sfx?.ctx, settings = loadSettings();
      if (ctx && ctx.state !== 'closed') for (const audio of snap.audio || []) {
        const current = audio.kind === 'music' ? game.music?.bus?.gain : game.sfx?.droneVoices?.get(audio.id)?.g?.gain;
        if (current !== audio.gain) continue;
        audio.gain.cancelScheduledValues(ctx.currentTime);
        audio.gain.setValueAtTime(settings.sfx !== false && (audio.kind !== 'music' || settings.music !== false) ? audio.value : 0, ctx.currentTime);
      }
    }
    r.presentation.dispose(); r.fx.dispose(); game.inquisitorWorld.dispose(); game.inquisitorWorld.root.removeFromParent();
    game.inquisitorWorld = null; game.inquisitorRuntime = null;
    store.set({ inquisitorInside: false, inquisitorCineActive: false, panel: null, prompt: '', questDir: null, questDist: null,
      ...(snap ? { campaignBanner: snap.campaignBanner, uiHidden: snap.uiHidden, questFocus: snap.questFocus, viewMode: snap.playerView } : {}) });
    game.clock?.getDelta(); game.canvas?.focus?.();
    if (!options.quiet && !r.replay) Quests.toast('Story paused at ' + TITLES[read(game).stage] + '. Resume Grand Inquisitor from the Index.');
    return true;
  }
  function reset(game = window.__game) { if (!game) return; leave(game, { save: false, quiet: true }); game.inquisitorState = fresh(); game._inquisitorPaused = false; game._inquisitorTutorialDecided = false; }

  function replayReady(game) { const rig = game?.player?.userData?.externalRig; return selected() && read(game).complete && !game.inquisitorInside && safeCity(game, true) && game.player?.userData?.hostedLibertyPlayer === 'grand-inquisitor' && !!rig?.ready && !rig.failed; }
  function replayState(id) {
    const q = fresh(); q.started = true; q.stage = CLIP_STAGE[id];
    if (id >= 1) q.seals = [true, true, true];
    if (id >= 1) { q.turns = TARGET_TURNS.slice(); q.aligned = [true, true, true]; }
    if (id >= 3) q.relay = 3;
    if (id >= 4) q.locks = [true, true, true];
    if (id >= 5) q.bossPhase = 3;
    if (id === 6) q.doorOpened = true;
    return q;
  }
  function runReplayClip(game) { const r = game.inquisitorRuntime, id = r.replayIds[r.replayIndex]; r.replayState = replayState(id); setStage(game, CLIP_STAGE[id]); playClip(game, id); }
  function replay(game = window.__game, id = null) {
    if (!replayReady(game) || (id !== null && (!Number.isInteger(id) || id < 0 || id > 6))) return false;
    closeRecordings();
    try { const r = buildRuntime(game, true); r.replayIds = id === null ? [0, 1, 2, 3, 4, 5, 6] : [id]; r.replayIndex = 0; runReplayClip(game); return true; }
    catch (e) { console.error('[Grand Inquisitor] replay failed', e); leave(game, { save: false, quiet: true }); return false; }
  }
  function closeRecordings() { document.getElementById('inquisitor-recordings')?.remove(); if (store.get().panel?.type === 'inquisitor-recordings') store.set({ panel: null }); }
  function recordings(game = window.__game) {
    if (!replayReady(game)) return false;
    closeRecordings(); clearInput(game); store.set({ panel: { type: 'inquisitor-recordings' } });
    const el = document.createElement('div'); el.id = 'inquisitor-recordings'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Grand Inquisitor recordings');
    el.style.cssText = 'position:fixed;inset:0;z-index:2147482502;background:#03040ccf;display:grid;place-items:center;padding:14px;box-sizing:border-box;color:#f5eee0;font:14px/1.5 system-ui';
    const card = document.createElement('div'); card.style.cssText = 'width:min(470px,100%);max-height:88dvh;overflow:auto;background:#10121e;border:1px solid #aa8250;padding:22px;box-sizing:border-box;border-radius:12px';
    const h = document.createElement('h2'); h.textContent = 'THE UNWRITTEN VERDICT'; h.style.cssText = 'font:600 21px Georgia;margin:0 0 5px;color:#efd5a1'; card.append(h);
    const p = document.createElement('p'); p.textContent = 'Grand Inquisitor Cicero · seven scenes from your completed story.'; card.append(p);
    function button(label, fn) { const b = document.createElement('button'); b.textContent = label; b.style.cssText = 'display:block;width:100%;min-height:44px;text-align:left;padding:10px 12px;margin:7px 0;border:1px solid #635239;background:#1b1d2a;color:#f4dfb7;border-radius:6px;font:600 12px system-ui;touch-action:manipulation'; b.onclick = fn; card.append(b); return b; }
    button('PLAY ALL SEVEN SCENES', () => replay(game));
    ['The Summons', 'The Divided Record', 'The Erasure', 'The Stolen Hour', 'The Tribunal', 'The Crown Breaks', 'The Door'].forEach((t, i) => button(`${i + 1}. ${t}`, () => replay(game, i)));
    const close = button('CLOSE', closeRecordings); el.append(card); document.body.append(el); close.focus(); return true;
  }
  function indexEntry(game = window.__game) {
    const q = read(game);
    return { id: 'grand-inquisitor-unwritten-verdict', title: 'The Unwritten Verdict', character: 'Grand Inquisitor Cicero', complete: q.complete, started: q.started, stage: q.stage, total: 6,
      description: 'A sealed record. A collapsing archive. A tribunal that has already decided. Six playable trials and seven cinematic scenes.',
      next: q.complete ? 'Replay any scene or watch the complete recording.' : q.started ? 'Resume ' + TITLES[q.stage] + '.' : 'Select Grand Inquisitor Cicero. His first quest begins after onboarding.',
      eligible: selected(), action: () => q.complete ? recordings(game) : begin(game) };
  }

  const originalGround = Game.prototype.groundH;
  Game.prototype.groundH = function(x, z) { return this.inquisitorInside ? ORIGIN.y : originalGround.call(this, x, z); };
  const originalUpdate = Game.prototype.updatePlayer;
  Game.prototype.updatePlayer = function(dt) { const out = originalUpdate.call(this, document.hidden && this.inquisitorInside ? 0 : dt); tick(this, dt); return out; };
  const originalInteract = Game.prototype.interact;
  Game.prototype.interact = function(it = null) { if (this.inquisitorInside) return interact(this, it); return originalInteract.call(this, it); };
  const originalNearest = Game.prototype.nearestInteractable;
  Game.prototype.nearestInteractable = function() { return this.inquisitorInside ? nearestInteraction(this) : originalNearest.call(this); };
  const originalClickToMove = Game.prototype.clickToMove;
  Game.prototype.clickToMove = function(event) {
    if (!this.inquisitorInside) return originalClickToMove.call(this, event);
    const r = this.inquisitorRuntime;
    if (!r || r.replay || r.presentation.cinematic || document.hidden || store.get().panel) return;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const pointer = new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    const ray = r.pointerRay || (r.pointerRay = new THREE.Raycaster());
    ray.setFromCamera(pointer, this.camera);
    const plane = r.pointerPlane || (r.pointerPlane = new THREE.Plane(V(0, 1, 0), -ORIGIN.y));
    const point = ray.ray.intersectPlane(plane, V());
    if (!point) return;
    const z = ORIGIN.z - state(this).stage * 160;
    this.moveTarget = { x: clamp(point.x, ORIGIN.x - 28, ORIGIN.x + 28), z: clamp(point.z, z + roomFront(state(this).stage), z + 34), lastD: 1e9, still: 0 };
  };
  const originalWaypoint = Game.prototype.questWaypointPos;
  Game.prototype.questWaypointPos = function() { return this.inquisitorInside ? waypoint(this) : originalWaypoint.call(this); };
  const originalStep = Game.prototype.questStepInfo;
  Game.prototype.questStepInfo = function(...args) { if (this.inquisitorInside) return { text: objective(this).objective, wp: 'grand-inquisitor' }; return originalStep.apply(this, args); };
  const originalDay = Game.prototype.updateDayNight;
  Game.prototype.updateDayNight = function(dt) { if (!this.inquisitorInside) return originalDay.call(this, dt); };
  const originalDance = Game.prototype.mariaDanceStart;
  Game.prototype.mariaDanceStart = function(loop = false) { return this.inquisitorInside ? attack(this, loop) : originalDance.call(this, loop); };
  const originalStop = Game.prototype.mariaDanceStop;
  Game.prototype.mariaDanceStop = function() { if (this.inquisitorInside) { stopAttack(this); return true; } return originalStop.call(this); };
  const originalSave = Game.prototype.saveFR;
  Game.prototype.saveFR = function(...args) {
    if (!writable(this)) return false;
    const snap = this.inquisitorRuntime?.snapshot;
    if (!this.inquisitorInside || !snap) return originalSave.apply(this, args);
    const live = { pos: this.playerPos.clone(), layer: this.layer, yaw: this.camYaw, pitch: this.camPitch, mode: this.viewMode, zoom: this.zoomMul, chase: this.chaseZoom, fov: this.camera.fov };
    this.playerPos.copy(snap.pos); this.layer = snap.layer; this.camYaw = snap.camYaw; this.camPitch = snap.camPitch; this.viewMode = snap.viewMode; this.zoomMul = snap.zoomMul; this.chaseZoom = snap.chaseZoom; this.camera.fov = snap.fov;
    try { return originalSave.apply(this, args); }
    finally { this.playerPos.copy(live.pos); this.layer = live.layer; this.camYaw = live.yaw; this.camPitch = live.pitch; this.viewMode = live.mode; this.zoomMul = live.zoom; this.chaseZoom = live.chase; this.camera.fov = live.fov; }
  };
  const originalFinishTutorial = Game.prototype.finishTutorial;
  Game.prototype.finishTutorial = function(outcome) { const ok = originalFinishTutorial.call(this, outcome); if (ok) this._inquisitorTutorialDecided = true; return ok; };
  const originalStart = Game.prototype.start;
  Game.prototype.start = async function(...args) { this._inquisitorTutorialDecided = false; this._inquisitorPaused = false; return originalStart.apply(this, args); };
  const originalDispose = Game.prototype.dispose;
  Game.prototype.dispose = function(...args) { closeRecordings(); leave(this, { save: writable(this), quiet: true }); return originalDispose.apply(this, args); };
  if (Game.prototype.restart) { const originalRestart = Game.prototype.restart; Game.prototype.restart = function(...args) { reset(this); const out = originalRestart.apply(this, args); this._inquisitorTutorialDecided = true; return out; }; }
  Game.prototype.inquisitorStart = function() { return begin(this); };
  Game.prototype.inquisitorPause = function() { return leave(this); };
  Game.prototype.inquisitorReplay = function(id = null) { return replay(this, id); };
  Game.prototype.inquisitorRecordings = function() { return recordings(this); };
  Game.prototype.inquisitorAttack = function(loop = false) { return attack(this, loop); };
  window.__grandInquisitorQuest = { revision: 1, titles: TITLES, read, normalize, serialize, hydrate, reset, ready, pending, begin, replay, recordings, indexEntry, checkpoint: game => serialize(game), interact, attack, finishClip, waypoint };
  const keydown = e => {
    const g = window.__game;
    if (document.getElementById('inquisitor-recordings')) { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closeRecordings(); } return; }
    if (!g?.inquisitorInside || e.ctrlKey || e.metaKey || e.altKey) return;
    const key = String(e.key || '').toLowerCase();
    if (key === 'escape') { e.preventDefault(); e.stopImmediatePropagation(); if (g.inquisitorRuntime?.presentation.cinematic) finishClip(g); else leave(g); return; }
    if (key === 'q') { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) attack(g); return; }
    if (g.inquisitorRuntime?.presentation.cinematic || !['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift', ' ', 'e', 'tab'].includes(key)) { e.preventDefault(); e.stopImmediatePropagation(); }
  };
  window.addEventListener('keydown', keydown, true);
  window.addEventListener('blur', () => { if (window.__game?.inquisitorInside) clearInput(window.__game); });
  document.addEventListener('visibilitychange', () => { const g = window.__game; if (g?.inquisitorInside) { clearInput(g); if (document.hidden) checkpoint(g); g.clock?.getDelta(); } });
})();
// END GRAND INQUISITOR CICERO — THE UNWRITTEN VERDICT P50

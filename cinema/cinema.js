import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

/*
  414 Cinema
  Runtime contains only The Peggening / Maria 414 cinema code.
  Procedural room/material ideas adapted from an MIT-licensed cinema project.
  Required attribution is preserved in THIRD_PARTY_NOTICES.md.
*/

const CHANNEL_ID = 'UCDcD3nYM9TBMtAmMKZqo-QA';
const FALLBACK_MEDIA = {
  channel: {
    name: 'Maria 414',
    handle: '@éˆè„…ç”¨',
    url: 'https://www.youtube.com/@%E9%9D%88%E8%84%85%E7%94%A8',
    channelId: CHANNEL_ID
  },
  live: {
    title: 'MARIA 414 â€” LIVE',
    description: "Always targets Maria's current YouTube live broadcast when the channel is live."
  },
  videos: [
    { id: 'KPzYZSihQHc', title: 'Atropa Developer ZÃ¼rich meetup #1 â€” Mariarahel', tag: 'ATROPA Â· ZÃœRICH #1' },
    { id: 'HbY4m5b1bgQ', title: 'ATROPA Developer Amsterdam PulseChain Tour', tag: 'ATROPA Â· AMSTERDAM TOUR' },
    { id: 'hDN3AcExMMg', title: 'Atropa Developer ZÃ¼rich meetup #2 â€” Mariarahel', tag: 'ATROPA Â· ZÃœRICH #2' },
    { id: 'kOUhEYYy2KQ', title: 'ATROPA DEV in Amsterdam', tag: 'ATROPA Â· AMSTERDAM' }
  ]
};

const els = {
  stage: document.getElementById('stage'),
  loading: document.getElementById('loading'),
  prompt: document.getElementById('prompt'),
  crosshair: document.getElementById('crosshair'),
  mediaPanel: document.getElementById('mediaPanel'),
  mediaList: document.getElementById('mediaList'),
  openLibrary: document.getElementById('openLibrary'),
  exitCinema: document.getElementById('exitCinema'),
  screenControls: document.getElementById('screenControls'),
  nowPlaying: document.getElementById('nowPlaying'),
  screenPause: document.getElementById('screenPause'),
  screenStop: document.getElementById('screenStop'),
  screenChoose: document.getElementById('screenChoose'),
  stick: document.getElementById('stick'),
  nub: document.getElementById('nub'),
  mobileE: document.getElementById('mobileE')
};

let media = FALLBACK_MEDIA;
try {
  const res = await fetch('./media.json', { cache: 'no-store' });
  if (res.ok) media = await res.json();
} catch (_) {}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040207);
scene.fog = new THREE.FogExp2(0x08030d, 0.018);

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.05, 180);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.65));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.inset = '0';
renderer.domElement.style.zIndex = '1';
els.stage.appendChild(renderer.domElement);

const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(innerWidth, innerHeight);
cssRenderer.domElement.id = 'cinema-css3d';
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.inset = '0';
cssRenderer.domElement.style.zIndex = '2';
cssRenderer.domElement.style.pointerEvents = 'none';
els.stage.insertBefore(cssRenderer.domElement, renderer.domElement.nextSibling);

const ROOM = { width: 30, depth: 48, height: 11 };
const HALF_W = ROOM.width / 2;
const HALF_D = ROOM.depth / 2;
const EYE = 1.72;
const player = new THREE.Vector3(0, EYE, 18.2);
let yaw = 0;
let pitch = -0.02;
let panelOpen = false;
let currentMedia = null;
let screenPaused = false;
let lastFrame = performance.now();
const keys = new Set();
const colliders = [];
const clock = new THREE.Clock();

const THEME = {
  carpetBase: '#1d071e',
  carpetStripe: '#4b164d',
  carpetDiamond: '#d8aa45',
  woodBase: '#1b0e16',
  woodBand: 'rgba(105,60,92,.36)',
  curtainStops: ['#250628', '#5e145d', '#250628'],
  curtainLine: 'rgba(0,0,0,.32)',
  wall: 0x0e0712,
  sideWall: 0x170a1e,
  ceiling: 0x050307,
  trim: 0xd5a746,
  violet: 0x8a4bd8,
  gold: 0xffd76b,
  red: 0xa21d3a,
  velvet: 0x3b0c26
};

function canvasTexture(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return tex;
}

function carpetTexture() {
  const tex = canvasTexture(256, (ctx, size) => {
    ctx.fillStyle = THEME.carpetBase;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = THEME.carpetStripe;
    ctx.lineWidth = 6;
    for (let i = -size; i < size * 2; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
      ctx.stroke();
    }
    ctx.fillStyle = THEME.carpetDiamond;
    for (let gx = 16; gx < size; gx += 64) {
      for (let gy = 16; gy < size; gy += 64) {
        ctx.beginPath();
        ctx.moveTo(gx, gy - 6);
        ctx.lineTo(gx + 6, gy);
        ctx.lineTo(gx, gy + 6);
        ctx.lineTo(gx - 6, gy);
        ctx.closePath();
        ctx.fill();
      }
    }
  });
  tex.repeat.set(ROOM.width / 3, ROOM.depth / 3);
  return tex;
}

function panelTexture() {
  const tex = canvasTexture(256, (ctx, size) => {
    ctx.fillStyle = THEME.woodBase;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = THEME.woodBand;
      ctx.fillRect(0, i * 16, size, 12);
    }
    ctx.strokeStyle = 'rgba(216,170,69,.17)';
    ctx.lineWidth = 1;
    for (let y = 0; y <= size; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
  });
  tex.repeat.set(ROOM.depth / 4, 1);
  return tex;
}

function curtainTexture() {
  const tex = canvasTexture(128, (ctx, size) => {
    const grad = ctx.createLinearGradient(0, 0, size, 0);
    grad.addColorStop(0, THEME.curtainStops[0]);
    grad.addColorStop(.5, THEME.curtainStops[1]);
    grad.addColorStop(1, THEME.curtainStops[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = THEME.curtainLine;
    ctx.lineWidth = 3;
    for (let x = 0; x < size; x += 9) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
  });
  tex.repeat.set(1.2, 1);
  return tex;
}

function makeTextTexture(lines, options = {}) {
  const w = options.width || 1024;
  const h = options.height || 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  if (options.background) {
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, w, h);
  }
  const arr = Array.isArray(lines) ? lines : [lines];
  const fontSize = options.fontSize || 88;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${fontSize}px Arial`;
  ctx.fillStyle = options.color || '#ffd76b';
  ctx.shadowColor = options.glow || 'rgba(183,130,255,.55)';
  ctx.shadowBlur = options.blur ?? 22;
  const total = arr.length * (fontSize * 1.08);
  let y = (h - total) / 2 + fontSize * .55;
  for (const line of arr) {
    ctx.fillText(line, w / 2, y);
    y += fontSize * 1.08;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function box(w, h, d, material, x, y, z, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

const floorMat = new THREE.MeshStandardMaterial({ map: carpetTexture(), roughness: .88, metalness: .02 });
const wallMat = new THREE.MeshStandardMaterial({ color: THEME.wall, roughness: .9 });
const sideMat = new THREE.MeshStandardMaterial({ color: THEME.sideWall, roughness: .88 });
const woodMat = new THREE.MeshStandardMaterial({ map: panelTexture(), roughness: .72 });
const trimMat = new THREE.MeshStandardMaterial({ color: THEME.trim, metalness: .78, roughness: .27 });
const blackMetal = new THREE.MeshStandardMaterial({ color: 0x08080b, metalness: .65, roughness: .28 });
const violetMat = new THREE.MeshStandardMaterial({ color: 0x24102f, emissive: THEME.violet, emissiveIntensity: .16, roughness: .42, metalness: .18 });

const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, ROOM.depth), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

box(ROOM.width, ROOM.height, .35, wallMat, 0, ROOM.height / 2, -HALF_D);
box(ROOM.width, ROOM.height, .35, wallMat, 0, ROOM.height / 2, HALF_D);
box(.35, ROOM.height, ROOM.depth, sideMat, -HALF_W, ROOM.height / 2, 0);
box(.35, ROOM.height, ROOM.depth, sideMat, HALF_W, ROOM.height / 2, 0);
box(ROOM.width, .25, ROOM.depth, new THREE.MeshStandardMaterial({ color: THEME.ceiling, roughness: 1 }), 0, ROOM.height, 0);

box(.28, 2.2, ROOM.depth - .7, woodMat, -HALF_W + .26, 1.1, 0);
box(.28, 2.2, ROOM.depth - .7, woodMat, HALF_W - .26, 1.1, 0);
box(.12, .12, ROOM.depth - .7, trimMat, -HALF_W + .42, 2.22, 0);
box(.12, .12, ROOM.depth - .7, trimMat, HALF_W - .42, 2.22, 0);

const screenW = 21.5;
const screenH = 9.4;
const screenY = 5.8;
const screenZ = -HALF_D + .42;
box(screenW + .65, screenH + .65, .32, trimMat, 0, screenY, screenZ - .13);
const screenMat = new THREE.MeshStandardMaterial({ color: 0x5d5a64, emissive: 0x282531, emissiveIntensity: .55, roughness: .48 });
const screenSurface = box(screenW, screenH, .08, screenMat, 0, screenY, screenZ + .08);

// A real DOM YouTube player is attached to the same 3D plane as the physical
// cinema screen. CSS3DRenderer keeps its perspective locked to the camera as
// the player walks around the auditorium. The iframe never becomes a separate
// fullscreen/watch layer.
const SCREEN_CSS_W = 1600;
const SCREEN_CSS_H = Math.round(SCREEN_CSS_W * (screenH / screenW));
const screenVideoElement = document.createElement('div');
screenVideoElement.style.width = SCREEN_CSS_W + 'px';
screenVideoElement.style.height = SCREEN_CSS_H + 'px';
screenVideoElement.style.background = '#000';
screenVideoElement.style.overflow = 'hidden';
screenVideoElement.style.backfaceVisibility = 'hidden';
screenVideoElement.style.boxShadow = 'inset 0 0 0 2px rgba(0,0,0,.55)';
screenVideoElement.style.pointerEvents = 'none';

const screenPlayer = document.createElement('iframe');
screenPlayer.id = 'youtubePlayer';
screenPlayer.title = 'Maria 414 YouTube player';
screenPlayer.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
screenPlayer.setAttribute('allowfullscreen', '');
screenPlayer.referrerPolicy = 'strict-origin-when-cross-origin';
screenPlayer.style.width = '100%';
screenPlayer.style.height = '100%';
screenPlayer.style.border = '0';
screenPlayer.style.display = 'block';
screenPlayer.style.background = '#000';
screenPlayer.style.pointerEvents = 'none';
screenVideoElement.appendChild(screenPlayer);

const screenVideoObject = new CSS3DObject(screenVideoElement);
const screenCssScale = screenW / SCREEN_CSS_W;
screenVideoObject.position.set(0, screenY, screenZ + .16);
screenVideoObject.scale.setScalar(screenCssScale);
screenVideoObject.visible = false;
scene.add(screenVideoObject);

const curtainMat = new THREE.MeshStandardMaterial({ map: curtainTexture(), roughness: .83, side: THREE.DoubleSide });
for (const side of [-1, 1]) {
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(3.6, ROOM.height - .7), curtainMat);
  curtain.position.set(side * (screenW / 2 + 1.82), ROOM.height / 2, screenZ + .12);
  curtain.receiveShadow = true;
  scene.add(curtain);
}

box(ROOM.width - 1.4, .48, 6.2, new THREE.MeshStandardMaterial({ color: 0x160815, roughness: .75 }), 0, .24, -HALF_D + 3.15);
box(ROOM.width - 2.2, .12, 5.7, trimMat, 0, .52, -HALF_D + 3.15);

const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8b1739, roughness: .42 });
for (let x = -4; x <= 4; x += 2) {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.07, .10, 1.0, 12), trimMat);
  post.position.set(x, 1.0, -HALF_D + 6.3);
  scene.add(post);
  if (x < 4) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 1.42, -HALF_D + 6.3),
      new THREE.Vector3(x + 1, 1.18, -HALF_D + 6.3),
      new THREE.Vector3(x + 2, 1.42, -HALF_D + 6.3)
    ]);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, .045, 8, false), ropeMat));
  }
}

const marqueeTex = makeTextTexture(['414 CINEMA', 'MARIA 414'], { width: 1200, height: 300, fontSize: 92, color: '#ffd76b' });
const marquee = new THREE.Mesh(
  new THREE.PlaneGeometry(10.5, 2.6),
  new THREE.MeshBasicMaterial({ map: marqueeTex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
);
marquee.position.set(0, 9.1, -HALF_D + .72);
scene.add(marquee);

function createSeat(x, z, rowIndex) {
  const root = new THREE.Group();
  const velvet = new THREE.MeshStandardMaterial({
    color: rowIndex % 2 ? 0x3c0d28 : 0x43102e,
    roughness: .76,
    metalness: .03
  });
  const metal = new THREE.MeshStandardMaterial({ color: 0x171118, metalness: .62, roughness: .33 });
  const cushion = box(1.1, .26, .92, velvet, 0, .72, 0, root);
  cushion.rotation.x = -.08;
  const back = box(1.12, 1.3, .24, velvet, 0, 1.42, .36, root);
  back.rotation.x = -.12;
  box(.13, .54, .95, metal, -.68, .86, 0, root);
  box(.13, .54, .95, metal, .68, .86, 0, root);
  box(.92, .08, .75, new THREE.MeshStandardMaterial({ color: 0x2a1628, roughness: .7 }), 0, .31, .05, root);
  root.position.set(x, 0, z);
  scene.add(root);
  colliders.push({ x, z, r: .72 });
}

const seatRows = [
  { z: -8.2, count: 10 },
  { z: -4.7, count: 12 },
  { z: -1.2, count: 12 },
  { z: 2.3, count: 12 },
  { z: 5.8, count: 12 },
  { z: 9.3, count: 12 },
  { z: 12.8, count: 10 }
];

for (let r = 0; r < seatRows.length; r++) {
  const { z, count } = seatRows[r];
  const xs = [];
  for (let i = 0; i < count; i++) {
    const x = (i - (count - 1) / 2) * 1.65;
    if (Math.abs(x) < 1.25) continue;
    xs.push(x);
  }
  for (const x of xs) createSeat(x, z, r);
  for (const side of [-1, 1]) {
    const light = box(.18, .055, 1.3, new THREE.MeshBasicMaterial({ color: 0xffd76b }), side * 1.25, .032, z, scene);
    light.material.transparent = true;
    light.material.opacity = .48;
  }
}

const aisleGlowMat = new THREE.MeshBasicMaterial({ color: 0x7b41c9, transparent: true, opacity: .22 });
box(.06, .025, 28, aisleGlowMat, -1.3, .02, 4, scene);
box(.06, .025, 28, aisleGlowMat, 1.3, .02, 4, scene);

const kiosk = new THREE.Group();
kiosk.position.set(-10.8, 0, 18.2);
box(3.3, 1.05, 2.1, blackMetal, 0, .53, 0, kiosk);
box(3.05, .16, 1.86, violetMat, 0, 1.14, 0, kiosk);
const kioskScreen = new THREE.Mesh(
  new THREE.PlaneGeometry(2.45, 1.15),
  new THREE.MeshBasicMaterial({ map: makeTextTexture(['MARIA 414', 'ARCHIVE'], { width: 900, height: 320, fontSize: 86, color: '#d7b3ff', glow: '#8a4bd8' }), transparent: true })
);
kioskScreen.position.set(0, 2.05, -.58);
kioskScreen.rotation.x = -.24;
kiosk.add(kioskScreen);
scene.add(kiosk);
colliders.push({ x: kiosk.position.x, z: kiosk.position.z, r: 2.2 });

const entryArch = new THREE.Group();
entryArch.position.set(0, 0, HALF_D - .7);
box(5.8, .5, .8, trimMat, 0, 4.9, 0, entryArch);
box(.55, 5.0, .8, blackMetal, -2.65, 2.5, 0, entryArch);
box(.55, 5.0, .8, blackMetal, 2.65, 2.5, 0, entryArch);
const exitLabel = new THREE.Mesh(
  new THREE.PlaneGeometry(4.8, 1.1),
  new THREE.MeshBasicMaterial({ map: makeTextTexture('RETURN TO ATROPA', { width: 1200, height: 250, fontSize: 82, color: '#ffd76b' }), transparent: true })
);
exitLabel.position.set(0, 5.0, -.46);
exitLabel.rotation.y = Math.PI;
entryArch.add(exitLabel);
scene.add(entryArch);

const hemi = new THREE.HemisphereLight(0xb789ff, 0x15060f, .65);
scene.add(hemi);
const ambient = new THREE.AmbientLight(0x3e244a, .68);
scene.add(ambient);
const screenLight = new THREE.PointLight(0xb789ff, 8, 26, 2);
screenLight.position.set(0, 5.4, -HALF_D + 4.8);
scene.add(screenLight);

for (const x of [-10.8, -5.4, 0, 5.4, 10.8]) {
  const l = new THREE.SpotLight(0xffdca0, 42, 19, .52, .48, 1.7);
  l.position.set(x, ROOM.height - .7, 3);
  l.target.position.set(x, 0, 1.5);
  l.castShadow = false;
  scene.add(l, l.target);
  const fixture = new THREE.Mesh(new THREE.CylinderGeometry(.23, .34, .18, 16), trimMat);
  fixture.position.copy(l.position);
  scene.add(fixture);
}

for (const side of [-1, 1]) {
  for (const z of [-15, -7, 1, 9, 17]) {
    const sconce = new THREE.PointLight(0xc08cff, 5.5, 8, 2);
    sconce.position.set(side * (HALF_W - .7), 4.2, z);
    scene.add(sconce);
    box(.16, 1.0, .38, trimMat, side * (HALF_W - .34), 4.2, z, scene);
  }
}

function updateCamera() {
  camera.position.copy(player);
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}
updateCamera();

function isBlocked(x, z) {
  if (x < -HALF_W + .75 || x > HALF_W - .75 || z < -HALF_D + .75 || z > HALF_D - .75) return true;
  for (const c of colliders) {
    if (Math.hypot(x - c.x, z - c.z) < c.r + .36) return true;
  }
  return false;
}

function nearKiosk() {
  return Math.hypot(player.x - kiosk.position.x, player.z - kiosk.position.z) < 4.7;
}

function nearExit() {
  return Math.hypot(player.x, player.z - (HALF_D - 1.4)) < 3.8;
}

function setPrompt(text) {
  els.prompt.textContent = text || '';
  els.prompt.style.opacity = text ? '1' : '0';
}

function togglePanel(force) {
  panelOpen = typeof force === 'boolean' ? force : !panelOpen;
  els.mediaPanel.classList.toggle('open', panelOpen);
  if (panelOpen && document.pointerLockElement) document.exitPointerLock?.();
}

function leaveCinema() {
  stopPlayback();
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'ATROPA_CINEMA_EXIT' }, '*');
      return;
    }
  } catch (_) {}
  if (history.length > 1) history.back();
  else location.href = '../';
}

function useAction() {
  if (nearExit()) {
    leaveCinema();
    return;
  }
  if (nearKiosk()) {
    togglePanel(true);
    return;
  }
  if (player.z < -12) {
    togglePanel(true);
  }
}

function playerOrigin() {
  return location.origin && location.origin !== 'null' ? '&origin=' + encodeURIComponent(location.origin) : '';
}

function startPlayback(item) {
  currentMedia = item;
  panelOpen = false;
  screenPaused = false;
  els.mediaPanel.classList.remove('open');

  let src;
  if (item.live) {
    const channel = media.channel?.channelId || CHANNEL_ID;
    src = `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(channel)}&autoplay=1&rel=0&playsinline=1&modestbranding=1&enablejsapi=1${playerOrigin()}`;
  } else {
    src = `https://www.youtube.com/embed/${encodeURIComponent(item.id)}?autoplay=1&rel=0&playsinline=1&modestbranding=1&enablejsapi=1${playerOrigin()}`;
  }

  screenPlayer.src = src;
  screenVideoObject.visible = true;
  screenSurface.visible = false;
  els.nowPlaying.textContent = item.live ? 'â— MARIA 414 LIVE CHANNEL' : item.title;
  els.screenPause.textContent = 'Pause';
  els.screenControls.classList.add('active');


}

function sendYoutubeCommand(func) {
  try {
    screenPlayer.contentWindow?.postMessage(JSON.stringify({
      event: 'command',
      func,
      args: []
    }), '*');
  } catch (_) {}
}

function toggleScreenPause() {
  if (!currentMedia) return;
  screenPaused = !screenPaused;
  sendYoutubeCommand(screenPaused ? 'pauseVideo' : 'playVideo');
  els.screenPause.textContent = screenPaused ? 'Play' : 'Pause';
}

function stopPlayback() {
  currentMedia = null;
  screenPaused = false;
  screenPlayer.src = 'about:blank';
  screenVideoObject.visible = false;
  screenSurface.visible = true;
  els.screenControls.classList.remove('active');
  els.nowPlaying.textContent = '';
  els.screenPause.textContent = 'Pause';
}

function renderMediaList() {
  els.mediaList.innerHTML = '';
  const live = document.createElement('button');
  live.type = 'button';
  live.className = 'mediaCard live';
  live.innerHTML = `
    <span class="thumb" style="background-image:linear-gradient(135deg,#430b19,#13040c)"></span>
    <span class="tag"><span class="liveDot"></span>LIVE CHANNEL</span>
    <span class="title">${media.live?.title || 'MARIA 414 â€” LIVE'}<br><small style="color:#a98fb7;font-weight:700">plays the channel's current livestream whenever Maria is live</small></span>
  `;
  live.addEventListener('click', () => startPlayback({ live: true, title: media.live?.title || 'MARIA 414 â€” LIVE' }));
  els.mediaList.appendChild(live);

  for (const video of media.videos || []) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'mediaCard';
    card.innerHTML = `
      <span class="thumb" style="background-image:url('https://i.ytimg.com/vi/${video.id}/hqdefault.jpg')"></span>
      <span class="tag">${video.tag || 'MARIA 414 ARCHIVE'}</span>
      <span class="title">${video.title}</span>
    `;
    card.addEventListener('click', () => startPlayback(video));
    els.mediaList.appendChild(card);
  }
}
renderMediaList();

els.openLibrary.addEventListener('click', () => togglePanel());
els.exitCinema.addEventListener('click', leaveCinema);
els.screenPause.addEventListener('click', toggleScreenPause);
els.screenStop.addEventListener('click', stopPlayback);
els.screenChoose.addEventListener('click', () => togglePanel(true));
els.mobileE.addEventListener('click', useAction);

renderer.domElement.addEventListener('click', () => {
  if (panelOpen || matchMedia('(pointer:coarse)').matches) return;
  renderer.domElement.requestPointerLock?.();
});

addEventListener('mousemove', e => {
  if (panelOpen || document.pointerLockElement !== renderer.domElement) return;
  yaw -= e.movementX * .00235;
  pitch -= e.movementY * .00215;
  pitch = THREE.MathUtils.clamp(pitch, -1.08, .9);
});

addEventListener('keydown', e => {
  if (['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(e.code)) keys.add(e.code);
  if (e.code === 'KeyE') {
    e.preventDefault();
    useAction();
  }
  if (e.code === 'Escape' && panelOpen) {
    togglePanel(false);
  }
});
addEventListener('keyup', e => keys.delete(e.code));

let touchLook = null;
renderer.domElement.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' || panelOpen) return;
  if (e.clientX < innerWidth * .42 && e.clientY > innerHeight * .58) return;
  touchLook = { id: e.pointerId, x: e.clientX, y: e.clientY };
  renderer.domElement.setPointerCapture?.(e.pointerId);
});
renderer.domElement.addEventListener('pointermove', e => {
  if (!touchLook || touchLook.id !== e.pointerId || panelOpen) return;
  const dx = e.clientX - touchLook.x;
  const dy = e.clientY - touchLook.y;
  touchLook.x = e.clientX;
  touchLook.y = e.clientY;
  yaw -= dx * .0062;
  pitch -= dy * .0054;
  pitch = THREE.MathUtils.clamp(pitch, -1.08, .9);
});
renderer.domElement.addEventListener('pointerup', e => {
  if (touchLook?.id === e.pointerId) touchLook = null;
});

let stick = { active: false, id: null, x: 0, y: 0 };
function updateStick(e) {
  const r = els.stick.getBoundingClientRect();
  let dx = e.clientX - (r.left + r.width / 2);
  let dy = e.clientY - (r.top + r.height / 2);
  const max = r.width * .34;
  const mag = Math.hypot(dx, dy) || 1;
  if (mag > max) {
    dx = dx / mag * max;
    dy = dy / mag * max;
  }
  stick.x = dx / max;
  stick.y = dy / max;
  els.nub.style.transform = `translate(${dx}px,${dy}px)`;
}
els.stick.addEventListener('pointerdown', e => {
  stick.active = true;
  stick.id = e.pointerId;
  els.stick.setPointerCapture?.(e.pointerId);
  updateStick(e);
});
els.stick.addEventListener('pointermove', e => {
  if (stick.active && stick.id === e.pointerId) updateStick(e);
});
function clearStick(e) {
  if (stick.id !== e.pointerId) return;
  stick = { active: false, id: null, x: 0, y: 0 };
  els.nub.style.transform = 'translate(0,0)';
}
els.stick.addEventListener('pointerup', clearStick);
els.stick.addEventListener('pointercancel', clearStick);

function updateMovement(dt) {
  if (panelOpen) return;
  let forward = 0;
  let strafe = 0;
  if (keys.has('KeyW')) forward += 1;
  if (keys.has('KeyS')) forward -= 1;
  if (keys.has('KeyD')) strafe += 1;
  if (keys.has('KeyA')) strafe -= 1;
  if (stick.active) {
    forward += -stick.y;
    strafe += stick.x;
  }
  const len = Math.hypot(forward, strafe);
  if (len < .035) return;
  forward /= Math.max(1, len);
  strafe /= Math.max(1, len);
  const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight')) ? 7.1 : 4.5;
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const vx = (fx * forward + rx * strafe) * speed * dt;
  const vz = (fz * forward + rz * strafe) * speed * dt;
  const nx = player.x + vx;
  const nz = player.z + vz;
  if (!isBlocked(nx, player.z)) player.x = nx;
  if (!isBlocked(player.x, nz)) player.z = nz;
}

function updatePrompt() {
  if (panelOpen) {
    setPrompt('');
    return;
  }
  if (nearKiosk()) setPrompt('E / USE â€” MARIA 414 ARCHIVE');
  else if (nearExit()) setPrompt('E / USE â€” RETURN TO ATROPA');
  else if (player.z < -12) setPrompt('E / USE â€” CHOOSE WHAT PLAYS ON THE 414 SCREEN');
  else setPrompt('');
}

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(.05, Math.max(.001, (now - lastFrame) / 1000));
  lastFrame = now;
  updateMovement(dt);
  updateCamera();
  updatePrompt();

  const t = now * .001;
  screenLight.intensity = 7.2 + Math.sin(t * .72) * .8;
  marquee.material.opacity = .9 + Math.sin(t * 1.3) * .08;

  renderer.render(scene, camera);
  cssRenderer.render(scene, camera);
}
requestAnimationFrame(animate);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.65));
  cssRenderer.setSize(innerWidth, innerHeight);
});

setTimeout(() => {
  els.loading.style.transition = 'opacity .45s ease';
  els.loading.style.opacity = '0';
  setTimeout(() => els.loading.remove(), 480);
}, 900);

try {
  window.parent?.postMessage?.({ type: 'ATROPA_CINEMA_READY' }, '*');
} catch (_) {}


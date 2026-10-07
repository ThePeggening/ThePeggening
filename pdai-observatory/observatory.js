import * as THREE from 'three';

const DATA_ROOT = '../data/pdai-research/';
const els = {
  stage: document.getElementById('stage'),
  quest: document.getElementById('quest'),
  prompt: document.getElementById('prompt'),
  panel: document.getElementById('panel'),
  panelTitle: document.getElementById('panelTitle'),
  panelMeta: document.getElementById('panelMeta'),
  panelBody: document.getElementById('panelBody'),
  panelClose: document.getElementById('panelClose'),
  archiveBtn: document.getElementById('archiveBtn'),
  sourceBtn: document.getElementById('sourceBtn'),
  returnBtn: document.getElementById('returnBtn'),
  resetBtn: document.getElementById('resetBtn'),
  loading: document.getElementById('loading'),
  stick: document.getElementById('stick'),
  nub: document.getElementById('nub'),
  mobileE: document.getElementById('mobileE')
};

const [manifest, highlights] = await Promise.all([
  fetch(DATA_ROOT + 'manifest.json', { cache: 'force-cache' }).then(r => {
    if (!r.ok) throw new Error('research manifest ' + r.status);
    return r.json();
  }),
  fetch(DATA_ROOT + 'highlights.json', { cache: 'force-cache' }).then(r => {
    if (!r.ok) throw new Error('research highlights ' + r.status);
    return r.json();
  })
]);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02090d);
scene.fog = new THREE.FogExp2(0x04151c, 0.0074);

const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.05, 240);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.65));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.30;
renderer.domElement.style.touchAction = 'none';
els.stage.appendChild(renderer.domElement);

const ROOM = { width: 74, depth: 88, height: 18 };
const HALF_W = ROOM.width / 2;
const HALF_D = ROOM.depth / 2;
const EYE = 1.72;
const player = new THREE.Vector3(0, EYE, 35);
let yaw = 0;
let pitch = -0.02;
let panelOpen = false;
let lastFrame = performance.now();
let lastPanelRender = 0;
const keys = new Set();
const colliders = [];
const interactables = [];
const loadedDocs = new Map();

const theme = {
  floor: 0x06151a,
  wall: 0x0a1c22,
  cyan: 0x55e7da,
  cyan2: 0x8dfff2,
  purple: 0xb88cff,
  gold: 0xffd76b,
  orange: 0xff9b54,
  white: 0xe9fffc
};

function material(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? .62,
    metalness: opts.metalness ?? .18,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0
  });
}

const matFloor = material(theme.floor, { roughness: .72, metalness: .10 });
const matWall = material(theme.wall, { roughness: .68, metalness: .12 });
const matMetal = material(0x0b1d23, { roughness: .34, metalness: .78 });
const matCyan = material(0x0c3b40, { roughness: .32, metalness: .42, emissive: theme.cyan, emissiveIntensity: .22 });
const matGold = material(0x3b2c0e, { roughness: .36, metalness: .55, emissive: theme.gold, emissiveIntensity: .24 });
const matOrange = material(0x3a1a09, { roughness: .40, metalness: .38, emissive: theme.orange, emissiveIntensity: .24 });
const matStructure = material(0x0a1b20, { roughness: .36, metalness: .58 });
const matStructure2 = material(0x103039, { roughness: .30, metalness: .48 });
const matInset = material(0x02090c, { roughness: .72, metalness: .18 });
const matFloorGloss = material(0x0a242a, { roughness: .24, metalness: .46 });
const matFloorMatte = material(0x031014, { roughness: .82, metalness: .12 });
const matWarmMetal = material(0x43230b, { roughness: .30, metalness: .52, emissive: 0xff9b54, emissiveIntensity: .13 });

// Information surfaces must stay readable under every spotlight.
// MeshBasicMaterial means no reflections/specular hot-spots on the actual text boards.
const matDisplayCyan = new THREE.MeshBasicMaterial({ color: 0x031216, toneMapped: false });
const matDisplayPurple = new THREE.MeshBasicMaterial({ color: 0x100a18, toneMapped: false });
const matDisplayGold = new THREE.MeshBasicMaterial({ color: 0x171205, toneMapped: false });
const matDisplayOrange = new THREE.MeshBasicMaterial({ color: 0x190b05, toneMapped: false });
const matDisplayNeutral = new THREE.MeshBasicMaterial({ color: 0x050b0e, toneMapped: false });
const pulseMaterials = [];
const spinObjects = [];
const bobObjects = [];
let ambientParticles = null;
let centralBeam = null;
let atropaBeam = null;

function box(w, h, d, mat, x, y, z, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function lineBetween(a, b, color = theme.cyan, opacity = .42) {
  const g = new THREE.BufferGeometry().setFromPoints([a, b]);
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const line = new THREE.Line(g, m);
  scene.add(line);
  return line;
}

function canvasTexture(lines, opts = {}) {
  const c = document.createElement('canvas');
  c.width = opts.width || 1200;
  c.height = opts.height || 360;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  if (opts.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  const arr = Array.isArray(lines) ? lines : [lines];
  const sizes = opts.sizes || arr.map((_, i) => i === 0 ? (opts.fontSize || 82) : (opts.subSize || 40));
  ctx.textAlign = opts.align || 'center';
  ctx.textBaseline = 'middle';
  let total = sizes.reduce((a, b) => a + b * 1.15, 0);
  let y = (c.height - total) / 2;
  for (let i = 0; i < arr.length; i++) {
    const size = sizes[i];
    y += size * .55;
    ctx.font = (i === 0 ? '900 ' : '700 ') + size + 'px Arial';
    ctx.fillStyle = i === 0 ? (opts.color || '#d9fff9') : (opts.subColor || '#7da6ab');
    ctx.shadowColor = opts.glow || 'rgba(85,231,218,.25)';
    ctx.shadowBlur = opts.blur ?? 18;
    const x = opts.align === 'left' ? 28 : c.width / 2;
    ctx.fillText(arr[i], x, y, c.width - 50);
    y += size * .60;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

function label(lines, w, h, x, y, z, opts = {}) {
  const tex = canvasTexture(lines, opts);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
  );
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

function addInteractable(id, x, z, radius, prompt, action) {
  interactables.push({ id, pos: new THREE.Vector3(x, 0, z), radius, prompt, action });
}

function htmlEscape(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function badge(category) {
  const c = category === 'observed' ? 'observed' : category === 'requirement' ? 'requirement' : 'interpretation';
  const text = c === 'observed' ? 'OBSERVED' : c === 'requirement' ? 'OPERATING REQUIREMENT' : 'INTERPRETATION';
  return '<span class="badge ' + c + '">' + text + '</span>';
}

function panel(title, meta, body) {
  panelOpen = true;
  els.panelTitle.textContent = title;
  els.panelMeta.textContent = meta || '';
  els.panelBody.innerHTML = body;
  els.panel.classList.add('open');
  try { document.exitPointerLock?.(); } catch (_) {}
}

function closePanel() {
  panelOpen = false;
  els.panel.classList.remove('open');
}

function sourceLink(page) {
  return DATA_ROOT + manifest.sourcePdf + '#page=' + (page || 1);
}

function showThesis() {
  const t = highlights.thesis;
  const route = highlights.route.steps.map((s, i) =>
    '<div class="phaseRow"><div class="phaseNo">' + (i + 1) + '</div><div><div class="phaseName">' + htmlEscape(s) + '</div></div></div>'
  ).join('');
  panel(
    'THE WORKING THESIS',
    'Main report · page ' + t.page + ' · 4 October 2026',
    '<div class="notice">' + htmlEscape(highlights.source.boundary) + '</div>' +
    badge(t.category) +
    '<div class="card"><h3>PROPOSED RECONSTRUCTION</h3><p>' + htmlEscape(t.text) + '</p></div>' +
    '<div class="card"><h3>TWO-SIDED POLICY</h3><p>' + htmlEscape(t.policy) + '</p></div>' +
    '<div class="card"><h3>PROPOSED ROUTE</h3>' + route + '<div class="source">Research source: page ' + highlights.route.page + '</div></div>' +
    '<p><a href="' + sourceLink(t.page) + '" target="_blank" rel="noopener" style="color:#55e7da">Open source PDF at this section ↗</a></p>'
  );
  advanceQuest('thesis');
}

function showEvidence() {
  const cards = highlights.evidenceCategories.map(x =>
    '<div class="card">' + badge(x.id) + '<h3>' + htmlEscape(x.label) + '</h3><p>' + htmlEscape(x.text) + '</p><div class="source">Source: page ' + x.page + '</div></div>'
  ).join('');
  panel(
    'EVIDENCE CLASSIFICATION',
    'The paper explicitly separates what was observed from what is inferred or still required.',
    '<div class="notice">This room keeps the paper’s own claim boundaries visible. A research hypothesis is not displayed as a deployed fact.</div>' + cards
  );
  advanceQuest('evidence');
}

function showPhases() {
  const rows = highlights.phases.map((p, i) =>
    '<div class="phaseRow"><div class="phaseNo">' + (i + 1) + '</div><div><div class="phaseName">' + htmlEscape(p.name) + '</div><div class="phaseText">' + htmlEscape(p.text) + '</div><div class="source">Page ' + p.page + '</div></div></div>'
  ).join('');
  panel(
    'FIVE-PHASE CONSTRUCTION',
    'Proposed actions and observable milestones',
    '<div class="notice">The paper states these phases can overlap; selected routes may become usable before the whole network is commissioned.</div>' + rows
  );
  advanceQuest('phases');
}

function showStability() {
  const r = highlights.replenishment;
  const branches = r.branches.map((x, i) =>
    '<div class="phaseRow"><div class="phaseNo">' + (i + 1) + '</div><div class="phaseText">' + htmlEscape(x) + '</div></div>'
  ).join('');
  panel(
    r.title,
    'Main report · page ' + r.page,
    badge(r.category) +
    '<div class="card"><h3>AVAILABLE pDAI</h3>' + branches + '</div>' +
    '<div class="card"><h3>RETURN PATH</h3><p>' + htmlEscape(r.return) + '</p></div>'
  );
}

function showParticipants() {
  const cards = highlights.participants.map(p =>
    '<div class="card"><h3>' + htmlEscape(p.name) + '</h3><p>' + htmlEscape(p.benefit) + '</p></div>'
  ).join('');
  panel(
    'WHO IS THE PROPOSED SERVICE FOR?',
    'Participant outcomes described by the paper',
    '<div class="notice">Changing one group’s position does not establish a gain for every holder. These are proposed benefits and measurements, not guarantees.</div>' + cards
  );
}

function showAtropa() {
  const a = highlights.atropa;
  const pools = a.pools.map(p =>
    '<div class="pool"><b>' + htmlEscape(p.pair) + '</b><div>' + htmlEscape(p.address) + '</div><div>' + htmlEscape(p.reserves) + '</div><div>LP at conventional dead address: ' + htmlEscape(p.deadLp) + '</div></div>'
  ).join('');
  panel(
    'ATROPA · APPENDIX 27',
    'Pages ' + a.startPage + '-' + a.endPage + ' · checkpoint block ' + a.checkpoint.block,
    badge(a.category) +
    '<div class="card"><h3>DIRECT FINDING</h3><p>' + htmlEscape(a.finding) + '</p><div class="source">ATROPA token: ' + htmlEscape(a.token) + '</div></div>' +
    '<div class="card"><h3>SAMPLED PULSEX V1 CONNECTIONS</h3>' + pools + '</div>' +
    '<div class="card"><h3>HISTORICAL USE</h3><p>' + htmlEscape(a.historicalTrade) + '</p></div>' +
    '<div class="card"><h3>ILLUSTRATIVE ROUTE</h3><p>' + htmlEscape(a.illustrativeRoute) + '</p></div>' +
    '<div class="notice">The source explicitly says pair existence is not a minimum-liquidity guarantee, the route estimate is not a router execution simulation, and token counts are not dollar claims.</div>' +
    '<p><button class="smallBtn" id="openAppendix27">Read complete Appendix 27</button> <a href="' + sourceLink(a.startPage) + '" target="_blank" rel="noopener" style="color:#55e7da">Open source PDF ↗</a></p>'
  );
  document.getElementById('openAppendix27')?.addEventListener('click', () => void openDocument(manifest.appendices.find(x => x.number === 27)));
  advanceQuest('atropa');
}

async function loadDoc(desc) {
  const key = desc.file;
  if (loadedDocs.has(key)) return loadedDocs.get(key);
  const r = await fetch(DATA_ROOT + key, { cache: 'force-cache' });
  if (!r.ok) throw new Error('research document ' + r.status);
  const data = await r.json();
  loadedDocs.set(key, data);
  if (loadedDocs.size > 8) {
    const first = loadedDocs.keys().next().value;
    loadedDocs.delete(first);
  }
  return data;
}

async function openDocument(desc) {
  if (!desc) return;
  panel('LOADING RESEARCH…', desc.title || '', '<div class="card"><p>Loading ' + htmlEscape(desc.file) + '…</p></div>');
  try {
    const data = await loadDoc(desc);
    const pageLabel = data.startPage === data.endPage ? 'page ' + data.startPage : 'pages ' + data.startPage + '-' + data.endPage;
    panel(
      data.number ? 'APPENDIX ' + String(data.number).padStart(2, '0') : 'MAIN REPORT',
      (data.title || manifest.title) + ' · ' + pageLabel,
      '<div class="card"><h3>' + htmlEscape(data.title || manifest.title) + '</h3><div id="docText">' + htmlEscape(data.text || '') + '</div></div>' +
      '<p><a href="' + sourceLink(data.startPage || 1) + '" target="_blank" rel="noopener" style="color:#55e7da">Open source PDF at ' + pageLabel + ' ↗</a></p>'
    );
  } catch (e) {
    panel('RESEARCH LOAD ERROR', desc.title || '', '<div class="notice">' + htmlEscape(e?.message || e) + '</div>');
  }
}

function descriptorByFile(file) {
  if (file === manifest.mainReport.file) return { ...manifest.mainReport, title: manifest.title };
  return manifest.appendices.find(a => a.file === file);
}

function bindDocButtons() {
  document.querySelectorAll('.docItem[data-file]').forEach(btn => {
    btn.addEventListener('click', () => void openDocument(descriptorByFile(btn.dataset.file)));
  });
}

function archiveShell() {
  panel(
    '73 APPENDICES · SEARCHABLE ARCHIVE',
    manifest.pages + ' pages · ' + manifest.appendices.length + ' appendices · external research files',
    '<div class="notice">Searches the full main report + 73 appendices. Results are source text from the supplied research document.</div>' +
    '<div id="searchBox"><input id="searchInput" placeholder="Search Atropa, Aave, Curve, Portal, wallet, tx hash…" autocomplete="off" spellcheck="false"><button id="searchGo" class="smallBtn">SEARCH</button></div>' +
    '<div id="searchStatus"></div><div id="searchResults"></div>'
  );
  const input = document.getElementById('searchInput');
  document.getElementById('searchGo')?.addEventListener('click', () => void runArchiveSearch(input?.value || ''));
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') void runArchiveSearch(input.value); });
  const list = manifest.appendices.map(d =>
    '<button class="docItem" data-file="' + htmlEscape(d.file) + '"><b>APPENDIX ' + String(d.number).padStart(2, '0') + ' · ' + htmlEscape(d.title) + '</b><span>Pages ' + d.startPage + '-' + d.endPage + '</span></button>'
  ).join('');
  document.getElementById('searchResults').innerHTML =
    '<button class="docItem" data-file="' + manifest.mainReport.file + '"><b>MAIN REPORT · ' + htmlEscape(manifest.title) + '</b><span>Pages ' + manifest.mainReport.startPage + '-' + manifest.mainReport.endPage + '</span></button>' + list;
  bindDocButtons();
  advanceQuest('archive');
}

async function runArchiveSearch(raw) {
  const q = String(raw || '').trim().toLowerCase();
  if (q.length < 2) return;
  const terms = q.split(/\s+/).filter(Boolean);
  const status = document.getElementById('searchStatus');
  const results = document.getElementById('searchResults');
  if (!status || !results) return;
  status.textContent = 'Scanning 74 research documents…';
  results.innerHTML = '';
  const descs = [{ ...manifest.mainReport, title: manifest.title }, ...manifest.appendices];
  const hits = [];
  for (let start = 0; start < descs.length; start += 12) {
    const batch = descs.slice(start, start + 12);
    const docs = await Promise.all(batch.map(d => loadDoc(d).then(data => ({ d, data })).catch(() => null)));
    for (const item of docs) {
      if (!item) continue;
      const hay = (item.d.title + '\n' + (item.data.text || '')).toLowerCase();
      if (terms.every(t => hay.includes(t))) {
        const first = Math.min(...terms.map(t => hay.indexOf(t)).filter(i => i >= 0));
        const text = item.data.text || '';
        const excerpt = text.slice(Math.max(0, first - 120), Math.min(text.length, first + 340)).replace(/\s+/g, ' ');
        hits.push({ ...item.d, excerpt });
      }
    }
    status.textContent = 'Scanning… ' + Math.min(start + batch.length, descs.length) + ' / ' + descs.length;
    await new Promise(r => setTimeout(r, 0));
  }
  status.textContent = hits.length + ' matching research document' + (hits.length === 1 ? '' : 's');
  results.innerHTML = hits.length
    ? hits.slice(0, 100).map(h => '<button class="docItem" data-file="' + htmlEscape(h.file) + '"><b>' + (h.number ? 'APPENDIX ' + String(h.number).padStart(2, '0') + ' · ' : 'MAIN REPORT · ') + htmlEscape(h.title) + '</b><span>' + htmlEscape(h.excerpt) + '</span></button>').join('')
    : '<div class="card"><p>No matching research document.</p></div>';
  bindDocButtons();
}

const QUESTS = [
  { id: 'thesis', title: 'READ THE THESIS', text: 'Follow the gold signal to the central pDAI model and inspect the working thesis.' },
  { id: 'evidence', title: 'SEPARATE EVIDENCE FROM INTERPRETATION', text: 'Visit the Evidence Wall and inspect Observed / Interpretation / Operating Requirement.' },
  { id: 'phases', title: 'TRACE THE FIVE PHASES', text: 'Inspect the five construction stations along the east gallery.' },
  { id: 'atropa', title: 'ENTER THE ATROPA WING', text: 'Inspect Appendix 27 and the sampled pDAI / pUSDC / pWETH connections.' },
  { id: 'archive', title: 'SEARCH THE RESEARCH', text: 'Use the archive terminal to search all 73 appendices.' },
  { id: 'done', title: 'RESEARCH WALKTHROUGH COMPLETE', text: 'The full archive remains available from the terminal and Atropagram.' }
];
let questIndex = 0;
try { questIndex = Math.max(0, Math.min(QUESTS.length - 1, Number(localStorage.getItem('pdai_observatory_quest_v1') || 0))); } catch (_) {}

function advanceQuest(id) {
  const expected = QUESTS[questIndex]?.id;
  if (id !== expected) return;
  questIndex = Math.min(QUESTS.length - 1, questIndex + 1);
  try { localStorage.setItem('pdai_observatory_quest_v1', String(questIndex)); } catch (_) {}
  updateQuest();
}

function updateQuest() {
  const q = QUESTS[questIndex] || QUESTS[QUESTS.length - 1];
  els.quest.textContent = q.title + ' · ' + q.text;
}
updateQuest();

function resetQuest() {
  questIndex = 0;
  try { localStorage.removeItem('pdai_observatory_quest_v1'); } catch (_) {}
  updateQuest();
}

function leaveObservatory() {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'ATROPA_PDAI_RESEARCH_EXIT' }, '*');
      return;
    }
  } catch (_) {}
  if (history.length > 1) history.back();
  else location.href = '../';
}

const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, ROOM.depth), matFloor);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
box(ROOM.width, ROOM.height, .5, matWall, 0, ROOM.height / 2, -HALF_D);
box(ROOM.width, ROOM.height, .5, matWall, 0, ROOM.height / 2, HALF_D);
box(.5, ROOM.height, ROOM.depth, matWall, -HALF_W, ROOM.height / 2, 0);
box(.5, ROOM.height, ROOM.depth, matWall, HALF_W, ROOM.height / 2, 0);
box(ROOM.width, .35, ROOM.depth, material(0x010406, { roughness: .9 }), 0, ROOM.height, 0);

const floorGrid = new THREE.GridHelper(ROOM.depth, 44, theme.cyan, 0x12363b);
floorGrid.position.y = .025;
floorGrid.material.opacity = .16;
floorGrid.material.transparent = true;
scene.add(floorGrid);
scene.add(new THREE.HemisphereLight(0xb6fff7, 0x071217, .92));
scene.add(new THREE.AmbientLight(0x4c7a82, .88));
for (const x of [-28, -14, 0, 14, 28]) {
  const l = new THREE.PointLight(theme.cyan, 5.5, 24, 2);
  l.position.set(x, 12.5, 2);
  scene.add(l);
}

// Broad soft fill from the entrance and rear archive gives dark materials readable faces.
{
  const frontFill = new THREE.DirectionalLight(0xc9fff8, 1.05);
  frontFill.position.set(0, 12, 34);
  scene.add(frontFill);
  const rearFill = new THREE.DirectionalLight(0x88b8ff, .55);
  rearFill.position.set(-18, 10, -38);
  scene.add(rearFill);
  const warmFill = new THREE.DirectionalLight(0xffb46b, .42);
  warmFill.position.set(28, 8, -26);
  scene.add(warmFill);
}

// ---------------------------------------------------------------------------
// INTERIOR ART PASS — architectural shell, lighting, props, atmosphere
// ---------------------------------------------------------------------------
const stripCyanMat = new THREE.MeshBasicMaterial({ color: theme.cyan2, transparent: true, opacity: .82 });
const stripGoldMat = new THREE.MeshBasicMaterial({ color: theme.gold, transparent: true, opacity: .72 });
const stripPurpleMat = new THREE.MeshBasicMaterial({ color: theme.purple, transparent: true, opacity: .50 });
const stripOrangeMat = new THREE.MeshBasicMaterial({ color: theme.orange, transparent: true, opacity: .64 });

function strip(w, h, d, mat, x, y, z) {
  const m = box(w, h, d, mat, x, y, z);
  m.castShadow = false;
  m.receiveShadow = false;
  return m;
}

function framedDisplay(w, h, x, y, z, faceMat, accentMat, depth = .18) {
  // Deep outer casing catches room lighting; inner face never does.
  box(w + .62, h + .62, depth + .20, matStructure, x, y, z - .09);
  box(w, h, depth, faceMat, x, y, z + .06);
  strip(w + .18, .055, .07, accentMat, x, y + h / 2 + .18, z + depth / 2 + .12);
  strip(w + .18, .055, .07, accentMat, x, y - h / 2 - .18, z + depth / 2 + .12);
  strip(.055, h + .18, .07, accentMat, x - w / 2 - .18, y, z + depth / 2 + .12);
  strip(.055, h + .18, .07, accentMat, x + w / 2 + .18, y, z + depth / 2 + .12);
}

function neonArch(z, radius = 6.0, warm = false) {
  const glowMat = new THREE.MeshBasicMaterial({
    color: warm ? theme.orange : theme.cyan2,
    transparent: true, opacity: warm ? .64 : .72,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const arch = new THREE.Mesh(new THREE.TorusGeometry(radius, .10, 10, 64, Math.PI), glowMat);
  arch.position.set(0, .72, z);
  scene.add(arch);
  box(.34, radius + .2, .48, matStructure, -radius, (radius + .2) / 2, z);
  box(.34, radius + .2, .48, matStructure, radius, (radius + .2) / 2, z);
  strip(.05, radius - .4, .08, warm ? stripOrangeMat : stripCyanMat, -radius + .19, radius / 2, z + .25);
  strip(.05, radius - .4, .08, warm ? stripOrangeMat : stripCyanMat, radius - .19, radius / 2, z + .25);
  return arch;
}

function pillar(x, z, warm = false, height = 12.5) {
  box(.72, height, .72, warm ? matWarmMetal : matStructure, x, height / 2, z);
  box(1.08, .20, 1.08, warm ? matGold : matCyan, x, .12, z);
  box(1.02, .16, 1.02, warm ? matGold : matCyan, x, height - .08, z);
  strip(.10, height - 1.0, .10, warm ? stripGoldMat : stripCyanMat, x + .37, height / 2, z + .37);
}

function wallBay(side, z, accent = 'cyan') {
  const x = side * (HALF_W - .46);
  const led = accent === 'gold' ? stripGoldMat : accent === 'purple' ? stripPurpleMat : accent === 'orange' ? stripOrangeMat : stripCyanMat;
  const dark = accent === 'orange' ? matWarmMetal : matStructure2;
  box(.24, 7.2, 7.4, dark, x - side * .12, 4.25, z);
  box(.34, 7.9, .38, matStructure, x - side * .18, 4.55, z - 3.65);
  box(.34, 7.9, .38, matStructure, x - side * .18, 4.55, z + 3.65);
  strip(.10, 6.3, .16, led, x - side * .38, 4.2, z - 3.20);
  strip(.10, 6.3, .16, led, x - side * .38, 4.2, z + 3.20);
  strip(.10, .11, 6.1, led, x - side * .39, 7.35, z);
}

function serverTower(x, z, warm = false, rot = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  scene.add(g);
  const shell = warm ? matWarmMetal : matStructure;
  box(2.0, 5.4, 1.65, shell, 0, 2.7, 0, g);
  box(1.65, 4.7, .10, matInset, 0, 2.72, .84, g);
  const ledMat = warm ? stripOrangeMat : stripCyanMat;
  for (let y = .7; y <= 4.7; y += .62) {
    strip(1.28, .05, .04, ledMat, 0, y, .91, g);
  }
  strip(.07, 4.6, .04, warm ? stripGoldMat : stripPurpleMat, -.72, 2.7, .92, g);
  return g;
}

// Main ceiling ribs turn the empty box into a facility.
for (let z = -38; z <= 34; z += 8) {
  box(ROOM.width - 4.0, .34, .54, matStructure, 0, 15.55, z);
  strip(ROOM.width - 6.0, .055, .11, (z % 16 === 0) ? stripGoldMat : stripCyanMat, 0, 15.30, z);
  for (const x of [-31, 31]) {
    box(.48, 2.9, .78, matStructure, x, 14.0, z);
  }
}

// Wall bays and structural columns.
for (const z of [-34, -24, -14, -4, 6, 16, 26]) {
  wallBay(-1, z, z < -20 ? 'purple' : 'cyan');
  wallBay(1, z, z < -20 ? 'orange' : 'cyan');
}
for (const z of [-36, -24, -12, 0, 12, 24, 36]) {
  pillar(-33.7, z, false, 11.8);
  pillar(33.7, z, z < -20, 11.8);
}

// Entry tunnel gives a clear architectural reveal into the main hall.
for (const z of [34.5, 30.5, 26.5, 22.5]) {
  box(11.8, .34, .60, matStructure2, 0, 8.0, z);
  box(.50, 8.0, .72, matStructure, -5.7, 4.0, z);
  box(.50, 8.0, .72, matStructure, 5.7, 4.0, z);
  strip(10.6, .06, .10, stripCyanMat, 0, 7.78, z + .06);
}
neonArch(18.5, 7.2, false);
neonArch(8.0, 8.0, false);
neonArch(-13.5, 8.6, false);
for (let z = 21; z <= 36; z += 3.1) {
  box(7.8, .10, 2.5, matFloorGloss, 0, .06, z);
  strip(.08, .025, 2.45, stripCyanMat, -3.82, .12, z);
  strip(.08, .025, 2.45, stripCyanMat, 3.82, .12, z);
}

// Main floor lanes / exhibit circulation.
for (let z = -27; z <= 18; z += 4.0) {
  box(7.4, .08, 3.5, (Math.round(z) % 8 === 0) ? matFloorGloss : matFloorMatte, 0, .045, z);
}
strip(.08, .025, 49, stripCyanMat, -3.82, .105, -4.5);
strip(.08, .025, 49, stripCyanMat, 3.82, .105, -4.5);

// Side gallery floor strips.
for (const x of [-20.0, 20.0]) {
  for (let z = -28; z <= 23; z += 5.2) {
    box(8.0, .075, 4.6, matFloorGloss, x, .045, z);
  }
  strip(.055, .025, 55, x < 0 ? stripPurpleMat : stripOrangeMat, x - 4.0, .105, -2.5);
  strip(.055, .025, 55, x < 0 ? stripPurpleMat : stripOrangeMat, x + 4.0, .105, -2.5);
}

// Low side benches and research consoles.
for (const [x, z, warm] of [
  [-28, 20, false], [-28, 9, false], [-28, -20, false],
  [28, 21, true], [28, -22, true], [15, 30, false], [-15, 30, false]
]) {
  box(5.2, .70, 1.45, warm ? matWarmMetal : matStructure2, x, .35, z);
  strip(4.5, .05, .08, warm ? stripOrangeMat : stripCyanMat, x, .73, z + .72);
}

// Transparent architectural screens fill empty volumes and catch zone colors.
for (const [x, y, z, w, h, color, rotY] of [
  [-13.5, 5.0, 13.0, 7.5, 4.4, theme.cyan, .18],
  [13.5, 5.0, 13.0, 7.5, 4.4, theme.cyan2, -.18],
  [-14.5, 5.2, -19.0, 7.0, 4.8, theme.purple, .14],
  [14.5, 5.2, -19.0, 7.0, 4.8, theme.orange, -.14]
]) {
  const pm = new THREE.MeshBasicMaterial({
    color, transparent:true, opacity:.055, side:THREE.DoubleSide,
    depthWrite:false, blending:THREE.AdditiveBlending
  });
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w,h), pm);
  pane.position.set(x,y,z); pane.rotation.y=rotY; scene.add(pane);
  const frameMat = color === theme.orange ? stripOrangeMat : color === theme.purple ? stripPurpleMat : stripCyanMat;
  strip(w,.045,.06,frameMat,x,y+h/2,z);
  strip(w,.045,.06,frameMat,x,y-h/2,z);
}

// Floor energy nodes make the approach readable even on dark mobile screens.
for (let z = 31; z >= -27; z -= 6.5) {
  const node = new THREE.Mesh(
    new THREE.RingGeometry(.22,.36,24),
    new THREE.MeshBasicMaterial({color: z < -12 ? theme.gold : theme.cyan2, transparent:true, opacity:.72, side:THREE.DoubleSide})
  );
  node.rotation.x=-Math.PI/2; node.position.set(0,.13,z); scene.add(node);
}

// Archive hardware / server banks.
for (const [x, z, warm, rot] of [
  [-7.7, -35.4, false, 0], [7.7, -35.4, false, 0],
  [-10.2, -31.0, false, .32], [10.2, -31.0, true, -.32],
  [-31.2, -29.2, false, 0], [31.0, -29.2, true, 0]
]) {
  serverTower(x, z, warm, rot);
}

// Ambient dust/data motes, one cheap Points draw-call.
{
  const count = 180;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const cyanColor = new THREE.Color(theme.cyan2);
  const goldColor = new THREE.Color(theme.gold);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = THREE.MathUtils.randFloatSpread(66);
    pos[i * 3 + 1] = THREE.MathUtils.randFloat(.7, 14.5);
    pos[i * 3 + 2] = THREE.MathUtils.randFloatSpread(80);
    const c = Math.random() < .82 ? cyanColor : goldColor;
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pm = new THREE.PointsMaterial({
    size: .06, vertexColors: true, transparent: true, opacity: .40,
    depthWrite: false, blending: THREE.AdditiveBlending
  });
  ambientParticles = new THREE.Points(g, pm);
  scene.add(ambientParticles);
}

// Zone spotlights.
for (const [x, y, z, tx, tz, color, power] of [
  [0, 14, 0, 0, -3, theme.cyan2, 95],
  [-27, 11, -4, -27, -10, theme.purple, 70],
  [27, 12, 4, 27, -2, theme.cyan, 72],
  [22, 13, -22, 22, -28, theme.orange, 95],
  [0, 12, -27, 0, -35, theme.cyan2, 78]
]) {
  const sp = new THREE.SpotLight(color, power, 32, .45, .55, 1.6);
  sp.position.set(x, y, z);
  sp.target.position.set(tx, 1.5, tz);
  scene.add(sp, sp.target);
}

label(['pDAI RESEARCH OBSERVATORY', 'PULSECHAIN · 04 OCTOBER 2026'], 25, 4, 0, 10.8, 40.2, { fontSize: 84, subSize: 34, color: '#d9fff9', subColor: '#6fcfc7' });
box(28, .18, 1.2, matCyan, 0, .10, 36);

const dais = new THREE.Group();
dais.position.set(0, 0, -3);
scene.add(dais);
const ringMat = new THREE.MeshStandardMaterial({ color: 0x0b4748, emissive: theme.cyan, emissiveIntensity: .42, metalness: .64, roughness: .24 });
for (const r of [4.5, 6.2, 8.1]) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, .08, 12, 96), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = .09;
  dais.add(ring);
}
const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(2.1, 3),
  new THREE.MeshStandardMaterial({ color: 0x10353b, emissive: theme.cyan, emissiveIntensity: .78, roughness: .26, metalness: .42, transparent: true, opacity: .92 })
);
core.position.y = 4.1;
dais.add(core);

const coreInner = new THREE.Mesh(
  new THREE.OctahedronGeometry(1.08, 1),
  new THREE.MeshBasicMaterial({ color: 0xeafffb, transparent:true, opacity:.88, toneMapped:false })
);
coreInner.position.y = 4.1;
dais.add(coreInner);
spinObjects.push({ obj: coreInner, speed: .34 });

const coreWire = new THREE.Mesh(
  new THREE.IcosahedronGeometry(2.55, 2),
  new THREE.MeshBasicMaterial({ color: theme.cyan2, wireframe:true, transparent:true, opacity:.15, toneMapped:false })
);
coreWire.position.y = 4.1;
dais.add(coreWire);
spinObjects.push({ obj: coreWire, speed: -.07 });

const halo = new THREE.Mesh(new THREE.TorusGeometry(3.4, .055, 10, 96), new THREE.MeshBasicMaterial({ color: theme.cyan2, transparent: true, opacity: .55 }));
halo.position.y = 4.1;
halo.rotation.x = Math.PI / 2;
dais.add(halo);
// Layered central research dais.
{
  const step1 = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 9.8, .32, 72), matStructure);
  step1.position.set(0, .16, -3); step1.receiveShadow = true; scene.add(step1);
  const step2 = new THREE.Mesh(new THREE.CylinderGeometry(7.3, 7.7, .34, 72), matFloorGloss);
  step2.position.set(0, .48, -3); step2.receiveShadow = true; scene.add(step2);
  const step3 = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.7, .35, 64), matStructure2);
  step3.position.set(0, .80, -3); scene.add(step3);

  const edge1 = new THREE.Mesh(new THREE.TorusGeometry(9.25, .055, 10, 96), new THREE.MeshBasicMaterial({ color: theme.cyan, transparent: true, opacity: .75 }));
  edge1.rotation.x = Math.PI / 2; edge1.position.set(0, .36, -3); scene.add(edge1);
  const edge2 = new THREE.Mesh(new THREE.TorusGeometry(7.05, .05, 10, 96), new THREE.MeshBasicMaterial({ color: theme.gold, transparent: true, opacity: .58 }));
  edge2.rotation.x = Math.PI / 2; edge2.position.set(0, .68, -3); scene.add(edge2);

  centralBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55, 2.9, 12.5, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: theme.cyan2, transparent: true, opacity: .055, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
  );
  centralBeam.position.set(0, 7.2, -3);
  scene.add(centralBeam);

  const ceilingDish = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.2, .34, 48), matStructure2);
  ceilingDish.position.set(0, 15.4, -3); scene.add(ceilingDish);
  const ceilingRing = new THREE.Mesh(new THREE.TorusGeometry(3.65, .09, 12, 72), new THREE.MeshBasicMaterial({ color: theme.cyan2, transparent: true, opacity: .76 }));
  ceilingRing.rotation.x = Math.PI / 2; ceilingRing.position.set(0, 15.18, -3); scene.add(ceilingRing);

  for (const [r, tilt, speed] of [[4.15,.25,.12],[5.15,-.35,-.09]]) {
    const rr = new THREE.Mesh(new THREE.TorusGeometry(r,.045,8,96), new THREE.MeshBasicMaterial({ color: r < 5 ? theme.cyan2 : theme.purple, transparent:true, opacity:.38 }));
    rr.position.set(0,4.1,-3);
    rr.rotation.set(Math.PI/2 + tilt, tilt*.4, 0);
    scene.add(rr);
    spinObjects.push({ obj: rr, speed });
  }
}

label(['pDAI', 'WORKING THESIS'], 8.4, 2.4, 0, 8.0, -3, { fontSize: 90, subSize: 36, color: '#cffff9' });
addInteractable('thesis', 0, 2.5, 8.5, 'E / USE — OPEN THE WORKING THESIS', showThesis);

const routeLabels = ['SOURCE / FINANCING', 'ACCEPTED LOCAL CLAIM', 'pDAI + STABLES + PLS', 'BIDS / OFFERS / CONVERSIONS', 'RESTORED CAPACITY'];
const routePositions = [[-10,3,-3],[-5.3,3,-12],[5.3,3,-12],[10,3,-3],[0,3,7]];
const routeMeshes = [];
for (let i = 0; i < routeLabels.length; i++) {
  const p = routePositions[i];
  const orb = new THREE.Mesh(new THREE.SphereGeometry(.72, 24, 16), new THREE.MeshStandardMaterial({ color: 0x123d42, emissive: i === 2 ? theme.gold : theme.cyan, emissiveIntensity: .55, roughness: .30 }));
  orb.position.set(p[0], p[1], p[2]);
  scene.add(orb);
  routeMeshes.push(orb);
  label(routeLabels[i], 4.8, 1.1, p[0], p[1] + 1.55, p[2], { fontSize: 46, color: i === 2 ? '#ffe7a5' : '#bffbf4' });
}
for (let i = 0; i < routePositions.length; i++) {
  lineBetween(new THREE.Vector3(...routePositions[i]), new THREE.Vector3(...routePositions[(i + 1) % routePositions.length]), i === 2 ? theme.gold : theme.cyan, .35);
}

// Suspended transparent data panes around the core add depth without texture cost.
const holoCards = [];
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2;
  const radius = i % 2 ? 6.7 : 5.6;
  const pm = new THREE.MeshBasicMaterial({
    color: i % 3 === 0 ? theme.gold : (i % 2 ? theme.purple : theme.cyan2),
    transparent: true, opacity: .085, depthWrite: false,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending
  });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.5), pm);
  card.position.set(Math.cos(a) * radius, 4.0 + (i % 2) * 1.5, -3 + Math.sin(a) * radius);
  card.lookAt(new THREE.Vector3(0, 4.2, -3));
  scene.add(card);
  holoCards.push(card);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,2.6,8), new THREE.MeshBasicMaterial({color:theme.cyan2,transparent:true,opacity:.30}));
  pole.position.set(card.position.x, card.position.y - 1.7, card.position.z);
  scene.add(pole);
}

// Evidence exhibit — recessed bay with physical frame and uplighting.
box(19.2, 10.3, .95, matStructure, -27, 5.55, -10.30);
box(17.8, 8.9, .48, matMetal, -27, 5.2, -9.74);
strip(18.2, .08, .10, stripPurpleMat, -27, 10.12, -9.42);
strip(18.2, .08, .10, stripCyanMat, -27, .68, -9.42);
for (const x of [-34.9, -19.1]) {
  box(.55, 9.6, .75, matStructure2, x, 5.2, -9.9);
  strip(.08, 8.3, .10, x < -27 ? stripPurpleMat : stripCyanMat, x + .28, 5.2, -9.40);
}
for (const x of [-31.6, -26.5, -21.4]) {
  const upl = new THREE.PointLight(x < -29 ? theme.cyan : x > -24 ? theme.gold : theme.purple, 6, 8, 2);
  upl.position.set(x, 1.0, -7.3); scene.add(upl);
}
framedDisplay(15.7, 2.45, -26.7, 8.42, -9.30, matDisplayNeutral, stripPurpleMat, .14);
label(['EVIDENCE WALL', 'OBSERVED · INTERPRETATION · REQUIREMENT'], 15.2, 2.35, -26.7, 8.4, -9.12, { fontSize: 70, subSize: 32, color: '#effffc', subColor: '#bcb4d9', glow:'rgba(0,0,0,0)', blur:0 });
const evidenceColors = [theme.cyan, theme.purple, theme.gold];
const evidenceIds = ['OBSERVED', 'INTERPRETATION', 'OPERATING REQUIREMENT'];
for (let i = 0; i < 3; i++) {
  const ex = -26.5 + (i - 1) * 5.2;
  const faceMat = i === 0 ? matDisplayCyan : i === 1 ? matDisplayPurple : matDisplayGold;
  const edgeMat = i === 0 ? stripCyanMat : i === 1 ? stripPurpleMat : stripGoldMat;
  framedDisplay(4.55, 2.75, ex, 4.0, -9.48, faceMat, edgeMat, .13);
  label(evidenceIds[i], 4.1, .88, ex, 4.1, -9.27, { fontSize: evidenceIds[i].length > 12 ? 34 : 44, color: '#ffffff', glow:'rgba(0,0,0,0)', blur:0 });
}
addInteractable('evidence', -27, -5.5, 8.5, 'E / USE — INSPECT EVIDENCE CLASSIFICATION', showEvidence);

box(19.2, 9.8, .95, matStructure, -27, 5.25, -29.3);
box(17.8, 8.4, .48, matMetal, -27, 5.0, -28.72);
strip(18.2, .08, .10, stripGoldMat, -27, 9.75, -28.42);
strip(18.2, .08, .10, stripCyanMat, -27, .72, -28.42);
framedDisplay(15.7, 2.45, -26.7, 8.02, -28.30, matDisplayCyan, stripGoldMat, .14);
label(['STABILITY LOOP', 'SUPPLY · REPLENISHMENT · CIRCULATION'], 15.2, 2.35, -26.7, 8.0, -28.12, { fontSize: 68, subSize: 30, color: '#ffffff', subColor:'#d6c995', glow:'rgba(0,0,0,0)', blur:0 });
addInteractable('stability', -27, -24.5, 7.5, 'E / USE — INSPECT STABILITY / REPLENISHMENT LOOP', showStability);

framedDisplay(15.6, 2.25, 26.5, 10.82, -2.12, matDisplayCyan, stripCyanMat, .12);
label(['FIVE PHASES', 'PROPOSED CONSTRUCTION PATH'], 15.0, 2.10, 26.5, 10.8, -1.94, { fontSize: 72, subSize: 30, color: '#ffffff', subColor:'#a9dbd7', glow:'rgba(0,0,0,0)', blur:0 });
const phaseZ = [12, 5, -2, -9, -16];
// Gallery spine and ceiling light path.
box(12.5, .22, 38, matFloorGloss, 26.7, .11, -2.0);
strip(.10, .025, 38, stripOrangeMat, 20.55, .24, -2.0);
strip(.10, .025, 38, stripCyanMat, 32.85, .24, -2.0);
for (let z = -18; z <= 14; z += 8) {
  box(12.6, .28, .42, matStructure, 26.7, 12.8, z);
  strip(11.4, .05, .08, stripCyanMat, 26.7, 12.59, z);
}
for (let i = 0; i < highlights.phases.length; i++) {
  const p = highlights.phases[i];
  const z = phaseZ[i];
  box(10.8, .34, 5.6, i === 3 ? matWarmMetal : matStructure2, 27, .18, z);
  box(10.1, 5.9, 1.05, matStructure, 27, 3.45, z);
  box(8.95, 4.70, .16, i === 3 ? matDisplayGold : matDisplayCyan, 27, 3.48, z + .57);
  strip(9.4, .07, .10, i === 3 ? stripGoldMat : stripCyanMat, 27, 6.32, z + .60);
  strip(9.4, .05, .10, i === 3 ? stripGoldMat : stripPurpleMat, 27, .62, z + .60);
  box(1.05, 1.55, 1.05, i === 3 ? matGold : matStructure2, 21.5, .78, z);
  const phaseLamp = new THREE.PointLight(i === 3 ? theme.gold : theme.cyan, 5.2, 7.5, 2);
  phaseLamp.position.set(21.5, 1.45, z); scene.add(phaseLamp);
  label([String(i + 1).padStart(2, '0'), p.name], 8.2, 1.95, 26.55, 4.3, z + .69, { fontSize: 62, subSize: 30, color: i === 3 ? '#fff0b9' : '#ffffff', subColor: i === 3 ? '#d8be72' : '#9bd4cf', glow:'rgba(0,0,0,0)', blur:0 });
  addInteractable('phase-' + i, 22.5, z, 5.5, 'E / USE — ' + p.name, () => {
    const row = '<div class="phaseRow"><div class="phaseNo">' + (i + 1) + '</div><div><div class="phaseName">' + htmlEscape(p.name) + '</div><div class="phaseText">' + htmlEscape(p.text) + '</div><div class="source">Source page ' + p.page + '</div></div></div>';
    panel('PHASE ' + (i + 1) + ' / 5', p.name, '<div class="notice">One phase in the paper’s proposed construction sequence.</div>' + row + '<p><button id="allPhases" class="smallBtn">SHOW ALL FIVE PHASES</button></p>');
    document.getElementById('allPhases')?.addEventListener('click', showPhases);
    advanceQuest('phases');
  });
}

box(20.0, 9.7, .92, matStructure, 25.5, 5.3, 29.35);
box(18.7, 8.5, .48, matMetal, 25.5, 5.0, 28.76);
strip(19.0, .08, .10, stripCyanMat, 25.5, 9.62, 28.46);
strip(19.0, .08, .10, stripGoldMat, 25.5, .75, 28.46);
framedDisplay(16.5, 2.35, 25.2, 8.12, 28.56, matDisplayNeutral, stripCyanMat, .13);
label(['PARTICIPANT OUTCOMES', 'HOLDERS · BORROWERS · LPs · USERS'], 16.0, 2.20, 25.2, 8.1, 28.75, { fontSize: 64, subSize: 30, color: '#ffffff', subColor:'#a9d8d4', glow:'rgba(0,0,0,0)', blur:0 });
addInteractable('participants', 25, 24, 7.8, 'E / USE — WHO IS THE PROPOSED SERVICE FOR?', showParticipants);

// Appendix 27 chamber — warm, denser, deliberately different from the cyan main hall.
box(25.5, 12.8, 1.05, matStructure, 22, 6.45, -30.5);
box(23.3, 11.1, .52, matWarmMetal, 22, 5.85, -29.75);
box(25.2, .34, 18.0, matFloorGloss, 22, .18, -24.5);
strip(24.0, .07, .11, stripOrangeMat, 22, 11.95, -29.40);
strip(24.0, .07, .11, stripGoldMat, 22, .82, -29.40);
for (const x of [11.4, 32.6]) {
  box(.72, 10.8, .88, matWarmMetal, x, 5.7, -29.65);
  strip(.08, 9.5, .10, stripOrangeMat, x + (x < 22 ? .38 : -.38), 5.7, -29.20);
}
for (const x of [14.5, 29.5]) serverTower(x, -23.3, true, 0);
framedDisplay(20.5, 2.85, 22, 9.62, -29.18, matDisplayOrange, stripOrangeMat, .15);
label(['APPENDIX 27', 'ATROPA LIQUIDITY CONNECTIONS'], 19.8, 2.65, 22, 9.6, -28.98, { fontSize: 82, subSize: 34, color: '#fff4e7', subColor: '#ffb16d', glow:'rgba(0,0,0,0)', blur:0 });
{
  const archMat = new THREE.MeshBasicMaterial({color:theme.orange,transparent:true,opacity:.60,blending:THREE.AdditiveBlending,depthWrite:false});
  const chamberArch = new THREE.Mesh(new THREE.TorusGeometry(7.6,.12,10,72,Math.PI),archMat);
  chamberArch.position.set(22,.8,-20.4); scene.add(chamberArch);
  box(.42,7.6,.52,matWarmMetal,14.4,3.8,-20.4);
  box(.42,7.6,.52,matWarmMetal,29.6,3.8,-20.4);
}
const atropaCore = new THREE.Mesh(new THREE.DodecahedronGeometry(1.45, 1), new THREE.MeshStandardMaterial({ color: 0x3a1609, emissive: theme.orange, emissiveIntensity: .72, metalness: .42, roughness: .28 }));
atropaCore.position.set(22, 4.4, -25);
scene.add(atropaCore);
{
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.4, .78, 48), matWarmMetal);
  pedestal.position.set(22, .39, -25); scene.add(pedestal);
  const pedRing = new THREE.Mesh(new THREE.TorusGeometry(3.8, .075, 10, 72), new THREE.MeshBasicMaterial({ color: theme.orange, transparent:true, opacity:.72 }));
  pedRing.rotation.x = Math.PI/2; pedRing.position.set(22,.80,-25); scene.add(pedRing);

  atropaBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(.85, 2.1, 11.5, 28, 1, true),
    new THREE.MeshBasicMaterial({ color: theme.orange, transparent:true, opacity:.06, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide })
  );
  atropaBeam.position.set(22,6.4,-25); scene.add(atropaBeam);

  const overhead = new THREE.Mesh(new THREE.TorusGeometry(3.0,.09,10,64), new THREE.MeshBasicMaterial({color:theme.gold,transparent:true,opacity:.62}));
  overhead.rotation.x=Math.PI/2; overhead.position.set(22,13.5,-25); scene.add(overhead);
  spinObjects.push({obj:overhead,speed:-.10});
}
for (let i = 0; i < highlights.atropa.pools.length; i++) {
  const p = highlights.atropa.pools[i];
  const angle = -Math.PI / 2 + (i - 1) * .72;
  const x = 22 + Math.cos(angle) * 6;
  const z = -25 + Math.sin(angle) * 6;
  const orb = new THREE.Mesh(new THREE.SphereGeometry(.75, 24, 18), new THREE.MeshStandardMaterial({ color: 0x351d12, emissive: i === 0 ? theme.gold : theme.orange, emissiveIntensity: .52, roughness: .34 }));
  orb.position.set(x, 4.4, z);
  scene.add(orb);
  label(p.pair, 4.5, 1.0, x, 6.0, z, { fontSize: 44, color: '#ffd9b6' });
  lineBetween(atropaCore.position, orb.position, theme.orange, .50);
}
addInteractable('atropa', 22, -20, 9.0, 'E / USE — OPEN ATROPA APPENDIX 27', showAtropa);

// Archive bay — proper console desk + flanking data towers.
box(16.5, .45, 9.0, matFloorGloss, 0, .22, -34.8);
box(13.8, 5.8, 5.2, matStructure, 0, 2.9, -35.4);
box(12.4, 4.0, .28, matDisplayCyan, 0, 4.25, -32.72);
box(12.8, .68, 2.4, matStructure2, 0, 1.25, -31.8);
strip(11.8, .07, .11, stripCyanMat, 0, 1.59, -30.64);
serverTower(-8.6,-35.6,false,.08);
serverTower(8.6,-35.6,false,-.08);
const archiveLamp = new THREE.PointLight(theme.cyan2,8,11,2); archiveLamp.position.set(0,6.4,-31.4); scene.add(archiveLamp);
label(['73 APPENDICES', 'SEARCH THE FULL RESEARCH'], 10.8, 2.4, 0, 4.4, -32.50, { fontSize: 66, subSize: 31, color: '#ffffff', subColor:'#9dd9d4', glow:'rgba(0,0,0,0)', blur:0 });
addInteractable('archive', 0, -28.5, 7.5, 'E / USE — SEARCH ALL 73 APPENDICES', archiveShell);

const questBeacon = new THREE.Group();
scene.add(questBeacon);
const beaconRing = new THREE.Mesh(new THREE.TorusGeometry(1.2, .07, 10, 48), new THREE.MeshBasicMaterial({ color: theme.gold, transparent: true, opacity: .72 }));
beaconRing.rotation.x = Math.PI / 2;
questBeacon.add(beaconRing);
const beaconArrow = new THREE.Mesh(new THREE.ConeGeometry(.38, 1.15, 18), new THREE.MeshStandardMaterial({ color: theme.gold, emissive: theme.gold, emissiveIntensity: 1.0 }));
beaconArrow.rotation.z = Math.PI;
beaconArrow.position.y = 2.2;
questBeacon.add(beaconArrow);
const questTargets = {
  thesis: new THREE.Vector3(0, 0, 2.5),
  evidence: new THREE.Vector3(-27, 0, -5.5),
  phases: new THREE.Vector3(22.5, 0, 12),
  atropa: new THREE.Vector3(22, 0, -20),
  archive: new THREE.Vector3(0, 0, -28.5)
};

function updateQuestBeacon(now) {
  const q = QUESTS[questIndex];
  const target = q ? questTargets[q.id] : null;
  questBeacon.visible = !!target;
  if (!target) return;
  questBeacon.position.set(target.x, .08, target.z);
  beaconArrow.position.y = 2.2 + Math.sin(now * .003) * .22;
  beaconRing.material.opacity = .5 + Math.sin(now * .0024) * .18;
}

function updateCamera() {
  camera.position.copy(player);
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
}
updateCamera();

function isBlocked(x, z) {
  return x < -HALF_W + .8 || x > HALF_W - .8 || z < -HALF_D + .8 || z > HALF_D - .8;
}

function nearestInteractable() {
  let best = null;
  let bestD = Infinity;
  for (const it of interactables) {
    const d = Math.hypot(player.x - it.pos.x, player.z - it.pos.z);
    if (d <= it.radius && d < bestD) {
      bestD = d;
      best = it;
    }
  }
  return best;
}

function setPrompt(t) {
  els.prompt.textContent = t || '';
  els.prompt.style.opacity = t ? '1' : '0';
}

function useAction() {
  if (panelOpen) return;
  const it = nearestInteractable();
  if (it) it.action();
}

function updateMovement(dt) {
  if (panelOpen) return;
  let forward = 0, strafe = 0;
  if (keys.has('KeyW')) forward += 1;
  if (keys.has('KeyS')) forward -= 1;
  if (keys.has('KeyD')) strafe += 1;
  if (keys.has('KeyA')) strafe -= 1;
  if (stick.active) {
    forward += -stick.y;
    strafe += stick.x;
  }
  const len = Math.hypot(forward, strafe);
  if (len < .03) return;
  forward /= Math.max(1, len);
  strafe /= Math.max(1, len);
  const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight')) ? 8.0 : 5.0;
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  const rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const vx = (fx * forward + rx * strafe) * speed * dt;
  const vz = (fz * forward + rz * strafe) * speed * dt;
  const nx = player.x + vx, nz = player.z + vz;
  if (!isBlocked(nx, player.z)) player.x = nx;
  if (!isBlocked(player.x, nz)) player.z = nz;
}

addEventListener('keydown', e => {
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight'].includes(e.code)) keys.add(e.code);
  if (e.code === 'KeyE') {
    e.preventDefault();
    useAction();
  }
  if (e.code === 'Escape' && panelOpen) closePanel();
});
addEventListener('keyup', e => keys.delete(e.code));

renderer.domElement.addEventListener('click', () => {
  if (panelOpen || matchMedia('(pointer:coarse)').matches) return;
  renderer.domElement.requestPointerLock?.();
});
addEventListener('mousemove', e => {
  if (panelOpen || document.pointerLockElement !== renderer.domElement) return;
  yaw -= e.movementX * .0023;
  pitch -= e.movementY * .0021;
  pitch = THREE.MathUtils.clamp(pitch, -1.05, .9);
});

let touchLook = null;
renderer.domElement.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' || panelOpen) return;
  if (e.clientX < innerWidth * .42 && e.clientY > innerHeight * .58) return;
  if (touchLook && touchLook.id !== e.pointerId) return;
  e.preventDefault();
  touchLook = { id: e.pointerId, x: e.clientX, y: e.clientY };
  try { renderer.domElement.setPointerCapture(e.pointerId); } catch (_) {}
}, { passive: false });
renderer.domElement.addEventListener('pointermove', e => {
  if (!touchLook || touchLook.id !== e.pointerId || panelOpen) return;
  e.preventDefault();
  const samples = e.getCoalescedEvents?.() || [e];
  for (const s of samples) {
    const dx = s.clientX - touchLook.x;
    const dy = s.clientY - touchLook.y;
    touchLook.x = s.clientX;
    touchLook.y = s.clientY;
    yaw -= dx * .0061;
    pitch -= dy * .0052;
    pitch = THREE.MathUtils.clamp(pitch, -1.05, .9);
  }
}, { passive: false });
const clearTouchLook = e => {
  if (touchLook?.id !== e.pointerId) return;
  touchLook = null;
  try { renderer.domElement.releasePointerCapture(e.pointerId); } catch (_) {}
};
renderer.domElement.addEventListener('pointerup', clearTouchLook);
renderer.domElement.addEventListener('pointercancel', clearTouchLook);
renderer.domElement.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
renderer.domElement.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

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
  els.nub.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
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
const clearStick = e => {
  if (stick.id !== e.pointerId) return;
  stick = { active: false, id: null, x: 0, y: 0 };
  els.nub.style.transform = 'translate(0,0)';
};
els.stick.addEventListener('pointerup', clearStick);
els.stick.addEventListener('pointercancel', clearStick);

els.mobileE.addEventListener('click', useAction);
els.panelClose.addEventListener('click', closePanel);
els.returnBtn.addEventListener('click', leaveObservatory);
els.archiveBtn.addEventListener('click', archiveShell);
els.sourceBtn.addEventListener('click', () => window.open(DATA_ROOT + manifest.sourcePdf, '_blank', 'noopener'));
els.resetBtn.addEventListener('click', resetQuest);

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(.05, Math.max(.001, (now - lastFrame) / 1000));
  lastFrame = now;

  if (panelOpen) {
    setPrompt('');
    if (now - lastPanelRender > 320) {
      updateCamera();
      renderer.render(scene, camera);
      lastPanelRender = now;
    }
    return;
  }

  updateMovement(dt);
  updateCamera();
  const it = nearestInteractable();
  setPrompt(it ? it.prompt : '');
  core.rotation.y += dt * .42;
  core.rotation.x += dt * .17;
  halo.rotation.z += dt * .12;
  atropaCore.rotation.x += dt * .26;
  atropaCore.rotation.y -= dt * .34;
  for (const it of spinObjects) {
    it.obj.rotation.z += dt * it.speed;
    if (it.obj === coreInner || it.obj === coreWire) it.obj.rotation.y += dt * it.speed * .65;
  }
  if (ambientParticles) {
    ambientParticles.rotation.y += dt * .006;
    ambientParticles.position.y = Math.sin(now * .00018) * .16;
  }
  if (centralBeam) {
    centralBeam.material.opacity = .045 + Math.sin(now * .0015) * .014;
  }
  for (let i = 0; i < holoCards.length; i++) {
    const h = holoCards[i];
    h.material.opacity = .065 + Math.sin(now * .001 + i * .7) * .025;
    h.position.y += Math.sin(now * .0012 + i) * .0007;
  }
  if (atropaBeam) {
    atropaBeam.material.opacity = .050 + Math.sin(now * .0018 + 1.2) * .015;
  }
  for (let i = 0; i < routeMeshes.length; i++) {
    routeMeshes[i].position.y = 3.0 + Math.sin(now * .0017 + i) * .18;
  }
  updateQuestBeacon(now);
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.65));
});

setTimeout(() => {
  els.loading.style.transition = 'opacity .45s ease';
  els.loading.style.opacity = '0';
  setTimeout(() => els.loading.remove(), 480);
}, 850);

try { window.parent?.postMessage?.({ type: 'ATROPA_PDAI_RESEARCH_READY' }, '*'); } catch (_) {}

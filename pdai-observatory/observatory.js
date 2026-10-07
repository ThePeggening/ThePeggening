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
scene.background = new THREE.Color(0x010608);
scene.fog = new THREE.FogExp2(0x031318, 0.0115);

const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.05, 240);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.65));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
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
const keys = new Set();
const colliders = [];
const interactables = [];
const loadedDocs = new Map();

const theme = {
  floor: 0x02090c,
  wall: 0x061115,
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

const matFloor = material(theme.floor, { roughness: .82, metalness: .12 });
const matWall = material(theme.wall, { roughness: .78 });
const matMetal = material(0x0b1d23, { roughness: .34, metalness: .78 });
const matCyan = material(0x0c3b40, { roughness: .32, metalness: .42, emissive: theme.cyan, emissiveIntensity: .22 });
const matGold = material(0x3b2c0e, { roughness: .36, metalness: .55, emissive: theme.gold, emissiveIntensity: .24 });

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
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
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
  for (let start = 0; start < descs.length; start += 5) {
    const batch = descs.slice(start, start + 5);
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
scene.add(new THREE.HemisphereLight(0x8ceee6, 0x031219, .68));
scene.add(new THREE.AmbientLight(0x224c54, .52));
for (const x of [-28, -14, 0, 14, 28]) {
  const l = new THREE.PointLight(theme.cyan, 7, 25, 2);
  l.position.set(x, 12, 2);
  scene.add(l);
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
const halo = new THREE.Mesh(new THREE.TorusGeometry(3.4, .055, 10, 96), new THREE.MeshBasicMaterial({ color: theme.cyan2, transparent: true, opacity: .55 }));
halo.position.y = 4.1;
halo.rotation.x = Math.PI / 2;
dais.add(halo);
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

box(17, 8.5, .5, matMetal, -27, 5.1, -10);
label(['EVIDENCE WALL', 'OBSERVED · INTERPRETATION · REQUIREMENT'], 15.5, 2.8, -26.7, 8.4, -9.7, { fontSize: 70, subSize: 32, color: '#dffffa' });
const evidenceColors = [theme.cyan, theme.purple, theme.gold];
const evidenceIds = ['OBSERVED', 'INTERPRETATION', 'OPERATING REQUIREMENT'];
for (let i = 0; i < 3; i++) {
  const p = box(4.6, 2.8, .45, new THREE.MeshStandardMaterial({ color: 0x061419, emissive: evidenceColors[i], emissiveIntensity: .32, roughness: .45 }), -26.5 + (i - 1) * 5.2, 4.0, -9.55);
  label(evidenceIds[i], 4.2, .9, p.position.x, 4.1, -9.28, { fontSize: evidenceIds[i].length > 12 ? 35 : 45, color: '#effffc' });
}
addInteractable('evidence', -27, -5.5, 8.5, 'E / USE — INSPECT EVIDENCE CLASSIFICATION', showEvidence);

box(17, 8, .5, matMetal, -27, 5, -29);
label(['STABILITY LOOP', 'SUPPLY · REPLENISHMENT · CIRCULATION'], 15.5, 2.8, -26.7, 8.0, -28.7, { fontSize: 68, subSize: 30, color: '#dffffa' });
addInteractable('stability', -27, -24.5, 7.5, 'E / USE — INSPECT STABILITY / REPLENISHMENT LOOP', showStability);

label(['FIVE PHASES', 'PROPOSED CONSTRUCTION PATH'], 15.5, 2.4, 26.5, 10.8, -2, { fontSize: 72, subSize: 30, color: '#dffffa' });
const phaseZ = [12, 5, -2, -9, -16];
for (let i = 0; i < highlights.phases.length; i++) {
  const p = highlights.phases[i];
  const z = phaseZ[i];
  box(9.5, 5.2, .75, i === 3 ? matGold : matCyan, 27, 3.2, z);
  label([String(i + 1).padStart(2, '0'), p.name], 8.7, 2.1, 26.55, 4.3, z + .42, { fontSize: 62, subSize: 30, color: i === 3 ? '#ffe5a0' : '#d8fffa' });
  addInteractable('phase-' + i, 22.5, z, 5.5, 'E / USE — ' + p.name, () => {
    const row = '<div class="phaseRow"><div class="phaseNo">' + (i + 1) + '</div><div><div class="phaseName">' + htmlEscape(p.name) + '</div><div class="phaseText">' + htmlEscape(p.text) + '</div><div class="source">Source page ' + p.page + '</div></div></div>';
    panel('PHASE ' + (i + 1) + ' / 5', p.name, '<div class="notice">One phase in the paper’s proposed construction sequence.</div>' + row + '<p><button id="allPhases" class="smallBtn">SHOW ALL FIVE PHASES</button></p>');
    document.getElementById('allPhases')?.addEventListener('click', showPhases);
    advanceQuest('phases');
  });
}

box(18, 8, .5, matMetal, 25.5, 5, 29);
label(['PARTICIPANT OUTCOMES', 'HOLDERS · BORROWERS · LPs · USERS'], 16.4, 2.5, 25.2, 8.1, 28.7, { fontSize: 64, subSize: 30, color: '#dffffa' });
addInteractable('participants', 25, 24, 7.8, 'E / USE — WHO IS THE PROPOSED SERVICE FOR?', showParticipants);

box(23, 11, .65, matMetal, 22, 5.7, -30);
label(['APPENDIX 27', 'ATROPA LIQUIDITY CONNECTIONS'], 20, 3.0, 22, 9.6, -29.6, { fontSize: 82, subSize: 34, color: '#ffd6ad', subColor: '#ff9b54', glow: 'rgba(255,155,84,.35)' });
const atropaCore = new THREE.Mesh(new THREE.DodecahedronGeometry(1.45, 1), new THREE.MeshStandardMaterial({ color: 0x3a1609, emissive: theme.orange, emissiveIntensity: .72, metalness: .42, roughness: .28 }));
atropaCore.position.set(22, 4.4, -25);
scene.add(atropaCore);
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

box(13, 5.2, 4.8, matMetal, 0, 2.6, -35);
box(11.8, 3.5, .25, matCyan, 0, 4.0, -32.7);
label(['73 APPENDICES', 'SEARCH THE FULL RESEARCH'], 10.8, 2.4, 0, 4.4, -32.52, { fontSize: 66, subSize: 31, color: '#dffffa' });
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
  updateMovement(dt);
  updateCamera();
  const it = panelOpen ? null : nearestInteractable();
  setPrompt(it ? it.prompt : '');
  core.rotation.y += dt * .42;
  core.rotation.x += dt * .17;
  halo.rotation.z += dt * .12;
  atropaCore.rotation.x += dt * .26;
  atropaCore.rotation.y -= dt * .34;
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

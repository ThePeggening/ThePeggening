import {brand, applyBrandCss} from './brand.js';
import {worldPalette} from './world-palette.js';
import {ensureStyles} from './styles.js';
await ensureStyles(['./fonts.css','./brand-check.css']);
applyBrandCss();
function swatch(parent, name, value) {
  const card = document.createElement('div'); card.className = 'swatch'; card.dataset.role = name;
  const color = document.createElement('div'); color.className = 'swatch-color'; color.style.setProperty('--swatch-color', value);
  const label = document.createElement('strong'); label.textContent = name;
  const hex = document.createElement('small'); hex.textContent = value.toUpperCase();
  card.append(color, label, hex); parent.append(card);
}
for (const name of ['bg', 'surface', 'surface2', 'control', 'primary', 'accent', 'text', 'textSecondary', 'muted', 'success', 'danger', 'focus', 'glow', 'gold', 'logoCoral', 'logoMagenta', 'logoRed', 'logoOrange']) swatch(document.querySelector('#swatches'), name, brand.colors[name]);
for (const name of ['ground', 'sky', 'water', 'stone']) swatch(document.querySelector('#world-swatches'), name, worldPalette[name]);
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-mode]').forEach(b => {b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', String(b === button));});
  document.querySelector('#sample-status').textContent = 'Demo route: ' + button.dataset.mode + '.';
}));
document.querySelector('#motion-toggle').addEventListener('click', e => {const b=e.currentTarget; b.setAttribute('aria-checked', String(b.getAttribute('aria-checked') !== 'true'));});
document.querySelector('#sample-action').addEventListener('click', () => {document.querySelector('#sample-status').textContent = 'Button works. Your demo feathers stayed at 120.';});
const notes={home:'The homepage is currently the Swap app. Cropped source capture; original site art is research evidence only.',swap:'Same canonical Swap URL, captured on a 390 × 844 mobile viewport.',hypermarket:'The live Hypermarket currently serves a maintenance screen. No market components are inferred from it.',pulsechain:'PulseChain visual identity study. The signal motif on this page is original art.'};
document.querySelector('#reference-page').addEventListener('change', e => {
  const id=e.target.value, src='./shots/site-'+id+'.png';
  document.querySelector('#reference-image').src=src; document.querySelector('#reference-image').alt=id+' live source capture, 30 September 2026';
  document.querySelector('#reference-window').classList.toggle('cropped',id==='home');
  document.querySelector('#reference-note').textContent=notes[id]||'Live '+id+' product capture. Source art is research evidence only.';
  document.querySelector('#reference-full').href=src;
});
document.fonts.ready.then(() => {window.PCOCK_BRAND={ready:true,approval:brand.approval};});

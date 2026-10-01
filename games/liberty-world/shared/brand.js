// S0 approved by the user on 2026-09-30. Source: docs/BRAND_LOCK.md
// and docs/BRAND_EVIDENCE.json (2026-09-30). No copied logo/image artwork.
export const brand = Object.freeze({
  version: 'PCOCK-S0-BRAND-20260930', approval: 'approved',
  colors: Object.freeze({
    bg: '#000000', bgHigh: '#0f0f0f', surface: '#18181b', surface2: '#242429',
    control: '#393941', border: '#41424b', primary: '#f97316', accent: '#d20058',
    primaryHover: '#c2570c', primaryActive: '#c2410c',
    text: '#ffffff', textSecondary: '#d9d9de', muted: '#9091a0',
    success: '#13b95b', danger: '#ed4646', focus: '#5d5e6c', glow: '#662d80',
    gold: '#f5ff79', gradientMiddle: '#dd223d', gradientOrange: '#f56e00',
    logoMagenta: '#c20067', logoCoral: '#ff644b', logoRed: '#e61c24', logoOrange: '#ed8023',
    pulseCyan: '#00eaff', pulseBlue: '#0080ff', pulsePurple: '#8000ff',
    pulseMagenta: '#e619e6', pulseRed: '#ff0000'
  }),
  gradients: Object.freeze({
    primary: 'linear-gradient(266deg,#d20058 -2.84%,#dd223d 60%,#f56e00 117.61%)',
    neutral: 'linear-gradient(90deg,#4d4d56,#393941b3)',
    toggle: 'linear-gradient(280.79deg,#ff6501 -2.22%,#d03bad 52.36%,#7f00ff 102.39%)',
    purpleGreen: 'linear-gradient(84deg,#831bfe 1.57%,#0dd882)',
    gold: 'linear-gradient(92deg,#dba624 1.79%,#654901 99.58%)',
    pulse: 'linear-gradient(210deg,#00eaff 0%,#0080ff 25%,#8000ff 50%,#e619e6 75%,#ff0000 100%)'
  }),
  typography: Object.freeze({
    body: '"BT Beau Sans", "Segoe UI", system-ui, sans-serif',
    heading: '"Soloist Extra Italic", "Arial Black", system-ui, sans-serif',
    bodyWeights: Object.freeze([300, 400, 500, 700, 800]), headingWeight: 400
  }),
  radii: Object.freeze({xs: 4, sm: 8, md: 10, lg: 12, xl: 16, xxl: 20, xxxl: 24, pill: 999}),
  components: Object.freeze({buttonRadius: 10, headerButtonRadius: 8, cardRadius: 16,
    inputRadius: 12, focusWidth: 2, focusOffset: 2, shadow: 'none'}),
  sources: Object.freeze({liberty: 'https://libertyswap.finance/',
    shield: 'https://libertyswap.finance/shield/', pool: 'https://pool.libertyswap.finance/',
    stables: 'https://libertyswap.finance/stables-coin/',
    hypermarket: 'https://hypermarket.libertyswap.finance/', pulsechain: 'https://pulsechain.com/'})
});

export function applyBrandCss(root = document.documentElement) {
  for (const [key, value] of Object.entries(brand.colors)) root.style.setProperty('--' + key, value);
  for (const [key, value] of Object.entries(brand.gradients)) root.style.setProperty('--gradient-' + key, value);
  for (const [key, value] of Object.entries(brand.radii)) root.style.setProperty('--radius-' + key, value + 'px');
  root.style.setProperty('--font-body', brand.typography.body);
  root.style.setProperty('--font-heading', brand.typography.heading);
  root.style.setProperty('--line', brand.colors.border);
  root.style.setProperty('--overlay', `color-mix(in srgb, ${brand.colors.bg} 61%, transparent)`);
  root.style.setProperty('--shadow-color', `color-mix(in srgb, ${brand.colors.bg} 13%, transparent)`);
  root.style.setProperty('--touch-bg', `color-mix(in srgb, ${brand.colors.surface} 62%, transparent)`);
  root.style.setProperty('--touch-stick-bg', `color-mix(in srgb, ${brand.colors.surface} 25%, transparent)`);
  root.ownerDocument.querySelector('meta[name="theme-color"]')?.setAttribute('content', brand.colors.bg);
}

// Compatibility keys keep the prototype playable until the S1/S2 rebuild.
// Every district key is branded; water/terrain retain worldPalette ownership.
export const brandedDistricts = Object.freeze({harbor: brand.colors.primary,
  shield: brand.colors.glow, pool: brand.colors.accent, stables: brand.colors.logoOrange,
  market: brand.colors.logoMagenta, vault: brand.colors.glow,
  observatory: brand.colors.pulseBlue, launch: brand.colors.logoCoral,
  torch: brand.colors.gold, white: brand.colors.text, black: brand.colors.bg});

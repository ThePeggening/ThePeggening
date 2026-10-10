/* Grand Inquisitor / The Unwritten Verdict — presentation only.
 * Quest state, eligibility, controls on desktop, and transitions belong to the
 * lifecycle module. This module owns its DOM, cinematic camera and audio nodes.
 */
const GrandInquisitorPresentation = (() => {
    'use strict';

    const STAGES = ['The Summons', 'The Divided Record', 'The Erasure', 'The Stolen Hour', 'The Tribunal', 'The Door'];
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
    const ease = (t) => t * t * (3 - 2 * t);
    const shot = (start, end, from, to, look, lookTo, fov = 54, anchor = 'room', lookAnchor = 'room') =>
        ({ start, end, from, to, look, lookTo: lookTo || look, fov, anchor, lookAnchor });
    const line = (start, end, who, text) => ({ start, end, who, text });

    // All spoken text below is original fictional quest dialogue, not a
    // purported quotation or a claim about a real asset or public figure.
    const clips = [
        {
            id: 0, title: 'THE UNWRITTEN VERDICT', duration: 28,
            lines: [
                line(1.6, 4.5, 'TRIBUNAL', 'Grand Inquisitor.'),
                line(4.8, 8.4, 'TRIBUNAL', 'Your record is under review.'),
                line(9.4, 12.2, 'CICERO', 'Then open it.'),
                line(14.0, 18.5, 'TRIBUNAL', 'Only the approved account will remain.'),
                line(21.0, 25.2, 'CICERO', 'You summoned the wrong witness.')
            ],
            cues: [[0, 'clock'], [8.8, 'seal'], [19, 'door']],
            shots: [
                shot(0, 8.8, [2.6, 2.5, 7.8], [1.5, 3.0, 6.2], [0, 9.5, -30], [0, 13, -30], 58, 'player'),
                shot(8.8, 13.6, [-3.4, 2.4, -2.8], [-2.7, 2.2, -2.4], [0, 1.9, 0], null, 45, 'player', 'player'),
                shot(13.6, 21, [-16, 7, 21], [-12, 11, 17], [0, 11.5, -30], [0, 14, -30], 59),
                shot(21, 28, [0, 5.6, 8], [0, 4.4, 6.5], [0, 10, -30], [0, 12.5, -28.5], 57, 'player')
            ]
        },
        {
            id: 1, title: 'THE DIVIDED RECORD', duration: 14,
            lines: [
                line(0.7, 4.1, 'TRIBUNAL', 'pDAI. An inherited error.'),
                line(4.4, 8.4, 'CICERO', 'That is a verdict. Show me the record.'),
                line(9.6, 13.4, 'CICERO', 'Same origin. Different history.')
            ],
            cues: [[0, 'align'], [8.8, 'clock']],
            shots: [
                shot(0, 4.4, [-18, 7, 14], [-15, 8, 10], [-8, 15, -20.5], [-5, 15, -20.5], 56),
                shot(4.4, 9, [18, 7, 10], [15, 9, 6], [8, 15, -20.5], [5, 15, -20.5], 56),
                shot(9, 14, [0, 4, 7], [0, 7, 8], [0, 16, -20.5], null, 60, 'player')
            ]
        },
        {
            id: 2, title: 'THE ERASURE', duration: 12,
            lines: [
                line(0.6, 4.3, 'TRIBUNAL', 'That section was not meant to survive.'),
                line(4.7, 6.5, 'CICERO', 'There it is.'),
                line(7.0, 9.1, 'TRIBUNAL', 'Begin erasure.'),
                line(9.5, 11.8, 'CICERO', 'Stay close.')
            ],
            cues: [[0, 'align'], [6.7, 'purge'], [9.3, 'hit']],
            shots: [
                shot(0, 4.6, [-10, 8, 33], [-9, 7, 30], [0, .25, 0], [0, .5, 0], 55, 'room', 'witness'),
                shot(4.6, 7, [3, 2.6, 5], [2, 2.2, 4], [0, 2.0, -3], null, 49, 'player', 'player'),
                shot(7, 12, [13, 11, 29], [9, 8, 23], [0, 9, -32], [0, 13, -32], 60)
            ]
        },
        {
            id: 3, title: 'THE STOLEN HOUR', duration: 12,
            lines: [
                line(1.1, 4.3, 'TRIBUNAL', 'You are running out of time.'),
                line(5.1, 8.6, 'CICERO', 'Your clock is still moving.'),
                line(9.1, 11.8, 'CICERO', 'Then I will stop it.')
            ],
            cues: [[0, 'clock'], [4.8, 'clock'], [9, 'seal']],
            shots: [
                shot(0, 5, [-13, 4.4, 24], [-10, 8, 18], [0, 13, -4], [0, 18, -12], 60),
                shot(5, 8.9, [12, 15, 6], [9, 13, 2], [0, 8, -12], [0, 8, -22], 59),
                shot(8.9, 12, [0, 3, 8], [0, 3.4, 6], [0, 13, -20], null, 58, 'player')
            ]
        },
        {
            id: 4, title: 'THE TRIBUNAL', duration: 16,
            lines: [
                line(1.4, 5.7, 'TRIBUNAL', 'One account. One verdict.'),
                line(7.3, 12.1, 'CICERO', 'You have mistaken silence for agreement.'),
                line(12.8, 15.6, 'CICERO', 'Let the record speak.')
            ],
            cues: [[0, 'boss'], [6.4, 'clock'], [12.4, 'align']],
            shots: [
                shot(0, 6.4, [0, 2.8, 7.5], [0, 6, 8], [0, 8, -10], [0, 14, -10], 61, 'player'),
                shot(6.4, 12.5, [-15, 16, 7], [-12, 19, 3], [0, 11, -10], null, 55),
                shot(12.5, 16, [2.5, 3.3, 7], [1.8, 4, 8], [0, 12, -10], null, 59, 'player')
            ]
        },
        {
            id: 5, title: 'THE VERDICT BREAKS', duration: 16,
            lines: [
                line(0.4, 2.2, 'CICERO', 'Now.'),
                line(5.7, 9.3, 'TRIBUNAL', 'You cannot change the verdict.'),
                line(10.0, 13.9, 'CICERO', 'I am still examining it.')
            ],
            cues: [[0, 'hit'], [2.8, 'boss'], [8.9, 'door']],
            shots: [
                shot(0, 2.8, [-2.8, 2.1, -2.2], [-2.3, 2.3, -1.8], [0, 1.8, 0], null, 45, 'player', 'player'),
                shot(2.8, 8.9, [-13, 12, 12], [-16, 17, 18], [0, 11, -10], [0, 18, -10], 57),
                shot(8.9, 16, [0, 7, 8], [0, 12, 15], [0, 26, -10], [0, 36, -20], 62, 'player')
            ]
        },
        {
            id: 6, title: 'THE DOOR BENEATH THE WORLD', duration: 20,
            lines: [
                line(0.8, 4.9, 'TRIBUNAL', 'What do you expect to find?'),
                line(5.4, 8.9, 'CICERO', 'How deep it goes.'),
                line(10.1, 13.8, 'CICERO', 'The peg is the beginning.')
            ],
            cues: [[0, 'clock'], [5.2, 'door'], [13.8, 'align']],
            shots: [
                shot(0, 5.2, [3, 3, 8], [2, 3.6, 7], [0, 3.1, -8], [0, 5.3, -13], 57, 'player', 'player'),
                shot(5.2, 10, [-14, 10, 11], [-10, 12, 8], [0, 15, -25], [0, 17, -25], 59),
                shot(10, 20, [0, 4.7, 10], [0, 11, 24], [0, 17, -50], [0, 24, -84], 61, 'player')
            ]
        }
    ];

    const CSS = `
.gip-root{position:fixed;inset:0;z-index:1400;pointer-events:none;color:#f5f0e5;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;--gip-gold:#edc57e;--gip-safe-top:env(safe-area-inset-top,0px);--gip-safe-bottom:env(safe-area-inset-bottom,0px);--gip-safe-left:env(safe-area-inset-left,0px);--gip-safe-right:env(safe-area-inset-right,0px)}
.gip-root *{box-sizing:border-box}.gip-root [hidden]{display:none!important}.gip-root button{font:inherit;color:inherit;cursor:pointer;pointer-events:auto;touch-action:none;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}.gip-root button:focus-visible{outline:2px solid #fff0cc;outline-offset:3px}.gip-root button:disabled{cursor:default}
.gip-gameplay{position:absolute;inset:0}.gip-head{position:absolute;top:calc(12px + var(--gip-safe-top));left:calc(14px + var(--gip-safe-left));width:min(450px,calc(100% - 92px - var(--gip-safe-left) - var(--gip-safe-right)));padding:10px 13px 11px;border-left:2px solid var(--gip-gold);background:linear-gradient(90deg,rgba(8,10,15,.91),rgba(8,10,15,.67) 78%,rgba(8,10,15,.03));border-radius:0 6px 6px 0;text-shadow:0 1px 3px #000}
.gip-eyebrow{font-size:9px;letter-spacing:.19em;color:var(--gip-gold);line-height:1.3;font-weight:750}.gip-objective{font-size:16px;font-weight:650;line-height:1.3;margin-top:4px;overflow-wrap:anywhere}.gip-meta{display:flex;align-items:center;flex-wrap:wrap;gap:5px 10px;margin-top:6px;font-size:10px;line-height:1.2;color:#c8c8c9}.gip-progress{color:#e8d8b8}.gip-meter{height:2px;width:116px;max-width:100%;margin-top:7px;background:rgba(237,197,126,.16);overflow:hidden}.gip-meter>i{display:block;height:100%;width:0;background:var(--gip-gold);transition:width .3s ease}
.gip-integrity{display:inline-flex;gap:4px;align-items:center}.gip-integrity em{font-style:normal;font-size:9px;margin-right:3px;color:#c8c8c9}.gip-integrity i{height:4px;width:15px;display:block;border-radius:2px;background:#504a43}.gip-integrity i.on{background:#f0cf8f}.gip-integrity[data-low="true"] i.on{background:#f78b77}
.gip-pause{position:absolute;top:calc(12px + var(--gip-safe-top));right:calc(13px + var(--gip-safe-right));min-height:44px;min-width:54px;padding:9px 10px;border:1px solid rgba(237,197,126,.32);border-radius:7px;background:rgba(8,10,15,.8);font-size:10px!important;letter-spacing:.07em}.gip-pause:active{background:#3b2b23}
.gip-hint{position:absolute;left:50%;bottom:calc(26px + var(--gip-safe-bottom));transform:translateX(-50%);max-width:min(600px,calc(100% - 370px));text-align:center;font-size:11px;line-height:1.45;color:#dededb;text-shadow:0 1px 5px #000,0 1px 12px #000}.gip-hint strong{display:block;font-size:12px;font-weight:550;color:#ffdf9f;margin-bottom:3px}.gip-desktop-hint{display:block;font-size:10px;color:#b8b8bb}
.gip-actions{position:absolute;right:calc(18px + var(--gip-safe-right));bottom:calc(19px + var(--gip-safe-bottom));display:grid;grid-template-columns:74px 54px;grid-template-rows:44px 74px;gap:8px;pointer-events:none;align-items:center}.gip-action{display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid rgba(237,197,126,.4);background:rgba(11,13,19,.87);box-shadow:0 3px 15px #0004;min-width:44px;min-height:44px;padding:6px;border-radius:9px;line-height:1.05;gap:3px}.gip-action:active,.gip-action[data-held="true"]{background:rgba(104,57,29,.91);border-color:#ffe0a4}.gip-action svg{width:21px;height:21px;stroke:var(--gip-gold);stroke-width:1.8;fill:none}.gip-action-label{font-size:10px!important;letter-spacing:.025em;text-align:center;overflow-wrap:anywhere;max-width:100%}.gip-key{font-size:9px;color:#aba7a0;line-height:1}.gip-attack{grid-column:1;grid-row:2;width:74px;height:74px;border-radius:50%;border-color:rgba(238,156,108,.68)}.gip-attack svg{width:23px;height:23px}.gip-interact{grid-column:1/3;grid-row:1;min-height:44px;max-width:136px}.gip-interact:disabled{opacity:.44}.gip-interact[data-ready="true"]{border-color:#edcb8b;background:rgba(71,53,32,.92);box-shadow:0 0 14px #eec37720}.gip-jump{grid-column:2;grid-row:2;width:54px;height:54px;border-radius:50%}
.gip-joystick{display:none;position:absolute;left:calc(25px + var(--gip-safe-left));bottom:calc(23px + var(--gip-safe-bottom));width:112px;height:112px;border:1px solid rgba(241,221,183,.3);border-radius:50%;background:radial-gradient(circle,rgba(225,193,143,.05),rgba(7,11,17,.38));pointer-events:auto;touch-action:none;-webkit-user-select:none;user-select:none}.gip-joystick::before,.gip-joystick::after{content:"";position:absolute;left:50%;top:50%;background:rgba(237,210,166,.1);transform:translate(-50%,-50%)}.gip-joystick::before{width:78px;height:1px}.gip-joystick::after{height:78px;width:1px}.gip-stick{position:absolute;width:39px;height:39px;left:calc(50% - 19.5px);top:calc(50% - 19.5px);border-radius:50%;border:1px solid rgba(239,209,154,.6);background:radial-gradient(circle at 35% 30%,rgba(234,206,163,.27),rgba(25,28,32,.9));box-shadow:0 3px 12px #0005}.gip-joy-label{position:absolute;left:0;right:0;bottom:-16px;font-size:8px;text-align:center;color:#bcb7ad;letter-spacing:.14em}
.gip-look{display:none;position:absolute;left:48%;right:0;top:22%;bottom:0;pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none}.gip-root[data-touch="true"] .gip-look,.gip-root[data-touch="true"] .gip-joystick{display:block}.gip-root[data-touch="true"] .gip-key,.gip-root[data-touch="true"] .gip-desktop-hint{display:none}.gip-root[data-paused="true"] .gip-look,.gip-root[data-paused="true"] .gip-joystick,.gip-root[data-paused="true"] .gip-actions{visibility:hidden}.gip-root[data-paused="true"] .gip-head{opacity:.55}
.gip-cine{position:absolute;inset:0;pointer-events:auto;touch-action:none;background:transparent}.gip-cine::before{content:"";position:absolute;left:0;right:0;bottom:0;height:29%;background:linear-gradient(transparent,rgba(3,6,10,.25) 22%,rgba(3,6,10,.86));pointer-events:none}.gip-bars::before,.gip-bars::after{content:"";position:absolute;left:0;right:0;height:5%;background:#040609;pointer-events:none}.gip-bars::before{top:0}.gip-bars::after{bottom:0}.gip-chapter{position:absolute;left:calc(17px + var(--gip-safe-left));top:calc(5% + 10px + var(--gip-safe-top));max-width:calc(100% - 115px - var(--gip-safe-left) - var(--gip-safe-right));font-size:9px;line-height:1.3;letter-spacing:.17em;color:#e9cc95;text-shadow:0 1px 7px #000;font-weight:700}.gip-skip{position:absolute;top:calc(5% + 3px + var(--gip-safe-top));right:calc(12px + var(--gip-safe-right));min-width:60px;min-height:44px;padding:9px 12px;background:rgba(6,9,14,.68);border:1px solid rgba(242,219,174,.3);border-radius:5px;font-size:10px!important;letter-spacing:.08em}
.gip-sub{position:absolute;left:50%;bottom:calc(5% + 12px + var(--gip-safe-bottom));transform:translateX(-50%);width:min(800px,calc(100% - 40px - var(--gip-safe-left) - var(--gip-safe-right)));max-height:20%;padding:0 10px;text-align:center;text-shadow:0 2px 4px #000,0 2px 13px #000;pointer-events:none}.gip-speaker{font-size:10px;line-height:1.2;font-weight:750;letter-spacing:.16em;color:#edd19c;margin-bottom:5px}.gip-line{font-size:17px;line-height:1.34;font-weight:520;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;white-space:normal;color:#fff9ef}
.gip-final{position:absolute;left:8%;right:8%;top:44%;transform:translateY(-50%);text-align:center;opacity:0;pointer-events:none;text-shadow:0 3px 18px #000,0 0 38px #17131b}.gip-final-title{font-family:Georgia,"Times New Roman",serif;font-size:clamp(22px,4.1vw,54px);font-weight:400;letter-spacing:.12em;line-height:1.3;color:#fff0d0}.gip-final-rule{height:1px;max-width:210px;margin:17px auto 14px;background:linear-gradient(90deg,transparent,#f2cf8c,transparent)}.gip-final-sub{font-size:10px;letter-spacing:.24em;color:#edc992;line-height:1.6}
@media(max-width:560px) and (orientation:portrait){.gip-head{top:calc(9px + var(--gip-safe-top));left:calc(10px + var(--gip-safe-left));padding:9px 10px;max-width:calc(100% - 83px)}.gip-objective{font-size:14px}.gip-hint{bottom:calc(167px + var(--gip-safe-bottom));max-width:calc(100% - 34px);width:calc(100% - 34px);font-size:11px}.gip-root[data-touch="false"] .gip-hint{bottom:calc(167px + var(--gip-safe-bottom))}.gip-pause{top:calc(9px + var(--gip-safe-top));right:calc(10px + var(--gip-safe-right))}.gip-chapter{font-size:8px;letter-spacing:.12em}.gip-final-title{font-size:28px;letter-spacing:.09em}.gip-final-sub{font-size:9px;letter-spacing:.13em}.gip-sub{width:calc(100% - 24px);padding:0 5px}.gip-line{font-size:16px}}
@media(orientation:landscape) and (max-height:520px){.gip-head{top:calc(7px + var(--gip-safe-top));left:calc(10px + var(--gip-safe-left));padding:6px 10px 7px;width:min(375px,calc(100% - 90px));}.gip-eyebrow{font-size:8px}.gip-objective{font-size:13px;margin-top:3px}.gip-meta{font-size:9px;margin-top:4px}.gip-meter{margin-top:5px;height:2px}.gip-pause{top:calc(7px + var(--gip-safe-top));right:calc(10px + var(--gip-safe-right));min-width:50px}.gip-actions{right:calc(15px + var(--gip-safe-right));bottom:calc(12px + var(--gip-safe-bottom));grid-template-columns:66px 48px;grid-template-rows:44px 66px;gap:6px}.gip-attack{width:66px;height:66px}.gip-jump{width:48px;height:48px}.gip-interact{max-width:120px}.gip-joystick{width:104px;height:104px;left:calc(23px + var(--gip-safe-left));bottom:calc(18px + var(--gip-safe-bottom))}.gip-hint{bottom:calc(14px + var(--gip-safe-bottom));max-width:calc(100% - 326px);font-size:10px}.gip-hint strong{font-size:11px}.gip-sub{bottom:calc(5% + 8px + var(--gip-safe-bottom));width:min(740px,calc(100% - 70px));}.gip-speaker{font-size:9px;margin-bottom:4px}.gip-line{font-size:14px;line-height:1.3}.gip-chapter{top:calc(5% + 9px + var(--gip-safe-top));font-size:8px}.gip-final-title{font-size:clamp(23px,4vw,39px)}.gip-final-rule{margin:10px auto 8px}.gip-final-sub{font-size:9px}}
@media(prefers-reduced-motion:reduce){.gip-meter>i{transition:none}}
`;

    function settings() {
        try { return loadSettings() || {}; } catch (_) { return {}; }
    }

    function create(game, callbacks = {}) {
        let disposed = false;
        let pageInactive = false;
        let film = null;
        let hud = { stage: 0, objective: 'Enter the archive.', hint: '', progress: '', integrity: null, canInteract: false, nearLabel: '', attackLabel: 'ATTACK', paused: false, replay: false };
        let lastHudKey = '';
        let joy = null, look = null, attack = null, holdTimer = null;
        let skipBusy = false;
        const listeners = [];
        const vCamera = new THREE.Vector3(), vLook = new THREE.Vector3();
        const root = document.createElement('div');
        root.className = 'gip-root';
        root.setAttribute('aria-label', 'Grand Inquisitor quest');
        root.innerHTML = `<style>${CSS}</style>
<div class="gip-gameplay">
 <div class="gip-look" aria-hidden="true"></div>
 <div class="gip-head"><div class="gip-eyebrow">GRAND INQUISITOR</div><div class="gip-objective"></div><div class="gip-meta"><span class="gip-stage"></span><span class="gip-progress"></span><span class="gip-integrity" hidden><em>RECORD</em><i></i><i></i><i></i></span></div><div class="gip-meter" hidden><i></i></div></div>
 <button type="button" class="gip-pause" aria-label="Pause quest or return">PAUSE</button>
 <div class="gip-hint"><strong></strong><span class="gip-desktop-hint">WASD move · drag to look · Q attack · E interact</span></div>
 <div class="gip-joystick" aria-label="Movement joystick"><span class="gip-stick"></span><span class="gip-joy-label">MOVE</span></div>
 <div class="gip-actions">
  <button type="button" class="gip-action gip-interact" aria-label="Interact" disabled><span class="gip-action-label">INTERACT</span><span class="gip-key">E</span></button>
  <button type="button" class="gip-action gip-attack" aria-label="Attack: tap for a full sequence, hold to repeat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 18 6M11 5l8-1-1 8M4 14l6 6"/></svg><span class="gip-action-label">ATTACK</span><span class="gip-key">Q · HOLD</span></button>
  <button type="button" class="gip-action gip-jump" aria-label="Jump"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 7-7 7 7M12 5v13M5 20h14"/></svg><span class="gip-action-label">JUMP</span><span class="gip-key">SPACE</span></button>
 </div>
</div>
<div class="gip-cine" hidden aria-label="Quest cinematic">
 <div class="gip-bars"></div><div class="gip-chapter"></div><button type="button" class="gip-skip" aria-label="Skip current cinematic">SKIP</button>
 <div class="gip-final"><div class="gip-final-title">THE INQUISITION BEGINS</div><div class="gip-final-rule"></div><div class="gip-final-sub">THE PEG IS THE BEGINNING</div></div>
 <div class="gip-sub" aria-live="polite" aria-atomic="true"><div class="gip-speaker"></div><div class="gip-line"></div></div>
</div>`;
        document.body.appendChild(root);
        const q = (s) => root.querySelector(s);
        const els = {
            play: q('.gip-gameplay'), head: q('.gip-head'), eyebrow: q('.gip-eyebrow'), objective: q('.gip-objective'), stage: q('.gip-stage'), progress: q('.gip-progress'), meter: q('.gip-meter'), fill: q('.gip-meter>i'), integrity: q('.gip-integrity'), integrityBars: Array.from(root.querySelectorAll('.gip-integrity i')), pause: q('.gip-pause'), hint: q('.gip-hint strong'), actions: q('.gip-actions'), attack: q('.gip-attack'), attackLabel: q('.gip-attack .gip-action-label'), interact: q('.gip-interact'), interactLabel: q('.gip-interact .gip-action-label'), jump: q('.gip-jump'), joy: q('.gip-joystick'), stick: q('.gip-stick'), look: q('.gip-look'), cine: q('.gip-cine'), chapter: q('.gip-chapter'), speaker: q('.gip-speaker'), line: q('.gip-line'), sub: q('.gip-sub'), skip: q('.gip-skip'), final: q('.gip-final')
        };
        const on = (target, type, fn, options) => {
            target.addEventListener(type, fn, options);
            listeners.push(() => target.removeEventListener(type, fn, options));
        };
        const capture = (el, e) => { try { el.setPointerCapture(e.pointerId); } catch (_) {} };
        const release = (el, id) => { try { if (id != null && el.hasPointerCapture(id)) el.releasePointerCapture(id); } catch (_) {} };
        const consume = (e) => { if (e.cancelable) e.preventDefault(); e.stopPropagation(); };
        const allowed = () => !disposed && !film && !hud.paused && !document.hidden;
        const ensureGesture = () => { try { game.sfx?.ensure?.(); } catch (_) {} };

        let media = null;
        try { media = window.matchMedia('(pointer: coarse)'); } catch (_) {}
        function syncTouch() {
            const touch = media ? media.matches : (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
            root.dataset.touch = touch ? 'true' : 'false';
            if (!touch) clearInputs(false);
        }
        if (media?.addEventListener) on(media, 'change', syncTouch);
        else if (media?.addListener) { media.addListener(syncTouch); listeners.push(() => media.removeListener(syncTouch)); }

        // The existing AudioContext is shared. Only our own graph is touched.
        const audio = { ctx: null, pad: null, noise: null, voices: new Set(), noiseBuffer: null, noiseCtx: null, settingsClock: 0, pulseClock: 0, stage: -1 };
        function disconnect(nodes) {
            for (const node of nodes || []) { try { node.disconnect(); } catch (_) {} }
        }
        function stopGraph(graph) {
            if (!graph) return;
            for (const source of graph.sources || []) { try { source.stop(); } catch (_) {} }
            disconnect(graph.nodes);
        }
        function stopAudio() {
            stopGraph(audio.pad); stopGraph(audio.noise);
            audio.pad = null; audio.noise = null;
            for (const voice of Array.from(audio.voices)) { stopGraph(voice); audio.voices.delete(voice); }
            audio.ctx = null; audio.stage = -1; audio.pulseClock = 0; audio.settingsClock = 0;
        }
        function contextReady() {
            const ctx = game.sfx?.ctx;
            return !disposed && !pageInactive && !hud.paused && !document.hidden && ctx?.state === 'running' ? ctx : null;
        }
        function noiseBuffer(ctx) {
            if (audio.noiseBuffer && audio.noiseCtx === ctx) return audio.noiseBuffer;
            const count = Math.max(4096, Math.floor(ctx.sampleRate * 1.6));
            const buffer = ctx.createBuffer(1, count, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            let previous = 0;
            for (let i = 0; i < count; i++) { previous = (previous + (Math.random() * 2 - 1) * 0.035) / 1.018; data[i] = previous; }
            audio.noiseBuffer = buffer; audio.noiseCtx = ctx;
            return buffer;
        }
        function beginPad(ctx) {
            const bus = ctx.createGain(); bus.gain.value = 0; bus.connect(ctx.destination);
            const nodes = [bus], sources = [], voices = [];
            const ratios = [1, 1.5, 2.002, 3.001], levels = [.75, .2, .12, .045];
            for (let i = 0; i < ratios.length; i++) {
                const osc = ctx.createOscillator(), gain = ctx.createGain();
                osc.type = i === 3 ? 'triangle' : 'sine'; osc.frequency.value = 55 * ratios[i]; gain.gain.value = levels[i];
                osc.connect(gain).connect(bus); osc.start(); nodes.push(osc, gain); sources.push(osc); voices.push({ osc, ratio: ratios[i] });
            }
            audio.pad = { bus, voices, nodes, sources }; audio.stage = -1;
        }
        function beginAir(ctx) {
            const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), bus = ctx.createGain();
            source.buffer = noiseBuffer(ctx); source.loop = true; filter.type = 'bandpass'; filter.frequency.value = 680; filter.Q.value = .55; bus.gain.value = .006;
            source.connect(filter).connect(bus).connect(ctx.destination); source.start();
            audio.noise = { bus, filter, nodes: [source, filter, bus], sources: [source] };
        }
        function tone(ctx, freq, duration, gain, type = 'sine', delay = 0, endFreq = null) {
            if (audio.voices.size >= 24) return;
            const now = ctx.currentTime + delay, osc = ctx.createOscillator(), envelope = ctx.createGain();
            const voice = { sources: [osc], nodes: [osc, envelope] };
            audio.voices.add(voice); osc.type = type; osc.frequency.setValueAtTime(freq, now);
            if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(25, endFreq), now + duration);
            envelope.gain.setValueAtTime(.0001, now);
            envelope.gain.exponentialRampToValueAtTime(Math.max(.0002, gain), now + Math.min(.045, duration * .15));
            envelope.gain.exponentialRampToValueAtTime(.0001, now + duration);
            osc.connect(envelope).connect(ctx.destination);
            osc.onended = () => { disconnect(voice.nodes); audio.voices.delete(voice); };
            osc.start(now); osc.stop(now + duration + .04);
        }
        function bell(ctx, freq, level = .024, duration = 2.3) {
            tone(ctx, freq, duration, level, 'sine');
            tone(ctx, freq * 2.012, duration * .6, level * .42, 'sine', .015);
            tone(ctx, freq * 3.93, duration * .3, level * .16, 'sine', .025);
        }
        function cue(kind) {
            const ctx = contextReady();
            if (!ctx || settings().sfx === false) return;
            try {
                if (kind === 'seal') { bell(ctx, 146.83, .023, 1.7); tone(ctx, 64, .5, .029, 'triangle', 0, 39); }
                else if (kind === 'align') { [164.81, 246.94, 329.63].forEach((f, i) => tone(ctx, f, 1.8, .013 - i * .002, 'sine', i * .095)); }
                else if (kind === 'hit') { tone(ctx, 132, .2, .038, 'triangle', 0, 51); tone(ctx, 670, .12, .012, 'sine', .015, 260); }
                else if (kind === 'purge') { tone(ctx, 73.4, 1.1, .029, 'triangle', 0, 41.2); bell(ctx, 207.65, .014, 1.6); }
                else if (kind === 'clock') bell(ctx, 110, .026, 3.0);
                else if (kind === 'boss') { tone(ctx, 55, 1.7, .038, 'sine', 0, 35); tone(ctx, 164.81, 1.3, .018, 'triangle', .08, 82.41); bell(ctx, 82.41, .018, 3.1); }
                else if (kind === 'door') { [82.41, 123.47, 164.81, 246.94].forEach((f, i) => tone(ctx, f, 3.8 - i * .25, .02 - i * .003, 'sine', i * .14)); }
            } catch (_) { /* Audio is optional on browsers that reject a graph. */ }
        }
        function tickAudio(dt, stage) {
            const ctx = contextReady();
            if (!ctx) { if (audio.ctx || audio.pad || audio.noise || audio.voices.size) stopAudio(); return; }
            if (audio.ctx && audio.ctx !== ctx) stopAudio();
            audio.ctx = ctx; audio.settingsClock -= dt;
            if (audio.settingsClock > 0) return;
            audio.settingsClock = .2;
            const prefs = settings();
            try {
                if (prefs.music === false) { stopGraph(audio.pad); audio.pad = null; }
                else {
                    if (!audio.pad) beginPad(ctx);
                    const fundamentals = [55, 61.735, 51.913, 55, 41.203, 82.407];
                    const base = fundamentals[clamp(stage, 0, 5)];
                    if (audio.stage !== stage) for (const item of audio.pad.voices) item.osc.frequency.setTargetAtTime(base * item.ratio, ctx.currentTime, 1.8);
                    const strength = film ? .023 : (stage === 4 ? .019 : .014);
                    audio.pad.bus.gain.setTargetAtTime(strength, ctx.currentTime, 1.1);
                }
                if (prefs.sfx === false) {
                    stopGraph(audio.noise); audio.noise = null;
                    for (const voice of Array.from(audio.voices)) { stopGraph(voice); audio.voices.delete(voice); }
                } else {
                    if (!audio.noise) beginAir(ctx);
                    audio.noise.bus.gain.setTargetAtTime(film ? .007 : .0045, ctx.currentTime, 1.2);
                    audio.noise.filter.frequency.setTargetAtTime(stage === 2 ? 1050 : 580, ctx.currentTime, 2);
                }
                audio.stage = stage;
            } catch (_) { stopAudio(); }
        }

        function clearInputs(stopSequence = false) {
            if (holdTimer != null) { window.clearTimeout(holdTimer); holdTimer = null; }
            const oldJoy = joy, oldLook = look, oldAttack = attack;
            joy = null; look = null; attack = null;
            game.touchMoveVec = null;
            els.stick.style.transform = 'translate(0px, 0px)';
            els.attack.dataset.held = 'false';
            release(els.joy, oldJoy?.id); release(els.look, oldLook?.id); release(els.attack, oldAttack?.id);
            if (oldAttack?.loop || stopSequence) callbacks.attackStop?.();
        }
        function moveJoystick(e) {
            if (!joy || joy.id !== e.pointerId) return;
            const dx = e.clientX - joy.x, dz = e.clientY - joy.y, length = Math.hypot(dx, dz), radius = 45;
            const amount = length > radius ? radius / length : 1;
            const x = dx * amount, z = dz * amount;
            game.touchMoveVec = { x: x / radius, z: z / radius };
            game.moveTarget = null;
            els.stick.style.transform = `translate(${x.toFixed(1)}px, ${z.toFixed(1)}px)`;
        }
        on(els.joy, 'pointerdown', (e) => {
            consume(e); if (!allowed() || joy || e.pointerType === 'mouse') return;
            ensureGesture(); const rect = els.joy.getBoundingClientRect();
            joy = { id: e.pointerId, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            capture(els.joy, e); moveJoystick(e);
        });
        on(els.joy, 'pointermove', (e) => { if (joy?.id === e.pointerId) { consume(e); moveJoystick(e); } });
        const stopJoy = (e) => { if (joy?.id !== e.pointerId) return; consume(e); const id = joy.id; joy = null; game.touchMoveVec = null; els.stick.style.transform = 'translate(0px, 0px)'; release(els.joy, id); };
        for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) on(els.joy, name, stopJoy);
        on(els.look, 'pointerdown', (e) => {
            consume(e); if (!allowed() || look || e.pointerType === 'mouse') return;
            ensureGesture(); look = { id: e.pointerId, x: e.clientX, y: e.clientY }; capture(els.look, e);
        });
        on(els.look, 'pointermove', (e) => {
            if (look?.id !== e.pointerId) return; consume(e);
            const dx = e.clientX - look.x, dy = e.clientY - look.y; look.x = e.clientX; look.y = e.clientY;
            if (allowed()) game.touchLook?.(dx, dy);
        });
        const stopLook = (e) => { if (look?.id !== e.pointerId) return; consume(e); const id = look.id; look = null; release(els.look, id); };
        for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) on(els.look, name, stopLook);
        on(els.attack, 'pointerdown', (e) => {
            consume(e); if (!allowed() || attack || (e.pointerType === 'mouse' && e.button !== 0)) return;
            ensureGesture(); attack = { id: e.pointerId, loop: false }; capture(els.attack, e); els.attack.dataset.held = 'true';
            callbacks.attackStart?.(false);
            holdTimer = window.setTimeout(() => {
                holdTimer = null; if (!attack || attack.id !== e.pointerId || !allowed()) return;
                attack.loop = true; callbacks.attackStart?.(true);
            }, 350);
        });
        const stopAttack = (e) => {
            if (attack?.id !== e.pointerId) return; consume(e);
            const current = attack; attack = null;
            if (holdTimer != null) { window.clearTimeout(holdTimer); holdTimer = null; }
            els.attack.dataset.held = 'false'; release(els.attack, current.id);
            // A released tap completes its full animation sequence. Only an
            // explicitly armed hold-loop is cancelled on release/cancel.
            if (current.loop) callbacks.attackStop?.();
        };
        for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) on(els.attack, name, stopAttack);
        on(els.attack, 'click', (e) => { consume(e); if (e.detail === 0 && allowed()) { ensureGesture(); callbacks.attackStart?.(false); } });
        function actionButton(el, fn) {
            on(el, 'pointerdown', (e) => { consume(e); if (!allowed() || el.disabled || (e.pointerType === 'mouse' && e.button !== 0)) return; ensureGesture(); fn(); });
            on(el, 'click', (e) => { consume(e); if (e.detail === 0 && allowed() && !el.disabled) { ensureGesture(); fn(); } });
        }
        actionButton(els.interact, () => callbacks.interact?.());
        actionButton(els.jump, () => game.touchJump?.());
        on(els.pause, 'click', (e) => {
            consume(e); if (disposed || film) return;
            clearInputs(true); stopAudio(); callbacks.pause?.();
        });
        on(els.skip, 'click', (e) => {
            consume(e); if (!film || skipBusy || disposed) return;
            skipBusy = true; clearInputs(true);
            try { if (callbacks.skip) callbacks.skip(); else finish(); }
            finally { skipBusy = false; }
        });
        for (const type of ['pointerdown', 'pointermove', 'pointerup', 'click', 'contextmenu']) on(els.cine, type, (e) => { if (e.target !== els.skip) consume(e); });
        on(root, 'contextmenu', consume);
        on(window, 'blur', () => { pageInactive = true; clearInputs(true); stopAudio(); });
        on(window, 'focus', () => { pageInactive = false; });
        on(document, 'visibilitychange', () => { if (document.hidden) { clearInputs(true); stopAudio(); } });
        syncTouch();

        function currentStage(state) {
            const candidate = state?.stage ?? game.inquisitorRuntime?.stage ?? game.inquisitorState?.stage ?? hud.stage;
            return clamp(Number.isFinite(Number(candidate)) ? Math.floor(Number(candidate)) : 0, 0, 5);
        }
        function setHUD(state = {}) {
            if (disposed) return;
            const beforePause = hud.paused;
            hud = { ...hud, ...state };
            hud.stage = currentStage(hud);
            const key = JSON.stringify([hud.stage, hud.objective, hud.hint, hud.progress, hud.integrity, hud.canInteract, hud.nearLabel, hud.attackLabel, hud.paused, hud.replay]);
            if (key === lastHudKey) return;
            lastHudKey = key; root.dataset.paused = hud.paused ? 'true' : 'false';
            if (hud.paused && !beforePause) { clearInputs(true); stopAudio(); }
            els.eyebrow.textContent = hud.replay ? 'GRAND INQUISITOR · REPLAY' : 'GRAND INQUISITOR';
            els.objective.textContent = String(hud.objective || 'Follow the record.');
            els.stage.textContent = `${String(hud.stage + 1).padStart(2, '0')} / 06 · ${STAGES[hud.stage]}`;
            let text = '', fraction = null;
            if (hud.progress != null && hud.progress !== '') {
                if (typeof hud.progress === 'object') {
                    const current = Number(hud.progress.current ?? hud.progress.value), total = Number(hud.progress.total ?? hud.progress.max);
                    if (Number.isFinite(current) && total > 0) { fraction = clamp(current / total, 0, 1); text = hud.progress.label || `${Math.floor(current)} / ${Math.floor(total)}`; }
                    else text = hud.progress.label || '';
                } else if (typeof hud.progress === 'number') {
                    fraction = clamp(hud.progress > 1 ? hud.progress / 100 : hud.progress, 0, 1); text = `${Math.round(fraction * 100)}%`;
                } else text = String(hud.progress);
            }
            els.progress.textContent = text; els.progress.hidden = !text; els.meter.hidden = fraction == null;
            if (fraction != null) els.fill.style.width = `${fraction * 100}%`;
            const integrity = Number(hud.integrity);
            const showIntegrity = hud.integrity != null && Number.isFinite(integrity);
            els.integrity.hidden = !showIntegrity;
            if (showIntegrity) {
                // Runtime integrity is an explicit three-hit checkpoint meter.
                const normalized = clamp(integrity / 3, 0, 1);
                const segments = Math.ceil(normalized * 3);
                els.integrityBars.forEach((bar, i) => bar.classList.toggle('on', i < segments));
                els.integrity.dataset.low = normalized < .34 ? 'true' : 'false';
                els.integrity.setAttribute('aria-label', `Record integrity ${Math.round(normalized * 100)} percent`);
            }
            els.hint.textContent = hud.paused ? 'Quest paused.' : String(hud.hint || (root.dataset.touch === 'true' ? 'Move with the left stick · swipe right to look' : ''));
            els.hint.hidden = !els.hint.textContent;
            els.interact.disabled = !hud.canInteract || !!hud.paused;
            els.interact.dataset.ready = hud.canInteract ? 'true' : 'false';
            els.interactLabel.textContent = String(hud.nearLabel || 'INTERACT');
            els.interact.setAttribute('aria-label', String(hud.nearLabel || 'Interact'));
            els.attackLabel.textContent = String(hud.attackLabel || 'ATTACK');
            els.attack.disabled = !!hud.paused; els.jump.disabled = !!hud.paused;
            els.pause.textContent = hud.paused ? 'RETURN' : 'PAUSE';
        }
        function reducedMotion() {
            if (settings().shake === false) return true;
            try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; }
        }
        function play(id, onFinish) {
            if (disposed) return false;
            const clip = clips.find((entry) => entry.id === Number(id));
            if (!clip || !game.camera) return false;
            if (film) finish(false);
            clearInputs(true);
            film = { id: clip.id, clip, t: 0, savedFov: game.camera.fov, onFinish, line: -2, shot: -1, cues: new Set(), reduced: reducedMotion(), stage: currentStage() };
            els.play.hidden = true; els.cine.hidden = false; els.chapter.textContent = clip.title;
            els.sub.hidden = true; els.speaker.textContent = ''; els.line.textContent = ''; els.final.style.opacity = '0';
            els.skip.disabled = false;
            tick(0, game.inquisitorRuntime || game.inquisitorState || hud);
            return true;
        }
        function finish(invoke = true) {
            if (!film) return false;
            const ended = film; film = null;
            els.cine.hidden = true; els.play.hidden = false; els.final.style.opacity = '0';
            els.sub.hidden = true; els.line.textContent = ''; els.speaker.textContent = '';
            if (game.camera && Number.isFinite(ended.savedFov)) { game.camera.fov = ended.savedFov; game.camera.updateProjectionMatrix?.(); }
            clearInputs(true);
            if (invoke && !disposed && typeof ended.onFinish === 'function') ended.onFinish();
            return true;
        }
        function cameraPoint(out, a, b, u, anchor, stage, state) {
            const p = game.playerPos || game.player?.position;
            const local = state?.witnessLocal;
            const witness = anchor === 'witness'
                ? (Array.isArray(local) && local.length >= 3 && local.slice(0, 3).every(Number.isFinite) ? local : [0, 1.8, 28])
                : [0, 0, 0];
            const ox = anchor === 'player' && p ? p.x : 1600 + witness[0];
            const oy = anchor === 'player' && p ? p.y : 24 + witness[1];
            const oz = anchor === 'player' && p ? p.z : 1600 - stage * 160 + witness[2];
            out.set(ox + a[0] + (b[0] - a[0]) * u, oy + a[1] + (b[1] - a[1]) * u, oz + a[2] + (b[2] - a[2]) * u);
            return out;
        }
        function tick(dt, state) {
            if (disposed) return;
            const delta = clamp(Number(dt) || 0, 0, .1);
            if (state && typeof state === 'object' && Object.prototype.hasOwnProperty.call(state, 'paused') && state.paused !== hud.paused) setHUD({ paused: !!state.paused });
            if (document.hidden || hud.paused) { if (audio.ctx || audio.pad || audio.noise || audio.voices.size) stopAudio(); return; }
            const stage = currentStage(state);
            tickAudio(delta, stage);
            const c = film;
            if (!c) return;
            c.stage = stage; c.t = Math.min(c.clip.duration, c.t + delta);
            const index = c.clip.shots.findIndex((s) => c.t >= s.start && c.t < s.end);
            const shotIndex = index < 0 ? c.clip.shots.length - 1 : index;
            const s = c.clip.shots[shotIndex];
            const travel = c.reduced ? .5 : ease(clamp((c.t - s.start) / Math.max(.001, s.end - s.start), 0, 1));
            cameraPoint(vCamera, s.from, s.to, travel, s.anchor, stage, state);
            cameraPoint(vLook, s.look, s.lookTo, travel, s.lookAnchor, stage, state);
            // A replay can begin at a different checkpoint. Keep the authored
            // camera inside this room even when its player anchor is near a wall.
            vCamera.x = clamp(vCamera.x, 1600 - 29.5, 1600 + 29.5);
            vCamera.y = clamp(vCamera.y, 24 + 1.2, 24 + 30);
            vCamera.z = clamp(vCamera.z, 1600 - stage * 160 - 37, 1600 - stage * 160 + 38);
            game.camera.position.copy(vCamera); game.camera.lookAt(vLook);
            // Wider portrait framing keeps the same architectural subject in
            // view. No camera roll, shakes, flashes or postprocessing required.
            const aspect = game.camera.aspect || window.innerWidth / Math.max(1, window.innerHeight);
            const portraitBoost = aspect < 1 ? clamp((1 - aspect) * 27, 0, 18) : 0;
            const fov = clamp(s.fov + portraitBoost, 40, 80);
            if (Math.abs(game.camera.fov - fov) > .01) { game.camera.fov = fov; game.camera.updateProjectionMatrix?.(); }
            c.shot = shotIndex;
            const activeLine = c.clip.lines.findIndex((entry) => c.t >= entry.start && c.t < entry.end);
            if (activeLine !== c.line) {
                c.line = activeLine; const entry = activeLine >= 0 ? c.clip.lines[activeLine] : null;
                els.sub.hidden = !entry; els.speaker.textContent = entry?.who || ''; els.line.textContent = entry?.text || '';
            }
            if (c.id === 6) els.final.style.opacity = String(ease(clamp((c.t - 14.0) / 2.4, 0, 1)) * (1 - clamp((c.t - 19.2) / .8, 0, 1)));
            for (let i = 0; i < c.clip.cues.length; i++) if (!c.cues.has(i) && c.t >= c.clip.cues[i][0]) { c.cues.add(i); cue(c.clip.cues[i][1]); }
            if (c.t >= c.clip.duration) finish();
        }
        function dispose() {
            if (disposed) return;
            finish(false); clearInputs(true); stopAudio(); disposed = true;
            for (const off of listeners.splice(0)) { try { off(); } catch (_) {} }
            audio.noiseBuffer = null; audio.noiseCtx = null;
            root.remove();
        }
        setHUD();
        return { setHUD, play, tick, finish, dispose, cue, get cinematic() { return film; } };
    }

    return { create, clips };
})();

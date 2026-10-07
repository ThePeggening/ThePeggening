# 414 — Reclaimed / The Same Night R5

Prepared October 7, 2026. Maria module revision 4; Sommi module revision 3. Packed integration revision R53.16-414-RECLAIMED-SAME-NIGHT-R5. This source update builds on today's verified R4 PC review, which includes the current working game's uncommitted updates and assets.

## Added playable content

The disconnected exit is now an investigation across four physical evidence terminals. Their field notes establish where the copied voice, local supply, rifle carrier and service lift actually connect. Players collect all four records and reconstruct the cable destinations at the conduit. Incorrect tests retain settings. Reconstructing the route unlocks the original conduit interaction; it does not skip the scene or advance automatically.

The three engine stabilizers now require distinct 4×4 circuit repairs. Players rotate straight and elbow segments to connect all sixteen tiles, remove leaks and reach the specified outlet or central receiver. Cyan segments show connected power. A blueprint hint explains one tile's required directions without changing it. Each repaired circuit must be committed and its stabilizer engaged during the existing gold pulse. The three layouts have different routes and outlets.

The return floor now has four district consoles: homes, clinic, workshop and transit. Each has a solvable 5×5 neighbour-toggle relay board. A press flips its own node and adjacent nodes; all twenty-five must be live. Optional hints identify one step in a valid remaining repair without making that step. The physical consoles display their changing lamp states, and corresponding districts in the city model relight when repaired. All four must be committed before the recorder continues.

Evidence, cable settings, rotated pipe segments, partially repaired relay boards and district completion are saved after each change. Guidance targets unfinished physical terminals before their main console. Retry and pause retain progress. Older saves past these objectives infer completed sub-puzzles; completed saves remain completed. Both routes retain their original 32 objective indices and ten acts. Maria starts after onboarding; Sommi starts after his existing native theft raid. Character saves and native raid saves remain separate.

## Retained R4 work

House recording/order investigation, blackout switch routing, rooftop carrier traces, collapse escape/retry, complete dialogue, scoped model animation, single-act/full recording replay, one-time 414 reward, native campaign isolation, service-lane guidance, camera framing and city-banner suspension are retained. The previous verified R4 build remains available separately.

## Validation

Source checks cover both complete routes, prerequisites and proximity, wrong-answer retention, partial evidence/route/engine/district reload, hints without mutation, all three engine solutions, all four district repairs, final repair commits without premature advancement, legacy and malformed saves, replay/rewards, scene cleanup and animation scope. Synthetic packed-file tests cover UTF-8/UTF-16, module replacement, native hooks, backups, deterministic rebuilding and preservation of unrelated payloads.

Both complete PC Chrome walkthroughs passed: 32 objectives and ten acts per route, keyboard movement, native interior minimaps, pause/resume, checkpoint reload, collapse retry, exactly one 414 reward, unchanged main quests and recording replay. The original native Sommi raid also passed its actual handlers and transitioned into the companion with the case carried and its native save preserved.

All twelve depth-panel combinations passed in Chrome: cable, engine and district interfaces, both routes, desktop and 390×844 touch emulation. All buttons/cells meet the tested 44-pixel minimum; cards stay inside the viewport, scroll when needed, accept touch input and close correctly. Final tile-coordinate and disabled-button styling passed this suite and both complete route walkthroughs. Sixty cinematic shot samples and both portrait encounters were rendered; no frame errors or voice fallback occurred. Source tests also verify district-specific city relighting, actionable hints, solid floors below the new terminals and disposal of their interactables.

Both native tap-to-walk runs completed all 32 objectives with all ten cinematics, no objective teleports, skips, time scaling or frame errors. Each took 408 seconds (6 minutes 48 seconds), solving puzzles with known answers and clicking dialogue promptly. Maria's run counted 957 reading words, Sommi's 944. At an assumed 210 words/minute those imply approximately 273 and 270 additional reading seconds; those estimates are not human measurements. Browser objective tests use direct positioning; the separate native walking baseline uses tap-to-walk, all cinematics, no objective teleports and no time scaling. Portrait tests emulate touch and viewport sizes; they are not physical phone tests.

## Pacing limit

R4's automated walking baseline was 386 seconds. R5 adds substantive player-controlled investigation and seven puzzle boards. The automated R5 timing uses known solutions and promptly clicks text, so it provides a traversal lower bound, not a first-time human duration. The planned 30–45 minute target still requires a human playthrough. No forced waiting or stretched cinematics were added to claim that target. Physical phone testing and measured performance benchmarks remain.

## Play and apply

Review folder: C:\Users\Gamer\Desktop\ThePeggening-414-R5-Review

Local review URL: http://127.0.0.1:8416/index.html?classic

Copy quests/, tools/ and docs/ into an isolated copy of today's latest checkout, retaining its index.html and all assets, then run:

```sh
python3 tools/build-maria-414.py
```

The builder saves the first input as index.pre-414-r5.backup.html, validates codec roundtrip and JavaScript syntax, and preserves all other twelve packed payloads. Missing anchors stop the build before output is written. The final review index.html is 71,119,106 bytes, SHA256 fc224b1f225913fa9f300bf000c135c4e620ff1e68c006d4f4cf8765eeebc48b. The original working checkout was retained and its SHA256 remains 8e52d941a8e39c4c794d8c971bf28f65c03d014975481f62a94fa0191daaa39b. These results were recorded before GitHub publication.

Source verification:

```sh
python3 tools/generate-sommi-414-mirror.py
python3 tools/test-maria-414-builder.py
node tools/test-maria-414-source.cjs
node tools/test-sommi-414-mirror.cjs
node tools/test-414-puzzles.cjs
node tools/test-414-depth.cjs
node tools/test-414-reliability.cjs
node tools/test-414-animation.cjs
node tools/test-414-service-lanes.cjs
```

Browser verification (requires Puppeteer and the full checkout served locally):

```sh
node tools/test-maria-414.cjs
node tools/test-sommi-414-browser.cjs
node tools/test-sommi-native-transition.cjs
node tools/test-414-depth-browser.cjs
node tools/test-414-native-traversal.cjs
node tools/test-sommi-414-native-traversal.cjs
node tools/review-414-shots.cjs
```

MARIA414_PUPPETEER selects an installed Puppeteer module; MARIA414_URL selects the locally served review. Source scene-math tests additionally accept THREE_MODULE_PATH pointing to three.module.js. The source ZIP is a reusable update, not a replacement full game.

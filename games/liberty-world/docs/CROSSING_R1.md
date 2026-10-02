# PCOCK Liberty Crossing — R1

A separate traffic-crossing mini-game built from the current Liberty Runner / LibertySwap visual systems. Runner still has its seven original courses and the R12 lives, objectives, jump cameras and ghost features.

## Play

Open `games/liberty-crossing.html` through the HTTP game server, or choose **NEW · LIBERTY CROSSING** in the Runner main menu. Liberty Valley also offers **Settings → Mini-Games · Fun Only → PCOCK LIBERTY CROSSING**. The `.url` shortcut in the Desktop latest-files folder opens the hosted build; opening the HTML via `file://` is not supported.

City Crossing ends at row 97, at Liberty Square. Endless Traffic continues with progressively faster lanes. Streets extend across the screen instead of following a narrow Runner ribbon. Green islands separate the traffic blocks and are safe places to wait.

## Controls and rules

PC: WASD / arrows move in four directions; Space crosses forward; Escape pauses; F toggles fullscreen. Mobile: the directional pad, CROSS button, canvas taps and directional swipes. Holding a direction repeats hops. There is no crouch input. Landscape is required on phones.

A hop moves one grid step; it does not grant invincibility. Cars move in both directions. Continuous collision checks account for both the peacock and moving car, so a slow frame cannot simply skip a collision.

Two lives: first impact shows the Liberty last-life warning and returns to the last safe island; second impact plants a distance flag and ends the run. Waiting on safe islands is not penalized. Forward progress, quick-crossing chains and close calls add score. Gold seals and cyan Green Wave pickups add variety; Green Wave slows traffic for 4.5 seconds. Run challenges track 40 rows, 5 seals and 3 close calls.

## Reused code and isolation

The renderer, original PCOCK GLB and animated tail, materials, scenery templates, branding, audio, particles and HUD layout editor come from the existing Liberty systems. `crossing-scenery.js` adapts the Runner terrain/palm helpers. `crossing-fleet.js` is a local copy of the existing classic-car mesh factory; it has no runtime dependency on, and makes no changes to, the Most Wanted game.

Vehicle meshes are baked once into instanced geometry, preserving the original double-sided panels. Existing distant vehicle geometry is used outside the close play area. Collision lengths and widths match the rendered fleet dimensions. Scene blocks are streamed and disposed as the player advances.

Settings use `pcock.crossing.settings.v1`; personal bests use `pcock.crossing.records.v1`; HUD layouts use `pcock.crossing.hud.v1`. This mini-game does not write `pcock.save`, award Runner currency or change campaign quests. `?fun=1` disables personal-best writes. QA controls are exposed only with the explicit `?qa=1` query.

## Validation

The dated `libertyswap/work/2026-10-02-PCOCK-Crossing` folder holds unit results, recorded input routes, screenshots and browser checks. A full City Crossing route was replayed against live collision rules with 97 rows, 8 seals, 16 close calls and zero hits; no traffic was removed and no invulnerability was enabled. Desktop and two landscape-mobile viewport checks cover directional input, pause, two-hit failure, restart, win, personal-best persistence and campaign-save isolation. Physical-phone GPU performance is not established by browser emulation.

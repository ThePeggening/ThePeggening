# Liberty Valley Connected R5

This release fixes the smaller reference fan, both ring flights and two measured causes of movement pauses, and connects the current five-course Liberty Runner to the existing Valley campaign. R1–R4 release folders and ZIPs remain unchanged. The save format and browser origin are retained.

## Character and flight repairs

The fan is 1.266 metres wide, down from 1.914 metres in R4. Twenty-one curved vanes have a new original 512 × 1024 painting: fine barbs, green shading, gold and teal rings, brighter blue eyes and lobed centres. Short coverts and a blue feathered rump overlap the skinned body; the complete assembly follows the hip bone. Contact is verified against actual animated mesh vertices in five running poses. The supplied GLBs and reference photograph are unchanged; no emissive glow or character outline hull was added.

Both glide expeditions now support one Jump press followed by held W or a forward stick. The mission updraft deploys the wings during descent, provides 12 seconds of flight and matches sink speed to travel speed. Sprint and wallet upgrades are optional. The persistent Return to launch perch button and missed-flight Retry reset the course and camera; a miss at the fourth ring also offers recovery. Completed flights can be replayed without the guide switching to another expedition.

## Movement pause repairs

Frontier streaming retains matching tiles and builds only the incoming fringe during walking. Typed-array geometry merging avoids cloning each scenery piece. Nearby spatial buckets replace repeated scans of all static collision and ground surfaces. Guide paths calculate cooperatively in short slices, reuse their remaining waypoints and replan when the objective changes or the player leaves the route. While planning, the destination remains marked and the HUD explains that a safe gold trail is being found. Fixed movement remains 60 Hz; display deadlines retain fractional time on 144/240 Hz screens. Explicit graphics presets keep their resolution.

The controlled 720-update desktop trace reduced the largest scenery update from 111 ms to 9.9 ms. Three cold route searches formerly blocked for 748–1,336 ms; the new search slices measured at most 2 ms. These measurements isolate CPU work on this desktop GPU, not sustained performance on every device. Teleports deliberately fill scenery immediately. Evidence: `valley-r5-before-diagnostic.json` and `valley-r5-after-diagnostic.json`.

## Liberty Runner connection

Map → Play Liberty Runner opens the latest R6 five-course game; the Liberty Runner world gate opens the same entry. The header's Valley link resumes the saved adventure directly. Valley saves its position before leaving. Runner retains its own currency, perks, tour, best times and daily challenges; campaign feathers, practice-wallet receipts, expeditions and shared XP remain intact. Main-story completion still requires no arcade game. Ghost Route remains optional and Peg Keeper remains on hold.

The package includes Runner's current entry, renderer, track, loop, geometry, world, surfaces, biomes, tour, styles and five existing engine-photo course cards. No separate account, backend or service worker is introduced. All finance remains fictional and the exact disclaimer is retained.

## Verification and preservation

`valley-r5.json` covers actual one-jump/held-W flights, fourth-ring recovery, five animated attachment poses, 60/144/240 Hz deadlines and the Runner round trip. `valley-r5-mobile.json` repeats both flights and return controls at 390 × 844 and 844 × 390 using independent touch pointers. Tests use isolated saves and request-only probes; only travel/setup is accelerated. The campaign, all nine controller-driven expeditions, guided content, terrain, sustained Sprint, swap, touch, cinematic and Runner regressions also pass. Observed Valley Medium maxima: 111 complete-frame calls, 144,826 triangles and 32.36 MiB textures.

Historical generated PNG evidence was moved into the pre-R5 checkpoint, with original/destination paths, sizes and verified SHA-256 hashes in `valley-r4-shot-archive.json`. Supplied originals/reference folders remain in place. The pre-edit checkpoint is recorded in `valley-before-r5-checkpoint.json`; the final working copy is recorded separately in `valley-r5-checkpoint.json`.

Human story/art/feel review, physical-phone measurements, font clearance and publication approval remain deferred in `CHECK_RELEASE_LATER.txt`. This release is locally packaged, not automatically published.

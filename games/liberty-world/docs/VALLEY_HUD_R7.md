# Liberty Valley R7

The offscreen distance badge now uses the actual responsive HUD rectangles. It moves to the nearest clear position with a 12px gap from the objective, brand, counters, toolbar, minimap, signal, flight return and touch controls. Metres remain on one line. HUD measurements are cached and refreshed only after layout changes; observers disconnect when the game is disposed.

Start Over and Restore now rebuild the game in the current page. The old renderer, scene, input, audio, HUD, story and save subscriptions are disposed before a fresh save and scene are loaded. The address can retain `return=runner`: a deliberate reset still opens PLAY and the Prologue. Controls remain inactive until the new scene is ready. Settings have explicit accessible names and refer to the new save after each rebuild.

The existing reset confirmation, complete-save backup, failure handling and Restore Previous Game remain. Updating or opening R7 does not reset progress or replace the restart backup. Tests reset fictional saves on isolated origins; the player's port-8080 save is never deliberately reset during delivery.

`tools/valley-r7-acceptance.mjs` blocks document navigation, clicks Start Over/Restore, verifies disposal, advances the fresh opening and checks keyboard movement. It also exercises Journal, Guide, Wallet, Map, Pause, graphics/motion/handedness settings, Back/Resume and a real Photo download. Forty-eight camera projections at each of 1280x675, 390x844 and 844x390 show no distance-badge overlaps or clipping. Evidence: `docs/checks/valley-r7.json` and `shots/r7-hud-*.jpg`.

An isolated native in-app browser check also reaches PLAY and the beginning of the story at the unchanged return URL. Packaged entry, save restoration and Runner-return checks follow the source checks. The seven-chapter campaign, shared units and boot checks are rerun; the articulated tail, completed optional games and supplied assets are retained.

R1-R6 releases and supplied originals are preserved. Eighty-two older generated QA captures (13,690,396 bytes) are retained outside the source tree with original/destination paths and verified hashes in `docs/checks/valley-r6-shot-archive.json` and `valley-r7-other-shot-archive.json`. Human story/art/feel, physical-phone performance, font clearance and publication reviews remain deferred in CHECK_RELEASE_LATER.txt.

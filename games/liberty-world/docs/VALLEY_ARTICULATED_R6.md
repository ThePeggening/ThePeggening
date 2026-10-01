# Liberty Valley R6

PCOCK now uses 21 closed, volumetric 3D eye-feathers mounted behind the arms, with separate animated hinges. Valley, Liberty Runner and Ghost Route use the same reference fan. The smaller spread, detailed original green/gold/turquoise/blue painting and blue rump/coverts remain. The entire fan follows the hip; individual feathers gently lag and settle during running and gliding. Reduced Motion removes the oscillation. The supplied photograph and character GLBs are unchanged.

The vanes share one skinned draw call, one 512 x 1024 texture and 22 bones including the root. The feather mesh has 4,368 triangles. Twenty samples across the full imported running clip have no measured arm-vertex intersections with the closed vanes; the connector overlaps actual animated body vertices in every sample. This geometry test is supported by back/side visual captures, not a claim about every possible future animation.

## Completed games only

The earlier chat, "Build Stage 1 of Feathers of Liberty", recorded completed Stage 3 Gasless Run and Stage 4 Ghost Route checkpoints, then the human explicitly held Peg Keeper. "Build Liberty Swap runner game" subsequently completed the five-course Runner R6. The active catalog therefore contains only Liberty Runner and Ghost Route. Peg Keeper is absent from Valley gates, Guide, campaign requirements and the release payload; its direct source URL displays an unavailable notice. The historical prototype and existing Peg save fields are preserved. The achievement that formerly required all three games now requires both enabled games. Source chat IDs and the audit are in `docs/checks/mini-game-status-r6.json`.

## Start Over and recovery

Title screen and Pause each contain Start Over. The review explains the reset scope and defaults to Keep playing. Start Over Again first backs up the complete current shared save, then resets campaign, wallet, equipment, collectibles, Feathers, XP and all mini-game records. Global graphics/audio/controls and Runner graphics settings remain. Restore Previous Game restores that backup after confirmation, including historical Peg records. The previous backup is replaced by the next deliberate restart. A backup or save-storage failure leaves current progress intact. Original save creation dates now survive migration/restoration.

Tests use isolated browser storage. The user's live saved game is never reset during delivery. The browser origin and save version stay unchanged, so existing quests, equipment, wallet receipts and Runner perks remain available.

## Evidence and preservation

`valley-r6.json` verifies articulation, running clearance, attachment, Runner dimensions, disabled Peg entry and actual public restart/restore buttons. `valley-r6-mobile.json` tests 44px unobscured touch controls at 390 x 844 and 844 x 390. Campaign, flight, cinematics, Runner and Ghost regressions are rerun with the current modules. Package checks verify current module contents, the absence of unfinished game payloads, all entry points, Runner return and a packaged touch restart/restore.

Thirty-eight older generated QA PNGs (15,507,023 bytes) are retained in `C:/Users/Gamer/.cache/pcock-final-checkpoints/Valley-before-R6-1790802011223/historical-generated-shots/`. Original/destination paths and verified SHA-256 hashes are recorded in `docs/checks/valley-r5-shot-archive.json`. Supplied originals, reference folders, current R6 captures and R1-R5 packages remain in place. The pre-edit source/tools/docs checkpoint is recorded in `valley-before-r6-checkpoint.json`.

Human story/art/feel review, physical-phone performance, font clearance and publication remain deferred in CHECK_RELEASE_LATER.txt. Automated completion does not grant those approvals.

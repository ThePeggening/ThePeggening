# P48 audit release

Released from the recovered P48 campaign checkpoint after completing the playable-core audit and the reset/onboarding follow-up.

## Runtime changes

- Preserves valid Core chain progress across save hydration and resumes pending calibration without charging the player twice.
- Commits crystal pickup progress after the economy and quest update, with a verified IndexedDB checkpoint used after an abrupt browser exit.
- Protects imports and full wipes with save generations so stale tabs and queued writes cannot restore deleted or replaced progress.
- Clears game-owned Liberty and Somewhere Before saves, checkpoint data, and postcard data during a full wipe while leaving unrelated browser storage intact.
- Waits for save recovery before starting automatic or requested onboarding. Fresh players receive the Trial, returning completed profiles do not, and explicit replay still works.
- Keeps the full-wipe control visible and usable in the normal pre-game menu, including short portrait and landscape screens. The `?classic` shortcut intentionally bypasses this menu.
- Repairs HUD editor, Phone drag, action prompt, outcome controls, tracker, compass, notification, minimap, and compact-screen layering and hit targets.
- Saves the authored city return position while Dysnomia owns the live player position.
- Connects eligible Event II saves to the existing authored stage-two continuation without changing authored stages, rewards, timers, or validators.
- Moves Most Wanted diagnostic controls outside the host Return button's reserved centre area. All 93 packaged assets remain byte-identical.

## Verification

Fourteen focused browser verification groups passed: remaining Core repairs; earned Event II release; sky-door return; seventh feather and Liberty return; Oracle ending; ending reloads at desktop, portrait, and landscape sizes; pending repair reload; abrupt-exit recovery; import, wipe, and rollback; HUD outcome controls; Phone offsets; portrait balance drag; native full wipe and onboarding; and fresh Maria plus small-screen reset-menu behavior.

The earned campaign state reached Chapter VIII with Chapters I-VII complete, all 38 main quests complete, all seven feathers, the Oracle answered, and the Masterpiece choice saved. Maria 414 and Sommi 414 remain byte-identical to the October 7 R6 release, and 404 unrelated product files were checked as unchanged.

## Evidence limits

Physical-phone performance, audible audio, controller and touch hardware, and human acceptance remain unmeasured. Earlier Trial and PEGWING passes survived as campaign state but their detailed logs were lost during the interrupted cloud run, so they are not claimed as newly replayed evidence. Postcard images are cleared by full wipe but are not included in portable JSON exports.

Build SHA-256: `ce2f472b6442f97231ce268d48de0f1fc6415eaa2a8630c5bec7c42040b88e47`

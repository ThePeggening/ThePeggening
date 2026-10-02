# Liberty World improvements — Stage 1

Build: `PCOCK-VALLEY-BETA-20261002-r17` / `LIBERTY-CONTINUITY-S1`.
Continues the saved, uncommitted Stage 1 work on the `e88aa80` release. Existing world, character models, story IDs and saved rewards are retained.

## Atropa continuity

Atropa owns a persistent return strip outside the child game. Its original close handler still resumes the same Atropa instance. The strip remains available during loading, minigame detours and a failed child page. It invokes the current child’s save-position hook before closing when available.

A frame-local navigation module preserves `from` and `stage` through Valley, Runner, Ghost Route and Crossing, including programmatic Bank & Exit and legacy context-less return links. It does not store host context in shared localStorage or impose it on standalone tabs. Practice stays practice through minigame-to-minigame detours. Returning to Valley resumes its actual saved adventure, not a fake practice save.

The assignment panel explains the requested Atropa stage versus the player’s real Liberty chapter. Earlier chapters are not automatically skipped or awarded. Stage IDs and milestone rules remain intact; Stage 7 still needs the finale. The return invitation waits for the chapter closing scene and Field Guide card rather than interrupting them. The optional Atropa skip remains separate from genuine Liberty progress.

## All three Liberty minigames

The title, toolbar and journal now expose **Liberty Arcade**. It contains **PCOCK Runner**, **Ghost Route** and **Liberty Crossing**, with clear Play versus Practice choices. Settings retains a practice-only route. Crossing also has an in-world gate and a Guide entry; the existing Runner and Ghost gates remain. Gate statistics account for Crossing’s separate local records instead of assuming every game uses the shared save schema.

Runner’s seven courses and R12 mechanics are unchanged. Crossing retains its R2 Scout/Courier systems and separate record storage. Ghost Route retains its existing mechanics and rewards. None is required to complete the main story. No Most Wanted files or original character assets are changed.

## Pool Springs: a playable Chapter 3 pilot

Moss’s original opening, Growth reward, closing scene, Fee Storm and friendship interlude remain. The repeated answer-revealing Pool menus are replaced by a shared-water trial at two physical locations: the spring wheel and the orchard wheel.

Moss provides earmarked `Pool USDC` and `Pool pDAI` lesson stock; depositing matched supplies creates `Pool LP`. This never spends the player’s ordinary equipment USDC, so buying boots or a harness cannot soft-lock the chapter. The two valves share 100 water units: nursery needs at least 30, orchard at least 40, and tomorrow’s reserve at least 20. Several settings satisfy the goal. Sliders and ±10 controls rotate the world wheels and change visible basin levels. A water-flow test checks the actual distribution. The player stakes the practice receipt, then walks back to Moss to receive the existing story reward.

Four idempotent ledger entries record supplies, deposit, the tested water distribution and staking. Repeated clicks do not duplicate stock or receipts. Valves survive reloads and minigame detours. A free reset is available before success; an optional example provides help without silently completing the trial. Already-completed saves keep their feathers/rewards and receive restored visuals without retroactive currency grants. Earlier in-progress Pool lessons are acknowledged rather than erasing old chapter progress.

The added pipes, basins, wheels, level signs and small orchard blooms use the existing Valley palette and scene kit. No terrain or sky is replaced. Control-panel framing keeps the world and PCOCK visible. Reduced Motion retains the task with static flow markers.

## Validation and limits

Local verification passed for all seven Atropa milestone handoffs, wrong-source rejection, normal return to the same parent instance, optional skip, all three minigames in both Play and Practice, old context-less return URLs and a failed child page. Additional tests cover saved position before parent exit, standalone tabs not inheriting an unrelated assignment, normal/practice banking without double credit, and Crossing↔Runner detours.

Website and Telegram-wrapper navigation was exercised at 1280×720, 832×384 and 667×375. All three minigames remain accessible; return controls and Practice semantics persist. All three world gates have clear approach points.

Ten Pool model checks cover invalid and alternate valid distributions, capped water budget, no personal-fund dependency, duplicate protection, reset, older saves and reloads. Desktop and two mobile viewport tests operate the actual sliders/buttons, reject bad distribution, reload valve progress, create four unique practice receipts and reach the original Growth reward and Fee Storm. The original seven-chapter campaign and 19 main scenes still reach the finale and save it; 12 neighbour quests and 9 expeditions retain their existing completion/reward handlers.

The existing cinematic camera solver and foreground handling are reused for the wheel panels, keeping PCOCK and the wheel in view without rebuilding camera or scenery systems. Browser checks use isolated saves, test-only state exposure and accelerated travel/reading where noted. They are not a natural walking playthrough of every route or a physical-phone performance benchmark. Public release checks and the exact commit are recorded in the dated work folder. Stage 2 remains explicitly pending in the improvement tracker.

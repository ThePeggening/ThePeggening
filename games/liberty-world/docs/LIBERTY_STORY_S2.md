# Liberty World — Stage 2: the connected adventure

Build: `PCOCK-VALLEY-BETA-20261002-r18` / `LIBERTY-STORY-S2`. Continues `3d166c7`; the Stage 1 Atropa continuity fix, Arcade and Pool Springs task remain.

## Original world retained

The cozy cartoon 3D baseline, blue/blue-purple sky, consistent green ground and warm paths remain mandatory. This update adds small quest props, controls and consequences to the existing world; it does not replace terrain, lighting, characters, the renderer or any minigame engine. The original scenery placement inputs remain the same. All seven story feather IDs and the existing chapter-opening/closing scenes, Fee Storm, friendship interlude and finale are retained. Most Wanted is outside the change set.

## Chapters 4–7 now have playable tasks

**Stables Foundry.** Three physical controls share one machine state. Both reserves must retain at least 40 of a fixed 100 units. A route must deliver at least 20 cooling units after route and other costs, and have sufficient capacity. The output must reach 30 without exceeding the heat limit. The cheapest-looking fee and largest headline quote are not automatically usable. Several reserve/output settings work. Earmarked Foundry lesson stock, route settlement and calibration have idempotent fictional ledger receipts. Personal equipment USDC is not spent.

**HyperMarket.** The written FESTIVAL-005 rule comes before the prediction. Players may choose YES or NO with ten fictional tokens; either can complete the story. They visit Moss’s stall, the bellkeeper and the signed tower-record post. The evidence distinguishes the first rain bell from a later shift-change bell. Resolution requires the stated source and matching outcome, not the player’s original guess. The notebook, prediction and collected evidence persist. The story reward does not depend on making a winning prediction.

**Vault / Observatory.** Orin issues a sealed LV-006 parcel with checksum 7C6. Players verify the archive, harbor dispatch and far-shore stamps before the Observatory accepts delivery. Similar identifiers, wrong checksums and missing earlier stamps are rejected without losing the parcel. The carried parcel is visible; public status records never expose its private contents. The receipt proves this fictional delivery, not a future price outcome.

**Summit.** Rook’s larger project remains clearly marked COMING. The player completes a real smaller route: collect Ivo’s marked repair kit, install footing/beam/lamp in a valid order, jump through a ridge marker and land, wait briefly with the existing Pulse Guy character at camp, then reach the summit. Walking through the jump marker is insufficient. There is no punitive timer or giant unassisted gap. The original Anticipation reward and finale follow the completed capstone.

## Residents and optional activities

Resident dialogue and a new **The connected Valley** journal board show the chain: Nessa’s deliveries → Moss’s orchard → Ivo’s power → Tavi’s festival → Orin’s verified journey → Rook’s summit. Existing world-restoration effects remain; additional wheels, signs, parcel, repair marker, camp light and planted sprouts reflect the new saved task state.

Three existing neighbour missions now differ in their actions: Moss’s **Three little seeds** plants at three beds; Ivo’s **Borrowed tools** retrieves the roll and aligns a coupling; Orin’s **A map without names** follows an anonymous symbol rather than disclosing private details. Original IDs, giver turn-ins, rewards and ending scenes remain. The other nine neighbour quests and all nine expeditions are retained.

## Guidance and saving

New task panels do not reveal and auto-select the right answer by default. Optional hints explain the method. Invalid choices do not consume earmarked stock. Steps, evidence, route stamps, repairs and receipts survive saves. Already-completed legacy chapters remain completed without invented retrospective currency or receipts. The wallet separates personal balances from expandable lesson stock/receipts so the additional tasks do not create an unreadable row of currencies.

PCOCK Runner, Ghost Route and Liberty Crossing remain in the Arcade, with their Play/Practice modes, gates, records and Stage 1 host/stage preservation. None is required for a story feather. Runner physics, all seven tracks, Crossing Scout/Courier gameplay and original character assets remain unchanged. Telegram is refreshed to the same release.

## Verification and release boundary

The saved full-campaign run reached all seven feathers, 19 original main scene IDs, the finale and a successful reload. The Stage 2 campaign test deliberately chose a losing NO prediction; the festival chapter still completed correctly from the YES evidence outcome. The summit test used the real Jump input and waited for an actual landing. Travel and reading time were accelerated in isolated browser contexts.

Twelve model checks cover machine constraints, alternative valid settings, bad routes without spending, evidence prerequisites, both prediction paths, parcel ID/checksum/order, repair order, jump/landing requirements, the quiet camp wait, neighbour turn-in boundaries, duplicate receipts and legacy saves. UI acceptance also checks wrong evidence/parcel choices, saved route stamps after reload, paused camp timing, and restoration of Pulse Guy’s original location after the capstone.

All 12 neighbour missions and all nine expeditions retain their original completion and reward handlers. Three neighbour variants are exercised through their extra steps before the unchanged giver turn-in. The Stage 1 Pool task is regression-tested through its real wheel controls and four ledger entries. Foundry controls and 31 task locations are checked on desktop and two mobile landscape sizes.

Atropa/Arcade checks cover all seven assignment milestones, all three minigames in both Play and Practice, banking, legacy return URLs and an unavailable child page. Website and Telegram-wrapper checks cover all three games across desktop and two landscape viewports. A partial Vault receipt chain survives each optional minigame detour without changing the fictional wallet or Atropa assignment.

These are automated and browser-emulated checks, not a claim of a complete natural walking playthrough, every collectible being inspected, or physical-phone GPU/Telegram performance certification. The work-folder release report records the exact commit, public deployment verification and any remaining limitations. Original graphics, characters, game engines and Most Wanted stay protected.

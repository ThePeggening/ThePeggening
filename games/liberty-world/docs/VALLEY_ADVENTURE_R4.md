# Liberty Valley Adventure R4

This continues the existing seven-chapter campaign and browser save. The supplied character GLBs and the tail reference photograph remain unchanged. Optional arcade games are still optional, and the separate Liberty Runner work is preserved.

## Playtest repairs

- Harbor Swap uses six small screens. The current field, correct choice and Continue button stay together. Invalid values cannot advance. Both input and change events update the guide.
- Shift and the touch Sprint button sustain an 11 m/s run while held. The running clip loops continuously. Boots raise sprint speed to 13 m/s; release returns to ordinary movement.
- Terrain triangles and character/building placement use the same interpolated height function. The former coarse ground layer sits below all playable ground. Sloped houses have raised foundations.
- Cinematic cameras search for a clear angle. A second visibility pass runs after the world and actors are positioned, including back-facing surfaces; obstructing foreground batches are hidden for that shot and restored afterwards. The background sky follows the current location and altitude.
- All information panels have dark grey borders; gold remains the separate next-action/answer indicator.
- PCOCK wears an original 18-feather green fan with gold, teal and blue eyes, modeled from `photo_2026-09-30_19-03-46.jpg`. A rump connection and hip-bone attachment keep it connected during animation. No character glow was added.

## Expanded adventure

The traversable map is 1,200 × 1,200 metres, versus 500 × 500 previously: 5.76 times the area. Twenty-five reusable frontier terrain tiles and bounded scenery batches keep expansion from increasing every frame's scene cost. Terrain and scenery use deterministic seeds; physics retain fixed steps and rendering interpolation.

Three new regions have nine guided expeditions:

| Region | Activities | Scenery |
| --- | --- | --- |
| Amber Canyon | Signal sequence, supply recovery, archway glide | Sandstone arch, layered outcrops, trail camp, launch perch |
| Cloudreach Highlands | Lantern rescue, ridge instruments, highland glide | Pale ridges, pines, waterfall, lookout and launch perch |
| Tideglass Coast | Tide chests, lighthouse relay, Stormbreak crossing | Sea stacks, boardwalk, coast water and lighthouse |

Expeditions use movement, jumping/gliding, ordered world interactions, moving hazards and checkpoints. Hits return the player to a checkpoint; no lives or funds are lost. Gliding missions have launch platforms and retry controls. Gold targets, replay times and completion lamps record progress. First completion awards practice funds and Feathers; repeats improve records without duplicating money. Nine ending scenes connect the regions to the existing cast.

The Map menu shows the enlarged world and all expeditions. Walking into a camp unlocks free return travel. Guide/H tracks a selected expedition, its current objective and remaining activities. Flight guidance draws through the air; other routes avoid collision and water. The main campaign now includes collecting the Harbor supplies and following cover while carrying Liberty's parcel past a moving Watcher.

## Practice wallet

The Wallet is local fictional game inventory. Nessa issues 300 practice USDC. Harbor Swap moves a chosen amount into practice pDAI, then delivery spends those supplies on the bridge. Story feathers, neighbor quests and expeditions earn practice USDC. The player can buy a six-second gliding harness and faster trail boots. Receipts show the changes and balances.

Transactions use one-time IDs, reject overdrafts and persist alongside the existing save. Older saves continue from their current chapter; unfinished Harbor supplies are migrated. There are no real funds, keys, accounts, wallet connections or network transactions.

## Design research

[Mobius Digital's Outer Wilds description](https://www.mobiusdigitalgames.com/outer-wilds.html) emphasizes curiosity, environmental discoveries and tools used to explore. The application here is a trail of messages and distinct destinations that reveal the next place to investigate.

[Ubisoft's Immortals Fenyx Rising guide](https://news.ubisoft.com/en-us/article/1FGvlOsOvbP0bY84j0PBtR/immortals-fenyx-rising-everything-you-need-to-master-the-golden-isle) describes exploration, puzzles, abilities and a progression hub. The application here is alternating traversal and world puzzles, reusable checkpoints, camps and earned equipment. The implementation, art and narrative are original; no game assets were copied.

## Verification and review

Evidence lives in `docs/checks/valley-r4.json`, `valley-expeditions.json`, `valley-r4-mobile.json`, `valley-cinema.json`, `campaign.json`, `release.json`, `valley-feedback.json`, `valley-activities.json` and `valley-guided.json`. Tests use isolated browser saves. Long trips in campaign/collection tests are accelerated by moving the test character; nine expedition runs use the real movement and hazard systems. Test hooks are injected into requests and are absent from production files.

These are in-engine camera scenes with written dialogue and procedural music; voice acting is not included. Automated desktop and phone-sized browser checks do not constitute a physical-phone measurement or human art/feel approval. Those reviews and publication remain deferred in `CHECK_RELEASE_LATER.txt`.

The pre-R4 source checkpoint is recorded in `valley-before-r4-checkpoint.json`. Previous release folders/ZIPs remain in place. Older large Valley release screenshots were moved, not deleted, into that checkpoint; `valley-r3-shot-archive.json` records every original path, archive path and hash. Current release captures use JPEG to keep the repository inside its size budget.

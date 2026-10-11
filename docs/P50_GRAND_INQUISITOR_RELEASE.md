# P50 — Grand Inquisitor Cicero

## THE UNWRITTEN VERDICT

Grand Inquisitor Cicero receives a character-exclusive introduction in ATROPA: The Peggening. Six playable trials and seven cinematic scenes follow his examination of a surviving pDAI record through a sealed archive and the Tribunal. The selected character remains the player throughout; the Tribunal speaks through the architecture.

The story uses original fictional dialogue and Atropa imagery, including Ethereum/PulseChain mirror ledgers, the pDAI record, and the final 414 reveal.

Play from the normal game link: [ATROPA: The Peggening](https://thepeggening.github.io/ThePeggening/).

Direct update link: [Atropa P50 — Grand Inquisitor](https://thepeggening.github.io/ThePeggening/Atropa-P50-Grand-Inquisitor-Update.html).

## R3 — Native website entry, red guidance, and a kick-first attack

The normal website keeps its original Atropa opening and loads Grand Inquisitor through its existing Classic game. R3 installs the compiled character update directly in that game and removes the R2 redirect. The character chooser retains all twelve bodies, labels Grand Inquisitor Cicero **XII**, and uses a responsive grid so the final choice remains visible on narrow screens. Character buttons have a minimum height of 44 pixels; compact layouts use two rows of six.

All six playable trials now have red directional arrows and a red objective beacon in Atropa's native guidance style. The trail changes with the current objective, including linked archive stations, escort targets, clock mechanisms, and the Tribunal's exposed core. Guidance is hidden during cinematics and replays.

ATTACK now begins with the model's existing **Sweeping_Kick** animation. The full sequence retains the other strikes and backflips; contact timing follows each animation's name. The pure **Backflip** and **Backflip_Jump** motions deal no damage.

## Starting, saving, and returning

- Select **Grand Inquisitor Cicero** in Classic mode. The story starts once onboarding is complete or skipped, the selected model is ready, and the player has returned to an eligible city state.
- An existing campaign save is eligible. A veteran does not need to restart onboarding or reset campaign progress.
- Progress belongs to the active world save. Completed seals, ledger turns, cleared relays, arrested clocks, boss phases, and pending cinematics are checkpointed.
- **PAUSE** returns to the saved city position. Use **Index → Stories & Worlds → Grand Inquisitor Cicero → RESUME STORY** to continue. Loading the unfinished save with this character selected also resumes its eligible checkpoint.
- **SKIP** advances the current cinematic to its correct continuation; it does not complete the playable trials.
- Completion prevents another automatic introduction on that save. **RECORDINGS** unlocks the seven individual scenes and **PLAY ALL SEVEN SCENES**. Replays use temporary presentation state.

## Playable sequence

| Trial | Player objective |
| --- | --- |
| The Summons | Approach and attack three seals to open the threshold. |
| The Divided Record | Turn linked archive stations until all three match their fixed marks. Each station also turns its neighbour. |
| The Erasure | Stay near the surviving record, defeat the wardens, and break three purge relays. |
| The Stolen Hour | Read the clock pulses and attack each mechanism during its gold interval. Outer lanes provide a safe route. |
| The Tribunal | Redirect the witness from the gold station, approach the receiver, and strike the exposed core through three phases. |
| The Door | Bring the record to its cradle and open the door beneath the world. |

Hazard trials use a three-segment integrity indicator. Depleting it restores the current trial checkpoint while retaining completed trial objectives.

## Controls and presentation

| Action | Desktop | Touch |
| --- | --- | --- |
| Move | WASD / arrow keys | Left joystick |
| Look | Drag the mouse | Swipe the right side |
| Attack | Q or ATTACK | ATTACK |
| Interact | E or contextual button | TURN / ALIGN / OPEN |
| Jump | Space or JUMP | JUMP |
| Leave the trial | Escape or PAUSE | PAUSE |
| Skip a cinematic | Escape or SKIP | SKIP |

Tap ATTACK for the character's full seven-animation sequence; hold the button to repeat. The order is **Sweeping_Kick → Boxing_Practice → Right_Hand_Sword_Slash → Backflip_Sweep_Kick → Backflip_Jump → Backflip → Sword_Judgment**. Movement interrupts the sequence, and the next fresh attack begins with the kick again.

The 2.333-second opening kick has contact beats at approximately **1.190 seconds** and **1.423 seconds**, matching the model's extended leg sweep. Attack timing is keyed by the actual clip name so a reordered sequence keeps the correct contact timing. Sword_Judgment remains last, allowing the crown cinematic to play its finisher without continuing into other motions.

Cinematics use compact two-line subtitles and separate music/SFX preferences. Their clocks freeze when the document is hidden. Reduced-motion preferences remove camera travel within shots.

Dialogue is subtitled; audio uses synthesized ambience and effects, without spoken voiceover.

## Build and local preview

Requirements: Python 3, Node.js, `index.html`, the existing game assets, all three quest modules in `quests/`, and the preserved original Classic input for rebuilding an installed update.

From the repository root:

```bash
python3 tools/build-grand-inquisitor.py .
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/Atropa-P50-Grand-Inquisitor-Update.html`. The default build leaves `index.html` unchanged.

To install the compiled Classic update directly into the normal Atropa website, use:

```bash
python3 tools/build-grand-inquisitor.py . --promote
```

Then open `http://127.0.0.1:8765/`.

The builder emits the current release files:

- `Atropa-P50-Grand-Inquisitor-Update.html`
- `quests/grand-inquisitor-runtime.pkg`
- `quests/grand-inquisitor-runtime.manifest.json`

The original Classic build input is preserved in:

- `quests/atropa-classic-before-grand-inquisitor.pkg`
- `quests/atropa-classic-before-grand-inquisitor.manifest.json`

The builder validates checked source anchors, JavaScript syntax, source checksums, packed-source roundtripping, and preservation of unrelated host payloads. Subsequent builds use the verified original package rather than patching an already compiled update. The manifest also records the installed Classic source: an unrecognized edit to that source stops the build and requires a deliberate rebase.

The optional `--promote` flag replaces the Classic source inside `index.html`, adds the responsive chooser stylesheet, updates the integration revision, and removes the obsolete R2 redirect. Other website content and embedded games are retained. A failed promoted build restores the original index and preserved-input files.

The named P50 page remains a direct compatibility entry with a neutral **ATROPA** loading screen. It accepts the recognized original or current compiled host source and uses the same existing website and assets. The normal root opens the original website directly. Rebuild the update after changing the recognized base host, wrapper, or any quest module.

## Validation record

The current release is R3. Its website installation, guidance, and attack corrections have a separate validation record below. Earlier R1 and R2 results are retained as historical evidence; they are not presented as a complete rerun of the R3 quest.

- Build revision: `P50-GRAND-INQUISITOR-THE-UNWRITTEN-VERDICT-R3`.
- Compiled source SHA-256: `5fa6f9a20d705d2fb2cbeef7504162adc527057742402b633c94506803a6276f`.
- Compiled source size: **7,357,325 bytes**.
- Packed runtime SHA-256: `45a22c25fc60123b42cc3d578e7fceff69899680e7b3b5eeec3f0613797d5e81`.
- Packed runtime size: **4,515,349 bytes**.

### R3 correction validation

| Check | Recorded status |
| --- | --- |
| Final compiled source and package | Passed build validation for the source and package hashes above: JavaScript syntax, source integrity, packed-source roundtrip, and rebuilding from the preserved original input after native installation. |
| Original website and unrelated embedded content | Passed structural preservation: the original homepage is unchanged outside the Classic source, responsive chooser stylesheet, and integration revision; all 29 other named scripts are byte-exact. |
| Existing opening-kick animation | Passed isolated inspection of the real GLB: Sweeping_Kick is a 2.333-second low circular leg sweep, with extended-leg samples supporting the .51/.61 contact marks. This is model inspection, not an R3 gameplay test. |
| Native homepage, visible selection, onboarding, and first attack | Passed 29 local visible-entry checks: normal root, original Atropa homepage, twelve choices in portrait/landscape, Grand model, Classic, onboarding skip, exclusive intro, native touch joystick approach, first Sweeping_Kick hit, red-guide retarget, and pause back to the city. Root/index paths retain their query and fragment; the compatibility recovery does not loop. |
| Other-character and veteran-save entry/restoration | Passed 13 ordinary Acolyte checks, including 100 additional render frames without a Grand quest, cinematic, HUD, or guide. Passed 19 veteran checks using the actual IMPORT BACKUP file chooser and visible character/Classic selection: Grand starts without replaying onboarding while chapter five, main quest index 28, and 73,129 PLS remain intact. |
| Final-source compatibility entry | Passed 13 checks on final source `5fa6f9a20d705d2fb2cbeef7504162adc527057742402b633c94506803a6276f`: the separately named P50 page loads the installed native index successfully, keeps ordinary Atropa branding and its requested URL, and enters the normal Acolyte/Chapter 1 flow. |
| Red guidance through objectives, cinematics, and replays | Passed 175 focused checks on the final source in the actual game using isolated checkpoint fixtures: red arrow direction/floor clearance, three native archive turns, witness/warden/relay changes with native combat, saved relay and clock targets, charged-clock safe-lane routing, all three Tribunal station/core switches, door completion, and cinematic/replay/pause disposal. All six trials were covered. |
| Guidance visual review | Passed 29 additional settled-camera capture checks on the final source. Portrait review confirms readable red routes and beacons at archive, clock, Tribunal core, moving warden, and door targets. The archive pointer clears the station label. |
| R3 public normal entry and first objective | Passed 22 checks on public release `fbc7cd391c34f3023681c2645b1f111cd224cf4c`: original Atropa homepage at the normal root, exact final source metadata, Grand preview in portrait/landscape, visible Classic entry and onboarding skip, exclusive intro, native touch joystick approach, first Sweeping_Kick seal hit, red-guide retarget, and pause/city restoration. The requested root URL stays unchanged, with no page errors. |

The 61 local visible-entry checks above used source `b19c8aed15139e60075e9730d9aa1db870f1cf6fed25e7d45c105c25c21ec98f`. The final source above changes only the archive guide pointer's height condition so it clears the station label. Final-source guidance and public checks are recorded separately. The entry checks use isolated profiles and visible controls, with no preselected storage, forced launcher, or runtime bridge.

### Historical R2 entry and selector validation

R2 used compiled source SHA-256 `26d9229d34a0bc90781e8992f55b69eabc3b568f6350a50de6c9f4a31c196143` and packed runtime SHA-256 `e243916c980ac9961275ca89820ef2813ada3f840ea8775fbb3f619ca7ce9acb`. Its redirect and previous-version bypass behavior below describe that historical release; R3 replaces that entry mechanism with a native installation.

| Check | Recorded status |
| --- | --- |
| Compiled source and package | Build completed with the source/package hashes above; JavaScript syntax, packed-source roundtrip, and host-payload preservation are checked by the builder. |
| Normal-entry selection flow | Passed locally through the visible controls: normal root → PLAY NOW → Maria → next body → Grand Inquisitor → ENTER → Classic → CONTINUE → ENTER THE CITY → skip onboarding → automatic introduction. All twelve choices fit both 390 × 844 portrait and 915 × 412 landscape with targets at least 44 × 44 pixels. |
| Route and fallback handling | Passed locally: root, index, and direct P50 entry retain existing query values and fragment; the previous-version recovery link remains on the original index without a redirect loop. Removing only the entry guard restores the byte-exact previous index. |
| R2 public entry and hosted package | Passed all 15 checks against public release `c354974d8cca4e68388399fda055b3177a507f2c`: normal root → visible PLAY NOW → Maria → next body → Grand in portrait and landscape → ENTER → visible Classic card → CONTINUE → ENTER THE CITY → SKIP → automatic Grand introduction. The decoded source metadata matches R2. Both selector captures wait for the actual model to be mounted and visible. Root/index/direct routes retain query values and fragment; the previous-version recovery does not loop. |

### Historical R1 quest validation

The R1 compiled source SHA-256 was `77992a4191e8ab2904b7ca91a88af3afc789d7c6978ac8103843dc8dfe6e4351`. R3 and R4 below are test-run names for that release. R3 completed all six playable trials in the full existing game host; R4 checked the final camera adjustment and native touch controls. Mobile coverage was limited to Chrome emulation at **390 × 844** and **915 × 412**.

| Check | Recorded status |
| --- | --- |
| Presentation syntax and isolated lifecycle/control checks | Passed locally. |
| Isolated audio preferences, node limits, and cleanup checks | Passed locally. |
| R1 compiled host and package validation | Passed: manifest confirms JavaScript syntax, packed-source roundtrip, and preservation of unrelated host markup. |
| New-player entry, attacks, ledger puzzle, pause/reload, and Index resume | Passed in the actual-host tests. |
| All six trials and native completion | Passed in R3: three escort relays with zero checkpoint resets and minimum integrity of two; charged/gold clock intervals; 12-second core-exposure expiry and recovery; all three boss phases; natural 16-second finisher and 20-second ending; all seven scenes recorded. |
| Other-character exclusion, veteran-save restoration, and legacy character migration | Passed in R3, including chapter-five progress/economy preservation and exact city camera, layer, and position restoration. |
| Native save transfer and import isolation | Passed in R3: export includes the completed character quest; importing an older world removes the previous world's completion, blocks stale writes, and starts that world's first introduction. |
| Recording menu and full seven-scene replay | Passed in R3: all individual scene options are present; the full sequence visits all seven scenes in order, returns to the city, and leaves saved completion unchanged. |
| Final gameplay camera and core approach | Passed in R4: 22 focused checks. |
| Desktop and mobile portrait/landscape controls and layout | Passed visual review. R4 emulated mobile tests passed both cases and 20 explicit checks, including native attack taps, joystick movement/cancel/release, jump taps, and the contextual linked-disc action. |
| Micro-mode, restart recovery, and existing city audio restoration | Passed in R3. |
| R1 hosted update link and required assets | Passed against the public GitHub Pages build from commit `275e77025dae831d6cab442de014cbdcb73d7165`: HTTP 200, exact decoded source checksum, real model with all seven animation clips, six-room scene, automatic introduction, and a native attack that breaks and saves the first seal. The hosted smoke passed all 17 checks. |

All public verification used isolated browser profiles. Mobile checks used Chrome emulation; no physical phone was used. R3 passed the normal public website-to-quest flow after restoring native website entry. Focused checkpoint tests separately covered all six guidance stages and their cleanup; they do not claim a new uninterrupted playthrough of every trial.

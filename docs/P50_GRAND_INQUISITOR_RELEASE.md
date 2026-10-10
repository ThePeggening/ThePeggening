# P50 — Grand Inquisitor Cicero

## THE UNWRITTEN VERDICT

Grand Inquisitor Cicero receives a character-exclusive introduction in ATROPA: The Peggening. Six playable trials and seven cinematic scenes follow his examination of a surviving pDAI record through a sealed archive and the Tribunal. The selected character remains the player throughout; the Tribunal speaks through the architecture.

The story uses original fictional dialogue and Atropa imagery, including Ethereum/PulseChain mirror ledgers, the pDAI record, and the final 414 reveal.

Play the hosted update: [Atropa P50 — Grand Inquisitor](https://thepeggening.github.io/ThePeggening/Atropa-P50-Grand-Inquisitor-Update.html).

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

Tap ATTACK for the character's full seven-animation sequence, including backflips; hold the button to repeat. Movement interrupts the sequence. Cinematics use compact two-line subtitles and separate music/SFX preferences. Their clocks freeze when the document is hidden. Reduced-motion preferences remove camera travel within shots.

Dialogue is subtitled; audio uses synthesized ambience and effects, without spoken voiceover.

## Build and local preview

Requirements: Python 3, Node.js, the unchanged base `index.html`, the existing game assets, and all three quest modules in `quests/`.

From the repository root:

```bash
python3 tools/build-grand-inquisitor.py .
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/Atropa-P50-Grand-Inquisitor-Update.html`.

The builder emits:

- `Atropa-P50-Grand-Inquisitor-Update.html`
- `quests/grand-inquisitor-runtime.pkg`
- `quests/grand-inquisitor-runtime.manifest.json`

It validates checked source anchors, JavaScript syntax, source checksums, packed-source roundtripping, and preservation of unrelated host payloads. It does not rewrite `index.html`. The update page loads the complete existing Atropa host with the new compiled Classic runtime; it requires the repository's existing assets. Rebuild the update after changing the base host or any quest module.

## Validation record

The R3 tests ran against the full existing game host and completed all six playable trials. R4 verified the final camera adjustment and native touch controls against the compiled build below.

- Build revision: `P50-GRAND-INQUISITOR-THE-UNWRITTEN-VERDICT-R1`.
- Compiled source SHA-256: `77992a4191e8ab2904b7ca91a88af3afc789d7c6978ac8103843dc8dfe6e4351`.
- Packed runtime SHA-256: `f778fc5daad9c3452a8165d531144beaa341c814a6783bf95f4cbad75635df09`.
- Final mobile coverage is limited to Chrome emulation at **390 × 844** and **915 × 412**.

| Check | Recorded status |
| --- | --- |
| Presentation syntax and isolated lifecycle/control checks | Passed locally. |
| Isolated audio preferences, node limits, and cleanup checks | Passed locally. |
| Final compiled host and package validation | Passed: manifest confirms JavaScript syntax, packed-source roundtrip, and preservation of unrelated host markup. |
| New-player entry, attacks, ledger puzzle, pause/reload, and Index resume | Passed in the actual-host tests. |
| All six trials and native completion | Passed in R3: three escort relays with zero checkpoint resets and minimum integrity of two; charged/gold clock intervals; 12-second core-exposure expiry and recovery; all three boss phases; natural 16-second finisher and 20-second ending; all seven scenes recorded. |
| Other-character exclusion, veteran-save restoration, and legacy character migration | Passed in R3, including chapter-five progress/economy preservation and exact city camera, layer, and position restoration. |
| Native save transfer and import isolation | Passed in R3: export includes the completed character quest; importing an older world removes the previous world's completion, blocks stale writes, and starts that world's first introduction. |
| Recording menu and full seven-scene replay | Passed in R3: all individual scene options are present; the full sequence visits all seven scenes in order, returns to the city, and leaves saved completion unchanged. |
| Final gameplay camera and core approach | Passed in R4: 22 focused checks. |
| Desktop and mobile portrait/landscape controls and layout | Passed visual review. R4 emulated mobile tests passed both cases and 20 explicit checks, including native attack taps, joystick movement/cancel/release, jump taps, and the contextual linked-disc action. |
| Micro-mode, restart recovery, and existing city audio restoration | Passed in R3. |
| Hosted update link and required assets | Passed against the public GitHub Pages build from commit `275e77025dae831d6cab442de014cbdcb73d7165`: HTTP 200, exact decoded source checksum, real model with all seven animation clips, six-room scene, automatic introduction, and a native attack that breaks and saves the first seal. The hosted smoke passed all 17 checks. |

All listed implementation and hosted checks are complete. Public verification ran on 10 October 2026 in an isolated browser profile. Mobile checks used Chrome emulation; no physical phone was used.

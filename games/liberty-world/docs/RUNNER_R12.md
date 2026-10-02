# PCOCK Liberty Runner — R12

Build: `LIBERTY-RUNNER-OBJECTIVES-R12`. All seven existing track layouts are retained.

## Completed
- Skybreak 414 and LibertySwap Daybreak have two impact lives. First impact: Liberty Swap last-life alert and brief stagger. A first missed landing recovers to safe road. Second impact: distance flag, 2.6-second camera sequence, bank the run once and restart. The five regular courses retain one-hit runs and now use the same flag sequence.
- Sideways/diagonal thumb steering no longer crouches. Crouch requires a full downward pull. The dedicated Slide button and keyboard S/Down remain available for sliding and drifting.
- Launch ramps follow a continuous height/velocity curve through touchdown. Aerial rings and coin trails follow that curve. Manual jumping/gliding cannot hold a ramp flight above its landing curve.
- Every course has three tracked challenges. Hexagonal R coins are rare course collectibles; lightning coins provide a temporary velocity burst. The HUD opens the objective panel. First-time mastery rewards are paid once, on banking, separately from the existing Tour medals.
- All four perks have ten tiers. Existing purchases remain owned; tiers 0–3 retain their previous numerical strengths. New tiers improve collection reach, boost duration/recharge, glide duration, or automatic dodge count. Insurance acts before contact; actual impacts still cost lives.
- Jump cameras alternate side-flight and wider framing, then blend back before touchdown. Settings can disable them. Reduced motion also disables jump-camera moves and crash-camera orbit.
- Best clean-run ghosts use the existing PCOCK model and compact recorded samples. Each course retains its fastest recorded clean finish. Ghosts have no collision and can be hidden in Settings. Older/nonmatching recordings are ignored. Fun Mode does not save ghosts or mastery rewards.
- Speed display supports mph and km/h; the challenge targets remain labelled in mph.

## Course objectives
| Course | Rare collectible (3) | Velocity Coin target | Skill challenge |
|---|---|---|---|
| Liberty Coast | Sun Pearl | 200 mph | Find one high-route feather |
| Liberty Skyline | Neon Chip | 210 mph | Three perfect drifts |
| Sunstone Canyon | Amber Relic | 205 mph | Four clean jump landings |
| Frostline Summit | Frost Crystal | 210 mph | Three loops |
| Magma Foundry | Foundry Core | 215 mph | Five clean obstacle passes |
| Skybreak 414 | Void Sigil | 300 mph | One OVERDRIVE |
| LibertySwap Daybreak | Daybreak Seal | 310 mph | Two OVERDRIVES |

## Validation
Pre-release tests compare every course's route samples to R11 and simulate all seven full courses with obstacles enabled. Dedicated tests cover both-life transitions, 42 ramp/lane combinations, every objective, duplicate reward prevention, ten-tier perks and ghost validation. Browser tests exercise native controls, collision alerts/flags, automatic banking/restart, settings, ghost rendering, upgrade persistence and return to Valley. These are desktop and emulated mobile-browser checks, not physical-phone performance measurements. QA scripts, logs and captures are kept in the dated `libertyswap/work/2026-10-02-Runner-R12` folder, not loose on the Desktop.

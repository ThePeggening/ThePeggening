# PCOCK Liberty Crossing R2 — Scout & Courier Update

An additive update to R1. The original PCOCK model, animated tail, full-width streets, fleet, terrain, Runner renderer and crossing collision rules are retained. No Most Wanted files or Runner physics/track files are modified.

## Graphics additions

Island promenades, inset orange/magenta reflectors, drain strips, planted street furniture and depot kiosks are merged into existing streamed scenery. Instanced headlamps and tail lamps add visible detail to nearby cars; original distant-car geometry remains in use. Material finish and exposure receive small adjustments. The chase camera is slightly closer without narrowing the physical road. The original daylight palette and character remain unchanged.

Courier parcels follow the character's facing. A gold destination beacon identifies the actual delivery tile. Signal Scout uses transparent cyan ground projections rather than covering traffic with opaque overlays. Reduced Motion disables beacon animation. New geometry is owned/disposed by the existing resource system; repeated island histories are bounded in Endless mode.

## Idea 1: Signal Scout

Press Q or the SCOUT button while stationary on a safe island. For four seconds, cyan outlines show where approaching cars will be in 1.2 seconds, accounting for a running Green Wave. Each island provides one use. This teaches reading traffic and choosing a crossing time; it does not stop cars, remove collisions or promise a safe path. The forecast is not an invincibility ability. Pausing freezes its remaining time.

## Idea 2: Courier Routes

Press E or PARCEL on a safe island to accept an optional delivery. Reach a marked left/right tile two islands ahead. It makes lateral movement and route planning meaningful, rather than simply rushing straight forward. Deliveries award 200–500 local score points as a safe-delivery streak grows. A collision loses the parcel and breaks the streak. Passing the destination by a full block abandons it. Waiting safely never expires it. The last City depot is on row 96, before the automatic row-97 finish.

The two systems complement each other: accept a route, scout a difficult crossing, reach the marked depot. Both are optional; the original City and Endless modes remain playable without using either.

## Persistence and controls

Existing local bests are retained. New best records can include delivery count/streak. No campaign currency or `pcock.save` writes are introduced. Fun Mode writes no personal-best records. Four-direction movement, fullscreen, size slider, two lives, collision flag and existing pickups remain intact. Mobile tool buttons are separate from movement/CROSS and participate in the existing HUD editor.

## Validation

Original ten unit checks pass. The original 97-row route still completes with zero hits. A separate actual-input simulation completes all 97 rows with six courier deliveries, a six-delivery streak, 2,250 delivery bonus points and zero hits, without removing traffic or enabling immunity.

Desktop, 832×384 mobile and 667×375 mobile browser checks cover feature buttons, projected traffic markers, pause, parcel loss, two-hit failure, six deliveries, persistence, campaign isolation and non-overlapping tools. Original browser regression checks also pass. These are browser-emulated checks, not a physical-phone GPU benchmark.

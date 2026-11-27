# All Green — treatment

Style: Tilt-Shift Miniature. Pocket City, YouTube Short, 1080×1920, 24 fps, 32.3 s, smooth motion. English voice (Kokoro `am_michael`), subtitles. Idea #3 of `ideas/pocket-city.md` ("What If Every Traffic Light Turned Green?"), series **One Rule Changed #1**, built to `ideas/FORMULA.md`. Yellow cat on the fire station roof.

## Three candidate structures
1. **One crash, a knot, and the junction you fix first (chosen).** Every light turns green; two cars meet in one junction; the queue behind them fills the junction upstream, and the next: gridlock reaches Engine 9's station. You drive the tow truck along the pavement, pull the crash clear, and the knot untangles backwards; the lights come back one junction at a time; Engine 9 rolls at 0:00. The comment question (which junction first?) has a real answer: the one at the head of the queue.
2. **Pure system:** no hero, watch the grid lock and heal. Satisfying but no stakes and no choice.
3. **Split screen: all green vs all red.** Two broken towns side by side; small in a vertical frame.

## How it is made
`grid.js` is a straight-lane traffic simulation (Intelligent Driver Model) over 3 × 2 junctions of the shared town. Before t = 0 the lights work; at 0 every light is green, so cars enter a junction whenever no crossing car is in it, even when the road beyond is full. The crash and the cars that end up stuck in boxes are scripted "locks" (which car, when), and the queues, the waiting cross traffic and the release come from the simulation. A junction that gets its lights back runs a 20 s cycle with a don't-block-the-box rule and pre-emption for Engine 9. The clock counts to Engine 9 rolling out (sim 119.5 s); the box in front of the station clears at 0:02.

## Beats (film time; the time-lapse factor varies ×2–×6, real time 26.5–31)
| Time | Shot | Event | Line |
|---|---|---|---|
| 0–3 | high over the 120 street (the loop frame) | lights flip green; two cars meet in the box | "Every traffic light in town just turned green." / "Engine 9 rolls in two minutes." |
| 3–7 | the crash | hazards, queues start | "Two cars meet in the middle. Nobody gets a red." |
| 7–11 | wide over the grid | boxes lock one after another; the map goes red | "The queue fills the next junction. Then the next." |
| 11–14 | the station | Engine 9 on the apron, the road ahead locked | "Now Engine 9 is boxed in." |
| 14–20 | the tow truck | along the pavement, into the box, hooks the blue car, drags it out | "You drive the tow truck. Take the pavement." / "Hook the crash. Pull it clear." |
| 20–26.5 | top-down, rotating | the release travels backwards; lights back 1/6 … 6/6 | "Now watch it untangle backwards." / "The lights come back, one junction at a time." |
| 26.5–31 | the station road, ×1 REAL TIME | the last car leaves the box at 0:02; Engine 9 rolls at 0:00 | "Last car out of the box…" / "Go, Engine 9!" |
| 31–39 | follow Engine 9, then rise to the opening frame | through the junction with pre-emption; normal lights | "Gridlock starts with one car stuck in a junction." / "Which junction would you have fixed first?" |

## Fact check
Gridlock (a jam that spreads around a grid) happens when vehicles queue back into and stop inside junctions, blocking the cross street; that is why many cities paint "box junctions" / "don't block the box" zones and fine drivers who stop in them (UK Highway Code rule 174; NYC DOT "Don't Block the Box"). Fire stations commonly have signal pre-emption that turns lights green for the engine (US DOT FHWA, "Traffic Signal Preemption for Emergency Vehicles").

## Changes in production (visual upgrade asked by the user via the manager)
- Cut to 32.3 s: the film opens at sim 2.5 s with the lights already green and the crash happening in the first second; a big "EVERY LIGHT IS GREEN" tile for the first 2 s; "Two cars meet…" line dropped.
- Golden hour: low warm sun (elevation 24°), cool sky fill, warm fog, lit windows (`U.lit` in world.js), stronger bloom, a stronger blur band, saturation 1.5.
- `dressing.js`: parked cars on every kerb, lamp posts, benches, planters, café terraces with umbrellas, crowds waiting at every corner (they hop when Engine 9 passes), rooftop laundry, flags, pots and dishes, pigeons that take off at the crash and settle on roofs, gulls circling.
- Beats now: open 0–2.5, crash 2.5–5.5, spread 5.5–9, station 9–11.5, tow 11.5–16.5, release 16.5–21.5, real time 21.5–26 (Engine 9 rolls at 25.5), follow 26–29, rise to the opening frame 29–32.3.

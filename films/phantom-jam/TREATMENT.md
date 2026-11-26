# The Phantom Jam — treatment

Style: Tilt-Shift Miniature. Pocket City, YouTube Short, 1080×1920, 24 fps, 36 s, smooth motion. English voice (Kokoro `am_michael`) and subtitles. Idea #5 of `ideas/pocket-city.md`, built to `ideas/FORMULA.md`: crisis in frame 0, a countdown and a route map in the frame, three escalating beats, a real-time save, a true payoff fact, a loop, one honest question, the yellow cat hidden on a roof.

## Three candidate structures
1. **The jam wave and the one driver who absorbs it (chosen).** A real traffic phenomenon: one brake tap in dense flow grows into a stop-and-go wave that travels backwards. The ambulance is caught in it. You, the yellow car in front of it, stop rushing: you leave a big gap and crawl at a steady speed, never stopping; the wave dies in front of you and the ambulance gets through.
2. **Find the culprit.** Rewind from the jam back to the first brake light. A good rewatch hook, but no stakes and no hero.
3. **Two lanes, two drivers.** Split screen: the tailgater vs the gap-keeper. Clear, but split screens shrink everything in a vertical frame.

## How it is made
`jam.js` is a ring-road traffic simulation (Intelligent Driver Model, 44 cars) on the boulevard's southbound lane; cars that leave at the bottom come back at the top, like the circular-track experiments where jams appear with no cause. The culprit (pink) brakes for 1.8 s at sim time 0. From sim 58 s the yellow car drives with a 2.8 m/s target and a 3.2 s headway; it and the ambulance behind never drop below 2.6 m/s while the cars ahead stop and go. At the end, the car at the culprit's start position taps its brakes (the loop). Brake lights, the route map, the side-street queues and the brake-squeak/pizzicato events all come from the same simulation.

## Beats (×8 time-lapse; ×1 at 7–11 and 25.4–29.4)
| Time | Shot | Event | Line |
|---|---|---|---|
| 0–3 | high oblique down the boulevard (the loop frame) | the pink car's brake lights; the red ripple starts | "One driver hit the brakes." |
| 3–7 | behind the ambulance | the wave reaches it; it stops; route map fills red | "Now the ambulance is stuck." |
| 7–11 | close on the yellow car, real time | everyone ahead brakes; you hold back | "You're the yellow car." / "Don't rush. Leave a gap." |
| 11–17 | top-down, rotating | stop-and-go bands ahead; you crawl, never stop | "Up ahead: stop and go." |
| 17–25.4 | high oblique from the west | side-street queues grow; the ambulance never stops behind you | "Nobody crashed. Nobody's in the way." / "You just never stop." |
| 25.4–29.4 | the hospital, real time | the ambulance turns in at 0:03 | "It's through!" |
| 29.4–36 | rise back to the opening frame | traffic flows; another driver brakes | "That's a phantom jam." / "Did you spot who started it?" |

## Sound
D minor pulse (marimba, pizzicato bass, woodblock, xylophone) while the jam grows; every car that stops plays a low pizzicato note, so you hear the jam build. Tape-stops into both real-time moments (idling engines, the siren, a bowed note). D major horns and glockenspiel when the ambulance turns in. No final cadence (the film loops). Two-tone siren throughout until it turns in; brake squeaks per stop; horns as the jam grows.

## Fact check (payoff line)
Traffic jams can form with no bottleneck or crash: Sugiyama et al., "Traffic jams without bottlenecks", New Journal of Physics 10 (2008) 033001 (circular-track experiment). Keeping a large gap and a steady speed can dissolve stop-and-go waves ("jam-absorption driving"; Stern et al., Transportation Research Part C 89 (2018), one automated car damping waves on a ring road).

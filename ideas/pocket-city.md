# Pocket City: format and 50-idea backlog

Tilt-shift miniature harbour town (`styles/tilt-shift`), second-person narrator, races against time
and chain reactions seen from above. People are colour capsules (no realistic humans), no real
places, no brands. Built so far: *Engine Nine* (fire engine), *Ten Minutes* (pizza scooter), *Not In
Our Town* (UFO). This list has **no fire, no food delivery, no aliens**.

The formula with timings is in [`FORMULA.md`](FORMULA.md#pocket-city). The research behind it is in
[`research/miniature.md`](research/miniature.md) and [`research/algorithm.md`](research/algorithm.md).

## 1. What the leaders in this space do that we don't yet

| Leader (approx. scale) | What they do | What we do now | Change |
|---|---|---|---|
| **Zack D. Films** (~30M subs, 3D "how / what happens if", ~36 s) | Opens on something already in peril; one fact as the payoff; the last line loops to the first; the logo sits inside the scene | Opens on a calm establishing aerial and ends on a resolution | **Frame 1 = the crisis already visible.** End on a line that hands back to the opening. Put the "POCKET CITY" logo on a roof, a ferry hull or a harbour sign |
| **BeamNG Shorts channels** (0.7–7M subs) | "[Vehicle] vs [Obstacle]" titles; numbered series (#65); one variable swapped per episode | Every film is a one-off | **Numbered series** with one variable swapped (below) |
| **LEGO dam-breach channels** (31M on one video) | "[Town spot] Hit by [Force]", framed as an experiment; "will it survive?" | Never puts the town itself at stake | "Will it survive?" episodes against nature: storm surge, tide, wind, quake |
| **Algodoo country marble races** | Viewers pick a side in second 1; elimination rounds; the comments root for their side | The viewer only watches | **Two routes or two vehicles** shown in second 1: "Tunnel or bridge?" |
| **Cities: Skylines and Mini Motorways Shorts** | "One rule changed" (no traffic lights), and the system visibly breaks and heals | The simulation is hidden behind the story | Make the simulation readable: queues, a jam wave moving backwards, an inset route map |
| **Miniatur Wunderland** | A staged emergency in a tiny world, told as "breaking news" | — | A "POCKET CITY NEWS" lower-third as an alternative opener |
| **The AI "tiny world" flood** | The miniature look alone, mass-produced | Our edge is real simulation and real story | Keep the simulation honest, and now and then show a "how it's coded" wireframe reveal (craft builds trust) |

Gap found: **nobody combines second person, a countdown and a miniature town.** No dominant animated
harbour channel exists either.

## 2. Format changes (summary)

1. **Cold open on the crisis**, with the clock already running. The voice starts at frame 0 ("You have 47 seconds.").
2. **Length 30–40 s** (was 35–45). Three escalating beats, then the save, then the loop.
3. **A countdown inside the world** (clock tower, harbour board) plus a **small route map** inset. Both read with the sound off.
4. **Series, each with a number:** `Race the Clock #N`, `One Rule Changed #N`, `Will It Survive? #N`, `Pick a Side #N`. Use YouTube Shorts Series and a related-video link to the next episode.
5. **Titles:** a dare or a question with a number in it (see FORMULA). One emoji at most. No kid-bait emoji strings: keep the adult framing so the channel isn't Made for Kids, which would turn comments off.
6. **Loop:** the last frame is the same aerial as the first. The final line rhymes with the opening line.
7. **Rewatch hook:** the same hidden thing in every film (a yellow cat on some roof), and once in a while a line like "Did you spot who started it?"
8. **Comment hook:** a choice ("Tunnel or bridge?") or "What would you have done?". Pin the same question.
9. **Payoff fact** where it fits: one true line about how traffic, tides or cranes really work. It sets us apart from AI slop and gives the "I learned something" feeling.

## 3. Ranking

**Score = Viral × Feasible** (each 1–5).
- **Viral** weighs: crisis readable in frame 1; universally understood stakes; a side to root for or a satisfying system payoff; fits a series; loopable.
- **Feasible** weighs: buildable with the style's procedural town, sims and capsule people. No water simulation beyond the shader, no destruction physics beyond what can be faked, no realistic humans.

Ties are broken by hook strength.

| # | Working title (≤70 chars) | One-line story | 0–2 s hook | Why it ranks here | V | F | Score |
|---|---|---|---|---|---|---|---|
| 1 | The Drawbridge Won't Close | A tall ship is late; the bridge is half up; the bus queue and morning traffic pile up on both sides; you time the lift to the second | Bridge half-raised, mast creeping under it, `00:47` on the harbour clock: "You have 47 seconds and one bridge." | Binary stakes visible in one frame; mechanical satisfaction; the traffic sim is native to the style; loops on the bridge closing | 5 | 5 | 25 |
| 2 | Tunnel or Bridge? One Ambulance, 40 Seconds | An ambulance has two routes to the hospital, and the viewer picks one in second 1; split screen, both run | Split frame, two route lines glowing, the narrator: "Pick one. Now." | Choose-a-side (the Algodoo mechanic) drives comments; a race with a readable map; series-able (`Pick a Side #1`) | 5 | 5 | 25 |
| 3 | What If Every Traffic Light Turned Green? | All lights go green at rush hour; the town locks up; you restore it junction by junction | The whole grid of lights flipping green in a wave, a first fender-bender in the sharp band | Proven "one rule changed" format (CS2); system breaks then heals; flagship for `One Rule Changed` | 5 | 5 | 25 |
| 4 | One Stuck Ferry Ramp Jams the Whole Town | The car ferry's ramp jams; a red queue snakes through every roundabout; one tow truck threads the gridlock | Wide of the town frozen in a red snake, then a dive to the jammed ramp | Gridlock untangling is pure "satisfying" content; time-lapse unknotting is the payoff | 5 | 5 | 25 |
| 5 | The Phantom Jam: Find Who Started It | One driver taps the brakes; a jam wave travels backwards toward the hospital junction; you stop it | A single brake light in the band, then a ripple of brake lights racing backwards | Real traffic science (the jam wave) gives a true payoff fact; "find who" drives rewatches | 5 | 4 | 20 |
| 6 | Storm Surge vs the Sea Wall | A surge is coming; close four floodgates in order before the wave reaches the high street | A grey wall of water on the horizon, gates wide open, a ×1 REAL TIME stamp | "Town vs force" (dam-breach energy) without destruction physics: the gates win or lose | 5 | 4 | 20 |
| 7 | The Runaway Shopping Trolley | A trolley escapes the hilltop market and rolls downhill; every near miss triggers the next; it ends up on the departing ferry | A trolley tipping over the crest: "Somebody forgot one thing." | A Rube Goldberg chain is an open loop resolved at the end; hidden gags for rewatches | 5 | 4 | 20 |
| 8 | The Causeway Floods in 45 Seconds | The last bus is still on the island; the tide covers the causeway road | Water licking the road edge, bus doors closing | Rising water is a clock anyone can read; train and bus lovers | 4 | 5 | 20 |
| 9 | Overnight Snow: Three Ploughs, One Town | Surprise snow; three ploughs and a salt truck must clear the hospital, school and harbour roads before 7:00 | A totally white town, one pair of headlights switching on | Path-revealing is "oddly satisfying"; seasonal (Dec–Jan) | 4 | 5 | 20 |
| 10 | Market Day: Empty to Full to Empty | 4 a.m. empty square → full market → packed away by noon; you squeeze in one last stall | Empty square, `×240` clock appears, the first van arrives | The most native tilt-shift trick (build and unbuild); the loop is perfect | 4 | 5 | 20 |
| 11 | Two Tugs, One Giant Ship | Two tugs must turn a huge ship before it hits the pier; the viewer picks red or blue | Ship's bow sliding toward the pier, two tugs racing in | A side to root for + scale contrast; harbour content gap | 4 | 5 | 20 |
| 12 | Blackout at Rush Hour | The town goes dark block by block; route the repair truck while you direct the main junction by hand | Districts blinking off one by one at dusk | Night look; the lights-on payoff is a huge release; relatable | 4 | 5 | 20 |
| 13 | Can 1 Tow Truck Clear 200 Cars? | Escalation ladder: 1 stalled car → 10 → 100 → 200, one tow truck per round | Counter "1/200" and one stalled car blocking a bridge | BeamNG-style escalation with a number in the title; a series template (`How Many …?`) | 4 | 5 | 20 |
| 14 | The Container Crane vs the Wind | Unload the last box before the storm front; gusts swing it over the crowd | Container swinging over capsule people: "Wind's at forty." | Suspense of a swinging load; machinery fans | 4 | 4 | 16 |
| 15 | Bridge Weight Test: 1 t, 10 t, 40 t… | Trucks of rising size cross a new bridge; will it hold the mobile crane? | Load gauge needle and a tiny car on a big bridge | "Will it survive?" + escalation; huge comment potential (predictions) | 4 | 4 | 16 |
| 16 | The Cruise Ship That's Bigger Than the Town | 3,000 capsule tourists flood a 300-person town; you have two hours | A white wall sliding in front of the whole town | Scale contrast is the tilt-shift joke | 4 | 4 | 16 |
| 17 | The 8:14 Train Is Late (and Everything Breaks) | One delay cascades through buses, ferry and school; fix the timetable | Departure board flipping to DELAYED, then every board after it | Cascading systems; commuters relate | 4 | 4 | 16 |
| 18 | Water Main Burst on the High Street | A fountain erupts; a sinkhole threatens a parked van; reroute everything | A jet of water bursting through the road in the sharp band | Visual surprise in frame 1; reroute puzzle | 4 | 4 | 16 |
| 19 | The Day Every Car Left at Once | Evacuation drill: the whole town drives out in 60 s; where does it jam? | Every car door opening at once in time-lapse | "What happens if" + a jam payoff fact | 4 | 4 | 16 |
| 20 | Fog Bank: Dock Blind | Fog swallows the harbour; you bring the ferry in by horns and buoys alone | Grey screen, one horn, a ferry light fading | Sound-led tension; night/fog look is the style's low-saturation mode | 4 | 4 | 16 |
| 21 | Ship to Hospital Relay: 60 Seconds | A spare part goes crane → truck → tram → bike courier | The part dropping from a ship's hold, timer starting | Relay race = four mini-climaxes | 4 | 4 | 16 |
| 22 | The Escaped Cows | A farm truck's gate opens; cows wander into town; herd them with traffic lights | One cow standing on the roundabout | Animals + absurd image in frame 1 | 4 | 4 | 16 |
| 23 | The Great Seagull Heist | Gulls steal a whole catch from a boat; a rooftop chase | A gull grabbing a fish in the sharp band | Animals + chase; low risk of overlap (town chase, not a job comedy) | 4 | 4 | 16 |
| 24 | Bin Day Domino | The rubbish truck is late; one tipped bin starts a gull swarm that follows the truck across town | A bin rolling downhill, gulls lifting off | Chain reaction + comedy; cheap to build | 4 | 4 | 16 |
| 25 | Parade vs Burst Pipe | A carnival parade must pass while a burst main floods its route | Confetti cannon and a water jet erupting at once | Colour explosion; crowd sims | 4 | 4 | 16 |
| 26 | The Roller Rolls Downhill | A roadworks roller slips its brake toward the market square | The roller creeping, workers' capsules turning | Slow peril = suspense; simple to animate | 4 | 4 | 16 |
| 27 | Earthquake Drill: Which Crane Passes? | 10 s of shaking; cranes, bridges and stacks are tested | A coffee cup on a quay wall rippling | "Will it survive?" with predictions in comments | 4 | 3 | 12 |
| 28 | The Bus Driver's Last Lap | 20 stops, 60 seconds, every light against you | Bus clock, a red light, 19 stops left | Second-person POV + countdown | 3 | 5 | 15 |
| 29 | Roundabout vs Traffic Lights | Same junction, two designs side by side; which queue melts first? | Split junction, both queues to the horizon | Comment debate; true payoff fact; `One Rule Changed` | 3 | 5 | 15 |
| 30 | A Day in Pocket City in 40 Seconds | 5:00 → 23:00 time-lapse; one tiny crisis is hidden; spot it | Dawn, the first window lighting | Rewatch-to-spot; ideal loop (night → night) | 3 | 5 | 15 |
| 31 | Street Painting Night Shift | Repaint every road line before dawn; lines appear in time-lapse | A town with no markings at all | Line-reveal satisfaction | 3 | 5 | 15 |
| 32 | The Lost Red Balloon | A child's balloon drifts across town; everyone tries to catch it; it ends back in the same hand | The balloon slipping free in the band | Wordless, gentle, perfect loop | 3 | 5 | 15 |
| 33 | Regatta Start: 30 Boats, One Gun | Wind shift at the start line; who crosses first? | Sails crowding the line, 10-s countdown | Countdown + pick a boat | 3 | 4 | 12 |
| 34 | Kite Festival Tangle | One kite tangles another until 40 kites spell a word above the beach | Two kites spiralling together | Title-in-the-world reveal (style native) | 3 | 4 | 12 |
| 35 | The Tower Clock Stopped | The town clock stops and the whole town runs late | Frozen clock hands, chaos below | Cascading systems | 3 | 4 | 12 |
| 36 | Kite in the Tram Wires | A kite string snags the overhead line; stop the tram before the wire snaps | A tram pantograph sparking | Chain reaction with a hard deadline | 3 | 4 | 12 |
| 37 | Container Stack Domino | Wind topples one stack; stop the chain before the quay office | One stack leaning | Domino satisfaction | 4 | 3 | 12 |
| 38 | Hot Air Balloon Landing | The only free field, wind pushing toward the harbour | Balloon shadow sweeping roofs | Gentle suspense | 3 | 4 | 12 |
| 39 | The Hill Railway Stalls Halfway | The funicular stops; a rescue crane is sent | Car hanging on the slope | Machinery rescue | 3 | 4 | 12 |
| 40 | Heatwave: the Rails Buckle | Slow every train before the bend | Heat shimmer over the track, thermometer at 40 °C | True physics payoff fact | 3 | 4 | 12 |
| 41 | Lifeboat Launch at Dawn | Slipway launch to tow in a drifting yacht | The boat sliding down into spray | Spectacular splash | 4 | 3 | 12 |
| 42 | Sinkhole on Main Street | The road opens; a bus is heading for it | Asphalt cracking in the band | Strong image, harder to build | 4 | 3 | 12 |
| 43 | The Ice Cream Van vs the Heatwave | The freezer is failing; sell out across town before it all melts | Thermometer past 38 °C, a drip falling | Summer evergreen; a melting clock (not a delivery story) | 4 | 3 | 12 |
| 44 | Christmas Lights: One Fuse, One Hour | The whole town must light at 18:00 sharp | Dark town, a hand on a giant switch | Seasonal (Dec) | 3 | 4 | 12 |
| 45 | The Missing Bus Driver | Bus parked, driver gone, 30 people waiting; follow the clues | An empty driver's seat | Mystery + rewatch | 3 | 4 | 12 |
| 46 | Wrecking Ball, Wrong Street | Demolition day and the crane is on the wrong street | Ball swinging back | Suspense + comedy; destruction is costly to build | 4 | 2 | 8 |
| 47 | Dam Upstream Cracks: Evacuate the Low Town | Bus, ferry and train evacuate in 60 s | A crack line on a dam wall | Big stakes; heavy water sim | 4 | 2 | 8 |
| 48 | Sandcastle City vs the Tide | From above, a huge sandcastle is a city of its own | First wave touching the moat | Miniature in a miniature; needs a beach set | 3 | 3 | 9 |
| 49 | The Power Cable Ship | A ship lays a cable across the harbour while ferries must avoid it | The cable reel spinning | Niche | 2 | 4 | 8 |
| 50 | How This Town Is Coded (Wireframe Reveal) | The town peels back to its wireframe and sims, then rebuilds | A building dissolving into lines | Craft proof against "AI slop"; good as a pinned channel trailer | 3 | 4 | 12 |

### Series map
- **Race the Clock:** 1, 4, 8, 9, 21, 28, 44
- **One Rule Changed:** 3, 19, 29, 40
- **Will It Survive?:** 6, 15, 27, 37
- **Pick a Side:** 2, 11, 33
- **How Many …?:** 13
- **Find Who Started It:** 5, 30

### First five to make
1, 2, 3, 4, 5. Each launches a different series, so the channel shows variety from the start, which also protects it under the "inauthentic content" policy.

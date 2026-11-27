# Content playbook: stories and scripts that hold to the end

Part 2 of [`RETENTION_PLAYBOOK.md`](RETENTION_PLAYBOOK.md). That one fixes the first second; this one
covers the story and the script: what happens from 1 s to the loop. It was written on 27 Nov 2026 and
is based on:
- a beat-by-beat audit of the six latest films, from the scripts on `handoff/*` and the final videos:
  *Snow Day*, *The Phantom Jam*, *Storm Surge*, *You Are a Hotel Receptionist*, *Golf Dimples*, *Tennis Fuzz*.
  The hotel script was read off the video, because its source isn't on a branch;
- the research in [`research/`](research/).

---

## 0. The 8 changes that matter most

1. **The stake by 1 s, in words a stranger understands.** Say what is lost if we fail ("or 400 kids miss school", "or the town floods"). A countdown alone isn't a stake.
2. **No dead air longer than 2.5 s.** Every gap without a line needs a visible event *and* on-screen text (muted viewers). Our films have 4–7 s gaps (§2).
3. **One new beat every 3–5 s, and each beat bigger than the last.** Our Pocket City films spend 20–40% of their time on set-up lines ("You take the boulevard.", "Every street. Every lane.").
4. **A mid-film twist at 50–60%.** Something reverses the expectation: the plan fails, a new threat, a surprising cause. None of the six has a clear twist in the middle; the twists sit at the end.
5. **Show the cause, don't just say it.** Every claim in the voice-over has a picture that proves it ("one driver hit the brakes": we must *see* which one).
6. **A payoff you can feel:** a clear win or fail moment plus one surprising line (a fact or a punchline). Then the loop.
7. **Plant a "spot it" detail at frame 0 that the ending pays off,** so the end question is answerable and people rewatch to check.
8. **Don't reuse the same skeleton twice in a row.** Golf and Tennis share every timing; Pocket City is "list of gates/roads + clock" each time. Rotate the structures (§1).

---

## 1. Beat sheets (templates with timings)

General shape for 25–40 s: **Stake (0–1 s) → Set the rule (1–4 s) → Escalation ×2–3 (every 3–5 s) → Twist (50–60%) → Climax (real time) → Payoff (a fact or punchline) → Loop seam (last 0.5 s = frame 0).**

### Pocket City (30–36 s)

| t (s) | Beat | What must be on screen | Voice (≤ 8 words a line) |
|---|---|---|---|
| 0–1.2 | **Stake**, close-up of the hero machine in action | the problem, big and moving | "Shut four gates, or the town floods." |
| 1.2–4 | **Rule**: pull out to the aerial; HUD, clock and map appear | the whole system and the goal | "Forty-five minutes. Start with the canal." |
| 4–8 | **Beat 1**: the first win, fast | a win you can see (gate swings shut) | "One down." |
| 8–13 | **Beat 2**: a complication | a blocker you can see (van in the gate) | "Someone parked in it!" |
| 13–18 | **Beat 3**: a bigger complication | the threat becomes visible (the wave line) | "Here comes the wave." |
| 18–21 | **Twist** (~55%) | the plan breaks or a new cause appears | "The last gate is jammed." |
| 21–28 | **Climax** at ×1 real time | a near-miss, a clock in single digits | "Come on… close!" |
| 28–31 | **Payoff**: win plus one true fact | a clear success image | "It held. That's a storm surge: wind pushes the sea." |
| 31–34 | **Question and loop** | the camera returns to the opening close-up | "Would you close the canal first?" |

**Rotate between these skeletons:**
- **Checklist race:** N tasks before the clock.
- **Chain reaction:** one cause → a cascade → stop it.
- **Pick a side:** two routes, both play out.
- **One rule changed:** what-if → breakdown → fix.
- **Result first:** the disaster at 0 s, then "45 minutes earlier".

### Pixel Life (40–45 s)

| t (s) | Beat | On screen | Voice / dialogue |
|---|---|---|---|
| 0–1.5 | **Cold open**: the customer's absurd line, close | a big sprite face, mid-action | Customer: "I want a room with a sea view." |
| 1.5–4 | **Job + quest** | a quest banner and the HUD | Narrator: "You are a hotel receptionist." |
| 4–10 | **Gag 1** set-up → punchline (≤ 6 s) | the solution is shown, not told | You: "Sea view!" (a painting taped to the window) |
| 10–17 | **Gag 2**, bigger, *shown* | the cause on screen | Phone: "There's a goat in our honeymoon suite." Cut to the goat. |
| 17–24 | **Gag 3**, biggest; it collides with gag 2 | gags 2 and 3 connect | Guide: "Forty rooms, please!", and the goat has eaten the keys |
| 24–28 | **Twist** (~55–60%) | the reversal | the goat is checking guests in, efficiently |
| 28–33 | **Fall**: YOU'RE FIRED | game-over card ≤ 2 s | Manager: "Who checked a goat in?" |
| 33–38 | **Punchline after the fall** | the reversal's payoff | Manager to the goat: "You're hired." |
| 38–42 | **Loop**: the first customer returns | the frame matches frame 0 | Customer: "Excuse me! I want…" |

Each gag needs a **setup line, a visible payoff and a reaction** in ≤ 7 s. The comment question goes in
the description or the pinned comment, **not on a 4 s card in the middle of the story**.

### Some Crazy Thingzz (25–30 s)

| t (s) | Beat | On screen | Voice |
|---|---|---|---|
| 0–1.5 | **Gus already doing it wrong** + the question | Gus's face, the object, the full question as a headline | Gus: "Why do golf balls have dimples? Easy, they're ugly!" |
| 1.5–6 | **The wrong theory tested**, a fast visual gag | the absurd test fails (the ball plops off the tee) | (sound only) |
| 6–7 | **❌ WRONG** stamp and buzzer | the stamp | — |
| 7–8 | **"Actually…"** sting, Nana | Nana close | Nana: "Actually…" |
| 8–17 | **The real answer, shown**, ≤ 2 sentences | one demo (smoke board, side by side) | Nana: "Dimples make the air hug the ball. Less drag." |
| 17–21 | **The proof**: the satisfying demo | the real ball rockets away | "It flies twice as far." |
| 21–25 | **A second laugh**: Gus's reaction twist | Gus gets it wrong in a new way | Gus: "So… more holes, more far?" (fills the ball with holes) |
| 25–27 | **Loop and tease**: the next object | the frame matches frame 0 | Gus: "Wait. Why do pens have a hole?" |

Rotate the skeletons:
- **Gus test:** the current one.
- **Nana stops him:** the cold open is "Gus, NO."
- **Myth vs real:** two characters each bet on an answer.
- **The object explains itself:** the object talks back.
- **Result first:** the disaster, then "Why?".

---

## 2. Audit: the six scripts, beat by beat

Times are from the scripts. "Dead air" means no new line and no new readable event.

### Snow Day (36 s)
| t | Line | Note |
|---|---|---|
| 0 | "Two hours. Three ploughs." | No stake (why do we care? "school opens 8:00" is only in the small HUD) |
| 4.5 | "You take the boulevard." | Set-up |
| 10.3 | "Every street. Every lane." | **Set-up again, at 29% of the film.** 0–14.8 s has no problem at all |
| 14.8 | "You're stuck." | **The first obstacle arrives at 41%.** Good beat |
| 16.2 | "Back up, and ram it!" | Good |
| 21.0 | "Seven fifty. One road left." | Then **6.6 s of dead air** (21–27.6) |
| 27.6 | "Come on, come on." | Climax, weak: what's at risk on the last road? |
| 29.8 | "Eight o'clock. School's open!" | Clear payoff |
| 33.3 | "Hold on. Is that snow?" | Good twist-loop, but it's the *only* surprise |

**Fixes:**
- The stake in line 1: "Clear every road by eight, or school stays shut."
- Cut lines 2–3.
- Three obstacles instead of one: the drift, a stuck school bus, a road nobody can reach.
- A mid twist: the blue plough breaks down and you take its roads too.
- Fill 21–27 with the bus beat.

### The Phantom Jam (36 s)
| t | Line | Note |
|---|---|---|
| 0 | "One driver hit the brakes." | Abstract: **which driver? It isn't visible** (audit) |
| 3.4 | "Now the ambulance is stuck." | **The real stake, by 3.4 s.** It should be line 1 |
| 7.3 | "You're the yellow car." | The hero is assigned late (20%) |
| 9.2 | "Don't rush. Leave a gap." | The core idea; counterintuitive and needs a visual "aha" |
| 12.6 | "Up ahead: stop and go." | |
| 17.0 | "Nobody crashed. Nobody's in the way." | Good mystery line, at 47%. **This is the twist; make it land harder** ("So why is everyone stopped?") |
| 21.6 | "You just never stop." | Then about 4.5 s with no line until "It's through!" |
| ~26 | "It's through!" | Payoff |
| 30.4 | "That's a phantom jam." | Good payoff fact |
| 33.4 | "Did you spot who started it?" | **A promise the film can't keep:** the culprit isn't findable at frame 0 |

**Fixes:**
- Open on the ambulance stuck: "An ambulance is stuck. Nobody crashed."
- Make the culprit findable: a pink car with a visible brake flash in frame 0, shown again in the end reveal.
- Show the gap-keeping trick as a split screen ("brake" vs "glide").
- Put the mystery question at 50%.

### Storm Surge (39 s)
| t | Line | Note |
|---|---|---|
| 0 | "Storm surge. Four gates. Forty-five minutes." | A noun list; no "or else" |
| 3.5 | "Gate one: the canal. The big one." | Fine |
| 8.15 | "Gate two. Someone parked in it!" | **A good complication at 21%** |
| 11.0 | "Call a tow truck. Hurry!" | Good |
| 15.9 | "Gate three. Here comes the wave." | The wave is hard to see (grey on grey) |
| 21.2 | "Last gate: the fish market." | The "Gate N" structure is a list; predictable |
| 23.6 | "Everybody off the quay!" | Good escalation |
| 26.6 | "Come on. Close!" | Then **6.2 s with no line** (26.6–32.8), in a real-time climax: fine if the action reads, but there is no on-screen text |
| 32.8 | "It held." | Payoff |
| 34.1 | "Storm surge: the sea, pushed in by wind." | Good fact |
| 37.25 | "Would you close the canal first?" | Good debatable question |

**Fixes:**
- A stake line ("or the town floods").
- Break the list rhythm with a twist at about 55%: gate four jams, someone is still on the quay, or the cat is on the wrong side.
- Make the wave a visible white wall.
- Put a countdown number on screen during the silent climax.

### You Are a Hotel Receptionist (42.5 s; script read from the video)
| t | Line | Note |
|---|---|---|
| 0 | Customer: "I want a room with a sea view." | **A good cold-open line** (static picture, see the retention playbook) |
| 2–4 | Narrator: "You are a hotel receptionist." | Good |
| 6–8 | — | **About 3 s of dead air** while the painting gag is set up |
| 9 | You: "Sea view!" | Gag 1 payoff: good, but it's only clear if the painting reads |
| 11 | Customer: "Acceptable." | Good button |
| 13–16 | Room 7: "There's a goat in our honeymoon suite." | Gag 2 is **told** on the phone; the goat is seen later |
| 18 | You: "We don't have a goat." | Good line |
| 20–23 | — | **About 4 s of dead air** (the goat room is seen with no line) |
| 24–29 | Tour group alert; Guide: "Forty rooms, please!" | Gag 3 doesn't connect to gag 2 and has **no punchline of its own** |
| 30–31 | — | Dead air |
| 32 | Manager: "Who checked a goat in?" | The connection is made, but it's rushed |
| 34–37 | YOU'RE FIRED card + "Receptionists: weirdest guest request?" | **A 4 s held card with a question mid-story kills the momentum** |
| 39 | Manager: "You're hired." (to the goat) | **The best joke is at 92% and tiny on screen** |
| 41 | Customer: "Excuse me! I want…" | Good loop |

**Fixes:**
- Show the goat when it's mentioned.
- Make gag 3 collide with gag 2: the goat eats the 40 keys.
- Move "the goat is the better receptionist" to the twist at about 55%, with a close-up.
- Shorten the fired card to 1.5 s and move the comment question to the pinned comment.
- Fill the dead air with reaction shots and dialogue.

### Golf Dimples (26.5 s)
| t | Line | Note |
|---|---|---|
| 0.1 | Narrator: "Why do golf balls have dimples?" | A third voice (not a character). The sandpaper is cropped off |
| 2.05 | Gus: "Oh, I know this one." | **1.35 s of signature with no information** |
| 3.4 | Gus: "The dimples are just ugly! Smooth flies better." | A good wrong theory |
| 5.4–10.15 | — (sanding, swing, plop, WRONG at 9.2) | 4.7 s without speech; **the visual gag works**, but captions are empty for muted viewers. Add text: "SMOOTH = FASTER?" then "…" |
| 10.15 | Nana: "Actually." | Good sting |
| 11.4–16.55 | Answer, 3 lines | Clear, one fact |
| 18.9–21.8 | The ball rockets away | **A strong payoff** |
| 22.3 | Gus: "Wait. Why do tennis balls have fuzz?" | A good series tease |

**Fixes:**
- Gus asks the question himself, and his signature line is folded into it ("Oh, I know this one: they're ugly!").
- A second laugh after the payoff (Gus over-learns the lesson).
- No mid-twist yet: add one, e.g. Gus's smooth ball goes *backwards*.

### Tennis Fuzz (26.8 s)
Same skeleton and **identical timings** (0.1 / 2.05 / 3.3 / 10.15 / 11.4).

**Issues:**
- The answer is two facts ("slows the ball so you can hit it", "grips the strings for spin"), with no demo shown for the second.
- The loop line "Poor thing. It must be freezing!" is a joke without a next question, so the series tease is lost.

**Fixes:**
- Change the skeleton: Nana stops him, or myth vs real.
- One fact, one demo.
- End on the next object's question.

**Across all six:** the payoffs are clear (good). The weaknesses are a late stake, set-up lines, gaps
without text, no mid-film twist, and told-not-shown causes.

---

## 3. Idea selection: re-ranked with the "curiosity gap × relatable stake" lens

**The lens:**
- Can a stranger say in 5 words what is at stake or what is odd?
- Do they *personally* recognise it (they drive, they work this job, they own this object)?
- Is there an answer they want *before* the end?

The numbers (#) refer to each backlog.

### Pocket City: top 10
| Rank | Idea (#) | Why now |
|---|---|---|
| 1 | What If Every Traffic Light Turned Green? (#3) | The biggest "what if" gap; every driver knows lights; already the next pick |
| 2 | Tunnel or Bridge? One Ambulance (#2) | Viewers pick in second 1, so the comments come built in |
| 3 | Can 1 Tow Truck Clear 200 Cars? (#13) | A number in the title = a curiosity gap; an escalation ladder |
| 4 | Bridge Weight Test: 1 t, 10 t, 40 t (#15) | A prediction ("will it hold?"); people rewatch to see the crack |
| 5 | The Day Every Car Left at Once (#19) | A "what if"; a payoff fact about jams |
| 6 | The Runaway Shopping Trolley (#7) | Comedy chain reaction; hidden gags to spot |
| 7 | One Stuck Ferry Ramp (#4) | Gridlock satisfaction; easy stake |
| 8 | Blackout at Rush Hour (#12) | Universal fear; the lights-on payoff |
| 9 | Roundabout vs Traffic Lights (#29) | A debate in the comments; a true fact |
| 10 | The Escaped Cows (#22) | An absurd image at frame 0; light comedy |

**Drop or park:**
- #1 Drawbridge (the drawbridge is already a beat in two films);
- #8 Causeway and #47 Dam (too close to Storm Surge for now);
- #20 Fog Bank (a grey frame 0 is a swipe magnet);
- #30 A Day in 40 Seconds, #31 Street Painting and #32 Red Balloon (no stake);
- #46 Wrecking Ball, #48 Sandcastle and #49 Power Cable (weak stake or heavy build);
- #50 Wireframe (a channel trailer, not an episode).

### Pixel Life: top 10
| Rank | Idea (#) | Why now |
|---|---|---|
| 1 | Returns Desk Clerk, Dec 26 (#2) | The #1 rude-customer job; perfect timing |
| 2 | Mall Santa (#5) | December; a family-wide recognisable setting |
| 3 | Barista (#3) | "This is my order" comments |
| 4 | IT Help Desk (#7) | Office workers share it; HUD error gags |
| 5 | Restaurant Server (#6) | A proven skit genre; the reservation saga |
| 6 | Flight Attendant (#8) | A proven storytelling niche; holiday travel season |
| 7 | Call-Centre Agent (#17) | Everyone has been on hold; a patience-bar gag |
| 8 | Supermarket Shelf Stacker (#14) | "Do you work here?"; the can-pyramid payoff |
| 9 | Dentist (#18) | Everyone has a dentist story |
| 10 | Ski Lift Operator (#16) | Winter; a big red button = a clear stake |

**Drop or park:**
- #4 Lighthouse Keeper (beautiful but low relatability; it may suit Pocket City's look better later);
- #24 Haunted House (out of season until October);
- #46 Tax Accountant (park until March);
- #36 Clockmaker, #38 Treasure-Map Maker, #40 Pinsetter, #49 Window Cleaner and #50 Astronaut (niche, low recognition).

### Some Crazy Thingzz: top 10
| Rank | Idea (#) | Why now |
|---|---|---|
| 1 | Why Is There an Arrow Next to the Fuel Icon? (#2) | Usable today, so sent to friends; checkable in their own car |
| 2 | Why Do Pen Caps Have a Hole? (#1) | A surprising, slightly alarming answer |
| 3 | Why Does a Tape Measure Hook Wobble? (#3) | "I thought it was broken", the perfect confession comment |
| 4 | Why Do F and J Have Bumps? (#7) | Viewers touch their keyboard during the video |
| 5 | What Do Toothpaste Squares Mean? (#13) | A myth bust; arguments in the comments |
| 6 | Why Are Chip Bags Full of Air? (#14) | Outrage → a fair twist |
| 7 | Why Do Escalators Have Brushes? (#5) | A myth with a safety twist |
| 8 | Why Is There a Star on the Elevator Button? (#6) | Seen daily, known by few |
| 9 | Why Do Microwave Doors Have Dots? (#12) | A "wow" physics demo |
| 10 | Why Do Ketchup Bottles Fart? (#15) | A family-humour share |

**Drop or park:**
- #33 Soccer Hexagons (a third sports ball in a row would feel like a template; park);
- #4 Jeans Pocket (well known, unless we add a deeper layer);
- #40 Socks, #42 Paper-Cup Rims, #45 Bricks (too close to crackers), #47 Pot Handles, #48 Zipper, #49 Barns and #50 10:10 (weak or contested answers).

---

## 4. Comment and rewatch drivers

| Driver | How to build it | Example |
|---|---|---|
| **Spot it** (rewatch) | Plant something findable at frame 0 that the ending names. It must be visible at phone size (a saturated colour, ≥ 3% of the frame) | Phantom Jam: the pink car that braked; the end asks "Did you spot it?" and a 0.5 s replay ring circles it |
| **The recurring cameo** | The same tiny character in every film, sometimes hard to find | The yellow cat (Pocket City), the goat (Pixel Life), a tiny Gus poster (Thingzz) |
| **A pause-worthy gag** | A sign or note readable only when paused | Hotel guest book: "Room 7: GOAT (paid in hay)" |
| **A binary question** (comments) | A choice tied to the story, spoken in the last beat and pinned | "Canal first or fish market first?"; "Tunnel or bridge?" |
| **Confessions** | Ask what *they* believed or lived | "What did YOU think dimples were for?"; "Receptionists: weirdest request?" (pinned, not as a card) |
| **The series tease** (next video) | The last line names the next episode's question or job; set the related-video link to it | Gus: "Wait… why do pens have a hole?" |
| **Corrections** | Accurate facts, sources in the description; heart good "actually also…" comments, then make that Short | Thingzz part-2 episodes |
| **Pick a side at the start** | Two options at frame 0 → viewers stay to see if they were right | Bridge weight test: "Will it hold 40 tonnes?" |

**Avoid:**
- questions the film can't answer, like the unfindable culprit;
- held question cards in the middle of the story;
- "comment below" bait.

---

## 5. Pre-render checklist (pass / fail)

A production session runs this on the script and the stills **before** the full render. All must pass.

**Story**
- [ ] The stake or oddity is stated in words by 1.0 s, and a stranger could repeat it in ≤ 8 words.
- [ ] The hero, the "you" or the asker is on screen and identified by 3 s.
- [ ] A new beat every 3–5 s; list the beat times. No gap > 2.5 s without both a line and a visible event.
- [ ] Each beat is bigger than the previous one (write the escalation in one line each).
- [ ] A twist at 50–60% of the length (name it).
- [ ] The climax is shown at real time, with on-screen text or numbers during any silent stretch.
- [ ] The payoff is a clear win or fail image plus one surprising line (a fact or punchline) in ≤ 12 words.
- [ ] The last line leads into frame 0, and the last 0.5 s matches frame 0.

**Script**
- [ ] No pure set-up lines ("You take the boulevard."): every line adds a problem, an action or a reveal.
- [ ] Every cause in the voice-over is *shown* within 1 s of being said.
- [ ] One fact per film (Thingzz/Pocket City), checked against two sources, and demonstrated.
- [ ] Jokes: at least one laugh in every 8 s (Pixel Life, Thingzz), including one after the payoff.

**Comments and rewatch**
- [ ] One "spot it" detail planted at frame 0 and paid off (visible at 270×480).
- [ ] One binary or confession question, at the end or pinned, not on a held card mid-story.
- [ ] The series tease or the next episode is named; a related-video link is planned.

**Variety**
- [ ] The skeleton differs from the previous film on the channel (§1 rotation); write which one.
- [ ] At least two of these differ from the last film: opening type, twist type, ending type, structure.

**Length**
- [ ] Pocket City 30–36 s · Pixel Life 40–45 s · Thingzz 25–30 s.
- [ ] Nothing after the payoff except the loop beat (≤ 4 s).

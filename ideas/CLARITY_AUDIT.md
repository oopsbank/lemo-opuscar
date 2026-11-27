# Clarity audit: why the last 3 films were hard to follow

Written 27 Nov 2026 after the user's feedback: *"the scripts are still hard to understand; the 3 recent videos made no sense at all."*

**Films audited** (the final mp4s from the media repo history, one frame per second, plus the scripts on the `handoff/*` branches):

| Film | Channel | Length | YouTube |
|---|---|---|---|
| *All Green* | Pocket City | 32.3 s | https://www.youtube.com/shorts/-eHgpZewdhY |
| *Pen Caps* | Some Crazy Thingzz | 25.0 s | https://www.youtube.com/shorts/qBwO1iO5ey4 |
| *You Are a Returns Desk Clerk* | Pixel Life | 34.5 s | https://www.youtube.com/shorts/Mnw4EW9FHIY |

The per-second frame sheets are in [`research/audit/`](research/audit/) (`cl_*.jpg`).

> **Verdict:** the suspicion is right. The retention and content playbooks were applied as a checklist:
> - a stake in the first second;
> - a beat every 3–5 s;
> - a twist;
> - a second laugh;
> - a headline, subtitles and a HUD at once;
> - faster speech.
>
> The films now have *more events than a first-time viewer can connect*. Each film is missing the
> plain sentence that says **who we follow, what they want and what's in the way**. Several key things
> are said but never shown: the fire engine, the crash, that the tube is a throat, why the clerk is fired.
> Clarity has to come before pace. The rules in §4 now sit **above** the other playbooks.

---

## 1. *All Green* (Pocket City), 32 s

**What the film is about, in one sentence:** *Every traffic light turned green at once, cars crashed
and jammed the junctions, and the fire engine can't get out of its station. You drive the tow truck
that clears the crash so it can leave.*

**Is it said or shown?** No.
- The fire station and the fire engine are never shown until a tiny red dot at 26 s.
- The crash is never shown.
- Why the engine must leave (a fire somewhere?) is never said.
- The viewer is told "Engine 9 is trapped" over a pink car at a junction.

| s | Voice / text | On screen | Confusion for a first-time viewer |
|---|---|---|---|
| 0 | V: "Every light turned green. Engine 9 is trapped." Headline `EVERY LIGHT IS GREEN` + subtitle | Close-up: a pink car, a green light, two cars | **Who is Engine 9?** Channel lore; never introduced. **Why is "all green" bad?** Not explained (both directions go → crash). Two text layers say different things |
| 1 | same | HUD appears: `1:55`, `×2 TIME-LAPSE`, `ENGINE 9 ROLLS IN` | Third and fourth text layers. "Rolls in" contradicts "trapped" |
| 2 | same | Cut to an aerial; a mini-map with red and green dots and a red ✕ appears | **Five layers** (headline gone, but subtitle + clock + speed + status + map). The map is never explained |
| 3–4 | V: "It has to roll in two minutes." | Aerial junction, cars | **Roll where? Why?** No fire, no destination. Speed changes ×2 → ×4 without comment |
| 5–7 | V: "The queue fills the next junction. Then the next." | Wide aerial of the whole block, ×8 | The 9-word subtitle is on screen ~3 s while the picture changes scale twice. The "queue filling" can't be seen at this size |
| 8–10 | V: "Now Engine 9 is boxed in." | A long street of parked-looking cars | **Where is Engine 9?** Still not on screen. "Boxed in" is jargon (box junction) |
| 11–13 | V: "You're the tow truck. Take the pavement." | A small orange tow truck on a street | **The viewer's role arrives at 34%.** "Take the pavement" (UK English) is unclear to US viewers |
| 14–15 | V: "Hook the crash. Pull it clear." | The tow truck pulls a car | **What crash?** It was never shown or said. The car looks like any other car |
| 16–18 | V: "Now watch it untangle backwards." | The map shows lights going red; the camera spins to a wide | The map's lights turning red reads as *worse*, not better. "Untangle backwards" is abstract; nothing visible untangles at this scale |
| 19–21 | V: "The lights come back, one by one." | Top-down wide; the HUD reads `LIGHTS BACK 6/6` | Fine in words, but no visible change |
| 22–24 | V: "Last car out of the box…" | Blurred street, the clock in red 0:04 → 0:02 at ×1 | "The box" again. The clock is the only tension and the hero isn't visible |
| 25–26 | V: "Go, Engine 9!" | Blur; a tiny red truck far up the street | **The payoff doesn't land:** the fire engine is a dot, appears after the line, and where it's going is unknown |
| 27–29 | V: "Gridlock starts with one car stuck in a junction." | Aerial street | A fact unconnected to "all green" (the premise) |
| 30–32 | V: "Which junction would you have fixed first?" | Aerial | **We never chose between junctions.** An unanswerable question |

**What went wrong:** the premise needs three causal steps (green everywhere → crash → gridlock traps the fire engine) and the film shows *none* of them clearly. It also adds a fourth idea (untangling backwards) and a fifth (a gridlock fact). A camera that keeps changing scale and a five-layer HUD use up the attention the story needed.

**A clear version (same assets):**
- **0–3 s:** a close shot of the fire station door opening, the engine's lights flashing. Text: `FIRE ENGINE CAN'T GET OUT`. V: "There's a fire. But the fire engine is stuck."
- **3–6 s:** pull back to the junction: both lights green, two cars crash in the middle. V: "Every traffic light went green, and two cars crashed."
- **6–12 s:** the jam spreads back to the station; one clear shot, the fire engine visible and blocked. V: "Now nobody can move."
- **12–20 s:** you, the tow truck, drive along the pavement and drag the crashed cars away. V: "You drive the tow truck. Clear the crash."
- **20–27 s:** the cars move; the fire engine pulls out, close and real time, held 2 s. V: "The road is clear. Go!"
- **27–31 s:** V: "One crash can block a whole town." The camera returns to the station door (loop).
- One HUD element only: the clock. No map, no speed label.

---

## 2. *Pen Caps* (Some Crazy Thingzz), 25 s

**What the film is about, in one sentence:** *Pen caps have a small hole so that if a child
accidentally sucks one into their throat, air can still get through.*

**Is it said or shown?** Half.
- The words say "if someone breathes a cap in by accident, the hole lets some air through". That is vague ("breathes a cap in"?) and never says *throat* or *stuck*.
- The demo shows two clear tubes labelled NO HOLE / HOLE. **Nothing says the tubes are a windpipe,** so the key picture means nothing to a first-time viewer.

| s | Voice / text | On screen | Confusion |
|---|---|---|---|
| 0–1 | Gus: "Why do pen caps have a hole?" Headline + word captions, both the same question | Gus close, a blue thing in his mouth, sound rings | **The blue thing doesn't read as a pen cap** (it's a small blue block at the mouth). Two text layers repeat each other |
| 2 | Gus: "It's a tiny flute!" | A two-shot at a desk, Nana | OK |
| 3 | Gus: "Listen!" + `SQUEEEE!` | Gus blows | OK (the joke reads) |
| 4 | `CRACK!` | Gus, Nana | **What cracked?** Nothing visibly breaks |
| 5 | ❌ WRONG stamp | Gus close | The stamp is cropped (`WRON`) |
| 6–7 | Nana: "Actually…" | Nana close, then an empty desk shot | 1 s of empty desk (dead air) |
| 8–9 | Nana: "If someone breathes a cap in by accident," | **Two glass tubes**, `NO HOLE` / `HOLE`, a blue cap inside each, a `MODEL · NOT TO SCALE` sign, books behind | **What are the tubes?** Nobody says "this is your throat". "Breathes a cap in" is unclear English |
| 10–12 | "…the hole lets some air through." | Dots flow down the HOLE tube; a red ✕ on the left, a ✓ on the right | The dots look like water or bubbles, not air. The ✕/✓ come after the line |
| 13–15 | "That's why safety rules ask for it." | Same tubes | "Safety rules" is vague; it's the **one fact** and it isn't said plainly |
| 16–19 | "So please, stop chewing caps." | Gus and Nana; Gus still has the cap | OK; the funny button lands |
| 20–22 | Gus: "Wait. Why does the pen have a hole?" | Gus with a pen that has two holes | **A second, new question with no answer**: the film feels unfinished |
| 23–24 | — | Gus grins, the pen in his mouth like a flute | The loop works visually but repeats the question that just confused people |

**What went wrong:**
- The answer is the whole point and it's the least clear part. The metaphor (tube = windpipe) is unlabelled, and the fact is softened ("some air", "safety rules ask for it").
- The film also ends on a new unanswered question.

**A clear version:**
- 0–2: Gus chewing a *clearly drawn* pen cap, the hole circled. "Why do pen caps have a hole?"
- 2–6: flute gag, WRONG.
- 6–8: Nana: "Actually, it's for safety."
- 8–16: a simple drawing of a child's throat, labelled `THROAT`. A cap gets stuck: no hole, no air (red); with a hole, air goes through (green arrows). Nana: "If a kid swallows a cap and it gets stuck in the throat, the hole still lets them breathe."
- 16–19: the fact plainly: "That's why pen caps have a hole." Hold 2 s.
- 19–23: "So stop chewing caps!" Gus spits it out.
- Loop: Gus picks up a pen again.
- The second question (the barrel hole) is its own film.

---

## 3. *You Are a Returns Desk Clerk* (Pixel Life), 34.5 s

**What the film is about, in one sentence:** *On the day after Christmas, a returns-desk clerk deals
with ridiculous returns until the queue explodes and he's fired. Then he's rehired, because nobody
else wants the job.*

**Is it said or shown?** Partly. Each joke is understandable on its own, but **the thread is missing**:
- the hero never does or decides anything;
- the reason he's fired isn't shown, because he did nothing wrong on screen;
- the rehire is implied through a video-game "CONTINUE?" joke, which many viewers won't get.

| s | Voice / text | On screen | Confusion |
|---|---|---|---|
| 0–1 | Customer: "I'd like to return this. It's unopened." Headline `UNOPENED?` | Desk; the grandma customer; a tiny white box on the counter | **The joke object (the cake with a slice missing) isn't visible**, so "UNOPENED?" has nothing to point at |
| 2–3 | Narrator: "You are a returns desk clerk." | Quest banner `JOB #5 · QUEST: SURVIVE DECEMBER 26`, an XP counter, `QUEUE 18`, a patience bar, a dialogue box, the narration subtitle | **Six text and UI elements at once.** "Job #5" is channel lore. "December 26" needs cultural knowledge (Boxing Day returns) |
| 4–6 | You: "There's a slice missing." | Same wide | Only now do we learn it's a cake, and we still can't see the slice |
| 7–9 | Customer: "It came like that." | A cat appears on the counter, a `?!` bubble | **Why is there a cat?** Unexplained (a cameo); it pulls attention from the joke |
| 10–12 | Dad: "I kept the receipt!" | A new customer; a long receipt; `10 XP` pops | OK |
| 13 | — | Full-screen receipt: `DATE 26.12.1998` | Readable for about 1 s; OK |
| 14–16 | You: "It's from 1998." | The receipt spilling | **Good joke; it lands** |
| 17–19 | — | `ALERT: RETURNS QUEUE: 300`; crowd outside in the snow | Queue 18 → 300 with no cause shown. No line for 5 s (dead air plus an unexplained jump) |
| 20–21 | — | The clerk throws things; `CAGE FULL` stamp, a pile of returns with a flamingo and a cat | **What's "the cage"?** Store jargon. What did the clerk do? |
| 22–25 | Manager: "Why is the queue in the car park?" | The manager by the pile | OK line, but it blames the clerk for something we never saw him cause |
| 26–29 | `GAME OVER: YOU'RE FIRED · CONTINUE? 9…6` | A red card held 4 s | **Why fired?** Not earned on screen. The 4 s hold stops the film |
| 30–32 | Manager: "Nobody else applied." | The clerk back at the desk | **The payoff needs two inferences** ("continue?" = rehire, plus "nobody else applied" = that's why). Many viewers won't connect them |
| 33–34 | Customer: "Excuse me!" | The grandma again, with the cake | Loop; OK |

**What went wrong:** the film is a string of separate gags (cake, receipt, queue, cage, firing,
rehire) held together by game UI rather than by the hero's goal. With six UI elements in the first
3 s and two in-jokes (Job #5, the cat), a first-time viewer doesn't know where to look or what the
hero is trying to do.

**A clear version:**
- One goal said plainly: "You work at the returns desk. Today, everyone returns their Christmas presents." (the day after Christmas, without the date jargon).
- Three customers. Each comes with a ridiculous return, **the hero says no** (a decision), and the patience bar drops.
- The queue grows *because* each argument takes ages: show it growing in each shot.
- He's fired *because* the queue reaches the car park. One line from the manager, a 1.5 s card.
- Payoff: the manager looks at the 300 people: "…Actually, you're hired. Nobody else wants this job." One sentence, both parts said.
- UI: the dialogue box and the patience bar only. No XP, no Job number, no cat in this one.

---

## 4. Clarity rules (add on top of FORMULA, RETENTION and CONTENT playbooks; these win any conflict)

**C1. One idea per film.** Write the film's **logline** first: one sentence of ≤ 20 plain words, *who* wants *what*, and *what's in the way*, or for Thingzz *the question* and *the answer*. Every beat must serve that sentence. If a beat needs its own explanation, cut it or make it a separate film.

**C2. The premise in plain words by 3 s.** The hook (§ retention) gets attention in 1 s; by 3 s the viewer must also know **who we follow and what they want**, said in everyday words and shown on screen. Example: "There's a fire, but the fire engine is stuck. You drive the tow truck."

**C3. Show it when you say it.** Every person, object or event in the voice-over is **visible and recognisable at phone size** (≥ 10% of the frame height) at the moment it is named. Unseen characters (Engine 9), unseen crashes and unseen causes are not allowed.

**C4. No lore, no jargon.** A viewer who has never seen the channel must follow. Leave out channel lore ("Engine 9", "Job #5", the cat) unless it is explained in ≤ 4 words on screen. Leave out trade or regional words ("box junction", "the cage", "pavement", "December 26"). Use the word a 10-year-old would use.

**C5. Label every model or metaphor.** If something stands for something else (a tube for a throat, a map for the town), say so out loud and on screen ("This tube is your throat.").

**C6. One text layer at a time.** In the first 3 s: the headline *or* the subtitle, not both with a HUD. After that, at most **two** layers (subtitles plus one other). A HUD shows **one** number (the clock or the queue), with no speed labels, status lines or maps unless the film is about them.

**C7. Reading and listening time.**
- Each subtitle cue ≤ 6 words, held ≥ (words ÷ 3) s + 0.3 s.
- Headlines ≤ 4 words, held ≥ 1.5 s.
- Speech ≤ 2.6 words/s overall. Speed 1.0 for explanations, up to 1.05 only for the hook line.
- No caption shown for < 1 s.

**C8. Each beat is caused by the previous one.** You must be able to retell the film with "…, so …, so …, but …, so …". If two beats are only joined by "and also", drop one. **Three beats beat six.**

**C9. One camera scale for the hero.** Keep the hero (vehicle, sprite, character) visible and roughly the same size across the main beats. Don't cut between zoom levels where the hero disappears. Wide shots are for showing a consequence, with the hero still marked.

**C10. Say the answer or payoff plainly, once, and slow down.** One full sentence ("That's why pen caps have a hole."), with the picture held still for 1.5–2 s, at ×1 real time, with no new text or event on top. Then the button joke, then the loop.

**C11. End on a resolved thought.** The last line closes this film's idea. A tease of the next film is fine only if this film's question is fully answered first, and only in ≤ 5 words ("Next: the pen's hole."). The pinned or end question must be answerable from this film.

**C12. Twists, second laughs and spot-its are optional.** Use them only if they are explainable in one line and don't add a new idea (C1). If in doubt, leave them out.

### How these change the earlier playbooks

| Earlier rule | Now |
|---|---|
| "A new beat every 3–5 s" (CONTENT §0) | **A new beat every 5–8 s, each caused by the last** (C8). Pace comes from cutting, not from more ideas |
| "Headline + subtitles + HUD" on frame 0 (RETENTION R4/R10) | **Headline only** for 0–1.5 s, then the subtitles (C6) |
| "Speed ≥ 1.0" (RETENTION §7) | **1.0 for explanations, ≤ 1.05 for the hook only** (C7) |
| "Mid-film twist at 50–60%" | **Optional** (C12) |
| "Second laugh after the payoff", "spot-it detail" | **Optional** (C12) |
| "Stake by 1 s" | Kept, but **in plain words, and the premise complete by 3 s** (C2) |
| "Name the next episode in the last line" | Only after this film's answer is complete (C11) |

---

## 5. The grandma test (run before rendering; pass/fail)

Do it on the script plus the stills at 0, 3, 6, 10, 15, 20, 25 and 30 s at **270×480** (phone size), muted and with sound.

1. **Write the logline** (C1) before anything else. Keep it in the TREATMENT.
2. **The cold-viewer check.** Give a fresh subagent *only* the stills and the transcript (no treatment, no channel notes). Ask it to say in one sentence what happens, and what was unclear. **Pass** if its sentence matches the logline and it names nothing unclear. Otherwise fix and re-run.
3. **The muted check.** From the stills and on-screen text alone, can you tell who, what they want, and how it ends? If not, add a picture or a 2–4 word label, not more words.
4. **The jargon scan.** List every noun in the script. Mark any a 10-year-old or a non-native speaker might not know, and any channel lore. Replace or explain each one.
5. **The text-layer count.** At each still, count the text and UI elements. Fail if > 1 in 0–3 s or > 2 later (C6).
6. **The reading-time check.** For every cue: words ÷ 3 + 0.3 ≤ hold time (C7).
7. **The causality retell.** Retell the film with "so / but". Fail if any beat needs "and also".
8. **The payoff check.** Find the payoff still: is the answer or result visible, said plainly, and held ≥ 1.5 s (C10)?
9. **The end check.** Is every question asked in the film answered in it (C11)?

**If any step fails, don't render.**

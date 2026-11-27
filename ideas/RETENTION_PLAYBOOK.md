# Retention playbook: getting "viewed vs swiped away" from 40% to 60%+

Written 27 Nov 2026. **The problem:** on all three channels, about 40% of the people the Shorts feed
shows a video to stay to watch, and the number is almost the same on every video. Each video gets
about 1,000 views, so this is a real signal, not noise.

**Inputs:**
- an audit of the six latest films, using the final mp4s from the media repo's history: frames at
  0–3 s, a contact sheet every 3 s, and measurements;
- the scripts on the `handoff/*` branches;
- new research ([`research/swipe.md`](research/swipe.md), about 45 searches, every claim tagged and linked);
- the earlier research in [`research/`](research/).

The audit images are in [`research/audit/`](research/audit/).

> **Why the topic doesn't matter here.** A viewer decides to swipe before they understand what the
> film is about. The same ~40% across fire, snow, traffic, hotels and golf balls means the cause is in
> what every film does in its **first second**, not in the stories. Fix the first second everywhere first.

---

## 0. The 8 changes that matter most (do these first, on every channel)

1. **Frame 0 shows something big happening.** The subject fills **35–50% of the frame height** and is already moving (no establishing shot, no static first second).
2. **A big face in frame 0** wherever the style has one: a cartoon face or sprite face at least **25% of the frame width**, looking at the problem or at us. Pocket City has no faces, so a vehicle or machine fills the frame instead.
3. **A 2–5 word hook headline** on frame 0: bold, about 90–120 px tall, high contrast, inside the safe zone. It is separate from the subtitles and states the stake or the oddity. The subtitles keep running below it.
4. **The first spoken line carries the stake, the "you" or the oddity, in ≤ 8 words,** starting by 0.2 s and spoken with energy. Lists of nouns ("Two hours. Three ploughs.") go.
5. **A second shot by 1.5 s:** cut, whip or pull out from the close-up to the wide that shows the system. Our films hold one shot for the first 2–3 s.
6. **No heavy blur in the first 2 s.** The tilt-shift band and depth of field may blur only the outer ~15% of the frame until 2 s; today 40–60% of frame 0 is blurred, which reads as low quality on a phone.
7. **A bright, high-contrast frame 0 with one focal colour.** Lift exposure, add a warm key on the subject, and keep grey, white and murky palettes for after the hook.
8. **A sound hit on frame 0** (horn, DING, buzzer, whoosh, impact) under the voice. Music beds come in after it.

Below: the evidence (§1–2), exact rules (§3), per-channel recipes (§4–6), voice (§7), variety (§8), how to measure (§9), the checklist (§10).

---

## 1. What all our films share in the first second (the audit)

The six films audited: *Snow Day*, *The Phantom Jam*, *Storm Surge* (Pocket City), *You Are a Hotel
Receptionist* (Pixel Life), *Golf Dimples*, *Tennis Fuzz* (Some Crazy Thingzz).

The numbers below were measured on frame 0 and on the change from 0 to 1 s, at 270×480:
- **motion** is the mean absolute pixel change, 0–255;
- **brightness** and **contrast** are the mean and standard deviation of luma;
- **saturation** is the mean HSV S.

| Film | Frame 0 | Motion 0–1 s | Bright. | Contrast | Sat. | First spoken line |
|---|---|---|---|---|---|---|
| Snow Day | A white-blue aerial; the plough is an orange speck; the black road appears only around 1 s | 16 (camera slide) | 180 | **35 (flat)** | **45 (grey)** | "Two hours. Three ploughs." |
| Phantom Jam | A busy aerial of ~40 tiny cars; "one driver hit the brakes", but which one is invisible; the ambulance enters at ~3 s | 13 (camera slide) | 117 | 54 | 118 | "One driver hit the brakes." |
| Storm Surge | Two-thirds grey-teal water; the surge is a faint line under the HUD; the gates are not in shot | **6.5** | 107 | **39** | **70** | "Storm surge. Four gates. Forty-five minutes." |
| Hotel Receptionist | A wide desk set; sprites about 10–15% of the frame height; a thin serif dialogue box | **0.8 (nothing moves for 1.2 s)** | **85 (dark)** | 56 | 182 | "I want a room with a sea view." |
| Golf Dimples | Ball close-up, but the sandpaper is cropped off the edge and unreadable; white dimples on a white ball; the question split into two captions (full only at ~1.5 s) | 16 | 122 | 46 | 183 | narrator VO: "Why do golf balls have dimples?" |
| Tennis Fuzz | Same layout as Golf: a grey clipper cropped at the top; the bottom half is flat blue | 13 | 123 | 42 | 186 | same pattern |

**Common to all six:**
1. **No large, readable subject or face in frame 0.** Pocket City's subjects are specks, Pixel Life's sprites are small in a wide shot, and the Thingzz object is clear but nobody's face is there and the prop doing the action is cropped off.
2. **Nothing surprising is happening in frame 0.** The event arrives at 1–3 s: the plough path, the ambulance, the gates, the bell, the sanding. Frame 0 is set-up.
3. **One shot for the first 2–3 s.** A slow camera slide (Pocket City), a locked wide (Pixel Life), or an insert held until 2 s (Thingzz).
4. **The hook is a subtitle, not a headline.**
   - Pocket City: a ~40 px pill.
   - Pixel Life: a ~30 px thin italic serif.
   - Thingzz: a big caption, but cut into two halves.

   None of them states a stake or oddity in 2–5 big words.
5. **The opening line is calm, off-screen TTS narration.** Pocket City uses `am_michael` at 0.92–0.97, Pixel Life `bm_lewis` at 0.86–0.95, Thingzz an extra narrator that is neither Gus nor Nana. The lines are noun lists or set-ups, with no "you", no consequence, no question at the first word.
6. **Blur and soft render.** The tilt-shift band and depth of field blur 40–60% of frame 0. That is beautiful at full size, but on a phone in the feed it reads as "low quality / AI".
7. **Muted or dark first frames.** Snow (flat white), storm (grey), hotel (dark brown, brightness 85).
8. **The same template on every opening of a channel.** The Pocket City HUD plate plus the pill on the same aerial; Golf and Tennis with identical timings (0.1 / 2.05 / 3.4 s) and layouts. Returning viewers recognise it and swipe, and it pushes toward YouTube's "templated content" pattern.
9. **A dead beat at 2–3.5 s:** Gus's "Oh, I know this one." on a static medium shot; the hotel's quest banner on an unchanged set; Pocket City's HUD ticking with no new event.

**What is fine** (keep it): the voice starts at 0 (no silence at the start in any film), every film has
captions, the stories are clear once they start, and the ending loops.

---

## 2. What the research says

| Finding | Strength | Source |
|---|---|---|
| The metric is now called **"Stayed to watch"**: "the percentage of times viewers stayed to watch past the initial seconds of a Short". The length of "initial seconds" is not published | fact | [YouTube Help 12220281](https://support.google.com/youtubecreatorstudio/answer/12220281), [YouTube Help 9314355](https://support.google.com/youtube/answer/9314355) |
| For Shorts the swipe test does the job thumbnail CTR does for long videos. Each Short is tested on a seed audience, then grows or tapers | fact | [YouTube blog, Rene Ritchie, Mar 2024](https://blog.youtube/creator-and-artist-stories/renes-top-five-march-4-2024/), [TechCrunch 2023 (Todd Sherman)](https://techcrunch.com/2023/08/25/youtube-demystifies-the-shorts-algorithm-views-and-answers-other-creator-questions/) |
| **Benchmarks:** none official. Paddy Galloway's 5,400-Short dataset: under 60% "rarely performed well", the best at 70–90%. Creators treat ~70% as healthy and 80% as strong. **40% is well below range** | data (2023) / practice | [Galloway thread](https://x.com/PaddyG96/status/1646898373365051392), [1of10](https://1of10.com/blog/youtube-shorts-analytics/), [Retensis](https://retensis.com/blog/youtube-shorts-viewed-vs-swiped-away) |
| **Google's ABCD study** (5,000+ ads; correlational, ads, but YouTube's own research): tight framing of people or product at the start; open with people or a mascot on screen; **2+ shots in the first 5 s**; surprising visuals early; **speech from an on-screen character beats voice-over** | data | [ABCD reference guide (PDF)](https://services.google.com/fh/files/misc/youtube_google_abcd_reference_guide_en.pdf), [Google blog](https://blog.google/products/ads-commerce/youtube-shorts-ads-select-lineups-abcds/) |
| Faces dominate attention, including in cartoons, and animated eyes draw extra fixations, but only when big enough to read | data (eye-tracking) | [research/swipe.md §2](research/swipe.md) (MDPI, ScienceDirect studies) |
| Skips cluster in the first seconds (short-video platform studies) | data | [arXiv 2504.03107](https://arxiv.org/html/2504.03107), [PNAS Nexus](https://academic.oup.com/pnasnexus/article/4/6/pgaf170/8151894) |
| **AI-look penalty:** about 21% of Shorts shown to a new account were judged AI slop; YouTube has said it will reduce the spread of low-quality AI content; viewers name **unnatural voices and flat tone** as the main AI tells; young viewers are losing interest in AI-made content | data / fact | [The Decoder (Kapwing)](https://the-decoder.com/one-in-five-youtube-shorts-shown-to-new-users-is-ai-generated-slop-study-finds/), [Variety (Mohan letter)](https://au.variety.com/2026/digital/news/youtube-channels-using-ai-tools-reduce-slop-neal-mohan-letter-32190/), [Kidscreen](https://kidscreen.com/2026/05/04/report-young-viewers-are-rapidly-losing-interest-in-ai-made-content/) |
| Text on screen: big text everywhere does not help (the share of frames with text correlated slightly negatively with views in a 92K-Short dataset). A short hook headline at the start, plus captions, is the practice | data / practice | [research/swipe.md §2](research/swipe.md), [Overseeros hooks study](https://www.overseeros.com/blog/youtube-shorts-hooks-study) |
| Length shows no evidence of moving the stay rate; loops raise average view duration, not this metric | practice | [research/swipe.md §5](research/swipe.md) |
| Safe zones: keep text out of the top ~250 px, the bottom ~480 px and the right ~140 px (the Shorts UI) | practice | [Mark Studios safe zone](https://www.markstudios.com/tools/youtube-shorts-safe-zone), [Clipzi](https://clipzi.app/en/blog/shorts-tiktok-reels-safe-zones) |

Caveat: there is no controlled study of motion vs a static frame 0, or of TTS specifically, on Shorts.
The rules below combine the strongest evidence (ABCD, eye-tracking, YouTube's own descriptions) with
our audit. Our own Studio numbers will confirm or refute them (§9).

---

## 3. Frame-0 rules (all channels)

| Rule | Spec | Why |
|---|---|---|
| **R1. Subject size** | The main subject's bounding box is ≥ 35% of the frame height (ideally 40–50%), centred in y = 500–1300 | ABCD tight framing; our subjects are 2–15% |
| **R2. Face** | Wherever the style allows: a face or eyes ≥ 25% of the frame width in frame 0, expression readable (shock, glee, panic) | Faces and eyes win attention, cartoon ones included |
| **R3. Action at frame 0** | Pre-roll the timeline so the event is mid-motion at t = 0. Mean 0–1 s motion should be ≥ 15 on our measure, coming from the subject, not only the camera | Hotel 0.8, Storm Surge 6.5 |
| **R4. Hook headline** | 2–5 words, bold (Pocket City: Overpass 900; Pixel Life: a chunky pixel font, not Cormorant; Thingzz: Baloo 800), 90–120 px cap height, white with a dark outline or plate. Place it in y ≈ 300–700, never in the bottom 480 px or the right 140 px. On from frame 0, off at 1.5–2.5 s | The current hook is a small subtitle |
| **R5. First line** | ≤ 8 words; says the stake, the oddity or "you" + a consequence; starts at ≤ 0.2 s; never a noun list, a greeting or a set-up | Our lines are set-up |
| **R6. Second shot by 1.5 s** | Cut, whip-pan or fast pull-out from the close-up to the context shot | ABCD: 2+ shots early |
| **R7. Sharpness** | 0–2 s: blur at most the outer ~15% of the frame (narrow DOF band, low blur amplitude); after 2 s the style's full tilt-shift returns | Blur reads as low quality on a phone |
| **R8. Contrast and colour** | Frame 0 luma mean 110–160, luma sd ≥ 50, one saturated focal colour on the subject; no frame 0 that is mostly grey, white or dark | Snow sd 35, Storm sat 70, Hotel brightness 85 |
| **R9. Sound on frame 0** | One sound effect hit at t = 0 (horn, bell, buzzer, splash) under the voice; the music enters after ≥ 0.5 s | Audio pattern interrupt |
| **R10. No UI first** | HUDs, maps, XP bars and series plates appear at ≥ 1.0 s, after the hook. Frame 0 shows the world, not a dashboard | Every Pocket City frame 0 leads with the HUD plate |
| **R11. Loop seam** | The last 0.5 s matches frame 0 exactly: same shot, same pose, same sound | Keeps the loop |
| **R12. Not a template** | Never reuse the previous episode's frame-0 composition on the same channel. Rotate the opening types per channel (§4–6) | Returning viewers swipe a template; YouTube's inauthentic-content rules target templates |

**Automated check (a script to add to each film's self-check):**
- render t = 0, 0.5, 1.0 and 1.5 s at 270×480;
- compute brightness, contrast (sd), saturation and 0→1 s motion (as in §1);
- measure the subject's bounding-box height from the scene graph (project its bbox);
- fail the build if R1, R3 or R8 aren't met.

---

## 4. Pocket City

**Diagnosis:** the channel's signature, the high aerial with tiny subjects and the tilt-shift blur, is
exactly what loses the feed's first second. Keep the signature, but **move it to 1.5 s**: open close, then reveal the miniature.

**Frame-0 recipe ("Close → Pull-out")**
1. **0.0–1.2 s:** a low, close, sharp shot of the hero machine **in action**, filling 40–50% of the height. Use the style's allowed "deliberate intimate moment" (a medium close-up):
   - Snow Day: the plough blade bursting through a drift, snow spraying at the lens;
   - Phantom Jam: brake lights flaring red right in front of us, then the ambulance's lights strobing;
   - Storm Surge: a wave smashing over the red gate, spray across the frame.

   Hook headline (R4) in the world's sign style; a sound hit (horn, siren, wave crash).
2. **1.2–1.8 s:** a fast pull-up (ease-in, ~0.6 s) to the high oblique aerial. **This is the "it's a tiny town!" reveal,** the native trick, now used as the second beat instead of the first frame.
3. **From 1.5 s:** the HUD clock and route map slide in; the full tilt-shift look returns from 2 s.

**Hook lines: stake + you, ≤ 8 words.** Rewrites of the last three films:

| Film | Was | Headline (frame 0) | First line |
|---|---|---|---|
| Snow Day | "Two hours. Three ploughs." | `SCHOOL OPENS 8:00` | "Clear every road before eight. Go." |
| Phantom Jam | "One driver hit the brakes." | `WHO STARTED THIS?` | "One brake tap just trapped an ambulance." |
| Storm Surge | "Storm surge. Four gates. Forty-five minutes." | `4 GATES. 45 MIN.` | "Shut four gates, or the town floods." |

**Templates**
- `[Deadline] or [disaster].`
- `You have [time] to [save X].`
- `One [tiny cause] just [big effect].`
- `What if every [thing] [broke]?`

**Visual upgrades**
- Hero vehicles at 2–3× detail and a saturated colour no other vehicle uses, as STYLE.md asks for findability.
- A lightning flash or low warm sun on frame 0 for grey or white scenes. Raise frame-0 contrast with the grade, not with blur.
- People capsules near the camera in the opening close-up (bigger, as STYLE.md allows for close actors): at least one small figure reacting gives the frame a "face-like" focus.
- HUD: a larger clock (about 1.4×), fewer words; delay it (R10).

**Opening types to rotate:** (a) Close → pull-out; (b) result first: the flooded street or the stuck ambulance at 0 s, then "45 minutes earlier"; (c) a split choice: two routes with big "A / B" labels; (d) an impact frame: something hits something on frame 0.

**Script:**
- 30–40 s;
- a new event every 4–6 s;
- the save at ×1 real time;
- the payoff fact;
- the loop back to the **close shot**, not the aerial: the seam is now the close-up.

**Title and cover:**
- Titles as before (FORMULA §2). Put the stake in the title: `Clear Every Road Before School Opens ❄️`.
- Cover: the close action frame plus the headline, not the aerial.

---

## 5. Pixel Life

**Diagnosis:** the joke is good, but frame 0 is a dark, static wide where the sprites are small and the
line sits in a thin serif box. **Nothing moves for 1.2 s.**

**Frame-0 recipe ("Slam open")**
1. **0.0 s:** a tight two-shot. The Customer's sprite and the hero's face fill about 45% of the height (camera about 2× closer than now). The Customer is **mid-action**: slamming the desk bell (DING!), dropping a cake on the counter, a goat bursting through the door. A screen-shake of 2–3 px for 0.2 s and a "!" bubble pop.
2. **Line in a big pixel font** (a bold bitmap face such as Press Start 2P or Silkscreen, OFL, ~64–80 px, white on a dark plate) **plus a 2–5 word headline**: `"SEA VIEW. PLEASE."`. Keep Cinzel or Cormorant for chapter cards later, not for the hook.
3. **1.0–1.5 s:** cut to the set wide, with the quest banner `QUEST: CHECK IN EVERY GUEST`, XP and the patience bar (UI after the hook, R10).
4. **Lighting:** a warm key light on the faces and a brighter set. Frame-0 luma mean ≥ 110 (the hotel was 85). The hero keeps the one saturated costume colour.

**Hook templates**
- The customer's absurd line: `"I'd like a room with a sea view." (There is no sea.)`
- Disaster first: frame 0 is the "YOU'RE FIRED" card cracking, or the lobby full of goats, then "Six hours earlier, you are a hotel receptionist."
- "You had one job": the one thing breaking on frame 0 (the beam dying, the can pyramid falling).

**Script:**
- The narrator line "You are a …" moves to about 1.5 s; the customer's line comes first.
- Narrator speed ≥ 1.0 (was 0.86–0.95).
- Length 40–45 s (the hotel at 42.5 s was right). A new gag every 5–7 s.
- Wordless legibility: every gag reads with the sound off.

**Visual upgrades:**
- Bigger sprites, or a closer camera, for every dialogue beat.
- Reduce the depth-of-field blur on the floor foreground, which takes 30% of the frame in the opening; frame tighter so there's no dead foreground.
- One cut every 2–4 s in the first 10 s.

**Opening types to rotate:** (a) customer line close-up; (b) disaster-first flash-forward; (c) the hero's face in panic, zoomed; (d) a game-over card as the cold open.

**Title and cover:**
- Titles: `You Are a Hotel Receptionist`, with the absurd line in the description.
- Cover: a tight face-plus-disaster frame and a 2–4 word pixel caption.

---

## 6. Some Crazy Thingzz

**Diagnosis:**
- The object close-up is right, but the action prop is cropped off the frame and unreadable, the odd detail has low contrast (white dimples on a white ball), and the question is split into two captions.
- **The faces only arrive at 2 s,** and then "Oh, I know this one." holds a static medium shot until 3.4 s.
- The question is voiced by a third, generic narrator instead of a character.
- Golf and Tennis share the same opening and timings.

**Frame-0 recipe ("Gus is already doing it wrong")**
1. **0.0 s:** **Gus's face (≥ 30% of the frame width) and the object in the same frame,** Gus mid-wrong-action: sanding the golf ball with sparks and dust flying, shaving the tennis ball with fuzz everywhere. The prop is fully visible, not cropped. Sound hit: the sanding scrape plus a boing.
2. **The full question as one headline** at the top of the safe zone (y ≈ 300–600), Baloo 800 at ~100 px, on from frame 0: `WHY DO GOLF BALLS HAVE DIMPLES?` Word-by-word captions continue below for the speech.
3. **Gus asks the question in his own voice** (an on-screen character beats voice-over) and chains it straight into his theory: "Why do golf balls have dimples? Easy, they're ugly!" Drop the separate narrator voice.
4. **The odd detail must read:** use a low, raking key light so the dimples cast shadows, and a backlight on the fuzz so it glows. Keep the red ring, but draw it fully by 0.3 s.
5. **The WRONG stamp by ~5–6 s,** Nana's "Actually…" by ~7 s, the answer demo by ~8–20 s, the loop at 24–30 s.

**Hook-line templates** (Gus, frame 0):
- `"Why do [objects] have [thing]? Easy — [wrong theory]!"`
- Nana's deadpan cold open: `"No." / "Don't." / "Gus, put it down."`
- The object reacting: the ball screaming as Gus sands it.

**Opening types to rotate:** (a) Gus mid-wrong-action; (b) Nana stopping him ("Gus, NO."); (c) an extreme macro of the odd detail with something strange happening (a tiny door opens in the dimple); (d) result first (the bald ball flops off the tee in slow motion, "Why?"). **Never use the same type twice in a row.**

**Visual upgrades:**
- Brighter, punchier sets.
- Kill the flat empty areas (the bottom half of Tennis frame 0 was plain blue).
- Faces close in every dialogue beat.
- The channel logo inside the set (a mug or a sign) without competing with frame 0.

**Title and cover:**
- Titles: unchanged (the searched question).
- Cover: Gus's shocked face plus the object, the detail circled.

---

## 7. Voice (all channels)

Flat TTS is named as the main "AI tell". Kokoro has no emotion controls, so:
- **Speed ≥ 1.0 for hook lines** (Pocket City 0.92–0.97 and Pixel Life 0.86–0.95 now). Short sentences end with "!" or "?", which Kokoro reads with more lift.
- **Audition 3 voices per channel for energy** on the hook line only (e.g. `am_michael`, `am_fenrir` and `am_adam` for Pocket City), pick one and keep it. Characters on screen (Gus, The Customer) speak the hook rather than the narrator.
- **A sound under the first word,** so the voice is never alone on frame 0.
- **Pronunciation and pace checks** stay (ASR check), plus a listen to the first 2 s at phone volume.

---

## 8. Variety (protects against "template" swipes and YouTube's inauthentic-content rules)

- Each channel keeps a list of 4 opening types (§4–6) and **never repeats the last one used**. Log it in the channel's HANDOFF.
- Change at least two of these per film: frame-0 composition, palette, first sound, first-line pattern, the opening camera move.
- Keep the recurring *identity* (characters, voice, HUD style, cat), but vary the *opening*.

---

## 9. What to check in YouTube Studio (to measure the change)

**Where:**
- **Studio → Content → Shorts → a Short → Analytics → Engagement:** the "**Viewed vs. swiped away**" card (labelled "Stayed to watch" in newer Studio) and the **audience retention** graph (watch the drop between 0 and 3 s).
- **Reach → Traffic source:** the stay rate only means something for **Shorts feed** traffic.
- **Advanced mode:** compare Shorts side by side. Add *Engaged views* and *Average percentage viewed*.

**When:**
- Read each Short after **48 h** and again at **7 days**.
- Need ≥ 1,000 feed impressions.
- Compare against the **channel median**, not against single videos.

**Log per Short:**

| Column | Notes |
|---|---|
| Date, title, opening type | Opening type from §4–6 |
| Stayed to watch % | 48 h / 7 d |
| Retention at 3 s | Read from the graph |
| Average % viewed | Over 100% means rewatches |
| Engaged views | |
| Subscribers gained | |
| Comments per 1,000 views | |

**Targets:**
- **Next 5 films per channel: ≥ 50%**;
- after 2–3 weeks: **≥ 60%**;
- healthy range: 70%+.

If a film beats the median by ≥ 10 points, note its opening type and reuse that type more often, but not twice in a row.

**Test plan:**
- One opening variable at a time across 3–5 films: first close → pull-out (Pocket City), slam open (Pixel Life), Gus-already-wrong (Thingzz). Compare the medians before and after.
- When YouTube's "test up to 3 versions" opens for Shorts (announced for 2027), render 2–3 frame-0 variants per film: cheap with code.
- Don't re-upload old films with new openings: near-duplicate uploads risk the reused or inauthentic content rules. Apply the changes to new films.

---

## 10. Pre-publish checklist (first 2 seconds)

- [ ] Frame 0: the subject ≥ 35% of the height, already moving, sharp (R1, R3, R7)
- [ ] A face ≥ 25% of the width (Pixel Life, Thingzz) or the hero machine big (Pocket City) (R2)
- [ ] A 2–5 word headline, ≥ 90 px, in the safe zone, on from frame 0 (R4)
- [ ] A first line of ≤ 8 words with the stake or oddity, starting by 0.2 s, at speed ≥ 1.0, spoken by an on-screen character where possible (R5, §7)
- [ ] A sound hit at t = 0 (R9)
- [ ] A second shot by 1.5 s (R6)
- [ ] Frame-0 luma 110–160, sd ≥ 50, one saturated focal colour (R8)
- [ ] No HUD or map before 1.0 s (R10)
- [ ] An opening type different from the previous film's (R12, §8)
- [ ] The loop seam matches frame 0 (R11)
- [ ] Contact sheet at 0 / 0.5 / 1 / 1.5 / 2 s viewed at phone size (270×480): can a stranger tell what's happening and why it matters at 0.5 s?

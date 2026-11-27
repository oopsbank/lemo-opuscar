# Hand-off: the Pixel Life channel (2.5D pixel-art comedy shorts)

This branch carries what a new session needs to keep making films for the user's YouTube Shorts channel **Pixel Life**: the channel format, the two films made so far (their full source), how they were produced in this cloud environment, the publishing flow, and ideas for the next films. Read `AGENTS.md`, `DIRECTOR.md`, `TECHNIQUE.md` and `styles/hd-2d/STYLE.md` as usual; this file adds what was learned on top of them.

## 1. The channel format

- **Style**: 2.5D Pixel Art (`styles/hd-2d`): pixel sprites in a lit, fogged three.js diorama, high 3/4 camera, tilt-shift band, bloom, RPG UI (cards, dialogue boxes with name plates, typewriter text).
- **Format**: "You are a …" comedy shorts. The narrator speaks to the viewer in the second person ("You are a fish seller."), and one situation after another goes wrong. The last line echoes the first. The title card reads "YOU ARE A …".
- **Delivery spec**: vertical 1080×1920, 60 fps (the style's rate), 55–61 s, English voice-over and burned-in English subtitles plus `subtitles_en.srt`, −14 LUFS, no logo, no LemoLab credit.
- **Voices (Kokoro)**: narrator `bm_lewis` (speed .86–.95) and YOU `am_puck` are the series voices; keep them. Other characters vary (`bf_emma`/`bf_alice` slowed, `am_onyx`/`am_fenrir` low). Animals get synthesized sounds plus a dialogue box ("SQUAWK.", "WOOF!"), never a voice.
- **Hero colour**: the hero wears the one saturated colour no set uses: lemon yellow in film 1, red in film 2.
- **Layout for 9:16**: cards and area banners in the upper third (y≈380), dialogue box at y≈1330 (960×190), narration subtitles at y≈1720, an optional HUD gauge at the top (y≈150). Keep the subject in the band y≈550–1300 so text never covers it.

## 2. Films made so far

| Slug | Length | One line | Published |
|---|---|---|---|
| `films/fish-seller` | 60.0 s | *You Are a Fish Seller*: four "rules of the fish seller" (RPG cards), each broken at once. A seagull steals a fish, a grandma out-haggles you, the "dead" fish says "Nope." and escapes into the sea, and while you chase it the gull takes over your stall wearing your cap. Ends at sunrise: "You were a fish seller." | `oopsbank/some-crazy-things-media` main, commit 6547674: `pixel-life_fish-seller_1080x1920.mp4` + `pixel-life_fish-seller_thumb.jpg`. Five logo frames on branch `logo-frames-fish` of this repo. |
| `films/pizza-guy` | 61.0 s | *You Are a Pizza Delivery Guy*: one pizza, No. 31, thirty minutes (a pocket-watch gauge drains on screen). A dog chases the scooter, a gust slaps the pizza onto your face, you knock at No. 13 (lightning, a ghost), and at No. 31 a bear in a bathrobe opens just as the watch hits LATE. "It's free. Keep it." You share the pizza with the dog as the rain stops. | `oopsbank/some-crazy-things-media` main, commit 60f7b19: `pixel-life_pizza-guy_1080x1920.mp4` + `pixel-life_pizza-guy_thumb.jpg`. |
| `films/museum-guard` | 61.0 s | *You Are a Night Museum Guard* (Job #3): the exhibits come alive on your shift. | media repo commit e37aafa: `pixel-life_museum-guard_1080x1920.mp4` + `_thumb.jpg`. |
| `films/hotel-receptionist` | 42.5 s | *You Are a Hotel Receptionist* (Job #4): a sea view with no sea (a painting on the window), a goat in the honeymoon suite (on the phone), a 40-person tour group; the goat eats the last key; YOU'RE FIRED; "You're hired." to the goat. First film with the FORMULA (recurring hero, Customer/Manager/Cat, HUD, quest banner, loop). | media repo commit 43e6372. |
| `films/returns-desk` | 34.5 s | *You Are a Returns Desk Clerk* (Job #5): a cake "unopened" with a slice missing (the Cat eats another), a receipt from 1998 unrolled across the floor, a 300-person queue out into the snowy car park, the returns cage buries the hero; YOU'RE FIRED; "Nobody else applied."; the Customer comes back. First film with the visual upgrade, the retention playbook's slam open and pixel fonts. | media repo commit 7558ba0 (+ `pixel-life_compare.jpg`). |
| `films/mall-santa` | 41.7 s | *You Are a Mall Santa* (Job #6): a beard check, a crying chain reaction (CRY COMBO), presents from the sack, the Customer on Santa's lap kicks the plug of the animatronic reindeer, which drags the sleigh through the mall into the giant tree. Fired; "Fifty five-star reviews. You're on coffee tomorrow." First film with the density pass (15.1% empty cells; Returns 26.0%, Hotel 46.2%). | media 6657efc |
| `films/barista` | 34.95 s | *You Are a Barista* (Job #7): disaster first (the espresso machine erupts on frame 0, a VHS rewind), the name on the cup in hieroglyphs, the rush, the Customer's 11-modifier ticket ("No foam. Extra foam."), the steam knob to MAX, the catch-up and the café floods with foam; fired; "Sold out! Tomorrow: IT help desk." (cut to ≤ 35 s per the manager) | published (media 31c6411, 48.8 MB, empty cells 21.4%, cover 20.6 s) |
| `films/it-desk` | 34.85 s | *You Are the IT Help Desk* (Job #8): game-over card cold open (CONTINUE? → YES → LEVEL 1 · 9:00 AM), "Turned it off and on?" fixes a dead screen, an off-on combo (printer → copier → coffee → vending → the sleeping intern's lamp), the CEO's "broken internet", the MAIN switch pulled off and on → the building reboots (twist 53%), flipping it again makes it 1 OF 974, YOU'RE FIRED, the cable was unplugged, QUEST COMPLETE, "Fired. Go be a flight attendant.", his reflex click blacks out the office = frame 0 | published (media 05ddd30, 34.8 MB, empty cells 35.5%, cover 17.6 s) |

Each folder holds `TREATMENT.md` (structure, shot list, beat sheet, cue map, sound table), `CREDITS`, `build.sh`, the page and engine (`index.html`, `main.js`, `ui.js`, `story.js` = the timeline, a set file `pier.js`/`street.js`, `chars.js`, plus `px.js kit.js fx.js post_ts.js` copied from the style demo), `score.py`, `mix.py`, `lines.json`, `voices/dur.json`, `events.json`, `subtitles_en.srt`, `fonts/` (OFL) and `tools/` (`render_range.mjs`, `cuecheck.py`, `srt.py`). Renders, voices (`*.wav`), music and mixes are not committed; `build.sh` regenerates them.

## 3. What the user asked for in this session

- The user writes in **Vietnamese**: reply to them in Vietnamese. The films themselves are in **English**.
- They like Claude to **choose the situations** ("tình huống bạn chọn đi") and want **many situations** in each film ("cứ nhiều tình huống xảy ra").
- **Defaults they confirmed**: 9:16, narrator plus on-screen dialogue boxes, about 60 s, no logo, no storyboard stop ("làm thẳng"), Western settings for film 1.
- Before a new film they picked from a short numbered list of topic ideas: they answer with the number.
- They asked for the film's frames to be used as a channel avatar; square 1080×1080 crops of clear subjects (a big face, an eye) work best for a round avatar.
- In this session the user said that requests from the **manager session** count as their own. A new session should not assume that carries over: follow its own instructions and ask the user if unsure.

## 4. Production in this cloud environment: tips and pitfalls

- **No GPU**: WebGL runs on SwiftShader. At `?ss=1` (no supersampling), 3 workers render ≈0.36–0.5 fps, so 20 s of 60 fps film takes 42–58 min. Background commands are capped at 2 h, so render in time ranges with `tools/render_range.mjs <a> <b> --out out/part_x.mp4`, then join the parts with `ffmpeg -f concat -c copy`. Rendering at `ss=2` is about 4× slower; `ss=1` looks fine for pixel art.
- **Fix a tail without a full re-render**: render only the changed range and splice it with `trim=end_frame=…` + `concat` (see the pizza film's title fix).
- **readcheck** calls `render(t)` every 0.04 s. Both pages have a `?textonly=1` fast path (overlay only), so run `node core/render/readcheck.mjs <film> --size 1080x1920 --q 'ss=1&textonly=1'` (about 1 s). `events.mjs` takes the same query.
- **Rain compresses badly**: the pizza film was 171 MB at the capture's crf 14. A final encode at `-preset slow -crf 20` gave 70 MB with no visible loss. GitHub rejects files over 100 MB and warns above 50 MB.
- **ffmpeg is 6.1**, so `core/render/mux.sh` refuses to run (it needs 7+). `mix.py` masters the mix itself (BS.1770 gated loudness to −14 LUFS, 4× oversampled limiter to −1.9 dBTP), then mux with `ffmpeg -c:v copy -c:a aac -b:a 256k`. Check with `ffmpeg -af ebur128=peak=true`; expect about −14.0 LUFS and −1.0 to −1.5 dBTP after AAC. Running a downloaded static ffmpeg was refused by the permission classifier.
- **huggingface.co is blocked** by the session proxy, so `core/tts/asr_check.py` cannot download Whisper (mirrors were refused too). The voice check did not run for either film; tell the user to listen to the lines.
- **Score**: no sample libraries were downloaded. The scores use `core/audio/pluck.py` (guitar, pizzicato bass, harp, music box, pipa-with-tremolo as a mandolin) plus synthesized recorder, horn, drums and pads. Put every visual hit on the beat grid (film 1: 0.667 s beat; film 2: 0.5 s beat) and run `tools/cuecheck.py`.
- **Framing in 9:16**: the horizontal field of view is narrow (≈20° at fov 36), so pull the camera back (≈12–15 m for a medium shot) and look slightly below the subject to lift it above the dialogue box. A camera with a high elevation sees the tops of awnings and roofs that hide characters behind them: keep canopies behind or above the actors.
- **Bugs met**: reading and writing the same file in one Python expression (`open(p,'w').write(open(p).read()…)`) empties it; it emptied `index.html` once and the page then hung waiting for READY with no error. Sprite light: keep the `spriteCap` shader patch in `chars.js` so practical lights don't blow out sprites.

## 5. Publishing flow

1. Finish and check the film (`<slug>.mp4`, `poster.jpg`, `subtitles_en.srt`).
2. Attach `oopsbank/some-crazy-things-media` with push access and clone it shallow. Its README says final files only.
3. At its root add `pixel-life_<slug>_1080x1920.mp4` and `pixel-life_<slug>_thumb.jpg`, nothing else. Commit and push to `main`; if the push is rejected because main moved, rebase your one commit onto `origin/main`. GitHub Pages serves them about a minute later at `https://oopsbank.github.io/some-crazy-things-media/<file>`; check that both return 200.
4. Message the manager session with the two URLs, duration and size, a Shorts title (≤ ~70 chars), a 2–3 line description ending in 4–6 hashtags including #shorts, and the AI disclosure: synthetic voices (Kokoro TTS); no AI-generated imagery (everything is drawn in code); original music and sound synthesized in code. The manager posts through Buffer.

## 6. Ideas for the next films

**Production is stopped (27 Nov 2026, the user via the manager)** after Job #8. Don't start Job #9 until the manager or the user asks.

State at the stop: Job #8 IT Help Desk is published (media 05ddd30). Its empty-cell score (35.5%) is higher than Barista (21.4%) because of the blackout and dark shots; for Job #9, add lit detail (EXIT signs, screens, practicals) to dark scenes. Nothing is rendering; no background jobs.

Next, in order (from `ideas/pixel-life.md` on branch `ideas`, the ranking table; #1 Hotel, #2 Returns, #3 Barista, #5 Mall Santa and #7 IT Help Desk are made):
1. **Job #9 Flight Attendant** (★ #8): already named in Job #8's last line ("Fired. Go be a flight attendant."), so make it next. A narrow aisle set (seat rows, overhead bins, galley, trolley, windows with clouds); gags: the overhead bin that won't close, the smoker in first class, the trolley jammed in turbulence. Use opening type **(a)** or **(c)** (#7 was (b), #8 (d)) and a skeleton not used yet (not "three, each bigger", "the prop comes alive", "disaster first", "chain reaction"), e.g. **a countdown to landing** with the seat-belt sign as the clock, or **pick a side** kept to one twist. ≤ 35 s.
2. **Lighthouse Keeper** (#4): "You had one job"; the style's best storm and light look.
3. **Restaurant Server** (★ #6): the reservation saga, the 3-hour coffee, the birthday song at the wrong table.
4. **Wizard's Cleaner** (#9), **Zookeeper** (#10), **Vet Receptionist** (#11), **Dog Walker** (#12), **Librarian** (#13).

Older offers not yet made: night-shift baker, tiny-inn receptionist, mail carrier, campsite ranger (the night-market noodle vendor is a food job: skip it, food and delivery are off-limits).

Series: keep the recurring hero, the Customer, the Manager and the Cat; the last line of each film names the next job; rotate the opening type and the skeleton (log them in §8).

### 2× sprites (design test, 27 Nov 2026; the user asked for more pixels)
`films/hires-test/` redraws the hero (the Job #8 IT outfit) and the Customer at twice the resolution: the hero 76×100 instead of 38×50, the Customer 68×92 instead of 34×46. The pixels are half the size in the world (`SPX2 = 1/54` m instead of 1/27), so the characters stand exactly as tall. The drawing code is `chars_hd.js` (`makeCharHD`, the same API as `makeChar`). Its helpers are `limb()` for thick shaded arms and legs and `hand()` for hands with a thumb and fingers. The extra pixels go to:
- eye whites, tall pupils with a shine, and two-pixel brows;
- the nose, ear, mouth shapes, hair strands and a shine;
- the collar, placket, badge, folds and shoes.
The test page is `main.js` (`?mode=old|new&still=1` for the comparison, `?mode=new` for the 4 s loop, `?sheet=1` for the atlas).
- Render cost: none measurable. A still takes about 7 s with either set of sprites, and the atlases are tiny textures.
- The set's textures are still 24 px per metre. For a fully consistent look, a film in this style would also redraw the key props at the finer grid.
- To use the 2× sprites in a film, port each recurring character's draw function to `chars_hd.js` style (on the doubled grid, add detail rather than scaling up). Use `makeCharHD` for them.
- The Manager, the Cat and the per-job outfits still need redrawing.

### STANDARD from 27 Nov 2026: the 3× pixel grid (the user chose it)
Every future Pixel Life film draws at **3× the original density: 81 px per metre** (`SPX3 = 1/81`).

**Sprite sizes**
- Hero: **114×150** (was 38×50).
- The Customer: **102×138** (was 34×46).
- New characters: 3× their old 1×-grid size. A grown-up is about 150 px tall; the Manager would be about 102×180 and the Cat about 84×60.

**What gets redrawn**
- Props and set pieces next to the characters use the same 81 px/m: desks, monitors, mugs, counters, anything in a close shot.
- The main sets are redrawn at the same density over time. Until then, keep the coarse set out of close shots or behind the depth of field.

**Where the sprite sources live**
- `films/hires-test/chars_3x.js`:
  - `drawHero3`, `heroHead3`, `drawCustomer3`;
  - the helpers `limb()` (thick shaded limbs with a texture hook), `hand()` (fingers, open hand, pointing) and `ellC()`;
  - `makeChar3(kind)` and `atlas3(kind)`.
- `films/hires-test/props3x.js` (`buildProps3x`): the desk, monitor, keyboard and mug.
- Copy both into a new film and add that film's job outfit as a new draw function. Draw on the 3× grid; never scale a smaller sprite up.

**Palette rules**
- Hero: the lime ramp (`#143808 → #c8f478`) is his alone; no other character wears green.
- Skin and hair use `COLS.skin` and `COLS.hair` from `chars.js`.
- Customer: purple coat (`COLS.purple`), pink fur and handbag (`COLS.pink`), lilac hair (`COLS.lilac`), gold-rimmed black glasses, red lips (`#b0243a`).
- Outlines: the selout pass in `atlas()` (neighbour colour darkened, `.3`).
- Faces:
  - eye whites `#eceef2`;
  - irises from the brown ramp;
  - a 1 px white shine;
  - lids and lashes in INK `#1a1016`;
  - blush `#e88a74`.
- Shading: lit from the upper left (shade value = .64 − dx·.12 − dy·.24 on the face). Fabric gets light dithered texture and 1–2 px fold lines; no blur and no smooth gradients.

**What it costs and how to check it**
- No measurable render cost: a still takes about 6–7 s at 1×, 2× and 3× alike.
- Check new sprites with `?sheet=1&mode=3x` (the atlas) before using them.

### 3× sprites (27 Nov 2026, the user asked for more after seeing 2×)
- `films/hires-test/chars_3x.js` (`makeChar3`) redraws the hero at 114×150 and the Customer at 102×138, at 1/81 m per pixel.
- What the extra pixels add:
  - faces: shading, irises with pupils and shines, lashes;
  - hands: fingers;
  - clothes: knit texture and folds;
  - accessories.
- `props3x.js` (`buildProps3x`) draws the help desk, a monitor, a keyboard and a mug at the same 81 px per metre.
- The test page mode is `?mode=3x`.
- Comparison image: media `pixel-life_hires3x_compare.jpg` (old | 2× | 3×). The 2× one is `pixel-life_hires_compare.jpg`.

### Clarity rules (`ideas/CLARITY_AUDIT.md` on `ideas`, commit 16114f3): these win any conflict with the other playbooks
For every future film:
- **The logline.** Write it first: who wants what, and what's in the way, in ≤20 plain words.
- **The premise by 3 s.** It is said in plain words and shown on screen.
- **Show what you name.** Everything named is on screen at phone size.
- **No channel lore, no jargon.** Drop "Job #8" unless it is explained.
- **One text layer** in 0–3 s, at most two later. The HUD shows one number.
- **Short cues.** Cues ≤6 words, held ≥ words/3 + 0.3 s. Speech ≤2.6 words/s, at speed 1.0 (≤1.05 for the hook only).
- **Fewer beats.** A beat every 5–8 s, each caused by the last; three beats beat six.
- **One camera scale for the hero.**
- **A plain payoff.** One sentence, held 1.5–2 s.
- **A resolved ending.** Twists and second laughs are optional.
- **Run the grandma test** (§5 of the audit) before rendering. It includes a cold-viewer check by a fresh subagent that sees only the stills and the transcript.

## 7. Rules added on 27 Nov 2026 (from the manager, for the user)
- **Length (27 Nov, from the manager): 35 s or less** (target 32–35 s). Cut set-up, not gags. This overrides the 40–45 s in the content playbook.

- **Retention playbook** (`ideas/RETENTION_PLAYBOOK.md` on branch `ideas`): frame 0 is a tight, sharp, bright shot (luma 110–160, sd ≥ 50) with the subject ≥ 35% of the height and a face ≥ 25% of the width, already moving; a 2–5 word headline in a chunky pixel font (Pixelify Sans / Silkscreen, OFL) at y≈300–700; first line ≤ 8 words by 0.2 s, spoken by an on-screen character, speed ≥ 1.0; a sound hit on frame 0; a second shot by 1.5 s; no HUD before 1 s; tilt-shift only at the edges for 0–2 s; the last 0.5 s matches frame 0. Rotate the opening type: (a) customer line close-up / slam open, (b) disaster-first flash-forward, (c) the hero's face in panic, (d) a game-over card cold open.
- **Content playbook** (`ideas/CONTENT_PLAYBOOK.md`): stake or oddity in words by 1 s; no dead air > 2.5 s without a line *and* on-screen text; a new, bigger beat every 3–5 s; a twist at 50–60%; show causes, don't tell them; no question card mid-story (the question goes in the pinned comment); payoff = a clear image + a line ≤ 12 words + a second laugh; rotate the skeleton; name the next job in the last line; run its pre-render checklist.
- **Density**: no empty areas. `films/returns-desk/tools/emptycheck.py film.mp4 2 --sheet out.jpg` scans a 6×10 grid every 2 s and flags flat cells (mean Sobel edge < 3.0 at 540×960). Hotel: 46.2% empty.
- **No daily cap** any more (removed by the user): deliver each film as soon as it is checked, then start the next.
- Reports go to the manager session `session_01CUE842B4KiVEBKEUhstDsx` (not "@parent").

## 8. Log: opening type and skeleton per film

| Job | Film | Opening type | Skeleton |
|---|---|---|---|
| #4 | Hotel Receptionist | customer line, wide (the playbook's "before") | three gags + game over + "you're hired" twist + loop |
| #5 | Returns Desk Clerk | **slam open** (a): tight two-shot, the cake slammed at frame 0, "UNOPENED?" | three returns, each bigger (cake → 1998 receipt → 300-person queue), collapse at 59%, game over, "Nobody else applied.", the Customer returns (loop) |
| #6 | Mall Santa | **(c) the hero's face in panic, close**: a kid yanks the beard (it stretches), "BEARD CHECK", the kid speaks | "the prop comes alive": gags (crying photo → crying chain → presents), the Customer kicks the planted plug, twist at 52% (the animatronic reindeer goes live), a real-time chase, crash into the tree, game over, the payoff line names the next job (coffee), loop to the beard |
| #7 | Barista | **(b) disaster first**: the machine's foam geyser on frame 0, FOAM OVERLOAD, the Customer speaks; a VHS rewind at 1.2 s | "disaster first, then how we got here": rewind → gags (hieroglyph cup → rush) → the contradictory order (cause shown: ticket, knob to MAX, gauge in the red) → catch-up with frame 0 at 53% → the flood (twist: it doesn't stop) → game over → payoff names the next job (IT help desk), loop to the eruption |
| #8 | IT Help Desk | **(d) a game-over card cold open**: GAME OVER / YOU REBOOTED IT ALL over the dark two-shot (hero + CEO lit by blue screens), the CEO speaks; CONTINUE mashed at 1.0 s → LEVEL 1 | "chain reaction": the rule (off and on) escalates gag by gag (one screen → a 5-device combo → the CEO's PC and router fail) → one cause (the MAIN switch) → a building-wide cascade in real time at 53% → stopping it doubles it → the fall → the payoff (unplugged cable + QUEST COMPLETE while fired) → the reflex click causes frame 0 (loop) |

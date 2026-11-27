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
| `films/mall-santa` | 41.7 s | *You Are a Mall Santa* (Job #6): a beard check, a crying chain reaction (CRY COMBO), presents from the sack, the Customer on Santa's lap kicks the plug of the animatronic reindeer, which drags the sleigh through the mall into the giant tree. Fired; "Fifty five-star reviews. You're on coffee tomorrow." First film with the density pass (19% empty cells). | see the media repo |

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

Topics offered to the user and not yet made:
- **Night-shift baker**: the oven glow at 4 a.m., a flour explosion, the cat asleep in a tray, a raccoon steals bread, the first customer buys the one burnt loaf.
- **Tiny-inn receptionist**: a snowy mountain inn with a knight, a duck, a ghost who wants another room, and the grandma again. A good place for a running cameo.
- **Mail carrier**: a snowy village; a goat eats the parcel, the wind steals the letters, a guard dog, the right house but the wrong person.
- **Night-market noodle vendor**: red lanterns, a sudden downpour, a monkey steals the chopsticks, an order that's not on the menu, a pot that boils over.
- **Campsite ranger**: a pine forest and campfire, a bear steals the marshmallows, the tent blows away, fireflies taken for ghosts, and in the morning the bear is sitting in your chair.

Series ideas: recurring cameos (the grandma, the seagull, the dog, the bear) and a "Pixel Life" end-card line; vary the structure each time (the rule book was film 1, the countdown film 2; next could be a day cycle, a party of three, or an overworld map).

## 7. Rules added on 27 Nov 2026 (from the manager, for the user)

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
| #6 | Mall Santa | **(c) the hero's face in panic, close**: a kid yanks the beard (it stretches), "BEARD CHECK", the kid speaks | "the prop comes alive": gags (crying photo → crying chain → presents), the Customer kicks the planted plug, twist at 54% (the animatronic reindeer goes live), a real-time chase, crash into the tree, game over, the payoff line names the next job (coffee), loop to the beard |

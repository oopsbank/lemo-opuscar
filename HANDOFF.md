# Handoff: Pocket City (tilt-shift Shorts)

> **READ THIS FIRST (fourth session, last update 27 Nov 2026 ~21:30 UTC). PRODUCTION IS STOPPED again: after the stop, the manager asked for ONE Police Chase film and the user asked for their own script, Domino. All are delivered (plus the user's second script, Midnight Crossing). Do not start a new film until the manager or the user asks.** See "Fourth session: after the stop" at the very end; it supersedes older notes where they differ.

For a new Claude Code session that knows nothing about the earlier work. Written by the first production session (2026-11-26), updated at the end of the second (2026-11-27, 01:50 Vietnam time). Five films so far.

## The channel

- **Pocket City**: a YouTube Shorts channel of **Tilt-Shift Miniature** films, made with this library (`styles/tilt-shift/STYLE.md`; read `AGENTS.md`, `DIRECTOR.md` and `TECHNIQUE.md` first).
- Format: **1080×1920 vertical, 24 fps, 30–40 s** (FORMULA; was 35–45), English narration and subtitles, a relaxed male narrator in the second person ("You drive…", "Ten minutes…").
- One shared world: a whitewashed Mediterranean-style **harbour town** (terracotta roofs, cobalt shutters, palm boulevard, canal with a bascule drawbridge, quay, sea). Every film reuses it; the code lives in each film's `world.js` (use the newest copy, see Render tips).
- Series idea: the town's people and places recur. The fire station has "ENGINE 9" painted on its roof and appears in both films.

## Films so far

| Slug | Length | Story | Status |
|---|---|---|---|
| `films/engine-nine` | 37.0 s | You drive fire engine 9 from the station to a warehouse fire by the harbour. Obstacles: gridlock that parts, then a raised drawbridge with a sailboat passing (real-time wait). The ladder goes up, the water hits, and the last flame dies in real time. Last line: "Fire's out. Nobody's hurt." | Posted (v3 smooth): `pocket-city_engine-nine_1080x1920.mp4` + `pocket-city_engine-nine_thumb.jpg` in `oopsbank/some-crazy-things-media`. Title used: "The bridge went up. The fire didn't wait. 🚒" |
| `films/ten-minutes` | 45.0 s | A pizza scooter with a 10:00 countdown in the HUD. Obstacles: market (crate of oranges spills), a dog chase, roadworks with a U-turn into an alley, a marching band (real time, the clock ticks second by second), a jump over the rising drawbridge in ×¼ slow motion, then rain. Delivered to a customer on a moored boat at 9:59 (00:01 left). The camera tilts up to a rainbow. | Posted: `pocket-city_ten-minutes_1080x1920.mp4` + `pocket-city_ten-minutes_thumb.jpg`. Title used: "10 minutes to deliver a pizza. The whole town said no. 🍕" |
| `films/not-in-our-town` | 40.0 s | A flying saucer's shadow crosses the boulevard; reveal over the harbour; its beam takes a car, a palm tree and a sailboat; Engine 9 rolls, fireboats sail; ladder jet + fireboat arcs hit its rim lights in ×¼ slow-mo; in real time it drops everything back and flees; rise over the cheering quay. Last line: "Not in our town." | Pushed (second session, user OK'd auto-push from now on): `pocket-city_not-in-our-town_1080x1920.mp4` + `_thumb.jpg`. Title: "A UFO tried to steal our town. Engine 9 said no. 🛸🚒" |
| `films/snow-day` | 36.0 s | Overnight snow; three ploughs, 6:00→8:00, every road before the school bell. Snow shader (upward faces) + a plough map texture (film time each metre of road was cleared) in world.js; the blue plough sticks in a drift (real time, backs up, rams); the last pile pushed to the school gate at 7:59:59; bell; it snows again, roads re-whiten, camera back on the opening aerial (loop). | Pushed: `pocket-city_snow-day_1080x1920.mp4` + `_thumb.jpg`. Title: "2 Hours. 3 Snowploughs. School Opens at 8:00. ❄️" |
| `films/phantom-jam` | 36.0 s | A ring-road IDM traffic sim (`jam.js`, 44 cars) on the boulevard: one brake tap grows a stop-and-go wave; the ambulance is stuck; you (yellow car) keep a gap and never stop (jam absorption); the ambulance turns into the hospital at 0:03; another driver brakes (loop). Countdown + route-map inset; yellow cat on the hospital roof. Built to `ideas/FORMULA.md`. | Pushed: `pocket-city_phantom-jam_1080x1920.mp4` + `_thumb.jpg`. Title: "Who Started This Traffic Jam? 🚑" |
| `films/storm-surge` | 39.3 s | Will It Survive? #1. A storm surge comes in (45:00 surge clock, time-lapse ×150/×120, ramp to ×1); four red flood gates in a new sea wall: canal mouth (twin mitre leaves, sluice channel cut through the quay), ferry ramp (a parked van blocks it, real-time clunk, a tow truck drags it out), boat ramp, fish market (closes at 0:02 in real time; the front hits at 0:00, spray over the top). "It held." Payoff: surge = the sea pushed in by wind. Rise back to the opening; the sea goes back out (loop). Cat on the harbour office roof. | Sent to the user by SendUserFile (third session), not pushed. Title: "Storm Surge vs the Sea Wall: 4 Gates, 45 Minutes 🌊". Pinned: "Would you have closed the canal first?" |

Each film folder has `TREATMENT.md` (the plan and the changes made in production), `CREDITS`, `build.sh` (one command: fonts, voice and speech check, events, subtitles, score, mix, picture, mux, poster), `lines.json` (voice), `story.js` (the timeline), `music/score.py` and `mix.py`.

## What was sent to the manager (second session)

For each film: the file names, duration, size, title, description with hashtags, and AI notes, plus the next topic. Titles used:
- *Not In Our Town*: "A UFO tried to steal our town. Engine 9 said no. 🛸🚒" (#shorts #tiltshift #miniature #ufo #satisfying)
- *Snow Day*: "2 Hours. 3 Snowploughs. School Opens at 8:00. ❄️" (#shorts #tiltshift #miniature #snow #satisfying)
- *The Phantom Jam*: "Who Started This Traffic Jam? 🚑" (#traffic #tiltshift #miniature #satisfying). Sources went in the description (Sugiyama et al. 2008, Stern et al. 2018), plus a suggested pinned comment: "Did you spot who started it?"

Day count (Vietnam time): 26 Nov = Not In Our Town + Snow Day (2/2); 27 Nov = The Phantom Jam + Storm Surge (2/2). **The next film is for 28 Nov VN (deliver after 17:00 UTC 27 Nov).** Next pick: idea #3 "What If Every Traffic Light Turned Green?" (One Rule Changed #1).

## Decisions the user made

- **Vertical Shorts**, not 16:9. Subtitles, HUD and key action stay out of YouTube's overlay zones: subtitle tiles are centred at y = 1395, the HUD sits at y ≈ 140–290, and nothing important goes below y ≈ 1500 or in the right-hand 140 px.
- **Narration**: English, Kokoro `am_michael`, speed ≈ 0.92–0.97, kept for every film (the channel's voice).
- **Motion / time-lapse stutter**: the style normally steps the world at a low rate (stutter) while the camera stays smooth.
  - v1: 8 Hz steps. Strong stutter, the most "toy".
  - v2: 12 Hz steps, the ×3 crawl smooth, ambient traffic slower.
  - v3: fully smooth, no stepping at all (`hz: 0` everywhere in `story.js` `SPEED`).
  - The user asked for less stutter, then tried fully smooth. **v3 smooth is what was posted**, and *Ten Minutes* was made smooth by choice. Default to smooth unless the user asks otherwise. The speed drops (×12/×18 → ×1 real time, ×¼ slow-mo) still carry the story through speed, the HUD readout and the sound.
- **Endings**: the user prefers a clear, satisfying ending (on time, fire out) over a twist.
- **More events per film**: for *Ten Minutes* the user asked for "a bit more happening". That film's rhythm is about one new event every 4–6 s.
- **Thumbnails**: the user liked having options: clean frames, titled versions (white glazed tile with a cobalt border, Overpass 900), and a whole-town view. A camera override for stills exists: `--q 'nohud&cam=x,y,z,lx,ly,lz,fov'`. Engine Nine's `main.js` has that override plus `span=` and `bw=`; Ten Minutes' takes `cam=` only.
- The user declined an earlier request to push "logo frames" for a channel avatar (`logo-frames` branch). Don't redo it unless asked.

## How the user works

- The user writes in **Vietnamese**; reply in Vietnamese. On-screen text and voice in the films are English.
- The user gives short answers and expects sensible defaults; ask once, up front, with options (AskUserQuestion worked well), then produce.
- Report progress during long renders; the user checks in.
- Publishing to the public media repo requires the user's OK. In the first session, pushes to `oopsbank/some-crazy-things-media` were made after the user confirmed. Get your own confirmation in a new session.

## Pipeline rules (from the manager session, second session)

- The user approved auto-pushing finished films to the media repo (no review). The manager passes them to the user, who posts by hand.
- At most 2 finished films per day (Vietnam time); then wait for the next day.
- Before each film, read `ideas/FORMULA.md` and `ideas/pocket-city.md` on branch `ideas` (fetch fresh): hook in frame 1, loop ending, 30–40 s, one honest question at the end.
- Never delete files from the media repo. ffmpeg 7: the BtbN build runs from the scratchpad (the user allowed it).

## The formula (ideas/FORMULA.md on branch `ideas`, applied from The Phantom Jam on)

- Frame 0 = the crisis in motion, with the voice and the matching subtitle from frame 0. The first subtitle has `t0 = 0` and no fade-in.
- Put a countdown in the frame (the HUD plate: big mono clock + speed label + a goal line) and, where it helps, a route-map inset under the HUD (left side, x ≈ 56–152, y ≈ 360–880; keep out of the right 140 px).
- Then three escalating beats, a new event every 3–6 s; the save at ×1 REAL TIME; a one-line true payoff fact; the loop.
- Loop: the last shot rises back to the exact opening camera, and the last line leads into the first. Use no fade-out (a 20 ms ramp only) and music with no final cadence.
- One honest question at the end ("Did you spot who started it?"), and the same question as a pinned comment.
- Hidden detail: **the yellow cat** (a capsule with ears, `makeCat` in `films/phantom-jam/actors.js`) on some roof in every film.
- Titles ≤ 60 characters, the key noun first, one emoji at most. 2–4 hashtags. Facts get sources in the description.
- Series names: Race the Clock · One Rule Changed · Will It Survive? · Pick a Side.

## Publishing flow

1. Final film `<slug>.mp4` (−14 LUFS) and a clean poster (no HUD, no subtitles).
2. With the user's OK: add both at the **root** of `oopsbank/some-crazy-things-media`, branch `main`, named `pocket-city_<slug>_1080x1920.mp4` and `pocket-city_<slug>_thumb.jpg`. Final files only (see that repo's README). Pull or rebase first: other channels (Pixel Life, Some Crazy Thingzz) push there too.
3. Wait for GitHub Pages (≈ 30–90 s) and check `https://oopsbank.github.io/some-crazy-things-media/<file>` returns 200.
4. Send the manager session (it schedules through Buffer) the file names, the duration and size, a hooky English title (≤ 70 chars), a 2–3 line description ending in 4–6 hashtags including #shorts, and the AI notes: the imagery is procedural code, not a generator; the **voice is synthetic** (Kokoro TTS), so turn on YouTube's "altered or synthetic content" disclosure; the music is original, from CC0 samples; the sound effects are synthesized.
5. Check for topic collisions: a Pixel Life short "You Are a Pizza Delivery Guy" was posted right before *Ten Minutes*.

## Render tips and pitfalls (this cloud container)

- **No GPU.** WebGL runs on SwiftShader: always `LEMO_ANGLE=swiftshader`. A still takes ≈ 3.5–4.5 s. A full film with `--workers 2` takes ≈ 6.5 s per frame per worker: **37 s ≈ 48 min, 45 s ≈ 54 min**. Keep post cheap: `ssaa: 1`, 72 DOF taps, a 2048 shadow map, no GTAO. The library demo's settings (2× SSAA, 128 taps, GTAO) took ≈ 24 s per frame.
- **ffmpeg 7+** is needed by `mux.sh`, and the system has 6.1. The johnvansickle static build is blocked (403). The BtbN GitHub release works: `ffmpeg-master-latest-linux64-gpl.tar.xz` from `github.com/BtbN/FFmpeg-Builds/releases/download/latest/`. Extract it into the scratchpad and prefix `PATH` per command (`FFMPEG_DIR` in `build.sh`). Copying it into `~/.local/bin` was refused by the permission checker.
- `setup.sh deps voice music` installs everything; sample libraries (vcsl, vsco2ce) download on first `sampler.py --need`.
- **Speech check (faster-whisper base.en from Hugging Face)**: it downloads unauthenticated, with a warning only; that is fine. Known quirks: "Go." was heard as "goal" (use "Let's go!"); "Everyone's safe" was heard as "everyone safe" (rephrased to "Nobody's hurt"); "Nine fifty-nine" is transcribed "959" (put that in the line's `asr` field). Subtitles may show digits ("9:59", "Engine 9") while the voice says words.
- **three.js gotchas**: set `frustumCulled = false` on every InstancedMesh whose instances move: the bounding sphere is computed once and the parade vanished. A point light for fire must be small (≈ 260 intensity, 60 m, decay 2), or the whole quay turns pink. Flames and smoke read better as camera-facing sprites (`sprites.js`, sorted back to front) than as cones and spheres.
- **JS**: `Math.exp(-(x / k) ** 2)` is a SyntaxError (unary minus before `**`); write `-((x / k) ** 2)`.
- **Framing**: high pitch (45–55°) hides the horizon, so smoke or a rainbow far away won't show. To reveal sky at the end, tilt the camera up (pitch ≈ 16°) as a final move.
- File sizes ≈ 41 MB per film (fine for GitHub's 100 MB limit). `mux.sh` gives ≈ −14.1 LUFS, true peak ≈ −1.4 dB.
- Review loop that worked: a contact sheet at 1 fps from the final mp4 (ffmpeg), `blackdetect`, and whisper on the final mix.
- `films/` is in `.gitignore` (films are the user's); this branch force-adds the sources. Fonts are fetched by each film's `fonts.sh`.

### Learned in the second session
- **Use the newest `world.js`** (`films/phantom-jam/world.js` or `films/snow-day/world.js`). It has `buildWorld(scene, { excl, extra })`: `excl` = rectangles where no generic building or tree is placed; `extra(b)` adds your own geometry (school, hospital). It also has the snow uniforms (`U.snow`, plough-map texture, `ROAD` / `NOSNOW` material defines). The copies in `engine-nine` and `not-in-our-town` lack `excl`/`extra`, so a school added through them silently never appears.
- For snow (`films/snow-day`): set `U.snow = 1`, give road materials `defines = { ROAD: '' }` and a DataTexture plough map (`makeClearMap`: the film time each metre was cleared), give vehicles `defines = { NOSNOW: '' }` (or their roofs turn white), and give water NOSNOW.
- `still.mjs` needs `--size 1080x1920` (the default is landscape). Write review stills to the scratchpad with `--out`. Removing a whole stills folder with `rm …/*` is blocked by the safety check; overwrite instead.
- Skip `readcheck.mjs`: it renders every frame (as slow as the film) and competes with the render. Subtitle holds come from the cue rule in `subs.py`.
- Render speed: ≈ 6.5–8.3 s per frame per worker with `--workers 2`, so **36 s ≈ 47–50 min, 40 s ≈ 50–55 min**. `video.mjs` logs every 60 frames. Wait with a background `until grep -q done render.log` loop.
- When a voice line's time is computed at load (e.g. "It's through!" when the ambulance arrives), build the subtitle cues from `events.json` (see `films/phantom-jam/subs.py`).
- ffmpeg 7: download the BtbN build into the scratchpad (curl), extract it, and prefix `PATH` per command. The user allowed running it in the second session; a new session may get a permission prompt the first time.
- Speech-check failures and the fixes that worked: "Stuck." → "You're stuck."; "Wait. Is that snow?" → "Hold on. Is that snow?"; "Fireboats, too." → "Here come the fire boats!"; "Ahead: stop, go, stop." → "Up ahead: stop and go."; "tapped the brakes" → "hit the brakes". Numbers: "Seven fifty" is heard as "750" (put that in `asr`).
- Traffic sims: an IDM ring road (`films/phantom-jam/jam.js`) with N = 44 on 626 m, v0 14, T 1.0, a 0.55, b 2.0 is string-unstable. A 1.8 s brake tap grows into stop-and-go within about 20 s of sim time.
- Media repo: clone it shallow with `--filter=blob:none`; before each push run `git fetch --depth=1 origin main && git reset --hard origin/main` (the manager deletes posted files), then push with `-c push.negotiate=true`.

## Storm Surge (done; the plan as it was, kept for reference)

From ideas/pocket-city.md #6, series **Will It Survive? #1**. Planned (not built):
- Hook, frame 0: a grey surge line on the horizon moving in; the four floodgates along the canal/quay still open; HUD countdown "SURGE 0:45"; VO "A storm surge. Four gates. Forty-five seconds."
- Build: the sea plane gets a moving surge front (a raised band, or a darker, foamier ring with white sprite spray); floodgates are four red steel leaves on the canal mouth and at three quay openings that swing shut (hinged boxes). Gate order: canal mouth (big) → two quay ramps → the fish-market gap. Capsule people move away from the quay. Grey low-saturation storm grade (STYLE: lower saturation) with gusting rain (Ten Minutes has `makeRain`).
- Beats: gate 1 closes easily → gate 2 jams (a parked van/boat in the way, tow it, real time) → gate 3 closes with the wave in sight → the last gate shuts at 0:02 at ×1 REAL TIME as the wave hits the wall and spray goes over the top; the water level stays below the quay (the town survives). Payoff fact: storm surge is the sea pushed up by wind and low pressure, not a tsunami. Loop line: "…and the next tide is in twelve hours." Rise back to the opening aerial. Question: "Would you have closed the canal first?"
- Avoid the drawbridge as a beat (already used twice). Keep the cat on a roof.

## Open ideas for next films

- **"Last Ferry"**: you run across the town to catch the last ferry; the horn blows; a sprint along the quay.
- **"One Day at the Harbour"**: a locked vantage from dawn to night, shadows sweeping, boats in and out, lights going out one by one.
- **"Sudden Rain"**: a cloud shadow crosses the town, umbrellas pop like confetti, everyone runs; a child dances in the rain in real time.
- **Vietnam-set cities** (new town needed, more work, strong channel identity): a Saigon crossroads at rush hour (a swarm of motorbikes, red and green waves); a floating market at dawn; a Tết flower market leading to midnight fireworks.
- Series continuity: a pizza for the Engine 9 crew, the ferry from the quay, the same dog.

### Learned in the third session
- Storm Surge renders faster than expected: 943 frames in 33 min with `--workers 2`.
- `films/storm-surge/world.js` is the newest world: a sluice channel through the quay (`CHAN`), the sea removed from the world (the film builds its own displaced storm sea, `makeSea` in `actors.js`: a world-space grid with `seaH()` in the vertex shader and analytic normals), `U.storm` for heavier cloud shadows, and `buildWorld` returns `canal`, `chanW`, `waterMat`.
- Running the BtbN ffmpeg from the scratchpad was blocked by the auto-mode classifier until the user OK'd it (AskUserQuestion). Ask up front next time.
- Speech check: "Tow it. Fast." → "Told it fast"; "Get the tow truck" → "toll truck"; "Call a tow truck. Hurry!" passed. "The surge is in sight" → "inside" (use "Here comes the wave."). "quay" is heard as "key": put "key" in `asr`.

### Third session, later (27 Nov UTC)
- **Manager is now `session_01CUE842B4KiVEBKEUhstDsx`** (send_message by id, not "@parent").
- **No daily cap any more**: deliver each film as soon as it is rendered and checked: push mp4 + clean thumb to the root of `oopsbank/some-crazy-things-media` (this session was given push access; clone at /home/user/some-crazy-things-media), check the Pages URLs return 200, SendUserFile, then message the manager.
- **Visual upgrade asked by the user** (engagement stuck around 40% viewed): golden-hour light (sun #ffc58c, elevation ~22–24°, warm fog, sky warm at the horizon), lit windows (`U.lit`, world.js in all-green/two-tugs), bloom .6, blur band amp ~36–38 / maxCoc 34, saturation 1.5, GTAO on (`ao: true`, ≈ +40% render time), set dressing and secondary motion (`films/all-green/dressing.js`: parked cars, lamps, benches, café terraces, corner crowds, rooftop laundry/flags, pigeons, gulls). Openings: a CLOSE shot of the problem in frame 0 plus a big 2-line hook tile (y ≈ 490–790) for the first ~2 s; 25–32 s; loop.
- `films/all-green` (One Rule Changed #1, 32.3 s): grid IDM sim `grid.js` with scripted box "locks"; tow truck; Engine 9 rolls at 0:00.
- `films/two-tugs` (Pick a Side #1, 30.5 s): keyframed ship drift (dBow/dStern), red/blue tugs on lines, pull meters and work share, line snap, sailboat; built, voices checked, score+mix done, stills checked; needs the full render.
- Gotcha: a `cmd && cmd && (render) &` chain backgrounds the whole chain; if an earlier step fails the render never starts. Start renders with the Bash tool's run_in_background instead.

### Opening types (retention playbook, ideas/RETENTION_PLAYBOOK.md on branch `ideas`; never repeat the previous film's)
| Film | Opening type | Frame 0 | Headline | First line |
|---|---|---|---|---|
| Storm Surge | (old) wide aerial | grey sea, tiny gates | none (pill only) | "Storm surge. Four gates. Forty-five minutes." |
| All Green | Close → Pull-out (car at the lens) | the pink car racing into the junction under a green light, ~40% of height, sharp; pull-up 1.15–1.85 s | EVERY LIGHT / IS GREEN | "Every light turned green. Engine 9 is trapped." (horn on frame 0) |
| Two Tugs | Chase → Reveal (hero from behind) | the red tug from behind and low, bow wash, the giant ship ahead; pull-out 1.15–1.9 s to the high view of ship + quay | THIS SHIP / WON'T STOP | "This giant ship won't stop. Pick a tug!" (ship horn on frame 0) |
| Tunnel or Bridge? | Result first (the finish at frame 0, then "40 seconds earlier") | ambulance A side-on at the hospital bay (≈ 40% of height), whip-pan to B at 0.55–1.05 s, rewind rise to the aerial 1.6–2.7 s | WHO GETS / THERE FIRST? | "Tunnel or bridge? Pick one. Now!" (air horn on frame 0) |
Rules applied: HUD fades in at 1.0 s, map/meters ≥ 1.8 s; first 2 s nearly sharp (`sharp(t)` band + low aperture), music enters after 0.4 s, loop seam dives back to the frame-0 shot in the last 0.55 s.

### Skeletons (CONTENT_PLAYBOOK.md on `ideas`; rotate, never twice in a row)
| Film | Skeleton | Twist (~55%) | Payoff line | Last line / next |
|---|---|---|---|---|
| Storm Surge | Checklist race | (none) | "It held." | question |
| All Green | One rule changed | (weak: the untangle runs backwards) | "Gridlock starts with one car stuck in a junction." | question (playbook applied only to the opening; render was under way) |
| Two Tugs | Pick a side | blue's line snaps (37%), then the sailboat forces red to let go (45–60%) | "It stopped two metres out. Each tug pulls sixty tonnes." | "Red or blue? Next: tunnel or bridge." |
| Tunnel or Bridge? | Result first | the drawbridge goes up for a sailboat (48%) while blue is under the canal | "Tunnel, by a nose! Tunnels never stop for boats." | "Next: one tow truck, two hundred cars." |
Next film: Tunnel or Bridge? (re-ranked #2): use a different skeleton from Pick a Side if possible, e.g. "Result first" or "Chain reaction".


## Current state and rules (third handoff)

**Films**
- *Storm Surge vs the Sea Wall*: delivered and pushed to the media repo (`pocket-city_storm-surge_*`).
- *All Green* (`films/all-green`, 32.3 s, One Rule Changed #1): **delivered** by the third session (media repo commit e233c19, with `pocket-city_compare.jpg`). Frame-0 metrics: brightness 86, sd 74, sat 135, motion 28.3 (Storm Surge 107/39/70/6.6). The text below was the plan. When the render is done, finish it (or re-run `sh films/all-green/build.sh` with `FFMPEG_DIR=<BtbN bin>`): mux, self-check, the poster (t = 29.0, nohud, or pick a better frame), push `pocket-city_all-green_1080x1920.mp4` + `_thumb.jpg` plus `pocket-city_compare.jpg` (side by side: Storm Surge frame 0 | All Green frame 0), then message the manager. (If the third session delivered it, skip.)
  - Suggested title: "What If Every Traffic Light Turned Green? 🚦"; hashtags #tiltshift #miniature #traffic #gridlock; pinned: "Which junction would you have fixed first?"
  - Sources: UK Highway Code rule 174 (box junctions); NYC DOT "Don't Block the Box"; US DOT FHWA, traffic signal preemption for emergency vehicles.
- *Two Tugs, One Giant Ship* (`films/two-tugs`, 32.4 s, 46.7 MB, Pick a Side #1): **delivered** by the fourth session (media repo commit 267b010, Pages 200, SendUserFile, manager messaged). Render 778 frames in 62 min (`--workers 2`, GTAO). Checks: density 21% empty on the final mp4; frame 0 brightness 128 / sd 58 / sat 159 / motion 15.9; whisper on the final mix clean; -14.3 LUFS. Thumb = t 0.3 nohud (red tug close, ship ahead). Opening Chase → Reveal; skeleton Pick a side.
- Next ideas in order (CONTENT_PLAYBOOK re-rank): **Tunnel or Bridge? One Ambulance** (#2), **Can 1 Tow Truck Clear 200 Cars?** (#13), Bridge Weight Test (#15), The Day Every Car Left at Once (#19), Runaway Shopping Trolley (#7). Dropped: Drawbridge, Fog Bank, Causeway, Dam.

**Rules from the user (via the manager `session_01CUE842B4KiVEBKEUhstDsx`)**
- No daily cap. Deliver as soon as a film is rendered and checked: push it to the root of `oopsbank/some-crazy-things-media` (main), check the Pages URLs return 200, SendUserFile the mp4 + thumb to the user, then message the manager with:
  - file names, duration and size;
  - title (≤ 60 characters, key noun first, one emoji at most);
  - a 2–3 line description with sources and 2–4 hashtags;
  - the pinned comment;
  - AI notes: procedural imagery; synthetic Kokoro voice, so turn on the disclosure; original music from CC0 samples; synthesized sound effects;
  - the next topic.
  Reply to the user in Vietnamese, short; the films are in English.
- **Media repo access must be added in the new session**: `add_repo oopsbank/some-crazy-things-media` (push). The classifier blocked it once until the user asked for it, so if it is refused, ask the user. Clone with `--depth 1 --filter=blob:none`; before each push run `git fetch --depth=1 origin main && git rebase origin/main`; push with `-c push.negotiate=true`. Never delete files there.
- **ffmpeg 7**: the BtbN static build in the scratchpad (`curl -L github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz`). The classifier asked for the user's OK the first time it ran (AskUserQuestion worked).
- **Retention playbook** (`ideas/RETENTION_PLAYBOOK.md` on branch `ideas`):
  - frame 0 is a CLOSE, sharp shot of the hero machine in action (35–50% of the frame height), with a fast pull-out to the aerial by ~1.5–1.9 s;
  - a 2–5 word headline tile at y ≈ 370–670 for ~2 s;
  - the first line is ≤ 8 words with the stake, starts by 0.2 s, speed ≈ 1.05–1.1;
  - a sound hit on frame 0, and the music comes in after 0.4 s;
  - the HUD fades in at 1.0 s and maps or meters from 1.8 s;
  - the first 2 s stay nearly sharp (the `sharp(t)` band, aperture ≈ 700), then the full band;
  - the last 0.55 s dives back to the frame-0 shot (loop);
  - rotate the opening type (log in the table above).
- **Content playbook** (`ideas/CONTENT_PLAYBOOK.md`):
  - the stake in words by 1 s;
  - no gap > 2.5 s without a line and an event;
  - a new, bigger beat every 3–5 s;
  - a twist at 50–60%;
  - show the causes;
  - the payoff is a win/fail image plus one surprising line of ≤ 12 words;
  - plant a "spot it" detail at frame 0 and pay it off at the end;
  - the last line names the next episode (the question goes in the pinned comment);
  - rotate the skeletons (checklist race, chain reaction, pick a side, one rule changed, result first);
  - run the pre-render checklist (§5) on the script and the stills;
  - log the skeleton (table above).
- **Visual upgrade:**
  - golden hour: sun `#ffc58c` at elevation 22–24°, warm fog `#efd6bd`, a sky warm at the horizon, `U.lit = 1` for lit windows;
  - bloom .6/.9/.5; saturation 1.5, warm .42; GTAO on (`ao` default; `?noao` for quick stills);
  - a lighter blur band than before (amp ≈ 26–28, maxCoc 26: blur reads as low quality on phones);
  - **density**: `films/all-green/dressing.js` (town: parked cars, lamps, benches, planters, café terraces, corner crowds, rooftop laundry/flags/pots, pigeons, gulls) and `films/two-tugs/harbour.js` (marina, anchored boats, buoys, movers, foam, floating gulls, quay crates/barrels/bikes/kiosks/flags, roof AC units/antennas/solar/tanks, horizon sails), plus water ripples and glints in `films/two-tugs/world.js`.
- **Density grid check** (required before rendering): render stills every 2 s with `--q 'noao&nohud'`, then run the empty-cell script:
  - 6×10 grid; a cell is "empty" if < 1.2% of its pixels have a Sobel gradient > 40;
  - target ≤ 20–25%;
  - report before and after (Two Tugs: 58% → 24%).
  - The script (copy into the film or the scratchpad):
    ```python
    import sys, numpy as np; from PIL import Image; from scipy.ndimage import sobel
    tot = emp = 0
    for f in sys.argv[1:]:
        Y = np.asarray(Image.open(f).convert('L'), np.float32); g = np.hypot(sobel(Y, 0), sobel(Y, 1)); H, W = Y.shape; ch, cw = H // 10, W // 6
        e = sum((g[r*ch:(r+1)*ch, c*cw:(c+1)*cw] > 40).mean() < .012 for r in range(10) for c in range(6)); tot += 60; emp += e
    print(f'empty {emp}/{tot} = {emp/tot*100:.0f}%')
    ```
- **Comparison metrics** (frame 0 of the final mp4 at 270×480: brightness, luma sd, mean HSV S, mean |frame(1 s) − frame(0)|, blurred share = local Laplacian energy < 5% of its 95th percentile at 540×960): Storm Surge 107 / 39 / 70 / 6.6 / 62%. Prop count via `window.SCENE` (exposed in main.js): Storm Surge 139 meshes + 2,676 instances; All Green 65 meshes + 12,384 instances.

**Render pipeline and gotchas**
- `setup.sh deps voice music`, `fonts.sh`, then per film: tts + asr_check, `events.mjs`, `subs.py`, `music/score.py`, `mix.py`, `video.mjs --workers 2` (SwiftShader; with GTAO ≈ 11 s per frame per worker, so a 32 s film ≈ 75 min), `mux.sh` with BtbN ffmpeg on PATH. Each film's `build.sh` does all of it.
- Start long renders with the Bash tool's `run_in_background`, never inside a `a && b && (render) &` chain: if an earlier step fails, the render silently never starts.
- Stills during a render slow it a lot; keep them few.
- A voice line's duration changes the timing: re-check the line overlaps after each TTS change. Speech-check fixes: "quay" → asr "key"; "metres" → asr "meters"; "Engine Nine" in the text, "Engine 9" in asr; "Tow it" → "Told it", so use "Call a tow truck".

### Fourth session (27 Nov UTC)
- The user approved (AskUserQuestion) both the BtbN ffmpeg download and `add_repo` for the media repo with push access; both were blocked by the classifier until then. Ask both in one question up front.
- A fresh container needs `setup.sh deps voice music` (≈ 10 min) and a full rebuild of voices/events/score/mix before the render (build.sh does it).
- Don't name sources in the description unless verified (I had to correct a message to the manager).
- *Tunnel or Bridge?* (`films/tunnel-bridge`, 34.8 s, Pick a Side #2): built by the fourth session. Two ambulances on physical speed profiles (`story.js`: accel/brake limits, corners, the camper zone, B's barrier stop); A's top speed and B's barrier-lift time are solved so A crosses the bay line at race 39.95 s and B at 40.05 s. Film time maps to race time with a rewind at 1.6–2.6 s and a rewind dive at the seam (34.25 s → end). New: tunnel portals at x −130, hospital bay with a finish line, camper at a height bar, quay market (`makeQuayDressing`), paving joints and roof stripes in world.js. Density 36% → 27% (blur reduced to amp 15–16 in mid shots; the camper shot and the bay close stay ~45%). Frame 0 (still): brightness 114, sd 77, sat 124, motion 29.8. Render started ~12:40 UTC.

## Fourth session: final state (27 Nov 2026, ~13:10 UTC)

**Production is stopped** (the user, via the manager `session_01CUE842B4KiVEBKEUhstDsx`). Wait for the manager before making anything.

Delivered this session (both pushed to the root of `oopsbank/some-crazy-things-media`, Pages 200, sent to the user with SendUserFile, manager messaged):
| Film | File | Length | Opening / skeleton | Final checks |
|---|---|---|---|---|
| Two Tugs, One Giant Ship (Pick a Side #1) | `pocket-city_two-tugs_*` (commit 267b010) | 32.4 s | Chase → Reveal / Pick a side | density 21%; frame 0 128/58/159/15.9; speech clean |
| Tunnel or Bridge? (Pick a Side #2) | `pocket-city_tunnel-or-bridge_*` (commit 10ce2b3) | 34.8 s | Result first / Result first | density 20% (final mp4); frame 0 111/77/131/30.0; speech 13/14 (last line "cars" → "calls" under music) |

Lessons:
- The density check punishes the tilt-shift blur: lowering mid-shot blur to amp 15–16, w .15–.17, and framing facades/markets rather than roofs and empty pavement did more than adding props. Stills (noao) read ~7 points worse than the final mp4.
- Sirens and crowd cheers mask the voice: duck the effects under narration too (`fduck` in `films/tunnel-bridge/mix.py`), and re-run whisper on the final mix.
- A wide portrait frame can't hold two converging vehicles; use a whip-pan between them, or a side-on view where the finish line runs across the frame.
- `films/tunnel-bridge/story.js` has a reusable race kit: rounded paths, speed profiles with accel/brake limits and stops, and solving top speeds so a finish lands on a chosen time.

Next ideas (in order, for when production resumes): **Can 1 Tow Truck Clear 200 Cars?** (teased at the end of Tunnel or Bridge?, #13), Bridge Weight Test (#15), The Day Every Car Left at Once (#19), Runaway Shopping Trolley (#7). Rotate away from "Result first" (use Checklist race or Chain reaction) and from the whip-pan opening.

## Fourth session: after the stop (27 Nov 2026, ~21:30 UTC)

After the stop, the rendered outputs in the container were deleted (sources and HANDOFF kept). Then two more films were made on request, delivered the same way (media repo root, Pages 200, SendUserFile, manager messaged). Now idle.
| Film | File | Length | Opening / skeleton | Final checks |
|---|---|---|---|---|
| Police Chase (manager's request; CLARITY rules, `ideas/CLARITY_AUDIT.md`) | `pocket-city_police-chase_*` (commit ea8bc40) | 31.5 s | Headline "Stop that car!" over the race car / Causal chase → arrest held | density 33% (over target: low road-level shots); frame 0 104/68/–/20.8; speech 13/13 |
| Domino (Miniature Chaos) (user's own wordless script, 60 s) | `pocket-city_domino_*` (commit 5651c4d) | 60.0 s | In-world close-up (pigeon on the scaffold) / Chain reaction → 4 s hold → loop tease | density 3% (worst 17%); frame 0 135/39/142/10.1; −14.0 LUFS; black only 58.3–60 s (intended) |
| Midnight Crossing / Chuyến tàu lúc 00:00 (user's own wordless script, 65 s, night horror) | `pocket-city_midnight-crossing_*` (commit e15a508) | 65.0 s | Locked night diorama wide / calm → signal → anomaly → payoff → after-image hook | density 3% (worst 33% at 62 s, the blurred glance); frame 0 62/42/176/3.2 (night); −14.1 LUFS; score uses the Salamander piano: the CC BY 3.0 credit must be in the description |
| The Last Train Heist / Chuyến tàu 00:00 (user's own wordless script, 65 s, SFX only) | `pocket-city_last-train-heist_*` (commit 8662065) | 65.0 s | Cold open on an explosion / escape across a three-tier map → slow-mo leap → comic button (street sweeper) | density 9% (worst 15%); frame 0 53/38/174/8.1 (night); −14.2 LUFS; no music |
| The Last Train Heist — 35 s recut (after a viewer review; preferred for posting) | `pocket-city_last-train-heist-35s_*` (commit 0d625d6) | 35.5 s | Close bank-door blast + LED badge 23:59 / hard cuts → clock insert → slow-mo leap → badge 00:00 loop | density 12% (worst 38% at 1 s, smoke); frame 0 86/74/134/49.0; first second −18.6 dB RMS; −14.2 LUFS |

Lessons:
- **A background task is killed at 2 h.** A 60 s film at 1080×1920 on SwiftShader takes ~10 s/frame/worker (2 workers ≈ 2 h for 1,440 frames), and `core/render/video.mjs` deletes its segments when it is killed. Render in chunks instead: a small frame-range script (open the demo with `core/render/page.mjs` `openDemo`, `render(f/24)`, screenshot, pipe to ffmpeg) for 0–360/360–720 in parallel, then 720–1080/1080–1440, then `ffmpeg -f concat -c copy`. Each pair takes ~1 h.
- `mux.sh` needs ffmpeg ≥7; the system has 6.1. The BtbN static build in the scratchpad goes away between sessions: download it again (the user allowed it).
- Police Chase: cold viewers missed the raised bridge and the hands-up until a STOP sign on the leaf, a skid shot facing the bridge and a closer arrest were added. Ask a cold subagent (C12) before rendering.
- Domino: a camera path made of keyframes (`films/domino/main.js` KEYS) with a still hold works well for a long chain; build a low plaza instead of buildings on the camera side of a junction so the road stays visible.

- Midnight Crossing (`films/midnight`) is its own small diorama (scene.js), not the shared town: night lighting (hemisphere + moon + a shadow-casting street-lamp spot, point lights for the cart, vending machine, store, signals, neon), reflections on the wet road faked with additive "glint" sprites placed where the camera ray to each light's mirror image meets the road (`makeFX` in actors.js), rain streaks brighter inside the lamp cone, and a custom ink-ribbon shadow. About 6 s/frame on SwiftShader with 2 chunks in parallel (≈40 min per 780 frames).
- Sample licences: `piano` is Salamander (CC BY 3.0): put the credit line in the YouTube description. `S.credits([...])` prints the lines.
- The Last Train Heist (`films/heist`) reuses Midnight's night kit (copied into `kit.js`: textures, facade painter, toy figures, toy cars) with its own map (scene.js). Story time vs film time (a 0.3× slow-motion at the jump) via `sim()`/`invSim()` in story.js; events for the sound are in film time. Lesson: a tall billboard in front of the viaduct hides whatever passes behind it from a 60° camera (a point at height h appears h/tan(pitch) further north); keep the action that matters clear of tall foreground objects, or raise the pitch.
- Viewer review of the 65 s Heist (sent by another session): wordless one-take wides lose scrollers. What fixed it: the loudest hit inside the first second, the hero big in frame by 2 s, one short text badge giving the stakes (kept in the top fifth, clear of the bottom caption zone), 30–35 s, hard cuts between story slices, a last frame that rhymes with the first. `films/heist30` cuts the same animation with a segment table (film start, story from/to, speed, camera) and slices the sound from the full film's mix along the same story times. Make all motion deterministic in story time (no per-frame smoothing), or cuts and render chunks jump.
- User feedback on the Heist 35 s: "too noisy". Audio v2 (`films/heist30/mix2.py`, file `pocket-city_last-train-heist-35s-v2_*`, commit f6d1721): built from scratch with few layers at once, the alarm and sirens as short bursts far down, no noise loops (wind, crowd, drones), a low-pass at 6.5 kHz, a near-silent slow-motion, a soft procedural low pulse. Default from now on: sparse SFX with gaps; never several noise beds at once.

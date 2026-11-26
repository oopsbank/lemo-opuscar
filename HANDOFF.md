# Handoff: Pocket City (tilt-shift Shorts)

For a new Claude Code session that knows nothing about the earlier work. Written at the end of the first production session (2026-11-26).

## The channel

- **Pocket City**: a YouTube Shorts channel of **Tilt-Shift Miniature** films, made with this library (`styles/tilt-shift/STYLE.md`; read `AGENTS.md`, `DIRECTOR.md` and `TECHNIQUE.md` first).
- Format: **1080×1920 vertical, 24 fps, 35–45 s**, English narration and subtitles, a relaxed male narrator in the second person ("You drive…", "Ten minutes…").
- One shared world: a whitewashed Mediterranean-style **harbour town** (terracotta roofs, cobalt shutters, palm boulevard, canal with a bascule drawbridge, quay, sea). Both films reuse it; the code lives in each film's `world.js`.
- Series idea: the town's people and places recur. The fire station has "ENGINE 9" painted on its roof and appears in both films.

## Films so far

| Slug | Length | Story | Status |
|---|---|---|---|
| `films/engine-nine` | 37.0 s | You drive fire engine 9 from the station to a warehouse fire by the harbour. Obstacles: gridlock that parts, then a raised drawbridge with a sailboat passing (real-time wait). The ladder goes up, the water hits, and the last flame dies in real time. Last line: "Fire's out. Nobody's hurt." | Posted (v3 smooth): `pocket-city_engine-nine_1080x1920.mp4` + `pocket-city_engine-nine_thumb.jpg` in `oopsbank/some-crazy-things-media`. Title used: "The bridge went up. The fire didn't wait. 🚒" |
| `films/ten-minutes` | 45.0 s | A pizza scooter with a 10:00 countdown in the HUD. Obstacles: market (crate of oranges spills), a dog chase, roadworks with a U-turn into an alley, a marching band (real time, the clock ticks second by second), a jump over the rising drawbridge in ×¼ slow motion, then rain. Delivered to a customer on a moored boat at 9:59 (00:01 left). The camera tilts up to a rainbow. | Posted: `pocket-city_ten-minutes_1080x1920.mp4` + `pocket-city_ten-minutes_thumb.jpg`. Title used: "10 minutes to deliver a pizza. The whole town said no. 🍕" |
| `films/not-in-our-town` | 40.0 s | A flying saucer's shadow crosses the boulevard; reveal over the harbour; its beam takes a car, a palm tree and a sailboat; Engine 9 rolls, fireboats sail; ladder jet + fireboat arcs hit its rim lights in ×¼ slow-mo; in real time it drops everything back and flees; rise over the cheering quay. Last line: "Not in our town." | Pushed (second session, user OK'd auto-push from now on): `pocket-city_not-in-our-town_1080x1920.mp4` + `_thumb.jpg`. Title: "A UFO tried to steal our town. Engine 9 said no. 🛸🚒" |
| `films/snow-day` | 36.0 s | Overnight snow; three ploughs, 6:00→8:00, every road before the school bell. Snow shader (upward faces) + a plough map texture (film time each metre of road was cleared) in world.js; the blue plough sticks in a drift (real time, backs up, rams); the last pile pushed to the school gate at 7:59:59; bell; it snows again, roads re-whiten, camera back on the opening aerial (loop). | Pushed: `pocket-city_snow-day_1080x1920.mp4` + `_thumb.jpg`. Title: "2 Hours. 3 Snowploughs. School Opens at 8:00. ❄️" |
| `films/phantom-jam` | 36.0 s | A ring-road IDM traffic sim (`jam.js`, 44 cars) on the boulevard: one brake tap grows a stop-and-go wave; the ambulance is stuck; you (yellow car) keep a gap and never stop (jam absorption); the ambulance turns into the hospital at 0:03; another driver brakes (loop). Countdown + route-map inset; yellow cat on the hospital roof. Built to `ideas/FORMULA.md`. | Pushed: `pocket-city_phantom-jam_1080x1920.mp4` + `_thumb.jpg`. Title: "Who Started This Traffic Jam? 🚑" |

Each film folder has `TREATMENT.md` (the plan and the changes made in production), `CREDITS`, `build.sh` (one command: fonts, voice and speech check, events, subtitles, score, mix, picture, mux, poster), `lines.json` (voice), `story.js` (the timeline), `music/score.py` and `mix.py`.

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

## Open ideas for next films

- **"Last Ferry"**: you run across the town to catch the last ferry; the horn blows; a sprint along the quay.
- **"One Day at the Harbour"**: a locked vantage from dawn to night, shadows sweeping, boats in and out, lights going out one by one.
- **"Sudden Rain"**: a cloud shadow crosses the town, umbrellas pop like confetti, everyone runs; a child dances in the rain in real time.
- **Vietnam-set cities** (new town needed, more work, strong channel identity): a Saigon crossroads at rush hour (a swarm of motorbikes, red and green waves); a floating market at dawn; a Tết flower market leading to midnight fireworks.
- Series continuity: a pizza for the Engine 9 crew, the ferry from the quay, the same dog.

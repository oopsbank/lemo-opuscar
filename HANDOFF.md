# Some Crazy Thingzz: handoff for a fresh session

This branch (`handoff/some-crazy-thingzz` of oopsbank/lemo-opuscar) holds everything a new session needs to keep making films for the **Some Crazy Thingzz** YouTube Shorts channel:
- the channel's style, **Toon on Set**, in `my-styles/toon-on-set/`;
- the sources of the films made so far, in `some-crazy-thingzz/films/`;
- this file.

## 1. Who you work for

- **The user** writes in **Vietnamese**. Answer in Vietnamese, in short messages. The films themselves are in **English** (voices and captions).
- **The manager session** (`session_01CUE845kr927bcMMEQMk3RQ`, reach it with `send_message` to `@parent` when it created you, otherwise by that id) coordinates several channels (Pixel Life, Pocket City, Some Crazy Thingzz). The user said its orders are the user's own.
- **Standing rules from the manager** (the autonomous pipeline, set by the user):
  1. When a film is final and self-checked, push the mp4 and a clean thumbnail to the **root of `oopsbank/some-crazy-things-media`, branch `main`**, named `some-crazy-thingzz_<slug>_1080x1920.mp4` and `some-crazy-thingzz_<slug>_thumb.jpg`. Nothing else goes in.
  2. Wait until the GitHub Pages URL (`https://oopsbank.github.io/some-crazy-things-media/<file>`) returns 200. Then `send_message` to the manager with:
     - the two file names, the duration and size;
     - a YouTube Shorts title (English, hooky, ≤ 70 characters);
     - a 2–3 line description ending in 4–6 hashtags, including `#shorts`;
     - the AI / synthetic notes (§6);
     - **the topic you'll do next**.

     You don't wait for the user's review before pushing.
  3. Then start the next film right away: take the next idea from the backlog (§8), and tell the user in **one short Vietnamese line** what you picked. Keep films **20–30 s**.
  4. Avoid topics the other channels are doing. **Currently off-limits: UFO/aliens/spaceships, and pizza/delivery.** If the manager reports a collision, switch topics.
  5. **Never delete files from the media repo**: the manager removes them after YouTube confirms the upload.
  6. **At most 2 finished films per day (Vietnam time, UTC+7).** After the second, wait until the next Vietnam day before starting another. The user posts to YouTube by hand: the manager passes them your files and texts.

## 2. The channel format

**Read the research first:** branch `ideas` of oopsbank/lemo-opuscar, files `ideas/README.md` (what Shorts reward now) and `ideas/some-crazy-thingzz.md` (the ranked backlog). It may be revised on the same branch:
```
git fetch origin ideas && git show origin/ideas:ideas/some-crazy-thingzz.md
```
Its findings, applied to this channel:
- **Frame 1 hooks:** the object, huge, plus the spoken question, the question as on-screen text from the very first frame, and something moving. The wrong theory starts by second 2.
- **Length:** 20–30 s.
- **Loop:** the last frame leads back into the first. End on the next silly question, or a fool about to repeat the mistake. Avoid a final cadence in the music that announces the end.
- **Title:** `Why Do <Objects> Have <Thing>?`, exactly the searched question. Tags: `#whydo #funfacts #animation` (plus `#shorts`).
- **Facts** must be true and simple: check each against two sources.

Comedy explainer Shorts: "Why do…?" / "What if…?". Each film is 1080×1920 at 24 fps, 25–40 s, in English:
- a quick narrator plus character voices (Kokoro, offline);
- bold word-by-word captions burned in;
- a light comedy score from sampled instruments, with cartoon foley;
- a true answer.

The shape that works: the question as the hook in the first 3 s, a character acting out the wrong idea with a visible consequence, the real answer, then a payoff or button.

The reference the user gave (grammar only, never copy it) is a Short with flat cartoon characters in lit 3D sets. No LEGO or toy-brick look.

## 3. The style: Toon on Set (实景卡通)

- **Look:** flat 2D cartoon people (round white heads, thick ink outline, stick limbs) on upright cards inside a full-size, sunlit 3D set built in three.js. Real cast shadows, shallow depth of field, an eye-level camera, word-by-word captions at 64 % of the frame height.
- **Where to read it:** `my-styles/toon-on-set/STYLE.md` is the style's invariants. `DEMO.md` and `demo/` hold the Red Flag demo and its engine.
- **Make it findable in a fresh container**, where `~/lemo-my-styles/` is empty:
  ```
  mkdir -p ~/lemo-my-styles && cp -r my-styles/toon-on-set ~/lemo-my-styles/ && cp my-styles/README.md ~/lemo-my-styles/README.md
  ```
- **Engine files:**
  - `toon.js`: the 2D vector drawing.
  - `cast.js`: characters, poses, mouths, hats, hair, and hand props.
  - `card.js`: a character as a lit card, with a shadow card and a contact blob.
  - `set.js`: painted PBR surfaces, the rbox kit, and the sky, sun and fill.
  - `caps.js`: the captions.
  - `timing.py`: turns Whisper word times into caption groups and lip-sync envelopes.
  - `mix.py`, `music/score.py`, `subs.py`, `build.sh`.
- **The newest and most capable engine is the crackers film** (`some-crazy-thingzz/films/cracker-holes/`):
  - `kitchen.js`: an indoor set with tiles, cabinets, an oven with a hinged glass door and glowing elements, and a window with sun.
  - `Dough`: a deformable sheet that can bubble, puff into a pillow, deflate and get holes.
  - `Puffs`: deterministic billboard particles for steam and flour.
  - In `cast.js`: `HAT.toque`, `HAIR.tuft`, `sp.glasses`, `sp.cheeks`, `sp.headScale` (kids), hand props `rprop` / `lprop` (`fork`, `cracker` with `bite`), and `armsFront` (hands drawn in front of the face).
  - `cardLocal(card, worldPoint)` in `main.js`: places a drawn hand exactly on a 3D prop.

## 4. Films made

| # | Film | Question | Length | Media files | Source |
|---|---|---|---|---|---|
| 1 | Red Flag | Why do mailboxes have a red flag? | 22.4 s | `some-crazy-thingzz_red-flag_*` | `my-styles/toon-on-set/demo/` |
| 2 | No Holes | Why do crackers have holes? | 24.0 s | `some-crazy-thingzz_cracker-holes_*` | `some-crazy-thingzz/films/cracker-holes/` |

Make the next ones 20–30 s, hooked from frame 1 and looping (§2).

To rebuild a film:
```
cp -r <source> films/<name>
LEMO_ANGLE=swiftshader sh films/<name>/build.sh
```
`films/` is gitignored. Outputs go to `$OUT`, which defaults to `~/<name>-build`.

## 5. How to make the next film (what worked)

1. **Treatment** in `films/<name>/TREATMENT.md`, written before anything else: three candidate structures and the choice, a shot list on the 120 BPM grid (beat 0.5 s), beats, cue map, sound table, captions. Compare against the earlier films; at least four of these must differ: structure, opening, signature shot, camera path, score shape, ending.
2. **Copy the engine** from `some-crazy-thingzz/films/cracker-holes/`. Delete `kitchen.js` if the set is new, and write the set as one file (`buildX(scene)` returning the moving parts).
3. **Voices first.** Write `lines.json` (id, text, voice, speed, `at`, `who`, `groups` of 1–3 words, `hot`). Then:
   ```
   .venv/bin/python core/tts/tts.py lines.json $OUT/voices
   .venv/bin/python core/tts/asr_check.py lines.json $OUT/voices --lang en
   .venv/bin/python films/<name>/timing.py $OUT/voices
   ```
   `timing.py` writes `story.json` (captions) and `voices.json` (mouth envelopes). Put `"dur"` in `story.json` first.
   - Voices used so far: `am_michael` (narrator), `am_puck` (jumpy man), `bf_emma` (deadpan woman), `af_sky` (kid), `bf_isabella` (grandma).
4. **Stills, always at `--size 1080x1920`:**
   ```
   LEMO_ANGLE=swiftshader node core/render/still.mjs films/<name> 1.5 3 4.5 … --size 1080x1920 --q fast --out <dir>
   ```
   Tile them with ffmpeg `hstack` and look. About 6 s a frame.
5. **Render:**
   ```
   LEMO_ANGLE=swiftshader node core/render/video.mjs films/<name> --fps 24 --workers 2 --size 1080x1920 --q "ssaa=1.5" --out $OUT/video24.mp4
   ```
   Run it in the background. About 20 s a frame per worker on SwiftShader: a 24 s film takes about 1 h 45 min. Do score, mix and subs meanwhile: `node core/render/events.mjs … --out $OUT/events.json`, then `score.py`, `mix.py`, `subs.py`, all with `LIB=… OUT=…`.
6. **Master:**
   ```
   sh films/<name>/master6.sh $OUT/video24.mp4 $OUT/mix.wav $OUT/<name>.mp4
   ```
   This is a two-pass loudnorm to −14 LUFS, TP −1.5. The container has ffmpeg 6, and `core/render/mux.sh` needs 7. Downloading a static ffmpeg was refused by the permission system: don't try again.
7. **Self-check:**
   - a contact sheet of about 10 frames from the final mp4;
   - `blackdetect`;
   - `ebur128`, aiming for about −14 LUFS;
   - captions in sync and off the faces;
   - every sound-table row actually in the mix.
8. **Thumbnail:** a clean still with no captions:
   ```
   node core/render/still.mjs films/<name> <t> --size 1080x1920 --q "ssaa=2&nocap" --out <dir>
   ```
   Pick the most absurd, readable moment.

## 6. Publishing flow

```
git clone https://github.com/oopsbank/some-crazy-things-media   # add it with add_repo (push) first
cp <film>.mp4 some-crazy-things-media/some-crazy-thingzz_<slug>_1080x1920.mp4
cp <thumb>.jpg some-crazy-things-media/some-crazy-thingzz_<slug>_thumb.jpg
git -C some-crazy-things-media add <the two files>
git -C some-crazy-things-media commit -m "Add Some Crazy Thingzz short: <question> (video + thumbnail)"
git -C some-crazy-things-media -c push.negotiate=true push -u origin main
curl -sI https://oopsbank.github.io/some-crazy-things-media/<file> | head -1    # until 200
```

AI notes to send with every film (true for this pipeline):
- **Imagery:** synthetic CGI, rendered procedurally in code (three.js plus hand-coded 2D cartoons). Not from an image-generation AI.
- **Voices:** AI text-to-speech (Kokoro-82M), stock voices for cartoon characters, not a real person.
- **Music:** composed in code from real recorded CC0 instrument samples. Not AI-generated.
- **Sound effects:** synthesised in code.

## 7. Pitfalls met (read before building)

**Rendering and framing**
- `still.mjs --size 540x960` shows only the **top-left quarter**: the page canvas is fixed at 1080×1920. Always render checks at 1080×1920.
- Drawing order: arms come before the head, so a hand at head height (|x| < ~45 cm local) disappears behind the face. Hold props out to the side (x ≥ 48), or set `armsFront: true` for eating or holding something up to the face.
- With sprites in the scene, a `Raycaster` needs `ray.camera = camera`, or it throws `Cannot read properties of null (reading 'matrixWorld')`.
- Set the camera **before** posing characters when hands are placed with `cardLocal`.
- Vertical frames are narrow: a two-shot needs the two characters within about 1 m of each other, or a camera further back (2.5–3 m) with FOV 44–47.
- Keep the key prop **above** the caption band (64 %): tilt the camera down a little rather than move captions.
- A prop between the camera and a character hides the character (a flour bag hid the kid in a wide). Check the line of sight in each shot.

**Light and materials**
- Indoors, reflective steel picks up the outdoor sky env map and turns blue. Bake a warm room env instead (see `main.js` in cracker-holes).
- three.js lights are physical: a point light of 1.6 inside an oven burns out. 0.16 was right.
- Screen-space AO ghosts the set onto the cards: keep it off.
- The shadow card needs `map` and `alphaTest` on its own material.

**Voices and captions**
- Whisper mishears short interjections. "Uh oh." became "Is that O?": use a longer line ("Uh oh! It's growing!"). It hears "mail" as "male": use the `asr` field.
- Kokoro ignores an ellipsis: split the line in two.
- `timing.py` needs the caption's word count to match Whisper's words: "Uh-oh," splits into "Uh" and "-oh,", so write the caption as "Uh oh!" (two words).

**Sound**
- Crunches and other crackles read quiet in RMS: give them a high gain (1.3).
- The first score that uses the ukulele downloads the FreePats library (416 MB, CC0) on its own.

## 8. Next ideas

- **In progress:** golf-ball dimples (treatment in `some-crazy-thingzz/films/golf-dimples/TREATMENT.md`). Trim it to 20–30 s with a looping end: the golfer spots a tennis ball, "Why do tennis balls have fuzz?", which also teases the next film.
- **After it:** take the top of `ideas/some-crazy-thingzz.md` on branch `ideas`. At the time of writing:
  1. pen-cap hole;
  2. jeans tiny pocket;
  3. star on the elevator button;
  4. pencils with six sides;
  5. airplane-window hole;
  6. tennis-ball fuzz.

  The backlog's rules: one object per film; no vehicles-in-town (Pocket City's lane) and no job comedies (Pixel Life's lane); no UFO/alien or pizza/delivery.

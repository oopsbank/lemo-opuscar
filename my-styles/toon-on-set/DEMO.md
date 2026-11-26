# Toon on Set — demo film "Red Flag"

One example among many. Don't reuse its story, arc, shots, props or timings.

## Story (22.4 s, 1080×1920, 24 fps, English voices and word-by-word captions, music and foley)

"Why do mailboxes have a red flag?" On a country road at golden hour a postman walks up to a painted-metal mailbox, sees the raised red flag and panics: a red flag must mean danger. He hides behind the far-too-thin post. The homeowner walks into the foreground and explains, deadpan: flag up means there's outgoing mail to pick up. The door drops open on a letter. His blank close-up in true silence: "Oh." A sheepish grin. Callback to the opening insert: the flag drops with a clunk.

Structure: question → wrong guess → real answer → callback.

## Shots

| # | t (s) | Shot | What it shows of the style |
|---|---|---|---|
| 1 | 0–3 | Insert on the raised flag and the mailbox's side, slow push, background melted (focus 1.5 m, aperture 16) | the insert that explains · painted metal with chips · DOF |
| 2 | 3–6.5 | Eye-level medium (camera 1.36 m, 40°): the postman walks in on 12 fps, his silhouette shadow travels across the road | the real shadow · walk cycle · word-by-word caption |
| 3 | 6.5–8.5 | Reaction close-up: a beat of stillness, then a snap zoom (36° → 25° in 0.15 s) on "Red flag?!", the cap pops off, a small shake | snap zoom on the punchline word · squash & stretch |
| 4 | 8.5–10.5 | Low hero angle from knee height (0.42 m) on the flag against the sky | the absurd-scale reveal |
| 5 | 10.5–13 | Medium: crouched behind the post, teeth bared, jittering on 12 fps | comedy acting · props at real scale |
| 6 | 13–16.4 | Two-shot: the homeowner walks into the right foreground; focus racks from him (4.75 m) to her (3.05 m); she points | rack focus · a second card in depth |
| 7 | 16.4–18.4 | Insert: the hinged door drops open with a bounce, a letter propped inside | insert · set mechanics on every frame |
| 8 | 18.4–20.6 | Close-up: blank face, music cut dead, crickets; "Oh."; sheepish grin | silence before the punchline |
| 9 | 20.6–22.4 | Callback to shot 1's framing: the flag drops, clunk, a pizzicato button | callback ending |

## Palette & set

- Set: teal mailbox `#1f6f78` (chips of primer and rust, dust rising from the bottom), red flag `#c8321f`, weathered grey post wood, golden dirt road `#a7835a`, gravel shoulder in two stone layers, dry grass, white-painted fence, a barn in worn red paint `#a52c22`, poles and tree clumps in the blur.
- Light: sun `#ffd59a` intensity 3.4 from the front-left (`(-.38, .46, .8)`) so shadows fall back across the road and gravel the camera sees; hemisphere `#a9c2ea` / `#8a6f52` 1.05; sky dome `#5592d2` → `#f7d9a6`; fog from 30 m. Neutral tone mapping, warm grade 0.35, contrast 0.25, saturation 1.12, vignette 0.32, light bloom.
- Cast: postman (light blue shirt `#5b93d3`, navy trousers and cap with a gold band, brown moustache), homeowner (orange dotted dress `#e9893a`, dark bun, red lips). Outline 7 px and limbs 15 px on screen; ink `#1c1418`; heads `#fbf7ef` tinted warm in sun, cool in shade.

## Voices & captions

Kokoro (offline), three voices: narrator `am_michael` (the question, "Flag up means outgoing mail."), postman `am_puck` ("Mail time!", "Red flag?!", "Is it...", "danger?", "Should I run?", "Oh."), homeowner `bf_emma` at speed 0.88 (deadpan). `lines.json` holds each line's text, voice, start time `at`, speaker, word grouping (`groups`, 1–3 words) and which group flashes yellow (`hot`). `timing.py` turns the Whisper word timestamps into caption groups (`story.json`) and 24 Hz loudness envelopes (`voices.json`) that open the speaker's mouth on the 12 fps drawing time. In the mix each line is compressed and RMS-matched; the score ducks 8 dB under the voices.

## Score & sound

120 BPM sampled comedy band (`music/score.py`): oom-pah pizzicato (contrabass + violins/violas), clarinet staccato tune, bassoon staccato answers, marimba, woodblock off-beats under the walk. Stops dead at 6.5 s; the sting on "Red flag?!" is a xylophone run, a low bassoon "bwomp" and a slide whistle with a spring boing. Shots 4–5 turn to a sneaky A-minor pizzicato with a stab on "DANGER?" and a pizzicato tremble. C major again under the explanation, a small xylophone ta-da on the door. Cut dead at 18.4 s: only breeze and crickets; then a three-note bassoon wah-wah; a pizzicato button on the flag's clunk.

Foley (`mix.py`, synthesised): gravel steps, whoosh, boing, slide whistle, breathy swell, teeth chatter, pop, door creak and steel clank, flag clunk; bed of breeze and birds.

## Build notes

```
demo/
  main.js    page contract, shots {t0, t1, cam(u), set(u, tc)}, sunlit test, sound events, ?frame = the style frame
  card.js    character card: per-frame canvas at projected size, screen-px line widths, sun/shade tint, shadow card, contact blob
  cast.js    parametric cartoon people (poses, mouths, brows, hair, hats)       toon.js  2D vector engine (no boil)
  set.js     painted PBR surfaces, rbox kit, sky/sun/fill                       place.js the country road and mailbox
  caps.js    word-by-word captions          story.json  durations, caption groups, subtitle lines (made by timing.py)
  lines.json voice lines (text, voice, at, who, groups, hot)    timing.py  words → captions + lip-sync envelopes (voices.json)
  music/score.py  sampled score             mix.py  foley + bed + score        subs.py  subtitles_en.srt
  master6.sh fallback master when core/render/mux.sh refuses ffmpeg 6
  build.sh   one command: voices + check → events → score → mix → subtitles → 538 frames → mux → poster and style frame
```

`LIB=<library> OUT=<folder> sh build.sh` (`QUICK=1`: the first second only, a pipeline check). On a machine without a GPU add `LEMO_ANGLE=swiftshader` (about 10 s a frame at `ssaa=1.5`). Debug flags: `?fast` (no supersampling), `?ssaa=2`, `?ao` (screen-space AO, which ghosts the set onto cards), `?nocap`, `?frame`.

Pitfalls met on the way:
- The shadow card first cast a full rectangle: three.js copies `map` and `alphaTest` from the caster's own material into the shadow pass, not from `customDepthMaterial`.
- GTAO printed the fence pickets onto a close-up face (the cards are hidden from its pass): AO off.
- With the sun from the side, a vertical frame lost the cartoon's shadow off-screen; from the front-left it falls back across the gravel.
- A crouched character behind the mailbox lost his face to it: lower the crouch so the face clears the box and only the post is in front.
- A cap drawn after the face hid the brows: brows are drawn last.
- Kokoro ignores an ellipsis: "Is it... danger?" came out in one breath and its caption flashed for 0.2 s. Split it into two lines placed 0.8 s apart; "Is it..." needed speed 0.82 before Whisper stopped hearing "Is that".
- Whisper hears "mail" as "male" (they sound the same): the line's `asr` field expects "male".

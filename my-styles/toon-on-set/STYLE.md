# Toon on Set · 实景卡通 — Style Prompt

Made from a blank page; techniques from Tilt-Shift Miniature (tilt-shift) in Lemo-Opuscar, with moves borrowed from Sci-Fi Sitcom Toon (scifi-toon) and 2.5D Pixel Art (hd-2d).
Default size: 1080×1920.

> Flat 2D cartoon people acting inside a stylised but believable 3D set: painted metal, wood, gravel, warm cinematic sun, real cast shadows, shallow depth of field, a camera at their eye level, and bold word-by-word captions. Made for vertical comedy shorts ("What if…", "Why do they…").
> Reference (grammar only): story-explainer comedy Shorts that put flat cartoon characters into lit 3D sets. Copy no channel's characters, logo, watermark or branding.

## 1. Essence, and what it is not

**Flat cartoon actors on a real-looking film set.** The characters are drawn, not modelled: a round white head, a thick dark outline of constant screen width, stick-line limbs, big simple eyes and brows that do all the acting, flat-colour clothes with one hard-edged shadow shape. The world around them is built in 3D and lit like a film: real materials (painted and riveted metal, wood grain, gravel, concrete, cloth), a warm hard sun with real cast shadows, the background melting into shallow depth of field. The camera stands at the characters' eye level, like a live-action comedy. The joke lands in a word-by-word caption in the middle of the frame.

The contrast is the style: **the actors are flat and graphic, the set is solid and photographic-ish, and both share one light** (the cartoon casts a real shadow on the gravel).

Not a toy or brick world (no studs, no plastic bricks, no miniature look: the set is full size), not pixel art, not a tilt-shift miniature (no high vantage, no blur band, no time-lapse stutter), not a 3D-modelled character film (the people are never shaded round), not a flat 2D cartoon (the set is never drawn flat).

## 2. Materials & rendering

- **The set** (three.js, `demo/set.js`): rounded boxes, cylinders and lathes with canvas-painted textures at full scale. Each material is a painted surface with wear: **painted metal** (saturated paint, slight roughness variation, chipped edges, rivets, a darker grime toward the ground), **wood** (grain, plank joints, warm brown ramps), **gravel and dirt** (noise-built albedo with pebbles and a bump map), **concrete, brick, cloth**. Slightly simplified forms with soft bevels (a "stylised realism" game look), never toy plastic. Geometry is big and clean; the texture carries the detail.
- **Light**: one warm **hard sun** (late-afternoon gold, low enough for long shadows) with a 4096 shadow map fitted per shot, a cool hemisphere fill so shadows stay blue-violet, a sky-gradient environment map for metal. Practicals (a lamp, a window) only when the story is indoors. Cheat the sun per shot (tilt-shift's rule): front-light the faces of things you see.
- **Post** (`$LIB/core/three/post.js`): supersampled render (1.5–2×), **no screen-space AO** (it would print the set's occlusion onto the cards; grounding comes from shadow maps, contact blobs and painted grime), **physical depth of field** focused on the speaking character (no tilt band), a little bloom on hot highlights, warm grade, soft vignette, filmic tone mapping. Backgrounds 6 m+ away go clearly soft; foreground props can blur past the lens.
- **The cast** (`demo/toon.js`, `demo/cast.js`, borrowed from scifi-toon): drawn as vectors on a 2D canvas each frame and mapped onto an upright card in the set (hd-2d's lit billboard). The outline is redrawn at a **constant ~7 px screen width** whatever the shot size: the card's canvas resolution follows its projected height, and the line width is set in screen pixels. Flat fills; one hard-edged shadow shape inside each form on the side away from the sun. No line boil (the reference is clean vector).
- **Faces**: a large round white head (slightly wider than tall), big round eyes with dark pupils and a white glint, thick expressive brows, a small mouth that changes shape (smile, O, grimace, teeth). Hair, caps, moustaches and buns are flat shapes on the head. Arms and legs are single thick lines (~2.3× the outline) with round hands and simple shoe blobs.
- **Light on the cast** (borrowed from hd-2d): the card is a lit material, mostly self-lit (so the white head stays white) with a share of the scene light, so a character walking into shade dims and warms with the set. A hidden **shadow card turned toward the sun** at the character's feet casts the full silhouette onto the ground and the set: every character has a real shadow, with a soft contact darkening under the shoes.
- **Effects** live in the set: dust puffs as soft billboards, sparks as glow sprites, steam as soft cards, all lit by the same sun.

## 3. Colour logic

- **Warm sunlit set, saturated but believable**: the set takes 2–3 strong painted colours (a red locomotive, a blue door, a yellow crate) against natural neutrals (wood browns, gravel greys, dusty earth, concrete). Shadows stay blue-violet, never grey-black.
- **The cast pops off the set**: heads are always near-white `#fbf7ef`, outline and limbs a near-black warm ink `#1c1418`; clothes are one flat saturated colour per character, chosen so it differs in hue from the set behind them (an orange shirt against a teal wall).
- Each location keeps one light key: golden afternoon outdoors, warm amber interiors, cool blue night with one warm practical.
- Captions are the only pure white with black on screen.
- Examples: a dusty rail yard (red paint, gold trim, gravel, timber sleepers); a fishing pier (weathered blue boards, rust, rope, sea glare); a school kitchen (mint tiles, steel, steam, one yellow tray).

## 4. Type & subtitles

- **Word-by-word captions**: a heavy rounded sans (Baloo 2 ExtraBold, OFL, covers Vietnamese, Latin and more; swap for a CJK heavy sans for Chinese) at ~92 px on 1080 wide, white with a ~13 px black outline and a short hard drop shadow, centred horizontally, at ~62–66 % of the frame height (lower-middle, above the Shorts UI). Default caption language: **English** (the user's channel); any other language uses a font that covers it. Show **one to three words at a time**, each group popping in on the spoken word (scale 1.18 → 1.0 over ~0.12 s), sentence case. The current word may flash yellow `#ffd84a` when it is the punchline.
- Keep faces out of the caption band; frame characters' heads in the upper half.
- **Safe zones**: nothing important in the top 8 % (channel name) or the bottom 18 % and right 12 % (Shorts buttons and description).
- Titles are captions too (a "Why do…" question in the same lettering), or written in the world: a stencil on a crate, a sign, chalk on a board.
- Hold each group until the next word; at the end of a line hold ≥ 0.5 s. Without a voice (a music-only cut) groups advance at ≤ 3 words/s.

## 5. Motion quality

- **Characters pose-to-pose, the world and camera smooth**: the cast steps at 12 fps (poses, blinks, walk cycles, mouths, positions), the camera, set mechanics, dust and light on every frame (24 fps film; 30 fps also fine for Shorts).
- **Acting over moving**: held poses with eyes and brows doing the work; anticipation before every action; squash and stretch on landings and pushes; a bounce on the head when the character reacts.
- **Walk**: stick legs swing in arcs, the body bobs twice per cycle, arms swing opposite.
- **Mouths** follow the voice (open with loudness) when there is one; otherwise hold an expression per beat.
- **Comic timing**: a beat of stillness before the punchline; a fast push-in or snap reaction on it.
- Set objects obey physics loosely but with weight: a heavy wheel rolls with a slow start, dust kicks on impact, a small camera shake for something big.

## 6. Camera grammar

A vocabulary, not a route. Opening and ending come from the topic. The camera stands at the characters' eye level (≈ head height of a 1.7 m card, pitch within ±8°), lenses 30–50 mm-equivalent (vertical FOV 32–48° in portrait).

| Move | What it expresses | Can serve |
|---|---|---|
| Medium shot, character beside the big object | "here's the thing, here's the guy" | the question; a set-up; a demonstration |
| Low hero angle (camera at knee height) on the object | scale, absurd size | a giant machine; a wall; a train |
| Hard cut to a reaction close-up (head fills ~40 % of width) | the joke lives on the face | after every absurd image |
| Insert close-up of a 3D prop, background melted | the detail that explains | a bolt, a sign, a flag, a label |
| Slow push-in on a still character | thinking, doubt | "but why…?"; a realisation |
| Snap zoom (fast push, 0.15 s) | surprise | the reveal; the punchline word |
| Lateral track with a walking character, foreground props passing blurred | going somewhere | a commute; a process |
| Over-the-shoulder two-shot (near card soft, far card sharp) | a conversation | a boss and a worker; customer and clerk |
| Wide at eye level, character small at one side | consequence, aftermath | the punchline result; a mess |

Transitions: hard cuts on the beat; a whip-pan blur between two places; no dissolves. Rack focus between two characters at different depths is the style's "look over there".

## 7. Sound palette

- **Light comedy score**: pizzicato strings, ukulele or nylon guitar, marimba or xylophone, a bassoon or tuba bass line, clarinet for the melody; a bouncy 100–120 BPM groove that stops dead for the punchline.
- **Cartoon foley, cut on the action**: boing, pop, whoosh, slide whistle, wood block, cartoon footsteps, a ratchet for turning, a bonk; plus a few **real set sounds** for weight (metal clang, gravel crunch, a train horn, a door).
- **Silence before the punchline**: the music drops out for half a beat to a beat, then a sting (a bassoon "bwomp", a rimshot, a cymbal splash).
- **Voice**: a quick, friendly narrator, close-mic'd and dry; each character gets their own voice (English offline: Kokoro, e.g. `am_michael` narrator, `am_puck` for a jumpy lead, `bf_emma` for a deadpan one). Mouths open with the voice's loudness on the 12 fps drawing time. Split a line where the joke needs a pause: TTS ignores an ellipsis. Music ducked ~8 dB under the voice. Captions are built from the voice's word timestamps (`core/tts/asr_check.py` writes `words.json`). Master −14 LUFS.

## 8. Native moves

A menu: use the ones your story needs.

- **The real shadow.** A flat cartoon steps into the sun and throws a full, believable shadow across the gravel or a wall. *Fits content like:* a worker arriving at dawn; a hero entrance; someone hiding behind a pole.
- **The absurd-scale reveal.** Medium shot of the character, then a low eye-level angle shows the huge object they're dealing with. *Fits content like:* changing a tyre on a train; carrying a giant key; a tiny clerk and a mountain of paper.
- **Question → demonstration → reaction.** The caption asks, the character tries it on the real 3D prop, the face reacts in close-up. *Fits content like:* "why do they put…"; "what if you…"; "how does a…".
- **The insert that explains.** A tight, shallow-focus close-up of the one 3D detail (a bolt, a flag, a valve) while the caption names it. *Fits content like:* a safety feature; a hidden trick; a tiny label.
- **The crowd of cards.** Several cartoons packed in one 3D space (a carriage, a queue, a classroom), depth of field separating rows. *Fits content like:* commuters; an audience; a family dinner.
- **Snap zoom on the punchline word.** The camera pushes in hard as the caption word flashes yellow, the music stops. *Fits content like:* the answer; the price; the twist.

## 9. Pitfalls of the medium

- A card seen from the side vanishes → keep each card within ~35° of facing the camera; turn it (flip, not rotate) between shots; never orbit a character.
- A card self-shadows from its own shadow card → the visible card doesn't receive shadow maps; dim it by sampling whether its feet are in shade (the set's shade test) instead.
- Lambert light on a card that faces away from the sun makes the white head grey → the card is mostly self-lit (`emissive` share ~0.7); grade the scene, not the cast.
- Outlines thin out in a close-up → line width in screen pixels from the card's projected height every frame, never baked into a texture.
- Tone mapping greys the white heads → check head white ≥ 235 in the final frame; lift card emissive or lower exposure of the set.
- The set reads as toy plastic → no uniform glossy colours: every surface needs wear, grime toward the ground, roughness variation, and real scale (doors 2 m, rails 1.435 m).
- Shallow focus hides the joke → the focus is always on the face that reacts or the prop that explains; rack, don't guess.
- Captions over a face → frame heads in the upper half; captions sit at 62–66 % height.
- Vertical frames crop wide sets → stack depth (foreground prop, character, background) instead of spreading sideways.
- Feet float on the ground → contact shadow blob under the shoes, card base exactly on the floor height.
- Screen-space AO ghosts the background onto the cards (fence pickets printed on a face) → AO off, or a post that masks the cards.
- The shadow card's silhouette is clipped by `map` + `alphaTest` on the caster's own material (three.js copies them into the shadow pass; a `customDepthMaterial` map is ignored).
- In a vertical frame a side sun throws the cartoon's shadow out of frame → sun from the front-left or front-right so the shadow falls back across the set the camera sees.
- A thin prop (a post) can't hide a card, which is fine as a joke; a big prop that hides the face kills the acting → keep the face visible beside it.

## 10. Engine

In `demo/` (see [DEMO.md](DEMO.md)):

- `toon.js`: 2D vector engine (matrix stack; points go to canvas pixels before stroking, so line widths are in pixels; flat fill + clipped hard shadow shape). From scifi-toon's `toon.js` without the boil.
- `cast.js`: parametric characters (`drawChar(T, spec, pose, o)`): head, eyes, brows, mouths (`smile`, `o`, `grin`, `teeth`, `flat`, `frown`), stick limbs, clothes, `HAIR` / `BACK` / `HAT` pieces; pose fields `lh rh lf rf bendL bendR legBend lean tilt bob sq look turn brows mouth open blink hatLift`.
- `card.js`: `new Card(scene, spec)`: the character as an upright card in the set. Its canvas is redrawn per frame at ~1.4× its projected height (line widths given in screen px: 7 outline, 15 limbs), self-lit with a sun/shade tint, a hidden sun-facing card casts the silhouette shadow, a contact blob grounds it.
- `set.js`: canvas-painted PBR surfaces (`paintedMetal`, `wood` with optional worn paint, `gravel` in two stone layers, `dirtRoad`, `grass`, `foliage`, `raggedEdge` alpha), `rbox` / `cyl` / `box` kit, `makeLight` (sky dome, sun with per-shot shadow fit, hemisphere fill, env map).
- `caps.js`: word-by-word captions (`drawCaps`).
- `place.js`: the demo's country road (mailbox with a hinged door and a pivoting flag, fence, barn, poles, trees). `main.js`: page contract, shots as `{t0, t1, cam(u), set(u, tc)}`, the sunlit test for card tint, sound events. `music/score.py` (sampled comedy band), `mix.py` (foley + bed).

Post: `$LIB/core/three/post.js`. Techniques behind it: `$LIB/styles/tilt-shift/demo/` (sun per shot, shadow fitting, grade), `$LIB/styles/scifi-toon/demo/toon.js` (vector cartoon drawing), `$LIB/styles/hd-2d/demo/px.js` (lit billboards with cut-out shadows). A minimal new use: build a set from `set.js` surfaces and `rbox`, `new Card(scene, spec)` per character, one shot with an eye-level camera and the sun from the front side.

## 11. Variation space

You decide the question, the cast, the sets, the joke structure, the opening, the ending, the camera path, the pacing and the palette within the colour logic:

- Structures: **question → three wrong guesses → the real answer**; **the job** (one worker shows a strange job step by step); **what-if escalation** (each answer makes the next scene bigger, until the last wide shot is absurd).
- Openings: **the caption question over a close-up of the weird object**; **mid-action** (the character already struggling); **the boss walks in** with the order.
- Endings: **the snap-zoom answer** and cut to black; **the callback** (the first shot again, changed); **the aftermath wide** (the character small, the mess huge, one sound).

# CA ĐÊM (00:00) — treatment

Style: **16-bit Pixel RPG** (`styles/pixel-rpg`), set **vertical 9:16**:
- a 180×320 indexed framebuffer, scaled ×6 to 1080×1920;
- 24 fps; sprites step at 8–12 fps;
- **75 s**;
- Vietnamese on screen.

The script is the user's own. Every beat, line and timing below is theirs; I only direct the shots, sound and rhythm inside it.

**Departures from STYLE.md, at the user's request**
- **CRT layer.** The user asks for an old CRT noise layer, which STYLE.md excludes ("no scanlines, no grain"). It is kept light: a 2-px scanline darkening, a few noise pixels per frame and a slight vignette, all drawn inside the framebuffer at its native pixels. Rule: it never blurs.
- **Horror palette.** A cold blue-violet night palette throughout. Protected colours: **the raincoat yellow** (the one warm thing, never darkened) and **the white of the eyes**.

**Voice:** none. The characters speak in typed dialog boxes with text blips (pitch per speaker), the RPG way. Kokoro has no Vietnamese voice.

## Three structures
- **A. The user's script as written (chosen).** Shift starts → rule paper → he dismisses it → the yellow raincoat enters → freezer flicker → he hides under the counter → the text from the afternoon colleague → the eyes behind him. It is a complete horror arc. The twist turns the rules inside out: the rule that saved him is the trap.
- **B. Told as a menu/inventory.** The rule paper as an ITEM, the choices as menu commands (LOOK / HIDE). Rejected: menus slow the dread, and the user's beats are cinematic, not interactive.
- **C. A save-file loop.** Shift replayed from a save point after a death. Rejected: it changes the user's ending.

## Logline and arc
A tired night clerk follows a creepy rule sheet to survive a customer in a yellow raincoat, but the rules were written by the thing hiding under the counter.
- **Setup:** 00:00, an empty store, rain, the rule paper.
- **Turn:** the yellow raincoat enters. Lights flicker; it is suddenly right behind him; he dives under the counter.
- **Ending:** the text message reveals the rules were a trap. Two white eyes open behind him. Glitch to black.

## Benchmark (learn / don't take)
- **Indie top-down horror RPGs** (as a genre): learn the slow camera, the sparse UI, the bubbles ([?] [!]), the music cutting out as a scare, and that silence is louder than a jump sting. Don't take any game's characters, maps, UI frames, fonts or sounds.
- **"Night shift rules" creepypasta** (a genre, public): learn the numbered rule list and its inversion. Don't take any specific text.

## Shot list (all locked-off game cameras with integer-pixel moves)

| # | Time | Framing | Camera | Why |
|---|---|---|---|---|
| 1 | 0:00–0:08 | Top-down, the whole store | Static, then a 1 px/0.25 s creep down to the counter | The overworld view: where everything is (door, shelves, last shelf, freezer, counter) before anything happens |
| 2 | 0:08–0:22 | Close-up: the item screen with the crumpled paper | Static; the paper slides up 0.3 s | Game "read item" grammar; the rules must be readable |
| 3 | 0:22–0:30 | Top-down, closer on the counter | Static | His dismissal: the [?] bubble, wiping |
| 4 | 0:30–0:42 | Top-down, wide: door → last shelf | Static; the raincoat walks the length of the store | Wet footprints draw the path; [!] in red |
| 5 | 0:42–0:55 | Medium, a side view behind the counter, the freezers behind him | Static; the screen shakes on flicker 2 | The flicker reveals: gone → right behind him |
| 6 | 0:55–1:05 | Close-up: under the counter, black | Static | Only his eyes; the yellow boots arrive at the gap and stop; 3 s of silence |
| 7 | 1:05–1:15 | Close-up: his face lit by the phone, the phone screen in a box | Static, then a glitch cut and black | Two texts. Behind him, two white eyes open. Then TV static for 2 s and black |

## Beat sheet (24 fps)

**0:00–0:08 — the shift starts**
- 0.0: top-down store, the rain streaks on the glass. NAM yawns (2-frame breath). Tick-tock.
- 5.0: the wall clock hand moves to 00:00.
- 5.5: BEEP, and the box "00:00 – Bắt đầu ca trực."

**0:08–0:22 — the rule paper**
- 8.0: NAM looks down; the paper under the register glints.
- 9.0: the screen darkens by palette steps; the crumpled paper rises to the centre with a rustle.
- 10.0–21.0: the rules type in, line by line, with tick blips:
  - 10.0: "QUY TẮC CA ĐÊM:"
  - 11.4: "1. Không bán đồ ăn nóng sau 12h."
  - 14.6: "2. Khách mặc áo mưa vàng đứng ở kệ cuối: ĐỪNG NHÌN."
  - 17.8: "3. Đèn tủ đông nháy 3 lần: CHUI XUỐNG GẦM QUẦY NGAY."
- Hold until 21.6.

**0:22–0:30 — he shrugs it off**
- 22.0: back at the counter. The [?] bubble pops above NAM.
- 23.0: he pockets the paper and shakes his head.
- 24.0: he starts wiping. Box (NAM): "Lại trò đùa nhảm nhí của thằng ca chiều..." from 24.2 to 29.6.

**0:30–0:42 — the stranger**
- 30.0: a detuned door chime. The door opens; the yellow raincoat steps in.
- 30–36: wet pixel footprints trail behind it down the aisle to the last shelf.
- 36.0: it stops, back turned, motionless (2-frame breath).
- 33.0: the red [!] over NAM, a harsh CHING, and the music cuts dead.

**0:42–0:55 — the freezer flickers**
- 42.0: medium side view. NAM wipes with his head down; a sweat drop falls.
- 45.0: flicker 1 (3 frames dark, 3 lit, buzz-pop). The last shelf in the background is empty.
- 49.0: flicker 2. The raincoat stands right behind NAM, filling half the frame. The heartbeat speeds up; the screen edge pulses red.
- 53.5: NAM's eyes widen.

**0:55–1:05 — under the counter**
- 54.6: just before flicker 3 he dives (a 4-frame drop). Cut to black under the counter: only his two eyes, wide open.
- 56.0–59.5: wet boot steps, splat… splat. Yellow boots appear in the gap of light at the right edge and stop at 59.5.
- 59.5–62.5: **three seconds of total silence** (true digital zero).
- 62.5–65: his eyes blink once and hold.

**1:05–1:15 — the text and the twist**
- 65.0: the phone buzzes; blue light washes over his face. TING.
- 65.5: box (phone, from "Thằng ca chiều"): "Ê quên dặn, tờ giấy dưới máy là của thằng biến thái hôm qua viết..."
- 69.0: TING. Message 2 at once: "ĐỪNG CHUI XUỐNG GẦM QUẦY. NÓ TRỐN Ở DƯỚI ĐÓ."
- 70.5: behind his head in the dark, two white eyes slowly open (over 1.2 s).
- 72.6: glitch cut, then TV static for 2 s.
- 74.6–75.0: black.

## Cue map
- **Music:** 80 bpm (beat 0.75 s, bar 3 s), D minor.
- **0–30 s, a lonely store tune:**
  - a soft 12.5 % pulse lead, slow and detuned;
  - a triangle bass on roots;
  - a noise "rain" bed;
  - echo taps at 270/375 ms.
- **30–33 s:** the tune goes on until the [!] at 33.0, where it **cuts dead** (no echo tail).
- **33–42 s:** a low drone (a 4-bit triangle at D1) and the rain.
- **42–55 s:**
  - the drone, with a heartbeat that starts at 66 bpm and climbs to 140 by 54.6;
  - neon buzz-pops on the flickers.
- **55–65 s:** the wet steps, then silence from 59.5 to 62.5, then a single breath at 63.
- **65–75 s:**
  - a phone ping;
  - a sub swell under message 2;
  - a reverse-swell into the eyes;
  - 2 s of TV static at full width;
  - then zero.
- **Cut grid:** cuts land on beats where the script allows (8.25, 21.75, 30.0, 42.0, 54.75, 72.75). Flickers sit on the beat grid: 45.0, 49.5 and (cut off) 54.75.

## Sound design

| Section | Ambience bed | Main foley | Music |
|---|---|---|---|
| Opening | rain on glass (filtered noise), freezer hum | clock tick-tock, a BEEP, a yawn breath | lonely tune |
| Rule paper | the rain muffled | paper rustle, a typing tick per character | the tune, quieter |
| Shrugging it off | rain, hum | ? pop, rag squeaks, text blips (low pitch for NAM) | tune |
| The stranger | rain louder when the door opens | detuned door chime, wet steps, the CHING | cut at the [!], then drone |
| The flicker | hum with dropouts | neon buzz and pop ×2, sweat drip, heartbeat | drone |
| Under the counter | room tone low-passed | his breath, wet steps, then **absolute silence** | none |
| The twist | none | phone buzz, TING ×2, a breath, the eyes "open" (a low swell), TV static 2 s | sub swell → zero |

## Type and UI
- **Dialog box:**
  - black with a white 1-px border and an inner grey line;
  - at the bottom of the frame, above a 6-px margin;
  - text types at ~30 chars/s with a blip per character;
  - ▼ blinks when the text is complete.
- **Font:** an original variable-width pixel font, cap height 7 px. Vietnamese diacritics are composed from base glyphs plus marks drawn above (stacked: â + ́ = ấ) or below (dot below), and đ/Đ get a bar; the line height leaves room for two marks.
- **Bubbles [?] and [!]:** 11×11 pixel bubbles that pop in over 3 frames. The [!] is red.
- **Phone:** a 60×100 pixel phone with a status bar and chat bubbles.
- **Rule paper:** a crumpled cream sheet with fold shading, rules in a dark ink pixel font, and the key words underlined in red.

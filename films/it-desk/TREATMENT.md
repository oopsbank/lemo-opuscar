# You Are the IT Help Desk — Pixel Life, Job #8

2.5D pixel art (styles/hd-2d), vertical 1080×1920, 60 fps, **34.5 s** (manager: ≤ 35 s), English. The recurring hero (his face, his
lime colour: here a lime polo, a lanyard and a headset) on the help desk of an open-plan office on a grey winter morning. His one
rule, "turn it off and on again", fixes everything, until the CEO's internet is "broken" and he turns off and on the one thing he
mustn't: the building's main switch. The whole office reboots in a chain reaction. Game over. The CEO's cable was unplugged all along.

**Rules applied:**
- The retention playbook: frame 0 is a tight two-shot (the hero's face lit blue by the monitors, the CEO leaning in), already moving;
  opening type **(d) a game-over card cold open** (#5 (a), #6 (c), #7 (b)): GAME OVER / CONTINUE? 9 is the headline at y 300–700.
  At 1.0 s the hero mashes CONTINUE: the level restarts at 9:00 AM (a game "continue", not the VHS rewind of #7).
- The content playbook: the stake in words by 1 s ("You rebooted the whole building?" + GAME OVER); no gap > 2.5 s without a line and
  on-screen text; a new beat every 3–5 s; the twist at 18.5 s (54%); causes shown (the power button, the combo, the dead router, the
  DO NOT TOUCH main switch pulled down and up); the question only in the pinned comment; payoff image (the dangling cable, CONNECTED)
  + "Oh. It was unplugged." + a second laugh (QUEST COMPLETE pops at the same moment as YOU'RE FIRED; then his reflex click starts the
  blackout again = the loop); the last line names the next job (flight attendant).
- Skeleton **"chain reaction"**: one rule (off and on) → it scales up gag by gag → one cause (the main switch) → a building-wide
  cascade in real time → he tries to stop it and makes it worse → the fall. New after #5 "three, each bigger", #6 "the prop comes alive",
  #7 "disaster first, then how we got here".
- The density rule: no empty cells; tools/emptycheck.py on the final cut every 2 s.

## Benchmarks (learn / don't take)
- **The office sitcom IT joke** ("Have you tried turning it off and on again?") is a common phrase, not one show's: we use the phrase,
  no characters, sets or plots from any show.
- **Rube Goldberg / domino cascades**: learn the readable order (one device at a time, on the beat, each one bigger). Don't take any
  specific machine.
- **Game "CONTINUE?" screens**: the countdown card as a cold open and the "level restart" as the time jump.

## Three structures
- **A. Checklist race:** 50 tickets before 5 pm, each one a quick gag. Rejected: a list of gags without one cause (Job #5's shape).
- **B. Chain reaction (chosen):** the rule escalates, one switch triggers a cascade we watch in real time, the attempt to stop it doubles
  it, and the true cause is the smallest possible thing (an unplugged cable). The loop is causal: his reflex click causes frame 0.
- **C. Pick a side:** "off-on" or "call the vendor", both play out. Rejected: two endings halve the gags at ≤ 35 s.

## Beat sheet (B = 0.5 s, 120 bpm)
| t (s) | Beat | Picture | Sound / line |
|---|---|---|---|
| 0.0 | **Cold open (d)** | Close two-shot in the dark office lit blue by UPDATING screens; GAME OVER card, CONTINUE? 9 | boot-fail buzz; CEO: "You rebooted the whole building?" |
| 1.0 | Continue | He mashes the key: YES; the card flips to LEVEL 1 · 9:00 AM | coin, whoosh |
| 1.5 | Wide | The open-plan office, morning: desks, screens, plants, printer, vending, coffee, elevator, glass CEO office, server-room door | Narrator: "You are the IT help desk." |
| 2.6 | Quest | QUEST: 50 TICKETS BY 5; HUD TICKETS 0/50 | chime |
| 3.0 | Gag 1 | A worker's black screen | Worker: "My screen's dead!" You: "Tried turning it off and on?" |
| 6.0 | | Click off, click on: it boots. FIXED! +1 | click, boot chime |
| 7.5 | Gag 2 | The combo: printer, coffee machine, copier, vending, plant lamp, each off-on on the beat, COMBO ×2…×6, TICKETS → 49; last, the sleeping intern's desk lamp: he wakes | You: "Off. On. Fixed! Next!" |
| 12.0 | Gag 3 | The phone rings: CEO. The glass office | CEO: "My internet is broken." |
| 14.0 | | Off-on his PC: NOPE. The router: NOPE | CEO: "Fix it, or you're fired." |
| 16.5 | Cause | The server room: the big red MAIN switch, DO NOT TOUCH. He pulls it down (17.5), and up (18.0) | You: "Off… and on." clunk, clunk |
| 18.5 | **Twist** | The building reboots: blackout, then the lights row by row, every screen UPDATING 1 OF 487; the printer blizzard, vending cans, elevator doors chomping, a robot vacuum | You: "Everything's rebooting!" |
| 22.0 | Worse | He flips the switch again: UPDATING 1 OF 974 | CEO: "Is my internet fixed?" |
| 24.0 | Fall | All bars hit 100% → RESTART REQUIRED → dark | power-down |
| 25.0 | GAME OVER | YOU'RE FIRED card (2 s) | sting |
| 27.0 | Payoff | The CEO's desk: the cable hangs unplugged; he plugs it in: CONNECTED | CEO: "Oh. It was unplugged." |
| 30.4 | Second laugh | QUEST COMPLETE 50/50 pops next to FIRED | CEO: "You're fired. Tomorrow: flight attendant." |
| 33.4 | Loop | Reflex: he clicks the CEO's PC off and on… the office goes dark → the frame-0 two-shot | click → frame 0 |

Pinned question: "IT people: what's the dumbest fix that actually worked?" Cover: the hero pulling the MAIN switch with the office
rebooting behind, caption OFF… / AND ON.

## Look and density
Open-plan office in a tower: grey-blue carpet tiles, rows of desks with dual monitors, cables, mugs, sticky notes, plants, a printer
and copier, a vending machine, a coffee machine, a water cooler, an elevator, whiteboards, a glass-walled CEO office with a city
window (snowy skyline), the server room with blinking racks and the MAIN switch. Light: cool fluorescent panels, warm desk lamps,
blue monitor glow; at night/blackout, red EXIT signs and screens. Particles: paper sheets, dust, sparks, monitor flicker, snow outside.

## Voices (Kokoro)
CEO bm_george · Narrator bm_lewis (1.05) · You am_puck · Worker af_heart.

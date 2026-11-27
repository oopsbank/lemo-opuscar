# You Are a Barista — Pixel Life, Job #7

2.5D pixel art (styles/hd-2d), vertical 1080×1920, 60 fps, **41.7 s**, English. The recurring hero (his face, his lime colour, here
a lime apron) behind the counter of a busy little café on a snowy December morning, next to a huge brass espresso machine. A name
he can't spell, the morning rush, then The Customer orders "No foam. Extra foam.", he turns the steam to MAX to obey, and the
machine floods the café with milk foam. Fired. But the "flood latte" sells out.

**Rules applied:**
- The retention playbook: the frame-0 rules, opening type **(b) disaster-first** (the eruption on frame 0, then a rewind), different
  from Job #5's slam open and Job #6's panic close.
- The content playbook: the stake in words by 1 s (FOAM OVERLOAD + "Is my latte ready?"); no gap over 2.5 s without a line and
  on-screen text; a new beat every 3–5 s; the twist at 54%; causes shown (the contradictory ticket, the steam knob turned to MAX,
  the gauge in the red); the question only in the pinned comment; the payoff image + a line of ≤ 12 words + a second laugh; the next
  job (IT help desk) named in the last line before the loop.
- The density rule: no empty cells; check with tools/emptycheck.py on stills every 2 s.

## Benchmarks (learn / don't take)
- **Flash-forward cold opens** in sitcoms ("Thirty minutes earlier…"): show the disaster, rewind, and let the audience wait for the
  catch-up. Learn: the catch-up line repeated word for word. Don't take: any plot or character.
- **Epic NPC Man**: game logic for a day job (ORDERS counter, PRESSURE gauge, modifier pop-ups). Don't take: characters.
- **The Sorcerer's Apprentice** idea (public-domain poem): obeying an instruction too literally until the room floods. Learn: the
  rising level as a clock. Don't take: brooms, wizards, music.

## Three structures
- **A. The rush as a rhythm game.** Orders arrive on the beat; three customers, each harder. Rejected: the same "three customers,
  each bigger" skeleton as Job #5.
- **B. "Disaster first, then how we got here."** Frame 0 is the eruption; a VHS rewind; the morning builds the cause step by step
  (the name, the rush, the impossible order); at 54% we catch up with frame 0, and the twist is that it doesn't stop: the foam floods
  the café. **Chosen:** a new opening type and a new skeleton (#6 was "the prop comes alive"), and the repeated line makes a
  catch-up laugh.
- **C. A countdown to 9 am (100 orders).** Kept only as the HUD quest; as a skeleton it repeats Pizza Guy's clock.

## Beat sheet (B = 0.5 s, 120 bpm)
| t (s) | Beat | Picture | Sound / line |
|---|---|---|---|
| 0.0 | **Eruption** (frame 0) | Close: the hero hangs on to the steam wand while a foam geyser hits the ceiling; the Customer in the foreground. Headline FOAM OVERLOAD | hiss; Customer: "Is my latte ready?" |
| 1.2 | Rewind | Freeze, VHS rewind (the geyser sucks back in), "◀◀ EARLIER" | rewind squeal |
| 1.5 | Wide | The café at opening time: counter, machine, cup towers, pastry case with the Cat asleep, menu board, the queue, laptops, snowy street outside | Narrator: "You are a barista." |
| 2.5 | Quest | JOB #7 · QUEST: 100 ORDERS BY 9; HUD ORDERS 0/100 and the PRESSURE gauge | chime |
| 4.0 | Gag 1 | A regular: "Name's Siobhan." He writes on the cup; insert: the cup reads like hieroglyphs (bird, eye, squiggle) | marker squeak |
| 6.6 | | He reads his own cup | You: "Latte for… Bird? Eye? Squiggle?" |
| 9.0 | Gag 2 | The rush: cups slide down the counter, tickets pile up, ORDERS climbs to 47, PRESSURE to yellow | You: "Next! Next! Next!", a regular: "Large mocha, please!", You: "Oat, soy, almond, whole!" |
| 14.5 | Customer | The Customer; the ticket printer spits an endless ticket that unrolls over the counter and floor; +OAT +HALF-CAF +EXTRA HOT … pop up | "Oat latte. Half-caf. Extra hot." … "No foam. Extra foam." |
| 20.0 | Cause | Insert: he cranks the steam knob to MAX; the gauge needle swings into the red, past a DO NOT EXCEED sticker | You: "No foam… extra foam… Sure!" |
| 22.5 | **Twist** | The machine shakes: ERROR; ALERT: PRESSURE MAX; catch-up with frame 0 from a new angle | Customer: "Is my latte ready?" (again) |
| 24.0 | Flood | The geyser doesn't stop: foam rises through the café; tables float, laptops held high, the Cat surfs on a tray | You: "One oat latte! Extra foam!" |
| 28.5 | Payoff 1 | She sips: a foam moustache | Customer: "Too foamy." |
| 29.0 | Burst | The door gives: a foam wave out into the snowy street; the Manager outside, foam on his head | splash; "Why is my café a bubble bath?" |
| 33.0 | GAME OVER | YOU'RE FIRED (2.9 s) | sting |
| 36.1 | Punchline | A queue round the block, everyone with a foam moustache; the menu board now says THE FLOOD — SOLD OUT | Manager: "Two hundred floods sold. Tomorrow, you fix the computers." |
| 41.0 | Loop | Close again: the Customer at the counter, the geyser starting | Customer: "Same again!" → frame 0 |

Pinned question: "Baristas: what's the most impossible order you've ever had?" Cover: the hero hanging on the wand in the foam
flood, caption FOAM: / OVERLOAD.

## Look and density
A small café: dark wood counter with a brass rail, the big brass-and-cream espresso machine with gauges and steam wands, a grinder,
towers of cups, a till and a ticket printer, a glass pastry case, a chalk menu board, shelves of mugs, coffee bags and syrup bottles,
pendant lamps, string lights, plants, a bookcase, tables with people on laptops, a sofa, a coat rack, a big window and door onto a
snowy street with passers-by and a lamp post. Light: warm pendants, a cool window, the machine's glowing gauges; steam everywhere.
Particles: steam, foam blobs, bubbles, coffee beans, snow outside.

## Voices (Kokoro)
The Customer bf_isabella · Narrator bm_lewis (1.05) · You am_puck · The Regular af_heart · A regular am_michael · The Manager bm_george.

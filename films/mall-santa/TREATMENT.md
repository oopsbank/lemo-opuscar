# You Are a Mall Santa — Pixel Life, Job #6

2.5D pixel art (styles/hd-2d), vertical 1080×1920, 60 fps, **40 s**, English. The recurring hero (his face, his lime scarf and
mittens) is the mall's Santa in a sleigh on a fake-snow grotto, with an animatronic reindeer harnessed in front. A beard check, a
crying chain reaction, a sack that saves the day, then The Customer wants a photo on Santa's lap, kicks the reindeer's plug, and the
reindeer comes alive and drags the sleigh through the mall into the giant tree. Fired. But the kids loved it.

**Rules applied:** the retention playbook (frame-0 rules, opening type **(c) the hero's face in panic, close**, different from
Job #5's slam open), the content playbook (no gap over 2.5 s without a line and on-screen text, a beat every 3–5 s, the twist at
54%, causes shown, the game-over card held only as long as reading needs, the question in the pinned comment, the next job named
in the last line before the loop) and the density rule (no empty cells; checked with tools/emptycheck.py on stills every 2 s).

## Benchmarks (learn / don't take)
- **Jingle-all-the-way-style mall chaos comedies**: a holiday set piece that escalates through a public space. Learn: the chase
  through recognisable mall furniture. Don't take: any character or plot.
- **Epic NPC Man**: game logic for a day job (COMBO counters, JOY meter, photo counter). Don't take: characters.
- **Tati's *Playtime***: many small actions at once in deep space: shoppers on two floors, an escalator, a balloon seller.

## Three structures
- **A. Three kids on the lap, one locked frame.** Rejected: the same skeleton as Job #5 (three customers, each bigger).
- **B. "The prop comes alive."** A quiet background object (the animatronic reindeer, its frayed plug planted at frame 0) turns
  into the climax: a real-time chase. **Chosen:** a twist at 54% instead of an escalating queue, a different skeleton from #5,
  and the plug is a "spot it" detail paid off.
- **C. A countdown to closing time (50 photos by 6 pm).** Kept only as the HUD quest; as a skeleton it repeats Pizza Guy's clock.

## Beat sheet (B = 0.5 s, 120 bpm)
| t (s) | Beat | Picture | Sound / line |
|---|---|---|---|
| 0.0 | **Yank** (frame 0) | Close: a kid pulls Santa's beard; it stretches like elastic; Santa's eyes pop. Headline BEARD CHECK. A spark at the reindeer's plug behind | boing; Kid: "Is your beard real?" |
| 0.4 | Snap | The beard snaps back into his face: squash, shake | thwack |
| 1.3 | Wide | The grotto: sleigh, reindeer, tree, queue of kids, two floors of shops | Narrator: "You are a mall Santa." |
| 2.5 | Quest | JOB #6 · QUEST: 50 HAPPY PHOTOS; HUD: PHOTOS 0/50, JOY meter | chime |
| 4.0 | Gag 1 | A toddler on his lap; the Cat (elf hat) on the camera: 3-2-1 big on screen; FLASH; the toddler bawls; a polaroid pops: CRYING | You: "Say cheese!" |
| 9.0 | Gag 2 | The crying spreads down the queue like dominoes, tears flying; CRY COMBO ×12; JOY drains | wails pile up |
| 12.5 | Save | He opens the sack: presents arc into every kid's arms; JOY MAX | You: "Who wants a present?" |
| 17.0 | Customer | The Customer cuts the queue and sits on his lap; the sleigh creaks | Customer: "One photo. For my followers." |
| 20.0 | Cause | Insert: her heel kicks the frayed plug in; sparks | zap |
| 21.5 | **Twist** | The reindeer's eyes light up; it rears; ALERT: REINDEER ONLINE | servo whine |
| 22.5 | Chase | It bolts, dragging the sleigh (Santa + Customer) through the mall: presents, a balloon cart, shoppers diving; kids' phones flash; PHOTOS climbs to 50/50 | gallop, bells |
| 28.5 | Crash | Into the giant tree; it topples; baubles bounce | crash |
| 29.4 | Manager | The Manager among the wreck | "Who plugged in the reindeer?" |
| 32.6 | GAME OVER | YOU'RE FIRED (2.8 s) | sting |
| 35.4 | Punchline | Kids hold up 50 photos, all laughing; the Manager deadpan | "Fifty five-star reviews. You're on coffee tomorrow." |
| 39.0 | Loop | Close again: the next kid grabs the beard | Kid: "Santa!" → frame 0 |

Pinned question: "Mall Santas: what's the wildest thing a kid has asked for?" Cover: the reindeer bolting with the sleigh,
caption REINDEER: ONLINE.

## Look and density
A two-floor mall atrium in December: shop fronts with lit windows and signs on both floors, a balcony rail with shoppers, an
escalator, hanging snowflakes and string lights, a giant tree, a grotto with fake snow, candy-cane fence, gingerbread facade,
presents, lanterns; a fountain, benches, plants, a balloon cart, floor mats, dropped mittens and wrappers. Light: warm shop windows,
cool skylight, fairy lights; the reindeer's red eyes; the tree lights. Particles: snow confetti, tears, sparks, bauble bounces.

## Voices (Kokoro)
Kid af_sky (fast) · Narrator bm_lewis (1.05) · You am_puck · The Customer bf_isabella · The Manager bm_george.

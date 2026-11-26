# Ideas: research notes for three Shorts channels

Research done 26 Nov 2026 for **Pocket City** (tilt-shift miniature town, `styles/tilt-shift`),
**Pixel Life** (2.5D pixel dioramas, `styles/hd-2d`) and **Some Crazy Thingzz** (2D cartoon
characters in 3D sets, "Why do …?" questions). All three: English, vertical 1080×1920, made in code,
synthetic TTS, no image/video generators.

Backlogs: [`pocket-city.md`](pocket-city.md) · [`pixel-life.md`](pixel-life.md) ·
[`some-crazy-thingzz.md`](some-crazy-thingzz.md).

**How sure is this?** Most published "Shorts strategy" writing is vendor blogs with thin evidence.
Below, *fact* means reported by press or YouTube itself; *practice* means repeated across many
creator guides but unproven; *my read* is inference. The real test is each channel's own 2-second
and 3-second retention in YouTube Studio.

## 1. What the platform rewards now

| Finding | Strength | Source |
|---|---|---|
| Since 31 Mar 2025 a Short's public view counts every start **and every replay**; revenue and YPP still use "engaged views". A clean loop therefore inflates views directly. | fact | [TechCrunch](https://techcrunch.com/2025/03/26/youtube-is-changing-how-youtube-shorts-views-are-counted), [Digital Music News](https://www.digitalmusicnews.com/2025/03/27/how-does-youtube-shorts-count-views-2025/), [Search Engine Journal](https://www.searchenginejournal.com/youtube-changes-shorts-view-counts-no-change-to-monetization/543005/) |
| YouTube tracks how many viewers swipe away in the **first ~2 seconds**; this is the first filter. Advice ranges from "hook in the first second" (vidIQ) to "first 2–3 s". | practice | [Blitzcut](https://blitzcutai.com/blog/best-youtube-shorts-hooks-2026), [GoFaceless](https://www.gofaceless.ai/en/blog/mastering-first-impressions-two-second-rule), [Prepublish](https://prepublish.ai/guides/youtube-shorts-retention) |
| Completion/retention outweighs likes and comments (comments act as a multiplier). | practice | [vidIQ algorithm guide](https://vidiq.com/blog/post/youtube-shorts-algorithm/), [DEV/clamper](https://dev.to/clamper_ai/how-the-youtube-shorts-algorithm-works-in-2026-and-how-to-beat-it-4b2h) |
| Length: the newest large scan (Virlo, Oct 2026, 10,827 Shorts) found **under 15 s** and **90 s–3 min** slightly over-perform, **30–90 s slightly under-perform** (0.95–0.96×). Older 2023 studies favoured 50–60 s. Median Short ≈ 25 s; top channels' median 40 s. Average view duration ≈ 16 s (Metricool 2026). | mixed data | [Virlo](https://virlo.ai/data/how-long-should-a-youtube-short-be), [Mark Studios](https://www.markstudios.com/research/youtube-shorts-length-study), [CreateSocial](https://createsocial.ai/blog/youtube-shorts-length), [Riverside](https://riverside.com/blog/how-long-can-youtube-shorts-be) |
| Shorts can run 3 min; YouTube announced **Shorts Series** (23 Sep 2026), so numbered recurring formats get first-class support. | fact (reported) | [Async](https://async.com/blog/youtube-trends) |
| Animation memes and short explainers that answer **one specific searchable question** keep earning views; 66 % of young animation fans watch animation memes weekly. | practice / survey | [Async](https://async.com/blog/youtube-trends), [Cartoon Brew on YouTube's animation report](https://www.cartoonbrew.com/distribution/youtube-animation-report-259897.html), [Anijam](https://www.anijam.ai/blog/youtube-shorts-trends/) |

## 2. Hooks (first 2 seconds)

- **Show the result or the danger first, explain after**: the outcome frame, a visible problem, a bold
  claim, a question. Never "In this video…", never a slow zoom on a still with no sound or text.
  ([BannerBoo](https://bannerboo.com/blog/youtube-shorts-length/), [Conthunt](https://conthunt.app/blog/youtube-shorts-best-practices), [Virvid](https://virvid.ai/blog/first-3-seconds-hook-faceless-shorts-2026))
- **Burned-in captions** from frame 1 (many watch muted). ([Socialync](https://www.socialync.io/blog/youtube-shorts-algorithm-2026))
- **A visual or audio change every 2–3 s.** ([Prepublish](https://prepublish.ai/guides/youtube-shorts-retention))
- *My read for our three formats:* the hook is **spoken line + on-screen text + one moving thing in
  frame 1**, all at once. Pocket City: a timer or a threat already visible. Pixel Life: "You are a …"
  plus the first thing already going wrong. Crazy Thingzz: the object, huge, with the question as text,
  and the wrong answer starting within 2 s.

## 3. Rewatch and comments

- **Seamless loop**: last frame matches the first (angle, light, subject position); avoid music with
  a final cadence that announces the reset; a final line that leads back into the first.
  ([Virvid](https://virvid.ai/blog/looping-structure-shorts-retention-2026), [FreeViralKit](https://freeviralkit.com/blog/youtube-shorts-loop-strategy))
  Pixel Life already does this (last line echoes the first); Pocket City can loop on the same aerial;
  Crazy Thingzz can end on the question being asked again by the next fool.
- **Satisfying cause-and-effect**: chain reactions work as one long open loop resolved at the end;
  each event causes the next, a "simple sequential story". Popular hypotheses, not proven science.
  ([CU Independent](https://www.cuindependent.com/why-internet-cant-stop-watching-things-fall-strange-psychology-satisfying-cascade-videos/), [Vice](https://thump.vice.com/en/article/jpd35g/a-gravity-defying-rube-goldberg-machine), [Live Science](https://www.livescience.com/62091-oddlysatisfying-videos-satisfying.html), [Discover](https://www.discovermagazine.com/mind/why-are-oddly-satisfying-videos-sosatisfying))
  → Pocket City's whole engine.
- **Hidden details reward rewatching**: *my read* — a gag in the blur band, a background sprite
  doing something, a sign joke. People rewatch to catch it and comment "did anyone see…".
- **Comments come from curiosity or disagreement, not from asking.** A specific question tied to the
  content (spoken + on screen) helps; blunt "comment for the algorithm" may be demoted. Median ≈
  0.5 comments per 1,000 views. ([Fluxnote](https://fluxnote.io/guides/youtube-comment-section-strategy-2026), [SaturaAI](https://saturaai.com/blog/how-to-get-more-comments-youtube-shorts), [Overseeros](https://www.overseeros.com/blog/good-comment-to-view-ratio-youtube-shorts), [DEV/ytzolo](https://dev.to/ytzoloai/youtube-shorts-algorithm-hacks-what-actually-works-in-2026-439b))
  Good comment-bait that isn't bait: "what job should he try next?", "which one would you have
  picked?", a fact viewers want to correct or top.

## 4. Titles and hashtags

- Title: short, says what happens, opens a curiosity gap, contains the searchable noun.
  ([vidIQ](https://vidiq.com/blog/post/youtube-shorts-titles/))
- Hashtags are weak signals: 1–3 relevant ones, most relevant first; #Shorts optional.
  ([Influencer Marketing Hub](https://influencermarketinghub.com/most-popular-hashtags-youtube/), [Fliki](https://fliki.ai/blog/youtube-shorts-hashtags), [Hollyland](https://www.hollyland.com/blog/topics/youtube-shorts-tags))
- Patterns that fit us:
  - Pocket City: `<Number> <Unit>. <Stakes>.` ("90 Seconds. One Drawbridge.") or a dare
    ("Can One Tow Truck Save Rush Hour?"). Tags: `#miniature #tiltshift #satisfying`.
  - Pixel Life: `You Are a <Job>. <Twist>.` — searchable job noun up front. Tags: `#pixelart #pov #animation`.
  - Crazy Thingzz: `Why Do <Objects> Have <Thing>?` — exactly the searched question. Tags: `#whydo #funfacts #animation`.

## 5. Niche notes

- **"Why" facts.** One surprising fact per video, hook with the oddest detail, scale with an everyday
  comparison; works as a series with one object each time.
  ([Fluxnote facts](https://fluxnote.io/guides/facts-youtube-shorts-ideas), [Fluxnote science](https://fluxnote.io/guides/science-youtube-shorts-ideas), [filmmusic.io](https://filmmusic.io/en/magazine/video-concepts/5))
  "Talking object" explainers are a rising format ([Opus](https://www.opus.pro/blog/ai-talking-object-videos)) — our cartoon characters
  misunderstanding an object is a hand-made cousin. Pick questions people actually type: the
  answer must be **true, simple, checkable** (wrong facts get corrected in comments, which helps
  reach but hurts trust — get them right).
- **Miniature / tilt-shift.** "Is it real or a toy?" is the evergreen reaction; game-world tilt-shift
  remixes and tiny inhabitants "going about their lives" are popular. Miniatures already have a big
  YouTube audience (dioramas, miniature transport).
  ([YouTube blog: miniatures](https://blog.youtube/culture-and-trends/miniatures-on-youtube/), [Shorts example](https://www.youtube.com/shorts/g5factBjbPw), [Shorts example](https://www.youtube.com/shorts/BxCncO1w8v0))
  Kids/family audiences like town-scale "how a community works" stories and calmer pacing.
  ([Current: PBS Kids City Island](https://current.org/?p=5608103), [Whizzy Studios](https://www.whizzystudios.com/post/kids-animation-trends-2026-whats-growing-on-youtube))
- **Pixel art / POV job comedy.** I found no single dominant "POV: you are a …" pixel channel —
  the slot looks open. Job-skit humour is a proven TikTok/Shorts genre; pixel art carries
  service-job satire well (*Beantown: Trial by Fire*); "POV: You …" is listed as a trending framing;
  cozy pixel scenes exist but are calm, not comic.
  ([Cartoon Brew: Beantown](https://cartoonbrew.com/cartoon-brew-pick/beantown-trial-by-fire-is-a-twisted-comic-take-on-the-minimum-wage-service-industry-243103.html), [Tiny Little Cartoons](https://www.cartoonbrew.com/shorts/tiny-little-cartoons-wrestling-shorts-tyler-march-eric-paperth-260080.html), [HuffPost job TikToks](https://huffingtonpost.co.uk/entry/25-of-the-funniest-tiktoks-about-work_uk_624c66e3e4b0587dee6f3189), [InReels](https://www.inreels.ai/blog/how-to-make-animated-videos), [Cozy pixel Short](https://www.youtube.com/shorts/__ouIbNYlBE))

## 6. Recommendations

1. **Lengths.** Crazy Thingzz: aim 20–30 s (sits in the strong short end). Pocket City: 35–45 s is
   fine if the clock/threat holds every second; test one 25 s cut. Pixel Life: 55–61 s is in the
   weakest band by Virlo's data — keep it only while retention holds, and try one ~40 s episode.
2. **Loops on every film**: last shot = first shot's framing; music without a final cadence.
3. **Series labels** (Shorts Series): "Pocket City #4", "You Are a … (Pixel Life)", "Why Do …? #3".
4. **One hidden gag per film** for rewatches; **one honest question** at the end for comments.
5. Keep topics apart: Pocket City = vehicles, machines and town systems racing a clock; Pixel Life =
   one person's job going wrong; Crazy Thingzz = one object's design question.

## Ranking method in the backlogs

Score = **Viral** (1–5: clear stakes, broad relatability, loop/rewatch potential, searchable title)
× **Feasible** (1–5: buildable in the style's code with procedural sets, no realistic humans, no
brands, places or real people). Ties go to the stronger hook. Excluded per brief: pizza/delivery,
aliens/UFOs, and any repeat of the films already made.

# Raising "Viewed vs swiped away" (Stayed to watch) on code-animated Shorts

Research date: 2026-11-27. About 45 web searches and page fetches. Each claim is tagged:

- **[fact]**: YouTube's own wording, or a verifiable platform mechanic.
- **[data]**: measured on a sample, with a stated method, even if it is small or comes from a vendor.
- **[practice]**: practitioner consensus with no published test behind it.
- **[unverified]**: a number repeated without a traceable source, or my own observation of a format.

Context: three faceless, code-animated English Shorts channels all sit at about 40% viewed, on every video:
- a tilt-shift miniature town with a TTS narrator in the second person;
- 2.5D pixel-art job comedies;
- 2D characters in 3D sets explaining "Why do X have Y?".

When every video on three different channels lands at the same number, the cause is almost certainly something the three openings share (pipeline, template, voice, framing), not the topics.

---

## 1. What the metric measures, benchmarks, and how it relates to distribution

### Definition (YouTube wording)
- **[fact]** In the current YouTube Help glossary, the metric is **"Stayed to watch: The percentage of times viewers stayed to watch past the initial seconds of a Short."** The glossary also defines **Engaged views** as "How many times viewers stayed to watch past the initial seconds, not including any loops." Source: https://support.google.com/youtubecreatorstudio/answer/12220281 and https://support.google.com/youtube/answer/9314355
- **[fact]** The older Content-tab tips page still uses the launch wording: "How many chose to view: Highlights the percentage of times that viewers viewed your Shorts versus swiped away." Source: https://support.google.com/youtube/answer/12942217
- **[fact]** The metric launched as "Viewed (vs. swiped away)", next to "Shown in feed" ("the number of times your Short is shown in the Shorts feed"). Sources: https://www.socialmediatoday.com/news/youtube-adds-more-shorts-performance-insights-updated-chat-moderation-role/643311 and https://prepublish.ai/blog/viewed-vs-swiped-away-youtube-shorts
- **[fact]** The denominator is feed impressions: the Short started playing in the Shorts feed. The numerator is the impressions where the viewer was still there after "the initial seconds".
- **[fact]** YouTube does not publish how long "the initial seconds" are. In 2023, Todd Sherman (Shorts product lead) said the view threshold is "meaningful", and that it is not published because YouTube changes it from time to time and doesn't want people gaming it. Source: https://techcrunch.com/2023/08/25/youtube-demystifies-the-shorts-algorithm-views-and-answers-other-creator-questions/
- **[practice]** Most practitioners treat the decision window as roughly 1 to 3 seconds.
- **[fact]** Since 31 March 2025, a public Shorts "view" counts every time a Short starts or replays, with no minimum watch time. Engaged views keep the old threshold, and monetisation uses engaged views. Sources: https://ppc.land/youtube-changes-how-shorts-views-are-counted-from-march-31/ and https://support.google.com/youtube/answer/9314355
- **[unverified]** Secondary blogs say the play-start counting was extended to all formats from 24 August 2026. The 9314355 page now says "Views are counted the moment a video starts to play across all formats, including Shorts."
- So a Short with a 40% stay rate can show plenty of "views" while 60% of its impressions are swipes.

### How it relates to distribution
- **[fact]** In Rene Ritchie's "Top Five" (YouTube blog, 4 March 2024):
  - "the vast majority of Shorts are watched in the Shorts feed, where there are no thumbnails", so "you have view vs swiped away";
  - "those initial hundreds or thousands of views are more like what long-form gets with those initial thumbnail impressions";
  - a Short that does worse than the competing Shorts in the feed likely won't get far beyond those first views (it may still take off on a later day).

  Source: https://blog.youtube/creator-and-artist-stories/renes-top-five-march-4-2024/
- **[fact]** Todd Sherman, Creator Insider Q&A, August 2023:
  - the system tries to "find a set of people that may enjoy your video", and depending on how that goes it may get more traffic or taper off (the seed audience);
  - "Most thumbnails are never seen because people are in the feed";
  - "the audience is the algorithm";
  - on the definition of a view: "What we try and do with a view is have it encode for your intent of watching that thing".

  Sources: https://www.youtube.com/watch?v=n3jsYK_-aRU, https://outlierkit.com/resources/youtube-shorts-algorithm/ and https://techcrunch.com/2023/08/25/youtube-demystifies-the-shorts-algorithm-views-and-answers-other-creator-questions/
- **[fact/practice]** The stay rate is the Shorts equivalent of thumbnail CTR: it gates whether the seed test expands. Retention, average view duration (AVD), likes and satisfaction surveys then decide how far the Short goes.
- **[unverified]** YouTube's Help page lists satisfaction surveys among the recommendation inputs (per secondary sources).

### Benchmarks: is 40% bad?
- **[fact]** YouTube publishes no benchmark. The tips page says to compare against "your Shorts' typical performance", to "avoid comparing each video against a viral hit", and that "it's key to still compare videos of the same type". Source: https://support.google.com/youtube/answer/12942217
- **[data]** This is the only sizeable dataset found. Paddy Galloway and Chris Gileta studied 5,400 Shorts from 33 channels (3.3 billion views), April 2023:
  - "Shorts with under 60% VVSA rarely performed well. The best performing shorts were typically between 70 and 90%";
  - below 60% "you're probably in trouble";
  - a high VVSA alone doesn't guarantee success;
  - "Treat your intro like a thumbnail."

  The data predates 3-minute Shorts and the 2025 change to view counting. Sources: https://threadreaderapp.com/thread/1646898356419981315.html and https://x.com/PaddyG96/status/1646898373365051392
- **[practice]** Creator-tool blogs converge on these bands:

  | Viewed | Verdict |
  |---|---|
  | under 50% | a problem |
  | 50–60% | needs work |
  | 60–70% | healthy |
  | 70–80% | strong |
  | 80%+ | breakout territory |

  Sources: https://retensis.com/blog/youtube-shorts-viewed-vs-swiped-away, https://1of10.com/blog/youtube-shorts-analytics/ and https://falconvid.ai/blog/youtube-shorts-viewed-vs-swiped-away
- **[unverified]** vidIQ is often quoted for ">80% within the first 1–3 s". I could not find that number on vidIQ's own page.
- **No breakdown by niche or channel size was found** in any source. The sources say to benchmark against your own median over the last 10–20 Shorts.
- **[practice]** Some guides say a very new channel's seed audience is broader and less targeted, so a lower stay rate is normal for its first uploads. This is not documented by YouTube.
- **Verdict:** 40% is well below the roughly 60% floor in the one real dataset. Being flat at 40% across three different formats points to a shared opening defect, not to topic choice.

---

## 2. Frame 0 and the first second: what stops the swipe

### General evidence about early skipping
- **[data]** Skips cluster at the very start:
  - On Kuaishou (KuaiRand) and another micro-video app, "most skips occurred within the first five seconds", although video lengths were spread evenly. Source: https://arxiv.org/html/2504.03107
  - A TikTok user study (Dashlet) found that users are most likely to swipe soon after playback starts, or near the end. Source: https://arxiv.org/pdf/2204.12954
- **[data, dated]** Meta, citing Fors Marsh Group: people recall feed content at a statistically significant rate after only 0.25 s, and average dwell per feed item is about 1.7 s on mobile (2016). Source: https://www.marketingdive.com/news/facebook-why-mobile-video-ads-must-work-fast/446217/
- The first frame is read in a fraction of a second.

### Google's ABCD research: the strongest controlled-ish evidence for openings
**[data]** Google classified more than 5,000 TrueView ads by Brand Lift (ad recall, consideration, purchase intent), reviewed by Nielsen Neuro and Kantar. The data is correlational and comes from ads, not organic Shorts. Its guidance on openings:
- "Framing, pacing, people, and audio are particularly important in an ad's opening moments."
- "Have tightly-framed shots of people or product at the beginning."
- "Have more than two frames in the first five seconds" (i.e. 2+ shots).
- "If your video features people, open with them on-screen. Having them speak to the audience directly can also have a positive effect."
- "Use surprising, unexpected, or delightful images and visuals to break through the clutter early on."
- "People help hook viewers in an ad's opening moments."
- "Brand personifications or mascots ... have been shown to drive Awareness and Consideration." This is relevant: cartoon characters count.
- "Audio mentions ... are more impactful when they come from people on-screen compared to plain voice overs." This argues for a character who speaks, over a disembodied narrator.

Source: https://services.google.com/fh/files/misc/youtube_google_abcd_reference_guide_en.pdf (I extracted the text).

Google's Shorts-ad guidance (April 2024) adds that Shorts ads should "feel like they're part of a viewer's Shorts feed ... authentic and relatable, like creator-produced content", be "upbeat ... fun and entertaining", and work in a sound-on setting. Sources: https://blog.google/products/ads-commerce/youtube-shorts-ads-select-lineups-abcds/ and https://business.google.com/us/ad-solutions/youtube-ads/shorts-ads/

### Motion versus a static frame 0
- **[practice]** Strong consensus: open on motion that is already under way, never on a fade-in, logo, title card, establishing hold or slow drift. Practitioners specifically single out "generic cinematic drift" as weak, and favour a sudden action, a snap zoom or an entrance.
- **[unverified]** One blog claims motion in frame 1 beats a static opening by about 23%. Source: https://pixelplot.ai/video-hook-psychology/
- **[fact, perception science]** Motion onset captures attention (orienting response). This is a general finding, not one tested on feeds.
- **No peer-reviewed feed study** comparing a motion start with a static start was found.

### Faces and eyes, and whether cartoon faces work
- **[data]** Faces are dominant attention-grabbers:
  - In eye-tracking on cartoon videos, saccades towards faces are faster, and faces stay the dominant attention-grabbing feature despite scene cuts. Source: https://academicworks.cuny.edu/cc_etds_theses/1066/
  - Animated faces draw significantly *more* fixations on the eyes than real faces. Source: https://www.mdpi.com/2073-8994/17/4/528
  - Mascots with large eyes got the longest fixation duration and the highest preference (reported in the same literature).
- **[data, ads]** Per ABCD, people or mascots on screen at the opening correlate with recall and consideration.
- **Conclusion:** cartoon faces work, provided the face is *big enough to read* on a phone and the eyes are visible. A capsule person a few pixels tall carries no face signal at all.

### Close-up versus wide, and the subject's scale on screen
- **[data, ads]** ABCD: "tightly-framed shots of people or product at the beginning".
- **[practice]** Close framing survives a 6-inch screen; a static wide shot gives viewers "nothing to latch onto"; start on a punch-in. Source: https://slushybros.com/how-to-hook-viewers-in-the-first-second-of-a-youtube-short/
- **[fact, film grammar]** Wide shots establish place; close shots carry emotion. An establishing wide is the slowest possible opening in a vertical feed.
- **Implication for the tilt-shift channel:** a high aerial view of tiny capsule people is the textbook bad frame 0. The subject is a few percent of the frame, it has no face, and the image reads as "pretty wallpaper" with no question attached. Keep the miniature look, but open close on one protagonist (or one object in the middle of an event), then pull out to the aerial to reveal the town.

### Contrast, saturation, brightness and clutter
- **[data, correlational, mostly ads and marketing]**
  - Colourfulness is positively associated with engagement (β=0.298), and the effect is stronger with animated characters (virtual-influencer study). Source: https://scholarspace.manoa.hawaii.edu/server/api/core/bitstreams/632d08b2-6651-4c43-b3e6-f8ba8f140e7d/content
  - Brightness, contrast and saturation significantly affect likes, comments and shares in short sales videos. Source: https://www.sciencedirect.com/science/article/abs/pii/S0969698924004326
  - A *U-shaped* colour effect has been reported, so more is not always better. Source: https://www.sciencedirect.com/science/article/abs/pii/S0148296325001018
  - Colourfulness and visual prominence correlate with engagement in TikTok ads (JBR 2025). Source: https://www.sciencedirect.com/science/article/abs/pii/S0148296325004850
- **[practice]** One clear subject. A busy diorama with many small moving things has no focal point. Tilt-shift blur helps here, because it creates a focal band, but only if the subject is big.
- No controlled study of dark versus bright first frames in a swipe feed was found.

### On-screen text hooks, captions and safe zones
- **[data]** In 92,654 Shorts (YTShorts-92K), the share of frames with text correlated *slightly negatively* with views (r = −0.08). Text is not a magic lever, and walls of text may hurt. Source: https://arxiv.org/html/2611.13002v1
- **[unverified]** Vendor claims of +15–50% retention from captions or hook text are untraceable. Sources: https://opus.pro/blog/ideal-youtube-shorts-length-format-retention and https://pixelplot.ai/video-hook-psychology/
- **[practice]** Short hook text (about 2–5 words), high contrast, held at least 1–2 s, readable without sound. Burned-in captions synced to the voice.
- **[data]** Spoken hooks in 1,178 million-view Shorts had a median of 11 words (quartiles 9/11/13). The most common first words were "this" (11.6%), "what" (10.8%) and "I" (6.5%). Only about a third used "you". 2025+ Shorts used questions more often (31% pooled). It is a winners-only sample, so it shows no causation. Source: https://www.overseeros.com/blog/youtube-shorts-hooks-study
- **[practice / unverified pixel values]** Safe zone on 1080×1920:
  - Google's vertical-ad diagram, read off the image: top 288 px, bottom 672 px, left 48 px, right 192 px.
  - Organic-feed estimates are less strict: about 160–310 px top, 320–420 px bottom, and about 150–190 px on the right for the action rail.
  - Keep text and faces roughly within x 60–880 and y 300–1350. The bottom-left title/channel block and the right-hand button rail are the highest-risk areas.

  Sources: https://www.markstudios.com/tools/youtube-shorts-safe-zone and https://clipzi.app/en/blog/shorts-tiktok-reels-safe-zones

### First spoken words, and voice versus a music intro
- **[practice]** Strong consensus:
  - no intro, greeting, logo sting or music bed before the hook;
  - the first word lands at about 0.0–0.3 s;
  - start in the middle of the action ("anti-hook": "the man went to the store"; Zack D. Films is the usual example).

  Sources: https://saturaai.com/blog/anti-hooks-youtube-shorts-opener-strategy and https://retensis.com/blog/youtube-shorts-viewed-vs-swiped-away
- **[data, small]** In a 500-video hook coding study (1M+ views, 2026):
  - setups that took more than 4 s to establish the topic performed poorly;
  - question-plus-claim beat a pure question;
  - trending audio without a verbal or visual hook had lower completion.

  Source: https://fluxnote.io/blog/short-form-hook-library-500-viral-videos
- **[unverified]** The claim that an immediate hook in the first 2 s retains 19% more (Zebracat 2025) is untraceable.

### Audio hooks
- **[fact, dated]** YouTube says its audience watches with the sound on: 96% (YouTube Upfronts 2016, self-reported). Source: https://www.thedrum.com/news/2016/10/21/youtube-joins-snapchat-criticising-facebook-our-audience-continues-watch-not-scroll
- **[fact]** The Shorts player plays audio by default. Google frames Shorts as a "sound-on setting".
- **[unverified]** The "60–80% watch sound-off" figures come from Facebook-era data and are probably wrong for the Shorts feed.
- **[practice]** A transient (whoosh, pop, impact, character vocalisation) exactly on frame 0, so the first 100 ms is not silent or ambient. Music under the voice, not instead of it.
- **[practice]** Trending sounds are disputed and treated as neutral on Shorts. They do not replace a hook.

### Pattern interrupt, curiosity gaps and "show the end first"
- **[data, ads]** ABCD: "surprising, unexpected, or delightful images ... early".
- **[practice]**
  - Open a curiosity gap but show a concrete visual in the same second. "Question plus claim" beats a bare question.
  - Showing the result or climax first ("visual proof", then how it happened) is widely recommended but untested.
  - For "Why do X have Y?", show Y vividly and strangely in frame 0, and pose the question over it. Don't open on a character asking in a neutral set.
- **[practice]** Write the ending first, so that the last line feeds back into the first frame (see loops, section 5).

### Clutter in the first second: things to remove
- **[practice]** Remove the black or fade-in first frame, logos or channel names, title cards, "Hey guys", slow camera pushes and establishing holds. Remove anything that makes the Short look like the last five Shorts the viewer swiped. Retensis suggests looking different from adjacent feed items.

---

## 3. Viewer perception of AI and faceless content, 2025–26

- **[data]** Kapwing gave a fresh account its first 500 Shorts: 21% were judged "AI slop" and 33% "brainrot" (November 2025). Viewers are being trained to pattern-match and swipe slop fast. Sources: https://the-decoder.com/one-in-five-youtube-shorts-shown-to-new-users-is-ai-generated-slop-study-finds/ and https://www.searchenginejournal.com/youtubes-ai-slop-problem-and-how-marketers-can-compete/567297/
- **[fact]** Neal Mohan's 2026 letter (January 2026): "To reduce the spread of low-quality AI content, we're actively building on our established systems that have been very successful in combatting spam and clickbait". AI is still allowed. Sources: https://www.eweek.com/news/youtube-ai-slop-crackdown-creators/ and https://au.variety.com/2026/digital/news/youtube-channels-using-ai-tools-reduce-slop-neal-mohan-letter-32190/
- **[fact]** On 15 July 2025, the YPP "repetitious content" policy was renamed "inauthentic content". It targets mass-produced, templated output, AI or not. Rene Ritchie called it a minor update. This matters for templated faceless channels: vary the structure. Source: https://www.socialmediatoday.com/news/youtube-clarifies-monetization-update-inauthentic-repeated-content/752892/
- **[data]** Animoto, State of Video 2026 (about 460 respondents): about 83% say they have watched a video they suspected was AI. The top tells were "robotic gestures, unnatural voices, flat emotional tone". 36% say AI brand videos lower their opinion of the brand. Source: https://animoto.com/state-of-video
- **[data]** Luminate: disinterest in AI-made content grew from May to November 2025, especially among young viewers. Source: https://kidscreen.com/2026/05/04/report-young-viewers-are-rapidly-losing-interest-in-ai-made-content/
- **[data]** AI labels:
  - TikTok posts with an AI disclosure got about 7–8% less engagement (JCR, via a secondary summary);
  - a CBS experiment found the drop was largest for fully AI-made and emotional content;
  - PNAS Nexus found no significant effect on stated intent to share.

  Sources: https://www.cbs.dk/en/articles/ai-labels-reduce-social-media-engagement and https://academic.oup.com/pnasnexus/article/4/6/pgaf170/8151894
- **[data]** TTS versus human voice:
  - In educational lab studies, synthetic narration did not reduce learning or motivation.
  - Human emotional voices are rated more authentic and trustworthy (Fan et al. 2025, via a secondary summary).
  - Human-read stories produced more enjoyment and immersion than AI-read ones (secondary summary).
  - Listeners label good voice clones human 58% of the time, against 62% for real humans.

  Source: https://www.researchgate.net/publication/408417996
- **No study measured swipe speed on TTS versus human voices in a feed.**
- **[practice]** The consistent finding: the voice *quality signals* (flat prosody, uniform pace, the stock "TikTok/Adam" voice, mispronunciations) are what read as slop. Synthetic voices as such are not. Source: https://viralfaceless.io/blog/ai-voiceover-faceless-channel-that-doesnt-sound-like-slop-2026
- **How channels counter it [practice + ABCD data]:**
  - A *character who speaks on screen* (with lip or jaw motion) rather than a disembodied narrator. ABCD: on-screen people speaking beat plain voice-over; mascots drive recall.
  - An expressive, well-directed voice (human or high-end TTS with pitch and pace variation), or the creator's own voice.
  - A distinctive art direction, and visible craft (hand-made texture, deliberate camera, physics), so the Short doesn't read as generic AI.
  - Avoid the visual tells: generic glossy AI imagery, stock-like compositions, the same template every time.
  - **The three channels are code-animated, not gen-AI**, so the work is visibly hand-built. Lean into that look. The one shared "AI tell" is probably the TTS voice and its delivery.

---

## 4. Teardowns: what is in frame 0

Caveat: I could not play videos. The points below combine published analyses with **[unverified]** observations of each format from general knowledge. Check them yourself by opening 10 recent top Shorts per niche and screenshotting frame 0 and frame 30.

- **Zack D. Films (3D explainer, about 30M subs)**
  - **[practice/data, analysts]** The opening is always visual, a cold open: "the man went to the store", in the past tense, starting with "He" or "She", with no name, date or setup.
  - **[data, analysts]** The narrator speaks from the first frame at about 3 words/s (about 168 wpm). A new shot every 2.5–3.8 s. 35–70 s long. Big clean captions in the centre. Rounded cartoon 3D, often a close or extreme-close view of a body or mechanism. A deadpan voice.

    Sources: https://ivideonow.com/blog/why-zack-d-films-dominates-youtube-shorts-with-unsettling-3d-animation-content-en, https://saturaai.com/blog/anti-hooks-youtube-shorts-opener-strategy and https://taletok.io/academy/zack-d-films-editor/
  - **Frame 0:** a medium or close shot of one character already doing the strange thing; voice on frame 0; caption word 1 visible.
- **Animated comedy (Pencilmation, Minecraft-animation Shorts, Alan's-Universe-style sketches)**
  - **[unverified]** The gag premise is under way in frame 0: the character is large and centred and has already reacted or spoken; there is no title card. Pencilmation opens on the character mid-action on white paper, which gives very high contrast and one subject.
  - **[unverified]** Minecraft-animation Shorts usually open on a close two-shot with a spoken line or a loud SFX, and often have a short top-of-frame text premise ("POV: ...").
  - **[practice]** Alan's Universe scripts are built to "hook within the first few seconds". Source: https://creatordb.app/creatorstats/alans-universe/
- **Pixel-art animation**
  - **[unverified]** Successful pixel Shorts render the sprite huge (integer-scaled so a character fills 30–50% of the frame width), with saturated palettes and chiptune or SFX from frame 0. A wide 2.5D room with small sprites is the pixel equivalent of the tilt-shift problem.
- **Tilt-shift, miniature and satisfying (BeamNG, LEGO dam breach, Miniatur Wunderland, traffic)**
  - **[unverified]** BeamNG crash Shorts open with the vehicle already moving at speed towards the obstacle, a low chase camera, the stakes visible (ramp, wall, dam) and a short top text ("car vs 100 m drop"). The crash comes within about 3–6 s.
  - **[unverified]** LEGO dam-breach Shorts open with the water already pressing or the wall already cracking, minifigures in the foreground, and the "will it hold?" question implicit.
  - **[unverified]** Miniatur Wunderland Shorts open close on a working detail (a moving train, a tiny person, a crash, a light effect) and often pull out to the scale reveal afterwards.
  - **[practice]** Tilt-shift's appeal is the "how did they do that / that's real?" reaction. Source: https://blog.pond5.com/20031-making-a-tilt-shift-miniature-effect-video-practically-and-in-post/
  - **[practice]** Loop structure (the end flows into the start) is typical of satisfying Shorts. Sources: https://channelprofiler.com/the-infinite-replay-machine-deconstructing-the-satisfying-loop-in-youtube-shorts/ and https://virvid.ai/blog/looping-structure-shorts-retention-2026
  - **Common thread:** the event is already in progress, the stakes are legible in one glance, the subject is big, and sound comes on frame 0.

---

## 5. Length, the stay rate and loops

- **[fact/logic]** The stay rate is decided in the initial seconds, so length should barely affect it directly. Indirectly, it matters only if the viewer can see the Short's length or is put off by a slow setup (a longer script usually means a slower open).
- **[fact]** Sherman (2023): no length is best for reach; choose the length the story needs.
- **[data]** Galloway: most Shorts are 20–40 s. Longer Shorts averaged more views, and Shorts with AVD over 50 s averaged 4.1M views. Holding people matters, not length alone.
- **[data, vendor]** In 108k Shorts, 11–20 s had the highest median views. A 1,100-channel analysis found the best length "varies more by niche than any other factor" (35–58 s for most niches). Source: https://piktochart.com/blog/how-long-youtube-shorts/
- **[data]** vidIQ (Nate Black, 35B views): 13 s and 60 s did best. Source: https://vidiq.com/blog/post/youtube-shorts-algorithm/
- **[fact]** Loops: since March 2025 every replay is a public view, and loops are excluded from engaged views. The retention graph can exceed 100% at loop points.
- **[practice]** A seamless loop raises APV/AVD, not the stay rate.
- **No evidence found** that length changes viewed-vs-swiped.

---

## 6. Diagnosing in YouTube Studio

- **Where to look [fact]:**
  - Analytics → Content → Shorts, card "How viewers engaged / Stayed to watch" (formerly "Viewed vs swiped away"), next to "Shown in feed".
  - Per Short: Analytics → Engagement / Audience retention. The Reach tab shows traffic source types, including "Shorts feed" ("Traffic from the Shorts vertical viewing experience") and "Sound pages".

  Sources: https://support.google.com/youtubecreatorstudio/answer/12220281 and https://support.google.com/youtube/answer/9314355
- **[fact]** Compare against "your Shorts' typical performance" and similar videos, not against a viral hit (YouTube Help 12942217).
- **Reading the curve [practice]:** in the per-Short retention graph, look at the drop between 0 and 3 s.
  - A cliff at 0–1 s means frame 0 or the first sound failed.
  - A slide from 1–3 s means the first line or premise failed.
  - Spikes over 100% at the end mean the loop works.
  - "Key moments" is a long-form retention panel (intro, top moments, dips). For Shorts, the retention graph itself is the tool.
- **Interpreting combinations [practice]:**

  | Stay rate | AVD / APV | Meaning |
  |---|---|---|
  | Low | High | The body is good; the opening hides it. This is likely the case here. |
  | High | Low | The hook works; the middle or length fails. |
  | Low | Low | Topic mismatch or a weak premise. |

  Source: https://falconvid.ai/blog/youtube-shorts-viewed-vs-swiped-away
- **Traffic sources:** read the stay rate only on Shorts-feed traffic. Views from search, external sites or the channel page were chosen by the viewer and say nothing about the swipe.
- **How much data you need:**
  - **[fact]** Ritchie: the "initial hundreds or thousands of views" are the test.
  - **[practice]** Don't judge before about 1,000 feed impressions and about 48 h. Use the median of the last 10–20 Shorts as the baseline.
  - **[practice]** Change one variable at a time (frame 0, first line, first sound), ideally re-cutting the same body with two openings on comparable topics.
  - At 1,000 impressions, a 40% rate has a 95% confidence interval of about ±3 points, so a 10-point jump is real.

---

## 7. What YouTube itself has said (2023–2026)

- **Todd Sherman, Aug 2023:**
  - views should "encode for your intent of watching";
  - seed audience;
  - "Most thumbnails are never seen because people are in the feed";
  - "the audience is the algorithm";
  - no best length;
  - "If that didn't go how you wanted to go, learn from it and move forward and try again."
- **Rene Ritchie, Mar 2024:** the swipe test works like thumbnail impressions; the feed is competitive.
- **YouTube Help, 2025–26:**
  - the "Stayed to watch" definition;
  - views counted at play start (Shorts from 31 Mar 2025; all formats per the current page);
  - compare to your typical performance.
- **Neal Mohan, Jan 2026 letter:** "reduce the spread of low-quality AI content" using the spam and clickbait systems.
- **YPP, July 2025:** "inauthentic content", i.e. mass-produced or repetitive material.
- **Google ABCD (ads, but YouTube's own research):** tight framing, people or mascots on screen at the start, 2+ shots in the first 5 s, surprising visuals, audio from an on-screen character beats voice-over.
- I found **no 2025–26 statement from Beaupré or Ritchie** specifically about the swipe metric or Shorts hooks. I also found nothing that YouTube's own channels changed about the metric in 2025–26 beyond the label and the definition of a view. **[unverified]** One blog quotes Ritchie (2025): "Very few people blow up immediately... figure out every video what I can learn".

---

## Diagnosis for the three channels (inference)

The flat 40% across three formats suggests that the openings share some of these traits. Check each one against frame 0 of your last 10 Shorts:

1. A wide establishing shot, with the subject under about 10–15% of the frame height (tilt-shift aerial; 2.5D room; character small in a 3D set).
2. A static or slow-drift first second; a fade-in; a title card.
3. Voice starting after 0.5 s, or a music or ambience intro first.
4. A stock TTS voice with flat prosody (the biggest "AI slop" tell).
5. Hook text that is small, or missing, or placed in the UI danger zones.
6. A premise or question that is abstract ("Why do X have Y?") with no strange visual of Y in frame 0.
7. A dark or muted palette, or low contrast between subject and ground (tilt-shift desaturation; pixel-art night scenes).
8. A templated sameness across uploads, which feed-savvy viewers recognise and pre-emptively swipe.

---

## Ranked: the 15 most evidence-backed levers, and what to do in a code-animated Short

Ranked by strength of evidence × expected effect on the stay rate.

1. **Start the event at frame 0: no intro, fade, title card or establishing hold.**
   - Evidence: Galloway ("treat your intro like a thumbnail"); Ritchie (the first views are the thumbnail test); skip-timing data; practitioner consensus.
   - Do: render with t=0 already mid-action. Pre-roll the simulation by 1–2 s, so frame 0 has moving objects, falling props and characters mid-gesture. Delete any fade-from-black and logo. Check frame 0 as a still: would it work as a thumbnail?
2. **Make the subject big: a tight framing on one protagonist.**
   - Evidence: ABCD ("tightly-framed shots ... at the beginning"); eye-tracking on faces.
   - Do: the subject fills at least 30–50% of the frame height in the first 1–2 s.
     - Tilt-shift: start at a close macro height on one capsule person or vehicle (keep the shallow-focus look), then pull up or out to the aerial by about 2–3 s.
     - Pixel art: integer-scale the sprite to 6–10× and centre it.
     - 2D-in-3D: camera at character eye level, in a medium close-up.
3. **A face with readable eyes in frame 0, cartoon faces included.**
   - Evidence: ABCD (people or mascots open, mascots drive recall); animated eyes draw more fixations; faces dominate attention in cartoons.
   - Do: give the town and pixel characters an expressive face (big eyes, brows, a reaction pose) and show it large at t=0. A reaction expression (shock, smugness, panic) tells the viewer how to feel.
4. **Voice or a character sound at 0.0–0.3 s, and the first line is the hook.**
   - Evidence: practitioner consensus; the 4 s setup penalty in the 500-video coding; Zack D. Films speaks on frame 0.
   - Do: trim leading silence in the TTS output to under 100 ms. No music intro; music ducked under the voice from t=0. Line 1 is at most 11 words and puts the claim, the weird event or the stakes up front.
5. **Show the strange or high-stakes visual, and pose the question over it (question + claim).**
   - Evidence: ABCD ("surprising ... visuals early"); the 500-video study (question + claim beats a pure question).
   - Do: for "Why do X have Y?", frame 0 is an extreme, slightly absurd close-up of Y on X, plus a line like "This flamingo is standing on one leg for a reason that saves its life." Pixel comedy: open on the punchline situation (the boss is already on fire). Town: open on the incident (a bus teetering, a giant cat), not the skyline.
6. **Replace or upgrade the TTS: an expressive voice tied to an on-screen character.**
   - Evidence: viewers name "unnatural voices, flat tone" as AI tells (Animoto); human emotional voices rated more trustworthy; ABCD (on-screen speaker beats voice-over); the slop-saturated feed (Kapwing, Mohan).
   - Do: use the creator's own voice or a top-tier expressive TTS with per-line pitch and pace direction. Have a character deliver line 1 with mouth movement. In the second-person town narration, give the narrator a persona, or turn it into the in-world character's line. Avoid the default "TikTok narrator" voices. Lab studies show synthetic voices aren't penalised per se, so delivery is what matters.
7. **An audio transient on frame 0.**
   - Evidence: Shorts is a sound-on feed (Google; YouTube's 96% sound-on claim); practice.
   - Do: an impact, whoosh, boing, crash or character vocalisation exactly at t=0, mixed loud and clean. Never ambient room tone first.
8. **A legible, high-contrast frame 0: one focal point, saturated subject, clean ground.**
   - Evidence: correlational colour, brightness and contrast studies (with a U-shaped caveat); ABCD ("break through the clutter").
   - Do: lift the exposure and saturation of the opening shots. Separate the subject from the background with rim light, value contrast or a darker vignette, and set the tilt-shift focus band on the subject. Remove extra moving props in the first second. Test on a phone at 50% brightness.
9. **2+ shots, or a camera change, in the first 3–5 s.**
   - Evidence: ABCD ("more than two frames in the first five seconds", tied to recall).
   - Do: cut or snap-zoom at about 1.5–2.5 s (close → reveal wide). Keep a new visual beat every 2–3 s after that, as at Zack D. Films' cadence.
10. **A short on-screen hook text inside the safe zone.**
    - Evidence: practice; the YTShorts-92K text correlation is slightly negative, so keep it minimal.
    - Do: 2–5 words, bold, at least 70–90 px cap height, high contrast. Place it in the upper-middle (y ≈ 300–700), away from the right rail (last ~190 px) and the bottom ~400–670 px. Burned-in word-by-word captions in the centre, not at the bottom. No dense text blocks.
11. **Don't look like the template or the slop.**
    - Evidence: Kapwing (21% slop); the "inauthentic content" policy; Retensis (differentiate from adjacent feed items).
    - Do: vary the opening shot type, colour key and first-line structure between uploads. Make the craft visible (hand-drawn texture, deliberate physics, a recurring named character). Avoid the generic AI-glossy look. Don't reuse one intro animation on every Short.
12. **Recurring recognisable characters, or a format "brand".**
    - Evidence: ABCD (mascots drive recall and awareness); practice (returning viewers stay).
    - Do: give each channel 1–3 named characters with a fixed silhouette and colour, and open on them, so repeat viewers recognise them in 0.25 s (feed recall works at a 0.25 s exposure).
13. **Payoff-first, or "show the end first", and make it loop.**
    - Evidence: practice only for the stay rate; the loop mechanics are fact (replays are views; retention over 100%).
    - Do: flash the climax at t=0 (0.5–1 s), then "here's how it got there". Or write the last line so it runs straight into the first frame, with a matching camera pose for a seamless loop. Loops help APV more than the stay rate.
14. **Match the premise to a clear, broad audience in a single line.**
    - Evidence: Sherman (seed audience; "the audience is the algorithm"); the low/low combination in the diagnostic table.
    - Do: make the subject of each Short instantly recognisable (a known job, a known animal, a known city problem). Avoid niche in-jokes in line 1. For job comedies, name the job visually in frame 0 (uniform, props, a top text like "Day 1 as an air-traffic controller").
15. **Measure properly and iterate one variable at a time.**
    - Evidence: YouTube Help (compare with your typical performance and similar videos); Ritchie (initial views are the test).
    - Do: judge the stay rate only on Shorts-feed traffic, after at least 1,000 feed impressions and about 48 h, against the channel's median. Read the 0–3 s cliff in the retention graph. Re-cut the same body with two different openings across comparable uploads. Because the animation is code-generated, render variant openings cheaply: frame 0 = close vs wide, voice at 0 vs 0.5 s, SFX vs none.

### Evidence quality summary
- **Strong:**
  - YouTube's definitions and mechanics;
  - the Galloway thresholds (2023, n=5,400);
  - Google ABCD (correlational, more than 5,000 ads);
  - face and eye attention research;
  - early-skip clustering.
- **Moderate:** colour and contrast correlations; AI-perception surveys; AI-label effects.
- **Weak or anecdotal:**
  - most precise percentages in creator-tool blogs (+19%, +23%, +50%, 80% thresholds);
  - trending sounds;
  - payoff-first;
  - TTS swipe effects specifically;
  - per-niche benchmarks (none exist publicly).

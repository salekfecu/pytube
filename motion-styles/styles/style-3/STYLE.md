# Style 3 — "Crimson Halo Glass"

Reference: `ref3_third.mp4`, a marketing reel aimed at teachers ("ليش اعلانك ضعيف" / "why is your ad weak"). It is 720x1280, **25 fps**, 684 frames, 27.36 s long, with Iraqi Arabic on-screen text and a few English words.
Machine-readable tokens: `style.json` (same folder). Production values target a **1080x1920 @ 30 fps** canvas.
- Reference measurements are written **720 px → 1080 px** (×1.5) and as % of frame width (W) or height (H). The percentages are the same on both canvases.
- Durations are written **f@25 / ms / f@30**, where ms = reference frames × 40 and f@30 = ms ÷ 33.3.

Evidence:
- `_work/ref3_third/scratch_style/`:
  - `cal_out.json`: Almarai ink-width fits for 23 strings;
  - `kf_sheet.jpg`: all 55 keyframes labelled with native frame numbers;
  - `build_style.py`: the generator for style.json;
  - `smoke_sheet.jpg` / `z_smoke2.png`: engine smoke test.
- `scratch_look/`, `scratch_motion/` and `scratch_verify/` from the earlier passes.

Frame indexing:
- **`keyframes_full/k_NNN` = native frame ⌊12.5·NNN + 6⌋**, i.e. t ≈ 0.5·NNN + 0.24 s. I verified this by pixel match: k001 = f18, k010 = f131, k022 = f281, k054 = f681. INDEX.md's "k_000 = 0.0 s" is 0.24 s off.
- `scratch_verify/fr/NNNN.jpg` = native frame NNNN−1.
- All frame numbers below are native frame numbers (@25).

---

## 1. Essence

A **low-key, almost monochrome crimson** talking-head reel. A presenter sits on a black office chair in a deep-red seamless studio. A soft, low-contrast **red sunburst halo** radiates from just above her head and is locked to the set. The grade is extreme:
- blacks crushed to 0;
- saturation very high (mean HSV S 190-237);
- a vignette about 2 stops deep.

Against this, all type is **one family, Almarai**: ExtraBold 800 for everything that punches (including the Latin wordmark), Light 300 for every supporting line. It is flat warm white, with no stroke, shadow or glow.

Emphasis stays in the red family:
- a pink-red light band sweeps across a hero word;
- red neon outline lettering;
- translucent red "ghost" mega-words;
- a red copperplate script;
- a red UI chip with a bell.

The only cool colour is produced by **Difference-blend** type: white over red turns cyan.

**Frosted glass** is the house material:
- an arch rising from the bottom edge;
- smoked capsules under the hero;
- two diagonal corner slabs that push the previous keyword behind frosted glass;
- a hairline outline capsule for the CTA.

Depth is staged with type: new word in front, old word behind glass, ghost word behind the hero, thin kashida word behind the presenter's head.

Every camera move is a **centred digital pull-back**, never a push-in. Hook and brand type is parented to the zooming comp, so the camera delivers it.

Hard cuts land in speech pauses and flip between tight and wide. The edit is voice-led with a loud 41 Hz sub bed and only 4-5 tiny high-frequency SFX, all on text events.

## 2. Best for / not for

**Best for**
- Service, agency, coach, educator or expert marketing reels with a *hook → problem → validation → agitation → breather → brand/solution → proof → CTA* arc.
- One seated presenter to camera, 25-40 s, a confident, premium, slightly dramatic mood ("you're good, but your marketing isn't").
- Brands whose colour is red, crimson or wine, or that can live with a monochrome red world for one reel.
- Arabic RTL with occasional English brand or UI words.
- Content where one or two "question" words deserve a visual jolt (Difference blend).

**Not for**
- Bright, airy, pastel, medical-clean or children's topics. The crushed low-key red reads as intense, nightlife or luxury.
- Brands identified with blue or green. Those hues can only appear through Difference blend.
- Hype edits that need whooshes, flashes or speed ramps (none are allowed here), and beat-driven music edits (sync is to speech).
- Standing or walking presenters, outdoor footage, multi-person interviews. The style relies on a centred, seated, symmetric frame with large headroom for the top text band and the halo.
- Talent wearing red, pink or white tops: they merge with the set and break the Difference words.
- Long-form content over about 60 s: at 8.8 text entrances and 12.4 graphic events per 10 s it becomes fatiguing.

## 3. Signature moves

1. **Crimson studio and sunburst halo.**
   - The set is a red seamless wall and floor: wall #4e0005, top band #1c0000, rays #6b0505 on #4a0004.
   - About 45 rounded rays, irregular and sometimes dashed, radiate from just above the head (inner r 159 px, outer r 515 px @1080 in the wide).
   - The halo sits behind the talent and scales with every camera move.
2. **Almarai 800 / 300, flat warm white.**
   - Hero 141 px against subtitle 52 px (2.7 : 1). One beat on screen at a time, 3-7 words.
   - No stroke, shadow or glow. The ring test around text matched the plate at 1.00-1.06.
3. **Light, not colour, for emphasis.**
   - A ~92 px soft pink-red band (core #f03039) travels **right → left** across the white hero in 1.92 s and leaves the letters white again.
   - The hook word has a static rose sheen at both ends.
4. **Frosted-glass depth sandwiches.**
   - Glass has a backdrop blur of 5-10 px @1080, darkens 10-14% and carries a 2-3 px white hairline at 14-37%.
   - The arch is 850 px wide with r 425; capsules have r = h/2; corner slabs have r 375.
   - Glass covers the body and old words, never the face. Sandwich order: ghost word under the glass, crisp text on top.
5. **Type staged in depth.**
   - Translucent red ghost echo behind the hero («Mr» behind «استاذي»).
   - Previous keyword pushed behind frosted panels («اليوم»).
   - Thin kashida word and display word **behind the head** («الطـــالب», «راح»; this needs roto).
6. **Difference-blend question words.**
   - White «شلون؟» across the torso turns cyan #acfaf6 over the red wall and inverts the talent inside its glyphs.
   - It is followed by a one-frame slam of red «يعرفك؟» (#ee1b1e), which turns green over the beige blazer.
7. **Camera delivers the type.** Four centred digital pull-backs:
   - expo 1.69 → 1.0 in 880 ms;
   - reveal 1.0 → 0.27 in 1120 ms into a smoky void;
   - slow 1.72 → 1.0 in 3.48 s with counter-scaling foreground roses;
   - brand 1.73 → 1.0 in 3.04 s.

   Hook and brand type is **world-locked**: parked off-frame and flown in by the zoom.
8. **Neon and script accents.**
   - A red neon-outline headline in the headroom (stroke #cf0108 with a 30 px glow) whose left end dissolves through a sliding alpha ramp.
   - A silver-gradient «PRIME» wordmark with a red copperplate «Studio» laid over its right half.

## 4. Typography system

### 4.1 Families
| Use | Family | fontsource id | Weights |
|---|---|---|---|
| All Arabic and the Latin wordmark/ghost | **Almarai** | `@fontsource/almarai` (installed) | **800**, **300** only |
| Red script accent | Pinyon Script (low confidence; alternatives Great Vibes, Italianno) | `@fontsource/pinyon-script` (**not installed**: `npm i @fontsource/pinyon-script`) | 400 |
| Latin UI chip | Inter (Helvetica Neue / SF Pro Medium equally plausible) | `@fontsource/inter` | 500 |

Font match evidence (look IoU, confirmed by the verifier's Playwright comparison):
- Almarai 800 scores 0.90-0.95 on every bold line: «الطالب» 0.952, «ليش اعلانك ضعيف» 0.939, «ركز على تدريسك» 0.929.
- It scores 0.968 on «PRI». The runner-up, Tajawal 800, scores 0.52-0.62.
- Identifying features: the ط loop, the wide ب tail, the slanted alef terminal, an M vertex that touches the baseline and a diagonal R leg.
- Almarai 300 matches «نحول خبرتك…» (ك and ى forms).

### 4.2 Type scale
Each size is a **re-fit** made for this guide. I rendered every reference string in Almarai at 100 px with Playwright, measured the ink box and scaled it to the measured reference ink width (`scratch_style/cal_out.json`). Where a fit disagrees with an earlier report, the fit wins (see §15).

| style.json role | Font / wt | 720 px (%W) | **1080 px** | Colour / fill | Effects | Reference example (frames) |
|---|---|---|---|---|---|---|
| `heroSheen` | Almarai 800 | 95.5 (13.3%) | **143**, line-height 1.6 | horizontal rose sheen (4.3a) | none | «استاذي» f1-38, ink 321×112 @720 |
| `hero` | Almarai 800 | 94 (13.1%) | **141** | #fdfbf9 | none | «يمكن انت» f73-133 (384 px), «الطالب» f308-361 (291 px), «اليوم» f300-361 |
| `displayPop` | Almarai 800 | 160 (22.2%) | **240**, plus 2 tatweels | #fdfbf9 | none | «بــس» f216-258 (348-359 px) |
| `display` | Almarai 800 | 147 (20.4%) | **220** | #fdfbf9 after its fade-in | none | «راح» f279-292 (188 px) |
| `differenceDisplay` | Almarai 800 | 175 (24.3%) | **263** | white, **Difference** | none | «شلون؟» f259-277, 577 px = 80% W |
| `differenceRed` | Almarai 800 | 170 (23.6%) | **255** | #ee1b1e, **Difference** | none | «يعرفك؟» f285-292 |
| `ghostMega` | Almarai 800 | 213 (29.6%) | **320** | red gradient fill 0 → 60%, rim #b00003 | 3 px stroke, glow r 18 px at 22% | «Mr» f1-38 (≈280 px) |
| `ghostMegaArch` | Almarai 800 | 275 (38.2%) | **412** | #b70f16, highlights #e2271f | glow; sits under the arch glass | «اذا» f22-38 |
| `wordmark` | Almarai 800 Latin | 172 (23.9%) | **258** | silver gradient (4.3e) | optional 1 px counter bevel | «PRIME» settled 563×124 @720 (f523) |
| `scriptAccent` | Pinyon Script 400 | ≈115 (16%) | **≈172** | #ec0206 (peak #ff0810) | none | «Studio» bbox 291×112 @720 |
| `headline` | Almarai 800 | 66.5 (9.2%) | **100** | #fdfbf9 | none | «ركز على تدريسك» f610-683 (488 px) |
| `headlineSmall` | Almarai 800 | 57 (7.9%) | **85** | #fdfbf9 | none | «ليش اعلانك ضعيف» f48-67 (486 px) |
| `pillLabel` | Almarai 800 | 40 (5.6%) | **60** | #fffbf8 | none | «احنا نركز بشغلنا» f637-683 (276 px) |
| `neonOutline` | Almarai 800 outline | 89 (12.4%) ±5% | **134**, 3 tatweels | transparent fill | stroke 4.5 px #cf0108, glow r 30 px (4.3c) | «تشـــرح بطريقه» f140-215 |
| `kashidaThin` | Almarai 300 | 108 (15%) | **162**, 8 tatweels | #ffffff | none | «الطـــالب» f262-292 (454 px) |
| `kashidaThinSmall` | Almarai 300 | 67 (9.3%) | **100**, 3 tatweels | #ffffff | none | «تدريسك قـــوي» f24-38 (386 px) |
| `subtitle` | Almarai 300 | 34.5 (4.8%) | **52** | #fff6ef | none | «من افضل المدرسين بمجالك» 35.2, «توصل المعلومه…» 34.2, «مايختار…» 33.6 |
| `subtitleLarge` | Almarai 300 | 48.5 (6.7%) | **73** | #faf3f5 | none | «مايبين هل شي» f238-258 |
| `taglineLight` | Almarai 300 | 42 (5.8%) | **63** | #ffffff | none | «نحول خبرتك الى محتوى احترافي» (495 px settled, f526) |
| `uiLatin` | Inter 500 | 35 (4.9%) | **52** | #fe030a | left alpha ramp | «your content» f227-258 |

Line height is 1.2 for single lines (1.6 for `heroSheen`, see 4.7). Letter-spacing is always 0.

### 4.3 Special treatments (at most one per shot)
a. **Rose sheen** (hook word only). Horizontal gradient taken from glyph-pixel column medians at f30:
   - `#af8687 0%, #d6c0bd 7%, #eccccc 13%, #fffbf8 25%, #fffcfa 50-75%, #faeaea 80%, #ecdada 86%, #debfc2 93%, #d8b9bd 100%`.
   - The right-hand alef also darkens to #93494d at its foot (f25). This is optional: add a second bottom-shade gradient on the right 12%.

b. **Pink light sweep (karaoke band).**
   - A soft band runs across an already visible white hero: core #f03039/#e8222c, partial-blend edge #d0897b.
   - **Not** #f48394: the verifier showed that colour is only the band's edge.
   - FWHM 55-75 px @720 → about 92 px @1080.
   - Path: right → left from x 545 to 183 @720 over f81-131, about 190 px/s @720 = 285 px/s @1080.
   - The reference steps per syllable; linear is acceptable.
   - It is not cumulative: the letters return to white.

c. **Red neon outline.**
   - Almarai 800 with a transparent fill, `-webkit-text-stroke` 4.5 px #cf0108 and a glow as a text-shadow.
   - Glow rings: 2-8 px #640001, 8-20 px #570002 over a #460101 plate.
   - The glyph shadow gives a faint inner glow.
   - The left (line-end) 26-28% fades through an alpha ramp (`mask-image: linear-gradient(90deg, 5% → 35% at 12% → 100% at 28%)`). The ramp's edge slides 147 px @1080 to the right during the reveal.
   - **The text itself never moves.** The verifier refuted "drift": the cross-correlation shift is 0-1 px.

d. **Ghost mega-word.**
   - A huge red word behind the hero: a 2-3 px rim #a30002-#d00005 and a vertical fill from the wall colour (#4f0400) at the top to #8c0000 at the bottom.
   - It sits at wall depth and never overlaps the talent. Inside the arch it is #b70f16 / #e2271f, blurred by the glass.

e. **Silver wordmark plus red script.**
   - «PRIME» uses a horizontal gradient: `#a99991 0%, #ebe2d9 10%, #fdfdfd 20-72%, #cbb5af 87%, #a5807c 100%`. It is nearly flat vertically (#f5efe8 → #faeee8).
   - «Studio» in red copperplate sits with its baseline on the wordmark baseline. It spans M-I-E (x 350-641 @720 at f500), and its capital S swash rises above the M. Hairlines are about 1 px and downstrokes 6-7 px @720.

f. **Difference words.**
   - A white layer in `mix-blend-mode: difference`. Over the wall #530509 it reads #acfaf6 cyan; over the talent it shows her inverted: ice-blue hair, white top, slate blazer.
   - It enters at about 52% opacity (#838585) and ramps to full.
   - The second word is red #ee1b1e in Difference: #a21919 over the wall, green #467058 over the taupe blazer, #e80b0c over the black top.
   - Use only on wide shots, across the torso band.

g. **UI chip.** Red Inter 500 «your content» with a 0.3 → 1 alpha ramp over the left 73% of the line, followed by a red outline bell (§7).

### 4.4 Hierarchy and card grammar
- Tiers, at 720 px:
  1. Ghost / Difference / wordmark / display: 147-275 px.
  2. Hero: 92-95 px.
  3. Neon / thin display: 67-108 px.
  4. Headline: 57-67 px.
  5. Pill label / tagline / large subtitle: 40-49 px.
  6. Subtitle: 34 px.
- Hero : subtitle = **2.7 : 1** (141 : 52 @1080).
- One beat at a time: **1 hero (1-3 words) + 1 Light line (4-5 words)**, usually 3-7 words on screen. The maximum seen is 7 («ركز على تدريسك» + «احنا نركز بشغلنا»). Never more than 2 Arabic lines plus one ghost word.
- Lines never wrap; each phrase is one line.
- Vertical rhythm at 1080: hero baseline → subtitle cap is 30-45 px, and stacked lines sit 15-38 px apart. The subtitle may sit *inside* the glass pill, with the hero overlapping the pill's top edge by about 38 px.
- Alignment:
  - Everything is RTL and centred on the talent axis (x 49-51% W).
  - In the panel shot the hero and its subtitle are **centred on x 34% W**, left of the talent.
  - The neon line is right-anchored at 91.5% W.
  - The old keyword sits behind the right panel at 72% W.

### 4.5 Arabic and English pairing
- English appears in only three roles:
  1. a **Latin echo** of the Arabic hero (ghost «Mr» behind «استاذي»);
  2. a **UI chip** («your content» plus bell) inside a glass pill under the Arabic turn word «بس»;
  3. the **brand** (Almarai Latin 800 «PRIME» plus red script «Studio» plus an Arabic Light tagline).
- Latin reads LTR (typed left → right, faded at its left end). Arabic and Latin never share a line.
- The Latin wordmark uses the same family as the Arabic (Almarai 800 Latin), so the pairing reads as one voice.

### 4.6 Tatweel / kashida and word-splitting rules
- Almarai's tatweel (U+0640) advances **0.18 em** at both 300 and 800 weight (measured). Count = round(stretch px ÷ (0.18 × font size)).
- Measured counts:

  | Word | Font @720 | Tatweels | Result |
  |---|---|---|---|
  | الطـــالب | 108 | 8 | 445 vs 454 px |
  | تدريسك قـــوي | 67 | 3 | 386 = 386 px |
  | تشـــرح | 89 | 3 | full line 587 px |
  | بــس | 160 | 2 | 346 vs 348-359 px |
- Kashida goes on **Light or outline words**. The only bold exception is the one-word turn «بس».
- Use kashida for emphasis or to make a thin word span the body width; never to justify text.
- Insert it after the first joining letter that has a joining successor.
- **Write tatweels into the cue text** when only one word of a line is stretched. The engine's `cue.tatweel` stretches every word of the line.
- Word splitting happens **across depth, not across lines**: new word in front, old word behind glass, ghost behind, thin word behind the head.

### 4.7 Renderer notes (from the smoke test)
- The engine wraps each letter in an `inline-block` box. `background-clip:text` is clipped to that box, so at line-height 1.2 the dots of a final ي were cut off. Gradient-filled letter-split roles therefore use **line-height 1.6**.
- Right-anchored or masked lines need `width: max-content`. Without it, a box positioned at left 91.5% is only 8.5% W wide and the mask cuts off the overflowing first letter.
- The engine treats each tatweel as its own letter unit. That is why `glyph-scale-pop` uses a 120 ms stagger with 2 tatweels.
- `mix-blend-mode: difference` works in the engine as long as nothing isolates `#front`.

## 5. Colour and grade

### 5.1 Palette
| Hex | Role | Where sampled |
|---|---|---|
| #4e0005 / #5a0006 | wall mid / brighter (MCU) | 21.50 s (300,40); 12.10 s (600,600) |
| #560007 | wide wall hot spot (right of the head, 35-45% H) | f604 grid |
| #200002 → #1c0000 | wide top band (top 5% of H) | f604 grid; 25.00 s top 60 px |
| #3f0004 → #2a080e | lower wall → floor (blue-leaning at the bottom) | f604 grid rows 75-95% H |
| #6b0505 / #4a0004 | sunburst ray peak / trough | 24.10 s, 21.50 s, 3.50 s |
| #15100c / #740000 | void haze / red bloom (extreme wide) | f66 top-left / right edge |
| **#fdfbf9** | primary text white | «استاذي» core, «ركز» #fefcfa |
| #fff6ef | Light subtitle white | «توصل» core |
| #af8687 → #d8b9bd | hook rose sheen ends | f30 |
| **#f03039** (#e8222c) | pink sweep core | f99-129 |
| #cf0108 / #9d0001 / #640001 | neon stroke / body / glow | f200 p99/p90/ring |
| #a30002 / #d00005 / #8c0000 | ghost rim / rim peak / fill bottom | f20 «Mr» |
| #ec0206 / #ff0810 | script «Studio» median / peak | f500 |
| #fe030a / #ff030f | UI text / bell | f250 |
| #a99991 / #fdfdfd / #a5807c | wordmark left / centre / right | f500 |
| #acfaf6 / #838585 | Difference cyan over the wall / grey entry | f272 / f260 |
| #ee1b1e | red Difference layer (solved) | f290 |
| rgba(255,255,255,.37) → #a25b60 | glass hairline over the wall | f337 panel edge |
| rgba(255,255,255,.14) → #602725 | outline-pill hairline | f662 |
| #b30005 / #8c0000 | rose highlight / mid | 14.60 s |
| #cfa48c / #cd8c6b / #c27a5b | skin highlight / key side / far side | 21.50 s |
| #8e4222 / #712d10 | hair / warm rim | 21.50 s |
| #a07c6a / #04101a / #000b23 / #000008 | taupe blazer / black camisole / indigo jeans / chair | 21.50 s |

Colour logic:
- The world is monochrome red (hue about 0°, G≈0).
- Skin and hair are warm against blue-leaning blacks in the wardrobe.
- Every accent is red or pink.
- The cool colours exist **only** as a result of Difference blend.

### 5.2 Grade recipe
Targets measured on f604, f170, f560, f100, f296 and f380. They are luma percentiles (Y) unless stated.

| | p0.5 | p5 | p50 | p95 | p99.5 | mean S | centre vs corners |
|---|---|---|---|---|---|---|---|
| Wide | 0 | 4 | 21-22 | 59-67 | 152-157 | 235-237 | 76-79 vs 14 |
| MCU / MS | 0 | 1-3 | 25-27 | 133-143 | 164-168 | 194-210 | 68-86 vs 20-22 |
| Extreme-wide void | 7 | 13 | 19 | 34 | (text 250) | 176 | 47 vs 14 |

- No plate pixel clips: skin peaks at about #d5a48c (Y ≈ 170). Only graphic whites reach 250.
- The top 60 px of the wide sit at Y 8-10. The bottom 100 px of the MCU sit at Y 12-14.
- No grain and no plate bloom.
- One grade covers every shot. The verifier refuted the claim that shot 9 is warmer.

ffmpeg starting point, for the talent and a real red set:
```
eq=contrast=1.18:brightness=-0.03:saturation=1.38,
curves=master='0/0 0.07/0 0.25/0.15 0.5/0.40 0.75/0.58 1/0.68',
colorbalance=rs=-0.02:bs=0.04:rm=0.06:gm=-0.02:bm=-0.04:rh=0.03:bh=-0.03,
vignette=angle=PI/3.2:x0=w/2:y0=h*0.42
```
- The curve crushes everything under 7% to black and caps the plate at about 0.68 (Y ≈ 173).
- `colorbalance` keeps shadows slightly cool and mids and highs warm.
- The engine equivalent on the talent canvas is `contrast(1.2) brightness(0.74) saturate(1.4)`.
- **Never grade or vignette the graphics.** Type stays #fdfbf9 even in the black top band.
- Bake the vignette under the captions: use the backdrop gradients plus the `plate-vignette` component. The engine's `fx` layer sits above the text, so leave `overlays.vignette` null.

## 6. Backgrounds and sets

| Set | Reference | How it was made | How to fake it for new footage |
|---|---|---|---|
| **Red studio, wide** | 5.36-8.64, 10.36-11.72, 18-21.08, 23.96-27.36 s | real red seamless wall and floor; real contact shadows (24.10 s); black chair | Keep a real red set if you have one. Otherwise use `bg-replace` with `backgrounds.redStudioWide.gradient`, fitted to the f604 40th-percentile grid: rows 5-95% H = R 32/56/72/83/86/78/66/63/60/42, left side 10-25 levels darker in the top half, hot spot at (64%, 40%). Add `contact-shadow`. Alternatively use the AI plate from `backgrounds.redStudioPlate.prompt`. |
| **Red studio, MCU** | 2.72-5.36, 8.64-10.36, 11.72-14.48, 21.08-23.96 s | 2-2.6× crop or a second camera | `backgrounds.redStudioMcu.gradient`: R 68-90 everywhere, brightest top-right #5a0008, bottom-left #2e0007 |
| **Sunburst halo** | every shot | plate-locked: hair occludes it and it scales with the zoom | `sunburst-halo` component on the `behind` layer, camera-locked, centred on the face-track head top. Inner r = 1.18× head width, outer r = 3.8× head width. |
| **Extreme-wide void** | 1.9-2.68 s | real plate shrunk ×0.27 into an outpainted smoky dark environment (likely AI) | `backgrounds.voidExtension` gradient or its `prompt`, plus `void-pullback`: the studio rectangle is camera-locked with an 18% radial feather |
| **Rose depth** | 14.48-18.0 s | CG roses, defocused (σ 10-15 px @720) | `fg-rose-parallax`: 2 PNG roses (prompt in style.json), blur 20 px @1080, scale 1 → 2.2 against the ×0.58 pull-back |

Haze and particles: none in the studio. The only haze is the painterly smoke of the void, with blotches in the upper half and a lighter horizon band at 59-70% H.

Depth stack, back to front:
1. wall / backdrop;
2. sunburst halo;
3. neon line and ghost echo words (wall depth);
4. «الطـــالب» / «راح» (behind the head);
5. **talent**;
6. ghost word inside the arch;
7. glass (arch, pills, panels), with old words under it;
8. crisp white type and the red UI on top of the glass;
9. foreground roses (only in text-free shots).

## 7. Graphic component library
Sizes are 720 → **1080**. Layer `front` = over the talent; `behind` = between the backdrop and the talent.

| id | Purpose | Construction | Colours / layer |
|---|---|---|---|
| `sunburst-halo` | signature backdrop | 45 rays, pitch 6-11° (median 8°); inner r 106 → **159** (range 119-260); outer r 343 → **515** (range 362-629); ray width 12.5 → **19**; round caps; edge blur 4 px; about half the rays broken into 2-3 dashes with 15-30 px gaps. Wide-shot centre (354,455) → **(531,683)** = (49.2%, 35.5%), about 7 px above the head top. | #6b0505 at 100% (or #230303 in plus-lighter = +34 R); `behind`, camera-locked |
| `glass-arch-rise` | hook depth sandwich over the lap | width 567 → **850** (78.8% W), x 128-978, top y **1033** (53.8% H), semicircle r **425**, legs run off the bottom; stroke **3 px** white 37% (#8e5558 over the wall); backdrop blur **5 px**; fill black 10%; black lift (min luma 2 → 6). Contents: red ghost word under the glass at (53.9%, 66.4%) and a thin kashida line on top at (51.3%, 82.4%). | `front` |
| `glass-pill-smoked` | backing for a subtitle or UI line under a hero | pill1 441×145 → **662×218** (61.4% W × 11.3% H) at (49.9%, 76.1%); pill2 372×122 → **558×183** (51.7% × 9.5%) at (49.9%, 62.4%); r = h/2; backdrop blur **10 px**; black 14% (plate ×0.86, std 65 → 44); rim **2 px** white 22%; no shadow | above the hero's lower edge, below the subtitle/UI |
| `glass-pill-outline` | CTA frame | 374×122 → **560×182** at (49.8%, 21.7%); r = h/2; stroke **2.5 px** white 14% (#602725 over #430101); no fill, no blur; top edge touches the headline descenders | `front` |
| `glass-corner-panels` | focus wipe | TL slab x 0-**430**, y 0-**998** (39.9% W × 52% H), rounded bottom-right corner r 250 → **375**; BR slab from x **633**, y **800** (58.6% W, 41.6% H) to the frame edges, rounded top-left corner r **375**; stroke **3 px** white 37%; blur **7.5 px**; darken ×0.9 with a faint red tint. The **face must sit in the gap** (x 430-633). | above the old word, below the new word |
| `bell-ring` | UI notification accent | 48×42 → **72×63** at (67.2%, 62.1%); outline stroke **4.5 px** #ff030f; base tilt about −25°; two small ring arcs | `front` |
| `brand-lockup` | solution beat | wordmark (49.2%, 14.3%), script (68.8%, 14.0%), tagline (49.9%, 24.2%); all parked in world space and delivered by `pullback-brand` | `front`, camera-locked |
| `fg-rose-parallax` | text-free breather | bottom-left rose x 0-705, y 1335-1920; top-right rose x 540-1080, y 0-660, darker; blur **20 px**; glossy red (#b30005 / #8c0000 / #8e0408) | `front` (no text in this shot) |
| `void-pullback` | problem-question reveal | static void background plus a camera-locked studio rectangle with an 18% feather; end state: talent about 20% H tall, head top at 44% H | `bg` |
| `contact-shadow` | only when the background is replaced | ellipse 120% of the talent width × 60 px, rgba(0,0,0,.65), blur 24 px, under the chair and feet | `behind`, camera-locked |
| `plate-vignette` | the reference vignette, kept under the captions | radial `transparent 45% → rgba(12,0,0,.8) 100%` at (50%, 42%), plus a top band `rgba(6,0,0,.6) → 0` over the top 14%, plus a talent mask fading to 55% over the bottom 14% | `behind` and talentWrap |

These ids need a `styles/style-3/components.js`, which does not exist yet; the engine warns `missing component`. The shared `glass-pill` and `shape` components can stand in for the pills.

## 8. Motion vocabulary
Easing shorthands:
- **expo-out** = cubic-bezier(0.16,1,0.3,1);
- **soft-out** = (0.2,0.7,0.3,1);
- **pop-out** = (0.22,1,0.36,1);
- **std** = (0.4,0,0.2,1);
- **ease-in** = (0.7,0,0.84,0);
- **linear**.

### 8.1 Text presets
Durations are given as f@25 / ms / f@30.

| id | Unit | IN (from → to) | IN duration | Stagger | Easing | Hold | OUT |
|---|---|---|---|---|---|---|---|
| `hook-glyph-pop` | letter, RTL, camera-locked | opacity 0→1, scale 0.6→1 (origin 50% 70%) | 3 / 120 / 4 | 2 / **80** / 2.4 (6 glyphs in 13 / 520 / 16) | expo-out | 35 / 1400 / 42 | **split exit**: y −22, blur 8, opacity 0, 2 / 80 / 2.4, ease-in |
| `ghost-echo-word` | whole, LTR, camera-locked, `behind` | opacity 0→1 | 4.5 / 180 / 5.4 | – | linear | 36 / 1440 / 43 | split exit (top group) |
| `fade-rise-word` | word | opacity 0.45→1, y +36→0, blur 6→0 | 7 / **280** / 8.4 | 8 / **320** / 9.6 | expo-out | 45 / 1800 / 54 | leaves on the cut; optional early-out of word 1 (2 / 80 / 2.4) |
| `fade-rise-long` | whole | opacity 0.55→1, y +60→0, blur 4→0 | 8 / 320 / 9.6 | – | expo-out | creep y −6 over 14 f | pushed behind glass, cut |
| `headline-cascade` | word | opacity 0→1, y +33→0 | 14 / 560 / 17 | 6 / **240** / 7.2 | pop-out | 65 / 2600 / 78 | none (end card) |
| `world-locked-question` | whole, camera-locked | none of its own: the reveal pull-back carries it from ≈2.6× size at the bottom edge | (28 / 1120 / 34 via camera) | – | camera curve | 19 / 760 / 23 | cut |
| `typewriter-sub` | letter, RTL | opacity 0→1 | 4 / 160 / 4.8 | 0.55 / **22** / 0.66 (≈45 glyphs/s; a line types in 480-560 ms) | soft-out | 40 / 1600 / 48 | cut |
| `typewriter-sub-rise` | letter, RTL | opacity 0→1, y +40→0 | 5 / 200 / 6 | 1 / 40 / 1.2 | expo-out | 33 / 1320 / 40 | none (end hold) |
| `typewriter-thin-kashida` | letter, RTL | opacity 0→1 (rides up with the arch) | 2 / 80 / 2.4 | 1 / 40 / 1.2 | soft-out | 14 / 560 / 17 | drops with the arch (y +450, 2.5 / 100 / 3) |
| `word-cascade-fade` | word, camera-locked | opacity 0.3→1 | 3.5 / 140 / 4.2 | 3.25 / **130** / 3.9 | soft-out | 52 / 2100 / 63 | cut |
| `word-step-reveal` | word | opacity 0→1 | 3 / 120 / 3.6 | 7 / **280** / 8.4 | soft-out | 20 / 800 / 24 | cut |
| `glyph-scale-pop` | letter (origin 50% 60%) | first glyph: scale 0→1 in 8 / 320 / 9.6 with (0.25,0.48,0.5,0.99); last glyph: 0→**1.04** in 7 / 280 / 8.4, then →1.0 in 10 / 400 / 12 with std | 17 / 680 / 20 total | 9 / **360** / 10.8 between glyphs (120 ms per unit when written with 2 tatweels) | as stated | 27 / 1100 / 33 | cut |
| `karaoke-sweep` | whole overlay clone | band background-position 30% → 70% (size 400%) | 48 / **1920** / 58 | starts with hero word 2 (+8 f / 320 ms) | linear | – | band exits left |
| `neon-blur-in` | letter, from the centre, `behind` | opacity 0→1, blur 18→0; then brightness 1.15→1 | 7 / 280 / 8.4 per cluster; 36 / **1440** / 43 total | 1.5 / 60 / 1.8 | soft-out | 37 / 1500 / 45 | cut |
| `kashida-draw-behind` | whole, `behind` | clip inset-left 100%→0 with keyframes 120 ms → 65.6%, 440 ms → 35.5%, 520 ms → 0 (head letters fast, kashida drawn, tail pops) | 14 / **560** / 17 | – | linear | 30 / 1200 / 36 | cut |
| `blur-ghost-in` | whole, `behind` | opacity 0.6→1, blur 12→0, scale 1.05→1; then creep x +18, y −14 | 10 / 400 / 12 (+ creep 400) | – | expo-out | 12 / 480 / 14 | cut |
| `blur-wipe-in` | whole | opacity 0.4→1, blur 8→0 | 5 / 200 / 6 | – | expo-out | 50 / 2000 / 60 | cut |
| `difference-rise` | whole, **Difference** | opacity 0.45→1, y +90→0 | 14 / **560** / 17 (most of the rise in the first 8 f) | – | expo-out | 19 / 760 / 23 | **1-frame swap-out** |
| `difference-slam` | whole, **Difference** | appears in 1 frame | 0 | – | none | 8 / 320 / 10 | cut |
| `brand-wordmark` / `script-accent` | whole, camera-locked | none of their own; parked above the frame | (76 / 3040 / 91 via camera) | tagline +1000 ms | camera curve | 69 / 2760 / 83 | cut |
| `ui-latin-type` | letter, LTR | opacity 0→1 | 2 / 80 / 2.4 | 0.5 / 20 / 0.6 (12 chars in 6 / 240 / 7) | linear | 26 / 1040 / 31 | cut |

Rules:
- Arabic builds **right → left** at every level: glyph pops, typewriters, the sweep, kashida draws and wipe-ins. Latin builds left → right.
- There are no lateral slides of type and no bounces, apart from the 4% overshoot on the turn word.
- A self-animated exit never lasts longer than 2-3 frames. Everything else leaves on the cut.

### 8.2 Graphic presets
| Component | IN | Loop / hold | OUT |
|---|---|---|---|
| `glass-arch-rise` | **rises and scales**: from y +380, scale 0.75 (origin bottom centre). The top travels 1650 → 1033 (1080) while the leg width grows 638 → 849 (×1.33). 19 / **760** / 23, cubic-bezier(0.13,0.43,0.09,1.0) (62 px/f @720 at f20 → 1 px/f by f35). The ghost word fades in +160 ms over 120 ms. | static | drops 450 px in 2.5 / 100 / 3, ease-in (split exit) |
| `glass-pill-smoked` | grows from a seed of about 66×30 px (scaleX 0.1, scaleY 0.2, origin 55% 50%; it stretches left first, then pops to full) in 10 / **400** / 12, pop-out; starts 3-8 f after the hero. Pill2 grows from the centre in 6 / 240 / 7. | static | cut |
| `glass-pill-outline` | scaleX 0.25 → 1 from the centre in 10 / 400 / 12, pop-out; starts 21 f after the headline | static | none (end hold) |
| `glass-corner-panels` | TL from (−257, −836), BR from (+272, +939) to rest in 15 / **600** / 18. 90% of the travel happens in 6 f (peak about 175 px/f @720). TL easing (0.37,0.32,0,1.03); BR easing (0.29,0.89,0.28,0.96). Starts about 5 f after the old word. | **linear drift** for 31 / 1240 / 37: TL y +45, BR x −15, y −45; then a **dead stop** | cut |
| `bell-ring` | stroke draw-on 14 / 560 / 17, soft-out, about 15 f after the pill | sway ±11° around −25°, half-period 8.5 / 340 / 10, sine | cut |
| `fg-rose-parallax` | scale 1 → **2.2** over the shot (87 / 3480 / 104) with the camera curve; slow turn of 6° | – | cut |
| `sunburst-halo` | none: present from the first frame and plate-locked | never animates on its own (patch mean ±0.2 over 41 f) | – |

### 8.3 Camera moves (all centred, focus [0.5, 0.5]; **never a push-in**)
| id | Scale | Duration f@25 / ms / f@30 | Easing | Trigger / measured |
|---|---|---|---|---|
| `pullback-expo-open` | **1.69 → 1.00** | 22 / **880** / 26 | cubic-bezier(0.3,0,0.05,1) (fit 0.31,−0.08,0.04,0.99) | first frame of the hook; steps f4 0.947, **f5 0.921** (peak −8%/f), f10 0.973, f22 1.000 |
| `settle-float` | 1.00 → 0.982 | 16 / 640 / 19 | soft-out | immediately after; title top 254 → 238 @720 |
| `reveal-pullback-void` | **1.00 → 0.27** | 28 / **1120** / 34 | cubic-bezier(0.26,−0.03,0.36,1.09) ≈ (0.3,0,0.3,1) | 1 frame after the split exit; peak −11%/f at f45-46; requires the void plus a camera-locked studio |
| `pullback-slow-parallax` | **1.724 → 1.00** (×0.58) | 87 / **3480** / 104 | cubic-bezier(0.56,0.27,0.43,0.79) | text-free breather with roses; broad peak 1.1-1.2%/f over f390-415; still moving at the cut |
| `pullback-brand` | **1.73 → 1.00** (×0.578) | 76 / **3040** / 91 | cubic-bezier(0.32,0.06,0.07,1.06) | brand shot; peak −2.7%/f at f465-467, 90% done by f491 |
| `mcu-crop` | static 2.3 (2-2.6) | 0 | – | tight shots made from a wide 4K take |
| `locked` | 1.0 | – | – | 6 of the 10 reference shots |

About 31% of the runtime is moving camera. The footage itself has no speed ramps.

**World lock.** Elements marked `worldLock` follow `x = 540 + (x_final − 540)·S`, `y = 960 + (y_final − 960)·S` at 1080, with S the camera scale relative to its end value. The reference tracks this within ±5-13 px. A type element parked outside the final frame is therefore *flown in* by the pull-back, and it shrinks as it arrives.

### 8.4 Transitions
| id | Duration | Parameters |
|---|---|---|
| `hard-cut-size-flip` (default) | 0 | Flip tight (head 18-20% H) ↔ wide (head 8-10% H), ×2-2.6. One exception: MS → MS into the breather. Cut in speech micro-pauses: 4 of 9 cuts are within ±45 ms of a voice minimum (+20, +40, +10, −40 ms), the rest within 70-390 ms. Every caption leaves on the cut frame. No SFX. |
| `split-exit` | 2-3 / 80-100 / 2.4-3 | Top group: y −22, blur 8, fade. Bottom group (arch plus its text) drops 450 px with ease-in. The next move (`reveal-pullback-void`) starts 1 frame later. This may hide a jump cut (hands change pose at f38 → f39). |
| `glass-focus-wipe` | 15 / 600 / 18 | `glass-corner-panels`. The old word becomes frosted (−21% white pixels, reads #e4dddd) in 2-3 f; the new word lands crisp on top 2-3 f later with `blur-wipe-in`. |
| `word-swap` | 1 / 40 / 1 | The outgoing word vanishes in one frame; the incoming word ghosts in on the next frame («شلون؟» gone at f278, «راح» from f279). |
| `early-word-out` | 2 / 80 / 2.4 | The first hero word fades out just before the cut so the second word stands alone («يمكن» f130-132). |
| not used | – | dissolve, whip pan, flash, light leak, glitch, blur or zoom transitions, speed ramps, push-ins |

## 9. Edit rhythm and narrative template
Reference shot lengths: 2.72 / 2.64 / 3.28 / 1.72 / 1.36 / 2.76 / 3.52 / 3.08 / 2.88 / 3.40 s.
- ASL **2.74 s** (median 2.82), 3.65 shots per 10 s.
- The edit **accelerates** in the agitation beat (1.72, 1.36 s) and **slows** into the long moving shots (3.5, 3.1 s).
- Text is on screen for 69.9% of the runtime.
- Text entrances: 8.8 per 10 s, front-loaded (11 / 9 / 4 in successive 10 s windows). Graphic events: 12.4 per 10 s.
- Caption hold: mean 1.68 s, median 1.8 s.
- The first overlay lands 0-440 ms after a cut (median 200 ms).

| # | Beat | Ref time (frames@25) | Share | Shot / camera | Text | Graphic device | SFX |
|---|---|---|---|---|---|---|---|
| 1 | **Hook** (address) | 0.00-1.56 (0-38) | 6% | MS → MWS, `pullback-expo-open` + `settle-float` | `hook-glyph-pop` «استاذي» + `ghost-echo-word` «Mr» + `typewriter-thin-kashida` «تدريسك قـــوي» | `glass-arch-rise` with ghost «اذا»; `split-exit` | click (optional) |
| 2 | **Problem question** | 1.56-2.72 (39-67) | 4% | → EWS, `reveal-pullback-void` | `world-locked-question` «ليش اعلانك ضعيف» | `void-pullback` | – |
| 3 | **Validation A** | 2.72-5.36 (68-133) | 10% | MCU, locked | `fade-rise-word` «يمكن انت» + `karaoke-sweep` + `typewriter-sub` | `glass-pill-smoked` (pill1); `early-word-out` | typing rattle |
| 4 | **Validation B** | 5.36-8.64 (134-215) | 12% | WS, locked | `neon-blur-in` «تشـــرح بطريقه» + `typewriter-sub` | neon fade mask | tick 1 f before the next cut |
| 5 | **Agitation A** (turn word) | 8.64-10.36 (216-258) | 6% | MCU, locked | `glyph-scale-pop` «بس» + `ui-latin-type` + `word-step-reveal` | pill2 + `bell-ring` | pop + ding |
| 6 | **Agitation B** (question) | 10.36-11.72 (259-292) | 5% | WS, locked | `difference-rise` «شلون؟» + `kashida-draw-behind` «الطـــالب» → `word-swap` → `blur-ghost-in` «راح» + `difference-slam` «يعرفك؟» | Difference blend, roto behind the head | – |
| 7 | **Agitation C** (shift) | 11.72-14.48 (293-361) | 10% | MS, locked | `fade-rise-long` «اليوم» → `blur-wipe-in` «الطالب» + `typewriter-sub` | `glass-corner-panels` (focus wipe) | – |
| 8 | **Turn / breather** | 14.48-18.00 (362-449) | 13% | MS → WS, `pullback-slow-parallax` | **none** (3.5 s) | `fg-rose-parallax` | – |
| 9 | **Solution + brand** | 18.00-21.08 (450-526) | 11% | MS → WS, `pullback-brand` | `brand-wordmark` + `script-accent` + `word-cascade-fade` | `brand-lockup` (world-locked drop) | – (bed fill on the cut) |
| 10 | **Proof** (talking) | 21.08-23.96 (527-598) | 11% | tight MCU, locked | **none** (2.9 s) | – | – |
| 11 | **CTA** | 23.96-27.36 (599-683) | 12% | WS, locked | `headline-cascade` «ركز على تدريسك» + `typewriter-sub-rise` «احنا نركز بشغلنا»; **1.32 s end hold** | `glass-pill-outline` | – |

Scaling the template:
- **~25-30 s**: use it as is.
- **30-40 s**:
  - add one more Validation pair (MCU pill + WS neon), or a second Agitation MCU/WS pair, using new device instances;
  - keep the ASL at 2.6-3.0 s;
  - keep exactly 2 text-free blocks of 3-3.7 s (one moving with parallax, one locked talking) and 4 pull-backs (hook ×2, breather, brand);
  - keep 1 Difference beat, 1 glass focus wipe and 1 brand drop.
- **Under 20 s**: drop beats 4 and 7, keep one breather, and merge proof and CTA.

Inside every shot:
1. Each shot gets **one new signature device**. Glass pills recur (shots 2, 4 and 10). Only the agitation WS stacks devices (Difference, kashida behind the head, word swap).
2. The hero lands 0-440 ms after the cut, the pill 3-8 f after the hero, and the subtitle 6-15 f after the pill.
3. Nothing moves after the build except creeps, drifts and the camera.

## 10. Audio and SFX
| Event | Sound | Timing / level |
|---|---|---|
| bed | sustained **sub-bass** pad/bass, fundamental **41 Hz** (E1) with harmonics at 82/123 Hz, no drums | RMS below 70 Hz −22.4 dBFS against −20.3 dBFS for the voice band: **only 2-4 dB under the voice** (the verifier corrected 17-25 dB). No ducking. Phrase changes about every 5.5 s: one just before the cut into the Difference beat (9.85-10.40 s, about 100 Hz), one around the cut out of the brand shot (20.3-21.4 s, about 90 → 70 Hz). |
| voice | clean, close-mic, de-noised; median −18.6 dBFS, p95 −12.1 | pauses trimmed tight (gaps −34 to −44 dBFS) |
| first typed subtitle | **typing rattle**: tiny transients above 11 kHz every 22-46 ms, 480 ms (`typingRattleHF`; engine stand-in `shimmer`) | 0 ms from the first glyph (3.61-4.09 s); HF band −25 dBFS. **Only the first typed line in the reel** gets it. |
| cut into the turn-word shot | **tick** 6.64 kHz plus a >11 kHz burst, about 50 ms (`tickHF`) | −30 ms (1 frame before the cut) |
| turn word, glyph 1 | **pop**, peak 10-10.7 kHz, about 90 ms (`popHF`) | +60 ms (at peak growth); HF −16.8 dBFS (loudest SFX) |
| turn word, glyph 2 | **ding**: 4.19 kHz plus an 8.38 kHz partial (+2.6 dB), −25 dB by 220 ms, about 300 ms ring (`ding4k`) | +460 ms from the cue (onset 9.10 s); band peak about −13 dBFS; leads into the bell icon |
| arch lands | **click** >11 kHz, 25 ms (`clickHF`), low confidence | +240 ms from the arch start; −32.5 dBFS |
| cuts, pull-backs, pills, panels, Difference words, logo drop | **nothing** | – |

Rules:
- Cuts and type follow **speech** (syllable onsets ±30 ms), not beats; the tempo is unresolved (86 vs 115 BPM).
- The engine's built-in `ding` is 1320 Hz. Use `idealSound` specs from style.json when better samples exist.

## 11. Layout and safe zones (1080×1920; percentages are the same at 720×1280)
```
 WIDE (full body, head top 34-35% H)            MCU (head top 23-24% H, chin 41-44%)
 +--------------------------------------+ 0%    +--------------------------------------+ 0%
 |  no text above 8.3% (159 px)         |       |  sunburst rays only                  |
 |--------------------------------------| 8%    |                                      |
 | TOP BAND 8-27%                       |       |      ##### FACE 22-45%: NO TEXT #####|
 |  headline / wordmark  (49.9%,14.5%)  |       |                                      |
 |  ghost echo "Mr"      (53.5%,16.8%)  |       |--------------------------------------| 50%
 |  neon right edge 91.5% W, y 15%      |       | CHEST BAND 50-82%                    |
 |  outline pill / label (49.8%,21.7%)  |       |  turn word "بس"     (49.2%,55.5%)    |
 |  hook hero            (51.5%,22.9%)  |       |  pill2 558x183      (49.9%,62.4%)    |
 |  tagline / sub        (49.9%,22-24%) |       |    UI text (44.2%,62.5%) bell (67.2%)|
 |--------------------------------------| 27%   |  hero "يمكن انت"    (49.9%,68.8%)    |
 |  display above head   (50.5%,32.3%)  |       |  sub under pill2    (50.0%,70.2%)    |
 |  ((( sunburst centre 49.2%,35.5% ))) |       |  pill1 662x218      (49.9%,76.1%)    |
 |  kashida BEHIND head  (50.4%,42.9%)  |       |    sub in pill1     (49.9%,75.6%)    |
 |  Difference word over torso          |       |--------------------------------------| 82%
 |        (46-48%, 51.8-53.1%), 80% W   |       |  hands / lap: glass may cover        |
 |  EWS question line    (50.1%,65.6%)  |       |--------------------------------------| 86.6%
 |  arch top 53.8%, x 11.8-90.6%        |       |  NO TEXT (platform UI)               |
 |   ghost (53.9%,66.4%) thin (51.3%,82.4%)     |                                      |
 |--------------------------------------| 86.6% |                                      |
 |  NO TEXT; only the arch / roses      |       |                                      |
 +--------------------------------------+ 100%  +--------------------------------------+ 100%
 x safe: 5.4% min (Difference / long subs), 14.5-16% for headlines; block axis x 49-51%
```
- MS panel shot: old word behind glass at (72.2%, 61.7%); new hero at (34.4%, 60.8%) with its subtitle centred under it at (34.0%, 66.4%). The panel gap is x 39.9-58.6%; the face goes there.
- Talent in the wide: head top 34-35% H, feet 95-96% H, axis x 48.6-50%, figure 62% H.
- Talent in the extreme wide: about 20% H, head top 44% H.
- Tight MCU: head top 14%, chin 37%. This shot carries no graphics.

## 12. Do / Don't
**Do**
- Use Almarai 800 for heroes, headlines and the Latin wordmark, and Almarai 300 for every supporting line; hero : subtitle about 2.7 : 1.
- Keep type flat warm white #fdfbf9.
- Show one beat at a time (3-7 words) and never wrap.
- Keep the world red: wall #4e0005, top band #1c0000, a sunburst halo just above the head at +30-35 R.
- Use glass for every frame or backing: blur 5-10 px, darken 10-14%, 2-3 px hairline at 14-37%, capsules at r = h/2, arches and slabs at r 375-425.
- Stage depth with type: new in front, old behind glass, ghost behind, thin word behind the head.
- Emphasise with a moving pink-red light band (R → L), a neon outline or a red ghost, one per shot.
- Use the Difference blend only in wide shots, across the torso, at most 2 words in one beat.
- Make every camera move a centred pull-back, and world-lock hook and brand type to it.
- Cut hard in speech pauses, flipping tight and wide.
- Include two text-free breathers of about 3.3-3.7 s.
- Keep a loud 41 Hz sub bed and 4-5 HF SFX on text only.
- End on the CTA cascade, the outline pill and the typed label, then a 1.3 s hold.

**Don't**
- No second Arabic family, and no Almarai 400/700 for Arabic.
- No stroke, shadow or glow on white type; no solid boxes behind text.
- No cyan, green or blue fills: cool colours come only from Difference.
- No push-ins, dissolves, whip pans, flashes, glitches, speed ramps, whooshes, risers or impacts.
- No opaque element on the face. Glass may cover the body, never the face.
- No text above 8.3% H or below 86.6% H.
- No self-animated exits longer than 3 frames.
- No beat-sync.
- No foreground props in shots with text.
- Never vignette or grade the captions, and never put the vignette in `fx`.
- No grain, and no bloom on the plate.

## 13. Applying this style to new footage: checklist
**What the source footage needs**
1. **Vertical 9:16, 4K (2160×3840) strongly preferred.**
   - The pull-backs start from 1.69-1.73× crops.
   - Tight shots are 2-2.6× crops of the wide, or a second camera on the same frontal axis.
   - 25 or 30 fps both work; render at 30.
2. **Seated, centred, symmetric, full body in the master wide.**
   - Black or dark chair; head top at 34-35% H (*large headroom*: the top third holds the halo and the top text band); feet at about 95% H; figure about 62% H tall.
   - Hands rest near the lap, where the pills and the arch sit.
3. **Set.**
   - Best: a real **red seamless** wall and floor, kept and graded.
   - Otherwise: any plain, evenly lit backdrop, plus a matte of **person and chair**. The MediaPipe selfie matte may drop the chair; use a better matte or accept losing it. Then add the red studio gradient or the AI plate, plus `contact-shadow`.
4. **Wardrobe.** Neutral taupe or beige jacket, black top, dark indigo or black trousers. The cool, dark wardrobe sets off the warm skin, and the beige turns green under the red Difference word. **Avoid red, pink or white tops** and busy patterns.
5. **Lighting.** Soft frontal key slightly from camera-left (ratio about 1.3 : 1), a warm hair rim from screen-right, low-key spill. Expose so skin peaks land at Y ≈ 165-175 after the grade.
6. **Delivery.** Short phrases with micro-pauses of at least 80-150 ms, so cuts can land in pauses. Provide an SRT or word timings, because syllable-level sync matters for the sweep, pops and typewriters.

**Steps**
1. `python3 prepare.py input.mp4 PLATE` → frames, mattes, face track, `speech.json`. Derive the head-top y as face top − 0.25 × face height, for the halo centre.
2. Split the script into the 11 beats in §9. Mark:
   - the address word plus its Latin echo;
   - the problem question;
   - the validation hero plus its line;
   - the neon line;
   - the one-word turn plus the English UI word;
   - the question word(s) for Difference;
   - the before/after keyword pair;
   - the brand plus tagline;
   - the CTA headline plus its pill label.
3. Shot list: alternate tight and wide at every cut. Assign the 4 pull-backs (hook, reveal, breather, brand). Cut in voice minima.
4. Backgrounds:
   - real red set → grade only;
   - otherwise `bg-replace` with `redStudioWide`/`redStudioMcu`, plus the persistent `sunburst-halo` and `plate-vignette` (camera-locked), plus `contact-shadow`;
   - reveal beat: `voidExtension` plus `void-pullback`.
5. Grade the talent only (§5.2) and check against `grade.targets`: crushed p0.5, plate p99.5 ≤ 170, mean S at least 190.
6. Camera cues from §8.3. Implement `worldLock` (see `worldLockSpec`) in `components.js` with an `onFrame` hook that mirrors `#plateWrap`'s scale. Park hook and brand type off-frame in world coordinates.
7. Text cues from §8.1 with the zone slots in §11:
   - write tatweels into the text explicitly;
   - Difference words in wide shots only;
   - kashida and display words on the `behind` layer when they cross the head.
8. Build `styles/style-3/components.js` for: `sunburst-halo`, `glass-arch-rise`, `glass-pill-smoked`, `glass-pill-outline`, `glass-corner-panels`, `bell-ring`, `brand-lockup`, `fg-rose-parallax`, `void-pullback`, `contact-shadow`, `plate-vignette`, and the worldLock wrapper.
9. Assets:
   - 2 rose PNGs with alpha (prompt in style.json);
   - the void plate;
   - optionally the red studio plate;
   - the brand wordmark (or render it in Almarai 800 Latin with the silver gradient);
   - install `@fontsource/pinyon-script`.
10. Audio:
    - a sub-bass bed (41 Hz) at about −22 dBFS RMS with no ducking;
    - the typing rattle on the first typed subtitle;
    - tick / pop / ding on the turn word;
    - optionally the arch click;
    - nothing else.
11. QA stills at each cut +10 f and at each payoff:
    - the face is clear;
    - text stays inside 8.3-86.6% H;
    - one new device per shot;
    - the halo sits above the head;
    - Difference reads cyan over red;
    - world-locked type lands on its slot;
    - the end hold is 1.3 s.

## 14. Annotated reference timeline (condensed; frames @25)
| Time (s) | Frames | Shot | Event |
|---|---|---|---|
| 0.00-0.88 | 0-22 | S1 MS→MWS | `pullback-expo-open` 1.69 → 1.0 (peak −8%/f at f5) |
| 0.04-0.52 | 1-13 | S1 | ghost «Mr» fades in over f1-5 (world-locked); «استاذي» builds RTL by glyph pops (ا f1, سـ f3, ت f5, ا f9, ذ f10, ي f11-13) |
| 0.72-1.48 | 18-37 | S1 | glass arch rises **and scales** (legs 425 → 566 px @720); red «اذا» inside from f22 |
| 0.96-1.44 | 24-36 | S1 | «تدريسك قـــوي» typed about 1 glyph/f on top of the glass; click about 0.98 s |
| 0.88-1.52 | 22-38 | S1 | `settle-float` −1.8% |
| 1.52-1.60 | 38-40 | S1 | **split exit**: title and «Mr» kick up and smear; the arch drops (possible hidden jump cut at f39) |
| 1.56-2.68 | 39-67 | S1 → EWS | `reveal-pullback-void` ×0.27 (peak −11%/f at f45-46); «ليش اعلانك ضعيف» world-locked from the bottom edge (height 130 → 51 px @720) |
| **2.72** | 68 | **cut → S2 MCU** | EWS → MCU (×6-7) |
| 2.92-3.52 | 73-88 | S2 | «يمكن» (f73) and «انت» (f81) fade-rise; pill1 seed f75 → full f84 |
| 3.24-5.24 | 81-131 | S2 | **pink sweep** R → L, x 545 → 183 @720 |
| 3.64-4.40 | 91-110 | S2 | «من افضل المدرسين بمجالك» typed; **typing rattle** 3.61-4.09 |
| 5.20-5.28 | 130-132 | S2 | «يمكن» fades early, so «انت» stands alone |
| **5.36** | 134 | **cut → S3 WS** | in a voice minimum (+20 ms) |
| 5.60-7.04 | 140-176 | S3 | red **neon** «تشـــرح بطريقه» blurs in by clusters (ح, then بطريقه, then تشـ); left fade edge slides x 72 → 170 @720; glow peaks f155-160 |
| 6.72-7.44 | 168-186 | S3 | «توصل المعلومه للطالب بسهوله» typed (about 2 glyphs/f) |
| 8.62 | 215 | S3 | **tick** 1 frame before the cut |
| **8.64** | 216 | **cut → S4 MCU** | |
| 8.64-9.68 | 216-242 | S4 | «بـ» scale-pop (8 f) + **pop**; «س» pops at f225 with a +3.6% overshoot + **ding** at 9.10; pill2 f220-226 |
| 9.08-10.32 | 227-258 | S4 | red «your content» typed LTR (6 f); bell draws on f236-249, then sways ±11°; «مايبين / هل / شي» f238 / 244 / 252 |
| **10.36** | 259 | **cut → S5 WS** | +40 ms from a voice minimum; the bass phrase changes just before |
| 10.36-11.08 | 259-277 | S5 | «شلون؟» Difference: grey at 52% → cyan #acfaf6 (f259-274), rises about 60 px @720; «الطـــالب» kashida draws **behind the head** (f262-276) |
| 11.12-11.68 | 278-292 | S5 | **word swap**: «شلون؟» out at f278; «راح» ghost-in behind the hair f279-290 (#c8afaf → #fdfaf9) and creeps; «يعرفك؟» red Difference slam at f285 |
| **11.72** | 293 | **cut → S6 MS** | +10 ms |
| 12.00-12.32 | 300-308 | S6 | «اليوم» fade-rises 40 px @720 |
| 12.24-12.84 | 306-321 | S6 | **glass corner panels** slide in (peak about 175 px/f @720); «اليوم» goes frosted at f309-310; «الطالب» wipes in crisp on top (f308-313); its subtitle is typed f313-326 |
| 12.84-14.08 | 321-352 | S6 | panels drift about 1 px/f, then stop dead |
| **14.48** | 362 | **cut → S7 MS (roses)** | −40 ms; MS → MS |
| 14.48-17.96 | 362-449 | S7 | **text-free**; `pullback-slow-parallax` ×0.58; the foreground roses grow ×2.2 |
| **18.00** | 450 | **cut → S8 MS** | |
| 18.00-21.04 | 450-526 | S8 | `pullback-brand` ×0.578; «PRIME» + «Studio» drop in from above (world-locked, settled at f523); tagline words at f475 / 478 / 481 / 484 / 488 |
| **21.08** | 527 | **cut → S9 tight MCU** | bass fill 20.3-21.4 s |
| 21.08-23.92 | 527-598 | S9 | **text-free** talking head, locked; same grade |
| **23.96** | 599 | **cut → S10 WS** | |
| 24.40-25.40 | 610-635 | S10 | «ركز / على / تدريسك» cascade (f610 / 616 / 622; 22 px rise @720) |
| 25.28-25.60 | 632-640 | S10 | outline pill grows from the centre |
| 25.48-26.04 | 637-651 | S10 | «احنا نركز بشغلنا» typed with a per-glyph rise |
| 26.04-27.36 | 651-683 | S10 | **end hold** 1.32 s; no outro |

## 15. Corrections adopted and residual uncertainty
**Verifier corrections adopted:**
- Two opening moves with a near-hold between them, not one pull-out.
- Reveal ×0.27 full-frame; presenter about 255-265 px @720 at the end.
- «Mr» from f1.
- The arch scales up while it rises.
- Neon is static and only its mask moves.
- Sweep starts at f81 with core #e8222c-#f03039, not #f48394.
- Pill2 is 372 px wide; the bell is 48×42 px with a small sway.
- «مايبين هل شي» is white and revealed word by word.
- «شلون؟» is white Difference at y 571-755 @720, out at f278.
- «يعرفك؟» is red Difference.
- «راح» is a fade-in and sits behind the hair.
- Panels slide; they are not drawn on.
- «اليوم» starts at f300.
- The props are roses.
- Shot 7 peak is 1.1-1.2%/f.
- PRIME settles at 563×124 @720; the script is «Studio», not a hatch.
- One grade covers every shot.
- The sub bed is at −22 dBFS.
- The 14.48 cut is MS → MS.

**My own re-measurements** (Almarai ink fits, `cal_out.json`):
- «شلون؟» 175 px @720 (look said 200).
- PRIME 172 settled (192 was the f500 state).
- Neon 89 px with 3 tatweels (look said 100).
- Pill label 40.
- Tagline 42 settled (43 at f500).
- «مايختار المدرس بس من سمعته» is 411 px wide (x 39-450, f340), so 33.6 px, centred under «الطالب»; look said 375 px.
- Tatweel counts as in §4.6.
- Keyframe index offset as in the header.

**Still uncertain:**
1. The script family (Pinyon / Great Vibes / Italianno) and its size of about 172 px @1080.
2. The «your content» face (Inter vs SF / Helvetica Medium).
3. Neon size ±5%.
4. Whether the sunburst is practical or a tracked 2D layer, and whether the void is AI or CG.
5. The f39 hidden jump cut.
6. Whether tight shots are a second camera or a crop.
7. The exact start offsets of the glass panels (±10%; this combines motion and verifier tracks).
8. The bell's base tilt.
9. Music tempo.
10. The grade CSS is a starting point that depends on source exposure.

## 16. Renderer compatibility
- `style.json` follows the shape `engine/compositor/runtime.js` reads:
  - `fonts[].role/fontsource/weight/sizePx/lineHeight/fill.gradient/effects.glow/stroke`;
  - `textPresets[].unit/in/hold/out/style/position/layer`;
  - `cameraMoves[]`, `grade.css`;
  - `sfx[]` with `event/preset/sound/offsetMs/gainDb`;
  - `director`, `persistent`.
- Descriptive extras are ignored by the current runtime: `worldLock` (per element), `worldLockSpec`, `keyframes`, `maskAnim`, `graphicComponents`, `backgrounds`, `soundSpecs`, `idealSound` and `onlyFirstInReel`.
- `director.punchInEveryNCaptions` is 0, because this style never pushes in. Add the pull-backs by hand.
- With `autoSfx: true` the engine adds the typing rattle to **every** `typewriter-sub` cue, because it ignores `onlyFirstInReel`. Set `"sfx": false` on every typed subtitle after the first.
- **Smoke test** on `renders/test_plate` with `scratch_style/smoke_scene.json` (stills at f28, 58, 85 and 118 → `scratch_style/smoke*/`, sheet `smoke_sheet.jpg`):
  - Rendered correctly: `hook-glyph-pop` with the sheen (dots of ي intact at line-height 1.6), `ghost-echo-word`, `neon-blur-in` (stroke, inner glow, left fade; needs `width:max-content`), `typewriter-sub`, `kashida-draw-behind` (occluded by the head), `difference-rise` (cyan over red, inverted talent), `fade-rise-word`, `karaoke-sweep` (pink band over the hero), `headline-cascade`, `typewriter-sub-rise`, `glyph-scale-pop` and `ui-latin-type`.
  - Not yet drawn: everything in §7 (needs `components.js`), world lock, the script font (not installed) and the ideal SFX.

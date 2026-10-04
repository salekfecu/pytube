# Style 1 — "Ember Glass"

Reference: `ref1_chemistry.mp4`, a MAX Academy chemistry tutoring promo. It is 720x1280, 30 fps, 718 frames, 23.93 s long, with Iraqi Arabic on-screen text.
Machine-readable tokens: `style.json` (same folder). All production values target a **1080x1920 @ 30 fps** canvas. Reference measurements are given as **720 px → 1080 px** and as a % of frame width (W) or height (H). Durations are given as **frames (f) @30 fps / ms**.

Evidence:
- `_work/ref1_chemistry/scratch_style/`: my size calibration (`calib*.json`, `refbox.json`), backdrop gradient fits (`bgsamples.json`, `g_*.png`) and an engine smoke test (`smoke_sheet.jpg`).
- `scratch_look/`, `scratch_motion/` and `scratch_verify/`.

Frame indexing: `keyframes_full/k_NNN` = frame 15·NNN+7. All frame numbers below are native frame numbers.

---

## 1. Essence

A warm, premium talking-head reel. The look is built on a saturated **orange-on-black studio** and a presenter in a **dark teal shirt**, for an orange/teal complementary split. Each new beat opens with a soft 138%→100% digital punch-out. The shots alternate strictly between full-body wides and chest-up MCUs, and between plain studio shots and AI-generated lab "world plates" with props layered in front of and behind the presenter.

All type is **IBM Plex Sans Arabic in only two weights**: Bold 700 heroes and hairline 200 support lines stretched with kashida. Captions type on glyph by glyph out of a soft blur, with live reflow and a final tracking settle. The UI is **glassmorphism placed in front of the presenter**:
- torus rings that spring-pop and morph into stadium capsules;
- round dark buttons with a lime ring and an arrow;
- refractive lens discs and rings that bend the captions under them.

Each section allows exactly one "special material" word: gold gradient, hot-yellow flash, orange 3D extrusion or ice chrome with a cyan rim.

There are no whooshes, flashes or transitions; speech drives every cut. The one pattern interrupt drains the frame to blurred greyscale for a "not just X" contrast. A 2.7 s clean breather follows, and the reel ends on a static hold of the glowing payoff word.

## 2. Best for / not for

**Best for**
- Education, tutoring, courses, academies, science or tech explainers.
- Expert, consultant or teacher promos, and service and product-feature reels with a *problem → turn → method → detail → contrast → proof → payoff* arc.
- One presenter speaking to camera, 20-45 s, a friendly-authoritative and premium mood.
- Arabic RTL (it also works LTR if the Latin roles are swapped in).
- Brands that can live with warm orange plus a teal accent.

**Not for**
- Hype, meme or "TikTok energy" edits: the style has no whooshes, flashes or speed ramps, and its rhythm is calm and metronomic.
- Multi-speaker interviews, vlogs and outdoor or location footage with busy backgrounds (the style needs a plain backdrop that can be keyed and replaced).
- Sombre topics such as medical bad news (the warm glow reads as upbeat).
- Brands whose identity is blue or purple.
- Long-form content over about 60 s: at 10.4 caption entrances and about 9 graphic events per 10 s, it becomes tiring.
- Footage without a clear pause structure, because cuts must land in pauses.

## 3. Signature moves (what makes it recognisable)

1. **Blur type-on with live reflow and tracking settle.**
   - Each glyph arrives as a soft blob: blur 8 px (720) / 12 px (1080) → 0, opacity 0→1 over 3-5 f / 100-167 ms. Glyphs come at 0.5-1.4 glyphs/f.
   - The string reflows as it grows. Centred lines drift toward the reading start, left-anchored lines are pushed, and right-anchored lines stay put.
   - After the build, the line's width contracts 4-9% over 10-13 f, which is spacing tightening while glyph scale stays 1.0.
   - Tatweel runs show as dashed segments that close up (`kashida448.png`).
2. **Bold 700 / hairline 200 pairing with deliberate kashida.**
   - Weights 400-600 are never used for Arabic.
   - Kashida makes stacked thin words equal width (هـــواي 6 tatweels / افكـــار 9 tatweels).
   - One kashida becomes a 315 px (720) = 44% W rule that runs into an illustration (بيهـــا, 45 tatweels).
3. **One special-material word per section:**
   - gold horizontal-gradient title with an amber glow (hook);
   - hot-yellow flash cooling to white (بـــس);
   - orange 3D extrusion on a B&W frame (بالكتاب);
   - ice-chrome vertical gradient with a cyan rim and bloom (ممتازه).
4. **Glass UI in front of the presenter.**
   - Torus rings spring-pop (110% → 93% → 100%) and stretch into stadium capsules: radius = height/2, 1.5 px rim brightest on top.
   - Capsules have a smoked inner field and a dark round button with a 3 px lime ring and an arrow.
   - Clear frosted pills sit behind key lines. The presenter's hands show, frosted, through the glass.
5. **Refractive lenses.**
   - A huge lens disc rises from a corner and magnifies whatever is beneath it by about 1.2x.
   - Thin outline circles (r = 40% W) are anchored off-frame at opposite corners and displace and blur earlier captions.
6. **Punch-out settle on every new beat**: 138% → 100% in 17 f / 567 ms, cubic-bezier(0.25,0,0.1,1), anchored on the face. It sits on a strict wide/MCU alternation; the MCUs are about 2.35x digital crops.
7. **World-plate depth sandwiches**: AI lab plates, a badge ribbon behind the arm and in front of the legs, and a glowing flask and fog in front of the legs. They alternate with a plain, crushed-black orange studio.
8. **B&W focus-pull interrupt → clean breather → static payoff hold.**
   - The whole frame blurs (σ 9 px at 720) and desaturates in 8 f.
   - A smoked pill and one orange 3D word sit on top.
   - A hard cut snaps back to colour, followed by an 80 f breather with no graphics.
   - The reel ends on a 38 f hold. It has no logo card and no fade.

## 4. Typography system

### 4.1 Families
| Use | Family | fontsource id | Weights |
|---|---|---|---|
| All Arabic | IBM Plex Sans Arabic | `@fontsource/ibm-plex-sans-arabic` | **700**, **200** (300 only for the tiny dark CTA subtitle) |
| Latin wordmark/tagline/micro | Inter (the original is likely Helvetica Neue Heavy/Medium) | `@fontsource/inter` | 900, 600, 400 |

The verifier confirmed the font matches by IoU:
- كل فكرة: Plex 0.930 vs Noto Sans Arabic 0.565.
- حتى تشوف: Plex 0.648 vs Readex 0.540.
- ممتازه: Plex 0.715 vs Noto 0.606.
- MAX: Inter 900 0.870. ACADEMY: Inter 600 0.682.

Identifying features of Plex: the لمـ ligature, the vertical ـهـ, the diagonal kaf, the تى ligature (reads like "حق") and rhombic dots.

### 4.2 Type scale
Sizes are fitted by rendering each string in Plex or Inter and matching the settled ink bbox measured in the frame (`scratch_style/calib.json`, `refbox.json`). Where an earlier report differed, the value below is the re-measured one.

| Role (style.json `fontRole`) | Font / weight | 720 px (%W) | **1080 px** | Colour / fill | Effects | Reference example (frame) |
|---|---|---|---|---|---|---|
| `hook` | Plex 700 | 43 (6.0%) | **64**, line pitch 58→87 (lh 1.35) | horizontal gold gradient (4.3) | amber glow | «الكيمياء من أكثر المواد / اللي يعانون منها الطلاب» f21-87 |
| `hero` (MCU chest) | Plex 700 | 77 (10.7%) | **116** | #FFFFFF | none | «كل فكرة» f325-410 |
| `hero` turn word | Plex 700 | 82 (11.4%) | **123** | #FAD01E→#FFFFFF | yellow halo during reveal | «بـــس» (6 tatweels) f98-199 |
| `heroWide` (wide top band) | Plex 700 | 110 (15.3%) | **165** | #FFFFFF | none | «حتى تشوف» f413-501 |
| `heroMid` | Plex 700 | 64 (8.9%) | **96** | #FFFFFF | none | «ولهذا طلاب» f582-650 |
| `giant` (lockup) | Plex 700 | 128 (17.8%) | **192** | #FFFFFF | white glow 10%, r 22 px (busy plate only) | «لأن» f201-306 |
| `payoffChrome` | Plex 700 | 156 (21.7%) | **234** | vertical ice-chrome gradient (4.3) | cyan rim + bloom | «ممتازه» f658-717 |
| `payoff3d` | Plex 700 | 163 (22.6%) | **245** | orange face #B65B26 | bevel + extrusion + drop shadow | «بالكتاب» f481-501 |
| `support` | Plex 200 | 46 (6.4%) | **69** | #FFFFFF, opaque | none | «يقربها للطالب» f330-410 |
| `supportWide` | Plex 200 (sits between 200 and 300) | 75 (10.4%) | **113** | #FFFFFF | none | «الكيمياء كدامـــك» (11 tatweels) f434-501 |
| `lockupThin` | Plex 200 | 66 (9.2%) | **99** | #FFFFFF | none | «هـــواي» 6 / «افكـــار» 9 / «بيهـــا» 45 tatweels |
| `supportSmall` | Plex 200 | ≈44 (6.1%), estimated | **66** | #FFFFFF | none | «الاستاذ منجد جبار» f602-650 |
| `pillBold` | Plex 700 | 48 (6.7%), range 47-52 | **72** (71-78) | #FFFFFF | none | «استاذ منجد», «باقوى التجارب», «مو بس تقراها» |
| `pillThin` | Plex 200 | 50 (6.9%) | **75** | #FFFFFF | none | «التفاعلية» (146 px wide at 720, not 230) |
| `pillSmall` | Plex 700 | 31 (4.3%) | **47** | #FFFFFF | none | «دائما يحققون» f641-717 |
| `pillSubDark` | Plex 300 | 31 (4.3%) | **47** | **#340C0C** (the only dark text) | none | «نتائج ودرجات» f651-717 |
| `latinWordmark` | Inter 900, tracking −0.02em | 66 (9.2%), cap 50-51 | **99** | #F8FBFD | none | «MAX» f131-199 |
| `latinTagline` | Inter 600 | 48 (6.7%), cap 36-37 | **72** | #F8FBFD | none | «ACADEMY» f144-199 |
| `latinMicro` | Inter 400, tracking +0.6em | 18 (2.5%), cap 13-14 | **27** | #E8DE5C (uncertain) | none | «Chemistry» f134-199 |

Stroke check:
- Plex 700 stroke ≈ 0.145 em (15-17 px at a 110 px hero, 720).
- Plex 200 stroke/height = 0.038 (the reference measures 0.036).
- The bold at 69-70 px reads 3.5-4 px thick.

### 4.3 Special materials (one per section, never two in the same shot)
1. **Gold gradient, hook only.**
   - A static, screen-space horizontal gradient spans the *whole two-line block* (x 186→569 of 720 = 25.8%→79.0% W) at the same x for both lines. It is not per word or per line.
   - Stops (glyph-core medians, f75): `#FFF7F0 0%, #FFF4E5 6%, #FFF1DD 14%, #FFE9CE 22%, #FFE1A7 30%, #FFD985 38%, #FFD57A 45%, #FFD149 53%, #FFD244 61%, #FFD130 69%, #FFD238 77%, #FED25E 85%, #FDD781 92%, #FFDC92 100%`. Peak saturation (S 207) sits at 69% (x≈450).
   - There is **no per-glyph colour flash**; the verifier refuted the motion report on this. Glyphs only *look* like they change colour because the reflow slides them through the fixed gradient.
   - Glow, measured as rings around the glyph at 1-2 / 4-6 / 11-15 / 28-40 px: #81590E / #724611 / #633B14 / #4A2812 over a local background of about #3C1C09.
   - Recreate it as a tight glow (r 5 px @1080, #FFC400 at 35%) plus a wide glow (r 45 px, #FFB000 at 15-30%, additive). Glyph edges are softened by about 0.75 px. There is no stroke and no hard shadow.
2. **Hot-yellow flash, turn word.** Each glyph lands as #FAD01E (peak #FFF55C) with a yellow halo (#766731 over the teal shirt) and cools to white in 10 f. ب glows f98-108, the word is white at f110, and س glows f112-122; everything is white by f124.
3. **Orange 3D, contrast word on B&W.**
   - Face: median #B65B26, lit #D7793F, shade #A5490B; it is lit from the bottom-right.
   - A 1-2 px (720) pale-cream bevel #F5C9A0 runs along the lower-right edges. The extrusion is #8A3E14, offset 2-3 px down-right, plus a soft dark drop shadow.
   - CSS on a wrapper: `drop-shadow(1.5px 1.5px 0 #F5C9A0) drop-shadow(1.5px 1.5px 0 #8A3E14) drop-shadow(1.5px 1.5px 0 #7A3510) drop-shadow(0 9px 12px rgba(0,0,0,.5))`.
4. **Ice chrome, payoff word.**
   - Vertical gradient by row (720): y192-208 #DAF8FE/#D3F2F8 → y232 #DEF1EC → y256 #A6D0D4 → y280 #89A4A9 → y296 #6E8285 → y320 (ز descender) #4E4C4D.
   - In a line box with line-height 1.2 the stops are `#DAF8FE 0-19.5%, #D3F2F8 27.9%, #DEF1EC 40.6%, #A6D0D4 53.3%, #89A4A9 65.9%, #6E8285 74.3%, #4E4C4D 87-100%`. In that box the alef top sits at 15.8%, the baseline at 77.5% and the descender at 97.5%.
   - Cyan rim on the top and upper edges: median #57CFD7, peak #6AF3F7, 2-3 px (720) = 4 px (1080).
   - Broad bloom: about #3FE8F0 at 10-12%, r 40-60 px (720) = 60-90 px (1080). A near halo #356A6A sits close in. There is no dark shadow.
   - The word sits *above* the lens rings and is not refracted.

> Renderer note: with gradient (`background-clip:text`) fills, put glows, rims and extrusions on an under-layer copy or on a wrapper `filter: drop-shadow()`. A `text-shadow` paints over the clipped gradient. Also, the engine's blur animations overwrite `filter` on the animated element itself.

### 4.4 Hierarchy and card grammar
- Three tiers:
  1. **Hero**: Bold, 1-2 words.
  2. **Support**: hairline, 1.5-1.9x smaller (77/46, 110/75, 128/66 at 720).
  3. **Pill lines**: 31-52 px (720) inside glass.
- A "card" holds 2-4 lines and 4-7 words, with **at most 3 words per line**. The busiest card on screen holds 7 words (كل فكرة / يقربها للطالب / باقوى التجارب / التفاعلية).
- Lines break by meaning: hero → complement → pill line 1 → pill line 2.
- Vertical rhythm at 1080:
  - hero baseline → support baseline: 98 px in MCU (0.84 × hero size) and 159 px in wide (0.96 × hero size);
  - hook baseline pitch: 87 px;
  - MAX → ACADEMY baseline: 70 px.
- Alignment: blocks are centred with a slight right bias (block centre x 52% W). Right-anchored variants: the لأن lockup has its right edge at 76.5% W; «ولهذا طلاب» has its right edge at 70% W.
- **Giant-word lockup**:
  - The giant word sits on the right.
  - Two hairline words stack to its left. The upper one's ascender aligns with the giant's top (y 118 vs 122 at 720); the lower one's baseline aligns with the giant's baseline (y 245 vs about 241).
  - Underneath, a full-width kashida rule (baseline y 317 = 24.8% H) runs from x 193 to 562 (26.8%-78.1% W) and ends in the final alef rising like a hook.
- The default colour is pure white everywhere. Thin lines are **opaque** white: the verifier measured peaks of 237-255, so the "60-70% opacity" reading in the motion report was anti-aliasing.

### 4.5 Arabic + English pairing
- Latin appears only for the brand.
  - Wordmark «MAX»: Inter 900, cap 50 → 75 px. It is the heaviest element in its shot.
  - Stacked under it, «ACADEMY»: Inter 600, cap 36 → 54 px; the baselines are 47 → 70 px apart.
  - A tiny tracked «Chemistry» (Inter 400, +0.6em, warm yellow) subtitles the Arabic name «استاذ منجد» about 3 px under its descenders.
- Latin glyphs never blur-type. They fade per letter in place, left to right, or reveal from the end of the word for the micro label.
- Arabic and Latin never share a line.

### 4.6 Tatweel / kashida and word-splitting rules
- Insert tatweel (U+0640) **after the first joining letter that has a joining successor** (هـــواي, افكـــار, بيهـــا, كدامـــك, بـــس). Count = round(kashida length / (0.10 × font size)); a 200-weight tatweel advances 0.10 em and a 700-weight one 0.11 em.
- Measured counts:

  | Word | Font size (720) | Tatweels | Kashida length (720) |
  |---|---|---|---|
  | هـــواي | 66 px | 6 | ≈40 px |
  | افكـــار | 66 px | 9 | ≈59 px |
  | بيهـــا | 66 px | 45 | ≈300 px |
  | كدامـــك | 75 px | 11 | ≈83 px |
  | بـــس | 82 px (Bold) | 6 | ≈54 px |
- Kashida mainly goes in **thin** words; the only bold exception is the one-word turn بـــس. Use it to equalise stacked widths, to make a thin line span its bold partner, or to draw a rule. Never use it to justify a paragraph.
- Tatweels are typed as separate units. They look dashed (about 3 px gaps) while the line builds, and the gaps close with the settle.
- Arabic letter splitting must keep joins intact: use ZWJ around split letters and keep lam-alef whole. The engine already does this.

## 5. Colour and grade

### 5.1 Palette
| Hex | Role | Where sampled |
|---|---|---|
| #7E3302 / #893B00 | backdrop hot spot (wide / MCU), beside the head | f450 (20,40); f547 (200,500) |
| #692501 / #541800 | backdrop mid / mid-dark | f576, f450 |
| #210601 / #1A0400 | backdrop top-right corner (near black) | f576 (660,60); f547 (705,40) |
| #AF6303 / #A65C04 | amber cyc floor band (wides, from 80% H) | f450 (360,1250) |
| #FFFFFF | default caption | everywhere |
| #FFF7F0 → #FFD130 → #FFDC92 | hook gradient (cream → peak gold → pale gold) | f75 glyph cores |
| #81590E → #4A2812 | hook amber glow halo (near → far) | f75 distance rings |
| #FAD01E / #FFF55C | hot-yellow reveal core / peak | f100-120 |
| #DAD530 (light #E4DD4B) | CTA ring + arrow (name tag) | f190 r=26-29 px around (597,924) |
| #FAD635 | CTA ring + arrow (final pill) | f700 |
| #E8DE5C | «Chemistry» micro caption (estimated) | f175-199 |
| #1B1D21 / #511B02 | button discs: near-black glass / maroon | f190 / f700 |
| #854219, #985936, #AE6D4C, #CBBEB9 | final CTA pill: orange frost, top highlight, bottom rim, frost over light trousers | f700 |
| #340C0C | dark CTA subtitle (median #4A322C) | f700 |
| rgba(255,255,255,.35-.60) | glass rims (lens stroke ≈ +78 luma ≈ 37%) | f190, f700 |
| #373438 / #5A575B / #2F2C30 | smoked pill on B&W / its rim / B&W backdrop | f500 |
| #B65B26, #D7793F, #A5490B, #8A3E14, #F5C9A0 | orange 3D face / lit / shade / side / bevel | f500 |
| #DAF8FE, #A6D0D4, #6E8285, #4E4C4D | chrome top / mid / low / descender | f700 |
| #6AF3F7 / #57CFD7 / #356A6A | cyan rim peak / median / halo | f700 |
| #01DDD6, #009898, #73ECF1 | flask liquid bright / deep / meniscus | f270 |
| #61C2C7, #73E8EB | teal fog | f270 |
| #6DB1B7, #83C5CF, #FFF6E6 | molecule glass / highlight / specular | f270 |
| #BE551B, #E8A55A, #FECEB0 | lab wall hot / glow / chalk formulas | f270 |
| #823C31, #1C0C07, #563425 | corridor back wall / ceiling / steam | f75 |
| #2B1610, #9A5532, #B66F43, #B3A4A1 | badge ribbon body / rim / rim bright / icon | f60-75 |
| #D7A67A | HUD panel lines | f75 |
| #652601, #3A1500, #090200 | clay UI card face / debossed label / buttons | f360-400 |
| #C89175, #2C3C40, #A0958F, #0F0A0C | skin cheek / teal shirt / cream trousers / hair | f576 |

Colour logic: a red-orange backdrop (hue 16-24°, HSV S median 251-253) against a teal wardrobe; teal/cyan is the only cold colour and is reserved for props and the payoff glow; lime-yellow appears only in UI buttons and the tiny Latin caption.

### 5.2 Grade recipe
Targets, measured by luma percentiles at p0.5 / p5 / p50 / p95 / p99.5:
- MCU f576: 2 / 13 / 51 / 164 / 189.
- Wide f450: 10 / 15 / 50 / 145 / 253; the 253 is the white text.
- Highlights roll off softly: skin peaks at about #CB967B and trousers at #B3A9A4. Only the graphics clip.

Vignette (centre luma vs edge luma):
- Studio MCU: about 87-105 vs 29-34.
- Corridor plate: 83 vs 12.
- Bright lab plate: about 103 vs 93, effectively **none**.

ffmpeg starting point, for the talent and a real backdrop only:
```
eq=contrast=1.12:brightness=-0.035:saturation=1.08,
curves=master='0/0 0.06/0.01 0.25/0.17 0.5/0.45 0.75/0.70 1/0.86',
colorbalance=rs=0.06:bs=-0.06:rm=0.03:bm=-0.03,
vignette=angle=PI/3.6:x0=w*0.42:y0=h*0.36
```
- Saturate the **backdrop**, not the skin. With background replacement the CSS cyc already carries the saturation and the falloff, so the talent only needs the curve and a warm shift: engine `grade.css` = `contrast(1.10) brightness(0.95) saturate(1.06)`.
- Add a top-right corner shade: `linear-gradient(225deg, rgba(10,1,0,.55) 0%, transparent 42%)`, multiply.
- Captions are never graded or vignetted.

## 6. Backgrounds and sets

| Set | When | How it was made | How to fake it for new footage |
|---|---|---|---|
| **Orange cyc, wide** | shots 5 and 7 | real seamless cyc with an amber floor hot spot | `bg-replace` with `backgrounds.studioWide.gradient` (fitted to f450, mean error 5.0/255 per channel): hot top-left, mid-right spill, dark top-right and lower-left, amber floor from 80.5% H |
| **Orange backdrop, MCU** | shots 2, 4 and 6 | real backdrop, about 2.35x digital crop of the wide | `backgrounds.studioMcu.gradient` (fitted to f547, error 5.7): hot spot at (28%, 42%), near-black top-right |
| **Lab corridor** (world plate A) | shot 1 | AI plate; the talent is keyed and composited in; animated steam | AI plate prompt in `style.json → backgrounds.labCorridorPlate`; 2 px blur; steam via AI video or `particles` (warm, slow rise); HUD panels baked in |
| **Bright lab wall** (world plate B) | shot 3 | AI plate (formulas are pseudo-text) | prompt in `backgrounds.labWallPlate`; **no vignette**; luma median about 125; teal fog and flask as *foreground* layers |
| **B&W interrupt** | in shot 5, f464-501 | adjustment layer over everything | `bw-focus-interrupt` (see 8.4) |

Haze and particles: steam columns (#4A2310-#563425) rise slowly, under 0.5 Hz, in the corridor. Teal fog (#61C2C7-#73E8EB, 40-70%) rolls over the floor in plate B. Studio shots have no haze, particles or global bloom.

Depth stack on world plates, from back to front:
plate → behind-talent graphics (ribbon back arc, molecule, clay card) → **talent** → foreground props (ribbon front arc blurred 13.5 px, flask, fog) → captions and glass.

## 7. Graphic component library
Dimensions are given at 720 → **1080**. Unless stated otherwise, every component sits **in front of the talent** (layer `front`).

| id | Purpose | Construction | Colours |
|---|---|---|---|
| `glass-ring-pop` | opener of the turn/brand beat | torus Ø 103 → **155** (top-left, centre (17.9%, 15.4%)) and Ø 130 → **195** (bottom-right, centre (72.2%, 72.3%), over the hand); band 20 → 30 px; fill white 15-25% + 4.5 px backdrop blur; inner and outer rims 1.5 px white 60%, top-left arc brighter | white |
| `nametag-capsule` | name/discipline tag + CTA | outer stadium 568×118 → **852×177**, r = h/2, fill white 8% + 6 px blur, rim 1.5 px white 40% (top 65%); smoked inner field 374×87 → **561×130**, r 65, black 30%, 27 px left inset; button 92 px from the right edge; centre (51.9%, 72.3%) | rim #FFFFFF 40%, inner black 30% |
| `echo-capsule` | decorative duplicate | the same tag at 0.9-1.0x, blur 3 → 4.5 px, cropped by the left frame edge, centre y 15.4%, truncated «اسـ», ↖ button drifts +56 → **84 px** | as above |
| `cta-button` | arrow button in every capsule | name-tag variant: dark disc Ø 82 → **123** (#1B1D21, 85%), 1.5 px white rim, outer glass ring Ø 135, lime ring Ø 56 → **84**, stroke 3 → **4.5** px #DAD530, ↖ arrow 26 → 39 px long, 5 px stroke, round caps. Final variant: maroon disc Ø 50 → **75** #511B02, glass ring #A97354, yellow ring Ø 38 → **57** #FAD635, ↗ | #1B1D21, #DAD530, #511B02, #FAD635 |
| `glass-pill-clear` | backing for a key line | brand 486×160 → **729×240**, r 120, centre (51.7%, 59.1%); chest 394×126 → **591×189**, r 94.5, centre (50%, 63.3%); near-clear fill (white ≤3%) + 4-6 → **7.5 px** backdrop blur; rim 1.5 px white 35% (top 55%); no drop shadow | rim white |
| `smoked-pill-autosize` | contrast line on B&W | h 122 → **183**, r 91.5, final w 383 → **575** (text width + 82 px each side); black 30%, rim 1.5 px white 15%, brighter top-left; **width follows the typed text**, growing symmetrically | #373438, #5A575B |
| `lens-disc-slide` | detail beat, bottom-right | circle r 324-338 → **486-507** (it grows), centre from (632,1259) to (602,1254) at 720 → (87.9%, 98.4%) to (83.7%, 98.0%); rim 1.5-2 → 2.5 px white 70-80% (#CCBFB7 over the trousers); interior magnifies 1.15-1.25x with 4-6 → 7.5 px blur, no tint | rim near-white |
| `lens-ring-pair` | closing shot frame | two circles r 285.7 → **428.5**, centres top-left (18.6,272.4) → **(28,409)** = (2.6%, 21.3%) and bottom-right (724.6,1026.2) → **(1087,1539)** = (100.6%, 80.2%); stroke 2-3 → 3.5 px white 37%; the interior displaces earlier text 20-30 px left and 60-70 px up (720) and blurs it about 3 px; above old captions, below the payoff word | #876357 on dark bg |
| `glass-bead-capsule` | final CTA | bead Ø 79 → **119** at (38.6%, 54.9%), magnifies 1.25x, 2 px white 70% rim → capsule 327×73 → **491×110**, r 55, centre (48.5%, 55%); orange frosted (#854219 over the backdrop, #CBBEB9 over light wardrobe), top highlight #985936, bottom rim glow #AE6D4C; button on the **left** | see palette |
| `badge-ribbon` | hook depth sandwich (asset) | curved band 230 → **345** px tall; capsule badges 110×170 → **165×255** (back) and 200×330 → **300×495** (front); rim gradient #9A5532→#B66F43; cream line icons; back arc (x 0-35%, y 36-55%) is **behind the arm** with 3 px blur; front arc (y 70-100%) is in front of the legs with **13.5 px** blur | #2B1610, #49231F |
| `glass-molecule` | method-plate prop (asset) | 210×220 → **315×330** at x 2.8-32%, y 14.8-30.5%; droplet atoms with cyan liquid, glass rods, 12 px cyan glow; receives the kashida rule; does not overlap the talent | #6DB1B7, #83C5CF |
| `foreground-flask-fog` | method-plate depth (asset) | flask x 0-555, y 885-1920 (1080), glass mostly clear so the leg shows through; liquid surface at y 1418; fog in the lower-right at 40-70% | #01DDD6, #009898, #61C2C7 |
| `clay-ui-card` | MCU topic card (asset) | tone-on-tone orange card at x 70-100%, y 11.7-35%, yaw about 32°, radius 33, extrusion 20 px, debossed label 36 px, two dark chips 210×68, blur 3 px; **behind the talent** | #652601, #3A1500, #090200 |
| `hud-panels` | corridor detail (in plate) | rounded rects 225×150 to 285×195, 1.5-2 px #D7A67A at 55%, blur 3 px | #D7A67A |

Kashida rule: «بيهـــا» is part of the glyph run, 45 tatweels, 4 → 6 px thick, ending at the molecule. It is not a separate shape.

## 8. Motion vocabulary
Easing shorthands:
- **linear** = cubic-bezier(0,0,1,1);
- **expo-out** = cubic-bezier(0.16,1,0.3,1);
- **std** = cubic-bezier(0.4,0,0.2,1);
- **soft-out** = cubic-bezier(0.2,0.7,0.3,1);
- **back** = cubic-bezier(0.34,1.56,0.64,1);
- **settle** = cubic-bezier(0.25,0,0.1,1).

### 8.1 Text presets
| id | Unit | IN (from → to) | IN duration | Stagger | Easing | Hold | OUT |
|---|---|---|---|---|---|---|---|
| `ember-type` | letter, reflow, centred | opacity 0→1, blur 12→0, letter-spacing −0.45em→+0.03em | 4 f / 133 ms | 0.74 f / 25 ms (1.35 glyphs/f) | linear; settle 13 f / 433 ms soft-out (0.03em→0) | 66 f / 2.2 s | hard cut |
| `ember-words` | word, right-anchored | opacity 0→1, blur 9→0 | 10 f / 333 ms | 3 f / 100 ms | linear | ≈51 f | cut |
| `blur-type` | letter, reflow | opacity 0→1, blur 12→0, ls −0.5em→+0.03em | 5 f / 167 ms | 1.5 f / 50 ms (0.7-2 f) | linear; settle 12 f / 400 ms | 45-95 f / 1.5-3.2 s | cut |
| `blur-type-thin` | letter, reflow | opacity 0→1, blur 9→0, ls −0.5em→+0.03em | 3 f / 100 ms | 1.5 f / 50 ms (1.2-2 f) | linear; tatweels dashed until the settle | 50-85 f | cut |
| `glyph-pop` | letter, right-anchored | scale 0.19→1, y −33→0, origin baseline-right | 9 f / 300 ms | 7 f / 233 ms | expo-out (per-frame increments ×0.78) | 94 f | 1-frame pull-back, cut |
| ↳ lockup drift | whole lockup | y 0→+33 px (22 at 720) | 13 f / 433 ms | – | soft-out | – | – |
| `lockup-thin` | letter | opacity 0→1, blur 6→0 | 3 f / 100 ms | 1.5 f / 50 ms | linear; starts +9 f after the giant word | 2.8 s | cut |
| `kashida-rule-word` | whole word | opacity 0.25→1, blur 9→0 (full length visible at once; **not** a draw-on) | 7 f / 233 ms | – | soft-out | 2.8 s | cut |
| `glow-sweep` | letter (tatweels included) | IN: opacity 0→1, blur 12→0 while the unit is already #FAD01E with its full halo; COOL: #FAD01E→#FFF, halo 100%→0, starting as each unit lands | IN 4 f / 133 ms; COOL 10 f / 333 ms | 2 f / 67 ms (ب → س = 14 f) | IN linear; COOL ease-in (hot held ~8 f) | 2.6 s | cut |
| `latin-letter-fade` (MAX) | letter, L→R | opacity 0→1 (grey mid-fade) | 8.5 f / 283 ms | 8 f / 267 ms | linear | 1.5 s | cut |
| `latin-letter-fade-fast` (ACADEMY) | letter | opacity 0→1 | 3.5 f / 117 ms | 3.5 f / 117 ms; starts 12 f after MAX | linear | 1.0 s | cut |
| `micro-tracked-reverse` | letter, **from the end** | opacity 0→1 | 4 f / 133 ms | 4 f / 133 ms | linear | 1.0 s | cut |
| `wipe-reveal-reverse` | whole line | clip L→R (against Arabic reading order), 15 px feather | 24 f / 800 ms | – | linear | 1.7 s | cut |
| `pill-type` | letter, reflow | as `blur-type` | 4 f / 133 ms | 1.2 f / 40 ms; starts 2 f after the pill lands | linear | 1.5 s | cut |
| `pill-type-thin` | letter | as `blur-type-thin` | 4 f / 133 ms | 2 f / 67 ms | linear | 1.3 s | cut |
| `pill-sweep` | letter | opacity 0→1, no blur (soft R→L sweep) | 11 f / 367 ms | 0.36 f / 12 ms; line 2 +10 f | linear | 2.5 s | none |
| `ink-up` | letter, right-anchored, no drift | opacity 0→1, blur 9→0, brightness 0.4→1 | 8 f / 267 ms | 1 f / 33 ms | linear | 31 f | **reverse type-off**: from the end, 2 f / 67 ms per glyph, 3 f each → about 20 f / 667 ms for 10 glyphs; both lines together |
| `ink-up-thin` | letter | opacity 0→1, blur 6→0 | 4 f / 133 ms | 1.5 f / 50 ms | linear | – | reverse type-off |
| `orange-3d-type` | letter, reflow | opacity 0→1, blur 12→0, ls −0.5em→0 | 5 f / 167 ms | 2.4 f / 80 ms (17 f total) | linear | 3 f | the hard cut releases the interrupt |
| `hero-glow-reveal` | letter | opacity 0→1; glow bloom 0→1 delayed 7 f over 10 f | 11 f / 367 ms | 1.5 f / 50 ms (21 f / 700 ms total) | linear; bloom soft-out | 38 f / 1.27 s to the end | none |

Reflow mechanics: the reference is an AE-style typewriter whose text box reflows on every character. The negative-letter-spacing trick in the presets approximates it: a glyph that has not yet appeared collapses its own advance. Justification sets the drift:
- **centre**: the string slides toward the reading start by half a glyph advance per glyph. Hook L1 right edge +276 px (720); حتى تشوف +113 px.
- **left-anchored**: pushed by a full advance. الكيمياء كدامـــك +422 px.
- **right-anchored**: no drift. Hook L2, ولهذا طلاب.

Seen once, optional: «كل فكرة» also rose 44 → 66 px over f318-330 (12 f / 400 ms, soft-out) while typing.

### 8.2 Graphic presets
| Component | IN | Loop / hold | OUT |
|---|---|---|---|
| `glass-ring-pop` | scale keyframes at f0/2/4/6/8/13/18/22 = .117/.476/.903/1.058/**1.087**/.903/.99/1.0 (22 f / 733 ms ≈ `elastic.out(1,0.5)`); starts 2 f after the cut; second ring +2 f | – | morphs into a capsule |
| ring → capsule | the hole elongates into a stadium. Bottom-right: left edge travels 366 → **549** px in 16 f / 533 ms (std). Top-left: off-screen in 6 f / 200 ms | – | – |
| `cta-button` | scale 0→1, 7 f / 233 ms, back easing; 6 f after the stretch starts | echo button drifts +84 px over 72 f, soft-out | with the parent |
| `glass-pill-clear` | scaleX 0.6→1 + opacity 0→1, 4.5 f / 150 ms (chest pill: 4 f / 133 ms), cubic-bezier(0.2,0.8,0.2,1); its text starts 2 f after it lands | static | cut |
| `smoked-pill-autosize` | appears 3 f / 100 ms at 250 → 375 px wide, 7 f after the interrupt starts; width tracks the text and reaches full size 15 f / 500 ms later | static | cut |
| `lens-disc-slide` | ≈200 → 300 px up-left from off-screen, 11 f / 367 ms expo-out; starts 10 f after the hero line | drift dx −0.41 → **−0.62 px/f**, r +0.19 → **+0.29 px/f**, linear until the cut | cut |
| `lens-ring-pair` | slide from centre x −119 → −6 (720) while r goes 219 → 274 (scale 0.77 → 0.96), 12 f / 400 ms expo-out, f598-610 | linear tail f616-648 (+0.65 → 1.0 px/f in x, +0.31 → 0.47 px/f in r), then **static** for the last 69 f | none |
| `glass-bead-capsule` | bead Ø 8 → 79 (720) in 4 f / 133 ms with back easing; 6 f hold; stretch rightward 79 → 327 (720) over 22 f / 733 ms std; orange tint over 6 f / 200 ms at +10 f; button pop over 10 f / 333 ms at +12 f; line 1 at +33 f; line 2 at +43 f | static | none |
| `badge-ribbon` | back slab swings open from edge-on (at 26.3% W) over 14 f / 467 ms, soft-out, from f6; front band rises 12 f / 400 ms from f8; outlines fade to 40% in 4 f (f24); icons fade 6 f each, 2.5 f stagger, nearest first (f30-46) | moves with the composite wobble | cut |
| `clay-ui-card` | rotateY 80° → 0 over 24 f / 800 ms, soft-out; label types over 25 f; chips appear at f350-360 | chips vanish at f394; the card swings toward camera ×1.4 over 14 f before the cut | cut |
| `glass-molecule` | cuts in with the plate | rotates **6.9°/s** clockwise + slight float | cut |
| fog / steam | with the plate | slow evolution, under 0.5 Hz | cut |

### 8.3 Camera moves
| id | Scale | Duration | Easing | Trigger |
|---|---|---|---|---|
| `punch-out-settle` | **1.38 → 1.00** (measured 138.2 / 138.0 / 137.4 / 139.1%), held for 2 f first | 2 f hold + 17 f / 67 ms + 567 ms | settle; peak step ×0.939 at f4→5; light directional blur on the 2-3 fastest frames | first frame of each new beat shot (shots 1, 3, 4, 5); anchored on the face (≈49-57% W, 28-30% H); **plate and talent only, captions are not scaled** |
| `mcu-digital-punch` | static **2.35** (measured 2.27-2.47) | 0 | – | MCU shots made from a wide take |
| `mcu-punch-settle` | 3.23 → 2.35 | 2 f hold + 17 f | settle | an MCU beat shot made from a wide take (≥4K source only) |
| `precut-pullback` | 1.00 → **0.961** for the whole composite, captions included; y +26 px | 1 f / 33 ms, stepped | – | last frame before a zoom-through (used once, f306) |
| `plate-wobble` | handheld ±5-10 px (±3-7 at 720), period about 1.5 s | continuous | sine | AI world-plate shots only; applies to the **whole composite including captions** |
| studio | locked off | – | – | shots 2, 6 and 7 stay within 0.993-1.011 scale |

### 8.4 Transitions
| id | Duration | Parameters |
|---|---|---|
| `hard-cut` (default) | 0 | placed in a VO pause 0-9 f / 0-300 ms before the next phrase (all 6 reference cuts sit in pauses, including the 150 ms dip at 19.367 s); every caption drops on the cut; **no SFX** |
| `cut-punch-settle` | 19 f / 633 ms | the cut plus `punch-out-settle`; the first overlay lands 1-6 f after the cut, so captions build while the plate is still settling |
| `zoom-through` | about 20 f / 667 ms | 1 f at 96.1% → cut → next shot starts at 137.4% and settles (an effective ×1.43 jump) |
| `bw-focus-interrupt` | 8 f / 267 ms ramp | blur 0 → **13.5 px** (σ 9 at 720), linear, about 1 px/f (720), f464-472; desaturate HSV S 211 → 22, linear over 6 f / 200 ms starting 2-3 f after the blur, to cool-neutral greys (#3E3C3F / #2A282C: G lowest, B ≥ R). As a colour-matrix saturation that is **0.02** with Rec.601 luma weights (CSS `saturate(0.1)` leaves S ≈ 50 and a warm cast on the cyc); **no luma change**; applies to the plate, the talent **and all earlier captions** (they become grey ghosts); leads its phrase by 5 f / 167 ms; holds 30 f / 1 s; **released by a hard cut** with no ramp back |
| not used | – | whip pan, flash frame, dissolve, light leak, glitch, speed ramp, match cut |

## 9. Edit rhythm and narrative template
Reference: shot lengths 88 / 112 / 107 / 104 / 91 / 79 / 137 f; ASL 3.42 s (σ ≈ 18 f); 2.93 shots/10 s; text on screen 86% of frames.

| # | Beat | Reference time (frames) | Share | Shot / background | Text | Graphics | Camera |
|---|---|---|---|---|---|---|---|
| 1 | **Hook / problem** | 0.00-2.93 (0-87) | 12% | wide, world plate A | `ember-type` + `ember-words` (2 lines, gold) | badge ribbon sandwich | punch-out settle |
| 2 | **Turn + brand** | 2.93-6.67 (88-199) | 16% | MCU studio | `glow-sweep` turn word, brand lockup, name tag | rings → capsules, brand pill, CTA button, echo capsule | static 2.35x |
| 3 | **Method** | 6.67-10.23 (200-306) | 15% | wide, world plate B | `glyph-pop` giant word + `lockup-thin` ×2 + `kashida-rule-word` | molecule, flask, fog | settle → pre-cut pull-back |
| 4 | **Detail** | 10.23-13.70 (307-410) | 14.5% | MCU studio | `blur-type` / `blur-type-thin` / `pill-type` / `pill-type-thin` (4 lines) | lens disc, chest pill, clay card | zoom-through settle |
| 5 | **Benefit** | 13.70-15.43 (411-463) | 7% | wide studio | `blur-type` (`heroWide`) + `blur-type-thin` (`supportWide`) | – | settle |
| 6 | **Contrast interrupt** | 15.43-16.73 (464-501) | 5% | same shot, B&W | smoked pill + `pill-type` + `orange-3d-type` | `bw-focus-interrupt` | – |
| 7 | **Breather** | 16.73-19.37 (502-580) | 11% | MCU studio, **no graphics** (80 f / 2.67 s) | – | – | static |
| 8 | **Proof + payoff** | 19.37-23.93 (581-717) | 19% | wide studio, locked off | `ink-up` + `ink-up-thin` → reverse type-off → `pill-sweep` ×2 → `hero-glow-reveal` | lens ring pair, bead → CTA capsule | static; 38 f end hold |

Scaling the template:
- **~25 s**: use it as is.
- **30-40 s**: repeat beats 3-4 once with a different world plate or studio, and keep the ASL at 3.0-3.7 s. Keep exactly one interrupt, one breather and one payoff, and keep the payoff shot at 4.6 s or less.
- **< 20 s**: drop beat 5 and merge beats 3 and 4 into a single MCU.

Inside every shot:
1. The first overlay lands 1-6 f after the cut.
2. The whole caption stack completes 0.5-1.2 s into the shot.
3. Nothing moves until the cut, apart from slow drifts. Mean caption hold is 1.75 s (median 1.67 s).

## 10. Audio and SFX
| Event | Sound | Timing |
|---|---|---|
| bed | light stepping bass/pluck ostinato, **112.3 BPM**, about 15-18 dB under the voice (gap RMS −33 to −37 dBFS vs speech median −16), **no ducking**, no hits, drops or swells | continuous |
| voice | dry, close-mic, compressed (10 ms RMS IQR −27.7 to −15.7 dBFS) | – |
| cuts, punch-ins, ring pops, pills, interrupt, lens rings | **nothing** | – |
| lens disc slide (detail beat) | optional `ping8k` pair: about 8.36 kHz sine, 60 ms, exponential decay, about −24 dB | −267 ms and +67 ms from the disc start |
| orange 3D word build | `ping8k` pair | +217 ms and +517 ms from the build start |
| payoff word reveal | `ping8k` pair | −173 ms and +127 ms from the reveal start |

Rule: everything syncs to **speech**, not beats. The mean offset of overlay events from the beat (130 ms) is the same as chance. Caption entrances land within −8 to +7 f of phrase onsets, and within ±1-2 f at shot starts. The ping pairs come from the spectrogram only and need a listening check. In the engine `audio.py` uses `tick` as a stand-in (`sfx[].idealSound`).

## 11. Layout and safe zones (1080×1920; percentages are identical at 720×1280)
```
 WIDE (full body)                              MCU (chest up, 2.35x crop)
 +------------------------------------+        +------------------------------------+
 |  ( TL lens ring centre 2.6%,21.3%) |  0%    |      echo capsule y 15.4% (cropped)|
 |------------------------------------|  9.2%  |------------------------------------|
 |  TOP BAND  y 9.2-26.5%             |        |     hair / head top 17-20%         |
 |  hero  @ (52.2%, 15.3%)            |        |  ##### FACE 17-40% : NO TEXT ##### |
 |  thin  @ (51.9%, 23.7%)            |        |     eye line 30-31%                |
 |  giant lockup: right edge 76.5%    |        |     chin 39%                       |
 |------------------------------------| 26.5%  |------------------------------------| 46%
 |  ##### FACE 27-38% : NO TEXT ##### |        |  CHEST BAND y 46-77% (dark shirt)  |
 |                                    |        |  hero  @ (52.4%, 50.4%)            |
 |  CTA capsule (48.5%, 55%)  waist   |        |  thin  @ (50.3%, 55.3%)            |
 |  y 52-58%, x 25.8-71.3%            |        |  pill  @ (50%, 63.3%) 591x189      |
 |                                    |        |  name tag @ (51.9%, 72.3%) 852x177 |
 |------------------------------------| 77%    |------------------------------------| 77%
 |  no text (platform UI)  floor band |        |  no text                           |
 |      (BR lens ring centre 100.6%,80.2%)     |                                    |
 +------------------------------------+ 100%   +------------------------------------+
   x safe: left 15.3%, right 11.5% (text 15.3-88.5% W); block centres x≈52% (RTL right bias)
```
- Talent in wides: head top 27-28% H, feet 93-96% H, body axis 48.6-52.1% W, figure about 68% H.
- B&W slots: smoked pill at (49.9%, 50.1%), accent word at (50.6%, 60.2%).
- Payoff word at (49.9%, 20.5%).
- Hook lines: L1 (52.0%, 17.2%); L2 right-anchored at 79.0% W, y 22.4%.

## 12. Do / Don't
**Do**
- Use Plex 700 for heroes and Plex 200 for support lines, at a 1.5-1.9× size ratio.
- Default to flat #FFFFFF.
- Give each section one special-material word.
- Type every caption glyph by glyph out of a blur, with reflow and a tracking settle.
- Stretch thin words with repeated tatweel; let one kashida become a rule.
- Keep text in the top band for wides and on the chest band for MCUs.
- Put glass UI in front of the talent, with hands visible through it. Every capsule gets a round arrow button.
- Open each beat with the 138%→100% settle.
- Alternate wide/MCU and world plate/studio.
- Cut only in pauses.
- Run one B&W interrupt, then a 2.7 s clean breather.
- End on a 1.27 s static hold of the payoff.

**Don't**
- No Arabic 400-600, no strokes, no drop shadows on studio captions, no two accents in one shot.
- No text on the face or below 77% H.
- No animated exits, except the reverse type-off inside the static closing shot.
- No whooshes, impacts, flashes, leaks, glitches, dissolves, whip pans or speed ramps.
- No beat-sync.
- No vignette on bright plates or on captions.
- Nothing looping faster than about 0.5 Hz.
- Don't scale captions with the settle.
- No logo card and no fade to black.
- No blue or purple.

## 13. Applying this style to new footage: checklist
**What the source footage needs**
1. Vertical 9:16, 30 fps (conform 25 fps). **4K (2160×3840) strongly preferred**, because the MCUs are 2.35× digital crops of the wide (the reference itself was soft on the MCUs). With 1080 sources, shoot the wide and the MCU as separate takes or with two cameras.
2. Full-body wide framing: head top about 27% H, feet about 94% H, presenter centred. MCU framing: eyes at 30% H, shoulders filling the width.
3. A plain, evenly lit backdrop: orange paper is ideal, but any plain wall works because it gets replaced. Leave 1-2 m to the wall, use a soft frontal key, and have no hard backlight.
4. Wardrobe: a **dark teal or bottle-green shirt**, which acts as the caption card in MCUs, and light cream trousers. Avoid orange, red or white tops and busy patterns.
5. Delivery in short phrases with clear pauses of at least 150 ms, with hands resting near the waist or chest, where the glass pills will sit.
6. An SRT, or a script for `srt2scene.py`.

**Steps**
1. `prepare.py` → frames, person mattes, face track, `speech.json`.
2. Split the script into the 8 beats in section 9. Mark:
   - the 2-line hook;
   - the one-word turn (e.g. «بس»);
   - the giant method word;
   - the 4-line detail card;
   - the benefit pair;
   - the "not just X" contrast plus its accent word;
   - the proof line;
   - the 2-line CTA;
   - the one-word payoff.
3. Shot list: alternate W/MCU and assign world plates to beats 1 and 3. For MCUs cut from the wide, add a `mcu-digital-punch` (2.35) camera cue on the cut.
4. Backgrounds:
   - Studio shots: `bg-replace` with `backgrounds.studioWide.gradient` or `backgrounds.studioMcu.gradient`.
   - World shots: generate the two AI plates from the prompts in style.json, plus PNG props with alpha (flask, molecule, badge ribbon front and back). Ribbon back → `behind`; flask, fog and ribbon front → `front`.
   - Add a steam/fog `particles` layer with slow drift.
5. Camera: `punch-out-settle` on beats 1, 3, 4 and 5. One `zoom-through` (beat 3 → 4). `plate-wobble` on world shots only.
6. Captions: use the presets and zone slots in section 11; one special material per beat; tatweel counts from the formula in 4.6; at most 3 words per line.
7. Glass components: rings → name tag in beat 2, chest pill and lens disc in beat 4, smoked pill in beat 6, lens rings and bead → CTA capsule in beat 8. These ids need a `styles/style-1/components.js`; the shared `glass-pill` can stand in.
8. Interrupt: `bw-focus-interrupt` about 5 f before the contrast phrase, then a hard cut into the clean breather MCU (2.5-3 s, zero overlays).
9. Payoff: ink-up title → reverse type-off → CTA lines → chrome payoff word, then a 38 f static hold.
10. Grade: `grade.css` on the talent only; mild vignette plus the top-right shade; no vignette on bright plates.
11. Audio: VO plus a 110-115 BPM light bed at about −17 dB under the voice, no ducking; optional ping pairs; no whooshes.
12. QA stills at each cut +20 f and at each payoff:
    - the face is clear;
    - text stays inside the safe zones;
    - one accent per beat;
    - cuts fall in pauses;
    - the captions themselves are not zoomed by the settle;
    - the end hold is there.

## 14. Annotated reference timeline (condensed)
| Time (s) | Frames | Shot | Event |
|---|---|---|---|
| 0.000 | 0-1 | S1 wide, corridor plate | opens at 138.2%; 2 f hold |
| 0.067-0.600 | 2-18 | S1 | punch-out settle to 100% (17 f), anchored on the face (353,356) |
| 0.133-0.700 | 4-21 | S1 | hook L1 `ember-type` (≈23 glyphs, 1.35/f); width settle f21-33 (403 → 376 px) |
| 0.200-1.533 | 6-46 | S1 | badge ribbon: back slab swings open (f6-20), front band rises (f8-20), outlines (f24-28), icons (f30-46) |
| 0.767-1.100 | 23-33 | S1 | hook L2 `ember-words`, right-anchored, 3 f/word |
| 1.33-2.90 | 40-87 | S1 | hold; whole-composite wobble ±3-8 px; steam animates |
| **2.933** | 88 | **cut → S2 MCU** | in a pause, 3 f before the phrase; the hands change pose (not a match cut) |
| 3.000-3.733 | 90-112 | S2 | two glass rings spring-pop (peak 112 px at f98, dip f102-104) |
| 3.267-4.133 | 98-124 | S2 | «بـــس» `glow-sweep` (ب yellow f98-108, س yellow f112-122) |
| 3.400-3.533 | 102-106 | S2 | brand pill pops (486×160 at 720) |
| 3.633-4.067 | 109-122 | S2 | TL ring → capsule off-screen (f109-114), arrow pops (f116-122); BR ring → name tag (f110-126) |
| 4.200-5.000 | 126-150 | S2 | «استاذ منجد» reverse wipe (د → جد → منجد ...) |
| 4.367-5.533 | 131-166 | S2 | MAX (8 f stagger) · Chemistry (reverse, f134-170) · ACADEMY (3.5 f stagger, f144-170) |
| 5.67-6.63 | 170-199 | S2 | hold; echo button drifts +56 px (720) |
| **6.667** | 200 | **cut → S3 wide, bright lab plate** | luma 85 → 121 |
| 6.700-7.233 | 201-217 | S3 | punch-out settle; «لأن» `glyph-pop` (f201-210, ن f208-212); lockup drifts +22 px (720) f208-221 |
| 7.000-7.400 | 210-222 | S3 | «هـــواي / افكـــار» thin type-on; «بيهـــا» blur-fade with its 300 px kashida rule (f214-221) |
| 7.4-10.2 | 222-305 | S3 | hold; molecule rotates 16° (f230-300); fog evolves; composite wobble ±4 px |
| 10.200 | 306 | S3 | 1-frame pull-back of the whole composite to 96.1%, +15-20 px down (720) |
| **10.233** | 307 | **cut → S4 MCU** | starts at 137.4%, settles over f308-324; clay card swings in (f308-332) |
| 10.433-10.833 | 313-325 | S4 | «كل فكرة» `blur-type` (+44 px rise f318-330, width settle f325-337) |
| 10.767-11.233 | 323-337 | S4 | lens disc slides in, expo-out; drifts until the cut; ping at 10.50 / 10.83 s |
| 11.000-11.500 | 330-345 | S4 | «يقربها للطالب» thin |
| 11.400-11.533 | 342-346 | S4 | chest pill pops |
| 11.600-12.067 | 348-362 | S4 | «باقوى التجارب» `pill-type` |
| 12.200-12.833 | 366-385 | S4 | «التفاعلية» `pill-type-thin` |
| 13.13-13.67 | 394-410 | S4 | card chips vanish; the card swings toward camera ×1.4 |
| **13.700** | 411 | **cut → S5 wide studio** | starts at 139.1%, settles over f412-428 |
| 13.767-14.367 | 413-431 | S5 | «حتى تشوف» `blur-type` (centre drift +113 px; settle f432-447) |
| 14.467-15.000 | 434-450 | S5 | «الكيمياء كدامـــك» thin, left-anchored push (+422 px); tatweels dashed → solid by f460 |
| 15.467-15.733 | 464-472 | S5 | **B&W focus pull**: blur σ 0 → 9 (720), desaturate f466-472 |
| 15.700-16.200 | 471-486 | S5 | smoked pill grows with «مو بس تقراها» |
| 16.033-16.600 | 481-498 | S5 | «بالكتاب» orange 3D type-on, emerging under the pill; pings at 16.25 / 16.6 s |
| **16.733** | 502 | **cut → S6 MCU (colour)** | saturation 21 → 165; every overlay drops |
| 16.733-19.333 | 502-580 | S6 | **clean breather**, 80 f |
| **19.367** | 581 | **cut → S7 wide, locked off** | in a 150 ms dip |
| 19.400-19.933 | 582-598 | S7 | «ولهذا طلاب» `ink-up`, right-anchored |
| 19.933-20.267 | 598-610 | S7 | lens ring pair slides in (expo-out); linear tail to f648, then static |
| 19.933-20.067 | 598-602 | S7 | glass bead pops on the waist |
| 20.067-20.600 | 602-618 | S7 | «الاستاذ منجد جبار» thin; its left end refracted inside the TL ring |
| 20.267-21.000 | 608-630 | S7 | bead stretches into the orange CTA capsule; tint (f618-624); ↗ button (f620-630) |
| 20.900-21.667 | 627-650 | S7 | title + sub-line **reverse type-off** |
| 21.367-22.067 | 641-662 | S7 | «دائما يحققون» / «نتائج ودرجات» `pill-sweep` |
| 21.933-22.633 | 658-679 | S7 | «ممتازه» `hero-glow-reveal`, bloom to f675; pings at 21.76 / 22.06 s |
| 22.667-23.933 | 680-717 | S7 | static end hold, 38 f; VO ends at 23.70 s; no outro |

## 15. Corrections and residual uncertainty
Values re-measured in this pass, which supersede the look and motion reports:
- «بـــس»: 82 px (720) with 6 tatweels; bbox y 622-674, not 96 px.
- «التفاعلية»: 146 px wide at 50 px (720); the earlier 230 px bbox included the hand.
- «الكيمياء كدامـــك»: 75 px with 11 tatweels; the alef measures 55-56 px.
- Lockup thin words: 66 px; alef 47-52 px.
- Hook: 43 px (fitted by width); gradient stops re-sampled from glyph cores.
- Verifier corrections adopted:
  - static gradient, with no per-glyph gold flash;
  - opaque thin lines;
  - blur σ 9, not darkened;
  - kashida as a whole-word fade, not a draw-on;
  - pill sizes 486×160 and 383×122, with an autosizing smoked pill;
  - lens disc r 324-338;
  - rings static after f648;
  - MCU crop 2.27-2.47×;
  - ribbon back arc behind the arm;
  - animated plates (molecule 6.9°/s);
  - no vignette on plate B;
  - «جبار» confirmed;
  - «Chemistry» cap 13-14 px.

Still uncertain:
1. Hook size: the alef height suggests about 47 px against a width fit of 43 px (±8%).
2. 200 vs 300 weight for the 75 px thin line.
3. «Chemistry» colour.
4. «الاستاذ منجد جبار» size.
5. The ping SFX (spectrogram only).
6. The lens disc's off-screen start point and the ribbon geometry.
7. The amount of backdrop blur on the pills (compression).
8. Whether the plates are AI video or 3D renders.
9. Whether Chromium honours `letter-spacing` on cursive Arabic. If it does not, animate `margin-inline-end` on the letter spans instead.

## 16. Renderer compatibility
- `style.json` follows the shape the engine's `compositor/runtime.js` reads (`fonts[].role/fontsource/weight/sizePx/fill.gradient/effects.glow`, `textPresets[].in/hold/out/style/position/layer`, `cameraMoves[]`, `grade.css`, `overlays`, `sfx[]` with `event/preset/sound/offsetMs/gainDb`, `director`). Extra keys are descriptive and are ignored by the current runtime: `settle`, `reflow`, `delayMs`, `staggerFrom` on `out`, `glowBloom`, `extrusion`, `rimLight` and `graphicComponents`.
- Smoke test, using `renders/test_plate` and `scratch_style/smoke_scene.json`:
  - It rendered `ember-type`, `ember-words`, `blur-type`, `blur-type-thin` (11 tatweels), `glow-sweep` and `orange-3d-type` with the Plex fonts and the studioWide gradient. See `scratch_style/smoke_sheet.jpg`.
  - Effects not yet drawn: the extrusion, the chrome rim and the ping SFX. All graphic components also still need a style `components.js`. *(Superseded: `components.js` now draws the extrusion, chrome rim and bloom and every component; the ping is still the `tick` stand-in. See "Engine implementation" below.)*

## Engine implementation

`styles/style-1/components.js` is loaded automatically by `engine/render.mjs` (after `components-shared.js`, before `runtime.js`). It registers every `graphicComponents` id, the two `persistent` engine hooks and four style helpers. Everything is deterministic (GSAP tweens on `ctx.tl` or `ctx.onFrame` hooks reading tweened proxies; seeded `ctx.rng`; no CSS animations, timers, `Math.random` or `Date`), and every prop/backdrop is procedural (CSS gradients, SVG, canvas). Glass is real `backdrop-filter`; the refractive lenses use `backdrop-filter: url(#svg)` (an `feDisplacementMap` magnifier for the disc and bead, `feOffset` + blur for the rings), which headless Chromium renders, so captions, glass and the talent under a lens are genuinely bent.

**Persistent (from `style.json` `persistent`, applied to every scene)**
| id | what it does |
|---|---|
| `ember-prime` | Engine workaround. GSAP skips a cue's t = 0 `set`s when the paused master lands exactly on the cue start, and the master does not render t = 0 at all. Without this, frame 0 shows the raw plate and every cut on an exact frame boundary flashes the previous shot for one frame. It moves frame-aligned cue timelines 0.1 ms earlier, starts camera cues half a frame early so the runtime's motion blur never smears across a cut, and primes both masters off 0. |
| `ember-text-fx` | Applies the text treatments to every text cue (scene cues and component-made lines). (1) Chromium ignores `letter-spacing` on cursive Arabic (confirmed; resolves §15 #9), so the reflow and tracking settle run on `margin-left` of the letter spans: −0.45/−0.5 em → +0.03 em → 0, with tatweels dashed while typing. (2) **Two-phase glow-sweep**: a preset `cool` block (`from`/`to`/`delayMs`/`durationMs`/`staggerMs`) lands every unit (tatweels included) hot #FAD01E with its halo during the 133 ms IN, then cools it to white over 333 ms from its landing frame. (3) The hook's single screen-space gold band; `cue.gradientBand: [x0%, x1%]` fits it to a shorter block. (4) Glows on gradient fills go on a wrapper `drop-shadow` chain; the hook's additive wide glow is laid as near/mid/far rings (×1.6 gain, `cue.glowGain` overrides) plus the font's `edgeSoftenPx`, which reproduces the reference distance rings (k_005: +46/+37/+11 luma at 4-6/11-15/28-40 px; demo +57/+33/+13). (5) Ice chrome: stops remapped onto the glyphs (alef top 15.8 %, baseline 77.5 %), an **inner** cyan rim on the glyphs' upper edges (SVG band filter), an outer rim, and a restrained near halo (0.35) and bloom (0.45/0.30 × the token alpha) with the delayed `glowBloom`. (6) **Seam-free hold**: split letters each paint their own fill, so Arabic joins show a 1 px seam (cyan in the chrome, dark in the gold, dashed in solid tatweel runs). One frame after a split Arabic line is static (IN + settle/cool/rise done), it is swapped for an unsplit copy with the same font, fill, band/glyph mapping and wrapper filter (ligature/kerning features off, so shapes and widths match; frame diffs show edge-only changes). Lines with an animated exit hand back to the letters before it; `cue.solidHold: false` opts out. Solid letters of presets without a tracking animation also get a 0.6 px same-colour stroke so joins overlap during the reveal. (7) The feathered reverse wipe (`featherPx`). (8) `cue.rise: true` gives the optional 66 px rise. (9) A hard cut at `cue.end` for every caption, even mid-type-on. (10) Filtered full-frame text wrappers (glow, chrome, extrusion) leave the render tree (`display: none`) outside their cue's lifetime; otherwise every frame the composite moves the layers re-runs the filters of hidden later-shot captions (demo shot 1: 6 s → 1.3 s per frame). |

**Graphic components** (`"type": "component", "component": id`; geometry, timing and colours come from `graphicComponents[id]`, and `props` override `build`)
| id | layer | useful props |
|---|---|---|
| `glass-ring-pop` | front | `only` (0 = TL, 1 = BR instance; default both, BR +67 ms), `morphAtMs` (hide when the capsules take over, default `end`) |
| `nametag-capsule` | front | `label` (reverse wipe), `micro` (tracked Latin, revealed from the end), `microDelayMs`, `microLiftPx` (default 12: keeps the micro inside the smoked field), `centrePct`, `ring` (geometry it grows from; default = BR ring), `textDelayMs` |
| `echo-capsule` | front | `label` (truncated, e.g. «اسـ»), `ring` (default = TL ring); blurred, cropped by the left edge, button drifts +84 px |
| `cta-button` | front | `variant`: `nametag` (dark disc, lime ring, ↖) or `finalCta` (maroon, yellow, ↗); `centrePct` |
| `glass-pill-clear` | front | `variant`: `chest` or `brand`; `centrePct`; `text` (`pill-type`, +67 ms after landing); `subText` (`pill-type-thin`); `subDelayMs` |
| `smoked-pill-autosize` | front | `text` (typed inside; the width follows it), `centrePct`, `zIndex` (default 2, so the orange 3D word tucks under it) |
| `lens-disc-slide` | front | any `build` key (`radiusPx`, `centreStartPct`/`centreLandPct`/`centreEndPct`, `interior.magnify`, `interior.blurPx`); drifts until `end`; `autoSfx` adds its tick pair |
| `lens-ring-pair` | front | `only` (0/1), `dim`, `refract` (`auto` default: a ring bends what is under it only while an earlier caption intersects it, otherwise rim only, so the talent is never smudged; `always`/`false`); place it after the captions it should bend and before the payoff word |
| `glass-bead-capsule` | front | `lines: [{text}, {text}]` (line 2 uses the dark sub-line role), `centrePct`, `speed` (1 = reference timing) |
| `badge-ribbon` | behind + front | `icons` (tooth, aligner, sparkle, clock, shield, nometal, flask, atom), `labels`, `backArcRegionPct`, `frontArcRegionPct`, `frontBadgeScale` (MCU: ~0.7 so the front icons sit inside the bottom strip), `back: false`, `front: false` |
| `glass-molecule` | front | `regionPct`, `boxPx`; 6.9°/s rotation, 6 px float |
| `foreground-flask-fog` | front | `flask: false`, `fog: false` |
| `clay-ui-card` | **behind** | `label`, `regionPx`; geometry matched to k_022-k_026: the card faces the presenter (right side nearer), vanishing point low-left (`perspectiveOrigin` `0% 130%`), `rollDeg` −3, `perspectiveDropPx` 80, so the left edge stays near-vertical while the top edge rises ~25° and the label ~15°; lit #8A3A0A→#B0561A extrusion edge; debossed #3A1500 Inter 600 label with a #7A3204 lip; `cue.loop` overrides (e.g. `{"finalSwingToCamera": null}` when an interrupt follows) |
| `hud-panels` | bgW | `panels: [[x, y, w, h], ...]` (1080 px) |

**Style helpers**
| id | use |
|---|---|
| `ember-backdrop` | Background replacement on `bgW` (world-locked, so the punch-out and wobble move it like footage). `variant`: `studioMcu` or `studioWide` (from `backgrounds`), `labCorridor` or `labWall` (procedural stand-ins for the AI world plates), or any CSS background; `blurPx`. **`cancelCam: {scale, x, y, focusPx}`** = the shot's settled framing: the plate is drawn through its inverse, so fitted gradients land where they were fitted while punch-outs and wobble still move them. Studio variants also get the style's `overlays.tint` corner shade (the engine only draws overlays into footage; `shade: false` opts out) and `saturate` 0.93 (fitted gradients are pure-hue; the real cyc is S 225-238). `labCorridor`: warm steamy haze in the hook zone (`hazeYPct` [5, 25], `haze: false`), lamp discs at `lampAlpha` 0.2, halved counter edges. Plates are oversized or mirror-padded, so reframes never show an edge. |
| `ember-talent` | For footage shot on a cool set: `despill` (removes cyan spill), `choke` (alpha floor), `wrap` (light-wrap toward the cyc), `toe` (black-floor lift via `feComponentTransfer`; 0.045 brings dark scrubs from luma p0.5/p5 0/1 to ~4-10/11, ref 2-5/13), `warm`/`saturate`/`brightness`, and `solidBottom: [y0%, y1%]` (back-fills forearms that person mattes drop at the bottom edge). |
| `bw-focus-interrupt` | The pattern interrupt as a cue: `t` = the start of the blur and desaturation ramps, `end` = the releasing hard cut. Greyscale is an SVG colour matrix driven per frame (`saturateTo` 0.02, Rec.601 `lumaWeights`, `greyGains` [1, 0.965, 1.03] for the cool-neutral cast), not CSS `saturate()`. Demo: S median 15 (ref 15), greys #383538 (ref #302E31), luma mean 46.0 before and during. Earlier graphics are re-parented into ghost wrappers and greyed with the plate and talent; later cues stay crisp. |
| `ember-composite` | Moves the screen-locked layers with the camera, so the whole composite moves: `mode: "translate"` (plate wobble incl. captions; `base` = a reframe offset to ignore) or `"full"` (the 1-frame `precut-pullback`). |

**Using it on new footage**
- Camera: the runtime ignores `type: "static"` presets (`mcu-digital-punch`), so crops and reframes use inline `keyframes`. Add `focusPx` when the face track is smoothed across a jump cut. The engine's `handheld` cannot ride on a reframe, so write the world-plate wobble into the keyframes (±5-10 px every 750 ms, `sine.inOut`) and add `ember-composite` with `base`. Pass each shot's settled framing to its `ember-backdrop` as `cancelCam`.
- Close MCU footage: reframe so the chin sits at 44-46 % H (the smallest scale that still covers the bottom edge: for the doctor's take B, 1.16 with y −174) and use the chest-band card slots: hero (52.4, 50.6), thin (50.3, 55.3), pill (50, 63.3), orange 3D accent ~7 % H below the pill centre so its top tucks under the pill. Leave the top band to the clay card (region from x ≈ 75 % so the head does not hide the label). Hook-only shots on a world plate may put the hook in the top band by reframing the plate down (`y` +80-150 px).
- Dark wardrobe: land the lens disc where light content sits (the hands: `centreLandPct` [78, 90]) and use `interior.blurPx` ~5 so the magnification reads.
- Audio: `"autoSfx": true` adds the style's tick pairs (the stand-in for `ping8k`). `voiceGainDb: 0` (audio.py soft-limits the master if it would pass −0.2 dBFS). The bed is `demo/bed_ember_112bpm.wav` (`demo/make_bed.py`, 112.3 BPM, −20 dBFS RMS) at `gainDb` −15/−16 with `duckDb: 0`, about 17 dB under the voice.
- QA: `demo/scene_all_components.json` exercises every preset and component (stills 0, 55, 115, 160, 212, 262, 290 on the doctor plate).

**Token changes proven by renders (fix pass after the art-director review)**
- `textPresets.glow-sweep`: one 333 ms IN that also cooled the colour → IN 133 ms (opacity/blur) + `cool` 333 ms from landing. The single tween left glyphs white by the time they were opaque (demo f143 core #BD9961 vs ref f102 #FFEB04).
- `transitions.bw-focus-interrupt.params.saturateTo` 0.1 → 0.02 (+ `lumaWeights`, `greyGains`): 0.1 left HSV S median 55 with a warm cast (ref 18, cool-neutral).
- `backgrounds.studioMcu.gradient`: added a right-side spill layer; with the corner shade the backdrop-only error vs k_008/k_010/k_012 drops from 10.4 to 6.6 /255 (top-centre was #4D1E00 vs ref #2A0C04, right-mid #3E1501 vs #5E2105).

**Demo: `demo/scene_doctor.json`** (doctor plate, 9.97 s; render `renders/demos/style-1/style-1_doctor.mp4`, `sheet.jpg`, `stills/`)
| t (s) | shot | beat | what shows the style |
|---|---|---|---|
| 0.00-4.60 | take A, lab-corridor world plate, reframed +150 px | hook + brand | punch-out settle 1.38 → 1 (567 ms); whole-composite wobble; **badge-ribbon depth sandwich** (back slab behind the head at y 40-60 %, blurred front band at the bottom); gold `ember-type` «تستحي تضحك» + right-anchored `ember-words` «بسبب سنونك؟» glowing in a warm steam haze (material 1); hook-only for 2 s, then at 2.1 s **both** glass rings spring-pop → 2.70 s TL echo capsule «عيـ» cropped by the left edge + 2.77 s BR name tag «عيادة الابتسامة» with lime ↖ button and tracked «ALIGNERS» |
| 4.60-8.24 | take B on the orange MCU cyc, 1.60 → 1.16 settle, chin at ~44 % H | turn + method + contrast | **MCU chest-band card**: `glow-sweep` «هـــسه» lands hot-yellow unit by unit and cools to white (material 2) / thin «تقويم ما ينشـــاف» with dashed kashida; tilted clay «Aligners» card alone in the top-right, behind the doctor; lens disc lands over his hands (tick pair); 6.97 s neutral-grey B&W focus pull ghosts the stack; smoked pill «مو بس سنون مرتبة» autosizes in the pill slot; orange 3D «ثقة» tucked under it (material 3, tick pair) |
| 8.24-9.97 | take B at 1.0, y +40, locked off | payoff | hard cut releases the interrupt; lens ring pair (rim only: nothing earlier is under it); ice-chrome «ضحكتك» at 15 % H with inner cyan rim, restrained halo and delayed bloom (material 4, tick pair); static hold from 8.87 s |

`demo/scene_native.json` (the reference's own breather plate, 2.5 s; `style-1_native.mp4`) rebuilds the reference detail beat on the native set: «كل فكرة» / «يقربها للطالب» / chest pill «باقوى التجارب · التفاعلية» / lens disc / «Chemistry» clay card swinging toward camera. Its still at 2.0 s lines up with `keyframes_full/k_024.jpg`, including the card's tilt and corner position.

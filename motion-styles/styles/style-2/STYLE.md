# Style 2: Teal Spatial Glass

**Reference:** `ref2_medical.mp4` (dentist / clear-aligner reel, 720x1280, 30 fps, 1113 frames, 37.1 s).
**Machine tokens:** `style.json` in this folder.

All facts below come from the look, motion and verifier reports. Where the verifier corrected a claim, its value is used. I added measurements of my own; scratch files are in `_work/ref2_medical/scratch_style/`:
- pull-back curve fits (`fitzoom.py`)
- grade statistics and an ffmpeg grade test on foreign footage (`grade.py`, `gtest.py`)
- font-size calibration by rendering Readex Pro and Inter against the measured ink boxes (`calib.mjs`, `tatweel.mjs`, `hexp.mjs`)
- SFX band levels
- a smoke render through `engine/render.mjs` (`smoke_sheet.jpg`)

**Units:**
- Sizes are given as **@720** (reference px), **@1080** (render canvas, x1.5), and %W / %H (identical at both).
- Durations are given as **F** (frames at 30 fps) and **ms**.

---

## 1. Name, essence, best for

**Teal Spatial Glass.**

A low-key, teal-and-orange interview. Every graphic shot is built around **one enormous Arabic word**, and each of those words is made of a different material:
- Difference-blended peach
- flat white
- cyan 3D glass with a neon rim
- a translucent glowing gold light panel
- gold with a centre spotlight

A whisper-thin white "neon" Arabic line and a ghosted English translation echo sit around the hero. Apple / visionOS glassmorphism (frosted capsules, a ring that morphs into a search bar, a tab bar, a floating window, an iPhone) and photoreal 3D product props are layered **in front of and behind** the rotoscoped presenter.

Wide shots open digitally punched in to about 2.5x and pull back in two steps, carrying the world-locked text with them. Medium close-ups alternate with them, and the later MCUs are left completely clean. The plate never gets brighter than about luma 168, so the graphics own every true white. Cuts are hard, SFX are sparse and tonal, and there is no music.

**Best for:**
- Expert or authority talking heads that need to feel premium, calm and "high-tech": clinics, dentists, dermatology, aesthetics, labs, engineers, fintech or SaaS founders, consultants.
- Product explainers where the product is an *object* (aligners, devices, packaging) or an *app* (phone mockup, glass UI).
- Arabic or bilingual (Arabic + English) audiences.
- 25-40 s vertical reels with a problem → product → mechanism → proof → CTA arc.
- Moods: confident, aspirational, clean, nocturnal, "Apple keynote in a dark room".

**Not for:**
- High-energy, comedic or meme content; beat-driven music edits; kids.
- Bright daylight or pastel brands, outdoor footage, warm cosy sets (the teal look cannot be graded out of a warm set; see §5).
- Dense subtitle-heavy content. The style shows at most 1 hero plus 1-2 support lines per shot and leaves 36% of the runtime clean.
- Fast listicles with more than 10 points, or anything that needs on-screen numbers and charts.
- Brands that must avoid Apple-like UI cues.

---

## 2. Signature moves

1. **Two-step pull-back reveal.** A hard cut lands on a WS punched in to **2.49x**, so the face roughly matches the previous MCU (×0.79). The camera then pulls back:
   - to **1.297x** over 31 F (1033 ms), `cubic-bezier(0.33,0.08,0.02,0.91)`, with motion blur
   - near-hold for 5 F
   - to **1.0x** at F72 (2400 ms total), `cubic-bezier(0.31,0.08,0.00,0.97)`

   The hero text and glass UI are **world-locked**, so they shrink and drop with the camera. This is used on 3 of the 5 WS (hook, feature, CTA set-up), and the curves match within ±0.05x.
2. **One giant Arabic hero word per graphic shot, each in its own material.** It spans 53-86% of frame width (7-25% of height). The order in the reference is peach-Difference → white → gold panel → cyan glass → white → gold spotlight → gold panel (reprise).
3. **Text sandwiched with the talent.** Hero words sit high and are occluded by the hair (roto matte): هو, فكرته, the end of "idea", and the flying aligner tray. Support lines, pills and UI sit over the chest, in front. The face is never covered.
4. **Neon monoline Arabic.** Readex 200-weight white with a two-stage glow (a tight 4 px halo plus a soft 45 px halo @1080). Very long **kashida** strokes act as glowing underlines; for example, بعدك is stretched to 82% W and wraps around the gold اذا.
5. **Ghosted English echo.** The literal translation of the hero, in bold grotesque at 35-90% alpha with a **centre-hot** horizontal gradient that fades to nothing at both ends (because, You will see.). Alternatively a hairline copperplate script (A lot, His) threaded through the Arabic.
6. **Apple / visionOS glass kit:**
   - frosted capsule (10-25% white plus backdrop blur, 1-2 px specular rim)
   - dark inner text capsule
   - circular button with a gold `#C19359` ring and an up-left arrow
   - ring → search-pill morph with overshoot
   - tab bar, perspective window, dock
   - iPhone mockup that glides in with a yaw and settles tilted −11°
7. **Photoreal 3D domain props.** They enter from a frame edge (17-55 F, ease-out), keep a slow yaw spin, never exit, and are composited unshadowed. A Difference hero over them flips colour (green where it crosses pink gum).
8. **Low-key teal plate, hard cuts only, tonal SFX.** Strict WS ↔ MCU alternation, with cuts in speech pauses. Graphics never animate out. The SFX are:
   - a gold shimmer (9.25 → 5.6 kHz)
   - a glass chime (4.09 / 7.0 / 10.29 kHz)
   - near-inaudible ticks on type-ons
   - no whooshes and no music

---

## 3. Typography system

### 3.1 Families (Google / fontsource)

| Role group | Family | fontsource id | Weights used | Notes |
|---|---|---|---|---|
| All Arabic | **Readex Pro** | `readex-pro` (installed in `engine/`) | 200, 300, 600, 700 | Best of 10 Google candidates: diamond i'jam dots, flat س teeth, round و with a curled tail. Original is likely SF Arabic. **Max weight is 700**: fake 800-900 with a same-tone 4 px stroke @1080. |
| Thin captions (alt) | IBM Plex Sans Arabic / Noto Sans Arabic | `ibm-plex-sans-arabic`, `noto-sans-arabic` | 200 | Indistinguishable from Readex 200 at caption size. |
| Latin bold (ghost, accent) | **Inter** | `inter` | 700 | Original is probably SF Pro Display Bold, about 10% wider. Size by cap/x-height, then open the tracking slightly (+0.02 em). |
| Latin script accent | **Pinyon Script** | `pinyon-script` (**not installed**: `npm i @fontsource/pinyon-script`) | 400 | Low confidence. Runner-ups: Great Vibes, Alex Brush. |
| UI microcopy | Inter | `inter` | 500 | Stand-in for SF Pro Text. |

Readex Pro's variable **HEXP** axis was tested (`scratch_style/hexp_cmp.png`) and **rejected**: it letter-spaces the word instead of widening the glyphs.

### 3.2 Size and treatment table

Sizes were calibrated by rendering the real words and solving for the measured ink box.

| Tier / role (`fonts[].role`) | Example | Weight | font-size @720 → @1080 | Ink box @720 (px) → %W × %H | Fill | Effects |
|---|---|---|---|---|---|---|
| **Hero A** `hero-difference` | هواي | 600 | 190 → **285**, + `scaleX 1.3` | 571×215 → 79 × 16.8 | `#FCC29E`, **mix-blend: difference** | None. Reads `#DB8861` salmon on the teal plate, `#1F5533` green over pink gum, navy over cyan lights. |
| **Hero B** `hero-bold` | وبسبب | 700 | 123 → **185** | 395×88 → 55 × 6.9 | `#FAFCFF` flat | None (verified: halo equals the background). |
| Hero B (behind head) | فكـ(12)ـرته | 700 | 110 → **165** | 396×126 → 55 × 9.8 | `#FAFCFF` | None; behind the talent. |
| **Hero C** `hero-cyan-glass` | هـ(6)ـو | 700 + 4 px stroke | 370 → **555** | 618×307 → 86 × 24 | Horizontal gradient `#D7F1F2 → #86D9E0 → #01B6C4 (centre) → #86D9E0 → #C1E9EC`, lighter at the bottom | 6 px neon rim `#05F3F8` on the top/left outer contours and the lower inner edges of the counters; glow: wide grey-white `rgba(170,225,230,.35)` r 70 plus a thin `rgba(5,243,248,.25)` r 10 (re-measured on k_020); extrusion `#2E6E78` offset (−8, +10). |
| **Hero D** `hero-gold-panel` | اذا | 700 | 400 → **600** | 382×317 → 53 × 24.8 | Gold `#D5AD6A`, hot `#FDD99B`, **per-glyph static alpha gradients**: right alef transparent at top → opaque at bottom; ذ hottest in the lower bowl; left alef opaque at top → transparent at bottom | Glow `rgba(224,168,90,.6)` r 75, strength 1.5; 3 px rim `#FDD99B`; lights the pill below (`#EDC179`). |
| Gold line `gold-spotlight` | راح تشوف | 600 | 92 → **138** | 435×120 → 60 × 9.4 | Centre-hot gradient `#886F4A → #C9AC6F → #EDE2AA (centre) → #D9C17E → #877453` | Glow `rgba(217,181,110,.5)` r 42. |
| Neon `neon-thin` | اشخاص | 200 | 72 → **108** | 220×82 → 31 × 6.4 | `#FFFBF9` | Tight halo 4 px white 90% plus soft halo r 45 white 55%. |
| Neon long line | طـ(8)ـول المـ(8)ـدة مالتـ(8)ـه | 200 | 62 → **93** | 519×60 → 72 × 4.7 | `#FFFBF9` | Same. |
| Neon wrap | بعـ(34)ـدك | 200 | 118 → **177** | 592×145 → 82 × 11 | `#FFFBF9` | Same; picks up a warm halo `#AD956D` over gold. |
| Neon sub | مصممة خصيصا لأسنانك | 200 | 31 → **46** | 289×33 → 40 × 2.6 | `#C9E9F4` (cool), dimmer towards the line end | r 30. |
| Neon sub, dim | مناسب لحالتك او لا | 200 | 45 → **68** | 370×43 → 51 × 3.4 | `#A09EA0` (≈60% white) | r 30. |
| Pill label `pill-label` | التقويم الشفاف | 700 | 37 → **56** | 276×47 → 38 × 3.7 | `#FFFAF4` | Warm glow `rgba(192,163,119,.6)` r 22. |
| Search label | حـ(3)ـل عملي | 700 | 46 → **69** | 222×50 → 31 × 3.9 | `#E3DCDA` | Faint dark shadow `0 2px 6px rgba(0,0,0,.35)`. |
| Pill sub `pill-sub` | اقل ملاحظة أثناء الكلام او الأبتسام | 300 | 20 → **30** | 296×29 → 41 × 2.3 | `#897161` | None. |
| Latin ghost `latin-ghost` | because | Inter 700 | 158 → **237**, tracking +5 px | 665×117 → 93 × 9.1 | Centre-hot alpha gradient, teal `rgba(80,200,192,.92)` centre → 0 at both ends | Bevel: 1-2 px light top edge plus dark under-shadow (`filter: drop-shadow`). |
| Latin ghost (under gold) | You will see. | Inter 700 | 86 → **129** | 505×67 → 70 × 5.2 | Centre-hot cyan `#39A0B4` → `#14414C` → 0 | Same. |
| Latin small | people | Inter 700 | 41 → **62** | 132×39 (core) → 18 × 3 | Tan `#BE8F6C`, centre-hot, ≈75% | None. |
| Latin accent `latin-accent` | idea | Inter 700 | 127 → **191** | 252×100 → 35 × 7.8 | `#E6B08C → #DBA981 → #DB8A5D` (L→R), opaque | None; its end goes behind the face. |
| Script `latin-script` | A lot / His | Pinyon 400 | 90 → **135** | 140×73 → 19 × 5.7 | "A lot": `#B5B0AA` at 60% under the Difference hero (turns brown `#563423` where they cross). "His": `#2EFFFF` in **Difference** (reads `#0DD2C5` on the plate, red over white text). | None. |
| UI `ui-label` | Photos / Album / Favorite | Inter 500 | 13 → **20** | — | White 90% | None. |

### 3.3 Hierarchy (per graphic shot)

- **Tier 1:** exactly one Arabic hero word (two words only for the gold spotlight line).
- **Tier 2:** 1-2 support lines, either thin neon Arabic or a ghosted English echo.
- **Tier 3** (optional): a script accent, a pill label or subtitle, or UI microcopy.
- At most **7 words** on screen, excluding UI microcopy (the S9 maximum). A sentence is never set large.

### 3.4 Arabic + English pairing

- English is the **literal translation** of the Arabic hero or line: هواي اشخاص → A lot / people; وبسبب → because; فكرته → His idea; راح تشوف → You will see.
- English is always the **weaker layer**: 35-90% alpha with a centre-hot fade, a hairline script, or small. The only opaque English word is the peach accent ("idea").
- Pairs **interlock** rather than stack with gaps:
  - the script threads through the hero
  - the thin Arabic lies across the hero
  - the English cap line sits directly on the Arabic baseline (راح تشوف baseline y≈245 @720, "You will see." cap top y≈270 @720)
- Colour of the echo complements the hero:
  - teal under white
  - cyan under gold
  - tan under peach
  - peach next to white

### 3.5 Kashida / tatweel and word-splitting rules

- **Widen with kashida (ـ U+0640), never with tracking.**
- Readex tatweel advance = **0.08 em** (8 px at 100 px), so kashida count `n = round((targetInkW − naturalInkW) / (0.08 × fontSize))`.
- Insert after the first joining letter: ه, ف, ك, ط, م, ع, ح.

| Word | Kashida | Result @720 |
|---|---|---|
| هـو | 6 | 618 px |
| فكـرته | 12 | 396 px |
| بعـدك | 34 | 82% W |
| حـل | 3 | — |
| طـول / المـدة / مالتـه | 8 per joint | — |

- In thin weight the stretched kashida is the design: it becomes a glowing horizontal line, and in the search bar it grows while the letters type.
- **Fitting order for a hero:**
  1. Set font-size from the target ink **height**.
  2. If too narrow, apply `scaleX` ≤ 1.3 (only هواي needs it: the original letterforms are about 1.46x wider than Readex).
  3. Then add kashida.
- **Never split a word across lines.** Every text element is one line. Never hyphenate. Lam-alef stays one glyph (the engine already handles this).
- Letter-by-letter animation must keep joining. The engine wraps split letters in ZWJ.

### 3.6 Alignment

- Dominant centre axis at **x = 50% (48.6-50.6%)**.
- Exceptions:
  - left-aligned at a 5.1-8.1% margin (وبسبب, His, idea)
  - the gold اذا is offset slightly left (centre 45.4%) so the talent shows between its glyphs

### 3.7 Implementation notes for the renderer

- **Difference blend:** set `mix-blend-mode: difference` on the text container. The engine's layers have no z-index, so it blends with the plate. Smoke test confirmed.
  - **The colour depends on the plate.** `#FCC29E` reads as peach only on a dark-teal plate; on the red test set it rendered pale green.
  - For other plates, choose `base = desired visible colour + local plate colour` per channel, clipped at 255.
- **Gradient-filled text plus glow:** `text-shadow` shows through the transparent `background-clip:text` fill. Put the glow on a wrapper with `filter: drop-shadow(...)` stacks, or on a duplicate text layer underneath.
- **Gold panel:** render each glyph as its own span with its own vertical alpha gradient (see `style.json` `fonts[hero-gold-panel].fill.glyphGradients`).
- **Cyan glass:** build it from 3 layers:
  1. a wide grey-white glow layer
  2. an extrusion copy (`#2E6E78`, offset −8/+10 px, 14 px deep)
  3. a neon rim: a filled `#05F3F8` copy shifted ≥ 6 px up-left with a 9 px glow, drawn **above** the extrusion and under the face, so it shows on the top/left outer contours and the lower inner edges of the counters (k_020)
  4. the front face with the horizontal gradient, plus a light bottom overlay

  Add a slight perspective of rotateX 6°, rotateY −4°.

---

## 4. Colour and grade

### 4.1 Palette

| Hex | Role |
|---|---|
| `#FCC29E` | Difference base of the peach hero (text + background is constant at ≈ `#FCC0A0` across 12 samples) |
| `#DB8861` | Peach hero as seen over the teal plate |
| `#1F5533` | Same hero over the pink 3D gum (Difference result) |
| `#FAFCFF` | Flat white hero |
| `#FFFBF9` / `#C9E9F4` / `#A09EA0` | Neon thin: core / cool sub / dim sub |
| `#01B6C4` / `#D7F1F2` / `#05F3F8` | Cyan glass: face centre / face ends / neon rim |
| `#D5AD6A` / `#FDD99B` / `#AA804F` / `#82623B` | Gold panel: core / hot rim / darkest / inner glow |
| `#EDE2AA` → `#886F4A` | Gold spotlight: centre → ends |
| `#C19359` | Gold icon ring and arrow |
| `#44A2A1` / `#39A0B4` / `#BE8F6C` | Ghost English: teal / cyan / tan centre |
| `#E6B08C` → `#DB8A5D` | Peach → orange accent ("idea") |
| `#2EFFFF` | Script Difference base (shows `#0DD2C5`) |
| `#695552` / `#261D1E` / `#221B20` | Glass capsule band / dark inner capsule / button fill (over brown scrubs, re-measured at 9.9 s; tokens `rgba(0,0,0,.45)` and `#241B1A`) |
| `#897161` / `#E3DCDA` | Pill sub text / search label |
| `#EDC179` | Warm light spill from gold into the glass pill |
| `#13494D` | Teal floor-stage gradient (bottom) |
| `#F87071` / `#B84A4B` / `#97999A` | 3D gum lit / gum shade / aligner tray highlight |
| `#F2F1F4` / `#21A4F0` | Phone screen / progress bar |
| `#183C49` / `#045A79` / `#015A96` / `#D3F2F1` | Plate: dark teal wall / blue-teal right side / LED blue / fluorescent tube |
| `#A57864` / `#432C2A` / `#000005` | Skin forehead / chocolate scrubs / crushed black |

### 4.2 Grade targets

Measured on clean frames f150 (WS) and f540, f600, f800, f1060 (MCU).

| Metric | Reference |
|---|---|
| Mean luma | 50-62 (whole reel 59.6) |
| Luma p0.5 / p95 / p99.9 | 0-1 / 121-128 / **163-170** (the plate never reaches white; WS ceiling tubes reach about 236) |
| Shadow band (Y < 30), mean RGB | `#150F14` MCU (faint magenta), `#14151B` WS (faint blue). Crushed. |
| Mid band (30-90) | `#304047`: R−B −20…−31, G−R +14…+23 (**teal**) |
| High band (>90) on MCU, mostly skin | `#7D7168`: R−B +19…+21 (**warm**) |
| Face median luma | ≈ 115-128 (cheek `#9C6956`, forehead `#A57864`) |
| HSV saturation mean | 120-145 |
| MCU row-band luma, top → bottom (10 bands) | 64, 71, 84, 85, 82, 79, 57, 39, 29, 22 (strong bottom falloff) |
| MCU corner means | TL 37, TR 79, BL 10, BR 1 (the rim-lit side is brighter) |
| Grain / fade | none / none |

### 4.3 ffmpeg recipe

Tested on ref1 and ref3 frames: p0.5 = 0, p95 = 120-129, p99.9 = 161-164, which hits the targets.

```bash
# 1) exposure normalise: pick G so the face-box median luma is ~0.50 (128) BEFORE the look
#    (ref3 test plate needed gamma 1.45, ref1 1.30; a normally exposed plate ~1.0)
# 2) look: split-tone via per-channel curves (teal below luma ~0.35, warm above), master tone curve
#    with crushed toe and highlight shoulder to 0.69 (=176), +22% saturation, vignette centred high
ffmpeg -i in.mp4 -vf "eq=gamma=G:brightness=0.02,\
curves=r='0/0 0.10/0.05 0.30/0.20 0.45/0.46 0.70/0.74 1/1':\
g='0/0 0.10/0.09 0.30/0.30 0.50/0.50 1/1':\
b='0/0.03 0.10/0.14 0.30/0.36 0.45/0.43 0.70/0.62 1/0.88':\
m='0/0 0.05/0 0.15/0.10 0.30/0.24 0.50/0.44 0.70/0.59 0.88/0.66 1/0.69',\
eq=saturation=1.22,vignette=angle=0.70:x0=w/2:y0=h*0.36" -c:a copy graded.mp4
```

- **Bottom fade:** overlay a black linear gradient from 0% at y = 62% H to 55% at y = 100% H. The engine's `overlays.bottomFade` describes it; the shipped runtime does not draw it yet.
- **CSS fallback** (engine `grade.css`): `brightness(0.68) contrast(1.08) saturate(1.25)` plus a teal soft-light tint `#0F6A80` at 30% plus the vignette. This is cruder than ffmpeg: there is no highlight shoulder, and skin is not protected. Prefer baking the ffmpeg grade into the source, then run `prepare.py`.
- **Important:** a grade does **not** create the teal world. On the warm ref1 set and red ref3 set the mids stayed warm (R−B +41…+61). The teal environment has to come from the set, from background replacement, or from cyan/blue practicals (§5).

---

## 5. Backgrounds and sets

**What the reference does:**
- It uses a real, dark clinic operatory. One locked wide take is used for all five WS, and S1, S5 and S9 are digital punch-ins of that same take.
- **Three depth layers:**
  1. a soft dark foreground counter, left
  2. the seated talent, centre
  3. equipment, softened, behind
- **Lighting:**
  - a soft key from camera-left/front
  - cyan/blue rim and spill from the right (LED under the chair `#015A96`, blue wall `#045A79`)
  - two cyan-white fluorescent tubes on the ceiling, which are the only plate highlights that bloom
- **MCUs** are on a longer lens with very shallow depth of field. The background becomes a wash: dark teal on the left `#183C49`, blue-cyan on the right `#045A79`, and one pale blurred lamp shape at upper right.
- **Wardrobe** is chocolate-brown scrubs `#432C2A`, which is what the warm-orange text palette echoes.
- **Added stage:** in the hook, a teal gradient plus a flat 1 px grid fades in under the 3D prop (§6, `teal-grid-stage`).

**How to fake it on new footage:**

- **If the source set is already dark, cool or neutral:** grade it (§4.3), then add cyan practicals (light leaks or bloom blobs at the top corners).
- **If the source set is warm, bright or busy:** replace the background with the person matte from `prepare.py`, using the engine `bg-replace` component and AI plates:
  - **WS plate prompt:** "Vertical 9:16 photo of an empty modern [clinic / studio / lab / office matching the topic] at night, low-key cinematic lighting, dark teal and cyan painted walls, two cyan-white fluorescent tube fixtures on the ceiling at upper left and upper right with soft haze, blue LED under-glow on equipment at the right side, a dark grey counter softly out of focus in the left foreground, empty space at centre for a seated person, 35 mm lens f/4, crushed blacks, saturated teal, no people, no text, no logos."
    - Negative: "warm light, orange or beige walls, daylight, windows, people, text."
    - Plate blur: 2-4 px @1080.
  - **MCU plate prompt:** "9:16 extreme shallow depth-of-field background plate of a dark clinic interior, everything defocused into large smooth bokeh, deep dark teal on the left (#183C49), saturated blue-cyan glow on the right (#045A79), one soft pale blurred lamp shape at upper centre-right, no recognisable objects, no people, no text."
    - Plate blur: 14-20 px @1080.
  - **Haze:** a screen-blended radial gradient `rgba(211,242,241,0.25)` with a 220 px radius around each ceiling tube on the WS only. No particles: the reference has none.
  - **Relight the talent towards the plate:** a cyan rim from the right using a soft-light `#045A79` gradient over the talent's right edge at 25-35%, and darken the bottom with `bottomFade`.
  - **Keep the WS plate locked off** (no drift), because the punch-in pull-back reads as a camera move only if the plate is static.

---

## 6. Graphic component library

Layer order, back to front: plate → `teal-grid-stage` → **behind** layer (cyan hero, white hero in pull-backs, end of "idea", flyby tray) → **talent** → **front** (gold glyphs, pills, glass UI, phone, props, ghost English) → thin neon captions → fx (tint, vignette, bottom fade).

| id | Purpose | Construction @1080 (@720 in brackets) | Layer |
|---|---|---|---|
| `teal-grid-stage` | Product stage under a 3D prop (hook) | Region y 70.3-100% H, full width.<br>Gradient transparent → `#13494D` at the bottom.<br>Flat orthographic grid, 1.5 px lines `rgba(130,225,232,.13)` (+8-12 luma), pitch X 60 px (40), pitch Y 93 px (62), first vertical line at x = 48 (32).<br>In: grid from F55 over 15 F; gradient from F60 over 30 F. | front, below props and hero |
| `prop-3d-enter-spin` | Photoreal 3D domain object | Transparent PNG turntable (360° in 180 F), soft top-front key, **no cast shadow**, saturated ungraded colours, about 6 px motion blur when moving.<br>Hero size 46.5% W × 33% H. Variants:<br>- `corner-dof`: off the top-left corner, 12 px depth-of-field blur, sits under the hero's ي, enters in 9 F then grows 1.45x over 51 F<br>- `flyby-behind-head`: 76% W tray across the top third, behind the talent | front; flyby = behind |
| `glass-pill-gold` | Label capsule under the gold hero | 570×186 (380×124), radius 93.<br>Fill: `rgba(255,255,255,.06)` + backdrop blur 24, warm top spill `radial-gradient(60% 70% at 50% 0%, rgba(237,193,121,.55), rgba(200,153,80,.25) 45%, transparent)`, teal tint on the right edge `rgba(61,66,61,.35)`.<br>Rim: 2 px top highlight `rgba(255,255,255,.35)`.<br>Centre (50%, 78.2%); 80.9% when a long neon kashida wraps above it (S3 sits 33 px lower than S9). | front |
| `glass-search-morph` | Ring → search pill with a typed label and a gold arrow button | **Ring:** outer Ø 230 (153), band 40 (26-28), milky fill 22% white + blur 18 (band ≈ +45-55 luma over the scrubs), bright 1.75 px rims inside and out (70% white, with a soft edge glow) and a top-left specular crescent, centre (65%, 70.2%).<br>**Pill:** 848×233 (565×155), radius 116, fill 13% white (`#695552` over brown) + blur 24, crisp 1.75 px rim at 45% white all round, 3 px top specular.<br>**Inner dark capsule:** 456×166 (304×111), radius 83, `rgba(0,0,0,.45)` (reads `#261D1E`), inset 38, on the left.<br>**Button:** Ø 165 (110), flat `#241B1A` (measured `#221B20`, no outer glow), gold ring Ø 118 with 7.5 px stroke `#C19359`, ↖ arrow with 7.5 px stroke and round caps. | front, over the chest |
| `visionos-glass-ui` | Spatial-app UI for "how it works" | **Tab bar:** 360×75 (240×50), radius 38, centre (58.3%, 52.3%); labels Photos / **Album** / Favorite at 20 px; back-chevron circle Ø 48 at (35.1%, 52.2%); selected segment `rgba(255,255,255,.22)`.<br>**Window:** 648×520 (432×347), radius 36, centre (52.8%, 66.9%), `perspective(1400px) rotateY(−14°) rotateX(8°)` (rotation estimated), neutral grey glass 16% + blur 26, 1.5 px specular diagonal bottom edge, looping carousel of 3-4 translucent trays.<br>**Dock:** 89×308 (59×205), radius 44, centre (14.9%, 70.1%), icons home / photos / plus at 33 px `#E5E8E8`.<br>**Grabber:** 90×9 white, 24 px under the window. | front, world-locked |
| `phone-glide-in` | Device demo of the result or app | iPhone 15 Pro: body 315×705 (210×470), radius 44, frame `#686767` with lit edge `#F2F1F4`, bezel 9, Dynamic Island.<br>Screen `#F2F1F4` with a looping 3D or app clip, an animated step counter (10 → 18) and a `#21A4F0` progress bar.<br>Final centre (41.7%, 75.8%), rotate **−11.1°** (top leans left). | front, bottom-left quadrant |

---

## 7. Motion vocabulary

**Global rules:**
- Every entrance is an ease-out with a long tail.
- Holds are **perfectly static**: < 1.5% luma change and 0 px drift once the entrance completes.
- **Nothing exits.** The hard cut removes the whole layer.
- First overlay 0-9 F after a cut (median 1 F = 33 ms).

### 7.1 Camera

| id | Keys (F → scale) | Duration | Easing | Trigger |
|---|---|---|---|---|
| `pullback-two-step` | 0 → 2.49<br>1 → 2.49<br>31 → 1.297<br>36 → 1.29 (near hold)<br>72 → 1.00 | 72 F / 2400 ms | Step 1: `cubic-bezier(0.33,0.08,0.02,0.91)` (fit RMSE 0.004)<br>Step 2: `cubic-bezier(0.31,0.08,0.00,0.97)` (RMSE 0.006) | Cut into a key-message WS (hook, feature, CTA set-up). Anchor (50% W, 41% H) = (540, 787) @1080. Motion blur 180° shutter, visible F5-15. 50% of step 1 is reached at F9 and 90% at F20; step 2 reaches 50% at F45 and 90% at F57. |
| `pullback-step1` / `pullback-step2` | Same, split for the current engine: cue 1 at t, cue 2 at t + 1200 ms | 1033 / 1200 ms | as above | — |
| `locked-off` | 1.0 | — | — | Every other shot. No punch-ins, drift, shake or rotation. |

- **World-lock.** Every text and UI element whose preset has `worldLock: true` must receive the **same transform** as the plate (same origin, same scale keys). The current engine scales only `plateWrap` and `talentWrap`; wrap world-locked cues in a container driven by the camera tween.
- In the reference, the hero height goes 243 → 187 px in step 2 while the camera ratio is 0.795.
- **Source resolution:** a 2.49x crop needs 4K. On a 1080p master the opening frames are soft; the reference hides this with motion blur.

### 7.2 Text presets

All in-animations follow. Out = *none (hard cut)* for every preset. "Hold" is the typical time on screen to the cut.

| id | Unit | In: from → to | Duration | Easing | Stagger / timing | Hold |
|---|---|---|---|---|---|---|
| `hero-difference-world` | whole word, world-locked | opacity 0 → 1 (17 F / 567 ms) and blur 12 → 0 px (30 F / 1000 ms), scaleX 1.3 fixed | 30 F / 1000 ms | opacity `cubic-bezier(0.2,0.6,0.35,1)`; blur `cubic-bezier(0.25,0.5,0.4,1)` | Starts F3 (100 ms) after the cut, at the top-right edge while huge. The camera does the drop and shrink. | ≈3270 ms |
| `hero-white-rise` | word, screen-locked | y +63 px → 0 (42 @720 = 3.3% H); brightness 0.73 → 1; opacity 0 → 1 in 4 F | 16 F / 533 ms | `cubic-bezier(0.0,0.1,0.17,0.94)` (fit) | First visible 11 F after the cut | ≈1170 ms |
| `hero-white-world-behind` | word, world-locked, behind talent | opacity 0 → 1 | 3 F / 100 ms | linear | F1 after the cut | ≈4530 ms |
| `hero-cyan-glass-rise` | word, behind talent | y +234 px → 0 (156 @720 = 12.2% H); opacity in 4 F; saturate 0.35 → 1 (12 F); neon rim 0.2 → 1 (7 F) | 18 F / 600 ms | `cubic-bezier(0.04,0.23,0.21,0.97)` (fit RMSE 0.001) | F2 after the cut; offsets 156 / 119 / 65 / 35 / 10 / 0 px at F0 / 1 / 4 / 7 / 12 / 18 | ≈2530 ms |
| `gold-light-panel-grow` | letter, anchored at the baseline (`transformOrigin 50% 100%`) | scale (both axes) 0.3 → **1.12** (10 F / 333 ms) → 1.0 (12 F / 400 ms); blur 6 → 0 (30 F); brightness **1.25** → 1 (31 F / 1033 ms); glow 1.0 → 1.5 (13 F). The glyph ignites small and hot (re-measured F152-F177; the earlier scaleY-from-0 / brightness-0.75 token rendered as a dark squash). | 22 F / 733 ms per glyph | Grow `cubic-bezier(0.2,0.6,0.35,1)`, settle `cubic-bezier(0.45,0,0.55,1)`; single-curve fallback `cubic-bezier(0,0.40,0.35,1.40)` | **Centre glyph first**: ذ body at 0, ذ dot +7 F (233 ms), outer glyphs +9-10 F (300-333 ms). The first alef pre-glows (a thin faint bar at 15%) from −3 F; the cue time is the pre-glow (cut + 3 F), the body grows from cut + 6 F. In a pull-back it grows *and* is world-locked. | ≈2600 ms |
| `gold-spotlight-letters` | letter, RTL | opacity 0 → 1, blur 9 → 0 | 3-4 F / 117 ms per letter | ease-out | 2 F (67 ms) per letter, a 3 F gap between words; glow keeps rising for 20 F (667 ms) | ≈2200 ms |
| `neon-thin-blurfade` | word | opacity 0 → 1, blur 12 → 0 | 4 F / 133 ms | `cubic-bezier(0.2,0.6,0.35,1)` | 12-19 F (400-633 ms) after the hero; optional 6 F (200 ms) glint running along the kashida | ≈2600 ms |
| `neon-thin-typeon` | letter, RTL | opacity 0 → 1, blur 6 → 0, brightness 1.6 → 1 (the newest glyph flashes) | 2-3 F / 83 ms per glyph | ease-out | 1.15 F (38 ms) per glyph; kashida drawn as a stroke; starts 11 F after the cut | ≈1000 ms |
| `neon-word-cascade-float` | word, RTL | opacity 0 → 1, blur 4 → 0; whole line y +33 px → 0 (22 @720) over 26 F / 867 ms | 4-5 F / 150 ms per word | ease-out; line `cubic-bezier(0.2,0.6,0.35,1)` | 6 F (200 ms); range 4-8 F | ≈1500 ms |
| `pill-label-typeon` | letter, RTL | opacity 0 → 1, blur 6 → 0 | 2-3 F / 83 ms | ease-out | 0.7-0.85 F (27 ms) per character; starts 1 F after the pill finishes | ≈1400 ms |
| `search-typewriter` | letter, RTL | opacity 0 → 1; the kashida after ح grows as one stroke from 3 F after ح over 8-10 F, and the next letter appears only when the stroke reaches it (never a gap) | 2 F / 67 ms | linear | 3.7 F (123 ms) per letter; starts 16 F (533 ms) after the morph begins | ≈1870 ms |
| `pill-subline-wipe` | line | clip-path wipe | 40 F / 1333 ms | linear | Starts 21 F (700 ms) after the morph. The reference wipes L → R on RTL text (it shows the end first, a template quirk); use R → L for new work. | ≈1100 ms |
| `english-ghost-centre-out` | line | clip `inset(0 50% 0 50%)` → `inset(0)` with a 90 px soft edge; rests on the centre-hot gradient | 19 F / 633 ms ("You will see.": 13 F / 433 ms) | `cubic-bezier(0.2,0.6,0.35,1)` | 9 F after the cut / hero; the centre letters lead | ≈1200-2200 ms |
| `english-small-blurfade` | word | opacity 0 → 0.75, blur 12 → 0 | 4 F / 133 ms | ease-out | 24 F after the hero | ≈2400 ms |
| `english-tracking-in` | letter, world-locked, behind talent | letter-spacing +76 px (0.4 em) → 0; opacity 0 → 1 | 10 F / 333 ms | `cubic-bezier(0.16,1,0.3,1)` | 2 F (67 ms) per letter; starts 13 F after the cut | ≈4000 ms |
| `english-script-accent` | word, world-locked | opacity 0 → 1 | 2-5 F / 67-167 ms | linear | F5 after the cut ("A lot"), F9 ("His") | ≈3000 ms |

The colour flip on هواي (orange → green over the gum, F41-56) is **not** an animation. It is the Difference blend reacting to the prop sliding behind the word (verifier refuted the "angular wipe").

### 7.3 Graphic presets

| id | In | Loop | Out |
|---|---|---|---|
| `teal-grid-stage` | Grid opacity 0 → 1 from F55 over 15 F (500 ms); gradient 0 → 1 from F60 over 30 F (1000 ms), ease-out | — | cut |
| `prop-3d-enter-spin` | From off the right edge (centre x 112% → 71.5% W) over 30 F / 1000 ms `cubic-bezier(0.2,0.6,0.3,1)`; second move Δ(−150, −150) px at +35 F over 15 F / 500 ms. Flyby variant: right edge 14.7% → 85% W in 17 F / 567 ms. Corner variant: 9 F, then grows 1.45x over 51 F linear. | yaw ≈45°/s (30-60), drift ≈25 px/s | cut (may still be moving) |
| `glass-pill-gold` | Scale 0.15 → 1 from the centre in 11 F / 367 ms `cubic-bezier(0.56,0.27,0.16,0.88)`, 25 F after the gold hero starts. World-lock variant: opacity in 3-4 F / 117 ms at full size. | — | cut |
| `glass-search-morph` | Ring is already on screen at the cut and holds 3 F. Width grows 230 → **905** px in 26 F / 867 ms (`cubic-bezier(0.3,0,0.2,1.15)`; the left edge overshoots), then settles to 848 px over 26 F with the right edge drifting +105 px. Height stays 233. Button pops 0 → 1 at +6 F in 6 F / 200 ms `cubic-bezier(0.34,1.56,0.64,1)`. | — | cut |
| `visionos-glass-ui` | Tab bar opacity in 5 F / 167 ms at F1. Selection slides Photos → Album at F13 in 6 F / 200 ms ease-out. Window fades in 24 F / 800 ms from F18. The dock is revealed only by the camera. | Carousel ≈4 s per turn | cut |
| `phone-glide-in` | From off the left edge, 22 F after the cut. Right edge 6 → 678 px in 52 F / 1733 ms, one continuous deceleration `cubic-bezier(0,0,0.35,1)`. Yaw 90° → 0 in 23 F. Tilt keys F0 0°, F27 −4°, F32 −7.5°, F37 −10.5°, F42 **−12.65°** (overshoot), F52 −11.1°. | Screen counter 10 → 18 over 33 F, bar grows | cut |

### 7.4 Transitions

- **Hard cut only.** There are 9 cuts, with 0 dissolves, whips, flashes, dips, fade-in or fade-out.
- Cuts sit in speech pauses; speech resumes 1-3 F after the cut.
- **Scale-matched cut** MCU → WS punched in to 2.49x, followed by `pullback-two-step`.
- **Size-jump cut** MCU (face 210 px @720) ↔ static WS (face 66 px), a 3.2x jump. Graphics start 1-6 F later.

---

## 8. Edit rhythm and narrative template

Reference shot lengths (F): 102, 47, 97, 97, 139, 141, 87, 163, 139, 101.
- ASL 3.71 s, median 3.38 s, range 1.57-5.43 s.
- The first 11.4 s is faster (2.86 s average); after that ≈4.3 s.
- Text events: 6.2 per 10 s overall and ≈11 per 10 s in the first 16 s.
- Text on screen 61% of the time; clean talking head 36.4%.

| # | Beat | Shot | Ref length | % of runtime | Graphic recipe |
|---|---|---|---|---|---|
| 1 | **Hook** | WS + `pullback-two-step` | 3.40 s (102 F) | 9.2 | `hero-difference-world` (+ `english-script-accent` threaded through it) + `neon-thin-blurfade` across the hero + `english-small-blurfade` + `prop-3d-enter-spin` (main + corner DOF) + `teal-grid-stage` |
| 2 | **Problem** | MCU | 1.57 s (47 F) | 4.2 | `hero-white-rise` (left-aligned, top) + `english-ghost-centre-out` over the chest + `neon-thin-typeon` |
| 3 | **Turn / name the product** | Static WS | 3.23 s (97 F) | 8.7 | `gold-light-panel-grow` (+ shimmer) + neon kashida wrap (`neon-thin-blurfade` with glint) + 3D flyby behind the head + `glass-pill-gold` + `pill-label-typeon` |
| 4 | **Solution** | MCU | 3.23 s (97 F) | 8.7 | `hero-cyan-glass-rise` behind the head + `glass-search-morph` + `search-typewriter` + `pill-subline-wipe` |
| 5 | **Mechanism / feature** | WS + `pullback-two-step` | 4.63 s (139 F) | 12.5 | `hero-white-world-behind` + His script (Difference) + `english-tracking-in` + `visionos-glass-ui` (+ chime) + `neon-word-cascade-float` above the hero |
| 6 | Breather | **Tight CU** (1.3x MCU), clean | 4.70 s (141 F) | 12.7 | none |
| 7 | **Proof / demo** | Static WS | 2.90 s (87 F) | 7.8 | `gold-spotlight-letters` + `english-ghost-centre-out` (under-gold variant) + `phone-glide-in` |
| 8 | Breather / benefit | MCU, clean | 5.43 s (163 F) | 14.6 | none |
| 9 | **CTA set-up** (reprise) | WS + `pullback-two-step` | 4.63 s (139 F) | 12.5 | Same `gold-light-panel-grow` + `glass-pill-gold` (fade variant) + same shimmer + `neon-word-cascade-float` (under-pill, dim) |
| 10 | Spoken CTA | MCU, clean, hard-cut end | 3.37 s (101 F) | 9.1 | none. No end card, logo or fade. |

**Scaling the template:**
- **≈25 s:** 1 Hook 3.4, 2 Problem 1.6, 3 Turn 3.2, 4 Solution 3.2, 5 Feature 4.6, 6 Breather 3.0, 9 CTA set-up 3.6, 10 CTA 2.4. Drop the Proof beat or fold the phone into Feature.
- **≈40 s:** stretch the breathers to 5.5-6.0 s and the Feature to 5.0 s. Never add graphics to the breathers.
- Graphic shots last 1.5-4.7 s. One hero per shot.
- The pull-back is needed on the hook and the CTA set-up. The Feature shot can use it too, but a static WS also works.

---

## 9. Audio and SFX

- **No music bed.** The mix is dialogue-led (speech RMS p50 −17.8 dBFS). The ≈−30 dBFS 50 Hz room tone is incidental; do not add it.
- **No whooshes, risers, impacts or pops** on cuts or camera moves.
- The 2.45-2.70 s "click" has the same band level as the surrounding speech (−37.3 vs −36.9 dBFS), so it is speech, not an SFX.

| Visual event | Sound | Offset | Level (measured band) → render target → engine gainDb |
|---|---|---|---|
| `gold-light-panel-grow` (every time; same asset on the reprise) | Two-tone shimmer: **9250 Hz for 100 ms, then 5600 Hz for 60 ms** | 0 ms (on the first glyph). The reprise landed +200 ms (6 F) on the outer glyphs. | −32…−41 dBFS → −34 (5.6 kHz tail −38) → −23.8 |
| Glass UI shot (`visionos-glass-ui`) | Inharmonic bell chime: partials **4090 / 7000 / 10290 Hz**, 480 ms decay. The loudest SFX. | −33 ms (1 F before the cut) | 4.09 kHz partial −25 dBFS → −25 → −12.5 |
| `english-tracking-in` | Sparkle: 8350 + 11540 Hz, 130 ms | +150 ms | −39 → −39 → −25.2 |
| `pullback-step2` (only in the glass-UI shot) | Sparkle: 8360 Hz for 350 ms, then 12900 Hz for 60 ms | +167 ms | −34…−39 → −36.5 → −29.9 |
| `glass-pill-gold` scale plus label type-on | ≈8.1 kHz ticks at 0 / 240 / 310 / 400 / 670 ms (plus one 4 kHz blip) | +200 ms | ≈−57 dBFS (barely audible) → −50 (the reference room tone is quieter) → −39.7 |
| `neon-word-cascade-float` (CTA sub-caption) | 7.2 kHz tick per word | +100 ms per word | ≈−48 → −48 → −37.3 |
| Search typewriter, ring morph, هو rise, phone glide, gold spotlight | **silence** (no SFX) | — | — |

The engine's procedural `shimmer` (random 2.6-7.2 kHz partials, 800 ms) and `ding` (1320 Hz based) do not match. `style.json` carries a synth spec for each sound in `soundSpecs`, referenced by `sfx[].idealSound`; `engine/audio.py` synthesizes them (`shimmerTwoTone` and `tick8k1Series` carry an explicit `recipe`: flat two-tone, and the five ticks plus the 4 kHz blip). Spec sounds are normalised to −3 dBFS peak, so each rule's `gainDb` is calibrated to put the main partial's sine RMS on its `targetDbfs` (the render target column).

---

## 10. Layout and safe zones

```
1080 x 1920 (720 x 1280)          WS (talent small, seated)                MCU (head + chest)
 y%  ┌──────────────────────┐       ┌──────────────────────┐            ┌──────────────────────┐
  0  │  no text (top 5.5%)  │       │                      │            │                      │
  7  ├──────────────────────┤       │ HEADLINE BAND  7-28% │            │ HERO 7-31% (may go   │
     │                      │       │ hero / gold line /   │            │ BEHIND the head)     │
     │                      │       │ English echo         │            │   ┌────────┐         │
 28  │                      │       ├──────────────────────┤            │   │  FACE  │ 17-55%  │
     │                      │       │   face 29-38% clear  │            │   │ never  │         │
 38  │                      │       │   (script may tuck)  │            │   │covered │         │
     │                      │       │      body ~65%       │            │   └────────┘         │
 50  │                      │       ├──────────────────────┤            │                      │
     │                      │       │ LOWER BAND 50-94.5%  │            ├──────────────────────┤
     │                      │       │ 3D props, gold glyph │            │ CHEST BAND 63-79%    │
     │                      │       │ pills, glass UI,     │            │ ghost English, neon  │
     │                      │       │ phone (bottom-left)  │            │ line, glass pills    │
 87.5├──────────────────────┤       │ (props may reach     │            ├──────────────────────┤
     │ no text (bottom      │       │  94.5%)              │            │                      │
100  │ 12.5% = 240 px)      │       └──────────────────────┘            └──────────────────────┘
     L margin 5.1-8.1% (56-87 px)   centre axis x = 50% (48.6-50.6)      R margin ≥ 8% (86 px)
```

- **Safe area @1080:** top 105 px, bottom 240 px, left 56 px, right 86 px. Heroes may bleed full-width only while world-locked during the pull-back.
- **Talent framing:**
  - WS: head at 29-38% H, face ≈9% W, body down to ≈65% H, x 39-64%
  - MCU: eyes at 33-35% H, chin at 50-55% H, face ≈29% W
  - Tight CU: head 1.3x the MCU, eyes ≈35% H

---

## 11. Do / Don't

**Do**
- Use one hero word per graphic shot, in a new material each time. Reprise only the gold-panel + pill template for the CTA set-up.
- Let words overlap: script through the hero, neon across the hero, the English cap line on the Arabic baseline.
- Put the hero high and behind the head; put support lines and UI on the chest, in front.
- Open key-message wide shots with the two-step pull-back and parent their text to it.
- Keep 3-5 s clean MCU or CU breathers after the first ~16 s.
- Widen Arabic with kashida, and let thin kashida glow as lines.
- Crush the blacks, roll the highlights off near luma 168, keep the walls teal and the skin warm.
- Tie each SFX to a graphic type, keep it tonal, and keep it 13-40 dB under the voice.
- Make 3D props photoreal, unshadowed, entering from an edge, spinning slowly.

**Don't**
- Set a full sentence large, use two heroes in one shot, or use mid-weight Arabic body text.
- Animate anything out, or add breathing / glow pulses / push-ins during holds.
- Cover the face, or put text in the bottom 12.5% or top 5.5%.
- Use whooshes, impacts, risers, flashes, whip pans, shakes, beat-synced cuts or music.
- Put graphics on every shot, or end on a CTA card, logo or fade-out.
- Use Readex weight > 700 (it doesn't exist; fake it with a stroke) or HEXP widening.
- Expect a grade to turn a warm set teal; replace or relight the background instead.
- Use the Difference peach hero on a non-teal plate without recomputing its base colour.

---

## 12. Applying this style to new footage: checklist

1. **Check the source footage.**
   - Seated talking head, locked tripod, 4K preferred (needed for the 2.49x punch-in), 50 fps preferred (optional 2-2-1 judder emulation).
   - Two framings, ideally from two cameras or two takes:
     - **WS:** seated full body centred, head at 29-38% H of the 9:16 frame, ≥28% headroom for the headline band.
     - **MCU:** head and chest, eyes at 33-35% H.
     - Optionally a tighter CU.
   - Dark solid wardrobe (chocolate, navy, black; no fine patterns). Low-key light: key from camera-left, cyan/blue rim from the right.
   - Clear pauses between phrases (cut points).
2. **Script map.** Split the voice-over into the 10 beats of §8. For each graphic beat pick **one Arabic hero word**, its literal English echo, and ≤ 1 support line. Mark the product keyword for the gold template, which is used twice.
3. **Edit first.** Cut WS ↔ MCU alternately in speech pauses, using the target lengths in §8. Keep the later MCUs clean.
4. **Prepare plates.** Bake the grade (§4.3: normalise the face median to ≈0.50, apply the look, check the targets), then run `python3 prepare.py graded.mp4 ../renders/plate_X`. This produces 1080x1920 frames, **person mattes** (needed for behind-talent text and background replacement) and the face track.
5. **Set.** If the set is not dark teal, add `bg-replace` cues with the AI WS and MCU plates (§5): blur 2-4 px for WS, 14-20 px for MCU. Add the ceiling-tube haze on WS and the cyan rim relight on the talent.
6. **Assets.** Generate or render the domain 3D prop as a transparent PNG turntable (180 F), a flyby object, phone-screen content (loop plus counter), and 3-4 translucent items for the glass-UI carousel.
7. **Fonts.** In `engine/`: `npm i @fontsource/pinyon-script` (Readex Pro and Inter are already installed).
8. **Scene.** Write `scene.json` cues per beat with the preset ids above. Hero cue times are 1-11 F after the cut, support lines +14-24 F, components per §7.3. For pull-back shots add `pullback-step1` at the cut and `pullback-step2` at cut + 1.2 s. Set `cue.end` to the next cut on everything.
9. **Engine gaps.** The smoke render (`scratch_style/smoke_sheet.jpg`) ran clean, but the current runtime does not yet implement the following. Build them in a `style-2/components.js`, or accept the fallbacks:
   - world-lock containers following the camera (fallback: screen-locked fades)
   - per-glyph alpha gradients for the gold panel (fallback: single gold fill)
   - the cyan extrusion and neon rim (fallback: gradient plus glow)
   - multi-`tracks` sub-animations
   - kashida auto-fit
   - `perUnit` SFX and the `soundSpecs` tones
   - `overlays.bottomFade`
10. **SFX.** Use `autoSfx: true` with the `style.json` rules. Audition them, then remove anything not in the §9 table. No music.
11. **QA against measurable targets:**
    - plate p99.9 ≤ 170, face median 112-128
    - hero ink width 53-86% W
    - ≤ 7 words on screen
    - first overlay ≤ 9 F after each cut
    - no text in the bottom 240 px
    - face never covered
    - ≈36% of runtime clean

    Render a contact sheet (`tools/sheet.sh out.mp4 sheet.jpg 2`).

---

## 13. Annotated reference timeline (condensed)

Times are at 30 fps.

| Time | Frames | Shot | What happens |
|---|---|---|---|
| 0.00-3.40 | 0-101 | S1 WS, pull-back | Opens at 2.49x. F3: هواي (Difference peach) enters at the top-right while huge, defocused (screen edge width 25.6 px at F6 → 4.9 px at F40). F5: "A lot" script. F22-25: اشخاص neon blur-fade. F28-31: "people" ghost. Step 1 ends F31, near-hold to F36, settles at 1.000 at F72. F41-50: blurred top-left typodont slides in under ي (Difference turns it green). F48-80: the main typodont glides in from the right, then a second move at F83-98. F55-90: grid stage fades in. |
| 3.40 | 101/102 | cut | WS → MCU in a speech pause |
| 3.40-4.93 | 102-148 | S2 MCU | F111-130: "because" reveals centre-out. F113-128: طـول المـدة مالتـه types on. F113-129: وبسبب rises 42 px @720. |
| 4.97-8.17 | 149-245 | S3 static WS | F152: right-alef pre-glow. F155-177: gold اذا grows from the baseline with +12% overshoot (ذ peaks at F165-166) plus the **shimmer** at 5.17 s; brightness ramps until F186. F158-175: 3D aligner tray flies in from the left **behind the head**, then spins. F167-170: بعدك blur-fade with a kashida glint. F180-191: glass pill scales up. F192-203: التقويم الشفاف types on. Ticks at 6.2-6.9 s. |
| 8.20-11.40 | 246-342 | S4 MCU | The glass ring is present at the cut. F248-266: هـو rises 156 px @720 behind the head, desaturated → cyan. F249-300: ring → search pill (max 603 px @720 at F274, settles 565). F252-258: gold arrow button pops. F264-286: حـل عملي typewriter. F270-310: sub-line wipe. No SFX. |
| 11.43-16.03 | 343-481 | S5 WS, pull-back | **Chime** from 11.40 s. F344-349: tab bar. F345-347: فكرته (behind head). F352-357: His (Difference cyan). F353-361: tab selection slides Photos → Album. F356-366: "idea" tracking-in + sparkle. F361-385: glass window fades in; dock revealed by the camera; sparkle on step 2. F436-462: مصممة خصيصا لأسنانك word cascade, rising 22 px @720. |
| 16.07-20.73 | 482-622 | S6 tight CU | Clean breather (head ≈1.3x the other MCUs) |
| 20.77-23.63 | 623-709 | S7 static WS | F624-641: راح تشوف per-letter gold, glow rising until F644. F633-646: "You will see." centre-out. F648-700: phone glides in from the left, yaw-in, tilt overshoot to −12.65° then −11.1°, counter 10 → 18. No SFX. |
| 23.67-29.07 | 710-872 | S8 MCU | Clean (the longest shot, 5.43 s) |
| 29.10-33.70 | 873-1011 | S9 WS, pull-back | Gold اذا reprise: dot F881, body F882-887, alefs F887-891 (grows *and* world-locked), **same shimmer** at 29.55 s. F888-891: pill fades in at full size (33 px higher than S3). F896-906: التقويم الشفاف types on. F919-936: مناسب لحالتك او لا word cascade with 7.2 kHz ticks. |
| 33.73-37.10 | 1012-1112 | S10 MCU | Clean spoken CTA. Hard-cut end, no card, no fade. |

---

## 14. Residual uncertainty

- **Fonts:** unconfirmed. The originals are probably SF Arabic and SF Pro Display. Readex Pro and Inter are the closest available matches, calibrated by size. The script font (Pinyon) is low confidence.
- **visionOS window:** its 3D rotation is estimated. The other UI sizes were measured at F420 only.
- **3D props:** yaw speeds are visual estimates. The cyan-glass extrusion depth and offset are construction choices that reproduce the measured rim, gradient and glow.
- **SFX levels:** derived from narrow-band energy; audition them. Whether a very quiet pad sits under the room tone cannot be settled without listening.
- **Judder:** the 2-2-1 cadence (likely a 50 → 30 fps master) is optional. Native 30 fps renders will look smoother than the reference.

---

## Engine implementation

`components.js` (this folder) is loaded by `engine/render.mjs` after `components-shared.js` and before the runtime. It needs no assets: the props, UI and backdrops are procedural (CSS glass, SVG, canvas 2D). It is deterministic: GSAP tweens on `ctx.tl`, or pure functions of time in `ctx.onFrame`. It targets engine v2 (`MG.engineFeatures.version` 2): frame 0 and cue starts on frame boundaries render without priming, camera cues are cuts, and `end` hides a text exactly.

### Text: every preset goes through `s2Text`

`s2Text` is registered as the engine's text builder (`MG.textBuilders`) for every `textPresets` id, so a plain `{"type": "text"}` cue of this style builds through it; `"raw": true` bypasses it. The generic part goes through `ctx.makeTextBase`, so `t`, `end` (hard cut), `in`, `override`, `style` and `position` mean the same as for any engine text, and the engine tags the element `data-cue` / `data-preset`. `s2Text` then adds what the generic interpreter cannot do:

| Need | What `s2Text` does |
|---|---|
| World-lock **plus** a blend mode (`hero-difference-world`, `english-script-accent` His-difference) | The text sits in a camera-following wrapper (`ctx.worldMatrix`) inside the **screen** layer, and the wrapper carries the blend. Engine v2 can blend world-locked text inside its `…W` layers, but a `…W` layer sits above the whole screen layer of its plane: the Difference هواي then also inverted the neon line اشخاص and the corner typodont stacked in front of it (scene_test F10-77). |
| `gold-light-panel-grow` | Per-glyph spans with the `glyphGradients` mapped onto each glyph's ink box. The **same alpha profile** (parsed from the gradient's stops) masks that glyph's emissive glow, 3 px `#FDD99B` rim and pre-glow, so the transparent ends of the outer alefs stay transparent (measured: right-alef top third within +0..+18 luma of the plate). Ignition: scale 0.3 → 1.12 → 1 in both axes from the baseline, brightness 1.25 → 1, blur 6 → 0, glow already on. Timing inside the builder: the cue time is the first-alef pre-glow (a thin faint bar), the centre body starts `preGlow.leadMs` (3 F) later, its dot `dotDelayMs` (7 F) after the body (ذ/ز/ظ/ض/خ/غ are split into the undotted skeleton plus a masked dot), outer glyphs at +9 / +10 F. The ink bottom sits on `yPct`. |
| `hero-cyan-glass-rise` | Layers back to front: wide grey-white glow (`effects.glowLayers`); 14-step `#2E6E78` extrusion to (−8, +10) with a 4 px faux-bold stroke; neon rim (a filled `#05F3F8` copy shifted ≥ 6 px up-left along `neonRim.offsetDir`, 9 px glow, never thinner than 6 px whatever the fitted size); inner wall light; gradient face with the bottom overlay. The rim therefore shows on the top/left outer contours and the lower inner edges of the counters, as in k_020. Perspective rotateX 6° / rotateY −4°. Rise +234 px, opacity 4 F, saturate 0.35 → 1, rim 0.2 → 1. The ink centre sits on `yPct`. |
| Gradient fill + glow (`gold-spotlight-letters`) | The glow moves to a transparent-text underlay that mirrors the face units every frame, each letter with its own `--glow-k` (the `glowStrength` 0.4 → 1 ramp runs per letter). The engine's own fix (a drop-shadow chain on a host) is skipped on purpose: it carries one `--glow-k` for the whole word and renders a different halo (A/B up to 130 levels). |
| Split gradient spans (`gold-spotlight-letters`, `english-*`) | The engine gives every letter/word span the element's gradient, but a background only paints inside its span's box: the bowl of a final ح (راح) and Latin descenders came out transparent while their glow showed. The spans are padded 0.35 em top/bottom (a negative margin keeps the layout) and the gradient is re-projected onto them after layout; `english-tracking-in` projects it at its rest letter-spacing. |
| Neon (`neon-thin`) | Adds the 4 px white tight halo (`tightHalo`) as ONE text-shadow layer. The engine's `tightHalo` alias (three layers, 1 / 2.4 / 4 px) is skipped because a component set the shadow first; it read 10-17% bolder on the whisper-thin strokes. `neon-thin-blurfade` runs a travelling flare along the kashida (`optionalGlint`; turn it off with `"glint": false`). |
| Letter type-ons (`neon-thin-typeon`, `search-typewriter`, `pill-label-typeon`, `gold-spotlight-letters`) | The presets set `in.tatweelUnit: "run"`, so the engine builds every tatweel run as **one** span (`data-tatweel`; per-tatweel inline-blocks left comb-like antialiasing seams). The builder retimes the letters and grows the run as one stroke (scaleX from its joining side). On `search-typewriter` the stroke starts `kashidaLeadMs` (3 F) after its letter, grows over `kashidaGrowMs` (300 ms), and the next letter waits until it is fully drawn, so joined letters never show a gap. Other type-ons draw it inside the letter's slot. `gold-spotlight-letters` gets its 3 F word gap and per-letter glow ramp. The retime nulls the preset's from/to, so the engine's unit gating leaves these units alone. |
| `neon-word-cascade-float` | Adds the line float (`lineTrack`: y +33 → 0 over 867 ms). |
| `english-ghost-centre-out` | Centre-out reveal with a 90 px soft edge: an animated mask instead of a hard `clip-path`. |

Extra cue fields:
- **`"fit": true | widthPct`**: auto-kashida to a target ink width, using the order in §3.5 (size, then scaleX ≤ 1.3, then kashida). Words that overflow the target shrink instead. It is on by default for `hero-difference-world`.
- **`"kashidaAt": n`**: inserts the kashida after letter `n` (for example `1` for بعـدك).
- **`"variant": "<name>"`**: applies a preset's `variants` block, such as `His-difference`, `A-lot-under-hero`, `under-gold` or `under-pill`.
- **`"raw": true`**: bypasses `s2Text` and uses the runtime's plain interpreter.
- `{"type": "component", "component": "s2-text", "preset": …}` is the same builder in component form.

### Components (`"type": "component"`)

| id | Main cue fields | Notes |
|---|---|---|
| `teal-grid-stage` | `in.gridOpacity` / `in.gradientOpacity` (`startMs` relative to the cue), `props.region` | Inserted as the first child of its layer, so it sits under the props and the hero. |
| `prop-3d-enter-spin` | `variant`: `hero` \| `corner-dof` \| `flyby-behind-head`; `model`: `typodont` \| `aligner` \| `teeth`; `widthPct`; `position` (final centre); `yaw0`; `yawDegPerSec`; `pitchDeg` (> 0 looks down onto the object); `rollDeg`; `shellAlpha`; `gain`; `softenPx`; `detail`; `worldLock` | Canvas-2D painter's renderer: superellipsoid teeth on an elliptic arch, swept horseshoe gums. Smooth shading: position-keyed vertex normals, each quad filled with a gradient between its shaded edges, plus a 0.8 px soften on the tray. The aligner is a **hollow** shell (crown shells fused by thin buccal and lingual margin walls) in a neutral milky grey (R ≥ B), composited at `shellAlpha`. Aligner defaults: pitch 14°, yaw0 −62°. Motion blur: 180° shutter, at most 4 sub-copies plus a light directional soften (more copies smeared the translucent tray into smoke). 12 px depth of field on `corner-dof`. `flyby` defaults to the `behind` layer. **Flyby behind a CU/MCU head:** keep the elevation low (pitch 9-14°) and tilt it (roll ≈ 11°, rising to the right, as in k_013) at ≥ 100% W through the forehead/hairline, with yaw ≤ 22°/s so the opening never faces the camera; a steep pitch closes the U around the head and reads as a halo or horns. |
| `glass-pill-gold` | `label` (types with `pill-label-typeon`); `variant: "world"` (opacity in 117 ms at full size, used in pull-backs); `position` | Blur 24, warm spill, cool side, rim. The label follows the pill's position. |
| `glass-search-morph` | `position` (pill centre); optional `label` / `sub` (otherwise write `search-typewriter` + `pill-subline-wipe` cues at +533 / +700 ms) | Milky ring (22% white, blur 18) carried by bright 1.75 px inner/outer rims with edge glow and a top-left specular crescent; the hole is untouched → pill. Width 230 → 905 → 848 px with the left edge overshooting and the right edge drifting. Crisp rim all round, `rgba(0,0,0,.45)` capsule; flat `#241B1A` button with a `#C19359` ring and ↖ arrow that pops at +6 F. |
| `visionos-glass-ui` | `offsetPct: [dx, dy]`, `items` (carousel trays) | World-locked by default. Tab bar with the selection slide, back chevron, perspective window with a 4 s tray carousel (procedural trays), grabber, dock. |
| `phone-glide-in` | `position` (final centre), `in.durationMs`, `counter` | iPhone frame, bezel and Dynamic Island. Right edge 6 → 678 px, yaw 90 → 0, tilt keys to −12.65° then −11.1°. Live screen: rotating typodont, step counter 10 → 18, `#21A4F0` bars. |
| `teal-clinic-backdrop` | `variant`: `mcu` \| `ws`; `blurPx`; `seed` | Background replacement on warm or busy plates (needs mattes). Drawn already in the graded look: teal walls, LED glow, ceiling tubes + `tubeHaze` on the WS, lamp blob and bokeh on the MCU. |
| `cyan-rim-relight` | `opacity` (default 0.32) | Soft-light `#045A79` on the talent's right edge, drawn from the engine's camera-transformed person matte of the frame (`ctx.matteCanvas`, the matte that cuts out the talent). |

Every component (and the two bespoke heroes) is hidden exactly at `cue.end` by its own visibility set. The engine's cue lifecycle only takes a cue's DOM out of the render tree outside [t − ½ frame, end + ½ frame], so an `end` placed just before a cut frame (4.598 / 8.398 in the doctor demo) would otherwise still show on that frame (A/B without it: S1 gold + pill on F138, the cyan hero on F252).

**Camera.** Use `pullback-two-step` for real wide shots. `pullback-two-step-mcu` (added to `cameraMoves`) keeps the same timing and fitted curves, with the scale keys at S^0.5 (1.578 → 1.139 → 1.136 → 1.0). Use it for CU/MCU-only footage, where 2.49x would push the face past the frame. A static crop is `{"type":"camera","move":"static","scaleTo":1.25,"focus":[0.5,0.36]}`, placed exactly on the cut: camera cues are cuts, and the engine never motion-blurs across a cue start.

**Grade.** Footage already shot or graded in this look must set `"grade": false, "overlays": false` in the scene (or be prepared with `prepare.py --pre-graded`, which skips the style grade and overlays unless a scene forces them). On the doctor plate, which is the reference's own S6/S8, the CSS grade dropped mean luma from 53-59 to 23-26 (target 50-62). Ungraded foreign footage keeps the style grade, plus `teal-clinic-backdrop`.

**SFX.** `"autoSfx": true` fires the style's `sfx` rules, and the engine plays each rule's `idealSound` from `soundSpecs` (§9): `shimmerTwoTone` on the gold centre glyph (cue + 100 ms, 9.25 kHz at −34 dBFS, 5.6 kHz tail at −38), `tick8k1Series` with the 4 kHz blip from the pill (+ 200 ms, about −50 dBFS), the glass chime, the sparkles and the per-word cascade ticks. They follow the cue times, so nothing has to be re-rendered when a cue moves. `"idealSfx": false` falls back to the engine's procedural stand-ins (`shimmer`, `tick`, `chime`, `sparkle`), which only approximate the specs: the engine shimmer sits at 2.5-7.5 kHz, in the same band and level as speech sibilance, so it reads as hiss. No sound fires on a bare `pullback-two-step(-mcu)` cue; the step-2 sparkle rule needs the split `pullback-step2` cue.

### Demo and QA scenes (`demo/`)

- **`scene_doctor.json`** is the 10 s demo on `renders/plates/doctor`. Iraqi-dialect clear-aligner copy, with the voice-over transcript in `script`. Output: `renders/demos/style-2/style-2_doctor.mp4`, `sheet.jpg` and `stills/`.
  - **S1 (0-4.6 s, CU, `pullback-two-step-mcu`)** shows the turn word اذا as a world-locked gold light panel (580 px, ink 52% W × 24% H, ink bottom 79.3% H) with the measured shimmer, a neon kashida wrap تـــريد laced through the gold's lower body (kashida ≈ 40 px above the gold bottom, ≈ 22 px above the pill top), a world-locked glass pill landing with the alefs and typing التقويم الشفاف (ticks), and a tilted 3D aligner tray flying in behind the head through the hairline. No script echo here: over the gold it was illegible and the reference turn shot has none.
  - **S2 (4.6-8.4 s, MCU)** shows the cyan glass hero شفاف behind the head (fit 84% W, ink centre 16.5% H: the crown hides only the stroke bottoms, the word stays legible), the ring → search-pill morph, the typed مـــا ينشاف whose kashida grows as one stroke before ا arrives, and the sub-line wiped right to left.
  - **S3 (8.4-9.97 s, tight 1.25x crop)** is the spoken CTA: clean, with a hard-cut end.
- **`scene_test.json`** exercises every text preset and component in six timed groups (stills 40, 75, 110, 150, 195, 240, 285 → `renders/demos/style-2/test_stills/`).
- **`scene_test_backdrop_mcu.json`** (on `ref1_breather`) and **`scene_test_backdrop_ws.json`** (on `ref3_breather`) test background replacement and the rim relight on warm sets.

```bash
cd engine
node render.mjs --plate ../renders/plates/doctor --style ../styles/style-2/style.json --scene ../styles/style-2/demo/scene_doctor.json --out ../renders/demos/style-2/style-2_doctor.mp4 --workers 2
tools/sheet.sh ../renders/demos/style-2/style-2_doctor.mp4 ../renders/demos/style-2/sheet.jpg
```

`render.mjs` mixes the audio itself (voice + rule SFX, −1 dBFS limiter), pads it and cuts the output to exactly 299 frames; the old `--no-audio` + external `apad` mux is no longer needed.

### Engine v2: workarounds removed and kept

Checked A/B on PNG stills of all four scenes (125 frames, run-to-run noise 0) and on the demo MP4 against the v1 baseline (`renders/baseline/style-2_doctor.mp4`: PSNR 49.4-∞ dB, frames 252-298 bit-identical, 299 frames both).

Removed (the engine now does it, render unchanged):
- the `boot()` timeline nudge (time 1e-4 → 0) wrapped around every component: the engine primes both masters and seeks `t + EPS`;
- rewriting text cues into `s2-text` component cues at load: `MG.textBuilders` routes them, `ctx.makeTextBase` builds the generic part;
- the style's tatweel-run merge: `in.tatweelUnit: "run"`;
- the cut-time crop 0.75 F before the cut: camera cues are cuts;
- the rim relight's own matte PNG loading and camera transform: `ctx.matteCanvas`;
- the local camera matrix: `ctx.worldMatrix`;
- `demo/make_sfx_doctor.py` + `demo/sfx_doctor.wav` and the scene's `music` bed, with `"sfx": false` on the gold and pill cues: the engine synthesizes `soundSpecs` (band levels within 0.3 dB of the old bed, onsets within 0.3 ms);
- the `--no-audio` + manual `apad` mux.

Kept, because the native path renders differently:
- the screen-layer `worldWrap` for world-locked Difference text (stacking; see the text table);
- `glowUnderlay` for gradient + glow (per-letter glow ramp);
- the single-layer 4 px neon `tightHalo` (the engine alias is bolder);
- `cutVis` hard cuts on components and heroes (the lifecycle has ½ frame of slack).

Fixed on the way (v1 defects, not engine regressions):
- split-gradient spans are padded so the ح bowl of راح and Latin descenders paint (missing in the baseline test stills at F285);
- `phone-glide-in` starts loading the canvas font weights it draws (Inter 500 / 600) during the build; the engine preloads only the declared weight, so the first phone frame a page drew used a fallback font and the screen text depended on which frames had been rendered before.

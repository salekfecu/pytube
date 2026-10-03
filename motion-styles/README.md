# Motion styles: index

Three vertical (9:16) Arabic talking-head marketing reels were studied frame by frame and turned into reusable motion-graphics styles. Each style has a human guide (`STYLE.md`) and machine tokens (`style.json`) that the engine in `engine/` renders onto new footage.

```
motion-styles/
├── README.md                  ← this index: what each style is, comparison, shared building blocks
├── STYLE_SELECTION.md         ← how to pick a style for a new video (rubric, decision tree, mix rules, examples)
├── shared-components.json     ← components common to all styles, with per-style parameter overrides
├── styles/
│   ├── style-1/  STYLE.md  style.json   Ember Glass         (ref1_chemistry.mp4, MAX Academy chemistry promo)
│   ├── style-2/  STYLE.md  style.json   Teal Spatial Glass  (ref2_medical.mp4, dentist / clear-aligner promo)
│   └── style-3/  STYLE.md  style.json   Crimson Halo Glass  (ref3_third.mp4, "why is your ad weak", marketing for teachers)
├── engine/                    ← deterministic renderer (prepare.py → scene.json → render.mjs), see engine/README.md
├── renders/                   ← test plate, SFX demos, outputs
└── _work/                     ← reference frames, filmstrips, metrics, scratch evidence (see _work/INDEX.md)
```

All production values target a **1080×1920 @ 30 fps** canvas. Reference measurements are 720×1280 (×1.5). Durations are in ms.

---

## 1. The three styles

### Style 1: Ember Glass (`styles/style-1`)
A warm, premium talking-head reel built on a saturated **red-orange studio with crushed blacks** (hue 16-24°) and a presenter in a **dark teal shirt**, which gives an orange/teal complementary split. The presenter stands. Shots alternate strictly between full-body wides and 2.35× MCUs, and between the plain studio and AI "world plates" (a chemistry lab) with props layered in front of and behind the presenter. All type is IBM Plex Sans Arabic in two extreme weights, Bold 700 and hairline 200. Captions type on glyph by glyph out of a blur. The UI is glassmorphism in front of the presenter. Speech drives every cut, and the reel ends on a static hold of a glowing payoff word.

Signature moves:
- **Punch-out settle** on every new beat: 138% → 100% in 567 ms, `cubic-bezier(0.25,0,0.1,1)`, anchored on the face. Only the plate and the talent scale; the captions do not.
- **Blur type-on with live reflow and tracking settle.** Each glyph goes blur 12 → 0 in 100-167 ms with a 25-50 ms stagger, then the line width tightens 4-9%.
- **700 / 200 pairing with kashida.** Thin words are stretched with repeated tatweel, and one 45-tatweel kashida becomes a 44% W rule.
- **Exactly one "special material" word per section:** gold gradient with an amber glow, a hot-yellow flash cooling to white, orange 3D on a B&W frame, or ice chrome with a cyan rim.
- **Glass kit:** torus rings spring-pop (110/93/100%) and stretch into stadium capsules. Each capsule has a dark disc button with a lime ring and an arrow. Refractive lens discs and rings bend the captions beneath them.
- **One B&W focus-pull interrupt**, a 2.7 s clean breather, then a 1.27 s static hold of the payoff word.

### Style 2: Teal Spatial Glass (`styles/style-2`)
A low-key **teal-and-orange interview look** in a dark clinic: cyan practicals, crushed blacks, and plate highlights capped near luma 168 so the graphics own every true white. The presenter is seated and wears chocolate scrubs. Every graphic shot is built around **one enormous Arabic word** (53-86% of frame width), and each one gets its own material. Around it sit a thin Readex-200 neon line with long glowing kashida and a ghosted English translation. Apple / visionOS glassmorphism and photoreal 3D product props are layered in front of the presenter, while the hero word often sits behind his head; his face is never covered. Key-message wide shots pull back in two steps and carry world-locked text with them. Later MCUs stay clean. There is no music.

Signature moves:
- **Two-step pull-back:** 2.49× → 1.297× in 1033 ms, a 5-frame near-hold, then → 1.0× by 2400 ms. Both curves are fitted to tracked data, and the text and UI are world-locked to the move.
- **One hero word per graphic shot in a new material each time:** Difference-blended peach `#FCC29E`, flat white, cyan 3D glass with a `#05F3F8` neon rim, a per-glyph gold light panel with a 75 px glow, or gold with a centre spotlight.
- **Words interlock instead of stacking.** A hairline neon Arabic line crosses the hero, an English echo (centre-hot alpha fade or copperplate script) threads through it, and heroes hide behind the head through the matte.
- **visionOS glass kit:** a ring morphs into a search pill with a gold `#C19359` arrow button, plus a tab bar, a perspective window and an iPhone tilted −11.1°.
- **Strict WS ↔ MCU hard cuts in speech pauses.** Nothing ever animates out, and 36% of the runtime is clean talking head.
- **Sparse tonal SFX:** a 9.25 → 5.6 kHz gold shimmer, a 4.09/7.0/10.29 kHz glass chime and near-inaudible ticks.

### Style 3: Crimson Halo Glass (`styles/style-3`)
A low-key, **almost monochrome crimson** reel. A seated presenter on a black chair sits in a red seamless studio (wall `#4E0005`, top band `#1C0000`). A faint **red sunburst halo** of about 45 rounded rays radiates from just above her head. The grade is extreme: blacks at 0, mean saturation 190-237, a vignette about 2 stops deep. All type is **Almarai**, ExtraBold 800 for everything that punches (the Latin wordmark included) and Light 300 for every supporting line. It is flat warm white `#FDFBF9` with no stroke, shadow or glow, and one beat of 3-7 words is on screen at a time. Emphasis comes from **light, not new colours**. Every camera move is a centred digital **pull-back** that delivers world-locked type. Hard cuts flip tight ↔ wide, and the audio sits on a loud 41 Hz sub bed.

Signature moves:
- **Sunburst halo** behind the talent, locked to the plate. It is only +30-35 R over the wall.
- **Four centred pull-backs:** 1.69 → 1 in 880 ms (hook); 1 → 0.27 into a smoky void (problem question); 1.72 → 1 over 3.5 s with foreground roses (breather); 1.73 → 1 brand drop. Hook and brand type are parked off-frame and flown in by the zoom.
- **Light as emphasis:** a pink-red band (`#F03039`) sweeps right → left over the white hero, a rose sheen sits on the hook word, and there are red neon outlines, translucent red ghost mega-words and a red copperplate script.
- **Difference-blend question words.** White over red reads cyan `#ACFAF6`; this is the only cool colour in the reel.
- **Frosted-glass depth sandwiches:** an arch rising from the bottom edge, smoked capsules, and diagonal corner slabs that push the old keyword behind glass while the new one lands crisp on top.
- **Voice-first sound** on a 41 Hz sub bed about 3 dB under the voice, with only 4-5 tiny HF SFX, all on text events.

---

## 2. Comparison matrix

| | **Style 1: Ember Glass** | **Style 2: Teal Spatial Glass** | **Style 3: Crimson Halo Glass** |
|---|---|---|---|
| **Reference** | 23.9 s, 30 fps, MAX Academy chemistry promo, standing female teacher | 37.1 s, 30 fps, dentist / clear aligners, seated male doctor | 27.4 s, 25 fps, marketing for teachers, seated female presenter |
| **Palette** | Red-orange studio `#7E3302` / `#692501`, near-black corner `#210601`, amber floor `#AF6303`; captions `#FFFFFF`; gold hook `#FFF7F0→#FFD130→#FFDC92`; lime UI `#DAD530`; teal/cyan reserved for props and the payoff (`#01DDD6`, rim `#6AF3F7`); teal wardrobe `#2C3C40`. **No blue or purple.** | Dark teal `#183C49`, blue-cyan `#045A79`, LED `#015A96`; hero whites `#FAFCFF`; neon `#FFFBF9`; gold `#D5AD6A`/`#FDD99B`; cyan glass `#01B6C4` + rim `#05F3F8`; peach Difference `#FCC29E`; gold UI `#C19359`; skin warm, plate ≤ luma 168 | Monochrome red: wall `#4E0005`, top `#1C0000`, rays `#6B0505`; type `#FDFBF9`; sweep `#F03039`; neon `#CF0108`; script `#EC0206`; UI `#FE030A`. **Cool colours only via Difference** (`#ACFAF6`). |
| **Typography** | IBM Plex Sans Arabic **700 / 200** only (300 for one dark sub-line); Inter 900/600/400 for the Latin brand only. Hero : support 1.5-1.9. Hero 116 (MCU) / 165 (wide) px, support 69 / 113 px, payoff 234-245 px. Tatweel 0.10 em. ≤ 3 words per line, 2-4 lines per card. | Readex Pro **700 / 200** (+600 heroes, 300 pill sub); Inter 700/500 (English echo, UI); Pinyon Script (accent). Heroes sized by ink width (53-86% W, 165-600 px); neon 46-177 px. Tatweel 0.08 em; widen with kashida, never tracking. 1 hero + ≤ 2 support lines. | Almarai **800 / 300** only (also the Latin wordmark); Pinyon Script (red script); Inter 500 (UI chip). Hero : subtitle 2.7 (141 : 52 px). Tatweel 0.18 em. One beat at a time, 3-7 words, never wraps. |
| **Text motion** | Glyph-by-glyph blur type-on with live reflow and a 400 ms tracking settle; glyph-pop giant word; hot-yellow glow sweep; Latin letters fade in place. Exits: hard cut, except a reverse type-off in the closing shot. | Whole-word blur fades and rises (`y +63 → 0`); per-glyph gold panel grow, centre glyph first, with 1.12 overshoot; neon type-on at 38 ms per glyph; English clip reveal from the centre out. **Nothing ever exits.** World-locked heroes shrink with the camera. | RTL glyph pops (80 ms stagger, scale 0.6 → 1); word fade-rise (320 ms stagger); typewriter subs at 22 ms per glyph; a karaoke light band R → L over 1.92 s; neon blur-in by clusters; kashida drawn behind the head. 2-3 frame split exits and 1-frame word swaps. |
| **Graphic components** | 14: ring-pop → capsule, name-tag capsule + echo, CTA button (lime ring), clear and smoked pills, lens disc and lens rings (refraction), bead → orange CTA capsule, badge-ribbon depth sandwich, glass molecule, flask + fog, clay UI card, HUD panels | 6: teal grid stage, photoreal 3D prop (enter + spin), gold glass pill, ring → search pill with gold arrow, visionOS tab bar / window / dock, iPhone glide-in | 11: sunburst halo, glass arch rise, smoked pills, outline CTA pill, corner glass slabs (focus wipe), bell icon, brand lockup, foreground rose parallax, void pull-back, contact shadow, plate vignette |
| **Camera / edit pace** | ASL **3.42 s** (2.93 shots/10 s); strict wide/MCU **and** world/studio alternation; punch-out settle on 4 of 7 shots; one zoom-through; plate wobble on AI plates. Text on screen 86% of the time; 10.4 text entrances per 10 s. | ASL **3.71 s** (2.70 shots/10 s), faster in the first 11 s (2.86 s), then about 4.3 s; WS ↔ MCU; two-step pull-back on 3 of 5 WS, everything else locked off. Text on screen 61%; 36% clean; 6.2 text entrances per 10 s. | ASL **2.74 s** (3.65 shots/10 s), down to 1.4-1.7 s in the agitation beat; tight ↔ wide flip; 4 pull-backs, 31% of the runtime moving. Text on screen 70%; 8.8 text and 12.4 graphic events per 10 s. |
| **Audio** | Light bass/pluck ostinato at **112 BPM**, about 17 dB under the voice, no ducking; optional 8.36 kHz ping pairs on 3 reveals; nothing on cuts. | **No music.** Tonal SFX tied to graphic types: gold shimmer, glass chime (the loudest, −14 dB), sparkles, ticks at −34 to −36 dB. | **41 Hz sub-bass bed** about 3 dB under the voice, no drums or ducking; 4-5 HF SFX: typing rattle (first typed line only), tick, pop, 4.19 kHz ding, arch click. |
| **Mood** | Warm, friendly-authoritative, upbeat, calm and metronomic, premium | Calm, nocturnal, clinical-premium, high-tech, "Apple keynote in a dark room" | Intense, confident, dramatic, luxury / nightlife, persuasive |
| **Production complexity** | **High.** 2 AI world plates (lab corridor with steam, bright lab wall); PNG props (badge ribbon front and back, molecule sequence, flask, fog, clay card); refraction lenses; the most custom components. | **High.** 3D product turntable (180-frame PNG sequence) plus flyby and corner props; phone-screen loop; visionOS UI; per-glyph gold gradients; cyan glass extrusion; world-lock container; synthesised tones; WS and MCU plates if the set isn't teal. | **Medium.** Procedural sunburst and CSS glass; 2 rose PNGs; a void plate (optionally a red studio plate); world-lock container; a matte that includes the chair. |
| **Footage requirements** | **Standing** full-body wide (head 27% H, feet 94% H) plus MCU (eyes 30% H); 4K strongly preferred (2.35× crops); plain keyable backdrop 1-2 m behind; **dark teal / bottle-green top**, light trousers; no orange, red or white tops; pauses ≥ 150 ms. | **Seated**, locked tripod, 4K (2.49× punch-in), WS (head 29-38% H) plus MCU (eyes 33-35% H) plus an optional CU; **dark solid wardrobe** (chocolate, navy, black); low-key key from camera left with a cyan rim from the right; a dark cool set, or a person matte for replacement. | **Seated, centred and symmetric on a black chair** with large headroom (head top 34-35% H); 4K (1.7× and 2.3× crops); **beige / taupe jacket over a black top**; no red, pink or white tops; a red seamless set, or a matte of person **and chair**; pauses ≥ 80-150 ms; an SRT with word timings. |
| **Best for** | Education, tutoring, academies, science and tech explainers, expert promos with a problem → method → proof → payoff arc | Clinics, dentists, aesthetics, labs, fintech / SaaS founders, consultants; products that are objects or apps; bilingual audiences | Agencies, coaches, educators selling to professionals, personal brands, luxury / beauty; hook → agitation → brand → CTA arcs |
| **Not for** | Hype or meme edits, blue or purple brands, sombre medical topics, busy location footage, > 60 s | Bright or pastel brands, warm sets you can't replace, dense subtitle content, kids, numbers and charts | Medical-clean or children's topics, blue or green brands, standing or walking presenters, red / pink / white wardrobe |

---

## 3. Shared building blocks

The three references share a common grammar: talking head, one Arabic family in two extreme weights, glass UI, a zoom-out camera, hard cuts in speech pauses, clean breathers and sparse tonal SFX. `shared-components.json` lists 27 normalised components. Each has `defaults` and a `styles.style-N` override block that carries JSON pointers (`refs`) back into the style files. A renderer resolves `defaults ← styles[id] ← variant ← cue.props` and draws the same component in any style.

| Building block (`shared-components.json` id) | Style 1: Ember Glass | Style 2: Teal Spatial Glass | Style 3: Crimson Halo Glass |
|---|---|---|---|
| **Glass capsule** (`glass-capsule`) | Clear frost: white 3%, blur 7.5 px, 1.5 px rim at 35% (top 55%). Variants: brand 729×240, chest 591×189, name tag 852×177 with a smoked inner field, smoked autosize pill (B&W only), orange-frost CTA 491×110 | White 6-13%, blur 24 px, 2-3 px specular top. Gold label 570×186 with a warm light spill from the hero; search field 848×233 with a dark inner capsule; visionOS tab bar | Smoked black 14%, blur 10 px, 2 px rim at 22% (662×218 and 558×183); outline CTA 560×182 with a 2.5 px rim at 14%, no fill, no blur |
| **Arrow button** (`capsule-button`) | Dark disc Ø123 `#1B1D21`, lime ring Ø84 4.5 px `#DAD530`, ↖. The final CTA uses a maroon disc with a yellow ring, ↗, on the left | Disc Ø165 `#392A21`, gold ring Ø118 7.5 px `#C19359`, ↖ on the right | **Not used.** A red outline bell (`#FF030F`, sways ±11°) sits inside the small pill instead |
| **Capsule birth** (`capsule-morph-in`) | Torus ring spring-pops (scale keys .117 → 1.087 → .903 → 1.0 over 733 ms), then stretches 549 px in 533 ms; a bead pops and stretches; clear pills scaleX 0.6 → 1 in 150 ms | Ring holds 100 ms, grows 230 → 905 px (overshoot) in 867 ms, settles to 848 px; the gold pill scales 0.15 → 1 in 367 ms | A small seed (scaleX 0.1, scaleY 0.2) stretches left, then pops to full in 400 ms `cubic-bezier(0.22,1,0.36,1)`; the outline pill scaleX 0.25 → 1 |
| **Glowing / special keyword** (`emphasis-material`) | One per section: gold screen-space gradient + amber glow, hot-yellow flash → white, orange 3D extrusion, ice chrome + cyan rim and bloom | One hero per graphic shot, new material each time: Difference peach, flat white, cyan 3D glass + neon rim, per-glyph gold light panel (glow r 75), gold spotlight | Light rather than hue: rose sheen (hook), pink-red sweep band, red neon outline, red ghost mega-word, silver wordmark |
| **Turn word** (`turn-word`) | «بـــس» glow sweep: each glyph lands `#FAD01E` with a halo and cools to white (333 ms, 67 ms stagger); silent | «اذا» gold panel grows from the baseline, centre glyph first, overshoot 1.12; two-tone shimmer SFX | «بــس» glyph scale-pop with a 1.04 overshoot; tick + pop + 4.19 kHz ding |
| **Hero entrance** (`hero-word-in`) | Letter blur type-on with reflow and tracking settle | Whole-word rise (`y +63`, brightness 0.73 → 1, 533 ms) | Word fade-rise (`y +36`, blur 6, 280 ms, 320 ms stagger) |
| **Thin support line** (`support-line-in`) | Plex 200 blur type-on (100 ms, 50 ms stagger) | Readex 200 neon: tight 4 px halo + soft 45 px glow; blur-fade or type-on with a brightness flash | Almarai 300 typewriter, opacity only, 22 ms per glyph |
| **Kashida stretch** (`kashida-stretch`) | 0.10 em per tatweel; dashed while typing, closes on the settle; one kashida becomes a rule | 0.08 em; the kashida glows as a neon line (optional glint); widen with kashida, never tracking | 0.18 em; drawn by an RTL clip, often behind the head |
| **Zoom-out camera** (`beat-open-camera`) | 1.38 → 1.0 in 567 ms, face-anchored, **captions screen-locked** | 2.49 → 1.297 → 1.0 keyframes over 2.4 s, focus (50%, 41%), **world-locked** text and UI | 1.69 → 1.0 in 880 ms, centred, **world-locked**; plus void, slow-parallax and brand variants |
| **Tight shot** (`mcu-crop`) | 2.35× static crop (or a 3.23 → 2.35 settle) | A second framing or camera; the CU is 1.3× the MCU | 2.3× static crop |
| **Cut** (`hard-cut`) | In a VO pause 0-300 ms before the phrase; wide/MCU plus world/studio alternation | In a pause; speech resumes 33-100 ms later; a scale-matched cut into the 2.49× WS | Within ±45 ms of a voice minimum; tight ↔ wide flip ×2-2.6 |
| **Pattern interrupt** (`pattern-interrupt`) | B&W focus pull: blur 13.5 px + saturate 0.1 in 267 ms, held 1 s, released by a hard cut | None; each new hero material does the job | Glass corner-slab focus wipe; split exit + void reveal; Difference slam |
| **Clean breather / end** (`clean-breather`, `end-hold`) | 1 breather of 2.67 s; 1.27 s end hold on the payoff | 2 breathers (4.7 s, 5.4 s) + a clean CTA; hard-cut end, no hold | 2 breathers (3.7 s with roses, 3.3 s locked); 1.32 s end hold on the CTA |
| **Behind-the-head text / world lock** (`world-lock`) | Off: captions stay screen-locked (only the wobble moves the whole composite) | On for pull-back shots (hero, script, accent, glass UI) | On for the hook, question, brand and sunburst |
| **Backdrop** (`backdrop`) | Orange studio gradients + AI lab world plates | Dark teal clinic AI plates (WS blur 2-4 px, MCU 14-20 px) + cyan rim relight + grid stage | Red studio gradients / AI plate + sunburst halo + contact shadow + void |
| **Prop layer** (`prop-layer`) | Depth sandwich: ribbon behind the arm and in front of the legs, flask and fog in front | 3D product enters from an edge and spins slowly; phone glides in | Defocused roses counter-scale, in text-free shots only |
| **Vignette / grade** (`vignette`, `grade`) | Mild fx vignette + top-right shade; CSS `contrast(1.10) brightness(0.95) saturate(1.06)` | fx vignette + teal soft-light tint + bottom fade; bake the ffmpeg grade (`brightness(0.68) contrast(1.08) saturate(1.25)` fallback) | Vignette **under** the captions (plate-vignette component); `contrast(1.2) brightness(0.74) saturate(1.4)` |
| **SFX / bed** (`sfx-accent`, `music-bed`) | 8.36 kHz ping pairs at −24 dB; 112 BPM light bed at −17 dB | Shimmer / chime / sparkle / ticks; no bed | Typing rattle / tick / pop / ding / click; 41 Hz sub bed about 3 dB under the voice |

Rules every style shares, so new work should keep them too:
- No push-ins, whooshes, risers, impacts, flashes, glitches, whip pans, dissolves or speed ramps.
- Cut only in speech pauses, and sync to speech, never to the beat.
- Never cover the face with text or opaque graphics.
- Never grade or vignette the captions.
- No logo end card and no fade to black.

---

## 4. Data model: `style.json` (schemaVersion `mg-style/1`)

The three files were normalised to one shape. Every value was kept, and the engine-read keys are unchanged. A smoke render of all three styles passed after normalisation.

- **Top level, identical in all three files:** `schemaVersion, id, name, reference, referenceCanvas, canvas, units, evidence, fonts, typeScale, palette, grade, overlays, backgrounds, worldLockSpec, textPresets, graphicComponents, cameraMoves, transitions, pacing, music, sfxPolicy, soundSpecs, sfx, layout, director, persistent, rules, residualUncertainty`.
- **`units`** is an object that states the conventions:
  - px at 1080; `*720` holds raw reference values;
  - `*Pct` is % of W/H; `*Ms` is ms; `*F` is frames at 30 fps;
  - `[min, max]` ranges; uppercase `#RRGGBB`;
  - `letterSpacing`: number = px, string = CSS em;
  - keyframes are `{tMs, <prop>}`.
- **Fonts:**
  - `fontsource` is always `@fontsource/<id>`.
  - `fill` always has a `type`: `solid | linear | centre-hot | per-glyph-alpha-gradient | none`.
  - Blend modes live in `effects.blendMode`.
  - Tatweel counts live in `kashida.count`.
- **Presets and components:**
  - `worldLock: true` marks camera-parented elements (it replaces style-3's `cameraLocked`).
  - Layers use engine names: `bg | behind | front | fx`.
  - All start offsets are one object: `start: {anchor, offsetMs, offsetF?}`.
  - Every component `out` is `{type: hardCut | animated | morph | withParent | holdToEnd | persistent}`.
  - Points are `centrePct`.
  - Override sets are `variants`.
- **Camera:**
  - `type ∈ scale | static | handheld | keyframes`;
  - `focus` is `"face"` or `[x, y]` fractions;
  - `durationF` is present on every move;
  - `appliesTo` is an array.
- **Pacing:** `shotLengthsSec`, `shotsPer10s`, `firstOverlayAfterCutMs {median?, range}`, `textCoveragePct`, `graphicEventsPer10s`, `breathersMs[]`, `endHoldMs` and `shotPattern[]` are present in every file.
- **Audio:**
  - `music.present` is set in every file.
  - Each `sfx[].idealSound` names a `soundSpecs` entry; style-2's inline `synth` specs moved there.
- **Layout:** `safe` = `{marginPct, marginPx, boxPx}` (style-1 and style-3 had stored box corners under margin names); `zones` use camelCase names; `layerOrder` is a list of `{layer, contents}`.

Engine notes:
- The runtime reads `fonts`, `textPresets` (in / hold / out / style / position / layer), `cameraMoves`, `grade.css`, `overlays`, `sfx`, `director` and `persistent`. Everything else is descriptive and is used by style `components.js` files and by `shared-components.json`.
- `components.js` does not exist yet for any style: the bespoke graphics (rings, lenses, sunburst, arch, visionOS UI, world-lock wrapper) fall back to the shared `glass-pill`, `shape`, `image`, `sequence` and `bg-replace` components until it is written.

---

## 5. Using the system on a new video

1. Score the footage and brief with **`STYLE_SELECTION.md`** and pick a style. Use its mix rules if you need to borrow a block.
2. Read that style's `STYLE.md` §13 checklist (footage, wardrobe, set, assets).
3. Follow `engine/README.md`:
   - `prepare.py` → `srt2scene.py --style styles/style-N/style.json` → refine `scene.json` with the style's narrative template (§9 in each STYLE.md);
   - `render.mjs --stills` for QA, then the full render.
4. For any component with no `components.js` yet, read its per-style numbers from `shared-components.json`.

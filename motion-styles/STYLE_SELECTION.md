# Choosing a style for a new video

Use this guide when new footage arrives:
1. Run the **hard vetoes**.
2. Walk the **decision tree** for a first guess.
3. Confirm it with the **scoring rubric**.
4. If you need to borrow a device from another style, check the **mix rules**.

| Short name | Style | Folder |
|---|---|---|
| **S1** | Ember Glass: warm orange studio, teal wardrobe, glass rings and lenses, standing presenter | `styles/style-1` |
| **S2** | Teal Spatial Glass: dark teal clinic, one giant hero word in a new material per shot, visionOS glass, seated | `styles/style-2` |
| **S3** | Crimson Halo Glass: monochrome red studio, sunburst halo, light as emphasis, pull-backs, seated | `styles/style-3` |

---

## 1. Hard vetoes (check first)

A veto removes a style, whatever its score.

| # | Condition | Removes |
|---|---|---|
| V1 | The edit must be hype, meme or comedy, beat-cut to music, or needs whooshes, flashes or speed ramps | **all three.** They are speech-led and calm, so use a different style |
| V2 | Multi-speaker interview, vlog, or walking / outdoor location footage | **all three** (each needs one presenter on a plain or replaceable set) |
| V3 | Delivery has no pauses (continuous read, no breaths ≥ 80-150 ms) | **all three** until it is re-recorded or re-cut, because every cut must land in a pause |
| V4 | Presenter wears an **orange or red** top that can't change | **S1** (it merges with the orange studio) |
| V5 | Presenter wears a **red, pink or white** top that can't change | **S3** (it merges with the set and breaks the Difference words) |
| V6 | The set is **warm, bright or busy** and there is **no background replacement** | **S2** (a grade cannot turn a warm set teal; it was tested on both other references) |
| V7 | The set doesn't match the style's world (E score 0 in §3) **and** there is no replacement | that style |
| V8 | The brand hue that must dominate is **blue or purple** | **S1** |
| V9 | The brand hue that must dominate is **blue, green or teal** | **S3** (cool hues only appear through Difference blend) |
| V10 | The brand hue that must dominate is **red** | **S2** (its accents are gold, peach and cyan) |
| V11 | The presenter only stands or walks; no seated take is possible | **S3** (it relies on a centred, seated, symmetric frame and a halo above the head) |
| V12 | The video runs longer than about 60 s | none is native: split it into parts, or thin the graphics to S2-level density |

---

## 2. Decision tree (first guess)

```
START
│
├─ Any of V1 / V2 / V3 true? ──────────────────────────────► none of the three; don't force one
│
├─ Must one brand hue dominate the frame?
│    ├─ red / crimson / wine / pink ───────────────────────► S3   (if V5 applies → S1, red-orange backdrop)
│    ├─ teal / cyan / blue / navy / purple ────────────────► S2
│    ├─ orange / amber / gold / warm brown ────────────────► S1
│    └─ neutral, or several colours ──► continue
│
├─ Presenter posture
│    ├─ standing, full body ───────────────────────────────► S1
│    └─ seated ──► continue
│
├─ Tone of the script
│    ├─ calm, precise, clinical, premium-tech, "trust me" ─► S2
│    ├─ confident, dramatic, provocative, "you're good, but…" ─► S3
│    └─ warm, encouraging, explanatory ──► continue
│
└─ How much on-screen text?
     ├─ dense: lists, names, credentials, 4-line cards ────► S1
     ├─ one beat at a time (hero + one line) ─────────────► S3
     └─ one keyword per shot, long clean stretches ───────► S2
```

Then confirm the guess with the rubric below. If the rubric disagrees with the tree by more than 6 points, trust the rubric.

---

## 3. Scoring rubric

Score each input 0-3 per style using the tables:
- **3** is a native fit (the reference already does it);
- **2** is good;
- **1** works with adaptation;
- **0** is a poor fit;
- **V** is a veto (see §1).

Multiply by the weight and sum.

| Input | Weight |
|---|---|
| A. Topic / industry | ×2 |
| B. Tone | ×3 |
| C. Target audience | ×1 |
| D. Presenter wardrobe | ×2 |
| E. Existing background colour | ×1 |
| F. Background replacement possible | ×2 |
| G. Shot sizes available (and resolution) | ×2 |
| H. Length | ×1 |
| I. Amount of on-screen text | ×2 |
| J. Brand colours | ×3 |
| **Maximum** | **57** (weights sum to 19, × 3) |

**Reading the total:**
- The highest total with no veto wins if it is **≥ 34** (60% of the maximum).
- If the top two are **within 3 points**, break the tie in this order:
  1. brand colour fit (J);
  2. tone (B);
  3. lower production cost (S3 < S2 ≈ S1).
- If the best is **< 34**, none fits well. Re-skin the closest style's palette under the mix rules (§4), or design a fourth style.

### A. Topic / industry (×2)
| Topic | S1 | S2 | S3 |
|---|---|---|---|
| Education, tutoring, courses, academies, science or tech explainers | **3** | 1 | 2 |
| Medical, dental, aesthetics, dermatology, labs, health services | 1 | **3** | 0 |
| Tech, SaaS, fintech, apps, devices, engineering | 2 | **3** | 1 |
| Agency, marketing, coaching, consulting, personal brand, B2B services | 2 | 2 | **3** |
| Luxury, beauty, fashion, events, nightlife | 1 | 2 | **3** |
| Food, retail, kids / family, playful consumer | 1 | 0 | 0 |

### B. Tone (×3)
| Tone | S1 | S2 | S3 |
|---|---|---|---|
| Warm, encouraging, friendly-authoritative, optimistic | **3** | 1 | 1 |
| Calm, precise, clinical, premium-tech, reassuring | 1 | **3** | 0 |
| Confident, dramatic, provocative, persuasive ("you're good, but…") | 1 | 1 | **3** |
| Serious or sombre (bad news, sensitive health) | 0 | 2 | 1 |
| Hype, comedic, meme, beat-driven | V | V | V |

### C. Target audience (×1)
| Audience | S1 | S2 | S3 |
|---|---|---|---|
| Students, parents, young general consumers | **3** | 1 | 2 |
| Patients or clients choosing a trusted expert | 1 | **3** | 1 |
| Professionals, business owners, creators (B2B) | 1 | 2 | **3** |
| Bilingual / international (Arabic + English on screen) | 1 | **3** | 2 |

### D. Presenter wardrobe (×2)
| Wardrobe | S1 | S2 | S3 |
|---|---|---|---|
| Dark teal, bottle-green or petrol top; light trousers | **3** | 2 | 1 |
| Solid dark brown, navy, charcoal or black (shirt, scrubs) | 1 | **3** | 2 |
| Beige or taupe jacket over a black top; dark trousers | 1 | 2 | **3** |
| White top or white coat | 0 | 1 | V |
| Orange top | V | 1 | 0 |
| Red, pink or wine top | 0 | 1 | V |
| Busy pattern or fine stripes | 0 | 0 | 0 |

### E. Existing background colour (×1)
| Set as shot | S1 | S2 | S3 |
|---|---|---|---|
| Warm orange, amber or brown plain wall | **3** | 0 | 1 |
| Dark, cool interior (teal, blue, grey-blue), clinic or office at night | 0 | **3** | 0 |
| Red, crimson or wine seamless | 1 | 0 | **3** |
| Neutral plain paper or wall (white, grey, black) | 2 | 2 | 2 |
| Busy real location (bright office, home, shop) | 0 | 1 | 0 |

### F. Background replacement possible (×2)
Use the `prepare.py` person matte, or a better matte.

| Replacement | S1 | S2 | S3 |
|---|---|---|---|
| Yes: a clean matte of everything that must stay (the person, and the chair if seated) | 3 | 3 | 3 |
| Person only; the chair or desk drops out | 3 | 2 | 1 |
| No | = E score | = E score (V if 0) | = E score (V if 0) |

### G. Shot sizes available (×2)
| Footage | S1 | S2 | S3 |
|---|---|---|---|
| Standing, full-body wide + MCU (4K, or two cameras / two takes) | **3** | 1 | 0 (V11) |
| Standing, a single 1080p framing | 1 | 0 | 0 (V11) |
| Seated, full-body wide + MCU / CU (4K, or two cameras) | 1 | **3** | **3** |
| Seated, a single 1080p framing (crops will be soft) | 0 | 1 | 2 |
| Close-ups only, no wide | 0 | 1 | 1 |

Why resolution matters: S1 crops 2.35× for its MCUs, S2 punches in 2.49× at the start of its pull-backs, and S3 crops 1.7× for its pull-backs and 2.3× for its tight shots.

### H. Length (×1)
| Length | S1 | S2 | S3 |
|---|---|---|---|
| < 20 s | 2 | 1 | 2 |
| 20-30 s | **3** | 2 | **3** |
| 30-45 s | 2 | **3** | 2 |
| 45-60 s | 1 | 2 | 1 |
| > 60 s (V12) | 0 | 1 | 0 |

S2 scales to longer runtimes best, because it is 36% clean talking head with 6.2 text entrances per 10 s. S1, at 10.4 entrances per 10 s, and S3, at 12.4 graphic events per 10 s, become tiring past about 45 s.

### I. Amount of on-screen text (×2)
| Text load | S1 | S2 | S3 |
|---|---|---|---|
| Dense: lists, names and credentials, 4-line cards, text on most of the runtime (S1 reference: 86%) | **3** | 0 | 1 |
| Medium: one beat at a time, a hero plus one line, 3-7 words | 2 | 1 | **3** |
| Sparse: one keyword per shot, long clean stretches (S2 reference: 61% text, 36% clean) | 1 | **3** | 2 |
| Needs numbers, charts or price tables | 1 | 0 | 1 |

### J. Brand colours (×3)
| Brand palette | S1 | S2 | S3 |
|---|---|---|---|
| Orange, amber, gold, warm brown | **3** | 1 | 1 |
| Teal, cyan, turquoise | 2 | **3** | 0 (V9) |
| Blue, navy, purple | 0 (V8) | 2 | 0 (V9) |
| Green | 1 | 1 | 0 (V9) |
| Red, crimson, wine, pink | 1 | 0 (V10) | **3** |
| Neutral: black / white / silver, or gold-on-black luxury | 2 | 2 | 2 |

### Scoring sheet (copy for each new video)
```
Video: ____________________   length __ s   posture: standing / seated   4K: y / n
                    weight   S1    S2    S3     notes
A topic               ×2    __    __    __
B tone                ×3    __    __    __
C audience            ×1    __    __    __
D wardrobe            ×2    __    __    __
E background colour   ×1    __    __    __
F replacement         ×2    __    __    __
G shot sizes          ×2    __    __    __
H length              ×1    __    __    __
I text amount         ×2    __    __    __
J brand colours       ×3    __    __    __
vetoes                       __    __    __
TOTAL (max 57)              __    __    __     → chosen: ____  (≥ 34? tie-break used?)
```

---

## 4. Mix rules

Each style is coherent because of a few locked decisions: **one Arabic font family, one colour world, one camera grammar, one sound bed, one exit rule.** Within those, many building blocks are shared (see `shared-components.json`) and can be borrowed. When you borrow, always **re-skin the block with the host style's tokens**: its glass numbers, colours, font and kashida advance.

### Safe to borrow (re-skin with host tokens)
| Block | From → into | How to keep it coherent |
|---|---|---|
| `glass-capsule` + `capsule-morph-in` | any → any | Use the host's material: S1 clear 3% / blur 7.5 / 1.5 px rim; S2 6-13% / blur 24 / specular top; S3 smoked 14% / blur 10 / 2 px rim at 22%. A ring → capsule morph is native to S1 and S2; give S3 its seed-stretch timing. |
| `capsule-button` | S1 ↔ S2 | Swap the ring colour to the host accent (S1 lime `#DAD530`, S2 gold `#C19359`). Into S3 only as a red (`#FE030A`) outline icon; never lime or gold. |
| `kashida-stretch` | any → any | Recompute the tatweel count with the host font's advance (Plex 0.10 em, Readex 0.08 em, Almarai 0.18 em). Thin words only, plus at most one bold turn word. |
| Behind-the-head text (`layer: behind` + matte) | S2 / S3 → S1 | At most one hero per MCU, and never over the face. S1 keeps its captions screen-locked. |
| `turn-word` mechanics | any → any | Keep the host's material: e.g. S3's 1.04-overshoot glyph pop in S1 lands white, then S1's yellow flash may play. |
| `beat-open-camera` with world-locked type | S2 ↔ S3 | Both pull back and carry world-locked type; use the host's curve. Into S1 only for the hook shot. S1 otherwise uses a face-anchored settle that does not scale captions. |
| `clean-breather`, `hard-cut`, wide/tight alternation | any → any | Already shared. Use the host's breather lengths (S1 2.7 s, S2 4.7-5.4 s, S3 3.3-3.7 s). |
| Tonal HF SFX (ping8k ↔ ticks ↔ chime ↔ ding) | any → any | Keep it tonal and 13-40 dB under the voice, on text or graphic events only, never on cuts or camera moves. |
| `echo-word` (English translation) | S2 → S3 | As a translucent red-family ghost or hairline script. S3 already echoes «Mr». Into S1 only for the brand, never on an Arabic line. |
| `prop-layer` | any → any | Obey the host's rule: S1 depth sandwich on world plates, S2 enter-from-edge + slow spin with no shadow, S3 text-free shots only. |

### Adapt with care
- **Difference-blend words (S2, S3):**
  - The visible colour depends on the plate. Recompute the base per channel: `base = desired visible + local plate` (clipped at 255).
  - Never use it in S1: white over orange reads blue, which S1 bans.
  - Use it in wide shots only, at most once or twice per reel.
- **Special materials across styles:** borrow a material only if its colours already exist in the host palette.
  - S1 ice-chrome ↔ S2 cyan-glass: both have cyan.
  - S1 gold gradient ↔ S2 gold panel or spotlight: both have gold.
  - Nothing non-red goes into S3.
- **S1 refractive lenses into S2:** this fits its glass world. Keep the S2 blur (18-26 px) and don't refract the hero word.
- **S3 sunburst halo into S1:** only re-tinted to the backdrop hue (+30-35 levels over the wall). Into S2, use a cyan halo at most and keep it under luma 168.
- **Scaling S1 beyond 45 s:** borrow S2's clean-MCU rhythm (two 4-5 s breathers) instead of adding more cards.

### Never mix
1. **Arabic font families.** One per video: Plex 700/200, Readex 700/200 or Almarai 800/300. Never pair one style's bold with another's thin, and never use weights 400-600 for Arabic display.
2. **Colour worlds and grades.** One backdrop family and one grade for the whole reel: orange studio, teal clinic or crimson studio. Never cut between two worlds.
3. **Sound beds.** S1's 112 BPM ostinato, S2's silence and S3's 41 Hz sub are mutually exclusive. Never stack beds, and never add music to S2.
4. **More than one pattern interrupt.** Use S1's B&W focus pull *or* S3's glass focus wipe or Difference slam, once.
5. **Text-density grammars.** Don't put S1's 4-line cards into S2 (one hero per shot) or S3 (one beat at a time). Don't strip S1 down to S2 sparseness without also moving to S2's clean-breather rhythm.
6. **Two special materials in one shot.** That applies across styles too: never an S1 gold title next to an S2 gold panel next to an S3 sweep band.
7. **Exit rules.** Pick the host's rule: S1 reverse type-off only in the closing shot; S2 never animates out; S3 allows 2-3 frame split exits.
8. **Camera grammars in one shot.** Never combine a face-anchored screen-locked settle (S1) with a world-locked pull-back (S2/S3) in the same shot. No style ever pushes in.
9. **Outside "hype" vocabulary.** No whooshes, flashes, glitches, light leaks, whip pans, dissolves or speed ramps in any of the three.

---

## 5. Worked examples

### Example 1: education promo → **S1 Ember Glass**
*Brief:* a 30 s Arabic promo for an online physics course aimed at high-school students and their parents. A female teacher stands, filmed in 4K against a plain light-grey wall, in a dark teal blouse and beige trousers. The brand is orange and white. The script lists 4 features (live classes, weekly tests, 24/7 Q&A, certified teacher) plus her name and credentials. A clean person matte is available.

| Input (weight) | Choice | S1 | S2 | S3 |
|---|---|---|---|---|
| A topic ×2 | education | 3 → 6 | 1 → 2 | 2 → 4 |
| B tone ×3 | warm, encouraging | 3 → 9 | 1 → 3 | 1 → 3 |
| C audience ×1 | students / parents | 3 → 3 | 1 → 1 | 2 → 2 |
| D wardrobe ×2 | dark teal top, light trousers | 3 → 6 | 2 → 4 | 1 → 2 |
| E background ×1 | neutral plain | 2 → 2 | 2 → 2 | 2 → 2 |
| F replacement ×2 | yes, clean | 3 → 6 | 3 → 6 | 3 → 6 |
| G shots ×2 | standing, wide + MCU, 4K | 3 → 6 | 1 → 2 | 0 → 0 (V11) |
| H length ×1 | 30 s | 3 → 3 | 2 → 2 | 3 → 3 |
| I text ×2 | dense | 3 → 6 | 0 → 0 | 1 → 2 |
| J brand ×3 | orange | 3 → 9 | 1 → 3 | 1 → 3 |
| **Total** | | **56** | 25 | 27 (vetoed) |

How to apply S1 (STYLE.md §9 template):
- **Visuals.**
  - Replace the two chemistry world plates with physics plates in the same depth-sandwich logic: a lab corridor with oscilloscopes and pendulums for the hook, and a bright wall of formulas for the method beat.
  - Swap the flask and molecule props for a glowing pendulum or magnet PNG.
- **Text.**
  - The 4 features become the detail beat's 4-line card with a chest pill.
  - Her name and credentials go into the name-tag capsule, with "PHYSICS" as the tracked micro label.
  - The "not just videos" line drives the single B&W interrupt.
  - End on one chrome payoff word with a 1.27 s hold.
- **Sound.** A 110-115 BPM light bed at −17 dB, and ping pairs only on the 3 reveals.

### Example 2: medical / clinic promo → **S2 Teal Spatial Glass**
*Brief:* a 35 s promo for a dental clinic's clear-aligner treatment. A dentist is seated, filmed in 4K with two framings (WS + MCU), in navy scrubs, in a brightly lit white treatment room. The brand is teal. The audience is adults choosing a clinic, some of them English-reading. The script carries one keyword per beat plus the English treatment name. The matte keeps the person and the stool.

| Input (weight) | Choice | S1 | S2 | S3 |
|---|---|---|---|---|
| A topic ×2 | medical / dental | 1 → 2 | 3 → 6 | 0 → 0 |
| B tone ×3 | calm, clinical, reassuring | 1 → 3 | 3 → 9 | 0 → 0 |
| C audience ×1 | patients choosing an expert | 1 → 1 | 3 → 3 | 1 → 1 |
| D wardrobe ×2 | solid navy scrubs | 1 → 2 | 3 → 6 | 2 → 4 |
| E background ×1 | bright, busy clinic room | 0 → 0 | 1 → 1 | 0 → 0 |
| F replacement ×2 | yes, clean (person + stool) | 3 → 6 | 3 → 6 | 3 → 6 |
| G shots ×2 | seated, WS + MCU, 4K | 1 → 2 | 3 → 6 | 3 → 6 |
| H length ×1 | 35 s | 2 → 2 | 3 → 3 | 2 → 2 |
| I text ×2 | sparse, bilingual | 1 → 2 | 3 → 6 | 2 → 4 |
| J brand ×3 | teal | 2 → 6 | 3 → 9 | 0 → 0 (V9) |
| **Total** | | 26 | **55** | 23 (vetoed) |

How to apply S2:
- **Set and look.**
  - Replace the white room with the `backgrounds.wsPlate` / `mcuPlate` prompts. V6 would have removed S2 without replacement.
  - Relight the dentist with the cyan rim overlay, and bake the ffmpeg grade so the face median is 112-128 and the plate stays ≤ luma 170.
  - If he wears a white coat instead, D drops to 1 (total 51) and S2 still wins. Keep the coat open over the dark scrubs.
- **Graphics.**
  - Render the aligner and typodont as a 180-frame PNG turntable for `prop-3d-enter-spin`.
  - The treatment name gets the gold light-panel template, reprised for the CTA set-up.
  - The English term («Clear aligners») runs as a centre-hot ghost echo.
  - Before/after goes on `phone-glide-in`.
  - Leave the later MCUs clean, at about 36% of the runtime.
- **Sound.** No music: shimmer on the gold keyword, chime on the glass UI.

### Example 3: personal-brand / coach promo → **S3 Crimson Halo Glass**
*Brief:* a 28 s promo for a business coach's 6-week content programme, aimed at small-business owners. The tone is persuasive: "you're good at what you do, but your content isn't". She sits on a black chair in front of the dark-red wall of her own studio, filmed in 4K, in a beige blazer over a black top. The brand is crimson and black. Text runs one hero plus one line per beat. Background replacement is **not** possible (the chair matte is poor), but the set is already red.

| Input (weight) | Choice | S1 | S2 | S3 |
|---|---|---|---|---|
| A topic ×2 | coach / personal brand | 2 → 4 | 2 → 4 | 3 → 6 |
| B tone ×3 | dramatic, persuasive | 1 → 3 | 1 → 3 | 3 → 9 |
| C audience ×1 | business owners | 1 → 1 | 2 → 2 | 3 → 3 |
| D wardrobe ×2 | beige jacket over black | 1 → 2 | 2 → 4 | 3 → 6 |
| E background ×1 | red seamless | 1 → 1 | 0 → 0 | 3 → 3 |
| F replacement ×2 | no → = E | 1 → 2 | 0 → 0 (V6, V7) | 3 → 6 |
| G shots ×2 | seated, 4K | 1 → 2 | 3 → 6 | 3 → 6 |
| H length ×1 | 28 s | 3 → 3 | 2 → 2 | 3 → 3 |
| I text ×2 | one beat at a time | 2 → 4 | 1 → 2 | 3 → 6 |
| J brand ×3 | crimson | 1 → 3 | 0 → 0 (V10) | 3 → 9 |
| **Total** | | 25 | 23 (vetoed) | **57** |

How to apply S3 (11-beat template, STYLE.md §9):
- **Set.** Grade only (keep the real red set) and add the persistent `sunburst-halo` + `plate-vignette`.
- **Camera and type.**
  - The hook address word gets the rose sheen with a red ghost echo, delivered by the 1.69 → 1 pull-back.
  - "Why isn't your content working?" is the world-locked question in the void reveal.
  - Validation uses the pink sweep band.
  - The turn word «بس» pops with tick / pop / ding.
  - One Difference question word goes across the torso.
  - The glass corner panels push the old keyword behind glass.
- **Brand.** Her name in Almarai 800 with the red script accent, dropped by `pullback-brand`.
- **End.** The CTA headline cascade + outline pill, then a 1.32 s hold.
- **Sound.** A 41 Hz sub bed about 3 dB under the voice.
- **Variant.** If the same coach had a gold-on-black brand and filmed standing in a warm orange studio, the standing take would veto S3 (V11). S1 would then score 41 (J 9, G 6, E 3, F 6) and win.

---

## 6. After choosing

1. Check the chosen style's `STYLE.md` §13 footage checklist. Fix wardrobe and set issues **before** shooting if you can, because they are the cheapest to change.
2. Map the script onto the style's narrative template (STYLE.md §9) and its scaling rules for the target length.
3. Build `scene.json` from the style's presets. If you borrowed blocks, re-skin them with the host's numbers from `shared-components.json`.
4. Render QA stills at every cut +10-20 frames and check:
   - the face is clear;
   - text stays inside the safe box (`layout.safe.boxPx`);
   - one special material per shot;
   - cuts land in pauses;
   - the end matches the style (hold or hard cut).

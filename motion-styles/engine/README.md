# Motion-styles engine

Applies one of the studied reference styles (`../styles/style-N/`) to new talking-head footage.
Everything is deterministic: paused GSAP timelines are seeked frame by frame in headless Chromium, each
frame is captured and piped to ffmpeg. No After Effects needed, and re-renders are identical.

```
input.mp4 ──prepare.py──▶ plate/ (frames, person mattes, face track, audio, voiced phrases)
captions.srt / script.txt ──srt2scene.py──▶ scene.json (draft cue list, then refined by hand / by Claude)
plate + style.json + components.js + scene.json ──render.mjs──▶ output.mp4 (graphics + SFX mixed with voice)
```

## Setup (once per machine)

```bash
cd motion-styles/engine
npm install                       # gsap + @fontsource Arabic/Latin fonts
pip install numpy scipy opencv-python-headless scikit-learn librosa "mediapipe==0.10.14"
./models/download.sh              # MediaPipe person-segmentation / face / pose models (~26 MB)
```
Chromium comes from Playwright (`/opt/pw-browsers` in the cloud container). `scipy` is optional (audio filters fall
back to cruder ones without it).

## Commands

```bash
# 1. prepare footage (cover-fit to 1080x1920 @ 30 fps; ~0.3 s per frame for mattes)
python3 prepare.py ../input.mp4 ../renders/plate_myvideo [--start 0 --end 30]

# 2. draft a scene from captions (or write scene.json by hand)
python3 srt2scene.py --style ../styles/style-2/style.json --plate ../renders/plate_myvideo --srt captions.srt --out scene.json

# 3. check a few frames, then render
node render.mjs --plate ../renders/plate_myvideo --style ../styles/style-2/style.json --scene scene.json --stills 30,90,150 --stills-dir stills/
node render.mjs --plate ../renders/plate_myvideo --style ../styles/style-2/style.json --scene scene.json --out ../renders/myvideo_style2.mp4 --workers 3
tools/sheet.sh ../renders/myvideo_style2.mp4 sheet.jpg 2      # contact sheet for review
python3 audio.py --demo ../renders/sfx [--style ../styles/style-2/style.json]   # audition every SFX incl. soundSpecs
```

`render.mjs --out` muxes the mix padded with silence and cut to exactly `frames / fps`, so the MP4 always has every
rendered frame (it warns if ffprobe counts a different number). Stills are rendered in ascending frame order (see
Determinism).

## Layer stack

| layer         | what goes there                                                     | camera moves apply |
|---------------|---------------------------------------------------------------------|--------------------|
| `plateWrap`   | the source frame (grade + overlays drawn into it)                   | yes                |
| `bg`          | background replacements, backdrop graphics                          | no                 |
| `bgW`         | world-locked backdrops                                              | yes (world)        |
| `ovl`         | only with `overlays.applyToBackdrop`: the style overlays, above the backdrops | no       |
| `behind` / `behindW` | text/graphics that the presenter occludes (`"layer": "behind"`) | no / yes (world) |
| `talentWrap`  | presenter cut-out = graded plate × camera-transformed person matte  | yes                |
| `front` / `frontW` | captions, pills, 3D props in front of the presenter            | no / yes (world)   |
| `fx`          | vignette, tint, grain, flashes                                      | no                 |

World-locked = preset/cue `"worldLock": true` (or a layer name ending in `W`). The `…W` layer divs are not
transformed: every direct child gets its own camera-following wrapper (`div.mg-cam`), so `mix-blend-mode` on
world-locked graphics (Difference words) still blends with the plate and talent. A blend mode set on an element
inside an isolating wrapper (the camera wrapper, a filter host such as the bevel/glow chain, a component's filter
wrapper) is hoisted onto the top-level wrapper on the first frame (`data-blend-hoisted`). Subtrees mixing several
blend modes are left alone. A z-index on a world child is copied onto its wrapper.

The grade and the overlays are applied to footage only — graphics are never graded.

## scene.json

```jsonc
{
  "autoSfx": true,                      // add the style's SFX rules to matching cues
  "idealSfx": true,                     // rules use their "idealSound" (soundSpecs) when it resolves; false = stand-ins
  "music": {"src": "bed.mp3", "gainDb": -20, "duckDb": -8},   // optional, tiled + ducked under the voice
  "sfxBed": {"src": "sfx.wav", "gainDb": 0, "t": 0},          // optional, mixed as-is: never tiled, never ducked (or a list)
  "voiceGainDb": 0,
  "masterLimiterDb": -1,                // master look-ahead peak limiter ceiling (null = legacy tanh soft clip)
  "grade": true,                        // see "Grade and overlays"
  "gradeCss": "brightness(1.15)",       // per-plate trim appended after the resolved grade
  "overlays": {"vignette": {"strength": 0.4}, "applyToBackdrop": true},
  "persistent": [ ... ],                // extra persistent components (false = none, not even the style's)
  "persistentProps": {"sunburst-halo": {"restScale": 0.53}},   // merged into that persistent component's cue.props
  "cameraDefaults": {"worldRest": "final"},                    // merged under every camera cue
  "voidColor": "#000",                  // what a pulled-back plate reveals
  "scripts": ["extra.js"],              // extra component scripts (after the style's components.js)
  "cues": [
    {"t": 0.4, "end": 2.6, "type": "text", "preset": "<textPreset id>", "text": "الكيمياء", "dir": "rtl",
     "layer": "behind", "position": {"xPct": 50, "yPct": 20}, "tatweel": 3, "style": {"color": "#fff"}},
    {"t": 1.0, "type": "text", "preset": "...", "segments": [{"text": "يمكن "}, {"text": "انت", "style": {"color": "#ff5a8a"}}]},
    {"t": 3.0, "type": "text", "preset": "...", "words": [{"text": "بس", "t": 3.0}, {"text": "اعلانك", "t": 3.3}]},
    {"t": 2.9, "type": "camera", "preset": "<cameraMove id>"},               // or inline, see "Camera"
    {"t": 5.0, "end": 9.0, "type": "component", "component": "glass-pill", "props": {"label": "MAX ACADEMY"}},
    {"t": 0, "end": 30, "type": "background", "src": "assets/lab_plate.jpg", "blurPx": 2},
    {"t": 6.5, "end": 10, "type": "image", "src": "assets/flask.png", "widthPct": 45, "position": {"xPct": 25, "yPct": 78}, "float": {"px": 16}},
    {"t": 7.0, "type": "sfx", "sound": "whoosh", "gainDb": -10},
    {"t": 7.5, "type": "sfx", "src": "assets/click.wav", "gainDb": -6}
  ]
}
```

Times are absolute seconds. `end` is a hard cut: every text (and, through the lifecycle, every cue's DOM) is gone at
`end` even if its type-on is still running. Without `end`, a text leaves after `holdMs` (+ its `out`).

### Text cues and presets

Text `unit` (letter / word / line / none) comes from the preset; Arabic letter-by-letter animation keeps correct
joining (zero-width joiners around each split letter, lam-alef kept whole).

| field (cue, or preset where noted) | meaning |
|---|---|
| `position.anchor` | `center` (default), `left`, `right`, `top`, `bottom` and combinations place the LINE BOX. `ink`, `ink-top`, `ink-bottom`, `ink-left`, `ink-right` (and combos such as `ink-bottom-left`) place the measured INK box (canvas glyph metrics around the DOM baseline, after fonts load) on `xPct`/`yPct`; the result is kept in `el.dataset.inkBox` (element px). |
| `in.tatweelUnit` (preset or cue) | `"each"` (default): every tatweel is its own letter unit (dashed-while-typing look). `"run"`: a run of consecutive tatweels is ONE letter unit (`data-tatweel="n"`), so it fades/scales as one stroke. |
| `in.keyframes` | flat `[{tMs, ...props, easing}]` (per unit, staggered) or grouped `[{unit: "first"/"last"/"rest"/"all", steps: [...]}]`. Grouped: every group's first step is applied at the cue start, not only at the group's own start. Flat: `in.from` / `in.to` never override a prop (or CSS channel: all filter props share `filter`, all clip props share `clipPath`) that the keyframes animate; their other props still tween. |
| `gate` (preset or cue) | staggered units stay `visibility: hidden` until the first entrance tween that animates them starts (default on; `false` restores v1 pre-show of from-states). Works with `staggerMs`, `staggerFrom`, `words` timing and keyframes. A from-state whose values are all `null` (a component nulling the preset to run its own per-unit timing) is not an entrance. |
| `hardCut` (preset or cue) | `false` keeps v1 behaviour (a text with a long type-on outlives `end`). |
| `animatedBackground` (preset or cue) | split gradient text follows a tweened `background-position` / `background-size` of its element (auto-detected when `hold` (on the element), `drift` or an `out` with `unit: "none"` animates them). The projection is per frame, in element px, onto every unit. |
| `raw: true` (cue) | bypass `MG.textBuilders` for this cue. |

Every text element is tagged `data-cue="<index in scene.cues>"` (`p<k>` for persistent components; texts built
outside any cue have none) and `data-preset="<id>"`.

Glow/extrusion on **gradient fills**: `text-shadow` paints over a `background-clip:text` fill, so after the
post-layout callbacks the engine moves those effects into a `drop-shadow` filter chain on a host wrapper
(`div.mg-text-host`, `el.dataset.glowHost`). The element's `--glow-k` (tweened by `glowStrength`) is copied onto the
host every frame. Only elements whose `text-shadow` is still exactly what the engine set are converted: a component
that rewrote it during build/postLayout keeps full control. `fonts[].effects.tightHalo` is an alias of `glowTight`
(added the same way, only to untouched elements).

### Camera

```jsonc
{"t": 0, "type": "camera", "preset": "pullback-two-step"}                        // cameraMoves entry
{"t": 2, "type": "camera", "scaleFrom": 1.4, "scaleTo": 1, "durationMs": 600, "easing": "cubic-bezier(.25,0,.1,1)",
 "delayMs": 0, "x": 0, "y": 0, "rotate": 0, "focus": "face" | "centre" | [0.5, 0.4] | [540, 760], "focusPx": [540, 760],
 "shake": {"px": 12, "durationMs": 300}, "motionBlur": false, "worldRest": "final"}
{"t": 4, "type": "camera", "keyframes": [{"tMs": 0, "scale": 1.2, "x": 0, "y": 40}, {"tMs": 500, "scale": 1, "easing": "..."}]}
{"t": 6, "type": "camera", "move": "static", "scaleTo": 2.3, "focus": "face"}     // crop / reframe
{"t": 6, "end": 9, "type": "camera", "move": "handheld", "amplitudePx": 8, "durationMs": 1500}
{"t": 6, "type": "camera", "additive": true, "keyframes": [{"tMs": 0, "x": 0}, {"tMs": 300, "x": 6}, {"tMs": 600, "x": 0}]}
```

- The move type comes from `cue.move` (alias `moveType`) or the preset's `type`: `scale` (default), `keyframes`,
  `static` (applies `scaleTo` — else `scale`, `scaleFrom` — plus `x`/`y`/`rotate` about the focus), `handheld` / `wobble`.
- **Cues are cuts.** The camera is the state of the latest camera cue that has started; a later cue fully replaces an
  earlier one at its start, even if the earlier move was still running. A `scale` cue without `scaleFrom` starts from
  the previous cue's scale at that moment, and always tweens x / y / rotation from the previous cue's values.
- **Additive tracks**: `handheld` / `wobble` cues and keyframe cues with `"additive": true` are offsets (x, y,
  rotation; scale multiplies) on top of whatever base cue is active, so a wobble rides on a reframe or a push.
- **Motion blur** (a few sub-frame samples when the camera moves fast) never blends across a camera cue start, and is
  off for a cue with `"motionBlur": false`.
- **`worldRest`** (opt-in; cue, cameraMoves entry, `scene.cameraDefaults` or `style.cameraDefaults`): world-locked
  layers follow the camera RELATIVE to a rest framing, `M = M(camera) · M(rest)⁻¹` (STYLE §8.3 "S = current /
  final"), so world-locked type lands exactly on its slot when the shot rests at a scale ≠ 1. Values: `"final"` (or
  `true`) = the cue's own end state; `"start"`; a number = rest scale (other fields from the final state); an object
  `{scale, x, y, rotation, ox, oy}` overriding the final state. Without it world lock is absolute (v1).
- Legacy: a component that sets `transform` on a `…W` layer itself (v1-style world-rest helpers) still owns that
  layer's camera for that frame — the engine then leaves the wrappers untransformed so nothing is applied twice.

### Grade and overlays

`style.grade` (`{css}` or `{brightness, contrast, saturate, hueRotate}`) and `style.overlays` (`tint`, `vignette`,
`bottomFade`, `grain`) are drawn into the footage only.

| setting | effect |
|---|---|
| `scene.grade` | `false` = off · `true` = the style grade (also on a preGraded plate) · `"css filter"` · `{css}` / `{brightness, …}` replacing the style grade · unset = the style grade (none on a preGraded plate) |
| `scene.gradeCss` | CSS filter appended after the resolved grade (per-plate exposure trim) |
| `scene.overlays` | `false` = off · `true` = the style overlays (also on a preGraded plate) · object merged over the style overlays (`null` drops one) · unset = the style overlays (none on a preGraded plate) |
| `overlays.applyToBackdrop` (style or scene) | the overlays are drawn ONCE in a layer `#ovl` above `bg`/`bgW` (so replaced backdrops get the vignette/tint too) instead of into the plate; the talent gets them baked in |
| plate `meta.json` `"preGraded": true` (`prepare.py --pre-graded`) | footage already carries the look: style grade and overlays are skipped unless the scene forces them |

## style.json (per style, written by the study)

`fonts`, `palette`, `grade` (CSS filter values), `overlays` (vignette / tint / grain), `textPresets`
(`in`/`hold`/`out` with `from`/`to` props: opacity, x, y, scale, rotate, blur, brightness, letterSpacing, clip; `durationMs`,
`staggerMs`, `easing` as `cubic-bezier(...)` or a GSAP ease), `cameraMoves`, `cameraDefaults`, `sfx` rules,
`soundSpecs`, `director` defaults for `srt2scene.py`, and `persistent` components that run for the whole video.
Style-specific graphics live in the style's `components.js` (same API as `compositor/components-shared.js`).

## Components API

`window.MG.components[id] = (ctx) => { ... }`. A component adds tweens to `ctx.tl` (a GSAP timeline whose 0 = `cue.t`)
and DOM to `ctx.layer(name)`. Rules: no CSS animations, timers, `Math.random` or `Date` — everything must be a pure
function of timeline time.

| `ctx` member | |
|---|---|
| `cue`, `spec`, `tl`, `cueIndex` | the cue (its index in `scene.cues`), its `graphicComponents` entry, its timeline |
| `layer(name)`, `layers` | layer elements (`layers.ovl` exists with `applyToBackdrop`) |
| `W`, `H`, `FPS`, `style`, `scene`, `meta` | config |
| `makeText(cue, tl, {parent, raw})` | text interpreter (routes `MG.textBuilders`, fires `MG.onText`); returns `{el, host, units, inEnd, outStart, hideAt}` |
| `makeTextBase(cue, tl, opts)` | the generic interpreter only (for text builders) |
| `mapVars`, `filterKeysOf`, `keyframeTweens`, `ease`, `rng(seed)`, `ms`, `gsap` | animation helpers |
| `applyTextStyle`, `place`, `tatweel`, `applyKashida`, `graphemes`, `measureInk(el)` | text helpers (`measureInk` → ink box in element px) |
| `face(t)` | presenter face box in px |
| `cam` | the composed camera state of the current frame `{scale, x, y, rotation, ox, oy, rest, cueIndex, motionBlur}` (one object for the whole render; read it, don't tween it) |
| `camMatrix(state)`, `worldMatrix(state)` | 2D affine `[a,b,c,d,e,f]` of the camera / of world-locked layers (with rest) |
| `camAt(t)` | camera state (+ `matrix`, `world`) at any time, without disturbing the rendered state |
| `master`, `camMaster` | the paused master timelines (graphics / camera) |
| `onFrame(fn(t, i))` | per-frame hook, runs after GSAP, camera, plate, talent, world wrappers and lifecycle |
| `postLayout`, `registerPostLayout(fn)` | callbacks after fonts are loaded and gradients split (before the first frame) |
| `matteCanvas` | the current frame's raw camera-transformed person matte (W × H, alpha = coverage), for occlusion effects |
| `assetUrl(path)` | resolves a scene-relative asset |
| `textBuilders`, `onText`, `engineFeatures`, `EPS` | see below |

`window.MG` (set up by `components-shared.js`, so available while a style's `components.js` loads):
- `MG.textBuilders[presetId] = (ctx) => result` — custom builder for every text of that preset (`ctx` = component ctx +
  `{cue, tl, opts, preset, presetId}`; call `ctx.makeTextBase` for the generic part; return `{el, units, …}`).
- `MG.onText((info) => …)` — called after every text build with `{cue, preset, presetId, el, host, units, tl,
  inEnd, outStart, ctx}`.
- `MG.engineFeatures` — flags of engine fixes so a style can skip its own workaround: `primedTimelines`,
  `cameraCuts`, `staticCamera`, `worldRest`, `worldWrappers`, `blendHoist`, `textHooks`, `persistentProps`,
  `tatweelUnit`, `gradientGlowFilter`, `tightHalo`, `unitGating`, `groupedKeyframesFix`, `hardCutAtEnd`,
  `lifecycleDisplay`, `inkAnchor`, `gradeControl`, `animatedBackgrounds`, `matteCanvas` (`version: 2`).
- `MG.ctx` — the base ctx.

Persistent components (`style.persistent` + `scene.persistent`) get `cue.props` merged with
`scene.persistentProps[<component id>]`.

**Cue lifecycle.** Every DOM node a cue adds to a layer is taken out of the render tree outside
`[start − ½ frame, end + ½ frame]` (texts without `end`: until they leave): the class `mg-off`
(`display: none !important`) goes on the outermost wrapper around it that holds nothing of another cue (so a
component's postLayout glow/filter wrapper is hidden too — a hidden text inside a displayed full-frame filter wrapper
still costs a filter pass every frame: style-1's doctor shot 1 renders at 0.75 s instead of 4.5 s per frame without
its own workaround). Inline styles are untouched, so GSAP and component `display` toggles keep working underneath. A
node that adopts earlier cues' nodes (a ghost wrapper re-parenting layer content) is not tracked.

## Determinism

- Each frame seeks the timelines to `t + EPS` (`EPS = 1e-5 s`): GSAP does not render a child timeline whose first
  render lands exactly on its local 0, which used to skip frame 0 and the first frame of cues on frame boundaries.
  Both masters are primed onto the first frame in `mgInit`.
- Seek forward only from a fresh page: a backward jump reverts later cues to the start values GSAP recorded when
  they initialised (e.g. an `autoAlpha` set records an immediateRender from-state's opacity), which is not their
  pristine hidden state. `render.mjs` renders each worker's range in order and sorts `--stills`.
- No timers, CSS animations, `Math.random` or `Date` in render paths; seeded `ctx.rng`.

## Audio (`audio.py`)

Voice + SFX + optional `music` (tiled, ducked) + `sfxBed` (as-is), then the master limiter.

- **SFX rules** (`style.json` `sfx`, with `autoSfx`): `{event, preset, sound, idealSound, offsetMs, gainDb, perUnit,
  repeatOffsetsMs, condition, onlyFirstInReel}`. Events: `text_in`, `text_out` (at `end`), `camera`, `cut`,
  `component_in`, `component_out`. `perUnit`: one event per text unit (word/letter/line timing from the preset's
  `staggerMs` or the cue's `words`). `repeatOffsetsMs`: repeat at these offsets. `condition`: `{component|preset|id|any,
  within: "shot"|"scene"|"cue"}` or prose naming a component/preset id ("only when the shot carries
  visionos-glass-ui"); a shot is bounded by camera cues and plate cuts. `onlyFirstInReel`: only the first matching cue.
  A cue opts out with `"sfx": false` or picks its own with `"sfx": "name"` (+ `sfxOffsetMs`, `sfxGainDb`).
- **Sounds**: resolved in order: the active style's `soundSpecs` → built-in recipes (`ping8k`, `typingRattleHF`,
  `tickHF`, `popHF`, `ding4k`, `clickHF`) → the procedural library (`whoosh`, `pop`, `tick`, `shimmer`, `ding`, …
  + aliases) → sibling styles' `soundSpecs` → a frequency name (`ping8k`, `tick7k2`, `ding4k`) → `swoosh`.
  Spec sounds are normalised to −3 dBFS peak; the rule/cue `gainDb` sets the level.
- **soundSpecs** are synthesized from typed specs (`sine ping`, `two-tone`, `tone-tick` + `repeatOffsetsMs`,
  `inharmonic-bell`, `partials`, `partials-sequence`), from prose `desc` (kHz partials, "decays ~25 dB by 220 ms",
  "transients above 11 kHz every 22-46 ms"), or from an explicit `"recipe"`:
  `tone` `{partials: [{hz, hzEnd, gainDb, delayMs, durMs}], durationMs, attackMs, decayPerSec | decayDb+decayMs, releaseMs}`,
  `noise` `{bandHz: [lo, hi|0], durationMs, attackMs, decay…}`, `train` `{durationMs, intervalMs: [min, max], clickMs,
  hpHz, lpHz}`, `sequence` `{steps: [recipe + atMs]}`, `layers` `{layers: [recipe + gainDb]}`; any recipe may add
  `repeatOffsetsMs`.
- **Master**: look-ahead (5 ms) peak limiter, 80 ms release, ceiling `masterLimiterDb` (default −1 dBFS). Mixes under
  the ceiling pass untouched.

## Limits

- No speech-to-text model is reachable from the cloud container, so caption timing comes from an SRT (CapCut,
  Premiere, any STT) or from a script auto-timed onto voiced phrases (`speech.json`) — the SRT is far more precise.
- 3D props (teeth models, flasks, molecules) in the references are pre-rendered assets. Supply PNGs / PNG sequences
  (or generate them with an image model) and place them with the `image` / `sequence` components.
- Background replacement quality depends on the matte; busy backgrounds or chairs can bleed at the edges.
- Blend modes inside a subtree that mixes several modes (or inside a layer a component transforms itself) still only
  blend within that group.

## Changelog

### v2.1 (follow-ups from the style regression pass)

1. **Handheld / wobble returns to rest by the cue end** — the swings stop 0.2 s early and the return finishes at
   `end`, so the offset no longer carries into the next shot.
2. **Additive camera tracks stop at `cue.end`** — an additive keyframe/wobble cue with an `end` contributes nothing after it.
3. **Exact cue lifecycle `[start, end)`** — every cue's DOM (components too, not just text) is gone on the first frame at or
   after `end`, and never shares the frame before a cut with the next shot. `scene.lifecycleHalfFrame: true` restores
   the old ±½-frame window.
4. **All font weights preloaded** — every declared face of the style's families is loaded in `mgInit`, so canvas text
   drawn by components in other weights is ready on frame 0.

### v2 (engine hardening)

Requested by the three style builders; their workarounds are in `styles/style-N/components.js`. Each fix is flagged
in `MG.engineFeatures`. Verified A/B against a v1 snapshot on every demo / QA scene of the three styles: frames match
within ±3 levels apart from sub-pixel anti-aliasing at moving text edges (the `t + EPS` seek) — the only real
difference is style-1's `scene_all_components` wobble window, where `plate-wobble` now wobbles. The demo MP4s keep
all 299 frames. Audio is bit-identical except style-1's rule ticks, which now play their `ping8k` spec. Focused
pass/fail tests for every item: `renders/hardening/engine/tests/run_tests.py`.

1. **Timeline priming / exact-start rendering** — frames seek `t + EPS`; both masters primed in `mgInit`; stills sorted.
2. **Camera cues are cuts** — per-cue camera state, latest started cue wins; handheld/wobble additive; no motion-blur
   samples across a cue start. Fixes: a still-running push overriding a later crop, smeared cut frames, presets of type
   `handheld` acting as a reset to scale 1 (the cue's `type: "camera"` used to hide the preset's move type).
3. **`static` camera moves** apply `scaleTo` + focus (`move: "static"` inline).
4. **`worldRest`** camera option (opt-in).
5. **World layers** — per-child camera wrappers instead of a transformed layer; blend modes hoisted out of isolating
   wrappers (camera wrapper, filter hosts).
6. **Text hooks** — `data-cue` / `data-preset`, `MG.textBuilders`, `MG.onText`, `ctx.master`, `ctx.camAt`,
   `ctx.registerPostLayout`, `ctx.matteCanvas`, `ctx.cueIndex`, `ctx.measureInk`, `ctx.makeTextBase`,
   `scene.persistentProps`, `scene/style.cameraDefaults`.
7. **Tatweel runs** — `in.tatweelUnit: "run" | "each"` (default `each`).
8. **Gradient glows** — glow/extrusion of gradient-filled text as a drop-shadow chain on a host; `tightHalo` alias.
9. **Unit gating** — staggered units hidden until their own start.
10. **Grouped keyframes** — every group's first step at the cue start; `in.from/to` never override keyframed props.
11. **Hard cut at `cue.end`** for text.
12. **Cue lifecycle** — `display: none` (class `mg-off`) outside a cue's lifetime.
13. **`anchor: "ink…"`** text placement.
14. **Grade control** — `scene.grade` true/string/object, `scene.gradeCss`, `overlays: true`, `meta.preGraded`,
    `overlays.applyToBackdrop`.
15. **Mux** — `apad` + exact `-t frames/fps` (no more dropped last frames); frame count verified with ffprobe.
16. **Audio** — master limiter (`masterLimiterDb`), soundSpecs synthesis + recipe vocabulary, rule fields `perUnit`,
    `repeatOffsetsMs`, `condition`, `onlyFirstInReel`, `idealSound` (`idealSfx`), sfx cues with `src`, `sfxBed`,
    `text_out` / `component_out` / `cut` events, `--demo` writes the spec sounds too.
17. **Animated backgrounds on split gradient text** — per-frame re-projection of the element's background.

Behaviour changes to check when updating a style (each is harmless next to the existing workarounds — see the
notes — but the workaround can now be dropped):
- Priming / EPS: v1 workarounds that shift cue start times or prime the masters (style-1 `ember-prime`, style-2
  `boot`, style-3 `primeCam`) still work and are now redundant. Rendering stills in descending order is no longer
  supported (they are sorted).
- Camera: overlapping camera moves now cut instead of fighting; preset `handheld` moves now wobble (additively) instead
  of resetting the camera (style-1 `plate-wobble`: the whole composite now shakes ±10 px in `scene_all_components`;
  the last swing is clipped at the cue end so the camera returns to rest); preset `static` moves behave as before (they
  already reached the scale path). Shake offsets are additive within their cue. Components reading `ctx.cam` see the composed state (base + additive).
  `camMaster.time(x, false)` still updates `ctx.cam` (style-3 `world-rest` / `void-pullback`).
- World layers: `…W` layer divs no longer carry the camera transform; read the camera from `ctx.cam` /
  `ctx.worldMatrix()` instead of a layer's `style.transform`. A component that transforms a W layer itself still works
  (legacy path). Blend modes in world-locked or filter-wrapped elements now really blend (v1 rendered them as normal);
  style-2's screen-layer `worldWrap` keeps working.
- Gradient glows / tightHalo: converted only when no component touched `text-shadow` — style-1 `ember-text-fx`,
  style-2 `glowUnderlay` / tight halo and style-3 `fixGradientGlows` all rewrite it, so nothing doubles.
- Unit gating: uses `visibility` like style-3's gate; both agree, so the combination is harmless. Texts whose
  from-state was visible before their start (e.g. scale-only pops) no longer pre-show.
- Hard cut: identical to style-1's own cut; a text with a type-on longer than its cue now disappears at `end`.
- Lifecycle: a class, not inline `display`, so style-1's own `display` toggles on its wrappers are not overridden; a
  cue's DOM is hidden outside its lifetime, so out-animations that run past `end` are clipped at `end` (v2.1; it was
  `end + ½ frame` in v2 — `scene.lifecycleHalfFrame: true` restores that).
- Grouped keyframes: style-3 `glyph-scale-pop` (first group `all`) renders the same.
- Audio: master limiter instead of global tanh normalisation (peaks between −1 and −0.2 dBFS are now limited);
  rules with a resolvable `idealSound` play it (style-1: ticks → `ping8k`); a style's own `sparkle` spec replaces the
  procedural `sparkle` alias for that style.

# Motion-styles engine

Applies one of the studied reference styles (`../styles/style-N/`) to new talking-head footage.
Everything is deterministic: one paused GSAP timeline is seeked frame by frame in headless Chromium, each
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
pip install numpy opencv-python-headless scikit-learn librosa "mediapipe==0.10.14"
./models/download.sh              # MediaPipe person-segmentation / face / pose models (~26 MB)
```
Chromium comes from Playwright (`/opt/pw-browsers` in the cloud container).

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
python3 audio.py --demo ../renders/sfx                           # audition the procedural SFX
```

## Layer stack

| layer         | what goes there                                                     | camera moves apply |
|---------------|---------------------------------------------------------------------|--------------------|
| `plateWrap`   | the source frame                                                    | yes                |
| `bg`          | background replacements, backdrop graphics (sunbursts, plates)      | no                 |
| `behind`      | text/graphics that the presenter occludes (`"layer": "behind"`)     | no                 |
| `talentWrap`  | presenter cut-out = source frame × person matte                     | yes                |
| `front`       | captions, pills, 3D props in front of the presenter                 | no                 |
| `fx`          | vignette, tint, grain, flashes                                      | no                 |

## scene.json

```jsonc
{
  "autoSfx": true,                      // add the style's SFX rules to matching cues
  "music": {"src": "bed.mp3", "gainDb": -20, "duckDb": -8},   // optional, ducked under the voice
  "cues": [
    {"t": 0.4, "end": 2.6, "type": "text", "preset": "<textPreset id>", "text": "الكيمياء", "dir": "rtl",
     "layer": "behind", "position": {"xPct": 50, "yPct": 20}, "tatweel": 3, "style": {"color": "#fff"}},
    {"t": 1.0, "type": "text", "preset": "...", "segments": [{"text": "يمكن "}, {"text": "انت", "style": {"color": "#ff5a8a"}}]},
    {"t": 3.0, "type": "text", "preset": "...", "words": [{"text": "بس", "t": 3.0}, {"text": "اعلانك", "t": 3.3}]},
    {"t": 2.9, "type": "camera", "preset": "<cameraMove id>"},               // or inline scaleFrom/scaleTo/durationMs/easing/focus
    {"t": 5.0, "end": 9.0, "type": "component", "component": "glass-pill", "props": {"label": "MAX ACADEMY"}},
    {"t": 0, "end": 30, "type": "background", "src": "assets/lab_plate.jpg", "blurPx": 2},
    {"t": 6.5, "end": 10, "type": "image", "src": "assets/flask.png", "widthPct": 45, "position": {"xPct": 25, "yPct": 78}, "float": {"px": 16}},
    {"t": 7.0, "type": "sfx", "sound": "whoosh", "gainDb": -10}
  ]
}
```

Times are absolute seconds. Text `unit` (letter / word / line / none) comes from the preset; Arabic letter-by-letter
animation keeps correct joining (zero-width joiners around each split letter, lam-alef kept whole).

## style.json (per style, written by the study)

`fonts`, `palette`, `grade` (CSS filter values), `overlays` (vignette / tint / grain), `textPresets`
(`in`/`hold`/`out` with `from`/`to` props: opacity, x, y, scale, rotate, blur, brightness, letterSpacing, clip; `durationMs`,
`staggerMs`, `easing` as `cubic-bezier(...)` or a GSAP ease), `cameraMoves`, `sfx` rules, `director` defaults for
`srt2scene.py`, and `persistent` components that run for the whole video. Style-specific graphics live in the style's
`components.js` (same API as `compositor/components-shared.js`).

## Components API

`window.MG.components[id] = (ctx) => { ... }` where `ctx` has `cue`, `tl` (a GSAP timeline whose 0 = `cue.t`),
`layer(name)`, `W`, `H`, `FPS`, `style`, `makeText(cue, tl)`, `mapVars`, `ease`, `rng(seed)`, `face(t)` (presenter face box in
px), `onFrame(fn)` (per-frame hook for canvases / image sequences), `assetUrl(path)`, `applyTextStyle`, `place`, `gsap`.
Rules: no CSS animations, timers or `Math.random` — everything must be a pure function of timeline time.

## Limits

- No speech-to-text model is reachable from the cloud container, so caption timing comes from an SRT (CapCut,
  Premiere, any STT) or from a script auto-timed onto voiced phrases (`speech.json`) — the SRT is far more precise.
- 3D props (teeth models, flasks, molecules) in the references are pre-rendered assets. Supply PNGs / PNG sequences
  (or generate them with an image model) and place them with the `image` / `sequence` components.
- Background replacement quality depends on the matte; busy backgrounds or chairs can bleed at the edges.

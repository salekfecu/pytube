#!/usr/bin/env python3
"""Style-2 SFX bed for demo/scene_doctor.json, synthesized from style.json "soundSpecs".

engine/audio.py only knows its generic procedural sounds (its `shimmer` is random 2.6-7.2 kHz partials that sit in
the same band and level as speech sibilance). This script renders the measured tones instead and writes a bed that
the scene attaches through its "music" field ({"src": "sfx_doctor.wav", "gainDb": 0, "duckDb": 0}); the matching
cues carry "sfx": false so the engine's approximations are not added on top.

  shimmerTwoTone  9250 Hz 100 ms, then 5600 Hz 60 ms, on the gold centre glyph (cue t + preGlow lead)
  tick8k1Series   8.1 kHz 60 ms ticks at +0/240/310/400/670 ms (+ one 4 kHz blip at +400 ms), from pill t + 200 ms

Levels follow the reference measurements (STYLE.md §9): shimmer 8.5-10 kHz band about -34 dBFS, the 5.6 kHz tail
about -38 dBFS; ticks barely audible (-50 dBFS, the reference measured about -57 under a quieter room tone).

  python3 make_sfx_doctor.py [--plate ../../../renders/plates/doctor] [--out sfx_doctor.wav]
"""
import argparse
import json
import os
import subprocess

import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))


def amp(db_rms):
    """peak amplitude of a sine whose RMS is db_rms dBFS"""
    return np.sqrt(2) * 10 ** (db_rms / 20)


def tone(hz, ms, a, attack_ms=4, release_ms=30):
    n = int(ms / 1000 * SR)
    t = np.arange(n) / SR
    env = np.ones(n)
    na, nr = max(1, int(attack_ms / 1000 * SR)), max(1, int(release_ms / 1000 * SR))
    env[:na] = np.linspace(0, 1, na) ** 2
    env[-nr:] *= np.linspace(1, 0, nr) ** 1.5
    return np.sin(2 * np.pi * hz * t) * env * a


def tick(hz, ms, a):
    n = int(ms / 1000 * SR)
    t = np.arange(n) / SR
    env = np.minimum(1, t / 0.002) * np.exp(-t / (ms / 1000 / 3))
    return np.sin(2 * np.pi * hz * t) * env * a


def place(buf, t, x):
    i = int(round(t * SR))
    if i >= len(buf) or i + len(x) <= 0:
        return
    j = min(len(buf), i + len(x))
    buf[max(0, i):j] += x[max(0, -i):j - i]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--plate', default=os.path.join(HERE, '../../../renders/plates/doctor'))
    ap.add_argument('--scene', default=os.path.join(HERE, 'scene_doctor.json'))
    ap.add_argument('--style', default=os.path.join(HERE, '../style.json'))
    ap.add_argument('--out', default=os.path.join(HERE, 'sfx_doctor.wav'))
    a = ap.parse_args()
    scene = json.load(open(a.scene))
    style = json.load(open(a.style))
    specs = style['soundSpecs']
    # same length as the voice as audio.py decodes it, so the bed is never tiled
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', os.path.join(a.plate, 'audio.wav'), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    n = len(raw) // 8
    bed = np.zeros(n)
    cues = scene['cues']
    gold = next(c for c in cues if c.get('preset') == 'gold-light-panel-grow')
    pill = next(c for c in cues if c.get('component') == 'glass-pill-gold')
    gp = next(p for p in style['textPresets'] if p['id'] == 'gold-light-panel-grow')
    lead = (gp['in'].get('preGlow') or {}).get('leadMs', 100) / 1000

    # shimmerTwoTone on the centre glyph body
    sh = specs['shimmerTwoTone']
    t0 = gold['t'] + lead
    (hi, lo) = sh['tones']
    place(bed, t0, tone(hi['hz'], hi['ms'] + sh.get('releaseMs', 30), amp(-34), sh.get('attackMs', 4), sh.get('releaseMs', 30)))
    place(bed, t0 + hi['ms'] / 1000, tone(lo['hz'], lo['ms'] + sh.get('releaseMs', 30), amp(-38), 2, sh.get('releaseMs', 30)))

    # tick8k1Series from the pill (+200 ms, style.json sfx rule) + the 4 kHz blip
    tk = specs['tick8k1Series']
    rule = next((r for r in style['sfx'] if r.get('preset') == 'glass-pill-gold'), {})
    t1 = pill['t'] + rule.get('offsetMs', 200) / 1000
    for off in tk['repeatOffsetsMs']:
        place(bed, t1 + off / 1000, tick(tk['hz'], tk['ms'], amp(-50)))
    place(bed, t1 + 0.400, tone(4000, 140, amp(-52), 3, 60))

    out = np.stack([bed, bed], 1).astype(np.float32)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-i', '-', a.out],
                   input=out.tobytes(), check=True)
    print(f'shimmer at {t0:.3f} s, ticks from {t1:.3f} s → {a.out} ({n / SR:.3f} s)')


if __name__ == '__main__':
    main()

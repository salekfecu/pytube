#!/usr/bin/env python3
"""Build the final audio: source voice + synthesized SFX (+ optional music bed with ducking).

SFX come from three places:
  1. explicit scene cues   {"type": "sfx", "t": 2.9, "sound": "whoosh", "gainDb": -8}
  2. style rules           style.json "sfx": [{"event": "text_in", "sound": "pop", "offsetMs": -40, "gainDb": -14}]
     applied when scene.json has "autoSfx": true. Events: text_in, text_out, camera, component_in, cut.
     A cue can opt out with "sfx": false or pick its own with "sfx": "whoosh".
  3. scene.json "music": {"src": "bed.mp3", "gainDb": -20, "duckDb": -8}

All SFX are synthesized procedurally (no sample library needed) so renders are reproducible.
Run `python3 audio.py --demo DIR` to write every sound to DIR for auditioning.
"""
import argparse
import json
import os
import subprocess

import numpy as np

SR = 48000


def env_adsr(n, a, d, s, r, sustain=0.6):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    s_len = max(0, n - a - d - r)
    return np.concatenate([np.linspace(0, 1, a, endpoint=False) ** 2, np.linspace(1, sustain, d, endpoint=False),
                           np.full(s_len, sustain), np.linspace(sustain, 0, r) ** 1.5])[:n]


def bandpass_noise(n, f_start, f_end, q=2.0, seed=0):
    """Noise through a time-varying 2-pole resonant band-pass (swept centre frequency)."""
    rng = np.random.default_rng(seed)
    x = rng.standard_normal(n)
    y = np.zeros(n)
    fc = np.geomspace(f_start, f_end, n)
    y1 = y2 = 0.0
    for i in range(n):
        w = 2 * np.pi * fc[i] / SR
        alpha = np.sin(w) / (2 * q)
        b0, a0, a1, a2 = alpha, 1 + alpha, -2 * np.cos(w), 1 - alpha
        yi = (b0 * (x[i] - (x[i - 2] if i > 1 else 0)) - a1 * y1 - a2 * y2) / a0
        y2, y1 = y1, yi
        y[i] = yi
    return y / (np.max(np.abs(y)) + 1e-9)


def stereo(x, pan=0.0):
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l * 1.414, x * r * 1.414], 1)


def whoosh(dur=0.45, up=True, seed=1):
    n = int(dur * SR)
    x = bandpass_noise(n, 300 if up else 2500, 2500 if up else 300, q=1.2, seed=seed)
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.6
    pan = np.linspace(-0.6, 0.6, n)
    return np.stack([x * e * np.cos((pan + 1) * np.pi / 4) * 1.4, x * e * np.sin((pan + 1) * np.pi / 4) * 1.4], 1) * 0.7


def swoosh(dur=0.22, seed=2):
    n = int(dur * SR)
    x = bandpass_noise(n, 900, 5000, q=1.6, seed=seed)
    e = np.exp(-np.linspace(0, 5, n)) * np.minimum(1, np.linspace(0, 12, n))
    return stereo(x * e * 0.8)


def pop(f0=900, dur=0.09):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f0 * np.exp(-t * 18)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45)
    return stereo(x * 0.9)


def click(dur=0.03):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 2400 * t) + 0.5 * np.sin(2 * np.pi * 5200 * t)) * np.exp(-t * 300)
    return stereo(x * 0.7)


def tick(dur=0.02):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return stereo(np.sin(2 * np.pi * 4200 * t) * np.exp(-t * 500) * 0.5)


def riser(dur=1.2, seed=3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = bandpass_noise(n, 400, 6000, q=1.0, seed=seed) * 0.5
    tone = np.sin(2 * np.pi * np.cumsum(np.geomspace(200, 1400, n)) / SR) * 0.35
    e = (t / dur) ** 2.2
    return stereo((noise + tone) * e)


def impact(dur=0.9, seed=4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(55 * np.exp(-t * 3) + 35) / SR) * np.exp(-t * 4)
    rng = np.random.default_rng(seed)
    burst = rng.standard_normal(n) * np.exp(-t * 30) * 0.4
    return stereo(np.tanh((sub + burst) * 1.5) * 0.9)


def shimmer(dur=0.8, seed=5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(seed)
    x = np.zeros(n)
    for k in range(7):
        f = rng.uniform(2600, 7200)
        st = rng.uniform(0, dur * 0.4)
        e = np.clip(t - st, 0, None)
        x += np.sin(2 * np.pi * f * t) * np.where(t > st, np.exp(-e * 6), 0) * 0.18
    return stereo(x * np.minimum(1, t * 20))


def ding(f=1320, dur=0.7):
    t = np.arange(int(dur * SR)) / SR
    x = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t)) * np.exp(-t * 6)
    return stereo(x * 0.5)


def glitch(dur=0.18, seed=6):
    n = int(dur * SR)
    rng = np.random.default_rng(seed)
    x = np.repeat(rng.uniform(-1, 1, n // 120 + 1), 120)[:n]
    x *= (rng.random(n // 600 + 1) > 0.4).repeat(600)[:n]
    return stereo(x * 0.35)


def bass_drop(dur=1.0):
    t = np.arange(int(dur * SR)) / SR
    x = np.sin(2 * np.pi * np.cumsum(120 * np.exp(-t * 2.5) + 30) / SR) * np.exp(-t * 2.2)
    return stereo(np.tanh(x * 2) * 0.8)


SOUNDS = {
    'whoosh': lambda: whoosh(), 'whoosh_down': lambda: whoosh(up=False), 'whoosh_long': lambda: whoosh(0.8),
    'swoosh': lambda: swoosh(), 'pop': lambda: pop(), 'pop_low': lambda: pop(520, 0.12), 'click': lambda: click(),
    'tick': lambda: tick(), 'riser': lambda: riser(), 'riser_short': lambda: riser(0.6), 'impact': lambda: impact(),
    'shimmer': lambda: shimmer(), 'ding': lambda: ding(), 'glitch': lambda: glitch(), 'bass_drop': lambda: bass_drop(),
}
# a few aliases style guides may use
ALIASES = {'swish': 'swoosh', 'whoosh_short': 'swoosh', 'hit': 'impact', 'boom': 'impact', 'sparkle': 'shimmer',
           'chime': 'ding', 'blip': 'pop', 'ui_click': 'click', 'rise': 'riser', 'sub_drop': 'bass_drop', 'transition': 'whoosh'}


def get_sound(name):
    name = ALIASES.get(name, name)
    if name not in SOUNDS:
        print(f'[audio] unknown sound "{name}", using swoosh')
        name = 'swoosh'
    return SOUNDS[name]()


def load_wav(path, dur=None):
    cmd = ['ffmpeg', '-loglevel', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def db(x):
    return 10 ** (x / 20)


def collect_events(scene, style):
    ev = []
    cues = scene.get('cues', [])
    rules = {}
    for r in style.get('sfx', []) or []:
        rules.setdefault(r.get('event'), []).append(r)
    auto = scene.get('autoSfx', False)
    for c in cues:
        if c.get('type') == 'sfx':
            ev.append((c['t'], c.get('sound', 'swoosh'), c.get('gainDb', -10)))
            continue
        if c.get('sfx') is False:
            continue
        if isinstance(c.get('sfx'), str):
            ev.append((c['t'] + c.get('sfxOffsetMs', 0) / 1000, c['sfx'], c.get('sfxGainDb', -12)))
            continue
        if not auto:
            continue
        kind = {'text': 'text_in', 'camera': 'camera', 'component': 'component_in', 'background': 'component_in', 'image': 'component_in'}.get(c.get('type'))
        for r in rules.get(kind, []):
            if r.get('preset') and r['preset'] not in (c.get('preset'), c.get('component'), c.get('id')):
                continue
            ev.append((c['t'] + r.get('offsetMs', 0) / 1000, r.get('sound', 'swoosh'), r.get('gainDb', -12)))
    return ev


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--plate')
    ap.add_argument('--scene')
    ap.add_argument('--style')
    ap.add_argument('--out')
    ap.add_argument('--demo')
    a = ap.parse_args()
    if a.demo:
        os.makedirs(a.demo, exist_ok=True)
        for k in SOUNDS:
            x = get_sound(k)
            write(os.path.join(a.demo, k + '.wav'), x / (np.max(np.abs(x)) + 1e-9) * 0.8)
        print('wrote', len(SOUNDS), 'sounds to', a.demo)
        return
    scene = json.load(open(a.scene))
    style = json.load(open(a.style))
    voice = load_wav(os.path.join(a.plate, 'audio.wav'))
    out = voice * db(scene.get('voiceGainDb', 0))
    events = collect_events(scene, style)
    for t, name, g in events:
        s = get_sound(name) * db(g)
        i = int(max(0, t) * SR)
        if i >= len(out):
            continue
        j = min(len(out), i + len(s))
        out[i:j] += s[:j - i]
    m = scene.get('music')
    if m and m.get('src'):
        src = m['src'] if os.path.isabs(m['src']) else os.path.join(os.path.dirname(a.scene), m['src'])
        bed = load_wav(src)
        if len(bed) < len(out):
            bed = np.tile(bed, (len(out) // len(bed) + 1, 1))
        bed = bed[:len(out)] * db(m.get('gainDb', -20))
        # duck the bed under the voice (envelope follower on the voice)
        env = np.abs(voice).mean(1)
        k = int(0.08 * SR)
        env = np.convolve(env, np.ones(k) / k, mode='same')
        duck = np.where(env > 0.02, db(m.get('duckDb', -8)), 1.0)
        duck = np.convolve(duck, np.ones(k * 3) / (k * 3), mode='same')
        out += bed * duck[:, None]
    peak = np.max(np.abs(out))
    if peak > 0.98:
        out = np.tanh(out / peak * 1.2) * 0.97
    write(a.out, out)
    print(f'[audio] {len(events)} sfx events mixed → {a.out}')


def write(path, x):
    p = subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-i', '-', path],
                       input=np.ascontiguousarray(x, dtype=np.float32).tobytes())
    p.check_returncode()


if __name__ == '__main__':
    main()

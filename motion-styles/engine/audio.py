#!/usr/bin/env python3
"""Build the final audio: source voice + synthesized SFX (+ optional beds) through a master peak limiter.

SFX come from these places:
  1. explicit scene cues   {"type": "sfx", "t": 2.9, "sound": "whoosh", "gainDb": -8}
                           {"type": "sfx", "t": 2.9, "src": "assets/click.wav", "gainDb": -6}     (a wav/any audio file)
  2. style rules           style.json "sfx": [{"event": "text_in", "preset": "...", "sound": "pop", "idealSound": "popHF",
                           "offsetMs": -40, "gainDb": -14, "perUnit": true, "repeatOffsetsMs": [0, 300],
                           "condition": {"component": "visionos-glass-ui"}, "onlyFirstInReel": true}]
     applied when scene.json has "autoSfx": true. Events: text_in, text_out, camera, component_in, component_out, cut.
     A cue can opt out with "sfx": false or pick its own with "sfx": "whoosh".
  3. scene.json "music":  {"src": "bed.mp3", "gainDb": -20, "duckDb": -8}     tiled, ducked under the voice
     scene.json "sfxBed": {"src": "sfx.wav", "gainDb": 0, "t": 0}           as-is: never tiled, never ducked
                           (or a list of such beds)

Sounds: the procedural library below (whoosh, pop, tick, ...) plus every style's "soundSpecs" (ping8k,
shimmerTwoTone, chimeGlass, tick8k1Series, typingRattleHF, popHF, ding4k, ...), synthesized from a small recipe
vocabulary (multi-partial tone with attack/decay, tick series, HF transient train, filtered noise burst). A rule's
"idealSound" is used when it resolves (scene "idealSfx": false keeps the stand-in "sound").

Master: a look-ahead peak limiter at scene "masterLimiterDb" (default -1 dBFS; null = legacy tanh soft clip).
All synthesis is seeded / closed-form, so renders are reproducible.
Run `python3 audio.py --demo DIR [--style style.json]` to write every sound to DIR for auditioning.
"""
import argparse
import glob
import json
import math
import os
import re
import subprocess

import numpy as np

try:
    from scipy.signal import butter, sosfilt
except Exception:  # pragma: no cover - scipy is optional
    butter = sosfilt = None

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))


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


# ------------------------------------------------------------------ recipe vocabulary (data-driven synthesis)
# A recipe is a dict with "kind":
#   tone          {partials: [{hz, hzEnd?, gainDb?, delayMs?, durMs?}], durationMs, attackMs, decayPerSec | decayDb+decayMs,
#                  releaseMs}                     multi-partial tone (sine partials, optional glide), attack + exp decay
#   noise         {bandHz: [lo, hi], durationMs, attackMs, decayPerSec | decayDb+decayMs, releaseMs, seed}
#                                                 filtered noise burst
#   train         {durationMs, intervalMs: [min, max], clickMs, hpHz, seed, shape: "flat"|"swell"}
#                                                 HF transient train (typing rattle)
#   sequence      {steps: [recipe + atMs]}        recipes one after another (atMs = start inside the sound)
#   layers        {layers: [recipe + gainDb]}     recipes mixed
#   any recipe may add "repeatOffsetsMs": [0, 240, ...] (a tick series) and "gainDb".
PEAK = 10 ** (-3 / 20)  # spec sounds are normalised to -3 dBFS peak; the rule / cue gainDb sets the level


def _filt(x, kind, hz):
    if butter is None:
        # crude fallback: 1st-order differences (HP) / moving average (LP)
        if kind == 'highpass':
            for _ in range(3):
                x = np.diff(x, prepend=x[:1])
            return x
        k = max(1, int(SR / max(hz, 1) / 2))
        return np.convolve(x, np.ones(k) / k, mode='same')
    if kind == 'band':
        lo, hi = hz
        hi = min(hi, SR / 2 * 0.98)
        sos = butter(4, [max(20, lo), hi], btype='bandpass', fs=SR, output='sos')
    else:
        sos = butter(4, min(hz, SR / 2 * 0.98), btype=kind, fs=SR, output='sos')
    return sosfilt(sos, x)


def _decay_rate(r, default=30.0):
    """amplitude decay rate (1/s) from decayPerSec or decayDb over decayMs."""
    if r.get('decayPerSec') is not None:
        return float(r['decayPerSec'])
    if r.get('decayDb') is not None and r.get('decayMs'):
        return float(r['decayDb']) / 20 * math.log(10) / (float(r['decayMs']) / 1000)
    return default


def _envelope(n, attack_ms, rate, release_ms):
    t = np.arange(n) / SR
    a = max(1, int(attack_ms / 1000 * SR))
    e = np.exp(-rate * t)
    e[:a] *= np.sin(np.linspace(0, np.pi / 2, a)) ** 2  # smooth onset (no click)
    r = min(n, max(1, int(release_ms / 1000 * SR)))
    e[n - r:] *= np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return e


def synth(r, depth=0):
    """recipe → mono float array (not normalised)."""
    kind = r.get('kind', 'tone')
    if kind == 'tone':
        dur = r.get('durationMs', 120) / 1000
        n = max(1, int(dur * SR))
        x = np.zeros(n)
        rate = _decay_rate(r, 20.0)
        for p in r.get('partials', []):
            d0 = int(p.get('delayMs', 0) / 1000 * SR)
            pn = min(n - d0, int(p.get('durMs', r.get('durationMs', 120)) / 1000 * SR))
            if pn <= 0:
                continue
            f0 = float(p['hz'])
            f1 = float(p.get('hzEnd', f0))
            f = np.geomspace(f0, f1, pn) if f1 != f0 else np.full(pn, f0)
            ph = 2 * np.pi * np.cumsum(f) / SR
            g = 10 ** (p.get('gainDb', 0) / 20)
            pr = _decay_rate(p, rate) if ('decayPerSec' in p or 'decayDb' in p) else rate
            x[d0:d0 + pn] += g * np.sin(ph) * _envelope(pn, p.get('attackMs', r.get('attackMs', 2)), pr, p.get('releaseMs', r.get('releaseMs', 8)))
        return x
    if kind == 'noise':
        dur = r.get('durationMs', 60) / 1000
        n = max(1, int(dur * SR))
        x = np.random.default_rng(r.get('seed', 11)).standard_normal(n)
        band = r.get('bandHz')
        if band:
            x = _filt(x, 'band', band) if band[1] else _filt(x, 'highpass', band[0])
        elif r.get('hpHz'):
            x = _filt(x, 'highpass', r['hpHz'])
        if r.get('lpHz'):
            x = _filt(x, 'lowpass', r['lpHz'])
        return x * _envelope(n, r.get('attackMs', 1), _decay_rate(r, 60.0), r.get('releaseMs', 5))
    if kind == 'train':
        dur = r.get('durationMs', 480) / 1000
        n = max(1, int(dur * SR))
        rng = np.random.default_rng(r.get('seed', 21))
        lo, hi = r.get('intervalMs', [22, 46])
        cm = r.get('clickMs', 2.0)
        x = np.zeros(n + int(cm / 1000 * SR) + 2)
        t = 0.0
        while t < dur:
            i = int(t * SR)
            cn = int(cm / 1000 * SR)
            c = rng.standard_normal(cn) * np.exp(-np.arange(cn) / (cn / 4 + 1e-9)) * rng.uniform(0.55, 1.0)
            x[i:i + cn] += c
            t += rng.uniform(lo, hi) / 1000
        x = x[:n]
        x = _filt(x, 'highpass', r.get('hpHz', 11000))
        if r.get('lpHz'):
            x = _filt(x, 'lowpass', r['lpHz'])
        if r.get('shape', 'swell') == 'swell':
            x *= np.sin(np.linspace(0, np.pi, n)) ** 0.5
        return x
    if kind == 'sequence':
        parts = [(int(s.get('atMs', 0) / 1000 * SR), synth(s, depth + 1) * 10 ** (s.get('gainDb', 0) / 20)) for s in r.get('steps', [])]
        n = max([a + len(p) for a, p in parts] + [1])
        x = np.zeros(n)
        for a, p in parts:
            x[a:a + len(p)] += p
        return x
    if kind == 'layers':
        parts = [(int(s.get('atMs', 0) / 1000 * SR), synth(s, depth + 1) * 10 ** (s.get('gainDb', 0) / 20)) for s in r.get('layers', [])]
        n = max([a + len(p) for a, p in parts] + [1])
        x = np.zeros(n)
        for a, p in parts:
            x[a:a + len(p)] += p
        return x
    raise ValueError(f'unknown recipe kind {kind}')


def render_recipe(r):
    x = synth(r)
    offs = r.get('repeatOffsetsMs')
    if offs:
        n = int(max(offs) / 1000 * SR) + len(x)
        y = np.zeros(n)
        for o in offs:
            a = int(o / 1000 * SR)
            y[a:a + len(x)] += x
        x = y
    pk = np.max(np.abs(x)) + 1e-12
    return stereo(x / pk * PEAK)  # stereo() keeps the centre level (cos(pi/4) * 1.414 = 1)


# Hand-written recipes for spec names whose style.json entry is only a description (style-3) — they follow the
# measured descriptions exactly (frequencies, lengths, decays, intervals).
BUILTIN_RECIPES = {
    # style-1 ping8k: 8.36 kHz sine ping, 60 ms, 2 ms attack, exponential decay
    'ping8k': {'kind': 'tone', 'durationMs': 60, 'attackMs': 2, 'decayDb': 40, 'decayMs': 60, 'releaseMs': 6, 'partials': [{'hz': 8360}]},
    # style-3: train of tiny transients above 11 kHz, one every 22-46 ms, 480 ms long
    'typingRattleHF': {'kind': 'train', 'durationMs': 480, 'intervalMs': [22, 46], 'clickMs': 2.2, 'hpHz': 11000, 'lpHz': 18000, 'seed': 31, 'shape': 'swell'},
    # 6.64 kHz tonal tick + broadband >11 kHz burst, ~50 ms
    'tickHF': {'kind': 'layers', 'layers': [
        {'kind': 'tone', 'durationMs': 50, 'attackMs': 1, 'decayDb': 36, 'decayMs': 50, 'releaseMs': 4, 'partials': [{'hz': 6640}]},
        {'kind': 'noise', 'durationMs': 30, 'bandHz': [11000, 18000], 'attackMs': 0.5, 'decayDb': 40, 'decayMs': 30, 'gainDb': -2, 'seed': 41}]},
    # short pop, spectral peak ~10-10.7 kHz, ~90 ms
    'popHF': {'kind': 'layers', 'layers': [
        {'kind': 'tone', 'durationMs': 90, 'attackMs': 1.5, 'decayDb': 42, 'decayMs': 90, 'releaseMs': 6, 'partials': [{'hz': 10700, 'hzEnd': 10000}]},
        {'kind': 'noise', 'durationMs': 40, 'bandHz': [9500, 11800], 'attackMs': 0.5, 'decayDb': 40, 'decayMs': 40, 'gainDb': -6, 'seed': 51}]},
    # 4.19 kHz fundamental + 8.38 kHz partial (2.6 dB louder), decays ~25 dB by 220 ms, ~300 ms ring
    'ding4k': {'kind': 'tone', 'durationMs': 320, 'attackMs': 2, 'decayDb': 25, 'decayMs': 220, 'releaseMs': 30,
               'partials': [{'hz': 4190, 'gainDb': 0}, {'hz': 8380, 'gainDb': 2.6}]},
    # single ~25 ms >11 kHz click
    'clickHF': {'kind': 'noise', 'durationMs': 25, 'bandHz': [11000, 18000], 'attackMs': 0.4, 'decayDb': 45, 'decayMs': 25, 'releaseMs': 3, 'seed': 61},
}


def _num(v, d=None):
    try:
        return float(v)
    except (TypeError, ValueError):
        return d


def spec_to_recipe(name, spec):
    """style.json soundSpecs entry → recipe (None when it cannot be interpreted)."""
    if not isinstance(spec, dict):
        return None
    if isinstance(spec.get('recipe'), dict):
        return spec['recipe']
    if name in BUILTIN_RECIPES:
        return BUILTIN_RECIPES[name]
    typ = str(spec.get('type', '')).lower()
    rep = spec.get('repeatOffsetsMs')
    r = None
    if typ in ('two-tone', 'partials-sequence') and (spec.get('tones') or spec.get('steps')):
        steps, at = [], 0
        for s in spec.get('tones') or spec.get('steps'):
            ms = _num(s.get('ms'), 80)
            steps.append({'kind': 'tone', 'atMs': at, 'durationMs': ms, 'attackMs': _num(spec.get('attackMs'), 4),
                          'decayDb': 18, 'decayMs': ms, 'releaseMs': _num(spec.get('releaseMs'), 20), 'partials': [{'hz': s['hz']}]})
            at += ms
        r = {'kind': 'sequence', 'steps': steps}
    elif typ in ('inharmonic-bell', 'partials', 'bell') and spec.get('partialsHz'):
        gains = spec.get('partialGainsDb') or [0] * len(spec['partialsHz'])
        dur = _num(spec.get('durationMs'), 300)
        r = {'kind': 'tone', 'durationMs': dur, 'attackMs': _num(spec.get('attackMs'), 2),
             'decayPerSec': _num(spec.get('decayPerSec'), 40 / 20 * math.log(10) / (dur / 1000)), 'releaseMs': min(40, dur / 4),
             'partials': [{'hz': h, 'gainDb': g} for h, g in zip(spec['partialsHz'], gains)]}
    elif ('tick' in typ or 'ping' in typ or 'sine' in typ or 'tone' in typ) and (spec.get('hz') or spec.get('freqHz')):
        dur = _num(spec.get('ms') or spec.get('durationMs'), 60)
        m = re.search(r'([\d.]+)\s*ms attack', str(spec.get('envelope', '')))
        r = {'kind': 'tone', 'durationMs': dur, 'attackMs': _num(m.group(1), 2) if m else (1 if 'tick' in typ else 2),
             'decayDb': 40, 'decayMs': dur, 'releaseMs': min(8, dur / 6), 'partials': [{'hz': spec.get('hz') or spec.get('freqHz')}]}
    elif spec.get('desc'):
        r = desc_to_recipe(spec['desc'])
    if r is None:
        return None
    if rep:
        r = {**r, 'repeatOffsetsMs': rep}
    return r


def desc_to_recipe(desc):
    """best-effort parser for prose specs ("4.19 kHz fundamental + 8.38 kHz partial, decays ~25 dB by 220 ms")."""
    d = desc.lower()
    khz = [float(v) * 1000 for v in re.findall(r'([\d.]+)\s*khz', d)]
    dur = re.search(r'~?\s*([\d.]+)\s*ms\b(?![^,]*by)', d)
    dur = float(dur.group(1)) if dur else 120
    dec = re.search(r'decays?\s*~?\s*([\d.]+)\s*db\s*by\s*([\d.]+)\s*ms', d)
    if 'transient' in d or 'rattle' in d or 'train' in d:
        iv = re.search(r'every\s*([\d.]+)\s*-\s*([\d.]+)\s*ms', d)
        hp = re.search(r'above\s*([\d.]+)\s*khz', d)
        ln = re.search(r'([\d.]+)\s*ms long', d)
        return {'kind': 'train', 'durationMs': float(ln.group(1)) if ln else 480, 'intervalMs': [float(iv.group(1)), float(iv.group(2))] if iv else [25, 45],
                'hpHz': float(hp.group(1)) * 1000 if hp else 10000, 'clickMs': 2.2}
    if ('click' in d or 'burst' in d) and not ('tonal' in d or 'partial' in d):
        hp = re.search(r'>\s*([\d.]+)\s*khz', d)
        return {'kind': 'noise', 'durationMs': dur, 'bandHz': [float(hp.group(1)) * 1000 if hp else 8000, 0], 'attackMs': 0.5, 'decayDb': 40, 'decayMs': dur}
    if khz:
        r = {'kind': 'tone', 'durationMs': dur, 'attackMs': 2, 'releaseMs': 10, 'partials': [{'hz': f} for f in khz if f < SR / 2]}
        if dec:
            r.update(decayDb=float(dec.group(1)), decayMs=float(dec.group(2)))
        else:
            r.update(decayDb=36, decayMs=dur)
        return r
    return None


NAME_RE = re.compile(r'^(ping|tick|ding|chime|beep|blip|pop|click)(\d+)k(\d)?', re.I)


def name_to_recipe(name):
    """ping8k / tick8k1 / ding4k ... without a spec: a tone at the frequency in the name."""
    m = NAME_RE.match(name or '')
    if not m:
        return None
    hz = float(m.group(2)) * 1000 + (float(m.group(3)) * 100 if m.group(3) else 0)
    kind = m.group(1).lower()
    if kind in ('ding', 'chime'):
        return {'kind': 'tone', 'durationMs': 320, 'attackMs': 2, 'decayDb': 25, 'decayMs': 220, 'releaseMs': 30, 'partials': [{'hz': hz}, {'hz': hz * 2, 'gainDb': -4}]}
    if kind in ('pop', 'click'):
        return {'kind': 'tone', 'durationMs': 80, 'attackMs': 1, 'decayDb': 42, 'decayMs': 80, 'partials': [{'hz': hz * 1.05, 'hzEnd': hz}]}
    return {'kind': 'tone', 'durationMs': 60, 'attackMs': 2 if kind == 'ping' else 1, 'decayDb': 40, 'decayMs': 60, 'releaseMs': 6, 'partials': [{'hz': hz}]}


class SoundBank:
    """resolves a sound name, in this order: the active style's soundSpecs → BUILTIN_RECIPES → the procedural library
    (+ ALIASES) → the sibling styles' soundSpecs → a frequency name pattern (ping8k, tick7k2, ding4k) → swoosh."""

    def __init__(self, style=None, style_path=None):
        self.own = dict((style or {}).get('soundSpecs') or {})
        self.siblings = {}
        self.cache = {}
        if style_path:
            sib = sorted(glob.glob(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(style_path))), 'style-*', 'style.json')))
            for p in sib:
                if os.path.abspath(p) == os.path.abspath(style_path):
                    continue
                try:
                    for k, v in (json.load(open(p)).get('soundSpecs') or {}).items():
                        self.siblings.setdefault(k, v)
                except Exception:
                    pass
        self.specs = {**self.siblings, **self.own}

    def recipe(self, name):
        """recipe for a synthesized spec sound, or None when the name is a library sound / unknown."""
        if not name:
            return None
        if name in self.own:
            r = spec_to_recipe(name, self.own[name])
            if r:
                return r
        if name in BUILTIN_RECIPES:
            return BUILTIN_RECIPES[name]
        if name in SOUNDS or name in ALIASES:
            return None
        if name in self.siblings:
            r = spec_to_recipe(name, self.siblings[name])
            if r:
                return r
        return name_to_recipe(name)

    def has(self, name):
        return bool(name) and (self.recipe(name) is not None or name in SOUNDS or name in ALIASES)

    def get(self, name):
        if name in self.cache:
            return self.cache[name]
        r = self.recipe(name)
        if r is not None:
            x = render_recipe(r)
        else:
            n2 = ALIASES.get(name, name)
            if n2 not in SOUNDS:
                print(f'[audio] unknown sound "{name}", using swoosh')
                n2 = 'swoosh'
            x = SOUNDS[n2]()
        self.cache[name] = x
        return x


def get_sound(name):
    """procedural library lookup (kept for scripts that import audio.py)."""
    return SoundBank().get(name)


def load_wav(path, dur=None):
    cmd = ['ffmpeg', '-loglevel', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def db(x):
    return 10 ** (x / 20)


# ------------------------------------------------------------------ events
def _graphemes(word):
    out = []
    ch = list(word)
    i = 0
    marks = re.compile('[ً-ٰۖ-ۭ]')
    while i < len(ch):
        c = ch[i]
        if marks.match(c) and out:
            out[-1] += c
        elif c == 'ل' and i + 1 < len(ch) and ch[i + 1] in 'اأإآ':
            out.append(c + ch[i + 1])
            i += 1
        else:
            out.append(c)
        i += 1
    return out


def unit_times(c, preset):
    """start time (s) of every unit of a text cue (for perUnit rules)."""
    if c.get('words'):
        return [w.get('t', c['t']) for w in c['words']]
    unit = c.get('unit') or preset.get('unit') or 'word'
    pin = {**(preset.get('in') or {}), **(c.get('in') or {})}
    stagger = (pin.get('staggerMs') or 0) / 1000
    text = c.get('text')
    if text is None:
        text = ''.join(s.get('text', '') for s in (c.get('segments') or []))
    if unit == 'letter':
        n = 0
        for w in text.split():
            g = _graphemes(w)
            if (c.get('tatweelUnit') or pin.get('tatweelUnit')) == 'run':
                g = [x for i, x in enumerate(g) if not (x == 'ـ' and i > 0 and g[i - 1] == 'ـ')]
            n += len(g)
        if c.get('tatweel'):
            n += int(c['tatweel']) * len(text.split())
    elif unit == 'word':
        n = len(text.split())
    elif unit == 'line':
        n = len([l for l in text.split('\n') if l.strip()])
    else:
        n = 1
    return [c['t'] + i * stagger for i in range(max(1, n))]


def collect_events(scene, style, bank=None, meta=None, scene_dir='.'):
    """→ list of (t, sound_name | wav_array, gainDb)."""
    bank = bank or SoundBank(style)
    ev = []
    cues = scene.get('cues', [])
    presets = {p.get('id'): p for p in style.get('textPresets', []) or []}
    rules = {}
    for r in style.get('sfx', []) or []:
        rules.setdefault(r.get('event'), []).append(r)
    auto = scene.get('autoSfx', False)
    ideal = scene.get('idealSfx', True) is not False
    fps = (meta or {}).get('fps', 30)
    # shots: camera cues and plate cuts split the reel (for rule conditions "within": "shot")
    bounds = sorted({0.0} | {float(c['t']) for c in cues if c.get('type') == 'camera'}
                    | {float(f) / fps for f in ((meta or {}).get('cuts') or [])})

    def shot_of(t):
        a = max([b for b in bounds if b <= t + 1e-6] or [0.0])
        later = [b for b in bounds if b > t + 1e-6]
        return a, (later[0] if later else 1e9)

    known = set()
    for c in cues:
        for k in ('component', 'preset', 'id'):
            if c.get(k):
                known.add(c[k])
    for g in style.get('graphicComponents', []) or []:
        known.add(g.get('id'))

    def present(ids, t0, t1):
        for c in cues:
            if not ({c.get('component'), c.get('preset'), c.get('id')} & ids):
                continue
            a = c['t']
            b = c.get('end', a + 3.0)
            if a < t1 and b > t0:
                return True
        return False

    def cond_ok(cond, c):
        if not cond:
            return True
        if isinstance(cond, str):
            ids = {k for k in known if k and k in cond}
            if not ids:
                print(f'[audio] condition "{cond}" names no known component/preset: ignored')
                return True
            within = 'shot'
        else:
            ids = set()
            for k in ('component', 'preset', 'id', 'any'):
                v = cond.get(k)
                if isinstance(v, str):
                    ids.add(v)
                elif isinstance(v, list):
                    ids |= set(v)
            within = cond.get('within', 'shot')
        if within == 'scene':
            t0, t1 = -1e9, 1e9
        elif within == 'cue':
            t0, t1 = c['t'], c.get('end', c['t'] + 0.5)
        else:
            t0, t1 = shot_of(c['t'])
        return present(ids, t0, t1)

    fired_first = set()
    for c in sorted(cues, key=lambda q: q.get('t', 0)):
        if c.get('type') == 'sfx':
            if c.get('src'):
                src = c['src'] if os.path.isabs(c['src']) else os.path.join(scene_dir, c['src'])
                try:
                    ev.append((c['t'], load_wav(src), c.get('gainDb', 0)))
                except Exception as e:
                    print(f'[audio] cannot load sfx src {src}: {e}')
            else:
                ev.append((c['t'], c.get('sound', 'swoosh'), c.get('gainDb', -10)))
            continue
        if c.get('sfx') is False:
            continue
        if isinstance(c.get('sfx'), str):
            ev.append((c['t'] + c.get('sfxOffsetMs', 0) / 1000, c['sfx'], c.get('sfxGainDb', -12)))
            continue
        if not auto:
            continue
        typ = c.get('type')
        kinds = {'text': ['text_in', 'text_out'], 'camera': ['camera', 'cut'], 'component': ['component_in', 'component_out'],
                 'background': ['component_in', 'component_out'], 'image': ['component_in', 'component_out'],
                 'sequence': ['component_in', 'component_out']}.get(typ, [])
        for kind in kinds:
            for r in rules.get(kind, []):
                if r.get('preset') and r['preset'] not in (c.get('preset'), c.get('component'), c.get('id')):
                    continue
                if kind.endswith('_out') and c.get('end') is None:
                    continue
                if not cond_ok(r.get('condition'), c):
                    continue
                if r.get('onlyFirstInReel'):
                    if id(r) in fired_first:
                        continue
                    fired_first.add(id(r))
                name = r.get('sound', 'swoosh')
                if ideal and r.get('idealSound') and bank.has(r['idealSound']):
                    name = r['idealSound']
                t0 = c['end'] if kind.endswith('_out') else c['t']
                times = unit_times(c, presets.get(c.get('preset'), {})) if (r.get('perUnit') and typ == 'text') else [t0]
                for tu in times:
                    for ro in (r.get('repeatOffsetsMs') or [0]):
                        ev.append((tu + (r.get('offsetMs', 0) + ro) / 1000, name, r.get('gainDb', -12)))
    return ev


# ------------------------------------------------------------------ master limiter
def limit(x, ceiling_db=-1.0, lookahead_ms=5, release_ms=80):
    """look-ahead peak limiter (stereo-linked). Gain is computed per 1 ms block: the minimum required gain over
    [block-1, block+lookahead] (so it is already down when a peak arrives), released exponentially, smoothed into the
    attack, and interpolated per sample — never above the gain a block needs. Leaves audio under the ceiling untouched."""
    thr = 10 ** (ceiling_db / 20)
    peak = np.abs(x).max(axis=1)
    if peak.max() <= thr:
        return x
    B = SR // 1000
    n = len(x)
    nb = (n + B - 1) // B
    pk = np.zeros(nb * B)
    pk[:n] = peak
    blk = pk.reshape(nb, B).max(1)
    req = np.minimum(1.0, thr / np.maximum(blk, 1e-12))
    L = max(1, int(lookahead_ms))
    padded = np.concatenate([np.ones(1), req, np.ones(L)])
    req_la = np.lib.stride_tricks.sliding_window_view(padded, L + 2).min(axis=1)[:nb]
    rel = 1 - math.exp(-1.0 / max(1.0, release_ms))
    g = np.empty(nb)
    g[0] = req_la[0]
    for i in range(1, nb):
        g[i] = min(req_la[i], g[i - 1] + (1 - g[i - 1]) * rel)
    att = 1 - math.exp(-1.0 / max(1.0, lookahead_ms / 2))
    for i in range(nb - 2, -1, -1):  # attack: start leaning in before the drop
        g[i] = min(g[i], g[i + 1] + (1 - g[i + 1]) * att)
    gs = np.interp(np.arange(n), np.arange(nb) * B, g)
    y = x * gs[:, None]
    return np.clip(y, -thr, thr)


def _place(out, t, s):
    i = int(round(max(0, t) * SR))
    if i >= len(out):
        return
    j = min(len(out), i + len(s))
    out[i:j] += s[:j - i]


def _load_bed(spec, scene_path):
    src = spec['src'] if os.path.isabs(spec['src']) else os.path.join(os.path.dirname(scene_path), spec['src'])
    return load_wav(src)


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
        style = json.load(open(a.style)) if a.style else {}
        bank = SoundBank(style, a.style or os.path.join(HERE, '..', 'styles', 'style-1', 'style.json'))
        names = list(SOUNDS) + sorted(set(bank.specs) | set(BUILTIN_RECIPES))
        for k in names:
            x = bank.get(k)
            write(os.path.join(a.demo, k + '.wav'), x / (np.max(np.abs(x)) + 1e-9) * 0.8)
        print('wrote', len(names), 'sounds to', a.demo)
        return
    scene = json.load(open(a.scene))
    style = json.load(open(a.style))
    meta = {}
    if a.plate and os.path.exists(os.path.join(a.plate, 'meta.json')):
        meta = json.load(open(os.path.join(a.plate, 'meta.json')))
    bank = SoundBank(style, a.style)
    voice = load_wav(os.path.join(a.plate, 'audio.wav'))
    out = voice * db(scene.get('voiceGainDb', 0))
    events = collect_events(scene, style, bank, meta, os.path.dirname(os.path.abspath(a.scene)))
    for t, name, g in events:
        s = (bank.get(name) if isinstance(name, str) else name) * db(g)
        _place(out, t, s)
    # non-ducked, non-tiled beds (e.g. pre-rendered SFX tracks)
    beds = scene.get('sfxBed')
    for b in ([beds] if isinstance(beds, dict) else beds or []):
        if b and b.get('src'):
            _place(out, b.get('t', 0) + b.get('offsetMs', 0) / 1000, _load_bed(b, a.scene) * db(b.get('gainDb', 0)))
    m = scene.get('music')
    if m and m.get('src'):
        bed = _load_bed(m, a.scene)
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
    ceiling = scene.get('masterLimiterDb', -1.0)
    peak_in = float(np.max(np.abs(out)) + 1e-12)
    if ceiling is None or ceiling is False:
        # legacy master: global tanh soft clip when the mix would pass -0.2 dBFS
        if peak_in > 0.98:
            out = np.tanh(out / peak_in * 1.2) * 0.97
    else:
        out = limit(out, float(ceiling))
    write(a.out, out)
    print(f'[audio] {len(events)} sfx events mixed, peak {20 * math.log10(peak_in):+.1f} dBFS in → '
          f'{20 * math.log10(float(np.max(np.abs(out))) + 1e-12):+.1f} dBFS out → {a.out}')


def write(path, x):
    p = subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-i', '-', path],
                       input=np.ascontiguousarray(x, dtype=np.float32).tobytes())
    p.check_returncode()


if __name__ == '__main__':
    main()

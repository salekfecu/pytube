#!/usr/bin/env python3
"""Procedural sub-bass bed for Crimson Halo Glass demos (STYLE.md section 10 / style.json "music").

Reference: a sustained sub-bass pad, fundamental 41 Hz (E1) with harmonics at 82/123 Hz, no drums, no
ducking, only 2-4 dB under the voice band; phrase changes about every 5.5 s (a ~100 Hz note just before
the cut into the Difference beat, a 90 -> 70 Hz move around the cut out of the brand shot).
Deterministic: the same file on every run.

    python3 make_bed.py [out.wav] [seconds] [phrase1_s] [phrase2_s] [--sfx typing@2.34] [--music-gain-db -2.2]

The bed is written at -20 dBFS RMS in the band below 70 Hz. The scene sets "music.gainDb" so that band
sits about 3 dB under the voice band (100 Hz-4 kHz) of the plate, with "duckDb": 0.

--sfx bakes the reference's high-frequency SFX (style.json soundSpecs) into the bed. Since engine v2, audio.py
plays the soundSpecs itself (rules with "idealSound"), so only the typing rattle still needs baking: the engine
normalises spec sounds to -3 dBFS peak, and its sparse >11 kHz train (crest ~27 dB) stays 4-5 dB under the
reference energy, while this soft-limited version (crest ~18 dB) matches it.
  typing@T  typingRattleHF train of tiny >11 kHz transients every 22-46 ms over 480 ms, HF band -25 dBFS
  click@T   clickHF        single ~25 ms >11 kHz click, HF band -32.5 dBFS (kept for older scenes; the engine's
                           clickHF at the style rule gain -20 dB reaches the same level)
Levels are pre-compensated for the scene's music.gainDb (--music-gain-db). The scene then opts the baked cues out
of autoSfx ("sfx": false on the first typewriter-sub).
"""
import subprocess
import sys

import numpy as np

SR = 48000


def smooth_step(t, a, b):
    x = np.clip((t - a) / max(1e-6, b - a), 0, 1)
    return x * x * (3 - 2 * x)


def hf_noise(n, seed, lo=11000.0, roll=1200.0):
    """White noise band-limited to > lo Hz (raised-cosine roll-in over `roll` Hz), unit RMS."""
    rng = np.random.default_rng(seed)
    X = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    w = np.clip((f - (lo - roll)) / roll, 0, 1)
    x = np.fft.irfft(X * (0.5 - 0.5 * np.cos(np.pi * w)), n)
    return x / (np.sqrt(np.mean(x ** 2)) + 1e-12)


def click_hf(seed=11):
    n = int(0.025 * SR)
    t = np.arange(n) / SR
    env = np.minimum(1, t / 0.0008) * np.exp(-t / 0.006)
    return hf_noise(n, seed) * env


def typing_hf(seed=12, dur=0.48):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    x = np.zeros(n)
    t0 = 0.0
    k = 0
    while t0 < dur - 0.006:
        m = int(0.006 * SR)
        tt = np.arange(m) / SR
        env = np.minimum(1, tt / 0.0004) * np.exp(-tt / 0.0012)
        burst = hf_noise(m * 4, seed * 100 + k)[:m] * env * rng.uniform(0.55, 1.0)
        i = int(t0 * SR)
        x[i:i + m] += burst[:max(0, min(m, n - i))]
        t0 += rng.uniform(0.022, 0.046)
        k += 1
    # the rattle swells in and tails off a touch (typed line: first glyphs land hardest)
    tt = np.arange(n) / SR
    return x * (0.75 + 0.25 * np.sin(np.pi * np.clip(tt / dur, 0, 1)))


# event HF RMS targets, calibrated on ref3_third per-STFT-frame HF (>11 kHz) levels: typing 3.5-4.2 s p50/p90/p99
# -24.5/-20.6/-18.0 dB (the -25 spec as event RMS lands at -23.3/-20.2/-18.8); arch click p99 -35.5 dB (the
# -32.5 spec read 6 dB hot, so -38 here); typing -23 because the -6 dBFS soft limit takes ~2 dB off its peaks
SFX = {'click': (click_hf, -38.0), 'typing': (typing_hf, -23.0)}


def bake_sfx(x, spec, music_gain_db):
    """spec 'click@0.96,typing@2.34' -> adds each sound so its HF band RMS over the event is the soundSpecs level."""
    for item in filter(None, spec.split(',')):
        name, at = item.split('@')
        fn, level = SFX[name]
        s = fn()
        rms = np.sqrt(np.mean(s ** 2)) + 1e-12
        s = s / rms * 10 ** ((level - music_gain_db) / 20)
        s = np.tanh(s / 0.5) * 0.5  # soft-limit the rare transient peaks to -6 dBFS (keeps the mix peak = voice)
        i = int(float(at) * SR)
        j = min(len(x), i + len(s))
        x[i:j] += s[:j - i]
        print(f'  baked {name} at {float(at):.2f} s, HF RMS {level:.1f} dBFS after the scene gain')
    return x


def main():
    args = sys.argv[1:]
    sfx = ''
    gain = -2.2
    if '--sfx' in args:
        k = args.index('--sfx'); sfx = args[k + 1]; del args[k:k + 2]
    if '--music-gain-db' in args:
        k = args.index('--music-gain-db'); gain = float(args[k + 1]); del args[k:k + 2]
    out = args[0] if len(args) > 0 else 'bed_crimson_41hz.wav'
    secs = float(args[1]) if len(args) > 1 else 10.0
    p1 = float(args[2]) if len(args) > 2 else 4.40   # just before the cut into the Difference beat
    p2 = float(args[3]) if len(args) > 3 else 6.55   # around the cut into the brand shot
    n = int(secs * SR)
    t = np.arange(n) / SR
    # pitch track (Hz): E1 pad -> A1 (55 Hz, its 2nd harmonic ~110 Hz is the "~100 Hz note") -> E1 with a
    # 90 -> 70 Hz upper voice gliding down after the second phrase change
    f0 = 41.2 + (55.0 - 41.2) * (smooth_step(t, p1 - 0.12, p1 + 0.08) - smooth_step(t, p2 - 0.12, p2 + 0.08))
    ph = 2 * np.pi * np.cumsum(f0) / SR
    pad = np.sin(ph) + 0.42 * np.sin(2 * ph + 0.3) + 0.18 * np.sin(3 * ph + 0.7)
    # slow breathing (no rhythmic pulse, never beat-like): 0.11 Hz amplitude drift of +-1.2 dB
    pad *= 1 + 0.14 * np.sin(2 * np.pi * 0.11 * t + 0.4)
    # upper voice after phrase 2: 90 -> 70 Hz glide over 1.1 s, fades in/out softly
    fu = 90 - 20 * smooth_step(t, p2, p2 + 1.1)
    up = np.sin(2 * np.pi * np.cumsum(fu) / SR) * 0.35 * smooth_step(t, p2 - 0.05, p2 + 0.25) * (1 - smooth_step(t, p2 + 1.6, p2 + 2.4))
    x = pad + up
    # soft attack / release so the bed never clicks on the first or last frame
    x *= smooth_step(t, 0, 0.06) * (1 - smooth_step(t, secs - 0.15, secs))
    # normalise the band below 70 Hz to -20 dBFS RMS
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    sub = np.fft.irfft(np.where(f < 70, X, 0), n)
    x *= 10 ** (-20 / 20) / (np.sqrt(np.mean(sub ** 2)) + 1e-12)
    if sfx:
        x = bake_sfx(x, sfx, gain)
    st = np.stack([x, x], 1).astype(np.float32)
    p = subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-i', '-', out],
                       input=np.ascontiguousarray(st).tobytes())
    p.check_returncode()
    print(f'wrote {out}: {secs:.2f} s, sub<70 Hz -20 dBFS RMS, peak {20 * np.log10(np.max(np.abs(x))):.1f} dBFS')


if __name__ == '__main__':
    main()

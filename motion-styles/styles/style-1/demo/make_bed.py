#!/usr/bin/env python3
"""Procedural music bed for Ember Glass demos (style.json "music": 112.3 BPM light stepping bass/pluck
ostinato, no hits, drops or swells, never ducked). Deterministic: same file every run.

    python3 make_bed.py [out.wav] [seconds]
The scene references it with  "music": {"src": "bed_ember_112bpm.wav", "gainDb": G, "duckDb": 0}
where G puts the bed ~17 dB under the voice (see STYLE.md §10).
"""
import subprocess
import sys

import numpy as np

SR = 48000
BPM = 112.3
BEAT = 60.0 / BPM


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def pluck(f, dur, seed, bright=0.5):
    """Karplus-Strong pluck."""
    n = int(dur * SR)
    p = max(2, int(SR / f))
    rng = np.random.default_rng(seed)
    buf = rng.uniform(-1, 1, p)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * (0.993 + 0.004 * bright)
    return out * np.exp(-np.linspace(0, 3.2, n))


def bass(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = 2 * np.pi * f * t
    x = np.sin(ph) + 0.28 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    env = np.minimum(1, t / 0.008) * np.exp(-t * 5.5)
    return x * env


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else 'bed_ember_112bpm.wav'
    secs = float(sys.argv[2]) if len(sys.argv) > 2 else 12.9
    n = int(secs * SR) + SR
    mix = np.zeros((n, 2))
    # A minor colour, warm and light: Am - F - C - G (one bar each), stepping 8th-note bass
    chords = [(45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62])]
    steps = [0, 0, 7, 0, 12, 7, 3, 7]  # stepping bass pattern (semitones above root)
    eighth = BEAT / 2
    k = 0
    t = 0.0
    bar = 0
    while t < secs:
        root, triad = chords[bar % 4]
        for s in range(8):
            ts = t + s * eighth
            if ts >= secs:
                break
            i = int(ts * SR)
            b = bass(midi(root - 12 + steps[s] if steps[s] != 12 else root), eighth * 0.95) * (0.55 if s % 2 else 0.7)
            j = min(n, i + len(b))
            mix[i:j, 0] += b[: j - i]
            mix[i:j, 1] += b[: j - i]
            # pluck on the off-beats, alternating chord tones, panned slightly
            if s % 2 == 1:
                note = triad[(s // 2 + bar) % 3] + 12
                pl = pluck(midi(note), BEAT * 1.6, seed=k, bright=0.3) * 0.32
                k += 1
                j = min(n, i + len(pl))
                pan = 0.35 if (s // 2) % 2 else -0.35
                mix[i:j, 0] += pl[: j - i] * (1 - pan) * 0.8
                mix[i:j, 1] += pl[: j - i] * (1 + pan) * 0.8
        t += 8 * eighth
        bar += 1
    mix = mix[: int(secs * SR)]
    # gentle low-pass (one-pole) to keep it soft, then normalise to -20 dBFS RMS
    a = np.exp(-2 * np.pi * 3200 / SR)
    for c in range(2):
        y = np.zeros(len(mix))
        acc = 0.0
        col = mix[:, c]
        for i in range(len(col)):
            acc = (1 - a) * col[i] + a * acc
            y[i] = acc
        mix[:, c] = y
    rms = np.sqrt(np.mean(mix ** 2))
    mix *= 10 ** (-20 / 20) / (rms + 1e-12)
    fade = int(0.02 * SR)
    mix[:fade] *= np.linspace(0, 1, fade)[:, None]
    p = subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-i', '-', out],
                       input=np.ascontiguousarray(mix, dtype=np.float32).tobytes())
    p.check_returncode()
    print(f'wrote {out}: {secs:.1f} s, rms -20 dBFS, peak {20*np.log10(np.max(np.abs(mix))):.1f} dBFS')


if __name__ == '__main__':
    main()

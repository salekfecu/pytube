#!/usr/bin/env python3
"""Original procedural music bed for the IPSI reel (no samples, no licences needed).

100 BPM corporate-tech groove in A minor / C major, arranged to the edit:
  0.0-2.4   hook (blurred image): pad swell + filtered riser + ticking hats  -> tension
  2.4       reveal: soft impact, full groove (kick, clap, hats, pulsing bass, pluck arpeggio)
  29.0-33.9 diplomas / question: drums drop out, pad + arpeggio + reverse swell (lift)
  33.9-36.0 end card: soft impact, resolving C major chord, ring-out + fade
Writes a 48 kHz stereo WAV. Usage: python3 make_music.py OUT.wav [--dur 36.0]
"""
import argparse
import subprocess

import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt

SR = 48000
BPM = 100
BEAT = 60 / BPM          # 0.6 s
BAR = 4 * BEAT           # 2.4 s
REVEAL = 2.4
OUTRO = 29.0
END = 33.9


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def lowpass(x, fc, order=2):
    return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x)


def highpass(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def saw(f, t, maxf=3200):
    out = np.zeros_like(t)
    k = 1
    while k * f < maxf:
        out += np.sin(2 * np.pi * k * f * t) / k
        k += 1
    return out * (2 / np.pi)


def env_ar(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    e[:na] = np.linspace(0, 1, na) ** 1.5
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr) ** 1.2
    return e


def declick(x, a=0.002, r=0.02):
    """2 ms fade-in / 20 ms fade-out so no one-shot starts or stops on a step (clicks)."""
    x = x.copy()
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    ramp_a = np.linspace(0, 1, na) ** 2
    ramp_r = np.linspace(1, 0, nr) ** 2
    if x.ndim == 1:
        x[:na] *= ramp_a[:len(x[:na])]
        x[-nr:] *= ramp_r[-len(x[-nr:]):]
    else:
        x[:na] *= ramp_a[:len(x[:na]), None]
        x[-nr:] *= ramp_r[-len(x[-nr:]):, None]
    return x


def place(buf, x, t0, gain=1.0):
    x = declick(x)
    i = int(round(t0 * SR))
    if i >= len(buf):
        return
    j = min(len(buf), i + len(x))
    if x.ndim == 1:
        buf[i:j] += (x[:j - i] * gain)[:, None]
    else:
        buf[i:j] += x[:j - i] * gain


# chord loop (one chord per bar): Am - F - C - G ; end on C
CHORDS = [
    ([57, 60, 64, 69], 45),   # Am  (A3 C4 E4 A4), bass A2
    ([53, 57, 60, 65], 41),   # F
    ([55, 60, 64, 67], 48),   # C   (G3 C4 E4 G4), bass C3
    ([55, 59, 62, 67], 43),   # G
]
FINAL = ([55, 60, 64, 72], 36)  # C major, wide


def chord_at(t):
    if t >= END:
        return FINAL
    return CHORDS[int(t // BAR) % 4]


def build(dur):
    n = int(dur * SR)
    mix = {k: np.zeros((n, 2)) for k in ('pad', 'bass', 'arp', 'drums', 'fx')}
    rng = np.random.default_rng(7)

    # ---------------- pad: detuned saws per chord, crossfaded per bar, filter opens at the reveal
    bars = int(np.ceil(dur / BAR)) + 1
    for b in range(bars):
        t0 = b * BAR
        if t0 >= dur:
            break
        notes, _ = chord_at(t0 + 0.01)
        length = (dur - t0) if t0 >= END - 0.01 else BAR + 0.5
        if END - BAR < t0 < END:      # the last loop bar hands over to the final chord exactly at END
            length = END - t0 + 0.5
        tt = np.arange(int(length * SR)) / SR
        voice = np.zeros((len(tt), 2))
        for k, nn in enumerate(notes):
            f = midi(nn)
            for d, pan in ((-0.07, -0.7), (0.0, 0.0), (0.07, 0.7)):
                s = saw(f * 2 ** (d / 12), tt + rng.uniform(0, 0.01))
                voice[:, 0] += s * (1 - pan) * 0.5
                voice[:, 1] += s * (1 + pan) * 0.5
        cutoff = 900 if t0 < REVEAL else (2200 if t0 < OUTRO else 1600)
        voice = np.stack([lowpass(voice[:, c], cutoff) for c in range(2)], 1)
        e = env_ar(len(tt), 0.25 if t0 >= REVEAL else 1.8, 0.5 if t0 < END else min(2.0, length * 0.8))
        place(mix['pad'], voice * e[:, None] * 0.05, t0 - (0.25 if b else 0))

    # ---------------- bass: root eighths with sidechain pump (from the reveal to the outro, and a held note on the end)
    eighth = BEAT / 2
    t = REVEAL
    while t < OUTRO - 0.01:
        _, root = chord_at(t + 0.001)
        f = midi(root)
        tt = np.arange(int(eighth * SR)) / SR
        x = (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(4 * np.pi * f * tt)) * np.minimum(1, tt / 0.01)
        beat_pos = ((t - REVEAL) % BEAT) / BEAT
        pump = 0.45 if beat_pos < 0.25 else 1.0
        x *= np.exp(-tt * 3.0) * pump
        place(mix['bass'], np.stack([x, x], 1) * 0.30, t)
        t += eighth
    tt = np.arange(int((dur - END) * SR)) / SR
    x = np.sin(2 * np.pi * midi(36) * tt) * env_ar(len(tt), 0.02, 1.6)
    place(mix['bass'], np.stack([x, x], 1) * 0.32, END)

    # ---------------- pluck arpeggio (8ths), ping-pong delay later
    pattern = [0, 2, 1, 3, 2, 1, 3, 2]
    t, k = REVEAL, 0
    while t < END - 0.01:
        notes, _ = chord_at(t + 0.001)
        nn = notes[pattern[k % 8]] + 12
        f = midi(nn)
        tt = np.arange(int(0.45 * SR)) / SR
        x = (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt) + 0.08 * np.sin(6 * np.pi * f * tt))
        x *= np.exp(-tt * 9) * np.minimum(1, tt / 0.004)
        pan = -0.35 if k % 2 else 0.35
        g = 0.09 if t < OUTRO else 0.075
        place(mix['arp'], np.stack([x * (1 - pan), x * (1 + pan)], 1) * g, t)
        t += eighth
        k += 1
    # final chord bell
    for nn in FINAL[0]:
        f = midi(nn + 12)
        tt = np.arange(int(2.0 * SR)) / SR
        x = (np.sin(2 * np.pi * f * tt) + 0.2 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt * 2.2) * np.minimum(1, tt / 0.004)
        place(mix['arp'], np.stack([x, x], 1) * 0.05, END)

    # ---------------- drums
    def kick():
        tt = np.arange(int(0.35 * SR)) / SR
        f = 48 + 90 * np.exp(-tt * 28)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)
        x[:int(0.003 * SR)] += rng.standard_normal(int(0.003 * SR)) * 0.3
        return np.tanh(x * 1.4)

    def clap():
        tt = np.arange(int(0.18 * SR)) / SR
        x = bandpass(rng.standard_normal(len(tt)), 900, 3200) * np.exp(-tt * 22)
        return x

    def hat(open_=False):
        L = 0.12 if open_ else 0.045
        tt = np.arange(int(L * SR)) / SR
        return lowpass(highpass(rng.standard_normal(len(tt)), 6500), 11000) * np.exp(-tt * (32 if open_ else 80))

    # hook: ticking closed hats only (tension)
    t = 0.0
    while t < REVEAL - 0.01:
        place(mix['drums'], np.stack([hat()] * 2, 1) * 0.05, t)
        t += eighth
    t, b = REVEAL, 0
    while t < OUTRO - 0.01:
        if b % 2 == 0:
            place(mix['drums'], np.stack([kick()] * 2, 1) * 0.55, t)
        else:
            c = clap()
            place(mix['drums'], np.stack([c * 0.8, c], 1) * 0.22, t)
        place(mix['drums'], np.stack([hat()] * 2, 1) * 0.03, t)
        place(mix['drums'], np.stack([hat(True) * 0.7, hat(True)], 1) * 0.028, t + eighth)
        t += BEAT
        b += 1
    # outro: soft hats only
    t = OUTRO
    while t < END - 0.01:
        place(mix['drums'], np.stack([hat()] * 2, 1) * 0.03, t + eighth)
        t += BEAT

    # ---------------- fx: riser into the reveal, impacts, reverse swell into the end card
    def riser(L, lo, hi):
        tt = np.arange(int(L * SR)) / SR
        x = rng.standard_normal(len(tt))
        out = np.zeros_like(x)
        steps = 24
        for s in range(steps):
            a, b = int(s * len(x) / steps), int((s + 1) * len(x) / steps)
            fc = lo * (hi / lo) ** (s / steps)
            out[a:b] = bandpass(x, fc * 0.7, min(fc * 1.4, SR / 2 - 100))[a:b]
        return out * (tt / L) ** 2.2

    def impact():
        tt = np.arange(int(1.2 * SR)) / SR
        sub = np.sin(2 * np.pi * np.cumsum(60 * np.exp(-tt * 3) + 30) / SR) * np.exp(-tt * 3.5)
        nz = lowpass(rng.standard_normal(len(tt)), 2500) * np.exp(-tt * 12) * 0.5
        return np.tanh((sub + nz) * 1.3)

    r = riser(REVEAL, 300, 7000)
    place(mix['fx'], np.stack([r * 0.8, r], 1) * 0.08, 0.0)
    place(mix['fx'], np.stack([impact()] * 2, 1) * 0.35, REVEAL)
    r2 = riser(END - 31.4, 400, 6000)
    place(mix['fx'], np.stack([r2, r2 * 0.8], 1) * 0.06, 31.4)
    place(mix['fx'], np.stack([impact()] * 2, 1) * 0.28, END)

    # ---------------- reverb (synthetic stereo IR) on pad / arp / clap
    irL = int(1.8 * SR)
    ir_t = np.arange(irL) / SR
    ir = np.stack([rng.standard_normal(irL), rng.standard_normal(irL)], 1) * np.exp(-ir_t * 3.2)[:, None]
    ir[:, 0] = lowpass(ir[:, 0], 6000)
    ir[:, 1] = lowpass(ir[:, 1], 6000)
    ir /= np.sqrt((ir ** 2).sum(0))
    wet_src = mix['pad'] * 0.6 + mix['arp'] + mix['drums'] * 0.15
    wet = np.stack([fftconvolve(wet_src[:, c], ir[:, c])[:n] for c in range(2)], 1)
    # ping-pong delay on the arpeggio (dotted eighth)
    d = int(0.75 * BEAT * SR)
    arp = mix['arp'].copy()
    for rep in range(1, 4):
        g = 0.32 ** rep
        sh = np.zeros_like(arp)
        sh[d * rep:] = mix['arp'][:-d * rep] * g
        if rep % 2:
            sh = sh[:, ::-1]
        arp += sh
    out = mix['pad'] + mix['bass'] + arp + mix['drums'] + mix['fx'] + wet * 0.22
    # gentle glue: soft clip, then fade the tail
    out = np.tanh(out * 1.6) / 1.6
    fade = np.ones(n)
    nf = int(1.2 * SR)
    fade[-nf:] = np.linspace(1, 0, nf) ** 1.5
    out *= fade[:, None]
    out /= np.max(np.abs(out)) + 1e-9
    return out * 0.89   # ≈ -1 dBFS peak


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('--dur', type=float, default=36.0)
    a = ap.parse_args()
    x = build(a.dur)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-i', '-', a.out],
                   input=np.ascontiguousarray(x, dtype=np.float32).tobytes(), check=True)
    print('wrote', a.out, f'{a.dur:.1f} s')


if __name__ == '__main__':
    main()

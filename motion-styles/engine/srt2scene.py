#!/usr/bin/env python3
"""Draft a scene.json from captions, using the style's "director" rules.

Timing sources (pick one):
  --srt captions.srt        word/phrase timing exported from CapCut / Premiere / any STT tool (best)
  --script script.txt       one caption per line; timed automatically onto the voiced phrases found by
                            prepare.py (speech.json), proportionally to text length

The draft is a starting point: keywords are guessed (longest / marked words), presets are taken from
style.json "director" (falls back to the first text presets). Mark emphasis in the text with *stars*:
"الكيمياء من *أصعب* المواد" → the starred word gets the style's keyword treatment.

  python3 srt2scene.py --style ../styles/style-1/style.json --plate PLATE --srt in.srt --out scene.json
"""
import argparse
import json
import os
import re


def parse_srt(path):
    txt = open(path, encoding='utf-8-sig').read()
    out = []
    for block in re.split(r'\n\s*\n', txt.strip()):
        lines = [l for l in block.strip().splitlines() if l.strip()]
        if len(lines) < 2:
            continue
        m = re.search(r'(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)', lines[1] if '-->' in lines[1] else lines[0])
        if not m:
            continue
        g = list(map(int, m.groups()))
        t0 = g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000
        t1 = g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000
        text = ' '.join(lines[2:] if '-->' in lines[1] else lines[1:])
        out.append({'t': round(t0, 3), 'end': round(t1, 3), 'text': text.strip()})
    return out


def time_script(lines, speech):
    segs = speech['segments'] or [[0, 3]]
    total_speech = sum(b - a for a, b in segs)
    total_chars = sum(len(l) for l in lines) or 1
    # flatten voiced time into a single axis, place captions proportionally, map back to real time
    def to_real(x):
        acc = 0
        for a, b in segs:
            if acc + (b - a) >= x:
                return a + (x - acc)
            acc += b - a
        return segs[-1][1]
    out, pos = [], 0.0
    for l in lines:
        d = total_speech * len(l) / total_chars
        out.append({'t': round(to_real(pos), 3), 'end': round(to_real(pos + d), 3), 'text': l})
        pos += d
    return out


def split_long(caps, max_words):
    out = []
    for c in caps:
        words = c['text'].split()
        if len(words) <= max_words:
            out.append(c)
            continue
        chunks = [words[i:i + max_words] for i in range(0, len(words), max_words)]
        dur = c['end'] - c['t']
        n = sum(len(' '.join(ch)) for ch in chunks)
        t = c['t']
        for ch in chunks:
            d = dur * len(' '.join(ch)) / n
            out.append({'t': round(t, 3), 'end': round(t + d, 3), 'text': ' '.join(ch)})
            t += d
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--style', required=True)
    ap.add_argument('--plate', required=True)
    ap.add_argument('--srt')
    ap.add_argument('--script')
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    style = json.load(open(a.style))
    d = style.get('director', {})
    presets = [p['id'] for p in style.get('textPresets', [])]
    caption_preset = d.get('captionPreset', presets[0] if presets else None)
    keyword_preset = d.get('keywordPreset', presets[1] if len(presets) > 1 else caption_preset)
    max_words = d.get('maxWordsPerCaption', 4)
    punch_every = d.get('punchInEveryNCaptions', 3)
    punch_preset = d.get('punchInPreset', (style.get('cameraMoves') or [{}])[0].get('id'))

    if a.srt:
        caps = parse_srt(a.srt)
    else:
        speech = json.load(open(os.path.join(a.plate, 'speech.json')))
        lines = [l.strip() for l in open(a.script, encoding='utf-8') if l.strip()]
        caps = time_script(lines, speech)
    caps = split_long(caps, max_words)

    cues = []
    for i, c in enumerate(caps):
        text = c['text']
        stars = re.findall(r'\*([^*]+)\*', text)
        clean = text.replace('*', '')
        dir_ = 'rtl' if re.search(r'[؀-ۿ]', clean) else 'ltr'
        if stars:
            # keyword shown big with the rest as the small line
            kw = stars[0]
            rest = re.sub(r'\s+', ' ', clean.replace(kw, '')).strip()
            cues.append({'t': c['t'], 'end': c['end'], 'type': 'text', 'preset': keyword_preset, 'text': kw, 'dir': dir_})
            if rest:
                cues.append({'t': round(c['t'] + 0.12, 3), 'end': c['end'], 'type': 'text', 'preset': d.get('subPreset', caption_preset), 'text': rest, 'dir': dir_})
        else:
            cues.append({'t': c['t'], 'end': c['end'], 'type': 'text', 'preset': caption_preset, 'text': clean, 'dir': dir_})
        if punch_preset and punch_every and i % punch_every == punch_every - 1:
            cues.append({'t': c['t'], 'type': 'camera', 'preset': punch_preset})
            cues.append({'t': c['end'], 'type': 'camera', 'scaleTo': 1.0, 'durationMs': 0})
    scene = {'style': style.get('id'), 'autoSfx': True, 'cues': cues,
             '_note': 'draft generated by srt2scene.py — refine keywords, presets, components and camera moves by hand'}
    json.dump(scene, open(a.out, 'w'), ensure_ascii=False, indent=1)
    print(f'{len(caps)} captions → {len(cues)} cues → {a.out}')


if __name__ == '__main__':
    main()

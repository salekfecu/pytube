#!/usr/bin/env python3
"""Prepare a talking-head clip for compositing.

Produces a "plate" directory:
  frames/NNNNN.jpg   source frames, cover-fit to the canvas (default 1080x1920 @ 30 fps)
  matte/NNNNN.png    person alpha matte (RGBA, white + alpha) at half resolution
  faces.json         smoothed face box per frame (normalised 0..1), used to centre punch-ins
  audio.wav          48 kHz stereo source audio
  speech.json        voice-activity segments + loudness envelope (fallback caption timing)
  meta.json          fps, frame count, size, duration

Usage:
  python3 prepare.py INPUT.mp4 PLATE_DIR [--fps 30] [--size 1080x1920] [--no-matte] [--start S --end E] [--pre-graded]

  --pre-graded   the footage already carries the look (e.g. a reference's own shot): meta.json "preGraded": true
                 makes the compositor skip the style grade and overlays unless the scene forces them
"""
import argparse
import json
import os
import subprocess
import sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = os.path.join(HERE, 'models')


def run(cmd):
    subprocess.run(cmd, check=True)


def extract_frames(src, out, fps, w, h, start, end):
    os.makedirs(os.path.join(out, 'frames'), exist_ok=True)
    trim = []
    if start is not None:
        trim += ['-ss', str(start)]
    if end is not None:
        trim += ['-to', str(end)]
    vf = f'fps={fps},scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},setsar=1'
    run(['ffmpeg', '-loglevel', 'error', '-y', *trim, '-i', src, '-vf', vf, '-q:v', '2',
         '-start_number', '0', os.path.join(out, 'frames', '%05d.jpg')])
    run(['ffmpeg', '-loglevel', 'error', '-y', *trim, '-i', src, '-vn', '-ac', '2', '-ar', '48000',
         os.path.join(out, 'audio.wav')])


def guided_filter(guide, src, r=8, eps=1e-3):
    """Edge-aware upsampling of the matte using the frame as guide (He et al.)."""
    mean = lambda x: cv2.boxFilter(x, cv2.CV_32F, (r, r))
    mI, mp_ = mean(guide), mean(src)
    cov = mean(guide * src) - mI * mp_
    var = mean(guide * guide) - mI * mI
    a = cov / (var + eps)
    b = mp_ - a * mI
    return mean(a) * guide + mean(b)


def make_mattes(out, n):
    import mediapipe as mp
    from mediapipe.tasks import python as mpt
    from mediapipe.tasks.python import vision

    seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
        base_options=mpt.BaseOptions(model_asset_path=os.path.join(MODELS, 'selfie_multiclass_256x256.tflite')),
        running_mode=vision.RunningMode.VIDEO, output_confidence_masks=True))
    face = vision.FaceDetector.create_from_options(vision.FaceDetectorOptions(
        base_options=mpt.BaseOptions(model_asset_path=os.path.join(MODELS, 'blaze_face_short_range.tflite')),
        running_mode=vision.RunningMode.VIDEO, min_detection_confidence=0.4))
    pose = vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(
        base_options=mpt.BaseOptions(model_asset_path=os.path.join(MODELS, 'pose_landmarker_full.task')),
        running_mode=vision.RunningMode.VIDEO))

    os.makedirs(os.path.join(out, 'matte'), exist_ok=True)
    prev = None
    prev_gray = None
    cuts = set()
    faces = []
    meta = json.load(open(os.path.join(out, 'meta.json')))
    fps = meta['fps']
    for i in range(n):
        img = cv2.imread(os.path.join(out, 'frames', f'{i:05d}.jpg'))
        H, W = img.shape[:2]
        hw, hh = W // 2, H // 2
        small = cv2.resize(img, (hw, hh), interpolation=cv2.INTER_AREA)
        rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
        mimg = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        ts = int(i * 1000 / fps)
        res = seg.segment_for_video(mimg, ts)
        a = 1.0 - res.confidence_masks[0].numpy_view().astype(np.float32)
        a = cv2.resize(a, (hw, hh), interpolation=cv2.INTER_LINEAR)
        g = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
        a = np.clip(guided_filter(g, a, r=6, eps=2e-3), 0, 1)
        is_cut = prev_gray is not None and float(np.abs(g - prev_gray).mean()) > 0.09
        if is_cut:
            cuts.add(i)
        prev_gray = g
        # temporal smoothing against flicker (motion-adaptive), reset on hard cuts
        if prev is not None and not is_cut:
            k = np.clip(np.abs(a - prev) * 4, 0.35, 1.0)
            a = prev + (a - prev) * k
        prev = a
        a8 = (np.clip((a - 0.08) / 0.84, 0, 1) * 255).astype(np.uint8)
        rgba = np.dstack([np.full_like(a8, 255)] * 3 + [a8])
        cv2.imwrite(os.path.join(out, 'matte', f'{i:05d}.png'), rgba, [cv2.IMWRITE_PNG_COMPRESSION, 3])

        fb = None
        fr = face.detect_for_video(mimg, ts)
        if fr.detections:
            d = max(fr.detections, key=lambda d: d.bounding_box.width * d.bounding_box.height)
            bb = d.bounding_box
            fb = [bb.origin_x / hw, bb.origin_y / hh, bb.width / hw, bb.height / hh]
        if fb is None:
            pr = pose.detect_for_video(mimg, ts)
            if pr.pose_landmarks:
                lm = pr.pose_landmarks[0]
                pts = np.array([[lm[j].x, lm[j].y] for j in range(0, 11)])
                x0, y0 = pts.min(0)
                x1, y1 = pts.max(0)
                pad = (x1 - x0) * 0.35
                fb = [float(x0 - pad), float(y0 - pad * 1.4), float(x1 - x0 + 2 * pad), float(y1 - y0 + 2.4 * pad)]
        faces.append(fb)
        if i % 60 == 0:
            print(f'  matte {i}/{n}', flush=True)

    # fill gaps + smooth face boxes (centre of punch-ins must not jitter)
    last = next((f for f in faces if f), [0.4, 0.2, 0.2, 0.12])
    filled = []
    for f in faces:
        last = f or last
        filled.append(last)
    arr = np.array(filled, dtype=np.float32)
    k = max(3, int(fps * 0.5) | 1)
    # smooth within shots only, so the box snaps on hard cuts
    bounds = [0] + sorted(cuts) + [len(arr)]
    parts = []
    for s0, s1 in zip(bounds[:-1], bounds[1:]):
        seg = arr[s0:s1]
        pad = np.pad(seg, ((k // 2, k // 2), (0, 0)), mode='edge')
        parts.append(np.stack([np.convolve(pad[:, c], np.ones(k) / k, mode='valid') for c in range(4)], 1))
    sm = np.concatenate(parts, 0)
    meta['cuts'] = sorted(int(c) for c in cuts)
    json.dump(meta, open(os.path.join(out, 'meta.json'), 'w'), indent=1)
    json.dump([{'x': round(float(b[0]), 4), 'y': round(float(b[1]), 4), 'w': round(float(b[2]), 4),
                'h': round(float(b[3]), 4)} for b in sm], open(os.path.join(out, 'faces.json'), 'w'))


def speech_segments(out):
    import librosa
    y, sr = librosa.load(os.path.join(out, 'audio.wav'), sr=16000, mono=True)
    hop = 160  # 10 ms
    rms = librosa.feature.rms(y=y, frame_length=400, hop_length=hop)[0]
    db = 20 * np.log10(rms + 1e-6)
    floor = np.percentile(db, 15)
    thr = floor + 0.45 * (np.percentile(db, 95) - floor)
    voiced = db > thr
    # close short gaps (<180 ms) and drop blips (<120 ms)
    segs, start = [], None
    for i, v in enumerate(voiced):
        t = i * hop / sr
        if v and start is None:
            start = t
        if not v and start is not None:
            segs.append([start, t])
            start = None
    if start is not None:
        segs.append([start, len(y) / sr])
    merged = []
    for s in segs:
        if merged and s[0] - merged[-1][1] < 0.18:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    merged = [[round(a, 3), round(b, 3)] for a, b in merged if b - a >= 0.12]
    env = [round(float(np.mean(db[i:i + 10])), 1) for i in range(0, len(db), 10)]
    onsets = librosa.onset.onset_detect(y=y, sr=sr, units='time')
    json.dump({'segments': merged, 'loudness_db_per_100ms': env, 'onsets': [round(float(o), 3) for o in onsets],
               'note': 'segments = voice-activity phrases (energy based); use an SRT for word-accurate timing'},
              open(os.path.join(out, 'speech.json'), 'w'))
    return merged


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('input')
    ap.add_argument('plate')
    ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--size', default='1080x1920')
    ap.add_argument('--start', type=float)
    ap.add_argument('--end', type=float)
    ap.add_argument('--no-matte', action='store_true')
    ap.add_argument('--pre-graded', action='store_true')
    a = ap.parse_args()
    w, h = map(int, a.size.lower().split('x'))
    os.makedirs(a.plate, exist_ok=True)
    print('extracting frames + audio', flush=True)
    extract_frames(a.input, a.plate, a.fps, w, h, a.start, a.end)
    n = len([f for f in os.listdir(os.path.join(a.plate, 'frames')) if f.endswith('.jpg')])
    meta = {'source': os.path.abspath(a.input), 'fps': a.fps, 'frames': n, 'width': w, 'height': h,
            'duration': round(n / a.fps, 3), 'matte': not a.no_matte}
    if a.pre_graded:
        meta['preGraded'] = True
    json.dump(meta, open(os.path.join(a.plate, 'meta.json'), 'w'), indent=1)
    print('speech segments', flush=True)
    segs = speech_segments(a.plate)
    print(f'  {len(segs)} voiced phrases', flush=True)
    if not a.no_matte:
        print('mattes + face tracking', flush=True)
        make_mattes(a.plate, n)
    print(json.dumps(meta))


if __name__ == '__main__':
    sys.exit(main())

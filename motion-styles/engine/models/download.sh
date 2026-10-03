#!/usr/bin/env bash
# Download the MediaPipe models used by prepare.py (person matte, face box, pose fallback).
set -e
cd "$(dirname "$0")"
base=https://storage.googleapis.com/mediapipe-models
for u in image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite \
         face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite \
         pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task; do
  f=$(basename "$u"); [ -f "$f" ] || curl -sSfL -o "$f" "$base/$u"; echo "ok $f"
done

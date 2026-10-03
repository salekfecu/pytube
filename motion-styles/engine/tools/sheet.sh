#!/usr/bin/env bash
# Contact sheet of a render for quick review: tools/sheet.sh in.mp4 out.jpg [fps=2] [cols=6]
set -e
in=$1; out=$2; fps=${3:-2}; cols=${4:-6}
n=$(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 "$in")
r=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$in" | awk -F/ '{print $1/$2}')
rows=$(python3 -c "import math;print(math.ceil(($n/$r)*$fps/$cols))")
ffmpeg -loglevel error -y -i "$in" -vf "fps=$fps,scale=240:-1,drawtext=text='%{pts\:hms}':x=4:y=4:fontsize=14:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=${cols}x${rows}" -frames:v 1 -q:v 3 "$out"
echo "$out"

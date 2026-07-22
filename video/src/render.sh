#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

WORK="video/work"
MOTION="$WORK/motion"
AUDIO="$WORK/audio"
EDIT="$WORK/edit-v2"
OUTPUT="video/output"
RUNTIME="108"

mkdir -p "$AUDIO" "$EDIT" "$OUTPUT"

require_file() {
  if [[ ! -s "$1" ]]; then
    echo "Missing required V2 input: $1" >&2
    exit 1
  fi
}

require_file "$MOTION/movie-raw.webm"
require_file "$MOTION/recording.json"
require_file "$AUDIO/voice-neural-v2.mp3"
require_file "$AUDIO/voice-neural-v2.srt"

STARTUP_OFFSET="$(node -e "process.stdout.write(String(require('./$MOTION/recording.json').startupOffset))")"

echo "[1/6] Trimming the live motion capture"
ffmpeg -hide_banner -loglevel error -y \
  -ss "$STARTUP_OFFSET" -i "$MOTION/movie-raw.webm" -t "$RUNTIME" \
  -vf "fps=30,scale=1920:1080:flags=lanczos,format=yuv420p" \
  -an -c:v libx264 -preset slow -crf 17 -g 60 -movflags +faststart \
  "$EDIT/picture-master.mp4"

echo "[2/6] Preparing neural narration"
ffmpeg -hide_banner -loglevel error -y \
  -i "$AUDIO/voice-neural-v2.mp3" \
  -af "highpass=f=68,lowpass=f=14000,loudnorm=I=-16:TP=-1.5:LRA=7" \
  -ar 48000 -ac 2 "$AUDIO/voice-neural-v2.wav"

echo "[3/6] Building original ambient score"
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "sine=frequency=48:duration=${RUNTIME}:sample_rate=48000" \
  -f lavfi -i "sine=frequency=96:duration=${RUNTIME}:sample_rate=48000" \
  -f lavfi -i "anoisesrc=color=brown:duration=${RUNTIME}:sample_rate=48000" \
  -filter_complex "[0:a]volume=0.032,lowpass=f=150,tremolo=f=0.12:d=0.28[a0];[1:a]volume=0.010,lowpass=f=360,tremolo=f=0.2:d=0.35[a1];[2:a]volume=0.005,lowpass=f=1000,highpass=f=80[a2];[a0][a1][a2]amix=inputs=3:duration=longest,afade=t=in:st=0:d=2.5,afade=t=out:st=103:d=5" \
  -ar 48000 -ac 2 "$AUDIO/bed-v2.wav"

echo "[4/6] Designing synchronized interface accents"
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "sine=frequency=920:duration=0.09:sample_rate=48000" \
  -f lavfi -i "sine=frequency=620:duration=0.16:sample_rate=48000" \
  -f lavfi -i "sine=frequency=700:duration=0.16:sample_rate=48000" \
  -f lavfi -i "sine=frequency=780:duration=0.16:sample_rate=48000" \
  -f lavfi -i "sine=frequency=860:duration=0.16:sample_rate=48000" \
  -f lavfi -i "sine=frequency=440:duration=0.55:sample_rate=48000" \
  -f lavfi -i "sine=frequency=880:duration=0.55:sample_rate=48000" \
  -f lavfi -i "sine=frequency=740:duration=0.3:sample_rate=48000" \
  -f lavfi -i "sine=frequency=1060:duration=0.2:sample_rate=48000" \
  -f lavfi -i "anoisesrc=color=pink:duration=0.35:sample_rate=48000" \
  -filter_complex "[0:a]volume=0.16,afade=t=out:st=0.04:d=0.05,adelay=23250|23250[a0];[1:a]volume=0.07,afade=t=out:st=0.08:d=0.08,adelay=30500|30500[a1];[2:a]volume=0.07,afade=t=out:st=0.08:d=0.08,adelay=32300|32300[a2];[3:a]volume=0.07,afade=t=out:st=0.08:d=0.08,adelay=34200|34200[a3];[4:a]volume=0.07,afade=t=out:st=0.08:d=0.08,adelay=36000|36000[a4];[5:a]volume=0.08,afade=t=out:st=0.2:d=0.35,adelay=39000|39000[a5];[6:a]volume=0.045,afade=t=out:st=0.2:d=0.35,adelay=39000|39000[a6];[7:a]volume=0.12,afade=t=out:st=0.12:d=0.18,adelay=72000|72000[a7];[8:a]volume=0.14,afade=t=out:st=0.08:d=0.12,adelay=77300|77300[a8];[9:a]volume=0.035,highpass=f=500,afade=t=out:st=0.15:d=0.2,adelay=90200|90200[a9];[a0][a1][a2][a3][a4][a5][a6][a7][a8][a9]amix=inputs=10:duration=longest,apad=pad_dur=108" \
  -t "$RUNTIME" -ar 48000 -ac 2 "$AUDIO/accents-v2.wav"

echo "[5/6] Mixing and mastering"
ffmpeg -hide_banner -loglevel error -y \
  -i "$EDIT/picture-master.mp4" \
  -i "$AUDIO/voice-neural-v2.wav" \
  -i "$AUDIO/bed-v2.wav" \
  -i "$AUDIO/accents-v2.wav" \
  -filter_complex "[1:a]adelay=1000|1000,apad=pad_dur=3[voice];[2:a]volume=.72[bed];[3:a]volume=.82[fx];[voice][bed][fx]amix=inputs=3:duration=longest:dropout_transition=2,loudnorm=I=-14:TP=-1.0:LRA=8[mix]" \
  -map 0:v:0 -map "[mix]" -t "$RUNTIME" \
  -c:v copy -c:a aac -b:a 224k -ar 48000 -movflags +faststart \
  "$OUTPUT/RiskOracle-Flare-Summer-Signal.mp4"

ffmpeg -hide_banner -loglevel error -y \
  -itsoffset 1 -i "$AUDIO/voice-neural-v2.srt" \
  "$OUTPUT/RiskOracle-Flare-Summer-Signal.srt"
perl -0pi -e 's/\n+\z/\n/' "$OUTPUT/RiskOracle-Flare-Summer-Signal.srt"

echo "[6/6] Export complete"
ffprobe -v error \
  -show_entries stream=index,codec_name,width,height,avg_frame_rate \
  -show_entries format=duration,size \
  -of json "$OUTPUT/RiskOracle-Flare-Summer-Signal.mp4"

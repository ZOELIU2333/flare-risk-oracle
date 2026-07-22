#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

WORK="video/work"
CAPTURES="$WORK/captures"
VISUALS="$WORK/visuals"
AUDIO="$WORK/audio"
EDIT="$WORK/edit"
OUTPUT="video/output"
RUNTIME="106.8"

mkdir -p "$AUDIO" "$EDIT/scenes" "$OUTPUT"

require_file() {
  if [[ ! -s "$1" ]]; then
    echo "Missing required production input: $1" >&2
    exit 1
  fi
}

for file in \
  "$CAPTURES/11-hero.png" \
  "$CAPTURES/12-shock-before.png" \
  "$CAPTURES/13-shock-result-same-price.png" \
  "$CAPTURES/02-dashboard.png" \
  "$VISUALS/01-hook.png" \
  "$VISUALS/02-consensus.png" \
  "$VISUALS/03-architecture.png" \
  "$VISUALS/04-proof.png" \
  "$VISUALS/05-protocols.png" \
  "$VISUALS/06-close.png" \
  "$VISUALS/captions.tsv" \
  "video/voiceover.txt" \
  "video/captions.srt"; do
  require_file "$file"
done

echo "[1/6] Generating and normalizing narration"
say -v Daniel -r 170 -f video/voiceover.txt -o "$AUDIO/voice.aiff"
ffmpeg -hide_banner -loglevel error -y \
  -i "$AUDIO/voice.aiff" \
  -af "highpass=f=70,lowpass=f=12000,loudnorm=I=-16:TP=-1.5:LRA=7" \
  -ar 48000 -ac 2 "$AUDIO/voice.wav"

echo "[2/6] Generating restrained original sound bed"
ffmpeg -hide_banner -loglevel error -y \
  -f lavfi -i "sine=frequency=55:duration=${RUNTIME}:sample_rate=48000" \
  -f lavfi -i "sine=frequency=110:duration=${RUNTIME}:sample_rate=48000" \
  -f lavfi -i "anoisesrc=color=pink:duration=${RUNTIME}:sample_rate=48000" \
  -filter_complex "[0:a]volume=0.035,lowpass=f=180[a0];[1:a]volume=0.010,lowpass=f=420[a1];[2:a]volume=0.0015,lowpass=f=900[a2];[a0][a1][a2]amix=inputs=3:duration=longest,afade=t=in:st=0:d=2,afade=t=out:st=102:d=4" \
  -ar 48000 -ac 2 "$AUDIO/bed.wav"

make_scene() {
  local input="$1"
  local duration="$2"
  local output="$3"
  local increment="$4"

  ffmpeg -hide_banner -loglevel error -y \
    -loop 1 -framerate 30 -i "$input" \
    -t "$duration" \
    -vf "scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160,zoompan=z='min(zoom+${increment},1.035)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,format=yuv420p" \
    -an -c:v libx264 -preset medium -crf 18 -r 30 -g 60 -movflags +faststart "$output"
}

echo "[3/6] Rendering picture scenes"
make_scene "$VISUALS/01-hook.png"             7.0  "$EDIT/scenes/01-hook.mp4"         0.00010
make_scene "$CAPTURES/12-shock-before.png"     9.0  "$EDIT/scenes/02-blindspot.mp4"    0.00006
make_scene "$CAPTURES/11-hero.png"             4.3  "$EDIT/scenes/03-product.mp4"      0.00008
make_scene "$CAPTURES/12-shock-before.png"    11.7  "$EDIT/scenes/04-live-test.mp4"    0.00008
make_scene "$VISUALS/02-consensus.png"        13.0  "$EDIT/scenes/05-consensus.mp4"    0.00006
make_scene "$CAPTURES/02-dashboard.png"       11.0  "$EDIT/scenes/06-uncertainty.mp4"  0.00007
make_scene "$VISUALS/03-architecture.png"     17.2  "$EDIT/scenes/07-architecture.mp4" 0.00004
make_scene "$VISUALS/04-proof.png"            15.0  "$EDIT/scenes/08-proof.mp4"        0.00004
make_scene "$VISUALS/05-protocols.png"         8.8  "$EDIT/scenes/09-protocols.mp4"    0.00006
make_scene "$VISUALS/06-close.png"             9.8  "$EDIT/scenes/10-close.mp4"        0.00004

cat > "$EDIT/scenes.ffconcat" <<EOF
ffconcat version 1.0
file 'scenes/01-hook.mp4'
file 'scenes/02-blindspot.mp4'
file 'scenes/03-product.mp4'
file 'scenes/04-live-test.mp4'
file 'scenes/05-consensus.mp4'
file 'scenes/06-uncertainty.mp4'
file 'scenes/07-architecture.mp4'
file 'scenes/08-proof.mp4'
file 'scenes/09-protocols.mp4'
file 'scenes/10-close.mp4'
EOF

ffmpeg -hide_banner -loglevel error -y \
  -f concat -safe 0 -i "$EDIT/scenes.ffconcat" \
  -c copy "$EDIT/picture-master.mp4"

echo "[4/6] Mixing narration and sound bed"
ffmpeg -hide_banner -loglevel error -y \
  -i "$EDIT/picture-master.mp4" \
  -i "$AUDIO/voice.wav" \
  -i "$AUDIO/bed.wav" \
  -filter_complex "[1:a]adelay=350|350,apad=pad_dur=5[voice];[2:a]volume=0.55[bed];[voice][bed]amix=inputs=2:duration=longest:dropout_transition=2,loudnorm=I=-14:TP=-1.0:LRA=8[mix]" \
  -map 0:v:0 -map "[mix]" \
  -c:v copy -c:a aac -b:a 192k -ar 48000 \
  -t "$RUNTIME" -movflags +faststart \
  "$OUTPUT/RiskOracle-Flare-Summer-Signal-captionless.mp4"

echo "[5/6] Burning deterministic caption layers"
caption_inputs=()
filter_chain=""
previous="[0:v]"
input_index=1

while IFS=$'\t' read -r caption_id start end caption_file; do
  caption_inputs+=( -loop 1 -framerate 30 -i "$caption_file" )
  current="[v${input_index}]"
  filter_chain+="${previous}[${input_index}:v]overlay=0:0:enable='between(t,${start},${end})'${current};"
  previous="$current"
  input_index=$((input_index + 1))
done < "$VISUALS/captions.tsv"

filter_chain="${filter_chain%;}"
ffmpeg -hide_banner -loglevel error -y \
  -i "$OUTPUT/RiskOracle-Flare-Summer-Signal-captionless.mp4" \
  "${caption_inputs[@]}" \
  -filter_complex "$filter_chain" \
  -map "$previous" -map 0:a:0 \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 30 \
  -c:a copy -t "$RUNTIME" -movflags +faststart \
  "$OUTPUT/RiskOracle-Flare-Summer-Signal.mp4"

cp video/captions.srt "$OUTPUT/RiskOracle-Flare-Summer-Signal.srt"
cp "$VISUALS/thumbnail.png" "$OUTPUT/RiskOracle-thumbnail.png"

echo "[6/6] Complete"
ffprobe -v error \
  -show_entries stream=index,codec_name,width,height,avg_frame_rate \
  -show_entries format=duration,size \
  -of json "$OUTPUT/RiskOracle-Flare-Summer-Signal.mp4"

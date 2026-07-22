# RiskOracle Video Production

This directory contains the reproducible production source for the Flare Summer
Signal judge video.

## Inputs

- Live product: <https://flare-risk-oracle.onrender.com/>
- FDC proof: <https://coston2-explorer.flare.network/tx/0xe1aa6bf6d89a14422ce60af8646f8943676bcbc6de5c650a62ff3ea3268e69a7>
- Approved design: [`../docs/superpowers/specs/2026-07-22-riskoracle-award-video-design.md`](../docs/superpowers/specs/2026-07-22-riskoracle-award-video-design.md)
- Production plan: [`../docs/superpowers/plans/2026-07-22-riskoracle-award-video-production.md`](../docs/superpowers/plans/2026-07-22-riskoracle-award-video-production.md)

## Toolchain

- Node.js 20+
- Playwright Chromium
- Sharp
- FFmpeg and ffprobe
- macOS `say` with the Daniel English voice

The bundled Codex Node packages are used without modifying the application
dependencies:

```bash
export CODEX_NODE_MODULES=/Users/liudan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules
```

## Build

```bash
NODE_PATH="$CODEX_NODE_MODULES" node video/src/capture-demo.mjs
NODE_PATH="$CODEX_NODE_MODULES" node video/src/build-visuals.mjs
say -v Daniel -r 170 -f video/voiceover.txt -o video/work/audio/voice.aiff
bash video/src/render.sh
```

Raw takes and intermediates live under `video/work/` and are ignored by Git.
Final deliverables are written to `video/output/`.

The checked-in capture script is available for environments where Playwright has
direct outbound access. The final selected footage was captured from the same
hosted product through the Codex in-app browser because the terminal browser
channel could not connect to Render reliably.

## Outputs

- `RiskOracle-Flare-Summer-Signal.mp4`: captioned submission master.
- `RiskOracle-Flare-Summer-Signal-captionless.mp4`: clean master.
- `RiskOracle-Flare-Summer-Signal.srt`: separate English captions.
- `RiskOracle-thumbnail.png`: 16:9 submission thumbnail.

## Verification

```bash
ffprobe -v error \
  -show_entries stream=index,codec_name,width,height,avg_frame_rate \
  -show_entries format=duration,size \
  -of json video/output/RiskOracle-Flare-Summer-Signal.mp4
```

The accepted result is 1920x1080, 30 fps, H.264/AAC, 95-110 seconds, with a
real News Shock Test, legible four-model consensus, and a recognizable Coston2
FDC transaction.

## Final delivery record

- Runtime: `106.800s`
- Submission master: H.264/AAC, 1920x1080, 30 fps, approximately 4.7 MB
- Captionless master: H.264/AAC, 1920x1080, 30 fps, approximately 7.8 MB
- Integrated loudness: `-14.06 LUFS`
- True peak: `-1.16 dBTP`
- Narration: Daniel English system voice at rate `170`
- Selected XRP price: `$1.13465` before and after the News Shock request
- Selected model scores: GPT-5.5 `92`, Claude Opus 4.8 `85`, DeepSeek `95`, Qwen3-235B `85`
- Selected consensus: `89`, high agreement
- Coston2 proof: transaction success, method `addRisk`, contract `RiskOracleFdc`, block `33099670`

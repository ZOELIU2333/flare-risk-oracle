# RiskOracle Judge Film

This directory contains the reproducible source and final deliverables for the
RiskOracle Flare Summer Signal judge film.

## Creative format

The 98-second film is a continuously rendered product story, not a screenshot
slideshow. A browser-based motion stage synchronizes:

- a 1.7-second signal-ignition opening whose final 0.7 seconds reveal the live XRP scene beneath it;
- a live XRP price and regulatory shock;
- typed input, cursor movement, and an analyze click targeted to the button's rendered center;
- four independent model returns and an animated `89` consensus;
- the FTSOv2 -> AI -> deterministic JSON -> FDC Web2Json -> `IRiskOracle` flow;
- a successful Coston2 transaction and immutable `RiskUpdated` event;
- separate FXRP lending and insurance policy responses.

Captions are white text with a restrained shadow and no background panel. The
English narration uses the conversational `en-US-AndrewMultilingualNeural`
voice at `+18%`, supported by an original ambient bed and synchronized
interface accents.

## Truth boundaries

- The FDC-verifying path uses a deterministic JSON snapshot and has a proven
  end-to-end Web2Json transaction on Coston2.
- Continuous hosted-demo updates use a lightweight signer for responsiveness.
- The film states this distinction directly and does not imply that every
  scheduled demo update currently uses FDC.

## Sources

- Live product: <https://flare-risk-oracle.onrender.com/>
- Coston2 proof: <https://coston2-explorer.flare.network/tx/0xe1aa6bf6d89a14422ce60af8646f8943676bcbc6de5c650a62ff3ea3268e69a7>
- Approved design: [`../docs/superpowers/specs/2026-07-22-riskoracle-award-video-design.md`](../docs/superpowers/specs/2026-07-22-riskoracle-award-video-design.md)
- Opening and cursor revision: [`../docs/superpowers/specs/2026-07-22-video-opening-and-cursor-fix-design.md`](../docs/superpowers/specs/2026-07-22-video-opening-and-cursor-fix-design.md)
- Production plan: [`../docs/superpowers/plans/2026-07-22-riskoracle-award-video-production.md`](../docs/superpowers/plans/2026-07-22-riskoracle-award-video-production.md)

## Production source

- `src/movie.html`: semantic film scene structure.
- `src/movie.css`: visual system and motion-ready UI composition.
- `src/movie.js`: deterministic 98-second timeline and captions.
- `src/record-motion.mjs`: Playwright preview-frame and fallback recording.
- `src/render-frames.mjs`: crisp frame-exact 1920x1080 picture rendering.
- `src/render.sh`: trim, sound design, mix, master, captions, and final export.
- `voiceover.txt`: approved English narration.
- `captions.srt`: source subtitle timing.

Raw recordings, preview frames, and intermediate audio live under `work/` and
are ignored by Git.

## Build

The project uses the bundled Codex Playwright runtime without modifying product
dependencies:

```bash
export CODEX_NODE_MODULES=/Users/liudan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules

# Fast visual inspection at 25 key moments
NODE_PATH="$CODEX_NODE_MODULES" node video/src/record-motion.mjs --preview

# Frame-exact high-quality picture master
NODE_PATH="$CODEX_NODE_MODULES" node video/src/render-frames.mjs

# Picture trim, neural voice, sound design, mix, and master
bash video/src/render.sh
```

The neural narration input is generated with Edge TTS:

```bash
python3 -m edge_tts \
  --voice en-US-AndrewMultilingualNeural \
  --rate=+18% \
  --pitch=-2Hz \
  --file video/voiceover.txt \
  --write-media video/work/audio/voice-neural-v3.mp3 \
  --write-subtitles video/work/audio/voice-neural-v3.srt
```

## Deliverables

- `output/RiskOracle-Flare-Summer-Signal.mp4`: submission master with transparent-style burned captions.
- `output/RiskOracle-Flare-Summer-Signal.srt`: separate English captions.
- `output/RiskOracle-thumbnail.png`: 16:9 consensus thumbnail.

## Final verification

- Runtime: `98.000s`
- Video: H.264, `1920x1080`, `30 fps`
- Picture: 2,940 frame-exact high-quality renders, no low-bitrate screen capture
- Audio: AAC, integrated loudness `-14.0 LUFS`, true peak `-1.0 dBFS`
- Motion: persistent signal rail plus scene-specific scans, pulses, counters, and data packets
- Selected XRP price: `$1.13465` before and after the shock
- Model scores: GPT-5.5 `92`, Claude Opus 4.8 `85`, DeepSeek `95`, Qwen3-235B `85`
- Consensus: `89`, high agreement
- Coston2 proof: successful `addRisk`, block `33099670`, contract `RiskOracleFdc`

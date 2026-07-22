# RiskOracle Award Video Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a judge-ready 95-110 second RiskOracle demo video with real hosted-product footage, a visible Coston2 FDC proof, English narration, burned-in captions, and a submission-ready MP4.

**Architecture:** Playwright records clean 1920x1080 live-product and explorer takes into an ignored work directory. Small Node/Sharp scripts generate evidence overlays and title frames, while FFmpeg assembles selected clips, narration, synthesized sound design, and subtitles into final deliverables. Verification uses ffprobe plus still-frame inspection at every major judging beat.

**Tech Stack:** Node.js 20, Playwright Chromium, Sharp, FFmpeg/ffprobe, macOS `say`, SVG, SRT captions.

---

## File map

- Create `video/src/capture-demo.mjs`: deterministic browser recording for the live product and Coston2 explorer.
- Create `video/src/build-visuals.mjs`: render opening, architecture, proof, and closing overlays as 1920x1080 PNG assets.
- Create `video/src/render.sh`: normalize takes and assemble the final video timeline.
- Create `video/voiceover.txt`: narration source of truth.
- Create `video/captions.srt`: timed English captions.
- Create `video/README.md`: reproducible production and delivery instructions.
- Create `video/work/`: ignored raw recordings, generated cards, audio, and intermediate renders.
- Create `video/output/RiskOracle-Flare-Summer-Signal.mp4`: final H.264 submission file.
- Create `video/output/RiskOracle-Flare-Summer-Signal-captionless.mp4`: clean master without burned-in captions.
- Create `video/output/RiskOracle-thumbnail.png`: 16:9 submission thumbnail.
- Modify `.gitignore`: ignore `video/work/` and raw browser recording formats while retaining production source and explicit final output.

### Task 1: Production workspace and tool check

**Files:**
- Modify: `.gitignore`
- Create: `video/README.md`

- [ ] **Step 1: Add narrow video-work ignores**

```gitignore
# Video production intermediates
video/work/
video/output/*.webm
video/output/*.mov
```

- [ ] **Step 2: Create required directories**

Run:

```bash
mkdir -p video/src video/work/captures video/work/visuals video/work/audio video/work/edit video/output
```

Expected: all directories exist and `git status` does not list `video/work/`.

- [ ] **Step 3: Verify the production tools**

Run:

```bash
node --version
ffmpeg -version
ffprobe -version
say -v Daniel "RiskOracle production check" -o video/work/audio/tool-check.aiff
```

Expected: Node 20 or newer, FFmpeg and ffprobe print versions, and `tool-check.aiff` is non-empty.

- [ ] **Step 4: Document reproducible commands**

Create `video/README.md` with capture, narration, render, and verification commands plus the live URL and FDC proof URL.

### Task 2: Real product and explorer capture

**Files:**
- Create: `video/src/capture-demo.mjs`
- Create: `video/work/capture-manifest.json`

- [ ] **Step 1: Implement a capture helper**

Use bundled Playwright and Chromium. Create a 1920x1080 context with video recording enabled, load the hosted product, and verify:

```js
await page.goto(LIVE_URL, { waitUntil: "domcontentloaded", timeout: 120000 });
await page.locator("#scoreNum").waitFor({ state: "visible", timeout: 120000 });
await page.waitForFunction(() => document.querySelector("#scoreNum")?.textContent?.trim() !== "—");
```

The helper must record separate named takes for `dashboard`, `shock-test`, `architecture`, `onchain`, `ecosystem`, and `fdc-explorer` so editing does not depend on one fragile continuous recording.

- [ ] **Step 2: Record the News Shock Test as a real request**

```js
await page.locator("#newsInput").fill(HEADLINE);
await page.locator("#analyzeNewsBtn").click();
await page.waitForFunction(() => /^\d+$/.test(document.querySelector("#newsScore")?.textContent?.trim() || ""), null, { timeout: 120000 });
```

Capture the visible model scores, consensus, agreement, XRP price, and headline into the manifest. Reject the take if fewer than four model scores are present.

- [ ] **Step 3: Record the Coston2 evidence**

Open the known successful FDC transaction and hold a readable viewport showing the Coston2 domain, success state, hash, and transaction detail context. Record the operational oracle page separately when needed for `RiskUpdated` evidence.

- [ ] **Step 4: Validate raw takes**

Run:

```bash
for f in video/work/captures/*.webm; do ffprobe -v error -show_entries stream=width,height,avg_frame_rate -show_entries format=duration -of json "$f"; done
```

Expected: every take is 1920x1080, approximately 30 fps, readable, and longer than the intended selected edit segment.

### Task 3: Evidence overlays and motion-ready cards

**Files:**
- Create: `video/src/build-visuals.mjs`
- Create: `video/work/visuals/*.png`

- [ ] **Step 1: Build a reusable Sharp renderer**

The script renders SVG strings through Sharp at exactly 1920x1080. It must generate:

```text
01-hook.png
02-consensus.png
03-architecture.png
04-proof.png
05-protocols.png
06-close.png
thumbnail.png
```

- [ ] **Step 2: Encode only evidence-bearing copy**

Use the approved labels:

```text
PRICE UNCHANGED
4 INDEPENDENT MODELS
CONSENSUS 89 · HIGH AGREEMENT
FTSOv2 MARKET STATE
DETERMINISTIC SNAPSHOT
FDC PROOF · COSTON2
ONE INTERFACE · TWO PROTOCOLS
BUILT DURING FLARE SUMMER SIGNAL
```

Colors are `#050706`, `#F2F2F3`, `#3DE686`, `#E5645D`, and `#747A78`. No gradients, glow, particles, or decorative crypto imagery.

- [ ] **Step 3: Render and inspect all visuals**

Run:

```bash
NODE_PATH=/Users/liudan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules node video/src/build-visuals.mjs
```

Expected: seven non-empty 1920x1080 PNG files with all text inside safe margins.

### Task 4: Narration, captions, and sound bed

**Files:**
- Create: `video/voiceover.txt`
- Create: `video/captions.srt`
- Create: `video/work/audio/voice.aiff`
- Create: `video/work/audio/voice.wav`
- Create: `video/work/audio/bed.wav`

- [ ] **Step 1: Copy the approved 206-word narration**

Use the exact master voice-over from `docs/VIDEO_SCRIPT.md`. Keep the FDC truth boundary intact.

- [ ] **Step 2: Generate a measured English narration**

Run:

```bash
say -v Daniel -r 132 -f video/voiceover.txt -o video/work/audio/voice.aiff
ffmpeg -y -i video/work/audio/voice.aiff -af "highpass=f=70,lowpass=f=12000,loudnorm=I=-16:TP=-1.5:LRA=7" -ar 48000 video/work/audio/voice.wav
```

Expected: narration is intelligible, calm, and between 92 and 105 seconds. If it falls outside the range, change only the speech rate and regenerate.

- [ ] **Step 3: Create timed captions**

Write one SRT cue per narration paragraph, aligned to the visual beats in `docs/VIDEO_SCRIPT.md`, with no cue longer than two lines.

- [ ] **Step 4: Generate restrained original sound design**

Use FFmpeg synthesis to create a low-volume ambient bed and two subtle accents. Normalize the mix so narration remains dominant; do not use unlicensed music.

### Task 5: Timeline assembly

**Files:**
- Create: `video/src/render.sh`
- Create: `video/work/edit/picture-master.mp4`
- Create: `video/output/RiskOracle-Flare-Summer-Signal-captionless.mp4`
- Create: `video/output/RiskOracle-Flare-Summer-Signal.mp4`

- [ ] **Step 1: Normalize selected takes**

Scale and crop all takes to 1920x1080, 30 fps, yuv420p, and consistent color metadata. Remove raw-take audio.

- [ ] **Step 2: Assemble the approved nine-beat timeline**

Use these boundaries:

```text
00.0-07.0  hook
07.0-16.0  blind spot
16.0-32.0  live shock test
32.0-45.0  four-model consensus
45.0-56.0  visible uncertainty
56.0-73.0  Flare-native pipeline
73.0-86.0  Coston2 proof
86.0-95.0  protocol action
95.0-100.0 close
```

Prefer hard cuts and restrained 6-10 frame dissolves. Add overlays only when the underlying evidence is already visible.

- [ ] **Step 3: Mix narration and sound bed**

Mix at 48 kHz stereo. Target final integrated loudness near `-14 LUFS`, true peak below `-1 dBTP`, and keep the bed at least 18 dB below narration during speech.

- [ ] **Step 4: Export captionless and captioned masters**

Encode H.264 High Profile, 1920x1080, 30 fps, CRF 18-20, AAC 192 kbps, `+faststart`. Burn captions into the submission MP4 and preserve the separate `.srt` file.

### Task 6: Judge-view verification and delivery

**Files:**
- Create: `video/output/RiskOracle-thumbnail.png`
- Create: `video/work/verification/*.png`
- Modify: `video/README.md`

- [ ] **Step 1: Verify technical properties**

Run:

```bash
ffprobe -v error -show_entries stream=index,codec_name,width,height,avg_frame_rate -show_entries format=duration,size -of json video/output/RiskOracle-Flare-Summer-Signal.mp4
```

Expected: H.264 video, AAC audio, 1920x1080, 30 fps, and 95-110 seconds.

- [ ] **Step 2: Extract judging-beat stills**

Extract frames at 3, 22, 38, 62, 78, 90, and 98 seconds. Inspect each for legibility, overlap, accurate values, and evidence continuity.

- [ ] **Step 3: Verify audio and captions**

Run FFmpeg `loudnorm` analysis, compare each SRT cue to the spoken narration, and confirm the video remains understandable when muted.

- [ ] **Step 4: Build the thumbnail**

Use the real contrast `LEGACY LOW` versus `CONSENSUS 89`, the RiskOracle name, and a small `BUILT ON FLARE` identifier. Keep the thumbnail readable at 320 px width.

- [ ] **Step 5: Record final delivery details**

Document output paths, duration, size, codecs, narration voice, verified headline result, and any difference between the selected take and the pre-production reference.


# RiskOracle Video Opening and Cursor Fix Design

## Goal

Improve the final judge film in two tightly scoped ways:

1. Add a brief premium introduction so the film establishes product identity before entering the problem statement.
2. Correct the News Shock Test cursor so its click lands visibly inside the analyze button.

The existing story, narration wording, scene order, pacing within the main film, and visual language remain unchanged.

## Approved Opening: Signal Ignition

Add a 1.6-second cold open before the existing 97-second film.

| Time | Visual | Audio |
|---|---|---|
| `0.00-0.25` | Near-black field with subtle film texture. | Existing ambient bed fades in. |
| `0.25-0.70` | RiskOracle mark and wordmark resolve with a short vertical rise. | Restrained low pulse. |
| `0.55-1.15` | `VERIFIABLE RISK INTELLIGENCE` and `Before price reacts.` appear in sequence. | No narration; a quiet signal tone supports the reveal. |
| `0.85-1.60` | A mint data scan crosses the frame, exposing `FTSO -> AI -> FDC -> DEFI`; the scan becomes the first market-data line of the existing film. | Short scan accent leads into the existing sound bed. |

The opening uses the film's existing black, white, mint, monospaced data labels, grain, and sharp geometry. It must not resemble a separate logo animation or marketing bumper.

## Timeline and Synchronization

- New runtime: approximately `98.6` seconds.
- The existing 97-second story shifts later by exactly `1.6` seconds as one unit.
- Existing narration, captions, interface accents, animation cues, and sidecar SRT cues shift by the same amount.
- No main-film scene is shortened or re-edited.
- The opening contains continuous motion; no element remains completely static for longer than 0.5 seconds.

## Cursor Correction

The cursor target must be derived from the rendered `.analyze-button` bounds rather than fixed page coordinates.

- Target point: horizontal and vertical center of the button.
- The cursor follows the existing eased path and reaches the target before the click pulse.
- The click ring and arrow tip must both remain inside the button during the click.
- The analysis progress animation starts immediately after the click, preserving the current cause-and-effect timing.

## Scope

Files expected to change:

- `video/src/movie.html`
- `video/src/movie.css`
- `video/src/movie.js`
- `video/src/render.sh`
- Rendered video, subtitle, thumbnail, and verification artifacts

No application code, smart contracts, README structure, narration text, or model claims will change.

## Verification

1. Inspect opening frames around `0.25`, `0.70`, `1.15`, and `1.60` seconds for legibility and continuity.
2. Inspect the cursor approach, click frame, and immediate post-click frame at full 1920x1080 resolution.
3. Confirm picture, narration, burned-in captions, sidecar SRT, and interface accents remain synchronized after the 1.6-second shift.
4. Confirm the final file remains 1920x1080, 30 fps, H.264/AAC, web optimized, and under 100 seconds.
5. Review the complete film for accidental static holds, visual overlap, and regressions outside the two approved changes.

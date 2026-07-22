# RiskOracle Award Video Design

**Date:** 2026-07-22  
**Status:** Approved  
**Audience:** Flare Summer Signal judges  
**Runtime:** 100 seconds target, 110 seconds maximum  
**Language:** English narration and captions

## Objective

Produce an evidence-led demo that makes RiskOracle competitive across all five
official judging criteria: product usefulness, Flare integration quality,
technical execution, evidence of new work, and clarity with future potential.

Success is not measured by cinematic polish alone. A successful video gives a
judge enough visible evidence to believe that the product solves a real problem,
works today, uses Flare as infrastructure rather than branding, and can become a
reusable primitive for interoperable assets.

## Chosen creative approach

The approved direction is an evidence-driven live demo with restrained motion
graphics. It was selected over a cinematic brand trailer and a pure architecture
walkthrough because it balances product value, technical density, and proof.

The central event is a real News Shock Test. With the XRP price unchanged, a
price-only oracle remains low while GPT-5.5, Claude Opus 4.8, DeepSeek, and
Qwen3-235B independently identify elevated event risk and form a visible
consensus. The video then follows that signal through Flare market data,
deterministic serialization, FDC proof, and downstream protocol action.

## Narrative architecture

1. **Hook:** The price has not moved, but risk has.
2. **Problem:** Price-only collateral controls react after exposure exists.
3. **Working product:** A real headline is analyzed in the hosted Demo.
4. **Credibility:** Four independent model results, spread, and consensus are
   visible rather than hidden behind one score.
5. **Flare integration:** FTSOv2 anchors market state; deterministic JSON bridges
   non-deterministic AI analysis to FDC Web2Json; `IRiskOracle` isolates consumers
   from model providers.
6. **Proof:** Coston2 contracts, immutable events, and a successful FDC
   transaction are shown directly.
7. **Usefulness:** FXRP lending and insurance examples turn the signal into
   different protocol policies.
8. **Close:** New hackathon work, product identity, live demo, and source.

## Evidence hierarchy

The edit uses evidence in this order:

1. Live hosted-product behavior.
2. Public Coston2 explorer records.
3. Repository-backed architecture and interface names.
4. Motion graphics that clarify relationships already supported by evidence.

Static README imagery and generated visuals are supporting material only. No
scene may imply functionality that cannot be observed in the product, explorer,
or repository.

## Technical truth model

The video must preserve the project's two on-chain paths:

- The FDC-verifying path uses a deterministic JSON snapshot and has a successful
  end-to-end Web2Json proof transaction on Coston2.
- Continuous hosted-demo updates use an owner-signed operational oracle for
  responsiveness and visible event history.

The narration states this distinction. It does not suggest that every scheduled
demo update currently uses FDC. This honesty protects technical credibility and
defines the first production milestone naturally.

## Visual system

The live interface supplies the visual identity. Black is the base, mint green
marks verification and success, and red is reserved for material risk or halted
protocol action. Product footage remains visually dominant.

Screen captures are reframed through deliberate crops and restrained camera
movement. Motion graphics grow from real UI elements, especially in the
FTSOv2-to-FDC sequence, so the video never feels like alternating between an app
and an unrelated slide deck.

Typography uses Inter for captions and a readable monospace face for model
scores, contract identifiers, and transaction hashes. Captions stay within safe
margins and never exceed two lines.

Allowed transitions are hard cuts, restrained pushes, masks, and UI-led reveals.
Neon effects, particles, glitch templates, crypto stock footage, coin animations,
generic city footage, AI brains, and fake code are excluded.

## Sound system

Narration is calm, precise international English with documentary confidence,
not a promotional voice. A restrained electronic bed supports pacing without
competing with speech. Sound accents are limited to the `89` consensus lock, the
successful FDC verification, and subtle interface feedback.

Burned-in English captions are mandatory, accompanied by a separate `.srt` file.
The video must remain understandable when muted.

## Recording strategy

The Render service is warmed before each take. A clean browser profile, native
1920x1080 capture, disabled notifications, and a deliberate cursor are required.
The News Shock Test is recorded as a real request. Dead waiting time may be
compressed, but the visible result may not be recreated or replaced.

At least two successful complete takes are captured. Market values and model
scores in narration must match the selected take. The Coston2 explorer segment is
recorded separately so transaction status, network, hash, and contract context
remain legible.

## Failure handling

- **Render is asleep:** Warm `/api/health` and verify the dashboard before the
  recording session begins.
- **One model times out:** Record a new take; do not manufacture the missing
  score. A partial result may be used only if the story is explicitly changed to
  discuss provider resilience.
- **Live values change:** Update captions and voice-over to match the selected
  take.
- **Explorer latency:** Use a separately captured, current explorer segment; do
  not substitute a screenshot that hides the network or success state.
- **Narration runs long:** Shorten explanatory wording before increasing speech
  speed. Do not remove the FDC truth boundary or protocol consequence.

## Judging-criteria coverage

| Criterion | Visible evidence |
|---|---|
| Product usefulness | Unchanged price, adverse event, legacy low result, early AI risk signal, and protocol action |
| Flare integration quality | FTSOv2 market state, deterministic snapshot, FDC Web2Json, Coston2 proof, and FXRP use case |
| Technical execution | Hosted product, real four-model request, divergence-aware consensus, contracts, events, and explorer transaction |
| Evidence of new work | Closing statement plus the integrated product, contracts, AI engine, and Flare pipeline shown throughout |
| Clarity and future potential | One `IRiskOracle` interface serving lending and insurance while each protocol retains policy control |

## Deliverables

- High-quality editing master.
- Web-ready H.264 MP4 suitable for DoraHacks and README linking.
- Burned-in English caption version.
- Separate `.srt` captions.
- 16:9 video thumbnail based on the real `Legacy LOW` versus `Consensus 89`
  contrast.
- Archive of clean source captures and audio.

## Acceptance criteria

The final video is accepted when:

- Runtime is 95-110 seconds.
- Product footage occupies at least 70 percent of runtime.
- A real News Shock Test and four-model consensus complete visibly.
- FTSOv2, deterministic JSON, FDC Web2Json, and `IRiskOracle` form a clear flow.
- The successful Coston2 FDC transaction is independently recognizable.
- The continuous signer path and proven FDC path are not conflated.
- FXRP lending and insurance consequences are shown.
- No unsupported user, audit, mainnet, pilot, or traction claim appears.
- The story works both muted and audio-only.
- The final frame provides the live demo and source destinations.

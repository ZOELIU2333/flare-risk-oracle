# Judge Links and Hosted Video Player Design

## Goal

Make the repository's first screen feel restrained, technically credible, and
immediately useful to a hackathon judge. Every prominent link must lead to a
distinct piece of evidence, and the demo film must be watchable online without
requiring a 32 MB download first.

## README Evidence Navigation

Replace the four high-contrast status graphics with a restrained **Evidence
Rail**. The four items remain visual and individually clickable, but use thin
borders, quiet neutral surfaces, compact icons, and two levels of type instead of large
black blocks and saturated color fills. Mint appears only as the live status
dot; amber appears only as a small verification accent. The rail must remain
legible in GitHub light and dark themes and wrap to two rows on narrow screens.

Each item has a small icon, a short primary label, and a quieter evidence line.
The four destinations are distinct:

1. **Live product ↗** / `Hosted · Open` opens the deployed Render application.
2. **98s judge film ↗** / `Stream online` opens the hosted video player.
3. **Model engine** / `Inspect source` opens `lib/risk-analyzer.js` in the
   repository.
4. **FDC proof ↗** / `Verified · Coston2` opens the successful proof transaction.

The hosted application URL remains visible as text below the navigation. The
GitHub Release and direct MP4 stay available as secondary evidence for download
and SHA-256 verification.

GitHub removes `target="_blank"` from rendered README HTML. The README therefore
must not claim it can force a new browser tab. External destinations use the
`↗` marker so judges understand that they are leaving the repository; opening a
new tab remains controlled by GitHub and the judge's browser.

## Hosted Player

Add `frontend/demo-video.html` as a focused viewing page at
`/demo-video.html`. It uses the project's existing black, white, mint, and amber
visual language without reproducing the dashboard or adding marketing content.
The first viewport contains:

- RiskOracle identity and a concise `Flare Summer Signal · Judge Demo` label;
- a native 16:9 HTML video player with controls, full-screen support, and a
  poster image;
- film duration and evidence links for the live product, source repository, and
  GitHub Release;
- a clear fallback download link if streaming is unavailable.

The player source is `/media/demo.mp4`, not the GitHub asset URL directly.

## Video Streaming Endpoint

Add a narrowly scoped Express endpoint at `/media/demo.mp4`. It proxies only the
fixed GitHub Release asset and never accepts a user-supplied URL.

The endpoint must:

- support `GET` and `HEAD`;
- forward a valid browser `Range` header upstream;
- preserve `200` and `206` responses;
- return `Content-Type: video/mp4` and `Content-Disposition: inline`;
- forward `Content-Length`, `Content-Range`, `Accept-Ranges`, `ETag`, and
  `Last-Modified` when present;
- stream bytes without buffering the full film in application memory;
- apply an upstream timeout and return a concise `502` response when GitHub is
  unavailable;
- reject unsupported methods through normal Express routing.

The fixed release URL may be overridden by `DEMO_VIDEO_URL` for deployment
testing, but the request itself cannot choose a destination. This keeps the
endpoint from becoming an open proxy.

## Failure Behavior

The viewing page displays a short playback error message and reveals the direct
GitHub Release download when the media element fails. It does not loop retries
or hide the error behind an endless spinner.

If GitHub redirects the asset request, the server follows the redirect. If the
upstream response is not successful, the endpoint closes the upstream body and
returns `502` without exposing internal stack traces or credentials.

## Verification

Before completion:

1. Check the README renders with one restrained Evidence Rail whose four items
   remain visually balanced in GitHub light, dark, desktop, and mobile layouts.
2. Confirm all four destinations are distinct and valid.
3. Start the application locally with the production asset URL.
4. Verify `HEAD /media/demo.mp4` returns inline `video/mp4` metadata.
5. Verify a byte-range request returns `206` and a valid `Content-Range`.
6. Open the player at desktop and mobile widths and confirm the poster, controls,
   layout, fallback state, and text do not overlap.
7. Confirm the deployed app, Release page, and FDC proof still return successful
   responses.

## Scope

This change does not alter the judge film, AI model behavior, contracts, or FDC
flow. GitHub Release remains the canonical downloadable artifact; Render adds a
judge-friendly streaming presentation layer.

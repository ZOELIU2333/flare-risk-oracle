# RiskOracle Hackathon Tracker

Last updated: 2026-07-23 (CST)

This is the single source of truth for RiskOracle competition work. Update it
whenever a registration, submission, deadline, deliverable, or result changes.
Do not store personal email addresses, phone numbers, Telegram handles, wallet
secrets, API keys, or other private information here.

## Status Legend

- `IN PROGRESS`: registration or submission is actively being completed.
- `PLANNED`: selected for participation, but registration or build work has not started.
- `SUBMITTED`: final entry has been submitted and verified.
- `BLOCKED`: progress requires an external dependency or organizer response.
- `CLOSED`: judging or results are complete.

## Portfolio Overview

| Priority | Competition | Status | Key date | Current focus |
|---|---|---|---|---|
| P0 | [Flare Summer Signal](https://dorahacks.io/hackathon/flaresummersignal/detail) | `BLOCKED` | Submission: 2026-08-15 03:59 CST | Complete DoraHacks contact step after Telegram registration |
| P0 | [HackerNoon Proof of Usefulness](https://proofofusefulness.com/) | `IN PROGRESS` | Rolling deadline: 2026-08-10 | Finish contact step, submit, and generate the PoU report |
| P1 | [KeeperHub Agents Onchain](https://dorahacks.io/hackathon/agents-onchain/detail) | `PLANNED` | Submission: 2026-08-13 | Confirm existing-project eligibility and scope a real execution feature |
| P1 | [ETHOnline 2026](https://ethglobal.com/events) | `PLANNED` | Event: 2026-09-04 to 2026-09-16 | Apply and confirm availability of a Continuity track |
| P2 | [XRPL Make Waves](https://luma.com/make-waves-on-xrpl) | `PLANNED` | Program ends: 2026-09-21 | Apply with an XRPL Mainnet extension proposal |

## Shared Product Assets

| Asset | Link |
|---|---|
| Live product | https://flare-risk-oracle.onrender.com/ |
| Online judge film | https://flare-risk-oracle.onrender.com/demo-video.html |
| GitHub repository | https://github.com/ZOELIU2333/flare-risk-oracle |
| Video release | https://github.com/ZOELIU2333/flare-risk-oracle/releases/tag/video-v1.0.0 |
| Coston2 oracle events | https://coston2-explorer.flare.network/address/0x29D2567bbD5979426fadAdB8991C10dE267f4304 |
| Successful FDC proof | https://coston2-explorer.flare.network/tx/0xe1aa6bf6d89a14422ce60af8646f8943676bcbc6de5c650a62ff3ea3268e69a7 |

## 1. Flare Summer Signal

**Track:** Interoperable Asset Products

**Positioning:** A Flare-native AI risk oracle for lending and insurance
protocols, with FTSOv2 market data, four-model consensus, deterministic
snapshots, and FDC-verifiable results.

### Completed

- [x] Live product deployed.
- [x] Four-model consensus implemented.
- [x] FTSOv2 integration demonstrated.
- [x] Coston2 contracts deployed.
- [x] Successful FDC Web2Json proof transaction recorded.
- [x] Judge-focused README completed.
- [x] Online 1080p product film published.
- [x] BUIDL logo prepared.
- [x] DoraHacks Profile, Details, and Team copy prepared.

### Next

- [ ] Register Telegram when the new SIM is available.
- [ ] Complete the private DoraHacks contact step.
- [ ] Review every public submission field against the final README.
- [ ] Test all judge links in a signed-out browser session.
- [ ] Submit the BUIDL.
- [ ] Record the public BUIDL URL and submission timestamp here.

### Blocker

Telegram is required as the primary private contact method. The project itself
is ready; only the contact and final submission steps remain.

## 2. HackerNoon Proof of Usefulness

**Track fit:** AI, AI agents, fintech, security, startup, and Web3.

**Positioning:** A live technical product with publicly verifiable deployment,
source code, contracts, and proof transactions. The submission must stay honest
about being in early public beta and not yet having material user traction.

### Completed

- [x] Project homepage, name, and short description prepared.
- [x] Audience, target user, and technology responses prepared.
- [x] Traction evidence and usefulness response prepared.
- [x] Sponsor technology selection reviewed: use `Other / Custom Stack`.

### Next

- [ ] Complete the contact form and submit the project.
- [ ] Save the generated Proof of Usefulness report URL and score.
- [ ] Publish the required HackerNoon technical article.
- [ ] Recruit 5-10 independent testers.
- [ ] Record verifiable feedback, analysis runs, API calls, and repeat usage.
- [ ] Update and resubmit the PoU evidence before the rolling deadline if allowed.

### Evidence Policy

Do not invent monthly users, customers, revenue, partnerships, or integrations.
Use public links and clearly label the product as an early public beta.

## 3. KeeperHub Agents Onchain

**Proposed extension:** `RiskGuardian`, an execution agent that consumes a
RiskOracle score and uses KeeperHub to perform a real protective on-chain action
such as topping up collateral, reducing exposure, or pausing a strategy.

### Entry Requirement

The agent must land real on-chain transactions through KeeperHub. A simulated
transaction or a superficial API mention is not sufficient.

### Next

- [ ] Register for the hackathon.
- [ ] Ask the organizer whether an existing open-source project may be extended.
- [ ] Confirm supported chains, protocols, test environments, and transaction costs.
- [ ] Select one narrow protective action for the working demo.
- [ ] Document the pre-existing RiskOracle baseline before implementation.
- [ ] Build and verify a real KeeperHub execution path.
- [ ] Produce a competition-specific demo and submission.

### Go/No-Go Gate

Start implementation only after the organizer confirms existing-project
eligibility and the selected action can be executed safely with low-value funds
or an approved test environment.

## 4. ETHOnline 2026

**Proposed extension:** Build a substantial open-source feature that makes
RiskOracle usable by an Ethereum DeFi protocol without weakening the existing
Flare-native submission.

### Rule Constraint

Pre-existing work is only suitable when an approved Continuity track is
available. All prior work must be disclosed, and the new feature must be
substantive, open source, and developed during the event window.

### Next

- [ ] Apply for ETHOnline 2026.
- [ ] Confirm that the event offers a Continuity track.
- [ ] Review sponsor prizes after they are published.
- [ ] Choose one sponsor-native integration with a clear protocol user.
- [ ] Tag the pre-event baseline commit.
- [ ] Build only the new competition feature during the official event window.
- [ ] Publish a separate build log, demo, and disclosure of pre-existing work.

## 5. XRPL Make Waves

**Proposed extension:** An XRPL Mainnet risk service that turns RiskOracle
analysis into a useful XRP ecosystem workflow with real users and measurable
on-chain activity.

### Entry Requirement

The program emphasizes a live XRPL Mainnet application, real users, recurring
transactions, and sustainable ecosystem value. A direct copy of the Flare demo
would not be competitive.

### Next

- [ ] Register on Luma.
- [ ] Complete the manually reviewed project application.
- [ ] Confirm eligibility and acceptance.
- [ ] Define the XRPL-native user flow and required ledger primitives.
- [ ] Decide whether this is a RiskOracle extension or a separately branded product.
- [ ] Deploy a minimal Mainnet workflow.
- [ ] Recruit real users and track on-chain volume without self-dealing.
- [ ] Update the weekly leaderboard evidence through 2026-09-21.

## Not Pursuing

| Competition | Reason |
|---|---|
| Algorand Global x402 Challenge | Official rules exclude entrants resident in or physically located in China; do not register unless eligibility changes and is confirmed in writing. |
| CockroachDB x AWS Agentic Memory | Requires a major architecture pivot, has a crowded field, and offers lower strategic fit than the selected events. |
| Celo Agentic Payments and DeFAI | Strong technical fit, but the short submission window would distract from the P0 Flare and HackerNoon entries. Reconsider only if the deadline is extended materially. |

## Update Log

| Date | Competition | Update |
|---|---|---|
| 2026-07-23 | Portfolio | Created the central tracker and recorded five selected competitions. |
| 2026-07-23 | Flare Summer Signal | Product, README, video, contracts, and FDC proof ready; final contact step blocked by Telegram registration. |
| 2026-07-23 | HackerNoon Proof of Usefulness | Submission form progressed to the final contact step. |

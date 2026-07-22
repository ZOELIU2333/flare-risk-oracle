<div align="center">

![RiskOracle dashboard](docs/img/01-hero.png)

# RiskOracle

**Risk intelligence that reads what price cannot.**

A multi-AI risk oracle that combines Flare-native market data with event-aware AI,
then delivers an actionable collateral risk signal on-chain for DeFi protocols.

**Flare Summer Signal** | **Bounty 1: Interoperable Asset Products** | **Coston2**

[Working demo](#run-the-working-demo) | [Live oracle contract](https://coston2-explorer.flare.network/address/0x29D2567bbD5979426fadAdB8991C10dE267f4304) | [FDC proof transaction](https://coston2-explorer.flare.network/tx/0xe1aa6bf6d89a14422ce60af8646f8943676bcbc6de5c650a62ff3ea3268e69a7) | [Hackathon](https://dorahacks.io/hackathon/flaresummersignal/detail)

</div>

---

## Judge snapshot

| | |
|---|---|
| **Problem** | Price-only oracles react after the market moves. They cannot understand regulatory news, exchange incidents, or cross-asset contagion before those events reach price. |
| **Product** | RiskOracle turns Flare FTSO prices and unstructured event context into a 0-100 collateral risk score, a reason, and an on-chain timestamp. |
| **Target users** | Lending markets, insurance pools, and protocols using FXRP or other interoperable assets as collateral on Flare. |
| **Why Flare** | FTSO supplies native market data; FDC makes off-chain risk intelligence verifiable on-chain; FAssets/FXRP is the first concrete collateral use case. |
| **Working today** | XRP/BTC/ETH monitoring, Kimi K3 + DeepSeek consensus, live news-shock analysis, automatic Coston2 updates, chain-rebuilt history, and lending/insurance consumers. |
| **Built during the hackathon** | The AI engine, Flare integrations, contracts, protocol demos, backend, dashboard, and on-chain proof flow were built for Flare Summer Signal. |

RiskOracle is not another trading dashboard. It is a reusable **risk primitive**:
one interface that lets a protocol tighten collateral requirements, reprice
insurance, or pause new exposure before a price-only liquidation rule can react.

---

## The risk price has not shown yet

An investigation is announced. An exchange may halt an asset. A connected market
starts failing.

The price has not moved yet, so a traditional oracle still reports normal market
conditions. Lending remains open and insurance stays underpriced. When price
finally catches up, the protocol is already exposed.

![Price-only oracle compared with RiskOracle](docs/img/killer-diff.svg)

The built-in **News Shock Test** makes this gap visible. A judge can enter an
illustrative breaking-news event while the live FTSO price is unchanged and
compare the legacy response with the multi-AI risk response in real time.

---

## What is working

| Capability | Implementation | Verifiable result |
|---|---|---|
| **Flare-native prices** | [`server/ftso.js`](server/ftso.js) reads XRP/USD, BTC/USD, and ETH/USD directly from FTSOv2 through Flare's Contract Registry. | The dashboard uses on-chain FTSO values rather than a third-party price API. |
| **Independent AI opinions** | [`lib/providers/`](lib/providers) runs Kimi K3 and DeepSeek in parallel; [`lib/consensus.js`](lib/consensus.js) combines the results and exposes disagreement. | Each asset shows both model scores, reasons, consensus, and divergence. |
| **Event-aware risk** | [`risk-strategies/news-analysis.js`](risk-strategies/news-analysis.js) and `POST /api/news` analyze a user-supplied event against the current asset price. | The News Shock Test demonstrates risk moving before price. |
| **Continuous oracle loop** | [`server/index.js`](server/index.js) refreshes XRP/BTC/ETH; [`server/onchain.js`](server/onchain.js) automatically submits XRP risk updates. | [Coston2 events](https://coston2-explorer.flare.network/address/0x29D2567bbD5979426fadAdB8991C10dE267f4304) can be inspected independently. |
| **On-chain history** | `/api/onchain-history` reconstructs records from `RiskUpdated` event logs instead of trusting the app database. | Every returned record includes its transaction hash and block number. |
| **Protocol consumption** | [`IRiskOracle.sol`](contracts/IRiskOracle.sol) is consumed by [`MiniLending.sol`](contracts/MiniLending.sol) and [`InsurancePool.sol`](contracts/InsurancePool.sol). | One signal drives collateral ratios, lending suspension, insurance pricing, and underwriting suspension. |

<div align="center">

![Multi-AI consensus dashboard](docs/img/02-multi-ai.png)

</div>

---

## Architecture

![RiskOracle architecture](docs/img/how-it-works.svg)

1. **Source:** FTSOv2 provides native XRP, BTC, and ETH prices. A user or an
   upstream service can also provide an event such as regulatory or exchange news.
2. **Analyze:** Kimi K3 and DeepSeek independently produce multidimensional risk
   assessments. The consensus layer records agreement and becomes conservative
   when model divergence is material.
3. **Verify:** The risk result is frozen into deterministic JSON before FDC
   Web2Json attestation, then decoded and verified by `RiskOracleFdc` on Coston2.
4. **Consume:** Any contract implementing against `IRiskOracle` can act on the
   latest score without knowing which AI providers produced it.

### Two on-chain paths, stated precisely

RiskOracle separates proof of trust minimization from fast continuous operation:

| Path | Purpose | Current evidence |
|---|---|---|
| **FDC attestation path** | AI output is snapshotted at a deterministic JSON endpoint, attested through FDC Web2Json, verified by `FdcVerification`, decoded, and stored by `RiskOracleFdc`. | [RiskOracleFdc on Coston2](https://coston2-explorer.flare.network/address/0x48908a0246Db6E3B21E9c2CeDEc08c88F74Cf3Fb) and [successful proof transaction](https://coston2-explorer.flare.network/tx/0xe1aa6bf6d89a14422ce60af8646f8943676bcbc6de5c650a62ff3ea3268e69a7). |
| **Automatic demo path** | While the backend is running, the scheduler analyzes all three assets and owner-signs the latest XRP score to a lightweight oracle contract for rapid iteration and visible event history. | [Operational RiskOracle on Coston2](https://coston2-explorer.flare.network/address/0x29D2567bbD5979426fadAdB8991C10dE267f4304) and its `RiskUpdated` events. |

This distinction is deliberate and transparent. The complete FDC flow has been
proven end to end; the lightweight path keeps the hackathon demo responsive. The
production roadmap moves scheduled updates onto the FDC path by default.

### Why the deterministic snapshot matters

LLM output is non-deterministic, but FDC data providers must retrieve and agree
on identical response bytes. RiskOracle therefore separates **analysis** from
**attestation**: AI produces a result once, the result is frozen, and FDC attests
the immutable snapshot. Without that boundary, an AI-to-FDC pipeline cannot
reach reliable consensus.

---

## Flare integration

| Flare capability | How RiskOracle uses it | Product value |
|---|---|---|
| **FTSOv2** | Reads XRP/USD, BTC/USD, and ETH/USD feeds directly on Coston2. | Gives the AI engine a Flare-native, independently verifiable market baseline. |
| **FDC Web2Json** | Attests deterministic risk snapshots and verifies the proof inside `RiskOracleFdc`. | Bridges off-chain intelligence into a contract-readable signal without asking consumers to trust the dashboard. |
| **FAssets / FXRP** | Defines the first collateral use case; the lending demo models FXRP-backed borrowing and adjusts protection from the oracle score. | Adds a proactive risk layer around assets entering Flare DeFi without native smart-contract logic. |
| **Coston2** | Hosts both the FDC-verifying contract and the continuously updated demo oracle. | Makes the core claims inspectable through contracts, transactions, and event logs. |

RiskOracle goes beyond deploying an EVM contract on Flare: the data source,
off-chain-to-on-chain verification model, and target collateral market all depend
on Flare's native protocols.

---

## One oracle, multiple protocols

Both example protocols depend only on `IRiskOracle.getLatest()`:

```solidity
RiskData memory risk = riskOracle.getLatest();
```

| Risk state | Lending market | Insurance pool |
|---|---|---|
| **Low** | 150% collateral ratio; borrowing open | Low risk-adjusted premium; underwriting open |
| **High** | 250% collateral ratio | Premium rises linearly with risk |
| **Critical** | New borrowing suspended at score >= 80 | New underwriting suspended at score >= 90 |

This is the product's interoperability thesis: protocols do not integrate an AI
vendor. They integrate a stable on-chain interface and choose their own policy
thresholds.

---

## On-chain evidence

| Artifact | Coston2 evidence |
|---|---|
| Continuously updated demo oracle | [`0x29D2567bbD5979426fadAdB8991C10dE267f4304`](https://coston2-explorer.flare.network/address/0x29D2567bbD5979426fadAdB8991C10dE267f4304) |
| FDC-verifying oracle | [`0x48908a0246Db6E3B21E9c2CeDEc08c88F74Cf3Fb`](https://coston2-explorer.flare.network/address/0x48908a0246Db6E3B21E9c2CeDEc08c88F74Cf3Fb) |
| Successful FDC proof submission | [`0xe1aa6bf6...8e69a7`](https://coston2-explorer.flare.network/tx/0xe1aa6bf6d89a14422ce60af8646f8943676bcbc6de5c650a62ff3ea3268e69a7) |
| Network | Coston2 testnet, chain ID `114` |

![On-chain proof section](docs/img/04-onchain.png)

---

## Run the working demo

### Requirements

- Node.js 18 or newer
- A Moonshot API key for Kimi K3
- A DeepSeek API key
- Optional: a funded Coston2 test wallet to enable automatic score submission

### Start

```bash
npm install

cp .env.example .env
# Add MOONSHOT_API_KEY and DEEPSEEK_API_KEY.
# Add PRIVATE_KEY only when enabling Coston2 auto-push.

npm start
```

Open [http://localhost:8078](http://localhost:8078). The Express service hosts
both the dashboard and API. API credentials stay on the backend. Never commit
the populated `.env` file.

### Demo flow for judges

1. Switch between XRP, BTC, and ETH to inspect FTSO prices and multi-AI scores.
2. Enter an illustrative adverse headline in **News Shock Test** and compare the
   price-only response with RiskOracle's event-aware response.
3. Inspect each model's reasoning, consensus level, risk dimensions, and trend.
4. Open the Coston2 links in **On-chain proof** and verify the contract, latest
   transaction, and event-derived history.
5. Review how the same `IRiskOracle` signal changes lending and insurance policy.

### API surface

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Service and supported assets |
| `GET /api/price?asset=XRP` | Latest FTSOv2 price |
| `GET /api/risk?asset=XRP` | Cached multi-AI risk result |
| `GET /api/overview` | XRP/BTC/ETH summary |
| `POST /api/news` | Event-aware risk analysis |
| `POST /api/risk/refresh` | Trigger a background refresh |
| `GET /api/onchain-history` | History reconstructed from Coston2 events |

---

## Evidence of new work

RiskOracle was built as a new project during Flare Summer Signal. The work
completed for the hackathon includes:

- Direct FTSOv2 integration for three assets with RPC fallback.
- Kimi K3 and DeepSeek provider adapters, consensus, divergence handling, and
  stale-provider fallback.
- Market, cross-asset contagion, trend, and news-event analysis strategies.
- Deterministic snapshot architecture and an end-to-end FDC Web2Json proof flow.
- `IRiskOracle`, `RiskOracleFdc`, `MiniLending`, and `InsurancePool` contracts.
- Automatic Coston2 score updates and history rebuilt from contract events.
- A live backend API and interactive multi-asset dashboard.

No company code or proprietary dataset was used. AI inference uses public model
APIs; market data comes from Flare FTSO; the demo uses public/test data.

---

## Evaluation map

| Judging criterion | RiskOracle evidence |
|---|---|
| **Product usefulness** | Protects lending and insurance protocols from event risk that is invisible to price-only rules. |
| **Flare integration quality** | Native FTSOv2 reads, verified FDC Web2Json submission, Coston2 contracts, and an FXRP collateral use case. |
| **Technical execution** | Multi-provider consensus, deterministic FDC snapshots, RPC failover, background refresh, contract events, and protocol consumers. |
| **Evidence of new work** | The complete stack above was built during the hackathon and is traceable to source files and Coston2 artifacts. |
| **Clarity and future potential** | A narrow interface allows any Flare protocol to consume the signal and define its own risk policy. |

---

## Roadmap

1. Make FDC attestation the default path for every scheduled production update.
2. Bind the lending example to deployed FXRP token contracts and pilot the
   oracle with a Flare lending or insurance protocol.
3. Add signed data-source snapshots, more independent AI providers, and
   provider-performance weighting.
4. Publish an SDK, monitoring service, and governance process for risk-policy
   upgrades and model changes.

---

## Repository map

```text
frontend/index.html           Interactive dashboard and News Shock Test
server/index.js               API, scheduling, caching, and persistence
server/ftso.js                FTSOv2 reads for XRP, BTC, and ETH
server/onchain.js             Automatic updates and event-derived history
lib/providers/                Kimi K3 and DeepSeek adapters
lib/consensus.js              Multi-model consensus and divergence policy
risk-strategies/              Market, contagion, trend, and news prompts
contracts/IRiskOracle.sol     Stable protocol integration interface
contracts/RiskOracleFdc.sol   FDC Web2Json proof verification
contracts/MiniLending.sol     Risk-aware collateral and borrowing policy
contracts/InsurancePool.sol   Risk-aware pricing and underwriting policy
```

### Prototype disclosure

This is hackathon software, not audited production infrastructure. The FDC path
has been proven with a successful Coston2 transaction; the continuous demo path
currently uses an owner-signed update for speed. Production deployment requires
full scheduled FDC attestation, hardened snapshot hosting, contract audits, and
live FXRP integration.

<div align="center">

`Flare FTSO` | `FDC Web2Json` | `FAssets / FXRP` | `Solidity` | `Node.js` | `Kimi K3` | `DeepSeek`

**Because the most dangerous risk is the one an oracle cannot see.**

</div>

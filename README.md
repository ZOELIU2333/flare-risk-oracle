<div align="center">

![RiskOracle](docs/img/01-hero.png)

# RiskOracle

**Risk intelligence that reads what price can't.**

A multi-AI, on-chain risk oracle for Flare DeFi.
Built for **Flare Summer Signal** · Bounty 1 · Live on **Coston2**

[**▶ Live demo**](#) · [**Watch 60s walkthrough**](#) · [**Contract on Coston2**](https://coston2-explorer.flare.network/address/0x29D2567bbD5979426fadAdB8991C10dE267f4304)

</div>

---

<br/>

### It always happens the same way.

A headline drops. Not a price move — a *headline*.

*"Regulator opens investigation. Exchanges may halt trading."*

The price hasn't budged. So every oracle in DeFi reports the same thing:

**risk: low.**

Lending continues. Positions stay open. And by the time the price finally
catches up to the news, the liquidations have already happened.

**The gap between what the market knows and what the price shows — that's where DeFi bleeds.**

RiskOracle lives in that gap.

<br/>

---

## Reads what price can't

![Legacy vs AI](docs/img/killer-diff.svg)

RiskOracle scores how risky an asset is as DeFi collateral — not from price,
but from **AI that understands context**. News. Regulation. Cross-asset contagion.
The things a `if (price < x)` will never see.

Then it writes that score **on-chain**, where any protocol reads it in one line.

<br/>

## Three ideas, no compromise

**🧠 It reads the unreadable.**
A falling ETH quietly lifts XRP's collateral risk. The AI catches the contagion. A rule engine never could.

**🤝 It's a consensus, not a black box.**
Two independent models — **Kimi K3** and **DeepSeek** — score every asset in parallel. Agreement builds trust; divergence is itself a signal.

**⛓️ It's provable, not promised.**
Every score becomes an immutable on-chain event via Flare **FDC**. History is rebuilt from the chain, not from a database we ask you to trust.

<br/>

## How it works

![How it works](docs/img/how-it-works.svg)

<br/>

## Flare, all the way down

| | |
|---|---|
| **FTSO** | Native price feeds for XRP · BTC · ETH — the raw signal the AI reasons over. On-chain, no external price API. |
| **FDC** | Delivers the AI score on-chain with cryptographic attestation. The bridge from off-chain intelligence to on-chain truth. |
| **FAssets · FXRP** | The collateral we protect. RiskOracle makes Flare's "assets without smart contracts, now in DeFi" thesis *safe*. |

> *The detail that makes it real:* FDC validators must fetch the same URL and agree on identical bytes. AI output isn't deterministic — so each result is **snapshotted** before attestation. Getting this right is the line between a demo and a system.

<br/>

## See it live

<div align="center">

![Dashboard](docs/img/02-multi-ai.png)

*Two AI models score in parallel. Type any headline — watch the risk react before price does.*

</div>

<br/>

## One oracle, every protocol

Not an app — infrastructure. Two entirely different protocols, one `IRiskOracle` interface:

| AI risk | 🏦 Lending | 🛡️ Insurance |
|---|---|---|
| **Low** | 150% collateral · open | underwriting · low premium |
| **High** | 250% · tightened | repriced |
| **Critical** | suspended | declined |

<br/>

## Run it

```bash
npm install

# .env  (never commit)
PRIVATE_KEY=<coston2 test wallet>
MOONSHOT_API_KEY=<kimi>     MOONSHOT_MODEL=kimi-k3
DEEPSEEK_API_KEY=<deepseek> DEEPSEEK_MODEL=deepseek-chat

node server/index.js                          # backend  :8078
cd frontend && python3 -m http.server 8077    # frontend :8077
```

The backend scores all three assets on a cycle and pushes XRP's score on-chain each round. The frontend reads instantly.

<details>
<summary><b>Project structure</b></summary>

```
frontend/index.html   live dashboard · asset switch · multi-AI · news-shock test
server/
  index.js            API · orchestration · cache · persistence
  ftso.js             reads XRP/BTC/ETH from Flare FTSO
  onchain.js          auto-push scores · rebuild history from chain events
  rpc-pool.js         multi-RPC failover
lib/providers/        pluggable AI models — add a model = add a file
lib/consensus.js      fuses scores, weights by agreement
contracts/            RiskOracle · IRiskOracle · MiniLending · InsurancePool
```
</details>

<br/>

## Honest notes

Everything here was **built for this hackathon** — the Flare integration, the multi-AI engine, the on-chain auto-push, the two protocols, the dashboard. AI runs on **public LLM APIs**; all data is **public / test data**. No proprietary code, no shortcuts.

<br/>

<div align="center">

`Flare FTSO · FDC · FXRP`  ·  `Solidity`  ·  `Node`  ·  `Kimi K3`  ·  `DeepSeek`  ·  `Coston2`

**Because in DeFi, the most dangerous risk is the one your oracle can't see.**

</div>

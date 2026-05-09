# Jupiter Developer Experience Report

Project: Jupiter Signal Deck

Date: 2026-05-09

## Summary

I built a small read-only market signal dashboard using Jupiter's Developer Platform APIs from a local Codex environment. The app searches Solana tokens, pulls price/liquidity/trading metrics, ranks volatility/liquidity/flow signals, and turns the results into a suggested next action: observe, consider DCA, investigate a limit order, or avoid thin liquidity.

The best part of the experience was that keyless access on `api.jup.ag` made it possible to build immediately. I did not have to create a wallet, set up RPC, sign transactions, or store a secret before proving that the idea worked.

## What I Built

Jupiter Signal Deck is a Cloudflare Worker app with a static frontend and two proxy routes:

- `/api/search?query=...` calls `GET /tokens/v2/search`
- `/api/price?ids=...` calls `GET /price/v3`

The UI combines both responses so a builder can:

- search by token symbol, name, or mint
- compare token liquidity, market cap, holder count, and price change windows
- calculate a lightweight signal score from liquidity, short-term volatility, holder base, and buy/sell imbalance
- generate an execution note that maps the signal to Jupiter APIs such as Price, Tokens, Trigger, Recurring, and Swap

## Onboarding Time

Time from docs to first successful API call: under 10 minutes.

The fastest path was:

1. Read `https://dev.jup.ag/docs/llms.txt`.
2. Find the Tokens and Price endpoint summaries.
3. Test keyless requests with `curl`.
4. Build a Worker proxy around those endpoints.

The docs made this unusually agent-friendly because `llms.txt` starts with the practical facts an agent needs: base URL, endpoint list, keyless access, API-key header, and product boundaries.

## What Worked Well

Keyless access is excellent for prototyping. It let me test:

```bash
curl "https://api.jup.ag/tokens/v2/search?query=JUP"
curl "https://api.jup.ag/price/v3?ids=So11111111111111111111111111111111111111112"
```

The responses were clean JSON and easy to compose in a Worker without SDKs.

The Tokens API is especially useful because it contains more than metadata. The `stats5m`, `stats1h`, `stats6h`, and `stats24h` objects let a prototype produce useful signals without immediately adding a database or historical price storage.

The `llms.txt` file is genuinely helpful. It was easier to use than browsing docs page by page because it grouped APIs by product and stated where keyless access fits.

## Friction And Confusing Points

The docs sometimes say an API key is required, while the current `api.jup.ag` endpoints also support keyless access. That is a good feature, but it creates ambiguity:

- `llms.txt` says keyless access is available at 0.5 RPS.
- some guide pages and endpoint summaries say the `x-api-key` header is required.
- in practice, `GET /price/v3` and `GET /tokens/v2/search` worked keylessly during testing.

Recommendation: every endpoint page should have a small auth badge:

```text
Auth: keyless allowed for prototypes, API key recommended for production
Rate: keyless 0.5 RPS, Free key 1 RPS
```

Another friction point: the relationship between `developers.jup.ag`, `dev.jup.ag`, `api.jup.ag`, and `lite-api.jup.ag` is understandable after reading the portal docs, but it is a lot of domain context for a new builder. The migration story is clear, but the first 10 minutes would be smoother if every old/lite endpoint page had a direct "use this new endpoint instead" box.

## API Observations

The Tokens API was the most useful endpoint for this prototype because one response includes:

- token identity and mint
- icon/social links
- liquidity
- holder count
- market cap and FDV
- 5m/1h/6h/24h price and volume stats
- organic volume fields

That made it possible to build a credible signal score without fetching five other services.

The Price API did exactly what I expected: fast mint-to-price lookup. It also returns `priceChange24h`, which is useful when paired with Tokens API time windows.

## What I Wish Existed

1. A tiny "prototype headers" section on every endpoint page.

```text
No key:
curl "https://api.jup.ag/price/v3?ids=..."

With key:
curl "https://api.jup.ag/price/v3?ids=..." -H "x-api-key: $JUPITER_API_KEY"
```

2. A public "signal bundle" endpoint for multiple token mints.

For dashboards, agents often want price, liquidity, 24h change, verification status, organic score, and trading stats for a fixed watchlist. Tokens API gets close, but watchlist-by-mint examples would help.

3. A "dry run" mode for Trigger/Recurring examples.

Read-only builders can learn faster if they can generate a validated order preview without wallet signatures or order creation. This would help agents explain how they would route from signal to action before touching funds.

4. A first-party Worker/edge starter.

Jupiter APIs pair naturally with Cloudflare Workers, Vercel Functions, and other edge runtimes. A minimal proxy starter would help people avoid CORS and API-key exposure mistakes.

## AI Stack Feedback

The AI docs and `llms.txt` were the most useful pieces for Codex. I did not need the Jupiter CLI for this project because it is read-only and browser-facing, but the docs made it clear when the CLI becomes relevant: execution, wallet operations, and JSON-native agent flows.

The biggest improvement for agents would be an explicit "agent build path" per product:

```text
If you are building a read-only app: Tokens + Price, no wallet, optional key.
If you are building an execution app: CLI or Swap/Trigger APIs, wallet required.
If you are building a production app: portal key, rate-limit plan, proxy secret.
```

## How I Would Rebuild The Developer Platform Experience

I would make the landing page task-oriented instead of product-oriented:

- "Show token prices"
- "Search token metadata"
- "Preview a swap"
- "Create a limit order"
- "Build a DCA strategy"
- "Deposit into Lend"

Each path should show:

- keyless curl
- API-key curl
- minimal TypeScript
- expected response
- common failure mode
- next endpoint to call

This would get builders interfacing with APIs within seconds and reduce the mental jump from "Jupiter has many products" to "I know which request to send first."

## Bugs Or Gaps Found

I did not find a platform-breaking bug.

The main actionable gap is documentation consistency around keyless access versus API-key-required language. This matters because keyless access is a major advantage for prototyping, agents, and hackathon builders.

## Final Notes

The Developer Platform is unusually strong for agent-driven work because the APIs are REST/JSON, the docs expose `llms.txt`, and keyless access permits real experimentation before account setup. The fastest improvement would be making the keyless/prototype path more visible on each relevant API page.

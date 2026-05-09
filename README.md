# Jupiter Signal Deck

Jupiter Signal Deck is a small read-only market intelligence prototype for the Frontier/Jupiter Developer Platform bounty.

It uses Jupiter's keyless Developer Platform endpoints to search Solana tokens, fetch price/liquidity/trading stats, rank signal quality, and generate a plain-English execution plan that points builders toward relevant Jupiter APIs such as Price, Tokens, Trigger, Recurring, and Swap.

## Why This Exists

The bounty asks for a working project plus an honest developer experience report. This app is intentionally small: it tests how quickly an agent can go from Jupiter docs to a deployed, useful tool without wallet setup, private RPC infrastructure, or a paid API key.

## APIs Used

- `GET https://api.jup.ag/tokens/v2/search?query=...`
- `GET https://api.jup.ag/price/v3?ids=...`

The Worker proxies requests through `/api/search` and `/api/price` so the browser never needs to know whether the backend is using keyless access or an optional `JUPITER_API_KEY` secret.

## Local Development

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run deploy
```

Optional production secret:

```bash
wrangler secret put JUPITER_API_KEY
```

## Bounty Submission Links

- Live app: https://jupiter-signal-deck.adamsardo98.workers.dev
- Repo: https://github.com/adamsardo/jupiter-signal-deck
- DX report: [DX-REPORT.md](./DX-REPORT.md)

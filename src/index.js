const JUPITER_BASE = "https://api.jup.ag";

const TOKEN_PRESETS = [
  { symbol: "SOL", mint: "So11111111111111111111111111111111111111112" },
  { symbol: "JUP", mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
  { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
];

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type, x-api-key",
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(),
    },
  });
}

function htmlResponse(body) {
  return new Response(body, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=60",
    },
  });
}

function cleanQuery(value) {
  return (value || "").toString().trim().slice(0, 80);
}

function cleanIds(value) {
  return (value || "")
    .toString()
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 50)
    .join(",");
}

async function jupiterFetch(path, env) {
  const headers = {
    accept: "application/json",
    "user-agent": "jupiter-signal-deck/1.0",
  };
  if (env.JUPITER_API_KEY) headers["x-api-key"] = env.JUPITER_API_KEY;

  const response = await fetch(`${JUPITER_BASE}${path}`, { headers });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    return jsonResponse({ error: "Jupiter API request failed", status: response.status, data }, response.status);
  }
  return jsonResponse(data);
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });
  if (url.pathname === "/api/search") {
    const query = cleanQuery(url.searchParams.get("query"));
    if (!query) return jsonResponse({ error: "query is required" }, 400);
    return jupiterFetch(`/tokens/v2/search?query=${encodeURIComponent(query)}`, env);
  }
  if (url.pathname === "/api/price") {
    const ids = cleanIds(url.searchParams.get("ids"));
    if (!ids) return jsonResponse({ error: "ids is required" }, 400);
    return jupiterFetch(`/price/v3?ids=${encodeURIComponent(ids)}`, env);
  }
  if (url.pathname === "/api/presets") {
    return jsonResponse(TOKEN_PRESETS);
  }
  return jsonResponse({ error: "Not found" }, 404);
}

const page = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Jupiter Signal Deck</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #171717;
        --muted: #5f6670;
        --line: #dfe4ea;
        --wash: #f4f7f9;
        --paper: #fff;
        --accent: #0a7b61;
        --accent-2: #2455d6;
        --danger: #ad3434;
        --warn: #946200;
        --ok: #09734e;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        background: var(--wash);
        color: var(--ink);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.45;
      }

      .wrap {
        width: min(1180px, calc(100vw - 32px));
        margin: 0 auto;
      }

      header {
        background: var(--paper);
        border-bottom: 1px solid var(--line);
      }

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 24px;
        align-items: end;
        padding: 34px 0 24px;
      }

      h1 {
        margin: 0 0 8px;
        font-size: clamp(34px, 5vw, 60px);
        line-height: 0.98;
        letter-spacing: 0;
      }

      h2 { margin: 0 0 14px; font-size: 18px; }
      h3 { margin: 18px 0 8px; font-size: 15px; }
      p { margin: 0; color: var(--muted); }

      .badge {
        display: inline-flex;
        align-items: center;
        min-height: 32px;
        border: 1px solid #b9dacf;
        border-radius: 999px;
        background: #e3f5ee;
        color: #125942;
        padding: 4px 12px;
        font-size: 13px;
        font-weight: 800;
        white-space: nowrap;
      }

      main { padding: 22px 0 44px; }

      .grid {
        display: grid;
        grid-template-columns: 0.85fr 1.15fr;
        gap: 18px;
        align-items: start;
      }

      section {
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 18px;
      }

      .stack { display: grid; gap: 18px; }

      label {
        display: block;
        margin-bottom: 8px;
        font-size: 13px;
        font-weight: 800;
      }

      .search-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 10px;
      }

      input, button {
        min-height: 44px;
        border-radius: 8px;
        font: inherit;
      }

      input {
        width: 100%;
        border: 1px solid var(--line);
        padding: 0 12px;
        background: #fff;
      }

      button {
        border: 0;
        background: var(--ink);
        color: white;
        font-weight: 800;
        padding: 0 16px;
        cursor: pointer;
      }

      button.secondary {
        background: #edf1f4;
        color: var(--ink);
        border: 1px solid var(--line);
      }

      .preset-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }

      .token-list {
        display: grid;
        gap: 10px;
      }

      .token {
        display: grid;
        grid-template-columns: 40px 1fr auto;
        gap: 12px;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 10px;
        cursor: pointer;
      }

      .token:hover { border-color: #b6c2cf; background: #fbfcfd; }
      .token.selected { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(10, 123, 97, 0.12); }
      .token img { width: 40px; height: 40px; border-radius: 50%; background: #eef2f5; }
      .token b, .token span { display: block; }
      .token span, .small { color: var(--muted); font-size: 12px; }

      .metrics {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }

      .metric {
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 12px;
        background: #fbfcfd;
      }

      .metric small { display: block; color: var(--muted); margin-bottom: 6px; }
      .metric b { font-size: 22px; }

      .score {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 16px;
        align-items: center;
      }

      .dial {
        width: 112px;
        aspect-ratio: 1;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: conic-gradient(var(--accent) calc(var(--score) * 1%), #e7ecef 0);
      }

      .dial strong {
        width: 76px;
        aspect-ratio: 1;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: #fff;
        font-size: 24px;
      }

      .plan {
        border-left: 4px solid var(--accent);
        background: #f7fbf9;
        padding: 14px;
        border-radius: 6px;
      }

      pre {
        margin: 0;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        background: #101820;
        color: #f7fbff;
        border-radius: 8px;
        padding: 14px;
        font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }

      table { width: 100%; border-collapse: collapse; font-size: 14px; }
      th, td { padding: 9px 8px; border-top: 1px solid var(--line); text-align: left; }
      th { border-top: 0; color: var(--muted); }

      @media (max-width: 900px) {
        .hero, .grid, .metrics { grid-template-columns: 1fr; }
        .badge { width: fit-content; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="wrap hero">
        <div>
          <h1>Jupiter Signal Deck</h1>
          <p>Search Solana tokens, score live market signals, and turn Jupiter Price + Tokens data into an execution plan.</p>
        </div>
        <div class="badge">Keyless Jupiter prototype</div>
      </div>
    </header>

    <main class="wrap">
      <div class="grid">
        <div class="stack">
          <section>
            <h2>Token Search</h2>
            <label for="query">Symbol, name, or mint</label>
            <div class="search-row">
              <input id="query" value="JUP" autocomplete="off">
              <button id="search">Search</button>
            </div>
            <div class="preset-row" id="presets"></div>
          </section>

          <section>
            <h2>Results</h2>
            <div id="results" class="token-list"></div>
          </section>
        </div>

        <div class="stack">
          <section>
            <h2>Signal</h2>
            <div id="summary"><p>Search for a token to generate a signal deck.</p></div>
          </section>

          <section>
            <h2>Execution Plan</h2>
            <div id="plan" class="plan">Waiting for token data.</div>
          </section>

          <section>
            <h2>API Recipe</h2>
            <pre id="recipe">curl "https://api.jup.ag/tokens/v2/search?query=JUP"</pre>
          </section>
        </div>
      </div>
    </main>

    <script>
      const state = { tokens: [], selected: null, prices: {} };
      const $ = (id) => document.getElementById(id);
      const fmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
      const money = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 4 });

      function n(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      }

      function pct(value) {
        const parsed = n(value);
        const sign = parsed > 0 ? "+" : "";
        return sign + parsed.toFixed(2) + "%";
      }

      function compact(value) {
        const parsed = n(value);
        if (Math.abs(parsed) >= 1_000_000_000) return (parsed / 1_000_000_000).toFixed(2) + "B";
        if (Math.abs(parsed) >= 1_000_000) return (parsed / 1_000_000).toFixed(2) + "M";
        if (Math.abs(parsed) >= 1_000) return (parsed / 1_000).toFixed(1) + "K";
        return fmt.format(parsed);
      }

      function scoreToken(token) {
        const liquidity = Math.min(30, Math.log10(Math.max(n(token.liquidity), 1)) * 4);
        const holders = Math.min(20, Math.log10(Math.max(n(token.holderCount), 1)) * 3);
        const volatility = Math.min(25, Math.abs(n(token.stats1h?.priceChange)) * 3 + Math.abs(n(token.stats24h?.priceChange)));
        const flow = Math.min(25, Math.abs(n(token.stats1h?.buyVolume) - n(token.stats1h?.sellVolume)) / Math.max(n(token.stats1h?.buyVolume) + n(token.stats1h?.sellVolume), 1) * 80);
        return Math.round(Math.max(0, Math.min(100, liquidity + holders + volatility + flow)));
      }

      function recommendation(token, score) {
        const liquidity = n(token.liquidity);
        const oneHour = n(token.stats1h?.priceChange);
        const day = n(token.stats24h?.priceChange);
        if (liquidity < 50_000) return "Avoid automated execution for now: liquidity is thin. Use Tokens + Price for monitoring only.";
        if (score > 70 && oneHour > 0 && day > 0) return "Momentum signal: investigate a Trigger limit order or DCA entry plan, then verify route quality with Swap V2 before execution.";
        if (score > 55 && Math.abs(oneHour) > 2) return "Volatility signal: monitor with Price API and consider Trigger orders with explicit stop/take-profit boundaries.";
        if (score > 45) return "Watchlist signal: token has enough data to track. Recurring/DCA may fit better than one-shot execution.";
        return "Low-conviction signal: keep observing with Price + Tokens data before moving to execution APIs.";
      }

      async function api(path) {
        const response = await fetch(path);
        if (!response.ok) throw new Error(await response.text());
        return response.json();
      }

      async function loadPresets() {
        const presets = await api("/api/presets");
        $("presets").innerHTML = presets.map((item) => '<button class="secondary" data-query="' + item.symbol + '">' + item.symbol + '</button>').join("");
        $("presets").querySelectorAll("button").forEach((button) => {
          button.addEventListener("click", () => {
            $("query").value = button.dataset.query;
            search();
          });
        });
      }

      async function search() {
        const query = $("query").value.trim();
        if (!query) return;
        $("results").innerHTML = "<p>Searching Jupiter...</p>";
        $("recipe").textContent = 'curl "https://api.jup.ag/tokens/v2/search?query=' + encodeURIComponent(query) + '"';
        state.tokens = await api("/api/search?query=" + encodeURIComponent(query));
        renderResults();
        if (state.tokens[0]) selectToken(state.tokens[0].id);
      }

      function renderResults() {
        $("results").innerHTML = state.tokens.slice(0, 10).map((token) => {
          return '<article class="token" data-id="' + token.id + '">' +
            '<img src="' + (token.icon || "") + '" alt="">' +
            '<div><b>' + token.symbol + " · " + token.name + '</b><span>' + token.id + '</span></div>' +
            '<div><b>' + money.format(n(token.usdPrice)) + '</b><span>' + pct(token.stats24h?.priceChange) + ' 24h</span></div>' +
          '</article>';
        }).join("") || "<p>No tokens found.</p>";
        $("results").querySelectorAll(".token").forEach((row) => row.addEventListener("click", () => selectToken(row.dataset.id)));
      }

      async function selectToken(id) {
        state.selected = state.tokens.find((token) => token.id === id);
        document.querySelectorAll(".token").forEach((row) => row.classList.toggle("selected", row.dataset.id === id));
        if (!state.selected) return;
        state.prices = await api("/api/price?ids=" + encodeURIComponent(id));
        renderSignal();
      }

      function renderSignal() {
        const token = state.selected;
        const price = state.prices[token.id] || {};
        const score = scoreToken(token);
        $("summary").innerHTML = '<div class="score">' +
          '<div class="dial" style="--score:' + score + '"><strong>' + score + '</strong></div>' +
          '<div><h3>' + token.name + ' (' + token.symbol + ')</h3><p>' + token.id + '</p></div>' +
        '</div>' +
        '<div class="metrics" style="margin-top:16px">' +
          metric("Price", money.format(n(price.usdPrice || token.usdPrice))) +
          metric("Liquidity", "$" + compact(token.liquidity)) +
          metric("1h change", pct(token.stats1h?.priceChange)) +
          metric("24h change", pct(price.priceChange24h ?? token.stats24h?.priceChange)) +
        '</div>' +
        '<h3>Flow Snapshot</h3>' +
        '<table><tr><th>Window</th><th>Buys</th><th>Sells</th><th>Volume Δ</th><th>Price Δ</th></tr>' +
          row("5m", token.stats5m) + row("1h", token.stats1h) + row("6h", token.stats6h) + row("24h", token.stats24h) +
        '</table>';
        $("plan").textContent = recommendation(token, score);
        $("recipe").textContent =
          'curl "https://api.jup.ag/tokens/v2/search?query=' + encodeURIComponent(token.symbol) + '"\\n' +
          'curl "https://api.jup.ag/price/v3?ids=' + token.id + '"\\n\\n' +
          'Next execution APIs to inspect:\\n' +
          '- Trigger: POST /trigger/v2/orders/price for bounded limit order logic\\n' +
          '- Recurring: POST /recurring/v1/createOrder for DCA strategies\\n' +
          '- Swap V2: GET /swap/v2/order for managed execution quotes';
      }

      function metric(label, value) {
        return '<div class="metric"><small>' + label + '</small><b>' + value + '</b></div>';
      }

      function row(label, stats = {}) {
        return '<tr><td>' + label + '</td><td>' + compact(stats.numBuys) + '</td><td>' + compact(stats.numSells) + '</td><td>' + pct(stats.volumeChange) + '</td><td>' + pct(stats.priceChange) + '</td></tr>';
      }

      $("search").addEventListener("click", search);
      $("query").addEventListener("keydown", (event) => {
        if (event.key === "Enter") search();
      });
      loadPresets().then(search).catch((error) => {
        $("summary").innerHTML = "<p>" + error.message + "</p>";
      });
    </script>
  </body>
</html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env);
    return htmlResponse(page);
  },
};

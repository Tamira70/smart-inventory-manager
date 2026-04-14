import "./style.css";

type Coin = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number | null;
};

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root #app nicht gefunden.");
}

let coins: Coin[] = [];
let search = "";

const formatLargeNumber = (value: number): string => {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)} Bio.`;
  }
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)} Mrd.`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)} Mio.`;
  }
  return value.toLocaleString("de-DE");
};

const getFilteredCoins = (): Coin[] => {
  const query = search.trim().toLowerCase();

  return coins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(query) ||
      coin.symbol.toLowerCase().includes(query)
  );
};

const render = (loading = false, error = "") => {
  const filteredCoins = getFilteredCoins();

  const positiveCoins = coins.filter(
    (coin) => (coin.price_change_percentage_24h ?? 0) > 0
  ).length;

  const totalMarketCap = coins.reduce(
    (sum, coin) => sum + coin.market_cap,
    0
  );

  app.innerHTML = `
    <div class="page">
      <div class="container">
        <header class="header">
          <p class="eyebrow">Portfolio Project</p>
          <h1 class="title">📊 Market Pulse Dashboard</h1>
          <p class="subtitle">
          Modernes Krypto-Dashboard mit Live-Daten, Suchfunktion und klarer Portfolio-Präsentation.
        </p>
        </header>

        <section class="stats-grid">
          <div class="stat-card">
            <div class="stat-title">Coins geladen</div>
            <div class="stat-value">${coins.length}</div>
          </div>

          <div class="stat-card">
            <div class="stat-title">Positive 24h Entwicklung</div>
            <div class="stat-value">${positiveCoins}</div>
          </div>

          <div class="stat-card">
            <div class="stat-title">Gesamte Marktkapitalisierung</div>
            <div class="stat-value">€${formatLargeNumber(totalMarketCap)}</div>
          </div>
        </section>

        <section class="section">
          <h2 class="section-title">Suche</h2>
          <input
            id="search-input"
            class="input"
            type="text"
            placeholder="Suche nach Coin oder Symbol"
            value="${search}"
          />
        </section>

        ${
          loading
            ? `<p class="info-text">Lade Coins...</p>`
            : error
            ? `<p class="error-box">${error}</p>`
            : filteredCoins.length === 0
            ? `<p class="info-text">Keine Coins gefunden.</p>`
            : `
              <section class="coins-grid">
                ${filteredCoins
                  .map((coin) => {
                    const change24h = coin.price_change_percentage_24h ?? 0;
                    const isPositive = change24h >= 0;

                    return `
                      <article class="coin-card">
                        <div class="coin-head">
                          <img
                            src="${coin.image}"
                            alt="${coin.name}"
                            class="coin-image"
                          />
                          <div>
                            <h3 class="coin-name">${coin.name}</h3>
                            <p class="coin-symbol">${coin.symbol.toUpperCase()}</p>
                          </div>
                        </div>

                        <div class="coin-body">
                          <div>Preis: €${coin.current_price.toLocaleString("de-DE")}</div>
                          <div>Market Cap: €${formatLargeNumber(coin.market_cap)}</div>
                          <div class="${isPositive ? "positive" : "negative"}">
                            24h: ${change24h.toFixed(2)}%
                          </div>
                        </div>
                      </article>
                    `;
                  })
                  .join("")}
              </section>
            `
        }
      </div>
    </div>
  `;

  const searchInput = document.querySelector<HTMLInputElement>("#search-input");

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      search = (event.target as HTMLInputElement).value;
      render(false, error);
    });
  }
};

const loadCoins = async () => {
  try {
    render(true);

    const response = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=12&page=1&sparkline=false"
    );

    if (!response.ok) {
      throw new Error("API konnte nicht geladen werden.");
    }

    coins = (await response.json()) as Coin[];
    render(false);
  } catch (err) {
    render(false, err instanceof Error ? err.message : "Unbekannter Fehler.");
  }
};

loadCoins();
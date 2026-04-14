import { useEffect, useMemo, useState } from "react";

type Coin = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
};

function App() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadCoins = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=12&page=1&sparkline=false"
        );

        if (!response.ok) {
          throw new Error("API konnte nicht geladen werden.");
        }

        const data = (await response.json()) as Coin[];
        setCoins(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unbekannter Fehler beim Laden."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCoins();
  }, []);

  const filteredCoins = useMemo(() => {
    const query = search.trim().toLowerCase();

    return coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(query) ||
        coin.symbol.toLowerCase().includes(query)
    );
  }, [coins, search]);

  const totalMarketCap = useMemo(() => {
    return coins.reduce((sum, coin) => sum + coin.market_cap, 0);
  }, [coins]);

  const positiveCoins = useMemo(() => {
    return coins.filter((coin) => coin.price_change_percentage_24h > 0).length;
  }, [coins]);

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Portfolio Project</p>
            <h1 style={titleStyle}>📊 Crypto Dashboard</h1>
            <p style={subtitleStyle}>
              React + TypeScript Dashboard mit Live-Daten aus einer öffentlichen
              API.
            </p>
          </div>
        </header>

        <section style={statsGridStyle}>
          <StatCard title="Coins geladen" value={String(coins.length)} />
          <StatCard
            title="Positive 24h Entwicklung"
            value={String(positiveCoins)}
          />
          <StatCard
            title="Gesamte Marktkapitalisierung"
            value={`€${formatLargeNumber(totalMarketCap)}`}
          />
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Suche</h2>
          <input
            type="text"
            placeholder="Suche nach Coin oder Symbol"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
          />
        </section>

        {loading && <p>Lade Coins...</p>}
        {error && <p style={errorStyle}>{error}</p>}

        {!loading && !error && filteredCoins.length === 0 && (
          <p>Keine Coins gefunden.</p>
        )}

        {!loading && !error && filteredCoins.length > 0 && (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredCoins.map((coin) => {
              const isPositive = coin.price_change_percentage_24h >= 0;

              return (
                <article key={coin.id} style={cardStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <img
                      src={coin.image}
                      alt={coin.name}
                      style={{ width: "40px", height: "40px" }}
                    />
                    <div>
                      <h3 style={{ margin: 0, color: "#f8fafc" }}>{coin.name}</h3>
                      <p style={{ margin: "4px 0 0 0", color: "#94a3b8" }}>
                        {coin.symbol.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: "16px", color: "#cbd5e1", lineHeight: 1.7 }}>
                    <div>Preis: €{coin.current_price.toLocaleString("de-DE")}</div>
                    <div>
                      Market Cap: €{formatLargeNumber(coin.market_cap)}
                    </div>
                    <div
                      style={{
                        color: isPositive ? "#86efac" : "#fca5a5",
                        fontWeight: 700,
                      }}
                    >
                      24h: {coin.price_change_percentage_24h.toFixed(2)}%
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={statCardStyle}>
      <div style={{ color: "#94a3b8", marginBottom: "8px" }}>{title}</div>
      <div style={{ color: "#f8fafc", fontSize: "1.8rem", fontWeight: 700 }}>
        {value}
      </div>
    </div>
  );
}

function formatLargeNumber(value: number): string {
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
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg, #0f172a 0%, #111827 45%, #0b1120 100%)",
  color: "#e5e7eb",
  padding: "32px 20px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle: React.CSSProperties = {
  maxWidth: "1180px",
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  marginBottom: "28px",
};

const eyebrowStyle: React.CSSProperties = {
  margin: "0 0 10px 0",
  color: "#93c5fd",
  fontSize: "0.95rem",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "2.5rem",
  lineHeight: 1.1,
  color: "#f5f7fa",
};

const subtitleStyle: React.CSSProperties = {
  marginTop: "12px",
  color: "#cbd5e1",
  maxWidth: "760px",
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginBottom: "28px",
};

const statCardStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.8)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
};

const sectionStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.8)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  marginBottom: "28px",
};

const sectionTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: "18px",
  color: "#8cbfd6",
  fontSize: "1.5rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  background: "rgba(15, 23, 42, 0.72)",
  color: "#f8fafc",
  outline: "none",
  boxSizing: "border-box",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.78)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "20px",
  padding: "18px",
  boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
};

const errorStyle: React.CSSProperties = {
  color: "#f87474",
  background: "rgba(127, 29, 29, 0.18)",
  border: "1px solid rgba(248, 113, 113, 0.25)",
  borderRadius: "10px",
  padding: "10px 12px",
  marginBottom: "16px",
};

export default App;
import { type FormEvent, useState } from "react";
import { saveTokens, setUser } from "./auth";

type LoginFormProps = {
  onLoginSuccess: () => void;
};

function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/inventory-api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login fehlgeschlagen.");
      }

      if (!data.access || !data.refresh) {
        throw new Error("Ungültige Serverantwort.");
      }

      saveTokens(data.access, data.refresh);
      setUser(data.user);
      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  const fillRecruiterDemo = () => {
    setUsername("recruiter");
    setPassword("demo123!");
    setError("");
  };

  const fillLagerDemo = () => {
    setUsername("lager-demo");
    setPassword("demo123!");
    setError("");
  };

  return (
    <div
      style={{
        maxWidth: "420px",
        margin: "80px auto",
        padding: "24px",
        borderRadius: "18px",
        background: "rgba(15, 23, 42, 0.9)",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Login</h2>
      <p>Bitte mit deinem Backend-User anmelden.</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
        <input
          type="text"
          placeholder="Benutzername"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Anmelden..." : "Einloggen"}
        </button>
      </form>

      <div style={{ marginTop: "18px", display: "grid", gap: "10px" }}>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          Demo-Zugänge
        </p>

        <button
          type="button"
          onClick={fillRecruiterDemo}
          style={secondaryButtonStyle}
        >
          🔍 Recruiter-Demo laden
        </button>

        <button
          type="button"
          onClick={fillLagerDemo}
          style={secondaryButtonStyle}
        >
          📦 Lager-Demo laden
        </button>
      </div>

      <div
        style={{
          marginTop: "16px",
          fontSize: "14px",
          color: "#94a3b8",
          lineHeight: 1.5,
        }}
      >
        <p style={{ margin: "0 0 6px 0" }}>
          <strong>Recruiter:</strong> Nur Lesezugriff
        </p>
        <p style={{ margin: 0 }}>
          <strong>Lager-Demo:</strong> Testzugang für Buchungen und Produkte
        </p>
      </div>

      {error && <p style={{ color: "#fca5a5", marginTop: "12px" }}>{error}</p>}
    </div>
  );
}

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

const buttonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "12px",
  padding: "12px 16px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 600,
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.25)",
  borderRadius: "12px",
  padding: "10px 14px",
  background: "rgba(30, 41, 59, 0.9)",
  color: "#e5e7eb",
  cursor: "pointer",
  fontWeight: 500,
};

export default LoginForm;
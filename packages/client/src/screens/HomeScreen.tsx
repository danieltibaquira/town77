import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export function HomeScreen() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();

  return (
    <main
      data-testid="home-screen"
      style={{
        alignItems: "center",
        background: "var(--color-surface-bg)",
        backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.08) 0%, transparent 60%)",
        color: "var(--color-text-primary)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-xl)",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "var(--space-xl)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            color: "var(--color-text-accent)",
            fontFamily: "var(--font-display)",
            fontSize: "clamp(48px, 10vw, 80px)",
            fontWeight: 900,
            letterSpacing: "0.05em",
            margin: 0,
            textShadow: "0 0 40px rgba(245, 158, 11, 0.3)",
          }}
        >
          Town 77
        </h1>
        <p style={{ 
          color: "var(--color-text-secondary)", 
          fontSize: "var(--text-lg)", 
          marginTop: "var(--space-sm)",
          letterSpacing: "0.1em",
          textTransform: "uppercase"
        }}>
          Board Game
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)", width: "100%", maxWidth: 400 }}>
        <button
          type="button"
          data-testid="btn-create"
          onClick={() => navigate("/config")}
          style={{
            background: "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)",
            borderRadius: "var(--radius-lg)",
            border: "none",
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3), 0 0 20px rgba(245, 158, 11, 0.15)",
            color: "#020617",
            cursor: "pointer",
            fontSize: "var(--text-lg)",
            fontWeight: 700,
            letterSpacing: "0.05em",
            minHeight: 56,
            padding: "var(--space-md) var(--space-xl)",
            transition: "transform 0.15s ease-out, box-shadow 0.15s ease-out",
          }}
        >
          {t("create_room")}
        </button>
        <button
          type="button"
          data-testid="btn-join"
          onClick={() => navigate("/join")}
          style={{
            background: "var(--color-surface-grid)",
            border: "2px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "var(--radius-lg)",
            color: "var(--color-text-accent)",
            cursor: "pointer",
            fontSize: "var(--text-base)",
            fontWeight: 600,
            letterSpacing: "0.05em",
            minHeight: 48,
            padding: "var(--space-sm) var(--space-xl)",
            transition: "all 0.15s ease-out",
          }}
        >
          {t("join")}
        </button>
      </div>
    </main>
  );
}

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../lib/theme";
import { getThemeById } from "../themes";

export function HomeScreen() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isNeo = theme.style === "neobrutalism";
  const neoRadius = theme.styleProps.borderRadius;

  function cycleTheme() {
    const order = ["town77", "playful-pastel", "neobrutalism"];
    const idx = order.indexOf(theme.id);
    const next = order[(idx + 1) % order.length];
    setTheme(getThemeById(next as any));
  }

  return (
    <main
      data-testid="home-screen"
      style={{
        alignItems: "center",
        background: isNeo ? theme.surfaces.background : "var(--color-surface-bg)",
        backgroundImage: isNeo ? "none" : "radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.08) 0%, transparent 60%)",
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
            color: isNeo ? "#ff6b6b" : "var(--color-text-accent)",
            fontFamily: "var(--font-display)",
            fontSize: "clamp(48px, 10vw, 80px)",
            fontWeight: 900,
            letterSpacing: isNeo ? "-0.02em" : "0.05em",
            margin: 0,
            textShadow: isNeo ? "none" : "0 0 40px rgba(245, 158, 11, 0.3)",
            WebkitTextStroke: isNeo ? "2px #000000" : "none",
          }}
        >
          Town 77
        </h1>
        <p style={{ 
          color: "var(--color-text-secondary)", 
          fontSize: "var(--text-lg)", 
          marginTop: "var(--space-sm)",
          letterSpacing: isNeo ? "0.02em" : "0.1em",
          textTransform: "uppercase",
          fontWeight: isNeo ? 900 : 400,
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
            background: isNeo ? "#ffe66d" : "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)",
            borderRadius: isNeo ? `${neoRadius}px` : "var(--radius-lg)",
            border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : "none",
            boxShadow: isNeo
              ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}`
              : "0 4px 12px rgba(245, 158, 11, 0.3), 0 0 20px rgba(245, 158, 11, 0.15)",
            color: isNeo ? "#000000" : "#020617",
            cursor: "pointer",
            fontSize: "var(--text-lg)",
            fontWeight: 700,
            letterSpacing: isNeo ? "0.02em" : "0.05em",
            minHeight: 56,
            padding: "var(--space-md) var(--space-xl)",
            transition: isNeo ? "var(--neo-transition)" : "transform 0.15s ease-out, box-shadow 0.15s ease-out",
          }}
        >
          {t("create_room")}
        </button>
        <button
          type="button"
          data-testid="btn-join"
          onClick={() => navigate("/join")}
          style={{
            background: isNeo ? "#ffffff" : "var(--color-surface-grid)",
            border: isNeo
              ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}`
              : "2px solid rgba(245, 158, 11, 0.3)",
            borderRadius: isNeo ? `${neoRadius}px` : "var(--radius-lg)",
            boxShadow: isNeo ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}` : "none",
            color: isNeo ? "#000000" : "var(--color-text-accent)",
            cursor: "pointer",
            fontSize: "var(--text-base)",
            fontWeight: 600,
            letterSpacing: isNeo ? "0.02em" : "0.05em",
            minHeight: 48,
            padding: "var(--space-sm) var(--space-xl)",
            transition: isNeo ? "var(--neo-transition)" : "all 0.15s ease-out",
          }}
        >
          {t("join")}
        </button>
      </div>

      <button
        type="button"
        data-testid="btn-toggle-theme"
        onClick={cycleTheme}
        style={{
          background: "transparent",
          border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : "1px solid var(--color-surface-cell-hover)",
          borderRadius: isNeo ? `${neoRadius}px` : "var(--radius-pill)",
          boxShadow: isNeo ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}` : "none",
          color: "var(--color-text-secondary)",
          cursor: "pointer",
          fontSize: "var(--text-sm)",
          padding: "var(--space-xs) var(--space-md)",
          transition: isNeo ? "var(--neo-transition)" : "all 0.15s ease-out",
        }}
      >
        {theme.name} Theme
      </button>
    </main>
  );
}

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
        color: "var(--color-text-primary)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-lg)",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "var(--space-xl)",
      }}
    >
      <h1
        style={{
          color: "var(--color-text-primary)",
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-display)",
          fontWeight: 700,
          letterSpacing: 0,
        }}
      >
        Town 77
      </h1>
      <button
        type="button"
        data-testid="btn-create"
        onClick={() => navigate("/config")}
        style={{
          background: "var(--color-text-accent)",
          borderRadius: "var(--radius-lg)",
          color: "#111111",
          fontSize: "var(--text-lg)",
          fontWeight: 700,
          minHeight: 52,
          padding: "var(--space-md) var(--space-xl)",
        }}
      >
        {t("create_room")}
      </button>
      <button
        type="button"
        data-testid="btn-join"
        onClick={() => navigate("/join")}
        style={{
          background: "var(--color-surface-cell)",
          borderRadius: "var(--radius-lg)",
          color: "var(--color-text-primary)",
          fontSize: "var(--text-base)",
          minHeight: 44,
          padding: "var(--space-sm) var(--space-xl)",
        }}
      >
        {t("join")}
      </button>
    </main>
  );
}

import { Suspense, useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { BrowserRouter } from "react-router-dom";
import { useGameConnection } from "./hooks/useGameConnection";
import i18n from "./lib/i18n";
import { injectTokens, ThemeContext } from "./lib/theme";
import { AppRouter } from "./router";
import "./styles/reset.css";
import "./styles/tokens.css";
import "./styles/animations.css";
import { getThemeByIdSafe, type ThemeId } from "./themes";
import { useGameStore } from "./store/gameStore";

const THEME_STORAGE_KEY = "town77-theme";

function getStoredThemeId(): ThemeId {
  if (typeof localStorage === "undefined") return "neobrutalism";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return (stored as ThemeId) || "neobrutalism";
}

function GameConnectionProvider({ children }: { children: React.ReactNode }) {
  useGameConnection();
  return <>{children}</>;
}

export function App() {
  const [theme, setTheme] = useState(() => getThemeByIdSafe(getStoredThemeId()));
  const gameState = useGameStore((s) => s.gameState);

  useEffect(() => {
    injectTokens(theme);
  }, [theme]);

  // Persist theme choice to localStorage
  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, theme.id);
    }
  }, [theme.id]);

  // Sync theme from room state when joining a room (host's theme propagates)
  useEffect(() => {
    if (gameState?.themeId) {
      const roomTheme = getThemeByIdSafe(gameState.themeId);
      if (roomTheme.id !== theme.id) {
        setTheme(roomTheme);
      }
    }
  }, [gameState?.themeId]);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <GameConnectionProvider>
            <Suspense fallback={<div style={{ background: "var(--color-surface-bg)", minHeight: "100vh" }} />}>
              <AppRouter />
            </Suspense>
          </GameConnectionProvider>
        </BrowserRouter>
      </ThemeContext.Provider>
    </I18nextProvider>
  );
}

import type { Theme } from "@town77/shared-types";
import { Suspense, useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { BrowserRouter } from "react-router-dom";
import i18n from "./lib/i18n";
import { injectTokens, ThemeContext } from "./lib/theme";
import { AppRouter } from "./router";
import "./styles/reset.css";
import "./styles/tokens.css";
import { town77Theme } from "./themes/town77";

export function App() {
  const [theme, setTheme] = useState<Theme>(town77Theme);

  useEffect(() => {
    injectTokens(theme);
  }, [theme]);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <Suspense
            fallback={
              <div
                style={{
                  background: "var(--color-surface-bg)",
                  minHeight: "100vh",
                }}
              />
            }
          >
            <AppRouter />
          </Suspense>
        </BrowserRouter>
      </ThemeContext.Provider>
    </I18nextProvider>
  );
}

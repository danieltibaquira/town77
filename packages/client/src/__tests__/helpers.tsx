import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import i18n from "../lib/i18n";
import { ThemeContext } from "../lib/theme";
import { getThemeById } from "../themes";

export function renderWithTheme(ui: ReactElement, options?: RenderOptions): RenderResult {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <ThemeContext.Provider value={{ theme: getThemeById("neobrutalism"), setTheme: () => {} }}>
          {ui}
        </ThemeContext.Provider>
      </I18nextProvider>
    </MemoryRouter>,
    options,
  );
}

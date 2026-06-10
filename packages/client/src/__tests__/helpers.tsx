import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../lib/i18n";
import { ThemeContext } from "../lib/theme";
import { getThemeById } from "../themes";

export function renderWithTheme(ui: ReactElement, options?: RenderOptions): RenderResult {
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeContext.Provider value={{ theme: getThemeById("town77"), setTheme: () => {} }}>
        {ui}
      </ThemeContext.Provider>
    </I18nextProvider>,
    options,
  );
}

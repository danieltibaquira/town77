import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { ThemeContext } from "../lib/theme";
import { town77Theme } from "../themes/town77";

export function renderWithTheme(ui: ReactElement, options?: RenderOptions): RenderResult {
  return render(
    <ThemeContext.Provider value={{ theme: town77Theme, setTheme: () => {} }}>
      {ui}
    </ThemeContext.Provider>,
    options,
  );
}

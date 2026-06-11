import { beforeAll, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { ActionBar } from "../components/ActionBar";
import i18n from "../lib/i18n";
import { renderWithTheme } from "./helpers";

describe("ActionBar variants", () => {
  beforeAll(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders English labels via i18n", () => {
    renderWithTheme(
      <ActionBar canExchange canDiscard onExchange={() => {}} onDiscard={() => {}} />,
    );
    expect(screen.getByTestId("btn-exchange")).toHaveTextContent("Exchange");
    expect(screen.getByTestId("btn-discard")).toHaveTextContent("Discard");
  });

  it("ghost variant sets data-variant ghost", () => {
    renderWithTheme(
      <ActionBar
        canExchange
        canDiscard
        variant="ghost"
        onExchange={() => {}}
        onDiscard={() => {}}
      />,
    );
    expect(screen.getByTestId("btn-exchange")).toHaveAttribute("data-variant", "ghost");
  });

  it("sm size sets data-size sm", () => {
    renderWithTheme(
      <ActionBar canExchange canDiscard size="sm" onExchange={() => {}} onDiscard={() => {}} />,
    );
    expect(screen.getByTestId("btn-exchange")).toHaveAttribute("data-size", "sm");
  });
});

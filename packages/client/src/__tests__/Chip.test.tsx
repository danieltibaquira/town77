import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Chip } from "../components/Chip";
import { renderWithTheme } from "./helpers";

describe("Chip", () => {
  const chip = { color: "color-1", shape: "cottage" };

  it("renders with data-testid", () => {
    renderWithTheme(<Chip chip={chip} isSelected={false} isValid={true} />);
    expect(screen.getByTestId("chip-color-1-cottage")).toBeInTheDocument();
  });

  it("renders an SVG element", () => {
    renderWithTheme(<Chip chip={chip} isSelected={false} isValid={true} />);
    expect(screen.getByTestId("chip-color-1-cottage").querySelector("svg")).not.toBeNull();
  });

  it("sets data-selected=true when isSelected", () => {
    renderWithTheme(<Chip chip={chip} isSelected={true} isValid={true} />);
    expect(screen.getByTestId("chip-color-1-cottage")).toHaveAttribute("data-selected", "true");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    renderWithTheme(<Chip chip={chip} isSelected={false} isValid={true} onClick={onClick} />);
    fireEvent.click(screen.getByTestId("chip-color-1-cottage"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders without throwing for unknown color", () => {
    expect(() =>
      renderWithTheme(
        <Chip chip={{ color: "color-99", shape: "cottage" }} isSelected={false} isValid={true} />,
      ),
    ).not.toThrow();
  });
});

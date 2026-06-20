import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../App";

describe("App", () => {
  it("renders the home screen at root", () => {
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(screen.getByTestId("home-screen")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Town 77" })).toBeTruthy();
  });

  it("does not render a join button on the home screen", () => {
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(screen.queryByTestId("btn-join")).toBeNull();
  });
});

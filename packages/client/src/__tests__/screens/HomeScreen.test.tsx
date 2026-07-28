import { describe, beforeEach, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "../helpers";
import { HomeScreen } from "../../screens/HomeScreen";

const createRoom = vi.fn();
const joinRoom = vi.fn();
const standardGameConfig = {
  grid: { rows: 7, cols: 7 },
  chips: {
    colors: ["color-1", "color-2", "color-3", "color-4", "color-5", "color-6", "color-7"],
    shapes: ["cottage", "rowhouse", "tower", "victorian", "barn", "bungalow", "skyscraper"],
    copies: 1,
  },
  handSize: 4,
  scoring: { placedWeight: 1, remainingWeight: 1 },
  exchange: { min: 3, max: 4 },
};

vi.mock("../../store/gameStore", () => ({
  useGameStore: vi.fn((selector: (state: { createRoom: typeof createRoom; joinRoom: typeof joinRoom }) => unknown) =>
    selector({ createRoom, joinRoom }),
  ),
}));

describe("HomeScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("creates a standard neobrutalism room directly from home", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HomeScreen />);

    await user.click(screen.getByTestId("btn-create"));

    expect(createRoom).toHaveBeenCalledWith(standardGameConfig, "neobrutalism", expect.any(String));
  });

  it("enables joining only after a room code is entered", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HomeScreen />);

    expect(screen.getByTestId("btn-join-room")).toBeDisabled();
    await user.type(screen.getByTestId("input-room-code"), "abc123");
    expect(screen.getByTestId("btn-join-room")).toBeEnabled();
  });

  it("joins with an uppercased room code from home", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HomeScreen />);

    await user.type(screen.getByTestId("input-room-code"), "abc123");
    await user.click(screen.getByTestId("btn-join-room"));

    expect(joinRoom).toHaveBeenCalledWith("ABC123", expect.any(String));
  });
});

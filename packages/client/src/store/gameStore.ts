import type { Chip, CreateRoomPayload, ErrorPayload, GameConfig, GameOverPayload, GameState, JoinRoomPayload } from "@town77/shared-types";
import { create } from "zustand";
import { socket } from "../lib/socket";

interface SessionPayload {
  playerId: string;
  sessionToken: string;
  roomCode: string;
}

interface GameStore {
  gameState: GameState | null;
  playerId: string | null;
  sessionToken: string | null;
  roomCode: string | null;
  selectedChip: Chip | null;
  lastError: ErrorPayload | null;
  scores: GameOverPayload["scores"] | null;
  connected: boolean;

  setGameState: (state: GameState) => void;
  setSession: (session: SessionPayload) => void;
  selectChip: (chip: Chip | null) => void;
  setError: (error: ErrorPayload) => void;
  clearError: () => void;
  setConnected: (connected: boolean) => void;

  connect: () => void;
  disconnect: () => void;

  createRoom: (config: GameConfig, themeId: string, playerName: string, seed?: number) => void;
  createSoloRoom: (config: GameConfig, themeId: string, playerName: string, seed?: number) => void;
  joinRoom: (code: string, playerName: string, playerId?: string, sessionToken?: string) => void;
  startGame: () => void;
  startSoloGame: () => void;
  placeChip: (chip: Chip, row: number, col: number) => void;
  exchangeChips: (chips: Chip[]) => void;
  discardChip: (chip: Chip) => void;
}

function persistSession(payload: SessionPayload): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem("sessionToken", payload.sessionToken);
  localStorage.setItem("playerId", payload.playerId);
  localStorage.setItem("roomCode", payload.roomCode);
  // playerName is already set by ConfigScreen/JoinScreen before socket connects
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  playerId: null,
  sessionToken: null,
  roomCode: null,
  selectedChip: null,
  lastError: null,
  scores: null,
  connected: false,

  setGameState: (gameState) => set({ gameState }),
  setSession: ({ playerId, roomCode, sessionToken }) => set({ playerId, roomCode, sessionToken }),
  selectChip: (selectedChip) => set({ selectedChip }),
  setError: (lastError) => set({ lastError }),
  clearError: () => set({ lastError: null }),
  setConnected: (connected) => set({ connected }),

  connect: () => {
    socket.removeAllListeners();
    socket.on("connect", () => set({ connected: true }));
    socket.on("disconnect", () => set({ connected: false }));
    socket.on("room_joined", (payload) => {
      set({
        gameState: payload.state,
        playerId: payload.playerId,
        roomCode: payload.code,
        sessionToken: payload.sessionToken,
      });
      persistSession({
        playerId: payload.playerId,
        roomCode: payload.code,
        sessionToken: payload.sessionToken,
      });
    });
    socket.on("state_update", ({ state }) => set({ gameState: state }));
    socket.on("error", (lastError) => set({ lastError }));
    socket.on("game_over", ({ scores }) => {
      const currentState = get().gameState;
      set({
        scores,
        gameState: currentState ? { ...currentState, phase: "finished" } : currentState,
      });
    });
    socket.connect();
  },

  disconnect: () => {
    socket.disconnect();
    socket.removeAllListeners();
    set({ connected: false });
  },

  createRoom: (config, themeId, playerName, seed) => {
    const payload: CreateRoomPayload = { config, themeId, playerName };
    if (seed !== undefined) payload.seed = seed;
    socket.emit("create_room", payload);
  },

  createSoloRoom: (config, themeId, playerName, seed) => {
    const payload: CreateRoomPayload = { config, themeId, playerName };
    if (seed !== undefined) payload.seed = seed;
    socket.emit("create_solo_room", payload);
  },

  joinRoom: (code, playerName, playerId?, sessionToken?) => {
    const payload: JoinRoomPayload = { code, playerName };
    if (playerId) payload.playerId = playerId;
    if (sessionToken) payload.sessionToken = sessionToken;
    socket.emit("join_room", payload);
  },

  startGame: () => {
    socket.emit("start_game");
  },

  startSoloGame: () => {
    socket.emit("start_solo_game");
  },

  placeChip: (chip, row, col) => {
    socket.emit("place_chip", { chip, row, col });
  },

  exchangeChips: (chips) => {
    socket.emit("exchange_chips", { chips });
  },

  discardChip: (chip) => {
    socket.emit("discard_chip", { chip });
  },
}));

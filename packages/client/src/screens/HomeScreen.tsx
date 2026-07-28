import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { DEFAULT_GAME_CONFIG } from "@town77/shared-types";
import { generateRandomName } from "../lib/randomName";
import { useTheme } from "../lib/theme";
import { useGameStore } from "../store/gameStore";
import { getThemeByIdSafe } from "../themes";

export function HomeScreen() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const createRoom = useGameStore((s) => s.createRoom);
  const joinRoom = useGameStore((s) => s.joinRoom);
  const gameState = useGameStore((s) => s.gameState);
  const roomCode = useGameStore((s) => s.roomCode);
  const [joinCode, setJoinCode] = useState("");
  const isNeo = theme.style === "neobrutalism";
  const neoRadius = theme.styleProps.borderRadius;

  useEffect(() => {
    if (gameState && roomCode) {
      navigate(`/room/${roomCode}`);
    }
  }, [gameState, navigate, roomCode]);

  function savePlayerName(): string {
    const playerName = generateRandomName();
    localStorage.setItem("playerName", playerName);
    return playerName;
  }

  function handleCreate() {
    createRoom(DEFAULT_GAME_CONFIG, "neobrutalism", savePlayerName());
  }

  function handleCreateCafeQueue() {
    navigate('/cafe-queue/config');
  }

  function handleWatchDemo() {
    navigate('/cafe-queue/demo');
  }

  function handleJoin() {
    const roomCode = joinCode.trim().toUpperCase();
    if (!roomCode) return;

    joinRoom(roomCode, savePlayerName());
    navigate(`/room/${roomCode}`);
  }

  function cycleTheme() {
    const order = ["town77", "playful-pastel", "neobrutalism"];
    const idx = order.indexOf(theme.id);
    const next = order[(idx + 1) % order.length] ?? "neobrutalism";
    setTheme(getThemeByIdSafe(next));
  }

  return (
    <main
      data-testid="home-screen"
      style={{
        alignItems: "center",
        background: isNeo ? theme.surfaces.background : "var(--color-surface-bg)",
        backgroundImage: isNeo ? "none" : "radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.08) 0%, transparent 60%)",
        color: "var(--color-text-primary)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-xl)",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "var(--space-xl)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            color: isNeo ? "#ff6b6b" : "var(--color-text-accent)",
            fontFamily: "var(--font-display)",
            fontSize: "clamp(48px, 10vw, 80px)",
            fontWeight: 900,
            letterSpacing: isNeo ? "-0.02em" : "0.05em",
            margin: 0,
            textShadow: isNeo ? "none" : "0 0 40px rgba(245, 158, 11, 0.3)",
            WebkitTextStroke: isNeo ? "2px #000000" : "none",
          }}
        >
          Town 77
        </h1>
        <p style={{ 
          color: "var(--color-text-secondary)", 
          fontSize: "var(--text-lg)", 
          marginTop: "var(--space-sm)",
          letterSpacing: isNeo ? "0.02em" : "0.1em",
          textTransform: "uppercase",
          fontWeight: isNeo ? 900 : 400,
        }}>
          Board Game
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)", width: "100%", maxWidth: 400 }}>
        <button
          type="button"
          data-testid="btn-create"
          onClick={handleCreate}
          style={{
            background: isNeo ? "#ffe66d" : "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)",
            borderRadius: isNeo ? `${neoRadius}px` : "var(--radius-lg)",
            border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : "none",
            boxShadow: isNeo
              ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}`
              : "0 4px 12px rgba(245, 158, 11, 0.3), 0 0 20px rgba(245, 158, 11, 0.15)",
            color: isNeo ? "#000000" : "#020617",
            cursor: "pointer",
            fontSize: "var(--text-lg)",
            fontWeight: 700,
            letterSpacing: isNeo ? "0.02em" : "0.05em",
            minHeight: 56,
            padding: "var(--space-md) var(--space-xl)",
            transition: isNeo ? "var(--neo-transition)" : "transform 0.15s ease-out, box-shadow 0.15s ease-out",
          }}
        >
          {t("create_room")}
        </button>
        <button type="button" data-testid="btn-create-cafe-queue" onClick={handleCreateCafeQueue} style={{ background: "#ff6b6b", border: "3px solid #000", boxShadow: "4px 4px 0 #000", color: "#000", cursor: "pointer", fontSize: "var(--text-lg)", fontWeight: 900, minHeight: 56, padding: "var(--space-md) var(--space-xl)" }}>
          CAFE QUEUE
        </button>
        <button type="button" data-testid="btn-watch-cafe-demo" onClick={handleWatchDemo} style={{ background: "#4ecdc4", border: "3px solid #000", boxShadow: "4px 4px 0 #000", color: "#000", cursor: "pointer", fontSize: "var(--text-lg)", fontWeight: 900, minHeight: 56, padding: "var(--space-md) var(--space-xl)" }}>
          WATCH DEMO
        </button>
        <input
          data-testid="input-room-code"
          placeholder="ABC123"
          value={joinCode}
          onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
          maxLength={6}
          style={{
            background: isNeo ? "#ffffff" : "var(--color-surface-grid)",
            border: isNeo
              ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}`
              : "2px solid rgba(245, 158, 11, 0.3)",
            borderRadius: isNeo ? `${neoRadius}px` : "var(--radius-lg)",
            boxShadow: isNeo ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}` : "none",
            color: isNeo ? "#000000" : "var(--color-text-accent)",
            fontSize: "var(--text-base)",
            fontWeight: 600,
            letterSpacing: isNeo ? "0.02em" : "0.05em",
            minHeight: 48,
            padding: "var(--space-sm) var(--space-xl)",
            textAlign: "center",
            transition: isNeo ? "var(--neo-transition)" : "all 0.15s ease-out",
            width: "100%",
          }}
        />
        <button
          type="button"
          data-testid="btn-join-room"
          disabled={!joinCode.trim()}
          onClick={handleJoin}
          style={{
            background: isNeo ? "#ffffff" : "var(--color-surface-grid)",
            border: isNeo
              ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}`
              : "2px solid rgba(245, 158, 11, 0.3)",
            borderRadius: isNeo ? `${neoRadius}px` : "var(--radius-lg)",
            boxShadow: isNeo ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}` : "none",
            color: isNeo ? "#000000" : "var(--color-text-accent)",
            cursor: joinCode.trim() ? "pointer" : "not-allowed",
            fontSize: "var(--text-base)",
            fontWeight: 600,
            letterSpacing: isNeo ? "0.02em" : "0.05em",
            minHeight: 48,
            padding: "var(--space-sm) var(--space-xl)",
            transition: isNeo ? "var(--neo-transition)" : "all 0.15s ease-out",
          }}
        >
          {t("join")}
        </button>
      </div>

      <button
        type="button"
        data-testid="btn-toggle-theme"
        onClick={cycleTheme}
        style={{
          background: "transparent",
          border: isNeo ? `${theme.styleProps.borderWidth}px solid ${theme.styleProps.borderColor}` : "1px solid var(--color-surface-cell-hover)",
          borderRadius: isNeo ? `${neoRadius}px` : "var(--radius-pill)",
          boxShadow: isNeo ? `${theme.styleProps.shadowOffset}px ${theme.styleProps.shadowOffset}px 0px ${theme.styleProps.shadowColor}` : "none",
          color: "var(--color-text-secondary)",
          cursor: "pointer",
          fontSize: "var(--text-sm)",
          padding: "var(--space-xs) var(--space-md)",
          transition: isNeo ? "var(--neo-transition)" : "all 0.15s ease-out",
        }}
      >
        {theme.name} Theme
      </button>
    </main>
  );
}

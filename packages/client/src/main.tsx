import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { useGameStore } from "./store/gameStore";

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error("Root element not found");
}

(window as any).__store = useGameStore;

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { useGameStore } from "./store/gameStore";

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error("Root element not found");
}

declare global {
  interface Window {
    // Exposed for E2E/debug harnesses (Playwright reads store state). Typed
    // instead of an `as any` cast so call sites stay type-checked.
    __store: typeof useGameStore;
  }
}

window.__store = useGameStore;

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

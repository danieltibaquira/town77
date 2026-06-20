# Town 77 — 5-Bot Full-Game Playwright Integration Test — SPEC

**Status: 📋 PLANNED** — Authored 2026-06-14.
**Companion plan:** .matrixx/plans/2026-06-14-town77-5bot-playwright-fullgame.md

**Goal:** Integration test where **5 bot-controlled browser pages** (Playwright) play a complete Town 77 game from `/` route to `game_over` through real UI interactions — clicking buttons, selecting chips, placing on grid. Asserts `game_over` with scores for all 5 players, entirely through the DOM.

---

## 1. Problem

No test validates the Town 77 client end-to-end through the browser UI. Existing tests:
- **WS-level tests** (server package): bots interact via raw `socket.emit()`, bypassing React/UI entirely.
- **Client unit tests** (vitest + jsdom): render components in isolation, mock zustand store — no real WebSocket, no server, no multi-page coordination.
- **No Playwright test exists.**

A real player uses the UI: they click "Create Room" → configure → click cells → discard chips. If the UI breaks (button stops working, grid doesn't render hand, React state desyncs from Socket.IO events), no test catches it.

## 2. Current state

| Fact | Source |
|------|--------|
| Client renders 7 routes via react-router-dom | `packages/client/src/router.tsx` |
| Zustand store bridges Socket.IO ↔ React | `packages/client/src/store/gameStore.ts` |
| Socket.IO client connects via `websocket` transport only | `packages/client/src/lib/socket.ts` |
| `GameScreen` renders Grid, Hand, ActionBar, PlayerBadge from `gameState` | `packages/client/src/screens/GameScreen.tsx` |
| UI actions: `selectChip(chip)` → click cell → `placeChip(chip, row, col)` → `socket.emit("place_chip", ...)` | `GameScreen.tsx:72-76` |
| Discord: `grid[row][col]` clickable only when `isMyTurn && selectedChip`, `validCells` highlighted | `GameScreen.tsx:125` |
| Hand: `Chip` components selectable via `onSelect`, highlights selected | `GameScreen.tsx:129` |
| ActionBar: `canDiscard = isMyTurn && !hasDiscarded && selectedChip !== null` | `GameScreen.tsx:85` |
| Auto-nav: `phase === 'finished'` → navigate to `/results/:code` | `GameScreen.tsx:54-58` |
| WS test server helper exists (`test-server.ts`) — spawns HTTP + Socket.IO on random port | `packages/server/src/__tests__/helpers/test-server.ts` |
| Server handlers fixed for 5-player games (B1 cap, B2 termination) | Prior T1-T3 work |

## 3. Gaps / blockers

- **P1 — Dev server lifecycle.** Playwright needs a running HTTP server. The WS test server (`createTestServer`) spawns a real Express + Socket.IO server on a dynamic port — reuse it. Client must connect to that port. Override `VITE_SERVER_URL` or use `page.route()` to intercept the socket.io client URL.
- **P2 — No Playwright test infra.** No `playwright.config.ts`, no test fixtures, no page object helpers. Must create from scratch.
- **P3 — Bot AI in browser.** Bots need to compute actions from the DOM. Cannot call `findBotAction` directly (it's server-side game-engine). Options:
  - **A) Expose `findBotAction` to client.** Bad — bloats client bundle, mixes concerns.
  - **B) Bots read DOM state and make decisions.** Parse grid cells, hand chips, compute valid cells client-side.
  - **C) Bots use `page.evaluate()` to access zustand store state, then compute actions in test script.** Test script imports `findBotAction` from game-engine, evaluates it with state extracted via `page.evaluate(() => useGameStore.getState().gameState)`.
  
  **Chosen: C.** Keeps bot logic in test, DOM is only for interaction (clicking), state is read from zustand store directly.

## 4. Target behaviour

1. **Test server boots** on random port. Client's Socket.IO URL is patched to connect to that port.
2. **Host page** opens, navigates to `/`, clicks "Create Room" → `/config`, fills player name, sets seed, clicks "Create Room". Reads `room_joined` via zustand store, extracts room code.
3. **4 bot pages** open in parallel. Each navigates to `/join`, enters room code, enters bot name, clicks "Join". Test waits until zustand store on each page reports 5 players.
4. **Host page** clicks "Start Game". All pages navigate to `/game/:code`.
5. **Game loop** (per turn):
   - On the page whose `turnIndex` matches their player index:
     - Read `gameState` from zustand store via `page.evaluate()`
     - Call `findBotAction(state, playerId)` in test script
     - If `place`: click the chip in Hand (match by color/shape), then click the target cell on Grid
     - If `discard`: click the chip in Hand, then click "Discard" in ActionBar
     - If `null` (empty hand / no moves): do nothing — turn passes
   - Wait for `state_update` (detected via `gameState.turnIndex` change or `bag.length` change)
6. **Continue** until `gameState.phase === 'finished'` on any page.
7. **Assert**: `scores.length === 5`, all `combined` scores valid, `bag.length === 0`, all pages navigate to `/results/:code`.

## 5. Architecture

```
                    ┌──────────────────────────────────┐
                    │        Playwright Test            │
                    │                                   │
                    │  import { findBotAction }          │
                    │         from '@town77/game-engine' │
                    │                                   │
                    │  for each turn:                    │
                    │    state = page.evaluate(...)      │
                    │    action = findBotAction(state)   │──┐
                    │    if place: click chip, cell      │  │
                    │    if discard: click chip, btn     │  │
                    └────────────────┬─────────────────┘  │
                                     │                    │
              ┌──────────────────────┼────────────────────┤
              │                      │                    │
        ┌─────▼──────┐    ┌─────────▼──────┐    ┌───────▼────────┐
        │  Page:Host │    │  Page:Bot-2    │ .. │  Page:Bot-5    │
        │ (Playwright│    │ (Playwright    │    │ (Playwright    │
        │  browser)  │    │  browser)      │    │  browser)      │
        │            │    │                │    │                │
        │  React App │    │  React App     │    │  React App     │
        │  + Zustand │    │  + Zustand     │    │  + Zustand     │
        │  + SocketIO│    │  + SocketIO    │    │  + SocketIO    │
        └─────┬──────┘    └─────────┬──────┘    └───────┬────────┘
              │                     │                    │
              │   WebSocket (Socket.IO)                 │
              └─────────────────────┬────────────────────┘
                                    │
                          ┌─────────▼──────────┐
                          │  Test Server        │
                          │  (Express + SQLite  │
                          │   + Socket.IO)      │
                          │  on dynamic port    │
                          └────────────────────┘
```

## 6. Non-goals

- Human-like bot strategy (greedy placement is fine).
- Visual regression / screenshot testing.
- Cross-browser matrix (Chromium only).
- Mobile viewport testing.
- Team scoring / labels.

## 7. Acceptance criteria

- [ ] Playwright test: 1 host + 4 bots = 5 players complete a full game via real DOM clicks.
- [ ] Test asserts `game_over` received with `scores.length === 5`, all scores valid.
- [ ] Test asserts all pages navigate to `/results/:code`.
- [ ] Test is deterministic (fixed seed via `?seed=` query param or DB injection).
- [ ] Test completes < 30s.
- [ ] Existing test suites stay green.
- [ ] Turn cap safeguard (500 turns) — fails loudly with diagnostics if exceeded.

## 8. Risks

| Risk | Mitigation |
|------|------------|
| Playwright + Vite dev server conflict | Use `createTestServer()` from server package — it spawns real HTTP/Socket.IO; configure client Socket.IO URL to point to it |
| Bot can't find chip in DOM | Chips rendered with `data-color` and `data-shape` attributes (add if missing); query by selector |
| Grid cell clicking unreliable | Cells have deterministic positions; use `data-row`/`data-col` attributes |
| Timing: UI hasn't rendered after state_update | `waitFor` helpers on DOM selectors before acting |
| Zustand store not accessible from `page.evaluate` | Expose store on `window.__store` in dev/test mode; or use `page.evaluate(() => { ... })` with store import |
| Empty-hand deadlock (same as WS test) | Server-side `nextTurnIndex` already skips stuck players; bot does nothing when `findBotAction → null` |

## 9. Tasks (TDD)

| # | Phase | Description |
|---|-------|-------------|
| T0 | 🔴 RED | `playwright.config.ts` + first test boots server, opens page, asserts HomeScreen renders |
| T0 | 🟢 GREEN | Fix config/setup until test passes |
| T1 | 🔴 RED | Test: host creates room via UI → assert on lobby screen with room code |
| T1 | 🟢 GREEN | Implement page helpers for ConfigScreen interaction |
| T2 | 🔴 RED | Test: 4 bots join room via UI → assert 5 players in lobby |
| T2 | 🟢 GREEN | Implement JoinScreen bot automation |
| T3 | 🔴 RED | Test: host starts game → all pages navigate to GameScreen → assert grid renders |
| T3 | 🟢 GREEN | Wire up start_game flow, fix any navigation issues |
| T4 | 🔴 RED | Test: bot auto-plays one turn (select chip → click cell) → assert turn advanced |
| T4 | 🟢 GREEN | Implement chip selection + cell click automation |
| T5 | 🔴 RED | Headline: 5 bots full game to game_over → assert 5 scores |
| T5 | 🟢 GREEN | Wire complete game loop, fix any deadlocks |
| T6 | 🔴 RED | Determinism: same seed → same scores (run twice) |
| T6 | 🟢 GREEN | Ensure seed stability, add assertion |
| T7 | Cleanup | Remove `console.log`, add turn cap safeguard, final suite run |

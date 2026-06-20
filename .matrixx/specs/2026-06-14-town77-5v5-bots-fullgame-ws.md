# Town 77 — 5v5 Bots Full-Game WebSocket Test — SPEC

**Status: 📋 PLANNED** — Authored 2026-06-14.
**Companion plan:** `.matrixx/plans/2026-06-14-town77-5v5-bots-fullgame-ws-test.md`

**Goal:** An automated integration test where **10 bot-controlled clients** play a **complete** Town 77 game **to natural completion over real WebSocket (Socket.IO) connections**, asserting the server emits a terminal `game_over` with scores for all 10 players. "5v5" = 10 players, optionally labelled as two teams of 5 (labels only — see Open Decision D1).

---

## 1. Problem

No test drives a Town 77 game to completion over WebSockets. The only bot logic (`findBotAction`) is unit-tested in isolation; the only multi-client WS tests assert **single** actions then stop. Solo mode (1 human + 1 bot) is shipped **without tests** (commit `9edfbbb chore: CI solo typecheck + deploy, sin tests`). There is no confidence that a many-player game actually terminates over the wire.

## 2. Current state (verified facts)

| Fact | Evidence |
|------|----------|
| Player cap is 5 | `packages/server/src/handlers/join-room.ts:8` `const MAX_PLAYERS = 5` |
| `start_game` requires ≥2 players, deals `dealHands(bag, players.length, handSize)` | `packages/server/src/handlers/start-game.ts:28,42` |
| First turn = `seed % players.length` (deterministic) | `start-game.ts:43` |
| `game_over` emitted ONLY on placement that ends game | `packages/server/src/handlers/place-chip.ts:81-87` |
| `discard_chip` does NOT check `isGameOver` | `packages/server/src/handlers/discard-chip.ts` (no match) |
| `exchange_chips` does NOT check `isGameOver` | `packages/server/src/handlers/exchange-chips.ts` (no match) |
| Server auto-drives a turn only if next player id starts with `bot-` | `place-chip.ts` tail, `solo-game.ts` |
| `isGameOver` true iff `bag.length === 0` AND no player hand chip has a valid cell | `packages/game-engine/src/scoring.ts:15-25` |
| WS test harness exists (real Socket.IO + `socket.io-client`, websocket transport) | `packages/server/src/__tests__/helpers/test-server.ts` |
| Bag size = colors×shapes×copies = 7×7×1 = **49**; `handSize=4` | `packages/shared-types/src/game-config.ts:35-39` |
| Engine bot: greedy — first valid placement, else discard first chip; does NOT honour `hasDiscarded` | `packages/game-engine/src/bot.ts` |
| Socket events: `create_room`,`join_room`,`start_game`,`place_chip`,`exchange_chips`,`discard_chip`,`state_update`,`game_over`,`room_joined`,`error` | `packages/server/src/app.ts:33-40`, `packages/shared-types/src/socket-events.ts` |

## 3. Gaps / blockers (must be closed for the test to pass)

- **B1 — Player cap.** `MAX_PLAYERS = 5` blocks a 10-player room. Must become configurable (raise to ≥10 for this game mode, or make the cap a `GameConfig` field).
- **B2 — Termination hole.** If the game-ending move is a **discard** or **exchange** (drains bag + blocks board), `isGameOver` becomes true but no handler checks it → `game_over` never fires → game hangs in `phase: 'playing'`. A 10-bot game frequently ends on a non-placement move, so the test would time out. `discard_chip` and `exchange_chips` must check `isGameOver` and emit `game_over`, exactly like `place_chip`.
- **B3 — No team model.** Engine has no team field and scoring is per-player. "5v5 teams" with team win conditions does not exist (Open Decision D1).

## 4. Target behaviour

1. A room is created and seated with **10 players** (configurable N) in `lobby`, fixed `seed` for determinism.
2. `start_game` deals 10 hands (40 chips), leaves 9 in bag, transitions to `playing`.
3. The test runs **10 WS clients, each a bot brain**. On every `state_update`, the client whose `turnIndex` matches its own seat computes `findBotAction(state, ownId)` and emits the matching event:
   - `place` → `place_chip`
   - `discard` → `discard_chip`
   - `null` (empty hand / no move) → the engine advances; client waits.
4. Loop until the server emits `game_over`, OR a hard **turn cap** (safeguard, e.g. 1000 moves) trips → test fails loudly (no silent truncation).
5. Assert: `game_over` received; `scores.length === 10`; every player has a `combined` score; final `phase === 'finished'`; bag empty.

## 5. Chosen architecture — Option A: test-clients-as-bots

- Genuine WS round-trips: **every** move crosses the wire (satisfies "over websockets").
- Reuses existing handlers; **no** new production bot-orchestration code.
- Players are NOT `bot-` prefixed, so the server's auto-drive (`setTimeout(runBotTurn)`) stays off and the test deterministically owns the loop.
- Only prod changes are the two real bugs/limits B1 + B2 — both worth fixing regardless of this test.

**Alternative — Option B (server-side bots):** seat 10 `bot-` players, let the server auto-drive via `runBotTurn`, test only observes. Rejected as primary: needs new prod handler to seat N bots, the `setTimeout(…, 1000)` chain makes a full game slow and timing-fragile, and `runBotTurn` has its own termination hole (only checks game-over on place). Kept as documented alternative (Open Decision D2).

## 6. Non-goals

- Real team scoring / team win conditions (labels only this round).
- Bot AI quality / strategy improvements (`findBotAction` greedy stays).
- Client/UI changes; this is a server integration test.
- Removing the `setTimeout` server-bot chain (separate concern).

## 7. Acceptance criteria

- [ ] New test file runs 10 bot clients to a real `game_over` over WS, asserting 10 scores + `finished` + empty bag.
- [ ] Test is deterministic (fixed seed) and completes < 10s.
- [ ] `discard_chip` and `exchange_chips` emit `game_over` when their move ends the game (unit/integration tested).
- [ ] Player cap configurable; 10-player room creatable.
- [ ] Full suite green; `pnpm typecheck` clean; `biome check` clean.
- [ ] Turn-cap safeguard present and, if tripped, fails the test with diagnostics (never a false pass).

## 8. Risks

| Risk | Mitigation |
|------|------------|
| Non-terminating game (cycle of discards) | Bag is finite (49) and strictly shrinks on draw; discards without bag shrink hands → `findBotAction`→null→pass. Plus hard turn cap. |
| Flaky timing across 10 async clients | Drive strictly off `state_update` events; no `setTimeout`; one in-flight move at a time. |
| Raising `MAX_PLAYERS` breaks "room full" test | Make cap config-driven; update `join-room.test.ts` expectations. |
| `findBotAction` ignores `hasDiscarded`, handler may reject | Handler enforces rules; on `error` event the bot falls back (discard→pass) — test must handle `error` and advance. |

## 9. Open decisions

- **D1 — Teams:** Treat "5v5" as 10 players with optional `team: 'A'|'B'` label (cosmetic, aggregate score sum reported) — OR defer teams entirely (pure 10-player FFA). **Recommendation: label-only.**
- **D2 — Bot ownership:** Option A (test clients as bots, recommended) vs Option B (server-side `bot-` seats). **Recommendation: A.**
- **D3 — Cap mechanism:** Bump constant to 10 vs add `config.maxPlayers`. **Recommendation: `config.maxPlayers` (data-driven, future-proof).**

## 10. Termination argument

`isGameOver` ⇔ `bag.length===0 ∧ no hand chip placeable`. Bag starts at 49, 40 dealt → 9 left. Every `place` and successful `discard`/`exchange` draws from the bag while it is non-empty, so the bag is strictly non-increasing and reaches 0. Once empty, hands only shrink (placements remove a chip and cannot draw; discards remove without draw). With finite chips and a 49-cell board, valid moves are exhausted in bounded turns → `isGameOver` becomes true. The hard turn cap is a safeguard against logic regressions, not the primary terminator, and a tripped cap fails the test loudly.

## 11. Spec cross-references

- `docs/superpowers/specs/2026-06-09-town77-design.md` — base game, socket events, scoring.
- `docs/superpowers/specs/2026-06-10-multi-game-architecture.md` — solo/bot context (§2.2); does **not** define a 5v5/team player model (this spec introduces the 10-player path).
- Engine: `packages/game-engine/src/{bot,scoring,turn,bag,grid}.ts`.
- Handlers: `packages/server/src/handlers/{create-room,join-room,start-game,place-chip,discard-chip,exchange-chips}.ts`.

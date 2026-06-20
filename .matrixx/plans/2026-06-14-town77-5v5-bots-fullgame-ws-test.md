# Town 77 — 5v5 Bots Full-Game WebSocket Test — PLAN

**Status: 📋 PLANNED** — not started. Authored 2026-06-14.
**Companion spec:** `.matrixx/specs/2026-06-14-town77-5v5-bots-fullgame-ws.md` (read first — problem, blockers B1–B3, acceptance criteria, open decisions D1–D3).

> **For agentic workers:** REQUIRED SUB-SKILL — use `superpowers:executing-plans` or `superpowers:subagent-driven-development` to implement task-by-task. Every task is TDD: a failing test (🔴 RED) and its runner output must be pasted before implementation; a passing run (🟢 GREEN) must be pasted before the task is marked done. A diff is not proof.

**Goal:** 10 bot-controlled WS clients play a complete Town 77 game to natural `game_over` over Socket.IO; the test asserts scores for all 10 players + `phase:'finished'` + empty bag.

---

## TDD rules

1. No implementation before a failing test exists for that behaviour.
2. Paste **vitest** runner output for 🔴 RED and 🟢 GREEN — diffs/snippets are not proof (per `~/.claude/CLAUDE.md` Evidence Protocol).
3. One commit per green task. Commit messages concise, in Spanish. Never commit without explicit user instruction.
4. Existing suite stays green — run full suite after each task.
5. `pino` logging only — no `console.*` in source.

```bash
# Narrow (single file)
cd packages/server && pnpm test -- src/__tests__/discard-chip.test.ts
# Full suite
cd /Users/danieltibaquira/Projects/town77 && pnpm test
# Gates
pnpm typecheck && pnpm lint
```

## File map

```
packages/shared-types/src/
└── game-config.ts                       # MODIFY (D3): add optional maxPlayers to GameConfig + DEFAULT
packages/server/src/handlers/
├── join-room.ts                         # MODIFY: cap from config.maxPlayers (fallback 5)
├── discard-chip.ts                      # MODIFY (B2): check isGameOver → emit game_over
└── exchange-chips.ts                    # MODIFY (B2): check isGameOver → emit game_over
packages/server/src/__tests__/
├── discard-chip.test.ts                 # MODIFY/CREATE: game-over-on-discard case
├── exchange-chips.test.ts               # MODIFY/CREATE: game-over-on-exchange case
├── join-room.test.ts                    # MODIFY: cap-from-config expectations
├── full-game-5v5-bots.test.ts           # CREATE: the headline integration test
└── helpers/
    ├── test-server.ts                   # (reuse) createTestServer/connectClient
    └── bot-client.ts                    # CREATE: WS bot-brain driver (state_update → findBotAction → emit)
```

## Tasks

### T0 — Audit & lock assumptions (no code)
- [ ] Confirm `config.scoring` exists in `DEFAULT_GAME_CONFIG` (used by `calculateScores`).
- [ ] Confirm `exchange-chips.test.ts` presence; decide create vs modify.
- [ ] Resolve D1/D2/D3 with user (defaults from spec §9 if silent).
- **Evidence:** short note in PR description; no test.

### T1 — Termination fix: `discard_chip` emits `game_over` (B2)
- [ ] 🔴 RED: in `discard-chip.test.ts`, construct a near-terminal room (bag empty, board arranged so the discard leaves no valid move), drive a `discard_chip`, assert a `game_over` payload with scores is received. Paste failing run.
- [ ] GREEN: in `discard-chip.ts`, after applying the discard + computing `updatedState`, add the `isGameOver(grid, bag, players)` → `phase:'finished'` → `calculateScores` → `io.to(room).emit('game_over', { scores })` block used in `place-chip.ts:81-87`. Paste passing run.
- [ ] Commit: `fix(server): discard_chip emite game_over al terminar partida`.

### T2 — Termination fix: `exchange_chips` emits `game_over` (B2)
- [ ] 🔴 RED: analogous near-terminal case for exchange. Note: exchange returns chips to the bag (`doExchange` re-adds + shuffles), so an exchange rarely ends a game — assert the **guard runs** and, in a constructed bag-empty-after path, emits `game_over`. Paste failing run.
- [ ] GREEN: add `isGameOver` check + `game_over` emit after exchange. Paste passing run.
- [ ] Commit: `fix(server): exchange_chips verifica fin de partida`.

### T3 — Configurable player cap (B1, D3)
- [ ] 🔴 RED: `join-room.test.ts` — with `config.maxPlayers = 10`, an 11th join is rejected `ROOM_FULL`; a 10th join succeeds; default-5 behaviour preserved when `maxPlayers` absent. Paste failing run.
- [ ] GREEN: add `maxPlayers?: number` to `GameConfig` + `DEFAULT_GAME_CONFIG` (default 5); in `join-room.ts` replace `MAX_PLAYERS` with `state.config.maxPlayers ?? 5`. Paste passing run.
- [ ] Commit: `feat(server): límite de jugadores configurable via config.maxPlayers`.

### T4 — Bot-client driver helper
- [ ] 🔴 RED: `helpers/bot-client.ts` test — given a connected client + own playerId, on a `state_update` where it is the active turn it emits exactly one action derived from `findBotAction`; otherwise emits nothing. Paste failing run.
- [ ] GREEN: implement `attachBot(client, ownId)`: subscribe to `state_update`; if `state.players[state.turnIndex].id === ownId` and `state.phase==='playing'`, compute `findBotAction(state, ownId)` → emit `place_chip`/`discard_chip` (map fields); on `error` event, fall back to discard of first hand chip, else no-op. One in-flight action at a time. Paste passing run.
- [ ] Commit: `test(server): helper bot-client dirige turnos por websocket`.

### T5 — Headline: 10-bot full game to completion over WS
- [ ] 🔴 RED: `full-game-5v5-bots.test.ts`:
  1. `createTestServer()`; host `create_room` with `config = { ...DEFAULT_GAME_CONFIG, maxPlayers: 10 }`, fixed `seed`.
  2. 9 more clients `join_room`; assert lobby has 10 players.
  3. `attachBot` each client to its own id.
  4. host `start_game`; await `game_over` with a hard turn-cap promise race (cap ≈ 1000; on cap → reject with last state dump).
  5. Assert: `scores.length === 10`; every score has finite `combined`; final state `phase === 'finished'` and `bag.length === 0`.
  Paste failing run (fails until T1–T4 merged / wiring complete).
- [ ] GREEN: make it pass with the real server; no production shortcuts. Paste passing run showing the game-over assertion.
- [ ] Commit: `test(server): partida completa 5v5 de bots hasta game_over por websocket`.

### T6 — Determinism & speed hardening
- [ ] Run T5 ≥5× (or loop seeds) — stable, < 10s each. Paste multi-run summary.
- [ ] Assert no `setTimeout`-based server bot path triggers (players not `bot-` prefixed; no unexpected `bot-` ids).
- [ ] Commit: `test(server): estabiliza y acelera test de partida completa`.

### T7 — Gates & CI
- [ ] `pnpm test` (full) green — paste counts.
- [ ] `pnpm typecheck` clean; `biome check .` clean — paste.
- [ ] Add the new server test to CI (commit `9edfbbb` shipped solo "sin tests" — close that gap). Paste CI config diff.
- [ ] Commit: `ci(server): incluye test de partida completa de bots`.

## Definition of done

All spec §7 acceptance criteria checked, T1–T7 green with pasted vitest output for each RED→GREEN transition, full suite + typecheck + lint clean, and the 5v5 bot game demonstrably reaching `game_over` over WebSockets in CI.

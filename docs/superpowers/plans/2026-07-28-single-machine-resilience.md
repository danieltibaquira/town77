# Single-machine resilience implementation plan

> **For Codex:** execute this plan with the `executing-plans` skill, task by task, using test-driven development.

**Goal:** Make a single always-on Fly machine reliably preserve active Town77 rooms across page reloads, socket reconnects, and process restarts, without exposing a player's hand to opponents.

**Architecture:** Keep SQLite on the existing Fly volume as the durable authority and Socket.IO as a disposable transport. The server will project game state separately for each connected player, track multiple sockets per player, wrap multi-record writes in SQLite transactions, and periodically remove only abandoned lobbies and expired completed games. The client will recover a saved session only on a room/game URL after each successful socket connection.

**Tech stack:** React/Zustand, Socket.IO, Express, TypeScript, better-sqlite3, Vitest, Fly Machines.

## Acceptance criteria

- Opening `/room/:code` or `/game/:code` with a valid saved session rejoins the same player after reload, reconnect, or server restart; it does not redirect home while recovery is pending.
- Every recipient receives their own hand only. Other players' `hand` arrays are empty in `room_joined` and `state_update` payloads.
- A player with two browser tabs remains `connected` until the last socket disconnects.
- Failed create/join database work leaves no orphan room/player record and no in-memory state that implies the write succeeded.
- Burst attempts receive a deterministic `RATE_LIMITED` socket error, and limiter entries are cleaned up.
- The cleanup job retains active rooms, removes disconnected lobby rooms after 24 hours, and removes completed rooms after seven days.
- `fly.toml` disables automatic stopping, retains the mounted `/data` SQLite database, and provides a health check. Actual machine count remains a deployment-time verification step, not an unverified code claim.
- Focused and package test suites pass under Node 20; type checks pass.

## Task 1: Test and add recipient-specific state projection

**Files:**

- Create: `packages/server/src/state/projection.ts`
- Create: `packages/server/src/state/broadcast.ts`
- Create: `packages/server/src/__tests__/state-projection.test.ts`
- Modify: `packages/server/src/socket/handlers/create-room.ts`
- Modify: `packages/server/src/socket/handlers/join-room.ts`
- Modify: `packages/server/src/socket/handlers/start-game.ts`
- Modify: `packages/server/src/socket/handlers/place-chip.ts`
- Modify: `packages/server/src/socket/handlers/exchange-chips.ts`
- Modify: `packages/server/src/socket/handlers/discard-chip.ts`
- Modify: `packages/server/src/socket/handlers/solo-game.ts`

**Step 1: Write the failing tests.**

Exercise `projectStateForPlayer(state, playerId)` with three players. Assert that the requested player retains their exact hand, every other player has `hand: []`, and all public state (board, phase, scores, player names, turn) is unchanged. Add an integration-style broadcast test using real Socket.IO clients: after a state update, each client sees only its own hand.

**Step 2: Run the focused test to confirm failure.**

Run: `rtk zsh -lc 'source /opt/homebrew/opt/nvm/nvm.sh && nvm exec 20 node ../../node_modules/vitest/vitest.mjs run --config vitest.config.ts src/__tests__/state-projection.test.ts'` from `packages/server`.

**Step 3: Implement the smallest boundary.**

Implement:

```ts
export function projectStateForPlayer(state: GameState, playerId: string): GameState
```

as an immutable projection that replaces every non-recipient `hand` with an empty array. Implement:

```ts
export function emitStateToRoom(io: Server, roomCode: string, state: GameState): void
```

by enumerating sockets in the Socket.IO room and emitting an independently projected `{ state }` payload to each socket using `socket.data.playerId`. A recipient must never receive a shared full-state object. Use the same projection for the initial `room_joined` response.

**Step 4: Replace all room-wide full-state emissions.**

Route each handler's state update through `emitStateToRoom`. Preserve game-over score behavior, but ensure any state-bearing event has the same privacy boundary.

**Step 5: Verify.**

Run the focused test, then the full server suite. Commit only this cohesive task as `feat(server): project game state per recipient`.

## Task 2: Make writes atomic and connection presence tab-safe

**Files:**

- Create: `packages/server/src/db/transactions.ts`
- Create: `packages/server/src/socket/presence.ts`
- Create: `packages/server/src/__tests__/room-transactions.test.ts`
- Create: `packages/server/src/__tests__/presence.test.ts`
- Modify: `packages/server/src/db/players.ts`
- Modify: `packages/server/src/db/rooms.ts`
- Modify: `packages/server/src/socket/app.ts`
- Modify: `packages/server/src/socket/handlers/create-room.ts`
- Modify: `packages/server/src/socket/handlers/join-room.ts`
- Modify: `packages/server/src/socket/handlers/disconnect.ts`
- Modify: `packages/server/src/server/index.ts`

**Step 1: Write failing transaction tests.**

Inject a deterministic failure on the second persistence operation for create and join. Assert that a failed create leaves neither a room nor host player, and a failed join leaves neither a persisted player nor a mutated room state. Use a temporary SQLite database and query it directly after the emitted error.

**Step 2: Write failing presence tests.**

Connect two clients with the same session token. Disconnect one and assert persisted/game state stays connected; disconnect the second and assert it changes to disconnected. Add a startup test proving stale `connected: true` flags are reset before new sockets rejoin after a process restart.

**Step 3: Implement transactions.**

Expose a narrow helper around `Database#transaction` and make each room creation/join perform all database writes and resulting state update inside one transaction. Do not join a socket room, populate `socket.data`, or emit a success event until its transaction has committed.

**Step 4: Implement a process-local presence registry.**

Create a `PresenceRegistry` whose public contract is:

```ts
connect(playerId: string, socketId: string): number
disconnect(playerId: string, socketId: string): number
count(playerId: string): number
```

Inject one registry into the socket app. Mark a player disconnected only when `disconnect()` returns zero. At process startup, reset persisted player connection flags in durable room state so post-restart recovery represents the new process accurately.

**Step 5: Verify.**

Run both focused tests and the full server suite. Commit as `feat(server): make room persistence and presence resilient`.

## Task 3: Recover saved sessions on room and game URLs

**Files:**

- Create: `packages/client/src/hooks/useRoomRecovery.ts`
- Create: `packages/client/src/__tests__/hooks/useRoomRecovery.test.tsx`
- Modify: `packages/client/src/stores/gameStore.ts`
- Modify: `packages/client/src/hooks/useRequireGame.ts`
- Modify: `packages/client/src/screens/LobbyScreen.tsx`
- Modify: `packages/client/src/screens/GameScreen.tsx`
- Modify: `packages/client/src/__tests__/screens/LobbyScreen.test.tsx`
- Create or modify: `packages/client/src/__tests__/screens/GameScreen.test.tsx`

**Step 1: Write failing recovery tests.**

Mock the socket store and local storage. For both room and game routes, assert a valid saved `{ roomCode, playerId, sessionToken, playerName }` invokes the existing `join_room` recovery path after the socket becomes connected. Assert reconnecting after `connected` changes `false -> true` retries recovery. Assert the game route renders a recovery/waiting state rather than navigating to `/` before recovery resolves.

**Step 2: Add explicit store recovery state.**

Add a small, resettable status such as `idle | recovering | failed` plus a recovery error. It must be set before emitting the session-token join and reset on `room_joined` or a socket error. Do not auto-recover on the home/config routes; only a route containing a room code can initiate recovery.

**Step 3: Implement the shared recovery hook.**

`useRoomRecovery(routeCode)` should validate that the stored room code matches the route and that all session fields exist, then call `joinRoom(routeCode, playerName, playerId, sessionToken)` once per successful socket connection epoch. It must be idempotent within an epoch and retry after a transport reconnect.

**Step 4: Replace route-specific ad hoc recovery.**

Use the shared hook in both LobbyScreen and GameScreen. Change `useRequireGame` so it redirects only after recovery has deterministically failed or there is no route-matching saved session; never while recovery is in progress. Keep a clear waiting/recovering screen for the interval.

**Step 5: Verify.**

Run the focused client tests and the root client/engine suite. Commit as `feat(client): recover room sessions after reconnects`.

## Task 4: Bound abuse and remove expired rooms

**Files:**

- Create: `packages/server/src/security/rate-limit.ts`
- Create: `packages/server/src/db/room-cleanup.ts`
- Create: `packages/server/src/__tests__/rate-limit.test.ts`
- Create: `packages/server/src/__tests__/room-cleanup.test.ts`
- Modify: `packages/server/src/socket/app.ts`
- Modify: `packages/server/src/socket/events.ts`
- Modify: `packages/server/src/server/index.ts`
- Modify: `fly.toml`

**Step 1: Write failing limiter tests.**

Use injected time and configuration to prove an IP-scoped limit guards room creation/join, a socket-scoped limit guards game mutation events, a blocked request produces `{ code: 'RATE_LIMITED' }`, and expired counters are pruned.

**Step 2: Implement a bounded in-memory limiter.**

Provide a testable limiter with injected `now`, `consume(key, limit, windowMs)`, and `prune()`. Key create/join attempts by normalized `socket.handshake.address`; key actions by socket id. Install it at the socket boundary so every protected event is rejected before handler mutation. Keep limits as named server constants, conservative enough for real play and documented in code.

**Step 3: Write failing cleanup tests.**

Seed rooms at explicit timestamps and phases. Assert a disconnected lobby older than 24 hours and a completed room older than seven days are deleted with their players. Assert an active game and a lobby with a connected player remain. Test using a fixed `now` and foreign keys enabled.

**Step 4: Implement cleanup.**

Implement `deleteExpiredRooms(db, now): number` with explicit candidate selection and transactional deletion of dependent players then rooms. Schedule it at startup and on an unref'd interval; log only aggregate removal counts. Keep active games indefinitely.

**Step 5: Harden machine configuration.**

Update `fly.toml` to keep the existing `/data` mount and set `auto_stop_machines = "off"` (and matching `auto_start_machines = false`), then add an HTTP health check for `/health`. Do not deploy or claim a live machine count; record that `fly machines list` must show one running machine before release.

**Step 6: Verify.**

Run focused tests, the full server suite, and server typecheck. Commit as `feat(server): rate limit and expire abandoned rooms`.

## Task 5: End-to-end resilience verification and release handoff

**Files:**

- Modify as required: existing socket/client tests only for uncovered integration gaps
- Create if useful: `docs/operations/single-machine-recovery.md`

**Step 1: Add one real Socket.IO recovery scenario.**

Using the server test harness, create a room, persist its returned session token, disconnect the client, reconnect a fresh socket with that token, and assert the same `playerId`, room membership, and projected state are restored. Repeat with a second socket for the same player to prove duplicate tabs do not leak a false disconnect.

**Step 2: Run the complete validation matrix.**

From repository root:

```sh
rtk pnpm test
rtk pnpm typecheck
```

From `packages/server` (Node 20 due the local native-module ABI):

```sh
rtk zsh -lc 'source /opt/homebrew/opt/nvm/nvm.sh && nvm exec 20 node ../../node_modules/vitest/vitest.mjs run --config vitest.config.ts'
rtk zsh -lc 'source /opt/homebrew/opt/nvm/nvm.sh && nvm exec 20 node ../../node_modules/typescript/bin/tsc -p tsconfig.json --noEmit'
```

**Step 3: Run rendered client QA.**

Use the local browser against the client app to verify: opening a game URL with no current in-memory state waits/rejoins rather than returning home; a reload preserves the player identity; and the lobby/game remain visually usable. Capture only observed behavior.

**Step 4: Release handoff without deployment.**

Document release checks: confirm one Fly machine, confirm `town77_data` is attached at `/data`, inspect `/health`, and perform two-browser reconnection/private-hand smoke checks. Do not run `fly deploy` or alter live infrastructure without a fresh user instruction.

**Step 5: Final verification and commits.**

Inspect `git diff --check`, `git status --short`, and each task's tests. Keep the resilience commits separate from the existing Neo/direct-entry/rule changes so the user can review and deploy them independently.

## Plan review

- The plan keeps the approved single-machine boundary: SQLite and Socket.IO remain single-process components; no unsupported horizontal scaling is implied.
- Each user-visible risk identified in the assessment maps to a test-first task: recovery, privacy, duplicate connections/restarts, atomic persistence, abuse, and expiry.
- Deployment is deliberately a handoff step because local configuration cannot prove the current Fly machine count or authorize a deploy.

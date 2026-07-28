# Coffee Rush Full Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an original Coffee Rush-style cafe-queue game as a persisted, reconnect-safe Town77 multiplayer game.

**Architecture:** Add a discriminated `GameState` envelope, then implement a pure `cafe-queue` game-engine module that accepts typed actions and returns immutable state. Adapt the existing room/Socket.IO layer to route module actions transactionally and send recipient-specific projections; finally add Coffee Rush routes and interaction components that render server state only.

**Tech Stack:** TypeScript, Vitest, fast-check, Socket.IO, better-sqlite3, Zustand, React, React Router, Playwright.

## Global Constraints

- Preserve tile-placement state, socket events, persistence, and client routes without behavioural changes.
- Server is the sole mutation authority; clients send intents and never calculate authoritative outcomes.
- Persist every Coffee Rush mutation before broadcasting it.
- Project state per recipient: hide future order deck and other players' cup contents.
- Use the original placeholder deck only; do not use Coffee Rush names, art, card copy, layouts, or card catalogue.
- Follow red -> implement -> green -> optimize -> validate -> automate for every task.
- Run all tests under Node 20: `source /opt/homebrew/opt/nvm/nvm.sh && nvm exec 20 ...`.

---

### Task 1: Discriminated game contracts and original placeholder deck

**Files:**
- Create: `packages/shared-types/src/cafe-queue.ts`
- Create: `packages/game-engine/src/games/cafe-queue/orders.ts`
- Modify: `packages/shared-types/src/index.ts`
- Modify: `packages/shared-types/src/game-state.ts`
- Modify: `packages/shared-types/src/socket-events.ts`
- Test: `packages/shared-types/src/__tests__/cafe-queue.test.ts`
- Test: `packages/game-engine/src/games/cafe-queue/__tests__/orders.test.ts`

**Interfaces:**
- Produces `CafeQueueState`, `CafeQueueConfig`, `CafeQueueAction`, `CafeQueueOrder`, `CafeQueuePlayer`, `CafeQueueScore`, and `GameState = TilePlacementGameState | CafeQueueState`.
- Produces `createPlaceholderOrders(): CafeQueueOrder[]`, returning deterministic original card IDs and recipes.

- [ ] **Red:** Write tests asserting all eight ingredient keys, finite initial supplies, 15 rush tokens, original placeholder IDs, exact recipe objects, and no duplicate IDs.
- [ ] **Implement:** Define literal unions and readonly interfaces. Use a `gameId: 'tile-placement' | 'cafe-queue'` discriminator; retain legacy tile-placement fields unchanged under `TilePlacementGameState`. Define actions as a discriminated union: `activate_upgrade`, `move_meeple`, `pour_ingredients`, `empty_cup`, `complete_orders`, and `end_turn`.
- [ ] **Green:** Run `node ../../node_modules/.pnpm/vitest@2.1.9_@types+node@25.9.2_jsdom@25.0.1/node_modules/vitest/vitest.mjs run src/__tests__/cafe-queue.test.ts` from `packages/shared-types`, then the orders test from `packages/game-engine`.
- [ ] **Optimize:** Export only public contracts from each package index; keep the placeholder order data in one file so a future `OriginalOrderSeed[]` replaces it without processor edits.
- [ ] **Validate:** Run both package typechecks and assert `createPlaceholderOrders()` has no protected game titles or original recipe names.
- [ ] **Automate:** Add both focused tests to the normal package test discovery and commit: `feat(town77): add cafe queue game contracts`.

### Task 2: Setup, movement topology, and finite collection engine

**Files:**
- Create: `packages/game-engine/src/games/cafe-queue/setup.ts`
- Create: `packages/game-engine/src/games/cafe-queue/movement.ts`
- Create: `packages/game-engine/src/games/cafe-queue/errors.ts`
- Create: `packages/game-engine/src/games/cafe-queue/index.ts`
- Modify: `packages/game-engine/src/index.ts`
- Test: `packages/game-engine/src/games/cafe-queue/__tests__/setup.test.ts`
- Test: `packages/game-engine/src/games/cafe-queue/__tests__/movement.test.ts`
- Test: `packages/game-engine/src/games/cafe-queue/__tests__/movement.property.test.ts`

**Interfaces:**
- Consumes `CafeQueueConfig`, player identities, seeded RNG, and `CafeQueueAction`.
- Produces `createCafeQueueState(config, players, seed)`, `validateMovePath(state, playerId, path, rushSpent)`, and `applyMove(state, playerId, path, rushSpent)`.

- [ ] **Red:** Test 2/3/4-player setup, reverse placement order, one versus two meeples, starting order-tab counts, finite starting supply, legal cardinal paths, diagonal rejection before upgrade, occupied-final rejection, occupied pass-through success, rush overspend rejection, and zero-supply collection clamp.
- [ ] **Implement:** Model a 4 by 4 graph using original `CellId` values (`r0c0` through `r3c3`) and original ingredient IDs only. Seed player order tabs and meeple placement deterministically. Calculate each entered-cell collection from supply and active multipliers without mutating input state.
- [ ] **Green:** Run setup and movement tests; verify the property test generates only legal paths and never makes any supply negative.
- [ ] **Optimize:** Extract `cellMultiplier()` and `isFinalCellAvailable()` so the movement validator and processor share one rule source.
- [ ] **Validate:** Run `vitest run src/games/cafe-queue/__tests__` and engine typecheck. Confirm an attempted action leaves a deep-equal input state intact on every rejected test.
- [ ] **Automate:** Add a seeded movement fixture for server/client tests and commit: `feat(town77): add cafe queue movement engine`.

### Task 3: Cup lifecycle, exact recipe completion, and upgrades

**Files:**
- Create: `packages/game-engine/src/games/cafe-queue/cups.ts`
- Create: `packages/game-engine/src/games/cafe-queue/orders.ts` (extend)
- Create: `packages/game-engine/src/games/cafe-queue/upgrades.ts`
- Test: `packages/game-engine/src/games/cafe-queue/__tests__/cups.test.ts`
- Test: `packages/game-engine/src/games/cafe-queue/__tests__/orders.test.ts` (extend)
- Test: `packages/game-engine/src/games/cafe-queue/__tests__/upgrades.test.ts`

**Interfaces:**
- Produces `pourIngredients`, `emptyCup`, `completeOrders`, and `activateUpgrade`.
- `completeOrders` returns `{ state, completedCount }`; `activateUpgrade` consumes exactly three completed orders.

- [ ] **Red:** Test that only newly collected ingredients can pour, filled cups cannot transfer ingredients, emptying returns all ingredients, exact multiset succeeds, extra/missing ingredients fail without mutation, multiple cups can complete multiple orders, specialty rewards clamp to finite rush supply, and one activation consumes three completed orders and persists.
- [ ] **Implement:** Represent a cup as an ingredient-count record. Track `collectedThisTurn` separately from cup contents. Compare recipes by all eight ingredient keys. Return completed cup ingredients to supply before moving its order to the completed pile.
- [ ] **Green:** Run cup/order/upgrade test files and ensure failed completion leaves the cup, order tabs, and supply unchanged.
- [ ] **Optimize:** Use one `sameRecipe(left, right)` helper and one `transferIntoSupply()` helper to avoid divergent count logic.
- [ ] **Validate:** Add fast-check coverage over random ingredient records to prove completion is true only for equal multisets; run full engine suite.
- [ ] **Automate:** Add coverage for all four upgrades and commit: `feat(town77): add cafe queue cups orders and upgrades`.

### Task 4: Queue aging, penalties, game end, scoring, and bot

**Files:**
- Create: `packages/game-engine/src/games/cafe-queue/turn.ts`
- Create: `packages/game-engine/src/games/cafe-queue/scoring.ts`
- Create: `packages/game-engine/src/games/cafe-queue/bot.ts`
- Test: `packages/game-engine/src/games/cafe-queue/__tests__/turn.test.ts`
- Test: `packages/game-engine/src/games/cafe-queue/__tests__/scoring.test.ts`
- Test: `packages/game-engine/src/games/cafe-queue/__tests__/bot.test.ts`

**Interfaces:**
- Produces `endCafeQueueTurn(state, playerId, completedThisTurn)`, `isCafeQueueGameOver(state)`, `calculateCafeQueueScores(state)`, and `findCafeQueueBotAction(state, playerId, rng)`.

- [ ] **Red:** Test left-player overload order, partial deck distribution, tabs 1->2->3->4, penalty conversion, penalty rush award, the two-player extra draw, deck-exhaustion end arm, five-penalty end arm, starting-player round boundary, all score tie-break levels, and a seeded bot action that passes validation.
- [ ] **Implement:** Move overload and aging into pure functions. Represent `closeArmed` separately from `phase: 'finished'`, then finish only when the documented round boundary is reached. Score with completed count, active upgrade count, penalty count, and rush-token tie-break.
- [ ] **Green:** Run focused turn/scoring/bot tests and a seeded simulation from setup through `finished`.
- [ ] **Optimize:** Add `assertCafeQueueInvariant(state)` for non-negative supply, no duplicate live order IDs, valid tab count, unique final meeple cells, and finite rush conservation.
- [ ] **Validate:** Run a property test that applies only bot-proposed actions and never violates the invariant; run the complete engine suite.
- [ ] **Automate:** Add a deterministic full-game engine fixture and commit: `feat(town77): complete cafe queue rule engine`.

### Task 5: Room persistence, Socket.IO routing, and private projections

**Files:**
- Modify: `packages/server/src/db/rooms.ts`
- Modify: `packages/server/src/handlers/create-room.ts`
- Modify: `packages/server/src/handlers/join-room.ts`
- Modify: `packages/server/src/handlers/start-game.ts`
- Create: `packages/server/src/handlers/cafe-queue-action.ts`
- Create: `packages/server/src/handlers/cafe-queue-start.ts`
- Modify: `packages/server/src/app.ts`
- Modify: `packages/server/src/state/projection.ts`
- Modify: `packages/shared-types/src/socket-events.ts`
- Test: `packages/server/src/__tests__/cafe-queue-create-start.test.ts`
- Test: `packages/server/src/__tests__/cafe-queue-actions.test.ts`
- Test: `packages/server/src/__tests__/cafe-queue-projection.test.ts`
- Test: `packages/server/src/__tests__/cafe-queue-recovery.test.ts`

**Interfaces:**
- Adds `gameId` to room creation and routes `cafe_queue_action` to the pure engine.
- Emits existing `room_joined`, `state_update`, `game_over`, and typed `error` events using the new state union.

- [ ] **Red:** Test Coffee Rush room creation, two-player join/start, host and turn authority, transaction rollback on invalid action, action persistence, reconnect after a fresh server presence registry, duplicate-tab safety, projection that hides deck order and opponents' cups, and per-player projected broadcasts.
- [ ] **Implement:** Keep the SQLite schema stable by storing the discriminated state JSON. Route `start_game` by `state.gameId`; add a single Coffee Rush action event with a typed payload. Use `runInTransaction` to load, process, update, then broadcast only after commit.
- [ ] **Green:** Run the four focused server test files with Node 20 and confirm state is readable after reopening the SQLite database.
- [ ] **Optimize:** Centralize module dispatch in `games/registry.ts`; convert unknown game/action/phase conditions into stable `INVALID_GAME_ACTION` errors rather than generic internal errors.
- [ ] **Validate:** Run server test suite and typecheck. Inspect emitted payloads to prove a non-owner's cup contents and deck sequence are absent.
- [ ] **Automate:** Extend rate-limit mutation events for `cafe_queue_action`, add server full-game fixture, and commit: `feat(town77): add authoritative cafe queue rooms`.

### Task 6: Client routes, store intents, and original game surfaces

**Files:**
- Modify: `packages/client/src/store/gameStore.ts`
- Modify: `packages/client/src/router.tsx`
- Modify: `packages/client/src/screens/HomeScreen.tsx`
- Create: `packages/client/src/screens/CafeQueueConfigScreen.tsx`
- Create: `packages/client/src/screens/CafeQueueGameScreen.tsx`
- Create: `packages/client/src/screens/CafeQueueResultsScreen.tsx`
- Create: `packages/client/src/components/cafe-queue/IngredientBoard.tsx`
- Create: `packages/client/src/components/cafe-queue/CupRack.tsx`
- Create: `packages/client/src/components/cafe-queue/OrderQueue.tsx`
- Create: `packages/client/src/components/cafe-queue/UpgradeRack.tsx`
- Create: `packages/client/src/components/cafe-queue/TurnActions.tsx`
- Test: `packages/client/src/__tests__/screens/CafeQueueConfigScreen.test.tsx`
- Test: `packages/client/src/__tests__/screens/CafeQueueGameScreen.test.tsx`
- Test: `packages/client/src/__tests__/components/cafe-queue/*.test.tsx`
- Test: `packages/client/src/__tests__/screens/cafe-queue-recovery.test.tsx`

**Interfaces:**
- Adds `sendCafeQueueAction(action: CafeQueueAction)` to the Zustand store.
- Adds `/cafe-queue/config`, `/cafe-queue/room/:code`, `/cafe-queue/game/:code`, and `/cafe-queue/results/:code` routes.

- [ ] **Red:** Test choosing Coffee Rush, creating a room with the placeholder deck, disabled actions before valid selections, legal path selection, cup allocation, exact-order completion affordance, end-turn emission, private-cup rendering, and reload recovery to the Coffee Rush route.
- [ ] **Implement:** Add original visual components that use Town77 tokens but no copied art or layouts. Render only the caller's cup contents; render opponents' public queue/score data. Send one typed action after explicit user confirmation, then wait for server state.
- [ ] **Green:** Run component and screen tests, verify the room route changes to the game route on start, and assert action payloads against the shared contract.
- [ ] **Optimize:** Memoize legal-path and available-order selectors in a dedicated `useCafeQueueSelectors` hook; avoid copying server state into component-local mutable state.
- [ ] **Validate:** Run client suite and typecheck. Check desktop and mobile rendering manually after local build, including empty, waiting, invalid-action, and completed-order states.
- [ ] **Automate:** Add route recovery to the existing `useRoomRecovery` coverage and commit: `feat(town77): add cafe queue client flow`.

### Task 7: Cross-layer full-game and restart validation

**Files:**
- Create: `packages/server/src/__tests__/cafe-queue-full-game.test.ts`
- Create: `packages/e2e/tests/cafe-queue-full-game.spec.ts`
- Create: `packages/e2e/tests/cafe-queue-reload.spec.ts`
- Modify: `packages/e2e/playwright.config.ts` if the server command needs explicit routing support

**Interfaces:**
- Consumes the placeholder deck and deterministic seed fixture from Tasks 1-4.
- Proves an end-to-end room transitions `lobby -> playing -> finished` without client authority.

- [ ] **Red:** Write a server integration test that creates a room, joins valid players, starts, applies a deterministic sequence through every core action, reloads/persists mid-game, finishes, and checks scores. Write Playwright tests that create/join/start, perform a legal visible action, reload a participant, and see the recovered state.
- [ ] **Implement:** Add only test fixtures and test helpers required to drive existing production handlers; do not add test-only bypass actions to the server.
- [ ] **Green:** Run focused server and Playwright tests against the real app server.
- [ ] **Optimize:** Make all fixture seeds and expected state snapshots explicit; remove timing sleeps in favour of authoritative state/URL assertions.
- [ ] **Validate:** Run engine, server, client, and E2E suites from clean processes. Reopen the test SQLite file after each full-game run and verify finished snapshots remain readable.
- [ ] **Automate:** Add a root `test:cafe-queue` script that runs focused engine/server/client/E2E checks and commit: `test(town77): automate cafe queue full game validation`.

### Task 8: Release gate and operational automation

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/*` only if a current CI workflow exists and needs the new root script
- Modify: `docs/coffee-rush-mechanics-extraction.md` only to link the original implementation modules; never add protected source material
- Test: existing CI command targets

**Interfaces:**
- Produces one repeatable quality gate: `pnpm test:cafe-queue`.

- [ ] **Red:** Add the aggregate script before its targeted commands exist; verify it fails at the missing task boundary.
- [ ] **Implement:** Wire engine, server, client, E2E, typecheck, and `git diff --check` into the aggregate command using Node 20-compatible commands.
- [ ] **Green:** Run `pnpm test:cafe-queue` after Tasks 1-7 and require a clean result.
- [ ] **Optimize:** Keep the targeted Coffee Rush suite separate from full repository tests so CI can diagnose failures quickly; do not add new runtime dependencies unless a test demonstrates they are required.
- [ ] **Validate:** Build the Fly image locally or remotely, deploy only after all quality gates pass, verify `/health`, create a real Coffee Rush room, and confirm the recipient projection via two separate sessions.
- [ ] **Automate:** Add the aggregate job to CI, commit: `chore(town77): automate cafe queue release gate`, push `main`, and record the deployed Fly image/version in the release handoff.

## Plan self-review

- Spec coverage: Tasks 1-4 cover all game mechanics; Task 5 covers persistence, authority, projection, and reconnect; Task 6 covers the client; Tasks 7-8 cover full-game/restart validation and release automation.
- Type consistency: `CafeQueueAction` is the single client-to-engine and client-to-server action union. `CafeQueueState` is the persisted and projected discriminator branch.
- Scope: The placeholder deck is explicitly replaceable and intentionally limited; a full card catalogue remains outside this plan.

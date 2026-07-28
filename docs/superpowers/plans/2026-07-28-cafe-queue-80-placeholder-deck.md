# Cafe Queue 80-card Placeholder Deck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a deterministic 80-card original placeholder deck and prove the three-player authoritative game reaches a persisted finished state.

**Architecture:** Keep the twelve existing recipe patterns as immutable seed data. Generate 80 cloned `CafeQueueOrder` values with stable sequential identifiers, then exercise the unchanged setup, turn, persistence, and scoring contracts using a deterministic server fixture.

**Tech Stack:** TypeScript, Vitest, Socket.IO, SQLite, game-engine, server.

## Global Constraints

- Keep all card names, art, layouts, and recipe data original placeholder data.
- Preserve the existing `CafeQueueOrder` contract and server authority.
- Do not change final-round semantics: deck exhaustion or five penalties arms the round boundary.
- Use Node 20 for local Vitest execution; run all commands through `rtk`.

---

### Task 1: Expand the deterministic deck factory

**Files:**
- Modify: `packages/game-engine/src/games/cafe-queue/orders.ts`
- Modify: `packages/game-engine/src/games/cafe-queue/__tests__/orders.test.ts`

**Interfaces:**
- Consumes: `CafeQueueOrder` from `@town77/shared-types`.
- Produces: `createPlaceholderOrders(): CafeQueueOrder[]` returning 80 unique cloned cards.

- [ ] **Step 1: Write the failing deck-size and identity tests**

```ts
it('creates eighty uniquely identified placeholder orders', () => {
  const orders = createPlaceholderOrders()
  expect(orders).toHaveLength(80)
  expect(new Set(orders.map((order) => order.id)).size).toBe(80)
})

it('does not share recipe objects between cards', () => {
  const orders = createPlaceholderOrders()
  orders[0]!.recipe.beans = 99
  expect(orders[12]!.recipe.beans).not.toBe(99)
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `rtk zsh -lc 'source /opt/homebrew/opt/nvm/nvm.sh && nvm exec 20 node ../../node_modules/vitest/vitest.mjs run src/games/cafe-queue/__tests__/orders.test.ts'` from `packages/game-engine`.

Expected: FAIL because the factory returns 12 cards.

- [ ] **Step 3: Implement the factory**

```ts
const PLACEHOLDER_ORDER_SEEDS = [/* existing twelve recipe patterns */] as const

export function createPlaceholderOrders(): CafeQueueOrder[] {
  return Array.from({ length: 80 }, (_, index) => {
    const seed = PLACEHOLDER_ORDER_SEEDS[index % PLACEHOLDER_ORDER_SEEDS.length]!
    return { id: `cafe-queue-${String(index + 1).padStart(2, '0')}`, recipe: { ...seed.recipe }, isSpecialty: seed.isSpecialty }
  })
}
```

- [ ] **Step 4: Run focused engine tests and type-check**

Run: `rtk zsh -lc 'source /opt/homebrew/opt/nvm/nvm.sh && nvm exec 20 node ../../node_modules/vitest/vitest.mjs run src/games/cafe-queue/__tests__/orders.test.ts && node ../../node_modules/typescript/bin/tsc --noEmit'` from `packages/game-engine`.

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add packages/game-engine/src/games/cafe-queue/orders.ts packages/game-engine/src/games/cafe-queue/__tests__/orders.test.ts
rtk git commit -m "feat(town77): expand cafe queue placeholder deck"
```

### Task 2: Prove three-player setup and final-round persistence

**Files:**
- Modify: `packages/game-engine/src/games/cafe-queue/__tests__/setup.test.ts`
- Modify: `packages/server/src/__tests__/cafe-queue-full-game.test.ts`

**Interfaces:**
- Consumes: `createCafeQueueState`, `startCafeQueueGame`, `endCafeQueueTurn`, and the Socket.IO room API.
- Produces: regression coverage for 73 cards after three-player setup and a persisted server-finished state.

- [ ] **Step 1: Write failing setup assertion**

```ts
it('leaves seventy-three cards after three-player setup', () => {
  const state = startCafeQueueGame(createCafeQueueState(DEFAULT_CAFE_QUEUE_CONFIG, PLAYERS, 8))
  expect(state.orderDeck).toHaveLength(73)
})
```

- [ ] **Step 2: Run the focused setup test to verify it fails before Task 1 is applied**

Run: `rtk zsh -lc 'source /opt/homebrew/opt/nvm/nvm.sh && nvm exec 20 node ../../node_modules/vitest/vitest.mjs run src/games/cafe-queue/__tests__/setup.test.ts'` from `packages/game-engine`.

Expected: FAIL with the current 5-card remainder; after Task 1 it passes.

- [ ] **Step 3: Add a server fixture that drives the final boundary**

```ts
server.db.prepare('UPDATE rooms SET state_json = ? WHERE code = ?').run(
  JSON.stringify({ ...stored, orderDeck: [] }),
  joined.code,
)
```

Use three connected clients. End the starter turn to arm closure, end each remaining player's turn, then end the starter's boundary turn. Assert `phase === 'finished'`, the persisted SQLite state is finished, and `game_over` contains all three player IDs.

- [ ] **Step 4: Run focused engine and server tests**

Run: `rtk zsh -lc 'source /opt/homebrew/opt/nvm/nvm.sh && nvm exec 20 node ../../node_modules/vitest/vitest.mjs run src/games/cafe-queue/__tests__/setup.test.ts'` from `packages/game-engine`.

Run: `rtk zsh -lc 'source /opt/homebrew/opt/nvm/nvm.sh && nvm exec 20 node ../../node_modules/vitest/vitest.mjs run src/__tests__/cafe-queue-full-game.test.ts'` from `packages/server`.

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
rtk git add packages/game-engine/src/games/cafe-queue/__tests__/setup.test.ts packages/server/src/__tests__/cafe-queue-full-game.test.ts
rtk git commit -m "test(town77): cover cafe queue deck completion"
```

### Task 3: Validate and publish

**Files:**
- Modify: no source files unless validation exposes a regression.

**Interfaces:**
- Consumes: completed Tasks 1 and 2.
- Produces: a pushed commit and a Fly deployment with a passing health check.

- [ ] **Step 1: Run relevant suites and type-checks**

```bash
rtk zsh -lc 'source /opt/homebrew/opt/nvm/nvm.sh && nvm exec 20 node ../../node_modules/vitest/vitest.mjs run' # packages/game-engine
rtk zsh -lc 'source /opt/homebrew/opt/nvm/nvm.sh && nvm exec 20 node ../../node_modules/vitest/vitest.mjs run' # packages/server
rtk zsh -lc 'node ../../node_modules/typescript/bin/tsc --noEmit' # each package
```

- [ ] **Step 2: Push and deploy**

```bash
rtk git push origin main
rtk fly deploy --app town77 --remote-only
```

- [ ] **Step 3: Validate production health**

```bash
rtk zsh -lc 'fly status --app town77 && curl --fail --silent --show-error https://town77.fly.dev/health'
```

Expected: started machine, passing health check, and `{"ok":true}`.

# Direct Entry Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let players create or join a multiplayer room directly from the Town77 home page.

**Architecture:** `HomeScreen` becomes the normal multiplayer entry surface. It uses the existing game store socket actions and `DEFAULT_GAME_CONFIG`, retaining `ConfigScreen` and `JoinScreen` only as direct-route compatibility surfaces. The existing `LobbyScreen` remains the authority for whether the host can start.

**Tech Stack:** React 18, TypeScript, Zustand, React Router, Vitest, Testing Library.

## Global Constraints

- Create uses `DEFAULT_GAME_CONFIG`, the `neobrutalism` theme ID, and `generateRandomName()`.
- Join is disabled until a non-empty room code is supplied.
- Room codes are trimmed and uppercased before joining.
- The host-only two-player Start Game gate remains unchanged.
- Do not remove `/config` or `/join` routes.

---

### Task 1: Cover direct home-page entry behavior

**Files:**
- Create: `packages/client/src/__tests__/screens/HomeScreen.test.tsx`
- Modify: `packages/client/src/__tests__/App.test.tsx`

**Interfaces:**
- Consumes: `HomeScreen`, `useGameStore(selector)`, `DEFAULT_GAME_CONFIG`.
- Produces: regression coverage for `createRoom(DEFAULT_GAME_CONFIG, 'neobrutalism', name)` and `joinRoom(code, name)`.

- [ ] **Step 1: Write the failing tests**

```tsx
it('creates a standard neobrutalism room directly from home', async () => {
  renderWithTheme(<HomeScreen />)
  await userEvent.click(screen.getByTestId('btn-create'))
  expect(createRoom).toHaveBeenCalledWith(DEFAULT_GAME_CONFIG, 'neobrutalism', expect.any(String))
})

it('enables joining only after a room code is entered', async () => {
  renderWithTheme(<HomeScreen />)
  expect(screen.getByTestId('btn-join-room')).toBeDisabled()
  await userEvent.type(screen.getByTestId('input-room-code'), 'abc123')
  expect(screen.getByTestId('btn-join-room')).not.toBeDisabled()
})

it('joins with an uppercased room code from home', async () => {
  renderWithTheme(<HomeScreen />)
  await userEvent.type(screen.getByTestId('input-room-code'), 'abc123')
  await userEvent.click(screen.getByTestId('btn-join-room'))
  expect(joinRoom).toHaveBeenCalledWith('ABC123', expect.any(String))
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node node_modules/vitest/vitest.mjs run packages/client/src/__tests__/screens/HomeScreen.test.tsx`

Expected: FAIL because the home screen does not yet expose the inline room-code form or call game-store create/join actions.

- [ ] **Step 3: Commit the failing test**

```bash
git add packages/client/src/__tests__/screens/HomeScreen.test.tsx packages/client/src/__tests__/App.test.tsx
git commit -m "test(town77): specify direct home entry flow"
```

### Task 2: Implement direct create and join from home

**Files:**
- Modify: `packages/client/src/screens/HomeScreen.tsx`
- Modify: `packages/client/src/__tests__/App.test.tsx`

**Interfaces:**
- Consumes: `DEFAULT_GAME_CONFIG` from `@town77/shared-types`, `generateRandomName()` from `../lib/randomName`, and `useGameStore` actions `createRoom(config, themeId, playerName)` and `joinRoom(code, playerName)`.
- Produces: a landing page with `btn-create`, `input-room-code`, and `btn-join-room` controls.

- [ ] **Step 1: Add direct-entry state and handlers**

```tsx
const createRoom = useGameStore((s) => s.createRoom)
const joinRoom = useGameStore((s) => s.joinRoom)
const [roomCode, setRoomCode] = useState('')

function handleCreate() {
  const playerName = generateRandomName()
  localStorage.setItem('playerName', playerName)
  createRoom(DEFAULT_GAME_CONFIG, 'neobrutalism', playerName)
}

function handleJoin() {
  const code = roomCode.trim().toUpperCase()
  if (!code) return
  const playerName = generateRandomName()
  localStorage.setItem('playerName', playerName)
  joinRoom(code, playerName)
  navigate(`/room/${code}`)
}
```

- [ ] **Step 2: Replace the old Join navigation button with the room-code form**

```tsx
<input
  data-testid="input-room-code"
  placeholder="ABC123"
  value={roomCode}
  onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
  maxLength={6}
/>
<button type="button" data-testid="btn-join-room" disabled={!roomCode.trim()} onClick={handleJoin}>
  {t('join')}
</button>
```

Keep the existing theme-aware visual style for the new input and button. Change `btn-create` to call `handleCreate` instead of navigating to `/config`.

- [ ] **Step 3: Update the obsolete app-level navigation assertion**

```tsx
it('keeps the home screen visible when create room is clicked', () => {
  window.history.pushState({}, '', '/')
  render(<App />)
  fireEvent.click(screen.getByTestId('btn-create'))
  expect(screen.getByTestId('home-screen')).toBeInTheDocument()
})
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node node_modules/vitest/vitest.mjs run packages/client/src/__tests__/screens/HomeScreen.test.tsx`

Expected: PASS.

- [ ] **Step 5: Run the affected app and lobby tests**

Run: `node node_modules/vitest/vitest.mjs run packages/client/src/__tests__/App.test.tsx packages/client/src/__tests__/screens/HomeScreen.test.tsx packages/client/src/__tests__/screens/LobbyScreen.test.tsx`

Expected: PASS, including the disabled one-player Start Game and enabled two-player Start Game cases.

- [ ] **Step 6: Typecheck and inspect the patch**

Run: `node node_modules/typescript/bin/tsc -p packages/client/tsconfig.json --noEmit && git diff --check`

Expected: zero TypeScript and whitespace errors.

- [ ] **Step 7: Commit the implementation**

```bash
git add packages/client/src/screens/HomeScreen.tsx packages/client/src/__tests__/screens/HomeScreen.test.tsx packages/client/src/__tests__/App.test.tsx
git commit -m "feat(town77): add direct create and join entry"
```

### Task 3: Rendered workflow QA

**Files:**
- No committed files.

**Interfaces:**
- Consumes: deployed or local Town77 app.
- Produces: visual and interaction proof of the entry controls.

- [ ] **Step 1: Open the home page and inspect the initial state**

Use the Browser plugin to verify the page has Create Game, an empty room-code input, and a disabled Join button. Confirm the page is not blank and its console has no relevant errors.

- [ ] **Step 2: Verify join activation without submitting**

Enter `abc123` into the room-code field and verify the Join button becomes enabled. Do not submit it against production.

- [ ] **Step 3: Verify direct create on a safe local environment**

Create a room locally and verify the host reaches `/room/:code` with Start Game disabled while alone. Join the room from a second local browser context and verify Start Game becomes enabled for the host.

- [ ] **Step 4: Record the results**

Report URL, viewport, console health, interaction results, and any remaining production-only risk. Do not deploy without explicit authorization.

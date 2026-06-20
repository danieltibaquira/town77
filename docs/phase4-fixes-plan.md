# Phase 4 Fixes & E2E Testing Strategy

**Date:** 2026-06-10  
**Status:** In Progress  
**Goal:** Fix runtime issues, improve UX, and establish robust E2E testing

---

## Critical Issues Identified

### 1. Network Access (High Priority)
**Problem:** Client only accessible on localhost, not from other devices on the network  
**Root Cause:** Vite dev server binds to `localhost` by default  
**Fix:** Update `vite.config.ts` to bind to `0.0.0.0`

### 2. Player Names Should Be Randomized (High Priority)
**Problem:** Users must enter their name, but should get a random name automatically  
**Root Cause:** Current UX requires manual name entry  
**Fix:** Generate random names on ConfigScreen and JoinScreen, allow override if desired

### 3. "Crear sala" Button Disabled (High Priority)
**Problem:** Button is disabled because player name field is empty  
**Root Cause:** Validation requires non-empty name, but user expects auto-filled name  
**Fix:** Auto-fill with random name, enable button by default

### 4. Responsive Layout (Medium Priority)
**Problem:** Whitespace on sides on larger screens  
**Root Cause:** `maxWidth: 560px` on ConfigScreen creates fixed-width container  
**Fix:** Make layout responsive - full width on mobile, max-width on desktop with better scaling

### 5. Chip Distribution Question (Low Priority)
**Problem:** User questions if 7×7×1=49 chips is correct for 7×7 grid  
**Analysis:** 
- Current: 7 colors × 7 shapes × 1 copy = 49 chips (perfect for 49 cells)
- Qwirkle: 6 colors × 6 shapes × 3 copies = 108 tiles (unlimited grid)
- For Town 77's 7×7 grid, 49 chips is mathematically correct
- **Decision:** Keep current distribution, add documentation explaining the math

### 6. E2E Testing Missing (High Priority)
**Problem:** No browser automation tests, runtime bugs not caught  
**Fix:** Set up Playwright with comprehensive test flows

---

## Implementation Plan

### Wave 1: Network & Runtime Fixes (Tasks 1-2)

#### Task 1: Enable Network Access (TDD)
**Files:**
- Modify: `packages/client/vite.config.ts`
- Test: Manual verification from another device

**Implementation:**
```typescript
// packages/client/vite.config.ts
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    host: '0.0.0.0',  // Add this line
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
})
```

**Verification:**
```bash
# Restart client
cd packages/client && pnpm dev

# From another device on the network, access:
# http://<your-mac-ip>:5173
# Find your IP: ifconfig | grep "inet " | grep -v 127.0.0.1
```

---

#### Task 2: Randomized Player Names (TDD)
**Files:**
- Modify: `packages/client/src/screens/ConfigScreen.tsx`
- Modify: `packages/client/src/screens/JoinScreen.tsx`
- Create: `packages/client/src/lib/randomName.ts`
- Create: `packages/client/src/__tests__/randomName.test.ts`

**Implementation:**

```typescript
// packages/client/src/lib/randomName.ts
const ADJECTIVES = [
  'Valiente', 'Astuto', 'Rápido', 'Sabio', 'Audaz',
  'Brillante', 'Creativo', 'Dinámico', 'Épico', 'Feroz'
]

const NOUNS = [
  'Constructor', 'Arquitecto', 'Diseñador', 'Maestro', 'Explorador',
  'Pionero', 'Estratega', 'Campeón', 'Líder', 'Visionario'
]

export function generateRandomName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(Math.random() * 100)
  return `${adj} ${noun} ${num}`
}
```

```typescript
// packages/client/src/__tests__/randomName.test.ts
import { describe, it, expect } from 'vitest'
import { generateRandomName } from '../lib/randomName'

describe('generateRandomName', () => {
  it('returns a non-empty string', () => {
    const name = generateRandomName()
    expect(name.length).toBeGreaterThan(0)
  })

  it('includes a number', () => {
    const name = generateRandomName()
    expect(/\d+/.test(name)).toBe(true)
  })

  it('generates different names', () => {
    const names = new Set(Array.from({ length: 10 }, () => generateRandomName()))
    expect(names.size).toBeGreaterThan(5) // Most should be unique
  })
})
```

**ConfigScreen Changes:**
```typescript
// Add to imports
import { generateRandomName } from '../lib/randomName'

// Change initial state
const [playerName, setPlayerName] = useState(generateRandomName())

// Make input optional (allow clearing)
<input
  data-testid="input-player-name"
  placeholder={t('your_name')}
  value={playerName}
  onChange={(e) => setPlayerName(e.target.value)}
  style={inputStyle}
/>

// Enable button if name is non-empty OR use random fallback
const canCreate = playerName.trim().length > 0
```

**JoinScreen Changes:**
```typescript
// Add to imports
import { generateRandomName } from '../lib/randomName'

// Change initial state
const [playerName, setPlayerName] = useState(generateRandomName())
```

**i18n Additions:**
```json
// packages/client/src/locales/es/common.json
{
  "your_name": "Tu nombre (opcional)"
}

// packages/client/src/locales/en/common.json
{
  "your_name": "Your name (optional)"
}
```

---

### Wave 2: Responsive Layout (Tasks 3-4)

#### Task 3: Responsive ConfigScreen Layout (TDD)
**Files:**
- Modify: `packages/client/src/screens/ConfigScreen.tsx`
- Modify: `packages/client/src/__tests__/screens/ConfigScreen.test.tsx`

**Implementation:**
```typescript
// Change the main container style
<main
  data-testid="config-screen"
  style={{
    background: 'var(--color-surface-bg)',
    color: 'var(--color-text-primary)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-lg)',
    margin: '0 auto',
    maxWidth: 560,
    minHeight: '100vh',
    padding: 'var(--space-md)', // Reduced from xl
    // Add responsive padding
    '@media (min-width: 768px)': {
      padding: 'var(--space-xl)',
    },
  }}
>
```

**Note:** Inline styles don't support media queries directly. Options:
1. Use CSS modules with media queries
2. Use a CSS-in-JS library
3. Keep inline styles but use fluid values with `clamp()`

**Recommended:** Use fluid values with `clamp()`:
```typescript
padding: 'clamp(var(--space-md), 5vw, var(--space-xl))',
```

---

#### Task 4: Responsive Grid Layout (TDD)
**Files:**
- Modify: `packages/client/src/styles/tokens.css`

**Implementation:**
```css
/* Update layout tokens for better responsiveness */
:root {
  /* ... existing tokens ... */
  
  /* Make cell size more responsive */
  --layout-cell: clamp(32px, 6vw, 64px); /* Reduced from 40px-72px */
  
  /* Add container padding */
  --container-padding: clamp(8px, 3vw, 24px);
}
```

---

### Wave 3: E2E Testing Setup (Tasks 5-8)

#### Task 5: Install Playwright (TDD)
**Files:**
- Modify: `package.json` (root)
- Create: `packages/e2e/package.json`
- Create: `packages/e2e/playwright.config.ts`
- Create: `packages/e2e/.gitignore`

**Implementation:**

```bash
# Install Playwright
pnpm add -Dw @playwright/test
npx playwright install chromium
```

```json
// packages/e2e/package.json
{
  "name": "@town77/e2e",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```

```typescript
// packages/e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: [
    {
      command: 'cd ../server && pnpm dev',
      url: 'http://localhost:3001/health',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../client && pnpm dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
})
```

---

#### Task 6: Home Screen E2E Test (TDD)
**Files:**
- Create: `packages/e2e/tests/home.spec.ts`

**Implementation:**
```typescript
// packages/e2e/tests/home.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Home Screen', () => {
  test('displays game title', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Town 77' })).toBeVisible()
  })

  test('has create room button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('btn-create')).toBeVisible()
    await expect(page.getByTestId('btn-create')).toHaveText('Crear sala')
  })

  test('has join button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('btn-join')).toBeVisible()
    await expect(page.getByTestId('btn-join')).toHaveText('Unirse')
  })

  test('navigates to config screen on create click', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('btn-create').click()
    await expect(page).toHaveURL(/\/config/)
    await expect(page.getByTestId('config-screen')).toBeVisible()
  })

  test('navigates to join screen on join click', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('btn-join').click()
    await expect(page).toHaveURL(/\/join/)
    await expect(page.getByTestId('join-screen')).toBeVisible()
  })
})
```

---

#### Task 7: Room Creation E2E Test (TDD)
**Files:**
- Create: `packages/e2e/tests/room-creation.spec.ts`

**Implementation:**
```typescript
// packages/e2e/tests/room-creation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Room Creation Flow', () => {
  test('creates a room with default settings', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('btn-create').click()
    
    // Wait for config screen
    await expect(page.getByTestId('config-screen')).toBeVisible()
    
    // Verify random name is pre-filled
    const nameInput = page.getByTestId('input-player-name')
    await expect(nameInput).not.toHaveValue('')
    
    // Verify default settings
    await expect(page.getByTestId('config-grid')).toContainText('7')
    await expect(page.getByTestId('config-colors')).toContainText('7')
    await expect(page.getByTestId('config-shapes')).toContainText('7')
    await expect(page.getByTestId('config-copies')).toContainText('1')
    await expect(page.getByTestId('config-hand-size')).toContainText('4')
    
    // Verify totals
    await expect(page.getByTestId('config-total-chips')).toContainText('49')
    await expect(page.getByTestId('config-board-cells')).toContainText('49')
    
    // Create room button should be enabled
    await expect(page.getByTestId('btn-create-room')).toBeEnabled()
    
    // Click create
    await page.getByTestId('btn-create-room').click()
    
    // Should navigate to lobby
    await expect(page).toHaveURL(/\/room\//)
    await expect(page.getByTestId('lobby-screen')).toBeVisible()
    
    // Should display room code
    const roomCode = page.getByTestId('room-code')
    await expect(roomCode).toBeVisible()
    const code = await roomCode.textContent()
    expect(code).toMatch(/^[A-Z0-9]{6}$/)
  })

  test('can change game settings', async ({ page }) => {
    await page.goto('/config')
    
    // Click "Rápido 5×5" preset
    await page.getByTestId('preset-fast').click()
    
    // Verify settings changed
    await expect(page.getByTestId('config-grid')).toContainText('5')
    await expect(page.getByTestId('config-colors')).toContainText('5')
    await expect(page.getByTestId('config-shapes')).toContainText('5')
    await expect(page.getByTestId('config-board-cells')).toContainText('25')
  })

  test('shows warning when chips < cells', async ({ page }) => {
    await page.goto('/config')
    
    // Increase grid to 9×9
    const gridInc = page.getByTestId('config-grid').getByTestId('stepper-inc')
    await gridInc.click()
    await gridInc.click()
    
    // Should show warning
    await expect(page.getByTestId('config-warning')).toBeVisible()
  })
})
```

---

#### Task 8: Multiplayer E2E Test (TDD)
**Files:**
- Create: `packages/e2e/tests/multiplayer.spec.ts`

**Implementation:**
```typescript
// packages/e2e/tests/multiplayer.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Multiplayer Game Flow', () => {
  test('two players can join and start a game', async ({ browser }) => {
    // Player 1 creates room
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    await page1.goto('/')
    await page1.getByTestId('btn-create').click()
    await page1.getByTestId('btn-create-room').click()
    
    await expect(page1.getByTestId('lobby-screen')).toBeVisible()
    const roomCode = await page1.getByTestId('room-code').textContent()
    
    // Player 2 joins room
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()
    await page2.goto('/')
    await page2.getByTestId('btn-join').click()
    
    await page2.getByTestId('input-room-code').fill(roomCode!)
    await page2.getByTestId('btn-join-room').click()
    
    await expect(page2.getByTestId('lobby-screen')).toBeVisible()
    
    // Both players should see each other in lobby
    await expect(page1.getByTestId('player-badge')).toHaveCount(2)
    await expect(page2.getByTestId('player-badge')).toHaveCount(2)
    
    // Player 1 (host) starts game
    await page1.getByTestId('btn-start-game').click()
    
    // Both players should be in game screen
    await expect(page1.getByTestId('game-screen')).toBeVisible()
    await expect(page2.getByTestId('game-screen')).toBeVisible()
    
    // Both should see the grid
    await expect(page1.getByTestId('grid')).toBeVisible()
    await expect(page2.getByTestId('grid')).toBeVisible()
    
    await context1.close()
    await context2.close()
  })

  test('player can place a chip', async ({ browser }) => {
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()
    
    // Create and join room
    await page1.goto('/config')
    await page1.getByTestId('btn-create-room').click()
    const roomCode = await page1.getByTestId('room-code').textContent()
    
    await page2.goto('/join')
    await page2.getByTestId('input-room-code').fill(roomCode!)
    await page2.getByTestId('btn-join-room').click()
    
    await page1.getByTestId('btn-start-game').click()
    
    // Wait for game to start
    await expect(page1.getByTestId('game-screen')).toBeVisible()
    
    // Player 1 should have chips in hand
    await expect(page1.getByTestId('hand')).toBeVisible()
    const chips = page1.getByTestId('hand').getByRole('button')
    await expect(chips.first()).toBeVisible()
    
    // Click a chip to select it
    await chips.first().click()
    
    // Valid cells should be highlighted
    const validCells = page1.locator('[data-testid^="cell-"][data-valid="true"]')
    await expect(validCells.first()).toBeVisible()
    
    // Click a valid cell to place
    await validCells.first().click()
    
    // Chip should appear on grid
    const placedChip = page1.locator('[data-testid^="chip-"]').first()
    await expect(placedChip).toBeVisible()
    
    await context1.close()
    await context2.close()
  })
})
```

---

## E2E Testing Strategy

### Test Coverage Matrix

| Flow | Test Type | Priority | Status |
|------|-----------|----------|--------|
| Home Screen | Unit + E2E | High | ✅ Unit, ⏳ E2E |
| Room Creation | Unit + E2E | High | ✅ Unit, ⏳ E2E |
| Room Joining | Unit + E2E | High | ✅ Unit, ⏳ E2E |
| Lobby Display | Unit + E2E | High | ✅ Unit, ⏳ E2E |
| Game Start | Unit + E2E | High | ✅ Unit, ⏳ E2E |
| Chip Placement | Unit + E2E | High | ✅ Unit, ⏳ E2E |
| Turn Rotation | Unit + E2E | Medium | ✅ Unit, ⏳ E2E |
| Exchange/Discard | Unit + E2E | Medium | ✅ Unit, ⏳ E2E |
| Game Over | Unit + E2E | High | ✅ Unit, ⏳ E2E |
| Results Display | Unit + E2E | High | ✅ Unit, ⏳ E2E |
| Session Recovery | Unit + E2E | Medium | ✅ Unit, ⏳ E2E |
| Disconnection | E2E Only | Medium | ⏳ E2E |
| Mobile Responsive | E2E Only | Medium | ⏳ E2E |

### E2E Test Categories

1. **Happy Path Tests** (Priority: High)
   - Complete game flow from creation to results
   - All core interactions working end-to-end
   - Multiplayer synchronization

2. **Error Handling Tests** (Priority: High)
   - Invalid room codes
   - Disconnection and reconnection
   - Invalid moves (should show toast)
   - Network failures

3. **Responsive Tests** (Priority: Medium)
   - Mobile viewport (375px)
   - Tablet viewport (768px)
   - Desktop viewport (1920px)
   - Touch interactions on mobile

4. **Performance Tests** (Priority: Low)
   - Page load time < 2s
   - WebSocket connection < 500ms
   - Chip placement animation < 300ms

### Test Execution Strategy

```bash
# Run all E2E tests
cd packages/e2e && pnpm test

# Run with UI mode (interactive)
cd packages/e2e && pnpm test:ui

# Run specific test file
cd packages/e2e && pnpm test tests/multiplayer.spec.ts

# Run on mobile device
cd packages/e2e && pnpm test --project="Mobile Chrome"

# Generate HTML report
cd packages/e2e && pnpm test --reporter=html
```

### CI/CD Integration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      
      - name: Build packages
        run: pnpm build
      
      - name: Run E2E tests
        run: cd packages/e2e && pnpm test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: packages/e2e/playwright-report/
```

---

## Execution Order

```
Wave 1 (Tasks 1-2): Network + Random Names
  └─ Immediate runtime fixes

Wave 2 (Tasks 3-4): Responsive Layout
  └─ Better screen adaptation

Wave 3 (Tasks 5-8): E2E Testing
  └─ Playwright setup + core test flows
```

---

## Risk Notes

1. **Network Access** — Binding to `0.0.0.0` exposes the dev server to the local network. This is fine for development but never use in production.

2. **Random Names** — Users might want to change their name. Make the input field editable but pre-filled.

3. **E2E Test Flakiness** — WebSocket timing can cause flaky tests. Use `waitFor` and generous timeouts.

4. **Playwright Installation** — First run downloads browsers (~200MB). Consider caching in CI.

5. **Responsive Layout** — Inline styles have limitations. Consider migrating to CSS modules for complex responsive behavior.

---

## Next Steps

After these fixes:
1. Verify network access from mobile devices
2. Run E2E tests to catch runtime bugs
3. Test on multiple screen sizes
4. Document the E2E testing workflow for the team

---

## Related: Code Review Remediation (2026-06-15)

See [`code-review-fixes.md`](code-review-fixes.md) — a symlink to the TaskForge tracker for the 42-finding Claude Code code review, reduced to 3 priority-batched tasks (P0, P1, P2). P0#2 (hook violation in `GameScreen.tsx`) was completed 2026-06-15.

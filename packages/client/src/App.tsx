import type { Theme } from '@town77/shared-types'
import { Suspense, useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { BrowserRouter } from 'react-router-dom'
import { useGameConnection } from './hooks/useGameConnection'
import i18n from './lib/i18n'
import { ThemeContext, injectTokens } from './lib/theme'
import { AppRouter } from './router'
import './styles/reset.css'
import './styles/tokens.css'
import './styles/animations.css'
import { getThemeById } from './themes'

function GameConnectionProvider({ children }: { children: React.ReactNode }) {
  useGameConnection()
  return <>{children}</>
}

export function App() {
  const [theme, setTheme] = useState(() => getThemeById('town77'))

  useEffect(() => {
    injectTokens(theme)
  }, [theme])

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <GameConnectionProvider>
            <Suspense
              fallback={
                <div style={{ background: 'var(--color-surface-bg)', minHeight: '100vh' }} />
              }
            >
              <AppRouter />
            </Suspense>
          </GameConnectionProvider>
        </BrowserRouter>
      </ThemeContext.Provider>
    </I18nextProvider>
  )
}

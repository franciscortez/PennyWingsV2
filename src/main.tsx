import { StrictMode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import '@/mobile.css'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist/wght-italic.css'
import '@fontsource-variable/geist-mono'
import App from '@/App'
import ErrorBoundary from '@/components/ErrorBoundary'
import { queryClient } from '@/lib/queryClient'
import { applyTheme, getInitialTheme } from '@/lib/theme'
import { registerPwa } from '@/lib/pwa'

applyTheme(getInitialTheme())
registerPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from '@/App'
import ErrorBoundary from '@/components/ErrorBoundary'
import { queryClient } from '@/lib/queryClient'
import { applyTheme, getInitialTheme } from '@/lib/theme'

applyTheme(getInitialTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)

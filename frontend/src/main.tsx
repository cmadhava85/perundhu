import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import './utils/browserCompat.css' // Import browser compatibility fixes
import App from './App'
import './i18n.ts' // Import i18n configuration
import { queryClient } from './lib/queryClient'
import { initializeSecurity } from './utils/reactSecurity'

// Initialize security measures (disabled in development for debugging)
initializeSecurity();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)

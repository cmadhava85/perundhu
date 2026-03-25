import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './utils/browserCompat.css' // Import browser compatibility fixes
import App from './App'
import './i18n.ts' // Import i18n configuration
import { queryClient } from './lib/queryClient'
import { initializeSecurity } from './utils/reactSecurity'
import { ToastProvider } from './components/design-system/Toast'
import { registerServiceWorker, setupInstallPrompt } from './utils/pwaUtils'

// Initialize security measures (disabled in development for debugging)
initializeSecurity();

// Register service worker for PWA support
registerServiceWorker();

// Setup install prompt for app installation
setupInstallPrompt();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <App />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </ToastProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
)

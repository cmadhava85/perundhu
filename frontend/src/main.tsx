import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './utils/browserCompat.css' // Import browser compatibility fixes
import App from './App.tsx'
import './i18n.ts' // Import i18n configuration

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

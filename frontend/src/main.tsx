import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/reset.css' // Import reset CSS first
import './styles/responsive-layout.css' // Import responsive layout utilities
import './styles/media-queries.css' // Import global media queries
import './index.css'
import './utils/browserCompat.css' // Import browser compatibility fixes
import App from './App'
import './i18n.ts' // Import i18n configuration

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

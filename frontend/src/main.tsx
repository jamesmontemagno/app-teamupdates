import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { App } from './App'
import { UserProfileProvider } from './contexts/UserProfileContext'
import { initializeTelemetry } from './telemetry'
import { isMockMode } from './api'

// Initialize OpenTelemetry before React renders
// Skip in mock mode to avoid noise
if (!isMockMode()) {
  initializeTelemetry();
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename="/app-teamupdates">
    <UserProfileProvider>
      <App />
    </UserProfileProvider>
  </BrowserRouter>,
)

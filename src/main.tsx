import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { App } from './App'
import { UpdatesProvider } from './contexts/UpdatesContext'
import { UserProfileProvider } from './contexts/UserProfileContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/app-teamupdates">
      <UserProfileProvider>
        <UpdatesProvider>
          <App />
        </UpdatesProvider>
      </UserProfileProvider>
    </BrowserRouter>
  </StrictMode>,
)

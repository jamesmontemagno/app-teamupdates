import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { App } from './App'
import { UserProfileProvider } from './contexts/UserProfileContext'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename="/app-teamupdates">
    <UserProfileProvider>
      <App />
    </UserProfileProvider>
  </BrowserRouter>,
)

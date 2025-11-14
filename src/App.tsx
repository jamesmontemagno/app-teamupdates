import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MapPage } from './pages/MapPage'
import { ProfilePage } from './pages/ProfilePage'
import { TimelinePage } from './pages/TimelinePage'
import { isNewUser, markUserOnboarded } from './contexts/UserProfileContext'

export function App() {
  const navigate = useNavigate()
  const [showWelcome, setShowWelcome] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    if (isNewUser()) {
      setShowWelcome(true)
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')

  const handleGetStarted = () => {
    markUserOnboarded()
    setShowWelcome(false)
    navigate('/profile')
  }

  const handleSkip = () => {
    markUserOnboarded()
    setShowWelcome(false)
  }

  return (
    <>
      {showWelcome && (
        <div className="modal-overlay" onClick={handleSkip}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Welcome to Pulseboard! ✨</h2>
            <p className="modal-text">
              Stay connected with your team by sharing updates, wins, and blockers.
            </p>
            <p className="modal-text">
              Before you get started, let's set up your profile so your team knows who you are.
            </p>
            <div className="modal-actions">
              <button className="button button--primary" onClick={handleGetStarted}>
                Set Up Profile
              </button>
              <button className="button button--soft" onClick={handleSkip}>
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__branding">
          <p className="text text--muted">Team Updates</p>
          <h1 className="app-shell__title">✨ Pulseboard</h1>
        </div>
        <nav className="app-shell__nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'app-shell__link app-shell__link--active' : 'app-shell__link')}>
            Timeline
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => (isActive ? 'app-shell__link app-shell__link--active' : 'app-shell__link')}>
            Map
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? 'app-shell__link app-shell__link--active' : 'app-shell__link')}>
            Profile
          </NavLink>
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </nav>
      </header>

      <main className="app-shell__content">
        <Routes>
          <Route path="/" element={<TimelinePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
    </div>
    </>
  )
}

import { NavLink, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MapPage } from './pages/MapPage'
import { ProfilePage } from './pages/ProfilePage'
import { TimelinePage } from './pages/TimelinePage'

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')

  return (
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
  )
}
